let campaignQueued=false,missionScrapEarned=0,emergencyRetreat=null;
function nextCampaignLevel(){return currentLevel+(campaignQueued?0:1);}
function advanceCampaignLevel(){if(campaignQueued)campaignQueued=false;else currentLevel++;}
function recoveryTeamCenter(){let team=activePlayers();return {x:team.reduce((n,p)=>n+p.x,0)/(team.length||1),y:team.reduce((n,p)=>n+p.y,0)/(team.length||1)};}
function grantScrap(amount){amount=Math.max(0,Number(amount)||0);shopScrap+=amount;if(gameState==='PLAYING'&&objState!=='HUB'&&!emergencyRetreat)missionScrapEarned+=amount;return amount;}
function recoverySaveState(){return {recovery:{queued:campaignQueued?1:0},checkpoint:objState==='HUB'?'hub':'map-start'};}
function restoreRecoverySave(s){campaignQueued=!!s?.recovery?.queued;missionScrapEarned=0;emergencyRetreat=null;}
const recoveryReset=resetRunState;
resetRunState=function(){recoveryReset();campaignQueued=false;missionScrapEarned=0;emergencyRetreat=null;};
const recoveryStart=startLevel;
startLevel=function(){missionScrapEarned=0;emergencyRetreat=null;return recoveryStart();};
baseDefenseNext=function(){return nextCampaignLevel()%5===0&&(campaignQueued||(!powerPlantRun.active&&!storyForcedRoute()));};
function beginEmergencyRetreat(reason='Nhiệm vụ thất bại.'){
    if(NET.mode==='guest'||objState==='BASE_DEF'||objState==='HUB'||emergencyRetreat||gameState==='GAMEOVER')return false;
    emergencyRetreat={time:4,reason,loss:Math.min(shopScrap,Math.floor(missionScrapEarned*.5))};
    cartRun=null;story.dialog=null;story.intro=null;story.cut=null;story.scene=null;story.train=null;
    tank.active=false;let c=recoveryTeamCenter();heliSupport.active=true;heliSupport.x=c.x;heliSupport.y=c.y-300;
    queueRadio('CỨU HỘ KHẨN CẤP! Đang đưa cả đội về căn cứ.',null,4);clearPcInputs();return true;
}
function finishEmergencyRetreat(){
    let r=emergencyRetreat;if(!r)return;emergencyRetreat=null;shopScrap=Math.max(0,shopScrap-r.loss);
    for(let p of activePlayers()){
        p.hp=p.maxHp*.5;p.vHp=0;p.isDowned=false;p.reviveProgress=0;p.baseRespawnT=0;p.status={};p.stunTimer=0;p.cold=0;
        if(p.weapon){p.weapon.ammo=Math.floor(Math.max(0,p.weapon.ammo)*.75);if(Number.isFinite(p.weapon.mag))p.weapon.mag=Math.min(p.weapon.mag,p.weapon.ammo);}
        p.reloadW=null;p.reloadT=0;p.reloadMax=0;p.perks.invulnTimer=2;
    }
    currentLevel++;campaignQueued=true;powerPlantRun.active=false;hangZRun.active=false;mineRun.active=false;mineRail=null;mineEscape=null;resetCaveState();
    enterHub();for(let p of activePlayers()){p.x=HUB.fire.x+(p.id-1)*35;p.y=HUB.fire.y+40;}
    saveCheckpoint(true);if(NET.mode==='host'){netSendMap();netSendSync();}
    netToast(`Đã rút về trại · mất ${r.loss} phế liệu nhặt trong màn và 25% đạn/độ bền · chiến dịch kế tiếp: Map ${currentLevel}.`,6500);
}
function trueBaseGameOver(){
    if(NET.mode==='guest'||gameState==='GAMEOVER')return;
    try{localStorage.removeItem(SAVE_KEY);}catch(e){}
    if(NET.mode==='host')netHostGameOver();showGameOver(currentLevel,survivalTime);
    document.getElementById('menuTitle').textContent='CĂN CỨ THẤT THỦ';
}
const recoveryBaseUpdate=updateBase;
updateBase=function(dt){
    if(NET.mode==='guest')return;let d=base.def;
    if(d?.houseNpc?.hp>0)for(let p of activePlayers()){
        if(!p.isDowned){p.baseRespawnT=0;continue;}
        p.baseRespawnT=(p.baseRespawnT>0?p.baseRespawnT:12)-dt;
        if(p.baseRespawnT<=.00001){p.isDowned=false;p.hp=p.maxHp*.5;p.vHp=0;p.reviveProgress=0;p.status={};p.stunTimer=0;p.x=BASE.house.x+(p.id-2)*35;p.y=BASE.house.y+130;p.perks.invulnTimer=3;p.baseRespawnT=0;spawnRing(p.x,p.y,'#bbbea2',100,.6);}
    }
    recoveryBaseUpdate(dt);
};
const recoveryLoop=gameLoop;
gameLoop=function(time){
    if(gameState==='PLAYING'&&emergencyRetreat){
        let dt=Math.max(0,Math.min(.1,(time-lastTime)/1000));lastTime=time;emergencyRetreat.time-=dt;runElapsed+=dt;
        let c=recoveryTeamCenter();heliSupport.x+=(c.x-heliSupport.x)*dt;heliSupport.y+=(c.y-heliSupport.y)*dt*2;
        if(emergencyRetreat.time<=0){finishEmergencyRetreat();return;}draw();netHostTick(dt);return;
    }
    return recoveryLoop(time);
};
const recoveryLabFail=labFail;
labFail=function(text){return beginEmergencyRetreat(text);};
const recoveryLabFinish=labFinish;
labFinish=function(){if(story.lab?.result?.ok===false)return beginEmergencyRetreat(story.lab.result.text);return recoveryLabFinish();};
const recoveryCartFinish=cartFinish;
cartFinish=function(win){if(!win)return beginEmergencyRetreat('Xe goòng bị phá.');return recoveryCartFinish(win);};
const recoveryCaveFinish=caveFinish;
caveFinish=function(){if(caveRun.result?.penalty)return beginEmergencyRetreat(caveRun.result.text);return recoveryCaveFinish();};
const recoveryStoryState=storyNetState,recoveryStoryApply=storyNetApply;
storyNetState=function(){return {...recoveryStoryState(),recovery:{retreat:emergencyRetreat,respawn:players.map(p=>Math.round((p.baseRespawnT||0)*10)),queued:campaignQueued?1:0}};};
storyNetApply=function(x){recoveryStoryApply(x);if(x?.recovery){emergencyRetreat=x.recovery.retreat;campaignQueued=!!x.recovery.queued;players.forEach((p,i)=>p.baseRespawnT=(x.recovery.respawn?.[i]||0)/10);}};
function drawRecoveryHud(){
    let p=localPlayer();if(gameState!=='PLAYING')return;
    if(emergencyRetreat){ctx.save();ctx.fillStyle='#10161199';ctx.fillRect(0,0,W,H);outlinedText('TRỰC THĂNG CỨU HỘ · '+Math.ceil(Math.max(0,emergencyRetreat.time))+'s',W/2,H*.42,'#d0c7a1','bold 20px Segoe UI',4);outlinedText('Đang đưa cả đội về Khu Sống Sót',W/2,H*.42+30,'#c6c6b1','14px Segoe UI',3);ctx.restore();}
    else if(objState==='BASE_DEF'&&p?.isDowned)outlinedText('HỒI SINH TẠI NHÀ CHÍNH SAU '+Math.ceil(p.baseRespawnT||12)+'s',W/2,H*.4,'#c7d0b4','bold 16px Segoe UI',4);
}
const recoveryDraw=draw;
draw=function(){recoveryDraw();drawRecoveryHud();};
quitToMenu=function(){
    if(gameState!=='PAUSED')return;if(objState==='HUB'&&NET.mode!=='guest')saveCheckpoint(true);
    if(NET.mode==='host')netSend({t:'host_quit'});netTeardown();gameState='MENU';loopToken++;clearPcInputs();
    document.getElementById('pauseOverlay').style.display='none';document.getElementById('menu').style.display='flex';refreshSaveUI();
};
const recoveryNetData=netOnData;
netOnData=function(d,peer){if(d?.t==='host_quit'&&NET.mode==='guest'){netOnPeerLost();return;}return recoveryNetData(d,peer);};
