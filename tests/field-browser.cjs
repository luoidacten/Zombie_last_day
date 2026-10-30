const {chromium}=require('playwright');
const assert=require('node:assert/strict'),path=require('node:path'),os=require('node:os');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/\[gameLoop\]|\[loop\]/.test(m.text()))errors.push(m.text());});
  await page.addInitScript(()=>localStorage.setItem('zs_tut_done','1'));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  await page.evaluate(()=>{
   startCampaign(true);loopToken++;
   window.fieldScene=function(mt,type='TOWERS'){
    NET.mode='';gameState='PLAYING';story=newStory();currentLevel=6;difficulty='easy';bossWin=null;mineRail=null;mineEscape=null;base.def=null;powerPlantRun.active=false;
    players=[new Player(1,2000,2000,'#d3b883')];players[0].perks.invulnTimer=99999;players[0].weapon={...WEAPON_TYPES.AR};
    zombies=[];bullets=[];enemyBullets=[];hazards=[];allies=[];rescueNPCs=[];vfxList=[];outposts=[];tank.active=false;heliSupport.active=false;currentWeather=1;
    nextMapPreference=mt;nextMissionPreference=type;generateMap(6);mapIntro.timer=0;levelStartTimer=0;radioDialogs=[];story.dialog=null;story.intro=null;
    updateCamera(0,true);draw();
   };
   fieldScene(3);
   let b=riverWorld.bridges[1];players[0].x=riverCenter(b);players[0].y=b;resolveCollision(players[0]);updateFieldWorld(.3);updateCamera(0,true);draw();
  });
  await page.screenshot({path:path.join(os.tmpdir(),'zombie-field-river.png')});
  assert.equal(await page.evaluate(()=>{let p=players[0],old=[p.x,p.y];p.y+=250;resolveCollision(p);return p.x===old[0]&&p.y===old[1];}),true);
  await page.evaluate(()=>{fieldScene(17);let p=players[0];p.cold=72;p.x=3800;p.y=4100;zombies=[55,56,57].map((t,i)=>new Zombie(p.x+230+i*110,p.y-170,t));enemyBullets=[new EnemyBullet(p.x+130,p.y-50,p.x,p.y,'ice')];hazards=[{type:'snowwarn',x:p.x+380,y:p.y+150,radius:180,timer:.7,life:.9}];updateFieldWorld(.3);updateCamera(0,true);draw();});
  await page.screenshot({path:path.join(os.tmpdir(),'zombie-field-snow.png')});
  await page.setViewportSize({width:844,height:390});await page.waitForFunction(()=>W===844);
  await page.evaluate(()=>{showTouchUI=true;draw();});await page.screenshot({path:path.join(os.tmpdir(),'zombie-field-snow-mobile.png')});
  assert.equal(await page.evaluate(()=>document.body.scrollWidth<=innerWidth+1),true);
  await page.setViewportSize({width:1280,height:800});await page.waitForFunction(()=>W===1280);
  assert.equal(await page.evaluate(()=>{
   fieldScene(2,'SURVIVAL');for(let i=0;i<305;i++)gameLoop(lastTime+100);
   return objState==='WAITING'&&mission.complete&&evacZone.announced&&evacTimer>14;
  }),true,'real game loop completes 30-second survival');
  assert.equal(await page.evaluate(()=>{for(let i=0;i<155;i++)gameLoop(lastTime+100);return objState==='EVAC';}),true,'15-second announcement leads to touchdown');
  assert.equal(await page.evaluate(()=>{let p=players[0];p.x=evacZone.x;p.y=evacZone.y;for(let i=0;i<40&&gameState==='PLAYING'&&objState==='EVAC';i++)gameLoop(lastTime+100);return objState==='HUB'||gameState==='UPGRADE';}),true,'boarding advances the campaign');
  await page.evaluate(()=>{
   document.getElementById('upgradeScreen').style.display='none';fieldScene(2);resetFieldWorld();currentMapType=14;objState='QUEEN_BOSS';story=newStory();obstacles=[];worldFeatures=[];players[0].x=2000;players[0].y=2250;caveRun.arena={x:2000,y:2000,r:740};
   let q=new Zombie(2000,1850,45);q.mineRework=true;queenFlightInit(q);q.flightArmor*=.4;zombies=[q];updateCamera(0,true);draw();
  });await page.screenshot({path:path.join(os.tmpdir(),'zombie-field-queen.png')});
  assert.deepEqual(errors,[]);
  console.log('PASS: river bridges/guardrails, snow enemies/ice telegraph/cold HUD, desktop/mobile landscape, real survival → 15-second arrival → boarding, airborne Queen armor.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
