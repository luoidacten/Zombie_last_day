const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/\[gameLoop\]|\[loop\]/.test(m.text()))errors.push(m.text());});
  await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  await page.evaluate(()=>{startCampaign(true);admJump(6,'labz');loopToken++;story.dialog=null;story.intro=null;story.lab.plant=.999;story.lab.soldier.state='plant';updateLab(.1);players[0].x=LAB.doorS.x;players[0].y=LAB.doorS.y;updateLab(1.1);});
  assert.equal(await page.evaluate(()=>story.lab.stage),'explore');
  await page.evaluate(()=>{for(let i=0;i<300;i++)gameLoop(lastTime+1000/60);draw();});
  await page.screenshot({path:path.join(require('node:os').tmpdir(),'zombie-lab.png')});
  await page.evaluate(()=>{let d=labDungeon().doors[0];d.type='secure';d.open=false;d.puzzle=2;players[0].x=d.cx-70;players[0].y=d.cy;labSend('start',d.id,0,0,1);updateCamera(0,true);draw();});
  assert.ok((await page.locator('#labHackPanels').textContent()).includes('Ma trận Hex'));
  await page.screenshot({path:path.join(require('node:os').tmpdir(),'zombie-hack.png')});
  await page.evaluate(()=>{let D=labDungeon(),d=D.doors[0];for(let s=0;s<3;s++)labSend('solve',d.id,d.sequence[s],s,1);});
  assert.equal(await page.evaluate(()=>labDungeon().doors[0].open),true);
  await page.evaluate(()=>{labStartStation();story.intro=null;story.dialog=null;for(let i=0;i<60;i++)gameLoop(lastTime+1000/60);});
  assert.equal(await page.evaluate(()=>objState),'STATION_HOLD');
  await page.evaluate(()=>{players.push(new Player(2,0,0,'#f88'),new Player(3,0,0,'#8f8'),new Player(4,0,0,'#ff8'));currentMapType=14;mineRun.stage='tunnel';caveRegenerate();loopToken++;for(let i=0;i<540;i++)gameLoop(lastTime+1000/60);draw();});
  assert.equal(await page.evaluate(()=>cartRun.carts.length),2);
  await page.screenshot({path:path.join(require('node:os').tmpdir(),'zombie-cart.png')});
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>draw());
  await page.screenshot({path:path.join(require('node:os').tmpdir(),'zombie-cart-mobile.png')});
  assert.deepEqual(errors,[]);console.log('PASS: procedural Lab simulation, clickable hack, station transition, four-player cart simulation, desktop/mobile rendering.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
