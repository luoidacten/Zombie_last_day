// ============================================================================
// 14-hub.js — KHU SỐNG SÓT (map 16): trại nghỉ giữa hai chiến dịch.
// Hoàn thành một map -> về trại. Ở đây đi lại tự do, hồi máu dần bên lửa trại, bước vào
//   🛒 QUẦY TIẾP TẾ   để mua đồ,
//   🗺 BÀN CHIẾN DỊCH để chọn điểm đến và bấm BẮT ĐẦU CHIẾN DỊCH.
// Thay cho màn "cửa hàng + chọn tuyến" gộp chung trước đây.
// ============================================================================
const HUB = { x: 2000, y: 2000, r: 100, shop: { x: 1660, y: 1880 }, board: { x: 2340, y: 1880 }, fire: { x: 2000, y: 2130 } };
let hub = { armed: true, panel: null };

function enterHub() {
    colonyArrive();   // người được giải cứu về căn cứ, thợ nộp vật liệu (18-colony.js) — trước khi dọn rescueNPCs
    for (let id of ['menu', 'routeShop', 'upgradeScreen', 'netWait']) document.getElementById(id).style.display = 'none';
    gameState = 'PLAYING'; initControls(); clearPcInputs();
    storyLevelReset();
    zombies = []; bullets = []; enemyBullets = []; slashes = []; thrownItems = []; drops = []; particles = []; vfxList = []; airdropMarkers = []; fireZones = [];
    decals = []; ashZones = []; rescueNPCs = []; hazards = []; towers = []; missionItems = []; outposts = []; bushes = []; slowZones = []; powerCoils = []; lightFlowers = []; drones = [];
    caveProps = []; hangZRun.stairs = null; evacZone = null; heliSupport.active = false; tank.active = false; turretMode.active = false; GROUND_DOTS.length = 0;
    currentMapType = 16; currentWeather = 1; bgMapColor = '#2f3b2c'; flashAlpha = 0; cameraShake = 0;
    objState = 'HUB'; mission = { type: 'HUB', progress: 0, required: 0, complete: true };
    shopOpenedForLevel = currentLevel;
    nextRoute = 'balanced'; nextMapPreference = null; nextMissionPreference = null;   // mỗi lần về trại bắt đầu lại từ tuyến An Toàn

    // Hàng rào quanh trại + lều
    buildCamp(false);   // hàng rào, lều (15-ops.js)
    if (false) {
    const wall = (x, y, w, h) => obstacles.push({ type: 'wall', x, y, w, h });
    wall(1300, 1450, 1400, 36); wall(1300, 2514, 1400, 36); wall(1300, 1450, 36, 1100); wall(2664, 1450, 36, 1100);
    for (let t of [[1420, 1560], [1760, 1540], [2100, 1540], [2440, 1560], [1420, 2300], [2440, 2300]]) obstacles.push({ type: 'building', x: t[0], y: t[1], w: 150, h: 120 });
    for (let t of [[1380, 2020], [2560, 2040], [1900, 2400], [2140, 2420]]) obstacles.push({ type: 'tree', x: t[0], y: t[1], w: 70, h: 70 });
    for (let i = 0; i < 500; i++) GROUND_DOTS.push({ x: 1300 + Math.random() * 1400, y: 1450 + Math.random() * 1100, r: Math.random() * 2.5 + 0.5 });
    }

    players.forEach((p, i) => {
        if (p.isDowned) { p.isDowned = false; p.hp = Math.max(1, p.maxHp * 0.3); }   // đồng đội gục được đưa về trại
        p.x = HUB.x + (players.length > 1 ? (i ? 40 : -40) : 0); p.y = HUB.y + 30; p.status = {}; p.stunTimer = 0; p.netTimer = 0; p.pullingPin = false; p.chargeTime = 0;
    });
    allies = allies.filter(a => a.hp > 0); allies.forEach((a, i) => { a.x = HUB.x + (i % 2 ? 90 : -90); a.y = HUB.y + 90; });
    hub = { armed: false, panel: null };   // phải bước ra khỏi vòng rồi bước vào lại mới mở bảng
    navRebuild(); navFlood([{ x: HUB.x, y: HUB.y }], NAV.field); NAV.reach.length = 0;
    for (let i = 0; i < NAV.field.length; i++) if (NAV.field[i] >= 2) NAV.reach.push(i);
    mapIntro = { timer: 4.0, map: 'Khu Sống Sót', mission: 'Nghỉ ngơi · mua tiếp tế · chọn chiến dịch', weather: `⚙ ${shopScrap} phế liệu · 🏘 ${base.pop | 0} cư dân · 🧱 ${base.mat | 0} vật liệu` };
    saveCheckpoint(true);
    updateCamera(0, true);
    Sound.play('heal');
    if (NET.mode === 'host') { netSendMap(); netSendSync(); }
    runMainLoop();
}

// Vòng cập nhật riêng của trại: không quái, không đói, hồi máu dần
function updateHub(dt) {
    syncPcControls();
    for (let p of players) {
        p.update(dt);
        p.hunger = Math.max(p.hunger, 60);
        if (!p.isDowned && p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + p.maxHp * (Math.hypot(p.x - HUB.fire.x, p.y - HUB.fire.y) < 170 ? 0.08 : 0.02) * dt);
    }
    for (let a of allies) a.update(dt);
    for (let i = bullets.length - 1; i >= 0; i--) { let b = bullets[i]; if (b.active) b.update(dt); if (!b.active) bullets.splice(i, 1); }
    for (let i = thrownItems.length - 1; i >= 0; i--) { thrownItems[i].update(dt); if (!thrownItems[i].active) thrownItems.splice(i, 1); }
    for (let i = slashes.length - 1; i >= 0; i--) { let o = players.find(p => p === slashes[i].source); if (o) slashes[i].update(dt, o.x, o.y); else slashes[i].active = false; if (!slashes[i].active) slashes.splice(i, 1); }
    hazards.length = 0; fireZones.length = 0;
    if (Math.random() < dt * 14) createParticles(HUB.fire.x + (Math.random() - 0.5) * 14, HUB.fire.y - 6, Math.random() < 0.5 ? '#e67e22' : '#f9ca24', 1, 40);

    // Bước vào vòng của quầy / bàn chiến dịch để mở bảng
    const inZone = (s) => players.some(p => !p.isDowned && Math.hypot(p.x - s.x, p.y - s.y) < HUB.r);
    let zs = inZone(HUB.shop), zb = inZone(HUB.board), zw = inZone(BASE.shopBase);
    if (!zs && !zb && !zw) hub.armed = true;
    else if (hub.armed) { hub.armed = false; openHubPanel(zs ? 'shop' : (zb ? 'map' : 'base')); return; }

    updateFx(dt); updateCamera(dt); draw(); updateLoopSounds(dt); netHostTick(dt);
}

function openHubPanel(kind) {
    hub.panel = kind;
    gameState = 'SHOP'; clearPcInputs();
    let shop = kind === 'shop';
    document.getElementById('hubMapSec').style.display = kind === 'map' ? 'block' : 'none';
    document.getElementById('hubShopSec').style.display = shop ? 'block' : 'none';
    document.getElementById('hubBaseSec').style.display = kind === 'base' ? 'block' : 'none';
    document.getElementById('hubGoBtn').style.display = kind === 'map' ? 'block' : 'none';
    document.getElementById('routeShop').style.display = 'flex';
    document.getElementById('routeShop').scrollTop = 0;
    Sound.play('select');
    updateRouteShopUI();
    netSendSync();
}
function closeHubPanel() {
    document.getElementById('routeShop').style.display = 'none';
    hub.panel = null; hub.armed = false;
    Sound.play('select');
    if (objState !== 'HUB') return;
    gameState = 'PLAYING';
    if (NET.mode === 'host') netSendMap();   // khách đang ở màn chờ: gửi lại map trại để họ chơi tiếp
    runMainLoop();
}
// Phần mô tả tuyến đang chọn (thẻ tuyến chỉ còn tên cho gọn)
function hubRouteDetail() {
    let box = document.getElementById('routeDetail'), def = ROUTE_DEFS[nextRoute], el = def && document.getElementById(def.el);
    if (!box || !el) return;
    let h = el.querySelector('h3'), p = el.querySelector('p');
    box.innerHTML = `<b class="text-emerald-300">▶ ${h ? h.textContent.replace(/\s+/g, ' ').trim() : ''}</b><br>${p ? p.innerHTML : ''}`;
}
window.addEventListener('keydown', e => { if (e.code === 'Escape' && gameState === 'SHOP' && hub.panel) closeHubPanel(); });

// ---------------------------------------------------------------------------
// VẼ
// ---------------------------------------------------------------------------
function drawHub(T) {
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    // Nền trại + lối đi
    ctx.fillStyle = '#3b4a36'; ctx.fillRect(1336, 1486, 1328, 1028);
    ctx.fillStyle = 'rgba(194, 178, 128, 0.22)'; ctx.fillRect(1560, 1840, 880, 90); ctx.fillRect(1955, 1840, 90, 380);
    const station = (s, col, icon, title, sub) => {
        let pulse = 6 * Math.sin(T * 4);
        ctx.beginPath(); ctx.arc(s.x, s.y, HUB.r, 0, Math.PI * 2); ctx.fillStyle = `rgba(${col}, 0.13)`; ctx.fill();
        ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(T * 0.5); ctx.setLineDash([22, 14]); ctx.beginPath(); ctx.arc(0, 0, HUB.r + pulse * 0.4, 0, Math.PI * 2); ctx.strokeStyle = `rgba(${col}, 0.9)`; ctx.lineWidth = 4; ctx.stroke(); ctx.setLineDash([]); ctx.restore();
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(s.x - 50, s.y - 30, 108, 62);
        ctx.fillStyle = '#5d4037'; ctx.fillRect(s.x - 54, s.y - 34, 108, 62); ctx.strokeStyle = '#2d1b12'; ctx.lineWidth = 3; ctx.strokeRect(s.x - 54, s.y - 34, 108, 62);
        ctx.fillStyle = `rgb(${col})`; ctx.fillRect(s.x - 60, s.y - 52, 120, 22); ctx.strokeRect(s.x - 60, s.y - 52, 120, 22);   // mái bạt
        ctx.font = '34px Arial'; ctx.fillStyle = '#fff'; ctx.fillText(icon, s.x, s.y + 2);
        outlinedText(title, s.x, s.y - 74, `rgb(${col})`, 'bold 15px Arial', 4);
        outlinedText(sub, s.x, s.y + HUB.r + 16, '#dfe6e9', 'bold 11px Arial');
    };
    station(HUB.shop, '52, 152, 219', '🛒', 'QUẦY TIẾP TẾ', 'bước vào để mua đồ');
    station(HUB.board, '231, 76, 60', '🗺', 'BÀN CHIẾN DỊCH', 'bước vào để chọn map & xuất phát');
    if (objState === 'HUB') station(BASE.shopBase, '243, 156, 18', '🏗', 'XƯỞNG CĂN CỨ', 'nâng Nhà Chính, ụ súng, rèn vũ khí, cư dân');
    drawBase(T);
    // Lửa trại (đứng gần hồi máu nhanh)
    let f = HUB.fire;
    ctx.beginPath(); ctx.arc(f.x, f.y, 170, 0, Math.PI * 2); ctx.fillStyle = `rgba(255, 160, 60, ${0.07 + 0.02 * Math.sin(T * 7)})`; ctx.fill();
    ctx.strokeStyle = '#4e342e'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(f.x - 18, f.y + 8); ctx.lineTo(f.x + 18, f.y - 4); ctx.moveTo(f.x - 18, f.y - 4); ctx.lineTo(f.x + 18, f.y + 8); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 3; k++) { let h = 22 + 8 * Math.sin(T * 11 + k * 2); ctx.fillStyle = k ? 'rgba(255, 190, 70, 0.7)' : 'rgba(255, 110, 30, 0.7)'; ctx.beginPath(); ctx.moveTo(f.x - 12 + k * 5, f.y); ctx.quadraticCurveTo(f.x - 4 + k * 4, f.y - h * 0.6, f.x + (k - 1) * 6, f.y - h); ctx.quadraticCurveTo(f.x + 8 + k * 2, f.y - h * 0.5, f.x + 12 - k * 4, f.y); ctx.fill(); }
    ctx.globalCompositeOperation = 'source-over';
    outlinedText('🔥 LỬA TRẠI — hồi máu', f.x, f.y + 34, '#ffbe76', 'bold 11px Arial');
    ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.font = 'bold 70px Arial'; ctx.fillText('KHU SỐNG SÓT', HUB.x, 2330);
}
function hubPointers(ptr) { if (objState !== 'HUB') return; ptr(HUB.shop.x, HUB.shop.y, '#3498db'); ptr(HUB.board.x, HUB.board.y, '#e74c3c'); }
