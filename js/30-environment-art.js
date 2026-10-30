// Stable world detail is derived from coordinates, never from gameplay randomness.
function terrainHash(x,y){let n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);}
function drawBiomeTerrain(x0,x1,y0,y1,T){
    const urban=[1,8,13].includes(currentMapType),forest=[2,3,7,9,11,12].includes(currentMapType),cave=isCaveMap();
    ctx.save();ctx.lineWidth=1;
    let spacing=typeof presentationLow==='function'&&presentationLow()?260:180;
    for(let x=Math.max(0,Math.floor(x0/spacing)*spacing);x<x1&&x<4000;x+=spacing)for(let y=Math.max(0,Math.floor(y0/spacing)*spacing);y<y1&&y<4000;y+=spacing){
        let h=terrainHash(x,y),px=x+23+h*124,py=y+terrainHash(y,x)*160;
        if(forest){ctx.fillStyle=currentMapType===9?'rgba(92,98,80,.13)':'rgba(96,125,78,.12)';ctx.beginPath();ctx.ellipse(px,py,54+h*60,24+h*20,h*3,0,Math.PI*2);ctx.fill();
            for(let k=0;k<4;k++)artLine([[px+k*9,py+6],[px+k*9+3,py-2-k%3*4]],'#42594c',1.3);
        }else if(urban){ctx.strokeStyle='rgba(137,155,155,.1)';ctx.strokeRect(x+1,y+1,178,178);artLine([[px,py],[px+18,py+8],[px+35,py-2]],'rgba(24,43,46,.4)',1.5);}
        else if(currentMapType===6||currentMapType===15){artBox(x+6,y+6,166,166,'rgba(115,141,146,.045)','rgba(122,153,152,.1)',2);}
        else{ctx.fillStyle=cave?'rgba(153,131,94,.13)':'rgba(132,145,111,.08)';ctx.beginPath();ctx.ellipse(px,py,34+h*37,15+h*9,h,0,Math.PI*2);ctx.fill();}
        for(let k=0;k<3;k++){let q=terrainHash(x+k*21,y+k*67);ctx.fillStyle=cave?'#4d5047':forest?'#627453':'#5b6d6b';ctx.globalAlpha=.22;ctx.fillRect(px+k*12,py+k*7,2+q*3,2);}
        ctx.globalAlpha=1;
    }
    if(urban){
        for(let vertical of [true,false]){
            let rx=vertical?1880:Math.max(0,x0),ry=vertical?Math.max(0,y0):1880,rw=vertical?240:Math.min(4000,x1)-rx,rh=vertical?Math.min(4000,y1)-ry:240;
            ctx.fillStyle='rgba(17,30,38,.17)';ctx.fillRect(rx,ry,rw,rh);
            ctx.strokeStyle='rgba(194,175,125,.2)';ctx.lineWidth=3;ctx.setLineDash([38,36]);ctx.beginPath();if(vertical){ctx.moveTo(2000,Math.max(0,y0));ctx.lineTo(2000,Math.min(4000,y1));}else{ctx.moveTo(Math.max(0,x0),2000);ctx.lineTo(Math.min(4000,x1),2000);}ctx.stroke();ctx.setLineDash([]);
        }
    }
    ctx.restore();
}

function drawWorldObstacle(o,T){
    if(o.type==='rubble')return false;
    const x=o.x,y=o.y,w=o.w,h=o.h;
    ctx.save();
    if(o.type==='tree'){
        let cx=x+w/2,cy=y+h/2,r=w/2,n=terrainHash(x,y),night=[7,9].includes(currentMapType);
        artShadow(cx,cy,r*1.15,r*.83);artBox(cx-7,cy-5,14,r+12,'#6b6246','#344c3e',3);
        for(let k=0;k<(presentationLow()?4:7);k++){let a=k*.9+n*6,rr=r*(.2+.25*(k%2));artDisc(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr,r*(.48+.07*(k%3)),night?['#365a53','#42685b','#527967'][k%3]:['#466b50','#577b56','#6a8d60'][k%3],'#2f5147');}
        artLine([[cx-r*.4,cy-r*.2],[cx,cy-r*.45],[cx+r*.28,cy-r*.25]],'rgba(182,190,139,.28)',2);ctx.restore();return true;
    }
    if(o.poly){
        let p=o.poly;if(!p.length){ctx.restore();return false;}
        ctx.beginPath();p.forEach((v,i)=>i?ctx.lineTo(v.x+7,v.y+10):ctx.moveTo(v.x+7,v.y+10));ctx.closePath();ctx.fillStyle='rgba(7,19,25,.4)';ctx.fill();
        ctx.beginPath();p.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();ctx.fillStyle=o.type==='cave'?'#4c5a59':'#7c8982';ctx.fill();ctx.strokeStyle='#293e43';ctx.lineWidth=2;ctx.stroke();
        if(w<350&&h<350){artLine([[x+w*.17,y+h*.3],[x+w*.42,y+h*.12],[x+w*.69,y+h*.33]],'#7d8a7b',2);artLine([[x+w*.45,y+h*.15],[x+w*.51,y+h*.6],[x+w*.76,y+h*.79]],'#354b4e',2);}
        ctx.restore();return true;
    }
    const building=o.type==='building'||o.type==='ruin',wall=['wall','cave','rockwall','power','plant_wall'].includes(o.type);
    if(!building&&!wall){ctx.restore();return false;}
    ctx.fillStyle='rgba(7,21,28,.32)';ctx.fillRect(x+8,y+11,w,h);
    let col=building?(o.type==='ruin'?'#667570':'#5c7379'):o.type==='plant_wall'?'#47674c':o.type==='power'?'#5e7d82':o.type==='rockwall'?'#35494c':'#6b7e7b';
    ctx.fillStyle=col;ctx.fillRect(x,y,w,h);ctx.fillStyle='rgba(180,197,176,.2)';ctx.fillRect(x,y,w,Math.min(6,h));ctx.fillStyle='rgba(16,38,44,.35)';ctx.fillRect(x,y+h-Math.min(7,h),w,Math.min(7,h));
    ctx.strokeStyle='#304b50';ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,w-1,h-1);
    if(building&&w>65&&h>65){
        let pad=12;artBox(x+pad,y+pad,w-pad*2,h-pad*2,o.type==='ruin'?'#526560':'#718480','#425d5c',2);
        ctx.strokeStyle='rgba(40,65,69,.35)';ctx.lineWidth=2;
        for(let py=y+30;py<y+h-15;py+=37){ctx.beginPath();ctx.moveTo(x+15,py);ctx.lineTo(x+w-15,py);ctx.stroke();}
        let vw=Math.min(42,w*.3),vh=Math.min(38,h*.23);artBox(x+w*.2,y+h*.24,vw,vh,'#3c555b','#97a59a',2);
        for(let k=0;k<3;k++)artLine([[x+w*.2+6,y+h*.24+7+k*8],[x+w*.2+vw-5,y+h*.24+7+k*8]],'#718f8b',2);
        if(w>140)artBox(x+w*.64,y+h*.54,Math.min(40,w*.2),Math.min(48,h*.3),'#9d9e80','#526c64',3);
        if(o.type==='ruin')artLine([[x+w*.7,y+3],[x+w*.52,y+h*.31],[x+w*.65,y+h*.5],[x+w*.42,y+h-3]],'#314b50',4);
    }else if(o.type==='power'&&w>26&&h>26){
        for(let k=0;k<3;k++)artDisc(x+w*.5,y+h*(k+1)/4,Math.min(4,w*.15),'#b6c8ad','#3b5d60');
    }else if(o.type==='wall'&&Math.min(w,h)>=20&&Math.max(w,h)<500){
        ctx.strokeStyle='rgba(40,64,66,.3)';ctx.lineWidth=1;
        if(w>h)for(let sx=x+30;sx<x+w;sx+=42){ctx.beginPath();ctx.moveTo(sx,y+2);ctx.lineTo(sx,y+h-2);ctx.stroke();}
        else for(let sy=y+30;sy<y+h;sy+=42){ctx.beginPath();ctx.moveTo(x+2,sy);ctx.lineTo(x+w-2,sy);ctx.stroke();}
    }
    ctx.restore();return true;
}

drawBaseHouse=function(n){
    let x=n.x,y=n.y,lv=NET.mode==='guest'?(base.house||0):base.house,hurt=n.hurt>0;
    ctx.save();ctx.translate(x,y);artShadow(0,0,125,84);
    artBox(-104,-70,208,145,hurt?'#a87e61':'#64735c','#2d4845',5);artBox(-98,-64,196,131,'#8f9273','#3e5850',2);
    ctx.beginPath();ctx.moveTo(-110,-68);ctx.lineTo(0,-89);ctx.lineTo(110,-68);ctx.lineTo(110,5);ctx.lineTo(0,-12);ctx.lineTo(-110,5);ctx.closePath();ctx.fillStyle=lv>=3?'#5b7571':'#766b51';ctx.fill();ctx.strokeStyle='#354c49';ctx.lineWidth=3;ctx.stroke();
    artLine([[-108,4],[0,-12],[108,4]],'#a5a68b',4);for(let k=-90;k<=90;k+=24)artLine([[k,-70],[k,-7]],'rgba(193,186,143,.25)',2);
    artBox(-22,28,44,45,'#344d49','#b2b092',3);artBox(-15,35,30,37,'#4a6355',null,2);artDisc(9,58,2,'#d8c28c');
    for(let side of [-1,1]){artBox(side*64-19,25,38,26,'#385b60','#c2bb97',3);artLine([[side*64,27],[side*64,49]],'#88a59b',2);}
    if(lv>=2){artBox(-83,-63,49,36,'#294e5b','#819d94',2);for(let k=0;k<3;k++)artLine([[-79+k*15,-59],[-79+k*15,-31]],'#527a85',1);}
    if(lv>=3){artBox(45,-65,17,44,'#526963');artBox(41,-68,25,8,'#8c9e8b');}
    if(lv>=4){artLine([[88,-37],[100,-109]],'#a1b1a0',3);artDisc(100,-111,4,'#b2cd9c');}
    artPlate('NHÀ CHÍNH · CẤP '+lv,0,-111,'#e1cc9b');ctx.restore();
    if(objState==='BASE_DEF'){
        drawMiniBar(x,y+89,170,8,n.hp,n.maxHp,n.hp<n.maxHp*.35?'#ca8272':'#93bca0');
        let cooldown=NET.mode==='guest'?(story.bnh??5):(n.noHitT??5);
        if(n.hp<n.maxHp)artPlate(cooldown<5?'HỒI SAU '+Math.ceil(5-cooldown)+'s':'ĐANG SỬA CHỮA',x,y+111,'#c2c6a5');
    }
};
const environmentGate=drawBaseGateBarrier;
drawBaseGateBarrier=function(R,lv,hp,maxHp,hurt,T){
    if(hp<=0)return environmentGate(R,lv,hp,maxHp,hurt,T);
    let vert=R.h>R.w,len=Math.max(R.w,R.h),thick=Math.min(R.w,R.h);
    ctx.save();ctx.translate(R.cx,R.cy);if(vert)ctx.rotate(Math.PI/2);
    artBox(-len/2-8,-thick/2-8,len+16,thick+16,'#304846','#233e41',4);
    for(let x=-len/2;x<len/2;x+=20){artBox(x,-thick/2,17,thick,hurt?'#c38b78':lv===1?'#9f865d':'#81918a','#425c5c',2);if(lv>=2)for(let side of [-1,1])artDisc(x+8,side*(thick/2-5),2,'#c1c7ad');}
    for(let side of [-1,1])artBox(side*(len/2+2)-7,-thick/2-13,14,thick+26,'#607c75','#2c4b4e',2);
    if(lv>=3)for(let x=-len/2+9;x<len/2;x+=24)artLine([[x,-thick/2],[x+7,-thick/2-11],[x+11,-thick/2]],'#b5bca6',2);
    if(lv>=5){artLine([[-len/2,-4],[len/2,-4]],'#9cd7d1',3);artLine([[-len/2,5],[len/2,5]],'rgba(137,205,196,.4)',2);}
    ctx.restore();drawMiniBar(R.cx,R.cy+(vert?len/2:thick/2)+18,vert?74:len,5,hp,maxHp,'#9fbd9b');
};

const environmentLabFloor=drawLabFloor;
drawLabFloor=function(T){environmentLabFloor(T);let D=labDungeon();if(!D)return;
    ctx.save();ctx.strokeStyle='rgba(133,179,179,.08)';ctx.lineWidth=1;
    for(let r of D.rooms){if(Math.abs(r.cx-cam.x)>W/cam.zoom||Math.abs(r.cy-cam.y)>H/cam.zoom)continue;for(let x=r.x+50;x<r.x+r.w;x+=100)artLine([[x,r.y+12],[x,r.y+r.h-12]],'rgba(133,179,179,.08)',1);for(let y=r.y+50;y<r.y+r.h;y+=100)artLine([[r.x+12,y],[r.x+r.w-12,y]],'rgba(133,179,179,.08)',1);}
    ctx.restore();
};

function drawMissionObjectiveArt(T,vis){
    for(let t of towers){if(!vis(t.x,t.y,80))continue;ctx.save();ctx.translate(t.x,t.y);
        artBox(-27,-27,54,54,'#4f6e6c','#29454d',5);artBox(-20,-18,40,36,'#314e58');artLine([[0,-13],[0,-67]],'#b0bc9d',4);artLine([[-21,-49],[21,-49]],'#8ea99f',3);artDisc(0,-70,5,t.active?'#9dd4b4':'#d2a574');
        for(let x of [-16,8])artBox(x,5,9,6,t.active?'#94b89a':'#8f795e',null,1);ctx.restore();
    }
}
const environmentProps=drawStoryProps;
drawStoryProps=function(T,vis){environmentProps(T,vis);for(let p of story.props){if(!vis(p.x,p.y,90))continue;
    if(p.kind==='machine'||p.kind==='zgen'){
        ctx.save();ctx.translate(p.x,p.y);artBox(-35,-28,70,61,'#65837c','#2b4c50',5);artBox(-27,-20,32,42,'#314e54');
        for(let y=-12;y<20;y+=8)artLine([[-22,y],[0,y]],'#839f94',3);artBox(13,-17,16,24,'#263e49');artDisc(21,-8,3,p.on?'#a6d4a2':'#cdb078');artBox(-28,-35,13,9,'#97ad9c');ctx.restore();
    }else if(p.kind==='print'){ctx.save();ctx.translate(p.x,p.y);artBox(-17,-11,34,25,'#a39265','#405b52',2);artBox(-11,-16,24,28,'#ded8b7','#7c8f7b',2);for(let y=-9;y<9;y+=6)artLine([[-6,y],[9,y]],'#7b9288',1);ctx.restore();}
}};

const environmentCaveProps=drawCaveProps;
drawCaveProps=function(T,vis){environmentCaveProps(T,vis);for(let p of caveProps){if(!vis(p.x,p.y,90))continue;ctx.save();ctx.translate(p.x,p.y);
    if(p.kind==='tnt'){artBox(-15,-18,30,36,'#a87250','#3b4d43',3);for(let x of [-10,0,10])artLine([[x,-12],[x,12]],'#cf9c68',5);artBox(-17,-6,34,5,'#6b7760',null,1);artBox(-17,7,34,5,'#6b7760',null,1);}
    else if(p.kind==='cart'||p.kind==='tntcart'){artBox(-24,-20,48,40,'#7c9189','#29474a',4);artBox(-17,-14,34,28,'#425d5a');for(let x of [-24,17])for(let y of [-18,12])artBox(x,y,8,10,'#213b41');if(p.kind==='tntcart')artCrate(-12,-11,24,'#b38758');else{artDisc(-7,-2,9,'#9aa28a','#42574b');artDisc(7,5,7,'#7e9284','#42574b');}}
    else if(p.kind==='nest'){for(let i=0;i<5;i++){let a=i*1.256;artLine([[0,0],[Math.cos(a)*p.r*.8,Math.sin(a)*p.r*.6]],'#9b9765',3);}artDisc(0,0,10,p.awake?'#b1ca83':'#31473d');}
    ctx.restore();}};

function drawEscapeCart(c,p,x,y){
    ctx.save();ctx.translate(x,y);artShadow(0,0,41,24);for(let side of [-1,1])artBox(side*32-5,-7,10,34,'#26393d','#182d31',3);
    artBox(-33,-25,66,49,c.hit>0?'#b88c74':'#7e9286','#2c4b4f',5);artBox(-27,-20,54,34,'#3e5855');artLine([[-31,-20],[31,-20]],'#c4c7a6',3);
    artBox(-20,-5,15,22,'#a38c62','#3e5147');artDisc(10,-8,9,p.color,'#c1d4bd');artBox(3,-5,15,12,'#577b6c');for(let side of [-1,1])artDisc(side*26,21,4,'#d4ca8b');ctx.restore();
}
function drawCartHazard(h,x,y){
    ctx.save();ctx.translate(x,y);let col=h.type==='collapse'?'#b5a577':h.type==='rubble'?'#9b8e78':'#8aada9';
    for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-29+i*20,18);ctx.lineTo(-25+i*20,-12-(i%2)*12);ctx.lineTo(-7+i*20,-17);ctx.lineTo(3+i*20,18);ctx.closePath();ctx.fillStyle=col;ctx.fill();ctx.strokeStyle='#314b4e';ctx.lineWidth=2;ctx.stroke();}
    artLine([[-32,26],[32,26]],h.type==='collapse'?'#d9c384':'#a4b8aa',4);artPlate(h.type==='collapse'?'SẬP HẦM':h.type==='rubble'?'ĐÁ CHẶN':'VẬT RƠI',0,39,col);ctx.restore();
}

function artCivilian(n,color,label){artShadow(n.x,n.y,23,13);ctx.save();ctx.translate(n.x,n.y);artBox(-15,-12,29,25,color,'#314b49',5);artLine([[-10,-8],[-20,-5]],'#a8b9a0',5);artLine([[8,10],[16,7]],'#c3b99b',5);artDisc(8,-2,8,'#d7bf9d','#3c514a');if(label)artCross(-5,0,5,'#a86554');ctx.restore();}
function drawResidentBody(x,y,k){
    ctx.save();ctx.translate(x,y);artShadow(0,2,11,6);artBox(-7,-2,14,13,['#b7a37b','#9f7e65','#839f96','#93879e','#809973'][k%5],'#3c554b',3);
    artLine([[-5,10],[-5,14]],'#344f48',3);artLine([[4,10],[4,14]],'#344f48',3);artDisc(0,-5,5,'#d9bf9a','#4d5b49');artLine([[-5,-7],[4,-7]],'#697f66',3);ctx.restore();
}
function drawWatchtowerBody(x,y){
    ctx.save();ctx.translate(x,y);artShadow(0,3,26,18);artBox(-22,-21,44,42,'#6b7c68','#344d43',3);artBox(-18,-17,36,32,'#8d9a7a','#4b6651',2);
    for(let side of [-1,1])artLine([[side*20,-17],[side*20,17]],'#c0bb96',3);artDisc(0,-3,12,'#3b5756','#a1b399');artBox(-3,-28,6,25,'#3b5756','#89a195',1);artBox(-5,-31,10,6,'#7e9b8a');ctx.restore();
}
const environmentRescue=RescueNPC.prototype.draw;
RescueNPC.prototype.draw=function(...args){environmentRescue.apply(this,args);if(this.hp>0)artCivilian(this,this.kind==='scientist'?'#c6d1bb':'#a8af91',this.kind==='scientist');};
const environmentDoctor=Doctor.prototype.draw;
Doctor.prototype.draw=function(...args){environmentDoctor.apply(this,args);if(this.hp>0)artCivilian(this,'#d2d8bd',true);};
const environmentStoryNpc=StoryNPC.prototype.draw;
StoryNPC.prototype.draw=function(...args){environmentStoryNpc.apply(this,args);if(this.hp<=0||this.kind==='house')return;
    artCivilian(this,this.kind==='aegis'?'#cfd7bd':'#7a8d68',false);ctx.save();ctx.translate(this.x,this.y);
    if(this.kind==='aegis'){artLine([[9,-9],[15,-7]],'#e0e1cc',5);artBox(12,-6,3,9,'#3f5552',null,1);}
    else{artBox(-8,-7,11,14,'#b09b68','#3b5246',2);artDisc(9,-3,7,'#657f69','#2b4944');}ctx.restore();
};

const environmentColony=drawColonyBuildings;
drawColonyBuildings=function(T){environmentColony(T);
    for(let [i,[x,y]] of HOME_SPOTS.entries())if(i<(base.homes||1)){
        ctx.save();ctx.translate(x,y);artBox(-36,-23,72,49,'#8e9271','#314d44',3);
        ctx.beginPath();ctx.moveTo(-40,-23);ctx.lineTo(0,-38);ctx.lineTo(40,-23);ctx.lineTo(0,-8);ctx.closePath();ctx.fillStyle='#6c7c64';ctx.fill();artLine([[-38,-23],[0,-9],[38,-23]],'#b0b28d',2);
        artBox(-7,7,14,19,'#344f45');for(let dx of [-22,18])artBox(dx-5,0,11,9,'#c5ba85','#5f795e',2);ctx.restore();
    }
    for(let [i,[x,y]] of FARM_SPOTS.entries())if(i<(base.farms||1)){
        ctx.save();ctx.translate(x,y);artBox(-37,-27,74,54,'#6b6247','#3b5542',3);
        for(let row=0;row<4;row++){artLine([[-31,-19+row*12],[31,-19+row*12]],'#3f4e35',5);for(let k=0;k<5;k++){let px=-25+k*12,py=-20+row*12;artLine([[px,py+4],[px-3,py-3],[px+2,py],[px+5,py-3]],'#91ab6c',2);}}
        ctx.restore();
    }
};

drawTankEntity=function(T){
    ctx.save();ctx.translate(tank.x,tank.y);artShadow(0,0,61,38);ctx.rotate(tank.hullAngle);
    let moving=getJoystickState(tank.crew?.[0]||1)?.active,scroll=moving?(T*50)%12:0;
    for(let side of [-1,1]){artBox(-45,side*28-8,90,16,'#283c40','#172d34',5);for(let x=-40+scroll;x<43;x+=12)artBox(x,side*28-6,5,12,'#697c73',null,1);}
    artBox(-43,-24,86,48,'#768a70','#2c4a46',6);artBox(-35,-17,70,34,'#536e5d','#9cac8b',4);
    for(let x of [-25,-15,-5])artLine([[x,-13],[x,13]],'#304e46',3);
    for(let side of [-1,1]){artDisc(34,side*19,3,'#d4c797');artLine([[11,side*21],[27,side*21]],thietXaUnlocked?'#b88f6b':'#b1b69b',4);}
    ctx.rotate(-tank.hullAngle+tank.turretAngle);artBox(4,-5,64,10,'#35514e','#203c41',2);artBox(54,-7,15,14,'#839b86','#304d4a',2);
    artDisc(0,0,20,'#94a085','#334f47');artBox(-12,-13,25,26,'#6c846b','#3c584b',4);artDisc(-3,-2,6,'#36564e','#adc09b');ctx.restore();
    if(tank.p2InvulnTimer>0||tank.dashTimer>0){ctx.strokeStyle=tank.dashTimer>0?'#d6bf89':'#98c7c3';ctx.lineWidth=3;ctx.beginPath();ctx.arc(tank.x,tank.y,54,0,Math.PI*2);ctx.stroke();}
    artPlate(thietXaUnlocked?'THIẾT XA':'XE TĂNG',tank.x,tank.y-71,'#d5c290');drawMiniBar(tank.x,tank.y-54,92,7,tank.hp,tank.maxHp,'#adc095');
    if(tank.crew?.length&&!isSinglePlayer)artPlate(tank.crew.length>1?`P${tank.crew[0]} LÁI · P${tank.crew[1]} PHÁO`:`P${tank.crew[0]} LÁI`,tank.x,tank.y+58,'#aac4b8');
    if(tankExitTimer>.35)drawMiniBar(tank.x,tank.y-89,70,4,tankExitTimer,1,'#bdd2ad');
    let info=[];
    if(hasTeamPerk('t_canQuet'))info.push('[B] HÚC '+(tank.dashCooldown>0?tank.dashCooldown.toFixed(1)+'s':'SẴN SÀNG'));
    if(thietXaUnlocked)info.push('[C] '+(tank.cSkillCD>0?tank.cSkillCD.toFixed(1)+'s':'SẴN SÀNG'));
    if(info.length)artPlate(info.join(' · '),tank.x,tank.y+81,'#d8bf88');
};

const environmentRail=drawRail;
drawRail=function(T,...bounds){environmentRail(T,...bounds);if(!story.rail)return;let carH=(ROOF.y1-ROOF.y0-40)/3;
    for(let k=0;k<3;k++){
        let y=ROOF.y0+k*(carH+20);ctx.save();ctx.globalAlpha=.8;
        for(let side of [ROOF.x0,ROOF.x1])artLine([[side,y+8],[side,y+carH-8]],'#9cae99',3);
        artBox(ROOF.x0+16,y+50,48,35,'#6a837b','#314d50',3);for(let i=0;i<4;i++)artLine([[ROOF.x0+22,y+56+i*7],[ROOF.x0+57,y+56+i*7]],'#334f52',3);
        for(let x of [ROOF.x0+9,ROOF.x1-9])for(let yy=y+16;yy<y+carH;yy+=70)artDisc(x,yy,2,'#bbc7a8');ctx.restore();
    }
};

drawHub=function(T){
    ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';
    artBox(1336,1486,1328,1028,'#344a3e',null,4);
    ctx.fillStyle='#67745255';ctx.fillRect(1550,1835,900,96);ctx.fillRect(1950,1835,100,610);
    for(let x=1565;x<2440;x+=65)artLine([[x,1840],[x,1925]],'#9ba4821a',1);
    for(let y=1945;y<2430;y+=65)artLine([[1955,y],[2045,y]],'#9ba4821a',1);
    drawBase(T);
    if(objState==='HUB'){
        for(let [point,label,kind,color]of [[HUB.shop,'QUẦY TIẾP TẾ','supply','#91b9ac'],[HUB.board,'BÀN CHIẾN DỊCH','map','#d7bb85'],[BASE.shopBase,'XƯỞNG CĂN CỨ','forge','#bfaa7c']]){
            let near=labLiving().some(p=>Math.hypot(p.x-point.x,p.y-point.y)<HUB.r+50);
            ctx.save();ctx.translate(point.x,point.y);ctx.strokeStyle=near?color:'#6b8a6c88';ctx.lineWidth=2;ctx.setLineDash([9,14]);ctx.beginPath();ctx.arc(0,0,HUB.r,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
            artShadow(0,0,76,37);artBox(-62,-31,124,67,'#697c67','#2a4743',4);artBox(-66,-46,132,21,'#8f9b79','#3e5b4a',3);
            for(let x=-55;x<60;x+=23)artLine([[x,-42],[x,-28]],color,3);
            artBox(-50,-20,100,39,'#405d52','#2b4947',2);
            if(kind==='supply'){for(let k=0;k<3;k++)artCrate(-38+k*27,-10,23,'#aa9364');}
            else if(kind==='map'){artBox(-37,-15,74,36,'#b7b891','#627e62',2);artLine([[-29,8],[-15,-7],[4,6],[28,-7]],'#5b8373',3);for(let x of [-16,27])artDisc(x,-6,3,'#996c4a');}
            else{artBox(-32,-12,64,30,'#7f8f78','#273f3d',4);artLine([[-20,0],[20,0]],'#bac3a0',7);artBox(-20,-13,10,31,'#425d55');}
            artPlate(label,0,-70,color);ctx.font='10px Segoe UI, Arial';ctx.fillStyle=near?'#d9d8b7':'#a3b69d';ctx.fillText(near?'ĐỨNG TRONG VÒNG ĐỂ MỞ':'ĐI VÀO VÒNG ĐỂ MỞ',0,HUB.r+18);ctx.restore();
        }
        let f=HUB.fire;ctx.fillStyle='rgba(204,170,103,.07)';ctx.beginPath();ctx.arc(f.x,f.y,170,0,Math.PI*2);ctx.fill();
        for(let k=0;k<8;k++){let a=k*Math.PI/4;artDisc(f.x+Math.cos(a)*23,f.y+Math.sin(a)*15,6,'#87977f','#415e4a');}
        artLine([[f.x-16,f.y+6],[f.x+15,f.y-4]],'#715b40',7);artLine([[f.x-13,f.y-4],[f.x+12,f.y+8]],'#715b40',7);
        for(let k=0;k<3;k++){let h=25+Math.sin(T*9+k*2)*6;ctx.beginPath();ctx.moveTo(f.x-10+k*5,f.y);ctx.quadraticCurveTo(f.x-12,f.y-h*.5,f.x+(k-1)*4,f.y-h);ctx.quadraticCurveTo(f.x+12,f.y-h*.5,f.x+10-k*4,f.y);ctx.fillStyle=k?'#e3c78b':'#c18d5d';ctx.fill();}
        artPlate('LỬA TRẠI / HỒI MÁU',f.x,f.y+40,'#cdb887');
    }
    ctx.restore();
};
