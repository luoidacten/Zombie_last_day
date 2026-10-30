// Eight human enemy classes. They share the enemy collection, but not a faction.
const BANDIT_NAMES=['DO THÁM','XẠ THỦ','CÀN QUÉT','GÃ ĐIÊN','NÉM BOM','GÃ BÉO','Y SĨ','CỔ VŨ'];
const BANDIT_MUTATIONS=[3,8,27,10,34,14,15,6];
const isBandit=z=>z&&z.type>=60&&z.type<=67;
const factionOf=z=>z?.faction||(isBandit(z)||z?.type===32?'bandit':z instanceof Zombie?'zombie':'survivor');
let banditTrucks=[],banditWaveT=18;
function banditDensity(){
    if([10,14].includes(currentMapType)||objState==='TRAIN'||labDungeon()||(currentMapType===15&&story.lab?.stage!=='c4'&&story.lab?.stage!=='breach')||objState==='HUB')return 0;
    if([4,5].includes(currentMapType))return .8;
    return [7,9,11,12,15].includes(currentMapType)?.075:.35;
}
banditRandomType=()=>60+Math.floor(Math.random()*8);
const banditRoster=rosterPick;
rosterPick=function(){return Math.random()<banditDensity()?banditRandomType():banditRoster();};
function banditShoot(z,target,type='arrow',spread=0){
    let a=Math.atan2(target.y-z.y,target.x-z.x)+(Math.random()-.5)*spread;
    let b=new EnemyBullet(z.x,z.y,z.x+Math.cos(a)*600,z.y+Math.sin(a)*600,type);b.faction='bandit';b.owner=z;enemyBullets.push(b);
}
function banditMove(z,x,y,speed,dt){navMoveTo(z,x,y,speed,dt);}
function banditEnemy(z){return [...labLiving(),...zombies.filter(o=>o.hp>0&&!o.banditDown&&factionOf(o)!==factionOf(z))].filter(o=>!o.hidden).sort((a,b)=>Math.hypot(z.x-a.x,z.y-a.y)-Math.hypot(z.x-b.x,z.y-b.y))[0];}
function banditReturnLoot(z){if(z.lootReturned)return;z.lootReturned=true;for(let d of z.stolenLoot||[])drops.push({...d,x:z.x+(Math.random()-.5)*60,y:z.y+(Math.random()-.5)*60,lifeTime:900});if(z.stolenLoot?.length)shopScrap+=5;z.stolenLoot=[];}
function banditTick(z,dt){
    if(z.hp<=0)return;
    z.downed=!!z.banditDown;
    if(z.banditDown){z.downT-=dt;if(z.downT<=0){z.banditDown=false;z.downExpired=true;z.hp=0;zombieDown(z,z.lastHitBy);}return;}
    z.atkCD-=dt;z.spCD-=dt;z.moraleT=Math.max(0,(z.moraleT||0)-dt);
    let friends=zombies.filter(o=>o!==z&&isBandit(o)&&o.hp>0&&!o.banditDown&&Math.hypot(o.x-z.x,o.y-z.y)<900);
    let inspired=friends.some(o=>o.type===67)||zombies.some(o=>o.type===32&&o.hp>0);
    if(inspired){z.hadLeader=true;z.panic=false;}else if(z.hadLeader)z.panic=true;
    z.morale=inspired?100:z.panic?20:60;
    if(z.type>=66&&!friends.some(o=>o.type<66)&&!zombies.some(o=>isBandit(o)&&o.banditDown&&o.hp>0)&&!z.desperate)z.desperate=Math.random()<.5?'arm':'flee';
    let flee=z.desperate==='flee'||(!inspired&&z.hp<z.maxHp*(z.panic?.5:.25));
    if(flee){
        let truck=banditTrucks.find(t=>t.hp>0&&t.time<25);
        if(!truck&&z.desperate==='flee'&&!z.flared&&banditDensity()>.1){z.flared=true;spawnBanditTruck(z.x,z.y);}
        let x=truck?truck.x:(z.x<2000?30:3970),y=truck?truck.y:z.y;
        banditMove(z,x,y,z.baseSpeed*1.4,dt);
        if(Math.hypot(z.x-x,z.y-y)<65){z.hp=0;z.gone=true;z._credited=true;z.stolenLoot=[];}return;
    }
    if(z.type===66){
        let injured=zombies.filter(o=>o!==z&&isBandit(o)&&o.hp>0&&Math.hypot(o.x-z.x,o.y-z.y)<900&&(o.hp<o.maxHp||o.banditDown)).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
        if(injured){banditMove(z,injured.x,injured.y,90,dt);if(Math.hypot(z.x-injured.x,z.y-injured.y)<180){if(injured.banditDown&&!injured.revived){injured.banditDown=false;injured.revived=true;injured.hp=injured.maxHp*.5;}else injured.hp=Math.min(injured.maxHp,injured.hp+injured.maxHp*.05*dt);}}
    }
    if(z.type===60){
        let loot=drops.filter(d=>!['FOOD','MEDKIT','HEALTHBOX'].includes(d.type)).sort((a,b)=>Math.hypot(a.x-z.x,a.y-z.y)-Math.hypot(b.x-z.x,b.y-z.y))[0];
        if(loot&&Math.hypot(loot.x-z.x,loot.y-z.y)<450){banditMove(z,loot.x,loot.y,165,dt);if(Math.hypot(loot.x-z.x,loot.y-z.y)<35){(z.stolenLoot||=[]).push({...loot});drops.splice(drops.indexOf(loot),1);}}
    }
    if(z.desperate==='arm'&&!z.armed){let loot=drops.find(d=>['BLINDBOX','SUPERBOX'].includes(d.type)&&Math.hypot(d.x-z.x,d.y-z.y)<650);if(loot){banditMove(z,loot.x,loot.y,140,dt);if(Math.hypot(z.x-loot.x,z.y-loot.y)<40){drops.splice(drops.indexOf(loot),1);z.armed=true;}}else z.desperate='flee';return;}
    let target=banditEnemy(z);if(!target)return;let dist=Math.hypot(target.x-z.x,target.y-z.y),a=Math.atan2(target.y-z.y,target.x-z.x);
    let speed=z.baseSpeed*(friends.some(o=>o.type===67)?1.3:1),buff=friends.some(o=>o.type===67)?1.4:1;
    if(z.type===63)speed*=1+(1-z.hp/z.maxHp)*1.4;
    let melee=[62,63].includes(z.type),support=z.type>=66&&!z.desperate;
    if(support){if(dist<600)banditMove(z,z.x-Math.cos(a)*150,z.y-Math.sin(a)*150,speed,dt);return;}
    let desired=melee?55:z.type===60?250:z.type===65?260:420;
    if(dist>desired+50)banditMove(z,target.x,target.y,speed,dt);
    else if(dist<desired-80&&!melee)banditMove(z,z.x-Math.cos(a)*150,z.y-Math.sin(a)*150,speed,dt);
    if(z.type===60&&dist<120&&z.spCD<=0){z.spCD=3;z.x-=Math.cos(a)*100;z.y-=Math.sin(a)*100;resolveCollision(z);}
    if(z.type===62&&dist<200&&z.spCD<=0){z.spCD=5;target.x-=Math.cos(a)*65;target.y-=Math.sin(a)*65;resolveCollision(target);spawnRing(z.x,z.y,'#b2bec3',200,.5,3);}
    if(dist<650&&z.atkCD<=0&&hasLineOfSight(z.x,z.y,target.x,target.y)){
        z.atkCD=(z.type===61?.38:z.type===65?1.4:1)*(z.panic?1.25:1);
        if(melee){if(dist<95)factionHurt(target,20*buff,z);}
        else if(z.type===64&&z.spCD<=0){z.spCD=4;hazards.push({type:'banditbomb',x:target.x,y:target.y,radius:115,timer:1.2,life:1.4,dmg:35,owner:z});}
        else banditShoot(z,target,z.type===65?'rocket':'arrow',z.desperate?.65:z.panic?.35:.1);
    }
}
function factionHurt(target,damage,source){if(target instanceof Zombie){target.hp-=damage;target.lastHitFaction=factionOf(source);if(target.hp<=0)zombieDown(target,null);}else target.takeDamage(damage);}
const banditZombieUpdate=Zombie.prototype.update;
Zombie.prototype.update=function(dt){
    if(isBandit(this))return banditTick(this,dt);
    let enemy=zombies.filter(o=>isBandit(o)&&o.hp>0&&!o.banditDown&&Math.hypot(o.x-this.x,o.y-this.y)<550).sort((a,b)=>Math.hypot(a.x-this.x,a.y-this.y)-Math.hypot(b.x-this.x,b.y-this.y))[0];
    if(enemy&&!isBossType(this.type)){this.lockTarget=enemy;if(Math.hypot(this.x-enemy.x,this.y-enemy.y)<this.radius+enemy.radius+12&&this.atkCD<=0){this.atkCD=.8;factionHurt(enemy,20,this);}}
    return banditZombieUpdate.call(this,dt);
};
const banditEnemyUpdate=EnemyBullet.prototype.update;
EnemyBullet.prototype.update=function(dt){
    if(this.active)for(let z of zombies){if(z.hp<=0||z.banditDown||factionOf(z)===(this.faction||'zombie'))continue;
        if(distancePointToSegment(z.x,z.y,this.x,this.y,this.x+this.vx*dt,this.y+this.vy*dt)<z.radius+5){factionHurt(z,this.type==='acid'?15:22,this.owner||{faction:this.faction||'zombie'});this.active=false;return;}}
    return banditEnemyUpdate.call(this,dt);
};
const banditCalcDamage=calcDamage;
calcDamage=function(base,wd,x,y,source,z){let d=banditCalcDamage(base,wd,x,y,source,z);if(isBandit(z)){
    if(source instanceof Player)z.lastHitFaction='survivor';
    z.gibbed=!!(wd?.isExplosiveProj||wd?.isTankShell||wd?.isBomb||(wd?.isScythe&&source?.perks.sc_soul));
    if(z.type===62&&!z.shieldBroken)d*=wd?.type==='melee'?.75:.05;
}return d;};
const banditExplode=explode;
explode=function(x,y,r,dmg,src,friendly){for(let z of zombies)if(isBandit(z)&&Math.hypot(z.x-x,z.y-y)<r+z.radius)z.gibbed=true;for(let t of banditTrucks)if(Math.hypot(t.x-x,t.y-y)<r+70)t.hp-=dmg;return banditExplode(x,y,r,dmg,src,friendly);};
const banditDown=zombieDown;
zombieDown=function(z,src){
    if(!isBandit(z)||z.hp>0||z._credited)return banditDown(z,src);
    let bitten=z.lastHitFaction==='zombie',medic=zombies.some(o=>o!==z&&o.type===66&&o.hp>0&&!o.banditDown&&Math.hypot(o.x-z.x,o.y-z.y)<700);
    if(!z.gibbed&&!bitten&&!z.revived&&!z.downExpired&&!z.banditDown&&medic){z.hp=1;z.banditDown=true;z.downT=12;return false;}
    z.banditDown=false;let killed=banditDown(z,src);if(!killed)return false;
    banditReturnLoot(z);shopScrap+=2;
    if(!z.gibbed)drops.push({type:'BLINDBOX',forceWeapon:'AR',x:z.x+20,y:z.y,radius:16,lifeTime:120});
    if(!z.gibbed&&(bitten||z.revived)){
        let n=new Zombie(z.x,z.y,BANDIT_MUTATIONS[z.type-60]);n.infectedBandit=true;n.noLoot=true;zombies.push(n);
        if(z.type===63)n.isFrenzied=999;
    }else if(!z.gibbed)spawnDrop(z.x,z.y,false,'AMMOBOX');
    return true;
};
const banditOnKill=Player.prototype.onKill;
Player.prototype.onKill=function(type,z){if(z?.infectedBandit){let xp=({0:10,1:25,4:150,6:50,9:30,10:30,11:30,27:120,28:120,13:60,14:60,15:60,20:60})[type]||15;this.xp+=xp*.5*(1+(this.tags['TĂNG TIẾN']||0)*.15+(this.perks.fastLearn?.5:0));let req=getXpRequired(this.level);if(this.xp>=req){this.xp-=req;this.level++;this.pendingUpgrades++;}return;}return banditOnKill.call(this,type,z);};
function spawnBanditTruck(x=500,y=500){if(banditDensity()<=.1||banditTrucks.length>=3)return;let s=findSafePoint(x,y,50);banditTrucks.push({x:s.x,y:s.y,hp:800+currentLevel*90,time:0,cd:0,wave:false});}
function tickBanditWorld(dt){
    if(NET.mode==='guest'||objState==='HUB'||!banditDensity()){banditTrucks=[];return;}
    banditWaveT-=dt;
    if(banditWaveT<=0){banditWaveT=30;let p=labLiving()[0];if(p&&banditDensity()>.1)spawnBanditTruck(p.x+650,p.y-350);}
    for(let t of banditTrucks){t.time+=dt;t.cd-=dt;
        for(let b of bullets)if(b.active&&Math.hypot(b.x-t.x,b.y-t.y)<70){t.hp-=b.dmg;b.active=false;}
        for(let s of slashes)if(!t.hits?.has(s)&&Math.hypot(s.x-t.x,s.y-t.y)<s.range+70){(t.hits||=new Set()).add(s);t.hp-=s.dmg*(s.wepData?.isChainsaw&&s.source?.perks.saw_demolition?2:1);}
        if(t.hp<=0){explode(t.x,t.y,240,300,null,true);t.time=99;continue;}
        if(!t.wave){t.wave=true;for(let i=0;i<4+Math.floor(Math.random()*3);i++)zombies.push(new Zombie(t.x+i*25,t.y+70,banditRandomType()));}
        let p=labLiving().find(p=>Math.hypot(p.x-t.x,p.y-t.y)<800);if(p&&t.cd<=0){t.cd=.18;banditShoot({x:t.x,y:t.y,type:61},p);}
    }banditTrucks=banditTrucks.filter(t=>t.time<30);
    for(let h of hazards)if(h.type==='banditbomb'&&h.timer<=0&&!h.done){h.done=true;explode(h.x,h.y,h.radius,h.dmg,null,false);fireZones.push({x:h.x,y:h.y,radius:100,life:4,dmg:16,source:null});}
    let leader=zombies.find(z=>z.type===32&&z.hp>0);if(leader){let phase=Math.floor((1-leader.hp/leader.maxHp)*3);if(phase>(leader.truckPhase??-1)){leader.truckPhase=phase;spawnBanditTruck(leader.x+350,leader.y+200);}}
}
const banditStoryUpdate=updateStory;
updateStory=function(dt){banditStoryUpdate(dt);if(!storyBusy())tickBanditWorld(dt);};
const banditGenerate=generateMap;
generateMap=function(level){banditTrucks=[];banditWaveT=18;return banditGenerate(level);};
const banditDrawBody=drawZombieBody;
drawZombieBody=function(z,...args){if(!isBandit(z))return banditDrawBody(z,...args);ctx.save();ctx.fillStyle=z.banditDown||z.downed?'#666':z.type>=66?'#73b9a1':'#b78d5e';ctx.fillRect(z.x-z.radius,z.y-z.radius,z.radius*2,z.radius*2);ctx.fillStyle='#25262b';ctx.fillRect(z.x-9,z.y-5,18,8);outlinedText(BANDIT_NAMES[z.type-60]+(z.panic?' !':''),z.x,z.y-z.radius-10,'#ffdcaa','bold 10px Arial');ctx.restore();};
const banditNetState=storyNetState,banditNetApply=storyNetApply;
storyNetState=function(){return {...banditNetState(),bt:banditTrucks.map(({hits,...t})=>t)};};
storyNetApply=function(x){banditNetApply(x);banditTrucks=x?.bt||[];};
