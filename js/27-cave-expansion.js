let mineSabotage={gland:false,eggs:false,mineral:false},mineRail=null,mineEscape=null;
function setupCaveFeatures(){
    worldFeatures=[];
    if(currentMapType===10){
        addFeature('geo',2100,1900);addFeature('mushroom',1350,1750);addFeature('chasm',2350,2100,{on:true});addFeature('bridge',2450,2050);addFeature('shaft',2700,2300);return;
    }
    if(mineRun.stage==='arena'){
        addFeature('generator',2000,2400);
        for(let x of [1650,2350]){addFeature('ceiling',x,1800);caveProps.push({kind:'tntcart',x,y:2100,r:22,hp:60,maxHp:60,vx:0,vy:0,moving:false});}
        return;
    }
    if(mineRun.stage==='tunnel')return;
    let path=caveRun.railPath||[],at=f=>path[Math.min(path.length-1,Math.floor(path.length*f))]||{x:2000,y:2000};
    for(let [kind,f]of [['switch',.12],['crusher',.3],['gland',.42],['eggs',.52],['mineral',.64],['vault',.7],['furnace',.78]]){let p=at(f);addFeature(kind,p.x+50,p.y);}
    for(let f of [.25,.55,.85]){let p=at(f);addFeature('cocoon',p.x-60,p.y);}
    if(mineRun.floor<=4&&path.length>1){
        let p=path[0],end=path[path.length-1],short=[p,{x:end.x,y:p.y},end];
        // Carve an independent L-shaped shortcut, leaving the winding route intact.
        for(let i=1;i<short.length;i++){let a=short[i-1],b=short[i],x=Math.min(a.x,b.x)-60,y=Math.min(a.y,b.y)-60,w=Math.abs(a.x-b.x)+120,h=Math.abs(a.y-b.y)+120;
            obstacles=obstacles.filter(o=>o.type==='rockwall'||!(o.x<x+w&&o.x+o.w>x&&o.y<y+h&&o.y+o.h>y));
        }
        let sw=worldFeatures.find(f=>f.kind==='switch');if(sw){sw.x=p.x+65;sw.y=p.y;sw.branch='long';}
        mineRail={x:p.x,y:p.y,radius:25,step:1,path,longPath:path,shortPath:short,hp:2000,maxHp:2000,branch:'long'};
        objState='MINE_ESCORT';mission={type:objState,progress:0,required:path.length,complete:false};navRebuild();
    }
}
const mineArena=genQueenArena;
genQueenArena=function(x,y){mineArena(x,y);let q=zombies.find(z=>z.type===45);if(q){q.mineRework=true;q.airborne=false;q.qShield=false;q._hpPrev=q.hp;q.spCD=2;}queueRadio('Kiến Chúa đang ở trên đường ray! Dùng xe TNT lật ngửa nó. Khi dưới 45% máu, bật máy phát rồi bắn thạch nhũ để kéo nó xuống.',null,7);};
const mineFilter=antDamageFilter;
antDamageFilter=function(z){if(!z.mineRework)return mineFilter(z);let prev=z._hpPrev??z.hp,delta=prev-z.hp;if(delta>0){let mult=z.mineStun>0?2:z.airborne?.5:1;if(mineSabotage.mineral)mult*=1.35;z.hp=prev-delta*mult;}z._hpPrev=z.hp;z._expHit=false;};
const mineSpecial=updateSpecialZombie;
updateSpecialZombie=function(z,target,dist,ang,dt,speed){
    if(!z.mineRework)return mineSpecial(z,target,dist,ang,dt,speed);
    z.mineStun=Math.max(0,(z.mineStun||0)-dt);
    if(z.mineStun>0){z.airborne=false;z.downed=true;return true;}z.downed=false;
    if(z.hp<z.maxHp*.45&&!z.mineDark){z.mineDark=true;z.phase=2;darknessBattery=0;let g=worldFeatures.find(f=>f.kind==='generator');if(g){g.on=false;g.progress=0;}bossSay(z,'BÓNG TỐI — BẬT MÁY PHÁT!', '#9b80ff');}
    z.airborne=!!z.mineDark&&!worldFeatures.some(f=>f.kind==='generator'&&f.on);
    if(z.airborne){
        z.x+=Math.cos(ang+Math.PI/2)*70*dt;z.y+=Math.sin(ang+Math.PI/2)*70*dt;queenClamp(z);
        if(z.spCD<=0){z.spCD=3;if(!mineSabotage.eggs)for(let i=0;i<2+bossTeamCount()&&zombies.length<100;i++)zombies.push(new Zombie(z.x+(Math.random()-.5)*100,z.y+80,40));}
    }else{
        z.x+=Math.cos(ang)*Math.min(160,speed)*dt;z.y+=Math.sin(ang)*Math.min(160,speed)*dt;queenClamp(z);
        if(z.spCD<=0){z.spCD=2.2;for(let i=0;i<3+bossTeamCount();i++)queenAcid(target.x+(Math.random()-.5)*350,target.y+(Math.random()-.5)*350,1,mineSabotage.gland?58:96);}
        if(dist<z.radius+(target.radius||16)+15&&z.atkCD<=0){z.atkCD=.9;target.takeDamage(38);}
        for(let c of caveProps)if(c.kind==='tntcart'&&c.moving&&Math.hypot(c.x-z.x,c.y-z.y)<z.radius+c.r+20){z.mineStun=4;z.downed=true;c.hp=0;}
    }return true;
};
const mineDown=zombieDown;
zombieDown=function(z,src){let killed=mineDown(z,src);if(killed&&z.mineRework){mineRail=null;let core=addFeature('queenReward',z.x,z.y,{r:40});FEATURE_LABELS.queenReward='LÕI KIẾN CHÚA · NHẬN ĐỂ RÚT LUI';Sound.play('roar');}return killed;};
const mineFeatureAction=featureAction;
featureAction=function(f,p){
    if(f.kind==='queenReward'&&!f.on){f.on=true;startMineCollapse();return;}
    if(f.kind==='queenGate'&&!f.on){f.on=true;mineRail=null;caveRun.pendingStage='arena';caveRun.stageT=2;objState='MINE_COLLAPSE';return;}
    if(f.kind==='switch'&&mineRail){if(mineRail.step>1){netToast('Xe đã qua ngã rẽ.',1500);return;}mineFeatureAction(f,p);mineRail.branch=f.branch;mineRail.path=f.branch==='short'?mineRail.shortPath:mineRail.longPath;mission.required=mineRail.path.length;return;}
    return mineFeatureAction(f,p);
};
function startMineCollapse(){
    mineEscape={time:0,wave:0,front:3700};mineRun.stage='collapseWalk';objState='MINE_COLLAPSE_RUN';mission={type:objState,progress:0,required:1,complete:false};
    obstacles=[{type:'cave',x:0,y:0,w:1600,h:4000},{type:'cave',x:2400,y:0,w:1600,h:4000}];
    caveProps=[];zombies=[];worldFeatures=[];hazards=[];enemyBullets=[];bullets=[];story.arena=null;
    caveRun.pendingStage=null;caveRun.endT=0;caveRun.exit={x:2000,y:500,radius:130};
    activePlayers().forEach((p,i)=>{p.x=1900+i*55;p.y=3400;});
    for(let i=0;i<7;i++)addFeature('pillar',i%2?2260:1740,3000-i*340);
    queueRadio('Hầm đang sập! Chạy về phía Bắc, phá cột chống để chặn kiến rồi lên xe goòng!',null,6);
    navRebuild();updateCamera(0,true);if(NET.mode==='host')netSendMap();
}
const mineCaveUpdate=updateCaveWorld;
updateCaveWorld=function(dt){
    if(objState==='MINE_ESCORT'&&mineRail){
        let c=mineRail,crew=labLiving().filter(p=>Math.hypot(p.x-c.x,p.y-c.y)<180),next=c.path[c.step];
        let sw=worldFeatures.find(f=>f.kind==='switch');if(sw)c.branch=sw.branch||'long';
        if(next&&crew.length){let d=Math.hypot(next.x-c.x,next.y-c.y),step=Math.min(d,dt*(c.branch==='short'?160:96)*(1+(crew.length-1)*.2));c.x+=(next.x-c.x)/Math.max(1,d)*step;c.y+=(next.y-c.y)/Math.max(1,d)*step;if(d<30)c.step++;}
        for(let o of [...obstacles])if(o.type==='rubble'&&Math.hypot(c.x-o.x-o.w/2,c.y-o.y-o.h/2)<100)caveHitRubble(o,99999);
        for(let z of zombies)if(z.hp>0&&Math.hypot(z.x-c.x,z.y-c.y)<80)c.hp-=8*dt;
        if(c.branch==='short')for(let p of crew)acidHurt(p,4*dt);
        mission.progress=c.step;if(c.hp<=0){caveRun.result={penalty:20,text:'Xe bom bị phá hủy.'};caveFinish();mineRail=null;return true;}
        if(!next){let e=c.path[c.path.length-1];addFeature('queenGate',e.x,e.y);FEATURE_LABELS.queenGate='LÕI TỔ · VÀO ĐẤU TRƯỜNG';objState='MINE_PREP';}
        updateCaveProps(dt);updateCaveHazards(dt);return false;
    }
    if(objState==='MINE_PREP'){updateCaveProps(dt);return false;}
    if(mineEscape){
        mineEscape.time+=dt;mineEscape.front-=50*dt;mineEscape.wave-=dt;
        if(mineEscape.wave<=0){mineEscape.wave=1;for(let i=0;i<3&&zombies.length<100;i++)zombies.push(new Zombie(1800+Math.random()*400,Math.min(3900,mineEscape.front+100),40));}
        for(let p of labLiving())if(p.y>mineEscape.front)p.takeDot(14*dt);
        if(labLiving().length&&labLiving().every(p=>Math.hypot(p.x-2000,p.y-500)<170)){mineEscape=null;startMinecart();cartRun.bossDead=true;zombies=[];worldFeatures=[];if(NET.mode==='host')netSendMap();}
        return false;
    }
    if(currentMapType===10&&objState==='CAVE_ESCORT'&&caveRun.doctor?.state==='plant'&&worldFeatures.some(f=>f.kind==='geo'&&f.on))caveRun.plant=Math.min(1,caveRun.plant+dt/50);
    return mineCaveUpdate(dt);
};
const mineReset=resetCaveState;
resetCaveState=function(){mineReset();mineSabotage={gland:false,eggs:false,mineral:false};mineRail=null;mineEscape=null;worldFeatures=[];};
const mineObjective=caveObjectiveText;
caveObjectiveText=function(){if(objState==='MINE_ESCORT')return [`ĐẨY XE BOM: ${mineRail?.step||0}/${mineRail?.path.length||0} · Xe ${Math.ceil(mineRail?.hp||0)} HP · Nhánh ${mineRail?.branch==='short'?'ngắn (Acid)':'dài (an toàn)'}`,'#ffc857'];if(objState==='MINE_PREP')return ['Phá 3 mạch phụ làm yếu Boss hoặc đến LÕI TỔ để vào đấu trường.','#77ddbb'];if(mineEscape)return ['HẦM ĐANG SẬP! Chạy về phía Bắc để lên xe goòng!','#ff7777'];return mineObjective();};
const mineDrawProps=drawStoryProps;
drawStoryProps=function(T,vis){mineDrawProps(T,vis);if(mineRail){let c=mineRail;ctx.fillStyle='#a46639';ctx.fillRect(c.x-38,c.y-25,76,50);drawMiniBar(c.x,c.y-45,80,7,c.hp,c.maxHp,'#e7a95a');outlinedText('XE BOM · ĐỨNG CẠNH ĐỂ ĐẨY',c.x,c.y-60,'#ffcf8a','11px Arial');}if(mineEscape){ctx.strokeStyle='#ff6740';ctx.lineWidth=14;ctx.beginPath();ctx.moveTo(1600,mineEscape.front);ctx.lineTo(2400,mineEscape.front);ctx.stroke();}};
const mineNetState=storyNetState,mineNetApply=storyNetApply;
storyNetState=function(){return {...mineNetState(),mx:{rail:mineRail,escape:mineEscape,sabotage:mineSabotage}};};
storyNetApply=function(x){mineNetApply(x);mineRail=x?.mx?.rail||null;mineEscape=x?.mx?.escape||null;mineSabotage=x?.mx?.sabotage||{gland:false,eggs:false,mineral:false};};
const mineLabEnter=enterProceduralLab;
enterProceduralLab=function(){worldFeatures=[];banditTrucks=[];mineRail=null;mineEscape=null;return mineLabEnter();};
const mineEnterHub=enterHub;
enterHub=function(){worldFeatures=[];banditTrucks=[];mineRail=null;mineEscape=null;let r=mineEnterHub();drawSupplyHud();return r;};
