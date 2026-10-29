// ============================================================================
// 13-labz.js — CHƯƠNG "PHÒNG THÍ NGHIỆM Z & NHÀ GA X" (map 15)
//  Pha 1  LAB_C4        : hộ tống Binh sĩ gài C4 phá cửa hợp kim (18 giây)
//  Pha 2  LAB_DECON     : khí độc rút máu — bật 3 Máy Khử Độc, tìm 2 Bản Thiết Kế, cứu nhóm Nhà Khoa Học
//         LAB_ESCORT    : dẫn Nhà Khoa Học ra bến Nhà Ga X
//  Pha 3  STATION_HOLD  : tử thủ 40 giây chờ nổ máy, cản Boss THE HUCKER (37) -> STATION_BOARD: lên tàu
//         "MISSION COMPLETED!" giả -> The Hucker móc xích vào toa đuôi
//  Pha 4  TRAIN         : mini-game tẩu thoát trên tàu hoả (pháo 6 nòng + pháo cối)
// ============================================================================
const LAB = { x0: 1150, y0: 1350, x1: 2850, y1: 2450, start: { x: 2000, y: 2820 }, doorS: { x: 2000, y: 2425 }, plant: { x: 2000, y: 2492 }, doorN: { x: 2000, y: 1375 }, train: { x: 2000, y: 650 } };
const LAB_STAGES = ['c4', 'decon', 'escort', 'hold', 'board', 'done', 'breach', 'explore', 'alarm', 'train'];
function inLab(x, y) { return x > LAB.x0 + 50 && x < LAB.x1 - 50 && y > LAB.y0 + 50 && y < LAB.y1 - 50; }

function genLabZ(level) {
    bgMapColor = '#1f2a2e'; currentWeather = 5;
    const wall = (x, y, w, h, extra) => obstacles.push(Object.assign({ type: 'wall', x, y, w, h }, extra || {}));
    wall(1150, 1350, 50, 1100); wall(2800, 1350, 50, 1100);
    wall(1150, 2400, 770, 50); wall(2080, 2400, 770, 50);           // tường nam, chừa cửa hợp kim
    wall(1150, 1350, 770, 50); wall(2080, 1350, 770, 50);           // tường bắc, chừa cửa ra nhà ga
    obstacles.push({ type: 'rockwall', door: 's', x: 1920, y: 2400, w: 160, h: 50 });
    obstacles.push({ type: 'rockwall', door: 'n', x: 1920, y: 1350, w: 160, h: 50 });
    for (let vx of [1680, 2280]) { wall(vx, 1400, 40, 160); wall(vx, 1700, 40, 400); wall(vx, 2240, 40, 160); }
    wall(1200, 1880, 200, 40); wall(1540, 1880, 140, 40);
    wall(1720, 1880, 180, 40); wall(2100, 1880, 180, 40);
    wall(2320, 1880, 140, 40); wall(2600, 1880, 200, 40);
    obstacles.push({ type: 'building', keep: true, x: 1300, y: 470, w: 1400, h: 120 });   // đoàn tàu
    // Thùng hàng / xe hỏng rải ngoài sân
    for (let i = 0, n = 0; i < 200 && n < 30; i++) {
        let w = 90 + Math.random() * 90, h = 80 + Math.random() * 80, x = 140 + Math.random() * (MAP_SIZE.w - 280 - w), y = 140 + Math.random() * (MAP_SIZE.h - 280 - h);
        if (x + w > LAB.x0 - 150 && x < LAB.x1 + 150 && y + h > LAB.y0 - 150 && y < LAB.y1 + 170) continue;
        if (y < 1200 && x + w > 1050 && x < 2950) continue;
        if (Math.hypot(x + w / 2 - LAB.start.x, y + h / 2 - LAB.start.y) < 380) continue;
        obstacles.push({ type: 'ruin', x, y, w, h }); n++;
    }
}

function labAfterGenerate(level) {
    story.lab = { stage: 'c4', plant: 0, backup: 1, soldier: null, hold: 30, board: 0, waveT: 4, sciSaved: 0 };
    story.props.push({ kind: 'machine', x: 1420, y: 1640, r: 30, hp: 0, maxHp: 4, on: false });
    story.props.push({ kind: 'machine', x: 2560, y: 1640, r: 30, hp: 0, maxHp: 4, on: false });
    story.props.push({ kind: 'machine', x: 1420, y: 2140, r: 30, hp: 0, maxHp: 4, on: false });
    story.props.push({ kind: 'print', x: 2710, y: 2310, r: 16, on: false });
    story.props.push({ kind: 'print', x: 1262, y: 1470, r: 16, on: false });
    story.props.push({ kind: 'traindoor', x: LAB.train.x, y: LAB.train.y, r: 210 });
    const lbOffs = [[-45, 0], [45, 0], [-24, 34], [24, 34]];
    players.forEach((p, i) => {
        if (p.netLeft) return;
        let o = players.length > 1 ? lbOffs[i % lbOffs.length] : [0, 0];
        p.x = LAB.start.x + o[0]; p.y = LAB.start.y + o[1];
    });
    allies.forEach((a, i) => { a.x = LAB.start.x + (i % 2 ? 60 : -60); a.y = LAB.start.y + 50; });
    drops = drops.filter(d => !inLab(d.x, d.y) || Math.random() < 0.5);
    for (let k = 0; k < 3; k++) rescueNPCs.push(new Scientist(1940 + k * 60, 1600 + (k % 2) * 40));
    let s = new StoryNPC(LAB.start.x + 70, LAB.start.y - 20, 'soldier'); rescueNPCs.push(s); story.lab.soldier = s;
    mission = { type: 'LAB_C4', progress: 0, required: 1, complete: false }; objState = 'LAB_C4';
    navRebuild();
    let f = navFlood([LAB.start], NAV.field); NAV.reach.length = 0;
    for (let i = 0; i < f.length; i++) if (f[i] >= 4) NAV.reach.push(i);
    NAV.t = 0;
    queueRadio('Chỉ huy: Cửa hợp kim Phòng Thí Nghiệm Z đã khoá chặt. Bảo vệ Binh sĩ trong lúc anh ta gài C4!', null, 6);
}

function labOpenDoor(which) {
    let d = which === 's' ? LAB.doorS : LAB.doorN;
    obstacles = obstacles.filter(o => o.door !== which);
    caveBigBlast(d.x, d.y);
    explode(d.x, d.y, 240, 700, players[0], true);
    addDecal(d.x, d.y, '#111', 90, 0.5);
    NAV.dirty = true; NAV.t = 0;
    if (NET.mode === 'host') netSendMap();
}
function labFail(text) {
    let L = story.lab; if (!L || L.stage === 'done') return;
    L.stage = 'done'; L.result = { ok: false, text };
    L.endT = 3;
    for (let p of players) if (!p.netLeft) vfxList.push({ type: 'text', text: 'NHIỆM VỤ THẤT BẠI!', x: p.x, y: p.y - 80, life: 2.6, color: '#ff4757' });
    objState = 'LAB_FAIL'; Sound.play('down');
}
function labFinish() {
    let L = story.lab, r = (L && L.result) || { ok: false, text: '' };
    story.train = null; story.cut = null;
    if (story.arena) { story.arena = null; obstacles = obstacles.filter(o => !o.arena); }
    mission.complete = true;
    if (r.ok) {
        let reward = 90 + currentLevel * 3;
        shopScrap += reward; breakthroughShards++;
        for (let p of players) { if (p.netLeft) continue; p.level++; p.pendingUpgrades++; if (p.isDowned) { p.isDowned = false; p.hp = p.maxHp * 0.4; } }
        netToast(`🚂 ĐOÀN TÀU ĐÃ VÀO HẦM AN TOÀN! +${reward} ⚙, +1 ◆ Mảnh Bức Phá, cả đội +1 cấp.`, 5000);
        Sound.play('level');
    } else {
        shopScrap = Math.max(0, shopScrap - 30);
        for (let p of players) { if (p.netLeft) continue; if (p.isDowned || p.hp < p.maxHp * 0.3) { p.isDowned = false; p.hp = Math.max(1, p.maxHp * 0.3); } }
        netToast((r.text || 'Nhiệm vụ thất bại.') + '  (-30 ⚙)', 5000);
        Sound.play('upgrade');
    }
    openRouteShop();
}

// Binh sĩ C4: chỉ tiến lên khi có người hộ tống; nổ cửa xong thì đi theo và bắn yểm trợ
function labSoldierUpdate(npc, dt) {
    let L = story.lab; if (!L) return;
    if (L.stage === 'c4') {
        if (Math.hypot(LAB.plant.x - npc.x, LAB.plant.y - npc.y) < 34) { npc.state = 'plant'; return; }
        if ((tank.active && Math.hypot(tank.x - npc.x, tank.y - npc.y) < 480) || players.some(p => !p.netLeft && !p.isDowned && Math.hypot(p.x - npc.x, p.y - npc.y) < 480)) { navMoveTo(npc, LAB.plant.x, LAB.plant.y, 150, dt); npc.state = 'move'; }
        else npc.state = 'wait';
        return;
    }
    npc.state = 'move';
    let f = players.filter(p => !p.netLeft && !p.isDowned).sort((a, b) => Math.hypot(a.x - npc.x, a.y - npc.y) - Math.hypot(b.x - npc.x, b.y - npc.y))[0] || players[0];
    let d = Math.hypot(f.x - npc.x, f.y - npc.y);
    if (d > 1100) { let sp = findSafePoint(f.x + 60, f.y + 40, npc.radius); npc.x = sp.x; npc.y = sp.y; }
    else if (d > 120) friendlyMoveTo(npc, f.x, f.y, d > 320 ? 220 : 175, dt);
    npc.atkCD -= dt;
    if (npc.atkCD <= 0) {
        let t = getNearestZombie(npc.x, npc.y, 460, true);
        if (t) { let a = Math.atan2(t.y - npc.y, t.x - npc.x); bullets.push(new Bullet(npc.x, npc.y, a, { range: 500, dmg: 34 * allyPowerScale(), fromAlly: true }, players[0])); npc.atkCD = 0.45; }
    }
    separateFriendly(npc, rescueNPCs, dt, 30, 120);
}

// Các số đếm cho băng nhiệm vụ & lớp khí độc (tính ở chủ phòng, gửi sang khách)
function labCounts(L) {
    let sci = rescueNPCs.filter(n => n.kind === 'scientist' && n.hp > 0);
    L.mOn = story.props.filter(p => p.kind === 'machine' && p.on).length; L.pGot = story.props.filter(p => p.kind === 'print' && p.on).length;
    L.sAlive = sci.length; L.sRes = sci.filter(n => n.rescued).length; L.gas = (L.stage === 'decon') ? (3 - L.mOn) / 3 : 0;
}
function labWave(n) {
    for (let k = 0; k < n && zombies.length < 80; k++) { let sp = caveSpawnPoint(); if (sp) zombies.push(new Zombie(sp.x, sp.y)); }
}

// Vòng cập nhật của map Phòng Thí Nghiệm Z (gọi từ updateStory)
function updateLab(dt) {
    let L = story.lab; if (!L) return;
    if (zombies.some(z => z.gone)) zombies = zombies.filter(z => !z.gone);
    labCounts(L);
    if (L.stage === 'done') { if (L.endT > 0) { L.endT -= dt; if (L.endT <= 0) labFinish(); } return; }
    const machines = story.props.filter(p => p.kind === 'machine'), prints = story.props.filter(p => p.kind === 'print');
    const sci = rescueNPCs.filter(n => n.kind === 'scientist');
    const alive = players.filter(p => !p.netLeft && !p.isDowned);

    if (L.stage === 'c4') {
        let s = L.soldier;
        if (!s || s.hp <= 0) {
            if (L.backup > 0) {
                L.backup--; L.plant *= 0.5;
                rescueNPCs = rescueNPCs.filter(n => n !== s);
                let ns = new StoryNPC(LAB.start.x, LAB.start.y + 60, 'soldier'); rescueNPCs.push(ns); L.soldier = ns;
                createParticles(ns.x, ns.y, '#ecf0f1', 30, 240);
                queueRadio('Chỉ huy: Binh sĩ đã hy sinh! Người DỰ BỊ CUỐI CÙNG đang nhảy dù xuống — đừng để mất anh ta!', null, 5);
            } else labFail('Cả hai Binh sĩ C4 đã hy sinh — không phá được cửa Phòng Thí Nghiệm Z.');
            return;
        }
        if (s.state === 'plant') {
            L.plant = Math.min(1, L.plant + dt / 25);
            L.waveT -= dt;
            if (L.waveT <= 0) { L.waveT = 2.4; labWave(2 + Math.floor(currentLevel / 3) + Math.max(0, bossTeamCount() - 1)); }
            if (L.plant >= 1) {
                labOpenDoor('s'); L.stage = 'breach'; objState = 'LAB_BREACH'; mission.type = 'LAB_BREACH'; mission.required = 1; mission.progress = 0;
                for (let p of players) if (!p.netLeft) vfxList.push({ type: 'text', text: 'C4 NỔ — CỬA ĐÃ BỊ XÉ TOẠC!', x: p.x, y: p.y - 90, life: 2.4, color: '#f1c40f' });
                queueRadio('Chỉ huy: Cửa đã mở! Tất cả người còn sống tập trung tại cửa để xuống khu nghiên cứu ngầm.', null, 7);
            }
        }
    } else if (L.stage === 'decon') {
        let on = machines.filter(m => m.on).length, gas = (3 - on) / 3;
        // Khí độc rút máu ngầm khi đứng trong Lab (chỉ ảnh hưởng người đi bộ ngoài xe tăng)
        if (gas > 0) for (let p of alive) if (!inTank(p) && inLab(p.x, p.y)) p.takeDot(4.5 * gas * (1 - (p.caveToxinResist || 0)) * dt);
        for (let m of machines) {
            if (m.on) continue;
            let near = alive.some(p => Math.hypot(p.x - m.x, p.y - m.y) < 115);
            m.hp = near ? m.hp + dt : Math.max(0, m.hp - dt * 0.5);
            if (m.hp >= m.maxHp) { m.on = true; Sound.play('level'); spawnRing(m.x, m.y, '#2ecc71', 260, 0.6, 6); vfxList.push({ type: 'text', text: `MÁY KHỬ ĐỘC ${on + 1}/3 ĐÃ BẬT!`, x: m.x, y: m.y - 50, life: 1.8, color: '#2ecc71' }); labWave(3 + Math.max(0, bossTeamCount() - 1)); }
        }
        for (let b of prints) if (!b.on && alive.some(p => Math.hypot(p.x - b.x, p.y - b.y) < 40)) { b.on = true; Sound.play('shard'); createParticles(b.x, b.y, '#74b9ff', 24, 180); vfxList.push({ type: 'text', text: 'BẢN THIẾT KẾ THUỐC GIẢI!', x: b.x, y: b.y - 34, life: 1.6, color: '#74b9ff' }); }
        let got = prints.filter(b => b.on).length, sAlive = sci.filter(n => n.hp > 0);
        mission.progress = on + got;
        if (!sAlive.length) { labFail('Toàn bộ Nhà Khoa Học đã chết trong Lab.'); return; }
        if (on >= 3 && got >= 2 && sAlive.every(n => n.rescued)) {
            labOpenDoor('n'); L.stage = 'escort'; objState = 'LAB_ESCORT'; mission.type = 'LAB_ESCORT';
            queueRadio('Chỉ huy: Không khí đã sạch! Dẫn các Nhà Khoa Học ra bến đỗ NHÀ GA X ở phía bắc!', null, 6);
        }
    } else if (L.stage === 'escort') {
        let sAlive = sci.filter(n => n.hp > 0);
        if (!sAlive.length) { labFail('Không còn Nhà Khoa Học nào sống sót để khởi động đầu máy.'); return; }
        if (alive.some(p => Math.hypot(p.x - LAB.train.x, p.y - LAB.train.y) < 250) && sAlive.every(n => Math.hypot(n.x - LAB.train.x, n.y - LAB.train.y) < 470)) {
            L.sciSaved = sAlive.length; L.stage = 'hold'; L.hold = 40; L.waveT = 1.5;
            rescueNPCs = rescueNPCs.filter(n => n.kind !== 'scientist');
            objState = 'STATION_HOLD'; mission.type = 'STATION_HOLD';
            for (let p of players) if (!p.netLeft) vfxList.push({ type: 'text', text: 'NHÀ KHOA HỌC ĐÃ LÊN TÀU — GIỮ BẾN 40 GIÂY!', x: p.x, y: p.y - 90, life: 2.6, color: '#f1c40f' });
            let h = new Zombie(LAB.train.x, 1180, 37);
            zombies.push(h);
            makeBossArena(h, LAB.train.x, 830, 640, true);
        }
    } else if (L.stage === 'hold') {
        L.hold -= dt; L.waveT -= dt;
        if (L.waveT <= 0) {
            L.waveT = 1.7;
            let A = story.arena || { x: LAB.train.x, y: 830, r: 640 }, extraP = Math.max(0, bossTeamCount() - 1);
            for (let k = 0; k < 3 + Math.floor(currentLevel / 3) + extraP && zombies.length < 60 + extraP * 10; k++) {
                let a = Math.random() * Math.PI * 2, r = A.r - 90 - Math.random() * 60, x = A.x + Math.cos(a) * r, y = A.y + Math.sin(a) * r;
                if (!isBlockedPoint(x, y, 22) && !players.some(p => !p.netLeft && Math.hypot(p.x - x, p.y - y) < 300)) zombies.push(new Zombie(x, y));
            }
        }
        if (L.hold <= 0) {
            L.stage = 'board'; L.board = 0; objState = 'STATION_BOARD'; mission.type = 'STATION_BOARD';
            for (let p of players) if (!p.netLeft) vfxList.push({ type: 'text', text: 'TÀU RÚC CÒI! NHẢY LÊN TOA TÀU!', x: p.x, y: p.y - 90, life: 2.6, color: '#2ecc71' });
            Sound.play('level'); addScreenShake(8);
        }
    } else if (L.stage === 'board') {
        let all = alive.length > 0 && !tank.active && alive.every(p => Math.hypot(p.x - LAB.train.x, p.y - LAB.train.y) < 215);
        L.board = all ? L.board + dt : Math.max(0, L.board - dt);
        if (L.board >= 1.2) { story.cut = { kind: 'fakewin', t: 0 }; Sound.play('level'); clearPcInputs(); }
    }
}

// Cắt cảnh: "MISSION COMPLETED!" giả rồi cú móc xích bất ngờ
function updateLabCut(dt) {
    let c = story.cut; c.t += dt;
    if (c.kind === 'fakewin' && c.t >= 2.8) { story.cut = { kind: 'twist', t: 0 }; Sound.play('roar'); Sound.play('tank'); addScreenShake(24); }
    else if (c.kind === 'twist') { if (Math.random() < dt * 12) addScreenShake(8); if (c.t >= 2.8) startTrainGame(); }
}

// ---------------------------------------------------------------------------
// BOSS THE HUCKER (37): móc xích kéo người chơi, nện đất, quật xích, gọi bầy. Xuống 35% máu thì lùi vào bóng tối.
// ---------------------------------------------------------------------------
function updateHucker(z, target, dist, ang, dt, speed) {
    z.kbX = z.kbY = 0;
    if (z.gone) return true;
    if (story.lab && z.hp <= z.maxHp * 0.35) {
        z.gone = true; z.hidden = true; z.invuln = true;
        createParticles(z.x, z.y, '#2d3436', 70, 420); spawnRing(z.x, z.y, '#6d4c41', 300, 0.6, 8);
        for (let p of players) if (!p.netLeft) vfxList.push({ type: 'text', text: 'THE HUCKER LÙI VÀO BÓNG TỐI...', x: p.x, y: p.y - 96, life: 2.6, color: '#e17055' });
        Sound.play('roar');
        return true;
    }
    if (!z.phase2Done && z.hp < z.maxHp * 0.65) { z.phase2Done = true; z.spCD = 1.0; bossSay(z, 'GRRRAAAH!', '#e17055'); Sound.play('roar'); addScreenShake(12); }
    if (huckerSkillTick(z, target, dist, ang, dt)) return true;   // chiêu mới đang diễn ra (17-bosses.js)
    if (z.rootTimer > 0) { z.rootTimer -= dt; return true; }
    if (z.warnBeamTimer > 0) {
        z.warnBeamTimer -= dt;
        if (z.warnBeamTimer <= 0) {
            // Phóng xích: ai đứng trên đường xích bị móc và kéo về phía nó
            vfxList.push({ type: 'laser_beam', x: z.x, y: z.y, tx: z.targetX, ty: z.targetY, life: 0.35 });
            Sound.play('throw'); addScreenShake(6);
            bossHitZombiesSeg(z.x, z.y, z.targetX, z.targetY, 34, 260);
            for (let p of players) {
                if (p.netLeft || p.isDowned || inTank(p) || distancePointToSegment(p.x, p.y, z.x, z.y, z.targetX, z.targetY) > p.radius + 34) continue;
                p.takeDamage(28); stunPlayer(p, 0.5);
                let a = Math.atan2(z.y - p.y, z.x - p.x), pull = Math.max(0, Math.hypot(z.x - p.x, z.y - p.y) - z.radius - 40);
                for (let s = 0; s < 10; s++) { p.x += Math.cos(a) * pull / 10; p.y += Math.sin(a) * pull / 10; resolveCollision(p); }
                vfxList.push({ type: 'text', text: 'BỊ MÓC XÍCH!', x: p.x, y: p.y - 40, life: 1.0, color: '#e17055' });
            }
            if (tank.active && tank.p2InvulnTimer <= 0 && distancePointToSegment(tank.x, tank.y, z.x, z.y, z.targetX, z.targetY) <= tank.radius + 34) tank.hp -= 35;
            z.rootTimer = 0.4;
        }
        return true;
    }
    if (z.spCD <= 0) {
        let extraP = Math.max(0, bossTeamCount() - 1);
        // Chiêu mới (17-bosses.js): ĐẬP ĐẤT & MƯA ĐÁ, BÓP MÓC LAO TỚI, KÉO TẢNG ĐÁ, MÓC XOAY
        let opts = dist < 270 ? ['slam', 'rocks', 'hookdash', 'hook'] : ['hook', 'boulder', 'rocks', 'hookdash', 'summon'];
        if (!(z.spinCD > 0)) opts.push('spin', 'spin');
        let skill = pickBossSkill(z, opts);
        if (skill === 'slam') { hazards.push({ type: 'quake', x: z.x, y: z.y, radius: 240 + extraP * 20, timer: 0.9, life: 1.1, dmg: 70, stun: 0.7, bz: 420 }); z.rootTimer = 0.9; bossSay(z, 'NỆN XÍCH!', '#e17055'); }
        else if (skill === 'hook') {
            let len = Math.min(680, dist + 150);
            z.targetX = z.x + Math.cos(ang) * len; z.targetY = z.y + Math.sin(ang) * len; z.warnBeamTimer = z.phase2Done ? 0.6 : 0.8;
            bossSay(z, 'MÓC XÍCH!', '#e17055');
        } else if (skill === 'summon') {
            labWave(4 + Math.floor(currentLevel / 3) + extraP * 2);
            Sound.play('roar'); spawnRing(z.x, z.y, z.color, 260, 0.6, 6); bossSay(z, 'GỌI BẦY!', '#e17055');
        } else huckerStart(z, skill, target, dist, ang);
        let cdMul = Math.max(0.76, 1 - extraP * 0.08);
        z.spCD = (z.phase2Done ? 2.3 : 3.1) * cdMul;
    }
    z.x += Math.cos(ang) * speed * dt; z.y += Math.sin(ang) * speed * dt; resolveCollision(z); storyArenaClamp(z);
    if (z.atkCD <= 0) {
        if (tank.active && tank.p2InvulnTimer <= 0 && Math.hypot(z.x - tank.x, z.y - tank.y) < z.radius + tank.radius + 8) { tank.hp -= 50; z.atkCD = 1.1; }
        for (let p of players) if (!p.netLeft && !p.isDowned && !inTank(p) && Math.hypot(z.x - p.x, z.y - p.y) < z.radius + p.radius + 8) { p.takeDamage(48); stunPlayer(p, 0.3); z.atkCD = 1.1; }
    }
    return true;
}
function huckerDeath(z) { createParticles(z.x, z.y, '#6d4c41', 60, 420); shopScrap += 30; }
function drawHucker(z, T, ang, flash) {
    const r = z.radius;
    ctx.save(); ctx.translate(z.x, z.y); ctx.rotate(ang);
    // Xích quấn sau lưng
    ctx.strokeStyle = '#636e72'; ctx.lineWidth = 6; ctx.setLineDash([9, 6]);
    ctx.beginPath(); ctx.arc(-r * 0.2, 0, r * 1.12, 1.2, 5.1); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fillStyle = flash ? '#fff' : (z.phase2Done ? '#8d3b2a' : '#6d4c41'); ctx.fill(); ctx.strokeStyle = '#1b120d'; ctx.lineWidth = 5; ctx.stroke();
    ctx.fillStyle = flash ? '#fff' : '#3e2723'; ctx.beginPath(); ctx.arc(-r * 0.15, -r * 0.92, r * 0.4, 0, Math.PI * 2); ctx.arc(-r * 0.15, r * 0.92, r * 0.4, 0, Math.PI * 2); ctx.fill();     // vai
    ctx.fillStyle = '#b2bec3'; for (let s = -1; s <= 1; s += 2) { ctx.beginPath(); ctx.moveTo(-r * 0.15, s * r * 1.5); ctx.lineTo(-r * 0.32, s * r * 1.1); ctx.lineTo(r * 0.02, s * r * 1.1); ctx.closePath(); ctx.fill(); }   // gai vai
    ctx.beginPath(); ctx.arc(r * 0.32, 0, r * 0.46, 0, Math.PI * 2); ctx.fillStyle = flash ? '#fff' : '#4e342e'; ctx.fill();   // đầu
    ctx.fillStyle = '#ff7043'; ctx.shadowColor = '#ff7043'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(r * 0.56, -r * 0.16, r * 0.08, 0, Math.PI * 2); ctx.arc(r * 0.56, r * 0.16, r * 0.08, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    // Tay cầm móc xích
    let sw = Math.sin(T * 5) * 0.2;
    ctx.strokeStyle = '#636e72'; ctx.lineWidth = 5; ctx.setLineDash([8, 5]); ctx.beginPath(); ctx.moveTo(r * 0.7, r * 0.8); ctx.lineTo(r * 1.5, r * (0.9 + sw)); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = '#dfe6e9'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(r * 1.72, r * (0.9 + sw), r * 0.24, -1.2, 2.6); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = flash ? '#fff' : '#3e2723'; ctx.beginPath(); ctx.arc(r * 0.7, r * 0.8, r * 0.22, 0, Math.PI * 2); ctx.arc(r * 0.7, -r * 0.8, r * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

// ---------------------------------------------------------------------------
// PHA 4: TẨU THOÁT TRÊN NÓC TÀU (chơi bằng chính nhân vật, camera áp sát)
// Bạn đứng trên nóc 3 toa tàu đang chạy. The Hucker bám phía sau liên tục phóng XÍCH móc lên mép nóc tàu;
// zombie trèo lên từ từng sợi xích. Vừa bắn vừa phải: phá móc xích, ra LỆNH PHÁO và ĐIỀU TÀU.
//   A  bắn / chém như thường (phá móc xích bằng đạn, cận chiến hoặc nổ)
//   B  LỆNH PHÁO: pháo đuôi tàu nã vào The Hucker — làm nó choáng và giật đứt 2 sợi xích cũ nhất
//   C  TĂNG TỐC: xả hơi nước, tàu chạy nhanh hơn trong 4 giây
//   D  CHUYỂN RAY: khi có cảnh báo đá chắn đường ray, bấm kịp để né
// ---------------------------------------------------------------------------
const ROOF = { x0: 1850, x1: 2150, y0: 1250, y1: 2750, tunnel: 1500 };
const RAIL_CHAIN_SPOTS = [
    { x: 2000, y: 1268, name: 'TOA ĐẦU - MŨI TÀU', minStage: 1 },
    { x: 1864, y: 1410, name: 'TOA ĐẦU - TRÁI TRƯỚC', minStage: 0 },
    { x: 2136, y: 1410, name: 'TOA ĐẦU - PHẢI TRƯỚC', minStage: 0 },
    { x: 1864, y: 1615, name: 'TOA ĐẦU - TRÁI SAU', minStage: 0 },
    { x: 2136, y: 1615, name: 'TOA ĐẦU - PHẢI SAU', minStage: 0 },
    { x: 1882, y: 1747, name: 'KHỚP ĐẦU-GIỮA (TRÁI)', minStage: 1 },
    { x: 2118, y: 1747, name: 'KHỚP ĐẦU-GIỮA (PHẢI)', minStage: 1 },
    { x: 1864, y: 1915, name: 'TOA GIỮA - MẠN TRÁI', minStage: 0 },
    { x: 2000, y: 2000, name: 'TOA GIỮA - GIỮA NÓC', minStage: 2 },
    { x: 2136, y: 1915, name: 'TOA GIỮA - MẠN PHẢI', minStage: 0 },
    { x: 1864, y: 2125, name: 'TOA GIỮA - HÔNG TRÁI', minStage: 0 },
    { x: 2136, y: 2125, name: 'TOA GIỮA - HÔNG PHẢI', minStage: 0 },
    { x: 1882, y: 2253, name: 'KHỚP GIỮA-ĐUÔI (TRÁI)', minStage: 0 },
    { x: 2118, y: 2253, name: 'KHỚP GIỮA-ĐUÔI (PHẢI)', minStage: 0 },
    { x: 1864, y: 2485, name: 'TOA ĐUÔI - MẠN TRÁI', minStage: 0 },
    { x: 2136, y: 2485, name: 'TOA ĐUÔI - MẠN PHẢI', minStage: 0 },
    { x: 1935, y: 2734, name: 'TOA ĐUÔI - ĐUÔI TRÁI', minStage: 0 },
    { x: 2065, y: 2734, name: 'TOA ĐUÔI - ĐUÔI PHẢI', minStage: 0 }
];
function railCarName(y) {
    return y < 1747 ? 'TOA ĐẦU' : (y < 2253 ? 'TOA GIỮA' : 'TOA ĐUÔI');
}
function railCarCenterY(idx) {
    let carH = (ROOF.y1 - ROOF.y0 - 40) / 3;
    return ROOF.y0 + idx * (carH + 20) + carH * 0.5;
}
function railChainLabel(x, y) {
    let best = RAIL_CHAIN_SPOTS[0], bd = Infinity;
    for (let s of RAIL_CHAIN_SPOTS) {
        let d = Math.hypot(s.x - x, s.y - y);
        if (d < bd) { bd = d; best = s; }
    }
    if (bd < 95) return best.name;
    let side = x < 1935 ? 'MẠN TRÁI' : (x > 2065 ? 'MẠN PHẢI' : 'GIỮA NÓC');
    return `${railCarName(y)} - ${side}`;
}
function railStageOf(dist) {
    let pct = (dist || 0) / ROOF.tunnel;
    return pct >= 0.82 ? 3 : (pct >= 0.60 ? 2 : (pct >= 0.34 ? 1 : 0));
}

function startTrainGame() {
    story.cut = null; story.train = null; story.arena = null;
    zombies = []; bullets = []; enemyBullets = []; hazards = []; fireZones = []; thrownItems = []; slashes = []; airdropMarkers = []; drops = [];
    obstacles = []; story.props = []; rescueNPCs = []; bushes = []; slowZones = []; decals = [];
    heliSupport.active = false; tank.active = false; tank.crew = [];
    bgMapColor = '#14181b'; currentWeather = 1;
    story.rail = { hp: 100, speed: 72, dist: 0, stage: 0, chainT: 1.8, cannon: 3.5, boost: 0, boostCD: 0, sw: 0, swT: 8.5, stun: 0, end: 0, win: false, fin: -1, msg: 'TRÊN NÓC TÀU! B: LỆNH PHÁO · C: TĂNG TỐC · D: CHUYỂN RAY — phá MÓC XÍCH theo vị trí báo động, né DẦM THÉP & ZOMBIE NÉM LÊN TÀU!', msgT: 6.5, shift: 0 };
    story.noSpawn = true; radioDialogs.length = 0;
    const trOffs = [[-55, -26], [55, -26], [-55, 36], [55, 36]];
    players.forEach((p, i) => {
        if (p.netLeft) return;
        let o = players.length > 1 ? trOffs[i % trOffs.length] : [0, 0];
        p.x = (ROOF.x0 + ROOF.x1) / 2 + o[0]; p.y = 2000 + o[1]; p.stunTimer = 0; p.netTimer = 0;
        if (!p.weapon && !p.isDowned) p.weapon = { ...WEAPON_TYPES.AR };   // tay không thì nhặt khẩu AR trên tàu
    });
    allies.forEach((a, i) => { a.x = 2000 + (i % 2 ? 60 : -60); a.y = 2100; });
    // Thả sẵn tiếp tế khởi đầu trên tàu theo số người chơi
    let initDrops = Math.max(1, bossTeamCount() - 1);
    for (let k = 0; k < initDrops; k++) {
        drops.push({ x: 1940 + (k % 2) * 120, y: 1930 + Math.floor(k / 2) * 120, type: k % 2 === 0 ? 'BLINDBOX' : 'MEDKIT', life: 90 });
    }
    objState = 'TRAIN'; mission.type = 'TRAIN'; mission.complete = false;
    if (story.lab) story.lab.stage = 'train';
    NAV.dirty = true; NAV.t = 0;
    clearPcInputs(); updateCamera(0, true);
    if (NET.mode === 'host') netSendMap();
}
function railMsg(text, t = 2.4) { let r = story.rail; if (r) { r.msg = text; r.msgT = t; } }
// Móc trong Player.update: trên nóc tàu, B / C / D là lệnh điều khiển tàu (không ném vũ khí, không dùng kỹ năng)
function railInput(p) {
    let r = story.rail; if (!r || r.end) return;
    let stg = railStageOf(r.dist), extraP = Math.max(0, bossTeamCount() - 1);
    if (getButtonState(p.id, 'B', 'justPressed')) {
        if (r.cannon > 0) vfxList.push({ type: 'text', text: `PHÁO ĐANG NẠP ${r.cannon.toFixed(1)}s`, x: p.x, y: p.y - 50, life: 0.7, color: '#95a5a6' });
        else {
            r.cannon = stg >= 3 ? 7.2 : 8.0;
            r.stun = stg >= 3 ? 2.8 : (stg >= 2 ? 3.3 : 4.0);
            let cutN = 2 + Math.floor(extraP / 2) + (stg >= 3 ? 1 : 0);
            let chains = story.props.filter(c => c.kind === 'chain').slice(0, cutN);
            for (let c of chains) c.hp = 0;
            let hx = 2000, hy = ROOF.y1 + 250;
            vfxList.push({ type: 'laser_beam', x: 2000, y: ROOF.y1 - 60, tx: hx, ty: hy, life: 0.25 });
            vfxList.push({ type: 'flash', x: hx, y: hy, r: 220, life: 0.4, max: 0.4 }); createParticles(hx, hy, '#e67e22', 50, 500);
            addScreenShake(16); Sound.play('explode');
            railMsg(chains.length ? `💥 PHÁO TRÚNG THE HUCKER! ĐỨT ${chains.length} MÓC XÍCH!` : `💥 PHÁO TRÚNG THE HUCKER! CHOÁNG ${r.stun.toFixed(1)} GIÂY`, 2.2);
        }
    }
    if (getButtonState(p.id, 'C', 'justPressed')) {
        if (r.boostCD > 0) vfxList.push({ type: 'text', text: `NỒI HƠI ĐANG HỒI ${r.boostCD.toFixed(1)}s`, x: p.x, y: p.y - 50, life: 0.7, color: '#95a5a6' });
        else { r.boost = 4.2; r.boostCD = 11.5; Sound.play('level'); railMsg('🚂 XẢ HƠI NƯỚC — ĐOÀN TÀU TĂNG TỐC MẠNH!', 1.7); }
    }
    if (getButtonState(p.id, 'D', 'justPressed')) {
        if (r.sw > 0) { r.sw = 0; r.swT = (stg >= 2 ? 5.8 : 8) + Math.random() * 4; r.shift = 0.5; Sound.play('upgrade'); addScreenShake(6); railMsg('✔ ĐÃ CHUYỂN RAY — LÁCH QUA CHƯỚNG NGẠI VẬT!', 1.8); }
        else vfxList.push({ type: 'text', text: 'CHƯA CÓ GÌ CHẮN ĐƯỜNG', x: p.x, y: p.y - 50, life: 0.7, color: '#95a5a6' });
    }
}
function railSpawnChains(r, forceCount) {
    let stg = railStageOf(r ? r.dist : 0), extraP = Math.max(0, bossTeamCount() - 1);
    let existing = story.props.filter(c => c.kind === 'chain');
    let maxChains = Math.min(11, 6 + extraP * 2 + (stg >= 2 ? 2 : 0) + (stg >= 3 ? 1 : 0));
    let availSlots = Math.max(0, maxChains - existing.length);
    if (availSlots <= 0) return 0;

    let want = forceCount || (1 + (extraP >= 2 ? 1 : 0) + (stg >= 2 && Math.random() < 0.72 ? 1 : 0) + (stg >= 3 && Math.random() < 0.55 ? 1 : 0));
    want = Math.min(availSlots, want);

    let freeSpots = RAIL_CHAIN_SPOTS.filter(s => s.minStage <= stg && !existing.some(c => Math.hypot(c.x - s.x, c.y - s.y) < 75));
    if (!freeSpots.length) return 0;

    // Ưu tiên rải móc ra nhiều toa khác nhau để đội phải di chuyển phối hợp
    let labels = [], spawned = 0;
    while (spawned < want && freeSpots.length > 0) {
        let idx = Math.floor(Math.random() * freeSpots.length);
        let sp = freeSpots.splice(idx, 1)[0];
        let jx = sp.x === 2000 ? (Math.random() - 0.5) * 18 : 0;
        let jy = (sp.y > ROOF.y0 + 40 && sp.y < ROOF.y1 - 40) ? (Math.random() - 0.5) * 18 : 0;
        let x = Math.round(sp.x + jx), y = Math.round(sp.y + jy);
        let hp = Math.round((230 + currentLevel * 42) * (1 + extraP * 0.22) * (stg >= 2 ? 1.15 : 1));
        story.props.push({ kind: 'chain', breakable: true, x, y, r: 22, hp, maxHp: hp, cd: 0.65 + spawned * 0.25 });
        vfxList.push({ type: 'laser_beam', x: 2000, y: ROOF.y1 + 250, tx: x, ty: y, life: 0.34 });
        vfxList.push({ type: 'text', text: `⛓ ${sp.name}`, x, y: y - 32, life: 1.8, color: '#ff7675' });
        labels.push(sp.name);
        spawned++;
    }
    if (spawned > 0) {
        Sound.play('throw'); addScreenShake(5 + spawned * 2);
        railMsg(`⛓ MÓC XÍCH BÁM TẠI: [${labels.join(' · ')}]!`, 2.8);
    }
    return spawned;
}
function railAddChain() { return railSpawnChains(story.rail); }

// Vòng cập nhật trên nóc tàu (gọi từ updateStory khi objState === 'TRAIN')
function updateRail(dt) {
    let r = story.rail; if (!r) return;
    if (r.msgT > 0) r.msgT -= dt;
    if (r.shift > 0) r.shift -= dt;
    if (r.end) {
        r.end -= dt;
        if (r.end <= 0) { story.lab = story.lab || {}; story.lab.result = r.win ? { ok: true } : { ok: false, text: r.failText || 'Đoàn tàu bị phá hủy trước khi tới Hầm An Toàn.' }; story.rail = null; labFinish(); }
        return;
    }
    const cx = (ROOF.x0 + ROOF.x1) / 2;
    // Giữ phe ta trên nóc tàu; quái bị hất văng khỏi mép nóc thì rơi xuống đường ray
    const clamp = (e) => { if (e.netLeft) return; let m = (e.radius || 14); e.x = Math.max(ROOF.x0 + m, Math.min(ROOF.x1 - m, e.x)); e.y = Math.max(ROOF.y0 + m, Math.min(ROOF.y1 - m, e.y)); };
    players.forEach(clamp); allies.forEach(clamp);
    for (let z of zombies) {
        if (z.hp <= 0) continue;
        if (z.x < ROOF.x0 - 26 || z.x > ROOF.x1 + 26 || z.y < ROOF.y0 - 26 || z.y > ROOF.y1 + 26) { z.hp = 0; z.noLoot = true; createParticles(z.x, z.y, '#95a5a6', 8, 200); vfxList.push({ type: 'text', text: 'RƠI KHỎI TÀU!', x: z.x, y: z.y - 20, life: 0.7, color: '#dfe6e9' }); }
        else if (Math.abs(z.kbX) + Math.abs(z.kbY) < 40) { z.x = Math.max(ROOF.x0 + 6, Math.min(ROOF.x1 - 6, z.x)); z.y = Math.max(ROOF.y0 + 6, Math.min(ROOF.y1 - 6, z.y)); }
    }
    // Tránh kẹt tay không trên nóc tàu: nếu ai lỡ mất súng quá 3.5s thì tự tiếp tế súng dự phòng
    for (let p of players) {
        if (p.netLeft || p.isDowned) continue;
        if (!p.weapon) {
            p._railUnarmed = (p._railUnarmed || 0) + dt;
            if (p._railUnarmed >= 3.2) {
                p._railUnarmed = 0;
                p.weapon = { ...WEAPON_TYPES[Math.random() < 0.65 ? 'AR' : 'SHOTGUN'] };
                vfxList.push({ type: 'text', text: `TIẾP TẾ KHẨN: ${p.weapon.name}!`, x: p.x, y: p.y - 44, life: 1.5, color: '#f1c40f' });
                Sound.play('reload');
            }
        } else p._railUnarmed = 0;
    }

    // Tàu & leo thang độ khó theo quãng đường (Đầu -> Giữa -> Gần Cuối -> Cuối)
    let stg = railStageOf(r.dist), extraP = Math.max(0, bossTeamCount() - 1);
    if ((r.stage || 0) < stg) {
        r.stage = stg;
        if (stg === 1) {
            railMsg('⚡ GIAI ĐOẠN GIỮA — THE HUCKER TĂNG TỐC VÂY ÉP TRÊN CẢ 3 TOA!', 2.8);
            Sound.play('roar'); addScreenShake(10);
        } else if (stg === 2) {
            railMsg('🔥 GẦN CUỐI ĐƯỜNG RAY — THE HUCKER NỔI ĐIÊN! MÓC XÍCH ĐA VỊ TRÍ & NÉM ZOMBIE DỒN DẬP!', 3.4);
            Sound.play('big_roar'); addScreenShake(18);
            railSpawnChains(r, 2 + (extraP >= 2 ? 1 : 0));
            drops.push({ x: cx - 40, y: railCarCenterY(1), type: 'SUPERBOX', life: 90 });
            drops.push({ x: cx + 40, y: railCarCenterY(1), type: 'MEDKIT', life: 90 });
            for (let k = 0; k < extraP; k++) drops.push({ x: cx + (k % 2 ? 55 : -55), y: railCarCenterY(k % 3), type: 'BLINDBOX', life: 90 });
            vfxList.push({ type: 'text', text: '📦 TIẾP TẾ ĐẶC BIỆT TẠI [TOA GIỮA]!', x: cx, y: railCarCenterY(1) - 42, life: 2.4, color: '#f1c40f' });
        } else if (stg === 3) {
            railMsg('☠ CHẶNG CUỐI TỬ THẦN — CỬA HẦM TRƯỚC MẶT! TOÀN LỰC GIỮ VỮNG ĐOÀN TÀU!', 3.6);
            Sound.play('big_roar'); addScreenShake(24); addScreenFlash(0.32, 36);
            railSpawnChains(r, 2 + Math.min(2, extraP));
            for (let k = 0; k < 1 + Math.floor(bossTeamCount() / 2); k++) {
                let cy = railCarCenterY(k % 3);
                drops.push({ x: cx + (k % 2 ? 48 : -48), y: cy, type: k === 0 ? 'MEDKIT' : 'BLINDBOX', life: 90 });
            }
        }
    }

    let chains = story.props.filter(c => c.kind === 'chain');
    if (r.boost > 0) r.boost -= dt;
    if (r.boostCD > 0) r.boostCD -= dt;
    if (r.cannon > 0) r.cannon -= dt;
    // Kết thúc: C4 nổ tung toa đuôi cuốn theo The Hucker, đoàn tàu lao vào hầm (17-bosses.js)
    if (r.fin >= 0) { railFinale(r, dt); return; }
    let dragMul = 1 / (1 + extraP * 0.22);
    let target = Math.max(20, 110 - chains.length * 11.5 * dragMul) + (r.boost > 0 ? 38 : 0);
    r.speed += Math.max(-50 * dt, Math.min(18 * dt, target - r.speed));
    r.dist += r.speed / 100 * 18.5 * dt;
    r.hp -= chains.length * (stg >= 3 ? 0.88 : (stg >= 2 ? 0.78 : 0.66)) * dragMul * dt;
    if (r.dist >= ROOF.tunnel - 75) { railStartFinale(r); return; }
    // Mọi người đều gục: thất bại (không game over)
    let actP = activePlayers();
    if (actP.length > 0 && actP.every(p => p.isDowned)) { r.win = false; r.failText = 'Cả đội gục ngã trên nóc tàu.'; r.end = 2.5; railMsg('CẢ ĐỘI ĐÃ GỤC!', 3); return; }

    // The Hucker phóng xích (nhiều vị trí hơn, dồn dập hơn ở gần cuối & cuối và khi đông người)
    if (r.stun > 0) r.stun -= dt;
    else {
        r.chainT -= dt;
        if (r.chainT <= 0) {
            let baseCD = stg >= 3 ? 1.85 : (stg >= 2 ? 2.45 : (stg >= 1 ? 3.2 : 3.9));
            r.chainT = Math.max(1.35, baseCD - extraP * 0.22) + Math.random() * 0.9;
            railSpawnChains(r);
        }
    }
    railHuckerAttacks(r, dt);   // ném đá, xích quét kép, ném zombie, dầm thép & tiếp tế (17-bosses.js)
    // Zombie trèo lên theo từng sợi xích
    let zCap = 40 + extraP * 10 + (stg >= 2 ? 10 : 0) + (stg >= 3 ? 6 : 0);
    for (let c of chains) {
        c.cd -= dt;
        if (c.cd <= 0 && zombies.length < zCap) {
            c.cd = (stg >= 3 ? 0.82 : (stg >= 2 ? 0.96 : 1.15)) + Math.random() * 0.55;
            let roll = Math.random(), t = 0;
            if (stg >= 3 && roll < 0.16) t = 14;          // Bọc Thép ở chặng cuối
            else if (stg >= 2 && roll < 0.26) t = 10;     // Lao Húc ở gần cuối
            else if (roll < (stg >= 2 ? 0.54 : 0.30)) t = 3; // Chạy Nhanh
            else if (roll < 0.68 && currentLevel >= 6) t = Math.random() < 0.5 ? 1 : 2;
            let ix = c.x + (c.x < cx - 30 ? 22 : (c.x > cx + 30 ? -22 : 0));
            let iy = c.y + (c.y < ROOF.y0 + 45 ? 24 : (c.y > ROOF.y1 - 45 ? -24 : 0));
            zombies.push(new Zombie(ix, iy, t)); createParticles(c.x, c.y, '#7f8c8d', 5, 120);
        }
    }
    // Đá chắn đường ray (càng về cuối xuất hiện càng gắt)
    if (r.sw > 0) {
        r.sw -= dt;
        if (r.sw <= 0) {
            r.sw = 0; r.swT = (stg >= 2 ? 5.8 : 8) + Math.random() * 4;
            let hitDmg = stg >= 3 ? 22 : 18;
            r.hp -= hitDmg; r.speed = Math.min(r.speed, 28); addScreenShake(22); Sound.play('explode');
            railMsg(`💥 TÀU ĐÂM VÀO ĐÁ TẢNG! -${hitDmg} MÁU TÀU, MẤT TỐC ĐỘ!`, 2.4);
            for (let p of players) if (!p.netLeft && !p.isDowned) stunPlayer(p, 0.6);
        }
    } else {
        r.swT -= dt;
        if (r.swT <= 0 && r.dist < ROOF.tunnel - 110) {
            r.sw = stg >= 3 ? 3.6 : (stg >= 2 ? 4.0 : 4.5);
            Sound.play('hit'); railMsg('⚠ ĐÁ CHẮN ĐƯỜNG RAY — BẤM [D] ĐỂ CHUYỂN RAY NGAY!', r.sw);
        }
    }
    if (r.hp <= 0) { r.hp = 0; r.win = false; r.end = 2.8; addScreenShake(24); Sound.play('explode'); railMsg('ĐOÀN TÀU BỊ PHÁ HỦY!', 3); }
}
// Móc xích bị phá
function railChainBroken(c) {
    createParticles(c.x, c.y, '#b2bec3', 24, 300); Sound.play('melee'); addScreenShake(4);
    vfxList.push({ type: 'text', text: `ĐỨT XÍCH (${railCarName(c.y)})!`, x: c.x, y: c.y - 30, life: 1.1, color: '#2ecc71' });
}

// Vẽ: đất trôi về phía sau, đường ray, 3 toa tàu nhìn từ trên xuống, The Hucker bám theo, các sợi xích
function drawRail(T, x0, x1, y0, y1) {
    let r = story.rail; if (!r) return;
    const cx = (ROOF.x0 + ROOF.x1) / 2, scroll = r.dist * 22, sh = r.shift > 0 ? Math.sin(r.shift * 12) * 10 : 0;
    let stg = railStageOf(r.dist);
    ctx.fillStyle = stg >= 3 ? '#22171a' : (stg === 2 ? '#1e1b20' : '#1a2124'); ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let i = 0; i < 90; i++) { let gx = x0 + ((i * 137.5) % (x1 - x0)), gy = y0 + ((i * 71.3 + scroll * (0.8 + (i % 3) * 0.2)) % (y1 - y0)); ctx.fillRect(gx, gy, 4, 14); }
    // Đường ray (lệch sang ngang khi chuyển ray)
    ctx.fillStyle = '#3b2f26'; for (let y = y0 - 40 + (scroll % 44); y < y1 + 40; y += 44) ctx.fillRect(cx - 96 + sh, y, 192, 12);
    ctx.fillStyle = '#95a5a6'; ctx.fillRect(cx - 70 + sh, y0, 8, y1 - y0); ctx.fillRect(cx + 62 + sh, y0, 8, y1 - y0);
    // Hầm an toàn hiện ra ở cuối chặng
    if (r.dist > ROOF.tunnel - 90) {
        let ty = ROOF.y0 - 900 + (r.dist - (ROOF.tunnel - 90)) / 90 * 760;
        ctx.fillStyle = '#2d3436'; ctx.fillRect(x0, ty - 700, x1 - x0, 760);
        ctx.fillStyle = '#000'; ctx.fillRect(cx - 190, ty - 120, 380, 180); ctx.beginPath(); ctx.arc(cx, ty - 120, 190, Math.PI, 0); ctx.fill();
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; outlinedText('HẦM AN TOÀN', cx, ty - 380, '#2ecc71', 'bold 40px Arial');
    }
    // The Hucker bám phía sau + xích
    let hx = cx + Math.sin(T * (stg >= 2 ? 1.25 : 0.8)) * (stg >= 2 ? 128 : 110), hy = ROOF.y1 + 250 + Math.sin(T * 1.7) * 14;
    ctx.strokeStyle = stg >= 2 ? '#ff7675' : '#b2bec3'; ctx.lineWidth = 6; ctx.setLineDash([14, 9]);
    for (let c of story.props) if (c.kind === 'chain') { ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(c.x, c.y); ctx.stroke(); }
    ctx.setLineDash([]);
    let blown = r.fin >= 0.9, bk = blown ? r.fin - 0.9 : 0;
    if (bk < 1.6) {
        let by = hy + bk * bk * 420;
        ctx.save(); ctx.globalAlpha = blown ? Math.max(0, 1 - bk / 1.6) : 1;
        drawShadow(hx, by + 20, 62);
        drawHucker({ x: hx, y: by, radius: 62, phase2Done: true }, T, -Math.PI / 2 + bk * 7, (r.stun > 0 || blown) && Math.floor(T * 12) % 2 === 0);
        ctx.restore();
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        let hTag = blown ? 'THE HUCKER — BỊ THỔI BAY!' : (r.stun > 0 ? 'THE HUCKER — CHOÁNG!' : (stg >= 3 ? 'THE HUCKER — TỬ CHIẾN!' : (stg >= 2 ? 'THE HUCKER — CUỒNG NỘ!' : 'THE HUCKER')));
        outlinedText(hTag, hx, by + 92, r.stun > 0 || blown ? '#f1c40f' : (stg >= 2 ? '#ff4757' : '#e17055'), 'bold 15px Arial');
    }
    // Ba toa tàu (nóc) + ký hiệu rõ TOA ĐẦU / TOA GIỮA / TOA ĐUÔI
    let jit = Math.sin(T * 38) * (stg >= 2 ? 1.8 : 1.2), carH = (ROOF.y1 - ROOF.y0 - 40) / 3;
    const carNames = ['TOA ĐẦU', 'TOA GIỮA', 'TOA ĐUÔI'];
    for (let k = 0; k < 3; k++) {
        let y = ROOF.y0 + k * (carH + 20), jx = k % 2 ? jit : -jit;
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(ROOF.x0 - 14 + 12, y + 12, ROOF.x1 - ROOF.x0 + 28, carH);
        ctx.fillStyle = k === 0 ? '#34495e' : (k === 1 ? '#4b6584' : '#3d566e'); ctx.fillRect(ROOF.x0 - 14 + jx, y, ROOF.x1 - ROOF.x0 + 28, carH);
        ctx.strokeStyle = '#1e272e'; ctx.lineWidth = 5; ctx.strokeRect(ROOF.x0 - 14 + jx, y, ROOF.x1 - ROOF.x0 + 28, carH);
        ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 3; ctx.beginPath(); for (let yy = y + 50; yy < y + carH - 20; yy += 60) { ctx.moveTo(ROOF.x0 + jx, yy); ctx.lineTo(ROOF.x1 + jx, yy); } ctx.stroke();
        ctx.fillStyle = '#2d3436'; ctx.fillRect(cx - 34 + jx, y + carH / 2 - 26, 68, 52); ctx.fillStyle = `rgba(255, 234, 167, ${0.4 + 0.15 * Math.sin(T * 7 + k)})`; ctx.fillRect(cx - 26 + jx, y + carH / 2 - 18, 52, 36);   // cửa nóc
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.font = '900 22px Arial'; ctx.fillText(carNames[k], cx + jx, y + 32);
        if (k < 2) { ctx.fillStyle = '#2f3542'; ctx.fillRect(cx - 26, y + carH, 52, 20); }
    }
    // Đầu máy nhả khói
    for (let k = 0; k < 5; k++) { let t = (T * 0.9 + k * 0.2) % 1; ctx.beginPath(); ctx.arc(cx + Math.sin(k * 2.1 + T) * 30, ROOF.y0 + 60 + t * 260, 22 + t * 60, 0, Math.PI * 2); ctx.fillStyle = `rgba(210, 210, 210, ${0.18 * (1 - t)})`; ctx.fill(); }
    // Khẩu pháo ở đuôi tàu
    let rdy = r.cannon <= 0;
    ctx.save(); ctx.translate(cx, ROOF.y1 - 60); ctx.rotate(Math.atan2(hy - (ROOF.y1 - 60), hx - cx));
    ctx.fillStyle = '#2f3542'; ctx.fillRect(0, -9, 62, 18); ctx.fillStyle = '#636e72'; ctx.fillRect(56, -12, 10, 24); ctx.restore();
    ctx.beginPath(); ctx.arc(cx, ROOF.y1 - 60, 24, 0, Math.PI * 2); ctx.fillStyle = rdy ? '#f39c12' : '#57606f'; ctx.fill(); ctx.strokeStyle = '#111'; ctx.lineWidth = 3; ctx.stroke();
    outlinedText(rdy ? 'PHÁO: SẴN SÀNG (B)' : `PHÁO: ${r.cannon.toFixed(1)}s`, cx, ROOF.y1 - 22, rdy ? '#f1c40f' : '#95a5a6', 'bold 12px Arial');
    drawRailFinale(r, T, x0, x1, y0, y1);
}
function drawRailChain(c, T) {
    ctx.beginPath(); ctx.arc(c.x, c.y, c.r + 4 + Math.sin(T * 8) * 2, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(255, 71, 87, 0.85)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.strokeStyle = '#dfe6e9'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(c.x, c.y, 13, 0.6, 4.6); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = '#636e72'; ctx.beginPath(); ctx.arc(c.x, c.y, 6, 0, Math.PI * 2); ctx.fill();
    drawMiniBar(c.x, c.y - c.r - 14, 50, 5, c.hp, c.maxHp, '#ff7675');
    let lbl = railChainLabel(c.x, c.y);
    let tx = Math.max(ROOF.x0 + 36, Math.min(ROOF.x1 - 36, c.x));
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    outlinedText('⛓ ' + lbl, tx, c.y + c.r + 12, '#ff9f43', 'bold 10px Arial', 3);
}
// Bảng trạng thái tàu trên màn hình
function drawRailHud(T) {
    let r = story.rail; if (!r || objState !== 'TRAIN') return;
    const small = W < 640 || H < 480;
    const bar = (x, y, w, h, pct, col, label) => {
        ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(x, y, w, h); ctx.fillStyle = col; ctx.fillRect(x, y, w * Math.max(0, Math.min(1, pct)), h);
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w, h);
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Arial'; ctx.fillText(label, x + 6, y + h / 2 + 1);
    };
    let stg = railStageOf(r.dist), stgTag = stg >= 3 ? ' · ☠ CHẶNG CUỐI' : (stg === 2 ? ' · 🔥 GẦN CUỐI' : (stg === 1 ? ' · ⚡ TĂNG TỐC' : ''));
    let bw = Math.min(270, W - 20), bx = W / 2 - bw / 2, by = small ? 126 : 96, chains = story.props.filter(c => c.kind === 'chain'), n = chains.length;
    bar(bx, by, bw, 16, r.hp / 100, r.hp < 35 ? '#ff4757' : '#e74c3c', `MÁU TÀU ${Math.ceil(r.hp)}`);
    bar(bx, by + 19, bw, 13, r.speed / 135, n ? '#e67e22' : '#3498db', `TỐC ĐỘ ${Math.round(r.speed)}%${n ? '  ·  ⛓ x' + n : ''}`);
    bar(bx, by + 35, bw, 13, r.dist / ROOF.tunnel, stg >= 3 ? '#ff4757' : (stg === 2 ? '#f39c12' : '#2ecc71'), `HẦM AN TOÀN ${Math.max(0, Math.ceil(ROOF.tunnel - r.dist))}m${stgTag}`);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let cds = `B PHÁO ${r.cannon > 0 ? r.cannon.toFixed(0) + 's' : '✔'}   C TĂNG TỐC ${r.boostCD > 0 ? r.boostCD.toFixed(0) + 's' : '✔'}   D CHUYỂN RAY ${r.sw > 0 ? '⚠' : '—'}`;
    outlinedText(cds, W / 2, by + 60, '#dfe6e9', 'bold 11px Arial');
    if (n > 0) {
        // Dòng tóm tắt vị trí các móc xích đang bám theo từng toa để cả đội dễ chia nhau phá
        let c0 = chains.filter(c => c.y < 1747).length, c1 = chains.filter(c => c.y >= 1747 && c.y < 2253).length, c2 = chains.filter(c => c.y >= 2253).length;
        let parts = [];
        if (c0) parts.push(`ĐẦU:${c0}`);
        if (c1) parts.push(`GIỮA:${c1}`);
        if (c2) parts.push(`ĐUÔI:${c2}`);
        outlinedText(`⛓ VỊ TRÍ MÓC ĐANG BÁM: ${parts.join('  |  ')}`, W / 2, by + 75, '#ff9f43', 'bold 11px Arial', 3);
    }
    if (r.sw > 0) {
        let a = 0.6 + 0.4 * Math.sin(T * 14);
        ctx.fillStyle = `rgba(160, 0, 0, ${0.18 * a})`; ctx.fillRect(0, 0, W, H);
        outlinedText('⚠ ĐÁ CHẮN ĐƯỜNG RAY', W / 2, H * 0.32, '#ff4757', `900 ${small ? 20 : 28}px Arial`, 6); outlinedText(`BẤM D ĐỂ CHUYỂN RAY!  ${r.sw.toFixed(1)}s`, W / 2, H * 0.32 + (small ? 26 : 36), '#f1c40f', `900 ${small ? 16 : 22}px Arial`, 5);
    } else if (r.msgT > 0) {
        ctx.globalAlpha = Math.min(1, r.msgT * 2); ctx.font = `bold ${small ? 12 : 16}px Arial`;
        let lines = storyWrap(r.msg, Math.min(W - 24, 580));
        lines.forEach((l, i) => outlinedText(l, W / 2, H * 0.34 + i * (small ? 16 : 22), stg >= 3 ? '#ff7675' : '#f1c40f', `bold ${small ? 12 : 16}px Arial`, 4));
        ctx.globalAlpha = 1;
    }
    if (r.hp < 35 && !r.end) { ctx.fillStyle = `rgba(200, 0, 0, ${0.1 + 0.08 * Math.sin(T * 9)})`; ctx.fillRect(0, 0, W, H); }   // tàu sắp vỡ: viền đỏ nhịp tim
    if (r.fin >= 2.2) { ctx.fillStyle = `rgba(0,0,0,${Math.min(0.8, (r.fin - 2.2) * 0.4)})`; ctx.fillRect(0, 0, W, H); }      // tàu chui vào hầm tối
    if (r.end) { ctx.fillStyle = `rgba(0,0,0,${Math.min(0.75, (2.8 - r.end) * 0.4)})`; ctx.fillRect(0, 0, W, H); outlinedText(r.win ? 'TẨU THOÁT THÀNH CÔNG!' : 'THẤT BẠI', W / 2, H / 2, r.win ? '#2ecc71' : '#ff4757', `900 ${Math.round(Math.min(48, W / 12))}px Arial`, 6); }
}

// ---------------------------------------------------------------------------
// VẼ MAP PHÒNG THÍ NGHIỆM / GIAO DIỆN
// ---------------------------------------------------------------------------
function drawLabFloor(T) {
    // Sàn Lab, sân ga, đường ray
    ctx.fillStyle = '#263238'; ctx.fillRect(LAB.x0, LAB.y0, LAB.x1 - LAB.x0, LAB.y1 - LAB.y0);
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 2; ctx.beginPath();
    for (let x = LAB.x0 + 100; x < LAB.x1; x += 100) { ctx.moveTo(x, LAB.y0); ctx.lineTo(x, LAB.y1); }
    for (let y = LAB.y0 + 100; y < LAB.y1; y += 100) { ctx.moveTo(LAB.x0, y); ctx.lineTo(LAB.x1, y); }
    ctx.stroke();
    ctx.fillStyle = '#3a3f44'; ctx.fillRect(1250, 600, 1500, 420);                                  // sân ga
    ctx.fillStyle = '#f1c40f'; for (let x = 1260; x < 2740; x += 60) ctx.fillRect(x, 600, 34, 8);   // vạch vàng mép sân ga
    ctx.fillStyle = '#3b2f26'; for (let x = 0; x < MAP_SIZE.w; x += 44) ctx.fillRect(x, 486, 14, 88);
    ctx.fillStyle = '#95a5a6'; ctx.fillRect(0, 500, MAP_SIZE.w, 6); ctx.fillRect(0, 554, MAP_SIZE.w, 6);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.font = 'bold 90px Arial'; ctx.fillText('NHÀ GA X', 2000, 860);
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.font = 'bold 120px Arial'; ctx.fillText('LAB Z', 2000, 2000);
    // Khí độc trong Lab
    let L = story.lab, gas = L ? L.gas : 0;
    if (gas > 0.01) {
        ctx.fillStyle = `rgba(120, 200, 60, ${0.16 * gas})`; ctx.fillRect(LAB.x0 + 50, LAB.y0 + 50, LAB.x1 - LAB.x0 - 100, LAB.y1 - LAB.y0 - 100);
        ctx.fillStyle = `rgba(160, 230, 90, ${0.10 * gas})`;
        for (let k = 0; k < 14; k++) { let gx = LAB.x0 + 120 + ((k * 263 + T * 22) % (LAB.x1 - LAB.x0 - 240)), gy = LAB.y0 + 120 + ((k * 181 + Math.sin(T * 0.4 + k) * 60) % (LAB.y1 - LAB.y0 - 240)); ctx.beginPath(); ctx.ellipse(gx, gy, 130, 70, 0, 0, Math.PI * 2); ctx.fill(); }
    }
    // Cửa hợp kim còn đóng
    for (let o of obstacles) if (o.door) { ctx.fillStyle = '#b2bec3'; ctx.fillRect(o.x, o.y - 6, o.w, o.h + 12); ctx.fillStyle = '#f1c40f'; for (let x = o.x + 6; x < o.x + o.w - 14; x += 30) ctx.fillRect(x, o.y - 6, 14, 5); }
}
function drawLabProp(p, T) {
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (p.kind === 'machine') {
        ctx.beginPath(); ctx.arc(p.x, p.y, 115, 0, Math.PI * 2); ctx.strokeStyle = p.on ? 'rgba(46, 204, 113, 0.5)' : 'rgba(241, 196, 15, 0.45)'; ctx.lineWidth = 2; ctx.setLineDash([8, 8]); ctx.stroke(); ctx.setLineDash([]);
        drawShadow(p.x, p.y + 12, 30);
        ctx.fillStyle = '#57606f'; ctx.fillRect(p.x - 28, p.y - 30, 56, 60); ctx.strokeStyle = '#1e272e'; ctx.lineWidth = 3; ctx.strokeRect(p.x - 28, p.y - 30, 56, 60);
        ctx.fillStyle = p.on ? '#2ecc71' : (Math.floor(T * 3) % 2 ? '#e74c3c' : '#7b241c'); ctx.fillRect(p.x - 20, p.y - 22, 40, 14);
        ctx.save(); ctx.translate(p.x, p.y + 10); ctx.rotate(p.on ? T * 9 : 0); ctx.strokeStyle = '#dfe6e9'; ctx.lineWidth = 3; ctx.beginPath(); for (let k = 0; k < 3; k++) { ctx.moveTo(0, 0); ctx.lineTo(Math.cos(k * 2.094) * 14, Math.sin(k * 2.094) * 14); } ctx.stroke(); ctx.restore();
        if (!p.on) { drawMiniBar(p.x, p.y + 38, 60, 6, p.hp, p.maxHp, '#f1c40f'); outlinedText('MÁY KHỬ ĐỘC', p.x, p.y - 44, '#f1c40f', 'bold 11px Arial'); }
        else outlinedText('ĐANG LỌC KHÍ', p.x, p.y - 44, '#2ecc71', 'bold 11px Arial');
    } else if (p.kind === 'print') {
        if (p.on) return;
        ctx.beginPath(); ctx.arc(p.x, p.y, 24 + Math.sin(T * 5) * 4, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(116, 185, 255, 0.6)'; ctx.lineWidth = 2; ctx.stroke();
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(-0.2);
        ctx.fillStyle = '#0984e3'; ctx.fillRect(-13, -16, 26, 32); ctx.strokeStyle = '#dfe6e9'; ctx.lineWidth = 1.5; ctx.strokeRect(-13, -16, 26, 32);
        ctx.beginPath(); for (let k = 0; k < 4; k++) { ctx.moveTo(-9, -10 + k * 7); ctx.lineTo(9, -10 + k * 7); } ctx.stroke(); ctx.restore();
        outlinedText('BẢN THIẾT KẾ', p.x, p.y - 30, '#74b9ff', 'bold 11px Arial');
    } else if (p.kind === 'traindoor') {
        let L = story.lab, st = L ? L.stage : '';
        if (st !== 'escort' && st !== 'board' && st !== 'hold') return;
        let col = st === 'board' ? '46, 204, 113' : '241, 196, 15';
        ctx.beginPath(); ctx.arc(p.x, p.y, 210, 0, Math.PI * 2); ctx.fillStyle = `rgba(${col}, 0.10)`; ctx.fill();
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(T * 0.6); ctx.setLineDash([28, 18]); ctx.beginPath(); ctx.arc(0, 0, 210, 0, Math.PI * 2); ctx.strokeStyle = `rgba(${col}, 0.9)`; ctx.lineWidth = 5; ctx.stroke(); ctx.setLineDash([]); ctx.restore();
        ctx.fillStyle = `rgba(${col}, 0.9)`; ctx.font = 'bold 60px Arial'; ctx.fillText('🚂', p.x, p.y + 10);
        if (st === 'board' && L.board > 0) { ctx.beginPath(); ctx.arc(p.x, p.y, 210, -Math.PI / 2, -Math.PI / 2 + Math.min(1, L.board / 1.2) * Math.PI * 2); ctx.strokeStyle = '#3498db'; ctx.lineWidth = 10; ctx.stroke(); }
    }
}
function labObjectiveText() {
    let L = story.lab; if (!L) return null;
    switch (objState) {
        case 'LAB_C4': return [`BẢO VỆ BINH SĨ GÀI C4: ${Math.ceil(25 * (1 - L.plant))}s${L.backup > 0 ? '' : ' (hết quân dự bị!)'}`, '#f1c40f'];
        case 'LAB_DECON': return [`KHỬ ĐỘC ${L.mOn}/3 · BẢN THIẾT KẾ ${L.pGot}/2 · NHÀ KHOA HỌC ${L.sRes}/${L.sAlive}`, L.gas > 0 ? '#badc58' : '#2ecc71'];
        case 'LAB_ESCORT': return ['DẪN NHÀ KHOA HỌC RA BẾN NHÀ GA X (phía bắc)', '#f1c40f'];
        case 'STATION_HOLD': return [`TỬ THỦ BẾN TÀU: ${Math.ceil(Math.max(0, L.hold))}s — CẢN THE HUCKER!`, '#ff9f43'];
        case 'STATION_BOARD': return ['TÀU RÚC CÒI! NHẢY LÊN TOA TÀU!', '#2ecc71'];
        case 'LAB_FAIL': return ['NHIỆM VỤ THẤT BẠI — RÚT LUI', '#ff4757'];
    }
    return null;
}
function labPointers(ptr) {
    let L = story.lab; if (!L) return;
    if (objState === 'LAB_C4') { let s = rescueNPCs.find(n => n.kind === 'soldier' && n.hp > 0); if (s) ptr(s.x, s.y, '#badc58'); ptr(LAB.doorS.x, LAB.doorS.y, '#f1c40f'); }
    else if (objState === 'LAB_DECON') {
        for (let p of story.props) if ((p.kind === 'machine' || p.kind === 'print') && !p.on) ptr(p.x, p.y, p.kind === 'machine' ? '#f1c40f' : '#74b9ff');
        for (let n of rescueNPCs) if (n.kind === 'scientist' && n.hp > 0 && !n.rescued) ptr(n.x, n.y, '#2ecc71');
    } else if (objState === 'LAB_ESCORT' || objState === 'STATION_BOARD') ptr(LAB.train.x, LAB.train.y, '#2ecc71');
    else if (objState === 'STATION_HOLD') { let b = zombies.find(z => z.type === 37 && !z.hidden); if (b) ptr(b.x, b.y, b.color); }
}
function drawLabOverlay(T) {
    let c = story.cut;
    if (!c) return;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (c.kind === 'fakewin') {
        let a = Math.min(1, c.t * 2);
        ctx.fillStyle = `rgba(0, 0, 0, ${0.6 * a})`; ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = a;
        let size = Math.round(Math.min(64, W / 11) * (1 + 0.25 * Math.max(0, 1 - c.t * 2.5)));
        ctx.shadowColor = '#f1c40f'; ctx.shadowBlur = 26; outlinedText('MISSION COMPLETED!', W / 2, H * 0.44, '#f1c40f', `900 ${size}px Arial`, 8); ctx.shadowBlur = 0;
        outlinedText('Đoàn tàu bắt đầu lăn bánh rời Nhà Ga X...', W / 2, H * 0.44 + size * 0.9, '#dfe6e9', `bold ${Math.max(13, Math.round(size * 0.3))}px Arial`, 4);
        ctx.globalAlpha = 1;
    } else if (c.kind === 'twist') {
        ctx.fillStyle = `rgba(90, 0, 0, ${0.55 + 0.15 * Math.sin(T * 20)})`; ctx.fillRect(0, 0, W, H);
        // Sợi xích bắn ngang màn hình
        let k = Math.min(1, c.t * 2.2), y = H * 0.62;
        ctx.strokeStyle = '#b2bec3'; ctx.lineWidth = 14; ctx.setLineDash([26, 14]); ctx.beginPath(); ctx.moveTo(0, y + 40); ctx.lineTo(W * k, y - 40 * k + 40); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = '#dfe6e9'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(W * k, y - 40 * k + 40, 30, -1.4, 2.4); ctx.stroke(); ctx.lineCap = 'butt';
        let size = Math.round(Math.min(58, W / 12));
        outlinedText('BẤT NGỜ!', W / 2 + (Math.random() - 0.5) * 8, H * 0.3, '#ff4757', `900 ${size}px Arial`, 8);
        if (c.t > 0.7) outlinedText('⛓ THE HUCKER MÓC XÍCH VÀO TOA ĐUÔI — GHÌ CHẶT CỖ TÀU! ⛓', W / 2, H * 0.3 + size, '#f1c40f', `bold ${Math.max(13, Math.round(size * 0.34))}px Arial`, 5);
        if (c.t > 1.6) outlinedText('Chiếm lấy Khẩu Pháo 6 Nòng ở đuôi tàu!', W / 2, H * 0.3 + size * 1.7, '#dfe6e9', `bold ${Math.max(12, Math.round(size * 0.3))}px Arial`, 4);
    }
}

// ---------------------------------------------------------------------------
// ĐỒNG BỘ ONLINE
// ---------------------------------------------------------------------------
function labNetState(x) {
    const R = Math.round;
    let L = story.lab;
    if (L) {
        x.lb = [LAB_STAGES.indexOf(L.stage), R(L.plant * 100), R(L.hold * 10), R(L.board * 100), L.backup, L.mOn, L.pGot, L.sRes, L.sAlive];
    }
    if (story.cut) x.cu = [story.cut.kind, R(story.cut.t * 100)];
    let r = story.rail;
    if (r) x.rl = [R(r.hp), R(r.speed), R(r.dist), R(Math.max(0, r.cannon) * 10), R(Math.max(0, r.boostCD) * 10), R(r.sw * 10), R((r.end || 0) * 100), r.win ? 1 : 0, r.msg, R(Math.max(0, r.msgT) * 10), R(Math.max(0, r.stun) * 10), r.fin >= 0 ? R(r.fin * 100) : -1];
}
function labNetApply(x) {
    let b = x.lb;
    if (Array.isArray(b)) {
        let m = b[5] | 0;
        story.lab = { stage: LAB_STAGES[b[0]] || 'done', plant: (b[1] | 0) / 100, hold: (b[2] | 0) / 10, board: (b[3] | 0) / 100, backup: b[4] | 0, mOn: m, pGot: b[6] | 0, sRes: b[7] | 0, sAlive: b[8] | 0 };
        story.lab.gas = story.lab.stage === 'decon' ? (3 - m) / 3 : 0;
    } else story.lab = null;
    story.cut = Array.isArray(x.cu) ? { kind: String(x.cu[0]), t: (x.cu[1] | 0) / 100 } : null;
    let t = x.rl;
    story.rail = Array.isArray(t) ? { hp: +t[0] || 0, speed: +t[1] || 0, dist: +t[2] || 0, cannon: (t[3] | 0) / 10, boostCD: (t[4] | 0) / 10, sw: (t[5] | 0) / 10, end: (t[6] | 0) / 100, win: !!t[7], msg: String(t[8] || ''), msgT: (t[9] | 0) / 10, stun: (t[10] | 0) / 10, fin: (t[11] | 0) >= 0 ? (t[11] | 0) / 100 : -1, shift: 0, boost: 0 } : null;
}
