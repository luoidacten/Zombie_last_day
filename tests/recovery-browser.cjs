const {chromium}=require('playwright');
const assert=require('node:assert/strict'),path=require('node:path'),os=require('node:os');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/\[gameLoop\]|\[loop\]/.test(m.text()))errors.push(m.text());});
  await page.addInitScript(()=>localStorage.setItem('zs_tut_done','1'));await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  await page.evaluate(()=>{startCampaign(true);loopToken++;story=newStory();currentLevel=4;players[0].pendingUpgrades=0;nextMapPreference=2;nextMissionPreference='KILL';generateMap(4);story.dialog=null;story.intro=null;levelStartTimer=0;mapIntro.timer=0;zombies=[];players[0].weapon={...WEAPON_TYPES.AR};players[0].weapon.ammo=100;players[0].vHp=30;shopScrap=100;missionScrapEarned=40;players[0].hp=0;players[0].isDowned=true;gameLoop(lastTime+100);for(let i=0;i<15;i++)gameLoop(lastTime+100);});
  assert.equal(await page.evaluate(()=>!!emergencyRetreat&&gameState==='PLAYING'),true);await page.screenshot({path:path.join(os.tmpdir(),'zombie-emergency-retreat.png')});
  await page.evaluate(()=>{for(let i=0;i<40&&emergencyRetreat;i++)gameLoop(lastTime+100);loopToken++;});
  assert.deepEqual(await page.evaluate(()=>({level:currentLevel,state:objState,scrap:shopScrap,hp:players[0].hp,vhp:players[0].vHp,ammo:players[0].weapon.ammo,next:nextCampaignLevel()})),{level:5,state:'HUB',scrap:80,hp:50,vhp:0,ammo:75,next:5});
  await page.evaluate(()=>{players[0].pendingUpgrades=0;continueAfterShop();loopToken++;story.dialog=null;story.intro=null;levelStartTimer=0;mapIntro.timer=0;base.def.breakT=999;zombies=[];players[0].isDowned=true;players[0].hp=0;for(let i=0;i<119;i++)gameLoop(lastTime+100);});
  assert.equal(await page.evaluate(()=>objState==='BASE_DEF'&&players[0].isDowned),true);await page.screenshot({path:path.join(os.tmpdir(),'zombie-defense-respawn.png')});
  await page.evaluate(()=>gameLoop(lastTime+100));assert.equal(await page.evaluate(()=>!players[0].isDowned&&gameState==='PLAYING'),true);
  await page.evaluate(()=>{base.def.houseNpc.takeDamage(999999);for(let i=0;i<28&&gameState==='PLAYING';i++)gameLoop(lastTime+100);});assert.equal(await page.evaluate(()=>gameState==='GAMEOVER'&&readSave()===null),true);
  assert.deepEqual(errors,[]);console.log('PASS: actual game loop emergency helicopter → penalties/fireplace → queued Map 5 defense, full-party 12-second respawn, house destruction is true game over and deletes checkpoint.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
