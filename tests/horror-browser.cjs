const {chromium}=require('playwright');
const assert=require('node:assert/strict'),path=require('node:path'),os=require('node:os');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
  await page.addInitScript(()=>localStorage.setItem('zs_tut_done','1'));
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/\[gameLoop\]|\[loop\]/.test(m.text()))errors.push(m.text());});
  await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  await page.evaluate(()=>{startCampaign(true);loopToken++;story=newStory();story.dialog=null;story.intro=null;currentMapType=1;objState='KILL';currentWeather=1;worldFeatures=[];zombies=[];obstacles=[];drops=[];allies=[];rescueNPCs=[];banditTrucks=[];mineRail=null;mineEscape=null;mapIntro.timer=0;radioDialogs=[];});
  const counts=await page.evaluate(()=>{
   let tower={x:2000,y:2000,active:false,progress:2},oldTower=0,oldNpc=0,newTower=0,machine=0,print=0,nest=0,civilian=0;
   let fill=ctx.fillRect,arc=ctx.arc,tw=drawMissionTower,prop=drawStoryPropArt,cave=drawCavePropArt,npc=artCivilian;
   try{
    ctx.fillRect=function(x,y,w,h){if(x===1990&&y===1970&&w===20&&h===60)oldTower++;return fill.call(this,x,y,w,h);};
    ctx.arc=function(x,y,r,...args){if(x===2200&&y===2100&&r===13)oldNpc++;return arc.call(this,x,y,r,...args);};
    drawMissionTower=function(...a){newTower++;return tw(...a);};
    drawStoryPropArt=function(p,...a){if(p.kind==='machine')machine++;if(p.kind==='print')print++;return prop(p,...a);};
    drawCavePropArt=function(p,...a){if(p.kind==='nest')nest++;return cave(p,...a);};
    artCivilian=function(...a){civilian++;return npc(...a);};
    players[0].x=2000;players[0].y=2000;towers=[tower];story.props=[{kind:'machine',x:2100,y:1900,hp:30,maxHp:100},{kind:'print',x:2250,y:1900,on:true}];
    rescueNPCs=[new RescueNPC(2200,2100)];rescueNPCs[0].rescued=true;updateCamera(0,true);draw();
    caveProps=[{kind:'nest',x:2000,y:2000,r:35,hp:80,maxHp:100,flash:0,awake:true}];drawCaveProps(1,()=>true);
    let d=new Doctor(2200,2100),s=new StoryNPC(2200,2100,'soldier');d.draw(ctx);s.draw(ctx);
   }finally{ctx.fillRect=fill;ctx.arc=arc;drawMissionTower=tw;drawStoryPropArt=prop;drawCavePropArt=cave;artCivilian=npc;}
   return {oldTower,oldNpc,newTower,machine,print,nest,civilian};
  });
  assert.deepEqual(counts,{oldTower:0,oldNpc:0,newTower:1,machine:1,print:1,nest:1,civilian:3});
  assert.deepEqual(await page.evaluate(()=>{
   let original=drawMineBombCart,calls=0;try{drawMineBombCart=()=>calls++;mineRail={x:2000,y:2000};currentMapType=1;objState='KILL';drawStoryProps(1,()=>true);let normal=calls;currentMapType=14;objState='QUEEN_BOSS';drawStoryProps(1,()=>true);let boss=calls;objState='MINE_ESCORT';drawStoryProps(1,()=>true);return {normal,boss,escort:calls};}finally{drawMineBombCart=original;mineRail=null;currentMapType=1;objState='KILL';}
  }),{normal:0,boss:0,escort:1});
  assert.deepEqual(await page.evaluate(()=>{
   towers=[];story.props=[];rescueNPCs=[];gameState='PLAYING';objState='KILL';slashes=[];vfxList=[];PC_INPUT.pointer.active=false;
   let p=players[0];p.weapon={...WEAPON_TYPES.CHAINSAW};p.lastFireTime=0;p.perks.invulnTimer=999;p.skillC_CD=0;let z=new Zombie(p.x+75,p.y,14);z.hp=z.maxHp=2000;zombies=[z];
   p.shoot();for(let s of slashes)s.update(.01,p.x,p.y);draw();let swing=vfxList.some(v=>v.type==='saw_swing'),hit=vfxList.some(v=>v.type==='saw_impact');
   skillTryC(p);skillTick(p,.1);p.perks.w_rage=true;p.rage=100;arsenalRage(p);draw();return {swing,hit,rage:vfxList.some(v=>v.type==='saw_roar')};
  }),{swing:true,hit:true,rage:true});
  await page.evaluate(()=>{
   gameState='UPGRADE';towers=[];story.props=[];rescueNPCs=[];
   for(let id of ['toast','supplyHud','pauseBtn','upgradeScreen','featureControls']){let el=document.getElementById(id);if(el)el.style.display='none';}
   window.artSamples=[2,18,8,9,17,29,54,0].map(type=>new Zombie(0,0,type));
   window.artLabels=['PHUN AXIT','ACIDIER','CUNG THỦ','SÚNG SĂN','CÚ SỐC','E.L','ĐỘC THỂ LAB','ZOMBIE THƯỜNG'];
   window.testArtFrame=function(T){
    ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.fillStyle='#11130f';ctx.fillRect(0,0,W,H);
    ctx.font='600 22px Segoe UI';ctx.fillStyle='#d8d1bc';ctx.textAlign='left';ctx.fillText('DỊ THỂ / NHỮNG THỨ CÒN LẠI',34,43);
    artSamples.forEach((z,i)=>{let x=35+(i%4)*308,y=70+Math.floor(i/4)*350;
     artBox(x,y,288,324,'#21251c','#3e4433',3);ctx.fillStyle='#bcb59c';ctx.font='600 12px Segoe UI';ctx.textAlign='left';ctx.fillText(artLabels[i],x+16,y+25);
     ctx.save();ctx.translate(x+125,y+165);ctx.scale(3.1,3.1);artInfected(z,T,-.25);ctx.restore();
     ctx.font='11px Segoe UI';ctx.fillStyle='#898f77';ctx.fillText('CHUYỂN ĐỘNG · HƠI THỞ · TƯ THẾ TẤN CÔNG',x+16,y+304);
    });
    let data=ctx.getImageData(0,0,W,H).data,hash=2166136261;for(let i=0;i<data.length;i+=16)hash=Math.imul(hash^data[i],16777619);return hash;
   };
  });
  let result=await page.evaluate(()=>{let state=JSON.stringify(artSamples),a=testArtFrame(1),b=testArtFrame(1.3);return {changed:a!==b,unchanged:state===JSON.stringify(artSamples)};});
  assert.deepEqual(result,{changed:true,unchanged:true});
  await page.screenshot({path:path.join(os.tmpdir(),'zombie-horror-ranged.png')});
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.evaluate(()=>testArtFrame(1)===testArtFrame(2)),true);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(()=>{
   ctx.fillStyle='#141811';ctx.fillRect(0,0,W,H);ctx.font='600 20px Segoe UI';ctx.fillStyle='#d1cbb7';ctx.textAlign='left';ctx.fillText('TRẠM TÍN HIỆU / MỘT LỚP VẼ',35,43);
   ctx.save();ctx.translate(140,50);ctx.scale(1.6,1.6);drawMissionTower({x:200,y:220,active:false,progress:2},2);drawMissionTower({x:450,y:220,active:true,progress:5},2);ctx.restore();
  });
  await page.screenshot({path:path.join(os.tmpdir(),'zombie-horror-towers.png')});
  await page.evaluate(()=>{
   ctx.fillStyle='#141811';ctx.fillRect(0,0,W,H);ctx.textAlign='left';ctx.font='600 20px Segoe UI';ctx.fillStyle='#d1cbb7';ctx.fillText('CƯA MÁY / CẮT · VA ĐẬP · QUÁ TẢI',35,43);
   ['CẮT TRÚNG THỊT','CẮT TRÚNG GIÁP','LAO CƯA / QUÁ TẢI'].forEach((label,i)=>{
    let x=30+i*415;artBox(x,80,395,615,'#20251b','#424a34',3);ctx.font='600 13px Segoe UI';ctx.fillStyle='#c7bba0';ctx.fillText(label,x+16,112);
    ctx.save();ctx.translate(x+80,360);ctx.scale(2.2,2.2);let p=new Player(1,0,0,'#9eae85');p.weapon={...WEAPON_TYPES.CHAINSAW};p.sawContact=1;p.sawRage=i===2?5:0;p.lastFireTime=Date.now();p.facingX=1;p.facingY=0;
    let z=new Zombie(95,0,i===1?14:0);artInfected(z,2,Math.PI);drawSurvivorBody(p,0,2);drawMeleeWeapon(p,0,2);
    drawSawEffect({type:'saw_swing',x:0,y:0,angle:0,r:115,life:.09,max:.18,hot:i===2,dash:i===2},2);
    drawSawEffect({type:'saw_impact',x:80,y:0,angle:0,material:i===1?'metal':'flesh',life:.23,max:.32},2);
    if(i===2)drawSawEffect({type:'saw_roar',x:0,y:0,r:95,life:.4,max:.5},2);ctx.restore();
   });
  });
  await page.screenshot({path:path.join(os.tmpdir(),'zombie-horror-chainsaw.png')});
  assert.deepEqual(errors,[]);console.log('PASS: no legacy tower/NPC bodies, one render per machine/print/nest, animated ranged silhouettes, immutable combat state, live reduced-motion preference.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
