// Run: node --test tests/defense-lifesteal.test.cjs
// Load the real game scripts in HTML order; only browser/audio surfaces are stubbed.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
module.exports = { game };

function game() {
    const noop = () => {};
    const ctx = new Proxy({}, { get: (_, key) => key === 'measureText' ? () => ({ width: 20 }) : noop });
    const elements = new Map();
    function element() {
        return { style: {}, dataset: {}, classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
            addEventListener: noop, appendChild: noop, insertAdjacentHTML: noop, remove: noop, focus: noop, querySelectorAll: () => [],
            getContext: () => ctx, getBoundingClientRect: () => ({ x: 0, y: 0, left: 0, top: 0, width: 1280, height: 720 }),
            innerHTML: '', textContent: '', value: '', width: 1280, height: 720 };
    }
    const storage = new Map();
    const sandbox = { console, performance, URL, Math: Object.create(Math), innerWidth: 1280, innerHeight: 720,
        addEventListener: noop, requestAnimationFrame: noop, cancelAnimationFrame: noop,
        setTimeout: noop, clearTimeout: noop, setInterval: noop, clearInterval: noop,
        navigator: { userAgent: 'node-test', maxTouchPoints: 0 }, location: { protocol: 'http:', hostname: 'localhost', search: '' },
        localStorage: { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, String(v)), removeItem: k => storage.delete(k) },
        document: { addEventListener: noop, createElement: element, querySelector: () => null, querySelectorAll: () => [],
            body: element(), documentElement: element(), getElementById: id => { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); } },
        Audio: class { play() { return Promise.resolve(); } pause() {} addEventListener() {} load() {} },
        Image: class {}, matchMedia: () => ({ matches: false, addEventListener: noop }) };
    sandbox.window = sandbox;
    const context = vm.createContext(sandbox);
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    for (const [, file] of html.matchAll(/<script src="(js\/[^\"]+)"/g)) {
        vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
    }
    const run = code => vm.runInContext(code, context);
    run(`Sound.play = () => {}; createParticles = () => {}; addScreenShake = () => {};
        players = [new Player(1, 2000, 2000, '#fff')]; currentLevel = 5;
        zombies = []; hazards = []; obstacles = []; enemyBullets = []; allies = [];
        NET.mode = ''; objState = 'BASE_DEF'; base = newBase();`);
    return { run, elements };
}

test('all scripts parse and load in the same order as index.html', () => { game(); });

test('gates use connected roster and stay fixed throughout defense', () => {
    const { run } = game();
    for (const [n, expected] of [[1, 2], [2, 2], [3, 3], [4, 4]]) {
        assert.equal(run(`players = Array.from({length:${n}}, (_, i) => new Player(i+1, 0, 0, '#fff')); baseGates()`), expected);
    }
    assert.equal(run('players[3].isDowned = true; baseGates()'), 4);
    assert.equal(run('players[3].netLeft = true; baseGates()'), 3);
    assert.equal(run('genBaseDefense(5); players[2].netLeft = true; baseGatesNow()'), 3);
});

test('buy all five gate levels, reject insufficient funds, save/load legacy and new runs', () => {
    const { run } = game();
    run('shopScrap = 0; base.mat = 100; baseBuy("gate")');
    assert.equal(run('base.gate'), 0);
    run('shopScrap = 1000; base.mat = 100');
    for (let level = 1; level <= 5; level++) {
        run('baseBuy("gate")'); assert.equal(run('base.gate'), level);
    }
    assert.equal(run('shopScrap'), 675);
    assert.equal(run('base.mat'), 79);
    run('baseBuy("gate")'); assert.equal(run('shopScrap'), 675);
    run('let saved = baseSave(); baseLoad(saved)'); assert.equal(run('base.gate'), 5);
    run('baseLoad({house: 2})'); assert.equal(run('base.gate'), 0);
    run('base.gate = 1; base.mat = 0; baseBuy("gate")'); assert.equal(run('base.gate'), 1);
});

test('house regeneration waits five seconds and restarts after every attack', () => {
    const { run } = game();
    run(`base.pop = 2; let h = new StoryNPC(2000, 1640, 'house'); h.hp = 900; h.maxHp = 1000;
        base.def = { houseNpc: h, barriers: [], gates: 2, wave: 0, total: 5, left: 0, breakT: 100, endT: 0 }; h._prevHp = h.hp;
        h.takeDamage(100);`);
    for (let i = 0; i < 50; i++) run('updateBase(0.1)');
    assert.ok(Math.abs(run('h.hp') - 800) < 1e-8);
    run('updateBase(0.1)'); assert.ok(run('h.hp') > 800);
    run('h.takeDamage(10); updateBase(0.1)');
    const afterHit = run('h.hp');
    for (let i = 0; i < 48; i++) run('updateBase(0.1)');
    assert.equal(run('h.hp'), afterHit);
    run('h.hp = 0; h.noHitT = 10; colonyDefTick(1, h)'); assert.equal(run('h.hp'), 0);
});

test('house recovery rate is capped at eight workers and never exceeds max health', () => {
    const { run } = game();
    run(`base.pop = 99; let h = {hp:500,maxHp:1000,noHitT:10,x:0,y:0}; colonyDefTick(1,h)`);
    assert.ok(Math.abs(run('h.hp') - 507.1) < 1e-8);
    run('h.hp = 999; colonyDefTick(1,h)'); assert.equal(run('h.hp'), 1000);
    assert.ok(Math.abs(run('baseRegenDt(0.2,5.1)') - 0.1) < 1e-8);
});

test('barriers repair only after cooldown; broken gates stay broken', () => {
    const { run } = game();
    run(`let b = {...GATE_RECTS[0], hp:500, maxHp:1000, regen:0.015, noHitT:0, dr:0};
        let d = {barriers:[b]};`);
    run('updateBaseBarriers(4.9,d)'); assert.equal(run('b.hp'), 500);
    run('updateBaseBarriers(0.2,d)'); assert.ok(Math.abs(run('b.hp') - 501.5) < 1e-8);
    run('hurtBaseGate(b,10); updateBaseBarriers(1,d)'); assert.ok(Math.abs(run('b.hp') - 491.5) < 1e-8);
    run('b.hp=0; updateBaseBarriers(20,d)'); assert.equal(run('b.hp'), 0);
});

test('fast enemy projectiles cannot cross any of the four live gates or hit a protected player', () => {
    const { run } = game();
    run('base.def = {barriers: GATE_RECTS.map((r,idx) => ({...r,idx,hp:1000,maxHp:1000,dr:0}))}');
    for (let i = 0; i < 4; i++) {
        run(`let r${i}=GATE_RECTS[${i}]; players[0].x=r${i}.cx-r${i}.nx*80; players[0].y=r${i}.cy-r${i}.ny*80;
            let eb${i}=new EnemyBullet(r${i}.cx+r${i}.nx*80,r${i}.cy+r${i}.ny*80,players[0].x,players[0].y,'bullet');
            eb${i}.vx=-r${i}.nx*1600; eb${i}.vy=-r${i}.ny*1600; eb${i}.update(0.1);`);
        assert.equal(run(`eb${i}.active`), false);
        assert.equal(run(`base.def.barriers[${i}].hp`), 988);
        assert.equal(run('players[0].hp'), 100);
    }
    run(`base.def.barriers[0].hp=0; let eb = {x:2600,y:2000,active:true,type:'bullet'};`);
    assert.equal(run('blockBaseEnemyBullet(eb,2780,2000)'), false);
});

test('barriers block ground zombies but let players, allies, flying enemies and broken gates pass', () => {
    const { run } = game();
    run(`base.def={barriers:[{...GATE_RECTS[0],hp:1000}]};
        let z=Object.assign(Object.create(Zombie.prototype),{x:2682,y:2000,radius:16,hp:100}); resolveBaseGateCollision(z);`);
    assert.equal(run('z.x'), 2716);
    run('players[0].x=2682; resolveBaseGateCollision(players[0])'); assert.equal(run('players[0].x'), 2682);
    run('z.flying=true; z.x=2682; resolveBaseGateCollision(z)'); assert.equal(run('z.x'), 2682);
    run('z.flying=false; base.def.barriers[0].hp=0; resolveBaseGateCollision(z)'); assert.equal(run('z.x'), 2682);
});

test('scythe lifesteal, overkill clamp, offering shield and virtual HP cap', () => {
    const { run } = game();
    run('let p=players[0]; p.hp=50; p.onHitEnemy(100,true,true)');
    assert.equal(run('p.hp'), 54.5);
    run(`Math.random=()=>0; p.hp=50; p._scHealTick=-1; p.weapon={...WEAPON_TYPES.SCYTHE};
        let z={x:2050,y:2000,radius:16,hp:1,maxHp:100,type:0,knockback:()=>{}}; zombies=[z];
        let slash=new Slash(p.x,p.y,0,p.weapon,p); slash.update(0.01,p.x,p.y);`);
    assert.ok(Math.abs(run('p.hp') - 54.045) < 1e-8);
    assert.equal(run('hazards.filter(h=>h.type==="soul").length'), 1);
    assert.equal(run('p.vHp'), 34);
    run('p.addVirtualHp(9999)'); assert.equal(run('p.vHp'), 60);
    run('p.perks.ls_overheal=true; p.hp=p.maxHp; p.vHp=0; p.applyLifesteal(10)');
    assert.equal(run('p.vHp'), 6.5);
});

test('scythe offering chance, capacity, boss exclusion and upgrade bonus', () => {
    const { run } = game();
    run(`let p=players[0], z={type:0,x:0,y:0}; Math.random=()=>0.1; scytheKill(z,p)`);
    assert.equal(run('hazards.length'), 0);
    run('p.perks.sc_soul=true; scytheKill(z,p)'); assert.equal(run('hazards.length'), 1);
    assert.equal(run('p.vHp'), 48);
    run('hazards=[]; Math.random=()=>0; scytheKill({...z,type:50},p); scytheKill({...z,type:51},p)');
    assert.equal(run('hazards.length'), 0);
    run('for(let i=0;i<20;i++) scytheKill(z,p)'); assert.equal(run('hazards.length'), 12);
});

test('defense cards, virtual HP absorption and damage-over-time respect their limits', () => {
    const { run } = game();
    run('let p=players[0]; applyUpgrade(p,"df_plate")'); assert.equal(run('p.maxHp'), 160);
    assert.equal(run('p.getDefenseMult()'), 0.85);
    run('p.tags["PHÒNG THỦ"]=4'); assert.ok(Math.abs(run('p.getDefenseMult()') - 0.646) < 1e-8);
    run('p.vHp=20; p.takeDot(10)'); assert.equal(run('p.hp'), 160);
    assert.ok(Math.abs(run('p.vHp') - 13.54) < 1e-8);
    assert.equal(run('p.noHitT'), 0);
    run('p.perks.df_unbreakable=true; p.vHp=0; p.takeDamage(99999)');
    assert.equal(run('p.hp'), 104);
});

test('shield saves and host-to-guest state preserve new mechanics', () => {
    const { run } = game();
    run('players[0].vHp=43; base.gate=5');
    assert.equal(run('savePlayer(players[0]).vhp'), 43);
    run(`storyNetApply({bg:4,bgl:5,bgh:[[900,1000],[0,1000]],bnh:27}); NET.mode='guest'`);
    assert.equal(run('baseGatesNow()'), 4);
    assert.equal(run('story.bgl'), 5);
    assert.equal(run('story.bgh[1][0]'), 0);
    assert.equal(run('story.bnh'), 2.7);
});
