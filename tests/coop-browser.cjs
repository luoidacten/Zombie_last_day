// Deterministic transport exercises the real PeerJS integration across isolated
// browser profiles; this does not test public signaling/TURN or real WebRTC.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),path=require('node:path'),os=require('node:os');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true}),rooms=new Map(),links=new Map(),chains=new Map(),errors=[];
 let serial=0;
 async function send(page,m){if(!page.isClosed())await page.evaluate(m=>window.testPeerReceive(m),m);}
 async function device(name){
  let context=await browser.newContext({viewport:{width:1280,height:800}}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(name+': '+e.message));page.on('console',m=>{if(m.type()==='error'&&/\[gameLoop\]|\[loop\]|\[guestLoop\]/.test(m.text()))errors.push(name+': '+m.text());});
  await page.exposeFunction('peerTransport',async m=>{
   if(m.op==='register'){rooms.set(m.id,page);return true;}
   if(m.op==='connect'){let remote=rooms.get(m.to);if(!remote)return false;links.set(m.cid,{a:page,b:remote});await send(remote,{op:'connection',peer:m.to,cid:m.cid,metadata:m.metadata});return true;}
   let link=links.get(m.cid);
   if(m.op==='destroy'){if(rooms.get(m.id)===page)rooms.delete(m.id);return true;}
   if(!link)return false;let remote=link.a===page?link.b:link.a;
   if(m.op==='open'){await send(remote,{op:'open',cid:m.cid});return true;}
   if(m.op==='data'){let key=m.cid+(link.a===page?'a':'b'),prev=chains.get(key)||Promise.resolve(),next=prev.then(()=>send(remote,{op:'data',cid:m.cid,data:m.data}));chains.set(key,next.catch(()=>{}));await next;return true;}
   if(m.op==='close'){links.delete(m.cid);await send(remote,{op:'close',cid:m.cid});return true;}
  });
  await page.addInitScript(({name,serial})=>{
   localStorage.setItem('zs_tut_done','1');window.testPeers={};window.testConnections={};let seq=0;
   class Events{constructor(){this.handlers={};}on(k,f){(this.handlers[k]||=[]).push(f);return this;}emit(k,v){for(let f of this.handlers[k]||[])f(v);}}
   class Conn extends Events{constructor(cid,metadata){super();this.cid=cid;this.metadata=metadata;this.open=false;testConnections[cid]=this;}send(data){peerTransport({op:'data',cid:this.cid,data:JSON.parse(JSON.stringify(data))});}close(){if(this.closed)return;this.closed=true;this.open=false;peerTransport({op:'close',cid:this.cid});this.emit('close');}}
   window.Peer=class extends Events{constructor(id){super();this.id=id||'test_device_'+serial+'_'+(++seq);testPeers[this.id]=this;peerTransport({op:'register',id:this.id}).then(()=>this.emit('open',this.id));}connect(to,opts){let cid=this.id+'_'+(++seq),c=new Conn(cid,opts.metadata);peerTransport({op:'connect',to,cid,metadata:opts.metadata}).then(ok=>{if(!ok){this.emit('error',{type:'peer-unavailable'});return;}c.open=true;c.emit('open');peerTransport({op:'open',cid});});return c;}destroy(){this.destroyed=true;for(let c of Object.values(testConnections))c.close();peerTransport({op:'destroy',id:this.id});}reconnect(){}}
   window.testPeerReceive=m=>{if(m.op==='connection'){let c=new Conn(m.cid,m.metadata);testPeers[m.peer].emit('connection',c);}else{let c=testConnections[m.cid];if(!c)return;if(m.op==='open'){c.open=true;c.emit('open');}if(m.op==='data')c.emit('data',m.data);if(m.op==='close'){c.closed=true;c.open=false;c.emit('close');}}};
  },{name,serial:++serial});
  await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);await page.evaluate(name=>{netOpenLobby();document.getElementById('netPlayerName').value=name;},name);return page;
 }
 try{
  const host=await device('Chủ Trại'),a=await device('Lan'),b=await device('Minh');
  await host.evaluate(()=>netHost());await host.waitForFunction(()=>NET.peer?.id&&document.getElementById('netRoomCode').textContent.trim().length===5);let code=await host.locator('#netRoomCode').textContent();
  await a.locator('#netCodeInput').fill(code.trim());await a.evaluate(()=>netJoin());
  await host.waitForFunction(()=>NET.peers.length===1&&NET.peers[0].conn.open);await host.evaluate(()=>netStartGame());
  for(let page of [host,a]){await page.waitForFunction(()=>gameState==='PLAYING');await page.evaluate(()=>loopToken++);}
  await host.evaluate(()=>{enterHub();loopToken++;});await b.locator('#netCodeInput').fill(code.trim());await b.evaluate(()=>netJoin());
  await host.waitForFunction(()=>NET.peers.length===2&&players.length===3);await a.waitForFunction(()=>players.length===3);await b.waitForFunction(()=>gameState==='PLAYING');await b.evaluate(()=>loopToken++);
  await host.evaluate(()=>{players[2].level=9;players[2].weapon={...WEAPON_TYPES.AR};players[2].weapon.mag=11;players[2].vHp=37;enterHub();loopToken++;saveCheckpoint(true);});
  const uuid=await b.evaluate(()=>localPlayerUUID());
  await a.evaluate(()=>netTeardown());await b.evaluate(()=>netTeardown());await host.waitForFunction(()=>NET.peers.length===0);
  assert.equal(await host.evaluate(()=>NET.mode==='host'&&NET.locked),true);
  await b.evaluate(()=>netJoin());await host.waitForFunction(()=>NET.peers.length===1);await b.waitForFunction(()=>gameState==='PLAYING'&&localPlayer().level===9&&localPlayer().vHp===37);await b.evaluate(()=>loopToken++);
  await host.evaluate(()=>{saveCheckpoint(true);netTeardown();loopToken++;});await host.reload();await host.evaluate(()=>loadGame());await host.waitForFunction(()=>NET.role==='host'&&document.getElementById('netRoomCode').textContent.trim().length===5);code=await host.locator('#netRoomCode').textContent();
  await b.evaluate(()=>netTeardown());await b.reload();assert.equal(await b.evaluate(()=>localPlayerUUID()),uuid);await b.evaluate(code=>{netOpenLobby();document.getElementById('netCodeInput').value=code;netJoin();},code.trim());
  await host.waitForFunction(()=>NET.peers.length===1&&NET.peers[0].conn.open);await host.evaluate(()=>netStartGame());await b.waitForFunction(()=>gameState==='PLAYING'&&localPlayer().level===9&&localPlayer().weapon?.key==='AR');
  assert.equal(await b.evaluate(()=>NET.localIdx),1);assert.equal(await host.evaluate(()=>Object.values(partyArchive).some(r=>r.name==='Lan')),true);
  await host.evaluate(()=>{loopToken++;players[0].perks.invulnTimer=9999;base.pop=30;base.house=5;base.mat=9999;shopScrap=99999;base.turrets=[{t:'mg',p:[0,0,0],l:1}];openHubPanel('base');});
  for(let i=0;i<4;i++)await host.locator('.turret-branch').nth(0).locator('button').click();for(let i=0;i<2;i++)await host.locator('.turret-branch').nth(1).locator('button').click();
  assert.equal(await host.locator('.turret-branch').nth(2).locator('button').isDisabled(),true);await host.screenshot({path:path.join(os.tmpdir(),'zombie-crosspath-workshop.png')});
  await host.setViewportSize({width:390,height:844});await host.waitForFunction(()=>W===390);await host.screenshot({path:path.join(os.tmpdir(),'zombie-crosspath-mobile.png')});assert.equal(await host.locator('#baseItems').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
  await host.setViewportSize({width:1440,height:1000});await host.waitForFunction(()=>W===1440);
  await host.evaluate(()=>{
   loopToken++;document.getElementById('routeShop').style.display='none';gameState='UPGRADE';for(let id of ['supplyHud','pauseBtn','upgradeScreen','featureControls'])document.getElementById(id).style.display='none';
   base.pop=40;base.turrets=[];for(let b=0;b<3;b++)for(let key of TURRET_KEYS){let p=[0,0,0];p[b]=4;base.turrets.push({t:key,p,l:5,ang:-.35});}
   ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#131a14';ctx.fillRect(0,0,W,H);ctx.fillStyle='#ded6b9';ctx.font='bold 22px Segoe UI';ctx.fillText('Ụ SÚNG · 15 DẠNG TỐI THƯỢNG',40,40);
   base.turrets.forEach((t,i)=>{let x=30+i%5*282,y=65+Math.floor(i/5)*300;artBox(x,y,266,280,'#242c22','#626b51',7);drawTurretBody(t,x+130,y+115,2,false);ctx.font='bold 13px Segoe UI';ctx.textAlign='center';ctx.fillStyle='#d5cfb5';ctx.fillText(TURRET_PATHS[t.t][t.p.indexOf(4)][3][0],x+133,y+224,245);ctx.font='12px Segoe UI';ctx.fillText('NHÁNH '+String.fromCharCode(65+t.p.indexOf(4))+' · 2 CƯ DÂN',x+133,y+250);});
  });await host.screenshot({path:path.join(os.tmpdir(),'zombie-crosspath-ultimates.png')});
  assert.deepEqual(errors,[]);console.log('PASS: three isolated browser devices, names/UUID, all guests leave and return, saved host creates a new room, changed join slot restores gear, clickable 4-2-0 shop, mobile layout, 15 ultimate Canvas forms. Transport is simulated; public WebRTC/TURN is not exercised.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
