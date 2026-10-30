WEAPON_TYPES.CHAINSAW={key:'CHAINSAW',id:35,name:'Cưa Máy',type:'melee',color:'#f4b942',ammo:240,maxAmmo:240,dmg:42,range:115,fireRate:120,spread:1.25,kb:70,isChainsaw:true};
NORMAL_WEAPONS.push('CHAINSAW');SUPER_WEAPONS.push('CHAINSAW');
TAG_DEFS['TIẾN CÔNG']={max:3,color:'#e7aa4c'};TAG_RULES['TIẾN CÔNG']={reqBreak:3,exclusive:false};
WIKI_TAGS['TIẾN CÔNG']='Mỗi mốc +5% sát thương khi đang di chuyển, tối đa 15%.';
WIKI_SKILL.CHAINSAW='Lao cưa trong 0,65s, cắt và kéo quái phía trước; kết thúc hất văng. Nộ: quá tải 6s, +50% tốc chạy, +40% tầm, 3% hút máu.';
WSKILL.CHAINSAW={name:'TĂNG TỐC LAO CƯA',cd:8,cost:8};RAGE_WEAPONS.CHAINSAW='CƠN ÁC MỘNG ĐỎ';
UPGRADES.push(
 {id:'saw_teeth',type:'Cưa Máy',name:'Xích Cưa Răng Cá Mập',desc:'Cưa gây chảy máu, +25% sát thương lên mục tiêu mất giáp/chậm/choáng.',tags:['CẬN CHIẾN','TIẾN CÔNG','HÚT MÁU']},
 {id:'saw_engine',type:'Cưa Máy',name:'Bộ Chế Hòa Khí Độ',desc:'Giảm 35% hao nhiên liệu. Lao trúng 5 mục tiêu hoàn 50% hồi chiêu.',tags:['CẬN CHIẾN','TIẾN CÔNG']},
 {id:'saw_demolition',type:'Cưa Máy',name:'Mũi Cưa Phá Công Trình',desc:'Cưa +100% sát thương công trình, khi lao hất quái hai bên.',tags:['CẬN CHIẾN','TIẾN CÔNG']}
);
const sawCalc=calcDamage;
calcDamage=function(d,w,x,y,p,z){
    if(w?.isChainsaw&&p&&z){sawImpactFx(p,z,[4,14,27,31,36,62].includes(z.type)||z.armor>0?'metal':'flesh');p.sawContact=2;p.sawRpm=Math.min(.35,(p.sawRpm||0)+.025);z.shieldBroken=true;if(z.armor)z.armor=Math.max(0,z.armor-25);
        if(p.perks.saw_teeth){z.sawBleed=3;z.sawBleedSource=p;if(z.shieldBroken||z.stunTimer>0||getStatusMoveMult(z)<1)d*=1.25;}
        if(p.sawRage>0)p.applyLifesteal(Math.min(z.hp,d*p.getTotalDamageMult())*.03);
    }return sawCalc(d,w,x,y,p,z);
};
const sawShoot=Player.prototype.shoot;
Player.prototype.shoot=function(){let w=this.weapon,ammo=w?.ammo,result=sawShoot.call(this);if(w?.isChainsaw&&w===this.weapon&&w.ammo<ammo&&this.perks.saw_engine&&Math.random()<.35)w.ammo++;return result;};
const sawUpdate=Player.prototype.update;
Player.prototype.update=function(dt){
    this.sawContact=Math.max(0,(this.sawContact||0)-dt);this.sawRage=Math.max(0,(this.sawRage||0)-dt);
    if(!this.sawContact)this.sawRpm=Math.max(0,(this.sawRpm||0)-dt*.15);
    let w=this.weapon,spd=this.baseSpeed;
    if(w?.isChainsaw){this.baseSpeed*=1+(this.sawRage>0?.5:this.sawRpm||0);w.range=this.sawRage>0?161:115;}
    try{return sawUpdate.call(this,dt);}finally{this.baseSpeed=spd;}
};
const sawMove=getStatusMoveMult;
const sawZombieUpdate=Zombie.prototype.update;
Zombie.prototype.update=function(dt){if(this.sawBleed>0){this.sawBleed-=dt;this.hp-=8*dt;if(this.hp<=0)zombieDown(this,this.sawBleedSource);}if(this.hp>0)return sawZombieUpdate.call(this,dt);};
getStatusMoveMult=function(e){let m=sawMove(e);return e instanceof Player&&e.weapon?.isChainsaw&&e.sawContact>0&&m<1?1-(1-m)*.5:m;};
const sawC=skillTryC;
skillTryC=function(p){if(!p.weapon?.isChainsaw)return sawC(p);if(p.isDowned||p.skillC_CD>0||expeditionMovementLocked(p)||p.weapon.ammo<8)return false;
    p.weapon.ammo-=8;p.skillC_CD=8;p.sawDash=.65;p.sawDashHits=new Set();p.sawDashAngle=skillAim(p,600);return true;};
const sawSkillTick=skillTick;
skillTick=function(p,dt){sawSkillTick(p,dt);if(!(p.sawDash>0)||!p.weapon?.isChainsaw||p.isDowned)return;
    p.sawDash-=dt;let a=skillAim(p,600);p.sawDashAngle+=Math.atan2(Math.sin(a-p.sawDashAngle),Math.cos(a-p.sawDashAngle))*.1;
    p.x+=Math.cos(p.sawDashAngle)*660*dt;p.y+=Math.sin(p.sawDashAngle)*660*dt;resolveCollision(p);
    p.sawTrailT=(p.sawTrailT||0)-dt;if(p.sawTrailT<=0){p.sawTrailT=.07;sawSwingFx(p.x,p.y,p.sawDashAngle,145,p,true);}
    for(let z of zombies)if(z.hp>0&&Math.hypot(z.x-p.x,z.y-p.y)<140){p.sawDashHits.add(z.nid);sawImpactFx(p,z,[4,14,27,31,36,62].includes(z.type)?'metal':'flesh');z.hp-=100*dt*p.getTotalDamageMult();z.knockback(Math.cos(p.sawDashAngle)*200,Math.sin(p.sawDashAngle)*200);if(z.hp<=0)zombieDown(z,p);}
    if(p.sawDash<=0){for(let z of zombies)if(z.hp>0&&Math.hypot(z.x-p.x,z.y-p.y)<190)z.knockback((z.x-p.x)*5,(z.y-p.y)*5);if(p.perks.saw_engine&&p.sawDashHits.size>=5)p.skillC_CD*=.5;}
};
const sawRage=arsenalRage;
arsenalRage=function(p){if(!p.weapon?.isChainsaw)return sawRage(p);if(p.rage<100||!skillRageOK(p,p.weapon)||p.isDowned)return;p.rage=0;p.sawRage=6;if(vfxList.length<220)vfxList.push({type:'saw_roar',x:p.x,y:p.y,life:.5,max:.5,r:155});Sound.play('roar');};
const sawKill=Player.prototype.onKill;
Player.prototype.onKill=function(t,z){let r=sawKill.call(this,t,z);if(this.weapon?.isChainsaw&&this.sawRage>0&&Math.random()<.3)this.addVirtualHp(8);return r;};
const sawSlashProps=caveSlashProps;
caveSlashProps=function(s){if(s.wepData?.isChainsaw){let dmg=s.dmg;s.dmg*=s.source?.perks.saw_demolition?2:1;try{return sawSlashProps(s);}finally{s.dmg=dmg;}}return sawSlashProps(s);};
const advanceDamage=Player.prototype.getTotalDamageMult;
Player.prototype.getTotalDamageMult=function(){return advanceDamage.call(this)*(getJoystickState(this.id)?.active?1+Math.min(3,this.tags['TIẾN CÔNG']||0)*.05:1);};
const sawDrawMelee=drawMeleeWeapon;
drawMeleeWeapon=function(p,i,T){
    if(!p.weapon?.isChainsaw)return sawDrawMelee(p,i,T);
    T=artMotion(T);let active=Date.now()-(p.lastFireTime||0)<180||p.sawDash>0||p.sawContact>0,rate=active?38:10,hot=p.sawRage>0;
    ctx.save();ctx.translate(12,10+(active?Math.sin(T*70)*.7:0));
    artBox(-5,-10,27,20,hot?'#994737':'#9a783e','#292d23',4);artBox(1,-5,12,11,'#4b4e40','#242b21',2);
    artLine([[-3,-12],[-2,-18],[14,-18],[18,-10]],'#626853',4);artLine([[-7,1],[-13,1],[-13,10],[-5,10]],'#31392c',4);
    artBox(19,-6,43,12,'#999f8d','#333c30',6);artLine([[25,0],[56,0]],hot?'#c88a67':'#5b6852',3);
    let offset=(T*rate)%7;for(let x=20+offset;x<60;x+=7)for(let side of [-1,1])artPoly([[x,side*6],[x+2,side*10],[x+4,side*6]],hot?'#d7b995':'#c6c7ae','#4c5640',.8);
    artDisc(61,0,4,'#747e65','#303b2c');artBox(17,-10,4,21,'#464f3b','#303a2c',1);
    if(hot){ctx.strokeStyle='rgba(172,73,43,.35)';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(18,-9,47,18,8);ctx.stroke();}
    ctx.restore();
};

function sawSwingFx(x,y,angle,range,p,dash=false){
    if(vfxList.length>=220)return;
    vfxList.push({type:'saw_swing',x,y,angle,r:range,pi:(p?.id||1)-1,hot:p?.sawRage>0,dash,life:.18,max:.18});
}
function sawImpactFx(p,target,material='flesh'){
    let now=Date.now();if(NET.mode==='guest'||now<(p.sawFxNext||0)||vfxList.length>=220)return;
    p.sawFxNext=now+65;let angle=Math.atan2(target.y-p.y,target.x-p.x),r=Math.min(26,target.radius||target.r||20);
    vfxList.push({type:'saw_impact',x:target.x-Math.cos(angle)*r*.65,y:target.y-Math.sin(angle)*r*.65,angle,material,hot:p.sawRage>0,life:.32,max:.32});
    if(material==='metal')Sound.play('clang');
    if(!artMotionMedia?.matches)addScreenShake(p.sawRage>0?1.5:.65);
}
function drawSawEffect(v,T){
    if(!['saw_swing','saw_impact','saw_roar'].includes(v.type))return false;
    let k=Math.max(0,Math.min(1,v.life/v.max)),age=1-k;ctx.save();ctx.globalAlpha*=k;ctx.translate(v.x,v.y);ctx.rotate(v.angle||0);
    if(v.type==='saw_impact'){
        let metal=v.material==='metal',wood=v.material==='wood',color=metal?'#d3bc86':wood?'#a68e61':'#ac6350';
        for(let i=0,n=presentationLow()?6:11;i<n;i++){let a=i*2.399+(v.x%5)*.3,len=(9+(i%4)*7)*age,x=Math.cos(a)*len,y=Math.sin(a)*len+age*age*12;
            artLine([[x,y],[x-Math.cos(a)*(metal?8:4),y-Math.sin(a)*4]],i%3?color:'#ded2a7',metal?1.5:2.5);}
        for(let i=0;i<3;i++)artLine([[-12+i*7,-13+age*4],[-6+i*7,12+age*4]],metal?'#d9d0a8':'#743b2c',2);
        if(metal){artDisc(0,0,2+k*3,'#e8d7b3');}
    }else if(v.type==='saw_swing'){
        let r=v.r*(.6+age*.4),color=v.hot?'#ce7351':'#c3b78c';
        if(v.dash){for(let side of [-1,1])artLine([[-48,side*19],[-12,side*23],[r*.5,side*17]],'#9e6c4d',2);}
        for(let i=0;i<3;i++){let a=(i-1)*.18;ctx.save();ctx.rotate(a);artLine([[23,-5+i*4],[r*.75,-3+i*4],[r,1+i*4]],i===1?'#d5d0b2':color,i===1?2:1);ctx.restore();}
        ctx.beginPath();ctx.arc(0,0,r,-.28,.28);ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();
    }else{
        ctx.beginPath();ctx.arc(0,0,25+age*v.r,0,Math.PI*2);ctx.strokeStyle='#b76b49';ctx.lineWidth=3*k;ctx.stroke();
        for(let i=0;i<12;i++){let a=i*Math.PI/6;artLine([[Math.cos(a)*(25+age*100),Math.sin(a)*(25+age*100)],[Math.cos(a)*(37+age*100),Math.sin(a)*(37+age*100)]],'#be9470',2);}
    }
    ctx.restore();return true;
}
const sawNetEncode=netEncodePlayer,sawNetDecode=netDecodePlayer;
netEncodePlayer=function(p){let e=sawNetEncode(p);e.push(p.weapon?.isChainsaw?[Math.round((p.sawRpm||0)*100),Math.round((p.sawContact||0)*100),Math.round((p.sawRage||0)*100),Math.round((p.sawDash||0)*100)]:null);return e;};
netDecodePlayer=function(p,e,local){sawNetDecode(p,e,local);let a=e[31];p.sawRpm=a?a[0]/100:0;p.sawContact=a?a[1]/100:0;p.sawRage=a?a[2]/100:0;p.sawDash=a?a[3]/100:0;};
