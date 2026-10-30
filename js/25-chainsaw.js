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
    if(w?.isChainsaw&&p&&z){p.sawContact=2;p.sawRpm=Math.min(.35,(p.sawRpm||0)+.025);z.shieldBroken=true;if(z.armor)z.armor=Math.max(0,z.armor-25);
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
    for(let z of zombies)if(z.hp>0&&Math.hypot(z.x-p.x,z.y-p.y)<140){p.sawDashHits.add(z.nid);z.hp-=100*dt*p.getTotalDamageMult();z.knockback(Math.cos(p.sawDashAngle)*200,Math.sin(p.sawDashAngle)*200);if(z.hp<=0)zombieDown(z,p);}
    if(p.sawDash<=0){for(let z of zombies)if(z.hp>0&&Math.hypot(z.x-p.x,z.y-p.y)<190)z.knockback((z.x-p.x)*5,(z.y-p.y)*5);if(p.perks.saw_engine&&p.sawDashHits.size>=5)p.skillC_CD*=.5;}
};
const sawRage=arsenalRage;
arsenalRage=function(p){if(!p.weapon?.isChainsaw)return sawRage(p);if(p.rage<100||!skillRageOK(p,p.weapon)||p.isDowned)return;p.rage=0;p.sawRage=6;Sound.play('roar');};
const sawKill=Player.prototype.onKill;
Player.prototype.onKill=function(t,z){let r=sawKill.call(this,t,z);if(this.weapon?.isChainsaw&&this.sawRage>0&&Math.random()<.3)this.addVirtualHp(8);return r;};
const sawSlashProps=caveSlashProps;
caveSlashProps=function(s){if(s.wepData?.isChainsaw){let dmg=s.dmg;s.dmg*=s.source?.perks.saw_demolition?2:1;try{return sawSlashProps(s);}finally{s.dmg=dmg;}}return sawSlashProps(s);};
const advanceDamage=Player.prototype.getTotalDamageMult;
Player.prototype.getTotalDamageMult=function(){return advanceDamage.call(this)*(getJoystickState(this.id)?.active?1+Math.min(3,this.tags['TIẾN CÔNG']||0)*.05:1);};
const sawDrawMelee=drawMeleeWeapon;
drawMeleeWeapon=function(p,i,T){if(!p.weapon?.isChainsaw)return sawDrawMelee(p,i,T);ctx.save();ctx.translate(12,10);ctx.fillStyle='#c5892c';ctx.fillRect(-5,-10,26,20);ctx.fillStyle='#343b40';ctx.fillRect(18,-5,42,10);ctx.strokeStyle=p.sawRage>0?'#ff774a':'#e3e4dc';ctx.lineWidth=3;ctx.strokeRect(20,-7,42,14);for(let x=22;x<61;x+=7){ctx.fillStyle='#f0d9a1';ctx.fillRect(x,Math.floor(T*20)%2?-10:7,3,4);}ctx.restore();};
