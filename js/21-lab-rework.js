// Lab Z rework. Loaded after legacy modules: entrance and train combat are reused.
const LAB_ROOM_NAMES = { lobby: 'SẢNH CHÍNH', empty: 'KHO TIẾP TẾ', ambush: 'KHU CÁCH LY', office: 'VĂN PHÒNG', filter: 'KHỬ ĐỘC', bunker: 'BOONGKE' };
const LAB_ENEMIES = { 52: 'SCIENTIST', 53: 'ACIDER', 54: 'CHEMIST' };
const labLiving = () => activePlayers().filter(p => !p.isDowned);
function labInside(p, r, margin = 0) { return p.x > r.x + margin && p.x < r.x + r.w - margin && p.y > r.y + margin && p.y < r.y + r.h - margin; }
function labDungeon() { return currentMapType === 15 && story.lab && story.lab.dungeon; }

// Connected 3x3 room graph with shuffled room sizes and corridor door types.
// Every locked edge is hackable without a key, so no key can lock itself away.
function makeLabLayout() {
    let kinds = ['office', 'filter', 'empty', 'filter', 'ambush', 'filter', 'bunker', 'lobby', 'bunker'];
    if (Math.random() < 0.5) [kinds[0], kinds[2]] = [kinds[2], kinds[0]];
    const rooms = kinds.map((kind, id) => {
        let cx = 800 + id % 3 * 1200, cy = 800 + Math.floor(id / 3) * 1200;
        let w = kind === 'lobby' ? 800 : 600 + Math.floor(Math.random() * 3) * 100;
        let h = kind === 'lobby' ? 700 : 500 + Math.floor(Math.random() * 3) * 100;
        return { id, kind, cx, cy, x: cx - w / 2, y: cy - h / 2, w, h, visited: false, cleared: false };
    });
    let doors = [], floors = rooms.map(r => ({ x:r.x, y:r.y, w:r.w, h:r.h }));
    for (let r of rooms) for (let next of [r.id % 3 < 2 ? r.id + 1 : -1, r.id < 6 ? r.id + 3 : -1]) {
        if (next < 0) continue;
        let n = rooms[next], horizontal = n.cy === r.cy;
        let hall = horizontal ? {x:r.cx,y:r.cy-100,w:n.cx-r.cx,h:200} : {x:r.cx-100,y:r.cy,w:200,h:n.cy-r.cy};
        floors.push(hall);
        let type = ['broken','normal','secure'][Math.floor(Math.random()*3)];
        let d = {id:doors.length,a:r.id,b:n.id,type,open:type==='broken',progress:0,step:0,owner:0,ambush:0,
            puzzle: Math.floor(Math.random()*3), phase:0, turns:[0,0,0], target:[1,2,3], codes:[], sequence:[]};
        Object.assign(d, horizontal ? {x:(r.cx+n.cx)/2-25,y:r.cy-100,w:50,h:200} : {x:r.cx-100,y:(r.cy+n.cy)/2-25,w:200,h:50});
        d.cx=d.x+d.w/2; d.cy=d.y+d.h/2;
        d.target=d.target.map(()=>Math.floor(Math.random()*4)); d.turns=d.target.map(t=>(t+1+Math.floor(Math.random()*3))%4);
        d.codes=Array.from({length:9},(_,i)=>(16+i*13).toString(16).toUpperCase());
        d.sequence=Array.from({length:3},()=>Math.floor(Math.random()*9));
        doors.push(d);
    }
    // Random spanning tree, then a few loop edges: connected but different routes each run.
    let parent=rooms.map(r=>r.id),root=n=>parent[n]===n?n:(parent[n]=root(parent[n]));
    let shuffled=doors.slice();for(let i=shuffled.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
    doors=shuffled.filter(d=>{let a=root(d.a),b=root(d.b);if(a!==b){parent[a]=b;return true;}return Math.random()<.3;});
    floors=rooms.map(r=>({x:r.x,y:r.y,w:r.w,h:r.h}));
    doors.forEach((d,i)=>{d.id=i;if(i<3){d.type=['broken','normal','secure'][i];d.open=i===0;}
        let r=rooms[d.a],n=rooms[d.b];floors.push(n.cy===r.cy?{x:r.cx,y:r.cy-100,w:n.cx-r.cx,h:200}:{x:r.cx-100,y:r.cy,w:200,h:n.cy-r.cy});});
    return {rooms,doors,floors,elapsed:0,keys:0,saved:0,prints:0,filters:0,waveT:12,acid:[],serial:0};
}
function labBuildWalls(D) {
    obstacles=[];
    // Merge horizontal blocked tiles; ~150 rectangles instead of thousands of tiles.
    for (let y=0;y<4000;y+=50) {
        let start=-1;
        for(let x=0;x<=4000;x+=50) {
            let blocked=x<4000 && !D.floors.some(r=>labInside({x:x+25,y:y+25},r));
            if(blocked && start<0) start=x;
            if(!blocked && start>=0) { obstacles.push({type:'wall',x:start,y,w:x-start,h:50,labWall:true}); start=-1; }
        }
    }
    labRefreshDoors(D);
}
function labRefreshDoors(D) {
    obstacles=obstacles.filter(o=>o.labDoor===undefined);
    for(let d of D.doors) if(!d.open || d.sealed) obstacles.push({type:'wall',x:d.x,y:d.y,w:d.w,h:d.h,labDoor:d.id});
    navRebuild(); NAV.t=0;
    if(NET.mode==='host') netSendMap();
}
function enterProceduralLab() {
    let L=story.lab, D=L.dungeon=makeLabLayout();
    L.stage='explore'; L.gas=0; story.noSpawn=true; story.props=[];
    zombies=[]; hazards=[]; enemyBullets=[]; bullets=[]; drops=[]; rescueNPCs=[]; slashes=[]; thrownItems=[];
    radioDialogs=[];radioDialogTimer=0;
    tank.active=false; tank.crew=[]; story.arena=null;
    labBuildWalls(D);
    let lobby=D.rooms[7];
    activePlayers().forEach((p,i)=>{p.x=lobby.cx+(i-1.5)*45;p.y=lobby.cy;p.labWeak=0;});
    allies.forEach((a,i)=>{a.x=lobby.cx-100+i*40;a.y=lobby.cy+100;});
    for(let r of D.rooms) {
        if(r.kind==='filter') story.props.push({kind:'machine',x:r.cx,y:r.cy,r:30,hp:0,maxHp:4,on:false,room:r.id});
        if(r.kind==='office') for(let i=0;i<2;i++) story.props.push({kind:'print',x:r.cx-60+i*120,y:r.cy,r:16,on:false,room:r.id});
        if(r.kind==='bunker') { let n=new Scientist(r.cx,r.cy);n.labRoom=r.id; rescueNPCs.push(n); }
        if(r.kind==='empty') for(let type of ['MEDKIT','FOOD','BLINDBOX']) drops.push({type,x:r.cx+(Math.random()-.5)*150,y:r.cy,radius:15,lifeTime:900});
        if(r.kind!=='lobby' && r.kind!=='bunker') labSpawnRoom(r,2,0);
    }
    objState='LAB_EXPLORE';mission={type:objState,progress:0,required:7,complete:false};
    updateCamera(0,true); addScreenFlash(0.7,100); Sound.play('level');
    queueRadio('Lab Z: tìm 2 tài liệu, cứu 2 nhà khoa học, bật 3 máy khử độc. Sau 3 phút khí độc sẽ rò rỉ! Cửa bảo mật có thể hack hoặc dùng thẻ từ.',null,8);
    if(NET.mode==='host') {netSendMap();netSendSync();}
}
function labSpawnRoom(r,count,group) {
    for(let i=0;i<count && zombies.length<85;i++) {
        let z=new Zombie(r.cx+(Math.random()-.5)*(r.w-140),r.cy+(Math.random()-.5)*(r.h-140),52+Math.floor(Math.random()*3));
        z.labGroup=group;
        if(group && i===0) {z.mutant=true;z.hp*=1.8;z.maxHp=z.hp;}
        zombies.push(z);
    }
}
function labDoorOpen(D,d) {d.open=true;d.owner=0;d.progress=0;Sound.play('level');labRefreshDoors(D);}
function labFailHack(D,d) {
    if(!d.owner || d.ambush) return;
    d.owner=0;d.ambush=++D.serial;
    let r=D.rooms[d.a], p=labLiving().find(p=>Math.hypot(p.x-d.cx,p.y-d.cy)<220);
    if(p) r=D.rooms.find(r=>labInside(p,r))||[D.rooms[d.a],D.rooms[d.b]].sort((a,b)=>Math.hypot(p.x-a.cx,p.y-a.cy)-Math.hypot(p.x-b.cx,p.y-b.cy))[0];
    labSpawnRoom(r,4+activePlayerCount(),d.ambush);Sound.play('roar');
    netToast('ALARME! Dọn phục kích để tiếp tục hack từ bước đã giải.',2200);
}
function labCommand(pid,action,id,value,step) {
    let D=labDungeon(), p=players.find(p=>p.id===pid&&!p.netLeft&&!p.isDowned);
    if(!D || !p || gameState!=='PLAYING') return;
    let d=D.doors.find(d=>d.id===id);
    if(!d || d.open || d.sealed || d.ambush || Math.hypot(p.x-d.cx,p.y-d.cy)>190) return;
    if(action==='key' && D.keys>0 && (!d.owner || d.owner===pid)) {D.keys--;labDoorOpen(D,d);return;}
    if(action==='start' && !d.owner && !D.doors.some(q=>q.owner===pid)) {d.owner=pid;d.hp=p.hp;d.shield=p.vHp||0;return;}
    if(d.owner!==pid) return;
    if(action==='cancel') {d.owner=0;return;}
    if(action!=='solve' || step!==d.step || !Number.isInteger(value)) return;
    if(d.puzzle===0) {
        if(value>=0&&value<3) {d.turns[value]=(d.turns[value]+1)%4;return;}
        if(value!==3) return;
        if(d.turns[d.step]!==d.target[d.step]) return labFailHack(D,d);
    } else if(d.puzzle===1) {
        if(value!==0) return;
        if(Math.abs(d.phase-.5)>.18) return labFailHack(D,d);
    } else if(value!==d.sequence[d.step]) return labFailHack(D,d);
    d.step++;
    if(d.step>=3) labDoorOpen(D,d);
}
function labSend(action,id,value,step,pid) {
    pid=pid||localPlayer().id;
    if(NET.mode==='guest') netSend({t:'labcmd',action,id,value,step});
    else labCommand(pid,action,id,value,step);
}
function labStartStation() {
    let L=story.lab,D=L.dungeon; L.sciSaved=D.saved;
    L.dungeon=null;L.stage='hold';L.hold=50;L.waveT=1.5;L.gas=0;
    obstacles=[];story.props=[];rescueNPCs=[];zombies=[];hazards=[];drops=[];enemyBullets=[];bullets=[];
    genLabZ(currentLevel);obstacles=obstacles.filter(o=>!o.door);
    activePlayers().forEach((p,i)=>{p.x=LAB.train.x+(i-1.5)*45;p.y=LAB.train.y+200;p.labWeak=0;});
    allies.forEach((a,i)=>{a.x=LAB.train.x-100+i*45;a.y=LAB.train.y+250;});
    story.props.push({kind:'traindoor',x:LAB.train.x,y:LAB.train.y,r:210});
    let boss=new Zombie(LAB.train.x,1180,37);zombies.push(boss);makeBossArena(boss,LAB.train.x,830,640,true);
    objState='STATION_HOLD';mission.type=objState;story.noSpawn=true;
    navRebuild();updateCamera(0,true);Sound.play('roar');
    queueRadio('Tàu đang khởi động! Cầm cự 50 giây trước The Hucker; không cần hạ boss. Tàu mở cửa là lên ngay!',null,7);
    if(NET.mode==='host')netSendMap();
}
function tickProceduralLab(dt,D) {
    let L=story.lab, alive=labLiving();D.elapsed+=dt;
    let machines=story.props.filter(q=>q.kind==='machine');
    D.filters=machines.filter(q=>q.on).length;
    L.gas=D.elapsed>=180&&D.filters<3?1:0;
    if(L.gas&&!D.warned) {D.warned=true;Sound.play('roar');queueRadio('RÒ RỈ KHÍ ĐỘC! Bật đủ ba máy khử độc để làm sạch toàn bộ Lab!',null,5);}
    for(let p of alive) if(L.gas) {p.labWeak=.3;p.labGasDamage=true;try{p.takeDot(p.maxHp*.012*(1-(p.caveToxinResist||0))*dt);}finally{p.labGasDamage=false;}}
    for(let a of D.acid) {a.life-=dt;for(let p of alive)if(Math.hypot(p.x-a.x,p.y-a.y)<a.r){p.labWeak=.3;acidHurt(p,12*dt);}}
    D.acid=D.acid.filter(a=>a.life>0);
    for(let d of D.doors) {
        d.phase=(Math.sin(D.elapsed*2.3+d.id)+1)/2;
        if(d.ambush && !zombies.some(z=>z.hp>0&&z.labGroup===d.ambush)) d.ambush=0;
        if(d.owner) {
            let p=alive.find(p=>p.id===d.owner);
            if(!p || Math.hypot(p.x-d.cx,p.y-d.cy)>200) d.owner=0;
            // Damage hooks interrupt enemy hits; ambient gas must not cancel a hack.
        }
        if(d.type==='normal'&&!d.open&&!d.sealed) {
            d.progress=alive.some(p=>Math.hypot(p.x-d.cx,p.y-d.cy)<155)?d.progress+dt:0;
            if(d.progress>=2)labDoorOpen(D,d);
        }
    }
    for(let r of D.rooms) {
        if(r.kind==='ambush'&&!r.visited&&alive.some(p=>labInside(p,r,70))) {
            r.visited=true;r.group=++D.serial;
            for(let d of D.doors)if(d.a===r.id||d.b===r.id)d.sealed=true;
            labRefreshDoors(D);labSpawnRoom(r,6+activePlayerCount(),r.group);Sound.play('roar');
        }
        if(r.group&&!r.cleared&&!zombies.some(z=>z.hp>0&&z.labGroup===r.group)) {
            r.cleared=true;D.keys++;drops.push({type:'SUPERBOX',x:r.cx,y:r.cy,radius:16,lifeTime:900});
            for(let d of D.doors)if(d.a===r.id||d.b===r.id)d.sealed=false;
            labRefreshDoors(D);netToast('Khu cách ly an toàn! +1 thẻ từ và hòm tiếp tế.',2000);
        }
    }
    for(let m of machines)if(!m.on) {
        m.hp=alive.some(p=>Math.hypot(p.x-m.x,p.y-m.y)<100)?m.hp+dt:0;
        if(m.hp>=4){m.on=true;Sound.play('level');}
    }
    for(let b of story.props.filter(q=>q.kind==='print'))if(!b.on&&alive.some(p=>Math.hypot(p.x-b.x,p.y-b.y)<55)){b.on=true;Sound.play('shard');}
    D.prints=story.props.filter(q=>q.kind==='print'&&q.on).length;
    for(let n of rescueNPCs)if(n.labRoom!==undefined&&!n.labSafe&&n.rescued&&n.hp>0&&!n.down) {
        n.labSafe=true;D.saved++;D.keys++;let r=D.rooms[n.labRoom];r.cleared=true;n.x=r.cx;n.y=r.cy;
        netToast('Nhà khoa học đã khóa boongke an toàn. +1 thẻ từ.',2500);
    }
    if(rescueNPCs.some(n=>n.labRoom!==undefined&&n.hp<=0)) {labFail('Không cứu kịp nhà khoa học trong Lab.');return;}
    L.mOn=machines.filter(m=>m.on).length;L.pGot=D.prints;L.sRes=D.saved;L.sAlive=2;
    mission.progress=L.mOn+D.prints+D.saved;
    if(mission.progress>=7&&L.stage==='explore') {L.stage='alarm';objState='LAB_ALARM';mission.type=objState;D.waveT=0;Sound.play('roar');}
    D.waveT-=dt;
    if(D.waveT<=0) {
        D.waveT=L.stage==='alarm'?3:14;
        let room=D.rooms.filter(r=>r.kind!=='bunker'&&!alive.some(p=>labInside(p,r)));
        labSpawnRoom(room[Math.floor(Math.random()*room.length)]||D.rooms[7],L.stage==='alarm'?4:1,0);
    }
    if(L.stage==='alarm') {
        let r=D.rooms[7];D.consoleT=alive.some(p=>Math.hypot(p.x-r.cx,p.y-r.cy)<100)?(D.consoleT||0)+dt:0;
        if(D.consoleT>=3)labStartStation();
    }
}

const labLegacyUpdate=updateLab;
updateLab=function(dt){
    let L=story.lab;if(!L)return;
    if(L.stage==='breach') {
        let alive=labLiving();let together=alive.length>0&&alive.every(p=>Math.hypot(p.x-LAB.doorS.x,p.y-LAB.doorS.y)<190);
        L.enterT=together?(L.enterT||0)+dt:0;if(L.enterT>=1)enterProceduralLab();return;
    }
    if(L.dungeon&&L.stage!=='done'){tickProceduralLab(dt,L.dungeon);return;}
    labLegacyUpdate(dt);
};
const labLegacyAfter=labAfterGenerate;
labAfterGenerate=function(level){labLegacyAfter(level);rescueNPCs=rescueNPCs.filter(n=>n.kind!=='scientist');};
const labLegacyObjective=labObjectiveText;
labObjectiveText=function(){
    let L=story.lab,D=labDungeon();
    if(L&&L.stage==='breach')return ['CỬA ĐÃ MỞ — tất cả người còn sống tập trung tại cửa', '#f1c40f'];
    if(D)return [L.stage==='alarm'?'BÁO ĐỘNG! Trở về SẢNH CHÍNH, giữ cạnh bảng điều khiển 3s':`LAB Z · Lọc ${L.mOn||0}/3 · Tài liệu ${D.prints}/2 · Cứu ${D.saved}/2 · ${L.gas?'KHÍ ĐỘC!':Math.max(0,Math.ceil(180-D.elapsed))+'s tới rò rỉ'} · Thẻ từ ${D.keys}`,L.gas?'#ff7675':'#74b9ff'];
    return labLegacyObjective();
};
const labLegacyPointers=labPointers;
labPointers=function(ptr){let D=labDungeon();if(!D)return labLegacyPointers(ptr);if(story.lab.stage==='alarm')ptr(D.rooms[7].cx,D.rooms[7].cy,'#f1c40f');else for(let q of story.props)if(!q.on)ptr(q.x,q.y,'#74b9ff');};

const labPlayerUpdate=Player.prototype.update;
Player.prototype.update=function(dt){
    this.labWeak=Math.max(0,(this.labWeak||0)-dt);
    let D=labDungeon();if(D&&D.doors.some(d=>d.owner===this.id)){this.curSpeed=0;this.vx=0;this.vy=0;updateStatusEffects(this,dt,true);return;}
    let speed=this.baseSpeed;if(this.labWeak>0)this.baseSpeed*=.85;
    try{return labPlayerUpdate.call(this,dt);}finally{this.baseSpeed=speed;}
};
const labDamageMult=Player.prototype.getTotalDamageMult;
Player.prototype.getTotalDamageMult=function(){return labDamageMult.call(this)*(this.labWeak>0?.85:1);};
for(let method of ['takeDamage','takeDot']) {
    let original=Player.prototype[method];
    Player.prototype[method]=function(amount,opts){let hp=this.hp,v=this.vHp;let result=original.call(this,amount,opts);let D=labDungeon();if(D&&!this.labGasDamage&&(this.hp<hp||this.vHp<v))for(let d of D.doors)if(d.owner===this.id)labFailHack(D,d);return result;};
}
const labScientistUpdate=Scientist.prototype.update,labScientistDamage=Scientist.prototype.takeDamage;
Scientist.prototype.update=function(dt){if(!this.labSafe)return labScientistUpdate.call(this,dt);};
Scientist.prototype.takeDamage=function(d){if(!this.labSafe)return labScientistDamage.call(this,d);};
const labCollision=resolveCollision;
resolveCollision=function(e){labCollision(e);let D=labDungeon();if(!D||!(e instanceof Zombie))return;
    for(let r of D.rooms)if(r.kind==='bunker'&&r.cleared&&labInside(e,r)){
        let sides=[{v:Math.abs(e.x-r.x),x:r.x-e.radius,y:e.y},{v:Math.abs(e.x-r.x-r.w),x:r.x+r.w+e.radius,y:e.y},
            {v:Math.abs(e.y-r.y),x:e.x,y:r.y-e.radius},{v:Math.abs(e.y-r.y-r.h),x:e.x,y:r.y+r.h+e.radius}];
        sides.sort((a,b)=>a.v-b.v);e.x=sides[0].x;e.y=sides[0].y;
    }
};
function expeditionMovementLocked(p){return !!((typeof cartRun!=='undefined'&&cartRun)||(labDungeon()&&labDungeon().doors.some(d=>d.owner===p.id)));}

const labZombieSpecial=updateSpecialZombie;
updateSpecialZombie=function(z,target,dist,ang,dt,speed){
    if(!LAB_ENEMIES[z.type])return labZombieSpecial(z,target,dist,ang,dt,speed);
    z.labFire=(z.labFire||0)-dt;
    if(z.type===54&&dist<550&&hasLineOfSight(z.x,z.y,target.x,target.y)) {
        if(z.labFire<=0){z.labFire=.22;enemyBullets.push(new EnemyBullet(z.x,z.y,target.x,target.y,'acid'));}
    } else {z.x+=Math.cos(ang)*speed*dt;z.y+=Math.sin(ang)*speed*dt;resolveCollision(z);}
    if(dist<z.radius+(target.radius||16)+14&&z.labFire<=0){z.labFire=.9;target.takeDamage(12);if(target instanceof Player){target.labWeak=2;applyPlayerStatus(target,STATUS.CORROSION,{duration:4,dpsPercent:.004,stacks:1,maxStacks:3});}}
    return true;
};
const labZombieDown=zombieDown;
zombieDown=function(z,source){
    let killed=labZombieDown(z,source),D=labDungeon();
    if(killed&&D&&(z.type===53||z.type===54)) {
        let r=z.type===54?230:105;D.acid.push({x:z.x,y:z.y,r,life:6});spawnRing(z.x,z.y,'#a3cb38',r,.5,4);
        if(z.type===54)for(let p of labLiving())if(Math.hypot(p.x-z.x,p.y-z.y)<r){p.takeDamage(28);p.labWeak=2;}
    }
    return killed;
};
const labZombieDraw=drawZombieBody;
drawZombieBody=function(z,T,ang,rage,boss,inBush){
    if(!LAB_ENEMIES[z.type])return labZombieDraw(z,T,ang,rage,boss,inBush);
    ctx.fillStyle=z.type===52?'#dfe6e9':z.type===53?'#a3cb38':'#9b59b6';ctx.beginPath();ctx.arc(z.x,z.y,z.radius,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#25352b';ctx.fillRect(z.x-8,z.y-5,16,7);outlinedText(LAB_ENEMIES[z.type],z.x,z.y-z.radius-9,'#dff9fb','bold 9px Arial');
};
const labLegacyFloor=drawLabFloor;
drawLabFloor=function(T){
    let D=labDungeon();if(!D)return labLegacyFloor(T);
    for(let r of D.floors){ctx.fillStyle='#14222b';ctx.fillRect(r.x,r.y,r.w,r.h);}
    for(let r of D.rooms){ctx.fillStyle=r.cleared?'#183b32':'#20343f';ctx.fillRect(r.x,r.y,r.w,r.h);outlinedText(LAB_ROOM_NAMES[r.kind],r.cx,r.cy-r.h/2+45,'#87b9c4','bold 22px Arial');}
    for(let d of D.doors){ctx.fillStyle=d.sealed||d.ambush?'#e74c3c':d.open?'#276a55':d.type==='secure'?'#ab68d2':'#d5a34e';ctx.fillRect(d.x,d.y,d.w,d.h);outlinedText(d.open?'MỞ':d.sealed?'PHỤC KÍCH':d.type==='secure'?`HACK ${d.step}/3`:`MỞ ${Math.ceil(Math.max(0,2-d.progress))}s`,d.cx,d.cy-35,'#fff','bold 12px Arial');}
    for(let a of D.acid){ctx.fillStyle='rgba(148,210,38,.35)';ctx.beginPath();ctx.arc(a.x,a.y,a.r,0,Math.PI*2);ctx.fill();}
    if(story.lab.stage==='alarm'){let r=D.rooms[7];ctx.fillStyle='#ffc857';ctx.fillRect(r.cx-35,r.cy-25,70,50);outlinedText('GỌI TÀU · ĐỨNG CẠNH 3s',r.cx,r.cy-45,'#ffc857','bold 16px Arial');}
};

// Small DOM panels stay interactive on PC, touch, and shared-screen local co-op.
function renderLabPanels(){
    let box=document.getElementById('labHackPanels');
    if(!box){box=document.createElement('div');box.id='labHackPanels';box.style.cssText='position:fixed;inset:85px 8px auto;z-index:24;display:flex;justify-content:space-between;gap:8px;pointer-events:none';document.body.appendChild(box);}
    let D=labDungeon(), views=NET.mode?[localPlayer()]:players.slice(0,isSinglePlayer?1:2), html='';
    if(D&&gameState==='PLAYING')for(let p of views){
        if(!p||p.isDowned)continue;
        let d=D.doors.find(d=>d.owner===p.id)||D.doors.find(d=>!d.open&&!d.sealed&&d.type==='secure'&&Math.hypot(p.x-d.cx,p.y-d.cy)<190);
        if(!d)continue;
        const button=(label,action,value=0)=>`<button style="padding:9px;margin:3px;border:1px solid #68bfc9;border-radius:6px;background:#203c48;color:white" onclick="labSend('${action}',${d.id},${value},${d.step},${p.id})">${label}</button>`;
        let body=d.ambush?'Dọn phục kích để tiếp tục.':d.owner&&d.owner!==p.id?'Đồng đội đang hack.':!d.owner?button('Hack cửa','start')+(D.keys?button('Dùng thẻ từ','key'):''):'';
        if(d.owner===p.id){
            if(d.puzzle===0){body=`Nối mạch ${d.step+1}/3: xoay ô đang giải để nối đúng hướng đích.<br>`;for(let i=0;i<3;i++)body+=button(`${i+1}: ${['↑','→','↓','←'][d.turns[i]]} → ${['↑','→','↓','←'][d.target[i]]}`,'solve',i);body+=button('NỐI MẠCH','solve',3);}
            if(d.puzzle===1)body=`Hiệu chuẩn ${d.step+1}/3: bấm CHỐT khi vạch nằm vùng xanh.<div style="height:20px;background:linear-gradient(to right,#263238 32%,#287d50 32%,#287d50 68%,#263238 68%);position:relative"><i id="labGauge${p.id}" style="position:absolute;left:50%;height:20px;width:4px;background:white"></i></div>`+button('CHỐT','solve');
            if(d.puzzle===2){body=`Ma trận Hex: chọn chuỗi ${d.sequence.map((n,i)=>i<d.step?'✓':d.codes[n]).join(' → ')}<br>`;d.codes.forEach((c,i)=>{body+=button(c,'solve',i)+(i%3===2?'<br>':'');});}
            body+='<br>'+button('Rời bảng hack','cancel');
        }
        html+=`<section style="pointer-events:auto;background:#0c1928ed;border:1px solid #68bfc9;border-radius:10px;padding:12px;max-width:360px;color:#eaf6ff;font:14px Arial"><b>P${p.id} · CỬA BẢO MẬT · bước ${d.step}/3</b><p>${body}</p></section>`;
    }
    if(box._html!==html){box.innerHTML=html;box._html=html;}
    if(D)for(let d of D.doors)if(d.owner&&d.puzzle===1){let g=document.getElementById('labGauge'+d.owner);if(g)g.style.left=(d.phase*100)+'%';}
}
const labLegacyOverlay=drawLabOverlay;
drawLabOverlay=function(T){labLegacyOverlay(T);renderLabPanels();};
const labNetOriginal=labNetState,labApplyOriginal=labNetApply;
labNetState=function(x){labNetOriginal(x);if(labDungeon())x.ld=JSON.parse(JSON.stringify(story.lab.dungeon));};
labNetApply=function(x){labApplyOriginal(x);if(story.lab&&x.ld){story.lab.dungeon=x.ld;story.lab.gas=x.ld.elapsed>=180&&x.ld.filters<3?1:0;}};
const labNetData=netOnData;
netOnData=function(d,peer){if(d&&d.t==='labcmd'){if(NET.mode==='host'&&peer)labCommand(peer.pid,d.action,d.id,d.value,d.step);return;}return labNetData(d,peer);};
const labTutorialTick=tutTick;
tutTick=function(){if(labDungeon()||(typeof cartRun!=='undefined'&&cartRun)){if(tutEl)tutEl.style.display='none';return;}labTutorialTick();};
