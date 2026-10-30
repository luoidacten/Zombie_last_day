const {test}=require('node:test'),assert=require('node:assert/strict');
const {game}=require('./defense-lifesteal.test.cjs');
function tower(key='mg',p=[0,0,0]){let g=game();g.run(`gameState='PLAYING';objState='HUB';currentLevel=8;story=newStory();base.pop=30;base.mat=999;shopScrap=99999;base.turrets=[{t:'${key}',p:${JSON.stringify(p)},l:1,cd:0}];`);return g;}
test('all 60 branch tiers have descriptions; crosspath permits 4-2-0 and locks third/main alternatives',()=>{
 const {run}=tower();assert.equal(run('Object.values(TURRET_PATHS).every(v=>v.length===3&&v.every(p=>p.length===4&&p.every(d=>d[0]&&d[1])))'),true);
 for(let i=0;i<4;i++)assert.equal(run('turretPathBuy(0,0)'),true);for(let i=0;i<2;i++)assert.equal(run('turretPathBuy(0,1)'),true);
 assert.equal(run('turretPathBuy(0,1)'),false);assert.equal(run('turretPathBuy(0,2)'),false);assert.equal(run('base.turrets[0].p.join()'),'4,2,0');
 run(`base.turrets[0].p=[2,2,0]`);assert.equal(run('turretPathBuy(0,1)'),true);assert.equal(run('turretPathBuy(0,0)'),false);
});
test('purchase validates funds, guest authority and Acid Queen unlock; tiers persist through legacy/new saves',()=>{
 const {run}=tower('flame',[0,0,2]);run('queenSlain=false');assert.equal(run('turretPathBuy(0,2)'),false);run('queenSlain=true;shopScrap=0');assert.equal(run('turretPathBuy(0,2)'),false);run(`shopScrap=9999;NET.mode='guest'`);assert.equal(run('turretPathBuy(0,2)'),false);run(`NET.mode='';turretPathBuy(0,2);let save=baseSave();baseLoad(save)`);assert.equal(run('base.turrets[0].p[2]'),3);
 run(`baseLoad({turrets:[{t:'mg',l:5}],pop:3})`);assert.equal(run('base.turrets[0].p.join()'),'4,0,0');
});
test('ultimate towers use two residents; workers and unmanned towers reflect staffing',()=>{
 const {run}=tower();run(`base.pop=3;base.turrets=[{t:'mg',p:[4,2,0]},{t:'sniper',p:[4,0,0]},{t:'flame',p:[1,0,0]}]`);
 assert.equal(run('turretManned(0)&&!turretManned(1)&&turretManned(2)'),true);assert.equal(run('turretOperators()'),3);assert.equal(run('baseWorkers()'),0);
});
test('all 15 tier-3 and tier-4 branches execute in combat without invalid state',()=>{
 const {run}=tower();for(let key of ['mg','sniper','flame','mortar','tesla'])for(let b=0;b<3;b++)for(let tier of [3,4]){
  const p=[0,0,0];p[b]=tier;run(`resetTurretEffects();objState='BASE_DEF';base.turrets=[{t:'${key}',p:${JSON.stringify(p)},l:1,cd:0}];zombies=Array.from({length:12},(_,i)=>new Zombie(2700+i*8,1880+i*5,0));for(let z of zombies)z.hp=z.maxHp=100000;for(let i=0;i<20;i++)updateTurrets(.1)`);
  assert.equal(run('zombies.every(z=>Number.isFinite(z.hp)&&Number.isFinite(z.x))'),true,key+b+tier);
  assert.equal(run('bullets.length>0||turretFields.length>0||turretOrdnance.length>0||zombies.some(z=>z.hp<100000)'),true,key+b+tier);
 }
});
test('plasma penetrates a line; suppression breaks shields and stuns large bosses',()=>{
 const {run}=tower('mg',[4,0,0]);run(`objState='BASE_DEF';zombies=[new Zombie(2700,1890,0),new Zombie(2780,1890,0)];let hp=zombies[1].hp;updateTurrets(.1)`);assert.ok(run('zombies[1].hp')<run('hp'));
 run(`base.turrets[0].p=[0,4,0];let z=new Zombie(2700,1890,30);zombies=[z];let shot=new Bullet(2600,1890,0,{range:500,dmg:10,turretSlot:0,fromAlly:true},players[0]);shot.hitEnemy(z)`);assert.equal(run('z.shieldBroken&&z.turretStunT>0'),true);
});
test('sniper mark, boss bind, salvage and supply drops have real effects',()=>{
 const {run}=tower('sniper',[0,0,4]);run(`objState='BASE_DEF';let z=new Zombie(2700,1890,0);z.hp=1;zombies=[z];let before=shopScrap;updateTurrets(.1)`);assert.equal(run('shopScrap-before'),2);assert.equal(run('turretOrdnance.filter(e=>e.kind===\'supply\').length'),2);run('tickTurretEffects(2.1)');assert.equal(run('drops.some(d=>d.type===\'AMMOBOX\')&&drops.some(d=>d.type===\'HEALTHBOX\')'),true);
 run(`base.turrets[0].p=[3,0,0];base.turrets[0].cd=0;z=new Zombie(2700,1890,30);zombies=[z];updateTurrets(.1)`);assert.equal(run('z.turretStunT'),2);
 run(`z.turretMarkT=4;let marked=calcDamage(100,{},z.x,z.y,null,z);z.turretMarkT=0;let plain=calcDamage(100,{},z.x,z.y,null,z)`);assert.equal(run('marked/plain'),1.25);
});
test('Napalm slows 60%, blocks bandit rounds and stops reanimation; acid spores chain once per corpse',()=>{
 const {run}=tower('flame',[0,4,0]);run(`objState='BASE_DEF';let z=new Zombie(2700,1890,11);z.hp=z.maxHp=9999;zombies=[z];let e=new EnemyBullet(z.x,z.y,2000,2000,'arrow');e.faction='bandit';enemyBullets=[e];updateTurrets(.1);tickTurretEffects(.2)`);
 assert.equal(run('z.noReanimate&&z.turretSlowT>0&&!e.active'),true);assert.equal(run('getStatusMoveMult(z)'),.4);
 run(`base.turrets[0].p=[0,0,4];z.hp=1;turretDamage(z,500,base.turrets[0],{acid:true,spores:true});let n=turretBursts.length;zombieDown(z,players[0])`);assert.equal(run('turretBursts.length'),run('n'));assert.equal(run('z.hasRevived||false'),false);
});
test('mortar volleys, radiation, reveal and EMP disable mechanics with their intended durations',()=>{
 const {run}=tower('mortar',[0,4,0]);run(`objState='BASE_DEF';zombies=[new Zombie(2800,1890,0)];updateTurrets(.1)`);assert.equal(run('turretOrdnance.length'),12);assert.equal(run('turretOrdnance.every(e=>e.homing)'),true);
 run(`resetTurretEffects();base.turrets[0].p=[4,0,0];base.turrets[0].cd=0;updateTurrets(.1);tickTurretEffects(.9)`);assert.equal(run('turretFields.some(f=>f.kind===\'radiation\')'),true);
 run(`base.turrets[0].p=[0,0,4];let z=new Zombie(2700,1890,30);z.hidden=true;z.isFrenzied=10;zombies=[z];banditTrucks=[{x:2700,y:1890,hp:500,time:1,cd:0,empT:0}];base.turrets[0].cd=0;updateTurrets(.1);tickTurretEffects(1)`);assert.equal(run('!z.hidden&&z.abilityLockT===3&&z.isFrenzied===0&&banditTrucks[0].empT===3'),true);
});
test('Tesla pulse boosts allies, links towers, absorbs hits and cannot rebuild a broken gate',()=>{
 const {run}=tower('tesla',[0,4,0]);run(`objState='BASE_DEF';players[0].x=2580;players[0].y=1890;let rate=getPlayerFireRateMult(players[0]);base.turrets.push({t:'tesla',p:[0,0,3],cd:0});let h=new StoryNPC(2000,1640,'house');h.maxHp=1000;h.hp=700;h.noHitT=6;let gate={hp:0,maxHp:1000,noHitT:6};base.def={houseNpc:h,barriers:[gate]};updateTurrets(.1)`);
 assert.ok(run('rate')<1);assert.equal(run('turretFields.some(f=>f.kind===\'fence\')'),true);assert.ok(run('h.vHp')>0);assert.equal(run('gate.hp'),0);
 run('let hp=h.hp;h.takeDamage(20)');assert.equal(run('h.hp'),run('hp'));assert.equal(run('h.noHitT'),0);
});
test('Tesla blackhole pulls enemies, effects and path shapes synchronize to guests',()=>{
 const host=tower('tesla',[0,0,4]),guest=game();host.run(`objState='BASE_DEF';currentMapType=16;zombies=[new Zombie(2800,1890,0)];zombies[0].hp=zombies[0].maxHp=10000;updateTurrets(.1);let z=zombies[0];z.x+=100;let before=z.x;tickTurretEffects(.1)`);assert.ok(host.run('z.x')<host.run('before'));
 const data=host.run('JSON.stringify(storyNetState())');guest.run(`NET.mode='guest';storyNetApply(${data})`);assert.equal(guest.run('story.bs[0].p.join()'),'0,0,4');assert.equal(guest.run('turretFields[0].kind'),'blackhole');
});
