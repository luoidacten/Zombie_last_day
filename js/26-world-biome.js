// POIs are open spaces with three clear entrances. Scripted maps use their own features.
let worldFeatures=[],featureSerial=0,anomalyZone=null;
const FEATURE_LABELS={signal:'THÁP TÍN HIỆU',fuel:'BỒN NHIÊN LIỆU',siren:'XE CỨU HỘ',market:'SIÊU THỊ',arsenal:'KHO VŨ KHÍ',outpost:'TIỀN ĐỒN',cage:'CHUỒNG ZOMBIE',minefield:'BÃI MÌN',ranger:'TRẠM KIỂM LÂM',ferry:'BẾN PHÀ',light:'MÁY PHÁT ĐÈN',swamp:'ĐẦM LẦY',heli:'TRỰC THĂNG RƠI',transformer:'TRẠM BIẾN ÁP',spores:'VÙNG BÀO TỬ',greenhouse:'NHÀ KÍNH',geo:'TRẠM KHẢO CỔ',mushroom:'NẤM PHÁT QUANG',chasm:'CẦU ĐÁ',bridge:'CẦU GỖ MỤC',shaft:'GIẾNG TIẾP TẾ',switch:'ĐỔI RAY: NGẮN / DÀI',crusher:'MÁY NGHIỀN',gland:'TUYẾN ACID',eggs:'BUỒNG ẤP',mineral:'GIÁP KHOÁNG',vault:'KHO THUỐC NỔ',furnace:'LÒ LUYỆN',cocoon:'KÉN THỢ MỎ',generator:'ĐIỆN ĐẤU TRƯỜNG',ceiling:'THẠCH NHŨ',pillar:'CỘT CHỐNG HẦM'};
function addFeature(kind,x,y,extra={}){let sp=findSafePoint(x,y,28),f={id:++featureSerial,kind,x:sp.x,y:sp.y,r:38,hp:180,maxHp:180,on:false,progress:0,...extra};worldFeatures.push(f);return f;}
function setupBiome(){
    worldFeatures=[];anomalyZone=null;if([10,14,15,16].includes(currentMapType))return;
    let kinds=[1,8,13].includes(currentMapType)?['market','arsenal','signal','fuel','siren']:[4,5].includes(currentMapType)?['arsenal','outpost','signal','cage']:currentMapType===6?['transformer','arsenal','signal']:currentMapType===9?['transformer','light','spores']:currentMapType===12?['greenhouse','spores','market']:['ranger',currentMapType===3?'ferry':'light','mushroom'];
    let coords=[[850,1050],[3000,1100],[1150,2850],[3000,2850],[2000,700]];
    kinds.forEach((k,i)=>{
        let f=addFeature(k,...coords[i]);
        // Four wall fragments leave a broad front entrance and two side escapes.
        if(['market','arsenal','ranger','outpost','greenhouse'].includes(k)){
            f.building=true;
            for(let [dx,dy,w,h]of [[-155,-130,100,20],[55,-130,100,20],[-155,110,100,20],[55,110,100,20]])obstacles.push({type:'wall',x:f.x+dx,y:f.y+dy,w,h,poi:true});
            if(k==='outpost'&&banditDensity()>0)for(let n=0;n<3;n++)zombies.push(new Zombie(f.x+(n-1)*60,f.y,61));
        }
        if(k==='signal'&&banditDensity()>0)for(let n=0;n<2;n++)zombies.push(new Zombie(f.x+(n?60:-60),f.y+90,61));
    });
    let wall=addFeature([2,3,7,11].includes(currentMapType)?'rottenTree':'crackwall',2500,2600);
    FEATURE_LABELS.crackwall='TƯỜNG NỨT';FEATURE_LABELS.rottenTree='CÂY MỤC';
    obstacles.push({type:'wall',x:wall.x-35,y:wall.y-55,w:70,h:110,featureId:wall.id});
    let kind=[1,8,13].includes(currentMapType)?'cage':[4,5].includes(currentMapType)?'minefield':[6,9,12].includes(currentMapType)?'spores':'swamp';
    let a=addFeature(kind,3300,3300,{r:450,anomaly:true});anomalyZone={x:a.x,y:a.y,r:450,kind};
    if(kind==='swamp')slowZones.push({x:a.x-250,y:a.y-250,w:500,h:500,type:'mud'});
    navRebuild();
}
function featureAction(f,p){
    if(f.on)return;f.on=true;Sound.play('upgrade');
    switch(f.kind){
        case 'signal':spawnDrop(f.x,f.y,true);for(let i=0;i<8;i++)zombies.push(new Zombie(f.x+(Math.random()-.5)*650,f.y+350,-1));spawnBanditTruck(f.x+350,f.y);break;
        case 'market':case 'ranger':spawnDrop(f.x,f.y,false,'HEALTHBOX');spawnDrop(f.x+50,f.y,false,'AMMOBOX');break;
        case 'arsenal':case 'heli':case 'vault':spawnDrop(f.x,f.y,true);break;
        case 'ferry':for(let q of labLiving()){q.x=f.x;q.y=Math.max(150,f.y-450);resolveCollision(q);}break;
        case 'light':case 'geo':case 'generator':darknessBattery=100;break;
        case 'shaft':drops.push({type:'SUPERBOX',forceWeapon:Math.random()<.6?'CHAINSAW':'MINIGUN',x:f.x,y:f.y,radius:16,lifeTime:900});f.ambush=20;break;
        case 'furnace':f.hold=30;f.ambush=30;break;
        case 'switch':f.branch=f.branch==='short'?'long':'short';f.on=false;break;
        case 'crusher':f.on=true;break;
        case 'cocoon':base.wait=(base.wait|0)+1;colonySettle();netToast('Đã cứu một thợ mỏ về Khu Sống Sót!',2200);break;
    }
}
function damageFeature(f,damage,w,src){
    if(f.on||f.hp<=0)return;
    const tool=w?.isChainsaw||w?.type==='explosive'||w?.isExplosiveProj||w?.isTankShell||['AXE','HAMMER'].includes(w?.key);
    if(['vault','bridge','pillar','cocoon','eggs','gland','mineral','crackwall','rottenTree'].includes(f.kind)&&!tool)return;
    f.hp-=damage*(w?.isChainsaw&&src?.perks.saw_demolition?2:1);if(f.hp>0)return;
    f.on=true;
    if(['crackwall','rottenTree'].includes(f.kind)){obstacles=obstacles.filter(o=>o.featureId!==f.id);navRebuild();if(NET.mode==='host')netSendMap();}
    if(['fuel','minefield'].includes(f.kind)){explode(f.x,f.y,300,250,src,true);fireZones.push({x:f.x,y:f.y,radius:180,life:8,dmg:35,source:src});}
    if(f.kind==='siren')for(let z of zombies)if(z.hp>0&&Math.hypot(z.x-f.x,z.y-f.y)<700){z.noiseTarget={x:f.x,y:f.y};z.noiseT=8;}
    if(f.kind==='cage')for(let i=0;i<8;i++)zombies.push(new Zombie(f.x+(Math.random()-.5)*100,f.y+(Math.random()-.5)*100,3));
    if(f.kind==='mushroom')for(let z of zombies)if(z.hp>0&&Math.hypot(z.x-f.x,z.y-f.y)<260)applyStatus(z,STATUS.FEAR,{duration:4,stacks:3});
    if(f.kind==='vault')spawnDrop(f.x,f.y,true);
    if(f.kind==='cocoon'){f.on=false;featureAction(f,src);}
    if(f.kind==='bridge'||f.kind==='pillar')for(let z of zombies)if(!isBossType(z.type)&&Math.hypot(z.x-f.x,z.y-f.y)<250){z.hp=0;zombieDown(z,src);}
    if(['gland','eggs','mineral'].includes(f.kind)){mineSabotage[f.kind]=true;shopScrap+=f.kind==='eggs'?12:6;if(f.kind==='mineral')base.mat=(base.mat|0)+5;}
    if(f.kind==='ceiling'){let q=zombies.find(z=>z.type===45&&z.hp>0);if(q&&Math.hypot(q.x-f.x,q.y-f.y)<300){q.mineStun=4;q.airborne=false;q.hp-=q.maxHp*.025;}}
}
const FEATURE_DESTRUCTIBLE=new Set(['fuel','siren','cage','mushroom','vault','bridge','pillar','cocoon','eggs','gland','mineral','ceiling','crackwall','rottenTree']);
function tickFeatures(dt){
    if(NET.mode==='guest'||objState==='HUB')return;
    for(let f of worldFeatures){
        if(f.kind==='geo'&&f.on)for(let z of zombies)if(Math.hypot(z.x-f.x,z.y-f.y)<650)z.hidden=false;
        if(f.kind==='chasm')for(let z of zombies)if(z.hp>0&&!isBossType(z.type)&&Math.abs(z.y-f.y)<55&&Math.abs(z.x-f.x)>48&&Math.abs(z.x-f.x)<175){z.hp=0;zombieDown(z,null);}
        if(FEATURE_DESTRUCTIBLE.has(f.kind)&&!f.on){
            let hitR=f.anomaly?38:f.r;
            for(let b of bullets)if(b.active&&distancePointToSegment(f.x,f.y,b.px??b.x,b.py??b.y,b.x,b.y)<hitR+8){damageFeature(f,b.dmg,b.wepData,b.source);b.active=false;}
            for(let s of slashes){let a=Math.atan2(f.y-s.y,f.x-s.x);if(!f.hits?.has(s)&&Math.hypot(s.x-f.x,s.y-f.y)<s.range+hitR&&Math.abs(Math.atan2(Math.sin(a-s.angle),Math.cos(a-s.angle)))<=s.spread/2){(f.hits||=new Set()).add(s);damageFeature(f,s.dmg,s.wepData,s.source);}}
        }
        if(f.anomaly&&!f.eventStarted&&labLiving().some(p=>Math.hypot(p.x-f.x,p.y-f.y)<f.r)){
            f.eventStarted=true;for(let n=0;n<4;n++){let p=findSafePoint(f.x+(Math.random()-.5)*350,f.y+(Math.random()-.5)*350,20),z=new Zombie(p.x,p.y,currentMapType===5?banditRandomType():3);z.anomalyGroup=f.id;zombies.push(z);}
        }
        if(f.eventStarted&&!f.rewarded&&!zombies.some(z=>z.hp>0&&z.anomalyGroup===f.id)){f.rewarded=true;shopScrap+=10;spawnDrop(f.x,f.y,true);netToast('Đã giải quyết vùng dị biến! +10 phế liệu và hòm hiếm.',2200);}
        if(!f.on&&!FEATURE_DESTRUCTIBLE.has(f.kind)&&!f.anomaly&&f.kind!=='switch'){
            let near=labLiving().find(p=>Math.hypot(p.x-f.x,p.y-f.y)<90);
            f.progress=near?f.progress+dt:0;if(f.progress>=(f.kind==='signal'?5:3))featureAction(f,near);
        }
        if(f.ambush>0){f.ambush-=dt;f.wave=(f.wave||0)-dt;if(f.wave<=0){f.wave=3;let s=findSafePoint(f.x+250,f.y,22);for(let i=0;i<3&&zombies.length<100;i++)zombies.push(new Zombie(s.x+i*30,s.y,isCaveMap()?40:-1));}}
        if(f.hold>0){if(labLiving().some(p=>Math.hypot(p.x-f.x,p.y-f.y)<230))f.hold-=dt;if(f.hold<=0){for(let p of activePlayers())if(p.weapon){let name=p.weapon.name;base.wlv[name]=Math.min(FORGE_MAX,(base.wlv[name]|0)+1);}netToast('Lò luyện hoàn tất: vũ khí cả đội +1 cấp rèn!',2500);}}
        if(f.kind==='crusher'&&f.on)for(let z of zombies)if(z.hp>0&&!isBossType(z.type)&&Math.hypot(z.x-f.x,z.y-f.y)<180){z.x+=(f.x-z.x)*dt*2;z.y+=(f.y-z.y)*dt*2;if(Math.hypot(z.x-f.x,z.y-f.y)<40){z.hp=0;zombieDown(z,null);}}
        if(f.kind==='spores'&&f.anomaly)for(let p of labLiving())if(Math.hypot(p.x-f.x,p.y-f.y)<f.r)p.labWeak=.3;
        if(f.kind==='cocoon'&&!f.on){f.hatch=(f.hatch??90)-dt;if(f.hatch<=0){f.on=true;zombies.push(new Zombie(f.x,f.y,43));}}
    }
}
const featureGenerate=generateMap;
generateMap=function(level){let r=featureGenerate(level);setupBiome();if(isCaveMap())setupCaveFeatures();return r;};
const featureStoryUpdate=updateStory;
updateStory=function(dt){featureStoryUpdate(dt);if(!storyBusy())tickFeatures(dt);};
const featureExplosion=explode;
explode=function(x,y,r,d,src,friendly){for(let f of worldFeatures)if(!f.on&&FEATURE_DESTRUCTIBLE.has(f.kind)&&Math.hypot(x-f.x,y-f.y)<r+f.r)damageFeature(f,d,{isExplosiveProj:true},src);return featureExplosion(x,y,r,d,src,friendly);};
const featureBulletHit=Bullet.prototype.triggerHit;
Bullet.prototype.triggerHit=function(){for(let f of worldFeatures)if(!f.on&&FEATURE_DESTRUCTIBLE.has(f.kind)&&Math.hypot(this.x-f.x,this.y-f.y)<65)damageFeature(f,this.dmg,this.wepData,this.source);return featureBulletHit.call(this);};
const featureZombieUpdate=Zombie.prototype.update;
Zombie.prototype.update=function(dt){if(this.noiseT>0){this.noiseT-=dt;navMoveTo(this,this.noiseTarget.x,this.noiseTarget.y,this.baseSpeed,dt);return;}return featureZombieUpdate.call(this,dt);};
const featureDrawProps=drawStoryProps;
drawStoryProps=function(T,vis){featureDrawProps(T,vis);for(let f of worldFeatures){
    if(vis&&!vis(f.x,f.y,230))continue;ctx.save();ctx.textAlign='center';
    if(f.kind==='chasm'){ctx.fillStyle='#03050b';ctx.fillRect(f.x-180,f.y-55,360,110);ctx.fillStyle='#7f7668';ctx.fillRect(f.x-44,f.y-65,88,130);}
    if(f.anomaly){ctx.strokeStyle='#92599c';ctx.lineWidth=4;ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,Math.PI*2);ctx.stroke();}
    if(f.building){ctx.fillStyle='#394752';ctx.globalAlpha=labLiving().some(p=>Math.hypot(p.x-f.x,p.y-f.y)<240)?.3:.7;ctx.fillRect(f.x-150,f.y-120,300,240);ctx.globalAlpha=1;}
    ctx.fillStyle=f.on?'#38685a':f.anomaly?'#593c60':FEATURE_DESTRUCTIBLE.has(f.kind)?'#8d663c':'#46657a';ctx.fillRect(f.x-30,f.y-25,60,50);
    outlinedText(FEATURE_LABELS[f.kind]||f.kind,f.x,f.y-40,f.on?'#94c9a3':'#e3d3a5','bold 11px Arial');
    if(!f.on&&!FEATURE_DESTRUCTIBLE.has(f.kind)&&!f.anomaly)outlinedText(f.kind==='switch'?'TƯƠNG TÁC [G]':'Đứng cạnh '+(f.kind==='signal'?'5':'3')+'s',f.x,f.y+46,'#cddde2','10px Arial');
    if(f.progress>0)drawMiniBar(f.x,f.y+31,60,5,f.progress,f.kind==='signal'?5:3,'#82c1d0');ctx.restore();
}for(let t of banditTrucks){ctx.fillStyle='#46544c';ctx.fillRect(t.x-65,t.y-35,130,70);outlinedText('CHIẾN XA CƯỚP',t.x,t.y-45,'#ffbb77','bold 12px Arial');}};
const featureNetState=storyNetState,featureNetApply=storyNetApply;
storyNetState=function(){return {...featureNetState(),wf:worldFeatures.map(({hits,...f})=>f),az:anomalyZone};};
storyNetApply=function(x){featureNetApply(x);worldFeatures=x?.wf||[];anomalyZone=x?.az||null;};
function switchFeature(pid,id){let p=players.find(p=>p.id===pid),f=worldFeatures.find(f=>f.id===id&&f.kind==='switch');if(gameState!=='PLAYING'||!p||p.isDowned||p.netLeft||!f||Math.hypot(f.x-p.x,f.y-p.y)>120)return;featureAction(f,p);netToast('Đường ray: '+(f.branch==='short'?'NHÁNH NGẮN — nhiều Acid':'NHÁNH DÀI — an toàn'),1800);}
function sendFeature(pid,id){if(NET.mode==='guest')netSend({t:'feature',id});else switchFeature(pid,id);}
window.addEventListener('keydown',e=>{if(e.code==='KeyG'&&!e.repeat){let p=localPlayer(),f=worldFeatures.find(f=>f.kind==='switch'&&Math.hypot(f.x-p.x,f.y-p.y)<120);if(f)sendFeature(p.id,f.id);}});
const featureNetData=netOnData;
netOnData=function(d,peer){if(d?.t==='feature'){if(NET.mode==='host'&&peer)switchFeature(peer.pid,d.id);return;}return featureNetData(d,peer);};
const featureSupplyHud=drawSupplyHud;
drawSupplyHud=function(){featureSupplyHud();let box=document.getElementById('featureControls');if(!box){box=document.createElement('div');box.id='featureControls';box.style.cssText='position:fixed;right:150px;bottom:100px;z-index:23';document.body.appendChild(box);}let p=localPlayer(),f=gameState==='PLAYING'&&worldFeatures.find(f=>f.kind==='switch'&&Math.hypot(f.x-p.x,f.y-p.y)<120),html=f?`<button style="padding:12px;color:white;background:#395773;border:1px solid #aac;border-radius:10px" onclick="sendFeature(${p.id},${f.id})">ĐỔI NHÁNH RAY [G]<br>${f.branch==='short'?'NGẮN / ACID':'DÀI / AN TOÀN'}</button>`:'';if(box._html!==html){box.innerHTML=html;box._html=html;}};
const featureElectric=electricBurst;
electricBurst=function(x,y,r,d,stun){if(isCaveMap()&&worldFeatures.some(f=>f.kind==='mushroom'&&Math.hypot(f.x-x,f.y-y)<220))r*=1.4;return featureElectric(x,y,r,d,stun);};
