// ============================================================================
// 15-ops.js
//  - CĂN CỨ: nâng cấp Nhà Chính, bẫy gai, mua / nâng cấp Ụ SÚNG (5 loại) ở Xưởng trong Khu Sống Sót
//  - PHÒNG THỦ CĂN CỨ: cứ 5 map một lần, cướp hoặc zombie tràn vào theo MỘT con đường tới Nhà Chính
//  - THỊ TRẤN CƯỚP (map 5) làm lại: nhiệm vụ ĐỘT KÍCH phá 3 sào huyệt có ụ bắn và súng cối
//  - Nhiệm vụ TIỀN TUYẾN CUỐI CÙNG: giữ một điểm cho tới khi trực thăng đến
//  - Thưởng nhiệm vụ & bảng "Nhiệm vụ hiện tại" ở trại
// ============================================================================
const TURRETS = {
    mg: { name: 'Ụ Súng Máy', icon: '🔫', cost: 25, range: 520, cd: 0.18, dmg: 26, col: '#f39c12', desc: 'Bắn nhanh, tầm trung.' },
    sniper: { name: 'Ụ Bắn Tỉa', icon: '🎯', cost: 35, range: 980, cd: 1.6, dmg: 320, col: '#57606f', desc: 'Tầm rất xa, xuyên 3 mục tiêu.' },
    flame: { name: 'Ụ Phun Lửa', icon: '🔥', cost: 35, range: 270, cd: 0.1, dmg: 95, col: '#e67e22', desc: 'Thiêu mọi kẻ địch trong hình nón gần.' },
    mortar: { name: 'Ụ Pháo Cối', icon: '💣', cost: 45, range: 820, cd: 3.2, dmg: 280, col: '#16a085', desc: 'Nổ diện rộng, bắn chậm.' },
    tesla: { name: 'Ụ Tesla', icon: '⚡', cost: 50, range: 380, cd: 1.1, dmg: 130, col: '#00d2d3', desc: 'Giật sét lan và làm choáng.' }
};
const TURRET_KEYS = Object.keys(TURRETS);
// Ô đặt ụ súng: 2 ô trong cổng trại, 6 ô dọc hai bên con đường
// 8 ô đầu thuộc cổng Đông; mỗi cổng mở thêm (Tây, Nam, Bắc) cho thêm 2 ô bên trong cổng đó
const BASE_SLOTS = [[2580, 1890], [2580, 2110], [2880, 1838], [2880, 2162], [3180, 1838], [3180, 2162], [3480, 1838], [3480, 2162],
    [1420, 1880], [1420, 2120], [1880, 2420], [2120, 2420], [1790, 1560], [2210, 1560]];
const BASE = { house: { x: 2000, y: 1640 }, gate: { x: 2682, y: 2000 }, laneEnd: 3860, shopBase: { x: 2000, y: 2390 } };
// Bốn con đường địch tràn vào: Đông, Tây, Nam, Bắc. Mỗi lần thủ thành xong lần sau mở thêm một cổng.
const GATE_NAMES = ['Đông', 'Tây', 'Nam', 'Bắc'];
const LANES = [
    { x: 2700, y: 1900, w: 1160, h: 200, sx: 3790, sy: 2000, px: 2600, py: 2000 },
    { x: 140, y: 1900, w: 1160, h: 200, sx: 210, sy: 2000, px: 1400, py: 2000 },
    { x: 1900, y: 2550, w: 200, h: 1160, sx: 2000, sy: 3640, px: 2000, py: 2450 },
    { x: 1900, y: 290, w: 200, h: 1160, sx: 2000, sy: 360, px: 1900, py: 1520 }
];
const MAX_GUARDS = 6;
function newBase() { return { house: 0, spikes: 0, turrets: [], def: null, defCount: 0, guards: 0 }; }
let base = newBase();
function baseGates() { return Math.min(4, 1 + (base.defCount || 0)); }                 // số cổng của lần thủ thành kế tiếp
function baseGatesNow() { return NET.mode === 'guest' ? (story.bg || 1) : (base.def ? base.def.gates : baseGates()); }
function baseSlotCount() { return 8 + 2 * (baseGates() - 1); }
function guardCost() { return 30 + base.guards * 5; }
function baseSave() { return { house: base.house, spikes: base.spikes, dc: base.defCount, g: base.guards, turrets: base.turrets.map(t => t ? { t: t.t, l: t.l } : null) }; }
function baseLoad(s) {
    base = newBase(); if (!s) return;
    base.house = Math.max(0, Math.min(5, s.house | 0)); base.spikes = Math.max(0, Math.min(3, s.spikes | 0));
    base.defCount = Math.max(0, s.dc | 0); base.guards = Math.max(0, Math.min(MAX_GUARDS, s.g | 0));
    if (Array.isArray(s.turrets)) s.turrets.slice(0, BASE_SLOTS.length).forEach((t, i) => { if (t && TURRETS[t.t]) base.turrets[i] = { t: t.t, l: Math.max(1, Math.min(3, t.l | 0)), cd: 0, ang: 0 }; });
}
function baseHouseHp() { return 1500 + base.house * 800 + currentLevel * 100; }
function baseDefenseNext() { return (currentLevel + 1) % 5 === 0 && !powerPlantRun.active && !storyForcedRoute(); }
function turretCost(key, lvl) { return Math.round(TURRETS[key].cost * Math.pow(1.5, lvl)); }

// ---------------------------------------------------------------------------
// DỰNG TRẠI (dùng chung cho Khu Sống Sót và màn Phòng Thủ)
// ---------------------------------------------------------------------------
function buildCamp(defense) {
    obstacles = [];
    const wall = (x, y, w, h) => obstacles.push({ type: 'wall', x, y, w, h });
    let n = defense ? baseGatesNow() : 0;
    // Bốn mặt tường; mặt nào có cổng mở thì chừa khoảng 200px và dựng hàng rào hai bên con đường
    if (n >= 1) { wall(2664, 1450, 36, 450); wall(2664, 2100, 36, 450); } else wall(2664, 1450, 36, 1100);
    if (n >= 2) { wall(1300, 1450, 36, 450); wall(1300, 2100, 36, 450); } else wall(1300, 1450, 36, 1100);
    if (n >= 3) { wall(1300, 2514, 600, 36); wall(2100, 2514, 600, 36); } else wall(1300, 2514, 1400, 36);
    if (n >= 4) { wall(1300, 1450, 600, 36); wall(2100, 1450, 600, 36); } else wall(1300, 1450, 1400, 36);
    for (let g = 0; g < n; g++) {
        let L = LANES[g];
        if (L.w > L.h) { wall(L.x, L.y - 36, L.w, 36); wall(L.x, L.y + L.h, L.w, 36); wall(g === 0 ? L.x + L.w : L.x - 36, L.y, 36, L.h); }
        else { wall(L.x - 36, L.y, 36, L.h); wall(L.x + L.w, L.y, 36, L.h); wall(L.x, g === 2 ? L.y + L.h : L.y - 36, L.w, 36); }
    }
    for (let t of [[1420, 1560], [2440, 1560], [1420, 2300], [2440, 2300]]) obstacles.push({ type: 'building', x: t[0], y: t[1], w: 150, h: 120 });
    if (!defense) for (let t of [[1380, 2020], [2560, 2300]]) obstacles.push({ type: 'tree', x: t[0], y: t[1], w: 70, h: 70 });
    GROUND_DOTS.length = 0;
    for (let i = 0; i < 500; i++) GROUND_DOTS.push({ x: 1300 + Math.random() * 1400, y: 1450 + Math.random() * 1100, r: Math.random() * 2.5 + 0.5 });
}

// ---------------------------------------------------------------------------
// XƯỞNG CĂN CỨ (bảng trong trại)
// ---------------------------------------------------------------------------
function renderBasePanel() {
    let box = document.getElementById('baseItems'); if (!box) return;
    const btn = (label, fn, ok, cls) => `<button class="px-2 py-2 rounded-lg text-xs font-bold border ${ok ? (cls || 'bg-emerald-700 border-emerald-400 text-white') : 'bg-gray-800 border-gray-600 text-gray-500'}" onclick="${fn}">${label}</button>`;
    let hc = 30 + base.house * 25, sc = 25 + base.spikes * 20;
    let html = `<p class="text-xs text-gray-400 mb-2">Phế liệu: <span class="highlight">⚙ ${shopScrap}</span> · Cứ 5 map căn cứ bị tấn công một lần (map ${Math.ceil((currentLevel + 1) / 5) * 5}). Ụ súng và Nhà Chính được giữ suốt lượt chơi.<br>Lần tới địch tràn vào từ <b class="text-orange-300">${baseGates()} cổng: ${GATE_NAMES.slice(0, baseGates()).join(', ')}</b> — mỗi lần thủ thành xong sẽ mở thêm một cổng (tối đa 4).</p>`;
    html += `<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        <div class="p-2 rounded-lg bg-slate-900/80 border border-slate-600 flex items-center justify-between gap-2"><div class="text-xs text-white"><b>🏠 Nhà Chính</b> cấp ${base.house}/5<br><span class="text-gray-400">Máu ${baseHouseHp()}</span></div>${base.house < 5 ? btn('Nâng cấp ⚙' + hc, 'baseBuy(\'house\')', shopScrap >= hc) : '<span class="text-emerald-400 text-xs font-bold">TỐI ĐA</span>'}</div>
        <div class="p-2 rounded-lg bg-slate-900/80 border border-slate-600 flex items-center justify-between gap-2"><div class="text-xs text-white"><b>🪤 Bẫy gai trên đường</b> cấp ${base.spikes}/3<br><span class="text-gray-400">Địch đi qua bị thương &amp; chậm</span></div>${base.spikes < 3 ? btn('Nâng cấp ⚙' + sc, 'baseBuy(\'spikes\')', shopScrap >= sc) : '<span class="text-emerald-400 text-xs font-bold">TỐI ĐA</span>'}</div></div>`;
    let gc = guardCost();
    html += `<div class="p-2 mb-3 rounded-lg bg-slate-900/80 border border-slate-600 flex items-center justify-between gap-2"><div class="text-xs text-white"><b>💂 Lính gác thuê</b> ${base.guards}/${MAX_GUARDS}<br><span class="text-gray-400">Chia đều ra giữ các cổng khi căn cứ bị tấn công. Lính chết trong trận là mất.</span></div>${base.guards < MAX_GUARDS ? btn('Thuê lính ⚙' + gc, 'baseBuy(\'guard\')', shopScrap >= gc) : '<span class="text-emerald-400 text-xs font-bold">ĐỦ QUÂN</span>'}</div>`;
    html += '<div class="space-y-2">';
    BASE_SLOTS.forEach((s, i) => {
        if (i >= baseSlotCount()) return;
        let t = base.turrets[i], where = i < 2 ? 'trong cổng Đông' : (i < 8 ? 'bên đường Đông' : 'trong cổng ' + GATE_NAMES[1 + Math.floor((i - 8) / 2)]);
        html += `<div class="p-2 rounded-lg bg-slate-900/80 border border-slate-600"><div class="text-xs text-gray-300 mb-1"><b class="text-white">Ô ${i + 1}</b> <span class="text-gray-500">(${where})</span> — `;
        if (t) {
            let d = TURRETS[t.t], uc = turretCost(t.t, t.l);
            html += `<b style="color:${d.col}">${d.icon} ${d.name}</b> cấp ${t.l}/3</div><div class="flex gap-2 flex-wrap">${t.l < 3 ? btn('Nâng cấp ⚙' + uc, `baseBuy('up',${i})`, shopScrap >= uc) : '<span class="text-emerald-400 text-xs font-bold self-center">CẤP TỐI ĐA</span>'}${btn('Bán (+⚙' + Math.floor(d.cost * 0.5) + ')', `baseBuy('sell',${i})`, true, 'bg-gray-700 border-gray-500 text-gray-200')}</div>`;
        } else {
            html += 'trống</div><div class="flex gap-1 flex-wrap">';
            for (let k of TURRET_KEYS) html += btn(`${TURRETS[k].icon} ${TURRETS[k].name.replace('Ụ ', '')} ⚙${TURRETS[k].cost}`, `baseBuy('${k}',${i})`, shopScrap >= TURRETS[k].cost);
            html += '</div>';
        }
        html += '</div>';
    });
    html += '</div><p class="text-[11px] text-gray-500 mt-2">' + TURRET_KEYS.map(k => `${TURRETS[k].icon} ${TURRETS[k].desc}`).join(' · ') + '</p>';
    box.innerHTML = html;
}
function baseBuy(what, slot) {
    const pay = (c) => { if (shopScrap < c) { Sound.play('hit'); netToast('Không đủ phế liệu!', 1500); return false; } shopScrap -= c; Sound.play('upgrade'); return true; };
    if (what === 'house') { if (base.house < 5 && pay(30 + base.house * 25)) base.house++; }
    else if (what === 'spikes') { if (base.spikes < 3 && pay(25 + base.spikes * 20)) base.spikes++; }
    else if (what === 'guard') { if (base.guards < MAX_GUARDS && pay(guardCost())) base.guards++; }
    else if (what === 'up') { let t = base.turrets[slot]; if (t && t.l < 3 && pay(turretCost(t.t, t.l))) t.l++; }
    else if (what === 'sell') { let t = base.turrets[slot]; if (t) { shopScrap += Math.floor(TURRETS[t.t].cost * 0.5); base.turrets[slot] = null; Sound.play('select'); } }
    else if (TURRETS[what] && !base.turrets[slot] && slot >= 0 && slot < baseSlotCount()) { if (pay(TURRETS[what].cost)) base.turrets[slot] = { t: what, l: 1, cd: 0, ang: 0 }; }
    renderBasePanel(); netSendSync();
}
// Băng thông báo ở Bàn Chiến Dịch khi map kế tiếp là màn phòng thủ
function baseShopBanner() {
    let el = document.getElementById('storyBanner'); if (!el || el.style.display === 'block') return;
    if (!baseDefenseNext()) return;
    el.style.display = 'block';
    el.innerHTML = '🛡 <b>CĂN CỨ SẮP BỊ TẤN CÔNG:</b> map kế tiếp là <b>PHÒNG THỦ NHÀ CHÍNH</b> (tuyến đang chọn sẽ bị bỏ qua). Ghé <b>🏗 Xưởng Căn Cứ</b> đặt ụ súng và nâng Nhà Chính trước khi bấm bắt đầu!';
}

// ---------------------------------------------------------------------------
// MÀN PHÒNG THỦ CĂN CỨ (map 16, objState 'BASE_DEF')
// ---------------------------------------------------------------------------
function genBaseDefense(level) {
    bgMapColor = '#2f3b2c'; currentWeather = 1;
    base.def = { wave: 0, total: Math.min(8, 4 + Math.floor(level / 5)), left: 0, spawnT: 0, breakT: 6, kind: Math.random() < 0.5 ? 'bandit' : 'zombie', endT: 0, win: false, spikeT: 0, gates: baseGates() };
    buildCamp(true);
}
function baseAfterGenerate(level) {
    let d = base.def;
    let h = new StoryNPC(BASE.house.x, BASE.house.y, 'house'); h.radius = 74; h.maxHp = h.hp = baseHouseHp(); rescueNPCs.push(h); d.houseNpc = h;
    for (let t of base.turrets) if (t) { t.cd = Math.random(); t.ang = 0; }
    drops = drops.filter(q => q.x > 1340 && q.x < 2660 && q.y > 1490 && q.y < 2510).slice(0, 10);
    players.forEach((p, i) => { p.x = 2480; p.y = 2000 + (i ? 50 : -50); });
    allies.forEach((a, i) => { a.x = 2380; a.y = 1960 + i * 40; });
    // Lính gác thuê: chia đều ra các cổng đang mở
    for (let i = 0; i < base.guards; i++) {
        let L = LANES[i % d.gates], row = Math.floor(i / d.gates);
        let gx = L.px + (L.w > L.h ? 0 : (row % 2 ? 60 : -60)), gy = L.py + (L.w > L.h ? (row % 2 ? 60 : -60) : 0);
        let a = new Ally(gx, gy, 'rifleman'); a.post = { x: gx, y: gy }; a.guard = true; allies.push(a);
    }
    mission = { type: 'BASE_DEF', progress: 0, required: d.total, complete: false }; objState = 'BASE_DEF';
    story.noSpawn = true;
    navRebuild(); navFlood([{ x: 2480, y: 2000 }], NAV.field); NAV.reach.length = 0;
    for (let i = 0; i < NAV.field.length; i++) { let cx = (i % NAV.n) * NAV.cs, cy = Math.floor(i / NAV.n) * NAV.cs; if (NAV.field[i] >= 2 && cx > 1340 && cx < 2660 && cy > 1490 && cy < 2510) NAV.reach.push(i); }
    let where = d.gates > 1 ? `${d.gates} CỔNG (${GATE_NAMES.slice(0, d.gates).join(', ')})` : 'con đường phía ĐÔNG';
    queueRadio(`Lính gác: ${d.kind === 'bandit' ? 'BĂNG CƯỚP' : 'Một BẦY XÁC SỐNG'} đang tràn vào từ ${where}! Giữ Nhà Chính bằng mọi giá!`, null, 6);
}
function banditRandomType() { let r = Math.random(); return r < 0.55 ? 12 : (r < 0.72 ? 9 : (r < 0.84 ? 8 : (r < 0.95 || currentLevel < 7 ? 3 : 27))); }

function updateBase(dt) {
    let d = base.def; if (!d) return;
    let h = d.houseNpc;
    if (d.endT > 0) {
        d.endT -= dt;
        if (d.endT <= 0) {
            mission.complete = true; base.def = null;
            rescueNPCs = [];
            base.defCount++;                                                   // lần sau mở thêm một cổng
            base.guards = allies.filter(a => a.guard && a.hp > 0).length;      // lính gác chết là mất
            allies = allies.filter(a => !a.guard);
            if (d.win) {
                let reward = 60 + currentLevel * 6; shopScrap += reward; breakthroughShards++;
                netToast(`🛡 GIỮ VỮNG CĂN CỨ! +${reward} ⚙, +1 ◆ Mảnh Bức Phá.`, 4500); Sound.play('level');
            } else {
                let lost = Math.floor(shopScrap * 0.5); shopScrap -= lost;
                let owned = base.turrets.map((t, i) => t ? i : -1).filter(i => i >= 0);
                if (owned.length) base.turrets[owned[Math.floor(Math.random() * owned.length)]] = null;
                base.house = Math.max(0, base.house - 1);
                netToast(`NHÀ CHÍNH BỊ PHÁ! Mất ${lost} ⚙, một ụ súng và 1 cấp Nhà Chính.`, 5000); Sound.play('down');
            }
            shopOpenedForLevel = 0; openRouteShop();
        }
        return;
    }
    if (!h || h.hp <= 0) { d.win = false; d.endT = 2.5; for (let p of players) vfxList.push({ type: 'text', text: 'NHÀ CHÍNH ĐÃ SỤP ĐỔ!', x: p.x, y: p.y - 90, life: 2.5, color: '#ff4757' }); addScreenShake(20); Sound.play('explode'); return; }

    // Đợt tấn công
    let enemies = zombies.filter(z => z.hp > 0).length;
    if (d.left > 0) {
        d.spawnT -= dt;
        if (d.spawnT <= 0 && enemies < 70) {
            d.spawnT = Math.max(0.28, 0.6 - d.wave * 0.04);
            let L = LANES[Math.floor(Math.random() * d.gates)], horiz = L.w > L.h, last = d.wave === d.total;
            let x = L.sx + (horiz ? (Math.random() - 0.5) * 60 : (Math.random() - 0.5) * 130), y = L.sy + (horiz ? (Math.random() - 0.5) * 130 : (Math.random() - 0.5) * 60);
            let t = d.kind === 'bandit' ? banditRandomType() : -1;
            if (last && d.left % 9 === 0) t = d.kind === 'bandit' ? 27 : 4;
            let nz = new Zombie(x, y, t); nz.maxHp *= 1.5; nz.hp = nz.maxHp; zombies.push(nz); d.left--;
        }
    } else if (enemies === 0) {
        if (d.wave >= d.total) { d.win = true; d.endT = 3; for (let p of players) vfxList.push({ type: 'text', text: 'ĐÃ ĐẨY LÙI CUỘC TẤN CÔNG!', x: p.x, y: p.y - 90, life: 2.8, color: '#2ecc71' }); Sound.play('level'); return; }
        d.breakT -= dt;
        if (d.breakT <= 0) {
            d.wave++; d.left = Math.round(14 + currentLevel * 1.6 + d.wave * 7); d.breakT = 7; d.spawnT = 0; mission.progress = d.wave;
            for (let p of players) vfxList.push({ type: 'text', text: `ĐỢT ${d.wave}/${d.total}${d.wave === d.total ? ' — ĐỢT CUỐI!' : ''}`, x: p.x, y: p.y - 90, life: 2.2, color: '#ff9f43' });
            Sound.play('roar');
        }
    }
    // Đạn của cướp trúng Nhà Chính
    for (let b of enemyBullets) if (b.active && Math.hypot(b.x - h.x, b.y - h.y) < h.radius) { b.active = false; h.takeDamage(b.type === 'rocket' ? 40 : 9); createParticles(b.x, b.y, '#bdc3c7', 4, 100); }
    // Bẫy gai trên đường
    if (base.spikes > 0) {
        d.spikeT -= dt;
        if (d.spikeT <= 0) {
            d.spikeT = 0.5;
            for (let z of zombies) if (z.hp > 0 && !z.flying && LANES.some((L, g) => g < d.gates && z.x > L.x + 50 && z.x < L.x + L.w - 50 && z.y > L.y + 50 - (L.w > L.h ? 50 : 0) && z.y < L.y + L.h - 50 + (L.w > L.h ? 50 : 0))) { z.hp -= (14 + currentLevel * 3) * base.spikes; z.dzT = 0.6; z.lastHitBy = players[0]; }
        }
    }
    updateTurrets(dt);
}

function updateTurrets(dt) {
    let src = players[0];
    base.turrets.forEach((t, i) => {
        if (!t) return;
        let def = TURRETS[t.t], x = BASE_SLOTS[i][0], y = BASE_SLOTS[i][1], pow = 1 + (t.l - 1) * 0.5 + currentLevel * 0.06;
        t.cd -= dt;
        let tz = null, bd = def.range;
        for (let z of zombies) { if (z.hp <= 0 || z.hidden || z.flying) continue; let dd = Math.hypot(z.x - x, z.y - y); if (dd < bd) { bd = dd; tz = z; } }
        if (!tz) return;
        t.ang = Math.atan2(tz.y - y, tz.x - x);
        if (t.cd > 0) return;
        t.cd = def.cd;
        if (t.t === 'mg') bullets.push(new Bullet(x, y, t.ang + (Math.random() - 0.5) * 0.06, { range: def.range, dmg: def.dmg * pow, wallPiercing: true, fromAlly: true }, src));
        else if (t.t === 'sniper') { bullets.push(new Bullet(x, y, t.ang, { range: def.range, dmg: def.dmg * pow, pierce: 3, wallPiercing: true, armorPiercing: true, fromAlly: true }, src)); vfxList.push({ type: 'muzzle', x: x + Math.cos(t.ang) * 30, y: y + Math.sin(t.ang) * 30, life: 0.1, angle: t.ang, k: 'SNIPER' }); }
        else if (t.t === 'flame') {
            for (let z of zombies) {
                if (z.hp <= 0 || z.flying || Math.hypot(z.x - x, z.y - y) > def.range + z.radius) continue;
                let a = Math.atan2(z.y - y, z.x - x); if (Math.abs(Math.atan2(Math.sin(a - t.ang), Math.cos(a - t.ang))) > 0.5) continue;
                z.hp -= def.dmg * pow * def.cd; z.lastHitBy = src; applyStatus(z, STATUS.BURN, { duration: 2.0, dpsPercent: 0.012, source: src });
            }
            for (let k = 0; k < 2; k++) { let a = t.ang + (Math.random() - 0.5) * 0.9, r = 40 + Math.random() * (def.range - 40); createParticles(x + Math.cos(a) * r, y + Math.sin(a) * r, Math.random() < 0.5 ? '#e67e22' : '#f9ca24', 1, 60); }
        } else if (t.t === 'mortar') hazards.push({ type: 'artillery', x: tz.x, y: tz.y, radius: 150, timer: 0.8, life: 1.0, dmg: def.dmg * pow, friendly: true, source: src });
        else { friendlyZap(tz.x, tz.y, 120, def.dmg * pow, src); vfxList.push({ type: 'laser_beam', x, y: y - 20, tx: tz.x, ty: tz.y, life: 0.2, jag: true }); Sound.play('lightning'); }
    });
}

function drawBaseHouse(n) {
    let x = n.x, y = n.y, hurt = n.hurt > 0;
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(x - 100 + 10, y - 66 + 10, 200, 132);
    ctx.fillStyle = hurt ? '#c98b6b' : '#8d6e63'; ctx.fillRect(x - 100, y - 66, 200, 132); ctx.strokeStyle = '#3e2723'; ctx.lineWidth = 5; ctx.strokeRect(x - 100, y - 66, 200, 132);
    ctx.fillStyle = '#5d4037'; ctx.beginPath(); ctx.moveTo(x - 100, y - 66); ctx.lineTo(x, y); ctx.lineTo(x + 100, y - 66); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 100, y + 66); ctx.lineTo(x, y); ctx.lineTo(x + 100, y + 66); ctx.closePath(); ctx.fillStyle = '#6d4c41'; ctx.fill();
    ctx.fillStyle = '#ffeaa7'; ctx.fillRect(x - 12, y + 40, 24, 26);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    outlinedText('🏠 NHÀ CHÍNH', x, y - 86, '#ffeaa7', 'bold 14px Arial', 4);
    if (objState === 'BASE_DEF') drawMiniBar(x, y + 78, 160, 9, n.hp, n.maxHp, n.hp < n.maxHp * 0.35 ? '#ff4757' : '#2ecc71');
}
// Vẽ con đường, bẫy gai, ô ụ súng (gọi từ drawHub — cả lúc ở trại lẫn lúc phòng thủ)
function drawBase(T) {
    let defense = objState === 'BASE_DEF';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (defense) {
        for (let g = 0, n = baseGatesNow(); g < n; g++) {
            let L = LANES[g], st = 46 - base.spikes * 8;
            ctx.fillStyle = 'rgba(194, 178, 128, 0.28)'; ctx.fillRect(L.x, L.y, L.w, L.h);
            if (base.spikes > 0) { ctx.fillStyle = 'rgba(190, 190, 200, 0.55)'; for (let x = L.x + 60; x < L.x + L.w - 60; x += L.w > L.h ? st : 36) for (let y = L.y + (L.w > L.h ? 15 : 60); y < L.y + L.h - (L.w > L.h ? 5 : 60); y += L.w > L.h ? 36 : st) { ctx.beginPath(); ctx.moveTo(x - 5, y + 6); ctx.lineTo(x, y - 7); ctx.lineTo(x + 5, y + 6); ctx.fill(); } }
            ctx.beginPath(); ctx.arc(L.sx, L.sy, 90, 0, Math.PI * 2); ctx.fillStyle = `rgba(231, 76, 60, ${0.25 + 0.15 * Math.sin(T * 5 + g)})`; ctx.fill();
            outlinedText('☠ LỐI ĐỊCH — CỔNG ' + GATE_NAMES[g].toUpperCase(), L.sx, L.sy, '#ff7675', 'bold 13px Arial');
        }
    } else if (!rescueNPCs.some(n => n.kind === 'house')) drawBaseHouse({ x: BASE.house.x, y: BASE.house.y, hp: 1, maxHp: 1 });
    let list = NET.mode === 'guest' ? (story.bs || []) : base.turrets;
    BASE_SLOTS.forEach((s, i) => {
        if (!defense && i >= 2 && i < 8) return;              // ở trại chỉ thấy các ụ nằm trong tường
        let t = list[i], x = s[0], y = s[1];
        if (!t && i >= 8 + 2 * (baseGatesNow() - 1)) return;   // cổng chưa mở: chưa có ô
        ctx.beginPath(); ctx.arc(x, y, 26, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill(); ctx.strokeStyle = t ? '#dfe6e9' : 'rgba(223,230,233,0.3)'; ctx.lineWidth = 2; ctx.setLineDash(t ? [] : [5, 6]); ctx.stroke(); ctx.setLineDash([]);
        if (!t) return;
        let d = TURRETS[t.t] || TURRETS.mg;
        if (defense) { ctx.beginPath(); ctx.arc(x, y, d.range, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 2; ctx.stroke(); }
        ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI * 2); ctx.fillStyle = '#2f3542'; ctx.fill(); ctx.strokeStyle = d.col; ctx.lineWidth = 3; ctx.stroke();
        ctx.save(); ctx.translate(x, y); ctx.rotate(t.ang || 0);
        ctx.fillStyle = d.col;
        if (t.t === 'sniper') ctx.fillRect(0, -3, 44, 6); else if (t.t === 'mortar') ctx.fillRect(0, -9, 24, 18); else if (t.t === 'flame') { ctx.fillRect(0, -6, 26, 12); ctx.fillStyle = '#c0392b'; ctx.fillRect(22, -8, 8, 16); } else if (t.t === 'tesla') { ctx.fillRect(-4, -4, 8, 8); } else { ctx.fillRect(0, -7, 30, 5); ctx.fillRect(0, 2, 30, 5); }
        ctx.restore();
        if (t.t === 'tesla') { ctx.strokeStyle = `rgba(160, 240, 255, ${0.5 + 0.5 * Math.sin(T * 16 + i)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.stroke(); }
        ctx.fillStyle = '#f1c40f'; ctx.font = 'bold 9px Arial'; ctx.fillText('★'.repeat(t.l || 1), x, y + 30);
    });
}

// ---------------------------------------------------------------------------
// THỊ TRẤN CƯỚP (map 5): nhiệm vụ ĐỘT KÍCH — phá 3 sào huyệt
// ---------------------------------------------------------------------------
function genBanditTown(level) {
    bgMapColor = '#8d6e63';
    let cx = MAP_SIZE.w / 2, cy = MAP_SIZE.h / 2, a0 = Math.random() * Math.PI * 2, camps = [];
    for (let k = 0; k < 3; k++) { let a = a0 + k * Math.PI * 2 / 3, r = 1150 + Math.random() * 250; camps.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }); }
    // Nhà dân rải rác (tránh các sào huyệt và điểm xuất phát)
    for (let i = 0, n = 0; i < 300 && n < 34 + level * 2; i++) {
        let w = 110 + Math.random() * 90, h = 110 + Math.random() * 90, x = 150 + Math.random() * (MAP_SIZE.w - 300 - w), y = 150 + Math.random() * (MAP_SIZE.h - 300 - h);
        if (camps.some(c => Math.hypot(x + w / 2 - c.x, y + h / 2 - c.y) < 430) || Math.hypot(x + w / 2 - cx, y + h / 2 - cy) < 330) continue;
        if (obstacles.some(o => x < o.x + o.w + 110 && x + w + 110 > o.x && y < o.y + o.h + 110 && y + h + 110 > o.y)) continue;
        obstacles.push({ type: 'building', x, y, w, h }); n++;
    }
    for (let c of camps) {
        let op = new Outpost(c.x - 75, c.y - 75); op.raid = true; op.hp = op.maxHp = 1600 + level * 320; op.fireCD = 2; op.mortarCD = 5; outposts.push(op);
        // Tường bao hình vuông có 2 cửa
        const W2 = 250;
        obstacles.push({ type: 'wall', x: c.x - W2, y: c.y - W2, w: W2 * 2, h: 28 });
        obstacles.push({ type: 'wall', x: c.x - W2, y: c.y + W2 - 28, w: W2 - 70, h: 28 }); obstacles.push({ type: 'wall', x: c.x + 70, y: c.y + W2 - 28, w: W2 - 70, h: 28 });
        obstacles.push({ type: 'wall', x: c.x - W2, y: c.y - W2, w: 28, h: W2 - 70 }); obstacles.push({ type: 'wall', x: c.x - W2, y: c.y + 70, w: 28, h: W2 - 70 });
        obstacles.push({ type: 'wall', x: c.x + W2 - 28, y: c.y - W2, w: 28, h: W2 * 2 });
        for (let g = 0; g < 4 + Math.floor(level / 4); g++) zombies.push(new Zombie(c.x + (Math.random() - 0.5) * 300, c.y + (Math.random() - 0.5) * 300, banditRandomType()));
    }
    mission = { type: 'RAID', progress: 0, required: 3, complete: false }; objState = 'RAID';
}
// Sào huyệt: bắn trả, nã cối, sinh cướp; chém và nổ cũng gây sát thương. Gọi mỗi khung hình.
function updateOutpostsExtra(dt) {
    for (let op of outposts) {
        if (op.dead || op.destroyTimer > 0) continue;
        let cx = op.x + op.w / 2, cy = op.y + op.h / 2;
        // Cận chiến chém trúng tiền đồn (trước đây chỉ đạn mới gây sát thương)
        for (let sl of slashes) {
            if (!sl.active || (sl.hitProps && sl.hitProps.has(op))) continue;
            let nx = Math.max(op.x, Math.min(sl.x, op.x + op.w)), ny = Math.max(op.y, Math.min(sl.y, op.y + op.h));
            if (Math.hypot(nx - sl.x, ny - sl.y) > sl.range) continue;
            (sl.hitProps = sl.hitProps || new Set()).add(op);
            outpostHurt(op, calcDamage(sl.dmg, sl.wepData, cx, cy, sl.source, null)); createParticles(nx, ny, '#c0392b', 8, 180);
        }
        if (!op.raid) continue;
        let tgt = null, bd = 620;
        for (let p of players) { if (p.isDowned) continue; let d = Math.hypot(p.x - cx, p.y - cy); if (d < bd) { bd = d; tgt = p; } }
        if (tank.active && Math.hypot(tank.x - cx, tank.y - cy) < 620) tgt = tank;
        if (!tgt) continue;
        op.fireCD -= dt; op.mortarCD -= dt;
        if (op.fireCD <= 0) { op.fireCD = 1.1; for (let k = -1; k <= 1; k++) { let a = Math.atan2(tgt.y - cy, tgt.x - cx) + k * 0.14; enemyBullets.push(new EnemyBullet(cx, cy, cx + Math.cos(a) * 100, cy + Math.sin(a) * 100, 'arrow')); } }
        if (op.mortarCD <= 0) { op.mortarCD = 5.5; hazards.push({ type: 'artillery', x: tgt.x, y: tgt.y, radius: 125, timer: 1.2, life: 1.4, dmg: 70 }); vfxList.push({ type: 'text', text: 'SÚNG CỐI!', x: cx, y: op.y - 46, life: 1.0, color: '#ff9f43' }); }
    }
}
function outpostHurt(op, dmg) {
    if (op.dead || op.destroyTimer > 0) return;
    op.hp -= dmg;
    if (op.hp <= 0) { op.destroyTimer = op.raid ? 4 : 10; vfxList.push({ type: 'text', text: `SÀO HUYỆT TỰ HỦY - ${op.raid ? 4 : 10}S!`, x: op.x + op.w / 2, y: op.y - 30, life: 2.0, color: '#ff4757' }); }
}
// Tiền đồn vừa nổ tung (móc trong Outpost.update)
function outpostDestroyed(op) {
    let cx = op.x + op.w / 2, cy = op.y + op.h / 2, gain = 12 + currentLevel;
    shopScrap += gain; vfxList.push({ type: 'text', text: `+${gain} ⚙ CHIẾN LỢI PHẨM`, x: cx, y: cy - 60, life: 2.0, color: '#f1c40f' });
    drops.push({ type: 'SUPERBOX', x: cx, y: cy + 30, radius: 16, lifeTime: 900 });
    for (let k = 0; k < 2; k++) spawnDrop(cx + (k ? 50 : -50), cy - 20);
    if (mission.type !== 'RAID' || mission.complete) return;
    mission.progress++;
    if (mission.progress >= mission.required) {
        // Kho của băng cướp lộ ra ở giữa thị trấn
        story.props.push({ kind: 'wreck', breakable: true, x: MAP_SIZE.w / 2, y: MAP_SIZE.h / 2 - 120, r: 40, v: 1, name: 'KHO CỦA BĂNG CƯỚP', hp: 400, maxHp: 400, scrap: 30 + currentLevel * 2 });
        queueRadio('Bộ đàm: Ba sào huyệt đã sập! Kho của băng cướp nằm ngay điểm tập kết — phá nó lấy phế liệu rồi lên trực thăng!', null, 6);
        completeMission();
    } else queueRadio(`Bộ đàm: Còn ${mission.required - mission.progress} sào huyệt nữa. Chúng có ụ bắn và súng cối — đừng đứng yên!`, null, 5);
}

// ---------------------------------------------------------------------------
// NHIỆM VỤ "TIỀN TUYẾN CUỐI CÙNG": giữ một điểm tới khi trực thăng đến
// ---------------------------------------------------------------------------
function lastStandSetup(level) {
    let p = storyFarPoints(1, 650, 0)[0];
    let need = Math.min(100, 55 + level * 3);
    story.props.push({ kind: 'holdpt', x: p.x, y: p.y, r: 250, hp: 0, maxHp: need, on: false });
    mission.required = need; mission.progress = 0;
    obstacles = obstacles.filter(o => Math.hypot(o.x + o.w / 2 - p.x, o.y + o.h / 2 - p.y) > 190 + Math.max(o.w, o.h) / 2);
    NAV.dirty = true;
    queueRadio('Bộ đàm: TIỀN TUYẾN CUỐI CÙNG — tới điểm đánh dấu và giữ vững cho tới khi trực thăng đến. Rời vòng là đồng hồ dừng!', null, 6);
}
function updateLastStand(dt) {
    let hp = story.props.find(p => p.kind === 'holdpt'); if (!hp || hp.on) return;
    let inside = !tank.active && players.some(p => !p.isDowned && Math.hypot(p.x - hp.x, p.y - hp.y) < hp.r) || (tank.active && Math.hypot(tank.x - hp.x, tank.y - hp.y) < hp.r);
    hp.reached = hp.reached || inside;
    if (inside) hp.hp = Math.min(hp.maxHp, hp.hp + dt);
    mission.progress = Math.floor(hp.hp);
    story.noSpawn = !hp.reached;            // chưa tới điểm thì chưa bị vây
    if (hp.hp >= hp.maxHp) {
        hp.on = true; story.noSpawn = false;
        completeMission();
        evacZone = { x: hp.x, y: hp.y, progress: 0 }; evacTimer = 0.05;      // trực thăng đáp ngay tại điểm đang giữ
        heliSupport.active = true; heliSupport.x = hp.x; heliSupport.y = hp.y - 300;
        for (let p of players) vfxList.push({ type: 'text', text: 'TRỰC THĂNG ĐÃ TỚI — LÊN MÁY BAY!', x: p.x, y: p.y - 100, life: 2.5, color: '#2ecc71' });
    }
}
function drawHoldPoint(p, T) {
    let pct = p.hp / p.maxHp;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = `rgba(241, 196, 15, ${0.08 + 0.03 * Math.sin(T * 4)})`; ctx.fill();
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(T * 0.4); ctx.setLineDash([26, 16]); ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(241, 196, 15, 0.9)'; ctx.lineWidth = 5; ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    if (pct > 0) { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2); ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 9; ctx.stroke(); }
    // Bao cát + cờ
    ctx.fillStyle = '#a1887f'; for (let k = 0; k < 10; k++) { let a = k / 10 * Math.PI * 2; ctx.beginPath(); ctx.ellipse(p.x + Math.cos(a) * 70, p.y + Math.sin(a) * 70, 20, 11, a + Math.PI / 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = '#dfe6e9'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(p.x, p.y + 10); ctx.lineTo(p.x, p.y - 60); ctx.stroke();
    ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.moveTo(p.x, p.y - 60); ctx.lineTo(p.x + 36 + Math.sin(T * 6) * 4, p.y - 48); ctx.lineTo(p.x, p.y - 36); ctx.fill();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    outlinedText('TIỀN TUYẾN CUỐI CÙNG', p.x, p.y - p.r - 14, '#f1c40f', 'bold 13px Arial', 4);
}

// ---------------------------------------------------------------------------
// THƯỞNG NHIỆM VỤ & BẢNG "NHIỆM VỤ HIỆN TẠI" Ở TRẠI
// ---------------------------------------------------------------------------
const MISSION_BONUS = { BURN_PLANTS: 22, RAID: 30, LAST_STAND: 25, RESCUE: 20, KILL: 8, COLLECT: 8, POWER_CHARGE: 12, DEFEND: 20 };
function missionReward(type, level = currentLevel) {
    let boss = ['BOSS', 'POWER_BOSS', 'CITY_BOSS', 'HANGZ_ESCAPE', 'STORM_BOSS', 'ZAP_BOSS'].includes(type);
    return Math.round(((boss ? 80 + level * 5 : 30 + level * 5) + (MISSION_BONUS[type] || 0)) * diff().scrap);
}
function hubTaskLines() {
    let L = [], next = currentLevel + 1;
    let f = storyForcedRoute();
    if (f === 'forest') L.push(['⚡ Cốt truyện: tới RỪNG SÉT, phá 3 Trạm Điện, hạ TÀN VẾT CHỚP', '#f9ca24']);
    else if (f === 'final') L.push(['⚡ Cốt truyện: về NHÀ MÁY ĐIỆN, hạ ZAP-1624 "KÌNH LÔI"', '#f9ca24']);
    if (baseDefenseNext()) L.push(['🛡 MAP KẾ TIẾP: PHÒNG THỦ NHÀ CHÍNH — ghé Xưởng đặt ụ súng!', '#ff7675']);
    else if (!f) {
        let names = { balanced: 'Tuyến An Toàn', hunt: 'Săn Quét', rescue: 'Giải Cứu', power: 'Nhà Máy Điện', hangz: 'Hang Z', mine: 'Hầm Mỏ', botanical: 'Vườn Thực Vật', cityn: 'Thành Phố N', labz: 'Phòng Thí Nghiệm Z', bandit: 'Thị Trấn Cướp' };
        let mt = predictNextMission(), known = nextRoute !== 'balanced' || nextMissionPreference;
        L.push([`🚩 Điểm đến Map ${next}: ${names[nextRoute] || nextRoute}${known ? ' — ' + getMissionName(mt) : ''}`, '#dfe6e9']);
        L.push([`💰 Thưởng hoàn thành: khoảng +${missionReward(known ? mt : 'TOWERS', next)} ⚙`, '#f1c40f']);
    }
    let until = 5 - (next % 5); if (next % 5 !== 0) L.push([`🛡 Căn cứ bị tấn công sau ${until} map nữa (Map ${next + until})`, '#b2bec3']);
    L.push([`🏠 Nhà Chính cấp ${base.house} · ${base.turrets.filter(t => t).length}/${baseSlotCount()} ụ súng · bẫy gai cấp ${base.spikes} · ${base.guards} lính gác · lần tới ${baseGates()} cổng`, '#b2bec3']);
    if (players.some(p => p.pendingUpgrades > 0)) L.push(['🃏 Có lượt chọn thẻ đang chờ (chọn khi bắt đầu chiến dịch)', '#2ecc71']);
    return L;
}
function drawHubTasks(T) {
    if (objState !== 'HUB') return;
    const small = W < 640 || H < 480, fs = small ? 10 : 12, lines = hubTaskLines();
    ctx.font = `bold ${fs}px Arial`;
    let w = Math.min(W - 20, Math.max(...lines.map(l => ctx.measureText(l[0]).width)) + 20), h = 24 + lines.length * (fs + 6);
    let x = 10, y = small ? 150 : 96;
    ctx.fillStyle = 'rgba(8,12,18,0.72)'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(46, 204, 113, 0.6)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w, h);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#2ecc71'; ctx.fillText('📋 NHIỆM VỤ HIỆN TẠI', x + 8, y + 12);
    lines.forEach((l, i) => { ctx.fillStyle = l[1]; ctx.fillText(l[0], x + 8, y + 28 + i * (fs + 6), w - 14); });
}

// Gọi mỗi khung hình từ updateStory
function updateOps(dt) {
    if (objState === 'BASE_DEF') updateBase(dt);
    else if (objState === 'LAST_STAND') updateLastStand(dt);
    if (outposts.length) updateOutpostsExtra(dt);
}
function opsObjectiveText() {
    let d = base.def;
    if (objState === 'BASE_DEF' && d) {
        let h = d.houseNpc, hpTxt = h ? `🏠 ${Math.max(0, Math.ceil(h.hp))}/${h.maxHp}` : '';
        if (d.endT > 0) return [d.win ? 'ĐÃ GIỮ VỮNG CĂN CỨ!' : 'NHÀ CHÍNH ĐÃ SỤP ĐỔ', d.win ? '#2ecc71' : '#ff4757'];
        if (d.left <= 0 && !zombies.some(z => z.hp > 0)) return [`PHÒNG THỦ: đợt ${Math.min(d.total, d.wave + 1)}/${d.total} tới sau ${Math.ceil(Math.max(0, d.breakT))}s · ${hpTxt}`, '#f1c40f'];
        return [`PHÒNG THỦ ${d.kind === 'bandit' ? 'CƯỚP' : 'ZOMBIE'}: đợt ${d.wave}/${d.total} · ${hpTxt}`, '#ff9f43'];
    }
    if (objState === 'RAID') return [`ĐỘT KÍCH: PHÁ SÀO HUYỆT ${mission.progress}/${mission.required}`, '#ff9f43'];
    if (objState === 'LAST_STAND') { let p = story.props.find(q => q.kind === 'holdpt'); return [p && !p.reached ? 'TIỀN TUYẾN CUỐI CÙNG: tới điểm đánh dấu' : `GIỮ ĐIỂM: ${mission.progress}/${mission.required}s (đứng trong vòng)`, '#f1c40f']; }
    return null;
}
function opsPointers(ptr) {
    if (objState === 'RAID') for (let op of outposts) if (!op.dead) ptr(op.x + op.w / 2, op.y + op.h / 2, '#ff9f43');
    if (objState === 'LAST_STAND') { let p = story.props.find(q => q.kind === 'holdpt'); if (p) ptr(p.x, p.y, '#f1c40f'); }
    if (objState === 'BASE_DEF' && base.def && base.def.houseNpc) ptr(BASE.house.x, BASE.house.y, '#ffeaa7');
    if (objState === 'HUB') ptr(BASE.shopBase.x, BASE.shopBase.y, '#f39c12');
}
