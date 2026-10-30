// Perk flags and their numeric cooldowns use the existing save/network perk payload.
UPGRADES.push(
    {id:'vh_reservoir',type:'Phòng thủ',name:'Huyết Nang',desc:'Tăng giới hạn Máu Ảo thêm 35% máu tối đa.',tags:['PHÒNG THỦ','HÚT MÁU']},
    {id:'vh_harvest',type:'Sinh tồn',name:'Thu Gom Sinh Lực',desc:'Hạ địch nhận 2% máu tối đa thành Máu Ảo. Hồi 0,4 giây; Tế Phẩm không kích hoạt.',tags:['HÚT MÁU','TIẾN CÔNG']},
    {id:'vh_recovery',type:'Phòng thủ',name:'Màng Máu Tái Sinh',desc:'Sau 5 giây không nhận sát thương, hồi 3% máu tối đa thành Máu Ảo mỗi giây, tới 25%. Cộng với Lá Chắn Tái Tạo.',tags:['PHÒNG THỦ','HỒI MÁU']},
    {id:'dr_veil',type:'Phòng thủ',name:'Da Kết Huyết',desc:'Khi còn Máu Ảo, giảm thêm 12% sát thương nhận, kể cả sát thương theo thời gian.',tags:['PHÒNG THỦ','HÚT MÁU']},
    {id:'dr_laststand',type:'Sinh tồn',name:'Cầm Cự',desc:'Khi máu thật còn tối đa 35%, giảm thêm 20% sát thương nhận.',tags:['PHÒNG THỦ','CHỈ SỐ']},
    {id:'dr_aftershock',type:'Phòng thủ',name:'Dư Chấn Huyết Giáp',desc:'Khi Máu Ảo bị phá vỡ, giảm thêm 20% sát thương trong 4 giây tiếp theo. Hồi 12 giây.',tags:['PHÒNG THỦ','HÚT MÁU']}
);
function resilienceShieldBreak(p,hadShield){
    if(NET.mode==='guest'||!hadShield||p.vHp>0||p.hp<=0||!p.perks.dr_aftershock||p.perks.rhBreakCD>0)return;
    p.perks.rhBreakT=4;p.perks.rhBreakCD=12;
    spawnRing(p.x,p.y,'#b5a8a1',p.radius+30,.35,2);
}
function resilienceTick(p,dt){
    if(NET.mode==='guest')return;
    for(let key of ['rhBreakT','rhBreakCD','rhHarvestCD'])if(p.perks[key]>0)p.perks[key]=Math.max(0,p.perks[key]-dt);
}
function restoredAmmoCapacity(saved){
    let def=WEAPON_TYPES[saved.k],value=Number.isFinite(saved.m)&&saved.m>0?saved.m:def.maxAmmo;
    let old={PISTOL:50,SMG:240,AR:120,SHOTGUN:50,SNIPER:20,GLAUNCHER:8}[saved.k];
    // Keep ammo perks/admin capacity multipliers, but never refill rounds by loading a save.
    return old&&saved.bv!==2&&Number.isFinite(saved.m)&&saved.m>0?Math.round(value*def.maxAmmo/old):value;
}
