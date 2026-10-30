const {chromium}=require('playwright');
const assert=require('node:assert/strict'),path=require('node:path'),os=require('node:os');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  await page.addInitScript(()=>localStorage.setItem('zs_tut_done','1'));
  page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='error'&&/\[gameLoop\]|\[loop\]/.test(m.text()))errors.push(m.text());});
  await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  const shot=async name=>{await page.evaluate(()=>Promise.all([...document.querySelectorAll('.upg-card')].flatMap(el=>el.getAnimations().map(a=>a.finished.catch(()=>{})))));await page.screenshot({path:path.join(os.tmpdir(),'zombie-presentation-'+name+'.png')});};
  await page.locator('#menuModes button').first().waitFor();
  assert.equal(await page.locator('#menuModes button').count(),4);
  await shot('menu');
  await page.locator('#menuModes button').last().click();await page.locator('#onlineModal').waitFor({state:'visible'});
  await page.keyboard.press('Escape');await page.locator('#onlineModal').waitFor({state:'hidden'});
  await page.locator('#menuSettings summary').click();await page.selectOption('#visualQuality','low');
  assert.equal(await page.evaluate(()=>presentationLow()),true);
  await page.selectOption('#visualQuality','high');assert.equal(await page.evaluate(()=>localStorage.getItem('zs_visual_quality')),'high');
  await page.locator('#menuSettings button').filter({hasText:'WIKI'}).click();await page.locator('#guideModal').waitFor({state:'visible'});await shot('wiki');await page.keyboard.press('Escape');await page.locator('#guideModal').waitFor({state:'hidden'});
  await page.locator('#menuSettings summary').click();
  await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>W===390);await shot('menu-mobile');
  assert.equal(await page.evaluate(()=>document.getElementById('menu').scrollWidth<=innerWidth+1),true);
  await page.setViewportSize({width:1440,height:900});await page.waitForFunction(()=>W===1440);
  await page.locator('#menuModes button').first().click();
  await page.evaluate(()=>{loopToken++;story.dialog=null;story.intro=null;players[0].perks.invulnTimer=99999;players[0].weapon={...WEAPON_TYPES.AR};mapIntro.timer=0;radioDialogs=[];for(let i=0;i<40;i++)gameLoop(lastTime+1000/60);draw();});
  await shot('game');
  await page.evaluate(()=>{loopToken++;players[0].pendingUpgrades=1;triggerUpgradeScreen();});
  await page.locator('#p1Cards .upg-card').first().focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('#p1Cards .upg-card').first().getAttribute('aria-selected'),'true');
  await page.evaluate(()=>Promise.all([...document.querySelectorAll('.upg-card')].flatMap(el=>el.getAnimations().map(a=>a.finished.catch(()=>{})))));
  await shot('upgrades');
  await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>W===390);await shot('upgrades-mobile');
  assert.equal(await page.locator('#p1ConfirmBtn').isEnabled(),true);
  await page.locator('#p1ConfirmBtn').click();await page.evaluate(()=>{loopToken++;});
  await page.setViewportSize({width:1440,height:900});await page.waitForFunction(()=>W===1440);
  await page.evaluate(()=>{base.house=4;base.homes=4;base.farms=3;base.food=300;base.mat=80;shopScrap=1000;enterHub();loopToken++;mapIntro.timer=0;radioDialogs=[];draw();});await shot('camp');
  await page.evaluate(()=>openHubPanel('base'));await shot('workshop');
  await page.evaluate(()=>{closeHubPanel();loopToken++;openHubPanel('map');});
  await page.locator('#routeBalanced').focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('#routeBalanced').getAttribute('aria-pressed'),'true');await shot('missions');
  // Render every biome and scripted mission, then expose all character silhouettes.
  for(let map=1;map<=16;map++){
   await page.evaluate(map=>{document.getElementById('routeShop').style.display='none';currentLevel=12;nextMapPreference=map;startLevel();loopToken++;story.dialog=null;story.intro=null;players[0].perks.invulnTimer=99999;mapIntro.timer=0;radioDialogs=[];for(let i=0;i<8;i++)gameLoop(lastTime+1000/60);draw();},map);
  }
  await page.evaluate(()=>{
   document.getElementById('upgradeScreen').style.display='none';gameState='PLAYING';currentMapType=1;objState='KILL';story=newStory();worldFeatures=[];obstacles=[];zombies=[];hazards=[];bullets=[];enemyBullets=[];outposts=[];rescueNPCs=[];allies=[];drops=[];fireZones=[];base.def=null;banditTrucks=[];tank.active=false;mineRail=null;mineEscape=null;currentWeather=1;radioDialogs=[];vfxList=[];mapIntro.timer=0;levelStartTimer=0;bossWin=null;players[0].x=2000;players[0].y=2000;
   [30,31,32,35,36,37,45,50].forEach((type,i)=>{let z=new Zombie(1450+(i%4)*350,1700+Math.floor(i/4)*450,type);if(type===45)z.airborne=true;zombies.push(z);});
   updateCamera(0,true);draw();
  });await shot('bosses');
  await page.evaluate(()=>{zombies=[];[0,1,2,3,4,5,6,7,8,9,10,11,13,14,15,16,17,18,20,21,22,26,27,28,29,33,34,38,40,41,42,43,46,51,52,53,54,60,61,62,63,64,65,66,67].forEach((type,i)=>zombies.push(new Zombie(1440+(i%8)*160,1510+Math.floor(i/8)*185,type)));draw();});await shot('infected');
  await page.setViewportSize({width:844,height:390});await page.waitForFunction(()=>W===844);
  await page.evaluate(()=>{showTouchUI=true;setPresentationQuality('auto');draw();});await shot('game-mobile');
  const pause=await page.locator('#pauseBtn').boundingBox();assert.ok(pause.y<200,'pause stays clear of the attack buttons');
  // Both local halves and the P3 guest must keep their existing selection flow.
  await page.setViewportSize({width:1440,height:900});await page.waitForFunction(()=>W===1440);
  await page.evaluate(()=>{startCampaign(false);loopToken++;story.dialog=null;story.intro=null;players.forEach(p=>p.pendingUpgrades=1);triggerUpgradeScreen();});
  assert.equal(await page.locator('#upgradeScreen').evaluate(el=>el.classList.contains('one-half')),false);
  assert.equal(await page.locator('#p1Cards .upg-card').count(),3);assert.equal(await page.locator('#p2Cards .upg-card').count(),3);
  for(let slot of [1,2]){await page.locator('#p'+slot+'Cards .upg-card').first().focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#p'+slot+'ConfirmBtn').isEnabled(),true);}await shot('local2');
  await page.evaluate(()=>{players=Array.from({length:4},(_,i)=>new Player(i+1,2000,2000,'#aab'));NET.mode='guest';NET.localIdx=2;NET.upgradeRound=1;netApplySync({gs:'UPGRADE',round:2,lvl:12,pl:players.map(p=>({pend:p.id===3?1:0,lvl:1})),cf:[1,1,0,1]});});
  assert.equal(await page.locator('#upgradeScreen').evaluate(el=>el.classList.contains('one-half')),true);
  await page.locator('#p2Cards .upg-card').first().focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#p2ConfirmBtn').isEnabled(),true);await shot('guest-p3');
  assert.deepEqual(errors,[]);
  console.log('PASS: menu/settings, keyboard dialogs/cards/routes, 16 maps, camp/shop, every boss/infected/bandit, local two-player and P3 guest upgrade UI, desktop/portrait/landscape layouts.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
