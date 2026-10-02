// ============================================================================
// 11-arsenal.js
//  - NỘI TẠI ĐỘC TÔN + KỸ NĂNG NỘ [D] của 5 vũ khí: Minigun, Súng Ngắm, Búa/Rìu, Cung, Phun Lửa
//  - Drone Do Thám (làm lại), hiệu ứng Link mới (ĐỘC TỐ, THỜI KHÔNG, LIỀM, BẬC THẦY...)
//  - Đổi thẻ (Reroll) ở màn nâng cấp, Lưu / Tải lượt chơi
// Các file khác chỉ gọi vào đây qua móc ngắn (arsenal*).
// ============================================================================
const ARS_HZ = new Set(['rift', 'deadzone', 'firewall', 'slashzone']);
const RAGE_WEAPONS = { MINIGUN: 'XẢ ÁP SUẤT', SNIPER: 'PHÁN QUYẾT', HAMMER: 'TRỜI SẬP', AXE: 'TRỜI SẬP', BAT: 'TRỜI SẬP', IRON_BAT: 'TRỜI SẬP', BOW: 'PHÂN RÃ', FLAMETHROWER: 'BỨC TƯỜNG LỬA' };
const REROLL_COST = 5;
let runMode = 'pc';                 // chế độ của lượt chơi hiện tại (dùng cho Lưu / Tải)

function arsText(p, text, color, life = 1.2) { vfxList.push({ type: 'text', text, x: p.x, y: p.y - 58, life, color }); }
function arsMult(src) { return (src && src.getTotalDamageMult) ? src.getTotalDamageMult() : 1; }

// ---------------------------------------------------------------------------
// MÓC TRONG Player
// ---------------------------------------------------------------------------
// Gọi ở đầu mỗi map
function arsenalLevelStart() {
    for (let p of players) {
        p.mgHeat = 0; p.jamT = 0; p.ventT = 0; p.leapT = 0; p.blinkCD = 0; p.rewindUsed = false; p.flurryT = 0; p.overT = 0;
        if (p.rage === undefined) p.rage = 0;
        // Link TĂNG TIẾN mốc 3: mỗi map mới +4% sát thương vĩnh viễn
        if (currentLevel > 1 && (p.tags['TĂNG TIẾN'] || 0) >= 3) p.dmgMult += 0.04;
    }
}

function arsenalAddRage(p, amt) {
    if ((p.tags['THOI_KHONG'] || 0) >= 2) amt *= 1.5;
    if ((p.tags['BẬC THẦY'] || 0) >= 1) amt *= 1.25;
    let before = p.rage || 0;
    p.rage = Math.min(100, before + amt);
    if (before < 100 && p.rage >= 100 && p.weapon && RAGE_WEAPONS[p.weapon.key] && skillRageOK(p, p.weapon)) { arsText(p, 'NỘ ĐẦY! [D] ' + RAGE_WEAPONS[p.weapon.key], '#e056fd', 1.6); Sound.play('shard'); }
}

function arsenalPlayerTick(p, dt) {
    if (p.blinkCD > 0) p.blinkCD -= dt;
    skillTick(p, dt);
    // --- Minigun: thanh Nhiệt ---
    if (p.jamT > 0) {
        p.jamT -= dt; p.mgHeat = Math.max(0, (p.mgHeat || 0) - 34 * dt);
        if (Math.random() < dt * 18) createParticles(p.x + p.facingX * 34, p.y + p.facingY * 34, '#636e72', 1, 60);
        if (p.jamT <= 0) arsText(p, 'NÒNG ĐÃ NGUỘI', '#2ecc71', 0.9);
    } else if (p.mgHeat > 0 && Date.now() - p.lastFireTime > 220) p.mgHeat = Math.max(0, p.mgHeat - 22 * dt);
    // --- Xả Áp Suất: đứng yên xả đạn loạn xạ 2 giây ---
    if (p.ventT > 0) {
        p.ventT -= dt;
        p.ventAcc = (p.ventAcc || 0) + dt * 46;
        let dmg = p.ventDmg || 50;
        while (p.ventAcc >= 1) {
            p.ventAcc -= 1;
            bullets.push(new Bullet(p.x, p.y, Math.random() * Math.PI * 2, { name: 'Minigun', key: 'MINIGUN', type: 'gun', range: 560, dmg, wallPiercing: true, incendiary: true, pierce: 2 }, p));
        }
        if (Math.random() < dt * 30) createParticles(p.x, p.y, '#e67e22', 2, 240);
        addScreenShake(3);
    }
    // --- Trời Sập: đang bật nhảy ---
    if (p.leapT > 0) {
        p.leapT -= dt;
        p.x += Math.cos(p.leapAng) * 380 * dt; p.y += Math.sin(p.leapAng) * 380 * dt; resolveCollision(p);
        if (p.leapT <= 0) arsenalHammerLand(p);
    }
}

// Hệ số tốc độ chạy do vũ khí / kỹ năng
function arsenalPlayerSpeed(p) {
    if (p.ventT > 0 || p.leapT > 0 || p.flurryT > 0) return 0;
    if (p.weapon && p.weapon.key === 'HAMMER') return 0.8;      // Trọng Lực: cầm Búa chậm 20%
    return 1;
}

// true = không bắn được (kẹt nòng / đang xả áp suất / đang nhảy)
function arsenalBlockShot(p) {
    if (p.ventT > 0 || p.leapT > 0 || p.flurryT > 0) return true;
    if (p.weapon && p.weapon.key === 'MINIGUN' && p.jamT > 0) {
        if (!(p.jamTextCD > Date.now())) { p.jamTextCD = Date.now() + 700; arsText(p, 'KẸT NÒNG ' + p.jamT.toFixed(1) + 's', '#ff7675', 0.6); }
        return true;
    }
    return false;
}

// Trước khi tạo viên đạn: Minigun tích Nhiệt, trên 50% thành đạn lửa
function arsenalPreShot(p, w, now) {
    if (w.key !== 'MINIGUN') return;
    let gap = Math.min(0.05, Math.max(0.012, (now - p.lastFireTime) / 1000));
    p.mgHeat = (p.mgHeat || 0) + 30 * gap;
    if (p.mgHeat >= 50) { w.incendiary = true; w.dmg *= 1 + 0.08 * Math.min(6, p.tags['NỔ'] || 0); }
    if (p.mgHeat >= 100) {
        p.mgHeat = 100; p.jamT = 3.0;
        arsText(p, 'QUÁ NHIỆT - KẸT NÒNG 3s!', '#ff4757', 1.4); Sound.play('hit');
        createParticles(p.x + p.facingX * 34, p.y + p.facingY * 34, '#e67e22', 20, 220);
    }
}
// Minigun không còn "băng đạn": 4 phát mới mòn 1 độ bền nòng
function arsenalFreeShot(p) {
    if (!p.weapon || p.weapon.key !== 'MINIGUN') return false;
    p.mgWear = (p.mgWear || 0) + 1;
    if (p.mgWear >= 4) { p.mgWear = 0; return false; }
    return true;
}

// Búa / Rìu: mỗi cú vung dội một luồng sóng âm hình nón, quái trúng sóng bị GIẢM GIÁP (nhận +50% sát thương đạn)
function arsenalMeleeSwing(p, wep, angle) {
    if (wep.key !== 'HAMMER' && wep.key !== 'AXE') return;
    let r = wep.range * (wep.key === 'HAMMER' ? 2.5 : 2.9), half = 0.55;
    for (let z of zombies) {
        if (z.hp <= 0 || z.flying || z.airborne) continue;
        let d = Math.hypot(z.x - p.x, z.y - p.y);
        if (d > r + z.radius) continue;
        let a = Math.atan2(z.y - p.y, z.x - p.x);
        if (Math.abs(Math.atan2(Math.sin(a - angle), Math.cos(a - angle))) > half) continue;
        z.vulnT = 5;
        if (d > wep.range) { z.hp -= calcDamage(wep.dmg * 0.35, wep, z.x, z.y, p, z); z.knockback(Math.cos(angle) * 220, Math.sin(angle) * 220); zombieDown(z, p); }
    }
    vfxList.push({ type: 'cone', x: p.x, y: p.y, angle, r, half, life: 0.35, max: 0.35 });
}

// Bước Nhảy Không Gian (thẻ Thời Không)
function arsenalBlink(p) {
    createParticles(p.x, p.y, '#8e44ad', 24, 260); spawnRing(p.x, p.y, '#8e44ad', 70, 0.3);
    for (let s = 0; s < 10; s++) { p.x += p.facingX * 23; p.y += p.facingY * 23; resolveCollision(p); }
    createParticles(p.x, p.y, '#e056fd', 24, 260); spawnRing(p.x, p.y, '#e056fd', 90, 0.3);
    p.perks.invulnTimer = Math.max(p.perks.invulnTimer || 0, 0.35);
    p.blinkCD = 6; Sound.play('saber');
}
// Tua Ngược: cứu 1 lần mỗi map
function arsenalRewind(p) {
    if (!p.perks.tk_rewind || p.rewindUsed) return false;
    p.rewindUsed = true; p.hp = p.maxHp * 0.4; p.perks.invulnTimer = 1.5;
    for (let z of zombies) if (!isBossType(z.type) && Math.hypot(z.x - p.x, z.y - p.y) < 420) z.stunTimer = Math.max(z.stunTimer || 0, 2.5);
    spawnRing(p.x, p.y, '#8e44ad', 420, 0.6, 8); createParticles(p.x, p.y, '#e056fd', 60, 420);
    arsText(p, 'TUA NGƯỢC!', '#e056fd', 1.8); Sound.play('level');
    return true;
}

// ---------------------------------------------------------------------------
// KỸ NĂNG NỘ [D]
// ---------------------------------------------------------------------------
function arsenalRage(p) {
    let w = p.weapon; if (!w || !RAGE_WEAPONS[w.key]) return;
    if (!skillRageOK(p, w)) {
        if (!(p.rageTextCD > Date.now())) { p.rageTextCD = Date.now() + 1200; arsText(p, 'NỘ [D] CẦN THẺ "THỊNH NỘ"', '#b2bec3', 0.9); }
        return;
    }
    if ((p.rage || 0) < 100) {
        if (!(p.rageTextCD > Date.now())) { p.rageTextCD = Date.now() + 800; arsText(p, 'NỘ ' + Math.floor(p.rage || 0) + '%', '#b2bec3', 0.7); }
        return;
    }
    let mult = p.getTotalDamageMult(), used = true;
    if (w.key === 'MINIGUN') {
        // Xả Áp Suất: tiêu toàn bộ Nhiệt -> vụ nổ 360 độ đẩy lùi + xả đạn mọi hướng 2 giây, đứng yên
        let heat = p.mgHeat || 0;
        explode(p.x, p.y, 240 + heat * 1.8, (350 + heat * 9) * mult, p, true);
        p.mgHeat = 0; p.jamT = 0; p.ventT = 2.0; p.ventAcc = 0; p.ventDmg = w.dmg;
        spawnRing(p.x, p.y, '#e67e22', 300 + heat * 2, 0.5, 10); addScreenShake(18);
    } else if (w.key === 'SNIPER') {
        // Phán Quyết: bắn trúng mọi quái đang nằm trên các vết rách, không tốn đạn
        // Phán Quyết: bắn trúng mọi quái còn mang DẤU VẾT RÁCH (bị vết rách quét qua trong 4 giây gần nhất), không tốn đạn
        let rifts = hazards.filter(h => h.type === 'rift' && h.life > 0), hit = 0;
        let marked = zombies.filter(z => z.hp > 0 && !z.flying && !z.hidden && z.riftMark > 0);
        if (!marked.length) { arsText(p, 'CHƯA CÓ QUÁI NÀO MANG DẤU VẾT RÁCH', '#b2bec3', 0.9); return; }
        for (let z of marked) {
            z.riftMark = 0;
            z.hp -= calcDamage(w.dmg * 2.5, w, z.x, z.y, p, z);
            vfxList.push({ type: 'laser_beam', x: p.x, y: p.y, tx: z.x, ty: z.y, life: 0.3 });
            createParticles(z.x, z.y, '#8e44ad', 12, 260);
            zombieDown(z, p); hit++;
        }
        for (let h of rifts) { h.life = 0.12; spawnRing(h.x + Math.cos(h.angle) * h.radius / 2, h.y + Math.sin(h.angle) * h.radius / 2, '#8e44ad', 120, 0.35); }
        arsText(p, 'PHÁN QUYẾT x' + hit, '#e056fd', 1.4); Sound.play('sniper'); addScreenShake(12);
    } else if (w.key === 'HAMMER' || w.key === 'AXE' || w.isBat) {
        // Trời Sập: bất tử, nhảy lên rồi nện xuống tạo Vùng Đất Chết vĩnh viễn
        p.perks.invulnTimer = Math.max(p.perks.invulnTimer || 0, 1.1);
        p.leapT = 0.45; p.leapAng = Math.atan2(p.facingY, p.facingX); p.leapDmg = w.dmg;
        createParticles(p.x, p.y, '#bdc3c7', 30, 300); Sound.play('throw');
    } else if (w.key === 'BOW') {
        // Phân Rã: mọi mũi tên đang cắm trên quái phát nổ, mỗi mũi bắn ra 3 mũi tên nhỏ tự đuổi
        let stuck = zombies.filter(z => z.hp > 0 && z.arrows > 0), minis = 0;
        if (!stuck.length) { arsText(p, 'CHƯA CÓ MŨI TÊN NÀO CẮM TRÊN QUÁI', '#b2bec3', 0.9); return; }
        for (let z of stuck) {
            let n = z.arrows; z.arrows = 0; z.pinT = 0;
            explode(z.x, z.y, 115, 140 * mult * n, p, true);
            for (let k = 0; k < 3 && minis < 48; k++, minis++) {
                let b = new Bullet(z.x, z.y, Math.random() * Math.PI * 2, { key: 'BOW', name: 'Cung', color: w.color, type: 'charge', range: 620, dmg: w.dmg * 0.9, homing: true, miniArrow: true }, p);
                b.hitSet.add(z); bullets.push(b);
            }
        }
        arsText(p, 'PHÂN RÃ!', '#e056fd', 1.4); Sound.play('bow'); addScreenShake(10);
    } else if (w.key === 'FLAMETHROWER') {
        // Bức Tường Lửa: bán nguyệt chặn 100% đạn của quái, đạn đồng đội / Drone bay xuyên qua +30% sát thương
        hazards = hazards.filter(h => !(h.type === 'firewall' && h.source === p));
        hazards.push({ type: 'firewall', x: p.x - p.facingX * 10, y: p.y - p.facingY * 10, angle: Math.atan2(p.facingY, p.facingX), radius: 190, life: 12, friendly: true, source: p });
        arsText(p, 'BỨC TƯỜNG LỬA!', '#e67e22', 1.4); Sound.play('explode'); addScreenShake(8);
    } else used = false;
    if (!used) return;
    p.rage = 0;
    // Link THỜI KHÔNG mốc 3: tung Nộ đóng băng quái quanh mình 1.5s
    if ((p.tags['THOI_KHONG'] || 0) >= 3) {
        for (let z of zombies) if (!isBossType(z.type) && Math.hypot(z.x - p.x, z.y - p.y) < 380) z.stunTimer = Math.max(z.stunTimer || 0, 1.5);
        spawnRing(p.x, p.y, '#8e44ad', 380, 0.5, 6);
    }
}

function arsenalHammerLand(p) {
    let mult = p.getTotalDamageMult();
    explode(p.x, p.y, 220, (p.leapDmg || 400) * 6 * mult, p, true);
    spawnRing(p.x, p.y, '#48dbfb', 230, 0.6, 10); addScreenShake(24); Sound.play('tank'); Sound.play('anvil');
    arsText(p, 'TRỜI SẬP!', '#48dbfb', 1.5);
    hazards.push({ type: 'deadzone', x: p.x, y: p.y, radius: 140, life: 1, friendly: true, source: p });   // dư chấn nhỏ, tan sau 1 giây
}

// ---------------------------------------------------------------------------
// MÓC TRONG Bullet
// ---------------------------------------------------------------------------
// Mũi tên nhỏ tự đuổi
function arsenalHome(b, dt) {
    b.homeT = (b.homeT || 0) - dt;
    if (b.homeT <= 0 || !b.homeZ || b.homeZ.hp <= 0) {
        b.homeT = 0.2; b.homeZ = null; let bd = 460;
        for (let z of zombies) { if (z.hp <= 0 || z.hidden || z.flying || b.hitSet.has(z)) continue; let d = Math.hypot(z.x - b.x, z.y - b.y); if (d < bd) { bd = d; b.homeZ = z; } }
    }
    if (!b.homeZ) return;
    let want = Math.atan2(b.homeZ.y - b.y, b.homeZ.x - b.x), diff = Math.atan2(Math.sin(want - b.angle), Math.cos(want - b.angle));
    b.angle += Math.max(-8 * dt, Math.min(8 * dt, diff));
    let sp = Math.hypot(b.vx, b.vy); b.vx = Math.cos(b.angle) * sp; b.vy = Math.sin(b.angle) * sp;
}

// Sau khi viên đạn gây sát thương. Trả về true nếu viên đạn đã bị giữ lại (mũi tên ghim vào quái).
function arsenalBulletHit(b, z) {
    let wd = b.wepData || {}, src = b.source;
    if (wd.incendiary) {
        applyStatus(z, STATUS.BURN, { duration: 2.5, dpsPercent: 0.012, source: src });
        let no = src && src.tags ? (src.tags['NỔ'] || 0) : 0;
        if (no >= 1 && fireZones.length < 110 && Math.random() < 0.04 + 0.02 * no) fireZones.push({ x: z.x, y: z.y, life: 2.0, dmg: b.dmg * 0.5, source: src, radius: 34 + no * 4 });
    }
    if (wd.key !== 'BOW' || !(src instanceof Player) || z.hp <= 0) return false;
    // GHIM KẸP: quái trúng tên mà chưa chết bị ghim vào con đứng sau hoặc vào tường
    z.arrows = Math.min(3, (z.arrows || 0) + 1);
    let boss = isBossType(z.type);
    if (!boss) z.pinT = 3;
    if (!wd.miniArrow) {
        let ca = Math.cos(b.angle), sa = Math.sin(b.angle), behind = null, bd = 115;
        for (let o of zombies) {
            if (o === z || o.hp <= 0 || isBossType(o.type) || o.flying) continue;
            let dx = o.x - z.x, dy = o.y - z.y, along = dx * ca + dy * sa;
            if (along > 0 && along < bd && Math.abs(dy * ca - dx * sa) < o.radius + 14) { bd = along; behind = o; }
        }
        if (behind) {
            behind.pinT = 3; behind.arrows = Math.min(3, (behind.arrows || 0) + 1);
            behind.hp -= calcDamage(b.dmg * 0.5, wd, behind.x, behind.y, src, behind); zombieDown(behind, src);
            vfxList.push({ type: 'laser_beam', x: z.x, y: z.y, tx: behind.x, ty: behind.y, life: 0.25 });
            vfxList.push({ type: 'text', text: 'GHIM ĐÔI!', x: z.x, y: z.y - 30, life: 0.8, color: '#e056fd' });
        } else if (!boss && isBlockedPoint(z.x + ca * (z.radius + 46), z.y + sa * (z.radius + 46), 6)) {
            z.hp -= b.dmg * 0.5; z.pinT = 4; zombieDown(z, src);
            vfxList.push({ type: 'text', text: 'GHIM TƯỜNG!', x: z.x, y: z.y - 30, life: 0.8, color: '#e056fd' });
        }
    }
    if (b.pierce >= 99) return false;      // tụ lực tối đa: vẫn xuyên, ghim mọi con nó đi qua
    b.active = false;
    return true;
}

// Đạn Súng Ngắm xé một "vết rách không gian" dọc đường bay: vết rách dài ra theo viên đạn,
// và bắt đầu đếm 2 giây (Link THỜI KHÔNG mốc 3: 4 giây) từ lúc viên đạn dừng lại.
function arsenalSniperRifts() {
    for (let b of bullets) {
        let wd = b.wepData;
        if (b._rift || !b.active || !wd || wd.key !== 'SNIPER' || wd.fromDrone || !(b.source instanceof Player)) continue;
        let rifts = hazards.filter(h => h.type === 'rift');
        if (rifts.length >= 4) hazards.splice(hazards.indexOf(rifts[0]), 1);
        b._rift = { type: 'rift', x: b.startX, y: b.startY, angle: b.angle, radius: 1, life: 0.7, dur: (b.source.tags['THOI_KHONG'] || 0) >= 3 ? 1.4 : 0.7, friendly: true, source: b.source, b };
        hazards.push(b._rift);
    }
    for (let h of hazards) {
        if (h.type !== 'rift' || !h.b) continue;
        h.radius = Math.max(1, Math.hypot(h.b.x - h.x, h.b.y - h.y));
        h.life = h.dur;
        if (!h.b.active) h.b = null;
    }
}
function arsenalBulletEnd(b) { if (b._rift) { b._rift.radius = Math.max(1, Math.hypot(b.x - b.startX, b.y - b.startY)); b._rift.b = null; } }

// ---------------------------------------------------------------------------
// MÓC TRONG Zombie / tính sát thương
// ---------------------------------------------------------------------------
// Trả về hệ số tốc độ của quái trong khung hình này
function arsenalZombieTick(z, dt) {
    let m = 1, boss = isBossType(z.type);
    if (z.markT > 0) z.markT -= dt;
    if (z.vulnT > 0) z.vulnT -= dt;
    if (z.riftMark > 0) z.riftMark -= dt;
    if (z.pinT > 0) { z.pinT -= dt; if (!boss) m = 0; }
    if (z.riftT > 0) { z.riftT -= dt; m *= boss ? 0.85 : (z.type === 4 ? 0.3 : 0.5); }
    if (z.dzT > 0) { z.dzT -= dt; m *= boss ? 0.8 : 0.5; }
    if (z.status && (z.status.burn || z.status.corrosion) && getTeamTagLevel('KHAN_DOC') >= 4) m *= 0.8;
    if (!boss) for (let p of players) if (p.perks.tk_slow && !p.isDowned && Math.abs(p.x - z.x) < 170 && Math.hypot(p.x - z.x, p.y - z.y) < 170) { m *= 0.75; break; }
    return m;
}

// Cuối calcDamage: đánh dấu của Drone Do Thám, Nọc Độc, Link BẬC THẦY / LIỀM
function arsenalOnDamage(dmg, wepData, src, z) {
    if (z && z.markT > 0) dmg *= 1.2;
    if (!src || !src.tags) return dmg;
    if (wepData && wepData.isScythe && (src.tags['LIỀM'] || 0) >= 2) dmg *= 1.25;
    if (z && src.perks && src.perks.x_venom && Math.random() < 0.2) applyStatus(z, STATUS.CORROSION, { duration: 3.0, stacks: 1, dpsPercent: 0.0045, maxStacks: 8, source: src });
    return dmg;
}
// Hệ số sát thương rỉ (thiêu đốt / ăn mòn) theo Link ĐỘC TỐ của người gây ra
function arsenalDotMult(s) {
    let lv = (s && s.source && s.source.tags) ? (s.source.tags['KHAN_DOC'] || 0) : 0;
    return lv >= 4 ? 1.6 : (lv >= 2 ? 1.3 : 1);
}
// Quái vừa bị hạ: thẻ Dịch Lây truyền Thiêu Đốt / Ăn Mòn sang 4 con gần nhất
function arsenalOnZombieDeath(z) {
    if (!z.status || !(z.status.burn || z.status.corrosion) || !hasTeamPerk('x_plague')) return;
    let near = zombies.filter(o => o !== z && o.hp > 0 && Math.hypot(o.x - z.x, o.y - z.y) < 220).sort((a, b) => Math.hypot(a.x - z.x, a.y - z.y) - Math.hypot(b.x - z.x, b.y - z.y)).slice(0, 4);
    for (let o of near) {
        if (z.status.burn) applyStatus(o, STATUS.BURN, { duration: 3.0, dpsPercent: z.status.burn.dpsPercent || 0.012, source: z.status.burn.source });
        if (z.status.corrosion) applyStatus(o, STATUS.CORROSION, { duration: 3.0, stacks: 2, dpsPercent: 0.0045, maxStacks: 8, source: z.status.corrosion.source });
        vfxList.push({ type: 'laser_beam', x: z.x, y: z.y, tx: o.x, ty: o.y, life: 0.15 });
    }
}

// ---------------------------------------------------------------------------
// CẬP NHẬT MỖI KHUNG HÌNH: vết rách, Vùng Đất Chết, Bức Tường Lửa
// ---------------------------------------------------------------------------
function arsFireArc(h, x, y, pad) {
    let d = Math.hypot(x - h.x, y - h.y);
    if (Math.abs(d - h.radius) > pad) return false;
    let a = Math.atan2(y - h.y, x - h.x);
    return Math.abs(Math.atan2(Math.sin(a - h.angle), Math.cos(a - h.angle))) <= Math.PI / 2;
}
function updateArsenal(dt) {
    arsenalSniperRifts();
    for (let h of hazards) {
        if (h.type === 'rift') {
            let ca = Math.cos(h.angle), sa = Math.sin(h.angle);
            for (let z of zombies) {
                if (z.hp <= 0 || z.flying) continue;
                let dx = z.x - h.x, dy = z.y - h.y, t = Math.max(0, Math.min(h.radius, dx * ca + dy * sa));
                let nx = h.x + ca * t, ny = h.y + sa * t, d = Math.hypot(z.x - nx, z.y - ny);
                if (d > 100 + z.radius) continue;
                z.riftT = 0.25; z.riftMark = 4;
                if (!isBossType(z.type) && d > 6) { let pull = Math.min(d, 140 * dt); z.x += (nx - z.x) / d * pull; z.y += (ny - z.y) / d * pull; }
            }
        } else if (h.type === 'deadzone') {
            let mult = arsMult(h.source);
            for (let z of zombies) {
                if (z.hp <= 0 || z.flying || Math.hypot(z.x - h.x, z.y - h.y) > h.radius + z.radius) continue;
                z.dzT = 0.25;
                if (ELECTRIC_IMMUNE_ZOMBIES.has(z.type)) continue;
                z.hp -= 55 * mult * dt; if (h.source) z.lastHitBy = h.source;
                z._dzS = (z._dzS || 0) - dt;
                if (z._dzS <= 0) { z._dzS = 1.4; if (!isBossType(z.type)) z.stunTimer = Math.max(z.stunTimer || 0, 0.25); createParticles(z.x, z.y, '#48dbfb', 4, 120); }
            }
        } else if (h.type === 'firewall') {
            let mult = arsMult(h.source);
            for (let b of enemyBullets) if (b.active && arsFireArc(h, b.x, b.y, 26)) { b.active = false; createParticles(b.x, b.y, '#e67e22', 6, 140); }
            for (let b of bullets) {
                if (!b.active || b._fw || b.isFire || !arsFireArc(h, b.x, b.y, 36)) continue;
                let wd = b.wepData || {};
                if (b.source === h.source && !wd.fromDrone && !wd.fromAlly && !b.isHeli) continue; // chỉ buff đạn của đồng đội / Drone / lính
                b._fw = true; b.dmg *= 1.3; createParticles(b.x, b.y, '#f9ca24', 3, 90);
            }
            for (let z of zombies) {
                if (z.hp <= 0 || z.flying || !arsFireArc(h, z.x, z.y, z.radius + 16)) continue;
                applyStatus(z, STATUS.BURN, { duration: 3.5, dpsPercent: 0.03, source: h.source });
                z.hp -= (160 * mult + z.maxHp * (isBossType(z.type) ? 0.01 : 0.08)) * dt; if (h.source) z.lastHitBy = h.source;
                // Zombie thường không đi xuyên được tường lửa: bị giữ lại ở phía nó đang đứng
                if (!isBossType(z.type)) {
                    let d = Math.hypot(z.x - h.x, z.y - h.y) || 1, want = d >= h.radius ? h.radius + z.radius + 17 : h.radius - z.radius - 17;
                    z.x = h.x + (z.x - h.x) / d * want; z.y = h.y + (z.y - h.y) / d * want;
                }
            }
            if (Math.random() < dt * 30) { let a = h.angle + (Math.random() - 0.5) * Math.PI; createParticles(h.x + Math.cos(a) * h.radius, h.y + Math.sin(a) * h.radius, Math.random() < 0.5 ? '#e67e22' : '#f9ca24', 1, 70); }
        }
    }
    updateSkills(dt);   // vùng chém Song Kiếm, Vườn Thực Vật (16-skills.js)
}

// ---------------------------------------------------------------------------
// DRONE DO THÁM (làm lại): bay nhanh, tự chiếm tháp tới 100%, nhặt vật phẩm nhiệm vụ, cứu người,
// bắn yểm trợ và ĐÁNH DẤU quái quanh nó (+20% sát thương nhận trong 4 giây).
// ---------------------------------------------------------------------------
function updateScoutDrone(d, p, dt, sup) {
    const spd = sup ? 440 : 340;
    const go = (x, y, stopAt) => { let dist = Math.hypot(x - d.x, y - d.y); if (dist > stopAt) { let a = Math.atan2(y - d.y, x - d.x), st = Math.min(dist - stopAt, spd * dt); d.x += Math.cos(a) * st; d.y += Math.sin(a) * st; } return dist; };
    const nearest = (list) => { let best = null, bd = 1e9; for (let o of list) { let dd = Math.hypot(o.x - d.x, o.y - d.y); if (dd < bd) { bd = dd; best = o; } } return best; };
    let busy = false;

    if (objState === 'TOWERS') {
        let t = nearest(towers.filter(t => !t.active));
        if (t) {
            busy = true;
            if (go(t.x, t.y, 60) < 150) {
                t.progress += dt * (sup ? 1.0 : 0.7);
                if (Math.random() < dt * 8) createParticles(t.x, t.y, '#f1c40f', 1, 50);
                if (t.progress >= 5.0) { t.active = true; towerAlertTimer = 3.0; createParticles(t.x, t.y, '#f1c40f', 50, 300); addScreenShake(6); vfxList.push({ type: 'text', text: 'DRONE ĐÃ CHIẾM THÁP!', x: t.x, y: t.y - 60, life: 1.6, color: '#f1c40f' }); Sound.play('level'); }
            }
        }
    } else if (objState === 'COLLECT' || objState === 'POWER_LOCKS' || objState === 'POWER_CHARGE') {
        let it = nearest(missionItems.filter(i => !i.taken));
        if (it) {
            busy = true;
            if (go(it.x, it.y, 0) < 26 && !mission.complete) {
                it.taken = true; createParticles(it.x, it.y, '#f1c40f', 18, 140); Sound.play('pickup');
                if (objState === 'POWER_CHARGE') { powerCellsHeld++; vfxList.push({ type: 'text', text: 'DRONE: PIN +' + powerCellsHeld, x: it.x, y: it.y - 28, life: 1.0, color: '#f1c40f' }); }
                else { mission.progress++; vfxList.push({ type: 'text', text: 'DRONE ĐÃ NHẶT!', x: it.x, y: it.y - 28, life: 1.0, color: '#00d2d3' }); if (mission.progress >= mission.required) completeMission(); }
            }
        } else if (objState === 'POWER_CHARGE' && powerCellsHeld > 0) {
            // Hết pin để nhặt: drone tự đi nạp điện cho trụ
            let t = nearest(towers.filter(t => !t.active));
            if (t) {
                busy = true;
                if (go(t.x, t.y, 60) < 150 && !players.some(pl => !pl.isDowned && Math.hypot(pl.x - t.x, pl.y - t.y) < 150)) {
                    t.progress += dt * (0.35 + (sup ? 1.0 : 0.7));
                    if (t.progress >= 8.0 && !mission.complete) { t.active = true; powerCellsHeld--; mission.progress++; Sound.play('level'); createParticles(t.x, t.y, '#00d2d3', 60, 330); if (mission.progress >= mission.required) completeMission(); }
                }
            }
        }
    } else if (objState === 'RESCUE') {
        let n = nearest(rescueNPCs.filter(n => n.hp > 0 && !n.rescued && !n.isStory));
        if (n) {
            busy = true;
            if (go(n.x, n.y, 40) < 95 && !players.some(pl => !pl.isDowned && Math.hypot(pl.x - n.x, pl.y - n.y) < 95)) {
                n.rescueProgress += dt * (sup ? 1.5 : 1.1);   // (NPC tự tụt 0.5/s khi không có người đứng cạnh)
                if (n.rescueProgress >= 5.0) { n.rescued = true; mission.progress++; createParticles(n.x, n.y, '#2ecc71', 25, 160); spawnRing(n.x, n.y, '#2ecc71', 95, 0.4); Sound.play('heal'); vfxList.push({ type: 'text', text: 'DRONE ĐÃ CỨU!', x: n.x, y: n.y - 35, life: 1.0, color: '#2ecc71' }); }
            }
        }
    }
    if (!busy) {
        // Không có mục tiêu nhiệm vụ: bay trinh sát phía trước mặt chủ nhân
        let t = performance.now() / 1000;
        go(p.x + p.facingX * 170 + Math.cos(t * 1.3) * 90, p.y + p.facingY * 170 + Math.sin(t * 1.3) * 90, 6);
    }

    // Đánh dấu quái quanh drone
    d.markCD = (d.markCD || 0) - dt;
    if (d.markCD <= 0) {
        d.markCD = 0.5;
        for (let z of zombies) if (z.hp > 0 && !z.hidden && Math.abs(z.x - d.x) < 400 && Math.hypot(z.x - d.x, z.y - d.y) < 400) z.markT = 4;
    }
    // Bắn yểm trợ (mốc 5 Drone: nhanh & mạnh hơn)
    if (d.cd <= 0) {
        let tz = getNearestZombie(d.x, d.y, 430);
        if (tz) {
            bullets.push(new Bullet(d.x, d.y, Math.atan2(tz.y - d.y, tz.x - d.x), { range: 460, dmg: sup ? 48 : 30, fromDrone: true }, p));
            d.cd = sup ? 0.4 : 0.7;
        }
    }
}

// ---------------------------------------------------------------------------
// VẼ
// ---------------------------------------------------------------------------
function drawArsenalHazard(h, T) {
    if (h.type === 'rift') {
        // Vệt đạn mảnh: sáng ở đầu đạn, mờ dần về phía nòng, tan nhanh
        let ex = h.x + Math.cos(h.angle) * h.radius, ey = h.y + Math.sin(h.angle) * h.radius, a = Math.min(1, h.life / 0.7);
        let g = ctx.createLinearGradient(h.x, h.y, ex, ey);
        g.addColorStop(0, 'rgba(200, 170, 255, 0)'); g.addColorStop(1, `rgba(200, 170, 255, ${0.5 * a})`);
        ctx.lineCap = 'round'; ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = g; ctx.lineWidth = 7 * a + 1; ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(ex, ey); ctx.stroke();
        let g2 = ctx.createLinearGradient(h.x, h.y, ex, ey);
        g2.addColorStop(0, 'rgba(255, 255, 255, 0)'); g2.addColorStop(1, `rgba(255, 255, 255, ${0.9 * a})`);
        ctx.strokeStyle = g2; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.globalCompositeOperation = 'source-over'; ctx.lineCap = 'butt';
    } else if (h.type === 'slashzone') {
        drawSkillHazard(h, T);
    } else if (h.type === 'deadzone') {
        ctx.beginPath(); ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(30, 60, 90, ${0.26 + 0.04 * Math.sin(T * 3 + h.x)})`; ctx.fill();
        ctx.strokeStyle = 'rgba(72, 219, 251, 0.7)'; ctx.lineWidth = 3; ctx.setLineDash([14, 10]); ctx.stroke(); ctx.setLineDash([]);
        // Vết nứt + tia điện
        ctx.strokeStyle = 'rgba(10, 16, 24, 0.75)'; ctx.lineWidth = 4; ctx.beginPath();
        for (let k = 0; k < 7; k++) { let a = k * 0.9 + h.x * 0.01; ctx.moveTo(h.x, h.y); ctx.lineTo(h.x + Math.cos(a) * h.radius * 0.5 + Math.cos(a + 1.3) * 18, h.y + Math.sin(a) * h.radius * 0.5 + Math.sin(a + 1.3) * 18); ctx.lineTo(h.x + Math.cos(a) * h.radius * 0.92, h.y + Math.sin(a) * h.radius * 0.92); }
        ctx.stroke();
        ctx.strokeStyle = `rgba(160, 240, 255, ${0.55 + 0.4 * Math.sin(T * 17)})`; ctx.lineWidth = 2; ctx.beginPath();
        for (let k = 0; k < 3; k++) { let a = Math.random() * Math.PI * 2, r1 = Math.random() * h.radius; ctx.moveTo(h.x + Math.cos(a) * r1, h.y + Math.sin(a) * r1); ctx.lineTo(h.x + Math.cos(a + 0.3) * (r1 + 30), h.y + Math.sin(a + 0.3) * (r1 + 30)); }
        ctx.stroke();
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    } else if (h.type === 'firewall') {
        let a = Math.min(1, h.life), R = h.radius;
        ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(h.angle); ctx.lineCap = 'round';
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = `rgba(230, 126, 34, ${0.35 * a})`; ctx.lineWidth = 34; ctx.beginPath(); ctx.arc(0, 0, R, -Math.PI / 2, Math.PI / 2); ctx.stroke();
        ctx.strokeStyle = `rgba(255, 200, 80, ${0.6 * a})`; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(0, 0, R, -Math.PI / 2, Math.PI / 2); ctx.stroke();
        ctx.fillStyle = `rgba(255, 150, 40, ${0.75 * a})`;
        for (let k = 0; k <= 14; k++) {
            let aa = -Math.PI / 2 + k * Math.PI / 14, fl = 16 + 10 * Math.sin(T * 13 + k * 1.7);
            ctx.beginPath(); ctx.moveTo(Math.cos(aa - 0.07) * R, Math.sin(aa - 0.07) * R); ctx.lineTo(Math.cos(aa) * (R + fl), Math.sin(aa) * (R + fl)); ctx.lineTo(Math.cos(aa + 0.07) * R, Math.sin(aa + 0.07) * R); ctx.fill();
        }
        ctx.restore(); ctx.globalCompositeOperation = 'source-over'; ctx.lineCap = 'butt';
        if (h.life < 12) { ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; outlinedText(Math.ceil(h.life) + 's', h.x + Math.cos(h.angle) * (h.radius + 34), h.y + Math.sin(h.angle) * (h.radius + 34), '#f9ca24', 'bold 12px Arial'); }
    }
}
// VFX riêng (đồng bộ sang khách qua vfxList). Trả về true nếu đã vẽ.
function drawArsenalVfx(v, T) {
    if (v.type !== 'cone') return false;
    let k = Math.max(0, v.life / v.max), r = v.r * (1 - k * 0.75);
    ctx.save(); ctx.translate(v.x, v.y); ctx.rotate(v.angle);
    ctx.strokeStyle = `rgba(223, 230, 233, ${0.75 * k})`; ctx.lineWidth = 5;
    for (let j = 0; j < 3; j++) { let rr = r - j * 26; if (rr > 20) { ctx.beginPath(); ctx.arc(0, 0, rr, -v.half, v.half); ctx.stroke(); } }
    ctx.fillStyle = `rgba(223, 230, 233, ${0.10 * k})`; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, -v.half, v.half); ctx.closePath(); ctx.fill();
    ctx.restore();
    return true;
}
// Thanh Nhiệt / chữ Nộ dưới chân người chơi
function drawArsenalPlayer(p, T) {
    let w = p.weapon; if (!w) return;
    if (w.key === 'MINIGUN') {
        let heat = p.mgHeat || 0;
        drawMiniBar(p.x, p.y + 22, 44, 5, heat, 100, p.jamT > 0 ? (Math.floor(T * 8) % 2 ? '#ff4757' : '#7f8c8d') : (heat >= 50 ? '#ff6b35' : '#f1c40f'));
        ctx.fillStyle = '#fff'; ctx.fillRect(p.x - 0.5, p.y + 21, 1, 7);
        if (p.jamT > 0) outlinedText('KẸT!', p.x + 36, p.y + 25, '#ff4757', 'bold 10px Arial');
        else if (heat >= 50) outlinedText('🔥', p.x + 32, p.y + 25, '#fff', '10px Arial', 1);
    }
    if (RAGE_WEAPONS[w.key] && skillRageOK(p, w)) {
        let full = (p.rage || 0) >= 100;
        outlinedText(full ? `NỘ D: ${RAGE_WEAPONS[w.key]}!` : `NỘ D: ${Math.floor(p.rage || 0)}%`, p.x, p.y + ((p.tags['KIẾM SƯ'] || 0) >= 5 ? 60 : 47), full ? (Math.floor(T * 5) % 2 ? '#fff' : '#e056fd') : '#b388ff', 'bold 11px Arial');
    }
    let sk = skillInfo(p);
    if (sk) outlinedText(sk.locked ? `C: ${sk.name} (cần thẻ Huấn Luyện)` : `C: ${sk.name} ${p.skillC_CD > 0 ? p.skillC_CD.toFixed(1) + 's' : '✔'}`, p.x, p.y + 34, sk.locked ? '#95a5a6' : '#ffeaa7', 'bold 11px Arial');
    else if (p.perks.tk_blink && !(p.perks.nhatKiem && isKatanaW(w))) outlinedText(`NHẢY C: ${p.blinkCD > 0 ? p.blinkCD.toFixed(1) + 's' : 'SẴN SÀNG'}`, p.x, p.y + 34, '#b388ff', 'bold 11px Arial');
}
// Mũi tên đang cắm / dấu do thám / giảm giáp trên quái (chỉ có ở máy chủ phòng)
function drawArsenalZombie(z, T) {
    if (z.arrows > 0) {
        ctx.strokeStyle = '#e056fd'; ctx.lineWidth = 2; ctx.beginPath();
        for (let k = 0; k < z.arrows; k++) { let a = k * 2.1 + (z.nid || 0); ctx.moveTo(z.x + Math.cos(a) * z.radius * 0.3, z.y + Math.sin(a) * z.radius * 0.3); ctx.lineTo(z.x + Math.cos(a) * (z.radius + 13), z.y + Math.sin(a) * (z.radius + 13)); }
        ctx.stroke();
    }
    if (z.pinT > 0) { ctx.strokeStyle = 'rgba(224, 86, 253, 0.8)'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(z.x, z.y, z.radius + 5, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
    if (z.markT > 0) {
        let r = z.radius + 9; ctx.strokeStyle = 'rgba(241, 196, 15, 0.9)'; ctx.lineWidth = 2; ctx.beginPath();
        for (let k = 0; k < 4; k++) { let a = k * Math.PI / 2 + T * 2; ctx.moveTo(z.x + Math.cos(a) * r, z.y + Math.sin(a) * r); ctx.lineTo(z.x + Math.cos(a) * (r + 6), z.y + Math.sin(a) * (r + 6)); }
        ctx.stroke();
    }
    if (z.riftMark > 0) { ctx.fillStyle = 'rgba(200, 170, 255, 0.9)'; ctx.beginPath(); ctx.moveTo(z.x, z.y - z.radius - 20); ctx.lineTo(z.x + 5, z.y - z.radius - 14); ctx.lineTo(z.x, z.y - z.radius - 8); ctx.lineTo(z.x - 5, z.y - z.radius - 14); ctx.fill(); }
    if (z.vulnT > 0) outlinedText('▼GIÁP', z.x, z.y + z.radius + 9, '#dfe6e9', 'bold 9px Arial', 2);
}

// ---------------------------------------------------------------------------
// ĐỔI THẺ (REROLL): 5 ⚙ linh kiện / lần, luôn có ít nhất 2 thẻ thuộc Link cao nhất của người chơi
// ---------------------------------------------------------------------------
// Trả về tối đa 2 thẻ thuộc Link cao nhất (Link nào hết thẻ thì lấy tiếp ở Link cao kế)
function rerollGuaranteed(p) {
    let offer = UPGRADES.filter(u => canOfferUpgrade(p, u));
    let ranked = Object.keys(p.tags).filter(t => p.tags[t] > 0 && TAG_DEFS[t]).sort((a, b) => p.tags[b] - p.tags[a]);
    let picks = [];
    for (let t of ranked) {
        let c = offer.filter(u => u.tags.includes(t) && !picks.includes(u)).sort(() => Math.random() - 0.5);
        while (c.length && picks.length < 2) picks.push(c.pop());
        if (picks.length >= 2) break;
    }
    return picks;
}
function updateRerollButtons() {
    for (let pid = 1; pid <= 2; pid++) {
        let b = document.getElementById(`p${pid}RerollBtn`); if (!b) continue;
        let p = players[pid - 1], confirmed = pid === 1 ? p1Confirmed : p2Confirmed;
        let show = gameState === 'UPGRADE' && p && p.pendingUpgrades > 0 && !confirmed;
        b.style.display = show ? 'block' : 'none';
        b.disabled = shopScrap < REROLL_COST;
        b.textContent = `🎲 ĐỔI THẺ (-${REROLL_COST}⚙ · còn ${shopScrap}⚙)`;
    }
}
function rerollCards(pid) {
    if (gameState !== 'UPGRADE') return;
    if ((pid === 1 && p1Confirmed) || (pid === 2 && p2Confirmed)) return;
    if (shopScrap < REROLL_COST) { Sound.play('hit'); netToast('Không đủ linh kiện ⚙ để đổi thẻ!', 1500); return; }
    if (NET.mode === 'guest') { netSend({ t: 'rr' }); return; }   // chủ phòng trừ ⚙ rồi báo lại
    shopScrap -= REROLL_COST;
    doReroll(pid);
    netSendSync();
}
function doReroll(pid) {
    if (pid === 1) p1SelectedUpg = null; else p2SelectedUpg = null;
    let cb = document.getElementById(`p${pid}ConfirmBtn`); if (cb) cb.disabled = true;
    Sound.play('shard');
    renderCards(pid, `p${pid}Cards`, true);
    updateRerollButtons();
}

// ---------------------------------------------------------------------------
// LƯU / TẢI: tự lưu ở ĐẦU MỖI MAP (1 ô lưu, trên máy này). Tải lại = chơi lại từ đầu map đang lưu.
// ---------------------------------------------------------------------------
const SAVE_KEY = 'zs_save_v1';
function savePlayer(p) {
    return {
        hp: p.hp, maxHp: p.maxHp, hunger: p.hunger, baseSpeed: p.baseSpeed, level: p.level, xp: p.xp, pend: p.pendingUpgrades,
        dmgMult: p.dmgMult, critBonus: p.critBonus, armorMult: p.armorMult, tags: p.tags, perks: p.perks, st: p.perkStacks,
        w: p.weapon ? { k: p.weapon.key, a: p.weapon.ammo, m: p.weapon.maxAmmo } : null,
        sk: p.swordKills, ck: p.cKills, dc: p.dCharge, dk: p.droneKills, lk: p.luckyKills, rc: p.reviveCount, tox: p.caveToxinResist || 0, rage: p.rage || 0, down: p.isDowned ? 1 : 0
    };
}
// Gọi ở đầu startLevel (trước khi map mới tiêu thụ các lựa chọn tuyến đường)
function saveCheckpoint(atHub = false) {
    if (NET.mode || !players.length) return;
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({
            v: 1, when: Date.now(), mode: runMode, diff: difficulty, hub: atHub ? 1 : 0, lvl: currentLevel, scrap: shopScrap, power: hasPowerPlantMap, ppr: powerPlantRun,
            hz: { active: hangZRun.active, floor: hangZRun.floor, total: hangZRun.total, timer: hangZRun.timer }, mine: mineRun,
            dead: theDeadSpawnChance, shards: breakthroughShards, ex: activeExclusiveTag, cpf: currentPowerFloorCleared, tk: globalTankKills,
            sgl: shardGrantedLevel, bat: pendingBattery, kills: killCount, lsm: lastSpecialMapLevel, flags: shopFlags,
            nmap: nextMapPreference, nmis: nextMissionPreference, route: nextRoute, drop: pendingShopDrop, sol: shopOpenedForLevel,
            story: storySaveState(), base: baseSave(), maps: ownedMaps, pl: players.map(savePlayer)
        }));
    } catch (e) { console.warn('[save]', e); }
}
function readSave() {
    try { let s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); return (s && s.v === 1 && Array.isArray(s.pl) && s.pl.length) ? s : null; } catch (e) { return null; }
}
function deleteSave() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { }
    refreshSaveUI(); Sound.play('select');
}
function refreshSaveUI() {
    let box = document.getElementById('saveBox'); if (!box) return;
    let s = readSave();
    box.style.display = s ? 'flex' : 'none';
    if (!s) return;
    let d = new Date(s.when), pad = (n) => (n < 10 ? '0' : '') + n;
    let modeName = (s.mode === 'local2' ? '2 người' : (s.mode === 'mobile' ? 'Mobile' : 'PC')) + (typeof DIFFS !== 'undefined' && DIFFS[s.diff] ? ' · ' + DIFFS[s.diff].name : '');
    document.getElementById('loadBtn').textContent = `💾 CHƠI TIẾP — ${s.hub ? 'Trại (sau Map ' + s.lvl + ')' : 'Map ' + s.lvl} · Cấp ${s.pl[0].level} · ${modeName} (${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())})`;
}
function loadGame() {
    let s = readSave();
    if (!s) { netToast('Không có bản lưu nào.', 1800); refreshSaveUI(); return; }
    Sound.resume(); Sound.startAmbience(); Sound.play('start');
    clearPcInputs();
    for (let id of ['menu', 'routeShop', 'upgradeScreen', 'netWait']) document.getElementById(id).style.display = 'none';
    resetRunState();
    let mode = ['pc', 'mobile', 'local2'].includes(s.mode) ? s.mode : 'pc';
    runMode = mode;
    isSinglePlayer = mode !== 'local2';
    showTouchUI = mode !== 'pc';
    if (showTouchUI) PC_INPUT.pointer.active = false;
    const num = (v, d) => (typeof v === 'number' && isFinite(v)) ? v : d;

    currentLevel = Math.max(1, num(s.lvl, 1) | 0); shopScrap = num(s.scrap, 0) | 0; hasPowerPlantMap = !!s.power;
    if (s.ppr) powerPlantRun = { active: !!s.ppr.active, floor: num(s.ppr.floor, 0), total: num(s.ppr.total, 3) };
    if (s.hz) hangZRun = { active: !!s.hz.active, floor: num(s.hz.floor, 0), total: num(s.hz.total, 3), timer: num(s.hz.timer, 180), stairs: null };
    if (s.mine) mineRun = { active: !!s.mine.active, floor: num(s.mine.floor, 4), stage: String(s.mine.stage || 'maze'), queenPct: num(s.mine.queenPct, 0.3) };
    theDeadSpawnChance = num(s.dead, 0); breakthroughShards = num(s.shards, 0) | 0;
    activeExclusiveTag = (typeof s.ex === 'string' && TAG_RULES[s.ex]) ? s.ex : null;
    currentPowerFloorCleared = num(s.cpf, 0) | 0; globalTankKills = num(s.tk, 0) | 0; shardGrantedLevel = num(s.sgl, 0) | 0;
    pendingBattery = num(s.bat, 0) | 0; killCount = num(s.kills, 0) | 0; lastSpecialMapLevel = num(s.lsm, 0) | 0;
    if (s.flags) shopFlags = { flare: !!s.flags.flare, mines: num(s.flags.mines, 0) | 0, herbicide: !!s.flags.herbicide, urbanMap: !!s.flags.urbanMap };
    nextMapPreference = (typeof s.nmap === 'number') ? s.nmap : null;
    nextMissionPreference = (typeof s.nmis === 'string') ? s.nmis : null;
    nextRoute = (typeof s.route === 'string' && ROUTE_DEFS[s.route]) ? s.route : 'balanced';
    pendingShopDrop = !!s.drop; shopOpenedForLevel = num(s.sol, 0) | 0;
    storyLoadState(s.story);
    baseLoad(s.base);
    if (DIFFS[s.diff]) { difficulty = s.diff; refreshDiffUI(); }
    ownedMaps = {}; if (s.maps) for (let k in ROUTE_MAPS) if (s.maps[k]) ownedMaps[k] = true;
    if (hasPowerPlantMap) ownedMaps.power = true;

    players = [];
    const colors = ['#3498db', '#e74c3c'];
    s.pl.slice(0, isSinglePlayer ? 1 : 2).forEach((d, i) => {
        let p = new Player(i + 1, MAP_SIZE.w / 2, MAP_SIZE.h / 2, colors[i]);
        p.maxHp = num(d.maxHp, 100); p.hp = Math.max(1, Math.min(p.maxHp, num(d.hp, p.maxHp))); p.hunger = num(d.hunger, 100); p.baseSpeed = num(d.baseSpeed, 220);
        p.level = Math.max(1, num(d.level, 1) | 0); p.xp = num(d.xp, 0); p.pendingUpgrades = num(d.pend, 0) | 0;
        p.dmgMult = num(d.dmgMult, 1); p.critBonus = num(d.critBonus, 0); p.armorMult = num(d.armorMult, 1);
        if (d.tags) for (let t in TAG_DEFS) if (typeof d.tags[t] === 'number') p.tags[t] = d.tags[t];
        if (d.perks) for (let k in d.perks) { let v = d.perks[k]; if (/^[a-zA-Z_]\w{0,40}$/.test(k) && (typeof v === 'boolean' || typeof v === 'number')) p.perks[k] = v; }
        if (d.st) for (let k in STACKABLE_PERKS) if (typeof d.st[k] === 'number') p.perkStacks[k] = d.st[k];
        if (d.w && WEAPON_TYPES[d.w.k]) { p.weapon = { ...WEAPON_TYPES[d.w.k] }; p.weapon.maxAmmo = num(d.w.m, p.weapon.maxAmmo); p.weapon.ammo = Math.max(1, num(d.w.a, p.weapon.ammo)); }
        p.swordKills = num(d.sk, 0); p.cKills = num(d.ck, 0); p.dCharge = num(d.dc, 0); p.droneKills = num(d.dk, 0); p.luckyKills = num(d.lk, 0);
        p.reviveCount = num(d.rc, 0); p.caveToxinResist = num(d.tox, 0); p.rage = num(d.rage, 0); p.isDowned = !!d.down;
        players.push(p);
    });
    if (!isSinglePlayer && players.length < 2) players.push(new Player(2, MAP_SIZE.w / 2, MAP_SIZE.h / 2, colors[1]));
    // Bản lưu được chụp TRƯỚC phần thưởng đầu map của startLevel, nên gọi lại startLevel cho ra đúng trạng thái cũ
    if (s.hub) { enterHub(); netToast('Đã tải bản lưu — bạn đang ở Khu Sống Sót (đã qua Map ' + currentLevel + ').', 3000); return; }
    startLevel();
    netToast('Đã tải bản lưu — bắt đầu lại từ đầu Map ' + currentLevel + '.', 3000);
}
refreshSaveUI();
