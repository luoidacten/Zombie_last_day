const {test}=require('node:test'),assert=require('node:assert/strict');
const {game}=require('./defense-lifesteal.test.cjs');
function setup(){let g=game();g.run(`currentLevel=8;gameState='PLAYING';objState='KILL';difficulty='normal';Math.random=()=>.99;let p=players[0];`);return g;}

test('boss direct hits gain 20%; warned heavy hits and DOT gain 80% exactly once',()=>{
 const {run}=setup();run(`p.maxHp=p.hp=1000;p.takeDamage(400);let normal=1000-p.hp;
     p.hp=1000;p.takeDamage(400,{boss:true});let body=1000-p.hp;
     p.hp=1000;withDamageContext({boss:true,heavy:true},()=>p.takeDamage(400));let heavy=1000-p.hp;`);
 assert.ok(Math.abs(run('body/normal')-1.2)<1e-8);
 assert.ok(Math.abs(run('heavy/normal')-1.8)<1e-8);
 run(`p.hp=1000;p.takeDot(10,{boss:true,heavy:true})`);assert.equal(run('p.hp'),982);
 run(`p.hp=1000;p.takeDot(10)`);assert.equal(run('p.hp'),990);
});

test('warned boss hazards wait for their warning and let players escape the area',()=>{
 for(let type of ['quake','strike','artillery','emp','acidbomb','hrock','lancefall','plunge'])for(let dodge of [false,true]){
  const {run}=setup();run(`p.maxHp=p.hp=1000;hazards=[{type:'${type}',x:p.x,y:p.y,radius:100,timer:1,t0:1,life:1.4,dmg:40,boss:true,telegraphed:true}];
      for(let i=0;i<9;i++){updateHazards(.1);updateCaveHazards(.1);updateStoryHazards(.1);updateBossExtras(.1);}`);
  assert.equal(run('p.hp'),1000,`${type} hits before the warning ends`);
  if(dodge)run('p.x+=400;p.y+=400');
  run('updateHazards(.11);updateCaveHazards(.11);updateStoryHazards(.11);updateBossExtras(.11)');
  if(dodge)assert.equal(run('p.hp'),1000,`${type} should miss outside the warning area`);
  else assert.ok(run('p.hp')<900,`${type} should punish ignoring the warning`);
 }
});

test('all eight boss AIs retain a heavy damage source for their warned skills',()=>{
 for(let [type,skill,want]of [[30,'slam','quake'],[31,'emp','emp'],[32,'artillery','artillery'],[35,'strikes','strike'],[36,'rain','strike'],[37,'spin','hspin'],[45,'acid','acidbomb'],[50,'harvest','d_arc']]){
  const {run}=setup();run(`currentMapType=1;story.arena={x:2000,y:2000,r:1350};p.x=2600;
      let z=new Zombie(2000,2000,${type});z.spCD=0;z.atkCD=100;if(z.type===36){z.zStop=1;z.zAtk=true;}zombies=[z];pickBossSkill=()=> '${skill}';
      updateSpecialZombie(z,p,600,0,.01,100);let h=hazards.find(h=>h.type==='${want}');`);
  assert.equal(run('!!h'),true,`boss ${type} should emit ${want}`);
  assert.equal(run('bossHazardContext(h).boss&&bossHazardContext(h).heavy'),true,`boss ${type} needs heavy skill damage`);
  assert.ok(run('h.timer')>0,`boss ${type} needs a warning before impact`);
 }
});

test('explosion tags cannot erase a boss blast or enlarge its warning area',()=>{
 const {run}=setup();run(`p.maxHp=p.hp=1000;p.tags['NỔ']=6;
     hazards=[{type:'artillery',x:p.x,y:p.y,radius:100,timer:0,life:.5,dmg:100,boss:true,telegraphed:true}];updateHazards(.01);let damage=1000-p.hp;`);
 assert.ok(run('damage')>500);
 run(`p.hp=1000;p.x=2120;p.y=2000;hazards=[{type:'artillery',x:2000,y:2000,radius:100,timer:0,life:.5,dmg:100,boss:true,telegraphed:true}];updateHazards(.01)`);
 assert.equal(run('p.hp'),1000);
 // Ordinary self-explosions still use the player's explosion resistance.
 run(`p.x=2000;explode(2000,2000,100,100,p,false)`);assert.equal(run('p.hp'),1000);
});

test('Hucker spin keeps its boss object and remains finite after the source marker is applied',()=>{
 const {run}=setup();run(`currentMapType=15;story.arena={x:2000,y:2000,r:1350};p.x=2600;
     let z=new Zombie(2000,2000,37);z.spCD=0;z.atkCD=100;zombies=[z];pickBossSkill=()=> 'spin';
     updateSpecialZombie(z,p,600,0,.01,100);let h=hazards.find(h=>h.type==='hspin');`);
 assert.equal(run('h.boss===z'),true);assert.equal(run('h.telegraphed'),true);
 run(`updateSpin(h,.1)`);assert.equal(run('Number.isFinite(h.x)&&Number.isFinite(h.y)'),true);
 let snapshot=run('JSON.stringify(netBuildSnapshot(true))');assert.ok(snapshot.length>0);
});

test('after the Queen dies, walking escape never spawns pursuers and cart has no clinging ants',()=>{
 const {run}=setup();run(`currentMapType=14;startMineCollapse();p.perks.invulnTimer=9999;
     for(let i=0;i<200;i++){updateCaveWorld(.1);updateHazards(.1);}
     let walkingCount=zombies.length;p.x=2000;p.y=500;updateCaveWorld(.1);cartRun.stage='race';
     let c=cartRun.carts[0];c.spawn=999;c.gap=85;c.ants=4;for(let i=0;i<200;i++)tickMinecart(.1);`);
 assert.equal(run('walkingCount'),0);assert.equal(run('cartRun.bossDead'),true);
 assert.equal(run('zombies.length'),0);assert.equal(run('c.ants'),0);assert.equal(run('c.hp'),100);
 let labels=JSON.parse(run(`JSON.stringify((()=>{let labels=[],old=outlinedText;outlinedText=t=>labels.push(t);drawMinecart();outlinedText=old;return labels;})())`));
 assert.ok(labels.some(t=>t.includes('HẦM ĐANG SẬP')));
 assert.equal(labels.some(t=>/KIẾN/.test(t)),false);
});

test('radar partner shoots rubble after the Queen dies; a collapsing ceiling must still be dodged',()=>{
 const {run}=setup();run(`players.push(new Player(2,2000,2000,'#fff'));startMinecart(true);cartRun.stage='race';let c=cartRun.carts[0];
     let rock={row:1,lane:c.lane,type:'rubble',eta:1};c.hazards=[rock];cartCommand(2,'fire');`);
 assert.equal(run('rock.cleared||false'),false);
 run(`c.shotCD=0;cartCommand(2,'fire')`);assert.equal(run('rock.cleared'),true);
 run(`let ceiling={row:2,lane:c.lane,type:'collapse',eta:1};c.hazards=[ceiling];for(let i=0;i<5;i++){c.shotCD=0;cartCommand(2,'fire')}`);
 assert.equal(run('ceiling.cleared||false'),false);
});
