// ============================================================================
// 20-queen.js
//  - Acid của quái (Acidier, vũng acid, mưa acid, Ăn Mòn) đốt chậm hơn, KHÔNG giết được người chơi và chỉ đốt tới 50% máu
//  - Hạ KIẾN CHÚA: mở khoá vĩnh viễn (localStorage zs_queen_slain)
//      * Súng Phun Acid CẢI TIẾN: sau kỹ năng NỔ ACID mọc cánh bay 5 giây — bay qua địa hình, miễn sát thương tầm gần,
//        vẫn bắn thường được; hồi chiêu / Nộ chỉ chạy lại khi đã đáp đất. Cầm súng Acid: giảm 80% sát thương acid.
//      * 5 thẻ nâng cấp mới: Kiến Chúa (kiến nhỏ hỗ trợ), Acid+++, Ăn Mòn Vật Thể, Dị Chất, Nộ Acid: Ăn Mòn Khu Vực
//      * Phần thưởng: Hòm Thính chứa súng Phun Acid đặt cạnh lửa trại khi về căn cứ
// ============================================================================
let queenSlain = false;
try { queenSlain = localStorage.getItem('zs_queen_slain') === '1'; } catch (e) { }
function acidGunUpgraded(p) { return queenSlain && !!p && !!p.weapon && p.weapon.key === 'ACID_SPRAYER'; }

// Sát thương acid của quái lên người chơi: không bao giờ kéo máu xuống dưới 50%
function acidHurt(p, amt) {
    if (!p || p.isDowned || !(amt > 0)) return;
    let floor = p.maxHp * 0.5;
    if (p.hp <= floor) return;
    if (acidGunUpgraded(p)) amt *= 0.2;
    let a = Math.min(amt, (p.hp - floor) / Math.max(0.05, p.getDefenseMult()));
    if (a > 0) p.takeDot(a);
}

// ---------------------------------------------------------------------------
// MỞ KHOÁ KHI HẠ KIẾN CHÚA
// ---------------------------------------------------------------------------
function queenUnlock() {
    let first = !queenSlain;
    queenSlain = true; try { localStorage.setItem('zs_queen_slain', '1'); } catch (e) { }
    base.gift = 'ACID_SPRAYER';
    netToast(first ? '🐜 HẠ KIẾN CHÚA! Mở khoá SÚNG ACID CẢI TIẾN (cánh bay sau kỹ năng, giảm 80% sát thương acid) và 5 THẺ ACID mới. Súng đang chờ ở căn cứ!'
        : '🐜 Hạ Kiến Chúa lần nữa! Súng Phun Acid cải tiến đang chờ ở căn cứ.', 6500);
}
const _bossOnZombieDown0 = bossOnZombieDown;
bossOnZombieDown = function (z) {
    _bossOnZombieDown0(z);
    if (NET.mode === 'guest') return;
    if (z.type === 45) queenUnlock();
    else if (!isBossType(z.type) && z.type !== 38) mutagenCheck(z);
};

UPGRADES.push(
    { id: 'q_brood', type: 'Tuyệt Kỹ', name: 'Kiến Chúa', desc: 'Cứ 7 giây sinh ra 3 kiến nhỏ cắn quái hỗ trợ (sống 15 giây, cắn gây Ăn Mòn). Mở khi đã hạ Kiến Chúa.', tags: ['KHAN_DOC', 'TRIEU_HOI'], req: 'queen' },
    { id: 'q_acidPlus', type: 'Kỹ Năng', name: 'Acid+++', desc: 'Ăn Mòn do bạn gây ra đốt đau hơn 70%. Mở khi đã hạ Kiến Chúa.', tags: ['KHAN_DOC', 'TIẾN CÔNG'], req: 'queen' },
    { id: 'q_linger', type: 'Kỹ Năng', name: 'Ăn Mòn Vật Thể', desc: 'Vũng acid của bạn tồn tại lâu hơn 70%, rộng hơn 30% và 30% loang thêm một vũng. Mở khi đã hạ Kiến Chúa.', tags: ['KHAN_DOC'], req: 'queen' },
    { id: 'q_mutagen', type: 'Kỹ Năng', name: 'Dị Chất', desc: 'Kẻ thù chết có 2% nổ tung thành một vũng acid lớn. Mở khi đã hạ Kiến Chúa.', tags: ['KHAN_DOC', 'ĐẶC BIỆT'], req: 'queen' },
    { id: 'q_acidRage', type: 'Tuyệt Kỹ', name: 'Nộ Acid: Ăn Mòn Khu Vực', desc: 'Súng Phun Acid có Nộ [D]: nổ acid lấy bạn làm tâm rồi bay 8 giây, liên tục thả acid xuống. Không cần thẻ Thịnh Nộ. Mở khi đã hạ Kiến Chúa.', tags: ['KHAN_DOC', 'TIẾN CÔNG'], req: 'queen' }
);
const _canOfferUpgrade0 = canOfferUpgrade;
canOfferUpgrade = function (p, u) { if (u.req === 'queen' && !queenSlain) return false; return _canOfferUpgrade0(p, u); };

// ---------------------------------------------------------------------------
// CÁNH KIẾN: BAY
// ---------------------------------------------------------------------------
function startFly(p, t, rage) {
    p.flyT = Math.max(p.flyT || 0, t); p.flyMax = p.flyT;
    p.flyRage = rage ? t : 0; p.flyDrop = 0;
    p.flyCD = p.skillC_CD || 0; p.flyHold = p.rage || 0;
    createParticles(p.x, p.y, '#7bed9f', 30, 260); spawnRing(p.x, p.y, '#2ecc71', 120, 0.4, 6);
    arsText(p, `🪽 CÁNH KIẾN — BAY ${t} GIÂY`, '#7bed9f', 1.4); Sound.play('insect');
}
const _skillTryC0 = skillTryC;
skillTryC = function (p) {
    if (p.flyT > 0) { if (!(p.flyTextCD > Date.now())) { p.flyTextCD = Date.now() + 1000; arsText(p, 'ĐANG BAY — ĐÁP ĐẤT MỚI DÙNG KỸ NĂNG', '#b2bec3', 0.9); } return false; }
    let k = p.weapon && p.weapon.key, ok = _skillTryC0(p);
    if (ok && k === 'ACID_SPRAYER' && queenSlain) startFly(p, 5, false);
    return ok;
};
const _skillTick0 = skillTick;
skillTick = function (p, dt) { _skillTick0(p, dt); flyTick(p, dt); };
function flyTick(p, dt) {
    if (!(p.flyT > 0)) return;
    p.flyT -= dt;
    p.skillC_CD = Math.max(p.skillC_CD || 0, p.flyCD || 0);   // hồi chiêu chỉ chạy khi đã đáp đất
    p.rage = Math.min(p.rage || 0, p.flyHold || 0);            // Nộ cũng không tích khi đang bay
    if (p.flyRage > 0) {
        p.flyRage -= dt; p.flyDrop -= dt;
        if (p.flyDrop <= 0) {
            p.flyDrop = 0.3;
            fireZones.push({ kind: 'acid', x: p.x + (Math.random() - 0.5) * 50, y: p.y + (Math.random() - 0.5) * 50, life: 3.5, dmg: 40 * p.getTotalDamageMult(), source: p, radius: 85 });
            createParticles(p.x, p.y + 10, '#2ecc71', 6, 160);
        }
    }
    if (p.isDowned) p.flyT = 0;
    if (p.flyT <= 0) {
        p.flyT = 0; p.flyRage = 0;
        if (isBlockedPoint(p.x, p.y, p.radius)) { let sp = findSafePoint(p.x, p.y, p.radius); p.x = sp.x; p.y = sp.y; }
        createParticles(p.x, p.y, '#95a5a6', 20, 200); spawnRing(p.x, p.y, '#7bed9f', 90, 0.3, 4);
        arsText(p, 'ĐÁP ĐẤT', '#dfe6e9', 0.9);
    }
}
// Đang bay: bay qua tường / chướng ngại (chỉ giữ trong bản đồ)
const _resolveCollision0 = resolveCollision;
resolveCollision = function (e) {
    if (e && e.flyT > 0 && e instanceof Player) { e.x = Math.max(e.radius, Math.min(MAP_SIZE.w - e.radius, e.x)); e.y = Math.max(e.radius, Math.min(MAP_SIZE.h - e.radius, e.y)); return; }
    return _resolveCollision0(e);
};
// Đang bay: miễn sát thương tầm gần (quái áp sát cắn / đấm không tới)
(function () {
    const td = Player.prototype.takeDamage;
    Player.prototype.takeDamage = function (a) {
        if (this.flyT > 0 && zombies.some(z => z.hp > 0 && !z.hidden && Math.hypot(z.x - this.x, z.y - this.y) < z.radius + this.radius + 45)) return;
        return td.call(this, a);
    };
})();
function drawAntWings(p, T) {
    let flap = Math.sin(T * 40) * 0.35, a = Math.atan2(p.facingY || 0, p.facingX || 1);
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(a);
    ctx.globalAlpha = 0.6;
    for (let s = -1; s <= 1; s += 2) for (let k = 0; k < 2; k++) {
        ctx.save(); ctx.rotate(s * (1.9 + k * 0.5 + flap));
        ctx.beginPath(); ctx.ellipse(18 + k * 2, 0, 22 - k * 5, 8 - k * 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = k ? 'rgba(200, 255, 220, 0.8)' : 'rgba(123, 237, 159, 0.85)'; ctx.fill();
        ctx.strokeStyle = '#1e8449'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
    }
    ctx.restore(); ctx.globalAlpha = 1;
    drawShadow(p.x, p.y + 24, p.radius * 0.8);
    drawMiniBar(p.x, p.y + 30, 40, 4, p.flyT, p.flyMax || 5, '#7bed9f');
}
const _drawArsenalPlayer0 = drawArsenalPlayer;
drawArsenalPlayer = function (p, T) { if (p.flyT > 0) drawAntWings(p, T); _drawArsenalPlayer0(p, T); };

// ---------------------------------------------------------------------------
// NỘ ACID: ĂN MÒN KHU VỰC
// ---------------------------------------------------------------------------
RAGE_WEAPONS.ACID_SPRAYER = 'ĂN MÒN KHU VỰC';
const _skillRageOK0 = skillRageOK;
skillRageOK = function (p, w) { if (w && w.key === 'ACID_SPRAYER') return !!p.perks.q_acidRage; return _skillRageOK0(p, w); };
const _arsenalRage0 = arsenalRage;
arsenalRage = function (p) {
    if (p.flyT > 0) { if (!(p.rageTextCD > Date.now())) { p.rageTextCD = Date.now() + 1000; arsText(p, 'ĐANG BAY — ĐÁP ĐẤT MỚI DÙNG NỘ', '#b2bec3', 0.9); } return; }
    let w = p.weapon;
    if (!w || w.key !== 'ACID_SPRAYER') return _arsenalRage0(p);
    if (!p.perks.q_acidRage) { if (!(p.rageTextCD > Date.now())) { p.rageTextCD = Date.now() + 1200; arsText(p, 'NỘ ACID CẦN THẺ "NỘ ACID: ĂN MÒN KHU VỰC"', '#b2bec3', 0.9); } return; }
    if ((p.rage || 0) < 100) { if (!(p.rageTextCD > Date.now())) { p.rageTextCD = Date.now() + 800; arsText(p, 'NỘ ' + Math.floor(p.rage || 0) + '%', '#b2bec3', 0.7); } return; }
    let mult = p.getTotalDamageMult();
    for (let z of zombies) {
        if (z.hp <= 0 || z.hidden || Math.hypot(z.x - p.x, z.y - p.y) > 320 + z.radius) continue;
        applyStatus(z, STATUS.CORROSION, { duration: 5, stacks: 6, dpsPercent: 0.0045, maxStacks: 8, source: p });
        z.hp -= 350 * mult; z.lastHitBy = p; zombieDown(z, p);
    }
    fireZones.push({ kind: 'acid', x: p.x, y: p.y, life: 5, dmg: 50 * mult, source: p, radius: 120 });
    for (let j = 0; j < 10; j++) { let a = j / 10 * Math.PI * 2, r = 150 + (j % 2) * 110; fireZones.push({ kind: 'acid', x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r, life: 5, dmg: 40 * mult, source: p, radius: 90 }); }
    createParticles(p.x, p.y, '#2ecc71', 90, 520); spawnRing(p.x, p.y, '#2ecc71', 340, 0.6, 10);
    vfxList.push({ type: 'flash', x: p.x, y: p.y, r: 360, life: 0.4, max: 0.4, color: '46,204,113' });
    addScreenShake(16); Sound.play('explode');
    p.rage = 0;
    arsText(p, 'ĂN MÒN KHU VỰC!', '#2ecc71', 1.4);
    startFly(p, 8, true);
};

// ---------------------------------------------------------------------------
// THẺ: Acid+++ / Ăn Mòn Vật Thể / Dị Chất / Kiến Chúa (kiến nhỏ hỗ trợ)
// ---------------------------------------------------------------------------
const _arsenalDotMult0 = arsenalDotMult;
arsenalDotMult = function (s) {
    let m = _arsenalDotMult0(s);
    if (s && s.id === STATUS.CORROSION && s.source && s.source.perks && s.source.perks.q_acidPlus) m *= 1.7;
    return m;
};
function mutagenCheck(z) {
    let src = players.find(p => p.perks && p.perks.q_mutagen && !p.isDowned);
    if (!src || Math.random() >= 0.02) return;
    let mult = src.getTotalDamageMult();
    fireZones.push({ kind: 'acid', x: z.x, y: z.y, life: 4, dmg: 45 * mult, source: src, radius: 120 });
    for (let e of zombies) if (e !== z && e.hp > 0 && Math.hypot(e.x - z.x, e.y - z.y) < 140 + e.radius) applyStatus(e, STATUS.CORROSION, { duration: 4, stacks: 3, dpsPercent: 0.0045, maxStacks: 8, source: src });
    createParticles(z.x, z.y, '#2ecc71', 40, 360); spawnRing(z.x, z.y, '#2ecc71', 140, 0.35, 6);
    vfxList.push({ type: 'text', text: 'DỊ CHẤT!', x: z.x, y: z.y - 30, life: 1.0, color: '#2ecc71' });
    Sound.play('hit');
}
let antPets = [];
function queenTick(dt) {
    if (objState === 'HUB') { antPets = []; return; }
    // Ăn Mòn Vật Thể: vũng acid của người chơi lâu hơn, rộng hơn, loang thêm
    let extra = [];
    for (let fz of fireZones) {
        if (fz.kind !== 'acid' || fz._q || !fz.source || !fz.source.perks || !fz.source.perks.q_linger) continue;
        fz._q = 1; fz.life *= 1.7; fz.radius *= 1.3;
        if (Math.random() < 0.3 && fireZones.length + extra.length < 160) extra.push({ ...fz, x: fz.x + (Math.random() - 0.5) * 140, y: fz.y + (Math.random() - 0.5) * 140, _q: 1 });
    }
    if (extra.length) fireZones.push(...extra);
    // Kiến Chúa: sinh kiến nhỏ
    for (let p of players) {
        if (!p.perks.q_brood || p.isDowned) continue;
        p.broodT = (p.broodT === undefined ? 2 : p.broodT) - dt;
        if (p.broodT <= 0 && antPets.length < 12) {
            p.broodT = 7;
            for (let k = 0; k < 3; k++) antPets.push({ x: p.x + (Math.random() - 0.5) * 60, y: p.y + (Math.random() - 0.5) * 60, life: 15, cd: 0, a: 0, owner: p });
            createParticles(p.x, p.y, '#6ab04c', 18, 180); Sound.play('insect');
        }
    }
    for (let a of antPets) {
        a.life -= dt; a.cd -= dt;
        let o = a.owner, tz = getNearestZombie(a.x, a.y, 460);
        let tx = tz ? tz.x : o.x + Math.cos(a.life * 2) * 50, ty = tz ? tz.y : o.y + Math.sin(a.life * 2) * 50;
        let d = Math.hypot(tx - a.x, ty - a.y), stop = tz ? tz.radius + 8 : 30;
        a.a = Math.atan2(ty - a.y, tx - a.x);
        if (d > stop) { let st = Math.min(d - stop, 250 * dt); a.x += Math.cos(a.a) * st; a.y += Math.sin(a.a) * st; }
        if (tz && d < tz.radius + 14 && a.cd <= 0) {
            a.cd = 0.5;
            tz.hp -= (18 + currentLevel * 4) * o.getTotalDamageMult(); tz.lastHitBy = o; tz.hitFlash = 0.08;
            applyStatus(tz, STATUS.CORROSION, { duration: 2, stacks: 1, dpsPercent: 0.0045, maxStacks: 8, source: o });
            zombieDown(tz, o);
        }
    }
    antPets = antPets.filter(a => a.life > 0);
}
const _updateBossExtras0 = updateBossExtras;
updateBossExtras = function (dt) { _updateBossExtras0(dt); queenTick(dt); };
function drawAntPets(T) {
    for (let a of antPets) {
        let w = Math.sin(T * 30 + a.x) * 0.4, fade = Math.min(1, a.life);
        ctx.save(); ctx.globalAlpha = fade; ctx.translate(a.x, a.y); ctx.rotate(a.a);
        ctx.strokeStyle = '#1e3d12'; ctx.lineWidth = 1.5;
        for (let s = -1; s <= 1; s += 2) for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(k * 3, 0); ctx.lineTo(k * 3 + w * s * 3, s * 8); ctx.stroke(); }
        ctx.fillStyle = '#6ab04c';
        ctx.beginPath(); ctx.ellipse(-6, 0, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(5, 0, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
}
const _drawStoryProps0 = drawStoryProps;
drawStoryProps = function (T, vis) { _drawStoryProps0(T, vis); drawAntPets(T); };
