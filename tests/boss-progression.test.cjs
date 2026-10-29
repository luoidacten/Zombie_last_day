const {test}=require('node:test');
const assert=require('node:assert/strict');
const {game}=require('./defense-lifesteal.test.cjs');

test('eight-map boss waits through special maps and completes only on normal boss victory',()=>{
    const {run}=game();
    run(`story=newStory();hangZRun.active=false;currentMapType=1;nextMissionPreference=null;regularBossCycle=0`);
    assert.notEqual(run('pickMissionType(7)'),'BOSS');
    assert.equal(run('pickMissionType(8)'),'BOSS');
    for(const map of [4,5,6,10,14,15,16]) {
        run(`currentMapType=${map}`);
        assert.notEqual(run('pickMissionType(8)'),'BOSS');
        assert.equal(run('regularBossCycle'),0);
    }
    run('currentMapType=1;currentLevel=11;setupMission(pickMissionType(11),11)');
    assert.equal(run('mission.type'),'BOSS');
    assert.equal(run('regularBossDue(11)'),true);
    run('recordMissionKill(30)');
    assert.equal(run('regularBossCycle'),1);
    assert.notEqual(run('pickMissionType(12)'),'BOSS');
    assert.equal(run('pickMissionType(16)'),'BOSS');
});

test('city gets The Leader for a deferred boss, but not twice within the same interval',()=>{
    const {run}=game();run(`story=newStory();hangZRun.active=false;regularBossCycle=0;currentMapType=8;currentLevel=10;setupMission(pickMissionType(10),10)`);
    assert.equal(run('mission.type'),'CITY_BOSS');assert.equal(run('mission.required'),1);
    run('recordMissionKill(32)');assert.equal(run('regularBossCycle'),1);
    assert.notEqual(run('pickMissionType(11)'),'CITY_BOSS');
    run('currentMapType=6;currentLevel=16;setupMission("POWER_BOSS",16);recordMissionKill(31)');
    assert.equal(run('regularBossCycle'),1);
});

test('all bosses gain HP for 1-4 players and elapsed run time; ordinary zombies do not',()=>{
    const {run}=game();run('Math.random=()=>.99;currentLevel=8;survivalTime=0');
    for(const type of [30,31,32,35,36,37,45,46,50]) {
        let previous=0;
        for(let n=1;n<=4;n++) {
            run(`players=Array.from({length:${n}},(_,i)=>new Player(i+1,0,0,'#fff'));runElapsed=0`);
            const hp=run(`new Zombie(0,0,${type}).maxHp`);
            assert.ok(hp>previous,`boss ${type}, ${n} players`);previous=hp;
            run('runElapsed=1800');assert.ok(Math.abs(run(`new Zombie(0,0,${type}).maxHp`)/hp-2)<1e-9);
        }
    }
    run('runElapsed=0');const hp=run('new Zombie(0,0,0).maxHp');
    run('runElapsed=1800');assert.equal(run('new Zombie(0,0,0).maxHp'),hp);
    run('runElapsed=0');const armor=run('new Zombie(0,0,36).maxArmor');
    run('runElapsed=1800');assert.equal(run('new Zombie(0,0,36).maxArmor'),armor*2);
});

test('run clock persists across map starts and saves, resets only for a new run',()=>{
    const {run}=game();
    run(`runElapsed=1234;regularBossCycle=1;currentLevel=17;startLevel()`);
    assert.equal(run('runElapsed'),1234);assert.equal(run('survivalTime'),0);
    run('runElapsed=0;regularBossCycle=0;loadGame()');
    assert.equal(run('runElapsed'),1234);assert.equal(run('regularBossCycle'),1);
    run('resetRunState()');assert.equal(run('runElapsed'),0);assert.equal(run('regularBossCycle'),0);
});

test('legacy saves load without invalid run time or repeated old boss intervals',()=>{
    const {run}=game();run(`currentLevel=18;saveCheckpoint();let s=JSON.parse(localStorage.getItem(SAVE_KEY));delete s.runElapsed;delete s.regularBossCycle;localStorage.setItem(SAVE_KEY,JSON.stringify(s));loadGame()`);
    assert.equal(run('runElapsed'),0);assert.equal(run('regularBossCycle'),2);
});

test('host snapshot carries run time and completed boss interval to guests',()=>{
    const host=game(),guest=game();host.run('runElapsed=987.6;regularBossCycle=2');
    const snapshot=host.run('JSON.stringify(netBuildSnapshot(true))');
    guest.run(`netApplySnapshot(${snapshot})`);
    assert.equal(guest.run('runElapsed'),987.6);assert.equal(guest.run('regularBossCycle'),2);
});

test('run clock advances during active play and carts, not menus, hub or dialogue',()=>{
    const {run}=game();
    run(`runElapsed=0;lastTime=1000;gameState='PLAYING';objState='TOWERS';story=newStory();storyFrame=()=>true;gameLoop(1100)`);
    assert.equal(run('runElapsed'),.1);
    run(`objState='HUB';gameLoop(1200);objState='TOWERS';story.dialog={};gameLoop(1300);gameState='UPGRADE';gameLoop(1400)`);
    assert.equal(run('runElapsed'),.1);
    run(`gameState='PLAYING';startMinecart();draw=()=>{};updateFx=()=>{};gameLoop(lastTime+100)`);
    assert.equal(run('runElapsed'),.2);
});
