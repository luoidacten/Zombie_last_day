// Three-lane co-op escape: the mine collapses after the Queen is already dead.
let cartRun=null;
function cartSeats(roster){
    return [roster.slice(0,2),roster.slice(2,4)].filter(a=>a.length).map((a,i)=>({
        id:i,driver:a[0].id,spotter:a[1]?.id||0,members:a.map(p=>p.id),lane:1,hp:100,gap:55,
        distance:0,stun:0,slow:0,steerCD:0,shotCD:0,ants:0,ping:-1,pingT:0,hazards:[],spawn:1+i*.5,
        tnt:1,tntCD:0,antCD:5,hit:0,boost:0,boostCD:0,charge:60,supplyStep:0,dodged:0
    }));
}
function startMinecart(bossDead=false){
    clearCavePresentation();
    let crew=activePlayers(),queen=zombies.find(z=>z.type===ANT.QUEEN&&z.hp>0);
    cartRun={stage:'mount',time:0,mount:4,end:0,win:false,bossDead:!!bossDead||!queen,carts:cartSeats(crew),
        message:bossDead||!queen?'NÉ ĐÁ · BẮN ĐÁ CHẮN · TĂNG TỐC [SHIFT] · TNT [B] CÓ GIỚI HẠN':'NÉ ĐÁ · BẮN KIẾN · TĂNG TỐC [SHIFT] · TNT [B] CÓ GIỚI HẠN',seq:0};
    caveRun.kind='cart';caveRun.timer=52;caveRun.exit=null;caveRun.pendingStage=null;caveRun.endT=0;caveRun.result=null;hangZRun.stairs=null;
    hazards=[];enemyBullets=[];bullets=[];obstacles=[];caveProps=[];rescueNPCs=[];fireZones=[];
    tank.active=false;tank.crew=[];story.dialog=null;story.intro=null;story.arena=null;
    // Reuse an actual pursuer on legacy routes; never spawn a second Queen after her death.
    zombies=queen&&!cartRun.bossDead?[queen]:[];
    objState='QUEEN_RUN';mission={type:'QUEEN_RUN',progress:0,required:52,complete:false};
    crew.forEach((p,i)=>{p.x=1900+i*55;p.y=2000;});Sound.play(cartRun.bossDead?'tank':'roar');clearPcInputs();
}
genQueenTunnel=startMinecart;
function cartFor(pid){return cartRun&&cartRun.carts.find(c=>c.members.includes(pid));}
function cartRole(c,pid){return c.driver===pid?(c.spotter?'LÁI XE':'LÁI + RADAR'):c.spotter===pid?'DẪN ĐƯỜNG':'CHỜ CỨU HỘ';}
function cartCommand(pid,action,value){
    if(!cartRun||cartRun.stage!=='race'||gameState!=='PLAYING')return;
    let p=players.find(p=>p.id===pid&&!p.netLeft&&!p.isDowned),c=cartFor(pid);
    if(!p||!c||c.hp<=0||c.distance>=52)return;
    if(action==='steer'&&c.driver===pid&&c.steerCD<=0&&c.stun<=0&&(value===-1||value===1)){
        c.lane=Math.max(0,Math.min(2,c.lane+value));c.steerCD=.2;
    }
    if(action==='boost'&&c.driver===pid&&c.boostCD<=0&&c.charge>=45&&c.stun<=0){
        c.charge-=45;c.boost=1.8;c.boostCD=7;Sound.play('reload');
    }
    let radar=c.spotter===pid||(!c.spotter&&c.driver===pid);
    if(action==='ping'&&radar&&Number.isInteger(value)&&value>=0&&value<=2){c.ping=value;c.pingT=2.5;}
    if(action==='fire'&&radar&&c.shotCD<=0){
        c.shotCD=.35;
        if(cartRun.bossDead){
            let rock=c.hazards.filter(h=>h.type==='rubble'&&!h.cleared&&h.lane===c.lane&&h.eta>0&&h.eta<=1.4).sort((a,b)=>a.eta-b.eta)[0];
            if(rock){rock.shots=(rock.shots||0)+1;if(rock.shots>=2)rock.cleared=true;}
        }else if(c.ants>0)c.ants--;
        Sound.play('pistol');
    }
    if(action==='tnt'&&radar&&c.tnt>0&&c.tntCD<=0){
        c.tnt--;c.tntCD=12;c.gap=Math.min(85,c.gap+10);c.ants=0;c.hit=.2;
        for(let h of c.hazards)if(h.lane===c.lane&&h.eta<1.4)h.cleared=true;
        Sound.play('explode');
    }
}
function cartSend(action,value,pid){pid=pid||localPlayer().id;if(NET.mode==='guest')netSend({t:'cartcmd',action,value});else cartCommand(pid,action,value);}
function cartHit(c,type){
    c.hit=.55;Sound.play('hit');
    if(type==='collapse'){c.hp=Math.max(0,c.hp-26);c.stun=.9;c.gap-=12;}
    if(type==='rubble'){c.hp=Math.max(0,c.hp-16);c.stun=.65;c.gap-=14;}
    if(type==='fall'){c.hp=Math.max(0,c.hp-12);c.slow=1.6;c.gap-=9;}
}
function cartFinish(win){
    if(!cartRun||cartRun.stage==='end')return;
    cartRun.stage='end';cartRun.end=3.5;cartRun.win=win;
    cartRun.message=win?'ÁNH SÁNG! ĐỘI ĐÃ THOÁT KHỎI HẦM!':'XE GOÒNG BỊ PHÁ — ĐANG GỌI CỨU HỘ!';
    if(win){
        let q=zombies.find(z=>z.type===ANT.QUEEN&&z.hp>0);
        if(q&&!cartRun.bossDead){q.phase=4;q.invuln=false;q.qShield=false;q.pinned=true;q._hpPrev=q.hp;q.hp=0;zombieDown(q,labLiving()[0]||players[0]);}
        caveRun.result={reward:70+currentLevel*3,bonusUpg:true,text:'Xe goòng đã thoát khỏi hầm sập!'};Sound.play('explode');
    }else caveRun.result={penalty:30,text:'Cuộc tẩu thoát thất bại.'};
}
function cartHazardRow(c,R){
    let hard=difficulty==='hell'?2:difficulty==='hard'?1:0;
    c.spawn=3.2-hard*.2;let warning=2.8-hard*.2,row=++R.seq,safe=Math.floor(Math.random()*3);
    let lanes=[0,1,2].filter(l=>l!==safe);
    if(c.distance<12||Math.random()<.4)lanes=[lanes[Math.floor(Math.random()*2)]];
    if(!lanes.length)lanes=[(safe+1)%3];
    for(let lane of lanes)c.hazards.push({id:++R.seq,row,lane,type:['collapse','rubble','fall'][Math.floor(Math.random()*3)],eta:warning,warning});
}
function tickMinecart(dt){
    let R=cartRun;if(!R)return;
    if(R.stage==='end'){R.end-=dt;if(R.end<=0){cartRun=null;for(let p of activePlayers())if(p.isDowned){p.isDowned=false;p.hp=Math.max(1,p.maxHp*.3);}caveFinish();}return;}
    for(let c of R.carts){
        let live=c.members.filter(id=>players.some(p=>p.id===id&&!p.netLeft&&!p.isDowned));
        if(!live.includes(c.driver))c.driver=live[0]||0;
        c.spotter=live.find(id=>id!==c.driver)||0;
        if(!live.length)c.hp=0;
    }
    if(R.carts.every(c=>c.hp<=0)){cartFinish(false);return;}
    if(R.stage==='mount'){R.mount-=dt;if(R.mount<=0)R.stage='race';return;}
    R.time+=dt;
    for(let c of R.carts){
        if(c.hp<=0||c.distance>=52)continue;
        for(let k of ['stun','slow','steerCD','shotCD','pingT','hit','boost','boostCD','tntCD'])c[k]=Math.max(0,c[k]-dt);
        let driver=players.find(p=>p.id===c.driver),joy=driver&&getJoystickState(driver.id);
        if(joy?.active&&Math.abs(joy.dx)>.6)cartCommand(c.driver,'steer',Math.sign(joy.dx));
        let gunner=c.spotter||c.driver;
        if(getButtonState(gunner,'A','pressed'))cartCommand(gunner,'fire');
        if(getButtonState(gunner,'B','pressed'))cartCommand(gunner,'tnt');
        if(getButtonState(c.driver,'C','pressed'))cartCommand(c.driver,'boost');
        let speed=c.stun>0?0:c.slow>0?.5:c.boost>0?1.25:1;
        c.distance=Math.min(52,c.distance+speed*dt);
        let pressure=.85+c.distance/100+(difficulty==='hell'?.35:difficulty==='hard'?.2:0);
        c.gap=Math.min(85,c.gap+((c.boost>0&&speed>1?6:0)-pressure-(1-Math.min(speed,1))*12)*dt);
        c.spawn-=dt;if(!R.bossDead)c.antCD-=dt;
        if(c.spawn<=0)cartHazardRow(c,R);
        if(R.bossDead)c.ants=0;else if(c.antCD<=0){c.antCD=6;c.ants=Math.min(4,c.ants+1);}
        if(c.supplyStep<2&&c.distance>=(c.supplyStep+1)*18){c.supplyStep++;c.tnt=Math.min(2,c.tnt+1);c.charge=Math.min(100,c.charge+15);}
        c.hp=Math.max(0,c.hp-c.ants*.85*dt);
        if(c.gap<=0){c.gap=18;c.hp=Math.max(0,c.hp-35);c.hit=.6;Sound.play(R.bossDead?'explode':'roar');}
        for(let h of c.hazards)h.eta-=dt;
        let due=[...new Set(c.hazards.filter(h=>h.eta<=0).map(h=>h.row??h.id))];
        for(let row of due){
            let hs=c.hazards.filter(h=>(h.row??h.id)===row),hit=hs.find(h=>h.lane===c.lane&&!h.cleared);
            if(hit)cartHit(c,hit.type);else{c.gap=Math.min(85,c.gap+2);c.charge=Math.min(100,c.charge+8);c.dodged++;}
            for(let h of hs)h.done=true;
        }
        c.hazards=c.hazards.filter(h=>!h.done);
    }
    let live=R.carts.filter(c=>c.hp>0);mission.progress=live.length?Math.min(...live.map(c=>Math.floor(c.distance))):0;
    if(!live.length||R.time>=80)cartFinish(false);else if(live.every(c=>c.distance>=52))cartFinish(true);
}

// Capture cart keys before the normal weapon bindings (Q/E/W have different meanings here).
window.addEventListener('keydown',e=>{
    if(!cartRun||gameState!=='PLAYING')return;
    let keys=['KeyA','KeyD','ArrowLeft','ArrowRight','KeyQ','KeyW','KeyE','Space','KeyB','ShiftLeft','ShiftRight','KeyC'];
    if(!keys.includes(e.code))return;e.preventDefault();e.stopImmediatePropagation();if(e.repeat)return;
    let action,value;
    if(['KeyA','ArrowLeft','KeyD','ArrowRight'].includes(e.code)){action='steer';value=['KeyA','ArrowLeft'].includes(e.code)?-1:1;}
    else if(['KeyQ','KeyW','KeyE'].includes(e.code)){action='ping';value=['KeyQ','KeyW','KeyE'].indexOf(e.code);}
    else action=e.code==='KeyB'?'tnt':['ShiftLeft','ShiftRight','KeyC'].includes(e.code)?'boost':'fire';
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
    ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#100e0d';ctx.fillRect(0,0,W,H);ctx.textAlign='center';ctx.textBaseline='middle';
    if(typeof tutEl!=='undefined'&&tutEl)tutEl.style.display='none';
    let viewers=NET.mode?[localPlayer()]:players.slice(0,isSinglePlayer?1:2),panels=viewers.length;
    viewers.forEach((p,i)=>{
        let c=cartFor(p.id);if(!c)return;
        let x=i*W/panels,w=W/panels,cx=x+w/2,top=92,bottom=H-145,trackW=Math.min(360,w-42),laneW=trackW/3;
        let radar=c.spotter===p.id||(!c.spotter&&c.driver===p.id),lx=n=>cx+(n-1)*laneW;
        ctx.save();ctx.beginPath();ctx.rect(x,0,w,H);ctx.clip();
        ctx.fillStyle='#201b17';ctx.fillRect(x+8,top,w-16,Math.max(0,bottom-top+60));
        for(let lane=0;lane<3;lane++){
            ctx.strokeStyle='#7d7564';ctx.lineWidth=3;
            for(let offset of [-laneW*.28,laneW*.28]){ctx.beginPath();ctx.moveTo(lx(lane)+offset,top);ctx.lineTo(lx(lane)+offset,bottom+45);ctx.stroke();}
            ctx.strokeStyle='#594735';ctx.lineWidth=5;
            for(let y=top+(c.distance*100)%35;y<bottom+45;y+=35){ctx.beginPath();ctx.moveTo(lx(lane)-laneW*.4,y);ctx.lineTo(lx(lane)+laneW*.4,y);ctx.stroke();}
        }
        // After the Queen's death only dust and falling rock follow the cart.
        let chaseY=bottom+16+Math.max(0,c.gap)*.5,pulse=.7+Math.sin(R.time*11)*.15;
        ctx.fillStyle=`rgba(95,46,31,${pulse})`;ctx.fillRect(x+8,chaseY,w-16,60);
        for(let n=0;n<8;n++){let ax=x+25+(n*(w-50)/8),ay=chaseY+8+Math.sin(n+R.time*8)*5;
            if(R.bossDead){ctx.fillStyle='#75614d';ctx.beginPath();ctx.moveTo(ax-11,ay+8);ctx.lineTo(ax-7,ay-9);ctx.lineTo(ax+7,ay-5);ctx.lineTo(ax+13,ay+9);ctx.closePath();ctx.fill();}
            else{ctx.strokeStyle='#b3654b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ax-9,ay-5);ctx.lineTo(ax,ay);ctx.lineTo(ax+9,ay-5);ctx.moveTo(ax-9,ay+5);ctx.lineTo(ax,ay);ctx.lineTo(ax+9,ay+5);ctx.stroke();ctx.fillStyle='#3d211b';ctx.beginPath();ctx.arc(ax,ay,5,0,Math.PI*2);ctx.fill();}}
        for(let h of c.hazards){
            if(h.cleared||(!radar&&h.eta>1.25))continue;
            let y=bottom-Math.min(1,h.eta/(h.warning||2.8))*(bottom-top);
            drawCartHazard(h,lx(h.lane),y);outlinedText(h.eta.toFixed(1)+'s',lx(h.lane),Math.max(top+10,y-30),'#ebc4a1','11px Arial');
        }
        if(c.distance>43){ctx.fillStyle=`rgba(240,215,161,${(c.distance-43)/18})`;ctx.fillRect(cx-trackW/2,top,trackW,30);}
        drawEscapeCart(c,p,lx(c.lane),bottom);
        if(c.pingT>0)outlinedText(['← TRÁI','↑ GIỮA','PHẢI →'][c.ping],cx,top+28,'#d8dba7','bold 24px Arial');
        if(c.boost>0)outlinedText('TĂNG TỐC!',cx,bottom-55,'#e6b36a','bold 18px Arial');
        outlinedText(`P${p.id} · ${cartRole(c,p.id)}`,cx,49,'#d7c8ae','bold 13px Arial');
        ctx.fillStyle='#34261f';ctx.fillRect(x+24,64,w-48,9);ctx.fillStyle=c.gap<22?'#bc4e3d':'#b49b68';ctx.fillRect(x+24,64,(w-48)*Math.max(0,c.gap)/85,9);
        outlinedText(`${R.bossDead?'SẬP HẦM':'KIẾN CHÚA'} ${Math.max(0,Math.round(c.gap))}m · XE ${Math.ceil(c.hp)}% · ${Math.floor(c.distance)}/52`,cx,83,'#d5c7b2',`${w<350?10:12}px Arial`);
        outlinedText(`${R.bossDead?'SPACE: BẮN ĐÁ CHẮN':c.ants+' KIẾN BÁM'} · TNT ${c.tnt} · TỐC ${Math.floor(c.charge)}/45`,cx,H-89,c.ants?'#e79a79':'#c7b691',`${w<350?10:12}px Arial`);
        if(c.hp<=0)outlinedText('XE ĐÃ VỠ · CHỜ ĐỒNG ĐỘI',cx,bottom-50,'#e5937b','bold 14px Arial');
        ctx.restore();
    });
    outlinedText(R.stage==='mount'?`LÊN XE · ${Math.ceil(R.mount)}s · NÉ BẪY / ${R.bossDead?'BẮN ĐÁ':'BẮN KIẾN'} / TĂNG TỐC`:R.time>40?'SẮP TỚI CỬA HẦM — GIỮ VỮNG TAY LÁI!':R.bossDead?'TẨU THOÁT · HẦM ĐANG SẬP SAU LƯNG!':'TẨU THOÁT · ĐỪNG ĐỂ KIẾN CHÚA BẮT KỊP',W/2,22,'#e6b681',`bold ${Math.min(16,W/33)}px Arial`);
    if(R.stage==='end'){ctx.fillStyle=R.win?'rgba(220,193,140,.85)':'rgba(70,5,5,.8)';ctx.fillRect(0,0,W,H);outlinedText(R.win?'THOÁT KHỎI HẦM!':'ĐANG GỌI CỨU HỘ',W/2,H/2,R.win?'#29271f':'#ead8c5','bold 28px Arial');}
}
function renderCartControls(){
    let box=document.getElementById('minecartControls');
    if(!box){box=document.createElement('div');box.id='minecartControls';document.body.appendChild(box);}
    box.style.cssText='position:fixed;bottom:7px;left:8px;right:8px;z-index:25;display:flex;justify-content:space-around;gap:8px';
    let html='';
    if(cartRun&&gameState==='PLAYING')for(let p of NET.mode?[localPlayer()]:players.slice(0,isSinglePlayer?1:2)){
        let c=cartFor(p.id);if(!c)continue;
        const btn=(txt,cmd,val=0)=>`<button ${cmd==='boost'&&(c.boostCD>0||c.charge<45)||cmd==='tnt'&&(c.tntCD>0||!c.tnt)?'disabled style="opacity:.45;':'style="'}touch-action:none;background:#30271f;color:#e7d6b7;border:1px solid #8b7355;border-radius:6px;padding:9px 8px;font:12px Arial;min-height:38px" onpointerdown="event.preventDefault();cartSend('${cmd}',${val},${p.id})">${txt}</button>`;
        html+='<div style="display:flex;justify-content:center;align-items:center;flex-wrap:wrap;gap:4px;flex:1">';
        if(c.hp>0&&!p.isDowned){
            if(c.driver===p.id)html+=btn('← A','steer',-1)+btn('D →','steer',1)+btn('TỐC [Shift]','boost');
            if(c.spotter===p.id||(!c.spotter&&c.driver===p.id)){
                if(c.spotter)html+=btn('Q ←','ping',0)+btn('W ↑','ping',1)+btn('E →','ping',2);
                html+=btn(cartRun.bossDead?'BẮN ĐÁ [Space]':'BẮN [Space]','fire')+btn('TNT [B]','tnt');
            }
        }else html+='<span style="color:#baa38a">Chờ đội cứu hộ</span>';
        html+='</div>';
    }
    if(box._html!==html){box.innerHTML=html;box._html=html;}
}
const cartDraw=draw;
draw=function(){if(cartRun)drawMinecart();else cartDraw();renderCartControls();if(cartRun)renderLabPanels();};
