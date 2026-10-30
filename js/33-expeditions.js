// Large ordinary expeditions. Scripted arenas/caves/camp keep their authored layout.
let fieldWorld=null,riverWorld=null;
const FIELD_CHUNK=1000,fieldSafePositions=new WeakMap();
NET_OB_T.push('forestwall');
function fieldDifficulty(){return {easy:{lo:1,hi:2,survival:30},normal:{lo:2,hi:4,survival:60},hard:{lo:3,hi:5,survival:90},hell:{lo:4,hi:6,survival:120}}[difficulty]||{lo:2,hi:4,survival:60};}
function fieldTowerCount(){let d=fieldDifficulty();return d.lo+Math.floor(Math.random()*(d.hi-d.lo+1));}
function fieldActive(){return !!fieldWorld&&fieldWorld.mt===currentMapType&&MAP_SIZE.w===8000&&objState!=='HUB';}
function isFieldMission(){return [1,2,3,7,8,9,11,12,13,17].includes(currentMapType)&&['TOWERS','COLLECT','KILL','RESCUE','BURN_PLANTS','SURVIVAL'].includes(mission.type);}
function setWorldSize(size=4000){
    MAP_SIZE.w=MAP_SIZE.h=size;let n=Math.ceil(size/NAV.cs);if(NAV.n===n)return;
    NAV.n=n;NAV.blocked=new Uint8Array(n*n);NAV.field=new Int16Array(n*n);NAV.spawnCells=[];NAV.reach=[];NAV.dirty=true;NAV.t=0;
    CAVE_GUIDE.field=new Int16Array(n*n);CAVE_GUIDE.pfield=new Int16Array(n*n);CAVE_GUIDE.key='';CAVE_GUIDE.fkey='';
    for(let e of [...allies,...rescueNPCs]){e._f=null;e._ft=0;}
}
function resetFieldWorld(){fieldWorld=null;riverWorld=null;setWorldSize(4000);}
function fieldRng(seed){let a=seed|0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
function fieldRadius(a){let p=(fieldWorld.seed%1000)*.01;return 3480+220*Math.sin(a*3+p)+130*Math.sin(a*5-p*.7);}
function fieldInside(x,y,margin=0){return !fieldActive()||Math.hypot(x-4000,y-4000)<fieldRadius(Math.atan2(y-4000,x-4000))-margin;}
function riverCoords(x,y){return riverWorld?.axis==='horizontal'?{along:x,across:y}:{along:y,across:x};}
function riverCenter(t){let r=riverWorld;return r.base+Math.sin(t/980+r.phase)*r.bend+Math.sin(t/440+r.phase)*r.bend*.2;}
function riverBridgeAt(x,y,radius=0){
    if(!riverWorld)return null;let q=riverCoords(x,y);
    return riverWorld.bridges.find(b=>Math.abs(q.along-b)<riverWorld.deck/2-radius&&Math.abs(q.across-riverCenter(b))<riverWorld.width/2+150+radius)??null;
}
function fieldTerrainBlocked(x,y,r=16){
    if(!fieldInside(x,y,r))return true;if(!riverWorld)return false;
    let q=riverCoords(x,y);return Math.abs(q.across-riverCenter(q.along))<riverWorld.width/2+r&&riverBridgeAt(x,y,r)===null;
}
function fieldWalkClear(x1,y1,x2,y2,radius=18){
    if(!fieldWorld&&!riverWorld)return true;
    let steps=Math.max(1,Math.ceil(Math.hypot(x2-x1,y2-y1)/(riverWorld?4:36)));
    for(let i=0;i<=steps;i++){
        let x=x1+(x2-x1)*i/steps,y=y1+(y2-y1)*i/steps,cx=Math.floor(x/NAV.cs),cy=Math.floor(y/NAV.cs);
        if(fieldTerrainBlocked(x,y,radius)||cx<0||cy<0||cx>=NAV.n||cy>=NAV.n||NAV.blocked[cy*NAV.n+cx])return false;
    }
    return true;
}
function fieldClampEntity(e){
    if(!fieldWorld&&!riverWorld)return;let r=e.radius||16;
    if(!fieldInside(e.x,e.y,r)){let a=Math.atan2(e.y-4000,e.x-4000),d=fieldRadius(a)-r-4;e.x=4000+Math.cos(a)*d;e.y=4000+Math.sin(a)*d;}
    if(fieldTerrainBlocked(e.x,e.y,r)){
        let old=fieldSafePositions.get(e);
        if(old&&!fieldTerrainBlocked(old.x,old.y,r)){e.x=old.x;e.y=old.y;}
        else if(riverWorld){let q=riverCoords(e.x,e.y),c=riverCenter(q.along),shore=c+Math.sign(q.across-c||1)*(riverWorld.width/2+r+8);if(riverWorld.axis==='horizontal')e.y=shore;else e.x=shore;}
    }else fieldSafePositions.set(e,{x:e.x,y:e.y});
}
function setupLegacyBridges(){
    riverWorld={axis:'horizontal',base:MAP_SIZE.h/2,width:500,deck:160,bend:0,phase:0,bridges:[650+Math.random()*350,1800+Math.random()*400,3000+Math.random()*350]};
    slowZones=slowZones.filter(z=>z.type!=='river');
    obstacles=obstacles.filter(o=>!riverWorld.bridges.some(b=>Math.abs(o.x+o.w/2-b)<riverWorld.deck/2+o.w/2+30&&Math.abs(o.y+o.h/2-riverWorld.base)<riverWorld.width/2+160+o.h/2));
}
function fieldPoint(rng,margin=280,avoid=[]){
    for(let i=0;i<1500;i++){let p={x:450+rng()*7100,y:450+rng()*7100};
        if(!fieldInside(p.x,p.y,margin)||fieldTerrainBlocked(p.x,p.y,margin))continue;
        if(riverWorld&&Math.abs(p.x-riverCenter(p.y))<550)continue;
        if(avoid.some(o=>Math.hypot(o.x-p.x,o.y-p.y)<(o.gap||1450)))continue;return p;
    }
    throw new Error('Unable to place reachable expedition objective');
}
function fieldRoute(goal){
    let path=[{x:4000,y:4000}];
    if(riverWorld&&riverWorld.axis==='vertical'&&(goal.x-riverCenter(goal.y))*(4000-riverCenter(4000))<0){
        let by=riverWorld.bridges.reduce((a,b)=>Math.abs(b-goal.y)<Math.abs(a-goal.y)?b:a),cx=riverCenter(by);
        path.push({x:cx-550,y:by},{x:cx+550,y:by});
    }
    path.push({x:goal.x,y:goal.y});return path;
}
function fieldRescuePoint(rng){
    if(shopFlags.flare)for(let i=0;i<200;i++){let p={x:4000+(rng()-.5)*2200,y:4000+(rng()-.5)*2200};if(!fieldTerrainBlocked(p.x,p.y,230))return p;}
    return fieldPoint(rng,230);
}
function fieldReserved(x,y,r=0){
    let F=fieldWorld;if(!F)return false;
    if(Math.hypot(x-4000,y-4000)<220+r)return true;
    if(F.goals.some(p=>Math.hypot(p.x-x,p.y-y)<220+r))return true;
    return F.paths.some(path=>path.some((p,i)=>i&&distancePointToSegment(x,y,path[i-1].x,path[i-1].y,p.x,p.y)<105+r));
}
function fieldClearRoutes(){
    obstacles=obstacles.filter(o=>!fieldReserved(o.x+o.w/2,o.y+o.h/2,Math.hypot(o.w,o.h)/2));NAV.dirty=true;
}
function fieldPoiKinds(mt){
    if(mt===17)return ['brazier','brazier','ranger'];
    if([1,8,13].includes(mt))return ['market','arsenal','signal','fuel','siren','outpost'];
    if(mt===12)return ['greenhouse','spores','market'];
    if(mt===9)return ['transformer','light','spores'];
    return ['ranger','light','mushroom'];
}
function loadFieldChunk(cx,cy,host=NET.mode!=='guest'){
    let F=fieldWorld,key=cx+','+cy;if(!F||cx<0||cy<0||cx>=8||cy>=8||F.loaded.includes(key))return false;
    F.loaded.push(key);let rng=fieldRng(F.seed^Math.imul(cx+1,73856093)^Math.imul(cy+1,19349663));
    let forest=[2,3,7,9,11,12,17].includes(F.mt),px=cx*1000+180+rng()*640,py=cy*1000+180+rng()*640;
    let dense=rng()<.45,n=dense?19:7,poi={x:cx*1000+220+rng()*560,y:cy*1000+220+rng()*560},hasPoi=rng()<.35&&fieldInside(poi.x,poi.y,240)&&!fieldTerrainBlocked(poi.x,poi.y,260);
    // Uneven clusters, broad ridges and small clearings; never a regular wall grid.
    for(let i=0;i<n;i++){
        let x=(dense?px+(rng()-.5)*650:cx*1000+rng()*1000),y=(dense?py+(rng()-.5)*650:cy*1000+rng()*1000);
        let ridge=i<2&&dense&&rng()<.4,thicket=forest&&dense&&i===2,type=ridge?'cave':thicket?'forestwall':forest?'tree':rng()<.65?'ruin':'rock',w=ridge||thicket?230+rng()*220:forest?55+rng()*65:70+rng()*110,h=ridge||thicket?190+rng()*210:forest?55+rng()*60:70+rng()*100;
        if(!fieldInside(x,y,Math.max(w,h))||fieldTerrainBlocked(x+w/2,y+h/2,Math.max(w,h))||fieldReserved(x+w/2,y+h/2,Math.hypot(w,h)/2)||(hasPoi&&Math.hypot(x-poi.x,y-poi.y)<230))continue;
        let o={type,x,y,w,h};if(ridge)o.poly=[{x:x+w*.12,y},{x:x+w*.86,y:y+h*.06},{x:x+w,y:y+h*.3},{x:x+w*.92,y:y+h*.88},{x:x+w*.66,y:y+h},{x:x+w*.05,y:y+h*.85},{x,y:y+h*.32}];obstacles.push(o);
    }
    if(host){
        for(let i=0;i<(dense?2:1);i++){let p={x:cx*1000+150+rng()*700,y:cy*1000+150+rng()*700};if(fieldInside(p.x,p.y,100)&&!isBlockedPoint(p.x,p.y,25))spawnDrop(p.x,p.y);}
        if(hasPoi){let kinds=fieldPoiKinds(F.mt),kind=kinds[Math.floor(rng()*kinds.length)],f=addFeature(kind,poi.x,poi.y);if(['ranger','market','arsenal','outpost','greenhouse'].includes(kind))f.building=true;if(kind==='outpost')spawnBanditSquad(f.x,f.y,[60,61,62],'chunk:'+key,true);if(kind==='signal')spawnBanditSquad(f.x,f.y+90,[60,61],'chunk:'+key,true);}
    }
    return true;
}
function generateFieldMap(level){
    setWorldSize(8000);let seed=(Math.random()*0x7fffffff)|0,rng=fieldRng(seed);
    fieldWorld={seed,mt:currentMapType,loaded:[],seen:[],known:[],goals:[],paths:[],hint:-1,idle:0,elapsed:0,progress:0,tick:0};
    obstacles=[];towers=[];missionItems=[];rescueNPCs=[];outposts=[];worldFeatures=[];anomalyZone=null;nextMissionPreference=null;
    bgMapColor=currentMapType===17?'#778780':[1,8,13].includes(currentMapType)?'#303a37':currentMapType===7?'#18241e':'#2d3b29';
    if(currentMapType===3){riverWorld={axis:'vertical',base:4650,width:320,deck:180,bend:210,phase:rng()*6,bridges:[1600+rng()*500,3300+rng()*500,5000+rng()*500,6400+rng()*350]};}
    if(mission.type==='TOWERS')for(let i=0;i<mission.required;i++){let p=fieldPoint(rng,320,[{x:4000,y:4000,gap:1000},...towers]);towers.push({...p,progress:0,active:false});fieldWorld.goals.push(p);}
    if(mission.type==='COLLECT')for(let i=0;i<mission.required+2;i++){let p=fieldPoint(rng,200);missionItems.push({...p,radius:14,taken:false});fieldWorld.goals.push(p);}
    if(mission.type==='RESCUE')for(let i=0;i<mission.required;i++){let p=fieldRescuePoint(rng),n=new RescueNPC(p.x,p.y);rescueNPCs.push(n);fieldWorld.goals.push(p);}
    if(mission.type==='BURN_PLANTS'){
        mission.required=5;for(let i=0;i<5;i++){let p=fieldPoint(rng,250);story.props.push({kind:'plant',...p,r:42,hp:350,maxHp:350,on:false,breakable:true,fireOnly:true,v:i%3,cd:1});fieldWorld.goals.push(p);}
    }
    fieldWorld.paths=fieldWorld.goals.map(fieldRoute);
    players.forEach((p,i)=>{if(!p.netLeft){p.x=4000+(i-1.5)*40;p.y=4000;}});
    updateFieldWorld(0,true);navRebuild();navUpdate(0);
    deployShopMines();
    if(currentMapType===17)addFeature('brazier',4000,4200);
    pickWeatherForMap(true);if(currentMapType===17)currentWeather=9;
    weatherTimer=45+Math.random()*30;
}
function placeLegacyTowers(count){
    for(let i=0;i<count;i++){let p=null;for(let j=0;j<300;j++){let q={x:400+Math.random()*(MAP_SIZE.w-800),y:400+Math.random()*(MAP_SIZE.h-800)};if(towers.every(t=>Math.hypot(q.x-t.x,q.y-t.y)>650)){p=q;break;}}if(!p)p={x:MAP_SIZE.w/2+Math.cos(i*2.4)*1200,y:MAP_SIZE.h/2+Math.sin(i*2.4)*1200};towers.push({...p,progress:0,active:false});}
}
function updateFieldWorld(dt,force=false){
    if(!fieldActive()||NET.mode==='guest')return;
    let F=fieldWorld;F.elapsed+=dt;F.idle+=dt;F.tick-=dt;
    let progress=towers.reduce((n,t)=>n+(t.active?1:0),0)+mission.progress;
    if(progress!==F.progress){F.progress=progress;F.idle=0;F.hint=-1;}
    if(!force&&F.tick>0)return;F.tick=.25;let changed=false;
    for(let p of activePlayers())if(!p.isDowned){let q=inTank(p)?tank:p,cx=Math.floor(q.x/1000),cy=Math.floor(q.y/1000);
        for(let x=cx-1;x<=cx+1;x++)for(let y=cy-1;y<=cy+1;y++){if(loadFieldChunk(x,y))changed=true;let key=x+','+y;if(x>=0&&y>=0&&x<8&&y<8&&!F.seen.includes(key))F.seen.push(key);}
        towers.forEach((t,i)=>{if(Math.hypot(t.x-q.x,t.y-q.y)<650&&!F.known.includes(i)){F.known.push(i);spawnBanditSquad(t.x+80,t.y+90,[60,61],'mission-tower:'+i,true);}});
    }
    if(changed){navRebuild();NAV.t=0;}
    if(mission.type==='TOWERS'&&!mission.complete&&F.idle>=90&&F.hint<0){F.hint=towers.findIndex((t,i)=>!t.active&&!F.known.includes(i));if(F.hint>=0)queueRadio('Bắt được tín hiệu yếu! Một tháp đã được đánh dấu. Bầy zombie đang lần theo tiếng động.',null,6);}
}
function fieldTowerKnown(t){return !fieldActive()||t.active||fieldWorld.known.includes(towers.indexOf(t))||fieldWorld.hint===towers.indexOf(t);}
function fieldSpawnPlan(count,rate){
    if(!fieldActive())return {count,rate};
    let survival=mission.type==='SURVIVAL',hint=fieldWorld.idle>=90,alive=zombies.filter(z=>z.hp>0).length;
    let cap=survival?145:hint?85:65,mult=survival?2.4:hint?.8:.48;
    return {count:Math.max(0,Math.min(cap-alive,Math.ceil(count*mult))),rate:survival?Math.min(.8,rate*.55):rate*(hint?1:1.5)};
}
function pickLandingSite(){
    let p;if(fieldActive()){
        p=fieldPoint(fieldRng(((Math.random()*0x7fffffff)|0)^Date.now()),300);fieldWorld.goals.push(p);fieldWorld.paths.push(fieldRoute(p));fieldClearRoutes();
        let cx=Math.floor(p.x/1000),cy=Math.floor(p.y/1000);for(let x=cx-1;x<=cx+1;x++)for(let y=cy-1;y<=cy+1;y++)loadFieldChunk(x,y);
        fieldClearRoutes();navRebuild();
    }else{
        if(NAV.dirty)navRebuild();let f=navFlood([players.find(p=>!p.netLeft&&!p.isDowned)||{x:MAP_SIZE.w/2,y:MAP_SIZE.h/2}],new Int16Array(NAV.n*NAV.n)),cells=[];
        for(let i=0;i<f.length;i++)if(f[i]>=0){let q=navCellPoint(i);if(!isBlockedPoint(q.x,q.y,160))cells.push(q);}
        p=cells.length?cells[Math.floor(Math.random()*cells.length)]:findSafePoint(MAP_SIZE.w/2,MAP_SIZE.h/2,100);
    }
    return p;
}
function announceLanding(){if(!evacZone||evacZone.announced)return;evacZone.announced=true;queueRadio('TRỰC THĂNG SẼ ĐÁP SAU 15 GIÂY! Tới điểm hạ cánh đã đánh dấu.',null,7);netToast('ĐIỂM ĐÁP ĐÃ XÁC ĐỊNH · 15 GIÂY',3500);}
function landingKnown(){return !!evacZone&&(objState!=='WAITING'||evacZone.announced!==false);}
function fieldNetState(){return fieldActive()?{seed:fieldWorld.seed,mt:fieldWorld.mt,loaded:fieldWorld.loaded,seen:fieldWorld.seen,known:fieldWorld.known,hint:fieldWorld.hint,idle:fieldWorld.idle,goals:fieldWorld.goals,paths:fieldWorld.paths,river:riverWorld}:null;}
function fieldApplyMap(data,size){
    fieldWorld=null;riverWorld=data?.river||null;setWorldSize(data?8000:(size?.[0]===8000?8000:4000));
    if(data)fieldWorld={...data,loaded:[...data.loaded],tick:0,elapsed:0,progress:0};
}
function fieldApplySnapshot(data){
    if(!data||NET.mode!=='guest')return;
    if(!fieldWorld||fieldWorld.seed!==data.seed){fieldApplyMap({...data,loaded:[]});obstacles=[];}
    fieldWorld.goals=data.goals;fieldWorld.paths=data.paths;riverWorld=data.river||null;
    let changed=false;for(let key of data.loaded){let [x,y]=key.split(',').map(Number);if(loadFieldChunk(x,y,false))changed=true;}
    fieldWorld.seen=[...data.seen];fieldWorld.known=[...data.known];fieldWorld.hint=data.hint;fieldWorld.idle=data.idle;
    if(changed||evacZone){fieldClearRoutes();NAV.dirty=true;}
}
function drawRiver(T,x0,x1,y0,y1){
    if(!riverWorld)return;T=artMotion(T);let R=riverWorld,h=R.axis==='horizontal';ctx.save();ctx.fillStyle='#263e41';ctx.strokeStyle='#6e8578';ctx.lineWidth=3;
    let lo=h?x0:y0,hi=h?x1:y1;
    ctx.beginPath();for(let t=lo-80;t<=hi+80;t+=40){let c=riverCenter(t)-R.width/2;h?ctx.lineTo(t,c):ctx.lineTo(c,t);}for(let t=hi+80;t>=lo-80;t-=40){let c=riverCenter(t)+R.width/2;h?ctx.lineTo(t,c):ctx.lineTo(c,t);}ctx.closePath();ctx.fill();ctx.stroke();
    for(let t=Math.floor(lo/100)*100;t<hi;t+=100){let c=riverCenter(t);artLine(h?[[t,c-90],[t+50,c-80+Math.sin(T*2+t)*5]]:[[c-90,t],[c-80+Math.sin(T*2+t)*5,t+50]],'#577f7c77',2);}
    for(let b of R.bridges){let c=riverCenter(b);ctx.save();ctx.translate(h?b:c,h?c:b);if(h)ctx.rotate(Math.PI/2);let len=R.width+280;
        artBox(-len/2,-R.deck/2,len,R.deck,'#756b50','#373e2c',2);for(let x=-len/2+8;x<len/2;x+=24)artLine([[x,-R.deck/2+5],[x,R.deck/2-5]],'#b0a17b',2);
        for(let side of [-1,1]){artLine([[-len/2,side*R.deck/2],[len/2,side*R.deck/2]],'#c0b392',5);for(let x=-len/2;x<len/2;x+=70)artBox(x,side*R.deck/2-5,7,10,'#383f2d');}ctx.restore();
    }ctx.restore();
}
function drawFieldFog(x0,x1,y0,y1){
    if(!fieldActive())return;ctx.save();ctx.fillStyle='#0e1714';
    for(let x=Math.max(0,Math.floor(x0/1000));x<Math.min(8,Math.ceil(x1/1000));x++)for(let y=Math.max(0,Math.floor(y0/1000));y<Math.min(8,Math.ceil(y1/1000));y++)if(!fieldWorld.seen.includes(x+','+y))ctx.fillRect(x*1000,y*1000,1001,1001);
    ctx.beginPath();ctx.rect(0,0,8000,8000);for(let i=0;i<=100;i++){let a=i/100*Math.PI*2,r=fieldRadius(a),x=4000+Math.cos(a)*r,y=4000+Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fillStyle='#111914';ctx.fill('evenodd');ctx.restore();
}
const fieldSlow=checkSlowZone;
checkSlowZone=function(x,y){return riverBridgeAt(x,y)!==null?1:fieldSlow(x,y);};
