// Persistent device identity is separate from the character profile being borrowed.
let coopIdentity='',partyArchive=Object.create(null);
function validPlayerUUID(v){return typeof v==='string'&&/^[a-zA-Z0-9_-]{8,96}$/.test(v);}
function cleanPlayerName(v){return typeof v==='string'?v.replace(/[<>\u0000-\u001f]/g,'').trim().slice(0,24):'';}
function escapeGameText(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function localPlayerUUID(){
    if(coopIdentity)return coopIdentity;
    try{let old=localStorage.getItem('zs_player_uuid_v1');if(validPlayerUUID(old))return coopIdentity=old;}catch(e){}
    coopIdentity=typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():'p_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2);
    try{localStorage.setItem('zs_player_uuid_v1',coopIdentity);}catch(e){}return coopIdentity;
}
function coopReadName(){
    let el=document.getElementById('netPlayerName'),name=cleanPlayerName(el?.value);
    try{name=name||cleanPlayerName(localStorage.getItem('zs_player_name_v1'));}catch(e){}
    name=name||'Người sống sót';if(el)el.value=name;
    try{localStorage.setItem('zs_player_name_v1',name);}catch(e){}return name;
}
function coopNameReady(){let el=document.getElementById('netPlayerName');if(!cleanPlayerName(el?.value)){netSetStatus('Hãy nhập tên nhân vật trước khi tạo hoặc vào phòng.');el?.focus();return false;}coopReadName();return true;}
function coopClone(v){return JSON.parse(JSON.stringify(v));}
function coopArchivePlayer(p){
    if(!p||p.netLeft||!validPlayerUUID(p.playerUUID))return;
    let id=validPlayerUUID(p.profileUUID)?p.profileUUID:p.playerUUID,old=partyArchive[id];
    partyArchive[id]={uuid:id,name:(p.playerUUID===id?p.playerName:old?.name)||p.playerName||'Người sống sót',data:coopClone(savePlayer(p)),x:p.x,y:p.y,map:currentMapType,level:currentLevel,seed:fieldWorld?.seed||null};
    partyArchive[id].data.uuid=id;partyArchive[id].data.name=partyArchive[id].name;partyArchive[id].data.profile=id;
}
function coopArchiveAll(){for(let p of players)coopArchivePlayer(p);}
function coopRoster(){
    coopArchiveAll();let ids=[];for(let p of players)if(p.profileUUID&&partyArchive[p.profileUUID]&&!ids.includes(p.profileUUID))ids.push(p.profileUUID);
    for(let id of Object.keys(partyArchive))if(!ids.includes(id)&&ids.length<4)ids.push(id);
    return ids.slice(0,4).map(id=>coopClone(partyArchive[id]));
}
function coopLoadArchive(s){
    partyArchive=Object.create(null);let stored=s?.partyArchive||s?.base?.partyArchive;
    for(let r of stored?Object.values(stored):s?.partyRoster||s?.base?.partyRoster||[]){if(validPlayerUUID(r?.uuid)&&r.data)partyArchive[r.uuid]=coopClone(r);}
    if(!Object.keys(partyArchive).length)for(let d of s?.pl||[]){let id=validPlayerUUID(d.uuid)?d.uuid:localPlayerUUID();partyArchive[id]={uuid:id,name:cleanPlayerName(d.name)||'Người sống sót',data:coopClone(d)};}
}
function coopSaveExtras(){
    let online=NET.mode==='host'||runMode==='online';
    return {...recoverySaveState(),online:online?1:0,...(online?{hostUUID:players[0]?.profileUUID||localPlayerUUID(),partyRoster:coopRoster(),partyArchive:coopClone(partyArchive)}:{})};
}
const coopBaseSave=baseSave,coopBaseLoad=baseLoad;
baseSave=function(){let b=coopBaseSave();if(NET.mode==='host'||runMode==='online'){b.partyRoster=coopRoster();b.partyArchive=coopClone(partyArchive);}return b;};
baseLoad=function(s){coopBaseLoad(s);if(s?.partyArchive)coopLoadArchive({base:s});};
const coopReset=resetRunState;
resetRunState=function(){coopReset();partyArchive=Object.create(null);};
function coopInitNewParty(){
    for(let p of players){let peer=NET.peers.find(pr=>pr.pid===p.id);p.playerUUID=p.id===1?localPlayerUUID():peer?.uuid;p.profileUUID=p.playerUUID;p.playerName=p.id===1?coopReadName():peer?.name||'Đồng đội '+p.id;}
    coopArchiveAll();
}
function coopMakePlayer(pid,uuid,name,profile){
    let p=new Player(pid,HUB.x+(pid-2)*40,HUB.y+70,playerColorOf(pid)),r=partyArchive[profile||uuid];
    if(r)restorePlayer(p,r.data);
    p.playerUUID=uuid;p.playerName=cleanPlayerName(name)||'Đồng đội '+pid;p.profileUUID=profile||uuid;p.netLeft=false;
    return p;
}
function coopRestoreLineup(s){
    coopLoadArchive(s);let hostProfile=validPlayerUUID(s.hostUUID)?s.hostUUID:(s.partyRoster?.[0]?.uuid||s.pl[0].uuid||localPlayerUUID());
    let old=players[0];players=[coopMakePlayer(1,localPlayerUUID(),coopReadName(),hostProfile)];if(!partyArchive[hostProfile]&&old)restorePlayer(players[0],savePlayer(old));
    players[0].playerUUID=localPlayerUUID();players[0].profileUUID=hostProfile;
    let used=new Set([hostProfile]),count=Math.max(2,Math.min(4,s.pl.length,NET.playerCount||4));
    for(let pid=2;pid<=Math.max(count,...NET.peers.map(pr=>pr.pid));pid++){
        let pr=NET.peers.find(e=>e.pid===pid),id=pr?(pr.profile||pr.uuid):Object.keys(partyArchive).find(id=>!used.has(id));
        let p=coopMakePlayer(pid,pr?.uuid||id,pr?.name||partyArchive[id]?.name,id);p.netLeft=!pr;if(!pr){p.isDowned=true;p.hp=0;}players.push(p);if(id)used.add(id);
    }
    NET.playerCount=players.length;isSinglePlayer=false;
}
function coopStartSaved(){
    if(!NET.resumeSave?.online)return false;
    NET.restoringOnline=true;try{loadGame();}finally{NET.restoringOnline=false;NET.resumeSave=null;}return true;
}
function coopLobbyNames(){let n={1:coopReadName()};for(let p of NET.peers)n[p.pid]=p.name||'Đồng đội '+p.pid;return n;}
function coopReject(c,reason){c.on('open',()=>{netSendTo(c,{t:'identity_reject',reason});setTimeout(()=>{try{c.close();}catch(e){}},500);});return null;}
function coopAcceptPeer(c){
    let uuid=c.metadata?.uuid,name=cleanPlayerName(c.metadata?.name);
    if(!validPlayerUUID(uuid)||!name)return coopReject(c,'Hãy cập nhật game và nhập tên trước khi vào phòng.');
    if(uuid===localPlayerUUID()||NET.peers.some(pr=>pr.uuid===uuid))return coopReject(c,'Hồ sơ này đang kết nối trong phòng.');
    let known=players.find(p=>p.playerUUID===uuid&&p.netLeft),used=new Set(NET.peers.map(pr=>pr.pid));
    let pid=NET.mode==='host'&&known&&!used.has(known.id)?known.id:[2,3,4].find(id=>!used.has(id));
    if(!pid||NET.peers.length>=3)return coopReject(c,'Phòng đã đủ 4 người.');
    let archive=NET.resumeSave?.partyArchive||NET.resumeSave?.base?.partyArchive||partyArchive;
    let returning=!!known||!!archive?.[uuid];
    if(NET.locked&&!returning&&objState!=='HUB')return coopReject(c,'Người mới có thể vào khi đội về căn cứ. Người cũ có thể kết nối lại ngay.');
    if(NET.mode==='host'&&players.some(p=>!p.netLeft&&p.profileUUID===uuid&&p.playerUUID!==uuid))return coopReject(c,'Nhân vật của bạn đang được cho mượn. Hãy nhờ chủ phòng trả hồ sơ tại căn cứ.');
    return {conn:c,pid,uuid,name,profile:uuid,remote:{ptr:false,ang:0},lastPt:0,lastPtAt:0};
}
function coopPeerReady(pr){
    if(NET.mode!=='host')return;
    let old=players.find(p=>p.playerUUID===pr.uuid&&p.netLeft),profile=old?.profileUUID||pr.profile||pr.uuid;
    let p=coopMakePlayer(pr.pid,pr.uuid,pr.name,profile),saved=partyArchive[profile];
    if(objState==='HUB'){p.isDowned=false;p.hp=Math.max(p.hp,p.maxHp*.5);}
    else{
        let same=saved?.map===currentMapType&&saved.level===currentLevel&&saved.seed===(fieldWorld?.seed||null),anchor=recoveryTeamCenter();
        let point=same&&Number.isFinite(saved.x)&&Number.isFinite(saved.y)?findSafePoint(saved.x,saved.y,p.radius):findSafePoint(anchor.x+(pr.pid-2)*35,anchor.y+45,p.radius);
        p.x=point.x;p.y=point.y;p.isDowned=!!saved?.data.down;p.hp=p.isDowned?0:Math.max(1,p.hp);
    }
    while(players.length<pr.pid){let hole=new Player(players.length+1,HUB.x,HUB.y,'#777');hole.netLeft=true;hole.isDowned=true;hole.hp=0;players.push(hole);}
    players[pr.pid-1]=p;NET.playerCount=players.length;
    if(gameState==='UPGRADE')setUpgConfirmed(pr.pid,p.pendingUpgrades<=0);
    netSendTo(pr.conn,{t:'start',count:players.length,idx:pr.pid-1});
    netSendMap();netSendSync();netSendTo(pr.conn,netBuildSnapshot(true));netToast(pr.name+' đã trở lại đội.');
}
netOnGuestLost=function(entry){
    if(!entry||!NET.peers.includes(entry))return;
    let p=players[entry.pid-1];if(NET.mode==='host'&&p){coopArchivePlayer(p);p.netLeft=true;p.isDowned=true;p.hp=0;}
    NET.peers=NET.peers.filter(pr=>pr!==entry);NET.conn=NET.peers[0]?.conn||null;
    try{entry.conn.close();}catch(e){}clearPlayerUiSlot(entry.pid);
    if(!NET.mode){netUpdateLobbyUI();return;}
    drones=drones.filter(d=>d.owner!==entry.pid);slashes=slashes.filter(s=>s.source!==p);if(tank.active)tank.crew=tank.crew.filter(id=>id!==entry.pid);
    for(let a of allies)if(a.owner===p)a.owner=players[0];
    if(gameState==='UPGRADE'){setUpgConfirmed(entry.pid,true);if(players.every(q=>q.netLeft||isUpgConfirmed(q.id)))checkAndTriggerUpgrade();}
    netSendSync();netToast((entry.name||'Đồng đội')+' mất kết nối. Hồ sơ được giữ; phòng vẫn mở để vào lại.');
};
function coopAssignProfile(pid,id){
    if(NET.role!=='host'||(NET.locked&&objState!=='HUB'))return false;
    let pr=NET.peers.find(p=>p.pid===pid);if(!pr)return false;
    let source=NET.resumeSave?.partyArchive||NET.resumeSave?.base?.partyArchive||partyArchive;
    if(id&&(!validPlayerUUID(id)||!source[id]))return false;
    id=id||pr.uuid;
    if(id===(NET.resumeSave?.hostUUID||players[0]?.profileUUID)||NET.peers.some(p=>p!==pr&&(p.profile||p.uuid)===id))return false;
    if(NET.locked){coopArchivePlayer(players[pid-1]);let p=coopMakePlayer(pid,pr.uuid,pr.name,id);p.isDowned=false;p.hp=Math.max(1,p.hp);players[pid-1]=p;netSendMap();netSendSync();saveCheckpoint(true);}
    pr.profile=id;renderBasePanel();renderCoopLobbyProfiles();return true;
}
function coopProfileHTML(){
    if(NET.role!=='host')return '';
    let archive=NET.resumeSave?.partyArchive||NET.resumeSave?.base?.partyArchive||partyArchive;
    let html='<section class="coop-profiles"><b>HỒ SƠ ĐỒNG ĐỘI</b><p>Người cũ nhận lại nhân vật theo trình duyệt. Chủ phòng chọn hồ sơ mới hoặc cho mượn nhân vật đang nghỉ.</p>';
    for(let pr of NET.peers){let id=pr.profile||pr.uuid;html+=`<label>${escapeGameText(pr.name)} <select onchange="coopAssignProfile(${pr.pid},this.value)"><option value="">${archive[pr.uuid]?'Nhân vật của bạn':'Nhân vật mới'}</option>`;
        for(let r of Object.values(archive)){if(r.uuid===pr.uuid||r.uuid===(NET.resumeSave?.hostUUID||players[0]?.profileUUID)||NET.peers.some(e=>e!==pr&&(e.profile||e.uuid)===r.uuid))continue;html+=`<option value="${r.uuid}" ${id===r.uuid?'selected':''}>Mượn ${escapeGameText(r.name)} · cấp ${r.data.level||1}</option>`;}
        html+='</select></label>';}
    let active=new Set(players.filter(p=>!p.netLeft).map(p=>p.profileUUID));html+='<p>Đang nghỉ: '+(Object.values(archive).filter(r=>!active.has(r.uuid)).map(r=>escapeGameText(r.name)).join(', ')||'Không có')+'</p></section>';return html;
}
function renderCoopLobbyProfiles(){let el=document.getElementById('netProfileBox');if(el)el.innerHTML=coopProfileHTML();}
const coopLobbyUpdate=netUpdateLobbyUI;
netUpdateLobbyUI=function(){NET.lobbyNames=coopLobbyNames();coopLobbyUpdate();renderCoopLobbyProfiles();};
const coopOpenLobby=netOpenLobby;
netOpenLobby=function(){coopOpenLobby();let el=document.getElementById('netPlayerName');try{if(el)el.value=cleanPlayerName(localStorage.getItem('zs_player_name_v1'));}catch(e){}let b=document.getElementById('netResumeBtn');if(b)b.style.display=readSave()?.online?'block':'none';};
const coopBasePanel=renderBasePanel;
renderBasePanel=function(){coopBasePanel();if(objState==='HUB'&&NET.mode==='host'){let el=document.getElementById('baseItems');if(el)el.innerHTML+=coopProfileHTML();}};
const coopNetData=netOnData;
netOnData=function(d,peer){
    if(d?.t==='identity_reject'&&NET.role==='guest'){netTeardown();netLobbyReset();netSetStatus(String(d.reason||'Không thể nhận hồ sơ.'));return;}
    if(d?.t==='lobby'&&NET.role==='guest')NET.lobbyNames=d.names||{};
    return coopNetData(d,peer);
};
const coopApplySync=netApplySync;
netApplySync=function(m){
    if(NET.mode==='guest'&&Array.isArray(m?.pl)){
        let count=Math.min(4,m.pl.length);while(players.length<count){let id=players.length+1,p=new Player(id,HUB.x,HUB.y,playerColorOf(id));p.netLeft=true;p.isDowned=true;p.hp=0;players.push(p);}
        NET.playerCount=Math.max(NET.playerCount,count);
    }
    return coopApplySync(m);
};
const coopPlayerArt=drawPlayerEntity;
drawPlayerEntity=function(p,...args){coopPlayerArt(p,...args);if(p.playerName)outlinedText(p.playerName,p.x,p.y-66,p.color,'bold 11px Segoe UI',3);};
