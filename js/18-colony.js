// ============================================================================
// 18-colony.js
//  - Mỗi map chỉ 1-4 loại quái (dễ phân biệt), hiện danh sách ở thẻ giới thiệu map
//  - Map ngẫu nhiên không lặp lại liên tục; Thị Trấn Cướp / Vườn Thực Vật / Thành Phố N chỉ vào vòng ngẫu nhiên khi đã mua bản đồ
//  - CƯ DÂN: người được giải cứu về căn cứ. Ụ súng cần cư dân vận hành, người còn lại làm THỢ: chế tạo 🧱 Vật Liệu
//    sau mỗi chiến dịch và sửa Nhà Chính khi bị tấn công. Nâng Nhà Chính cần đủ dân; LÒ RÈN nâng cấp vũ khí
//  - Hướng dẫn người mới (lần đầu chơi)
//  - ZAP-1624: chuỗi dịch chuyển để lại vệt điện, nháy 3-5 lần rồi mới dừng lại ra đòn; pha cuối bỏ chạy về Máy Phát Điện
//  - Hầm Mỏ: Kiến Chúa chết thì hang rung lắc dữ dội
// ============================================================================

// ---------------------------------------------------------------------------
// LOẠI QUÁI CỦA MAP
// ---------------------------------------------------------------------------
const ZOMBIE_LABELS = { 0: 'Xác Sống', 1: 'Xác Béo', 2: 'Phun Độc', 3: 'Chạy Nhanh', 4: 'Giáp Sắt', 5: 'Bóng Ma', 6: 'Triệu Hồi', 7: 'Xác Con', 8: 'Cung Thủ', 9: 'Shotgun', 10: 'Lao Húc', 11: 'Bất Tử', 12: 'Cướp', 13: 'Lính Cứu Hỏa', 14: 'Bọc Thép', 15: 'Nhầy Nhụa', 16: 'Điện Quang', 17: 'Cú Sốc', 18: 'Acidier', 20: 'Kẻ Lang Thang', 21: 'Bóng Đen', 22: 'Móng Vuốt', 26: 'Witch', 27: 'Crusher', 28: 'Electrical', 29: 'E.L', 33: 'Thợ Mỏ', 34: 'Boomer' };
// Bể loại quái theo cấp & loại map (trước đây nằm trong constructor Zombie)
function zombieTypePool() {
    let pool = [0, 8];
    if (currentLevel >= 5) {
        pool.push(2, 5, 1, 7, 3, 4, 6);
        if (currentMapType === 1) pool.push(10, 10);
        if (currentMapType === 2) pool.push(9, 9);
        if (currentMapType === 3) pool.push(11, 11);
        if (currentMapType === 6) pool.push(16, 16, 17, 17);
        if (currentMapType === 7) pool.push(21, 21, 22, 22);
        if (currentMapType === 8) pool.push(12, 12, 20);
        if (currentMapType === 5) pool.push(13, 13);
        if (currentLevel >= 6) pool.push(14, 14);
        if (currentLevel >= 8) pool.push(15, 15);
        pool.push(34, 18, 18);
        if (currentLevel >= 6) pool.push(26, 33);
        if (currentLevel >= 7) pool.push(27);
        if (currentMapType === 6) pool.push(28, 29, 29);
        if (currentMapType === 10) pool.push(33, 33, 21);
    }
    return pool;
}
let mapRoster = null;
// Chọn 1-4 loại cho cả map: luôn có Xác Sống, ưu tiên loại đặc trưng của map (xuất hiện nhiều lần trong bể)
function buildMapRoster() {
    let cnt = {};
    for (let t of zombieTypePool()) cnt[t] = (cnt[t] || 0) + 1;
    let want = currentLevel >= 9 ? 3 : (currentLevel >= 5 ? 2 : 1);
    // bỏ 6 (Triệu Hồi), 15 (Nhầy Nhụa): chúng tự đẻ thêm loại khác -> vượt 4 loại
    let sp = Object.keys(cnt).map(Number).filter(t => t !== 0 && t !== 7 && t !== 6 && t !== 15).map(t => ({ t, s: cnt[t] + Math.random() * 1.6 }));
    sp.sort((a, b) => b.s - a.s);
    mapRoster = [0].concat(sp.slice(0, want).map(o => o.t));
    return mapRoster;
}
function rosterPick() {
    let r = mapRoster || buildMapRoster();
    if (r.length === 1 || Math.random() < 0.4) return r[0];
    let t = r[1 + Math.floor(Math.random() * (r.length - 1))];
    if (t === 18 && zombies.filter(z => z.type === 18 && z.hp > 0).length >= 5) t = r[0];   // tối đa 5 Acidier trên map
    return t;
}
function rosterText() {
    if (!mapRoster || currentMapType === 14 || currentMapType === 16) return '';
    return mapRoster.map(t => ZOMBIE_LABELS[t] || ('#' + t)).join(' · ');
}

// ---------------------------------------------------------------------------
// MAP NGẪU NHIÊN: không lặp lại liên tục, map mua bằng bản đồ chỉ vào vòng khi đã mua
// ---------------------------------------------------------------------------
const MAP_NEEDS = { 5: 'bandit', 12: 'botanical', 13: 'cityn' };
function pickRandomMap(list) {
    let pool = list.filter(t => !MAP_NEEDS[t] || ownedMaps[MAP_NEEDS[t]]);
    let recent = base.rm || (base.rm = []);
    let fresh = pool.filter(t => !recent.slice(-Math.min(3, pool.length - 1)).includes(t));
    if (!fresh.length) fresh = pool.length ? pool : list;
    let t = fresh[Math.floor(Math.random() * fresh.length)];
    return t;
}
function noteMapPlayed(t) {
    let r = base.rm || (base.rm = []);
    r.push(t); if (r.length > 6) r.shift();
}

// ---------------------------------------------------------------------------
// CƯ DÂN & CĂN CỨ
// ---------------------------------------------------------------------------
const HOUSE_POP = [0, 2, 4, 6, 9, 12];   // số cư dân cần để lên cấp Nhà Chính 1..5
const FORGE_MAX = 5;
function basePop() { return NET.mode === 'guest' ? (story.bp | 0) : (base.pop | 0); }
function baseTurretList() { return NET.mode === 'guest' ? (story.bs || []) : base.turrets; }
function turretOperators() { return Math.min(basePop(), baseTurretList().filter(t => t).length); }
function baseWorkers() { return Math.max(0, basePop() - turretOperators()); }
// Ụ súng được vận hành theo thứ tự ô; thiếu dân thì các ụ cuối bỏ trống
function turretManned(i) {
    let list = baseTurretList(), k = 0;
    if (!list[i]) return false;
    for (let j = 0; j <= i; j++) if (list[j]) k++;
    return k <= basePop();
}
function houseMat() { return 3 * (base.house + 1); }
function turretMat(l) { return l >= 3 ? 5 * (l - 2) : 0; }
function forgeLevel(name) { return (base.wlv && base.wlv[name]) | 0; }
function forgeMult(wd) { return wd && wd.name && base.wlv ? 1 + 0.12 * forgeLevel(wd.name) : 1; }
function forgeCost(l) { return { scrap: 20 * (l + 1), mat: 3 * (l + 1) }; }

// Về trại sau chiến dịch: người được cứu dọn về căn cứ, thợ nộp vật liệu
function colonyArrive() {
    if (NET.mode === 'guest' || base.arr === currentLevel) return;
    base.arr = currentLevel;
    let n = rescueNPCs.filter(r => r.hp > 0 && r.rescued && !r.isStory).length;
    let L = story.lab;
    if (L && L.result && L.result.ok && L.sciSaved) n += L.sciSaved;
    let w = baseWorkers(), mat = w * 2;
    base.mat = (base.mat | 0) + mat;
    base.wait = (base.wait | 0) + n;
    let moved = colonySettle();   // chỉ ở lại được khi đủ NHÀ Ở và LƯƠNG THỰC
    if (n || mat) netToast(`🏘 ${n ? `${n} người được giải cứu đã về căn cứ${moved < n ? ` — ${base.wait} người đang chờ vì thiếu nhà ở / nông trại` : ''}. ` : ''}${mat ? `${w} thợ chế tạo được +${mat} 🧱 Vật Liệu.` : ''}`, 5500);
}
// Thủ thành: thợ sửa Nhà Chính
function colonyDefTick(dt, h) {
    let w = Math.min(8, baseWorkers());
    if (w > 0 && h && h.hp > 0 && h.hp < h.maxHp) {
        h.hp = Math.min(h.maxHp, h.hp + h.maxHp * 0.003 * w * dt);
        if (Math.random() < dt * 2) createParticles(h.x + (Math.random() - 0.5) * 160, h.y + (Math.random() - 0.5) * 100, '#f1c40f', 2, 80);
    }
}
function forgeBuy(pi) {
    let p = players[pi], w = p && p.weapon;
    if (!w || !w.name) return;
    base.wlv = base.wlv || {};
    let l = forgeLevel(w.name), c = forgeCost(l);
    if (l >= FORGE_MAX) return;
    if (shopScrap < c.scrap || (base.mat | 0) < c.mat) { Sound.play('hit'); netToast('Không đủ phế liệu hoặc vật liệu!', 1500); return; }
    shopScrap -= c.scrap; base.mat -= c.mat; base.wlv[w.name] = l + 1;
    if (w.maxAmmo) w.ammo = w.maxAmmo;   // rèn xong: nạp đầy / sửa lại độ bền
    Sound.play('anvil'); Sound.play('upgrade');
    renderBasePanel(); netSendSync();
}
// Phần thêm vào bảng Xưởng Căn Cứ
function colonyPanelTop() {
    let ops = turretOperators(), w = baseWorkers(), need = base.house < 5 ? HOUSE_POP[base.house + 1] : 0;
    return `<div class="p-2 mb-3 rounded-lg bg-amber-950/60 border border-amber-600 text-xs text-white">
        <b>🏘 Cư dân: ${basePop()}/${colonyCap()}</b> — ${ops} vận hành ụ súng · ${w} thợ${base.wait ? ` · <b class="text-red-300">${base.wait} người đang chờ chỗ ở</b>` : ''} &nbsp; | &nbsp; <b>🧱 Vật Liệu: ${base.mat | 0}</b><br>
        <span class="text-gray-300">Người bạn giải cứu (nhiệm vụ Giải Cứu, Nhà Khoa Học) sẽ về đây. Mỗi ụ súng cần 1 người vận hành, thiếu người thì ụ không bắn.
        Thợ chế tạo 2 🧱 mỗi chiến dịch và sửa Nhà Chính khi bị tấn công.${need ? ` Nhà Chính cấp ${base.house + 1} cần <b class="text-amber-300">${need} cư dân</b>.` : ''}</span></div>`;
}
function colonyPanelForge() {
    let rows = '';
    players.forEach((p, i) => {
        let w = p.weapon;
        if (!w || !w.name) { rows += `<div class="text-xs text-gray-500">P${i + 1}: tay không — nhặt vũ khí rồi quay lại rèn.</div>`; return; }
        let l = forgeLevel(w.name), c = forgeCost(l), ok = shopScrap >= c.scrap && (base.mat | 0) >= c.mat;
        rows += `<div class="p-2 rounded-lg bg-slate-900/80 border border-slate-600 flex items-center justify-between gap-2"><div class="text-xs text-white"><b>${players.length > 1 ? 'P' + (i + 1) + ': ' : ''}${w.name}</b> rèn ${l}/${FORGE_MAX}<br><span class="text-gray-400">Sát thương +${l * 12}% (áp cho mọi khẩu cùng loại cả lượt chơi)</span></div>${l < FORGE_MAX ? `<button class="px-2 py-2 rounded-lg text-xs font-bold border ${ok ? 'bg-orange-700 border-orange-400 text-white' : 'bg-gray-800 border-gray-600 text-gray-500'}" onclick="forgeBuy(${i})">Rèn ⚙${c.scrap} 🧱${c.mat}</button>` : '<span class="text-emerald-400 text-xs font-bold">TỐI ĐA</span>'}</div>`;
    });
    let lv = Object.keys(base.wlv || {}).filter(k => base.wlv[k] > 0).map(k => `${k} +${base.wlv[k]}`).join(' · ');
    return `<div class="mt-3 mb-1 text-sm font-bold text-orange-300">🔨 LÒ RÈN — nâng cấp vũ khí</div><div class="space-y-2">${rows}</div>${lv ? `<p class="text-[11px] text-gray-400 mt-1">Đã rèn: ${lv}</p>` : ''}`;
}
const _renderBasePanel0 = renderBasePanel;
renderBasePanel = function () {
    _renderBasePanel0();
    let box = document.getElementById('baseItems'); if (!box) return;
    box.insertAdjacentHTML('afterbegin', colonyPanelTop() + colonyPanelForge() + '<div class="mb-3"></div>');
};
// Cư dân đi lại trong trại: thợ quanh Xưởng, người vận hành đứng cạnh ụ súng (chỉ là hình ảnh, khách tự vẽ theo số dân)
function drawResidents(T) {
    drawColonyBuildings(T);   // nhà ở, nông trại, tháp canh
    let n = Math.min(16, basePop()), list = baseTurretList(), ops = [];
    list.forEach((t, i) => { if (t && turretManned(i)) ops.push(i); });
    for (let k = 0; k < n; k++) {
        let x, y, job;
        if (k < ops.length) { let s = BASE_SLOTS[ops[k]]; x = s[0] - 26; y = s[1] + 18; job = '🎯'; if (objState !== 'BASE_DEF' && ops[k] >= 2 && ops[k] < 8) continue; }
        else {
            let a = T * 0.25 + k * 2.39, home = k % 2 ? BASE.shopBase : BASE.house;
            x = home.x + Math.cos(a) * (90 + (k * 37) % 70) + Math.sin(T * 0.7 + k) * 20;
            y = home.y + 70 + Math.sin(a * 1.3) * 50; job = k % 2 ? '🔨' : '🧺';
        }
        let bob = Math.sin(T * 6 + k) * 1.5;
        drawShadow(x, y + 6, 8);
        ctx.beginPath(); ctx.arc(x, y + bob, 8, 0, Math.PI * 2); ctx.fillStyle = ['#f5cd79', '#e17055', '#74b9ff', '#a29bfe', '#55efc4'][k % 5]; ctx.fill();
        ctx.strokeStyle = '#2d3436'; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y - 3 + bob, 4, 0, Math.PI * 2); ctx.fillStyle = '#f8c291'; ctx.fill();
        ctx.font = '10px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText(job, x + 10, y - 10 + bob);
    }
}

// ---------------------------------------------------------------------------
// HƯỚNG DẪN NGƯỜI MỚI
// ---------------------------------------------------------------------------
function tutTouch() { return typeof showTouchUI !== 'undefined' && showTouchUI; }
const TUT_STEPS = [
    { when: () => gameState === 'PLAYING' && objState !== 'HUB' && levelStartTimer <= 0 && mapIntro.timer <= 0, text: () => tutTouch() ? '🕹 Kéo CẦN ANALOG bên trái để di chuyển.' : '🕹 Di chuyển bằng phím W A S D.', done: (s) => s.moved > 260, max: 30 },
    { when: () => gameState === 'PLAYING', text: () => tutTouch() ? '🔫 Bấm giữ nút A để bắn — súng tự ngắm quái gần nhất. Hạ 3 con zombie.' : '🔫 Ngắm bằng CHUỘT, giữ chuột trái để bắn. Hạ 3 con zombie.', done: (s) => killCount >= s.k0 + 3, max: 40 },
    { when: () => gameState === 'PLAYING', text: () => '📋 Băng chữ vàng trên cùng là NHIỆM VỤ của map. Mũi tên ở mép màn hình chỉ đường tới mục tiêu.', max: 8 },
    { when: () => gameState === 'PLAYING', text: () => '❓ Hộp tím chứa vũ khí mới · 🍖 thịt hồi no (thanh cam dưới thanh máu) — đói quá sẽ mất máu.', max: 8 },
    { when: () => gameState === 'PLAYING', text: () => tutTouch() ? '⚔ Nút C: kỹ năng vũ khí (có hồi chiêu) · B: ném · D: Nộ (cần thẻ Thịnh Nộ).' : '⚔ Phím Q: kỹ năng vũ khí (có hồi chiêu) · E / chuột phải: ném · R: Nộ (cần thẻ Thịnh Nộ).', max: 9 },
    { when: () => document.getElementById('upgradeScreen').style.display !== 'none' || players.some(p => p.pendingUpgrades > 0), text: () => '⭐ LÊN CẤP: chọn 1 thẻ. Thẻ cùng HỆ (nhãn màu) cộng dồn sẽ mở mốc mạnh — xem Wiki ở menu chính.', max: 9 },
    { when: () => ['WAITING', 'EVAC', 'ROOFTOP'].includes(objState), text: () => '🚁 Xong nhiệm vụ! Trực thăng đang tới — khi nó đáp, cả đội đứng vào VÒNG XANH để rút.', done: () => objState === 'HUB', max: 25 },
    { when: () => objState === 'HUB' && gameState === 'PLAYING', text: () => '🏕 Khu Sống Sót: 🛒 Quầy tiếp tế mua đồ · 🏗 Xưởng: nâng Nhà Chính, ụ súng, RÈN vũ khí — người bạn giải cứu sẽ về đây làm việc · 🗺 Bàn chiến dịch: chọn map rồi xuất phát.', max: 14 }
];
let tut = null, tutEl = null;
function tutEnabled() { try { return localStorage.getItem('zs_tut_done') !== '1'; } catch (e) { return false; } }
function tutFinish() { tut = null; try { localStorage.setItem('zs_tut_done', '1'); } catch (e) { } if (tutEl) tutEl.style.display = 'none'; refreshTutUI(); }
function tutStart() { if (NET.mode === 'guest' || !tutEnabled()) return; tut = { i: 0, t: 0, on: false }; }
function tutNext() { if (!tut) return; tut.i++; tut.t = 0; tut.on = false; if (tut.i >= TUT_STEPS.length) tutFinish(); }
function tutToggle() { try { if (tutEnabled()) localStorage.setItem('zs_tut_done', '1'); else localStorage.removeItem('zs_tut_done'); } catch (e) { } refreshTutUI(); }
function refreshTutUI() { let b = document.getElementById('tutToggleBtn'); if (b) b.textContent = `🎓 Hướng dẫn người mới: ${tutEnabled() ? 'BẬT (hiện ở lượt chơi mới)' : 'TẮT'}`; }
function tutTick() {
    if (!tut || gameState === 'GAMEOVER') { if (tutEl) tutEl.style.display = 'none'; return; }
    let st = TUT_STEPS[tut.i]; if (!st) { tutFinish(); return; }
    if (!tut.on) {
        if (!st.when()) { if (tutEl) tutEl.style.display = 'none'; return; }
        let p = players[NET.localIdx || 0] || players[0];
        tut.on = true; tut.t = 0; tut.x0 = p ? p.x : 0; tut.y0 = p ? p.y : 0; tut.k0 = killCount; tut.moved = 0;
        Sound.play('select');
    }
    if (gameState === 'PLAYING' || gameState === 'SHOP' || document.getElementById('upgradeScreen').style.display !== 'none') tut.t += 0.15;
    let p = players[NET.localIdx || 0] || players[0];
    if (p) tut.moved = Math.max(tut.moved || 0, Math.hypot(p.x - tut.x0, p.y - tut.y0));
    if ((st.done && st.done(tut)) || tut.t >= st.max) { tutNext(); return; }
    if (!tutEl) {
        tutEl = document.createElement('div');
        tutEl.style.cssText = 'position:fixed;left:50%;top:118px;transform:translateX(-50%);z-index:60;max-width:min(560px,92vw);background:rgba(8,12,20,0.92);border:2px solid #f1c40f;border-radius:12px;padding:10px 14px;color:#f1f2f6;font:600 14px Arial,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,0.5);pointer-events:none';
        document.body.appendChild(tutEl);
    }
    tutEl.innerHTML = `<div style="color:#f1c40f;font-size:11px;margin-bottom:4px">🎓 HƯỚNG DẪN ${tut.i + 1}/${TUT_STEPS.length}</div><div>${st.text()}</div>
        <div style="margin-top:8px;display:flex;gap:8px;justify-content:flex-end;pointer-events:auto">
        <button onclick="tutNext()" style="padding:4px 10px;border-radius:8px;background:#2d3436;border:1px solid #636e72;color:#fff;font-size:12px">Tiếp ▶</button>
        <button onclick="tutFinish()" style="padding:4px 10px;border-radius:8px;background:#4a1515;border:1px solid #c0392b;color:#fff;font-size:12px">Tắt hướng dẫn ✕</button></div>`;
    tutEl.style.display = 'block';
}
setInterval(tutTick, 150);

// ---------------------------------------------------------------------------
// ZAP-1624: CHUỖI DỊCH CHUYỂN & PHA BỎ CHẠY
// ---------------------------------------------------------------------------
// Trả về true khi đang nháy (chưa được tấn công); false khi đang DỪNG LẠI ra đòn
function zapBlinkChain(z, target, dt) {
    if (z.zStop > 0) {
        z.zStop -= dt;
        if (!z.zAtk) {
            z.zAtk = true;
            if (Math.random() < 0.6) { enemyBullets.push(new EnemyBullet(z.x, z.y, target.x, target.y, 'electric')); if (z.phase2Done) remnantFork(z, Math.atan2(target.y - z.y, target.x - z.x), 3); }
            else hazards.push({ type: 'strike', x: target.x, y: target.y, radius: 84, timer: 0.7, life: 1.0, dmg: 34, stun: 0.5 });
            if (z.spCD > 0.6) z.spCD = Math.min(z.spCD, 0.6 + Math.random() * 0.5);   // đứng lại thì thường tung thêm chiêu
        }
        return false;
    }
    if (!(z.zN > 0)) {
        z.zN = 3 + Math.floor(Math.random() * 3); z.zT = 0.55;
        Sound.play('charge_up'); createParticles(z.x, z.y, '#74b9ff', 20, 200);
    }
    z.zT -= dt;
    if (Math.random() < dt * 16) createParticles(z.x + (Math.random() - 0.5) * 50, z.y + (Math.random() - 0.5) * 50, '#dff9fb', 1, 90);
    if (z.zT <= 0) {
        zapBlink(z, zapSpot(z, target, 300, 500));
        z.zN--; z.zT = z.phase2Done ? 0.32 : 0.42;
        if (z.zN <= 0) { z.zStop = z.phase2Done ? 1.3 : 1.7; z.zAtk = false; }
    }
    return true;
}
// Vệt dịch chuyển: bóng mờ ở chỗ cũ + các vệt điện kéo tới chỗ mới
function drawZapGhost(v) {
    let a = Math.max(0, v.life / (v.max || 0.7)), r = v.r || 34;
    let dx = v.tx - v.x, dy = v.ty - v.y, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
    ctx.save(); ctx.globalAlpha = a;
    ctx.beginPath(); ctx.arc(v.x, v.y, r, 0, Math.PI * 2); ctx.fillStyle = 'rgba(190, 195, 200, 0.55)'; ctx.fill();
    ctx.strokeStyle = '#48dbfb'; ctx.lineWidth = 3; ctx.stroke();
    ctx.lineCap = 'round';
    for (let k = -2; k <= 2; k++) {
        let off = k * r * 0.42, s0 = r * (0.9 + Math.abs(k) * 0.25), s1 = len - r * (1.1 + Math.abs(k) * 0.35);
        if (s1 <= s0) continue;
        let gap = (k + 2) % 2 ? 0.3 : 0;   // vài vệt đứt quãng như trong hình minh hoạ
        ctx.strokeStyle = k === 0 ? 'rgba(255,255,255,0.9)' : 'rgba(72, 219, 251, 0.9)'; ctx.lineWidth = k === 0 ? 3 : 4;
        ctx.beginPath();
        if (gap) {
            let m = s0 + (s1 - s0) * 0.55;
            ctx.moveTo(v.x + ux * s0 + nx * off, v.y + uy * s0 + ny * off); ctx.lineTo(v.x + ux * m + nx * off, v.y + uy * m + ny * off);
            ctx.moveTo(v.x + ux * (m + 26) + nx * off, v.y + uy * (m + 26) + ny * off); ctx.lineTo(v.x + ux * s1 + nx * off, v.y + uy * s1 + ny * off);
        } else { ctx.moveTo(v.x + ux * s0 + nx * off, v.y + uy * s0 + ny * off); ctx.lineTo(v.x + ux * s1 + nx * off, v.y + uy * s1 + ny * off); }
        ctx.stroke();
    }
    ctx.lineCap = 'butt'; ctx.restore();
}

// Pha cuối: còn 1 máu -> bỏ chạy về Máy Phát Điện, rải sét dọc đường; tới nơi thì sạc. Phá Máy Phát để kết liễu nó.
function zapStartFlee(z) {
    let zx = story.zx; if (!zx || zx.fl) return;
    let A = story.arena || { x: z.x, y: z.y, r: 700 };
    z.storm = null; z.hidden = false; z.warnBeamTimer = 0; z.grounded = 0; z.zStop = 0; z.zN = 0;
    let g = null;
    for (let t = 0; t < 14 && !g; t++) {
        let a = Math.random() * Math.PI * 2, r = 1500 + Math.random() * 400;
        let x = Math.max(450, Math.min(MAP_SIZE.w - 450, A.x + Math.cos(a) * r)), y = Math.max(450, Math.min(MAP_SIZE.h - 450, A.y + Math.sin(a) * r));
        if (Math.hypot(x - A.x, y - A.y) > 1000 && !isBlockedPoint(x, y, 70)) g = { x, y };
    }
    if (!g) g = findSafePoint(MAP_SIZE.w - A.x, MAP_SIZE.h - A.y, 70);
    let hp = 2200 + currentLevel * 250;
    obstacles = obstacles.filter(o => !(o.x < g.x + 120 && o.x + o.w > g.x - 120 && o.y < g.y + 120 && o.y + o.h > g.y - 120) || o.arena);
    story.props.push({ kind: 'zgen', breakable: true, x: g.x, y: g.y, r: 48, hp, maxHp: hp });
    zx.fl = { st: 'run', gx: g.x, gy: g.y, bt: 1.4, lt: 1.2 }; zx.final = 1; zx.fs = 1;
    missionItems = [];
    removeBossArena();
    bossSay(z, 'ZAP-1624 BỎ CHẠY!', '#f9ca24');
    for (let p of players) vfxList.push({ type: 'text', text: 'NÓ BỎ CHẠY VỀ MÁY PHÁT ĐIỆN — ĐUỔI THEO, NÉ SÉT!', x: p.x, y: p.y - 96, life: 3.0, color: '#f9ca24' });
    queueRadio('Tiến sĩ Aegis: Nó cạn năng lượng và đang chạy về Máy Phát Điện dự phòng để sạc! Đuổi theo — PHÁ HỦY MÁY PHÁT là nó chết hẳn!', null, 7);
    Sound.play('thunder'); addScreenShake(18);
}
function zapFleeUpdate(z, target, dt) {
    let zx = story.zx, f = zx.fl, gen = story.props.find(p => p.kind === 'zgen');
    z.invuln = true; z.downed = false; z.kbX = z.kbY = 0;
    let al = players.filter(p => !p.isDowned);
    if (f.st === 'run') {
        zx.final = 1; zx.fs = 1;
        // sét đánh vào chỗ người chơi đang đuổi theo
        f.lt -= dt;
        if (f.lt <= 0) {
            f.lt = 1.0;
            for (let p of al) hazards.push({ type: 'strike', x: p.x + (Math.random() - 0.5) * 120, y: p.y + (Math.random() - 0.5) * 120, radius: 84, timer: 0.85, life: 1.1, dmg: 30, stun: 0.4 });
        }
        f.bt -= dt;
        if (f.bt <= 0) {
            f.bt = 0.9;
            let near = al.length ? Math.min(...al.map(p => Math.hypot(p.x - z.x, p.y - z.y))) : 0;
            if (near < 780) {                                   // chờ người chơi theo kịp
                let dx = f.gx - z.x, dy = f.gy - z.y - 170, d = Math.hypot(dx, dy);
                if (d <= 320) {
                    zapBlink(z, { x: f.gx, y: f.gy - 170 });
                    f.st = 'dock'; f.t = 30; zx.fs = 2;
                    bossSay(z, 'SẠC NĂNG LƯỢNG!', '#48dbfb');
                    for (let p of players) vfxList.push({ type: 'text', text: 'NÓ ĐANG SẠC — PHÁ HỦY MÁY PHÁT ĐIỆN TRONG 30 GIÂY!', x: p.x, y: p.y - 96, life: 2.8, color: '#48dbfb' });
                    Sound.play('energy');
                } else {
                    let sx = z.x, sy = z.y, nx = z.x + dx / d * 300, ny = z.y + dy / d * 300;
                    if (isBlockedPoint(nx, ny, z.radius)) { let sp = findSafePoint(nx, ny, z.radius); nx = sp.x; ny = sp.y; }
                    zapBlink(z, { x: nx, y: ny });
                    hazards.push({ type: 'electric', x: sx, y: sy, radius: 62, life: 2.6, dmg: 16, stun: 0.25 });   // vệt điện để lại sau lưng
                }
            } else if (Math.random() < 0.5) bossSay(z, 'ĐUỔI KỊP KHÔNG?', '#f9ca24');
        }
        if (!gen) zapGenDestroyed(null);
        return true;
    }
    // Đang sạc ở Máy Phát
    f.t -= dt; zx.final = Math.max(0.1, f.t); zx.fs = 2;
    if (Math.random() < dt * 12 && gen) createParticles(gen.x + (Math.random() - 0.5) * 60, gen.y - 40, '#48dbfb', 1, 160);
    f.lt -= dt;
    if (f.lt <= 0 && gen) {
        f.lt = 1.5;
        for (let p of al) if (Math.hypot(p.x - gen.x, p.y - gen.y) < 750) hazards.push({ type: 'strike', x: p.x + (Math.random() - 0.5) * 90, y: p.y + (Math.random() - 0.5) * 90, radius: 86, timer: 0.8, life: 1.1, dmg: 34, stun: 0.4 });
    }
    if (!gen) { zapGenDestroyed(null); return true; }
    if (f.t <= 0) {
        story.props = story.props.filter(p => p !== gen);
        z.hp = z._hpPrev = z.maxHp * 0.3; z.armor = z.maxArmor; z.finalDone = false;
        zx.fl = null; zx.final = 0; zx.fs = 0;
        createParticles(z.x, z.y, '#48dbfb', 60, 420); spawnRing(z.x, z.y, '#48dbfb', 300, 0.6, 10);
        for (let p of players) vfxList.push({ type: 'text', text: 'QUÁ MUỘN! ZAP-1624 ĐÃ SẠC LẠI 30% MÁU', x: p.x, y: p.y - 96, life: 2.8, color: '#ff4757' });
        Sound.play('roar');
    }
    return true;
}
// Máy Phát Điện bị phá: nổ tung kéo ZAP-1624 chết theo
function zapGenDestroyed(s) {
    let z = zombies.find(e => e.type === 36 && e.hp > 0), zx = story.zx;
    let x = s ? s.x : (z ? z.x : 0), y = s ? s.y : (z ? z.y : 0);
    vfxList.push({ type: 'flash', x, y, r: 520, life: 0.6, max: 0.6, color: '170,220,255' });
    for (let k = 0; k < 6; k++) vfxList.push({ type: 'bolt', x: x + (Math.random() - 0.5) * 400, y: y + (Math.random() - 0.5) * 400, life: 0.35, max: 0.35, seed: Math.random() * 1000 });
    createParticles(x, y, '#48dbfb', 90, 620); createParticles(x, y, '#636e72', 50, 420); addDecal(x, y, '#111', 90, 0.5);
    addScreenShake(28); Sound.play('explode'); Sound.play('thunder');
    if (zx) { zx.fl = null; zx.final = 0; zx.fs = 0; zx.jam = 60; }
    if (z) { z.finalDone = true; z.invuln = false; z.armor = 0; z._hpPrev = 1; z.hp = 0; z.lastHitBy = pickAlivePlayer(); }
}
function drawZapGen(p, T) {
    let z = zombies.find(e => e.type === 36 && !e.hidden), f = story.zx;
    ctx.beginPath(); ctx.arc(p.x, p.y, 120, 0, Math.PI * 2); ctx.fillStyle = `rgba(72, 219, 251, ${0.08 + 0.05 * Math.sin(T * 6)})`; ctx.fill();
    drawShadow(p.x, p.y + 14, p.r);
    ctx.fillStyle = '#2d3436'; ctx.fillRect(p.x - 46, p.y - 30, 92, 64); ctx.strokeStyle = '#111'; ctx.lineWidth = 4; ctx.strokeRect(p.x - 46, p.y - 30, 92, 64);
    for (let k = -1; k <= 1; k++) { ctx.fillStyle = '#636e72'; ctx.fillRect(p.x + k * 28 - 6, p.y - 70, 12, 42); ctx.beginPath(); ctx.arc(p.x + k * 28, p.y - 74, 9, 0, Math.PI * 2); ctx.fillStyle = '#48dbfb'; ctx.shadowColor = '#48dbfb'; ctx.shadowBlur = 14; ctx.fill(); ctx.shadowBlur = 0; }
    ctx.fillStyle = '#f1c40f'; ctx.font = 'bold 24px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('⚡', p.x, p.y + 2);
    if (z && f && f.fs === 2) {   // tia sạc từ máy phát lên ZAP
        ctx.strokeStyle = `rgba(160, 240, 255, ${0.6 + 0.4 * Math.sin(T * 30)})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(p.x, p.y - 74);
        for (let k = 1; k < 6; k++) ctx.lineTo(p.x + (z.x - p.x) * k / 6 + (Math.random() - 0.5) * 18, p.y - 74 + (z.y - p.y + 74) * k / 6 + (Math.random() - 0.5) * 18);
        ctx.lineTo(z.x, z.y); ctx.stroke();
    }
    drawMiniBar(p.x, p.y + 44, 110, 9, p.hp, p.maxHp, '#48dbfb');
    outlinedText('MÁY PHÁT ĐIỆN — PHÁ HỦY!', p.x, p.y - 98, '#48dbfb', 'bold 13px Arial', 4);
}

// ---------------------------------------------------------------------------
// HẦM MỎ: KIẾN CHÚA CHẾT -> HANG RUNG LẮC DỮ DỘI
// ---------------------------------------------------------------------------
let queenQuakeT = 0;
function queenDeathQuake(dt) {
    addScreenShake(14 + Math.random() * 12);
    queenQuakeT -= dt;
    if (queenQuakeT <= 0) {
        queenQuakeT = 0.35 + Math.random() * 0.3;
        Sound.play('tank');
        for (let p of players) {
            let x = p.x + (Math.random() - 0.5) * 700, y = p.y + (Math.random() - 0.5) * 500;
            createParticles(x, y, '#8d6e63', 14, 260); createParticles(x, y - 10, '#5d4037', 6, 160);
        }
    }
    if (Math.random() < dt * 30) createParticles(players[0].x + (Math.random() - 0.5) * 900, players[0].y - 300 - Math.random() * 100, '#a1887f', 1, 60);
}
refreshTutUI();

// ---------------------------------------------------------------------------
// NGƯỜI SỐNG SÓT ẨN NẤP trên map thường: tìm & đứng cạnh 3 giây để cứu -> đi theo, rút cùng đội rồi về căn cứ làm cư dân
// ---------------------------------------------------------------------------
class Survivor extends RescueNPC {
    constructor(x, y) { super(x, y); this.survivor = true; }
    update(dt) {
        if (this.hp <= 0) return;
        if (!this.rescued) {
            this.selfDefend(dt, 300, 0.9);
            if (players.some(p => !p.isDowned && Math.hypot(p.x - this.x, p.y - this.y) < 95)) this.rescueProgress += dt * (5 / 3);
            else this.rescueProgress = Math.max(0, this.rescueProgress - dt * 0.5);
            if (this.rescueProgress >= 5) {
                this.rescued = true;
                createParticles(this.x, this.y, '#2ecc71', 25, 160); spawnRing(this.x, this.y, '#2ecc71', 95, 0.4); Sound.play('heal');
                vfxList.push({ type: 'text', text: 'NGƯỜI SỐNG SÓT ĐI THEO BẠN — sẽ về căn cứ!', x: this.x, y: this.y - 40, life: 1.8, color: '#2ecc71' });
            }
            return;
        }
        super.update(dt);
    }
}
const _storyAfterGenerate0 = storyAfterGenerate;
storyAfterGenerate = function (level) {
    _storyAfterGenerate0(level);
    if (isCaveMap() || [6, 14, 15, 16].includes(currentMapType) || mission.type === 'RESCUE' || story.zx) return;
    let n = (Math.random() < 0.65 ? 1 : 0) + (level >= 6 && Math.random() < 0.4 ? 1 : 0);
    for (let p of storyFarPoints(n, 700, 600)) rescueNPCs.push(new Survivor(p.x, p.y));
    if (n) queueRadio(`Bộ đàm: Có ${n} tín hiệu người sống sót đang ẩn nấp trên map này — tìm và đưa họ về căn cứ!`, null, 6);
};
// Chỉ báo hướng khi đã tới gần (phải đi TÌM)
const _storyPointers0 = storyPointers;
storyPointers = function (ptr) {
    _storyPointers0(ptr);
    for (let n of rescueNPCs) if (n.survivor && !n.rescued && n.hp > 0 && players.some(p => Math.hypot(p.x - n.x, p.y - n.y) < 900)) ptr(n.x, n.y, '#2ecc71');
};

// ---------------------------------------------------------------------------
// NHÀ Ở & NÔNG TRẠI: muốn thêm dân phải đủ chỗ ở VÀ đủ lương thực. Người dư phải chờ ở trại tạm.
// TÍNH NĂNG THEO CẤP NHÀ CHÍNH: cấp 2 hồi 25% máu khi về, cấp 3 hồi 50% + Phòng Tập, cấp 4 thêm 4 Tháp Canh tự động
// ---------------------------------------------------------------------------
const HOME_CAP = 3, FARM_CAP = 4, COLONY_MAX = 6, TRAIN_MAX = 5;
const HOME_SPOTS = [[1600, 1530], [1690, 1530], [1780, 1530], [2220, 1530], [2310, 1530], [2400, 1530]];
const FARM_SPOTS = [[1560, 2250], [1650, 2250], [1740, 2250], [2260, 2250], [2350, 2250], [2440, 2250]];
const TOWER_SPOTS = [[1390, 1530], [2610, 1530], [1390, 2460], [2610, 2460]];
function colonyCap() { return Math.min((base.homes || 1) * HOME_CAP, (base.farms || 1) * FARM_CAP); }
function homeCost() { let n = base.homes || 1; return { scrap: 25 + n * 15, mat: 2 + n * 2 }; }
function farmCost() { let n = base.farms || 1; return { scrap: 20 + n * 15, mat: 2 + n * 2 }; }
function trainCost(l) { return { scrap: 40 * (l + 1), mat: 2 * (l + 1) }; }
// Người đang chờ dọn vào khi còn chỗ; trả về số người vừa dọn vào
function colonySettle() {
    let room = Math.max(0, colonyCap() - (base.pop | 0)), k = Math.min(room, base.wait | 0);
    base.pop = (base.pop | 0) + k; base.wait = (base.wait | 0) - k;
    return k;
}
function colonyBuy(what) {
    let c = what === 'home' ? homeCost() : what === 'farm' ? farmCost() : trainCost(what === 'thp' ? (base.trainHp | 0) : (base.trainSpd | 0));
    if (what === 'home' && (base.homes || 1) >= COLONY_MAX) return;
    if (what === 'farm' && (base.farms || 1) >= COLONY_MAX) return;
    if ((what === 'thp' || what === 'tspd') && (base.house < 3 || ((what === 'thp' ? base.trainHp : base.trainSpd) | 0) >= TRAIN_MAX)) return;
    if (shopScrap < c.scrap || (base.mat | 0) < c.mat) { Sound.play('hit'); netToast('Không đủ phế liệu hoặc vật liệu!', 1500); return; }
    shopScrap -= c.scrap; base.mat -= c.mat;
    if (what === 'home') base.homes = (base.homes || 1) + 1;
    else if (what === 'farm') base.farms = (base.farms || 1) + 1;
    else if (what === 'thp') { base.trainHp = (base.trainHp | 0) + 1; for (let p of players) { p.maxHp += 30; p.hp += 30; } }
    else { base.trainSpd = (base.trainSpd | 0) + 1; for (let p of players) p.baseSpeed += 12; }
    let k = colonySettle();
    if (k) netToast(`🏘 ${k} người đang chờ đã dọn vào căn cứ!`, 2500);
    Sound.play('upgrade');
    renderBasePanel(); netSendSync();
}
function colonyPanelBuild() {
    const btn = (label, fn, ok) => `<button class="px-2 py-2 rounded-lg text-xs font-bold border ${ok ? 'bg-emerald-700 border-emerald-400 text-white' : 'bg-gray-800 border-gray-600 text-gray-500'}" onclick="${fn}">${label}</button>`;
    const row = (title, sub, inner) => `<div class="p-2 rounded-lg bg-slate-900/80 border border-slate-600 flex items-center justify-between gap-2"><div class="text-xs text-white"><b>${title}</b><br><span class="text-gray-400">${sub}</span></div>${inner}</div>`;
    const can = (c) => shopScrap >= c.scrap && (base.mat | 0) >= c.mat;
    const maxed = '<span class="text-emerald-400 text-xs font-bold">TỐI ĐA</span>';
    let hc = homeCost(), fc = farmCost(), h = base.homes || 1, f = base.farms || 1;
    let html = `<div class="mb-1 text-sm font-bold text-emerald-300">🏡 NHÀ Ở & 🌾 NÔNG TRẠI — sức chứa ${colonyCap()} dân</div><div class="grid grid-cols-1 sm:grid-cols-2 gap-2">`;
    html += row(`🏡 Nhà ở ${h}/${COLONY_MAX}`, `Mỗi nhà ở được ${HOME_CAP} người (đủ chỗ cho ${h * HOME_CAP})`, h < COLONY_MAX ? btn(`Xây ⚙${hc.scrap} 🧱${hc.mat}`, "colonyBuy('home')", can(hc)) : maxed);
    html += row(`🌾 Nông trại ${f}/${COLONY_MAX}`, `Mỗi nông trại nuôi ${FARM_CAP} người (đủ ăn cho ${f * FARM_CAP})`, f < COLONY_MAX ? btn(`Xây ⚙${fc.scrap} 🧱${fc.mat}`, "colonyBuy('farm')", can(fc)) : maxed);
    html += '</div>';
    // Tính năng theo cấp Nhà Chính
    const lv = (n, t) => `<span class="${base.house >= n ? 'text-emerald-300' : 'text-gray-500'}">${base.house >= n ? '✔' : '🔒'} Cấp ${n}: ${t}</span>`;
    html += `<div class="mt-2 p-2 rounded-lg bg-slate-900/60 border border-slate-700 text-[11px] leading-5"><b class="text-white">Tính năng Nhà Chính</b><br>${lv(2, 'hồi 25% máu khi về căn cứ')}<br>${lv(3, 'hồi 50% máu khi về · mở PHÒNG TẬP (máu, tốc độ)')}<br>${lv(4, '4 THÁP CANH tự động bảo vệ trại · Radar mở rộng (tìm map mới — sắp có)')}<br>${lv(5, 'sắp có')}</div>`;
    if (base.house >= 3) {
        let th = base.trainHp | 0, ts = base.trainSpd | 0, ch = trainCost(th), cs = trainCost(ts);
        html += `<div class="mt-2 mb-1 text-sm font-bold text-sky-300">🏋 PHÒNG TẬP — nâng chỉ số cả đội (giữ cả lượt chơi)</div><div class="grid grid-cols-1 sm:grid-cols-2 gap-2">`;
        html += row(`❤ Thể lực ${th}/${TRAIN_MAX}`, '+30 máu tối đa mỗi cấp', th < TRAIN_MAX ? btn(`Tập ⚙${ch.scrap} 🧱${ch.mat}`, "colonyBuy('thp')", can(ch)) : maxed);
        html += row(`👟 Tốc độ ${ts}/${TRAIN_MAX}`, '+12 tốc chạy mỗi cấp', ts < TRAIN_MAX ? btn(`Tập ⚙${cs.scrap} 🧱${cs.mat}`, "colonyBuy('tspd')", can(cs)) : maxed);
        html += '</div>';
    }
    return html + '<div class="mb-3"></div>';
}
const _renderBasePanel1 = renderBasePanel;
renderBasePanel = function () {
    _renderBasePanel1();
    let box = document.getElementById('baseItems'); if (!box) return;
    let top = box.firstElementChild;   // khối Cư dân
    if (top) top.insertAdjacentHTML('afterend', colonyPanelBuild()); else box.insertAdjacentHTML('afterbegin', colonyPanelBuild());
};
// Về căn cứ: Nhà Chính cấp 2/3 hồi máu; phần thưởng boss đặt cạnh lửa trại
const _enterHub0 = enterHub;
enterHub = function () {
    let fresh = NET.mode !== 'guest' && base.arr !== currentLevel;
    _enterHub0();
    if (!fresh) return;
    let pct = base.house >= 3 ? 0.5 : (base.house >= 2 ? 0.25 : 0);
    if (pct) { for (let p of players) if (!p.isDowned) p.hp = Math.min(p.maxHp, p.hp + p.maxHp * pct); netToast(`🏠 Nhà Chính cấp ${base.house}: cả đội hồi ${pct * 100}% máu.`, 2500); }
    if (base.gift && WEAPON_TYPES[base.gift]) {
        drops.push({ type: 'SUPERBOX', forceWeapon: base.gift, x: HUB.fire.x + 90, y: HUB.fire.y + 30, radius: 16, lifeTime: 99999 });
        netToast(`🎁 Phần thưởng boss: ${WEAPON_TYPES[base.gift].name} cải tiến — Hòm Thính đặt cạnh lửa trại!`, 4500);
        base.gift = null;
    }
};
// Tháp canh tự động (Nhà Chính cấp 4): bắn khi căn cứ bị tấn công, không cần người vận hành
let towerCD = [0, 0, 0, 0];
function colonyTowers(dt) {
    if (base.house < 4 || objState !== 'BASE_DEF') return;
    TOWER_SPOTS.forEach((s, i) => {
        towerCD[i] -= dt; if (towerCD[i] > 0) return;
        let tz = null, bd = 700;
        for (let z of zombies) { if (z.hp <= 0 || z.hidden || z.flying) continue; let d = Math.hypot(z.x - s[0], z.y - s[1]); if (d < bd) { bd = d; tz = z; } }
        if (!tz) return;
        towerCD[i] = 0.3;
        bullets.push(new Bullet(s[0], s[1] - 20, Math.atan2(tz.y - s[1], tz.x - s[0]), { range: 720, dmg: 45 * (1 + currentLevel * 0.08), wallPiercing: true, fromAlly: true }, players[0]));
    });
}
const _colonyDefTick0 = colonyDefTick;
colonyDefTick = function (dt, h) { _colonyDefTick0(dt, h); colonyTowers(dt); };
function drawColonyBuildings(T) {
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let i = 0; i < (base.homes || 1) && i < HOME_SPOTS.length; i++) {
        let [x, y] = HOME_SPOTS[i];
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x - 25, y - 17, 60, 44);
        ctx.fillStyle = '#a1887f'; ctx.fillRect(x - 30, y - 22, 60, 44); ctx.strokeStyle = '#4e342e'; ctx.lineWidth = 3; ctx.strokeRect(x - 30, y - 22, 60, 44);
        ctx.fillStyle = '#6d4c41'; ctx.beginPath(); ctx.moveTo(x - 34, y - 22); ctx.lineTo(x, y - 42); ctx.lineTo(x + 34, y - 22); ctx.closePath(); ctx.fill();
        ctx.fillStyle = `rgba(255, 234, 167, ${0.6 + 0.2 * Math.sin(T * 2 + i)})`; ctx.fillRect(x - 8, y - 6, 16, 12);
    }
    for (let i = 0; i < (base.farms || 1) && i < FARM_SPOTS.length; i++) {
        let [x, y] = FARM_SPOTS[i];
        ctx.fillStyle = '#5d4037'; ctx.fillRect(x - 36, y - 26, 72, 52);
        for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) { let sw = Math.sin(T * 2 + c + r) * 1.5; ctx.fillStyle = '#7bed9f'; ctx.fillRect(x - 32 + c * 11 + sw, y - 22 + r * 12, 5, 8); }
        ctx.strokeStyle = '#3e2723'; ctx.lineWidth = 2; ctx.strokeRect(x - 36, y - 26, 72, 52);
    }
    if (objState === 'HUB') {
        outlinedText(`🏡 NHÀ Ở (${(base.homes || 1) * HOME_CAP} chỗ)`, HOME_SPOTS[1][0], HOME_SPOTS[0][1] + 36, '#ffeaa7', 'bold 10px Arial');
        outlinedText(`🌾 NÔNG TRẠI (nuôi ${(base.farms || 1) * FARM_CAP})`, FARM_SPOTS[1][0], FARM_SPOTS[0][1] + 40, '#7bed9f', 'bold 10px Arial');
    }
    if (base.house >= 4) for (let [x, y] of TOWER_SPOTS) {
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x - 13, y - 13, 36, 36);
        ctx.fillStyle = '#6d4c41'; ctx.fillRect(x - 18, y - 18, 36, 36); ctx.strokeStyle = '#3e2723'; ctx.lineWidth = 3; ctx.strokeRect(x - 18, y - 18, 36, 36);
        ctx.fillStyle = '#2f3542'; ctx.beginPath(); ctx.arc(x, y - 4, 10, 0, Math.PI * 2); ctx.fill();
        outlinedText('THÁP CANH', x, y + 28, '#f1c40f', 'bold 9px Arial');
    }
}
