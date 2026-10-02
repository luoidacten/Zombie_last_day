// ============================================================================
// 12-story.js — CỐT TRUYỆN, HỘI THOẠI, MÀN GIỚI THIỆU BOSS, ĐẤU TRƯỜNG BOSS
//  Chương "CHỚP VÀ SÉT":  hạ Lõi Quá Tải (31) -> Tiến sĩ Aegis -> Rừng Sét (phá 3 Trạm Điện Cao Áp, boss TÀN VẾT CHỚP 35)
//                         -> quay lại Nhà Máy Điện, giữ Lõi Máy Phát -> boss cuối ZAP-1624 "KÌNH LÔI" (36), Thương Sét (38)
//  Chương "PHÒNG THÍ NGHIỆM Z & NHÀ GA X" nằm ở 13-labz.js (dùng chung trạng thái `story`).
//  Chỉ chủ phòng chạy logic; khách nhận trạng thái qua storyNetState / storyNetApply.
// ============================================================================
const STORY_PROP_T = ['station', 'core', 'machine', 'print', 'traindoor', 'labdoor', 'wreck', 'chain', 'holdpt'];
const STORY_NPC_T = ['soldier', 'aegis', 'scientist', 'house'];
const STORY_ARENA_BOSSES = new Set([30, 31, 32, 35, 36, 50]);
const BOSS_SUBS = {
    30: 'Kẻ nghiền nát mặt đất', 31: 'Mẫu Thí Nghiệm #09', 32: 'Thủ lĩnh bầy xác sống',
    35: 'Sinh thể đột biến — 37,9% mã gen Lôi Điện', 36: 'Cỗ máy hủy diệt triệu Volt', 37: 'Kẻ săn xích sắt của Nhà Ga X',
    45: 'Nữ hoàng của Hầm Mỏ', 50: 'Tử Thần'
};
const BIG_INTRO = new Set([35, 36, 37, 45, 50]);
let zapSlain = false;
try { zapSlain = localStorage.getItem('zs_zap_slain') === '1'; } catch (e) { }

// bolt: 0 chưa bắt đầu | 1 đã gặp Tiến sĩ, chờ vào Rừng Sét | 2 đang ở Rừng Sét | 3 chờ quay lại Nhà Máy | 4 đang đánh trận cuối | 5 xong
function newStory() { return { bolt: 0, dialog: null, intro: null, cut: null, arena: null, noSpawn: false, scene: null, props: [], t: 0, purple: 0, lab: null, train: null, rail: null, zx: null, bs: null, tap: false, za: 0 }; }
let story = newStory();
function storyLevelReset() { let b = story.bolt; story = newStory(); story.bolt = b; }
function storySaveState() { return { bolt: story.bolt }; }
function storyLoadState(s) { story = newStory(); if (s && typeof s.bolt === 'number') story.bolt = Math.max(0, Math.min(5, s.bolt | 0)); }
function storyBusy() { return !!(story.dialog || story.intro || story.cut || story.scene); }
function storyRain() { return zombies.some(z => z.type === 36); }
function storyForcedRoute() { return story.bolt === 1 ? 'forest' : (story.bolt === 3 ? 'final' : null); }
// Nhiệm vụ do cốt truyện quyết định (móc trong pickMissionType)
function storyMission() {
    if (currentMapType === 15) return 'LAB_C4';
    if (currentMapType === 16) return 'BASE_DEF';
    if (currentMapType === 5) return 'RAID';
    if (story.bolt === 2 && currentMapType === 9) return 'STORM_STATIONS';
    if (story.bolt === 4 && currentMapType === 6) return 'ZAP_HOLD';
    return null;
}

// ---------------------------------------------------------------------------
// HỘI THOẠI
// ---------------------------------------------------------------------------
const AEGIS = { who: 'Tiến sĩ Aegis', icon: '👴', color: '#dff9fb' }, HERO = { who: 'Người chơi', icon: '👤', color: '#74b9ff' }, RADIO = { who: 'Tiến sĩ Aegis (Bộ đàm)', icon: '📻', color: '#00d2d3' };
const say = (sp, text) => ({ who: sp.who, icon: sp.icon, color: sp.color, text });
function startDialog(lines, onEnd) {
    story.dialog = { lines, i: 0, t: 0, onEnd: onEnd || null };
    story.tap = false;
    clearPcInputs();
    Sound.play('select');
}
function storyTapped() {
    let t = story.tap; story.tap = false;
    if (getButtonState(1, 'A', 'justPressed')) t = true;
    if (players.length > 1 && getButtonState(2, 'A', 'justPressed')) t = true;
    return t;
}
function updateDialog(dt) {
    let d = story.dialog, ln = d.lines[d.i];
    d.t += dt;
    let full = d.t * 46 >= ln.text.length;
    let tapped = d.t > 0.25 && storyTapped();
    if (tapped && !full) d.t = ln.text.length / 46 + 0.01;
    else if ((tapped && full) || d.t > ln.text.length / 46 + 7) {
        d.i++; d.t = 0; Sound.play('select');
        if (d.i >= d.lines.length) { story.dialog = null; clearPcInputs(); if (d.onEnd) d.onEnd(); }
    }
}
// Chạm / bấm bất kỳ đâu để qua câu thoại
canvas.addEventListener('mousedown', () => { if (story.dialog) story.tap = true; });
canvas.addEventListener('touchstart', () => { if (story.dialog) { story.tap = true; if (NET.mode === 'guest') UI.p1BtnA.justPressed = true; } }, { passive: true });
window.addEventListener('keydown', e => { if (story.dialog && (e.code === 'Enter' || e.code === 'Space') && !e.repeat) { story.tap = true; if (NET.mode === 'guest') UI.p1BtnA.justPressed = true; } });

// ---------------------------------------------------------------------------
// KHUNG HÌNH "ĐÓNG BĂNG": hội thoại / giới thiệu boss / đoạn cắt cảnh / mini-game tàu hoả
// Gọi ở đầu gameLoop, trả về true nếu khung hình này đã được xử lý xong.
// ---------------------------------------------------------------------------
function storyFrame(dt) {
    if (story.dialog) { updateDialog(dt); updateCamera(dt); }
    else if (story.intro) {
        let it = story.intro; it.t += dt;
        cam.x += (it.x - cam.x) * Math.min(1, dt * 5); cam.y += (it.y - cam.y) * Math.min(1, dt * 5);
        if (Math.random() < dt * 14) createParticles(it.x + (Math.random() - 0.5) * 160, it.y + (Math.random() - 0.5) * 160, it.color, 2, 160);
        if (it.t >= it.max) { story.intro = null; clearPcInputs(); }
    } else if (story.cut) { updateLabCut(dt); updateCamera(dt); }
    else return false;
    updateFx(dt); draw(); updateLoopSounds(dt); netHostTick(dt);
    return true;
}

function startBossIntro(z) {
    let big = BIG_INTRO.has(z.type);
    story.intro = { t: 0, max: big ? 3.0 : 2.0, name: BOSS_NAMES[z.type] || 'BOSS', sub: BOSS_SUBS[z.type] || '', color: z.color, x: z.x, y: z.y, big };
    spawnRing(z.x, z.y, z.color, 360, 0.9, 10); spawnRing(z.x, z.y, '#ffffff', 220, 0.6, 5);
    createParticles(z.x, z.y, z.color, 60, 420);
    addScreenShake(big ? 16 : 9);
    Sound.play('boss_intro'); Sound.play('roar');
    clearPcInputs();
}

// ---------------------------------------------------------------------------
// ĐẤU TRƯỜNG BOSS: vành đá bao quanh như đấu trường Kiến Chúa, boss chết thì vành đá sụp
// ---------------------------------------------------------------------------
function makeBossArena(z, cx, cy, R = 740, keep = false) {
    if (story.arena) return;
    if (cx === undefined) {
        let al = players.filter(p => !p.isDowned); if (!al.length) al = players;
        let px = tank.active ? tank.x : al.reduce((s, p) => s + p.x, 0) / al.length, py = tank.active ? tank.y : al.reduce((s, p) => s + p.y, 0) / al.length;
        if (Math.hypot(z.x - px, z.y - py) < R - 160) { cx = (px + z.x) / 2; cy = (py + z.y) / 2; } else { cx = px; cy = py; }
    }
    cx = Math.max(R + 170, Math.min(MAP_SIZE.w - R - 170, cx)); cy = Math.max(R + 170, Math.min(MAP_SIZE.h - R - 170, cy));
    const hits = (o) => { let nx = Math.max(o.x, Math.min(cx, o.x + o.w)), ny = Math.max(o.y, Math.min(cy, o.y + o.h)); return Math.hypot(nx - cx, ny - cy) < R + 172; };
    obstacles = obstacles.filter(o => o.keep || !hits(o));
    for (let k = 0; k < 44; k++) {
        let a = k / 44 * Math.PI * 2, bx = cx + Math.cos(a) * (R + 78) - 80, by = cy + Math.sin(a) * (R + 78) - 80;
        obstacles.push({ type: 'cave', arena: true, x: bx, y: by, w: 160, h: 160, poly: makePolyBox(bx, by, 160, 160, 26, 8) });
    }
    const pull = (e) => { if (Math.hypot(e.x - cx, e.y - cy) > R - 90) { let a = Math.random() * Math.PI * 2, r = 120 + Math.random() * 160; e.x = cx + Math.cos(a) * r; e.y = cy + Math.sin(a) * r; } };
    players.forEach(pull); allies.forEach(pull); for (let n of rescueNPCs) if (n.hp > 0) pull(n);
    if (tank.active) pull(tank);
    if (z && Math.hypot(z.x - cx, z.y - cy) > R - 150) { let a = Math.atan2(z.y - cy, z.x - cx); z.x = cx + Math.cos(a) * (R - 230); z.y = cy + Math.sin(a) * (R - 230); }
    zombies = zombies.filter(e => e === z || isBossType(e.type) || Math.hypot(e.x - cx, e.y - cy) < R - 30);
    hazards = hazards.filter(h => h.friendly || h.x === undefined || Math.hypot(h.x - cx, h.y - cy) < R);
    story.arena = { x: cx, y: cy, r: R, keep };
    navRebuild(); NAV.t = 0;
    for (let p of players) vfxList.push({ type: 'text', text: 'ĐẤU TRƯỜNG ĐÃ KHÉP LẠI!', x: p.x, y: p.y - 96, life: 2.2, color: '#ff7675' });
    addScreenShake(12); Sound.play('tank');
    updateCamera(0, true);
    if (NET.mode === 'host') netSendMap();
}
function removeBossArena() {
    if (!story.arena) return;
    let A = story.arena; story.arena = null;
    for (let o of obstacles) if (o.arena) createParticles(o.x + o.w / 2, o.y + o.h / 2, '#7f8c8d', 8, 200);
    obstacles = obstacles.filter(o => !o.arena);
    NAV.dirty = true; NAV.t = 0; addScreenShake(10);
    if (NET.mode === 'host') netSendMap();
}
function storyArenaClamp(e) {
    let A = story.arena; if (!A) return;
    let d = Math.hypot(e.x - A.x, e.y - A.y), lim = A.r - (e.radius || 20) - 14;
    if (d > lim) { e.x = A.x + (e.x - A.x) / d * lim; e.y = A.y + (e.y - A.y) / d * lim; }
}

// ---------------------------------------------------------------------------
// VÒNG CẬP NHẬT CỐT TRUYỆN (chủ phòng, mỗi khung hình)
// ---------------------------------------------------------------------------
function updateStory(dt) {
    // Boss mới xuất hiện: dựng đấu trường + màn giới thiệu tên
    for (let z of zombies) {
        if (z._seen || z.hp <= 0 || !isBossType(z.type) || z.type === 46) continue;
        z._seen = true;
        if (z.type === 45 && z.phase === 3) continue;                 // Kiến Chúa pha đào tẩu: không giới thiệu lại
        if (STORY_ARENA_BOSSES.has(z.type)) makeBossArena(z);
        startBossIntro(z);
        return;
    }
    if (story.arena && !story.arena.keep && !zombies.some(z => z.hp > 0 && STORY_ARENA_BOSSES.has(z.type))) removeBossArena();
    if (story.purple > 0 && objState !== 'STORM_WAIT' && objState !== 'STORM_BOSS') story.purple = Math.max(0, story.purple - dt * 0.5);
    let zap = zombies.find(z => z.type === 36); story.za = zap ? Math.max(0, Math.round((zap.armor || 0) / zap.maxArmor * 100)) : 0;

    // --- Cảnh gặp Tiến sĩ Aegis sau khi hạ Lõi Quá Tải ---
    if (story.scene && story.scene.kind === 'aegis') {
        let sc = story.scene, npc = sc.npc, tgt = pickAlivePlayer(); sc.t += dt;
        if (!sc.talked && Math.hypot(tgt.x - npc.x, tgt.y - npc.y) > 120 && sc.t < 7) friendlyMoveTo(npc, tgt.x, tgt.y, 210, dt);
        else if (!sc.talked) {
            sc.talked = true;
            startDialog([
                say(AEGIS, 'Khụ... Cảm ơn cậu! Nếu cậu không tới kịp, cái Lõi Năng Lượng này đã nổ tung rồi. Nhưng nghe này... con quái nhiễm điện cậu vừa hạ... chỉ là Mẫu Thí Nghiệm #09 nhỏ thôi!'),
                say(HERO, 'Gì cơ?! Nhỏ á? Nó suýt giật chết tôi đấy!'),
                say(AEGIS, 'Sinh thể đột biến gốc mang 37,9% mã gen Lôi Điện nguy hiểm nhất đã xé rào thoát vào Rừng Sét! Hãy tìm và tiêu diệt nó. Đổi lại, tôi sẽ dùng đặc quyền thu xếp cho gia đình cậu một suất ở Khu Sinh Tồn Cao Cấp Safe-Zone Alpha!'),
                say(HERO, 'Chốt kèo! Chuẩn bị vũ khí thôi.')
            ], () => {
                story.bolt = 1; story.noSpawn = false; story.scene = null;
                createParticles(npc.x, npc.y, '#dff9fb', 20, 160); rescueNPCs = rescueNPCs.filter(n => n !== npc);
                netToast('⚡ CHƯƠNG "CHỚP VÀ SÉT": điểm đến kế tiếp bị khoá — RỪNG SÉT.', 4500);
            });
        }
    }

    // --- Rừng Sét: 3 Trạm Điện Cao Áp ---
    if (objState === 'STORM_STATIONS') {
        let left = story.props.filter(p => p.kind === 'station').length;
        mission.progress = 3 - left;
        // Sét đánh dày đặc xuống các cây cổ thụ (chỉ là hình ảnh)
        story.t -= dt;
        if (story.t <= 0) {
            story.t = 0.35 + Math.random() * 0.4;
            let lp = pickAlivePlayer(), trees = obstacles.filter(o => o.type === 'tree' && Math.abs(o.x - lp.x) < 900 && Math.abs(o.y - lp.y) < 700);
            if (trees.length) { let t = trees[Math.floor(Math.random() * trees.length)]; vfxList.push({ type: 'bolt', x: t.x + t.w / 2, y: t.y + t.h / 2, life: 0.22, max: 0.22, seed: Math.random() * 1000 }); createParticles(t.x + t.w / 2, t.y + t.h / 2, '#f9ca24', 6, 160); }
        }
        for (let s of story.props) {
            if (s.kind !== 'station') continue;
            s.cd -= dt;
            if (s.cd <= 0) { s.cd = 3.6 + Math.random() * 1.5; if (players.some(p => !p.isDowned && Math.hypot(p.x - s.x, p.y - s.y) < 420)) hazards.push({ type: 'strike', x: s.x, y: s.y, radius: 170, timer: 0.9, life: 1.2, dmg: 30, stun: 0.5 }); }
        }
        if (left === 0) {
            objState = 'STORM_WAIT'; mission.type = 'STORM_WAIT'; story.t = 3.0; story.noSpawn = true;
            for (let p of players) vfxList.push({ type: 'text', text: 'NGUỒN NẠP ĐÃ BỊ CẮT... KHÔNG KHÍ ĐANG TÍCH ĐIỆN!', x: p.x, y: p.y - 90, life: 2.8, color: '#a29bfe' });
            Sound.play('thunder'); addScreenShake(10);
        }
    } else if (objState === 'STORM_WAIT') {
        story.t -= dt; story.purple = Math.min(1, story.purple + dt * 0.5);
        if (Math.random() < dt * 5) { let lp = pickAlivePlayer(); vfxList.push({ type: 'bolt', x: lp.x + (Math.random() - 0.5) * 900, y: lp.y + (Math.random() - 0.5) * 700, life: 0.22, max: 0.22, seed: Math.random() * 1000 }); }
        if (story.t <= 0) {
            let lp = pickAlivePlayer(), a = Math.random() * Math.PI * 2, sp = findSafePoint(lp.x + Math.cos(a) * 340, lp.y + Math.sin(a) * 340, 50);
            zombies.push(new Zombie(sp.x, sp.y, 35));
            objState = 'STORM_BOSS'; mission.type = 'STORM_BOSS'; mission.required = 1; mission.progress = 0; story.noSpawn = false;
            vfxList.push({ type: 'bolt', x: sp.x, y: sp.y, life: 0.4, max: 0.4, seed: 7 }); Sound.play('lightning');
        }
    } else if (objState === 'ZAP_HOLD') {
        let core = story.props.find(p => p.kind === 'core');
        if (core) {
            let inside = !tank.active && players.some(p => !p.isDowned && Math.hypot(p.x - core.x, p.y - core.y) < 240);
            core.hp = inside ? Math.min(core.maxHp, core.hp + dt) : Math.max(0, core.hp - dt * 0.25);
            mission.progress = Math.floor(core.hp);
            if (inside && Math.random() < dt * 10) createParticles(core.x + (Math.random() - 0.5) * 80, core.y + (Math.random() - 0.5) * 80, '#48dbfb', 1, 120);
            if (core.hp >= core.maxHp) {
                core.on = true; objState = 'ZAP_WAIT'; mission.type = 'ZAP_WAIT'; story.t = 2.6; story.noSpawn = true;
                for (let z of zombies) if (!isBossType(z.type)) { z.hp = 0; z._credited = true; z.noLoot = true; }
                spawnRing(core.x, core.y, '#48dbfb', 620, 0.9, 10); addScreenShake(18); Sound.play('thunder'); Sound.play('level');
                queueRadio('Tiến sĩ Aegis: Lõi Máy Phát đã bật! Tín hiệu năng lượng khổng lồ đang lao tới... NÓ ĐẾN RỒI!', null, 5);
            }
        }
    } else if (objState === 'ZAP_WAIT') {
        story.t -= dt;
        if (Math.random() < dt * 6) { let lp = pickAlivePlayer(); vfxList.push({ type: 'bolt', x: lp.x + (Math.random() - 0.5) * 900, y: lp.y + (Math.random() - 0.5) * 700, life: 0.22, max: 0.22, seed: Math.random() * 1000 }); }
        if (story.t <= 0) {
            let core = story.props.find(p => p.kind === 'core') || { x: MAP_SIZE.w / 2, y: MAP_SIZE.h / 2 };
            zombies.push(new Zombie(core.x, core.y - 430, 36));
            story.zx = { jam: 0, held: 0, spawnT: 1.5, spear: 0, final: 0 };
            queueRadio('Tiến sĩ Aegis: Nó có SÓNG BẢO VỆ — đạn không ăn thua! Nhặt PIN rơi quanh đấu trường, mang về Lõi Máy Phát để bật MÁY PHÁ SÓNG!', null, 7);
            objState = 'ZAP_BOSS'; mission.type = 'ZAP_BOSS'; mission.required = 1; mission.progress = 0; story.noSpawn = false;
            currentWeather = 4;
        }
    }

    if (objState === 'ZAP_BOSS') updateZapExtras(dt);
    if (objState === 'TRAIN') updateRail(dt);
    if (gameState !== 'PLAYING') return;
    updateStoryProps(dt);
    updateStoryHazards(dt);
    if (currentMapType === 15 && objState !== 'TRAIN') updateLab(dt);
    updateOps(dt);
}

// ZAP-1624: SÓNG BẢO VỆ, PIN, MÁY PHÁ SÓNG và pha cuối "3 cây Thương Điện"
function updateZapExtras(dt) {
    let zx = story.zx, z = zombies.find(e => e.type === 36 && e.hp > 0); if (!zx || !z) return;
    let A = story.arena || { x: MAP_SIZE.w / 2, y: MAP_SIZE.h / 2, r: 700 }, core = story.props.find(p => p.kind === 'core');
    if (zx.jam > 0) { zx.jam -= dt; if (zx.jam <= 0) for (let p of players) vfxList.push({ type: 'text', text: 'MÁY PHÁ SÓNG HẾT ĐIỆN — BOSS LẠI BẤT TỬ!', x: p.x, y: p.y - 96, life: 2.2, color: '#ff7675' }); }
    if (zx.spear > 0) zx.spear -= dt;
    // Pin rơi quanh đấu trường
    zx.spawnT -= dt;
    missionItems = missionItems.filter(i => !i.taken);
    if (zx.spawnT <= 0 && missionItems.length < 3) {
        zx.spawnT = 6.5;
        let a = Math.random() * Math.PI * 2, r = 180 + Math.random() * (A.r - 300);
        missionItems.push({ x: A.x + Math.cos(a) * r, y: A.y + Math.sin(a) * r, radius: 14, taken: false, kind: 'battery' });
    }
    if (!tank.active) for (let p of players) {
        if (p.isDowned) continue;
        for (let it of missionItems) if (!it.taken && Math.hypot(p.x - it.x, p.y - it.y) < p.radius + it.radius + 12) {
            it.taken = true; zx.held++; zx.spear = 8; Sound.play('pickup'); createParticles(it.x, it.y, '#f1c40f', 22, 150);
            vfxList.push({ type: 'text', text: zx.final > 0 ? 'PIN! GIÁP THƯƠNG ĐIỆN VỠ 8 GIÂY' : 'PIN +1 — MANG VỀ MÁY PHÁ SÓNG', x: it.x, y: it.y - 28, life: 1.4, color: '#f1c40f' });
        }
        if (core && zx.held > 0 && Math.hypot(p.x - core.x, p.y - core.y) < 140) {
            zx.jam = Math.min(60, Math.max(0, zx.jam) + 20 * zx.held); zx.held = 0;
            spawnRing(core.x, core.y, '#48dbfb', 520, 0.7, 10); Sound.play('level'); addScreenShake(8);
            vfxList.push({ type: 'text', text: `MÁY PHÁ SÓNG BẬT ${Math.ceil(zx.jam)}s — BOSS NHẬN SÁT THƯƠNG!`, x: core.x, y: core.y - 90, life: 2.2, color: '#48dbfb' });
        }
    }
    // Pha cuối: phá 3 cây Thương Điện trong 60 giây
    if (zx.final > 0) {
        zx.final -= dt;
        let big = zombies.filter(e => e.type === 38 && e.big && e.hp > 0);
        if (!big.length) { zx.final = 0; z.finalDone = true; z.invuln = false; z.armor = 0; z._hpPrev = 1; z.hp = 0; z.lastHitBy = pickAlivePlayer(); }
        else if (zx.final <= 0) {
            zx.final = 0;
            for (let l of big) { l.big = false; electricBurst(l.x, l.y, 220, 40, 0.6); l.hp = 0; l._credited = true; l.noLoot = true; }
            z.hp = z._hpPrev = z.maxHp * 0.3; z.armor = z.maxArmor;
            for (let p of players) vfxList.push({ type: 'text', text: 'HẾT GIỜ! ZAP-1624 SẠC LẠI 30% MÁU', x: p.x, y: p.y - 96, life: 2.6, color: '#ff4757' });
            Sound.play('roar');
        }
    }
}
function zapStartFinal(z) {
    let zx = story.zx; if (!zx || zx.final > 0) return;
    let A = story.arena || { x: z.x, y: z.y, r: 700 };
    zx.final = 60; z.storm = null; z.hidden = false; z.warnBeamTimer = 0; z.grounded = 0;
    for (let k = 0; k < 3; k++) {
        let a = k * Math.PI * 2 / 3 + Math.random() * 0.5, s = new Zombie(A.x + Math.cos(a) * 330, A.y + Math.sin(a) * 330, 38);
        s.big = true; s.radius = 24; s.maxHp = s.hp = 1500 + currentLevel * 200; s._hpPrev = s.hp; zombies.push(s);
        vfxList.push({ type: 'bolt', x: s.x, y: s.y, life: 0.35, max: 0.35, seed: k * 5 });
    }
    for (let p of players) vfxList.push({ type: 'text', text: 'CÒN 1 MÁU! PHÁ 3 CÂY THƯƠNG ĐIỆN TRONG 60 GIÂY!', x: p.x, y: p.y - 96, life: 3.0, color: '#f9ca24' });
    queueRadio('Tiến sĩ Aegis: Nó đang bám vào 3 cây Thương Điện để giữ mạng! Phá hết trong 1 phút — nhặt PIN sẽ làm vỡ giáp của thương!', null, 7);
    Sound.play('thunder'); addScreenShake(18);
}

// Đạn / nhát chém / vụ nổ phá Trạm Điện Cao Áp
function updateStoryProps(dt) {
    if (!story.props.some(p => p.breakable)) return;
    for (let s of story.props) {
        if (!s.breakable) continue;
        for (let b of bullets) {
            if (!b.active || b.isHeli || Math.hypot(b.x - s.x, b.y - s.y) > s.r + 6) continue;
            let exp = b.isTankShell || b.isExplosiveProj || b.isBomb;
            if (b.isFire || b.isAcid) { s.hp -= b.dmg * arsMult(b.source) * dt * 3; continue; }   // tia lửa / acid: gây sát thương theo thời gian
            if (!exp) { s.hp -= b.dmg * arsMult(b.source); createParticles(b.x, b.y, '#f9ca24', 4, 160); }
            if (exp) b.triggerHit(); else b.active = false;
        }
        for (let sl of slashes) {
            if (!sl.active || (sl.hitProps && sl.hitProps.has(s))) continue;
            if (Math.hypot(s.x - sl.x, s.y - sl.y) > sl.range + s.r) continue;
            let a = Math.atan2(s.y - sl.y, s.x - sl.x);
            if (Math.abs(Math.atan2(Math.sin(a - sl.angle), Math.cos(a - sl.angle))) > sl.spread / 2) continue;
            (sl.hitProps = sl.hitProps || new Set()).add(s);
            s.hp -= calcDamage(sl.dmg, sl.wepData, s.x, s.y, sl.source, null); createParticles(s.x, s.y, '#f9ca24', 10, 220);
        }
        for (let t of thrownItems) if (t.active && !t.isGrenade && Math.hypot(t.x - s.x, t.y - s.y) < s.r + 10 && !(t.hitProps && t.hitProps.has(s))) { (t.hitProps = t.hitProps || new Set()).add(s); s.hp -= 260 * arsMult(t.source); createParticles(s.x, s.y, '#f9ca24', 10, 220); }
    }
    for (let i = story.props.length - 1; i >= 0; i--) {
        let s = story.props[i];
        if (!s.breakable || s.hp > 0) continue;
        story.props.splice(i, 1);
        if (s.kind === 'chain') { railChainBroken(s); continue; }
        if (s.kind === 'wreck') {
            // Công trình bỏ hoang: phá để nhặt phế liệu
            let gain = s.scrap || 4; shopScrap += gain;
            createParticles(s.x, s.y, '#95a5a6', 36, 320); createParticles(s.x, s.y, '#f1c40f', 14, 220); addDecal(s.x, s.y, '#222', 48, 0.45); addScreenShake(6); Sound.play('pickup');
            vfxList.push({ type: 'text', text: `+${gain} ⚙ PHẾ LIỆU`, x: s.x, y: s.y - 40, life: 1.6, color: '#f1c40f' });
            if (Math.random() < 0.35) spawnDrop(s.x, s.y + 20);
            continue;
        }
        electricBurst(s.x, s.y, 220, 30, 0.5);
        createParticles(s.x, s.y, '#636e72', 50, 420); vfxList.push({ type: 'flash', x: s.x, y: s.y, r: 240, life: 0.4, max: 0.4, color: '160,200,255' });
        addDecal(s.x, s.y, '#111', 70, 0.5); addScreenShake(16); Sound.play('explode');
        vfxList.push({ type: 'text', text: `TRẠM ĐIỆN ${3 - story.props.filter(p => p.kind === 'station').length}/3 ĐÃ SẬP!`, x: s.x, y: s.y - 60, life: 2.0, color: '#f9ca24' });
        for (let k = 0; k < 2; k++) drops.push({ type: k ? 'BLINDBOX' : 'MEDKIT', x: s.x + (k ? 40 : -40), y: s.y + 50, radius: 16, lifeTime: 900 });
    }
}
// Vụ nổ làm hỏng trạm điện (móc trong explode)
function storyOnExplosion(x, y, radius, dmg) {
    for (let s of story.props) if (s.breakable && Math.hypot(s.x - x, s.y - y) < radius + s.r) s.hp -= dmg * 0.8;
    for (let op of outposts) if (!op.dead && Math.hypot(op.x + op.w / 2 - x, op.y + op.h / 2 - y) < radius + 80) outpostHurt(op, dmg * 0.8);
}

// Chiêu vùng của ZAP-1624: thương sét rơi, cú cắm thương kết liễu
function updateStoryHazards(dt) {
    for (let h of hazards) {
        if (h.done || h.timer > 0) continue;
        if (h.type === 'lancefall') {
            h.done = true; h.life = 0;
            hurtPlayersInRadius(h.x, h.y, h.radius, h.dmg || 34, { stun: 0.4 });
            vfxList.push({ type: 'bolt', x: h.x, y: h.y, life: 0.25, max: 0.25, seed: Math.random() * 1000 });
            createParticles(h.x, h.y, '#a29bfe', 22, 280); spawnRing(h.x, h.y, '#a29bfe', h.radius, 0.3); addScreenShake(7); Sound.play('lightning');
            if (zombies.filter(z => z.type === 38 && z.hp > 0).length < 8 && zombies.some(z => z.type === 36 && z.hp > 0)) zombies.push(new Zombie(h.x, h.y, 38));
        } else if (h.type === 'plunge') {
            h.done = true; h.life = 0;
            let z = zombies.find(e => e.type === 36 && e.hp > 0);
            hurtPlayersInRadius(h.x, h.y, h.radius, h.dmg || 75, { stun: 0.8 });
            if (tank.active && tank.p2InvulnTimer <= 0 && Math.hypot(tank.x - h.x, tank.y - h.y) < h.radius + tank.radius) tank.hp -= 60;
            vfxList.push({ type: 'bolt', x: h.x, y: h.y, life: 0.45, max: 0.45, seed: 3 }); vfxList.push({ type: 'flash', x: h.x, y: h.y, r: h.radius, life: 0.4, max: 0.4, color: '170,190,255' });
            spawnRing(h.x, h.y, '#f9ca24', h.radius * 1.2, 0.5, 10); addScreenShake(22); Sound.play('thunder'); Sound.play('explode');
            // Cắm thương: mọi Thương Sét trước đó vỡ tung thành nguồn điện lớn
            for (let l of zombies) if (l.type === 38 && l.hp > 0 && !l.big) { electricBurst(l.x, l.y, 190, 32, 0.5); l.hp = 0; l._credited = true; l.noLoot = true; }
            if (z) { z.x = h.x; z.y = h.y; z.hidden = false; z.invuln = false; z.storm = null; z.grounded = 3.5; z._hpPrev = z.hp; bossSay(z, 'THƯƠNG ĐÃ CẮM — ĐÁNH NGAY!', '#f1c40f'); }
        }
    }
}

// ---------------------------------------------------------------------------
// SỰ KIỆN: hạ quái (móc trong recordMissionKill) & dựng nhiệm vụ sau khi tạo map
// ---------------------------------------------------------------------------
function storyOnKill(type) {
    if (type === 31 && story.bolt === 0 && currentMapType === 6 && !NET_GUEST()) {
        // Ngừng sinh quái, Tiến sĩ bước ra từ góc Nhà Máy
        story.noSpawn = true;
        for (let z of zombies) if (!isBossType(z.type)) { z.hp = 0; z._credited = true; z.noLoot = true; vfxList.push({ type: 'laser_beam', x: z.x, y: z.y - 200, tx: z.x, ty: z.y, life: 0.2, jag: true }); }
        let lp = pickAlivePlayer(), A = story.arena || { x: lp.x, y: lp.y };
        let sp = findSafePoint(A.x - 520, A.y - 420, 16);
        let npc = new StoryNPC(sp.x, sp.y, 'aegis');
        rescueNPCs.push(npc);
        story.scene = { kind: 'aegis', npc, t: 0, talked: false };
    }
}
function NET_GUEST() { return NET.mode === 'guest'; }

function storyFarPoints(n, minFromCenter, minApart) {
    let pts = [], cx = MAP_SIZE.w / 2, cy = MAP_SIZE.h / 2;
    for (let tries = 0; tries < 400 && pts.length < n; tries++) {
        let p = caveRandomOpenPoint();
        if (p.x < 320 || p.y < 320 || p.x > MAP_SIZE.w - 320 || p.y > MAP_SIZE.h - 320) continue;
        if (Math.hypot(p.x - cx, p.y - cy) < minFromCenter || isBlockedPoint(p.x, p.y, 60)) continue;
        if (pts.some(q => Math.hypot(q.x - p.x, q.y - p.y) < minApart)) continue;
        pts.push(p);
    }
    while (pts.length < n) { let a = pts.length / n * Math.PI * 2 + 0.6; pts.push(findSafePoint(cx + Math.cos(a) * 1200, cy + Math.sin(a) * 1200, 50)); }
    return pts;
}
// Gọi ở cuối generateMap
function storyAfterGenerate(level) {
    if (mission.type === 'STORM_STATIONS') {
        mission.required = 3; mission.progress = 0;
        for (let p of storyFarPoints(3, 950, 1000)) story.props.push({ kind: 'station', breakable: true, x: p.x, y: p.y, r: 46, hp: 1500 + level * 260, maxHp: 1500 + level * 260, cd: 2 + Math.random() * 2 });
        queueRadio('Tiến sĩ Aegis: Phá hủy 3 Trạm Điện Cao Áp để cắt nguồn nạp năng lượng của Sinh thể đột biến!', null, 6);
    } else if (mission.type === 'ZAP_HOLD') {
        mission.required = 40; mission.progress = 0;
        let cx = MAP_SIZE.w / 2, cy = MAP_SIZE.h / 2;
        obstacles = obstacles.filter(o => Math.hypot(o.x + o.w / 2 - cx, o.y + o.h / 2 - cy) > 330 + Math.max(o.w, o.h) / 2);
        powerCoils = powerCoils.filter(c => Math.hypot(c.x - cx, c.y - cy) > 420);
        story.props.push({ kind: 'core', x: cx, y: cy - 70, r: 54, hp: 0, maxHp: 40, on: false });
        NAV.dirty = true;
        queueRadio('Tiến sĩ Aegis: Nó đang bị thương và chạy về Trạm Phát Điện Trung Tâm để sạc! Kích hoạt Lõi Máy Phát để dụ cỗ máy hủy diệt thực sự xuất hiện!', null, 7);
    } else if (currentMapType === 15) labAfterGenerate(level);
    else if (currentMapType === 16) baseAfterGenerate(level);
    else if (mission.type === 'LAST_STAND') lastStandSetup(level);
    // Công trình bỏ hoang rải trên map: phá để nhận phế liệu (không có trong hang / hầm mỏ / Lab)
    if (!isCaveMap() && currentMapType !== 15 && currentMapType !== 16) {
        const KINDS = ['XE HỎNG', 'KHO PHẾ LIỆU', 'MÁY PHÁT CŨ', 'CONTAINER'];
        for (let p of storyFarPoints(6 + Math.floor(Math.random() * 3), 380, 520)) {
            let v = Math.floor(Math.random() * KINDS.length), big = v === 1 || v === 3;
            story.props.push({ kind: 'wreck', breakable: true, x: p.x, y: p.y, r: big ? 40 : 32, v, name: KINDS[v], hp: (big ? 520 : 320) + level * 70, maxHp: (big ? 520 : 320) + level * 70, scrap: (big ? 6 : 4) + Math.floor(level / 4) });
        }
    }
}

// ---------------------------------------------------------------------------
// QUÁI CỦA CHƯƠNG: 35 Tàn Vết Chớp, 36 ZAP-1624, 37 The Hucker (13-labz.js), 38 Thương Sét
// ---------------------------------------------------------------------------
function updateStoryZombie(z, target, dist, ang, dt, speed) {
    if (z.type === 38) return updateLance(z, dt);
    if (z.type === 35) return updateRemnant(z, target, dist, ang, dt, speed);
    if (z.type === 36) return updateZap(z, target, dist, ang, dt);
    if (z.type === 37) return updateHucker(z, target, dist, ang, dt, speed);
    return false;
}

// Thương Sét: đứng yên, mỗi giây phóng điện làm choáng người chơi ở gần — phải phá hủy
function updateLance(z, dt) {
    z.kbX = z.kbY = 0;
    z.zapT = (z.zapT === undefined ? 1.2 : z.zapT) - dt;
    if (z.zapT <= 0) {
        z.zapT = 1.0;
        if (!tank.active) for (let p of players) {
            if (p.isDowned || Math.hypot(p.x - z.x, p.y - z.y) > 300) continue;
            p.takeDamage(7); stunPlayer(p, 0.35);
            vfxList.push({ type: 'laser_beam', x: z.x, y: z.y - 20, tx: p.x, ty: p.y, life: 0.18, jag: true });
        }
        spawnRing(z.x, z.y, '#a29bfe', 300, 0.3, 2);
    }
    return true;
}

function remnantDash(z, target, windup) {
    let a = Math.atan2(target.y - z.y, target.x - z.x), len = Math.min(700, Math.hypot(target.x - z.x, target.y - z.y) + 230);
    z.dashAng = a; z.dashSpd = len / 0.24; z.warnBeamTimer = windup;
    z.targetX = z.x + Math.cos(a) * len; z.targetY = z.y + Math.sin(a) * len;
}
function remnantFork(z, a, n) {
    for (let k = 0; k < n; k++) { let aa = a + (k - (n - 1) / 2) * 0.38; enemyBullets.push(new EnemyBullet(z.x, z.y, z.x + Math.cos(aa) * 100, z.y + Math.sin(aa) * 100, 'electric')); }
    Sound.play('plasma');
}
// TÀN VẾT CHỚP: lướt cực nhanh, tia điện phân nhánh 3 hướng, để lại vũng điện từ dưới chân
function updateRemnant(z, target, dist, ang, dt, speed) {
    z.kbX = z.kbY = 0;
    if (!z.phase2Done && z.hp < z.maxHp * 0.5) {
        z.phase2Done = true; z.color = '#6c5ce7'; z.spCD = 1.2;
        hazards.push({ type: 'emp', x: z.x, y: z.y, radius: 400, timer: 1.1, life: 1.3, dmg: 24 });
        bossSay(z, 'ĐIỆN CỰC TÍM!', '#a29bfe'); Sound.play('roar'); addScreenShake(14);
    }
    z.trailT = (z.trailT || 0) - dt;
    if (z.trailT <= 0) { z.trailT = z.phase2Done ? 0.8 : 1.2; hazards.push({ type: 'electric', x: z.x, y: z.y, radius: 62, life: 3.2, dmg: 16, stun: 0.25 }); }
    if (Math.random() < dt * 22) createParticles(z.x + (Math.random() - 0.5) * 40, z.y + (Math.random() - 0.5) * 40, '#2d3436', 1, 70);

    if (z.dashT > 0) {
        z.dashT -= dt;
        z.x += Math.cos(z.dashAng) * z.dashSpd * dt; z.y += Math.sin(z.dashAng) * z.dashSpd * dt; resolveCollision(z); storyArenaClamp(z);
        createParticles(z.x, z.y, '#a29bfe', 3, 120);
        if (!z.dashHit) {
            if (tank.active) { if (tank.p2InvulnTimer <= 0 && Math.hypot(tank.x - z.x, tank.y - z.y) < z.radius + tank.radius + 10) { tank.hp -= 55; z.dashHit = true; } }
            else for (let p of players) if (!p.isDowned && Math.hypot(p.x - z.x, p.y - z.y) < z.radius + p.radius + 14) { p.takeDamage(45); stunPlayer(p, 0.5); z.dashHit = true; }
        }
        if (z.dashT <= 0) { if (z.dashLeft > 0) { z.dashLeft--; remnantDash(z, target, 0.38); } else z.atkCD = 0.5; }
        return true;
    }
    if (z.warnBeamTimer > 0) {
        z.warnBeamTimer -= dt;
        if (z.warnBeamTimer <= 0) { z.dashT = 0.24; z.dashHit = false; Sound.play('saber'); vfxList.push({ type: 'laser_beam', x: z.x, y: z.y, tx: z.targetX, ty: z.targetY, life: 0.25, jag: true }); }
        return true;
    }
    if (z.forkT > 0) { z.forkT -= dt; if (z.forkT <= 0) remnantFork(z, ang + 0.19, 3); }

    if (z.spCD <= 0) {
        let opts = ['dash', 'dash', 'fork', 'fork', 'strikes', 'pools'];
        if (z.phase2Done) opts.push('cage', 'dash');
        let skill = pickBossSkill(z, opts);
        if (skill === 'dash') { remnantDash(z, target, 0.6); z.dashLeft = z.phase2Done ? 1 : 0; bossSay(z, 'LƯỚT CHỚP!', '#a29bfe'); }
        else if (skill === 'fork') { remnantFork(z, ang, z.phase2Done ? 5 : 3); z.forkT = 0.4; bossSay(z, 'TIA ĐIỆN PHÂN NHÁNH!', '#a29bfe'); }
        else if (skill === 'strikes') { for (let k = 0; k < 6; k++) hazards.push({ type: 'strike', x: target.x + (Math.random() - 0.5) * 120, y: target.y + (Math.random() - 0.5) * 120, radius: 88, timer: 0.55 + k * 0.26, life: 2.4, dmg: 38 }); bossSay(z, 'CHUỖI SÉT!', '#a29bfe'); }
        else if (skill === 'pools') { for (let k = 0; k < 5; k++) { let a = k / 5 * Math.PI * 2 + Math.random(); hazards.push({ type: 'electric', x: target.x + Math.cos(a) * 190, y: target.y + Math.sin(a) * 190, radius: 78, life: 3.5, dmg: 18, stun: 0.3 }); } bossSay(z, 'VŨNG ĐIỆN TỪ!', '#a29bfe'); }
        else { let pts = []; for (let i = 0; i < 4; i++) pts.push({ x: target.x + Math.cos(i * Math.PI / 2 + 0.78) * 170, y: target.y + Math.sin(i * Math.PI / 2 + 0.78) * 170 }); hazards.push({ type: 'cage', points: pts, timer: 0.8, life: 3.5, dmg: 14 }); bossSay(z, 'LỒNG ĐIỆN!', '#a29bfe'); }
        z.spCD = z.phase2Done ? 1.7 : 2.5;
    }
    let a = dist < 180 ? ang + 1.35 : ang, spd = speed * (z.phase2Done ? 1.25 : 1);
    z.x += Math.cos(a) * spd * dt; z.y += Math.sin(a) * spd * dt; resolveCollision(z); storyArenaClamp(z);
    if (z.atkCD <= 0 && !tank.active) for (let p of players) if (!p.isDowned && Math.hypot(z.x - p.x, z.y - p.y) < z.radius + p.radius + 8) { p.takeDamage(30); stunPlayer(p, 0.3); z.atkCD = 0.9; }
    return true;
}

// Chọn một điểm quanh mục tiêu (trong đấu trường) để ZAP dịch chuyển tới
function zapSpot(z, target, rMin, rMax) {
    let A = story.arena;
    for (let t = 0; t < 8; t++) {
        let a = Math.random() * Math.PI * 2, r = rMin + Math.random() * (rMax - rMin);
        let x = target.x + Math.cos(a) * r, y = target.y + Math.sin(a) * r;
        if (A && Math.hypot(x - A.x, y - A.y) > A.r - 100) continue;
        if (!isBlockedPoint(x, y, z.radius)) return { x, y };
    }
    return A ? { x: A.x, y: A.y } : findSafePoint(target.x, target.y, z.radius);
}
function zapBlink(z, pt) {
    createParticles(z.x, z.y, '#74b9ff', 26, 320);
    vfxList.push({ type: 'laser_beam', x: z.x, y: z.y, tx: pt.x, ty: pt.y, life: 0.2, jag: true });
    z.x = pt.x; z.y = pt.y;
    createParticles(z.x, z.y, '#f9ca24', 26, 320); spawnRing(z.x, z.y, '#74b9ff', 110, 0.25, 4);
}
// ZAP-1624 "KÌNH LÔI": không lao vào, liên tục dịch chuyển quanh người chơi và phóng điện;
// thỉnh thoảng lao xuyên qua như một tia chớp (có vạch báo); gọi Thương Sét; tuyệt kỹ Bão Sấm Chớp.
// Giáp thép tích điện: đạn thường bị lệch hướng — chỉ Cận chiến / Roi điện / Nổ / Pháo tank phá được giáp.
function updateZap(z, target, dist, ang, dt) {
    z.kbX = z.kbY = 0;
    if (!z.phase2Done && z.hp < z.maxHp * 0.5) { z.phase2Done = true; z.spCD = 1.0; bossSay(z, 'QUÁ TẢI TRIỆU VOLT!', '#f9ca24'); Sound.play('roar'); addScreenShake(16); }
    // Sóng bảo vệ: chỉ nhận sát thương khi Máy Phá Sóng đang chạy; pha cuối thì bất tử cho tới khi 3 Thương Điện bị phá
    let zx = story.zx, finalPhase = !!(zx && zx.final > 0);
    z.invuln = !!z.storm || (!!zx && (zx.jam <= 0 || finalPhase));
    if (finalPhase) { z.spCD = 2; z.stormCD = Math.max(z.stormCD || 0, 5); }

    // --- Tuyệt kỹ BÃO SẤM CHỚP: biến mất, trời chớp liên tục, thương rơi vào chỗ người chơi, cuối cùng nó cắm thương xuống ---
    if (z.storm) {
        let st = z.storm; st.t -= dt;
        if (Math.random() < dt * 7) { flashAlpha = Math.max(flashAlpha, 0.22); vfxList.push({ type: 'bolt', x: target.x + (Math.random() - 0.5) * 1000, y: target.y + (Math.random() - 0.5) * 800, life: 0.2, max: 0.2, seed: Math.random() * 1000 }); }
        if (st.n > 0 && st.t <= 0) {
            st.n--; st.t = 0.55;
            hazards.push({ type: 'lancefall', x: target.x + (Math.random() - 0.5) * 50, y: target.y + (Math.random() - 0.5) * 50, radius: 96, timer: 0.85, life: 1.05, dmg: 34 });
            if (st.n === 0) st.t = 1.3;
        } else if (st.n === 0 && st.t <= 0 && !st.plunge) {
            st.plunge = true;
            hazards.push({ type: 'plunge', x: target.x, y: target.y, radius: 290, timer: 1.4, life: 1.6, dmg: 75 });
            for (let p of players) vfxList.push({ type: 'text', text: 'NÓ SẮP CẮM THƯƠNG XUỐNG — CHẠY RA KHỎI VÒNG!', x: p.x, y: p.y - 90, life: 1.5, color: '#f9ca24' });
        }
        return true;   // (kết thúc trong updateStoryHazards khi cú 'plunge' chạm đất)
    }
    z.downed = z.armor <= 0 || z.grounded > 0;
    if (z.grounded > 0) { z.grounded -= dt; if (Math.random() < dt * 20) createParticles(z.x, z.y, '#f1c40f', 1, 90); return true; }
    if (z.armor <= 0) {
        z.breakT -= dt;
        if (z.breakT <= 0) { z.armor = z.maxArmor * 0.7; spawnRing(z.x, z.y, '#74b9ff', 200, 0.5, 8); bossSay(z, 'TÁI TẠO GIÁP!', '#74b9ff'); Sound.play('charge_up'); }
    }

    // --- Lao xuyên như tia chớp ---
    if (z.warnBeamTimer > 0) {
        z.warnBeamTimer -= dt;
        if (z.warnBeamTimer <= 0) {
            let sx = z.x, sy = z.y, ex = z.targetX, ey = z.targetY, len = Math.hypot(ex - sx, ey - sy);
            if (tank.active) { if (tank.p2InvulnTimer <= 0 && distancePointToSegment(tank.x, tank.y, sx, sy, ex, ey) < tank.radius + 40) tank.hp -= 70; }
            else for (let p of players) if (!p.isDowned && distancePointToSegment(p.x, p.y, sx, sy, ex, ey) < p.radius + 44) { p.takeDamage(55); stunPlayer(p, 0.6); }
            for (let d = 60; d < len; d += 130) hazards.push({ type: 'electric', x: sx + (ex - sx) * d / len, y: sy + (ey - sy) * d / len, radius: 56, life: 2.4, dmg: 16, stun: 0.25 });
            vfxList.push({ type: 'laser_beam', x: sx, y: sy, tx: ex, ty: ey, life: 0.35, jag: true });
            vfxList.push({ type: 'flash', x: (sx + ex) / 2, y: (sy + ey) / 2, r: 200, life: 0.25, max: 0.25, color: '170,200,255' });
            let sp = findSafePoint(ex, ey, z.radius); z.x = sp.x; z.y = sp.y; storyArenaClamp(z);
            addScreenShake(12); Sound.play('lightning'); z.blinkT = 0.7;
        }
        return true;
    }

    // --- Dịch chuyển vòng quanh + phóng điện ---
    z.blinkT = (z.blinkT === undefined ? 1.0 : z.blinkT) - dt;
    if (z.blinkT <= 0) {
        z.blinkT = (z.phase2Done ? 0.75 : 1.1) + Math.random() * 0.4;
        zapBlink(z, zapSpot(z, target, 360, 520));
        if (Math.random() < 0.6) { enemyBullets.push(new EnemyBullet(z.x, z.y, target.x, target.y, 'electric')); if (z.phase2Done) remnantFork(z, Math.atan2(target.y - z.y, target.x - z.x), 3); }
        else hazards.push({ type: 'strike', x: target.x, y: target.y, radius: 84, timer: 0.7, life: 1.0, dmg: 34, stun: 0.5 });
    }

    if (z.spCD <= 0) {
        let lances = zombies.filter(e => e.type === 38 && e.hp > 0).length;
        let opts = ['dash', 'dash', 'rain'];
        if (lances < 4) opts.push('lances', 'lances');
        z.stormCD = (z.stormCD === undefined ? 14 : z.stormCD);
        let skill = (z.stormCD <= 0 && z.hp < z.maxHp * 0.8) ? 'storm' : pickBossSkill(z, opts);
        if (skill === 'dash') {
            let a = Math.atan2(target.y - z.y, target.x - z.x), len = Math.hypot(target.x - z.x, target.y - z.y) + 330;
            z.targetX = z.x + Math.cos(a) * len; z.targetY = z.y + Math.sin(a) * len; z.warnBeamTimer = z.phase2Done ? 0.6 : 0.8;
            bossSay(z, 'TIA CHỚP XUYÊN!', '#f9ca24'); Sound.play('charge_up');
        } else if (skill === 'rain') {
            // Mưa Sét Định Hướng: sấm sét bổ liên tục vào vị trí người chơi
            for (let k = 0; k < (z.phase2Done ? 9 : 7); k++) hazards.push({ type: 'strike', x: target.x + (Math.random() - 0.5) * 90, y: target.y + (Math.random() - 0.5) * 90, radius: 86, timer: 0.5 + k * 0.3, life: 3.4, dmg: 40, stun: 0.5 });
            bossSay(z, 'MƯA SÉT ĐỊNH HƯỚNG!', '#f9ca24');
        } else if (skill === 'lances') {
            for (let k = 0; k < 3; k++) { let a = k * 2.1 + Math.random(), r = 150 + Math.random() * 110; hazards.push({ type: 'lancefall', x: target.x + Math.cos(a) * r, y: target.y + Math.sin(a) * r, radius: 90, timer: 0.9 + k * 0.15, life: 1.3, dmg: 30 }); }
            bossSay(z, 'THƯƠNG SẤM CHỚP — PHÁ CHÚNG ĐI!', '#a29bfe');
        } else {
            z.storm = { t: 0.9, n: z.phase2Done ? 8 : 6 }; z.stormCD = 26; z.hidden = true; z.invuln = true;
            createParticles(z.x, z.y, '#f9ca24', 60, 480); spawnRing(z.x, z.y, '#f9ca24', 260, 0.5, 8);
            for (let p of players) vfxList.push({ type: 'text', text: 'BÃO SẤM CHỚP!', x: p.x, y: p.y - 96, life: 2.0, color: '#f9ca24' });
            Sound.play('thunder'); addScreenShake(14);
        }
        z.spCD = z.phase2Done ? 2.4 : 3.3;
    }
    if (z.stormCD > 0) z.stormCD -= dt;
    return true;
}
// Giáp của ZAP: sát thương vào máu chuyển sang giáp khi giáp còn; đang biến mất thì bất tử. (móc trong vòng lặp game & zombieDown)
function zapDamageFilter(z) {
    if (z._hpPrev === undefined) z._hpPrev = z.hp;
    if (z.hp < z._hpPrev) {
        let d = z._hpPrev - z.hp;
        if (z.type === 38) { if (z.big && !(story.zx && story.zx.spear > 0)) z.hp = z._hpPrev - d * 0.15; }   // Thương Điện bọc giáp: nhặt PIN mới phá được giáp
        else if (z.invuln) z.hp = z._hpPrev;
        else if (z.type === 36 && z.armor > 0) {
            z.armor -= d * (z.grounded > 0 ? 2 : 1); z.hp = z._hpPrev; z.hitFlash = 0.06;
            if (z.armor <= 0) {
                z.armor = 0; z.breakT = 12; z.grounded = 4; z.warnBeamTimer = 0;
                createParticles(z.x, z.y, '#b2bec3', 70, 520); spawnRing(z.x, z.y, '#f1c40f', 300, 0.6, 10); addScreenShake(20); Sound.play('explode');
                for (let p of players) vfxList.push({ type: 'text', text: 'GIÁP VỠ! DỒN HỎA LỰC — ĐẠN ĐÃ CÓ TÁC DỤNG!', x: p.x, y: p.y - 96, life: 2.4, color: '#f1c40f' });
            }
        }
    }
    // Còn 1 máu: chưa chết được — chuyển sang pha cuối
    if (z.type === 36 && z.hp <= 1 && !z.finalDone) { z.hp = 1; zapStartFinal(z); }
    z._hpPrev = z.hp;
}
// Trường Điện Từ Siêu Cấp: đạn thường chạm ZAP còn giáp sẽ bị bẻ lệch hướng. true = viên đạn KHÔNG trúng.
function storyDeflect(b, z) {
    if (z.invuln) return true;
    if (z.type !== 36 || !(z.armor > 0)) return false;
    if (b.isTankShell || b.isExplosiveProj || b.isBomb || b.isSwordWave) return false;
    b.hitSet.add(z);
    let turn = (Math.random() < 0.5 ? 1 : -1) * (0.9 + Math.random() * 0.6), sp = Math.hypot(b.vx, b.vy);
    b.angle += turn; b.vx = Math.cos(b.angle) * sp; b.vy = Math.sin(b.angle) * sp;
    if (Math.random() < 0.3) createParticles(b.x, b.y, '#74b9ff', 3, 160);
    if (!(z.deflTextCD > Date.now())) { z.deflTextCD = Date.now() + 1400; vfxList.push({ type: 'text', text: 'ĐẠN BỊ LỆCH! Dùng CẬN CHIẾN / NỔ để phá giáp', x: z.x, y: z.y - z.radius - 58, life: 1.3, color: '#74b9ff' }); }
    return true;
}

function storyZombieDeath(z) {
    createParticles(z.x, z.y, z.color, 14, 220);
    if (z.type === 38) { createParticles(z.x, z.y, '#a29bfe', 20, 260); return; }
    if (z.type === 37) { huckerDeath(z); return; }
    hazards = hazards.filter(h => h.type !== 'lancefall' && h.type !== 'plunge' && !((h.type === 'electric' || h.type === 'cage' || h.type === 'strike' || h.type === 'emp') && !h.friendly));
    for (let l of zombies) if (l.type === 38) { l.big = false; l.hp = 0; l._credited = true; l.noLoot = true; }
    missionItems = []; story.zx = null;
    if (z.type === 35) {
        story.bolt = 3; story.purple = 0;
        shopScrap += 40;
        drops.push({ type: 'SHARD', x: z.x, y: z.y - 50, radius: 16, lifeTime: 900 });
        queueRadio('Tiến sĩ Aegis: Nó đang bị thương và chạy ngược về Trạm Phát Điện Trung Tâm để sạc lại năng lượng! Quay lại Nhà Máy Điện ngay!', null, 8);
        mission.complete = false; completeMission();
    } else if (z.type === 36) {
        story.bolt = 5; shopScrap += 120;
        zapSlain = true; try { localStorage.setItem('zs_zap_slain', '1'); } catch (e) { }
        for (let p of players) { p.level++; p.pendingUpgrades++; vfxList.push({ type: 'text', text: 'ĐÃ HẠ ZAP-1624!  +120 ⚙  +2 ◆  +1 CẤP', x: p.x, y: p.y - 96, life: 3.5, color: '#f1c40f' }); }
        for (let k = 0; k < 2; k++) drops.push({ type: 'SHARD', x: z.x + (k ? 50 : -50), y: z.y - 50, radius: 16, lifeTime: 900 });
        currentWeather = 1;
        mission.complete = false; completeMission();
        startDialog([
            say(RADIO, 'Tín hiệu của ZAP-1624 đã tắt hẳn... Cậu làm được rồi! Cả vùng này sẽ không còn một cơn bão sét nhân tạo nào nữa.'),
            say(HERO, 'Còn lời hứa của ông thì sao, Tiến sĩ?'),
            say(RADIO, 'Suất ở Khu Sinh Tồn Cao Cấp Safe-Zone Alpha đã đứng tên gia đình cậu. Lên sân thượng đi — trực thăng đang chờ.')
        ]);
    }
}

// ---------------------------------------------------------------------------
// NPC CỦA CỐT TRUYỆN (nằm trong rescueNPCs để quái tấn công được và đồng bộ sang khách)
// ---------------------------------------------------------------------------
class StoryNPC {
    constructor(x, y, kind) {
        this.x = x; this.y = y; this.kind = kind; this.radius = 13; this.isStory = true; this.rescued = true; this.rescueProgress = 0;
        this.maxHp = this.hp = kind === 'soldier' ? 340 + currentLevel * 45 : 9999;
        this.facingX = 0; this.facingY = -1; this.atkCD = 0.5; this.state = 'move'; this.hurt = 0;
    }
    takeDamage(dmg) {
        if (this.kind === 'aegis' || this.hp <= 0) return;
        this.hp -= dmg; this.hurt = 0.25;
        if (this.hp <= 0) { createParticles(this.x, this.y, '#c0392b', 20, 180); addDecal(this.x, this.y, '#7b1a12', 24, 0.5); Sound.play('down'); }
    }
    update(dt) {
        if (this.hp <= 0) return;
        if (this.hurt > 0) this.hurt -= dt;
        if (this.kind === 'soldier') labSoldierUpdate(this, dt);
    }
    draw(ctx) {
        if (this.kind === 'house') { drawBaseHouse(this); return; }
        if (this.hp <= 0) return;
        drawShadow(this.x, this.y, this.radius);
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        if (this.kind === 'aegis') {
            ctx.fillStyle = '#f5f6fa'; ctx.fill(); ctx.strokeStyle = '#2f3640'; ctx.lineWidth = 2; ctx.stroke();
            ctx.beginPath(); ctx.arc(this.x, this.y - 2, 7, 0, Math.PI * 2); ctx.fillStyle = '#f8c291'; ctx.fill();
            ctx.fillStyle = '#dfe6e9'; ctx.beginPath(); ctx.arc(this.x, this.y - 6, 7, Math.PI, 0); ctx.fill();          // tóc bạc
            ctx.strokeStyle = '#2f3640'; ctx.lineWidth = 1.5; ctx.strokeRect(this.x - 6, this.y - 4, 5, 4); ctx.strokeRect(this.x + 1, this.y - 4, 5, 4);
            outlinedText('TIẾN SĨ AEGIS', this.x, this.y - 28, '#dff9fb', 'bold 11px Arial');
        } else {
            ctx.fillStyle = this.hurt > 0 ? '#ffb3b3' : '#4b6b3a'; ctx.fill(); ctx.strokeStyle = '#1e2d16'; ctx.lineWidth = 2; ctx.stroke();
            ctx.beginPath(); ctx.arc(this.x, this.y - 3, 8, Math.PI, 0); ctx.fillStyle = '#2d4222'; ctx.fill();          // mũ sắt
            ctx.fillStyle = '#f1c40f'; ctx.fillRect(this.x - 5, this.y + 3, 10, 7); ctx.fillStyle = '#c0392b'; ctx.fillRect(this.x - 1, this.y + 5, 2, 3); // khối C4
            drawMiniBar(this.x, this.y - 30, 44, 5, this.hp, this.maxHp, '#2ecc71');
            outlinedText('BINH SĨ C4', this.x, this.y - 40, '#badc58', 'bold 11px Arial');
            if (this.state === 'plant' && story.lab) drawMiniBar(this.x, this.y + 22, 54, 6, story.lab.plant, 1, '#f1c40f');
            else if (this.state === 'wait') outlinedText('ĐỢI HỘ TỐNG...', this.x, this.y + 26, '#f1c40f', 'bold 10px Arial');
        }
    }
}
class Scientist extends RescueNPC {
    constructor(x, y) { super(x, y); this.isStory = true; this.kind = 'scientist'; this.hp = this.maxHp = 170 + currentLevel * 30; }
    draw(ctx) {
        super.draw(ctx);
        if (this.hp <= 0) return;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius - 3, 0.2, Math.PI - 0.2); ctx.fillStyle = '#f5f6fa'; ctx.fill();   // áo blouse
        outlinedText('NHÀ KHOA HỌC', this.x, this.y - 33, '#dff9fb', 'bold 9px Arial', 2);
    }
}

// ---------------------------------------------------------------------------
// CỬA HÀNG: tuyến bị khoá theo cốt truyện
// ---------------------------------------------------------------------------
function storyShopBanner() {
    let el = document.getElementById('storyBanner'); if (!el) return;
    let f = storyForcedRoute();
    el.style.display = f ? 'block' : 'none';
    if (f === 'forest') el.innerHTML = '⚡ <b>CỐT TRUYỆN — CHỚP VÀ SÉT:</b> điểm đến kế tiếp bị khoá: <b>RỪNG SÉT</b>. Phá 3 Trạm Điện Cao Áp rồi hạ <b>TÀN VẾT CHỚP</b>. Hãy mua tiếp tế trước khi đi!';
    else if (f === 'final') el.innerHTML = '⚡ <b>CỐT TRUYỆN — TRẬN TỐI THƯỢNG:</b> quay lại <b>NHÀ MÁY ĐIỆN</b>, giữ Lõi Máy Phát để dụ <b>ZAP-1624 "KÌNH LÔI"</b>. Đạn thường bị lệch hướng — mang CẬN CHIẾN / vũ khí NỔ / Bộ Đàm gọi xe tăng!';
}
// Gọi trong continueAfterShop: áp tuyến cốt truyện. Trả về true nếu đã áp.
function storyApplyRoute() {
    let f = storyForcedRoute(); if (!f) return false;
    nextMissionPreference = null; nextRoute = 'balanced';
    if (f === 'forest') { story.bolt = 2; nextMapPreference = 9; }
    else { story.bolt = 4; nextMapPreference = 6; powerPlantRun = { active: false, floor: 0, total: 3 }; }
    return true;
}

// ---------------------------------------------------------------------------
// VẼ
// ---------------------------------------------------------------------------
function drawStoryEntity(z, T, ang, flash) {
    const r = z.radius;
    if (z.type === 38) {
        if (z.big || r > 20) { let br = story.zx && story.zx.spear > 0; ctx.beginPath(); ctx.arc(z.x, z.y - 20, 46, 0, Math.PI * 2); ctx.strokeStyle = br ? 'rgba(241, 196, 15, 0.9)' : 'rgba(116, 185, 255, 0.9)'; ctx.lineWidth = 4; ctx.setLineDash(br ? [6, 8] : []); ctx.stroke(); ctx.setLineDash([]); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; outlinedText(br ? 'GIÁP VỠ!' : 'THƯƠNG ĐIỆN (bọc giáp)', z.x, z.y + 22, br ? '#f1c40f' : '#74b9ff', 'bold 10px Arial'); }
        // Thương Sét cắm xuống đất
        ctx.beginPath(); ctx.arc(z.x, z.y, 300, 0, Math.PI * 2); ctx.strokeStyle = `rgba(162, 155, 254, ${0.12 + 0.08 * Math.sin(T * 6 + z.nid)})`; ctx.lineWidth = 2; ctx.setLineDash([5, 12]); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.ellipse(z.x, z.y + 4, 16, 7, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(20,20,40,0.6)'; ctx.fill();
        ctx.strokeStyle = flash ? '#fff' : '#636e72'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(z.x, z.y + 4); ctx.lineTo(z.x + 6, z.y - 52); ctx.stroke();
        ctx.fillStyle = flash ? '#fff' : '#a29bfe'; ctx.beginPath(); ctx.moveTo(z.x + 6, z.y - 76); ctx.lineTo(z.x + 15, z.y - 50); ctx.lineTo(z.x - 3, z.y - 50); ctx.closePath(); ctx.fill();
        ctx.shadowColor = '#a29bfe'; ctx.shadowBlur = 14; ctx.strokeStyle = `rgba(223, 230, 255, ${0.6 + 0.4 * Math.sin(T * 20 + z.nid)})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(z.x + 6, z.y - 70); ctx.lineTo(z.x - 6 + Math.sin(T * 30) * 5, z.y - 40); ctx.lineTo(z.x + 9, z.y - 26); ctx.lineTo(z.x - 2, z.y); ctx.stroke(); ctx.shadowBlur = 0; ctx.lineCap = 'butt';
        return;
    }
    if (z.type === 37) { drawHucker(z, T, ang, flash); return; }
    ctx.save(); ctx.translate(z.x, z.y); ctx.rotate(ang);
    if (z.type === 35) {
        // Khói đen + thân tím phóng điện
        for (let k = 0; k < 6; k++) { let a = k * 1.05 + T * 0.8, rr = r * (1.15 + 0.15 * Math.sin(T * 3 + k)); ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.45 - r * 0.3, Math.sin(a) * r * 0.45, rr * 0.55, 0, Math.PI * 2); ctx.fillStyle = 'rgba(15, 12, 24, 0.45)'; ctx.fill(); }
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fillStyle = flash ? '#fff' : (z.phase2Done ? '#4834d4' : '#5f3dc4'); ctx.fill(); ctx.strokeStyle = '#0c0a18'; ctx.lineWidth = 4; ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2); ctx.fillStyle = '#12101f'; ctx.fill();
        ctx.fillStyle = '#e0c3fc'; ctx.shadowColor = '#e056fd'; ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.ellipse(r * 0.45, -r * 0.24, r * 0.13, r * 0.07, 0.3, 0, Math.PI * 2); ctx.ellipse(r * 0.45, r * 0.24, r * 0.13, r * 0.07, -0.3, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = `rgba(224, 195, 252, ${0.7 + 0.3 * Math.sin(T * 25)})`; ctx.lineWidth = 2.5; ctx.beginPath();
        for (let k = 0; k < 5; k++) { let a = k * 1.256 + T * 2; ctx.moveTo(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6); ctx.lineTo(Math.cos(a + 0.25) * r * 1.05, Math.sin(a + 0.25) * r * 1.05); ctx.lineTo(Math.cos(a + 0.1) * r * (1.3 + 0.2 * Math.sin(T * 30 + k)), Math.sin(a + 0.1) * r * (1.3 + 0.2 * Math.sin(T * 30 + k))); }
        ctx.stroke(); ctx.shadowBlur = 0;
        // Hai tay vuốt
        ctx.fillStyle = flash ? '#fff' : '#2d1b69'; ctx.beginPath(); ctx.arc(r * 0.95, -r * 0.7, r * 0.24, 0, Math.PI * 2); ctx.arc(r * 0.95, r * 0.7, r * 0.24, 0, Math.PI * 2); ctx.fill();
    } else {
        // ZAP-1624: khối giáp thép, lõi triệu Volt, cây thương sét
        let armored = !z.downed;
        ctx.fillStyle = flash ? '#fff' : (armored ? '#57606f' : '#3d3d3d');
        ctx.beginPath(); for (let k = 0; k < 8; k++) { let a = k * Math.PI / 4 + 0.39; ctx.lineTo(Math.cos(a) * r * 1.08, Math.sin(a) * r * 1.08); } ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#1e272e'; ctx.lineWidth = 5; ctx.stroke();
        ctx.strokeStyle = armored ? '#a4b0be' : '#636e72'; ctx.lineWidth = 2; ctx.beginPath(); for (let k = 0; k < 8; k++) { let a = k * Math.PI / 4 + 0.39; ctx.moveTo(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5); ctx.lineTo(Math.cos(a) * r * 1.04, Math.sin(a) * r * 1.04); } ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2); ctx.fillStyle = armored ? '#f9ca24' : '#e17055'; ctx.shadowColor = armored ? '#f9ca24' : '#e17055'; ctx.shadowBlur = 22; ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, r * (0.2 + 0.06 * Math.sin(T * 12)), 0, Math.PI * 2); ctx.fill();
        // Vai giáp + thương
        ctx.fillStyle = flash ? '#fff' : '#2f3542'; ctx.fillRect(-r * 0.5, -r * 1.3, r * 0.9, r * 0.36); ctx.fillRect(-r * 0.5, r * 0.94, r * 0.9, r * 0.36);
        ctx.strokeStyle = '#636e72'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-r * 0.7, r * 1.12); ctx.lineTo(r * 1.9, r * 1.12); ctx.stroke();
        ctx.fillStyle = '#f9ca24'; ctx.beginPath(); ctx.moveTo(r * 2.4, r * 1.12); ctx.lineTo(r * 1.85, r * 0.92); ctx.lineTo(r * 1.85, r * 1.32); ctx.closePath(); ctx.fill(); ctx.lineCap = 'butt';
        if (armored) {
            ctx.strokeStyle = `rgba(116, 185, 255, ${0.5 + 0.4 * Math.sin(T * 18)})`; ctx.lineWidth = 2.5; ctx.beginPath();
            for (let k = 0; k < 6; k++) { let a = k * 1.047 + T * 3; ctx.moveTo(Math.cos(a) * r * 1.15, Math.sin(a) * r * 1.15); ctx.lineTo(Math.cos(a + 0.2) * r * 1.4, Math.sin(a + 0.2) * r * 1.4); ctx.lineTo(Math.cos(a + 0.05) * r * 1.6, Math.sin(a + 0.05) * r * 1.6); }
            ctx.stroke();
        }
    }
    ctx.restore();
    if (z.type === 36) {
        // Vòng Trường Điện Từ + thanh giáp
        if (story.zx && (story.zx.jam <= 0 || story.zx.final > 0)) { ctx.beginPath(); ctx.arc(z.x, z.y, r + 52 + Math.sin(T * 5) * 5, 0, Math.PI * 2); ctx.fillStyle = 'rgba(162, 155, 254, 0.14)'; ctx.fill(); ctx.strokeStyle = 'rgba(200, 190, 255, 0.9)'; ctx.lineWidth = 4; ctx.stroke(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; outlinedText('SÓNG BẢO VỆ — BẤT TỬ', z.x, z.y + r + 34, '#c8beff', 'bold 12px Arial'); }
        if (!z.downed) { ctx.beginPath(); ctx.arc(z.x, z.y, r + 34 + Math.sin(T * 6) * 4, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(116, 185, 255, 0.4)'; ctx.lineWidth = 3; ctx.setLineDash([10, 9]); ctx.stroke(); ctx.setLineDash([]); }
        let ap = NET.mode === 'guest' ? story.za / 100 : Math.max(0, (z.armor || 0) / (z.maxArmor || 1));
        drawMiniBar(z.x, z.y - r - 22, 80, 6, ap, 1, '#74b9ff');
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        if (z.downed) outlinedText('GIÁP VỠ!', z.x, z.y + r + 16, '#f1c40f', 'bold 13px Arial');
    }
}

function drawStoryProps(T, vis) {
    if (currentMapType === 15 && objState !== 'TRAIN') drawLabFloor(T);
    else if (currentMapType === 16) drawHub(T);
    for (let p of story.props) {
        if (!vis(p.x, p.y, 260)) continue;
        if (p.kind === 'wreck') { drawWreck(p, T); continue; }
        if (p.kind === 'chain') { drawRailChain(p, T); continue; }
        if (p.kind === 'holdpt') { drawHoldPoint(p, T); continue; }
        if (p.kind === 'station') {
            drawShadow(p.x, p.y + 10, p.r);
            ctx.fillStyle = '#2d3436'; ctx.fillRect(p.x - 34, p.y - 22, 68, 50); ctx.strokeStyle = '#111'; ctx.lineWidth = 3; ctx.strokeRect(p.x - 34, p.y - 22, 68, 50);
            ctx.fillStyle = '#636e72'; ctx.fillRect(p.x - 26, p.y - 62, 10, 42); ctx.fillRect(p.x + 16, p.y - 62, 10, 42);
            ctx.fillStyle = '#f9ca24'; ctx.beginPath(); ctx.arc(p.x - 21, p.y - 66, 8, 0, Math.PI * 2); ctx.arc(p.x + 21, p.y - 66, 8, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = `rgba(249, 202, 36, ${0.6 + 0.4 * Math.sin(T * 22 + p.x)})`; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(p.x - 21, p.y - 66);
            for (let k = 1; k < 6; k++) ctx.lineTo(p.x - 21 + k * 7, p.y - 66 + (Math.random() - 0.5) * 16);
            ctx.lineTo(p.x + 21, p.y - 66); ctx.stroke();
            ctx.fillStyle = '#f1c40f'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('⚡', p.x, p.y + 4);
            drawMiniBar(p.x, p.y + 36, 76, 7, p.hp, p.maxHp, '#f9ca24');
            outlinedText('TRẠM ĐIỆN CAO ÁP', p.x, p.y - 84, '#f9ca24', 'bold 11px Arial');
        } else if (p.kind === 'core') {
            ctx.beginPath(); ctx.arc(p.x, p.y, 240, 0, Math.PI * 2); ctx.fillStyle = p.on ? 'rgba(72, 219, 251, 0.16)' : 'rgba(72, 219, 251, 0.07)'; ctx.fill();
            ctx.strokeStyle = 'rgba(72, 219, 251, 0.75)'; ctx.lineWidth = 4; ctx.setLineDash([22, 14]); ctx.stroke(); ctx.setLineDash([]);
            if (!p.on && p.hp > 0) { ctx.beginPath(); ctx.arc(p.x, p.y, 240, -Math.PI / 2, -Math.PI / 2 + p.hp / p.maxHp * Math.PI * 2); ctx.strokeStyle = '#f1c40f'; ctx.lineWidth = 8; ctx.stroke(); }
            drawShadow(p.x, p.y + 12, p.r);
            ctx.fillStyle = '#34495e'; ctx.beginPath(); for (let k = 0; k < 6; k++) { let a = k * Math.PI / 3; ctx.lineTo(p.x + Math.cos(a) * p.r, p.y + Math.sin(a) * p.r); } ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#1e272e'; ctx.lineWidth = 4; ctx.stroke();
            ctx.beginPath(); ctx.arc(p.x, p.y, 26 + (p.on ? 5 * Math.sin(T * 10) : 0), 0, Math.PI * 2); ctx.fillStyle = p.on ? '#48dbfb' : `rgba(72, 219, 251, ${0.25 + 0.5 * p.hp / p.maxHp})`; ctx.shadowColor = '#48dbfb'; ctx.shadowBlur = p.on ? 30 : 10; ctx.fill(); ctx.shadowBlur = 0;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            outlinedText(p.on ? 'LÕI MÁY PHÁT: ĐÃ KÍCH HOẠT' : 'LÕI MÁY PHÁT — ĐỨNG TRONG VÒNG ĐỂ KÍCH HOẠT', p.x, p.y - p.r - 16, '#48dbfb', 'bold 12px Arial');
        } else drawLabProp(p, T);
    }
}

function storyObjectiveText() {
    switch (objState) {
        case 'HUB': return ['KHU SỐNG SÓT — vào 🛒 Quầy tiếp tế hoặc 🗺 Bàn chiến dịch', '#2ecc71'];
        case 'STORM_STATIONS': return [`PHÁ TRẠM ĐIỆN CAO ÁP: ${mission.progress}/3`, '#f9ca24'];
        case 'STORM_WAIT': return ['KHÔNG KHÍ ĐANG TÍCH ĐIỆN TÍM NGẮT...', '#a29bfe'];
        case 'STORM_BOSS': return ['HẠ GỤC TÀN VẾT CHỚP!', '#a29bfe'];
        case 'ZAP_HOLD': return [`KÍCH HOẠT LÕI MÁY PHÁT: ${Math.min(mission.required, mission.progress)}/${mission.required}s (đứng trong vòng)`, '#48dbfb'];
        case 'ZAP_WAIT': return ['TRÙM TỐI THƯỢNG ĐANG TỚI...', '#f9ca24'];
        case 'ZAP_BOSS': {
            let zx = story.zx; if (!zx) return ['HẠ ZAP-1624!', '#f9ca24'];
            if (zx.final > 0) return [`PHÁ 3 THƯƠNG ĐIỆN: còn ${zombies.filter(e => e.type === 38 && e.hp > 0 && (e.big || e.radius > 20)).length} — ${Math.ceil(zx.final)}s · nhặt PIN để vỡ giáp thương`, '#ff7675'];
            if (zx.jam > 0) return [`MÁY PHÁ SÓNG: ${Math.ceil(zx.jam)}s — ĐÁNH BOSS! (phá giáp bằng CẬN CHIẾN / NỔ) · PIN ${zx.held}`, '#48dbfb'];
            return [zx.held > 0 ? `MANG ${zx.held} PIN VỀ LÕI MÁY PHÁT ĐỂ BẬT MÁY PHÁ SÓNG!` : 'BOSS BẤT TỬ — NHẶT PIN NẠP MÁY PHÁ SÓNG!', '#f1c40f'];
        }
        case 'TRAIN': return ['NÓC TÀU: phá MÓC XÍCH · B pháo · C tăng tốc · D chuyển ray', '#f1c40f'];
    }
    return opsObjectiveText() || labObjectiveText();
}
function storyPointers(ptr) {
    for (let p of story.props) {
        if (p.kind === 'station') ptr(p.x, p.y, '#f9ca24');
        else if (p.kind === 'core' && !p.on) ptr(p.x, p.y, '#48dbfb');
        else if (p.kind === 'wreck' && p.scrap >= 25) ptr(p.x, p.y, '#f1c40f');
    }
    if (objState === 'STORM_BOSS' || objState === 'ZAP_BOSS') { let b = zombies.find(z => (z.type === 35 || z.type === 36) && !z.hidden); if (b) ptr(b.x, b.y, b.color); }
    labPointers(ptr);
    hubPointers(ptr);
    opsPointers(ptr);
    if (objState === 'ZAP_BOSS' && story.zx) { for (let it of missionItems) if (!it.taken) ptr(it.x, it.y, '#f1c40f'); let c = story.props.find(p => p.kind === 'core'); if (c && story.zx.held > 0) ptr(c.x, c.y, '#48dbfb'); for (let l of zombies) if (l.type === 38 && l.big) ptr(l.x, l.y, '#ff7675'); }
    if (objState === 'TRAIN') for (let c of story.props) if (c.kind === 'chain') ptr(c.x, c.y, '#ff7675');
}
// Công trình bỏ hoang (phá lấy phế liệu)
function drawWreck(p, T) {
    let v = p.v | 0, r = p.r, hurt = p.hp < p.maxHp;
    drawShadow(p.x, p.y + 8, r);
    ctx.lineWidth = 3; ctx.strokeStyle = '#1e272e';
    if (v === 0) {          // xe hỏng
        ctx.fillStyle = '#7f5539'; ctx.fillRect(p.x - r, p.y - r * 0.5, r * 2, r); ctx.strokeRect(p.x - r, p.y - r * 0.5, r * 2, r);
        ctx.fillStyle = '#4a4e52'; ctx.fillRect(p.x - r * 0.5, p.y - r * 0.38, r * 0.9, r * 0.76);
        ctx.fillStyle = '#111'; for (let k of [-1, 1]) for (let j of [-1, 1]) ctx.fillRect(p.x + k * r * 0.62 - 6, p.y + j * r * 0.52 - 3, 12, 6);
    } else if (v === 1) {   // kho phế liệu
        ctx.fillStyle = '#6b705c'; ctx.fillRect(p.x - r, p.y - r * 0.8, r * 2, r * 1.6); ctx.strokeRect(p.x - r, p.y - r * 0.8, r * 2, r * 1.6);
        ctx.strokeStyle = '#3a3d33'; ctx.beginPath(); for (let k = -3; k <= 3; k++) { ctx.moveTo(p.x + k * r * 0.28, p.y - r * 0.8); ctx.lineTo(p.x + k * r * 0.28, p.y + r * 0.8); } ctx.stroke();
    } else if (v === 2) {   // máy phát cũ
        ctx.fillStyle = '#566573'; ctx.fillRect(p.x - r * 0.8, p.y - r * 0.7, r * 1.6, r * 1.4); ctx.strokeRect(p.x - r * 0.8, p.y - r * 0.7, r * 1.6, r * 1.4);
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.4, 0, Math.PI * 2); ctx.fillStyle = '#2c3e50'; ctx.fill(); ctx.stroke();
        ctx.fillStyle = Math.floor(T * 2) % 2 ? '#e74c3c' : '#7b241c'; ctx.fillRect(p.x + r * 0.45, p.y - r * 0.58, 7, 7);
    } else {                // container
        ctx.fillStyle = '#a04000'; ctx.fillRect(p.x - r * 1.1, p.y - r * 0.6, r * 2.2, r * 1.2); ctx.strokeRect(p.x - r * 1.1, p.y - r * 0.6, r * 2.2, r * 1.2);
        ctx.strokeStyle = '#6e2c00'; ctx.beginPath(); for (let k = -4; k <= 4; k++) { ctx.moveTo(p.x + k * r * 0.24, p.y - r * 0.6); ctx.lineTo(p.x + k * r * 0.24, p.y + r * 0.6); } ctx.stroke();
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    outlinedText('⚙', p.x, p.y, '#f1c40f', 'bold 18px Arial');
    if (hurt) drawMiniBar(p.x, p.y + r + 8, 56, 5, p.hp, p.maxHp, '#f1c40f');
    else outlinedText('PHÁ ĐỂ LẤY ⚙', p.x, p.y - r - 10, '#cbd5e1', 'bold 9px Arial', 2);
}

// Bọc chữ theo bề rộng
function storyWrap(text, maxW) {
    let words = text.split(' '), lines = [], cur = '';
    for (let w of words) { let t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
    if (cur) lines.push(cur);
    return lines;
}
// Lớp phủ trên cùng: sắc tím, hội thoại, giới thiệu boss, cắt cảnh
function drawStoryOverlay(T) {
    if (story.purple > 0.01) { ctx.fillStyle = `rgba(108, 52, 190, ${0.22 * story.purple})`; ctx.fillRect(0, 0, W, H); }
    drawLabOverlay(T);
    drawRailHud(T);
    drawHubTasks(T);
    let it = story.intro;
    if (it) {
        let k = it.t / it.max, a = Math.min(1, it.t * 3) * Math.min(1, (it.max - it.t) * 3), bar = H * 0.15 * a;
        ctx.fillStyle = `rgba(0, 0, 0, ${0.45 * a})`; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bar); ctx.fillRect(0, H - bar, W, bar);
        let size = Math.round(Math.min(it.big ? 64 : 46, W / (it.name.length * 0.72)));
        let slide = (1 - Math.min(1, it.t * 2.2)) * W * 0.5, cy = H * 0.5;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.globalAlpha = a;
        ctx.fillStyle = it.color; ctx.fillRect(W / 2 - Math.min(W * 0.42, 320) * Math.min(1, it.t * 1.6), cy + size * 0.62, Math.min(W * 0.84, 640) * Math.min(1, it.t * 1.6), 4);
        outlinedText('⚠  B O S S  ⚠', W / 2 + slide, cy - size * 0.95, '#ff7675', `bold ${Math.max(12, Math.round(size * 0.3))}px Arial`, 4);
        ctx.shadowColor = it.color; ctx.shadowBlur = 24;
        outlinedText(it.name, W / 2 - slide, cy, '#ffffff', `900 ${size}px Arial`, 8);
        ctx.shadowBlur = 0;
        if (it.sub) outlinedText(it.sub, W / 2 + slide * 0.6, cy + size * 0.62 + 24, it.color, `bold ${Math.max(12, Math.round(size * 0.3))}px Arial`, 4);
        if (it.big) { ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - k)})`; ctx.lineWidth = 2; for (let j = 0; j < 4; j++) { let yy = cy + (j - 1.5) * size * 0.9 + Math.sin(T * 9 + j) * 6; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W * Math.min(1, it.t * 3), yy); ctx.globalAlpha = 0.12 * a; ctx.stroke(); } }
        ctx.globalAlpha = 1;
    }
    let d = story.dialog;
    if (d) {
        let ln = d.lines[d.i], small = W < 640 || H < 480;
        let bw = Math.min(760, W - 20), fs = small ? 13 : 16, pad = 14, px = W / 2 - bw / 2;
        ctx.font = `${fs}px Arial`;
        let shown = ln.text.substring(0, Math.floor(d.t * 46)), lines = storyWrap(ln.text, bw - pad * 2 - 74);
        let bh = Math.max(92, 44 + lines.length * (fs + 6) + 30), py = H - bh - (showTouchUI ? Math.min(170, H * 0.3) : 26);
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(8, 12, 20, 0.93)'; ctx.fillRect(px, py, bw, bh);
        ctx.strokeStyle = ln.color; ctx.lineWidth = 2; ctx.strokeRect(px + 1, py + 1, bw - 2, bh - 2);
        ctx.fillStyle = ln.color; ctx.fillRect(px, py, 5, bh);
        // Chân dung
        ctx.beginPath(); ctx.arc(px + pad + 28, py + 40, 26, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fill(); ctx.strokeStyle = ln.color; ctx.lineWidth = 2; ctx.stroke();
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '30px Arial'; ctx.fillStyle = '#fff'; ctx.fillText(ln.icon, px + pad + 28, py + 42);
        ctx.textAlign = 'left'; ctx.font = `bold ${fs}px Arial`; ctx.fillStyle = ln.color; ctx.fillText(ln.who, px + pad + 68, py + 20);
        ctx.font = `${fs}px Arial`; ctx.fillStyle = '#f1f2f6';
        let left = shown.length;
        lines.forEach((l, i) => { if (left <= 0) return; ctx.fillText(l.substring(0, left), px + pad + 68, py + 44 + i * (fs + 6)); left -= l.length + 1; });
        ctx.textAlign = 'right'; ctx.font = 'bold 11px Arial'; ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.4 * Math.sin(T * 5)})`;
        ctx.fillText(`${d.i + 1}/${d.lines.length}  ▶ chạm / bấm chuột / Space để tiếp`, px + bw - pad, py + bh - 12);
    }
}

// ---------------------------------------------------------------------------
// ĐỒNG BỘ ONLINE
// ---------------------------------------------------------------------------
function storyNetState() {
    const R = Math.round;
    let x = { b: story.bolt };
    let d = story.dialog;
    if (d) { let ln = d.lines[d.i]; x.dg = [ln.who, ln.icon, ln.color, ln.text, R(d.t * 100), d.i, d.lines.length]; }
    let it = story.intro;
    if (it) x.it = [it.name, it.sub, it.color, R(it.x), R(it.y), R(it.t * 100), R(it.max * 100), it.big ? 1 : 0];
    if (story.purple > 0) x.pu = R(story.purple * 100);
    if (story.za) x.za = story.za;
    if (story.props.length) x.pr = story.props.map(p => [STORY_PROP_T.indexOf(p.kind), R(p.x), R(p.y), p.maxHp ? R(Math.max(0, p.hp) / p.maxHp * 100) : 0, p.on ? 1 : 0, p.r || 0]);
    labNetState(x);
    let zx = story.zx; if (zx) x.zx = [R(Math.max(0, zx.jam) * 10), zx.held, R(Math.max(0, zx.final) * 10), R(Math.max(0, zx.spear) * 10)];
    if (currentMapType === 16) x.bs = base.turrets.map(t => t ? [TURRET_KEYS.indexOf(t.t), t.l, R((t.ang || 0) * 100)] : 0);
    return x;
}
function storyNetApply(x) {
    if (!x || typeof x !== 'object') { story.dialog = null; story.intro = null; story.props = []; story.lab = null; story.train = null; story.rail = null; story.zx = null; story.cut = null; story.purple = 0; return; }
    story.bolt = x.b | 0;
    let g = x.dg;
    story.dialog = Array.isArray(g) ? { lines: Array.from({ length: Math.max(1, g[6] | 0) }, () => ({ who: String(g[0]), icon: String(g[1]), color: String(g[2]), text: String(g[3]) })), i: Math.min((g[6] | 0) - 1, g[5] | 0), t: (g[4] | 0) / 100 } : null;
    let it = x.it;
    story.intro = Array.isArray(it) ? { name: String(it[0]), sub: String(it[1]), color: String(it[2]), x: +it[3] || 0, y: +it[4] || 0, t: (it[5] | 0) / 100, max: (it[6] | 0) / 100 || 2, big: !!it[7] } : null;
    if (story.intro) { cam.x += (story.intro.x - cam.x) * 0.2; cam.y += (story.intro.y - cam.y) * 0.2; }
    story.purple = (x.pu | 0) / 100; story.za = x.za | 0;
    story.props = Array.isArray(x.pr) ? x.pr.map(e => ({ kind: STORY_PROP_T[e[0]] || 'machine', x: +e[1] || 0, y: +e[2] || 0, hp: +e[3] || 0, maxHp: 100, on: !!e[4], r: +e[5] || 40 })) : [];
    labNetApply(x);
    story.zx = Array.isArray(x.zx) ? { jam: (x.zx[0] | 0) / 10, held: x.zx[1] | 0, final: (x.zx[2] | 0) / 10, spear: (x.zx[3] | 0) / 10 } : null;
    story.bs = Array.isArray(x.bs) ? x.bs.map(e => Array.isArray(e) ? { t: TURRET_KEYS[e[0]] || 'mg', l: e[1] | 0, ang: (e[2] | 0) / 100 } : null) : null;
}
