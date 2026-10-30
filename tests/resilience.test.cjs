const {test}=require('node:test'),assert=require('node:assert/strict');
const {game}=require('./defense-lifesteal.test.cjs');
function setup(){const g=game();g.run(`currentLevel=8;gameState='PLAYING';objState='KILL';Math.random=()=>.9;let p=players[0];`);return g;}
test('new resilience cards have valid tags and can be selected only once',()=>{
 const {run}=setup();
 for(let id of ['vh_reservoir','vh_harvest','vh_recovery','dr_veil','dr_laststand','dr_aftershock']){
  run(`let card_${id}=UPGRADES.find(u=>u.id==='${id}')`);
  assert.equal(run(`card_${id}.tags.every(t=>!!TAG_DEFS[t])`),true);
  assert.equal(run(`canOfferUpgrade(p,card_${id})`),true);run(`applyUpgrade(p,'${id}')`);assert.equal(run(`canOfferUpgrade(p,card_${id})`),false);
 }
});
test('shield capacity, kill gain and harvest cooldown respect caps and exclude offerings',()=>{
 const {run}=setup();run(`applyUpgrade(p,'vh_reservoir');applyUpgrade(p,'vh_harvest')`);assert.equal(run('p.getMaxVHp()'),40);
 run(`p.onKill(0);p.onKill(0)`);assert.equal(run('p.vHp'),1);
 run(`resilienceTick(p,1);p.onKill(51)`);assert.equal(run('p.vHp'),1);
 run(`p.onKill(0)`);assert.equal(run('p.vHp'),2);
 run(`p.addVirtualHp(9999)`);assert.equal(run('p.vHp'),4);
 run(`p.addVirtualHp(9999,{grant:true})`);assert.equal(run('p.vHp'),40);
 run(`p.isDowned=true;p.onKill(0)`);assert.equal(run('p.vHp'),40);
});
test('shield regeneration waits six seconds, stops after a hit and takes the strongest source',()=>{
 const {run}=setup();run(`p.perks.vh_recovery=true;p.noHitT=4;p.update(.2)`);assert.equal(run('p.vHp'),0);
 run(`p.noHitT=5;p.update(1)`);assert.equal(run('p.vHp'),1);
 run(`p.takeDot(1);let shield=p.vHp;p.update(.2)`);assert.equal(run('p.vHp'),run('shield'));
 run(`p.noHitT=6;for(let i=0;i<300;i++)p.update(.1)`);assert.equal(run('p.vHp'),15);
 run(`p.perks.df_aegis=true;for(let i=0;i<300;i++)p.update(.1)`);assert.equal(run('p.vHp'),20);
});
test('conditional reduction applies to hits and DOT; shield break protects subsequent damage only',()=>{
 const {run}=setup();run(`p.perks.dr_veil=true;p.vHp=25;p.takeDot(10)`);assert.ok(Math.abs(run('p.vHp')-15.6)<1e-8);
 run(`p.perks.dr_veil=false;p.perks.dr_aftershock=true;p.vHp=5;p.takeDot(10)`);assert.equal(run('p.hp'),95);assert.equal(run('p.perks.rhBreakT'),4);assert.equal(run('p.perks.rhBreakCD'),12);
 run(`p.takeDot(10)`);assert.equal(run('p.hp'),86);
 run(`resilienceTick(p,4);p.takeDot(10)`);assert.equal(run('p.hp'),76);
 run(`p.vHp=1;p.takeDot(2)`);assert.equal(run('p.perks.rhBreakT'),0);
 run(`resilienceTick(p,8);p.vHp=1;p.takeDot(2)`);assert.equal(run('p.perks.rhBreakT'),4);
 run(`p.perks.rhBreakT=0;p.perks.dr_laststand=true;p.hp=35;p.takeDot(10)`);assert.equal(run('p.hp'),26);
 run(`p.hp=100;p.vHp=5;p.tempShield=1;p.perks.rhBreakT=0;p.perks.rhBreakCD=0;p.takeDamage(20)`);assert.equal(run('p.perks.rhBreakT'),0);assert.equal(run('p.vHp'),5);
});

test('new perk flags and cooldowns survive save and host-to-guest upgrade sync',()=>{
 const {run}=setup();run(`p.perks.dr_aftershock=true;p.perks.rhBreakT=3;p.perks.rhBreakCD=11;p.perks.vh_reservoir=true;let saved=savePlayer(p);let packet={gs:'PLAYING',lvl:8,pl:[{tags:p.tags,perks:JSON.parse(JSON.stringify(p.perks)),pend:0}],cf:[1]};players=[new Player(1,0,0,'#fff')];NET.mode='guest';NET.localIdx=0;netApplySync(packet)`);
 assert.equal(run('saved.perks.vh_reservoir'),true);assert.equal(run('players[0].perks.rhBreakT'),3);assert.equal(run('players[0].perks.rhBreakCD'),11);
});
test('reload guns gain base damage and ammo while magazine sizes stay explicit; legacy capacity migrates once',()=>{
 const {run}=setup();
 for(let [key,damage,ammo,mag]of [['PISTOL',175,84,12],['SMG',28,360,30],['AR',80,200,25],['SHOTGUN',240,72,6],['SNIPER',440,35,5],['GLAUNCHER',155,14,1]]){
  run(`p.weapon={...WEAPON_TYPES.${key}};magazineInit(p)`);assert.equal(run('p.weapon.dmg'),damage);assert.equal(run('p.weapon.ammo'),ammo);assert.equal(run('p.weapon.magSize'),mag);
 }
 assert.equal(run(`restoredAmmoCapacity({k:'SMG',m:480})`),720);
 assert.equal(run(`restoredAmmoCapacity({k:'SMG',m:720,bv:2})`),720);
 assert.equal(run(`restoredAmmoCapacity({k:'AR'})`),200);
 assert.equal(run(`restoredAmmoCapacity({k:'KATANA',m:500})`),500);
 run(`p.weapon={...WEAPON_TYPES.SMG,ammo:30};let savedWeapon=savePlayer(p).w`);assert.equal(run('savedWeapon.bv'),2);assert.equal(run('savedWeapon.a'),30);
});
test('chainsaw uses its own attack and material impact FX without repeated damage or unbounded effects',()=>{
 const {run}=setup();run(`p.weapon={...WEAPON_TYPES.CHAINSAW};let z=new Zombie(p.x+60,p.y,0);z.hp=z.maxHp=9999;zombies=[z];vfxList=[];let slash=new Slash(p.x,p.y,0,p.weapon,p);slash.update(.01,p.x,p.y);let after=z.hp;slash.update(.01,p.x,p.y)`);
 assert.equal(run('z.hp'),run('after'));assert.ok(run('after')<9999);
 assert.equal(run(`vfxList.filter(v=>v.type==='saw_swing').length`),1);assert.equal(run(`vfxList.some(v=>v.type==='sweep')`),false);
 assert.equal(run(`vfxList.find(v=>v.type==='saw_impact').material`),'flesh');
 run(`p.sawFxNext=0;sawImpactFx(p,z,'metal');for(let i=0;i<1000;i++)sawImpactFx(p,z,'metal')`);
 assert.equal(run(`vfxList.filter(v=>v.type==='saw_impact').length`),2);
 run(`p.sawFxNext=0;vfxList=Array.from({length:220},()=>({type:'text',life:1}));sawImpactFx(p,z,'metal');sawSwingFx(0,0,0,100,p)`);assert.equal(run('vfxList.length'),220);
 run(`vfxList=[];sawSwingFx(0,0,0,100,p);p.sawFxNext=0;sawImpactFx(p,z,'flesh');updateFx(.5)`);assert.equal(run(`vfxList.some(v=>v.type.startsWith('saw_'))`),false);
});
test('chainsaw animations and dedicated FX reach guests through the existing snapshot',()=>{
 const {run}=setup();run(`NET.mode='host';p.weapon={...WEAPON_TYPES.CHAINSAW};p.sawRpm=.25;p.sawContact=1.3;p.sawRage=5;p.sawDash=.4;let slash=new Slash(p.x,p.y,0,p.weapon,p);let encoded=netEncodePlayer(p);let snapshot=netBuildSnapshot(true);let guest=new Player(2,0,0,'#fff');netDecodePlayer(guest,encoded,false)`);
 assert.equal(run('guest.sawRpm'),.25);assert.equal(run('guest.sawRage'),5);assert.equal(run('guest.sawDash'),.4);
 run(`guest.reloadT=2;guest.reloadW={key:'AR'};netDecodePlayer(guest,encoded,false)`);assert.equal(run('guest.reloadT'),0);assert.equal(run('guest.reloadW'),null);
 assert.equal(run(`snapshot.e.some(e=>e[0]==='v'&&e[1].type==='saw_swing')`),true);
 assert.equal(run(`snapshot.e.find(e=>e[0]==='sl')[7]`),1);
 run(`NET.mode='guest';NET.lastSeq=0;slashes=[];vfxList=[];netApplySnapshot(snapshot)`);
 assert.equal(run('slashes[0].isChainsaw'),true);assert.equal(run(`vfxList.some(v=>v.type==='saw_swing')`),true);
});
