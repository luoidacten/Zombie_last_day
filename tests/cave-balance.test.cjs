const {test}=require('node:test'),assert=require('node:assert/strict');
const {game}=require('./defense-lifesteal.test.cjs');
function setup(){let g=game();g.run(`currentLevel=8;gameState='PLAYING';objState='KILL';difficulty='normal';Math.random=fieldRng(12);let p=players[0];`);return g;}

test('repeatable heals, lifesteal and virtual HP share a bounded budget; consumables remain usable',()=>{
 const {run}=setup();
 run(`p.hp=30;p.perks.ls_overheal=true;p.tags['HÚT MÁU']=5;p.tags['HỒI MÁU']=4;
     for(let i=0;i<500;i++){p.applyLifesteal(999);p.applyHeal(999);p.addVirtualHp(999);}`);
 assert.ok(run('(p.hp-30)+p.vHp')<=6.00001);
 run(`p._recoveryClock=1;for(let i=0;i<500;i++){p.applyLifesteal(999);p.applyHeal(999);p.addVirtualHp(999);}`);
 assert.ok(run('(p.hp-30)+p.vHp')<=12.00001);
 run(`p.takeDot(1);let before=p.hp+p.vHp;p._recoveryClock+=1;for(let i=0;i<100;i++){p.applyLifesteal(999);p.applyHeal(999);p.addVirtualHp(999);}`);
 assert.ok(run('p.hp+p.vHp-before')<=1.50001);
 run('let hpBefore=p.hp;p.applyHeal(50,{consumable:true})');assert.ok(run('p.hp-hpBefore')>20);
 run('p.isDowned=true;let down=p.hp;p.applyHeal(999,{consumable:true});p.applyLifesteal(999);p.addVirtualHp(999)');assert.equal(run('p.hp'),run('down'));
});

test('heavy boss attacks penetrate stacked armor/shield and cannot be randomly parried',()=>{
 const {run}=setup();run(`Math.random=()=>0;p.weapon={...WEAPON_TYPES.KATANA};p.tags['KIẾM SƯ']=10;p.tags['MAY MẮN']=4;
     p.tags['PHÒNG THỦ']=5;p.tags['ĐẶC BIỆT']=2;p.tags['CHỈ SỐ']=4;p.armorMult=.01;
     p.perks.df_plate=true;p.perks.df_bastion=true;p.perks.df_unbreakable=true;p.perks.dr_veil=true;
     p.vHp=80;p.takeDamage(100,{boss:true,heavy:true});`);
 assert.equal(run('p.getDefenseMult()'),.4);
 assert.ok(run('p.hp')<75);assert.ok(run('p.vHp')<50);
 run(`p.hp=100;p.vHp=0;p.tempShield=1;p.takeDamage(100,{boss:true,heavy:true})`);
 assert.equal(run('p.tempShield'),0);assert.ok(run('p.hp')<=58.00001);
 run('p.hp=100;p.takeDamage(10000,{boss:true,heavy:true})');assert.equal(run('p.isDowned'),true);
});

test('standing in boss attacks loses even with full sustain; avoiding attacks allows recovery',()=>{
 const {run}=setup();run(`p.tags['HÚT MÁU']=5;p.tags['HỒI MÁU']=4;p.tags['PHÒNG THỦ']=5;p.armorMult=.2;
     for(let k of ['ls_fang','ls_overheal','ls_thirst','ls_feast','vh_reservoir','vh_recovery','df_aegis','df_plate','df_bastion','df_unbreakable','dr_veil','dr_laststand','dr_aftershock'])p.perks[k]=true;
     p.vHp=p.getMaxVHp();
     for(let i=0;i<600&&!p.isDowned;i++){p._recoveryClock=i*.1;recoveryBudget(p);p.woundT=Math.max(0,(p.woundT||0)-.1);if(i%30===0)p.takeDamage(45,{boss:true,heavy:true});p.applyLifesteal(200);p.applyHeal(100);p.addVirtualHp(100);}`);
 assert.equal(run('p.isDowned'),true);
 run(`p.isDowned=false;p.hp=30;p.vHp=0;p.woundT=0;p.noHitT=6;for(let i=0;i<100;i++){p._recoveryClock+=.1;p.applyLifesteal(100);}`);
 assert.ok(run('p.hp')>60);
});

test('boss acid and beam remain lethal; ambient acid keeps its safety floor; load clamps legacy shield',()=>{
 const {run}=setup();run('p.hp=40;acidHurt(p,100)');assert.equal(run('p.hp'),40);
 run('acidHurt(p,100,{boss:true})');assert.equal(run('p.isDowned'),true);
 run(`p.isDowned=false;p.hp=100;p.woundT=3.2;let encoded=netEncodePlayer(p),other=new Player(2,0,0,'#fff');netDecodePlayer(other,encoded,false)`);assert.equal(run('other.woundT'),3.2);
 run(`let saved=savePlayer(p);saved.vhp=999;restorePlayer(other,saved)`);assert.equal(run('other.vHp'),25);
 run(`p.hp=100;p.vHp=0;p.armorMult=.01;p.perks.df_unbreakable=true;hazards=[{type:'beam',x:p.x-200,y:p.y,angle:0,rot:0,life:1,timer:0,dmg:300}];updateHazards(.5)`);
 assert.equal(run('p.isDowned'),true);
});

test('cave navigation handles axis-aligned walls and invalidates cached routes after rebuild',()=>{
 const {run}=setup();run(`currentMapType=10;setWorldSize(4000);obstacles=[{type:'cave',x:1800,y:1800,w:200,h:200}];navRebuild();`);
 assert.equal(run('navigationWalkClear(1700,1800,2100,1800,13)'),false);
 assert.equal(run('navigationWalkClear(1700,1750,2100,1750,13)'),true);
 run(`let doc={x:1700,y:1900,radius:13};navMoveTo(doc,2100,1900,145,.1);let epoch=doc._navEpoch;obstacles=[];navRebuild();navMoveTo(doc,2100,1900,145,.1)`);
 assert.ok(run('doc._navEpoch')>run('epoch'));
});

test('boss projectile retains damage context through the projectile and legacy player hooks',()=>{
 const {run}=setup();run(`p.armorMult=.01;let shot=withDamageContext({boss:true},()=>new EnemyBullet(p.x-5,p.y,p.x,p.y,'bullet'));shot.update(.01)`);
 assert.ok(run('p.hp')<92);assert.equal(run('shot.active'),false);assert.equal(run('combatDamageContext'),null);
});

test('a TNT cart can ground the airborne mine Queen and is consumed once',()=>{
 const {run}=setup();run(`currentMapType=14;mineRun={active:true,floor:4,stage:'arena'};generateCaveMap(8);setupCaveFeatures();
     let q=zombies.find(z=>z.type===45);q.phase=2;q.mineDark=true;q.airborne=true;q.mineStun=0;
     let bomb={kind:'tntcart',x:q.x,y:q.y,r:22,hp:60,moving:true};caveProps.push(bomb);
     updateSpecialZombie(q,p,300,0,.1,100);let first=q.mineStun;updateSpecialZombie(q,p,300,0,.1,100);`);
 assert.equal(run('q.airborne'),false);assert.equal(run('bomb.hp'),0);assert.ok(run('q.mineStun')<run('first'));
});

test('Doctor reaches all C4 sites and the exit across seeded Hang Z mazes',()=>{
 for(let seed=1;seed<=8;seed++){
  const {run}=setup();run(`Math.random=fieldRng(${seed});currentMapType=10;hangZRun={active:true,floor:3,total:3,timer:210,stairs:null};generateCaveMap(8);
      obstacles=obstacles.filter(o=>o.type!=='rubble');navRebuild();let doc=caveRun.doctor;`);
  let report=JSON.parse(run(`JSON.stringify((()=>{
      let result=[];for(let goal of [...caveRun.sites,caveRun.exit]){
          let ticks=0;while(Math.hypot(goal.x-doc.x,goal.y-doc.y)>28&&ticks++<18000)navMoveTo(doc,goal.x,goal.y,200,.05);
          result.push({distance:Math.hypot(goal.x-doc.x,goal.y-doc.y),ticks});
      }return result;
  })())`));
  assert.ok(report.every(r=>r.distance<29),`seed ${seed}: ${JSON.stringify(report)}`);
 }
});

test('C4 needs an escort, escape timer follows the route and current mine objectives have guides',()=>{
 const {run}=setup();run(`currentMapType=10;hangZRun={active:true,floor:3,total:3,timer:210,stairs:null};generateCaveMap(8);let d=caveRun.doctor;d.state='plant';p.x=0;p.y=0;updateCaveWorld(1)`);
 assert.equal(run('caveRun.plant'),0);
 run('p.x=d.x;p.y=d.y;updateCaveWorld(1)');assert.ok(run('caveRun.plant')>0);
 run(`obstacles=[{type:'cave',x:1960,y:0,w:80,h:3500}];navRebuild();let shortTime=caveEscapeTime({x:2000,y:2000},{x:2080,y:2000}),longTime=caveEscapeTime({x:400,y:400},{x:3600,y:400})`);
 assert.ok(run('longTime')>run('shortTime'));
 run(`objState='MINE_ESCORT';mineRail={x:2000,y:1900};hangZRun.stairs={x:1,y:1}`);assert.equal(run('caveGuideGoal(p)===mineRail'),true);
});

test('mine walking escape has a connected route; collapse pursues and pillars delay it',()=>{
 const {run}=setup();run(`currentMapType=14;startMineCollapse();navFlood([caveRun.exit],NAV.field);let start=navOpenIdx(p.x,p.y)`);
 assert.ok(run('NAV.field[start]')>0);
 run(`let before=mineEscape.front;updateCaveWorld(1);let after=mineEscape.front;let pillar=worldFeatures.find(f=>f.kind==='pillar');damageFeature(pillar,100,{key:'PISTOL'},p)`);
 assert.ok(run('before-after')>=165);assert.equal(run('mineEscape.front-after'),150);
 // A safe route must be walkable by the actual navigator, not just connected cells.
 run(`p.hp=100;p.isDowned=false;for(let i=0;i<700&&!cartRun;i++){navMoveTo(p,2000,500,220,.05);updateCaveWorld(.05);}`);
 assert.equal(run('cartRun?.bossDead'),true);assert.equal(run('zombies.some(z=>z.type===45)'),false);
});

function cartTrial(seed,smart,crew=1,diff='normal'){
 const {run}=setup();return JSON.parse(run(`JSON.stringify((()=>{
     difficulty='${diff}';Math.random=fieldRng(${seed});players=Array.from({length:${crew}},(_,i)=>new Player(i+1,2000,2000,'#fff'));
     startMinecart(true);cartRun.stage='race';let minimum=100,failed=false;
     for(let i=0;i<1700&&!emergencyRetreat&&cartRun?.stage==='race';i++){
         if(${smart})for(let c of cartRun.carts){
             let h=c.hazards.slice().sort((a,b)=>a.eta-b.eta)[0];
             if(h&&h.eta<1.2){let group=c.hazards.filter(x=>x.row===h.row&&!x.cleared),safe=[0,1,2].filter(l=>!group.some(x=>x.lane===l)).sort((a,b)=>Math.abs(a-c.lane)-Math.abs(b-c.lane))[0];
                 if(safe!==c.lane)cartCommand(c.driver,'steer',Math.sign(safe-c.lane));}
             if(c.ants)cartCommand(c.spotter||c.driver,'fire');
             if(c.gap<38)cartCommand(c.driver,'boost');
             if(c.gap<17)cartCommand(c.spotter||c.driver,'tnt');
         }
         tickMinecart(.05);if(cartRun)minimum=Math.min(minimum,...cartRun.carts.map(c=>c.gap));
     }
     return {win:cartRun?.win||false,retreat:!!emergencyRetreat,minimum,carts:cartRun?.carts.map(c=>({hp:c.hp,charge:c.charge,tnt:c.tnt}))};
 })())`));
}
test('idle driving fails; a driver reacting within the visible warning can win on every difficulty',()=>{
 assert.equal(cartTrial(8,false).retreat,true);
 for(let diff of ['easy','normal','hard','hell'])for(let seed=1;seed<=5;seed++){
  let r=cartTrial(seed,true,seed%4+1,diff);assert.equal(r.win,true,`${diff}/${seed}: ${JSON.stringify(r)}`);
  assert.ok(r.minimum<50,'pursuit should close even while avoiding hazards');
 }
});

test('cart rows always leave an escape lane; TNT is finite and returning partner regains radar',()=>{
 const {run}=setup();run(`players.push(new Player(2,2000,2000,'#fff'));startMinecart(true);cartRun.stage='race';let c=cartRun.carts[0];
     for(let i=0;i<100;i++)cartHazardRow(c,cartRun);`);
 assert.equal(run(`c.hazards.every(h=>c.hazards.filter(x=>x.row===h.row).length<=2)`),true);
 run(`c.hazards=[];cartCommand(2,'tnt');cartCommand(2,'tnt')`);assert.equal(run('c.tnt'),0);
 run(`c.spawn=999;c.antCD=999;tickMinecart(10)`);assert.equal(run('c.tnt'),0);
 run(`players[1].netLeft=true;tickMinecart(.1)`);assert.equal(run('c.spotter'),0);
 run(`players[1].netLeft=false;tickMinecart(.1)`);assert.equal(run('c.spotter'),2);
 let host=JSON.parse(run('JSON.stringify(storyNetState())')),guest=game();guest.run(`storyNetApply(${JSON.stringify(host)})`);
 assert.equal(guest.run('cartRun.carts[0].charge'),run('c.charge'));assert.equal(guest.run('cartRun.bossDead'),true);
});
