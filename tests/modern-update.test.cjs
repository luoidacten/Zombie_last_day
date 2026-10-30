const {test}=require('node:test'),assert=require('node:assert/strict');
const {game}=require('./defense-lifesteal.test.cjs');
function active(){let g=game();g.run(`gameState='PLAYING';objState='KILL';story=newStory();Math.random=()=>.9;players[0].x=2000;players[0].y=2000;`);return g;}
test('training unlocks at house 2, caps at 2/4/7/10, uses food and scales gains',()=>{
 const {run}=active();run(`objState='HUB';base.food=99999;base.house=1`);assert.equal(run(`buyTraining('tspd')`),false);
 for(const [house,cap]of [[2,2],[3,4],[4,7],[5,10]]){
  run(`base.house=${house}`);assert.equal(run('trainingCap()'),cap);
  for(let i=0;i<cap+1;i++)run(`buyTraining('tspd')`);assert.equal(run('base.trainSpd'),cap);
 }
 assert.equal(run(`buyTraining('invalid')`),false);
 run(`let saved=baseSave();baseLoad(saved)`);assert.equal(run('base.trainSpd'),10);assert.ok(run('trainingGain("thp")')>30);
});
test('food is produced once per expedition from resident count',()=>{
 const {run}=active();run(`base.food=0;base.arr=0;currentLevel=3;base.pop=4;colonyArrive();colonyArrive()`);assert.equal(run('base.food'),12);
 run(`currentLevel=4;colonyArrive()`);assert.equal(run('base.food'),24);
});
test('training passives unlock with progress and preserve old save defaults',()=>{
 const {run}=active();run(`base.trainHp=4;base.trainSpd=4;base.trainDmg=4;players[0].hp=50;players[0].trainingHealT=9.99;Player.prototype.update.call(players[0],.02)`);
 assert.ok(run('players[0].hp')>50);assert.ok(run('players[0].getTotalDamageMult()')>1);
 run('baseLoad({house:2})');assert.equal(run('base.food'),0);assert.equal(run('base.trainDmg'),0);
});
test('SMG 30 and AR 25 magazines consume total ammo and auto reload without discarding gun',()=>{
 for(const [key,size]of [['SMG',30],['AR',25]]){
  const {run}=active();run(`let p=players[0];p.weapon={...WEAPON_TYPES.${key}};let w=magazineInit(p);`);assert.equal(run('w.mag'),size);
  run(`for(let i=0;i<${size};i++){p.lastFireTime=0;p.shoot();}`);assert.equal(run('w.mag'),0);assert.ok(run('p.reloadT')>0);
  const ammo=run('w.ammo');run('p.lastFireTime=0;p.shoot()');assert.equal(run('w.ammo'),ammo);
  run('tickReload(p,10)');assert.equal(run('w.mag'),size);assert.equal(run('w.ammo'),ammo);
  run('w.mag=1;w.ammo=1;p.lastFireTime=0;p.shoot()');assert.equal(run('p.weapon===w'),true);assert.equal(run('w.ammo'),0);
 }
});
test('manual reload, cancellation, perks and magazine net/save preserve ammunition',()=>{
 const {run}=active();run(`let p=players[0];p.weapon={...WEAPON_TYPES.AR};let w=magazineInit(p);w.mag=5;requestReload(p);let t=p.reloadMax;tickReload(p,10);p.perks.rl_quick=true;w.mag=5;requestReload(p)`);
 assert.ok(run('p.reloadMax<t'));run('tickReload(p,10)');assert.equal(run('w.mag'),25);
 run('w.mag=5;requestReload(p);p.weapon=null;tickReload(p,.1)');assert.equal(run('p.reloadW'),null);
 run(`p.weapon=w;w.mag=3;let saved=savePlayer(p);let e=netEncodePlayer(p);let guest=new Player(2,0,0,'#fff');netDecodePlayer(guest,e,false)`);assert.equal(run('guest.weapon.mag'),3);assert.equal(run('saved.w.mag'),3);
});
test('new supply boxes replenish ammo or health only, not weapon durability',()=>{
 const {run}=active();run(`let p=players[0];p.weapon={...WEAPON_TYPES.AR,ammo:10};p.hp=20;spawnDrop(p.x,p.y,false,'AMMOBOX');spawnDrop(p.x,p.y,false,'HEALTHBOX');p.update(.01)`);
 assert.ok(run('p.weapon.ammo')>10);assert.ok(run('p.hp')>=70);assert.equal(run('drops.length'),0);
});
test('all eight bandit constructors and utility AI run without invalid state',()=>{
 const {run}=active();run(`currentMapType=5;for(let i=0;i<8;i++)zombies.push(new Zombie(2300+i*30,2000,60+i));for(let z of zombies)z.update(.1)`);
 assert.equal(run('zombies.every(z=>Number.isFinite(z.hp)&&Number.isFinite(z.x)&&Number.isFinite(z.y))'),true);
});
test('zombies and bandits fight, human ranged bullets do not hit human teammates',()=>{
 const {run}=active();run(`let b=new Zombie(2000,2000,60),z=new Zombie(2001,2000,0);zombies=[b,z];z.atkCD=0;let hp=b.hp;z.update(.01)`);assert.ok(run('b.hp')<run('hp'));
 run(`let shot=new EnemyBullet(2000,2000,2600,2000,'arrow');shot.faction='bandit';shot.owner=b;let zh=z.hp;shot.update(.01)`);assert.ok(run('z.hp')<run('zh'));
});
test('medic down/revive/final infection gives one human reward and half XP corpse',()=>{
 const {run}=active();run(`let b=new Zombie(2000,2000,61),m=new Zombie(2050,2000,66);zombies=[b,m];let kills=killCount;b.hp=0;let first=zombieDown(b,players[0]);`);
 assert.equal(run('first'),false);assert.equal(run('killCount'),run('kills'));run('m.update(.1)');assert.equal(run('b.revived'),true);
 run('b.hp=0;zombieDown(b,players[0])');assert.equal(run('killCount'),run('kills')+1);assert.ok(run('zombies.some(z=>z.infectedBandit)'));
 run('let corpse=zombies.find(z=>z.infectedBandit);let xp=players[0].xp;let dropCount=drops.length;corpse.hp=0;zombieDown(corpse,players[0]);zombieDown(corpse,players[0])');assert.equal(run('players[0].xp-xp'),7.5);assert.equal(run('drops.length'),run('dropCount'));
});
test('explosions prevent revive/infection and scout loot returns once',()=>{
 const {run}=active();run(`let b=new Zombie(2000,2000,60),m=new Zombie(2050,2000,66);zombies=[b,m];b.stolenLoot=[{type:'SUPERBOX',radius:16}];b.hp=1;explode(2000,2000,100,9999,players[0],true);zombieDown(b,players[0]);`);
 assert.equal(run('b.banditDown||false'),false);assert.equal(run('zombies.some(z=>z.infectedBandit)'),false);assert.equal(run('drops.filter(d=>d.type==="SUPERBOX").length'),1);
});
test('no human factions or trucks enter underground Lab, caves or train',()=>{
 const {run}=active();for(const map of [10,14]){run(`currentMapType=${map}`);assert.equal(run('banditDensity()'),0);}
 run(`currentMapType=15;story.lab={stage:'explore',dungeon:{}}`);assert.equal(run('banditDensity()'),0);
 run(`objState='TRAIN'`);assert.equal(run('banditDensity()'),0);
});
test('chainsaw attacks, slow resistance, dash and rage use real mechanics',()=>{
 const {run}=active();run(`let p=players[0];p.weapon={...WEAPON_TYPES.CHAINSAW};let z=new Zombie(2060,2000,62);zombies=[z];p.perks.saw_teeth=true;let dmg=calcDamage(42,p.weapon,z.x,z.y,p,z)`);
 assert.equal(run('z.shieldBroken'),true);assert.ok(run('p.sawRpm')>0);assert.equal(run('z.sawBleed'),3);
 run('skillTryC(p);skillTick(p,.1)');assert.ok(run('p.x')>2000);
 run('p.rage=100;p.perks.w_rage=true;arsenalRage(p)');assert.equal(run('p.sawRage'),6);assert.equal(run('p.rage'),0);
});
test('biome POIs are map-specific and scripted maps do not receive random buildings',()=>{
 const {run}=active();for(const map of [1,4,7,9,12,13]){run(`currentMapType=${map};setupBiome()`);assert.ok(run('worldFeatures.length')>=4);assert.equal(run('anomalyZone.r'),450);}
 for(const map of [10,14,15,16]){run(`currentMapType=${map};setupBiome()`);assert.equal(run('worldFeatures.length'),0);}
});
test('feature destruction and signal reward trigger once',()=>{
 const {run}=active();run(`currentMapType=1;let f=addFeature('fuel',2000,2000);damageFeature(f,999,{type:'gun'},players[0]);let fires=fireZones.length;damageFeature(f,999,{type:'gun'},players[0]);`);assert.equal(run('fireZones.length'),run('fires'));assert.ok(run('fires')>0);
 run(`let s=addFeature('signal',1000,1000);featureAction(s,players[0]);let n=drops.length;featureAction(s,players[0])`);assert.equal(run('drops.length'),run('n'));
});
test('mine escort, sabotage, interactive queen and post-kill escape are connected',()=>{
 const {run}=active();run(`currentMapType=14;nextMapPreference=14;mineRun.stage='maze';mineRun.floor=4;generateMap(8)`);assert.equal(run('objState'),'MINE_ESCORT');assert.ok(run('mineRail.path.length')>2);
 run(`let f=worldFeatures.find(f=>f.kind==='gland');damageFeature(f,999,{isChainsaw:true},players[0]);mineRail.step=mineRail.path.length;updateCaveWorld(.1);let gate=worldFeatures.find(f=>f.kind==='queenGate');featureAction(gate,players[0]);`);
 assert.equal(run('mineSabotage.gland'),true);assert.equal(run('caveRun.pendingStage'),'arena');
 run(`updateCaveWorld(3);let q=zombies.find(z=>z.type===45);q.hp=q.maxHp*.4;q._hpPrev=q.hp;updateSpecialZombie(q,players[0],200,0,.1,100);`);assert.equal(run('q.mineDark'),true);assert.equal(run('q.airborne'),true);
 run(`let g=worldFeatures.find(f=>f.kind==='generator');featureAction(g,players[0]);updateSpecialZombie(q,players[0],200,0,.1,100);q.hp=0;zombieDown(q,players[0]);let reward=worldFeatures.find(f=>f.kind==='queenReward');featureAction(reward,players[0]);`);
 assert.equal(run('objState'),'MINE_COLLAPSE_RUN');assert.equal(run('queenSlain'),true);
 run(`players[0].x=2000;players[0].y=500;updateCaveWorld(.1)`);assert.equal(run('cartRun.bossDead'),true);assert.equal(run('zombies.some(z=>z.type===45)'),false);
});
test('host authorizes reload and rail commands by peer identity and distance',()=>{
 const {run}=active();run(`NET.mode='host';players.push(new Player(2,2000,2000,'#fff'));for(let p of players){p.weapon={...WEAPON_TYPES.AR};magazineInit(p);p.weapon.mag=5;}netOnData({t:'reload',pid:1},{pid:2})`);
 assert.equal(run('players[0].reloadT||0'),0);assert.ok(run('players[1].reloadT')>0);
 run(`let s=addFeature('switch',2500,2500);netOnData({t:'feature',id:s.id},{pid:2})`);assert.equal(run('s.branch'),undefined);
 run('players[1].x=s.x;players[1].y=s.y;netOnData({t:"feature",id:s.id},{pid:2})');assert.equal(run('s.branch'),'short');
});
test('full snapshots preserve supply, training, POIs and mine state for guests',()=>{
 const host=active(),guest=game();host.run(`base.food=47;base.house=5;base.trainHp=7;base.trainSpd=10;base.trainDmg=4;players[0].weapon={...WEAPON_TYPES.SMG};magazineInit(players[0]);players[0].weapon.mag=7;let f=addFeature('signal',2000,2000);f.hits=new Set();mineEscape={time:1,wave:2,front:3200};`);
 const snapshot=host.run('JSON.stringify(netBuildSnapshot(true))');guest.run(`NET.mode='guest';netApplySnapshot(${snapshot})`);
 assert.equal(guest.run('players[0].weapon.mag'),7);assert.equal(guest.run('base.trainSpd'),10);assert.equal(guest.run('base.food'),47);assert.equal(guest.run('worldFeatures[0].kind'),'signal');assert.equal(guest.run('mineEscape.front'),3200);
});
