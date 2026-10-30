const {test}=require('node:test'),assert=require('node:assert/strict');
const {game}=require('./defense-lifesteal.test.cjs');
function party(){let g=game();g.run(`gameState='PLAYING';objState='HUB';runMode='online';NET.mode=NET.role='host';NET.locked=true;NET.playerCount=4;NET.peers=[2,3,4].map(pid=>({pid,uuid:'guest_uuid_'+pid,name:'Bạn '+pid,profile:'guest_uuid_'+pid,remote:{},conn:{open:true,send(){},close(){}}}));players=Array.from({length:4},(_,i)=>new Player(i+1,2000,2100,'#fff'));coopInitNewParty();`);return g;}
test('device UUID is stable, names are sanitized, and only host writes co-op checkpoints',()=>{
 const {run}=party();assert.equal(run('localPlayerUUID()'),run('localPlayerUUID()'));run(`players[2].weapon={...WEAPON_TYPES.AR};players[2].weapon.mag=12;players[2].level=9;players[2].vHp=42;players[2].tags['PHÒNG THỦ']=3;saveCheckpoint(true)`);
 assert.equal(run('readSave().online&&readSave().partyRoster.length===4'),true);assert.equal(run(`readSave().partyArchive['guest_uuid_3'].data.vhp`),42);
 run(`NET.mode='guest';shopScrap=999;saveCheckpoint(true)`);assert.notEqual(run('readSave().scrap'),999);
 assert.equal(run(`cleanPlayerName('<Anh>\u0001')`),'Anh');
});
test('resume restores each UUID despite a changed join order; absent profiles keep their progress',()=>{
 const {run}=party();run(`players[1].level=7;players[2].level=11;players[2].vHp=55;players[2].weapon={...WEAPON_TYPES.SMG};saveCheckpoint(true);let saved=readSave();NET.peers=[{pid:2,uuid:'guest_uuid_3',name:'Đổi tên',profile:'guest_uuid_3'}];NET.playerCount=4;coopRestoreLineup(saved)`);
 assert.equal(run('players[1].level'),11);assert.equal(run('players[1].vHp'),55);assert.equal(run('players[1].weapon.key'),'SMG');assert.equal(run(`partyArchive['guest_uuid_2'].data.level`),7);
 assert.equal(run('players.length===4&&players[2].netLeft&&players[3].netLeft'),true);
});
test('host can resume alone with resting profiles, and a retreat cannot skip scheduled defense for a story route',()=>{
 const {run}=party();run(`saveCheckpoint(true);NET.resumeSave=readSave();NET.mode=null;NET.locked=false;NET.peers=[];netStartGame()`);
 assert.equal(run('NET.mode===\'host\'&&objState===\'HUB\'&&players.filter(p=>p.netLeft).length===3'),true);
 run(`currentLevel=5;campaignQueued=true;story.bolt=1;players[0].pendingUpgrades=0;continueAfterShop()`);assert.equal(run('currentLevel'),5);assert.equal(run('objState'),'BASE_DEF');
});
test('disconnect archives before downing the placeholder and keeps an empty host room open',()=>{
 const {run}=party();run(`players[1].hp=67;players[1].vHp=33;for(let pr of NET.peers.slice())netOnGuestLost(pr)`);
 assert.equal(run('NET.mode'),'host');assert.equal(run('NET.locked'),true);assert.equal(run(`partyArchive['guest_uuid_2'].data.hp`),67);assert.equal(run(`partyArchive['guest_uuid_2'].data.vhp`),33);assert.equal(run('players[1].netLeft&&players[1].hp===0'),true);
 run(`let pr={pid:2,uuid:'guest_uuid_2',name:'Quay lại',profile:'guest_uuid_2',conn:{open:true,send(){}}};NET.peers=[pr];coopPeerReady(pr)`);assert.equal(run('players[1].hp'),67);assert.equal(run('players[1].vHp'),33);
});
test('host can loan a resting character; guest cannot assign profiles or overwrite the original owner',()=>{
 const {run}=party();run(`players[2].level=13;netOnGuestLost(NET.peers.find(p=>p.pid===3));let pr=NET.peers[0];let ok=coopAssignProfile(2,'guest_uuid_3')`);assert.equal(run('ok'),true);assert.equal(run('players[1].level'),13);assert.equal(run('players[1].playerUUID'),'guest_uuid_2');
 run(`players[1].level=14;coopArchiveAll();NET.mode='guest'`);assert.equal(run(`coopAssignProfile(2,'guest_uuid_4')`),false);assert.equal(run(`partyArchive['guest_uuid_3'].data.level`),14);
});
test('reconnect after the team changes maps uses a safe point near the current team',()=>{
 const {run}=party();run(`objState='KILL';currentMapType=2;currentLevel=8;setWorldSize(8000);players[1].x=7000;players[1].y=7000;let pr=NET.peers[0];netOnGuestLost(pr);resetFieldWorld();currentMapType=1;currentLevel=9;NET.peers.push(pr);coopPeerReady(pr)`);
 assert.equal(run('!isBlockedPoint(players[1].x,players[1].y,players[1].radius)&&Math.hypot(players[1].x-players[0].x,players[1].y-players[0].y)<200'),true);
});
test('reconnecting during card selection restores pending choices and clears the disconnected ready flag',()=>{
 const {run}=party();run(`gameState='UPGRADE';players[0].pendingUpgrades=1;players[1].pendingUpgrades=2;upgConfirmed=[false,false,false,false];let pr=NET.peers[0];netOnGuestLost(pr);NET.peers.push(pr);coopPeerReady(pr)`);
 assert.equal(run('players[1].pendingUpgrades'),2);assert.equal(run('isUpgConfirmed(2)'),false);
});
test('duplicate identity is rejected; a known guest can rejoin a locked field, newcomers wait for camp',()=>{
 const {run}=party();run(`objState='KILL';let cb={},connection={open:true,metadata:{uuid:'new_guest_88',name:'Mới'},on(e,f){cb[e]=f},send(d){this.reply=d}};NET.peers.splice(2,1);let a=coopAcceptPeer(connection);cb.open()`);assert.equal(run('a===null&&connection.reply.t===\'identity_reject\''),true);
 run(`netOnGuestLost(NET.peers[0]);connection.metadata={uuid:'guest_uuid_2',name:'Về lại'};let b=coopAcceptPeer(connection)`);assert.equal(run('b.uuid'),'guest_uuid_2');
});
test('failed expedition loses only half newly earned scrap, reduces gear, revives at 50%, and queues next level once',()=>{
 const {run}=game();run(`gameState='PLAYING';story=newStory();currentLevel=4;objState='KILL';shopScrap=100;missionScrapEarned=0;grantScrap(40);shopScrap-=20;players[0].weapon={...WEAPON_TYPES.AR};players[0].weapon.ammo=100;players[0].weapon.mag=20;players[0].vHp=80;players[0].isDowned=true;beginEmergencyRetreat();finishEmergencyRetreat()`);
 assert.equal(run('shopScrap'),100);assert.equal(run('players[0].hp'),run('players[0].maxHp*.5'));assert.equal(run('players[0].vHp'),0);assert.equal(run('players[0].weapon.ammo'),75);assert.equal(run('currentLevel'),5);assert.equal(run('objState'),'HUB');assert.equal(run('baseDefenseNext()'),true);
 run(`players[0].pendingUpgrades=0;continueAfterShop()`);assert.equal(run('currentLevel'),5);assert.equal(run('objState'),'BASE_DEF');
});
test('retreat preserves queued level across save/load and does not apply penalties twice',()=>{
 const {run}=game();run(`gameState='PLAYING';story=newStory();objState='KILL';currentLevel=3;shopScrap=40;missionScrapEarned=40;beginEmergencyRetreat();beginEmergencyRetreat();finishEmergencyRetreat();finishEmergencyRetreat();let before=shopScrap;saveCheckpoint(true);loadGame()`);
 assert.equal(run('currentLevel'),4);assert.equal(run('campaignQueued'),true);assert.equal(run('shopScrap'),run('before'));run('advanceCampaignLevel()');assert.equal(run('currentLevel'),4);run('advanceCampaignLevel()');assert.equal(run('currentLevel'),5);
});
test('all down in defense continues; each player respawns after 12 seconds while house lives',()=>{
 const {run}=game();run(`gameState='PLAYING';story=newStory();currentLevel=5;currentMapType=16;genBaseDefense(5);baseAfterGenerate(5);players[0].isDowned=true;players[0].hp=0;base.def.breakT=100;for(let i=0;i<119;i++)updateBase(.1)`);assert.equal(run('players[0].isDowned'),true);run('updateBase(.1)');assert.equal(run('players[0].isDowned'),false);assert.equal(run('players[0].hp'),run('players[0].maxHp*.5'));assert.equal(run('gameState'),'PLAYING');
});
test('house destruction ends the run and removes its checkpoint; a broken gate stays broken',()=>{
 const {run}=game();run(`gameState='PLAYING';story=newStory();currentLevel=5;currentMapType=16;base.gate=4;genBaseDefense(5);baseAfterGenerate(5);saveCheckpoint();let gate=base.def.barriers[0];hurtBaseGate(gate,999999);base.def.houseNpc.hp=0;for(let i=0;i<30;i++)updateBase(.1)`);
 assert.equal(run('gameState'),'GAMEOVER');assert.equal(run('readSave()'),null);assert.equal(run('gate.hp'),0);
});
