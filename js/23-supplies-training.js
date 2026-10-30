// Food is produced once per completed expedition, never by reopening the camp.
const supplyBaseSave=baseSave,supplyBaseLoad=baseLoad;
baseSave=function(){return {...supplyBaseSave(),food:base.food|0,td:base.trainDmg|0};};
baseLoad=function(s){supplyBaseLoad(s);base.food=Math.max(0,s?.food|0);base.trainDmg=Math.max(0,Math.min(10,s?.td|0));base.trainHp=Math.max(0,Math.min(10,s?.th|0));base.trainSpd=Math.max(0,Math.min(10,s?.ts|0));};
function trainingCap(){return [0,0,2,4,7,10][base.house|0]||0;}
function trainingPrice(level){return 12*(level+1);}
function trainingGain(what){let h=Math.max(0,(base.house|0)-2);return what==='thp'?30+5*h:what==='tspd'?12+2*h:.08+.02*h;}
function buyTraining(what){
    if(NET.mode==='guest'||objState!=='HUB'||base.house<2)return false;
    let key={thp:'trainHp',tspd:'trainSpd',tdmg:'trainDmg'}[what];if(!key)return false;
    let level=base[key]|0,cost=trainingPrice(level);
    if(level>=trainingCap()||(base.food|0)<cost){netToast('Không đủ thực phẩm hoặc cần nâng Nhà Chính để tập tiếp.',1800);return false;}
    base.food-=cost;base[key]=level+1;
    let gain=trainingGain(what);for(let p of activePlayers())if(what==='thp'){p.maxHp+=gain;p.hp=Math.min(p.maxHp,p.hp+gain);}else if(what==='tspd')p.baseSpeed+=gain;else p.dmgMult+=gain;
    Sound.play('upgrade');renderBasePanel();netSendSync();saveCheckpoint(true);return true;
}
function trainingPanel(){
    let html=`<div class="mt-2 p-2 text-xs text-emerald-200">🌾 ${base.food|0} thực phẩm · ${base.pop|0} cư dân tạo ${(base.pop|0)*3} thực phẩm / chiến dịch</div>`;
    if(base.house<2)return html;
    html+='<div class="text-sm text-sky-300 font-bold">🏋 KHU TẬP LUYỆN — nâng chỉ số cả đội</div>';
    for(let [id,key,name,desc]of [['thp','trainHp','Thể lực','+30 máu tối đa'],['tspd','trainSpd','Tốc độ','+12 tốc chạy'],['tdmg','trainDmg','Sức mạnh','+8% sát thương cơ bản']]){
        let lv=base[key]|0,c=trainingPrice(lv),ok=NET.mode!=='guest'&&lv<trainingCap()&&(base.food|0)>=c;
        desc=id==='thp'?`+${trainingGain(id)} máu tối đa`:id==='tspd'?`+${trainingGain(id)} tốc chạy`:`+${Math.round(trainingGain(id)*100)}% sát thương cơ bản`;
        html+=`<div class="p-2 flex justify-between text-xs text-white"><span>${name} ${lv}/${trainingCap()} · ${desc}</span><button ${ok?'':'disabled'} class="p-2 rounded bg-sky-800 disabled:opacity-40" onclick="colonyBuy('${id}')">${lv>=trainingCap()?'GIỚI HẠN HIỆN TẠI':`Tập 🌾${c}`}</button></div>`;
    }return html+`<div class="p-2 text-xs text-sky-200">Giới hạn theo Nhà Chính cấp 2/3/4/5: 2/4/7/10 lần mỗi nhánh.<br>Nội tại: Thể lực 4 → hồi 1% máu/10s; Tốc độ 4 → kháng chậm 20%; Sức mạnh 4 → +5% sát thương.<br>Mỗi nhánh đạt 7: hiệu ứng nội tại gấp đôi. Cả 3 nhánh đạt 10: +10% máu tối đa thành Máu Ảo khi bắt đầu map.</div>`;
}

// ammo remains the total ammunition owned, including the rounds in the magazine.
// This preserves existing ammo restoration perks and old save files.
const MAGAZINES={PISTOL:[12,1.3],SMG:[30,1.8],AR:[25,2],SHOTGUN:[6,2.5],SNIPER:[5,2.8],GLAUNCHER:[1,2.8]};
function magazineInit(p){let w=p.weapon,def=w&&MAGAZINES[w.key];if(!def)return null;
    let cap=Math.ceil(def[0]*(p.perks.rl_extended?1.3:1));w.magSize=cap;
    w.mag=Math.max(0,Math.min(cap,w.ammo,Number.isFinite(w.mag)?w.mag:Math.min(cap,w.ammo)));return w;
}
function reloadDuration(p){let n=p.tags['NẠP ĐẠN']||0;return Math.max(.35,MAGAZINES[p.weapon.key][1]*(p.perks.rl_quick?.75:1)*(n>=5?.65:n>=3?.8:n>=2?.9:1));}
function requestReload(p){
    if(gameState!=='PLAYING'||p.isDowned||p.netLeft||inTank(p)||expeditionMovementLocked(p))return false;
    let w=magazineInit(p);if(!w||p.reloadW===w||w.mag>=w.magSize||w.ammo<=w.mag)return false;
    p.reloadW=w;p.reloadT=p.reloadMax=reloadDuration(p);Sound.play('reload_small');return true;
}
function magazineCanFire(p){let w=magazineInit(p);if(!w)return true;if(p.reloadW===w)return false;if(w.mag<=0){requestReload(p);return false;}return true;}
function tickReload(p,dt){
    let w=magazineInit(p);
    if(p.reloadW&&(p.reloadW!==w||p.isDowned)){p.reloadW=null;p.reloadT=0;}
    if(!p.reloadW)return;
    p.reloadT=Math.max(0,p.reloadT-dt);if(p.reloadT>0)return;
    w.mag=Math.min(w.magSize,w.ammo);p.reloadW=null;
    if(p.perks.rl_guard)p.addVirtualHp(p.maxHp*.04);
    if(p.perks.rl_focus)p.reloadFocus=3;
}
TAG_RULES['NẠP ĐẠN']={reqBreak:5,exclusive:false};
TAG_DEFS['NẠP ĐẠN']={max:5,color:'#77cbd1',label:'NẠP ĐẠN'};
WIKI_TAGS['NẠP ĐẠN']='2: nạp nhanh 10%; 3: nhanh 20%; 5: nhanh 35%. Cộng dồn với Thay Băng Nhanh. F/nút NẠP để nạp chủ động, hết băng tự nạp từ dự trữ.';
UPGRADES.push(
 {id:'rl_quick',type:'Tiếp tế',name:'Thay Băng Nhanh',desc:'Nạp đạn nhanh hơn 25%.',tags:['NẠP ĐẠN']},
 {id:'rl_extended',type:'Tiếp tế',name:'Băng Đạn Mở Rộng',desc:'Băng đạn chứa thêm 30% viên; không tạo thêm đạn dự trữ.',tags:['NẠP ĐẠN','ĐẠN']},
 {id:'rl_guard',type:'Tiếp tế',name:'Nạp Đạn Bọc Lót',desc:'Nạp xong nhận 4% máu tối đa thành Máu Ảo.',tags:['NẠP ĐẠN','PHÒNG THỦ']},
 {id:'rl_focus',type:'Tiếp tế',name:'Phát Bắn Sẵn Sàng',desc:'Sau khi nạp, tăng 15% sát thương trong 3 giây.',tags:['NẠP ĐẠN','XẠ THỦ']},
 {id:'rl_supply',type:'Tiếp tế',name:'Kho Đạn Dã Chiến',desc:'Thùng đạn hồi thêm 25% tổng sức chứa.',tags:['NẠP ĐẠN','VẬT PHẨM']}
);
const supplyPlayerUpdate=Player.prototype.update;
Player.prototype.update=function(dt){
    tickReload(this,dt);this.reloadFocus=Math.max(0,(this.reloadFocus||0)-dt);
    if((base.trainHp|0)>=4&&!this.isDowned){this.trainingHealT=(this.trainingHealT||0)+dt;if(this.trainingHealT>=10){this.trainingHealT=0;this.applyHeal(this.maxHp*((base.trainHp|0)>=7?.02:.01));}}
    if(NET.mode!=='guest'&&!this.isDowned)for(let i=drops.length-1;i>=0;i--){let d=drops[i];if(!['AMMOBOX','HEALTHBOX'].includes(d.type)||Math.hypot(this.x-d.x,this.y-d.y)>this.radius+24)continue;
        if(d.type==='AMMOBOX'){let w=this.weapon;if(!w||!MAGAZINES[w.key]||w.ammo>=w.maxAmmo)continue;w.ammo=Math.min(w.maxAmmo,w.ammo+Math.ceil(w.maxAmmo*(this.perks.rl_supply?.75:.5)));}
        else{if(this.hp>=this.maxHp)continue;this.hp=Math.min(this.maxHp,this.hp+this.maxHp*.5);}
        drops.splice(i,1);Sound.play('pickup');
    }
    return supplyPlayerUpdate.call(this,dt);
};
const supplyDamage=Player.prototype.getTotalDamageMult;
Player.prototype.getTotalDamageMult=function(){return supplyDamage.call(this)*(this.reloadFocus>0?1.15:1)*((base.trainDmg|0)>=7?1.1:(base.trainDmg|0)>=4?1.05:1);};
const trainingStatusMove=getStatusMoveMult;
getStatusMoveMult=function(e){let m=trainingStatusMove(e);if(e instanceof Player&&m<1&&(base.trainSpd|0)>=4)m=1-(1-m)*((base.trainSpd|0)>=7?.6:.8);return m;};
const trainingLevelStart=startLevel;
startLevel=function(){trainingLevelStart();if(Math.min(base.trainHp|0,base.trainSpd|0,base.trainDmg|0)>=10)for(let p of activePlayers())p.addVirtualHp(p.maxHp*.1);};
const supplySkill=skillTryC;
skillTryC=function(p){let w=magazineInit(p);if(w&&(p.reloadW===w||w.mag<=0))return false;let ammo=w?.ammo,result=supplySkill(p);if(w&&p.weapon===w){w.mag=Math.max(0,w.mag-Math.max(0,ammo-w.ammo));if(!w.mag)requestReload(p);}return result;};
const supplySpawn=spawnDrop;
spawnDrop=function(x,y,boss,forced){if(!forced&&!boss&&Math.random()<.16)forced=Math.random()<.5?'AMMOBOX':'HEALTHBOX';if(['AMMOBOX','HEALTHBOX'].includes(forced)){if(drops.length<MAX_GROUND_DROPS)drops.push({type:forced,x,y,radius:18,lifeTime:900});return;}return supplySpawn(x,y,boss,forced);};
NET_DROP_T.push('AMMOBOX','HEALTHBOX');
const supplyNetEncode=netEncodePlayer,supplyNetDecode=netDecodePlayer;
netEncodePlayer=function(p){let e=supplyNetEncode(p),w=magazineInit(p);e.push(w?[w.mag,w.magSize,Math.ceil((p.reloadT||0)*100),Math.ceil((p.reloadMax||0)*100)]:null);return e;};
netDecodePlayer=function(p,e,local){supplyNetDecode(p,e,local);if(e[30]&&p.weapon){let [mag,size,t,max]=e[30];p.weapon.mag=mag;p.weapon.magSize=size;p.reloadT=t/100;p.reloadMax=max/100;p.reloadW=t>0?p.weapon:null;}};
const supplyStoryNet=storyNetState,supplyStoryApply=storyNetApply;
storyNetState=function(){return {...supplyStoryNet(),sf:[base.food|0,base.trainDmg|0,base.house|0,base.trainHp|0,base.trainSpd|0]};};
storyNetApply=function(x){supplyStoryApply(x);if(x?.sf){base.food=x.sf[0];base.trainDmg=x.sf[1];base.house=x.sf[2];base.trainHp=x.sf[3];base.trainSpd=x.sf[4];}};
const supplyNetData=netOnData;
netOnData=function(d,peer){if(d?.t==='reload'){if(NET.mode==='host'&&peer){let p=players.find(p=>p.id===peer.pid);if(p)requestReload(p);}return;}return supplyNetData(d,peer);};
function sendReload(pid){if(NET.mode==='guest')netSend({t:'reload'});else{let p=players.find(p=>p.id===(pid||localPlayer().id));if(p)requestReload(p);}}
window.addEventListener('keydown',e=>{if(e.code==='KeyF'&&gameState==='PLAYING'&&!e.repeat){e.preventDefault();sendReload();}});
async function supplyFullscreen(){try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();if(screen.orientation?.lock)await screen.orientation.lock('landscape');}catch(e){netToast('Có thể xoay ngang máy để chơi rộng hơn.',1800);}}
function drawSupplyHud(){
    let box=document.getElementById('supplyHud');if(!box){box=document.createElement('div');box.id='supplyHud';box.style.cssText='position:fixed;top:100px;left:10px;z-index:21;display:flex;gap:6px;max-width:80vw;font:12px Arial';document.body.appendChild(box);}
    box.style.display=gameState==='PLAYING'&&objState!=='HUB'?'flex':'none';
    let html='';if(gameState==='PLAYING'&&objState!=='HUB'&&!cartRun)for(let p of NET.mode?[localPlayer()]:players.slice(0,isSinglePlayer?1:2)){
        let w=magazineInit(p);if(w)html+=`<button style="background:#122331dd;color:#fff;border:1px solid #79b6c3;border-radius:8px;padding:6px" onpointerdown="event.preventDefault();sendReload(${p.id})">P${p.id} ${w.mag}/${w.magSize} · Dự trữ ${Math.max(0,w.ammo-w.mag)}<br>${p.reloadT>0?'NẠP '+p.reloadT.toFixed(1)+'s':'NẠP [F]'}</button>`;
    }
    if(showTouchUI||NET.mode)html+=`<button style="background:#123;color:white;padding:6px;border-radius:8px" onclick="supplyFullscreen()">⛶ Toàn màn hình</button>`;
    if(showTouchUI&&NET.mode&&H>W&&gameState==='PLAYING')html+='<span style="color:#ffe4a2;font:11px Arial">Xoay ngang để có tầm nhìn rộng hơn</span>';
    if(box._html!==html){box.innerHTML=html;box._html=html;}
}
const supplyDraw=draw;
draw=function(){supplyDraw();drawSupplyHud();};
