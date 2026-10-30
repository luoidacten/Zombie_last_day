// Three-lane co-op escape replaces the walking QUEEN_RUN simulation.
let cartRun=null;
function cartSeats(roster) {
    return [roster.slice(0,2),roster.slice(2,4)].filter(a=>a.length).map((a,i)=>({
        id:i,driver:a[0].id,spotter:a[1]?a[1].id:0,members:a.map(p=>p.id),lane:1,hp:100,gap:75,
        distance:0,stun:0,slow:0,steerCD:0,shotCD:0,ants:0,ping:-1,pingT:0,hazards:[],spawn:1+i*.5,tnt:0,tntCD:7,antCD:6,hit:0
    }));
}
function startMinecart() {
    let crew=activePlayers();
    cartRun={stage:'mount',time:0,mount:4,end:0,win:false,carts:cartSeats(crew),message:'LÊN XE GOÒNG! Cả đội chuẩn bị rời hầm.',seq:0};
    caveRun.kind='cart';caveRun.timer=52;caveRun.exit=null;hangZRun.stairs=null;
    hazards=[];enemyBullets=[];bullets=[];obstacles=[];caveProps=[];rescueNPCs=[];
    tank.active=false;tank.crew=[];story.dialog=null;story.intro=null;story.arena=null;
    zombies=[];
    let q=new Zombie(2000,2700,ANT.QUEEN);q.phase=3;q.phase2Done=true;q.hp=q.maxHp*.22;zombies.push(q);
    objState='QUEEN_RUN';mission={type:'QUEEN_RUN',progress:0,required:52,complete:false};
    crew.forEach((p,i)=>{p.x=1900+i*55;p.y=2000;});
    Sound.play('roar');clearPcInputs();
}
genQueenTunnel=startMinecart;
function cartFor(pid){return cartRun&&cartRun.carts.find(c=>c.members.includes(pid));}
function cartRole(c,pid){return c.driver===pid?(c.spotter?'LÁI XE':'LÁI + RADAR'):'DẪN ĐƯỜNG';}
function cartCommand(pid,action,value){
    if(!cartRun||cartRun.stage!=='race'||gameState!=='PLAYING')return;
    let p=players.find(p=>p.id===pid&&!p.netLeft&&!p.isDowned),c=cartFor(pid);
    if(!p||!c||c.hp<=0)return;
    if(action==='steer'&&c.driver===pid&&c.steerCD<=0&&c.stun<=0&&(value===-1||value===1)){
        c.lane=Math.max(0,Math.min(2,c.lane+value));c.steerCD=.25;
    }
    let radar=c.spotter===pid||(!c.spotter&&c.driver===pid);
    if(action==='ping'&&radar&&Number.isInteger(value)&&value>=0&&value<=2){c.ping=value;c.pingT=2.5;}
    if(action==='fire'&&radar&&c.shotCD<=0){
        c.shotCD=.35;if(c.ants>0)c.ants--;Sound.play('pistol');
    }
    if(action==='tnt'&&radar&&c.tnt>0&&c.shotCD<=0){
        c.shotCD=.5;c.tnt=0;c.gap=Math.min(100,c.gap+22);c.ants=0;Sound.play('explode');c.hit=.2;
    }
}
function cartSend(action,value,pid){
    pid=pid||localPlayer().id;
    if(NET.mode==='guest')netSend({t:'cartcmd',action,value});else cartCommand(pid,action,value);
}
function cartHit(c,type){
    c.hit=.55;Sound.play('hit');
    if(type==='collapse'){c.hp=Math.max(0,c.hp-30);c.stun=1.5;c.gap-=12;}
    if(type==='rubble'){c.stun=1.5;c.gap-=25;}
    if(type==='fall'){c.slow=2;c.gap-=8;}
}
function cartFinish(win){
    if(!cartRun||cartRun.stage==='end')return;
    cartRun.stage='end';cartRun.end=3.5;cartRun.win=win;
    cartRun.message=win?'ÁNH SÁNG! KÍCH NỔ CHÔN KIẾN CHÚA!':'XE GOÒNG BỊ PHÁ — ĐỘI CỨU HỘ ĐANG RÚT LUI!';
    if(win){
        let q=zombies.find(z=>z.type===ANT.QUEEN);
        if(q){q.phase=4;q.invuln=false;q.qShield=false;q.pinned=true;q._hpPrev=q.hp;q.hp=0;zombieDown(q,labLiving()[0]||players[0]);}
        caveRun.result={reward:70+currentLevel*3,bonusUpg:true,text:'Xe goòng đã thoát! Kích nổ hầm chôn Kiến Chúa.'};
        Sound.play('explode');
    }else caveRun.result={penalty:30,text:'Cuộc tẩu thoát thất bại — mất 30 phế liệu.'};
}
function tickMinecart(dt){
    let R=cartRun;if(!R)return;
    if(R.stage==='end'){
        R.end-=dt;if(R.end<=0){cartRun=null;for(let p of activePlayers())if(p.isDowned){p.isDowned=false;p.hp=Math.max(1,p.maxHp*.3);}caveFinish();}return;
    }
    // Reassign a disconnected/downed driver's seat to the surviving partner.
    for(let c of R.carts){
        let live=c.members.filter(id=>players.some(p=>p.id===id&&!p.netLeft&&!p.isDowned));
        if(!live.includes(c.driver)){c.driver=live[0]||0;c.spotter=live[1]||0;}
        else if(!live.includes(c.spotter))c.spotter=0;
        if(!live.length)c.hp=0;
    }
    if(R.carts.every(c=>c.hp<=0)){cartFinish(false);return;}
    if(R.stage==='mount'){R.mount-=dt;if(R.mount<=0){R.stage='race';R.message='NÉ BẪY · GIỮ KHOẢNG CÁCH VỚI KIẾN CHÚA';}return;}
    R.time+=dt;
    for(let c of R.carts){
        if(c.hp<=0||c.distance>=52)continue;
        for(let k of ['stun','slow','steerCD','shotCD','pingT','tnt','hit'])c[k]=Math.max(0,c[k]-dt);
        let driver=players.find(p=>p.id===c.driver),joy=driver&&getJoystickState(driver.id);
        if(joy&&joy.active&&Math.abs(joy.dx)>.6)cartCommand(driver.id,'steer',Math.sign(joy.dx));
        let gunner=c.spotter||c.driver;
        if(getButtonState(gunner,'A','pressed'))cartCommand(gunner,'fire');
        if(getButtonState(gunner,'B','pressed'))cartCommand(gunner,'tnt');
        let speed=c.stun>0?0:c.slow>0?.5:1;
        c.distance+=speed*dt;c.gap=Math.min(100,c.gap+(speed===1?2.2:-14)*dt);
        c.spawn-=dt;c.antCD-=dt;c.tntCD-=dt;
        if(c.spawn<=0){
            c.spawn=3.8;let type=['collapse','rubble','fall'][Math.floor(Math.random()*3)];
            c.hazards.push({id:++R.seq,lane:Math.floor(Math.random()*3),type,eta:3.2});
        }
        if(c.antCD<=0){c.antCD=7;c.ants=Math.min(4,c.ants+1);}
        if(c.tntCD<=0){c.tntCD=10;c.tnt=4;}
        c.hp=Math.max(0,c.hp-c.ants*.7*dt);
        if(c.gap<=0){
            c.gap=30;c.hp=Math.max(0,c.hp-25);c.hit=.6;
            for(let id of c.members){let p=players.find(p=>p.id===id);if(p&&!p.netLeft&&!p.isDowned)p.takeDamage(p.maxHp*.4);}
            Sound.play('roar');
        }
        for(let h of c.hazards){h.eta-=dt;if(h.eta<=0&&!h.done){h.done=true;if(h.lane===c.lane)cartHit(c,h.type);}}
        c.hazards=c.hazards.filter(h=>h.eta>0);
    }
    let live=R.carts.filter(c=>c.hp>0);
    mission.progress=live.length?Math.min(...live.map(c=>Math.floor(c.distance))):0;
    if(!live.length)cartFinish(false);
    else if(live.every(c=>c.distance>=52))cartFinish(true);
    else if(R.time>=75)cartFinish(false);
}

// Capture cart keys before the normal weapon bindings (Q/E/W have different meanings here).
window.addEventListener('keydown',e=>{
    if(!cartRun||gameState!=='PLAYING')return;
    let keys=['KeyA','KeyD','ArrowLeft','ArrowRight','KeyQ','KeyW','KeyE','Space','KeyB'];
    if(!keys.includes(e.code))return;e.preventDefault();e.stopImmediatePropagation();if(e.repeat)return;
    let action,value;
    if(['KeyA','ArrowLeft','KeyD','ArrowRight'].includes(e.code)){action='steer';value=['KeyA','ArrowLeft'].includes(e.code)?-1:1;}
    else if(['KeyQ','KeyW','KeyE'].includes(e.code)){action='ping';value=['KeyQ','KeyW','KeyE'].indexOf(e.code);}
    else action=e.code==='KeyB'?'tnt':'fire';
    cartSend(action,value);
},true);
const cartNetData=netOnData;
netOnData=function(d,peer){if(d&&d.t==='cartcmd'){if(NET.mode==='host'&&peer)cartCommand(peer.pid,d.action,d.value);return;}return cartNetData(d,peer);};
const cartStoryNet=storyNetState,cartStoryApply=storyNetApply;
storyNetState=function(){let x=cartStoryNet();if(cartRun)x.mc=JSON.parse(JSON.stringify(cartRun));return x;};
storyNetApply=function(x){cartStoryApply(x);cartRun=x&&x.mc?x.mc:null;};
const cartGameLoop=gameLoop;
gameLoop=function(time){
    if(!cartRun||gameState!=='PLAYING'||NET.mode==='guest')return cartGameLoop(time);
    let dt=Math.max(0,Math.min(.1,(time-lastTime)/1000));lastTime=time;syncPcControls();
    runElapsed+=dt;tickMinecart(dt);survivalTime+=dt;updateFx(dt);draw();netHostTick(dt);
};
const cartReset=resetCaveState;
resetCaveState=function(){cartRun=null;cartReset();};

function drawMinecart(){
    let R=cartRun;if(!R)return;
    ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#0c1018';ctx.fillRect(0,0,W,H);
    ctx.textAlign='center';ctx.textBaseline='middle';
    if(typeof tutEl!=='undefined'&&tutEl)tutEl.style.display='none';
    let viewers=NET.mode?[localPlayer()]:players.slice(0,isSinglePlayer?1:2);
    let panels=viewers.length;
    viewers.forEach((p,i)=>{
        let c=cartFor(p.id);if(!c)return;
        let x=i*W/panels,w=W/panels,cx=x+w/2,top=125,bottom=H-165,trackW=Math.min(340,w-60),laneW=trackW/3;
        let radar=c.spotter===p.id||!c.spotter;
        const lx=n=>cx+(n-1)*laneW;
        ctx.save();ctx.beginPath();ctx.rect(x,0,w,H);ctx.clip();
        ctx.fillStyle=i?'#171923':'#17202a';ctx.fillRect(x+8,90,w-16,H-200);
        for(let lane=0;lane<3;lane++){
            ctx.strokeStyle='#66747e';ctx.lineWidth=3;
            for(let offset of [-laneW*.28,laneW*.28]){ctx.beginPath();ctx.moveTo(lx(lane)+offset,top);ctx.lineTo(lx(lane)+offset,bottom+70);ctx.stroke();}
            ctx.strokeStyle='#5b4538';ctx.lineWidth=5;
            for(let y=top+(c.distance*90)%35;y<bottom+70;y+=35){ctx.beginPath();ctx.moveTo(lx(lane)-laneW*.4,y);ctx.lineTo(lx(lane)+laneW*.4,y);ctx.stroke();}
        }
        if(!radar){ctx.fillStyle='rgba(7,10,18,.94)';ctx.fillRect(x+10,top,w-20,Math.max(0,(bottom-top)*.72));}
        for(let h of c.hazards){
            if(!radar&&h.eta>.8)continue;
            let y=bottom-Math.min(1,h.eta/3.2)*(bottom-top);
            drawCartHazard(h,lx(h.lane),y);
            if(radar)outlinedText(h.eta.toFixed(1)+'s',lx(h.lane),y-34,'#fff','12px Arial');
        }
        drawEscapeCart(c,p,lx(c.lane),bottom);
        if(c.pingT>0)outlinedText(['← TRÁI','↑ GIỮA','PHẢI →'][c.ping],cx,top+35,'#69f0ae','bold 27px Arial');
        outlinedText(`P${p.id} · XE ${c.id?'BETA':'ALPHA'} · ${cartRole(c,p.id)}`,cx,65,'#d2edf2','bold 15px Arial');
        outlinedText(radar?'RADAR 3,2s · báo làn an toàn':'BỤI ĐÁ · theo mũi tên đồng đội',cx,90,'#b0bec5','12px Arial');
        ctx.fillStyle='#263238';ctx.fillRect(x+25,105,w-50,12);ctx.fillStyle=c.gap<30?'#ff5252':'#66bb6a';ctx.fillRect(x+25,105,(w-50)*Math.max(0,c.gap)/100,12);
        outlinedText(`KIẾN CHÚA ↔ ${Math.max(0,Math.round(c.gap))}m · Xe ${Math.ceil(c.hp)}% · ${Math.floor(c.distance)}/52`,cx,H-120,'#fff','bold 14px Arial');
        outlinedText(`${c.ants} KIẾN BÁM${c.tnt>0?' · TNT VEN ĐƯỜNG!':''}${c.hp<=0?' · XE ĐÃ VỠ':''}`,cx,H-98,c.ants?'#ffab91':'#9de1ca','bold 14px Arial');
        ctx.restore();
    });
    outlinedText(R.stage==='mount'?`${R.message} ${Math.ceil(R.mount)}s`:R.message,W/2,28,'#ffc857',`bold ${Math.min(20,W/36)}px Arial`);
    if(R.stage==='end'){ctx.fillStyle=R.win?'rgba(245,230,175,.8)':'rgba(70,5,5,.75)';ctx.fillRect(0,0,W,H);outlinedText(R.win?'THOÁT KHỎI HẦM!':'TẨU THOÁT THẤT BẠI',W/2,H/2,R.win?'#24362b':'#fff','bold 30px Arial');}
}
function renderCartControls(){
    let box=document.getElementById('minecartControls');
    if(!box){box=document.createElement('div');box.id='minecartControls';box.style.cssText='position:fixed;bottom:12px;left:10px;right:10px;z-index:25;display:flex;justify-content:space-around;gap:8px';document.body.appendChild(box);}
    let html='';
    if(cartRun&&gameState==='PLAYING')for(let p of NET.mode?[localPlayer()]:players.slice(0,isSinglePlayer?1:2)){
        let c=cartFor(p.id);if(!c)continue;
        const btn=(txt,cmd,val=0)=>`<button style="background:#244456;color:#eaffff;border:1px solid #82bcc4;border-radius:6px;padding:10px;margin:2px" onpointerdown="event.preventDefault();cartSend('${cmd}',${val},${p.id})">${txt}</button>`;
        html+='<div style="text-align:center">';
        if(c.driver===p.id)html+=btn('← A','steer',-1)+btn('D →','steer',1);
        if(c.spotter===p.id||!c.spotter)html+=btn('Q ←','ping',0)+btn('W ↑','ping',1)+btn('E →','ping',2)+btn('Bắn','fire')+btn('TNT [B]','tnt');
        html+='</div>';
    }
    if(box._html!==html){box.innerHTML=html;box._html=html;}
}
const cartDraw=draw;
draw=function(){if(cartRun)drawMinecart();else cartDraw();renderCartControls();if(cartRun)renderLabPanels();};
