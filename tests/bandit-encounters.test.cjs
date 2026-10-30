const {test}=require('node:test');
const assert=require('node:assert/strict');
const {game}=require('./defense-lifesteal.test.cjs');
function encounter(level=8,map=1){let g=game();g.run(`currentLevel=${level};currentMapType=${map};gameState='PLAYING';objState='KILL';story=newStory();Math.random=()=>.3;banditEncounter={units:0,trucks:0,sources:{}};`);return g;}

test('maps 1-7 have no bandits from any constructor, guard post, truck or biome',()=>{
 const {run}=encounter(7);
 for(const map of [1,4,5,6,7,8,9,11,12,13,15,16]){
  run(`{currentMapType=${map};story.lab={stage:'c4'};worldFeatures=[];zombies=[];setupBiome();genBanditTown(7);let op=outposts[0];if(op)op.update(5);spawnBanditTruck(2000,2000);for(let t=60;t<=67;t++)zombies.push(new Zombie(2000,2000,t));}`);
  assert.equal(run('zombies.some(isBandit)'),false,`map type ${map}`);assert.equal(run('banditTrucks.length'),0);
 }
});
test('map 8 enables small fixed guards; repeated setup commands do not duplicate a squad',()=>{
 const {run}=encounter();run(`let first=spawnBanditSquad(2200,2200,[60,61],'tower',true);let again=spawnBanditSquad(2200,2200,[60,61],'tower',true)`);
 assert.equal(run('first.length'),2);assert.equal(run('again.length'),0);assert.equal(run('zombies.length'),2);assert.equal(run('zombies.every(z=>z.postX===2200)'),true);
});
test('ambient roster and random spawns never produce human bandits, including bandit town',()=>{
 const {run}=encounter(20);
 for(const map of [1,5,8,13]){
  run(`currentMapType=${map};buildMapRoster();zombies=[];for(let i=0;i<250;i++)zombies.push(new Zombie(500,500,-1))`);
  assert.equal(run('zombies.some(isBandit)'),false);
 }
});
test('outposts seed once and never refill after their entire garrison is killed',()=>{
 const {run}=encounter();run(`let op=new Outpost(2200,2200);op.update(3);let count=zombies.length;zombies=[];for(let i=0;i<600;i++)op.update(1)`);
 assert.equal(run('count'),3);assert.equal(run('zombies.length'),0);
});
test('one convoy unloads four humans and does not return over ten minutes',()=>{
 const {run}=encounter();run(`banditConvoyT=0;for(let i=0;i<600;i++)tickBanditWorld(1)`);
 assert.equal(run('banditEncounter.trucks'),1);assert.equal(run('banditEncounter.units'),4);assert.equal(run('banditTrucks.length'),0);
 run(`spawnBanditTruck(2000,2000,'another');tickBanditWorld(1)`);assert.equal(run('banditEncounter.units'),4);
});
test('signal, leader and extraction requests share the same persistent per-map cap',()=>{
 const {run}=encounter();run(`spawnBanditTruck(2000,2000,'signal');banditTrucks=[];for(let i=0;i<30;i++){spawnBanditTruck(2000,2000,'leader:'+i);spawnBanditTruck(2000,2000,'extraction',false);}`);
 assert.equal(run('banditEncounter.trucks'),1);
 run(`for(let i=0;i<50;i++)spawnBanditSquad(2200,2200,[60,61,62],'post:'+i,true)`);assert.equal(run('banditEncounter.units'),10);
});
test('dedicated encounters still have finite budgets and early defense waves are zombies',()=>{
 const {run}=encounter(10,16);run(`for(let i=0;i<30;i++)spawnBanditSquad(2200,2200,[61,62,63,64],'wave:'+i)`);assert.equal(run('banditEncounter.units'),24);
 run(`currentLevel=5;genBaseDefense(5)`);assert.equal(run('base.def.kind'),'zombie');
});
test('guards return to their post instead of chasing players across the map',()=>{
 const {run}=encounter();run(`players[0].x=3900;players[0].y=3900;let guard=spawnBanditSquad(1000,1000,[61],'post',true)[0];guard.x=1700;guard.y=1000;NAV.n=100;NAV.cs=40;navRebuild();let before=guard.x;guard.update(.1)`);
 assert.ok(run('guard.x')<run('before'));
});
test('guest clients cannot create encounter units or convoys',()=>{
 const {run}=encounter();run(`NET.mode='guest';spawnBanditSquad(2000,2000,[61],'spoof');spawnBanditTruck(2000,2000)`);assert.equal(run('zombies.length'),0);assert.equal(run('banditTrucks.length'),0);
});
