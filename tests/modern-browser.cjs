const {chromium}=require('playwright');
const assert=require('node:assert/strict'),path=require('node:path'),os=require('node:os');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
  page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='error'&&/\[gameLoop\]|\[loop\]/.test(m.text()))errors.push(m.text());});
  await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  await page.evaluate(()=>{startCampaign(true);loopToken++;story.dialog=null;story.intro=null;nextMapPreference=1;currentLevel=3;startLevel();loopToken++;story.dialog=null;story.intro=null;players[0].perks.invulnTimer=99999;players[0].weapon={...WEAPON_TYPES.AR};players[0].weapon.mag=5;draw();});
  await page.getByText('NẠP [F]',{exact:false}).click();
  assert.ok(await page.evaluate(()=>players[0].reloadT>0));
  await page.evaluate(()=>{for(let i=0;i<180;i++)gameLoop(lastTime+1000/60);});
  assert.equal(await page.evaluate(()=>players[0].weapon.mag),25);
  await page.evaluate(()=>{base.house=2;base.food=100;enterHub();loopToken++;openHubPanel('base');draw();});
  assert.ok((await page.locator('#baseItems').textContent()).includes('KHU TẬP LUYỆN'));
  await page.locator('#baseItems button').filter({hasText:'Tập 🌾12'}).nth(1).click();
  assert.equal(await page.evaluate(()=>base.trainSpd),1);
  await page.screenshot({path:path.join(os.tmpdir(),'zombie-training-update.png')});
  await page.evaluate(()=>{document.getElementById('routeShop').style.display='none';});
  for(const map of [1,4,5,7,9,12,13,10,14]){
   await page.evaluate(map=>{nextMapPreference=map;currentLevel=7;startLevel();loopToken++;story.dialog=null;story.intro=null;players[0].perks.invulnTimer=99999;players[0].weapon={...WEAPON_TYPES.CHAINSAW};if(map===5)for(let i=0;i<8;i++)zombies.push(new Zombie(players[0].x+100+i*25,players[0].y,60+i));for(let i=0;i<120;i++)gameLoop(lastTime+1000/60);draw();},map);
  }
  assert.equal(await page.evaluate(()=>objState),'MINE_ESCORT');
  await page.screenshot({path:path.join(os.tmpdir(),'zombie-mine-update.png')});
  await page.evaluate(()=>{mineRail.step=mineRail.path.length;updateCaveWorld(.1);featureAction(worldFeatures.find(f=>f.kind==='queenGate'),players[0]);updateCaveWorld(3);story.dialog=null;story.intro=null;let q=zombies.find(z=>z.type===45);q.hp=q.maxHp*.4;q._hpPrev=q.hp;for(let i=0;i<120;i++)gameLoop(lastTime+1000/60);});
  assert.ok(await page.evaluate(()=>zombies.some(z=>z.mineDark)));
  await page.setViewportSize({width:844,height:390});
  await page.waitForFunction(()=>W===844&&H===390);
  await page.evaluate(()=>{showTouchUI=true;NET.mode='guest';NET.localIdx=0;players[0].weapon={...WEAPON_TYPES.SMG};draw();});
  assert.equal(await page.locator('#supplyHud button').count(),2);
  await page.screenshot({path:path.join(os.tmpdir(),'zombie-landscape-update.png')});
  assert.deepEqual(errors,[]);
  console.log('PASS: clickable reload, food training UI, nine maps with AI, mine escort/queen transition, mobile landscape HUD.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
