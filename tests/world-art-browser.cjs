const {chromium}=require('playwright');
const assert=require('node:assert/strict'),path=require('node:path'),os=require('node:os');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='error'&&/\[gameLoop\]|\[loop\]/.test(m.text()))errors.push(m.text());});
  await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  await page.evaluate(()=>{startCampaign(true);loopToken++;currentLevel=8;nextMapPreference=1;startLevel();loopToken++;story.dialog=null;story.intro=null;players[0].perks.invulnTimer=99999;for(let i=0;i<120;i++)gameLoop(lastTime+1000/60);});
  // Use the actual game renderer for a stable art scene, independent of random wall placement.
  await page.evaluate(()=>{
   currentLevel=12;currentMapType=1;objState='KILL';mission={type:'KILL',progress:0,required:99,complete:false};
   zombies=[];obstacles=[];worldFeatures=[];banditTrucks=[];outposts=[];drops=[];story.props=[];rescueNPCs=[];allies=[];hazards=[];bullets=[];enemyBullets=[];
   story.dialog=null;story.intro=null;story.arena=null;radioDialogs=[];mapIntro.timer=0;levelStartTimer=0;bossWin=null;slowMoT=0;vfxList=[];particles=[];currentWeather=1;tutFinish();
   players[0].x=2050;players[0].y=1930;players[0].weapon={...WEAPON_TYPES.AR};
   addFeature('signal',1630,1740);addFeature('market',2040,1710,{building:true});addFeature('outpost',2460,1740,{building:true});
   addFeature('fuel',1610,2180);addFeature('siren',1890,2210);addFeature('generator',2130,2230);
   for(let i=0;i<8;i++){let z=new Zombie(1670+i*77,2050,60+i);z.nid=100+i;z.atkCD=0;zombies.push(z);}
   banditTrucks=[{x:2470,y:2120,hp:1600,maxHp:1800,time:6,deploy:true,cd:0,wave:true}];
   drops=[{type:'AMMOBOX',x:1990,y:1930,radius:18},{type:'HEALTHBOX',x:2100,y:1930,radius:18}];
   updateCamera(0,true);draw();if(tutEl)tutEl.style.display='none';
  });
  await page.screenshot({path:path.join(os.tmpdir(),'zombie-world-art.png')});
  await page.setViewportSize({width:844,height:390});await page.waitForFunction(()=>W===844&&H===390);
  await page.evaluate(()=>{showTouchUI=true;players[0].x=1900;players[0].y=2010;updateCamera(0,true);draw();if(tutEl)tutEl.style.display='none';});
  await page.screenshot({path:path.join(os.tmpdir(),'zombie-world-art-mobile.png')});
  await page.setViewportSize({width:1440,height:900});await page.waitForFunction(()=>W===1440&&H===900);
  await page.evaluate(()=>{
   worldFeatures=[];zombies=[];banditTrucks=[];drops=[];players[0].x=2050;players[0].y=1930;
   for(let [i,kind]of ['furnace','switch','crusher','eggs','cocoon','mineral','ceiling','mushroom','crackwall','shaft','arsenal','greenhouse'].entries())addFeature(kind,1450+(i%4)*340,1590+Math.floor(i/4)*240,{building:['arsenal','greenhouse'].includes(kind)});
   updateCamera(0,true);draw();if(tutEl)tutEl.style.display='none';
  });
  await page.screenshot({path:path.join(os.tmpdir(),'zombie-world-art-objects.png')});
  assert.deepEqual(errors,[]);console.log('PASS: map 8 simulation; eight detailed bandit roles, truck, supplies, POIs and underground props render on desktop/mobile.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
