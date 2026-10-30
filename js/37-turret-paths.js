// Three independent paths; only one may exceed tier two and only two may be used.
const TURRET_PATHS={
 mg:[
  [['Đạn cứng','Sát thương +25%.'],['Đạn xuyên giáp','Xuyên giáp và thêm một mục tiêu.'],['Minigun 6 nòng','Tốc bắn tăng mạnh.'],['Gatling Plasma','Tia plasma xuyên tối đa 24 mục tiêu.']],
  [['Đạn áp chế','Đẩy lùi mục tiêu.'],['Đạn trọng lực','Đẩy lùi mạnh hơn.'],['Đạn nổ mảnh','Nổ nhỏ và phá khiên cướp.'],['Pháo tự động 30mm','Choáng và đẩy lùi cả quái lớn.']],
  [['Chùm ba viên','Mỗi phát bắn ba viên tỏa.'],['Tỏa đạn rộng','Đạn chùm mạnh hơn và tăng tầm.'],['Súng đôi độc lập','Khóa hai mục tiêu cùng lúc.'],['Bão đạn 360°','Bắn vòng tròn liên tục.']]],
 sniper:[
  [['Ống ngắm chuẩn xác','20% chí mạng ×2.'],['Đạn headshot','35% chí mạng ×2,4.'],['Đạn giam cầm','Choáng quái lớn/boss 2 giây.'],['Pháo Railgun','Xuyên giáp, thêm 1,5% máu tối đa và tạo vết rách không gian.']],
  [['Nảy đạn','Nảy thêm một mục tiêu.'],['Liên hoàn','Nảy thêm ba mục tiêu.'],['Bảo vệ khẩn cấp','Tốc bắn tăng khi cửa mất máu.'],['Xạ thủ tinh nhuệ','Bắn liên thanh, mỗi lần nảy nổ mảnh.']],
  [['Laser chỉ điểm','Mục tiêu nhận thêm 25% sát thương đòn đánh.'],['Khóa mục tiêu','Đánh dấu lâu hơn, tăng tầm.'],['Thu hồi chiến lợi phẩm','Hạ địch bằng ụ cho thêm 2 phế liệu.'],['Trạm thả tiếp tế','Mỗi 25 giây thả đạn và hộp cứu thương trong sân.']]],
 flame:[
  [['Vòi phun dài','Tầm +40.'],['Nhiệt độ cao','Tăng sát thương và Thiêu Đốt.'],['Lửa xanh','Đốt xuyên giáp sắt.'],['Lò nhiệt hạch','Hào quang đốt quanh ụ và cầu lửa tầm xa.']],
  [['Vệt lửa','Để lại vũng cháy.'],['Nhiên liệu đặc','Vũng cháy tồn tại lâu hơn.'],['Nhựa đường','Làm chậm 60% trong vùng cháy.'],['Biển lửa Napalm','Vùng cháy rộng, thiêu hủy đạn cướp.']],
  [['Hóa chất ăn mòn','Lửa gây thêm Ăn Mòn.'],['Chất xúc tác','Ăn mòn nhiều tầng hơn.'],['Ụ phun Acid','Đổi sang axit; cần đã hạ Kiến Chúa.'],['Sương bào tử độc','Gây Sợ Hãi, xác trúng độc nổ dây chuyền.']]],
 mortar:[
  [['Đầu đạn lớn','Bán kính nổ +35.'],['Đầu đạn siêu trọng','Tăng bán kính và sát thương nổ.'],['Sóng chấn động','Nổ làm choáng diện rộng.'],['Siêu pháo nhiệt áp','Vụ nổ cực lớn để lại bức xạ.']],
  [['Nạp đạn nhanh','Giảm 25% thời gian nạp.'],['Băng tải đạn','Giảm 45% thời gian nạp.'],['Cụm ba nòng','Bắn ba quả mỗi loạt.'],['Katyusha','Bắn 12 tên lửa định hướng mỗi loạt.']],
  [['Đạn chùm','Nổ văng năm bom con.'],['Bom phân mảnh','Tăng sát thương bom con.'],['Pháo sáng','Phát hiện và xóa tàng hình.'],['Đạn EMP','Tước cuồng nộ, tê liệt xe cướp, khóa kỹ năng boss 3 giây.']]],
 tesla:[
  [['Giật lan','Tăng số mục tiêu giật.'],['Hồ quang lớn','Giật tối đa tám mục tiêu.'],['Cầu sét','Cầu sét lăn dọc cổng và đẩy lùi.'],['Cột Kình Lôi','Sét trời gây nổ Quá Tải diện rộng.']],
  [['Tích điện','30% gây choáng.'],['Xung điện mạnh','60% gây choáng.'],['Mạng hàng rào điện','Nối các Tesla thành hàng rào gây sát thương.'],['Trạm phát xung','Ụ khác và người gần đó tăng 35% tốc bắn.']],
  [['Lệch đạn','Có thể làm lệch đạn cướp.'],['Lá chắn từ trường','Làm lệch toàn bộ đạn cướp đến gần.'],['Truyền năng lượng','Sửa và tạo giáp ảo cho nhà/cửa còn sống sau 5 giây không bị đánh.'],['Lõi hút từ trường','Gom quái trước cổng, giảm hiệu lực với boss.']]]
};
let turretFields=[],turretOrdnance=[],turretBursts=[],turretAlertT=0;
function turretPaths(t){
    if(!t)return [0,0,0];if(!Array.isArray(t.p))t.p=[Math.max(0,Math.min(4,(t.l|0)-1)),0,0];
    let p=t.p.slice(0,3).map(v=>Math.max(0,Math.min(4,v|0)));while(p.length<3)p.push(0);
    let main=p.indexOf(Math.max(...p)),second=false;for(let i=0;i<3;i++)if(i!==main&&p[i]){if(second)p[i]=0;else{p[i]=Math.min(2,p[i]);second=true;}}
    t.p=p;t.l=1+Math.max(...p);return p;
}
function turretStaff(t){return Math.max(...turretPaths(t))>=4?2:1;}
turretOperators=function(){let used=0;for(let t of baseTurretList())if(t&&used+turretStaff(t)<=basePop())used+=turretStaff(t);return used;};
turretManned=function(i){let list=baseTurretList(),used=0;for(let j=0;j<list.length;j++){let t=list[j];if(!t)continue;let fits=used+turretStaff(t)<=basePop();if(fits)used+=turretStaff(t);if(i===j)return fits;}return false;};
function turretBranchCost(t,b){let n=turretPaths(t)[b]+1;return Math.round(TURRETS[t.t].cost*[0,1,1.8,3.8,8.5][n]);}
function turretBranchReason(t,b){
    let p=turretPaths(t),next=p[b]+1;if(next>4)return 'Đã tối đa';
    if(!p[b]&&p.filter(Boolean).length>=2)return 'Khóa nhánh thứ ba';
    if(next>2&&p.some((v,i)=>i!==b&&v>2))return 'Nhánh phụ tối đa bậc 2';
    if(t.t==='flame'&&b===2&&next===3&&!queenSlain)return 'Cần hạ Kiến Chúa';return '';
}
function turretPathBuy(slot,b){
    if(NET.mode==='guest'||objState!=='HUB'||!Number.isInteger(slot)||!Number.isInteger(b)||b<0||b>2)return false;
    let t=base.turrets[slot];if(!t)return false;let reason=turretBranchReason(t,b);if(reason){netToast(reason);return false;}
    let cost=turretBranchCost(t,b),tier=t.p[b]+1,mat=tier>=3?(tier===4?6:3):0;
    if(shopScrap<cost||(base.mat|0)<mat){netToast('Không đủ phế liệu hoặc vật liệu.');return false;}
    shopScrap-=cost;base.mat-=mat;t.invested=(t.invested||TURRETS[t.t].cost)+cost;t.p[b]++;turretPaths(t);Sound.play('upgrade');
    renderBasePanel();saveCheckpoint(true);netSendSync();return true;
}
const pathBaseBuy=baseBuy;
baseBuy=function(what,slot){
    if(NET.mode==='guest')return;
    if(what==='up')return turretPathBuy(slot,0);
    if(what==='sell'&&base.turrets[slot]){let t=base.turrets[slot];grantScrap(Math.floor((t.invested||TURRETS[t.t].cost)*.5));base.turrets[slot]=null;renderBasePanel();if(objState==='HUB')saveCheckpoint(true);netSendSync();return;}
    let r=pathBaseBuy(what,slot);if(base.turrets[slot])turretPaths(base.turrets[slot]);if(objState==='HUB')saveCheckpoint(true);return r;
};
const pathBaseSave=baseSave,pathBaseLoad=baseLoad;
baseSave=function(){let s=pathBaseSave();s.turrets=base.turrets.map(t=>t?{t:t.t,l:t.l,p:[...turretPaths(t)],paid:t.invested||TURRETS[t.t].cost}:null);return s;};
baseLoad=function(s){pathBaseLoad(s);base.turrets.forEach((t,i)=>{if(t){if(Array.isArray(s?.turrets?.[i]?.p))t.p=s.turrets[i].p;turretPaths(t);t.invested=Math.max(TURRETS[t.t].cost,Number(s?.turrets?.[i]?.paid)||TURRETS[t.t].cost);}});};
function renderTurretShop(){
    let html='<section class="turret-shop"><h3>Ụ SÚNG · 3 NHÁNH</h3><p>Một nhánh chính bậc 4, một nhánh phụ tối đa bậc 2. Nhánh thứ ba khóa. Ụ bậc 4 cần 2 cư dân; ụ khác cần 1.</p>';
    BASE_SLOTS.slice(0,baseSlotCount()).forEach((s,i)=>{
        let t=base.turrets[i];html+=`<article class="turret-card"><b>Ô ${i+1}</b> `;
        if(!t){html+='<span>Chưa đặt ụ</span><div class="turret-build">';for(let k of TURRET_KEYS)html+=`<button onclick="baseBuy('${k}',${i})" ${shopScrap<TURRETS[k].cost?'disabled':''}>${TURRETS[k].icon} ${TURRETS[k].name} · ⚙${TURRETS[k].cost}</button>`;html+='</div>';}
        else{
            let p=turretPaths(t),d=TURRETS[t.t];html+=`<strong>${d.icon} ${d.name}</strong><span class="turret-staff">${p.map((v,b)=>'ABC'[b]+v).join(' · ')} · ${turretManned(i)?'Đang vận hành':'Thiếu cư dân — ngừng bắn'} · cần ${turretStaff(t)} người</span><div class="turret-branches">`;
            for(let b=0;b<3;b++){let n=p[b],next=TURRET_PATHS[t.t][b][n],reason=turretBranchReason(t,b),cost=n<4?turretBranchCost(t,b):0,mat=n>=2?(n===3?6:3):0;
                html+=`<div class="turret-branch"><b>NHÁNH ${'ABC'[b]} · ${n}/4</b><span>${n?TURRET_PATHS[t.t][b][n-1][0]:'Chưa nâng'}</span><p>${next?next[0]+': '+next[1]:'Đã đạt bậc Tối Thượng.'}</p><button onclick="turretPathBuy(${i},${b})" ${reason||shopScrap<cost||(base.mat|0)<mat?'disabled':''}>${reason||'Nâng ⚙'+cost+(mat?' · 🧱'+mat:'')}</button></div>`;
            }
            html+=`</div><button class="turret-sell" onclick="baseBuy('sell',${i})">Bán · nhận ⚙${Math.floor((t.invested||d.cost)*.5)}</button>`;
        }html+='</article>';
    });return html+'</section>';
}
function turretStats(t){let [a,b,c]=turretPaths(t),d=TURRETS[t.t],s={range:d.range,cd:d.cd,dmg:d.dmg*(1+currentLevel*.06),radius:150};
    if(t.t==='mg'){s.dmg*=1+a*.25;s.range+=c>=2?70:0;s.cd=a>=3?.07:s.cd;if(c>=4){s.cd=.26;s.range=330;}}
    if(t.t==='sniper'){s.dmg*=1+a*.3;s.range+=c>=2?220:0;s.cd=b>=4?.24:b>=3&&turretAlertT>0?.38:s.cd;if(a>=4)s.dmg*=1.6;}
    if(t.t==='flame'){s.range+=a>=1?40:0;s.range+=a>=4?110:0;s.dmg*=a>=2?1.65:1;s.cd=.2;}
    if(t.t==='mortar'){s.radius+=a>=1?35:0;s.radius+=a>=2?35:0;s.dmg*=a>=2?1.4:1;s.cd*=b>=2?.55:b>=1?.75:1;if(a>=4){s.radius=320;s.dmg*=3;}}
    if(t.t==='tesla'){s.dmg*=1+a*.2;s.range+=a>=2?90:0;}
    return s;
}
function turretOrigin(t){return BASE_SLOTS[base.turrets.indexOf(t)]||[BASE.house.x,BASE.house.y];}
function turretEligible(z){return z.hp>0&&!z.gone&&!z.banditDown;}
function turretTargets(t,s){let [x,y]=turretOrigin(t),reveal=t.t==='mortar'&&turretPaths(t)[2]>=3;return zombies.filter(z=>turretEligible(z)&&(reveal||!z.hidden)&&!z.flying&&Math.hypot(z.x-x,z.y-y)<s.range+z.radius).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y));}
function turretControl(z,stun=0,push=0,x=0,y=0){
    if(z.type===45&&z.phase===1&&z.airborne)return;
    if(stun)z.turretStunT=Math.max(z.turretStunT||0,stun);
    if(push){let a=Math.atan2(z.y-y,z.x-x);z.x+=Math.cos(a)*push;z.y+=Math.sin(a)*push;resolveCollision(z);}
}
function turretDamage(z,amount,t,opts={}){
    if(!turretEligible(z))return;let c=turretPaths(t)[2];z.turretSalvage=t.t==='sniper'&&c>=3?2:z.turretSalvage||0;
    if(opts.fire||opts.acid)z.noReanimate=true;if(opts.spores)z.sporeDeath=true;
    z.hp-=calcDamage(amount,{type:'gun',fromAlly:true,armorPiercing:opts.pierce,isFire:opts.fire,isAcid:opts.acid},z.x,z.y,players[0],z);z.lastHitBy=players[0];
    if(opts.fire)applyStatus(z,STATUS.BURN,{duration:3,dpsPercent:.012,source:players[0]});
    if(opts.acid)applyStatus(z,STATUS.CORROSION,{duration:4,stacks:2,source:players[0]});
    if(opts.spores)applyStatus(z,STATUS.FEAR,{duration:3,stacks:2,source:players[0]});
    zombieDown(z,players[0]);
    if(z.hp>0)z.turretSalvage=0;
}
function turretBlast(x,y,r,dmg,t,opts={}){
    for(let z of zombies.slice())if(turretEligible(z)&&Math.hypot(z.x-x,z.y-y)<r+z.radius){turretDamage(z,dmg,t,opts);if(opts.stun)turretControl(z,opts.stun,0,x,y);if(opts.emp){z.abilityLockT=3;z.isFrenzied=0;z.hidden=false;z.shieldBoss=null;}}
    if(opts.emp)for(let tr of banditTrucks)if(Math.hypot(tr.x-x,tr.y-y)<r+70)tr.empT=3;
    spawnRing(x,y,opts.emp?'#a6c8c9':opts.acid?'#a9b76d':'#d1ac77',r,.4,3);
}
function turretField(kind,x,y,r,life,dmg,t,extra={}){
    let slot=base.turrets.indexOf(t),old=turretFields.find(f=>f.kind===kind&&f.slot===slot&&f.pair===extra.pair&&Math.hypot(f.x-x,f.y-y)<70);
    if(old){old.life=Math.max(old.life,life);return old;}
    let f={kind,x,y,r,life,dmg,slot,tick:0,...extra};turretFields.push(f);if(turretFields.length>128)turretFields.shift();return f;
}
function turretShell(t,z,delay=0,extra={}){let [x,y]=turretOrigin(t);turretOrdnance.push({slot:base.turrets.indexOf(t),x:z.x,y:z.y,sx:x,sy:y,timer:.8+delay,max:.8+delay,target:z.nid,...extra});}
function turretBeam(x,y,z,col='#a5d9d0'){vfxList.push({type:'laser_beam',x,y,tx:z.x,ty:z.y,life:.18,jag:col==='#b5cad8'});}
function turretShot(t,z,s,extra={}){
    let [x,y]=turretOrigin(t),a=Math.atan2(z.y-y,z.x-x);bullets.push(new Bullet(x,y,a+(extra.spread||0),{range:s.range,dmg:s.dmg,wallPiercing:true,fromAlly:true,turretSlot:base.turrets.indexOf(t),pierce:extra.pierce||0,armorPiercing:extra.armorPiercing,...extra},players[0]));
}
const pathBulletHit=Bullet.prototype.hitEnemy;
Bullet.prototype.hitEnemy=function(z){
    let slot=this.wepData?.turretSlot,t=Number.isInteger(slot)?base.turrets[slot]:null;
    if(!t)return pathBulletHit.call(this,z);if(this.hitSet.has(z)||!turretEligible(z))return;
    let [a,b,c]=turretPaths(t),x=this.x,y=this.y;
    if(t.t==='sniper'&&c>=1){z.turretMarkT=c>=2?8:4;z.turretSalvage=c>=3?2:0;}
    pathBulletHit.call(this,z);
    if(t.t==='mg'&&b){if(b>=3){z.shieldBroken=true;turretBlast(z.x,z.y,65,this.dmg*.28,t);}turretControl(z,b>=4?.4:0,b>=4?35:b>=2?18:9,x,y);}
    if(t.t==='sniper'&&a>=3)turretControl(z,2,0,x,y);
    if(t.t==='sniper'&&a>=4&&z.hp>0){turretDamage(z,z.maxHp*.015,t,{pierce:true});turretField('rift',z.x,z.y,70,3,0,t);}
    if(z.hp>0)z.turretSalvage=0;
};
const pathDamage=calcDamage;
calcDamage=function(d,w,x,y,p,z){return pathDamage(d,w,x,y,p,z)*(z?.turretMarkT>0?1.25:1);};
const pathZombieDown=zombieDown;
zombieDown=function(z,src){let was=z?._credited,r=pathZombieDown(z,src);if(r&&!was){if(z.turretSalvage&&!z.turretSalvaged){z.turretSalvaged=true;grantScrap(z.turretSalvage);}if(z.sporeDeath&&!z.sporePopped){z.sporePopped=true;turretBursts.push({x:z.x,y:z.y,dmg:Math.min(500,z.maxHp*.3)});}}return r;};
const pathZombieUpdate=Zombie.prototype.update;
Zombie.prototype.update=function(dt){
    for(let k of ['turretMarkT','turretSlowT','abilityLockT','revealT'])this[k]=Math.max(0,(this[k]||0)-dt);
    if(this.turretStunT>0){this.turretStunT-=dt;updateStatusEffects(this,dt,false);return;}
    let r=pathZombieUpdate.call(this,dt);if(this.revealT>0)this.hidden=false;return r;
};
const pathMoveMult=getStatusMoveMult;
getStatusMoveMult=function(e){return pathMoveMult(e)*(e.turretSlowT>0?.4:1);};
const pathSpecial=updateSpecialZombie;
updateSpecialZombie=function(z,target,dist,ang,dt,speed){if(z.abilityLockT>0&&isBossType(z.type)){z.x+=Math.cos(ang)*speed*dt;z.y+=Math.sin(ang)*speed*dt;resolveCollision(z);return true;}return pathSpecial(z,target,dist,ang,dt,speed);};
const pathGateHurt=hurtBaseGate;
hurtBaseGate=function(b,damage,source){if(!b||b.hp<=0)return;let shield=b.vHp||0,absorbed=Math.min(shield,damage);if(damage>0)b.noHitT=0;b.vHp=shield-absorbed;let before=b.hp;pathGateHurt(b,damage-absorbed,source);if(b.hp<before)turretAlertT=6;};
const pathHouseHurt=StoryNPC.prototype.takeDamage;
StoryNPC.prototype.takeDamage=function(d){if(this.kind==='house'){if(d>0)this.noHitT=0;let a=Math.min(this.vHp||0,d);this.vHp=(this.vHp||0)-a;d-=a;}if(d>0)return pathHouseHurt.call(this,d);};
function turretSupport(t,dt){
    let [a,b,c]=turretPaths(t),[x,y]=turretOrigin(t);t.supportCD=(t.supportCD||0)-dt;
    if(t.t==='sniper'&&c>=4&&t.supportCD<=0){t.supportCD=25;let p=findSafePoint(2000+(Math.random()-.5)*500,2120,25);for(let i=0;i<2;i++)turretOrdnance.push({slot:base.turrets.indexOf(t),kind:'supply',supply:i?'HEALTHBOX':'AMMOBOX',x:p.x+i*50,y:p.y,timer:2,max:2});}
    if(t.t==='tesla'&&c>=3&&t.supportCD<=0){t.supportCD=5;for(let e of [base.def?.houseNpc,...base.def?.barriers||[]])if(e?.hp>0&&(e.noHitT||0)>=5){e.hp=Math.min(e.maxHp,e.hp+e.maxHp*.025);e.vHp=Math.min(e.maxHp*.12,(e.vHp||0)+e.maxHp*.04);}}
    if(t.t==='tesla'&&c>=1)for(let eb of enemyBullets)if(eb.active&&eb.faction==='bandit'&&!eb.turretDeflected&&Math.hypot(eb.x-x,eb.y-y)<(c>=2?270:190)){
        eb.turretDeflected=true;if(c>=2||Math.random()<.45){let vx=eb.vx;eb.vx=-eb.vy;eb.vy=vx;spawnRing(eb.x,eb.y,'#8aadaa',20,.2);}
    }
    if(t.t==='tesla'&&b>=3){let i=base.turrets.indexOf(t);base.turrets.forEach((other,j)=>{if(j<=i||!other||other.t!=='tesla'||!turretManned(j))return;let [tx,ty]=BASE_SLOTS[j];if(Math.hypot(tx-x,ty-y)>1100)return;turretField('fence',x,y,18,.35,85,t,{tx,ty,pair:j});});}
}
function tickTurretEffects(dt){
    for(let f of turretFields){let t=base.turrets[f.slot];f.life-=dt;if(!t){f.life=0;continue;}
        if(f.kind==='ball'){f.x+=(f.vx||0)*dt;f.y+=(f.vy||0)*dt;}
        for(let z of zombies)if(turretEligible(z)){
            let inside=f.kind==='fence'?distancePointToSegment(z.x,z.y,f.x,f.y,f.tx,f.ty)<z.radius+f.r:Math.hypot(z.x-f.x,z.y-f.y)<f.r+z.radius;
            if(!inside)continue;
            if(f.kind==='napalm')z.turretSlowT=.4;
            if(f.kind==='blackhole'&&!(z.type===45&&z.airborne)){let m=(isBossType(z.type)?.2:1)*Math.min(.25,dt*2);z.x+=(f.x-z.x)*m;z.y+=(f.y-z.y)*m;resolveCollision(z);}
            if(f.kind==='fence')turretControl(z,isBossType(z.type)?0:.18);
        }
        if(f.kind==='napalm'&&f.burnBullets)for(let eb of enemyBullets)if(eb.faction==='bandit'&&Math.hypot(eb.x-f.x,eb.y-f.y)<f.r)eb.active=false;
        f.tick-=dt;if(f.tick>0)continue;f.tick=.2;
        for(let z of zombies.slice())if(turretEligible(z)&&(f.kind==='fence'?distancePointToSegment(z.x,z.y,f.x,f.y,f.tx,f.ty)<f.r+z.radius:Math.hypot(z.x-f.x,z.y-f.y)<f.r+z.radius)){
            let amount=f.kind==='rift'?z.maxHp*(isBossType(z.type)?.003:.012)*.2:f.dmg*.2;
            turretDamage(z,amount,t,{fire:['fire','napalm','radiation'].includes(f.kind),acid:f.kind==='spores',spores:f.kind==='spores',pierce:true});
            if(f.kind==='ball')turretControl(z,0,20,f.x-(f.vx||0),f.y-(f.vy||0));
        }
    }turretFields=turretFields.filter(f=>f.life>0);
    for(let e of turretOrdnance){e.timer-=dt;let t=base.turrets[e.slot];if(!t){e.timer=-1;continue;}if(e.homing){let z=zombies.find(z=>z.nid===e.target&&z.hp>0);if(z){e.x=z.x;e.y=z.y;}}if(e.timer>0||e.done)continue;e.done=true;
        if(e.kind==='supply'){spawnDrop(e.x,e.y,false,e.supply);continue;}
        let [a,b,c]=turretPaths(t),s=turretStats(t);turretBlast(e.x,e.y,e.radius||s.radius,(e.dmg??s.dmg),t,{fire:e.fire,stun:a>=3?.8:0,emp:c>=4,pierce:a>=4});
        if(t.t==='mortar'&&a>=4&&!e.child)turretField('radiation',e.x,e.y,250,7,90,t);
        if(t.t==='mortar'&&c>=1&&!e.child)for(let k=0;k<5;k++){let ang=k*Math.PI*2/5;turretOrdnance.push({slot:e.slot,x:e.x+Math.cos(ang)*80,y:e.y+Math.sin(ang)*80,timer:.25,max:.25,child:true,radius:55,dmg:s.dmg*(c>=2?.25:.18)});}
    }turretOrdnance=turretOrdnance.filter(e=>!e.done&&e.timer>0).slice(-256);
    for(let e of turretBursts.splice(0,8)){let t=base.turrets.find(t=>t?.t==='flame'&&turretPaths(t)[2]>=4);if(t)turretBlast(e.x,e.y,130,e.dmg,t,{acid:true,spores:true});}if(turretBursts.length>64)turretBursts.length=64;
}
updateTurrets=function(dt){
    if(NET.mode==='guest'||objState!=='BASE_DEF')return;turretAlertT=Math.max(0,turretAlertT-dt);tickTurretEffects(dt);
    let energizers=base.turrets.map((t,i)=>t?.t==='tesla'&&turretPaths(t)[1]>=4&&turretManned(i)?i:-1).filter(i=>i>=0);
    base.turrets.forEach((t,i)=>{
        if(!t||!turretManned(i))return;let [a,b,c]=turretPaths(t),s=turretStats(t),[x,y]=BASE_SLOTS[i];turretSupport(t,dt);
        if(t.t==='mortar'&&c>=3)for(let z of zombies)if(Math.hypot(z.x-x,z.y-y)<s.range){z.hidden=false;z.revealT=3;}
        let boost=energizers.some(j=>j!==i)?1.35:1;t.cd=(t.cd||0)-dt*boost;t.specialCD=(t.specialCD||0)-dt;t.pullCD=Math.max(0,(t.pullCD||0)-dt);
        let targets=turretTargets(t,s),z=targets[0];if(!z||t.cd>0)return;t.cd=s.cd;t.ang=Math.atan2(z.y-y,z.x-x);
        if(t.t==='mg'){
            if(c>=4){for(let k=0;k<20;k++)turretShot(t,{x:x+Math.cos(k*Math.PI/10)*200,y:y+Math.sin(k*Math.PI/10)*200},s,{pierce:a>=2?2:0,armorPiercing:a>=2});}
            else if(a>=4){for(let k=0;k<(c>=1?3:1);k++){let aim=t.ang+(c>=1?(k-1)*.13:0),end={x:x+Math.cos(aim)*s.range,y:y+Math.sin(aim)*s.range};turretBeam(x,y,end);let hits=0;for(let q of targets)if(distancePointToSegment(q.x,q.y,x,y,end.x,end.y)<q.radius+9&&hits++<24){turretDamage(q,s.dmg,t,{pierce:true});if(b)turretControl(q,0,b>=2?18:9,x,y);}}}
            else for(let q of c>=3?targets.slice(0,2):[z])for(let k=0;k<(c>=1?3:1);k++)turretShot(t,q,s,{spread:c>=1?(k-1)*.13:0,pierce:a>=2?1:0,armorPiercing:a>=2});
        }else if(t.t==='sniper'){
            let chain=b>=2?4:b>=1?2:1,last={x,y},picks=[z];
            if(b){while(picks.length<chain){let prev=picks[picks.length-1],next=targets.filter(q=>!picks.includes(q)&&Math.hypot(q.x-prev.x,q.y-prev.y)<350).sort((a,b)=>Math.hypot(a.x-prev.x,a.y-prev.y)-Math.hypot(b.x-prev.x,b.y-prev.y))[0];if(!next)break;picks.push(next);}}
            else{let end={x:x+Math.cos(t.ang)*s.range,y:y+Math.sin(t.ang)*s.range};picks=targets.filter(q=>distancePointToSegment(q.x,q.y,x,y,end.x,end.y)<q.radius+5).slice(0,4);}
            for(let q of picks){
                if(c>=1){q.turretMarkT=c>=2?8:4;q.turretSalvage=c>=3?2:0;}
                let crit=a>=1&&Math.random()<(a>=2?.35:.2),d=s.dmg*(crit?(a>=2?2.4:2):1);turretDamage(q,d,t,{pierce:true});turretBeam(last.x,last.y,q);
                if(a>=3)turretControl(q,2);if(a>=4&&q.hp>0){turretDamage(q,q.maxHp*.015,t,{pierce:true});turretField('rift',q.x,q.y,70,3,0,t);}
                if(b>=4)turretBlast(q.x,q.y,70,s.dmg*.3,t);last=q;
            }
        }else if(t.t==='flame'){
            let acid=c>=3;for(let q of targets){let ang=Math.atan2(q.y-y,q.x-x);if(a<4&&Math.abs(Math.atan2(Math.sin(ang-t.ang),Math.cos(ang-t.ang)))>.6)continue;
                turretDamage(q,s.dmg*s.cd,t,{fire:!acid,acid:c>=1,spores:c>=4,pierce:a>=3});
            }
            if(b>=1)turretField(b>=3?'napalm':acid?'spores':'fire',z.x,z.y,b>=4?165:95,b>=2?7:4,s.dmg*.5,t,{burnBullets:b>=4});
            if(a>=4&&t.specialCD<=0){t.specialCD=2;turretShell(t,z,0,{kind:'fireball',fire:true,dmg:s.dmg*2.5,radius:130});}
            createParticles(x+Math.cos(t.ang)*70,y+Math.sin(t.ang)*70,acid?'#9da96c':a>=3?'#86c4b7':'#d7ac64',2,70);
        }else if(t.t==='mortar'){
            let count=b>=4?12:b>=3?3:1;for(let k=0;k<count;k++)turretShell(t,targets[k%targets.length],k*.1,{homing:b>=4});
        }else if(t.t==='tesla'){
            let count=a>=2?8:a>=1?5:3;for(let q of targets.slice(0,count)){turretDamage(q,s.dmg,t,{pierce:true});applyStatus(q,STATUS.ELECTRIC,{duration:2,stacks:2,source:players[0]});if(b>=1&&Math.random()<(b>=2?.6:.3))turretControl(q,isBossType(q.type)?0:.45);turretBeam(x,y,q,'#b5cad8');}
            if(a>=3&&t.specialCD<=0){t.specialCD=4;let gate=GATE_RECTS.reduce((best,g)=>Math.hypot(x-g.cx,y-g.cy)<Math.hypot(x-best.cx,y-best.cy)?g:best,GATE_RECTS[0]);turretField('ball',gate.cx,gate.cy,100,3,s.dmg*2,t,{vx:gate.nx*160,vy:gate.ny*160});}
            if(a>=4){turretBlast(z.x,z.y,260,s.dmg*1.8,t);for(let q of targets)if(Math.hypot(q.x-z.x,q.y-z.y)<260)applyStatus(q,STATUS.OVERLOAD,{duration:4,stacks:3});vfxList.push({type:'bolt',x:z.x,y:z.y,life:.25,max:.25,seed:Math.random()*1000});}
            if(c>=4&&!(t.pullCD>0)){t.pullCD=6;turretField('blackhole',z.x,z.y,300,3,35,t);}
        }
    });
};
const pathRate=getPlayerFireRateMult;
getPlayerFireRateMult=function(p){let powered=objState==='BASE_DEF'&&baseTurretList().some((t,i)=>t?.t==='tesla'&&turretPaths(t)[1]>=4&&turretManned(i)&&Math.hypot(p.x-BASE_SLOTS[i][0],p.y-BASE_SLOTS[i][1])<600);return pathRate(p)/(powered?1.35:1);};
const pathBanditTick=tickBanditWorld;
tickBanditWorld=function(dt){let disabled=banditTrucks.filter(t=>t.empT>0);banditTrucks=banditTrucks.filter(t=>!(t.empT>0));for(let t of disabled){t.empT-=dt;t.time+=dt;for(let b of bullets)if(b.active&&Math.hypot(b.x-t.x,b.y-t.y)<70){t.hp-=b.dmg;b.active=false;}if(t.hp<=0)explode(t.x,t.y,240,300,null,true);}pathBanditTick(dt);banditTrucks.push(...disabled.filter(t=>t.hp>0&&t.time<30));};
const pathStart=startLevel,pathReset=resetRunState;
function resetTurretEffects(){turretFields=[];turretOrdnance=[];turretBursts=[];turretAlertT=0;}
startLevel=function(){resetTurretEffects();return pathStart();};
resetRunState=function(){resetTurretEffects();return pathReset();};
const pathHub=enterHub;
enterHub=function(){resetTurretEffects();return pathHub();};

function drawTurretBody(t,x,y,T,defense){
    let p=turretPaths(t),lv=Math.max(...p),branch=p.indexOf(lv),ultimate=lv>=4,advanced=lv>=3;
    let col=branch===2?'#a5b787':branch===1?'#c2a77e':'#9cb8bc',r=ultimate?34:advanced?27:20;T=artMotion(T);
    ctx.save();ctx.translate(x,y);artShadow(0,6,r+8,r*.65);
    if(defense){ctx.beginPath();ctx.arc(0,0,turretStats(t).range,0,Math.PI*2);ctx.strokeStyle='#d1d7bd0a';ctx.lineWidth=1;ctx.stroke();}
    artPoly(Array.from({length:6},(_,i)=>[Math.cos(i*Math.PI/3)*r*1.2,Math.sin(i*Math.PI/3)*r]),'#343b32','#91917b',2);
    for(let side of [-1,1])artBox(side*(r-4)-5,-r*.7,10,r*1.4,'#5c6654','#202a23',2);
    artDisc(0,0,r*.72,'#4d584c',col);ctx.save();ctx.rotate(t.ang||0);
    if(t.t==='mg'){
        if(branch===2&&advanced){for(let k=0;k<(ultimate?8:2);k++){ctx.save();ctx.rotate(ultimate?k*Math.PI/4:k*Math.PI);artBox(0,-6,r+18,12,'#6f7e6d','#262f27',2);for(let off of [-3,3])artLine([[10,off],[r+20,off]],col,2);ctx.restore();}}
        else if(branch===1&&advanced){artBox(-15,-17,45,34,'#6c6350','#2c3328',4);artBox(17,-10,ultimate?52:35,20,'#7e7e68','#2a332a',2);artBox(38,-13,12,26,col,'#30382c',1);}
        else{for(let k=0;k<(advanced?6:2);k++){let off=advanced?Math.sin(T*10+k*Math.PI/3)*7:(k-.5)*9;artBox(5,off-2,ultimate?55:advanced?41:28,4,ultimate?'#8ec9b9':'#89927d','#2a342b',1);}if(ultimate)for(let k=0;k<4;k++)artBox(10+k*10,-12,5,24,'#5e978d',null,1);}
    }else if(t.t==='sniper'){
        if(branch===2&&advanced){artLine([[0,0],[0,-48]],'#c1b990',4);ctx.save();ctx.translate(0,-40);ctx.rotate(Math.sin(T*.7)*.3);artPoly([[-22,-7],[22,-7],[15,8],[-15,8]],ultimate?'#96afa0':'#9d9d80');artLine([[-18,-4],[18,-4]],'#d5cba4',2);ctx.restore();artBox(-15,3,30,18,'#596554');}
        else if(branch===1&&advanced){for(let k=-1;k<=1;k++)artBox(-5,k*10-3,ultimate?57:43,6,'#979b82','#2a362a',1);artBox(-15,-18,21,36,'#687e68','#303e2f',3);}
        else{artBox(-12,-10,35,20,'#6c7e72','#29392e',3);for(let side of [-1,1])artBox(15,side*(ultimate?10:4)-2,ultimate?55:40,4,ultimate?'#9bc9d0':'#a9ad91','#2b3b30',1);if(ultimate)for(let k=0;k<4;k++)artLine([[23+k*9,-12],[23+k*9,12]],'#70a8ac',3);}
    }else if(t.t==='flame'){
        if(branch===2&&advanced){for(let side of [-1,1]){artDisc(-11,side*17,ultimate?16:12,'#6a7f4e','#c0c99b');artDisc(-11,side*17,7,'#9cae6b');}artBox(0,-7,38,14,'#63846b','#283c29',3);artDisc(38,0,8,'#bbd08d');}
        else if(branch===1&&advanced){for(let side of [-1,1])artBox(-23,side*17-9,29,18,'#9b734a','#3a3928',6);for(let k=-1;k<=1;k++)artBox(1,k*9-3,ultimate?46:32,6,'#9d9275','#383c2c',2);}
        else{artBox(-20,-18,35,36,ultimate?'#4d8581':'#986e46','#293b30',6);artBox(1,-8,advanced?45:31,16,'#84947c','#27382c',3);if(advanced){artDisc(28,0,ultimate?17:10,'#5da99e77','#9bdbbb');artDisc(30,0,6,'#b8e0b1');}}
    }else if(t.t==='mortar'){
        if(branch===1&&advanced){for(let row=0;row<(ultimate?3:1);row++)for(let k=0;k<(ultimate?4:3);k++){let xx=-10+k*14,yy=-19+row*15;artBox(xx,yy,ultimate?37:34,10,'#7b8770','#29382d',2);artDisc(xx+33,yy+5,3,'#b5bba0');}}
        else if(branch===2&&advanced){artDisc(0,0,r*.8,'#5f7f78',col);for(let k=0;k<5;k++){let a=k*Math.PI*2/5;artBox(Math.cos(a)*17-4,Math.sin(a)*17-8,8,16,ultimate?'#afc8ba':'#9aa584');}artDisc(0,0,ultimate?15:9,'#a3c7bb','#3c6458');}
        else{artBox(-16,-17,31,34,'#75816c','#29392b',4);artPoly([[-9,-10],[advanced?58:35,-19],[advanced?58:35,19],[-9,10]],ultimate?'#8d9c7c':'#7f8a72','#273b2b');artDisc(advanced?53:32,0,ultimate?18:11,'#24392d','#bdc5a6');if(ultimate)artDisc(53,0,8,'#cabf88');}
    }else{
        if(branch===1&&advanced){for(let k=0;k<(ultimate?6:4);k++){let a=k*Math.PI*2/(ultimate?6:4);artDisc(Math.cos(a)*r*.8,Math.sin(a)*r*.8,8,'#809c8c','#c3d2ba');}if(ultimate){ctx.beginPath();ctx.arc(0,0,18+Math.sin(T*3)*3,0,Math.PI*2);ctx.strokeStyle='#9ccfbc';ctx.lineWidth=3;ctx.stroke();}}
        else if(branch===2&&advanced){artDisc(0,0,ultimate?27:19,ultimate?'#152820':'#759f8e','#b3c8a5');for(let k=0;k<3;k++){ctx.beginPath();ctx.ellipse(0,0,ultimate?32:24,8,T*.8+k*Math.PI/3,0,Math.PI*2);ctx.strokeStyle=ultimate?'#94b7a4':'#c2d4b5';ctx.lineWidth=2;ctx.stroke();}}
        else{for(let side of [-1,1]){artLine([[side*14,18],[side*10,-28]],'#a2b5a0',5);artDisc(side*10,-29,advanced?11:8,'#779b90','#c4d4ba');}if(advanced){artDisc(0,-12,ultimate?19:13,'#a2cdb7','#d6dec2');artLine([[0,-10],[ultimate?5:0,-55]],'#a5ccbc',ultimate?6:3);}}
    }
    ctx.restore();
    if(ultimate){for(let side of [-1,1])artDisc(side*27,22,4,'#d4c29b');}
    artPlate(p.map((v,b)=>'ABC'[b]+v).join(' '),0,r+17,'#c6c8ad');if(!turretManned(baseTurretList().indexOf(t)))artPlate('THIẾU CƯ DÂN · CẦN '+turretStaff(t),0,-r-15,'#d09f8a');ctx.restore();
}
function drawTurretEffects(T){
    T=artMotion(T);ctx.save();
    for(let f of turretFields){
        if(f.kind==='fence'){artLine([[f.x,f.y],[f.tx,f.ty]],'#8eb7a599',8);artLine([[f.x,f.y],[f.tx,f.ty]],'#c3d8c0',2);continue;}
        let colors={fire:'#b9854b',napalm:'#9e7141',spores:'#9aaa68',radiation:'#a7ac60',blackhole:'#5e8472',rift:'#8eaeb8',ball:'#b3d5c1'},col=colors[f.kind]||'#b5bca4';
        ctx.globalAlpha=.13;artDisc(f.x,f.y,f.r,col);ctx.globalAlpha=.75;ctx.strokeStyle=col;ctx.lineWidth=2;ctx.setLineDash([12,18]);ctx.beginPath();ctx.arc(f.x,f.y,f.r*(.93+Math.sin(T*3)*.04),0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
        if(f.kind==='blackhole')for(let k=0;k<3;k++){ctx.beginPath();ctx.ellipse(f.x,f.y,f.r*(k+1)/4,12+k*15,T*.8+k,0,Math.PI*2);ctx.stroke();}
        if(f.kind==='ball')artDisc(f.x,f.y,18,'#c7ddc1','#90baa9');
    }ctx.globalAlpha=1;
    for(let e of turretOrdnance){
        let pct=Math.max(0,Math.min(1,1-e.timer/Math.max(.1,e.max||.8)));
        if(e.kind==='supply'){let h=(1-pct)*170;artLine([[e.x-15,e.y-h-20],[e.x,e.y-h+8],[e.x+15,e.y-h-20]],'#c3c2a3',1);ctx.beginPath();ctx.ellipse(e.x,e.y-h-20,27,10,0,Math.PI,Math.PI*2);ctx.fillStyle='#8b9e81';ctx.fill();artCrate(e.x-10,e.y-h,20,e.supply==='AMMOBOX'?'#aca177':'#a2b29a');continue;}
        ctx.strokeStyle='#c1b08a99';ctx.setLineDash([6,8]);ctx.beginPath();ctx.arc(e.x,e.y,e.radius||80,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
        let x=e.sx===undefined?e.x:e.sx+(e.x-e.sx)*pct,y=e.sy===undefined?e.y-100*(1-pct):e.sy+(e.y-e.sy)*pct-Math.sin(pct*Math.PI)*210;
        artDisc(x,y,e.kind==='fireball'?13:5,e.kind==='fireball'?'#9dd4b6':'#d3bb8c','#3f513c');
    }ctx.restore();
}
const pathDrawProps=drawStoryProps;
drawStoryProps=function(T,vis){pathDrawProps(T,vis);if(objState==='BASE_DEF')drawTurretEffects(T);};
const pathStoryState=storyNetState,pathStoryApply=storyNetApply;
storyNetState=function(){return {...pathStoryState(),turretFX:objState==='BASE_DEF'?{fields:turretFields,shots:turretOrdnance,shield:[base.def?.houseNpc?.vHp||0,...(base.def?.barriers||[]).map(b=>b.vHp||0)]}:null};};
storyNetApply=function(x){pathStoryApply(x);if(NET.mode==='guest'){turretFields=x?.turretFX?.fields||[];turretOrdnance=x?.turretFX?.shots||[];story.baseShields=x?.turretFX?.shield||[];}};
const pathDrawHouse=drawBaseHouse;
drawBaseHouse=function(n){pathDrawHouse(n);let v=NET.mode==='guest'?story.baseShields?.[0]:n.vHp;if(v>0)artPlate('GIÁP NĂNG LƯỢNG '+Math.round(v),n.x,n.y+132,'#a3cbb8');};
