// Shared illustration language for survivors, infected, insects and every boss.
// Rendering reads combat state; hitboxes, timers and damage remain in the simulation.
function drawSurvivorBody(p,idx,T){
    T=artMotion(T);
    const r=p.radius,down=p.isDowned,angle=Math.atan2(p.facingY,p.facingX);
    let move=Math.hypot(p.vx||0,p.vy||0)>8||(NET.mode==='guest'&&p.spd>8),step=move?Math.sin(T*11+idx)*3:Math.sin(T*2+idx)*.5;
    let reload=p.reloadT>0?Math.sin(Math.PI*(1-p.reloadT/Math.max(.01,p.reloadMax||1))):0,recoil=Math.max(0,1-(Date.now()-(p.lastFireTime||0))/100);
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(angle+(down?1.1:0));ctx.translate(-recoil*2,0);
    const cloth=down?'#657371':p.hurtFlash>0?'#ead8cb':'#a6ad97';
    artBox(-11-step,-13,15,9,'#35443d','#162c2d',3);artBox(-11+step,5,15,9,'#35443d','#162c2d',3);
    artBox(-r-2,-12,11,25,'#6f7b59','#263d35',4);artLine([[-r+1,-7],[-r+5,-3],[-r+1,7]],'#a6a386',1.5);
    ctx.fillStyle=cloth;ctx.strokeStyle=p.hurtFlash>0?'#df8a72':'#203b3e';ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(-1,0,12,15,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    artBox(-6,-10,12,22,'#4c655a','#2b443d',2);for(let y of [-6,2,9])artBox(-4,y,8,4,'#8d987a',null,1);
    for(let side of [-1,1]){
        let handX=20-(side>0?reload*12:0),handY=side*5+(side>0?reload*7:0);
        artLine([[3,side*12],[13,side*(13+step*.3)],[handX,handY]],cloth,7);
        artBox(5,side<0?-15:9,8,5,p.color,null,1);artDisc(handX+1,handY,3.5,'#d1b794','#35453e');
    }
    artDisc(6,0,8,'#cfb798','#293c3c');
    ctx.beginPath();ctx.arc(5,0,8.5,Math.PI*.45,Math.PI*1.55);ctx.strokeStyle='#52685e';ctx.lineWidth=5;ctx.stroke();
    artLine([[8,-7],[12,-4],[12,4]],p.color,3);artLine([[12,-3],[16,0],[12,3]],'#e5cdb0',2);
    artBox(-11,-4,4,9,'#c1ad7d',null,1);ctx.restore();
    if(!down){ctx.strokeStyle=p.color;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y+9,22,11,0,.15,Math.PI-.15);ctx.stroke();}
}

// Breathing, gait and attack poses read state only; reduced motion keeps the combat cues.
const artMotionMedia=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
function artMotion(T){return artMotionMedia?.matches?0:T;}
function artPoly(points,fill,edge='#1b1a17',width=2){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(edge){ctx.strokeStyle=edge;ctx.lineWidth=width;ctx.stroke();}}
function artInfected(z,T,ang){
    T=artMotion(T);const r=z.radius,type=z.type,flash=z.hitFlash>0,id=z.nid||0;
    const acid=[2,18,54].includes(type),archer=type===8,gun=type===9,electric=[16,17,28,29].includes(type),armored=[4,14,27].includes(type);
    const snow=type>=55&&type<=57;
    const skin=flash?'#f2e4d4':snow?'#b8ccc9':acid?'#92916a':electric?'#8a9694':'#9e9983';
    const coat=flash?'#d1c4b4':snow?'#6d8380':armored?'#4d5150':archer?'#4b453f':gun?'#4c5049':type===13?'#735443':type===52?'#999d90':'#514a40';
    let gait=z.stunTimer>0?0:Math.sin(T*([3,10,22,26].includes(type)?12:7)+id*1.7),breath=1+Math.sin(T*2.7+id)*.035;
    let cycle=acid?(type===2?4:1.8):archer?5:gun?3.5:type===17?2.6:3;
    let recoil=Math.max(0,1-(cycle-(z.atkCD||0))/.22);if((z.atkCD||0)>cycle)recoil=0;
    artShadow(z.x,z.y,r*1.15,r*.6);ctx.save();ctx.translate(z.x,z.y);ctx.rotate(ang+gait*.035);ctx.translate(-recoil*r*.13,0);ctx.lineCap='round';ctx.lineJoin='round';
    // Uneven boots and a torn coat replace the repeated rounded armor silhouette.
    for(let side of [-1,1]){let step=gait*r*.17*side;artPoly([[-r*.4+step,side*r*.35],[-r*.95+step,side*r*.43],[-r*1.03+step,side*r*.72],[-r*.38+step,side*r*.67]],'#35342e');}
    artPoly([[-r*.8,-r*.55],[-r*.52,-r*.91],[r*.12,-r*.78],[r*.48,-r*.37],[r*.37,r*.43],[-r*.12,r*.84],[-r*.39,r*.69],[-r*.72,r*.87],[-r*.62,r*.43],[-r*.9,r*.18]],coat);
    ctx.save();ctx.scale(breath,breath);
    artPoly([[-r*.5,-r*.45],[-r*.1,-r*.57],[r*.17,-r*.18],[-r*.01,r*.39],[-r*.47,r*.52],[-r*.3,r*.04]],'#503c33','#302c25',1);
    for(let k=0;k<4;k++)artLine([[-r*.34,-r*.29+k*r*.18],[r*.06,-r*.22+k*r*.17]],'#b4a78a',Math.max(1,r*.065));
    artLine([[-r*.49,r*.15],[-r*.22,r*.43],[-r*.04,r*.27]],'#773e36',r*.12);ctx.restore();
    for(let side of [-1,1]){let reach=(archer||gun?1:1.22)+(acid?recoil*.22:0),dy=gait*r*.1*side;
        let handX=gun?r*(side<0?1.12:.78):r*reach,handY=gun?r*(side<0?.43:.78):side*r*.53;
        artLine([[-r*.05,side*r*.64],[r*.42,side*r*.92+dy],[handX,handY]],coat,r*.25);
        artLine([[r*.4,side*r*.89+dy],[r*.73,side*r*.7]],skin,r*.14);
        artDisc(handX,handY,r*.13,skin,'#34332a');
        if(!archer&&!gun)for(let k=0;k<3;k++)artLine([[r*reach,side*r*.53+(k-1)*r*.09],[r*(reach+.25),side*r*.47+(k-1)*r*.14]],'#c6b89a',Math.max(1,r*.05));
    }
    // Gaunt skull with exposed jaw, missing teeth and one clouded eye.
    ctx.beginPath();ctx.ellipse(r*.39,0,r*.46,r*.36,.06,0,Math.PI*2);ctx.fillStyle=skin;ctx.fill();ctx.strokeStyle='#343129';ctx.lineWidth=1.8;ctx.stroke();
    artPoly([[r*.57,-r*.28],[r*.94,-r*.17],[r*1.01,r*.05],[r*.82,r*.29],[r*.55,r*.19]],'#633c33','#302a25',1);
    artLine([[r*.73,-r*.15],[r*.88,-r*.04],[r*.76,r*.12]],'#261f1c',r*.16);
    for(let k=0;k<3;k++)artLine([[r*(.72+k*.07),-r*.12],[r*(.72+k*.07),r*.02]],'#c6bfa3',Math.max(1,r*.045));
    artDisc(r*.52,-r*.2,r*.075,'#242520');artDisc(r*.53,r*.19,r*.06,electric?'#c3d1cf':'#c1b296');
    artLine([[r*.18,-r*.22],[r*.32,-r*.05],[r*.17,r*.15]],'#625e4c',2);
    if(acid){
        for(let k=0;k<3;k++){let rad=r*(.25+Math.sin(T*3+k)*.02);artDisc(-r*(.52+k%2*.26),(k-1)*r*.49,rad,k%2?'#80794d':'#9a9964','#484c35');artDisc(-r*(.57+k%2*.26),(k-1)*r*.49-r*.07,rad*.28,'#b7b385');}
        ctx.beginPath();ctx.ellipse(r*.76,r*.23,r*(.22+recoil*.12),r*.2,0,0,Math.PI*2);ctx.fillStyle='#807b4b';ctx.fill();ctx.strokeStyle='#4b4932';ctx.stroke();
        for(let k=0;k<3;k++){let fall=(T*.7+k*.31+id*.07)%1;artDisc(r*(.88+k*.13),r*(.29+fall*.5),Math.max(1,r*.05*(1-fall)), '#b0a867');}
    }
    if(archer){
        artPoly([[-r*.18,-r*.5],[r*.35,-r*.46],[r*.74,-r*.22],[r*.15,-r*.3],[r*.11,r*.25],[-r*.22,r*.51]],'#3b3731',null);
        let bowX=r*1.32,pull=r*(.85-(z.atkCD<.7?.2:0));ctx.beginPath();ctx.moveTo(bowX,-r*.95);ctx.quadraticCurveTo(r*1.85,0,bowX,r*.95);ctx.strokeStyle='#a18c66';ctx.lineWidth=3;ctx.stroke();
        artLine([[bowX,-r*.95],[pull,0],[bowX,r*.95]],'#c4baa1',1);artLine([[pull,0],[r*1.95,0]],'#928b76',2);artLine([[r*1.85,-r*.09],[r*2.02,0],[r*1.85,r*.09]],'#cac5b3',1.5);
        artLine([[-r*.79,-r*.4],[-r*.87,r*.44]],'#827452',4);
    }
    if(gun){
        artPoly([[-r*.65,-r*.71],[-r*.12,-r*.82],[r*.15,-r*.5],[-r*.43,-r*.38]],'#717767');
        ctx.save();ctx.translate(0,r*.64);
        artBox(r*.67,-r*.12,r*.52,r*.24,'#766045','#292b27',1);artLine([[r*1.13,-r*.07],[r*2.02,-r*.07]],'#474c48',r*.12);artLine([[r*1.13,r*.07],[r*2.02,r*.07]],'#2d302b',r*.08);
        if(recoil>.1)artPoly([[r*2,-r*.05],[r*2.4,-r*.22],[r*2.23,0],[r*2.38,r*.15],[r*2,r*.07]],'#dfc19a',null);
        ctx.restore();
    }
    if(type===13){artBox(-r*1.05,-r*.46,r*.43,r*.92,'#873f32','#302e27',3);artLine([[-r*.99,-r*.12],[-r*.68,-r*.12]],'#b3a67e',3);}
    if(armored){artPoly([[-r*.57,-r*.7],[-r*.06,-r*.64],[r*.17,0],[-r*.05,r*.63],[-r*.6,r*.7],[-r*.7,r*.1]],'#646a64','#303730');artLine([[-r*.39,-r*.43],[-r*.18,r*.45]],'#a3a798',2);}
    if(electric){for(let side of [-1,1]){artDisc(-r*.3,side*r*.72,r*.17,'#626d69','#303a36');artLine([[-r*.47,side*r*.7],[-r*.16,side*r*.97],[r*.14,side*r*.66]],'#a6c1bd',2);}if([17,29].includes(type)){artBox(r*.69,-r*.14,r*.53,r*.28,'#5a625d','#252e2a',2);artDisc(r*1.3,0,r*.17,'#a9c6bd','#56635b');}}
    if(type===6){artLine([[-r*.6,-r*.4],[-r*.8,-r*1.17],[r*.1,-r*1.2]],'#968566',3);artPoly([[-r*.7,-r*.9],[-r*.4,-r*1.5],[r*.2,-r*1.24],[-r*.14,-r*.76]],'#625442');}
    if([1,15,34,53].includes(type)){artDisc(-r*.32,r*.14,r*.39,type===15||type===53?'#7a7d51':'#94816a','#4d4938');artLine([[-r*.49,-r*.04],[-r*.13,r*.35]],'#683b32',3);}
    if(z.mutant)artLine([[-r*.51,-r*.74],[-r*.99,-r*1.1],[-r*.23,-r*.86]],'#c1b294',3);
    if(snow){for(let side of [-1,1])artPoly([[-r*.6,side*r*.7],[-r*.5,side*r*1.25],[-r*.15,side*r*.62]],'#a8c7c8','#576e70',1);if(type===56){artDisc(r*.83,r*.22,r*.23,'#8cafb2','#4c6c70');artLine([[r*.7,r*.18],[r*1.1,r*.3]],'#d5e4dd',2);}if(type===57)artPoly([[-r*.65,-r*.6],[-r*.21,-r*.74],[r*.1,0],[-r*.32,r*.7],[-r*.74,r*.3]],'#91adb0','#526e71',2);}
    ctx.restore();
    if(z.isFrenzied>0){ctx.strokeStyle='rgba(164,65,48,.65)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(z.x,z.y,r+4,0,Math.PI*2);ctx.stroke();}
}

function artInsect(z,T,ang){
    T=artMotion(T);
    const r=z.radius,queen=z.type===45,sideMove=Math.sin(T*12+(z.nid||0))*.2;
    let shell=z.hitFlash>0?'#f0e7d5':queen?'#716284':z.type===43?'#586d70':z.type===41?'#94a471':'#927b59';
    artShadow(z.x,z.y,r*1.4,r*.72);ctx.save();ctx.translate(z.x,z.y-(queen&&z.airborne?16+Math.sin(T*4)*3:0));ctx.rotate(ang);
    if(z.airborne||z.flying){for(let side of [-1,1]){ctx.beginPath();ctx.ellipse(-r*.3,side*r*.85,r*1.03,r*.38,side*(.5+Math.sin(T*23)*.12),0,Math.PI*2);ctx.fillStyle='rgba(181,202,186,.38)';ctx.fill();ctx.strokeStyle='#8aafa8';ctx.lineWidth=1;ctx.stroke();}}
    for(let side of [-1,1])for(let k=0;k<3;k++){
        let x=(k-1)*r*.5;artLine([[x,side*r*.3],[x-r*.35,side*r*(.87+sideMove)],[x+r*(k===0?-.65:.28),side*r*1.2]],shell,queen?7:Math.max(2,r*.15));
        artLine([[x-r*.35,side*r*.86],[x-r*.13,side*r*1.02]],'#bdbaa0',queen?2:1);
    }
    ctx.fillStyle=shell;ctx.strokeStyle='#2b3b3d';ctx.lineWidth=queen?3:1.5;
    ctx.beginPath();ctx.ellipse(-r*.65,0,r*.7,r*.61,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    for(let x of [-.87,-.6,-.31])artLine([[r*x,-r*.43],[r*(x+.13),0],[r*x,r*.43]],'#b4aa92',queen?2.5:1);
    artDisc(r*.12,0,r*.43,shell,'#293e40');artDisc(r*.7,0,r*.47,shell,'#293d3f');
    for(let side of [-1,1]){artLine([[r*.97,side*r*.18],[r*1.37,side*r*.5],[r*1.19,side*r*.18]],'#c5bc9c',queen?5:2);artDisc(r*.9,side*r*.26,queen?4:2,'#d6ba7c');}
    if(queen){
        for(let side of [-1,1])artLine([[0,side*r*.4],[-r*.24,side*r*.76],[r*.35,side*r*.42]],'#b5a281',5);
        artDisc(r*.03,0,r*.15,z.qShield?'#9bcdc8':'#d1b880');
    }
    ctx.restore();
    if(z.qShield){ctx.strokeStyle='rgba(121,178,176,.55)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(z.x,z.y,r*1.55,0,Math.PI*2);ctx.stroke();}
    if(queen&&z.phase===1&&z.airborne)drawMiniBar(z.x,z.y-r-16,86,5,z.flightArmor||0,z.flightArmorMax||1,'#a8c2c0');
}

function artBoss(z,T,ang){
    T=artMotion(T);
    if(z.type===45)return artInsect(z,T,ang);
    let r=z.radius,flash=z.hitFlash>0,metal=[31,36].includes(z.type),dead=z.type===50;
    let main=flash?'#f6e7cc':dead?'#424454':metal?'#778b85':z.type===35?'#847d9e':z.type===32?'#6b7b61':'#8d7964';
    artShadow(z.x,z.y,r*1.4,r*.85);ctx.save();ctx.translate(z.x,z.y);ctx.rotate(ang);
    let gait=Math.sin(T*5+(z.nid||0))*r*.08;
    artBox(-r*.7-gait,-r*.8,r*.78,r*.42,'#3e4d46','#1b3034',5);artBox(-r*.7+gait,r*.38,r*.78,r*.42,'#3e4d46','#1b3034',5);
    let breath=1+Math.sin(T*2+(z.nid||0))*.025;
    ctx.beginPath();ctx.ellipse(-r*.15,0,r*.75*breath,r*.91*breath,0,0,Math.PI*2);ctx.fillStyle=main;ctx.fill();ctx.strokeStyle='#263c42';ctx.lineWidth=3;ctx.stroke();
    if(dead){
        ctx.beginPath();ctx.moveTo(-r*.8,-r*.8);ctx.lineTo(-r*1.35,-r*.5);ctx.lineTo(-r*1.1,0);ctx.lineTo(-r*1.35,r*.58);ctx.lineTo(-r*.6,r*.84);ctx.closePath();ctx.fillStyle='#343b48';ctx.fill();
        artLine([[-r*.7,-r*.6],[-r*.95,0],[-r*.65,r*.65]],'#767b88',3);
    }
    for(let side of [-1,1]){
        artLine([[r*.04,side*r*.68],[r*.55,side*r*.97],[r*1.08,side*r*.56]],main,r*.39);
        artDisc(r*.1,side*r*.7,r*.27,metal?'#a1aaa0':'#a79575','#354849');
        artDisc(r*1.08,side*r*.56,r*.21,metal?'#7e958b':'#c0ad8c','#3a4b43');
    }
    artBox(-r*.43,-r*.55,r*.6,r*1.1,metal?'#4c6a6c':'#56665c','#2b4446',4);
    for(let k=0;k<3;k++)artBox(-r*.32,-r*.42+k*r*.31,r*.4,r*.16,metal?'#b5c3ad':'#9e9c7c',null,2);
    artDisc(r*.49,0,r*.41,dead?'#d7d4b9':metal?'#4a656a':'#c3b08c','#30474a');
    for(let side of [-1,1])artDisc(r*.72,side*r*.17,Math.max(3,r*.065),dead?'#343b47':'#d5c5a0');
    if(metal){
        artLine([[r*.72,-r*.3],[r*.87,0],[r*.72,r*.3]],'#a0cdca',5);
        for(let side of [-1,1])for(let k=0;k<3;k++)artDisc(-r*.33+k*r*.27,side*r*.78,4,'#b3d4cc','#476465');
    }
    if(z.type===36){
        artDisc(-r*.1,0,r*.22,z.downed?'#d49b7e':'#c7ddc4','#425e5a');
        artLine([[-r*.4,r*1.1],[r*1.8,r*1.1]],'#a2b6ac',5);
        artLine([[r*1.65,r*.93],[r*2.1,r*1.1],[r*1.65,r*1.27]],'#bedfd6',4);
    }
    if(z.type===30){artLine([[r*.7,-r*.7],[r*1.02,-r*1.15],[r*1.53,-r*.82]],'#d2c4a1',10);artDisc(-r*.75,0,r*.36,'#a89c79','#4c5c4d');}
    if(z.type===32){artBox(r*.87,-r*.16,r*1.3,r*.27,'#354d50');artBox(r*1.25,-r*.22,r*.43,r*.2,'#957c50');artLine([[-r*.4,-r*.92],[r*.35,-r*.81]],'#c2a26a',5);}
    if(z.type===35){for(let side of [-1,1])artLine([[r*.93,side*r*.6],[r*1.8,side*r*.9],[r*1.3,side*r*.3]],'#bad5ce',6);}
    if(z.type===37){artLine([[r*.7,r*.58],[r*1.25,r*1.1],[r*1.7,r*.88]],'#9da79c',5);ctx.beginPath();ctx.arc(r*1.7,r*.56,r*.32,0,Math.PI*1.6);ctx.strokeStyle='#d3c9aa';ctx.lineWidth=7;ctx.stroke();}
    if(dead&&!hazards.some(h=>h.type==='d_scythe')){artLine([[r*.5,r*.52],[r*1.7,-r*.9]],'#9b8c69',5);ctx.beginPath();ctx.moveTo(r*1.6,-r*.8);ctx.quadraticCurveTo(r*1.25,-r*1.6,r*.3,-r*.8);ctx.quadraticCurveTo(r*.85,-r*1.02,r*1.6,-r*.8);ctx.fillStyle='#c9d0c3';ctx.fill();}
    ctx.restore();
    if(z.type===36){
        let shield=story.zx&&(story.zx.jam<=0||story.zx.final>0);
        if(shield){ctx.beginPath();ctx.arc(z.x,z.y,r+52,0,Math.PI*2);ctx.fillStyle='rgba(130,184,183,.1)';ctx.fill();ctx.strokeStyle='#9acac7';ctx.lineWidth=3;ctx.stroke();artPlate('SÓNG BẢO VỆ · BẤT TỬ',z.x,z.y+r+34,'#b6d5cc');}
        let armor=NET.mode==='guest'?(story.za||0)/100:Math.max(0,(z.armor||0)/(z.maxArmor||1));
        if(!z.downed)drawMiniBar(z.x,z.y-r-22,80,6,armor,1,'#9cc8c7');
        else artPlate('GIÁP VỠ!',z.x,z.y+r+16,'#dbbf8c');
    }
    if(z.phase2Done||z.mineDark){ctx.strokeStyle='rgba(205,150,102,.45)';ctx.lineWidth=2;ctx.setLineDash([9,11]);ctx.beginPath();ctx.arc(z.x,z.y,r*1.25,T*.4,T*.4+Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
    if(dead){ctx.strokeStyle='rgba(181,95,96,.3)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(z.x,z.y,150,0,Math.PI*2);ctx.stroke();if(z.downed)for(let o of zombies)if(o.type===51)artLine([[z.x,z.y],[o.x,o.y]],'rgba(187,105,112,.6)',2);}
}

function artLance(z,T){
    T=artMotion(T);
    let armored=(z.big||z.radius>20)&&!(story.zx&&story.zx.spear>0),color=z.hitFlash>0?'#f4e9d1':'#9fbfca';
    ctx.save();ctx.translate(z.x,z.y);ctx.setLineDash([5,12]);ctx.strokeStyle='rgba(157,181,204,.23)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,300,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    artShadow(0,0,22,12);artDisc(0,2,20,'#3a525c','#7d9698');artLine([[0,3],[6,-53]],'#83999b',6);
    ctx.beginPath();ctx.moveTo(6,-79);ctx.lineTo(17,-50);ctx.lineTo(6,-56);ctx.lineTo(-5,-50);ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.strokeStyle='#436371';ctx.lineWidth=2;ctx.stroke();
    for(let y=-44;y<0;y+=12)artLine([[1,y],[10,y+2]],'#c4c9b4',2);
    artLine([[6,-69],[-4+Math.sin(T*20)*4,-43],[10,-27],[-1,-2]],'#cbe1df',2);
    if(z.big||z.radius>20){ctx.beginPath();ctx.arc(0,-20,46,0,Math.PI*2);ctx.strokeStyle=armored?'#9abcc9':'#d7b789';ctx.lineWidth=3;ctx.stroke();artPlate(armored?'THƯƠNG ĐIỆN · BỌC GIÁP':'GIÁP VỠ!',0,31,armored?'#b5d1d5':'#e1c48c');}
    else{let A=story.arena||{x:MAP_SIZE.w/2,y:MAP_SIZE.h/2};artPlate('THƯƠNG ['+(z.posName||compassDirName(z.x-A.x,z.y-A.y))+']',0,-94,'#b4c4d7');}
    ctx.restore();
}

function artTentacle(z,T){
    T=artMotion(T);
    let r=z.radius;ctx.save();ctx.translate(z.x,z.y);artShadow(0,r*.5,r*1.3,r*.6);
    for(let k=0;k<8;k++){let f=k/7,sway=Math.sin(T*2.4+f*3+(z.nid||0))*16*f;
        artDisc(sway,r*.4-f*r*2.4,r*(1-f*.62),z.hitFlash>0?'#f1ead7':k%2?'#86966a':'#5c775d','#344e45');
        artLine([[sway-r*(.6-f*.3),r*.4-f*r*2.4],[sway,r*.4-f*r*2.4+6]],'#b6bb8b',2);
    }
    let tip=Math.sin(T*2.4+3+(z.nid||0))*16;artDisc(tip,-r*2,r*.2,'#bcd5a6','#486958');
    let pos=z.posName||compassDirName(z.x-MAP_SIZE.w/2,z.y-MAP_SIZE.h/2);artPlate('XÚC TU ['+pos+']',0,-r*2.7,'#b0d2bf');
    if(z.beamT!==undefined)artPlate('QUÉT SAU '+Math.max(0,Math.ceil(z.beamT))+'s',0,r+20,z.beamT<6?'#e3a38d':'#d6ddc6');ctx.restore();
}

drawZombieBody=function(z,T,ang,rage,boss,inBush){
    ctx.save();if(inBush)ctx.globalAlpha*=.72;
    if(isBandit(z))drawBanditDetailed(z,T,ang);
    else if(z.type===38)artLance(z,T);
    else if(z.type===46)artTentacle(z,T);
    else if(isBossType(z.type)&&z.type!==46)artBoss(z,T,ang);
    else if(z.type>=40&&z.type<=45)artInsect(z,T,ang);
    else artInfected(z,T,ang);
    ctx.restore();
};

function drawAllyBody(a,T){
    let angle=Math.atan2(a.facingY||0,a.facingX||1);artShadow(a.x,a.y,18,10);ctx.save();ctx.translate(a.x,a.y);ctx.rotate(angle);
    let breath=Math.sin(artMotion(T)*3+(a.nid||0))*.5;
    artBox(-10,-11-breath,21,23+breath*2,a.kind==='medic'?'#a9b0a0':'#657264','#262e28',4);
    artBox(-7,-7,10,15,'#3f4c40','#222d25',2);artDisc(6,0,7,'#b6a68b','#3c4034');artLine([[3,-6],[8,-6],[11,-3]],'#52644d',4);
    if(a.kind==='medic')artCross(-3,0,4,'#914d43');if(a.elite)artLine([[-9,-11],[5,-11]],'#bda77c',2);ctx.restore();
}
drawHucker=function(z,T,ang,flash){artBoss({...z,type:37,hitFlash:flash?.1:0},T,ang);};
