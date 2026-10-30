// Canvas-native art: silhouettes, materials and role equipment stay readable on phones.
function artBox(x,y,w,h,color,edge='#17212a',r=3){
    ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=color;ctx.fill();
    if(edge){ctx.strokeStyle=edge;ctx.lineWidth=1.5;ctx.stroke();}
}
function artLine(points,color,width=2){
    ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
}
function artDisc(x,y,r,color,edge){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();if(edge){ctx.strokeStyle=edge;ctx.lineWidth=1.5;ctx.stroke();}}
function artShadow(x,y,rx,ry){ctx.fillStyle='rgba(3,9,16,.24)';ctx.beginPath();ctx.ellipse(x+5,y+7,rx,ry,0,0,Math.PI*2);ctx.fill();}
function artCross(x,y,size=8,color='#ecf3e9'){ctx.fillStyle=color;ctx.fillRect(x-size/3,y-size,size*2/3,size*2);ctx.fillRect(x-size,y-size/3,size*2,size*2/3);}
function artCrate(x,y,size=25,col='#947047'){
    artBox(x,y,size,size,col,'#40382b');artLine([[x+3,y+3],[x+size-3,y+size-3]],'#c5a575',2);
    artLine([[x+size-3,y+3],[x+3,y+size-3]],'#594833',2);
}
function artSandbags(x,y,n=5){for(let i=0;i<n;i++)artBox(x+i*22,y+(i%2?2:0),27,14,i%2?'#8e8260':'#a3956b','#4b4b37',6);}
function drawSupplyCrate(d,T){
    ctx.save();ctx.translate(d.x,d.y);artShadow(0,0,25,15);
    artBox(-21,-15,42,32,d.type==='AMMOBOX'?'#7a8056':'#bac6b3','#2a4246',4);
    artBox(-19,-13,38,10,d.type==='AMMOBOX'?'#a49e68':'#d6dfcb',null,2);artBox(-14,-17,28,3,'#52665b',null,1);
    for(let x of [-18,15])artBox(x,-11,3,26,'#3f574f',null,1);
    if(d.type==='HEALTHBOX')artCross(0,6,8,'#ae5046');
    else for(let x of [-8,0,8]){artBox(x-2,1,5,11,'#c8af70',null,1);artDisc(x+.5,1,2,'#d8ca93');}
    ctx.restore();
}
function artPlate(label,x,y,color='#d5dacf'){
    ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 10px Arial';
    let w=Math.min(270,ctx.measureText(label).width+20);artBox(x-w/2,y-10,w,20,'rgba(10,20,27,.9)','#566269',5);
    ctx.fillStyle=color;ctx.fillText(label,x,y);ctx.restore();
}

function drawBanditDetailed(z,T,ang){
    let role=z.type-60,r=z.radius,down=z.banditDown||z.downed;
    const coats=['#8d7c56','#63775c','#6a6e69','#9d493f','#89704f','#55646b','#b4c6b6','#5d7194'];
    artShadow(z.x,z.y,r+9,r*.7);
    ctx.save();ctx.translate(z.x,z.y);ctx.rotate(ang+(down?1.25:0));
    ctx.lineJoin='round';ctx.lineCap='round';
    let step=down?0:Math.sin(T*8+(z.nid||0)*1.6)*3;
    artBox(-10-step,-r*.7,13,9,'#302d29','#141e22',3);artBox(-10+step,r*.7-9,13,9,'#302d29','#141e22',3);
    artBox(-r*.9,-r*.59,12,r*1.18,role===6?'#d9e0d2':'#5b5546','#283531',4);
    if(role===6)artCross(-r*.62,0,5,'#b54d43');
    if(role===0){artBox(-r-4,3,11,14,'#6e5235','#2f332c',3);artLine([[-r-1,5],[-r+5,15]],'#b6a074',1.5);}
    ctx.fillStyle=z.hitFlash>0?'#f8f1db':coats[role];ctx.strokeStyle='#202b30';ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(-1,0,r*.75,r*.91,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    artBox(-6,-r*.6,13,r*1.2,'#414b47','#25302f',3);
    for(let i=0;i<3;i++)artBox(-4,-r*.5+i*r*.35,7,5,'#83836a',null,1);
    // Hands and shoulders frame the weapon instead of covering the face.
    artLine([[1,-r*.75],[12,-r*.9],[23,-7]],coats[role],7);
    artLine([[0,r*.73],[12,r*.8],[24,8]],coats[role],7);
    artDisc(22,-7,4,'#d0ac85');artDisc(23,8,4,'#d0ac85');
    artDisc(7,0,r*.49,'#b99e7c','#28312e');
    artBox(5,-r*.42,10,r*.84,role===3?'#743b35':'#394944',null,3);
    artLine([[12,-5],[16,0],[12,5]],'#dcc4a2',2);
    if(role===0){artLine([[4,-r*.4],[13,-r*.4],[17,-r*.2]],'#b55c45',4);}
    else if(role!==3){ctx.beginPath();ctx.arc(7,0,r*.5,Math.PI/2,Math.PI*1.5);ctx.strokeStyle=role===6?'#e1e8d9':'#5a645b';ctx.lineWidth=5;ctx.stroke();}
    if(role===2){
        artBox(19,-r-5,13,r*2+10,'#677675','#202c31',5);artBox(25,-r+1,4,r*2-2,'#859493',null,1);
        artLine([[21,-10],[29,-6]],'#b7c0ad',2);artLine([[21,10],[28,13]],'#3d4a4d',2);
        artBox(8,r+1,24,4,'#73563c');artLine([[24,r-6],[30,r+2],[23,r+9]],'#bec4bd',6);
    }else if(role===3){
        for(let side of [-1,1]){artLine([[18,side*12],[35,side*20]],'#d5d7c9',4);artLine([[15,side*10],[22,side*14]],'#5c3b2f',4);}
    }else if(role===7){
        artBox(15,-7,15,14,'#5d6c75');ctx.beginPath();ctx.moveTo(28,-7);ctx.lineTo(43,-14);ctx.lineTo(43,14);ctx.lineTo(28,7);ctx.closePath();ctx.fillStyle='#c0c4b3';ctx.fill();artLine([[43,-13],[43,13]],'#374651',3);
    }else if(role===6&&!z.armed){artBox(16,-8,16,16,'#e3e9df');artCross(24,0,5,'#bc5149');}
    else{
        let heavy=role===5;artBox(13,-5,heavy?42:29,heavy?13:8,heavy?'#4e5f4d':'#33413f');
        artBox(26,-4,12,5,'#795c3e',null,1);artLine([[35,0],[heavy?62:48,0]],'#1d2a2f',heavy?7:4);
        if(role===1){artBox(24,-8,12,4,'#1c2b30');artDisc(37,-6,2,'#8bbfc2');}
        if(role===4)for(let side of [-1,1])artDisc(-5,side*(r+2),4,'#66864e','#202b2a');
        if((z.atkCD||0)>.3&&Math.sin(T*28+(z.nid||0))>.6){ctx.beginPath();ctx.moveTo(48,0);ctx.lineTo(57,-4);ctx.lineTo(54,0);ctx.lineTo(59,5);ctx.closePath();ctx.fillStyle='#f9cc6d';ctx.fill();}
    }
    if(z.panic){ctx.fillStyle='#e8b859';ctx.beginPath();ctx.moveTo(-9,-r-8);ctx.lineTo(-5,-r-16);ctx.lineTo(-1,-r-8);ctx.fill();}
    ctx.restore();
    let p=typeof localPlayer==='function'?localPlayer():players[0];
    if(p&&(down||Math.hypot(p.x-z.x,p.y-z.y)<430))artPlate(down?'ĐANG GỤC':BANDIT_NAMES[role],z.x,z.y-r-16,down?'#b9bcb3':'#dac5a2');
}

function drawBanditTruck(t,T){
    ctx.save();ctx.translate(t.x,t.y);ctx.lineJoin='round';
    artShadow(0,0,91,48);
    ctx.fillStyle='rgba(236,214,151,.09)';ctx.beginPath();ctx.moveTo(75,-24);ctx.lineTo(180,-60);ctx.lineTo(180,-6);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(75,24);ctx.lineTo(180,60);ctx.lineTo(180,6);ctx.closePath();ctx.fill();
    for(let x of [-53,44])for(let y of [-40,29]){artBox(x,y,30,13,'#151d24','#0c141a',4);for(let k=0;k<5;k++)artLine([[x+4+k*5,y+2],[x+4+k*5,y+10]],'#343e43',1);}
    artBox(-79,-33,159,66,'#52645b','#1e3034',7);artBox(-70,-28,91,56,'#3d4e47','#253932',4);
    for(let x=-64;x<17;x+=16)artLine([[x,-22],[x,22]],'#5f7464',2);
    artCrate(-64,-19,27,'#87754c');artCrate(-31,2,20,'#74664a');
    artBox(21,-29,48,58,'#657665','#263d39',5);artBox(31,-23,17,46,'#203b46','#1c2d32',3);
    artLine([[33,-20],[44,-8],[44,17]],'#558091',2);artBox(52,-23,13,46,'#4c5e53',null,2);
    for(let y of [-23,23])artBox(72,y-4,8,8,'#efcf8a','#333f3b',2);
    artBox(-85,-30,8,60,'#293b3c');artBox(77,-31,10,62,'#2c3a3e');
    for(let [x,y]of [[-72,-27],[-72,27],[16,-27],[16,27],[66,-24],[66,24]])artDisc(x,y,2,'#9b9f85');
    artLine([[-8,-29],[5,-18],[0,-8]],'#ad7058',4);
    let p=labLiving()[0],a=p?Math.atan2(p.y-t.y,p.x-t.x):0;
    ctx.save();ctx.translate(-7,0);ctx.rotate(a);artDisc(0,0,15,'#566c61','#273c3a');artBox(-10,-9,22,18,'#6c7f6e');artBox(8,-3,45,6,'#253838');artBox(26,-4,15,8,'#434f49');ctx.restore();
    ctx.restore();if(t.hp<(t.maxHp||t.hp))drawMiniBar(t.x,t.y-56,100,5,t.hp,t.maxHp,'#cf9a63');
    artPlate(t.deploy===false?'XE RÚT QUÂN':'CHIẾN XA CƯỚP',t.x,t.y+58,'#d1bc91');
}

function artBuilding(f,T){
    const accents={market:'#b5794c',arsenal:'#728c72',outpost:'#a38b5c',greenhouse:'#6eaa93',ranger:'#8b9b68'};
    let accent=accents[f.kind]||'#7c9295';
    artShadow(0,0,170,123);artBox(-154,-122,308,244,'#293d42','#172a30',5);artBox(-146,-114,292,228,'#48565a',null,2);
    ctx.strokeStyle='rgba(172,188,176,.12)';ctx.lineWidth=1;
    for(let x=-140;x<145;x+=29){ctx.beginPath();ctx.moveTo(x,-110);ctx.lineTo(x,110);ctx.stroke();}
    for(let y=-110;y<114;y+=28){ctx.beginPath();ctx.moveTo(-144,y);ctx.lineTo(144,y);ctx.stroke();}
    if(f.kind==='market'){
        for(let x of [-103,35])for(let y of [-65,25]){artBox(x,y,66,20,'#48564b','#243735');for(let k=0;k<5;k++)artBox(x+5+k*11,y+5,7,9,['#c0a065','#7e9a62','#a77655'][k%3],null,1);}
        for(let i=0;i<8;i++)artBox(-126+i*31,86,31,22,i%2?'#a3704b':'#d2bf91',null,1);
    }else if(f.kind==='greenhouse'){
        for(let x of [-100,-35,40])for(let y of [-60,25]){artBox(x,y,40,55,'#594f39','#303f35');for(let k=0;k<3;k++)artDisc(x+10+k*10,y+27,9,'#628764');}
    }else if(f.kind==='outpost'){
        artSandbags(-126,-95,4);artSandbags(35,74,4);artBox(58,-67,50,45,'#5d6656');artDisc(83,-45,11,'#8a9273');artLine([[83,-45],[118,-69]],'#273b3d',5);
    }else{
        artBox(-125,-83,82,40,'#5b695d','#253c36',3);artBox(34,28,85,42,'#687969','#2a4038',3);
        for(let k=0;k<3;k++){artCrate(-110+k*32,20,26);artBox(46+k*19,-69,13,29,'#a6a38c','#344740',2);}
    }
    // Matching the physical wall fragments preserves the three broad entrances.
    for(let [x,y,w,h]of [[-155,-130,100,20],[55,-130,100,20],[-155,110,100,20],[55,110,100,20]]){
        artBox(x+3,y+6,w,h,'#25363a',null,2);artBox(x,y,w,h,accent,'#263c40',2);artLine([[x+4,y+3],[x+w-5,y+3]],'#b5b6a0',2);
    }
    let p=localPlayer(),near=p&&Math.hypot(p.x-f.x,p.y-f.y)<255;
    ctx.save();ctx.globalAlpha=near?.16:.38;
    artBox(-142,-110,284,194,f.kind==='greenhouse'?'#7ba69c':'#697b77','#91a49a',3);
    for(let x=-126;x<140;x+=32)artLine([[x,-108],[x,80]],'#3e5b5c',2);
    ctx.restore();artBox(-32,88,64,7,'#bdab7d',null,1);
}

function drawWorldFeature(f,T){
    ctx.save();ctx.translate(f.x,f.y);ctx.lineCap='round';ctx.lineJoin='round';
    let damaged=f.hp<f.maxHp&&!f.on;
    if(f.anomaly){
        ctx.fillStyle='rgba(113,69,125,.06)';ctx.beginPath();ctx.arc(0,0,f.r,0,Math.PI*2);ctx.fill();
        ctx.save();ctx.setLineDash([14,22]);ctx.strokeStyle='rgba(152,116,166,.38)';ctx.lineWidth=2;ctx.stroke();ctx.restore();
    }
    if(f.building)artBuilding(f,T);
    else{
        artShadow(0,0,53,29);
        switch(f.kind){
            case 'signal':
                artBox(-42,-18,84,52,'#3b4e51');artBox(-35,-12,30,33,'#708177');artBox(4,-10,28,23,'#263b41');
                for(let y=-80;y<20;y+=24){artLine([[-24,y+24],[24,y],[-24,y]],'#7b9090',3);}
                artLine([[-27,29],[0,-119],[27,29]],'#9caaa0',5);artLine([[-28,29],[28,29]],'#687c7d',4);
                artLine([[-25,-100],[24,-100]],'#c4c7aa',3);artDisc(0,-119,4,Math.sin(T*5)>0?'#ed9b6b':'#795341');
                for(let side of [-1,1]){ctx.save();ctx.scale(side,1);ctx.strokeStyle=f.on?'#88c8bb':'#617b83';ctx.lineWidth=2;ctx.beginPath();ctx.arc(1,-99,30,-.6,.6);ctx.stroke();ctx.beginPath();ctx.arc(1,-99,42,-.55,.55);ctx.stroke();ctx.restore();}break;
            case 'fuel':
                artBox(-48,-24,96,49,'#6c7669');for(let x of [-28,20]){artBox(x-15,-41,30,66,'#a77d51','#423f31',10);artLine([[x-11,-24],[x+11,-24]],'#d7b77a',4);artBox(x-5,-45,10,8,'#404c47');}
                artLine([[-43,20],[-55,30],[-52,44],[-15,47]],'#252f34',5);artPlate('⚠',0,2,'#ffdf89');break;
            case 'siren':
                artBox(-58,-25,116,50,'#c6c8b0','#31434b',8);artBox(13,-20,24,40,'#315364');artBox(-50,-20,56,40,'#a8b9ac');artCross(-23,0,12,'#b5574f');
                for(let y of [-30,23])for(let x of [-37,29])artBox(x,y,19,9,'#202b30');artBox(4,-27,24,7,'#30444e');artDisc(8,-24,4,Math.sin(T*5)>0?'#db685b':'#436d88');artDisc(22,-24,4,Math.sin(T*5)<0?'#779dc0':'#783c38');break;
            case 'cage':
                artBox(-43,-32,86,66,'#3a423b');for(let x=-36;x<=37;x+=12)artLine([[x,-29],[x,30]],'#8a9588',4);artLine([[-43,-13],[43,-13]],'#6a7d71',3);artLine([[-43,20],[43,20]],'#6a7d71',3);break;
            case 'mushroom':case 'spores':case 'swamp':
                ctx.fillStyle='rgba(76,136,137,.2)';ctx.beginPath();ctx.ellipse(0,15,75,40,0,0,Math.PI*2);ctx.fill();
                for(let i=0;i<5;i++){let x=Math.sin(i*2.4)*42,y=Math.cos(i*2.4)*20;artLine([[x,y+15],[x-2,y-6]],'#82aaa0',5);ctx.fillStyle=i%2?'#7999b1':'#85baa6';ctx.beginPath();ctx.ellipse(x-2,y-10,16,10,-.2,Math.PI,Math.PI*2);ctx.fill();artDisc(x-6,y-15,2,'#d8e5b9');}break;
            case 'light':case 'generator':case 'geo':case 'transformer':
                artBox(-48,-28,96,59,'#536e6a');artBox(-40,-20,52,43,'#3b5152');artDisc(-14,0,17,'#2a3a40','#8b9f97');
                for(let i=0;i<6;i++){let a=i*Math.PI/3+(f.on?T*3:0);artLine([[-14,0],[-14+Math.cos(a)*12,Math.sin(a)*12]],'#718d87',4);}
                artBox(21,-18,17,36,'#303f44');artDisc(29,-9,3,f.on?'#9fcf88':'#c99c62');artBox(-39,-39,12,10,'#7c8d80');
                artLine([[34,-25],[45,-66]],'#889a91',4);artBox(29,-75,36,16,f.on?'#e5d9a1':'#7e8b83');break;
            case 'furnace':
                artBox(-48,-35,96,76,'#6c6251');for(let x=-40;x<42;x+=20)artLine([[x,-31],[x,36]],'#4c4d44',2);
                artBox(-31,-19,62,43,'#251e21');ctx.fillStyle=f.on?'#efa756':'#aa643e';ctx.beginPath();ctx.moveTo(-25,20);ctx.lineTo(-14,-9+Math.sin(T*8)*4);ctx.lineTo(0,9);ctx.lineTo(12,-15);ctx.lineTo(25,20);ctx.fill();artBox(25,-75,18,42,'#53605a');break;
            case 'switch':
                for(let x of [-31,31])artLine([[x,-55],[x,48]],'#93a29a',4);
                for(let y=-45;y<50;y+=16)artLine([[-43,y],[44,y]],'#79644d',7);
                artBox(-15,-17,32,34,'#6b7667');artLine([[0,4],[f.branch==='short'?28:-28,-35]],'#bdad7d',5);artDisc(f.branch==='short'?28:-28,-35,7,'#c18454');break;
            case 'crusher':
                artBox(-60,-36,120,76,'#64726a');for(let x=-49;x<50;x+=14)artLine([[x,-29],[x,31]],'#374b4e',8);
                artBox(-59,-42,118,17,'#ad9b62');for(let x=-55;x<55;x+=17)artLine([[x,-40],[x+10,-27]],'#444e46',4);artDisc(46,33,6,f.on?'#a3c67c':'#cba66a');break;
            case 'gland':case 'eggs':case 'cocoon':
                for(let i=0;i<4;i++){let x=Math.sin(i*2.2)*27,y=Math.cos(i*2.2)*18;ctx.fillStyle=f.kind==='gland'?'#83994a':f.kind==='cocoon'?'#a8b7a0':'#a3ad73';ctx.beginPath();ctx.ellipse(x,y,14,25,.3*i,0,Math.PI*2);ctx.fill();artLine([[x-7,y-12],[x+7,y+10]],'#d2d4ac',2);}
                if(f.kind==='cocoon')for(let i=0;i<5;i++)artLine([[-40,-23+i*11],[37,19-i*7]],'rgba(205,218,197,.45)',1);break;
            case 'mineral':case 'ceiling':
                for(let i=0;i<5;i++){let x=(i-2)*16,h=25+(i*17)%39;ctx.beginPath();ctx.moveTo(x-12,25);ctx.lineTo(x-4,25-h);ctx.lineTo(x+9,18-h*.7);ctx.lineTo(x+12,25);ctx.closePath();ctx.fillStyle=i%2?'#889caa':'#6e8791';ctx.fill();artLine([[x-4,25-h],[x+2,24]],'#b5c2bc',2);}break;
            case 'chasm':case 'bridge':
                ctx.fillStyle='#0c151d';ctx.fillRect(-170,-48,340,96);for(let y=-62;y<65;y+=15)artBox(-43,y,86,12,f.kind==='chasm'?'#969783':'#8b704e','#34443f',2);artLine([[-51,-70],[-51,74]],'#b7a785',4);artLine([[51,-70],[51,74]],'#b7a785',4);break;
            case 'pillar':
                for(let x of [-28,23])artBox(x,-48,10,96,'#9c7e54');artBox(-40,-48,80,12,'#b39768');artLine([[-27,37],[25,-28]],'#826447',8);artBox(-33,24,18,5,'#78827a');break;
            case 'crackwall':
                for(let row=0;row<4;row++)for(let col=0;col<3;col++)artBox(-39+col*26+(row%2?7:0),-43+row*21,25,20,['#7e8b87','#8f9990','#6f807f'][(row+col)%3],'#3f5558',2);
                artLine([[10,-41],[-4,-13],[9,5],[-9,39]],'#233b42',4);break;
            case 'rottenTree':
                artBox(-17,-36,34,73,'#755f45','#34473d',6);artLine([[0,-30],[-33,-52]],'#746249',11);artLine([[9,2],[34,-21]],'#8a7250',9);artLine([[0,-28],[-7,13],[4,35]],'#b19b68',2);break;
            case 'shaft':case 'vault':case 'heli':
                artBox(-58,-37,116,74,'#3b4e4d');artLine([[-52,-32],[48,29]],'#71877d',3);artCrate(-29,-20,37,'#8f7e51');artCrate(13,8,25,'#a38755');
                if(f.kind==='shaft'){artLine([[-64,33],[-43,-67],[43,-67],[64,33]],'#8f9990',6);artDisc(0,-64,12,'#354c50','#a0ad9b');artLine([[0,-58],[0,-4]],'#b7ac83',2);}break;
            default:
                artBox(-30,-24,60,48,'#5f7a73');artDisc(0,0,13,f.on?'#9dc294':'#bfa46b','#304b50');break;
        }
    }
    if(f.on&&FEATURE_DESTRUCTIBLE.has(f.kind)){
        ctx.fillStyle='rgba(24,33,34,.7)';ctx.fillRect(-42,-33,84,69);for(let i=0;i<6;i++)artBox(-40+i*13,17+(i%3)*4,14,7,'#6d7568',null,1);
    }
    let p=localPlayer(),near=p&&Math.hypot(p.x-f.x,p.y-f.y)<300;
    let labelY=f.building?-152:f.kind==='signal'?-140:f.kind==='shaft'?-87:-66;
    artPlate(FEATURE_LABELS[f.kind]||f.kind,0,labelY,f.on?'#adc5aa':'#d5d4b6');
    if(near&&!f.on&&!FEATURE_DESTRUCTIBLE.has(f.kind)&&!f.anomaly){ctx.font='10px Arial';ctx.textAlign='center';ctx.fillStyle='#b5cbc9';ctx.fillText(f.kind==='switch'?'ĐỔI RAY [G]':'GIỮ VỊ TRÍ '+(f.kind==='signal'?5:3)+'s',0,f.building?145:55);}
    if(f.progress>0)drawMiniBar(0,f.building?158:69,75,5,f.progress,f.kind==='signal'?5:3,'#93bcb0');
    if(damaged)drawMiniBar(0,49,64,4,Math.max(0,f.hp),f.maxHp,'#cba06b');
    ctx.restore();
}

// Existing functional outposts gain the same material language as the new POIs.
Outpost.prototype.draw=function(){
    if(this.dead)return;let x=this.x+this.w/2,y=this.y+this.h/2;ctx.save();ctx.translate(x,y);
    artShadow(0,0,96,73);artBox(-76,-68,152,136,'#4c6056','#243b3d',5);
    artBox(-62,-55,124,102,'#647869','#2c4440',3);for(let i=0;i<5;i++)artLine([[-58,-47+i*20],[58,-47+i*20]],'#829080',2);
    artBox(-29,-10,58,39,'#263e42');artLine([[-18,6],[20,6]],'#81948b',4);artSandbags(-87,52,7);
    artBox(33,-50,22,30,'#354a46');artLine([[44,-43],[63,-70]],'#22383c',5);
    artPlate('TIỀN ĐỒN',0,-87,'#d3c5a0');if(this.hp<this.maxHp)drawMiniBar(0,83,110,6,this.hp,this.maxHp,'#c5a66c');ctx.restore();
};
