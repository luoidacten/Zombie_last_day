// ============================================================================
// 17-bosses.js — BIẾN DỊ, THỜI TIẾT XẤU / KHẮC NGHIỆT, CHIÊU BOSS MỚI, GIAO DIỆN BOSS & MÀN CHIẾN THẮNG
//  - Biến dị: quái mạnh dần theo cấp đột biến (cứ 3 map) + quái BIẾN DỊ riêng lẻ (to, trâu, nhanh, đánh đau)
//  - Thời tiết: từ map 5 hay gặp mưa hơn, map 10 thời tiết xấu 85%, map 20 100%. Thời tiết xấu: trực thăng
//    đón nhanh x1.5, khắc nghiệt x2. Thời tiết khắc nghiệt mới: MƯA ĐÁ
//  - The Hucker: Đập Đất & Mưa Đá, Móc Xoay, Bóp Móc Lao Tới, Kéo Tảng Đá (trúng là kết liễu)
//  - Kiến Chúa: mưa axit rơi liên tục, càng mất máu càng dày
//  - Chiêu của boss gây sát thương cả lên zombie thường
//  - Thanh máu boss mới (vệt máu tụt, mốc pha, trạng thái, tên chiêu), màn hạ boss (chậm hình, bầy quái tan rã,
//    hút chiến lợi phẩm, bảng kết quả)
// ============================================================================

// ---------------------------------------------------------------------------
// BIẾN DỊ
// ---------------------------------------------------------------------------
function mutationTier() { return Math.floor(currentLevel / 3); }
// Gọi trong constructor Zombie (trước khi nhân hệ số độ khó)
function zombieMutate(z) {
    if (z.type >= 30 || currentLevel < 3) return;
    let tier = mutationTier();
    z.maxHp *= 1 + tier * 0.12;                                   // mỗi cấp đột biến: +12% máu
    z.baseSpeed *= Math.min(1.25, 1 + tier * 0.03);               // +3% tốc độ (tối đa +25%)
    if (NET.mode === 'guest') return;                              // khách nhận cờ biến dị từ chủ phòng
    if (Math.random() < Math.min(0.3, 0.035 * tier)) makeMutant(z);
}
function makeMutant(z) {
    if (z.mutant) return;
    z.mutant = true; z.maxHp *= 1.8; z.baseSpeed *= 1.15; z.radius = Math.round(z.radius * 1.15);
}
function drawMutantAura(z, T) {
    let r = z.radius, p = 0.5 + 0.5 * Math.sin(T * 6 + (z.nid || 0));
    ctx.beginPath(); ctx.arc(z.x, z.y, r + 7 + p * 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(190, 46, 221, ${0.16 + 0.1 * p})`; ctx.fill();
    ctx.strokeStyle = `rgba(255, 71, 87, ${0.55 + 0.3 * p})`; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.stroke(); ctx.setLineDash([]);
}

// ---------------------------------------------------------------------------
// THỜI TIẾT XẤU / KHẮC NGHIỆT
// ---------------------------------------------------------------------------
const WEATHER_BAD = new Set([2, 3, 6, 7, 11]);
const WEATHER_EXTREME = new Set([4, 9, 10, 12, 13]);
function weatherSeverity(w = currentWeather) { return WEATHER_EXTREME.has(w) ? 2 : (WEATHER_BAD.has(w) ? 1 : 0); }
function heliWeatherMult() { let s = weatherSeverity(); return s === 2 ? 2 : (s === 1 ? 1.5 : 1); }
function rollWeather(initial) {
    let L = currentLevel, pick = (a) => a[Math.floor(Math.random() * a.length)];
    // Map 1-4: 45% xấu; map 5-9: 65% -> 81% và hay mưa hơn; map 10-19: 85%; map 20+: 100%
    let bad = L >= 20 ? 1 : (L >= 10 ? 0.85 : (L >= 5 ? 0.65 + (L - 5) * 0.04 : 0.45));
    if (Math.random() >= bad) { currentWeather = Math.random() < 0.7 ? 1 : 5; return; }
    let ext = L >= 20 ? 0.5 : (L >= 10 ? 0.4 : (L >= 5 ? 0.22 : 0.15));
    let badPool = L >= 5 ? [2, 2, 2, 2, 3, 6, 7] : [2, 3, 3, 6, 7, 7];   // từ map 5 mưa chiếm phần lớn
    currentWeather = Math.random() < ext ? pick(initial && L < 5 ? [4, 9] : [4, 4, 9, 10, 12, 13]) : pick(badPool);
}
function weatherTag(w = currentWeather) { let s = weatherSeverity(w); return s === 2 ? 'KHẮC NGHIỆT' : (s === 1 ? 'XẤU' : ''); }
function weatherIntroText() {
    let t = getWeatherName(), tag = weatherTag();
    if (tag) t += ` (${tag} · trực thăng x${heliWeatherMult()})`;
    if (currentLevel >= 3 && mutationTier() > 0) t += ` · ☣ Biến dị cấp ${mutationTier()}`;
    return t;
}
function weatherChanged(prev) {
    if (currentWeather === prev || objState === 'HUB') return;
    let s = weatherSeverity();
    if (s === 0) return;
    netToast(`${s === 2 ? '⚠ THỜI TIẾT KHẮC NGHIỆT' : '🌧 Thời tiết xấu'}: ${getWeatherName()} — trực thăng đón nhanh x${heliWeatherMult()}`, 3200);
}
// Mưa đá: hạt đá rơi khắp nơi, trúng cả người lẫn quái
let hailT = 0;
function updateWeatherExtras(dt) {
    if (currentWeather !== 13 || objState === 'HUB' || objState === 'TRAIN' || isCaveMap()) return;
    hailT -= dt;
    if (hailT > 0) return;
    hailT = 0.12;
    let p = pickAlivePlayer(), near = Math.random() < 0.5;   // 50% hạt rơi sát người chơi
    hazards.push({ type: 'hail', x: p.x + (Math.random() - 0.5) * (near ? 420 : 1300), y: p.y + (Math.random() - 0.5) * (near ? 420 : 900), radius: 36, timer: 0.9, life: 1.0, dmg: 12 + currentLevel * 0.8 });
}

// ---------------------------------------------------------------------------
// CHIÊU BOSS TRÚNG CẢ ZOMBIE
// ---------------------------------------------------------------------------
function bossHitZombies(x, y, r, dmg, kb = 260) {
    dmg *= 1 + currentLevel * 0.25;   // quái map sau trâu hơn: chiêu boss vẫn phải đau
    for (let z of zombies) {
        if (z.hp <= 0 || z.hidden || isBossType(z.type) || z.type === 38) continue;
        let d = Math.hypot(z.x - x, z.y - y);
        if (d > r + z.radius) continue;
        z.hp -= dmg; z.hitFlash = 0.12;
        if (kb) { let a = Math.atan2(z.y - y, z.x - x); z.knockback(Math.cos(a) * kb, Math.sin(a) * kb); }
        if (z.hp <= 0) zombieDown(z, null);
    }
}
function bossHitZombiesSeg(ax, ay, bx, by, w, dmg) {
    dmg *= 1 + currentLevel * 0.25;
    for (let z of zombies) {
        if (z.hp <= 0 || z.hidden || isBossType(z.type) || z.type === 38) continue;
        if (distancePointToSegment(z.x, z.y, ax, ay, bx, by) > w + z.radius) continue;
        z.hp -= dmg; z.hitFlash = 0.12;
        if (z.hp <= 0) zombieDown(z, null);
    }
}

// ---------------------------------------------------------------------------
// THE HUCKER: CHIÊU MỚI
// ---------------------------------------------------------------------------
const SPIN_LEN = 600, SPIN_W = 1.15, SPIN_T = 5.6, SPIN_WIND = 1.3;
function huckerStart(z, skill, target, dist, ang) {
    if (skill === 'rocks') {
        hazards.push({ type: 'quake', x: z.x, y: z.y, radius: 210, timer: 0.8, life: 1.0, dmg: 50, stun: 0.5, bz: 380 });
        z.hs = { k: 'rocks', t: 0 }; bossSay(z, 'ĐẬP ĐẤT — MƯA ĐÁ!', '#e17055'); Sound.play('anvil');
    } else if (skill === 'hookdash') {
        startZombieCharge(z, target, 0.75, 680);
        z.hs = { k: 'dash', t: 0 }; bossSay(z, 'BÓP MÓC — LAO TỚI!', '#e17055'); Sound.play('clang');
    } else if (skill === 'spin') {
        let dir = Math.random() < 0.5 ? 1 : -1;
        let h = { type: 'hspin', x: z.x, y: z.y, radius: dir * SPIN_LEN, timer: SPIN_WIND, t0: SPIN_WIND, life: SPIN_WIND + SPIN_T, dmg: 75, boss: z, ang, dir };
        hazards.push(h); z.hs = { k: 'spin', t: 0, h }; z.spinCD = 15;
        bossSay(z, `MÓC XOAY ${dir > 0 ? '↻' : '↺'} — CHẠY THEO CHIỀU XÍCH!`, '#ff7675'); Sound.play('throw');
    } else if (skill === 'boulder') {
        let a = Math.atan2(target.y - z.y, target.x - z.x), back = 240 + Math.random() * 120;
        let bx = target.x + Math.cos(a) * back, by = target.y + Math.sin(a) * back, A = story.arena;
        if (A) { let d = Math.hypot(bx - A.x, by - A.y), lim = A.r - 90; if (d > lim) { bx = A.x + (bx - A.x) / d * lim; by = A.y + (by - A.y) / d * lim; } }
        let h = { type: 'hboulder', x: bx, y: by, radius: 56, timer: 1.4, t0: 1.4, life: 4.6, boss: z, v: 250 };
        hazards.push(h); z.hs = { k: 'boulder', t: 0, h };
        bossSay(z, 'KÉO TẢNG ĐÁ — RA KHỎI ĐƯỜNG KÉO!', '#ff7675'); Sound.play('throw');
    }
}
// Trả về true khi The Hucker đang bận ra chiêu mới
function huckerSkillTick(z, target, dist, ang, dt) {
    if (z.spinCD > 0) z.spinCD -= dt;
    let s = z.hs; if (!s) return false;
    s.t += dt; z.spCD = Math.max(z.spCD, 1.1);
    if (s.k === 'rocks') {
        if (s.t >= 0.8) { huckerRocks(z); z.hs = null; z.rootTimer = 0.5; }
        return true;
    }
    if (s.k === 'dash') {
        if (!updateZombieCharge(z, dt, { speed: 780, time: 0.9, dmg: 60, stun: 0.6, push: 230, selfStun: 1.1 })) { z.hs = null; return false; }
        if (z.isCharging) bossHitZombies(z.x, z.y, z.radius + 26, 800, 480);
        storyArenaClamp(z);
        return true;
    }
    if (!hazards.includes(s.h) || s.t > 12) { z.hs = null; return false; }
    return true;
}
// Ném đá lên trời: rơi xuống TỪNG VIÊN một quanh người chơi
function huckerRocks(z) {
    let n = z.phase2Done ? 9 : 6, al = players.filter(p => !p.isDowned); if (!al.length) al = players;
    let A = story.arena;
    for (let k = 0; k < n; k++) {
        let p = al[k % al.length], spread = k < 2 ? 60 : 520;
        let x = p.x + (Math.random() - 0.5) * spread, y = p.y + (Math.random() - 0.5) * spread;
        if (A) { let d = Math.hypot(x - A.x, y - A.y), lim = A.r - 70; if (d > lim) { x = A.x + (x - A.x) / d * lim; y = A.y + (y - A.y) / d * lim; } }
        let t = 1.5 + k * 0.45;
        hazards.push({ type: 'hrock', x, y, radius: 88, timer: t, life: t + 0.15, dmg: 55 });
    }
    createParticles(z.x, z.y, '#7f8c8d', 40, 380); spawnRing(z.x, z.y, '#a1887f', 160, 0.4, 6); Sound.play('throw');
}
function updateSpin(h, dt) {
    let z = h.boss;
    if (!z || z.hp <= 0 || z.gone || z.hidden) { h.life = 0; return; }
    let L = Math.abs(h.radius), ext = L;
    if (h.timer > 0) ext = L * Math.max(0.05, 1 - h.timer / h.t0);
    else {
        h.ang += h.dir * SPIN_W * dt;
        if (!h.go) { h.go = true; addScreenShake(8); }
        h.snd = (h.snd || 0) - dt; if (h.snd <= 0) { h.snd = 0.75; Sound.play('swoosh'); }
    }
    h.x = z.x + Math.cos(h.ang) * ext; h.y = z.y + Math.sin(h.ang) * ext;
    if (h.timer > 0) return;
    let tang = h.ang + h.dir * Math.PI / 2;
    const onChain = (e, w) => Math.hypot(e.x - z.x, e.y - z.y) > z.radius && distancePointToSegment(e.x, e.y, z.x, z.y, h.x, h.y) < (e.radius || 14) + w;
    if (!tank.active) for (let p of players) {
        if (p.isDowned || (p._spinHit || 0) > survivalTime || !onChain(p, 22)) continue;
        p._spinHit = survivalTime + 0.55;   // đứng yên sẽ bị xích bắt kịp và quất liên tục
        p.takeDamage(h.dmg); stunPlayer(p, 0.35);
        for (let s = 0; s < 10; s++) { p.x += Math.cos(tang) * 10; p.y += Math.sin(tang) * 10; resolveCollision(p); }
        vfxList.push({ type: 'text', text: 'DÍNH XÍCH XOAY!', x: p.x, y: p.y - 40, life: 1.0, color: '#ff7675' });
    } else if (tank.p2InvulnTimer <= 0 && !(h.tankHit > survivalTime) && onChain(tank, 22)) { h.tankHit = survivalTime + 1; tank.hp -= 45; }
    for (let a of allies) if (a.hp > 0 && !((a._spinHit || 0) > survivalTime) && onChain(a, 20)) { a._spinHit = survivalTime + 0.8; a.takeDamage(h.dmg * 0.6); }
    for (let n of rescueNPCs) if (n.hp > 0 && !((n._spinHit || 0) > survivalTime) && onChain(n, 20)) { n._spinHit = survivalTime + 0.8; n.takeDamage(h.dmg * 0.5); }
    bossHitZombiesSeg(z.x, z.y, h.x, h.y, 22, 99999);
}
function updateBoulder(h, dt) {
    let z = h.boss;
    if (!z || z.hp <= 0 || z.gone || z.hidden) { h.life = 0; return; }
    if (h.timer > 0) return;
    if (!h.go) { h.go = true; Sound.play('clang'); addScreenShake(6); }
    h.v = Math.min(1250, h.v + 1700 * dt);
    let a = Math.atan2(z.y - h.y, z.x - h.x), d = Math.hypot(z.x - h.x, z.y - h.y), step = Math.min(d, h.v * dt), R = Math.abs(h.radius);
    h.x += Math.cos(a) * step; h.y += Math.sin(a) * step;
    if (Math.random() < dt * 30) createParticles(h.x, h.y, '#8d6e63', 2, 140);
    if (!tank.active) for (let p of players) {
        if (p.isDowned || Math.hypot(p.x - h.x, p.y - h.y) > R + p.radius) continue;
        if (p.perks.invulnTimer > 0) continue;
        p.hp = 0; p.goDown();
        vfxList.push({ type: 'text', text: 'KẾT LIỄU!', x: p.x, y: p.y - 46, life: 1.6, color: '#ff4757' });
        addScreenShake(18); Sound.play('tank');
    } else if (!h.tankHit && Math.hypot(tank.x - h.x, tank.y - h.y) < R + tank.radius) { h.tankHit = true; tank.hp -= 260; addScreenShake(16); }
    for (let al of allies) if (al.hp > 0 && Math.hypot(al.x - h.x, al.y - h.y) < R + al.radius) al.takeDamage(99999);
    for (let n of rescueNPCs) if (n.hp > 0 && Math.hypot(n.x - h.x, n.y - h.y) < R + n.radius) n.takeDamage(600);
    bossHitZombies(h.x, h.y, R, 99999, 0);
    if (d - step <= z.radius + R * 0.6) {
        h.life = 0;
        createParticles(h.x, h.y, '#7f8c8d', 60, 420); createParticles(h.x, h.y, '#5d4037', 24, 260);
        spawnRing(z.x, z.y, '#a1887f', z.radius + 150, 0.4, 8); addScreenShake(16); Sound.play('explode');
        hurtPlayersInRadius(z.x, z.y, z.radius + 150, 35, { stun: 0.4 });
        bossHitZombies(z.x, z.y, z.radius + 150, 500, 380);
        z.rootTimer = 1.0; bossSay(z, 'NGHIỀN NÁT!', '#e17055');
    }
}

// ---------------------------------------------------------------------------
// KIẾN CHÚA: MƯA AXIT LIÊN TỤC (càng mất máu càng dày)
// ---------------------------------------------------------------------------
function queenAcidRain(z, A, dt) {
    if (z.breaking > 0 || !A) return;
    let tent = zombies.filter(e => e.type === 46 && e.hp > 0).length;
    let danger = z.phase === 1 ? Math.min(1, Math.max(0, 1 - z.hp / z.maxHp) / 0.45) * 0.5 : 0.5 + (4 - tent) * 0.125;
    z.rainT = (z.rainT === undefined ? 1.5 : z.rainT) - dt;
    if (z.rainT > 0) return;
    z.rainT = Math.max(0.28, 1.3 - danger);
    let n = 1 + Math.floor(danger * 2.5), al = players.filter(p => !p.isDowned);
    for (let k = 0; k < n; k++) {
        let x, y;
        if (al.length && Math.random() < 0.35) { let p = al[Math.floor(Math.random() * al.length)]; x = p.x + (Math.random() - 0.5) * 320; y = p.y + (Math.random() - 0.5) * 320; }
        else { let a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * (A.r - 80); x = A.x + Math.cos(a) * r; y = A.y + Math.sin(a) * r; }
        let t = 1.25 + Math.random() * 0.4;
        hazards.push({ type: 'acidbomb', x, y, radius: 64 + danger * 16, timer: t, life: t + 0.2, dmg: 20, pool: 1.6 });
    }
    createParticles(z.x, z.y, '#2ecc71', 4, 220);
}

// ---------------------------------------------------------------------------
// TRẬN TRÊN NÓC TÀU: The Hucker ném đá, quét xích; kết thúc bằng vụ nổ C4 rồi tàu lao vào hầm
// ---------------------------------------------------------------------------
function railHuckerAttacks(r, dt) {
    if (r.stun > 0 || r.fin >= 0) return;
    r.rockT = (r.rockT === undefined ? 5 : r.rockT) - dt;
    if (r.rockT <= 0) {
        r.rockT = Math.max(3.2, 6 - r.dist / 300) + Math.random() * 1.5;
        let n = 3 + (r.dist > 500 ? 2 : 0), al = players.filter(p => !p.isDowned);
        for (let k = 0; k < n; k++) {
            let p = al.length && Math.random() < 0.5 ? al[k % al.length] : null;
            let x = p ? p.x + (Math.random() - 0.5) * 160 : ROOF.x0 + 30 + Math.random() * (ROOF.x1 - ROOF.x0 - 60);
            let y = p ? p.y + (Math.random() - 0.5) * 160 : ROOF.y0 + 80 + Math.random() * (ROOF.y1 - ROOF.y0 - 160);
            x = Math.max(ROOF.x0 + 20, Math.min(ROOF.x1 - 20, x)); y = Math.max(ROOF.y0 + 40, Math.min(ROOF.y1 - 40, y));
            let t = 1.15 + k * 0.38;
            hazards.push({ type: 'hrock', x, y, radius: 78, timer: t, life: t + 0.15, dmg: 40 });
        }
        railMsg('THE HUCKER NÉM ĐÁ LÊN NÓC TÀU!', 1.6); Sound.play('throw');
    }
    r.sweepT = (r.sweepT === undefined ? 13 : r.sweepT) - dt;
    if (r.sweepT <= 0 && r.dist > 150) {
        r.sweepT = Math.max(7, 13 - r.dist / 200) + Math.random() * 3;
        let p = pickAlivePlayer(), y = Math.max(ROOF.y0 + 60, Math.min(ROOF.y1 - 60, p.y + (Math.random() - 0.5) * 120));
        hazards.push({ type: 'hsweep', x: (ROOF.x0 + ROOF.x1) / 2, y, radius: 50, timer: 1.4, t0: 1.4, life: 1.7, dmg: 50 });
        railMsg('⚠ XÍCH QUÉT NGANG — NÉ RA KHỎI VẠCH ĐỎ!', 1.6); Sound.play('clang');
    }
}
function railStartFinale(r) {
    r.fin = 0; r.boost = 6;
    story.props = story.props.filter(c => c.kind !== 'chain');
    for (let z of zombies) if (z.hp > 0) { z.hp = 0; z._credited = true; z.noLoot = true; createParticles(z.x, z.y, '#95a5a6', 8, 200); }
    hazards = hazards.filter(h => h.friendly);
    railMsg('BINH SĨ CẮT RỜI TOA ĐUÔI — C4 ĐÃ GÀI!', 2.0); Sound.play('level');
}
function railFinale(r, dt) {
    let t0 = r.fin; r.fin += dt;
    r.speed = Math.min(150, r.speed + 40 * dt); r.dist += r.speed / 100 * 19 * dt;
    const hx = (ROOF.x0 + ROOF.x1) / 2, hy = ROOF.y1 + 250;
    const boom = (at, big) => {
        if (!(t0 < at && r.fin >= at)) return;
        let x = hx + (Math.random() - 0.5) * (big ? 0 : 200), y = hy + (Math.random() - 0.5) * (big ? 0 : 120);
        vfxList.push({ type: 'flash', x, y, r: big ? 520 : 240, life: 0.5, max: 0.5 });
        createParticles(x, y, '#e67e22', big ? 120 : 40, big ? 900 : 500); createParticles(x, y, '#f1c40f', big ? 60 : 20, 600); createParticles(x, y, '#2d3436', big ? 50 : 16, 400);
        spawnRing(x, y, '#ff9f43', big ? 600 : 220, 0.6, big ? 14 : 6);
        addScreenShake(big ? 34 : 14); Sound.play('explode');
        if (big) { addScreenFlash(0.55, 60); Sound.play('big_roar'); railMsg('BÙMMM! THE HUCKER BỊ THỔI BAY KHỎI ĐƯỜNG RAY!', 2.4); }
    };
    boom(0.9, true); boom(1.25, false); boom(1.6, false); boom(2.0, false);
    if (r.fin >= 4.2 && !r.end) { r.win = true; r.end = 2.4; railMsg('ĐOÀN TÀU ĐÃ LAO VÀO HẦM AN TOÀN!', 3); Sound.play('level'); }
}
// Vẽ thêm trên nóc tàu (gọi trong drawRail): C4 nhấp nháy, Hucker bị thổi bay, trần hầm phủ tối
function drawRailFinale(r, T, x0, x1, y0, y1) {
    if (!(r.fin >= 0)) return;
    const cx = (ROOF.x0 + ROOF.x1) / 2;
    if (r.fin < 0.9) {
        let on = Math.floor(T * 10) % 2 === 0;
        ctx.fillStyle = '#c0392b'; ctx.fillRect(cx - 16, ROOF.y1 - 22, 32, 18);
        ctx.fillStyle = on ? '#ff4757' : '#5c1010'; ctx.beginPath(); ctx.arc(cx, ROOF.y1 - 13, 4, 0, Math.PI * 2); ctx.fill();
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; outlinedText('C4', cx, ROOF.y1 - 38, '#ff4757', 'bold 14px Arial');
    } else {
        let k = r.fin - 0.9, fy = ROOF.y1 + 250 + k * 90;
        for (let j = 0; j < 6; j++) { let tt = (T * 1.4 + j / 6) % 1; ctx.beginPath(); ctx.arc(cx + Math.sin(j * 2.3) * 70, fy - tt * 140, 30 + tt * 70, 0, Math.PI * 2); ctx.fillStyle = `rgba(${j % 2 ? '230,126,34' : '60,60,60'}, ${0.45 * (1 - tt)})`; ctx.fill(); }
    }
    let ty = ROOF.y0 - 900 + (r.dist - (ROOF.tunnel - 80)) / 80 * 760 - 120;
    if (ty > y0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.82)'; ctx.fillRect(x0, y0, x1 - x0, ty - y0);
        ctx.strokeStyle = '#636e72'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(x0, ty); ctx.lineTo(x1, ty); ctx.stroke();
    }
}

// ---------------------------------------------------------------------------
// VÒNG CẬP NHẬT (chủ phòng, mỗi khung hình — gọi từ updateSkills)
// ---------------------------------------------------------------------------
function updateBossExtras(dt) {
    for (let z of zombies) if (z._t0 === undefined && z.hp > 0 && isBossType(z.type)) z._t0 = survivalTime;
    updateWeatherExtras(dt);
    for (let h of hazards) {
        if (h.type === 'hspin') { updateSpin(h, dt); continue; }
        if (h.type === 'hboulder') { updateBoulder(h, dt); continue; }
        if (h.done || !(h.timer <= 0)) continue;
        if (h.type === 'hrock') {
            h.done = true; h.life = 0;
            hurtPlayersInRadius(h.x, h.y, h.radius, h.dmg || 50, { stun: 0.35 });
            bossHitZombies(h.x, h.y, h.radius, 420, 300);
            for (let a of allies) if (a.hp > 0 && Math.hypot(a.x - h.x, a.y - h.y) < h.radius) a.takeDamage((h.dmg || 50) * 0.5);
            for (let n of rescueNPCs) if (n.hp > 0 && Math.hypot(n.x - h.x, n.y - h.y) < h.radius) n.takeDamage((h.dmg || 50) * 0.4);
            if (tank.active && tank.p2InvulnTimer <= 0 && Math.hypot(tank.x - h.x, tank.y - h.y) < h.radius + tank.radius) tank.hp -= (h.dmg || 50) * 0.5;
            if (story.rail) story.rail.hp -= 1.5;
            createParticles(h.x, h.y, '#95a5a6', 32, 320); createParticles(h.x, h.y, '#5d4037', 12, 160);
            spawnRing(h.x, h.y, '#bdc3c7', h.radius * 1.15, 0.3, 5); addDecal(h.x, h.y, '#2b2b2b', h.radius * 0.45, 0.4);
            addScreenShake(8); Sound.play('tank');
        } else if (h.type === 'hail') {
            h.done = true; h.life = 0;
            hurtPlayersInRadius(h.x, h.y, h.radius, h.dmg || 8);
            bossHitZombies(h.x, h.y, h.radius, 25 + currentLevel * 3, 0);
            createParticles(h.x, h.y, '#dff9fb', 6, 120);
        } else if (h.type === 'hsweep') {
            h.done = true;
            let xa = ROOF.x0 - 40, xb = ROOF.x1 + 40;
            for (let p of players) {
                if (p.isDowned || Math.abs(p.y - h.y) > h.radius + p.radius) continue;
                p.takeDamage(h.dmg); stunPlayer(p, 0.5);
                vfxList.push({ type: 'text', text: 'BỊ XÍCH QUÉT!', x: p.x, y: p.y - 40, life: 1.0, color: '#ff7675' });
            }
            for (let a of allies) if (a.hp > 0 && Math.abs(a.y - h.y) < h.radius + a.radius) a.takeDamage(h.dmg * 0.6);
            bossHitZombiesSeg(xa, h.y, xb, h.y, h.radius, 99999);
            addScreenShake(14); Sound.play('swoosh'); createParticles((xa + xb) / 2, h.y, '#b2bec3', 30, 400);
        }
    }
    // Sau khi hạ boss: hút chiến lợi phẩm về phía người chơi gần nhất
    if (bossWin && (performance.now() - bossWin.at) / 1000 < 3.5) {
        bossWin.gain = Math.max(0, shopScrap - bossWin.scrap0);
        let al = players.filter(p => !p.isDowned);
        if (al.length) for (let d of drops) {
            let p = al.reduce((b, q) => Math.hypot(q.x - d.x, q.y - d.y) < Math.hypot(b.x - d.x, b.y - d.y) ? q : b, al[0]);
            let dd = Math.hypot(p.x - d.x, p.y - d.y);
            if (dd > 1100 || dd < 4) continue;
            let st = Math.min(dd, 720 * dt); d.x += (p.x - d.x) / dd * st; d.y += (p.y - d.y) / dd * st;
        }
    }
}

// ---------------------------------------------------------------------------
// HẠ BOSS: chậm hình, sóng xung kích làm bầy quái tan rã, bảng kết quả
// ---------------------------------------------------------------------------
let bossWin = null, bossCast = null, slowMoT = 0;
function bossOnZombieDown(z) {
    if (z.mutant && NET.mode !== 'guest') { shopScrap += 1; vfxList.push({ type: 'text', text: '☣ +1 ⚙', x: z.x, y: z.y - 26, life: 0.9, color: '#e056fd' }); }
    if (!isBossType(z.type) || z.type === 46) return;
    let fight = z._t0 !== undefined ? survivalTime - z._t0 : 0;
    bossWin = { name: BOSS_NAMES[z.type] || 'BOSS', color: z.color, at: performance.now(), max: 5.5, time: fight, scrap0: shopScrap, gain: 0 };
    bossCast = null; slowMoT = 1.4;
    vfxList.push({ type: 'flash', x: z.x, y: z.y, r: 420, life: 0.5, max: 0.5 });
    spawnRing(z.x, z.y, '#f1c40f', 520, 0.8, 12); spawnRing(z.x, z.y, '#ffffff', 300, 0.5, 6);
    createParticles(z.x, z.y, '#f1c40f', 90, 620); createParticles(z.x, z.y, z.color, 50, 420);
    addScreenShake(22); Sound.play('explode'); Sound.play('level');
    // Bầy quái tan rã: gần thì chết theo sóng xung kích, xa thì khựng lại
    for (let e of zombies) {
        if (e === z || e.hp <= 0 || !(e.type < 35 || (e.type >= 40 && e.type <= 43))) continue;
        let d = Math.hypot(e.x - z.x, e.y - z.y);
        if (d < 650) { e.hp = 0; createParticles(e.x, e.y, e.color, 8, 200); zombieDown(e, null); }
        else if (d < 1300) e.stunTimer = Math.max(e.stunTimer || 0, 2.5);
    }
}
// Hệ số thời gian cho gameLoop: chậm hình 0.3 rồi tăng dần về 1
function bossTimeScale(dt) {
    if (slowMoT <= 0) return 1;
    slowMoT -= dt;
    return slowMoT > 0.5 ? 0.3 : 0.3 + (0.5 - Math.max(0, slowMoT)) / 0.5 * 0.7;
}
// Tên chiêu boss hiện to dưới thanh máu (thay cho dòng chữ nổi nhỏ trên đầu boss)
const _bossSay0 = bossSay;
bossSay = function (z, text, color) {
    if (z && isBossType(z.type) && z.type !== 46) bossCast = { text, color: color || z.color, at: performance.now() };
    else _bossSay0(z, text, color);
};

// ---------------------------------------------------------------------------
// GIAO DIỆN: THANH MÁU BOSS & BẢNG CHIẾN THẮNG
// ---------------------------------------------------------------------------
const BOSS_PHASES = { 30: [0.5], 37: [0.65, 0.35], 45: [0.55], 50: [0.5] };
// Vẽ thanh máu boss ở đỉnh màn hình, trả về chiều cao đã dùng
function drawBossHud(b, y, bw) {
    let now = performance.now() / 1000, dtv = Math.min(0.1, now - (b._tl || now)); b._tl = now;
    let pct = Math.max(0, Math.min(1, b.hp / b.maxHp)), x = W / 2 - bw / 2, bh = 14;
    if (b._trail === undefined || b._trail < pct) b._trail = pct; else if (now - (b._hitAt || 0) > 0.6) b._trail = Math.max(pct, b._trail - 0.35 * dtv);
    if (b._lastPct !== undefined && pct < b._lastPct - 0.0005) b._hitAt = now;
    b._lastPct = pct;
    let locked = b.hidden || b.invuln || (b.type === 45 && b.phase === 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; ctx.fillRect(x - 8, y, bw + 16, 42);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left'; outlinedText('☠ ' + (BOSS_NAMES[b.type] || 'BOSS'), x, y + 10, b.color, 'bold 13px Arial');
    let state = locked ? 'BẤT TỬ' : (b.exhaust > 0 ? 'KIỆT SỨC x2' : ((b.chargeStun > 0 || b.stunTimer > 0 || b.downed) ? 'CHOÁNG' : ''));
    ctx.textAlign = 'right'; outlinedText((state ? state + '  ' : '') + Math.ceil(pct * 100) + '%', x + bw, y + 10, state ? (locked ? '#b2bec3' : '#f1c40f') : '#fff', 'bold 12px Arial');
    let by = y + 21;
    ctx.fillStyle = 'rgba(40, 10, 10, 0.9)'; ctx.fillRect(x, by, bw, bh);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'; ctx.fillRect(x, by, bw * b._trail, bh);
    let g = ctx.createLinearGradient(x, by, x, by + bh); g.addColorStop(0, '#ffffff'); g.addColorStop(0.25, b.color); g.addColorStop(1, b.color);
    ctx.fillStyle = locked ? '#636e72' : g; ctx.fillRect(x, by, bw * pct, bh);
    if (locked) {
        ctx.save(); ctx.beginPath(); ctx.rect(x, by, bw * pct, bh); ctx.clip();
        ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 4;
        for (let sx = x - 20 + (now * 30) % 16; sx < x + bw; sx += 16) { ctx.beginPath(); ctx.moveTo(sx, by + bh); ctx.lineTo(sx + bh, by); ctx.stroke(); }
        ctx.restore();
    }
    if (pct < 0.25 && !locked) { ctx.fillStyle = `rgba(255, 255, 255, ${0.18 * (0.5 + 0.5 * Math.sin(now * 12))})`; ctx.fillRect(x, by, bw * pct, bh); }
    for (let ph of (BOSS_PHASES[b.type] || [])) { let tx = x + bw * ph; ctx.fillStyle = pct > ph ? '#f1c40f' : 'rgba(255,255,255,0.35)'; ctx.fillRect(tx - 1.5, by - 3, 3, bh + 6); }
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, by + 0.5, bw, bh);
    let used = 48;
    let c = bossCast, age = c ? now - c.at / 1000 : 9;
    if (c && age < 1.9) {
        let a = Math.min(1, age * 6) * Math.min(1, (1.9 - age) * 3), pop = 1 + 0.3 * Math.max(0, 1 - age * 5);
        ctx.globalAlpha = a; ctx.textAlign = 'center';
        outlinedText(c.text, W / 2, y + used + 12, c.color, `900 ${Math.round(Math.min(22, bw / 18) * pop)}px Arial`, 5);
        ctx.globalAlpha = 1; used += 28;
    }
    return used;
}
function drawBossOverlay(T) {
    let v = bossWin; if (!v) return;
    let age = (performance.now() - v.at) / 1000;
    if (age > v.max || gameState !== 'PLAYING') { bossWin = null; return; }
    let a = Math.min(1, age * 3) * Math.min(1, (v.max - age) * 2), cy = H * 0.23, size = Math.round(Math.min(56, W / (v.name.length * 0.75)));
    ctx.save(); ctx.globalAlpha = a;
    let grd = ctx.createLinearGradient(0, cy - size * 1.6, 0, cy + size * 1.9);
    grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(0.3, 'rgba(0,0,0,0.6)'); grd.addColorStop(0.7, 'rgba(0,0,0,0.6)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd; ctx.fillRect(0, cy - size * 1.6, W, size * 3.5);
    // tia sáng xoay sau tên boss
    ctx.translate(W / 2, cy); ctx.rotate(T * 0.4);
    for (let k = 0; k < 10; k++) { ctx.rotate(Math.PI / 5); ctx.fillStyle = 'rgba(241, 196, 15, 0.07)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, -40); ctx.lineTo(W, 40); ctx.closePath(); ctx.fill(); }
    ctx.restore(); ctx.save(); ctx.globalAlpha = a;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    outlinedText('⚔  ĐÃ HẠ GỤC BOSS  ⚔', W / 2, cy - size * 0.95, '#f1c40f', `bold ${Math.max(13, Math.round(size * 0.34))}px Arial`, 4);
    let pop = 1 + 0.35 * Math.max(0, 1 - age * 3);
    ctx.shadowColor = v.color; ctx.shadowBlur = 26;
    outlinedText(v.name, W / 2, cy, '#ffffff', `900 ${Math.round(size * pop)}px Arial`, 8);
    ctx.shadowBlur = 0;
    let fmt = (s) => { s = Math.max(0, Math.floor(s)); return `${Math.floor(s / 60)}:${s % 60 < 10 ? '0' : ''}${s % 60}`; };
    let fs = Math.max(12, Math.round(size * 0.3));
    let line = `⏱ Thời gian: ${fmt(v.time)}` + (v.gain > 0 ? `     ⚙ +${v.gain} phế liệu` : '');
    if (age > 0.5) outlinedText(line, W / 2, cy + size * 0.85, '#dfe6e9', `bold ${fs}px Arial`, 4);
    if (age > 1.0) outlinedText('Bầy quái tan rã — chiến lợi phẩm đang bay về phía bạn!', W / 2, cy + size * 0.85 + fs + 8, '#badc58', `bold ${Math.max(11, fs - 2)}px Arial`, 3);
    let obj = age > 1.6 ? getObjectiveText() : null;
    if (obj) outlinedText('TIẾP THEO: ' + obj[0], W / 2, cy + size * 0.85 + (fs + 8) * 2, obj[1], `bold ${Math.max(11, fs - 2)}px Arial`, 3);
    ctx.restore();
}

// ---------------------------------------------------------------------------
// VẼ HIỂM HOẠ: vật rơi từ trên trời (đá, axit, mưa đá), móc xoay, tảng đá kéo, xích quét
// ---------------------------------------------------------------------------
const FALL_HZ = { hrock: 'rock', rock: 'rock', rockfall: 'rock', acidbomb: 'acid', hail: 'hail' };
function drawFallingHazard(h, T) {
    let kind = FALL_HZ[h.type];
    if (!kind || !(h.timer > 0) || h.timer > 1.1) return;
    let k = h.timer / 1.1, R = h.radius || 80, y = h.y - k * 560;
    let sz = kind === 'rock' ? Math.min(44, R * 0.42) : (kind === 'acid' ? R * 0.28 : 7);
    let sh = 1.2 - k * 0.7;
    ctx.beginPath(); ctx.ellipse(h.x, h.y, sz * sh, sz * 0.5 * sh, 0, 0, Math.PI * 2); ctx.fillStyle = `rgba(0,0,0,${0.4 * (1 - k * 0.6)})`; ctx.fill();
    if (kind === 'rock') {
        ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = sz * 0.5; ctx.beginPath(); ctx.moveTo(h.x, y - sz * 2.4); ctx.lineTo(h.x, y - sz); ctx.stroke();
        ctx.save(); ctx.translate(h.x, y); ctx.rotate(T * 3 + h.x * 0.01);
        ctx.beginPath();
        for (let j = 0; j < 8; j++) { let a = j / 8 * Math.PI * 2, rr = sz * (0.78 + 0.22 * Math.sin(j * 2.7 + h.x)); j ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
        ctx.closePath(); ctx.fillStyle = '#6d6d6d'; ctx.fill(); ctx.strokeStyle = '#2d2d2d'; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.arc(-sz * 0.25, -sz * 0.25, sz * 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    } else if (kind === 'acid') {
        ctx.fillStyle = 'rgba(46, 204, 113, 0.35)'; ctx.beginPath(); ctx.ellipse(h.x, y - sz * 1.4, sz * 0.5, sz * 1.4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(h.x, y, sz, 0, Math.PI * 2); ctx.fillStyle = '#2ecc71'; ctx.fill(); ctx.strokeStyle = '#145a32'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(h.x - sz * 0.3, y - sz * 0.3, sz * 0.3, 0, Math.PI * 2); ctx.fill();
    } else {
        ctx.fillStyle = '#ecf0f1'; ctx.beginPath(); ctx.arc(h.x, y, sz, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#74b9ff'; ctx.lineWidth = 1.5; ctx.stroke();
    }
}
function drawBoulderRock(x, y, R, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.beginPath();
    for (let j = 0; j < 10; j++) { let a = j / 10 * Math.PI * 2, rr = R * (0.82 + 0.18 * Math.sin(j * 3.1)); j ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.closePath(); ctx.fillStyle = '#7b6a5a'; ctx.fill(); ctx.strokeStyle = '#2d241c'; ctx.lineWidth = 4; ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-R * 0.4, -R * 0.2); ctx.lineTo(R * 0.1, R * 0.1); ctx.lineTo(R * 0.3, R * 0.5); ctx.stroke();
    ctx.restore();
}
function drawBossHazard(h, T) {
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (h.type === 'hsweep') {
        let xa = (typeof ROOF !== 'undefined' ? ROOF.x0 : h.x - 180) - 40, xb = (typeof ROOF !== 'undefined' ? ROOF.x1 : h.x + 180) + 40;
        if (h.timer > 0) {
            let pct = Math.max(0, Math.min(1, h.timer / (h.t0 || 1.4)));
            ctx.fillStyle = `rgba(255, 71, 87, ${0.12 + 0.2 * (1 - pct)})`; ctx.fillRect(xa, h.y - h.radius, xb - xa, h.radius * 2);
            ctx.strokeStyle = '#ff4757'; ctx.lineWidth = 2; ctx.strokeRect(xa, h.y - h.radius, xb - xa, h.radius * 2);
            ctx.fillStyle = 'rgba(255, 71, 87, 0.35)'; ctx.fillRect(xa, h.y - h.radius * (1 - pct), xb - xa, h.radius * 2 * (1 - pct));
            outlinedText('⛓ XÍCH QUÉT', (xa + xb) / 2, h.y, '#fff', 'bold 14px Arial');
        } else {
            let a = Math.max(0, h.life / 0.3);
            ctx.strokeStyle = `rgba(223, 230, 233, ${a})`; ctx.lineWidth = 12; ctx.setLineDash([16, 8]);
            ctx.beginPath(); ctx.moveTo(xa, h.y); ctx.lineTo(xb, h.y); ctx.stroke(); ctx.setLineDash([]);
        }
        return;
    }
    let z = h.boss || zombies.find(e => e.type === 37 && !e.hidden);
    if (!z) return;
    if (h.type === 'hspin') {
        let L = Math.abs(h.radius) || SPIN_LEN, dir = h.radius < 0 ? -1 : 1, ang = Math.atan2(h.y - z.y, h.x - z.x);
        if (h.timer > 0) {
            // báo trước: vòng mũi tên xoay theo chiều xích
            ctx.save(); ctx.translate(z.x, z.y);
            ctx.beginPath(); ctx.arc(0, 0, L, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255, 71, 87, 0.07)'; ctx.fill();
            ctx.strokeStyle = 'rgba(255, 118, 117, 0.7)'; ctx.lineWidth = 3; ctx.setLineDash([22, 14]); ctx.lineDashOffset = -dir * T * 60; ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
            for (let j = 0; j < 6; j++) {
                let a = j / 6 * Math.PI * 2 + dir * T * 1.5, rr = L * 0.55;
                ctx.save(); ctx.translate(Math.cos(a) * rr, Math.sin(a) * rr); ctx.rotate(a + dir * Math.PI / 2);
                ctx.fillStyle = 'rgba(255, 118, 117, 0.85)'; ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-10, -12); ctx.lineTo(-4, 0); ctx.lineTo(-10, 12); ctx.closePath(); ctx.fill();
                ctx.restore();
            }
            ctx.restore();
            outlinedText(dir > 0 ? '↻ CHẠY THEO CHIỀU KIM ĐỒNG HỒ' : '↺ CHẠY NGƯỢC CHIỀU KIM ĐỒNG HỒ', z.x, z.y - z.radius - 70, '#ff7675', 'bold 16px Arial', 4);
        } else {
            ctx.beginPath(); ctx.moveTo(z.x, z.y); ctx.arc(z.x, z.y, L, ang - dir * 0.6, ang, dir < 0); ctx.closePath();
            ctx.fillStyle = 'rgba(225, 112, 85, 0.2)'; ctx.fill();
        }
        ctx.strokeStyle = '#636e72'; ctx.lineWidth = h.timer > 0 ? 5 : 9; ctx.setLineDash([12, 7]);
        ctx.beginPath(); ctx.moveTo(z.x, z.y); ctx.lineTo(h.x, h.y); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = '#dfe6e9'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(h.x, h.y, 16, ang - 1.2, ang + 2.4); ctx.stroke(); ctx.lineCap = 'butt';
        return;
    }
    if (h.type === 'hboulder') {
        let R = Math.abs(h.radius) || 56, ang = Math.atan2(z.y - h.y, z.x - h.x), d = Math.hypot(z.x - h.x, z.y - h.y);
        if (h.timer > 0) {
            let pct = Math.max(0, Math.min(1, h.timer / (h.t0 || 1.4)));
            ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(ang);
            ctx.fillStyle = `rgba(255, 71, 87, ${0.14 + 0.12 * Math.sin(T * 16) + 0.15 * (1 - pct)})`; ctx.fillRect(0, -R, d, R * 2);
            ctx.strokeStyle = '#ff4757'; ctx.lineWidth = 2; ctx.strokeRect(0, -R, d, R * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            for (let sx = (T * 160) % 70 + R; sx < d - 20; sx += 70) { ctx.beginPath(); ctx.moveTo(sx + 16, 0); ctx.lineTo(sx, -12); ctx.lineTo(sx + 5, 0); ctx.lineTo(sx, 12); ctx.closePath(); ctx.fill(); }
            ctx.restore();
            outlinedText('☠ TRÁNH ĐƯỜNG KÉO — TRÚNG LÀ CHẾT', h.x, h.y - R - 22, '#ff4757', 'bold 13px Arial', 4);
        }
        let reach = h.timer > 0 ? Math.min(1, 1 - h.timer / (h.t0 || 1.4)) * 1.6 : 1;
        let ex = z.x - Math.cos(ang) * d * Math.min(1, reach), ey = z.y - Math.sin(ang) * d * Math.min(1, reach);
        ctx.strokeStyle = '#b2bec3'; ctx.lineWidth = 6; ctx.setLineDash([12, 7]); ctx.beginPath(); ctx.moveTo(z.x, z.y); ctx.lineTo(ex, ey); ctx.stroke(); ctx.setLineDash([]);
        drawShadow(h.x, h.y + 8, R);
        drawBoulderRock(h.x, h.y, R, (h.x + h.y) * 0.02);
    }
}

// ---------------------------------------------------------------------------
// ĐỒNG BỘ ONLINE (gắn vào storyNetState / storyNetApply)
// ---------------------------------------------------------------------------
function bossNetState(x) {
    const R = Math.round, now = performance.now();
    if (bossWin) x.bw = [bossWin.name, bossWin.color, R((now - bossWin.at) / 10), R(bossWin.max * 100), R(bossWin.time), bossWin.gain | 0];
    if (bossCast && now - bossCast.at < 1900) x.bc = [bossCast.text, bossCast.color, R((now - bossCast.at) / 10)];
}
function bossNetApply(x) {
    const now = performance.now();
    let w = x.bw;
    if (Array.isArray(w)) { if (!bossWin || bossWin.name !== String(w[0])) bossWin = { name: String(w[0]), color: String(w[1]), at: now - (w[2] | 0) * 10, max: (w[3] | 0) / 100 || 5, time: +w[4] || 0, gain: w[5] | 0, scrap0: 0 }; else bossWin.gain = w[5] | 0; }
    let c = x.bc;
    if (Array.isArray(c) && (!bossCast || bossCast.text !== String(c[0]))) bossCast = { text: String(c[0]), color: String(c[1]), at: now - (c[2] | 0) * 10 };
}

['hspin', 'hboulder', 'hsweep'].forEach(t => ARS_HZ.add(t));
