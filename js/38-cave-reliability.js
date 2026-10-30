// Navigation uses swept character circles, including axis-aligned wall edges.
function segmentHitsBox(x,y,tx,ty,o,pad=0){
    let near=0,far=1;
    for(let [start,delta,lo,hi]of [[x,tx-x,o.x-pad,o.x+o.w+pad],[y,ty-y,o.y-pad,o.y+o.h+pad]]){
        if(Math.abs(delta)<.000001){if(start<lo||start>hi)return false;continue;}
        let a=(lo-start)/delta,b=(hi-start)/delta;
        near=Math.max(near,Math.min(a,b));far=Math.min(far,Math.max(a,b));
        if(near>far)return false;
    }
    return true;
}
function navigationWalkClear(x,y,tx,ty,radius=18){
    if(!isCaveMap())return hasLineOfSight(x,y,tx,ty)&&fieldWalkClear(x,y,tx,ty,radius);
    return !obstacles.some(o=>!['tree','bush'].includes(o.type)&&segmentHitsBox(x,y,tx,ty,o,radius+1));
}
function caveEscapeTime(doctor,exit){
    if(NAV.dirty)navRebuild();
    let f=new Int16Array(NAV.n*NAV.n);navFlood([exit],f);
    let at=navOpenIdx(doctor.x,doctor.y),cells=at>=0?f[at]:-1;
    // Include corners and a short regrouping margin, rather than a fixed 30s on every maze.
    return Math.max(30,Math.ceil((cells>=0?cells*NAV.cs*1.15:Math.hypot(exit.x-doctor.x,exit.y-doctor.y))/200+10));
}
const reliableGenerateCave=generateCaveMap;
generateCaveMap=function(level){
    reliableGenerateCave(level);
    Object.assign(CAVE_GUIDE,{key:'',since:0,fkey:'',ft:0});
    if(currentMapType===14&&mineRun.stage==='maze'){
        // The escort replaces the old nest-count objective. Nests remain optional encounters.
        for(let p of caveProps)if(p.kind==='nest')p.optional=true;
    }
};
const reliableGuideGoal=caveGuideGoal;
caveGuideGoal=function(p){
    if(mineEscape)return caveRun.exit;
    if(objState==='MINE_ESCORT'&&mineRail)return mineRail;
    if(objState==='MINE_PREP')return worldFeatures.find(f=>f.kind==='queenGate'&&!f.on)||null;
    if(objState==='QUEEN')return worldFeatures.find(f=>f.kind==='queenReward'&&!f.on)||null;
    return reliableGuideGoal(p);
};
const reliableSetupFeatures=setupCaveFeatures;
setupCaveFeatures=function(){
    reliableSetupFeatures();
    if(currentMapType===10){
        // Decorative bridges had no matching river/chasm and could kill players on a floor tile.
        worldFeatures=worldFeatures.filter(f=>!['chasm','bridge'].includes(f.kind));
    }
};
const reliableDamageFeature=damageFeature;
damageFeature=function(f,damage,w,src){
    // Support pillars are an escape tool usable with any weapon, including an empty rifle's melee.
    if(mineEscape&&f.kind==='pillar'&&!f.on){
        f.hp-=damage;if(f.hp>0)return;
        f.on=true;mineEscape.front=Math.min(3850,mineEscape.front+150);
        for(let z of zombies)if(!isBossType(z.type)&&Math.hypot(z.x-f.x,z.y-f.y)<300){z.hp=0;zombieDown(z,src);}
        spawnRing(f.x,f.y,'#ad9877',260,.5,5);Sound.play('explode');return;
    }
    if(['gland','eggs','mineral','vault'].includes(f.kind)&&!f.on&&!(w?.isChainsaw||w?.type==='explosive'||w?.isExplosiveProj||w?.isTankShell||['AXE','HAMMER'].includes(w?.key))){
        if(!(f.hintT>survivalTime)){f.hintT=survivalTime+3;netToast('Cần cưa máy, rìu, búa hoặc thuốc nổ để phá mạch phụ (không bắt buộc).',2200);}return;
    }
    return reliableDamageFeature(f,damage,w,src);
};
function clearCavePresentation(){
    mapIntro.timer=0;bossWin=null;bossCast=null;radioDialogs=[];
    let toast=document.getElementById('toast');
    if(toast&&toast.textContent.includes('KIẾN CHÚA')){clearTimeout(toastTimer);toast.style.display='none';}
}
startMineCollapse=function(){
    clearCavePresentation();
    mineEscape={time:0,rock:2,front:3680};mineRun.stage='collapseWalk';objState='MINE_COLLAPSE_RUN';
    mission={type:objState,progress:0,required:1,complete:false};
    obstacles=[{type:'cave',x:0,y:0,w:1600,h:4000},{type:'cave',x:2400,y:0,w:1600,h:4000}];
    // Alternating fallen supports always leave a 500-unit passage; no dead ends.
    for(let i=0;i<5;i++)obstacles.push({type:'cave',x:i%2?2100:1600,y:2820-i*430,w:300,h:65});
    caveProps=[];zombies=[];worldFeatures=[];hazards=[];enemyBullets=[];bullets=[];fireZones=[];rescueNPCs=[];story.arena=null;
    caveRun.pendingStage=null;caveRun.endT=0;caveRun.result=null;caveRun.exit={x:2000,y:500,radius:130};hangZRun.stairs=null;
    activePlayers().forEach((p,i)=>{p.x=1895+i*65;p.y=3400;});
    for(let i=0;i<3;i++)addFeature('pillar',i%2?2290:1710,3000-i*800,{hp:60,maxHp:60});
    queueRadio('CHẠY VỀ PHÍA BẮC! Né đá rơi; bắn cột chống để làm chậm sập hầm. Đợi đủ người ở xe!',null,7);
    navRebuild();updateCamera(0,true);if(NET.mode==='host')netSendMap();
};
const reliableCaveUpdate=updateCaveWorld;
updateCaveWorld=function(dt){
    if(!mineEscape)return reliableCaveUpdate(dt);
    let e=mineEscape,crew=labLiving();e.time+=dt;e.rock-=dt;
    e.front-=Math.min(185,165+e.time)*dt;
    if(e.rock<=0&&crew.length){
        e.rock=2.6;let p=crew[Math.floor(Math.random()*crew.length)];
        let pt=findSafePoint(p.x,Math.max(650,p.y-200),45);
        hazards.push({type:'rockfall',x:pt.x,y:pt.y,radius:65,timer:1.4,t0:1.4,life:1.7,dmg:35,leave:false});
    }
    for(let p of crew)if(p.y>e.front)p.takeDot(p.maxHp*.55*dt);
    updateCaveHazards(dt);
    mission.progress=crew.length?Math.max(0,Math.min(1,(3400-Math.max(...crew.map(p=>p.y)))/2900)):0;
    if(crew.length&&crew.every(p=>Math.hypot(p.x-2000,p.y-500)<170)){
        mineEscape=null;startMinecart(true);worldFeatures=[];if(NET.mode==='host')netSendMap();
    }
    return false;
};
const reliableObjective=caveObjectiveText;
caveObjectiveText=function(){
    if(mineEscape){let crew=labLiving(),gap=crew.length?mineEscape.front-Math.max(...crew.map(p=>p.y)):0;return [`SẬP HẦM CÁCH ${Math.max(0,Math.round(gap))}m · BẮC ↑ LÊN XE · BẮN CỘT ĐỂ CẦM CHÂN`,gap<180?'#ff6b5f':'#e1c08b'];}
    if(objState==='MINE_ESCORT'&&mineRail){let near=labLiving().some(p=>Math.hypot(p.x-mineRail.x,p.y-mineRail.y)<180);return [`XE BOM ${Math.floor(100*mineRail.step/mineRail.path.length)}% · ${Math.ceil(100*mineRail.hp/mineRail.maxHp)}% HP · ${near?'ĐANG ĐẨY':'LẠI GẦN ĐỂ ĐẨY'} · ${mineRail.branch==='short'?'NHÁNH ACID':'ĐƯỜNG DÀI'}`,'#dfbb80'];}
    if(objState==='QUEEN'&&worldFeatures.some(f=>f.kind==='queenReward'&&!f.on))return ['KIẾN CHÚA ĐÃ HẠ · NHẶT LÕI ĐỂ MỞ ĐƯỜNG THOÁT','#e1c08b'];
    return reliableObjective();
};
