const {chromium}=require('playwright');
const assert=require('node:assert/strict'),path=require('node:path'),os=require('node:os');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
  page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='error'&&/\[gameLoop\]|\[loop\]/.test(m.text()))errors.push(m.text());});
  await page.addInitScript(()=>localStorage.setItem('zs_tut_done','1'));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  await page.evaluate(()=>{startCampaign(true);loopToken++;Math.random=fieldRng(31);currentLevel=8;nextMapPreference=10;startLevel();loopToken++;story.dialog=null;story.intro=null;mapIntro.timer=0;radioDialogs=[];});
  for(let floor=1;floor<=2;floor++){
   assert.equal(await page.evaluate(()=>hangZRun.floor),floor);
   await page.evaluate(()=>{let p=players[0];p.x=hangZRun.stairs.x;p.y=hangZRun.stairs.y;updateCaveWorld(.1);draw();});
  }
  assert.equal(await page.evaluate(()=>objState),'CAVE_ESCORT');
  await page.evaluate(()=>{let d=caveRun.doctor;players[0].x=d.x;players[0].y=d.y;for(let i=0;i<90;i++)gameLoop(lastTime+1000/60);draw();});
  await page.screenshot({path:path.join(os.tmpdir(),'zombie-cave-escort.png')});
  // Follow the live mission transition rather than setting the run phase directly.
  await page.evaluate(()=>{
   for(let i=0;i<3;i++){let d=caveRun.doctor,s=caveRun.sites[caveRun.siteIdx];d.x=s.x;d.y=s.y;d.state='plant';players[0].x=s.x;players[0].y=s.y;caveRun.plant=.999;updateCaveWorld(.1);}
   draw();
  });assert.equal(await page.evaluate(()=>objState),'CAVE_RUN');
  await page.evaluate(()=>{let e=caveRun.exit;players[0].x=e.x;players[0].y=e.y;caveRun.doctor.x=e.x;caveRun.doctor.y=e.y;updateCaveWorld(.1);});
  assert.equal(await page.evaluate(()=>caveRun.result.unlock),true);
  await page.evaluate(()=>{nextMapPreference=14;startLevel();loopToken++;story.dialog=null;story.intro=null;mapIntro.timer=0;radioDialogs=[];draw();});
  assert.equal(await page.evaluate(()=>objState),'MINE_ESCORT');
  assert.equal(await page.evaluate(()=>caveGuideGoal(players[0])===mineRail),true);
  await page.evaluate(()=>{mineRail.step=mineRail.path.length;updateCaveWorld(.1);featureAction(worldFeatures.find(f=>f.kind==='queenGate'),players[0]);updateCaveWorld(3);draw();});
  assert.equal(await page.evaluate(()=>objState),'QUEEN');
  await page.evaluate(()=>{let q=zombies.find(z=>z.type===45);q.hp=q.maxHp*.4;q._hpPrev=q.hp;updateSpecialZombie(q,players[0],300,0,.1,100);q.spCD=0;updateSpecialZombie(q,players[0],300,0,.1,100);});
  assert.ok(await page.evaluate(()=>hazards.some(h=>h.type==='acidbomb')));
  await page.evaluate(()=>{let q=zombies.find(z=>z.type===45);featureAction(worldFeatures.find(f=>f.kind==='generator'),players[0]);updateSpecialZombie(q,players[0],300,0,.1,100);q.hp=0;zombieDown(q,players[0]);featureAction(worldFeatures.find(f=>f.kind==='queenReward'),players[0]);draw();});
  await page.screenshot({path:path.join(os.tmpdir(),'zombie-cave-collapse.png')});
  await page.evaluate(()=>{players[0].x=2000;players[0].y=500;updateCaveWorld(.1);cartRun.stage='race';draw();});
  assert.equal(await page.evaluate(()=>cartRun.bossDead),true);
  await page.keyboard.press('d');assert.equal(await page.evaluate(()=>cartRun.carts[0].lane),2);
  await page.keyboard.press('Shift');assert.ok(await page.evaluate(()=>cartRun.carts[0].boost)>0);
  await page.keyboard.press('b');assert.equal(await page.evaluate(()=>cartRun.carts[0].tnt),0);
  // Check actual visible button hit targets on landscape and portrait phones.
  for(let size of [{width:1280,height:800},{width:844,height:390},{width:390,height:844}]){
   await page.setViewportSize(size);await page.waitForFunction(w=>W===w,size.width);
   await page.evaluate(()=>{showTouchUI=true;cartRun.carts[0].steerCD=0;cartRun.carts[0].hazards=[];cartRun.carts[0].spawn=0;tickMinecart(.01);draw();});
   let controls=page.locator('#minecartControls');assert.equal(await controls.isVisible(),true);
   assert.equal(await controls.evaluate(el=>el.scrollWidth<=innerWidth),true);
   await controls.getByRole('button',{name:'← A',exact:true}).click();
   assert.ok(await page.evaluate(()=>cartRun.carts[0].lane)<2);
   let bounds=await controls.boundingBox();assert.ok(bounds.y+bounds.height<=size.height);
   assert.equal(await page.locator('#supplyHud').isVisible(),false);
   await page.screenshot({path:path.join(os.tmpdir(),`zombie-cave-cart-${size.width}.png`)});
  }
  await page.setViewportSize({width:844,height:390});await page.waitForFunction(()=>W===844);
  await page.evaluate(()=>{players=Array.from({length:4},(_,i)=>new Player(i+1,2000,2000,'#a8b'));NET.mode='guest';NET.localIdx=2;startMinecart(true);cartRun.stage='race';cartRun.carts[1].hazards=[{id:1,row:1,lane:0,type:'collapse',eta:.9,warning:2.8}];draw();});
  assert.ok((await page.locator('#minecartControls').textContent()).includes('TỐC'));
  await page.screenshot({path:path.join(os.tmpdir(),'zombie-cave-cart-guest.png')});
  assert.deepEqual(errors,[]);
  console.log('PASS: Hang Z 3-floor/C4/exit, mine escort/Queen/collapse/cart, real keyboard/touch controls, desktop/portrait/landscape and P3 guest render.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
