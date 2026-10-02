// ============================================================================
// 16-skills.js
//  - KỸ NĂNG VŨ KHÍ [C]: mọi vũ khí cận chiến, vũ khí Hòm Thính và vũ khí đặc biệt map Điện
//    Kỹ năng C (hồi chiêu) có sẵn cho MỌI vũ khí; riêng Nộ [D] cần thẻ "Thịnh Nộ"
//  - VŨ KHÍ NÉM: Phi Tiêu (A bắn 1, B tung vòng quanh người), Bom Lửa (như lựu đạn), thẻ Phi Dao
//  - VƯỜN THỰC VẬT: nhiệm vụ THIÊU thực vật đột biến, cỏ toàn map không cháy
// Các file khác chỉ gọi vào đây qua móc ngắn (skill* / garden*).
// ============================================================================
const SLASH_W = 70;
// ĐỘ KHÓ: chọn ở menu, áp cho lượt chơi mới (bản lưu nhớ độ khó của nó). hp/dmg: máu & sát thương của quái, spawn: số quái, scrap: thưởng phế liệu
const DIFFS = {
    easy: { name: 'DỄ', hp: 0.7, dmg: 0.65, spawn: 0.8, scrap: 1 },
    normal: { name: 'THƯỜNG', hp: 1, dmg: 1, spawn: 1, scrap: 1 },
    hard: { name: 'KHÓ', hp: 1.35, dmg: 1.3, spawn: 1.2, scrap: 1.2 },
    hell: { name: 'ÁC MỘNG', hp: 1.8, dmg: 1.7, spawn: 1.45, scrap: 1.4 }
};
let difficulty = 'normal';
try { let sv = localStorage.getItem('zs_diff'); if (DIFFS[sv]) difficulty = sv; } catch (e) { }
function diff() { return DIFFS[difficulty] || DIFFS.normal; }
function setDifficulty(k) {
    if (!DIFFS[k]) return;
    difficulty = k; try { localStorage.setItem('zs_diff', k); } catch (e) { }
    Sound.play('select'); refreshDiffUI();
}
function refreshDiffUI() {
    for (let k in DIFFS) { let b = document.getElementById('diff_' + k); if (b) { b.style.outline = k === difficulty ? '2px solid #f1c40f' : 'none'; b.style.opacity = k === difficulty ? '1' : '0.55'; } }
    let t = document.getElementById('diffText'), d = diff();
    if (t) t.textContent = `Quái: máu x${d.hp} · sát thương x${d.dmg} · số lượng x${d.spawn}` + (d.scrap > 1 ? ` · thưởng ⚙ x${d.scrap}` : '');
}
const WSKILL = {
    KNIFE: { name: 'LƯỚT ĐÂM', cd: 3 },
    KATANA: { name: 'TRẢM RỘNG', cd: 4 }, LEGEND_KATANA: { name: 'TRẢM RỘNG', cd: 4 }, LEGENDARY_KATANA: { name: 'TRẢM RỘNG', cd: 4 },
    AXE: { name: 'RÌU XOÁY', cd: 5 },
    SPEAR: { name: 'QUÉT GIÁO', cd: 4 },
    DUAL_KATANA: { name: 'LOẠN TRẢM', cd: 6 }, DUAL_LEGEND: { name: 'LOẠN TRẢM', cd: 6 },
    SCYTHE: { name: 'VÒNG GẶT', cd: 5 },
    BAT: { name: 'ĐẬP ĐẤT', cd: 5, d: 'Đập gậy xuống đất: hất văng và làm choáng mọi quái xung quanh.' },
    IRON_BAT: { name: 'ĐẬP ĐẤT', cd: 6, d: 'Đập gậy sắt xuống đất: vùng rộng hơn, hất văng và làm choáng lâu hơn.' },
    LIGHTSABER: { name: 'KHIÊN NĂNG LƯỢNG', cd: 12 },
    ELECTRO_WHIP: { name: 'VÒNG SÉT', cd: 6 },
    PISTOL: { name: 'XẢ BĂNG', cd: 6, gun: 1, d: 'Bắn liền 6 phát vào 6 mục tiêu gần nhất, không tốn đạn.' },
    SMG: { name: 'SONG SÚNG', cd: 12, gun: 1, d: 'Móc thêm một khẩu nữa: 5 giây mỗi phát bắn ra 2 viên.' },
    AR: { name: 'LỰU ĐẠN KẸP NÒNG', cd: 8, gun: 1, d: 'Bắn một quả lựu đạn nổ diện rộng.' },
    SHOTGUN: { name: 'ĐẠN RỒNG', cd: 7, gun: 1, d: 'Một phát 20 viên đạn lửa hình quạt rộng.' },
    SNIPER: { name: 'ĐẠN XUYÊN GIÁP', cd: 9, gun: 1, d: 'Phát bắn x3 sát thương, chắc chắn chí mạng, xuyên tường và xuyên mọi mục tiêu.' },
    BOW: { name: 'LOẠT TÊN', cd: 7, gun: 1, d: 'Bắn 5 mũi tên hình quạt.' },
    GLAUNCHER: { name: 'CHÙM LỰU', cd: 9, gun: 1, d: 'Bắn 3 quả lựu hình quạt.' },
    MINIGUN: { name: 'LÀM MÁT', cd: 10, gun: 1, d: 'Xả hết Nhiệt, gỡ kẹt nòng, hơi nóng đẩy lùi quái quanh mình.' },
    SHURIKEN: { name: 'BÓNG ẢNH', cd: 5, gun: 1, d: 'Phóng 3 phi tiêu tự đuổi mục tiêu.' },
    FLAMETHROWER: { name: 'CẦU LỬA', cd: 8, gun: 1, cost: 10 },
    ACID_SPRAYER: { name: 'NỔ ACID', cd: 8, gun: 1, cost: 10 },
    ELECTRO_CANNON: { name: 'CẦU SÉT', cd: 8, gun: 1, cost: 5 },
    PISTOL_ELECTRO: { name: 'ĐẠN EMP', cd: 7, gun: 1, cost: 4 },
    PLASMA_RAPID: { name: 'QUÁ TẢI', cd: 10, gun: 1, cost: 0 },
    ELECTRON_FLUX: { name: 'TIA HỘI TỤ', cd: 8, gun: 1, cost: 15 },
    TESLA_CARBINE: { name: 'TRỤ TESLA', cd: 12, gun: 1, cost: 5 }
};
// Nộ [D] của mọi vũ khí cần thẻ Thịnh Nộ (w_gunSkill: tên thẻ ở bản lưu cũ)
function skillRageOK(p, w) { return !!w && !!(p.perks.w_rage || p.perks.w_gunSkill); }
// Thông tin kỹ năng C của vũ khí đang cầm (dùng cho vẽ nhãn và nút ảo)
function skillInfo(p) {
    let w = p && p.weapon, d = w && WSKILL[w.key];
    if (!d || (p.perks.nhatKiem && isKatanaW(w))) return null;
    return { name: d.name, cd: d.cd, locked: false };
}
function melee0(w) { return w.type === 'melee'; }
// Song Súng (SMG): mỗi phát bắn kèm một viên từ khẩu thứ hai (móc trong Player.shoot)
function skillExtraShot(p, angle, wep) {
    if (!(p.akimboT > 0) || wep.key !== 'SMG') return;
    let b = new Bullet(p.x - Math.sin(angle) * 12, p.y + Math.cos(angle) * 12, angle + (Math.random() - 0.5) * 0.08, wep, p);
    bullets.push(b);
}
function skillAim(p, range) {
    let a = Math.atan2(p.facingY, p.facingX);
    if (!playerUsesPointer(p)) { let t = getNearestZombie(p.x, p.y, range, true); if (t) a = Math.atan2(t.y - p.y, t.x - p.x); }
    p.facingX = Math.cos(a); p.facingY = Math.sin(a);
    return a;
}
function skillHit(z, dmg, w, p) { z.hp -= calcDamage(dmg, w, z.x, z.y, p, z); createParticles(z.x, z.y, '#e74c3c', 8, 220); zombieDown(z, p); }
// Phi dao / phi tiêu bay thẳng
function skillBlade(p, ang, w, mult = 1) {
    return new Bullet(p.x, p.y, ang, { key: w.key, name: w.name, type: w.type === 'melee' ? 'melee' : 'gun', color: w.color, range: 560, dmg: w.dmg * mult, pierce: 2, bk: w.key === 'KNIFE' ? 17 : 14, spd: 1000, critCh: w.critCh || 0.1 }, p);
}

// Bấm C: trả về true nếu đã tung kỹ năng vũ khí
function skillTryC(p) {
    let w = p.weapon, d = w && WSKILL[w.key];
    if (!d || p.skillC_CD > 0 || p.flurryT > 0 || p.leapT > 0 || p.ventT > 0) return false;
    if (p.perks.nhatKiem && isKatanaW(w)) return false;
    if (!melee0(w) && empStorm.active) return false;
    let k = w.key, melee = w.type === 'melee', ang = skillAim(p, melee ? 300 : 520), ca = Math.cos(ang), sa = Math.sin(ang), mult = p.getTotalDamageMult();
    const mw = (o) => { let c = { ...w }; if (p.perks.meleeTech) { c.dmg *= 1.3; c.range *= 1.3; } if (isKatanaW(c) && (p.perks.m_thieu || c.isLegendary)) c.isFire = true; return Object.assign(c, o(c)); };

    if (k === 'KNIFE') {
        // Lướt về phía trước, đâm xuyên mọi thứ trên đường
        let sx = p.x, sy = p.y;
        for (let s = 0; s < 10; s++) { p.x += ca * 21; p.y += sa * 21; resolveCollision(p); }
        for (let z of zombies) if (z.hp > 0 && !z.flying && distancePointToSegment(z.x, z.y, sx, sy, p.x, p.y) < 46 + z.radius) skillHit(z, w.dmg * 1.6, w, p);
        p.perks.invulnTimer = Math.max(p.perks.invulnTimer || 0, 0.3);
        vfxList.push({ type: 'laser_beam', x: sx, y: sy, tx: p.x, ty: p.y, life: 0.18 }); createParticles(p.x, p.y, '#dfe6e9', 14, 260); Sound.play('woosh'); Sound.play('stab');
        if (p.perks.n_phiDao && w.ammo > 3) { w.ammo -= 3; for (let j = -1; j <= 1; j++) bullets.push(skillBlade(p, ang + j * 0.22, w, 1.2)); Sound.play('throw'); }
    } else if (k === 'KATANA' || k === 'LEGEND_KATANA' || k === 'LEGENDARY_KATANA') {
        let c = mw(c => ({ spread: c.isLegendary ? Math.PI * 2 : 4.6, range: c.range * (c.isLegendary ? 1.4 : 1.8), dmg: c.dmg * 1.6, kb: (c.kb || 150) * 1.5 }));
        slashes.push(new Slash(p.x, p.y, ang, c, p)); spawnRing(p.x, p.y, c.isLegendary ? '#ff9f43' : '#dfe6e9', c.range, 0.25, 4); addScreenShake(6); Sound.play('slash');
    } else if (k === 'AXE') {
        // Ném rìu xoáy ra trước, chém xuyên rồi tự bay về (rìu vẫn ở trên tay)
        let t = new ThrownItem(p.x, p.y, ca, sa, { ...w, ammo: 0 }, false, 0, p, { ghost: true });
        t.boomerang = true; t.pierceLeft = 99; t.dmgMult *= 2.4; t.explosive = false;
        thrownItems.push(t); Sound.play('throw');
    } else if (k === 'SPEAR') {
        let c = mw(c => ({ name: 'Giáo quét', isThrust: false, spread: Math.PI * 2, range: c.range * 1.5, dmg: c.dmg * 2.2, kb: (c.kb || 250) * 1.6 }));
        slashes.push(new Slash(p.x, p.y, ang, c, p)); spawnRing(p.x, p.y, w.color, c.range, 0.25, 4); addScreenShake(5); Sound.play('slash_heavy');
    } else if (k === 'DUAL_KATANA' || k === 'DUAL_LEGEND') {
        // Chém liên tục trong lúc lướt, để lại vùng chém hình chữ nhật 2 giây
        p.flurryT = 0.42; p.flurryAng = ang; p.flurrySX = p.x; p.flurrySY = p.y; p.flurryAcc = 0.07;
        p.flurryW = mw(c => ({ spread: 2.4, range: c.range * (c.isLegendary ? 1 : 1.25), dmg: c.dmg * 0.8 }));
        p.perks.invulnTimer = Math.max(p.perks.invulnTimer || 0, 0.5); Sound.play('woosh');
    } else if (k === 'BAT' || k === 'IRON_BAT') {
        let iron = k === 'IRON_BAT', R = iron ? 210 : 170, dm = w.dmg * (p.perks.meleeTech ? 1.3 : 1) * 1.8;
        for (let z of zombies) {
            let dd = Math.hypot(z.x - p.x, z.y - p.y);
            if (z.hp <= 0 || z.flying || dd > R + z.radius) continue;
            if (dd > 1) z.knockback((z.x - p.x) / dd * 950, (z.y - p.y) / dd * 950);
            if (!isBossType(z.type)) z.stunTimer = Math.max(z.stunTimer || 0, iron ? 1.2 : 0.8);
            skillHit(z, dm, w, p);
        }
        vfxList.push({ type: 'sweep', st: 'hammer', x: p.x, y: p.y, angle: ang, r: R, spread: Math.PI * 2, dir: 1, col: iron ? '200,210,220' : '214,196,170', life: 0.45, max: 0.45 });
        spawnRing(p.x, p.y, iron ? '#dfe6e9' : '#c8a165', R, 0.35, 6); addDecal(p.x, p.y, '#222', R * 0.3, 0.35); addScreenShake(iron ? 14 : 10); Sound.play('anvil');
    } else if (k === 'SCYTHE') {
        let c = mw(c => ({ spread: Math.PI * 2, range: c.range * 1.6, dmg: c.dmg * 1.5 }));
        for (let z of zombies) { if (z.hp <= 0 || z.flying || isBossType(z.type)) continue; let dd = Math.hypot(z.x - p.x, z.y - p.y); if (dd < c.range * 1.6 && dd > 50) { z.x += (p.x - z.x) / dd * 70; z.y += (p.y - z.y) / dd * 70; } }
        slashes.push(new Slash(p.x, p.y, ang, c, p)); spawnRing(p.x, p.y, '#ff4650', c.range, 0.3, 5); addScreenShake(6); Sound.play('slash_heavy');
    } else if (k === 'LIGHTSABER') {
        p.tempShield = Math.max(p.tempShield || 0, 3);
        for (let b of enemyBullets) if (b.active && Math.hypot(b.x - p.x, b.y - p.y) < 170) { b.active = false; createParticles(b.x, b.y, '#00ffff', 5, 100); }
        spawnRing(p.x, p.y, '#00ffff', 90, 0.4, 5); Sound.play('saber');
    } else if (k === 'ELECTRO_WHIP') {
        friendlyZap(p.x, p.y, 270, w.dmg * 3 * mult, p);
        for (let z of zombies) if (z.hp > 0 && !isBossType(z.type) && !ELECTRIC_IMMUNE_ZOMBIES.has(z.type) && Math.hypot(z.x - p.x, z.y - p.y) < 270) z.stunTimer = Math.max(z.stunTimer || 0, 1.2);
        hazards.push({ type: 'electric', x: p.x, y: p.y, radius: 210, life: 3, dmg: 90 * mult, friendly: true, source: p });
        addScreenShake(8); Sound.play('eimpact');
    } else if (k === 'PISTOL') {
        let near = zombies.filter(z => z.hp > 0 && !z.hidden && Math.hypot(z.x - p.x, z.y - p.y) < 620).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y)).slice(0, 6);
        for (let j = 0; j < 6; j++) { let z = near[j % Math.max(1, near.length)], a = z ? Math.atan2(z.y - p.y, z.x - p.x) : ang + (j - 2.5) * 0.08; bullets.push(new Bullet(p.x, p.y, a, { ...w, dmg: w.dmg * 1.2 }, p)); }
        Sound.play('shotgun'); addScreenShake(5);
    } else if (k === 'SMG') {
        p.akimboT = 5;
    } else if (k === 'AR') {
        bullets.push(new Bullet(p.x, p.y, ang, { key: k, name: w.name, type: 'gun', range: 700, dmg: 320, isExplosiveProj: true, friendly: true }, p)); Sound.play('throw');
    } else if (k === 'SHOTGUN') {
        for (let j = 0; j < 20; j++) bullets.push(new Bullet(p.x, p.y, ang + (Math.random() - 0.5) * 1.1, { ...w, incendiary: true, range: w.range * 1.2 }, p));
        p.x -= ca * 26; p.y -= sa * 26; resolveCollision(p); Sound.play('shotgun'); addScreenShake(9);
    } else if (k === 'SNIPER') {
        bullets.push(new Bullet(p.x, p.y, ang, { ...w, dmg: w.dmg * 3, critCh: 1, pierce: 99, wallPiercing: true }, p)); Sound.play('sniper'); addScreenShake(12);
    } else if (k === 'BOW') {
        for (let j = -2; j <= 2; j++) bullets.push(new Bullet(p.x, p.y, ang + j * 0.14, { ...w, dmg: w.dmg * 1.6, pierce: 2 }, p)); Sound.play('bow');
    } else if (k === 'GLAUNCHER') {
        for (let j = -1; j <= 1; j++) bullets.push(new Bullet(p.x, p.y, ang + j * 0.22, { ...w }, p)); Sound.play('throw');
    } else if (k === 'MINIGUN') {
        p.mgHeat = 0; p.jamT = 0;
        for (let z of zombies) { let dd = Math.hypot(z.x - p.x, z.y - p.y); if (z.hp > 0 && dd < 200 && dd > 1) { z.knockback((z.x - p.x) / dd * 700, (z.y - p.y) / dd * 700); applyStatus(z, STATUS.BURN, { duration: 2.5, dpsPercent: 0.012, source: p }); } }
        spawnRing(p.x, p.y, '#dfe6e9', 200, 0.4, 6); createParticles(p.x, p.y, '#b2bec3', 40, 320); Sound.play('hit');
    } else if (k === 'SHURIKEN') {
        for (let j = -1; j <= 1; j++) bullets.push(new Bullet(p.x, p.y, ang + j * 0.5, { key: k, name: w.name, type: 'gun', color: w.color, range: 900, dmg: w.dmg * 1.4, pierce: 1, bk: 14, homing: true, critCh: w.critCh }, p));
        Sound.play('throw');
    } else if (k === 'FLAMETHROWER') {
        bullets.push(new Bullet(p.x, p.y, ang, { key: k, name: w.name, type: 'gun', range: 560, dmg: 280, isExplosiveProj: true, friendly: true, bk: 13, fireball: true, spd: 760 }, p));
        Sound.play('explode');
    } else if (k === 'ACID_SPRAYER') {
        for (let j = 0; j < 12; j++) { let a = j / 12 * Math.PI * 2, r = 90 + (j % 3) * 70; fireZones.push({ kind: 'acid', x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r, life: 5, dmg: w.dmg * 1.2, source: p, radius: 52 }); }
        for (let z of zombies) if (z.hp > 0 && !z.flying && Math.hypot(z.x - p.x, z.y - p.y) < 260 + z.radius) { applyStatus(z, STATUS.CORROSION, { duration: 4.0, stacks: 4, dpsPercent: 0.0045, maxStacks: 8, source: p }); z.hp -= 200 * mult; z.lastHitBy = p; zombieDown(z, p); }
        spawnRing(p.x, p.y, '#2ecc71', 260, 0.45, 8); createParticles(p.x, p.y, '#2ecc71', 60, 420); addScreenShake(8); Sound.play('explode');
    } else if (k === 'ELECTRO_CANNON' || k === 'PISTOL_ELECTRO') {
        let emp = k === 'PISTOL_ELECTRO';
        bullets.push(new Bullet(p.x, p.y, ang, { key: k, name: w.name, type: 'gun', range: emp ? 700 : 600, dmg: emp ? 120 : 260, isExplosiveProj: true, friendly: true, bk: 16, orb: emp ? 2 : 1, spd: emp ? 900 : 520 }, p));
        Sound.play('plasma');
    } else if (k === 'PLASMA_RAPID') {
        p.overT = 4; p.overAcc = 0; Sound.play('eskill');
    } else if (k === 'ELECTRON_FLUX') {
        let ex = p.x + ca * 720, ey = p.y + sa * 720;
        for (let z of zombies) {
            if (z.hp <= 0 || z.hidden || distancePointToSegment(z.x, z.y, p.x, p.y, ex, ey) > 46 + z.radius) continue;
            if (!ELECTRIC_IMMUNE_ZOMBIES.has(z.type)) { applyStatus(z, STATUS.ELECTRIC, { duration: 3, stacks: 3, dps: 30, maxStacks: 8, source: p }); if (!isBossType(z.type)) z.stunTimer = Math.max(z.stunTimer || 0, 0.8); }
            skillHit(z, 420, w, p);
        }
        for (let j = 0; j < 3; j++) vfxList.push({ type: 'laser_beam', x: p.x, y: p.y, tx: ex, ty: ey, life: 0.22 + j * 0.06, jag: j > 0 });
        addScreenShake(8); Sound.play('eskill');
    } else if (k === 'TESLA_CARBINE') {
        let tx = p.x + ca * 180, ty = p.y + sa * 180;
        hazards.push({ type: 'electric', x: tx, y: ty, radius: 240, life: 6, dmg: 140 * mult, friendly: true, source: p });
        friendlyZap(tx, ty, 240, 200 * mult, p); Sound.play('eshock');
    } else return false;

    if (d.cost) w.ammo = Math.max(1, w.ammo - d.cost);
    p.skillC_CD = d.cd * ((p.tags['THOI_KHONG'] || 0) >= 2 ? 0.8 : 1);
    arsText(p, d.name + '!', melee ? '#ffeaa7' : '#74b9ff', 0.9);
    return true;
}

// Mỗi khung hình cho từng người chơi (gọi từ arsenalPlayerTick)
function skillTick(p, dt) {
    if (p.flurryT > 0) {
        p.flurryT -= dt;
        p.x += Math.cos(p.flurryAng) * 720 * dt; p.y += Math.sin(p.flurryAng) * 720 * dt; resolveCollision(p);
        p.flurryAcc += dt;
        while (p.flurryAcc >= 0.07) {
            p.flurryAcc -= 0.07; p.dualSide = -(p.dualSide || 1);
            slashes.push(new Slash(p.x, p.y, p.flurryAng, { ...p.flurryW, dirSign: p.dualSide }, p)); Sound.play('slash');
        }
        if (p.flurryT <= 0) {
            let len = Math.max(80, Math.hypot(p.x - p.flurrySX, p.y - p.flurrySY));
            hazards.push({ type: 'slashzone', x: p.flurrySX, y: p.flurrySY, angle: Math.atan2(p.y - p.flurrySY, p.x - p.flurrySX), radius: len, life: 2, dmg: p.flurryW.dmg * 1.2, wd: p.flurryW, friendly: true, source: p, tick: 0 });
            addScreenShake(8);
        }
    }
    if (p.akimboT > 0) { p.akimboT -= dt; if (!p.weapon || p.weapon.key !== 'SMG') p.akimboT = 0; }
    if (p.overT > 0) {
        // Plasma Quá Tải: tự xả đạn 4 giây, không tốn đạn
        p.overT -= dt;
        if (!p.weapon || p.weapon.key !== 'PLASMA_RAPID' || p.isDowned) p.overT = 0;
        else {
            p.overAcc += dt;
            while (p.overAcc >= 0.06) {
                p.overAcc -= 0.06;
                let a = skillAim(p, 520) + (Math.random() - 0.5) * 0.16;
                bullets.push(new Bullet(p.x, p.y, a, { ...p.weapon, dmg: p.weapon.dmg * 1.2 }, p));
            }
            Sound.play('auto');
        }
    }
}

// Vùng chém của Song Kiếm + Vườn Thực Vật (gọi cuối updateArsenal)
function updateSkills(dt) {
    for (let h of hazards) {
        if (h.type !== 'slashzone') continue;
        h.tick -= dt; if (h.tick > 0) continue;
        h.tick = 0.25;
        let ca = Math.cos(h.angle), sa = Math.sin(h.angle);
        for (let z of zombies) {
            if (z.hp <= 0 || z.flying) continue;
            let dx = z.x - h.x, dy = z.y - h.y, along = dx * ca + dy * sa;
            if (along < -20 || along > h.radius + 20 || Math.abs(dy * ca - dx * sa) > SLASH_W + z.radius) continue;
            skillHit(z, h.dmg, h.wd, h.source);
        }
    }
    if (mission.type === 'BURN_PLANTS') gardenUpdate(dt);
}

// Đạn nổ đặc biệt vừa phát nổ (móc trong Bullet.triggerHit)
function skillBulletBoom(b) {
    let wd = b.wepData || {}, src = b.source, mult = arsMult(src);
    if (wd.fireball) skillFirePool(b.x, b.y, src, 160, 5);
    else if (wd.orb === 1) { hazards.push({ type: 'electric', x: b.x, y: b.y, radius: 200, life: 4, dmg: 110 * mult, friendly: true, source: src }); Sound.play('eshock'); }
    else if (wd.orb === 2) {
        friendlyZap(b.x, b.y, 260, 150 * mult, src);
        for (let z of zombies) if (z.hp > 0 && !ELECTRIC_IMMUNE_ZOMBIES.has(z.type) && Math.hypot(z.x - b.x, z.y - b.y) < 260) z.stunTimer = Math.max(z.stunTimer || 0, isBossType(z.type) ? 0.5 : 2.2);
        vfxList.push({ type: 'text', text: 'EMP!', x: b.x, y: b.y - 30, life: 0.9, color: '#00d2d3' }); Sound.play('eshock');
    }
}
function skillFirePool(x, y, src, radius, life) {
    fireZones.push({ x, y, life, dmg: 90, source: src, radius });
    for (let j = 0; j < 6; j++) { let a = j / 6 * Math.PI * 2 + Math.random() * 0.5; fireZones.push({ x: x + Math.cos(a) * radius * 0.8, y: y + Math.sin(a) * radius * 0.8, life: life - 1 + Math.random(), dmg: 60, source: src, radius: radius * 0.45 }); }
}
// Bom Lửa vỡ: nổ nhỏ + biển lửa rộng
function skillMolotovBurst(x, y, src) {
    explode(x, y, 120, 90, src, true);
    skillFirePool(x, y, src, 150, 6);
}

// Nút NÉM [B] của vũ khí ném: trả về true nếu đã xử lý
function skillThrowB(p) {
    let w = p.weapon; if (!w) return false;
    let knife = w.key === 'KNIFE' && p.perks.n_phiDao && w.ammo >= 3;
    if (w.key !== 'SHURIKEN' && !knife) return false;
    let per = knife ? 3 : 1, n = Math.min(knife ? 8 : 12, Math.floor(w.ammo / per));
    let a0 = Math.atan2(p.facingY, p.facingX);
    for (let j = 0; j < n; j++) bullets.push(skillBlade(p, a0 + j / n * Math.PI * 2, w, knife ? 1.2 : 1.3));
    w.ammo -= n * per;
    spawnRing(p.x, p.y, w.color, 80, 0.25, 3); Sound.play('throw');
    arsText(p, (knife ? 'VÒNG PHI DAO x' : 'VÒNG PHI TIÊU x') + n, '#fab1a0', 0.9);
    if (w.ammo <= 0) p.weapon = null;
    return true;
}

// ---------------------------------------------------------------------------
// VẼ
// ---------------------------------------------------------------------------
function drawSkillHazard(h, T) {
    let a = Math.min(1, h.life), L = h.radius;
    ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(h.angle);
    ctx.fillStyle = `rgba(223, 230, 233, ${0.10 * a})`; ctx.fillRect(0, -SLASH_W, L, SLASH_W * 2);
    ctx.strokeStyle = `rgba(223, 230, 233, ${0.5 * a})`; ctx.lineWidth = 2; ctx.setLineDash([10, 8]); ctx.strokeRect(0, -SLASH_W, L, SLASH_W * 2); ctx.setLineDash([]);
    ctx.lineCap = 'round'; ctx.strokeStyle = `rgba(255, 255, 255, ${0.75 * a})`; ctx.lineWidth = 2.5; ctx.beginPath();
    for (let j = 0; j < 7; j++) { let s = (j * 0.37 + T * 1.7) % 1, x = s * L, o = ((j * 53) % 100 / 100 - 0.5) * SLASH_W * 1.5, d = j % 2 ? 1 : -1; ctx.moveTo(x - 26, o - 20 * d); ctx.lineTo(x + 26, o + 20 * d); }
    ctx.stroke(); ctx.lineCap = 'butt'; ctx.restore();
}
// Đạn kiểu mới (bk 13 cầu lửa, 14 phi tiêu, 16 cầu sét, 17 phi dao). Trả về true nếu đã vẽ.
function drawSkillBullet(b, k, T) {
    if (k === 13) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.beginPath(); ctx.arc(b.x, b.y, 22 + Math.sin(T * 30) * 3, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255, 120, 20, 0.45)'; ctx.fill();
        ctx.beginPath(); ctx.arc(b.x, b.y, 12, 0, Math.PI * 2); ctx.fillStyle = '#ffe08a'; ctx.fill();
        ctx.strokeStyle = 'rgba(255, 140, 0, 0.5)'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(b.x - b.vx * 0.07, b.y - b.vy * 0.07); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
    } else if (k === 16) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.beginPath(); ctx.arc(b.x, b.y, 17, 0, Math.PI * 2); ctx.fillStyle = 'rgba(72, 219, 251, 0.4)'; ctx.fill();
        ctx.beginPath(); ctx.arc(b.x, b.y, 8, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
        ctx.strokeStyle = 'rgba(160, 240, 255, 0.9)'; ctx.lineWidth = 2; ctx.beginPath();
        for (let j = 0; j < 4; j++) { let a = T * 9 + j * 1.57; ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + Math.cos(a) * 22, b.y + Math.sin(a) * 22); }
        ctx.stroke(); ctx.globalCompositeOperation = 'source-over';
    } else if (k === 14) {
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(T * 28);
        ctx.fillStyle = '#dfe6e9'; ctx.strokeStyle = '#2d3436'; ctx.lineWidth = 1; ctx.beginPath();
        for (let j = 0; j < 8; j++) { let a = j * Math.PI / 4, r = j % 2 ? 3.5 : 10; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    } else if (k === 17) {
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.angle !== undefined ? b.angle : Math.atan2(b.vy, b.vx));
        ctx.fillStyle = '#2d3436'; ctx.fillRect(-12, -2, 9, 4);
        ctx.fillStyle = '#dfe6e9'; ctx.beginPath(); ctx.moveTo(-3, -3); ctx.lineTo(14, 0); ctx.lineTo(-3, 3); ctx.closePath(); ctx.fill();
        ctx.restore();
    } else return false;
    return true;
}

// ---------------------------------------------------------------------------
// VƯỜN THỰC VẬT: thiêu các thực vật đột biến. Chỉ LỬA mới làm chúng mất máu.
// ---------------------------------------------------------------------------
const PLANT_NAMES = ['HOA ĂN THỊT', 'NẤM BÀO TỬ', 'CÂY GAI ĐỘC'];
function gardenFireCrate(x, y, key) { let sp = findSafePoint(x, y, 18); drops.push({ type: key === 'FLAMETHROWER' ? 'SUPERBOX' : 'BLINDBOX', x: sp.x, y: sp.y, radius: 16, lifeTime: 900, forceWeapon: key }); }
function gardenSetup(level) {
    let n = Math.min(9, 5 + Math.floor(level / 3)), cx = MAP_SIZE.w / 2, cy = MAP_SIZE.h / 2;
    mission.required = n; mission.progress = 0;
    storyFarPoints(n, 520, 430).forEach((pt, i) => {
        let hp = 900 + level * 150;
        story.props.push({ kind: 'plant', breakable: true, fireOnly: true, x: pt.x, y: pt.y, r: 38, v: i % 3, hp, maxHp: hp, cd: 1 + Math.random() * 2 });
        gardenFireCrate(pt.x + 110, pt.y + 60, 'MOLOTOV');
    });
    gardenFireCrate(cx - 90, cy - 70, 'FLAMETHROWER'); gardenFireCrate(cx + 90, cy - 70, 'FLAMETHROWER');
    for (let j = 0; j < 3; j++) gardenFireCrate(cx - 80 + j * 80, cy + 90, 'MOLOTOV');
    // Cỏ phủ khắp map và KHÔNG cháy
    bushes = [];
    for (let i = 0; i < 46; i++) createBushCluster(180 + Math.random() * (MAP_SIZE.w - 360), 180 + Math.random() * (MAP_SIZE.h - 360), 6, 170, false);
    bushes = bushes.filter(b => Math.hypot(b.x - cx, b.y - cy) > 260);
    for (let b of bushes) b.noBurn = true;
    story.garden = { t: 18 };
    queueRadio('Bộ đàm: Thực vật ĐỘT BIẾN đang nuốt cả khu vườn — chỉ LỬA mới diệt được chúng! Nhặt Súng Phun Lửa / Bom Lửa ở điểm xuất phát rồi THIÊU sạch.', null, 7);
}
function gardenHasFire(p) { let w = p.weapon; return !!w && (w.isFlamethrower || w.isMolotov || ((p.perks.m_thieu || w.isLegendary) && isKatanaW(w))); }
// Lửa đốt cây (móc trong updateStoryProps cho vật thể fireOnly)
function gardenPropHits(s, dt) {
    let burn = 0;
    for (let b of bullets) {
        if (!b.active || b.isHeli || Math.hypot(b.x - s.x, b.y - s.y) > s.r + 8) continue;
        let wd = b.wepData || {};
        if (b.isFire) burn += b.dmg * arsMult(b.source) * dt * 3;
        else if (b.isTankShell || b.isExplosiveProj || b.isBomb) b.triggerHit();
        else {
            if (wd.incendiary) burn += b.dmg * arsMult(b.source) * 0.6;
            else if (!(s.txtCD > Date.now())) { s.txtCD = Date.now() + 1500; vfxList.push({ type: 'text', text: 'CHỈ LỬA MỚI THIÊU ĐƯỢC!', x: s.x, y: s.y - 60, life: 1.0, color: '#ff9f43' }); }
            b.active = false; createParticles(b.x, b.y, '#27ae60', 3, 120);
        }
    }
    for (let f of fireZones) if (f.kind !== 'acid' && f.kind !== 'arrow' && Math.hypot(f.x - s.x, f.y - s.y) < (f.radius || 40) + s.r) burn += ((f.dmg || 40) * 2 + 80) * dt;
    for (let sl of slashes) {
        if (!sl.active || !sl.isFire || (sl.hitProps && sl.hitProps.has(s)) || Math.hypot(s.x - sl.x, s.y - sl.y) > sl.range + s.r) continue;
        (sl.hitProps = sl.hitProps || new Set()).add(s); burn += sl.dmg * arsMult(sl.source);
    }
    if (burn > 0) { s.hp -= burn; s.burnT = 0.5; if (Math.random() < dt * 20) createParticles(s.x + (Math.random() - 0.5) * 50, s.y + (Math.random() - 0.5) * 50, '#e67e22', 2, 90); }
}
function gardenPlantDead(s) {
    createParticles(s.x, s.y, '#e67e22', 40, 360); createParticles(s.x, s.y, '#2d3436', 24, 220); addDecal(s.x, s.y, '#111', 60, 0.5); addScreenShake(8); Sound.play('explode');
    ashZones.push({ x: s.x, y: s.y, rx: 60, ry: 46, rot: 0, life: 9999 });
    let gain = 5 + Math.floor(currentLevel / 3); shopScrap += gain;
    if (Math.random() < 0.5) spawnDrop(s.x, s.y + 30);
    if (mission.type !== 'BURN_PLANTS' || mission.complete) return;
    mission.progress++;
    vfxList.push({ type: 'text', text: `ĐÃ THIÊU ${mission.progress}/${mission.required} · +${gain} ⚙`, x: s.x, y: s.y - 60, life: 2.0, color: '#ff9f43' });
    if (mission.progress >= mission.required) completeMission();
}
function gardenUpdate(dt) {
    let g = story.garden; if (!g || mission.complete) return;
    let alive = players.filter(p => !p.isDowned);
    for (let s of story.props) {
        if (s.kind !== 'plant') continue;
        if (s.burnT > 0) s.burnT -= dt;
        s.cd -= dt;
        let tgt = null, bd = 520;
        for (let p of alive) { let d = Math.hypot(p.x - s.x, p.y - s.y); if (d < bd) { bd = d; tgt = p; } }
        if (!tgt || tank.active) continue;
        if (s.v === 1) { if (bd < 200) tgt.takeDot(6 * dt); for (let p of alive) if (p !== tgt && Math.hypot(p.x - s.x, p.y - s.y) < 200) p.takeDot(6 * dt); }
        if (s.cd > 0) continue;
        if (s.v === 0 && bd < 140) { s.cd = 1.6; hurtPlayersInRadius(s.x, s.y, 140, 14); spawnRing(s.x, s.y, '#e84393', 140, 0.3, 4); s.biteT = 0.3; }
        else if (s.v === 2) { s.cd = 2.4; for (let j = -1; j <= 1; j++) { let a = Math.atan2(tgt.y - s.y, tgt.x - s.x) + j * 0.18; enemyBullets.push(new EnemyBullet(s.x, s.y, s.x + Math.cos(a) * 100, s.y + Math.sin(a) * 100, 'arrow')); } }
        else s.cd = 0.3;
    }
    // Tiếp tế lửa: không ai cầm vũ khí lửa và trên map hết thùng lửa thì thả thêm Bom Lửa
    g.t -= dt;
    if (g.t <= 0) {
        g.t = 14;
        if (!alive.some(gardenHasFire) && drops.filter(d => d.forceWeapon === 'MOLOTOV' || d.forceWeapon === 'FLAMETHROWER').length < 3 && alive.length) {
            let p = alive[Math.floor(Math.random() * alive.length)];
            gardenFireCrate(p.x + (Math.random() - 0.5) * 300, p.y + (Math.random() - 0.5) * 300, 'MOLOTOV');
            vfxList.push({ type: 'text', text: 'TIẾP TẾ: BOM LỬA Ở GẦN BẠN!', x: p.x, y: p.y - 70, life: 1.8, color: '#ff9f43' });
        }
    }
}
function gardenObjectiveText() {
    if (objState !== 'BURN_PLANTS') return null;
    return [`THIÊU THỰC VẬT ĐỘT BIẾN: ${mission.progress}/${mission.required} (chỉ LỬA có tác dụng)`, '#ff9f43'];
}
function gardenPointers(ptr) { if (objState === 'BURN_PLANTS') for (let p of story.props) if (p.kind === 'plant') ptr(p.x, p.y, '#ff9f43'); }
function drawGardenPlant(p, T) {
    let v = p.v | 0, x = p.x, y = p.y, sw = Math.sin(T * 2 + x) * 4;
    drawShadow(x, y + 10, p.r);
    ctx.lineCap = 'round';
    if (v === 0) {          // hoa ăn thịt: thân + đầu há miệng
        ctx.strokeStyle = '#1e8449'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(x, y + 26); ctx.quadraticCurveTo(x + sw * 2, y, x + sw, y - 26); ctx.stroke();
        let open = 0.35 + 0.25 * Math.sin(T * 5 + y) + (p.biteT > 0 ? 0.5 : 0);
        ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.moveTo(x + sw, y - 26); ctx.arc(x + sw, y - 26, 26, -Math.PI / 2 + open, -Math.PI / 2 - open + Math.PI * 2); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#641e16'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#fdfefe'; for (let j = 0; j < 4; j++) { let a = -Math.PI / 2 + open + 0.12 + j * 0.2; ctx.beginPath(); ctx.arc(x + sw + Math.cos(a) * 24, y - 26 + Math.sin(a) * 24, 2.5, 0, Math.PI * 2); ctx.fill(); }
    } else if (v === 1) {   // nấm bào tử
        ctx.beginPath(); ctx.arc(x, y, 200, 0, Math.PI * 2); ctx.fillStyle = `rgba(155, 89, 182, ${0.06 + 0.02 * Math.sin(T * 3)})`; ctx.fill();
        ctx.fillStyle = '#d7ccc8'; ctx.fillRect(x - 9, y - 6, 18, 32);
        ctx.fillStyle = '#8e44ad'; ctx.beginPath(); ctx.ellipse(x, y - 8, 36, 22, 0, Math.PI, 0); ctx.fill(); ctx.strokeStyle = '#4a235a'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#f5eef8'; for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.arc(x - 20 + j * 13, y - 16 - (j % 2) * 5, 3.5, 0, Math.PI * 2); ctx.fill(); }
    } else {                // cây gai
        ctx.strokeStyle = '#196f3d'; ctx.lineWidth = 8;
        for (let j = 0; j < 5; j++) { let a = -Math.PI / 2 + (j - 2) * 0.5 + sw * 0.01; ctx.beginPath(); ctx.moveTo(x, y + 20); ctx.lineTo(x + Math.cos(a) * 46, y + 20 + Math.sin(a) * 46); ctx.stroke(); }
        ctx.fillStyle = '#f4d03f'; for (let j = 0; j < 5; j++) { let a = -Math.PI / 2 + (j - 2) * 0.5 + sw * 0.01; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 48, y + 20 + Math.sin(a) * 48, 4, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.lineCap = 'butt';
    if (p.burnT > 0) {
        ctx.globalCompositeOperation = 'lighter';
        for (let j = 0; j < 5; j++) { let fx = x + Math.sin(T * 7 + j * 2) * 26, fy = y - 10 - ((T * 60 + j * 17) % 40); ctx.beginPath(); ctx.arc(fx, fy, 10 - ((T * 60 + j * 17) % 40) * 0.2, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255, 140, 0, 0.55)'; ctx.fill(); }
        ctx.globalCompositeOperation = 'source-over';
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    drawMiniBar(x, y + 40, 64, 6, p.hp, p.maxHp, '#ff9f43');
    outlinedText('🔥 ' + PLANT_NAMES[v], x, y - 64, '#ff9f43', 'bold 10px Arial');
}
// Nền cỏ của Vườn Thực Vật (các búi cỏ cố định theo toạ độ)
function drawGardenGrass(x0, x1, y0, y1) {
    ctx.strokeStyle = 'rgba(88, 214, 141, 0.28)'; ctx.lineWidth = 2; ctx.beginPath();
    for (let gx = Math.floor(x0 / 90) * 90; gx < x1; gx += 90) for (let gy = Math.floor(y0 / 90) * 90; gy < y1; gy += 90) {
        let h = Math.abs(Math.sin(gx * 12.9898 + gy * 78.233) * 43758.5453) % 1, px = gx + h * 70, py = gy + ((h * 7) % 1) * 70;
        ctx.moveTo(px - 5, py); ctx.lineTo(px - 8, py - 11); ctx.moveTo(px, py); ctx.lineTo(px, py - 14); ctx.moveTo(px + 5, py); ctx.lineTo(px + 8, py - 11);
    }
    ctx.stroke();
}

// ---------------------------------------------------------------------------
// BẢN ĐỒ CHIẾN DỊCH: muốn đi một chiến dịch phải mua bản đồ của nó (mua 1 lần cho cả lượt chơi)
// ---------------------------------------------------------------------------
const ROUTE_MAPS = { power: 500, mine: 200, labz: 150, hangz: 120, bandit: 120, botanical: 100, cityn: 100 };
const ROUTE_NAMES = { power: 'Nhà Máy Điện', mine: 'Hầm Mỏ', labz: 'Phòng Thí Nghiệm Z', hangz: 'Hang Z', bandit: 'Thị Trấn Cướp', botanical: 'Vườn Thực Vật', cityn: 'Thành Phố N' };
let ownedMaps = {};
function routeNeedsMap(route) { return !!ROUTE_MAPS[route] && !(ownedMaps[route] || (route === 'power' && hasPowerPlantMap)); }
function routeBuyMap(route) {
    let cost = ROUTE_MAPS[route];
    if (shopScrap < cost) { Sound.play('hit'); netToast(`Cần bản đồ ${ROUTE_NAMES[route]}: ⚙ ${cost} (bạn có ⚙ ${shopScrap}).`, 2200); return; }
    askConfirm('🗺 MUA BẢN ĐỒ?', `Bản đồ ${ROUTE_NAMES[route]} giá ⚙ ${cost}. Mua một lần, dùng cho cả lượt chơi.`, () => {
        if (shopScrap < cost || !routeNeedsMap(route)) return;
        shopScrap -= cost; ownedMaps[route] = true; if (route === 'power') hasPowerPlantMap = true;
        Sound.play('upgrade'); netSendSync(); selectRoute(route);
    });
}
// Nhãn giá / đã có bản đồ trên thẻ tuyến đường
function routeMapBadge(route, el) {
    if (!ROUTE_MAPS[route]) return;
    let b = el.querySelector('.map-tag');
    if (!b) { b = document.createElement('div'); b.className = 'map-tag text-[10px] font-bold mt-1'; el.appendChild(b); }
    let need = routeNeedsMap(route);
    b.textContent = need ? `🗺 Cần bản đồ: ⚙ ${ROUTE_MAPS[route]} (bấm để mua)` : '🗺 Đã có bản đồ';
    b.style.color = need ? (shopScrap >= ROUTE_MAPS[route] ? '#f1c40f' : '#ff7675') : '#2ecc71';
}

// ---------------------------------------------------------------------------
// WIKI: tra cứu mọi Link, kỹ năng vũ khí và giá bản đồ (dựng tự động vào bảng Hướng Dẫn)
// ---------------------------------------------------------------------------
const WIKI_TAGS = {
    'XẠ THỦ': '1/2/4/5/6: +5/10/30/50/100% sát thương. 2+: băng đạn x1.25 → x3. 4+: bắn có tỉ lệ hồi đạn. 5: +250 tầm, xuyên +2, +10% headshot.',
    'CHUẨN XÁC': '2/4: +15/30% chí mạng, hệ số chí mạng +0.5/1.0. 4: chí mạng gây Thiêu Đốt, +10% headshot.',
    'SNIPER': '1+: hộp vũ khí dễ ra Súng Ngắm (20%, mốc 4: 40%). 2/4: hệ số chí mạng Súng Ngắm x1.5/x2. 4: +15% headshot.',
    'CẬN CHIẾN': '2/3/4/5: +10/25/50/100% sát thương cận chiến. 3: vũ khí cận chiến +50% độ bền, ném đau hơn 50%.',
    'KIẾM SƯ': '1: hộp thường dễ ra Katana. 2: mỗi nhát chém kèm sóng kiếm. 5: thêm sóng lửa, mở Nộ KIẾM CƯỜNG (đủ 50 mạng), 20 mạng +5% sát thương. 8: 3 sóng kiếm lớn, 50% phản đòn. 10: 5 sóng kiếm, 80% phản đòn, lướt gây nổ.',
    'NHẤT KIẾM': '1: Lướt [C] của Katana hồi 2 giây thay vì 3.',
    'LIỀM': '2: +25% sát thương Liềm. 3: Liềm chém trọn vòng 360°.',
    'NÉM': '2/4: +25/60% sát thương ném. 4: mục tiêu trúng đòn ném choáng lâu hơn.',
    'NỔ': '1/2/4/6: sát thương nổ +10/15/30/50%, tự gây hại −10/20/40/60%. 4: vụ nổ để lại lửa. 6: phạm vi +50%. Minigun quá nhiệt mạnh hơn theo số Link.',
    'TIẾN CÔNG': '2: +15% sát thương. 4: mỗi đòn 15% gây x2.',
    'CHỈ SỐ': '2/4: +8/15% sát thương. 4: giảm 10% sát thương nhận.',
    'ĐẶC BIỆT': '2: giảm 20% sát thương nhận.',
    'ĐẠN': '2: hạ quái có 20% hồi 10% đạn.',
    'TĂNG TIẾN': 'Mỗi Link +15% kinh nghiệm. 3: mỗi map mới +4% sát thương vĩnh viễn.',
    'MAY MẮN': '2: cứ 30 mạng có 25% rơi Hộp Cứu Thương. 4: 30% né hoàn toàn đòn đánh.',
    'HỒI MÁU': '2: hồi máu +50%. 4: tự hồi 1% máu mỗi giây.',
    'TRỢ GIÚP': '1: cứu đồng đội nhanh hơn 30%. 2: người được cứu nhận 3 lớp khiên. 3: hồi máu chia 50% cho đồng đội.',
    'VẬT PHẨM': '2: vật phẩm rơi nhanh hơn 30%. 4: đang cầm vũ khí mà nhặt hộp thường thì nạp 25% đạn.',
    'TẦM NHÌN': '1: tầm tự ngắm 450. 3: tầm 600 và ngắm xuyên tường.',
    'TRỰC THĂNG': '2/3/5: trực thăng đến nhanh hơn 10/20/50%. 3: ở lại bắn yểm trợ, lên máy bay nhanh x2. 5: lên máy bay x3, +2 cấp khi thoát.',
    'CHIẾN XA': '1: trong xe tăng miễn sát thương nổ của mình. 2: xe còn nửa máu thì phát nổ lớn và tự hồi máu. 5: vụ nổ khi lái xe để lại lửa.',
    'TẤN CÔNG TỰ ĐỘNG': '2: Rải Boom và các vũ khí tự động nhanh hơn 30%.',
    'DRONE': '2: drone mạnh hơn. 4: mỗi loại có 2 drone. 5: drone siêu cấp (bắn nhanh, mạnh). 8: thêm Drone Sao Chép.',
    'ĐIỆN': '1/2/3: hộp thường có thể ra Lục Điện / Plasma / Electron Flux. 4: sét lan +3 mục tiêu, tháp đã chiếm tự phóng sét. 5: sét lan +5, Hòm Thính có thể ra Tesla Carbine. 15: sét lan +10.',
    'KHAN_DOC': '2/4: Thiêu Đốt và Ăn Mòn của bạn +30/60%. 4: quái đang dính độc chậm 20%.',
    'THOI_KHONG': '2: Nộ nạp nhanh +50%, kỹ năng [C] hồi nhanh hơn 20%. 3: vệt đạn Súng Ngắm tồn tại gấp đôi, tung Nộ đóng băng quái quanh mình 1.5 giây.',
    'TRIEU_HOI': '1: lính tự hồi máu khi 10 giây không bị đánh. 2: mở thẻ Tiểu Đội Tinh Nhuệ. 4: lính ngã xuống phát nổ. 5: lính chạy nhanh hơn 30% và quay lại sau 20 giây.',
    'QUAN_DOI': '2: lính bắn không lệch và nhanh hơn. 3: đạn lính xuyên 1 mục tiêu. 5: lính +50% máu, +35% sát thương. 6: lính có 15% chí mạng.',
    'DONG_MINH': '1: lính có khiên chặn 1 đòn mỗi 8 giây. 2: lính giảm 25% sát thương nhận. 3: bạn giảm 15% sát thương khi đứng gần lính.',
    'BẬC THẦY': '1: +10% sát thương, Nộ nạp nhanh +25%.'
};
const WIKI_SKILL = {
    KNIFE: 'Lướt về phía trước, đâm xuyên mọi thứ trên đường. Có thẻ Phi Dao: phóng thêm 3 phi dao.', KATANA: 'Chém rộng gần trọn vòng, tầm xa hơn (khi chưa có Nhất Kiếm).',
    AXE: 'Ném rìu xoáy ra trước, chém xuyên rồi tự bay về tay.', SPEAR: 'Quét giáo 360°. Ném [B]: giáo phi xuyên 5 mục tiêu.',
    DUAL_KATANA: 'Vừa lướt vừa chém liên tục, để lại vùng chém hình chữ nhật 2 giây.', SCYTHE: 'Hút quái lại gần rồi gặt một vòng.',
    LIGHTSABER: 'Nhận 3 lớp khiên, xoá đạn địch quanh người.', ELECTRO_WHIP: 'Vòng sét làm choáng, để lại vùng điện 3 giây.',
    FLAMETHROWER: 'Bắn quả cầu lửa nổ thành biển lửa rộng.', ACID_SPRAYER: 'Nổ acid quanh người, ăn mòn mọi quái trong tầm.',
    ELECTRO_CANNON: 'Cầu sét bay chậm, nổ ra để lại vùng điện.', PISTOL_ELECTRO: 'Đạn EMP làm choáng diện rộng 2 giây.',
    PLASMA_RAPID: 'Tự xả đạn 4 giây, không tốn đạn.', ELECTRON_FLUX: 'Một tia xuyên thẳng 720px, gây nhiễm điện.', TESLA_CARBINE: 'Đặt trụ điện giật quái xung quanh 6 giây.'
};
function renderWiki() {
    let box = document.getElementById('wikiAuto'); if (!box) return;
    const sec = (title, col, body) => `<div class="bg-gray-900 p-3 rounded-lg border text-xs" style="border-color:${col}55"><div class="font-bold mb-1" style="color:${col}">${title}</div>${body}</div>`;
    let tags = '';
    for (let t in WIKI_TAGS) { let d = TAG_DEFS[t]; if (!d) continue; let n = UPGRADES.filter(u => u.tags.includes(t)).length; tags += `<div class="mb-1"><b style="color:${d.color}">${d.label || t}</b> <span class="text-gray-500">(${n} thẻ)</span>: ${WIKI_TAGS[t]}</div>`; }
    let sk = '', seen = {};
    for (let k in WSKILL) {
        let w = WEAPON_TYPES[k], d = WSKILL[k]; if (!w || seen[w.name]) continue; seen[w.name] = 1;
        sk += `<div class="mb-1"><b class="text-white">${w.name}</b> — <span style="color:#ffeaa7">${d.name}</span> <span class="text-gray-500">(hồi ${d.cd}s)</span>: ${d.d || WIKI_SKILL[k] || ''}</div>`;
    }
    let rage = Object.keys(RAGE_WEAPONS).map(k => `<b class="text-white">${WEAPON_TYPES[k].name}</b>: ${RAGE_WEAPONS[k]}`).join(' · ');
    let maps = Object.keys(ROUTE_MAPS).map(k => `<b class="text-white">${ROUTE_NAMES[k]}</b> ⚙ ${ROUTE_MAPS[k]}`).join(' · ');
    box.innerHTML = sec('📚 WIKI — TOÀN BỘ LINK (HỆ) VÀ MỐC HIỆU ỨNG', '#f1c40f', tags)
        + sec('⚔ KỸ NĂNG VŨ KHÍ [C / phím Q] — có sẵn, chỉ cần chờ hồi chiêu', '#ffeaa7', sk)
        + sec('💢 NỘ [D / phím R] — cần thẻ "Thịnh Nộ"', '#e056fd', rage + '<br>Hạ quái để nạp Nộ. Katana dùng Nộ KIẾM CƯỜNG theo Link Kiếm Sư 5, không cần thẻ.')
        + sec('🎯 VŨ KHÍ NÉM', '#fab1a0', '<b class="text-white">Phi Tiêu</b>: bắn 1 phi tiêu; Ném [B] tung vòng quanh người theo số còn lại. <b class="text-white">Bom Lửa</b>: giữ bắn để châm, [B] để ném, vỡ thành biển lửa. <b class="text-white">Lựu Đạn</b>: giữ bắn rút chốt, [B] ném.')
        + sec('🗺 BẢN ĐỒ CHIẾN DỊCH (mua ở Bàn Chiến Dịch, một lần cho cả lượt chơi)', '#48dbfb', maps);
}

refreshDiffUI();
refreshSaveUI();
