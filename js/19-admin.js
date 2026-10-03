// ============================================================================
// 19-admin.js — ADMIN / TEST MOD
//  Mở: nhấn GIỮ nút "WIKI & HƯỚNG DẪN" ở menu chính 5 giây -> nhập mật khẩu.
//  Mở khoá xong (tới khi đóng tab): nút 🛠 nổi trong trận hoặc phím F8 để mở lại bảng.
//  Lưu ý: game chạy hoàn toàn ở máy người chơi nên mật khẩu chỉ chặn người chơi bình thường,
//  không phải bảo mật thật (mã nguồn ai cũng đọc được). Ở đây chỉ lưu mã băm, không lưu mật khẩu.
// ============================================================================
const ADM_HASH = 1127480450;
function admHash(s) { let h = 0x811c9dc5; for (const c of new TextEncoder().encode('zs-admin:' + s)) { h ^= c; h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; }
let adm = { on: false, god: false, speed: 1, debug: false, paused: false };
try { adm.on = sessionStorage.getItem('zs_adm') === '1'; } catch (e) { }

// ---------------------------------------------------------------------------
// GIỮ NÚT WIKI 5 GIÂY
// ---------------------------------------------------------------------------
(function admLongPress() {
    let btn = document.querySelector('button[onclick^="toggleGuideModal(true)"]'); if (!btn) return;
    let label = btn.innerHTML, timer = null, tick = null, t0 = 0, fired = false;
    btn.style.userSelect = 'none'; btn.style.webkitUserSelect = 'none'; btn.style.webkitTouchCallout = 'none';
    const stop = () => { clearTimeout(timer); clearInterval(tick); timer = tick = null; btn.innerHTML = label; };
    btn.addEventListener('pointerdown', () => {
        stop(); fired = false; t0 = Date.now();
        tick = setInterval(() => { let s = 5 - Math.floor((Date.now() - t0) / 1000); if (Date.now() - t0 > 1200) btn.innerHTML = `🔒 giữ thêm ${s}s...`; }, 200);
        timer = setTimeout(() => { stop(); fired = true; admOpenLogin(); }, 5000);
    });
    for (let ev of ['pointerup', 'pointerleave', 'pointercancel']) btn.addEventListener(ev, () => { if (timer) stop(); });
    btn.addEventListener('contextmenu', e => e.preventDefault());
    // nhấn giữ đủ 5s thì không mở bảng Wiki
    window.addEventListener('click', e => { if (fired && e.target.closest && e.target.closest('button') === btn) { e.preventDefault(); e.stopImmediatePropagation(); fired = false; } }, true);
})();

function admModal(id, html, width = 560) {
    let el = document.getElementById(id);
    if (!el) {
        el = document.createElement('div'); el.id = id;
        el.style.cssText = 'position:fixed;inset:0;z-index:90;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;padding:12px';
        document.body.appendChild(el);
    }
    el.innerHTML = `<div style="width:min(${width}px,96vw);max-height:92vh;overflow:auto;background:#0f172a;border:2px solid #f59e0b;border-radius:14px;padding:14px;color:#e2e8f0;font:13px Arial,sans-serif">${html}</div>`;
    el.style.display = 'flex';
    return el;
}
function admOpenLogin() {
    if (adm.on) { admOpenPanel(); return; }
    let el = admModal('admLogin', `<div style="font-weight:bold;color:#f59e0b;font-size:16px;margin-bottom:8px">🛠 ADMIN / TEST MOD</div>
        <input id="admPass" type="password" placeholder="Mật khẩu" autocomplete="off" style="width:100%;padding:8px;border-radius:8px;background:#1e293b;border:1px solid #475569;color:#fff">
        <div id="admErr" style="color:#f87171;min-height:18px;margin-top:4px"></div>
        <div style="display:flex;gap:8px;justify-content:flex-end"><button onclick="document.getElementById('admLogin').style.display='none'" style="${ADM_BTN}background:#334155">Huỷ</button><button onclick="admTryLogin()" style="${ADM_BTN}background:#b45309">Mở khoá</button></div>`, 360);
    let inp = el.querySelector('#admPass'); inp.focus();
    inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') admTryLogin(); });
}
function admTryLogin() {
    let v = document.getElementById('admPass').value;
    if (admHash(v) !== ADM_HASH) { document.getElementById('admErr').textContent = 'Sai mật khẩu.'; Sound.play('hit'); return; }
    adm.on = true; try { sessionStorage.setItem('zs_adm', '1'); } catch (e) { }
    document.getElementById('admLogin').style.display = 'none';
    Sound.play('level'); admOpenPanel();
}

// ---------------------------------------------------------------------------
// BẢNG ĐIỀU KHIỂN
// ---------------------------------------------------------------------------
const ADM_BTN = 'padding:6px 10px;border-radius:8px;border:1px solid #64748b;color:#fff;font-weight:bold;font-size:12px;cursor:pointer;';
const ADM_BOSSES = { 30: 'Khổng Lồ', 31: 'Lõi Quá Tải', 32: 'The Leader', 35: 'Tàn Vết Chớp', 36: 'ZAP-1624', 37: 'The Hucker', 50: 'The Dead' };
const ADM_ROUTES = { balanced: 'Map thường (An Toàn)', hunt: 'Săn Mồi', rescue: 'Giải Cứu', power: 'Nhà Máy Điện', hangz: 'Hang Z', mine: 'Hầm Mỏ (Kiến Chúa)', botanical: 'Vườn Thực Vật', cityn: 'Thành Phố N', labz: 'Phòng Thí Nghiệm Z (Hucker + tàu)', bandit: 'Thị Trấn Cướp', base: 'Phòng Thủ Căn Cứ' };
function admInGame() { return players.length > 0 && ['PLAYING', 'PAUSED', 'SHOP', 'UPGRADE'].includes(gameState); }
function admOpenPanel() {
    if (!adm.on) return;
    if (gameState === 'PLAYING') { setPaused(true); adm.paused = true; document.getElementById('pauseOverlay').style.display = 'none'; }
    const b = (label, fn, col = '#334155') => `<button onclick="${fn}" style="${ADM_BTN}background:${col}">${label}</button>`;
    const sec = (t, body) => `<div style="margin-top:10px;padding:8px;border:1px solid #334155;border-radius:10px"><div style="color:#fbbf24;font-weight:bold;margin-bottom:6px">${t}</div><div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">${body}</div></div>`;
    const sel = (id, obj) => `<select id="${id}" style="padding:5px;border-radius:6px;background:#1e293b;color:#fff;border:1px solid #475569;max-width:220px">${Object.keys(obj).map(k => `<option value="${k}">${obj[k]}</option>`).join('')}</select>`;
    let weps = {}; for (let k in WEAPON_TYPES) weps[k] = WEAPON_TYPES[k].name;
    let cards = {}; for (let u of UPGRADES) cards[u.id] = `${u.name} (${u.type})`;
    let zt = {}; for (let k in ZOMBIE_LABELS) zt[k] = ZOMBIE_LABELS[k];
    let wt = {}; for (let k = 1; k <= 13; k++) if (k !== 8) wt[k] = getWeatherName(k);
    let st = admInGame() ? `Map ${currentLevel} · ${getMapName()} · ${objState} · ⚙ ${shopScrap} · 🏘 ${base.pop | 0} · 🧱 ${base.mat | 0}` : 'Chưa vào trận — các nút trong trận sẽ tự mở lượt chơi mới (1 người PC).';
    admModal('admPanel', `<div style="display:flex;justify-content:space-between;align-items:center"><div style="font-weight:bold;color:#f59e0b;font-size:16px">🛠 ADMIN / TEST MOD</div>${b('✕ Đóng (F8)', 'admClose()', '#7f1d1d')}</div>
        <div style="color:#94a3b8;margin-top:4px">${st}${NET.mode === 'guest' ? '<br><b style="color:#f87171">Đang là khách online: chỉ chủ phòng mới đổi được trận.</b>' : ''}</div>
        ${sec('💰 TÀI NGUYÊN', b('+500 ⚙', "admDo('scrap')") + b('+5 ◆ Mảnh Bức Phá', "admDo('shard')") + b('+10 🏘 cư dân', "admDo('pop')") + b('+50 🧱 vật liệu', "admDo('mat')") + b('Mở mọi bản đồ & hầm mỏ', "admDo('unlock')"))}
        ${sec('🧍 NHÂN VẬT', b(adm.god ? '🛡 Bất tử: BẬT' : '🛡 Bất tử: TẮT', "admDo('god')", adm.god ? '#15803d' : '#334155') + b('Hồi đầy máu & no', "admDo('heal')") + b('+1 cấp (+1 lượt chọn thẻ)', "admDo('lvl')") + b('Thẻ ngẫu nhiên', "admDo('rcard')")
            + '<span style="width:100%"></span>' + sel('admCard', cards) + b('Nhận thẻ', "admDo('card')") + '<span style="width:100%"></span>' + sel('admWep', weps) + b('Nhận vũ khí', "admDo('wep')") + b('Rèn +1', "admDo('forge')"))}
        ${sec('⚔ TRẬN ĐẤU', b('Hạ toàn bộ quái thường', "admDo('kill')") + b('Boss còn 10% máu', "admDo('boss10')") + b('Hoàn thành nhiệm vụ', "admDo('win')") + b('Trực thăng tới ngay', "admDo('heli')") + b('Về Khu Sống Sót', "admDo('hub')")
            + '<span style="width:100%"></span>Tốc độ game: ' + [0.5, 1, 2, 3].map(s => b('x' + s, `admDo('speed',${s})`, adm.speed === s ? '#1d4ed8' : '#334155')).join('')
            + '<span style="width:100%"></span>' + sel('admWeather', wt) + b('Đổi thời tiết', "admDo('weather')")
            + '<span style="width:100%"></span>' + b(adm.debug ? '📊 Thông tin debug: BẬT' : '📊 Thông tin debug: TẮT', "admDo('debug')", adm.debug ? '#15803d' : '#334155'))}
        ${sec('👾 GỌI QUÁI / BOSS', sel('admZ', zt) + 'x<input id="admZN" type="number" value="5" min="1" max="60" style="width:52px;padding:4px;border-radius:6px;background:#1e293b;color:#fff;border:1px solid #475569"><label><input id="admMut" type="checkbox"> biến dị</label>' + b('Gọi quái', "admDo('spawn')")
            + '<span style="width:100%"></span>' + sel('admBoss', ADM_BOSSES) + b('Gọi boss', "admDo('boss')") + '<span style="color:#94a3b8;font-size:11px">Kiến Chúa: nhảy tới Hầm Mỏ bên dưới</span>')}
        ${sec('🗺 NHẢY TỚI MAP', 'Map số <input id="admLvl" type="number" value="' + Math.max(1, currentLevel + 1) + '" min="1" max="60" style="width:60px;padding:4px;border-radius:6px;background:#1e293b;color:#fff;border:1px solid #475569">' + sel('admRoute', ADM_ROUTES) + b('Đi ngay', "admDo('jump')", '#b45309') + '<span style="color:#94a3b8;font-size:11px;width:100%">Map chia hết cho 5 luôn là Phòng Thủ Căn Cứ nên tuyến khác sẽ tự lùi sang map kế tiếp.</span>')}
        ${sec('🎓 KHÁC', b('Bật lại hướng dẫn người mới', "admDo('tut')") + b('Khoá lại Admin', "admDo('lock')", '#7f1d1d'))}`, 640);
}
function admClose() {
    let el = document.getElementById('admPanel'); if (el) el.style.display = 'none';
    if (adm.paused && gameState === 'PAUSED') setPaused(false);
    adm.paused = false;
}
function admEnsureRun() { if (!admInGame()) { admClose(); startCampaign(true); } }
function admToast(t) { netToast('🛠 ' + t, 1800); }
function admDo(k, arg) {
    const val = (id) => { let e = document.getElementById(id); return e ? e.value : ''; };
    const P = () => players.filter(p => p);
    let keepOpen = true;
    switch (k) {
        case 'scrap': shopScrap += 500; break;
        case 'shard': breakthroughShards += 5; break;
        case 'pop': base.pop = (base.pop | 0) + 10; break;
        case 'mat': base.mat = (base.mat | 0) + 50; break;
        case 'unlock':
            for (let r in ROUTE_MAPS) ownedMaps[r] = true; hasPowerPlantMap = true; mineUnlocked = true;
            try { localStorage.setItem('zs_mine_unlocked', '1'); } catch (e) { }
            break;
        case 'god': adm.god = !adm.god; break;
        case 'heal': admEnsureRun(); for (let p of P()) { p.isDowned = false; p.hp = p.maxHp; p.hunger = 100; } break;
        case 'lvl': admEnsureRun(); for (let p of P()) { p.level++; p.pendingUpgrades++; } admToast('Lượt chọn thẻ sẽ hiện khi hết map.'); break;
        case 'rcard': admEnsureRun(); { let u = UPGRADES[Math.floor(Math.random() * UPGRADES.length)]; applyUpgrade(players[0], u.id); admToast('Nhận thẻ: ' + u.name); } break;
        case 'card': admEnsureRun(); { let u = UPGRADES.find(x => x.id === val('admCard')); if (u) { applyUpgrade(players[0], u.id); admToast('Nhận thẻ: ' + u.name); } } break;
        case 'wep': admEnsureRun(); { let w = WEAPON_TYPES[val('admWep')]; if (w) { players[0].weapon = { ...w }; admToast('Nhận ' + w.name); } } break;
        case 'forge': { let w = players[0] && players[0].weapon; if (w) { base.wlv = base.wlv || {}; base.wlv[w.name] = Math.min(FORGE_MAX, forgeLevel(w.name) + 1); admToast(`${w.name} rèn +${base.wlv[w.name]}`); } } break;
        case 'kill': for (let z of zombies) if (z.hp > 0 && !isBossType(z.type)) { z.hp = 0; zombieDown(z, players[0]); } break;
        case 'boss10': for (let z of zombies) if (z.hp > 0 && isBossType(z.type) && z.type !== 46) { z.hp = Math.max(2, z.maxHp * 0.1); z._hpPrev = z.hp; if (z.armor) z.armor = 0; } break;
        case 'win': if (admInGame() && mission) { mission.complete = false; completeMission(); } break;
        case 'heli': if (objState === 'WAITING') evacTimer = 0.05; else admToast('Chỉ dùng khi đang chờ trực thăng.'); break;
        case 'hub': if (admInGame()) { admClose(); shopOpenedForLevel = 0; openRouteShop(); keepOpen = false; } break;
        case 'speed': adm.speed = arg || 1; break;
        case 'weather': admEnsureRun(); currentWeather = +val('admWeather') || 1; break;
        case 'debug': adm.debug = !adm.debug; break;
        case 'spawn': admEnsureRun(); {
            let t = +val('admZ'), n = Math.max(1, Math.min(60, +val('admZN') || 1)), mut = document.getElementById('admMut').checked, p = players[0];
            for (let i = 0; i < n; i++) { let a = Math.random() * Math.PI * 2, sp = findSafePoint(p.x + Math.cos(a) * 420, p.y + Math.sin(a) * 420, 20); let z = new Zombie(sp.x, sp.y, t); if (mut) makeMutant(z), z.hp = z.maxHp; zombies.push(z); }
        } break;
        case 'boss': admEnsureRun(); admClose(); keepOpen = false; admSpawnBoss(+val('admBoss')); break;
        case 'jump': { let L = Math.max(1, Math.min(60, +val('admLvl') || 1)), r = val('admRoute'); admClose(); keepOpen = false; admJump(L, r); } break;
        case 'tut': try { localStorage.removeItem('zs_tut_done'); } catch (e) { } refreshTutUI(); tutStart(); break;
        case 'lock': adm.on = false; adm.god = false; adm.speed = 1; adm.debug = false; try { sessionStorage.removeItem('zs_adm'); } catch (e) { } admClose(); keepOpen = false; break;
    }
    Sound.play('select');
    if (keepOpen && document.getElementById('admPanel') && document.getElementById('admPanel').style.display !== 'none') admOpenPanel();
    if (NET.mode === 'host') netSendSync();
}
function admSpawnBoss(t) {
    let p = players[0], a = Math.random() * Math.PI * 2, sp = findSafePoint(p.x + Math.cos(a) * 420, p.y + Math.sin(a) * 420, 60);
    if (t === 36) {
        story.props.push({ kind: 'core', x: p.x, y: p.y + 160, r: 60, hp: 1, maxHp: 1, on: true });
        story.zx = { jam: 0, held: 0, spawnT: 1.5, spear: 0, final: 0 };
        objState = 'ZAP_BOSS'; mission.type = 'ZAP_BOSS'; mission.required = 1; mission.progress = 0; mission.complete = false;
    }
    zombies.push(new Zombie(sp.x, sp.y, t));
}
// Nhảy tới map bất kỳ theo tuyến (dùng đúng luồng chọn tuyến của game)
function admJump(L, route) {
    if (!admInGame()) startCampaign(true);
    for (let r in ROUTE_MAPS) ownedMaps[r] = true; hasPowerPlantMap = true; mineUnlocked = true;
    for (let p of players) p.pendingUpgrades = 0;
    if (route === 'base') L = Math.max(5, Math.ceil(L / 5) * 5);
    else if (L % 5 === 0 && L >= 5) L++;   // map chia hết cho 5 là Phòng Thủ Căn Cứ
    powerPlantRun.active = false; nextMapPreference = null; nextMissionPreference = null;
    nextRoute = route === 'base' ? 'balanced' : route;
    currentLevel = L - 1; shopOpenedForLevel = currentLevel;
    document.getElementById('upgradeScreen').style.display = 'none';
    document.getElementById('menu').style.display = 'none';
    loopToken++;
    continueAfterShop();
    admToast(`Nhảy tới map ${L} — ${ADM_ROUTES[route]}`);
}

// ---------------------------------------------------------------------------
// BẤT TỬ, TỐC ĐỘ GAME, THÔNG TIN DEBUG, NÚT 🛠 TRONG TRẬN
// ---------------------------------------------------------------------------
(function admHooks() {
    const P = Player.prototype;
    const td = P.takeDamage, tdot = P.takeDot, gd = P.goDown;
    P.takeDamage = function (a) { if (adm.god) return; return td.call(this, a); };
    P.takeDot = function (a) { if (adm.god) return; return tdot.call(this, a); };
    P.goDown = function () { if (adm.god) { this.hp = this.maxHp; return; } return gd.call(this); };
    const ts = bossTimeScale;
    bossTimeScale = function (dt) { return ts(dt) * adm.speed; };
})();
let admBtn = null, admDbg = null, admFps = { n: 0, t: performance.now(), v: 0 };
(function admFpsLoop() { admFps.n++; let now = performance.now(); if (now - admFps.t >= 1000) { admFps.v = admFps.n; admFps.n = 0; admFps.t = now; } requestAnimationFrame(admFpsLoop); })();
setInterval(() => {
    if (adm.god) for (let p of players) if (p) { p.hp = p.maxHp; p.hunger = Math.max(p.hunger, 90); if (p.isDowned) { p.isDowned = false; } }
    if (!admBtn) {
        admBtn = document.createElement('button'); admBtn.textContent = '🛠';
        admBtn.title = 'Admin / Test (F8)';
        admBtn.style.cssText = 'position:fixed;top:8px;right:168px;z-index:55;width:36px;height:36px;border-radius:10px;background:rgba(180,83,9,0.9);border:2px solid #fbbf24;color:#fff;font-size:18px;display:none';
        admBtn.onclick = admOpenPanel; document.body.appendChild(admBtn);
        admDbg = document.createElement('div');
        admDbg.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:55;background:rgba(0,0,0,0.7);color:#a3e635;font:11px monospace;padding:6px 8px;border-radius:8px;pointer-events:none;display:none;white-space:pre';
        document.body.appendChild(admDbg);
    }
    let show = adm.on && ['PLAYING', 'PAUSED', 'SHOP'].includes(gameState) && !(document.getElementById('admPanel') && document.getElementById('admPanel').style.display === 'flex');
    admBtn.style.display = show ? 'block' : 'none';
    if (adm.on && adm.debug && players.length) {
        let p = players[0];
        admDbg.style.display = 'block';
        admDbg.textContent = `FPS ${admFps.v} · tốc độ x${adm.speed}${adm.god ? ' · BẤT TỬ' : ''}\nMap ${currentLevel} loại ${currentMapType} · ${objState} · ${gameState}\nThời tiết ${currentWeather} ${getWeatherName()} · quái ${zombies.length} · đạn ${bullets.length} · hazard ${hazards.length}\nVị trí ${Math.round(p.x)}, ${Math.round(p.y)} · máu ${Math.round(p.hp)}/${Math.round(p.maxHp)}\nDanh sách quái: ${rosterText() || '—'}`;
    } else if (admDbg) admDbg.style.display = 'none';
}, 200);
window.addEventListener('keydown', e => {
    if (e.code !== 'F8' || !adm.on) return;
    e.preventDefault();
    let el = document.getElementById('admPanel');
    if (el && el.style.display === 'flex') admClose(); else admOpenPanel();
});
