STATUS.FROST='frost';STATUS.FROZEN='frozen';
STATUS_STYLE.frost={color:'#9eb8b8',label:'RÉT'};STATUS_STYLE.frozen={color:'#c6dfe0',label:'ĐÓNG BĂNG'};
NET_STATUS.push('frost','frozen');NET_EB_T.push('ice');NET_HZ_T.push('snowwarn');
FEATURE_LABELS.brazier='LỬA SƯỞI · ĐẾN GẦN ĐỂ ẤM';
ZOMBIE_LABELS[55]='Xác Băng';ZOMBIE_LABELS[56]='Phun Băng';ZOMBIE_LABELS[57]='Khổng Lồ Băng';
const snowApplyStatus=applyStatus;
applyStatus=function(target,id,opts={}){
    if(id!==STATUS.FROST&&id!==STATUS.FROZEN)return snowApplyStatus(target,id,opts);
    if(!target||target.hp<=0)return null;let bag=ensureStatusBag(target);
    if(id===STATUS.FROZEN){if(target.frostGrace>0)return null;bag.frozen={id,timer:Math.min(1.4,opts.duration||1.1),stacks:1};if(target instanceof Player)target.stunTimer=Math.max(target.stunTimer||0,bag.frozen.timer);target.frostGrace=4;return bag.frozen;}
    let stacks=Math.min(5,(bag.frost?.stacks||0)+(opts.stacks||1));bag.frost={id,timer:Math.max(bag.frost?.timer||0,opts.duration||5),stacks};
    if(stacks>=5&&!(target.frostGrace>0)){delete bag.frost;return applyStatus(target,STATUS.FROZEN,{duration:1.1});}return bag.frost;
};
const snowMove=getStatusMoveMult;
getStatusMoveMult=function(e){if(getStatus(e,STATUS.FROZEN))return 0;let n=getStatus(e,STATUS.FROST)?.stacks||0;return snowMove(e)*(1-Math.min(.4,n*.08));};
function snowWarm(p){return worldFeatures.some(f=>f.kind==='brazier'&&Math.hypot(f.x-p.x,f.y-p.y)<240)||fireZones.some(f=>f.kind!=='acid'&&f.kind!=='arrow'&&Math.hypot(f.x-p.x,f.y-p.y)<(f.radius||40)+100);}
const snowPlayerUpdate=Player.prototype.update;
Player.prototype.update=function(dt){
    this.frostGrace=Math.max(0,(this.frostGrace||0)-dt);
    if(NET.mode!=='guest'&&!this.isDowned){
        if(currentMapType===17&&objState!=='HUB'){
            let warm=snowWarm(this),rate=warm?-22:(Math.hypot(this.vx||0,this.vy||0)>10?1.1:2);
            this.cold=Math.max(0,Math.min(100,(this.cold||0)+rate*dt));
            if(warm){delete this.status.frost;delete this.status.frozen;}
            else if(this.cold>=100&&!(this.frostGrace>0)){applyPlayerStatus(this,STATUS.FROZEN,{duration:1.1});this.cold=55;}
        }else this.cold=Math.max(0,(this.cold||0)-20*dt);
    }
    return snowPlayerUpdate.call(this,dt);
};
function genSnowLegacy(){
    bgMapColor='#778780';currentWeather=9;for(let i=0;i<100;i++){let x=120+Math.random()*3760,y=120+Math.random()*3760;if(Math.hypot(x-2000,y-2000)>250)obstacles.push({type:'tree',x,y,w:60+Math.random()*45,h:60+Math.random()*45});}
}
const snowWeather=pickWeatherForMap;
pickWeatherForMap=function(...args){let result=snowWeather(...args);if(currentMapType===17)currentWeather=9;return result;};
const snowPool=zombieTypePool;
zombieTypePool=function(){return currentMapType===17?[0,55,55,56,56,57]:snowPool();};
const snowRoster=buildMapRoster;
buildMapRoster=function(){if(currentMapType===17)return mapRoster=[0,55,56,57];return snowRoster();};
function snowHit(target,amount,stacks){
    if(target===tank){tank.hp-=amount;return;}if(typeof target.takeDamage==='function')target.takeDamage(amount);if(target instanceof Player)applyPlayerStatus(target,STATUS.FROST,{duration:6,stacks});
}
function updateSnowZombie(z,target,dist,ang,dt,speed){
    z.frostGrace=Math.max(0,(z.frostGrace||0)-dt);if(z.stunTimer>0||getStatus(z,STATUS.FROZEN))return true;
    if(z.type===56){if(dist>320){z.x+=Math.cos(ang)*speed*dt;z.y+=Math.sin(ang)*speed*dt;}if(dist<620&&z.atkCD<=0){z.atkCD=2.8;enemyBullets.push(new EnemyBullet(z.x,z.y,target.x,target.y,'ice'));}}
    else{
        if(z.frostCast>0){z.frostCast-=dt;if(z.frostCast<=0)for(let p of activePlayers())if(!p.isDowned&&Math.hypot(p.x-z.x,p.y-z.y)<180)snowHit(p,22,3);}
        else if(z.type===57&&dist<260&&z.spCD<=0){z.spCD=5;z.frostCast=.85;hazards.push({type:'snowwarn',x:z.x,y:z.y,radius:180,timer:.85,life:.9,dmg:0});}
        else{z.x+=Math.cos(ang)*speed*dt;z.y+=Math.sin(ang)*speed*dt;if(dist<z.radius+(target.radius||16)+12&&z.atkCD<=0){z.atkCD=1.1;snowHit(target,z.type===57?27:16,z.type===57?2:1);}}
    }
    resolveCollision(z);return true;
}
function queenFlightInit(z){
    if(z.flightArmorMax)return;z.flightArmorMax=Math.max(300,z.maxHp*.08);z.flightArmor=z.flightArmorMax;z.flightT=14;z.groundT=0;z.flightWeak=false;z.airborne=true;z._hpPrev=z._hpPrev??z.maxHp;
}
function queenLand(z,weak=false){
    z.airborne=false;z.downed=weak;z.flightWeak=weak;z.groundT=weak?7:4;z.exhaust=weak?7:0;z.isCharging=false;z.warnBeamTimer=0;z.barrageT=0;
    bossSay(z,weak?'GIÁP VỠ · SUY YẾU x2!':'HẠ CÁNH · TẤN CÔNG NGAY!',weak?'#d6ba85':'#b6c8a3');spawnRing(z.x,z.y,'#b3bda0',190,.5,4);
}
function queenAirHit(z,damage){
    queenFlightInit(z);if(!z.airborne)return;
    z.flightArmor=Math.max(0,z.flightArmor-damage);z.flightT=Math.max(0,z.flightT-damage/z.flightArmorMax*8);z.hitFlash=.08;
    if(z.flightArmor<=0)queenLand(z,true);else if(z.flightT<=0)queenLand(z,false);
}
const flightDamageFilter=antDamageFilter;
antDamageFilter=function(z){
    if(z.type!==45||z.phase!==1)return flightDamageFilter(z);
    queenFlightInit(z);let prev=z._hpPrev??z.maxHp,delta=prev-z.hp;
    if(delta>0){
        if(z.airborne){z.hp=prev;queenAirHit(z,delta);}
        else{let mult=z.flightWeak||z.mineStun>0?2:1;if(z.mineRework&&mineSabotage.mineral)mult*=1.35;z.hp=Math.max(z.maxHp*(z.mineRework?.45:.68),prev-delta*mult);}
    }
    z._hpPrev=z.hp;z._expHit=false;
};
function queenFlightPhase(z,target,dist,ang,dt){
    queenFlightInit(z);let A=caveRun.arena||{x:MAP_SIZE.w/2,y:MAP_SIZE.h/2,r:740};
    let threshold=z.mineRework?.45:.68;
    if(z.hp<=z.maxHp*threshold){
        if(z.mineRework){z.phase=2;z.mineDark=true;z.airborne=false;darknessBattery=0;let g=worldFeatures.find(f=>f.kind==='generator');if(g){g.on=false;g.progress=0;}bossSay(z,'BÓNG TỐI · BẬT MÁY PHÁT!');return false;}
        queenSpawnTentacles(z,A,1);return true;
    }
    z.antsT=(z.antsT??3)-dt;if(z.antsT<=0){z.antsT=4.8;let n=3+bossTeamCount();if(!z.mineRework||!mineSabotage.eggs)for(let i=0;i<n&&zombies.filter(e=>e.type>=40&&e.type<=43&&e.hp>0).length<32+bossTeamCount()*4;i++){let a=Math.random()*Math.PI*2;antSpawn({x:A.x+Math.cos(a)*(A.r-130),y:A.y+Math.sin(a)*(A.r-130),r:20},i===0?43:40,1);}}
    if(!z.airborne){
        z.groundT-=dt;z.exhaust=z.flightWeak?Math.max(0,z.groundT):0;
        for(let c of caveProps)if(c.kind==='tntcart'&&c.moving&&c.hp>0&&Math.hypot(c.x-z.x,c.y-z.y)<z.radius+(c.r||22)+20){c.hp=0;queenLand(z,true);}
        if(z.groundT<=0){z.airborne=true;z.downed=false;z.flightWeak=false;z.flightArmor=z.flightArmorMax*.5;z.flightT=14;z.exhaust=0;bossSay(z,'CẤT CÁNH · HỒI NỬA GIÁP!');}
        return true;
    }
    z.flightT-=dt;if(z.flightT<=0){queenLand(z,false);return true;}
    if(z.spCD<=0){z.spCD=2.8;queenVenomVolley(z,ang,5+bossTeamCount(),.22);queenAcid(target.x,target.y,1.3,75);}
    let want=dist>430?ang:ang+Math.PI/2;z.x+=Math.cos(want)*95*dt;z.y+=Math.sin(want)*95*dt;queenClamp(z);return true;
}
const snowSpecial=updateSpecialZombie;
updateSpecialZombie=function(z,target,dist,ang,dt,speed){
    if(z.type>=55&&z.type<=57)return updateSnowZombie(z,target,dist,ang,dt,speed);
    if(z.type===45&&z.phase===1&&queenFlightPhase(z,target,dist,ang,dt))return true;
    return snowSpecial(z,target,dist,ang,dt,speed);
};
const coldNetEncode=netEncodePlayer,coldNetDecode=netDecodePlayer;
netEncodePlayer=function(p){let e=coldNetEncode(p);e.push(Math.round(p.cold||0));return e;};
netDecodePlayer=function(p,e,local){coldNetDecode(p,e,local);p.cold=e[32]||0;};
function drawSnowHud(){
    if(currentMapType!==17||gameState!=='PLAYING')return;let p=localPlayer();if(!p)return;let mates=NET.mode?Math.max(0,players.length-1)*20:0,y=H<480?146+mates:154+mates;
    ctx.save();artBox(10,y,176,35,'#19231fec','#586b60',4);ctx.font='10px Segoe UI';ctx.fillStyle='#c2d1c9';ctx.textAlign='left';ctx.fillText((snowWarm(p)?'ĐANG SƯỞI ẤM':'LẠNH '+Math.round(p.cold||0)+'% · TÌM LỬA'),18,y+13);hudBar(18,y+23,160,4,(p.cold||0)/100,'#a3bebd');ctx.restore();
}
