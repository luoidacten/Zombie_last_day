const {test}=require('node:test');
const assert=require('node:assert/strict');
const {game}=require('./defense-lifesteal.test.cjs');
function expedition(map=3,diff='hell',seed=71,type='TOWERS'){
 const g=game();g.run(`gameState='PLAYING';story=newStory();currentLevel=6;currentMapType=${map};difficulty='${diff}';objState='${type}';Math.random=fieldRng(${seed});setupMission('${type}',6);generateFieldMap(6);`);return g;
}
test('ordinary map entry doubles dimensions; scripted arenas and camp reset navigation',()=>{
 const {run}=game();run(`gameState='PLAYING';story=newStory();currentLevel=6;nextMapPreference=2;nextMissionPreference='TOWERS';generateMap(6)`);
 assert.equal(run('fieldActive()&&MAP_SIZE.w===8000&&NAV.n===100&&NAV.field.length===10000'),true);
 run(`nextMapPreference=4;generateMap(6)`);assert.equal(run('MAP_SIZE.w===4000&&NAV.n===50&&!fieldWorld'),true);
 run(`setWorldSize(8000);enterHub()`);assert.equal(run('MAP_SIZE.w'),4000);
});
test('difficulty selects 1–6 distant towers, survival lasts 30–120 seconds',()=>{
 const {run}=game();for(const [d,lo,hi,seconds]of [['easy',1,2,30],['normal',2,4,60],['hard',3,5,90],['hell',4,6,120]]){
  run(`difficulty='${d}';Math.random=()=>0;setupMission('TOWERS',6)`);assert.equal(run('mission.required'),lo);
  run(`Math.random=()=>.999;setupMission('TOWERS',6)`);assert.equal(run('mission.required'),hi);
  run(`setupMission('SURVIVAL',6)`);assert.equal(run('mission.required'),seconds);
 }
});
test('purchased mines and rescue flare retain their effects in chunk expeditions',()=>{
 const {run}=expedition(2);run(`shopFlags.mines=5;shopFlags.flare=true;setupMission('RESCUE',6);generateFieldMap(6)`);
 assert.equal(run('hazards.filter(h=>h.type===\'mine\'&&h.friendly).length'),5);assert.equal(run('shopFlags.mines'),0);
 assert.equal(run('rescueNPCs.every(n=>Math.abs(n.x-4000)<=1100&&Math.abs(n.y-4000)<=1100&&!isBlockedPoint(n.x,n.y,20))'),true);
});
test('all objectives and landing pads stay reachable after loading every chunk, across river/forest/snow seeds',()=>{
 const {run}=expedition();for(let seed=1;seed<=12;seed++){
  run(`resetFieldWorld();currentMapType=${[3,2,17][seed%3]};objState='TOWERS';Math.random=fieldRng(${seed*1337});setupMission('TOWERS',6);mission.required=6;generateFieldMap(6);for(let x=0;x<8;x++)for(let y=0;y<8;y++)loadFieldChunk(x,y);navRebuild();navUpdate(0);`);
  assert.equal(run('towers.every(t=>!isBlockedPoint(t.x,t.y,20)&&NAV.field[navOpenIdx(t.x,t.y)]>=0)'),true,'objectives seed '+seed);
  assert.equal(run('towers.every((a,i)=>towers.every((b,j)=>i===j||Math.hypot(a.x-b.x,a.y-b.y)>=1450))'),true);
  run('var pad=pickLandingSite();navUpdate(0)');assert.equal(run('!isBlockedPoint(pad.x,pad.y,100)&&NAV.field[navOpenIdx(pad.x,pad.y)]>=0'),true,'pad seed '+seed);
  run('pad=null');
 }
});
test('chunks open around each teammate; tower positions stay hidden until found or delayed hint',()=>{
 const {run}=expedition();assert.equal(run('fieldWorld.loaded.length<64&&towers.every(t=>!fieldTowerKnown(t))'),true);
 run(`let t=towers[0];players.push(new Player(2,t.x,t.y,'#fff'));updateFieldWorld(.3)`);assert.equal(run('fieldTowerKnown(t)'),true);
 run(`fieldWorld.idle=91;updateFieldWorld(.3)`);assert.equal(run('fieldWorld.hint>=0&&fieldTowerKnown(towers[fieldWorld.hint])'),true);
 run('let n=fieldWorld.loaded.length;updateFieldWorld(.3)');assert.equal(run('fieldWorld.loaded.length'),run('n'));
});
test('rivers allow crossing every bridge, block both banks elsewhere and prevent leaving deck sideways',()=>{
 const {run}=expedition();run('obstacles=[]');assert.equal(run('riverWorld.bridges.length'),4);
 assert.equal(run(`riverWorld.bridges.every(b=>{let c=riverCenter(b);for(let x=c-400;x<=c+400;x+=20)if(fieldTerrainBlocked(x,b,18))return false;return true;})`),true);
 run(`let b=riverWorld.bridges[1],c=riverCenter(b),p=players[0];p.x=c;p.y=b;resolveCollision(p);let safe=[p.x,p.y];p.y=b+riverWorld.deck;resolveCollision(p);`);
 assert.equal(run('p.x===safe[0]&&p.y===safe[1]&&!isBlockedPoint(p.x,p.y,p.radius)'),true);
 assert.equal(run('fieldTerrainBlocked(riverCenter(b+500),b+500,18)'),true);
 run(`resetFieldWorld();currentMapType=3;setupLegacyBridges();obstacles=[]`);
 assert.equal(run(`riverWorld.bridges.length===3&&riverWorld.bridges.every(b=>{for(let y=1600;y<=2400;y+=20)if(fieldTerrainBlocked(b,y,18))return false;return true;})`),true);
});
test('large cliffs and dense woodland block movement while organic boundary rejects square corners',()=>{
 const {run}=expedition(2);run('for(let x=0;x<8;x++)for(let y=0;y<8;y++)loadFieldChunk(x,y)');
 assert.equal(run(`obstacles.some(o=>o.type==='forestwall')&&obstacles.some(o=>o.type==='cave')`),true);
 assert.equal(run(`obstacles.filter(o=>o.type==='forestwall'||o.type==='cave').every(o=>isBlockedPoint(o.x+o.w/2,o.y+o.h/2,16))`),true);
 assert.equal(run('fieldTerrainBlocked(500,500,18)&&!fieldTerrainBlocked(4000,4000,18)'),true);
 run(`{let o=obstacles.find(o=>o.type==='forestwall'),p=players[0];p.x=o.x+o.w*.5;p.y=o.y+o.h*.5;resolveCollision(p);}`);
 assert.equal(run('!isBlockedPoint(players[0].x,players[0].y,players[0].radius-.01)'),true);
});
test('ground enemies and rescued NPCs route across bridges while ranged sight remains clear',()=>{
 const {run}=game();run(`currentMapType=3;objState='RESCUE';gameState='PLAYING';riverWorld={axis:'horizontal',base:2000,width:500,deck:180,bend:0,phase:0,bridges:[800,2000,3200]};obstacles=[];let p=players[0];p.x=1400;p.y=1700;let z=new Zombie(1400,2280,0);navRebuild();navUpdate(0);`);
 assert.equal(run('hasLineOfSight(z.x,z.y,p.x,p.y)&&!fieldWalkClear(z.x,z.y,p.x,p.y)'),true);
 assert.ok(run('Math.abs(Math.cos(caveSteer(z,p,-Math.PI/2,580)))')>.1);
 run(`let n=new RescueNPC(1400,2280);n.rescued=true;rescueMission.heliArrived=true;evacZone={x:1400,y:1700};zombies=[];for(let i=0;i<600;i++)n.update(.05)`);
 assert.equal(run('Math.hypot(n.x-evacZone.x,n.y-evacZone.y)<100&&!fieldTerrainBlocked(n.x,n.y,n.radius)'),true);
});
test('NPCs cross each curved river bridge and reach the opposite bank without cutting a rail corner',()=>{
 const {run}=expedition();run('obstacles=[];navRebuild();zombies=[];rescueMission.heliArrived=true;');
 for(let i=0;i<4;i++){
  run(`{let b=riverWorld.bridges[${i}],c=riverCenter(b);globalThis.bridgeNpc=new RescueNPC(c-450,b-150);bridgeNpc.rescued=true;evacZone={x:c+450,y:b+150};for(let j=0;j<600;j++)bridgeNpc.update(.05);}`);
  assert.equal(run('Math.hypot(bridgeNpc.x-evacZone.x,bridgeNpc.y-evacZone.y)<100&&!fieldTerrainBlocked(bridgeNpc.x,bridgeNpc.y,bridgeNpc.radius)'),true,'bridge '+i);
 }
});
test('ordinary spawns are reduced; survival and delayed hints increase pressure with bounded population',()=>{
 const {run}=expedition(2);let normal=run('fieldSpawnPlan(10,2).count');run(`mission.type='SURVIVAL'`);assert.ok(run('fieldSpawnPlan(10,2).count')>normal);assert.ok(run('fieldSpawnPlan(10,2).rate')<2);
 run('zombies=Array.from({length:145},()=>({hp:1}))');assert.equal(run('fieldSpawnPlan(10,2).count'),0);
 run(`zombies=[];mission.type='TOWERS';fieldWorld.idle=91`);assert.ok(run('fieldSpawnPlan(10,2).count')>normal);
});
test('survival completes and evacuation picks fresh hidden reachable locations with minimum 15 second notice',()=>{
 const {run}=expedition(2,'easy',5,'SURVIVAL');run('updateMission(29)');assert.equal(run('mission.complete'),false);
 run('updateMission(1)');assert.equal(run('mission.complete&&objState===\'WAITING\''),true);
 assert.equal(run('evacTimer>=15&&!isBlockedPoint(evacZone.x,evacZone.y,100)'),true);
 assert.equal(run('landingKnown()'),run('evacTimer<=15'));
 run('let first=[evacZone.x,evacZone.y];announceLanding();announceLanding()');assert.equal(run('landingKnown()'),true);
 run(`objState='KILL';beginEvacCountdown()`);assert.equal(run('evacZone.x!==first[0]||evacZone.y!==first[1]'),true);
 run(`objState='KILL';players[0].tags['TRỰC THĂNG']=5;players[0].perks.p_yemTro=true;currentWeather=4;beginEvacCountdown()`);assert.ok(run('evacTimer')>=15);
});
test('fire and acid permanently suppress reanimation, while ordinary damage still permits it',()=>{
 const {run}=game();run(`currentLevel=8;objState='KILL';let z=new Zombie(1000,1000,11);z.hp=0;zombieDown(z,players[0])`);assert.equal(run('z.hasRevived'),true);
 for(const id of ['BURN','CORROSION']){
  run(`z=new Zombie(1000,1000,11);applyStatus(z,STATUS.${id},{duration:.1});updateStatusEffects(z,.2);z.hp=0;zombieDown(z,players[0])`);
  assert.equal(run('z.hp<=0&&!z.hasRevived&&z.noReanimate'),true);
 }
 run(`z=new Zombie(1000,1000,11);calcDamage(999,{isFire:true},z.x,z.y,players[0],z);z.hp=0;zombieDown(z,players[0])`);assert.equal(run('!!z._credited'),true);
});
test('sterilized bandits cannot be revived by medics or mutate after being bitten',()=>{
 const {run}=game();run(`currentLevel=8;objState='KILL';story=newStory();let z=new Zombie(2100,2000,60),m=new Zombie(2150,2000,66);zombies=[z,m];applyStatus(z,STATUS.CORROSION);z.hp=0;z.lastHitFaction='zombie';zombieDown(z,players[0])`);
 assert.equal(run('z.hp<=0&&!z.banditDown&&!zombies.some(q=>q.infectedBandit)'),true);
 run(`z=new Zombie(2100,2000,60);zombies=[z,m];z.hp=1;z.banditDown=true;z.noReanimate=true;m.update(.2)`);assert.equal(run('z.banditDown&&!z.revived'),true);
});
test('queen airborne HP is protected; hits remove armor and hasten landing; broken armor gives double damage and half armor on takeoff',()=>{
 const {run}=game();run(`currentMapType=14;objState='QUEEN_BOSS';let q=new Zombie(2000,2000,45);q.mineRework=true;let full=q.hp;q.hp-=100;antDamageFilter(q)`);
 assert.equal(run('q.hp'),run('full'));assert.equal(run('q.flightArmor'),run('q.flightArmorMax-100'));assert.ok(run('q.flightT')<14);
 run('q.hp-=q.flightArmor;antDamageFilter(q)');assert.equal(run('!q.airborne&&q.flightWeak&&q.groundT===7'),true);
 run('q.hp-=100;antDamageFilter(q)');assert.equal(run('q.hp'),run('full-200'));
 run('queenFlightPhase(q,players[0],400,0,7.1)');assert.equal(run('q.airborne&&q.flightArmor===q.flightArmorMax*.5'),true);
 run('queenFlightPhase(q,players[0],400,0,14.1)');assert.equal(run('!q.airborne&&!q.flightWeak&&q.groundT===4'),true);
 run('q.hp=1;antDamageFilter(q)');assert.equal(run('q.hp'),run('q.maxHp*.45'));
});
test('Hucker gets a large enclosed arena; more ants spawn for a multiplayer Queen',()=>{
 const {run}=game();run(`story=newStory();let h=new Zombie(2000,2000,37);zombies=[h];makeBossArena(h,2000,2000,640)`);assert.ok(run('story.arena.r')>=1350);assert.ok(run('obstacles.filter(o=>o.arena).length')>60);
 run(`story=newStory();obstacles=[];currentMapType=14;caveRun.arena={x:2000,y:2000,r:740};players=Array.from({length:4},(_,i)=>new Player(i+1,2000,2300,'#fff'));let q=new Zombie(2000,2000,45);zombies=[q];q.antsT=0;queenFlightPhase(q,players[0],300,0,.1)`);assert.equal(run('zombies.filter(z=>z.type>=40&&z.type<=43).length'),7);
});
test('snow cold accumulates, warmth thaws, frost stacks freeze briefly and has a grace window',()=>{
 const {run}=expedition(17);run(`let p=players[0];p.x=3400;p.y=3800;p.perks.invulnTimer=999;p.cold=99.99;p.update(.1)`);assert.equal(run('!!getStatus(p,STATUS.FROZEN)'),true);
 run(`p.x=4000;p.y=4200;let before=p.cold;p.update(.1)`);assert.ok(run('p.cold')<run('before'));assert.equal(run('!!getStatus(p,STATUS.FROZEN)'),false);
 run(`p.frostGrace=0;applyPlayerStatus(p,STATUS.FROST,{stacks:4})`);assert.ok(run('getStatusMoveMult(p)')<1);
 run(`applyPlayerStatus(p,STATUS.FROST,{stacks:1})`);assert.equal(run('getStatusMoveMult(p)'),0);
 run(`delete p.status.frozen;applyPlayerStatus(p,STATUS.FROZEN)`);assert.equal(run('!!getStatus(p,STATUS.FROZEN)'),false);
 run('buildMapRoster()');assert.equal(run('mapRoster.includes(55)&&mapRoster.includes(56)&&mapRoster.includes(57)'),true);
});
test('host map and chunk snapshots synchronize river collision, objectives, cold and queen armor to guests',()=>{
 const host=expedition(),guest=game();host.run(`let packet;netSend=p=>packet=p;netSendMap()`);const header=host.run('JSON.stringify(packet)');guest.run(`NET.mode='guest';netApplyMap(${header})`);
 host.run(`players[0].x=towers[0].x;players[0].y=towers[0].y;updateFieldWorld(.3);players[0].cold=64;let q=new Zombie(players[0].x,players[0].y+200,45);queenFlightInit(q);q.flightArmor*=.3;zombies=[q];hazards=[{type:'snowwarn',x:q.x,y:q.y,radius:180,timer:.5,life:.9}];enemyBullets=[new EnemyBullet(q.x,q.y,q.x+100,q.y,'ice')]`);
 const snap=host.run('JSON.stringify(netBuildSnapshot(true))');guest.run(`netApplySnapshot(${snap})`);
 assert.equal(guest.run('MAP_SIZE.w===8000&&NAV.n===100&&fieldWorld.known.includes(0)&&players[0].cold===64'),true);
 assert.equal(guest.run('riverWorld.bridges.length'),4);assert.equal(guest.run('hazards[0].type'),'snowwarn');assert.equal(guest.run('enemyBullets[0].type'),'ice');assert.equal(guest.run('zombies[0].flightArmor'),30);
 assert.equal(guest.run('fieldWorld.loaded.length'),host.run('fieldWorld.loaded.length'));
 assert.equal(guest.run('obstacles.length'),host.run('obstacles.length'));
});
