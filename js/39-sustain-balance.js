// One recovery budget per character, shared by every repeatable healing source.
let combatDamageContext=null;
function incomingContext(opts={}) {
    return {...(combatDamageContext||{}),...opts};
}
function withDamageContext(opts,fn) {
    let prev=combatDamageContext;combatDamageContext=incomingContext(opts);
    try{return fn();}finally{combatDamageContext=prev;}
}
function bossAttackMult(opts={}) {
    let hit=incomingContext(opts);
    return hit.boss?(hit.heavy?1.8:1.2):1;
}
function bossHazardContext(h) {
    let boss=!!h.boss||!!h.bz||['hrock','hspin','hboulder','hsweep','zthrow','railbeam','lancefall','plunge','beam','quad','acidbomb','venomring','d_arc','d_scythe','d_moon'].includes(h.type);
    let heavy=boss&&!!(h.telegraphed||['rock','slam','artillery','strike','quake','emp','hrock','hspin','hboulder','hsweep','zthrow','railbeam','lancefall','plunge','beam','quad','acidbomb','venomring','d_arc','d_scythe'].includes(h.type));
    return {boss,heavy};
}
function recoveryBudget(p) {
    let t=p._recoveryClock||0, rates={all:.06,blood:.04,heal:.04,shield:.04};
    if(!p._recovery)p._recovery={t,all:.06,blood:.04,heal:.04,shield:.04};
    let b=p._recovery,elapsed=Math.max(0,t-b.t),trauma=p.woundT>0?.25:1;
    for(let key of Object.keys(rates))b[key]=Math.min(rates[key]*trauma,b[key]+elapsed*rates[key]*trauma);
    b.t=t;return b;
}
function claimRecovery(p,amount,kind) {
    let b=recoveryBudget(p),gain=Math.max(0,Math.min(amount,b.all*p.maxHp,b[kind]*p.maxHp));
    b.all-=gain/p.maxHp;b[kind]-=gain/p.maxHp;return gain;
}
function gainVirtualHp(p,amount,opts={}) {
    if(p.isDowned||p.netLeft||!(amount>0))return 0;
    p.vHp=Math.max(0,Math.min(p.getMaxVHp(),p.vHp||0));
    let gain=Math.min(amount,p.getMaxVHp()-p.vHp);
    if(!opts.grant)gain=claimRecovery(p,gain,'shield');
    p.vHp+=gain;return gain;
}
function gainHealing(p,amount,opts={}) {
    if(p.isDowned||p.netLeft||!(amount>0))return 0;
    let scaled=amount*HEALING_MULT*((p.tags['HỒI MÁU']||0)>=2?1.2:1);
    let gain=Math.min(Math.max(0,p.maxHp-p.hp),scaled);
    if(!opts.consumable)gain=claimRecovery(p,gain,'heal');
    p.hp+=gain;
    if(gain>.05){createParticles(p.x,p.y,'#2ecc71',3,70);if(opts.consumable)Sound.play('heal');}
    if(!opts.shared&&(p.tags['TRỢ GIÚP']||0)>=3&&!isSinglePlayer)for(let q of players){
        if(q!==p&&!q.netLeft&&!q.isDowned&&Math.hypot(q.x-p.x,q.y-p.y)<320)
            gainHealing(q,scaled*.25/HEALING_MULT,{shared:true});
    }
    return gain;
}
function gainLifesteal(p,amount) {
    if(p.isDowned||p.netLeft||!(amount>0))return 0;
    let hm=p.tags['HÚT MÁU']||0,m=HEALING_MULT;
    if(hm>=2)m*=1.15;
    if(hm>=4&&p.hp<p.maxHp*.5)m*=1.25;
    if(p.perks.ls_thirst)m*=1+.2*Math.max(0,1-p.hp/p.maxHp);
    if((p.tags['HỒI MÁU']||0)>=2)m*=1.1;
    let total=amount*m,toHp=Math.min(total,Math.max(0,p.maxHp-p.hp));
    let conv=p.perks.ls_overheal?.35:hm>=4?.25:0;
    let toShield=Math.min(Math.max(0,p.getMaxVHp()-(p.vHp||0)),Math.max(0,total-toHp)*conv);
    let allowed=claimRecovery(p,toHp+toShield,'blood'),healed=Math.min(toHp,allowed);
    p.hp+=healed;p.vHp=Math.min(p.getMaxVHp(),(p.vHp||0)+Math.max(0,allowed-healed));
    if(healed>.5&&!(p._lsFxT>survivalTime)){p._lsFxT=survivalTime+.2;createParticles(p.x,p.y,'#b93645',3,70);}
    return healed;
}
const balancedPlayerUpdate=Player.prototype.update;
Player.prototype.update=function(dt){
    if(NET.mode!=='guest'){
        // Refill before decrementing trauma, so a long frame cannot erase the penalty.
        this._recoveryClock=(this._recoveryClock||0)+dt;recoveryBudget(this);
        this.woundT=Math.max(0,(this.woundT||0)-dt);
        this.vHp=Math.max(0,Math.min(this.getMaxVHp(),this.vHp||0));
        this.tempShield=Math.min(2,this.tempShield||0);
    }
    return balancedPlayerUpdate.call(this,dt);
};
const balancedSpecial=updateSpecialZombie;
updateSpecialZombie=function(z,...args){
    if(!isBossType(z.type))return balancedSpecial(z,...args);
    return withDamageContext({boss:true,heavy:!!z.isCharging},()=>{
        let hi=hazards.length,fi=fireZones.length;
        let value=balancedSpecial(z,...args);
        for(let i=hi;i<hazards.length;i++){
            // Hucker chains/boulders store the actual boss here to follow his position.
            let h=hazards[i];h.boss=h.boss||true;h.telegraphed=!!h.telegraphed||h.timer>0;
        }
        for(let i=fi;i<fireZones.length;i++)fireZones[i].boss=true;
        return value;
    });
};
const balancedEnemyBullet=EnemyBullet.prototype.update;
EnemyBullet.prototype.update=function(dt){return withDamageContext(this.bossContext||{},()=>balancedEnemyBullet.call(this,dt));};
const balancedStatus=applyStatus;
applyStatus=function(target,id,opts={}){
    let s=balancedStatus(target,id,opts);
    if(s&&(opts.boss||combatDamageContext?.boss))s.boss=true;
    return s;
};
const ambientAcidHurt=acidHurt;
acidHurt=function(p,amount,opts={}){
    let hit=incomingContext(opts);
    if(!hit.boss)return ambientAcidHurt(p,amount);
    if(!p||p.netLeft||p.isDowned||inTank(p)||!(amount>0))return;
    if(acidGunUpgraded(p))amount*=.2;
    p.takeDot(amount,{boss:true});
};
const woundEncode=netEncodePlayer,woundDecode=netDecodePlayer;
netEncodePlayer=function(p){let e=woundEncode(p);e.push(Math.round((p.woundT||0)*10));return e;};
netDecodePlayer=function(p,e,local){woundDecode(p,e,local);p.woundT=(e[33]||0)/10;};

// Descriptions are updated at the source of the shared upgrade/wiki UI.
const sustainDescriptions={
    e_giapNangLuong:'Mỗi 5 giây nhận 1 khiên, tối đa 2. Khiên chặn đòn thường; chiêu nặng boss vẫn xuyên qua và chỉ được giảm 40% sát thương.',
    ls_fang:'Hút máu theo sát thương (cận chiến mạnh hơn); Liềm +15% hiệu quả. Chịu giới hạn hồi phục chung.',
    ls_overheal:'Hút máu dư chuyển 35% thành Máu Ảo; tăng trần thêm 15% máu tối đa. Đầu màn nhận 10% Máu Ảo.',
    ls_thirst:'Máu thấp: tăng tối đa 35% tốc chạy, 20% hút máu; hạ quái hút thêm 1 máu.',
    ls_feast:'Hạ quái đặc biệt: hút 3 máu và nhận 5 Máu Ảo; đồng đội trong 320 đơn vị hút 2 máu và nhận 5 Máu Ảo. Chịu giới hạn chung.',
    sc_soul:'Liềm: tăng tỉ lệ tạo Tế Phẩm từ 6% lên 16%; +20% Máu Ảo từ Tế Phẩm, chịu giới hạn hồi phục.',
    sc_reap:'Liềm: +25% tầm chém; mỗi mạng hồi 1 độ bền, hút thêm 2 máu và nhận 2 Máu Ảo.',
    df_plate:'+35 máu tối đa và giảm 10% sát thương nhận.',
    df_thorns:'Giảm thêm 10% sát thương tầm gần; phản sát thương và đẩy lùi kẻ địch áp sát.',
    df_bastion:'Gần đồng đội/lính/công trình: giảm 10% sát thương, +18% sát thương gây ra. Cửa Chắn và Nhà Chính +25% máu.',
    df_aegis:'Sau 6 giây không trúng đòn, hồi 1,5% máu tối đa/giây thành Máu Ảo, tới 20%. Các nguồn tái tạo chỉ lấy mức mạnh nhất.',
    df_unbreakable:'Đòn thường ngoài boss không lấy quá 45% máu tối đa; vỡ Máu Ảo hoặc dưới 40% máu gây choáng quanh mình (hồi 6s).',
    vh_reservoir:'Tăng trần Máu Ảo thêm 15% máu tối đa.',
    vh_harvest:'Hạ địch nhận 1% máu tối đa thành Máu Ảo, hồi 1 giây; không kích hoạt từ Tế Phẩm.',
    vh_recovery:'Sau 6 giây không trúng đòn, hồi 1% máu tối đa/giây thành Máu Ảo tới 15%; không cộng dồn tốc độ tái tạo.',
    dr_veil:'Khi có Máu Ảo, giảm thêm 6% sát thương nhận.',
    dr_laststand:'Khi máu thật còn tối đa 35%, giảm thêm 10% sát thương.',
    dr_aftershock:'Khi Máu Ảo vỡ, giảm thêm 10% sát thương trong 4 giây; hồi 12 giây.'
};
for(let u of UPGRADES)if(sustainDescriptions[u.id])u.desc=sustainDescriptions[u.id];
WIKI_TAGS['HÚT MÁU']='2: mọi đòn hút máu, hiệu quả +15%. 4: dưới 50% máu hút x1,25; dư chuyển 25% thành Máu Ảo. 5: +15% trần Máu Ảo, +25% sát thương khi có Máu Ảo, huyết quang hồi 2s. Hút tối đa 4% máu/giây, giảm 75% trong 4s sau trúng đòn.';
WIKI_TAGS['PHÒNG THỦ']='2: giảm 8% sát thương, +15 máu tối đa. 4: giảm 16%, kháng choáng; sau 6s an toàn hồi Máu Ảo tới 10%. 5: giảm 22%, xung phản chấn. Tổng giảm sát thương tối đa 60%; với boss 45%, chiêu nặng 30% và xuyên 40% Máu Ảo.';
WIKI_TAGS['HỒI MÁU']='2: hiệu quả hồi máu +20%, hút máu +10%. 4: sau 6s không bị đánh, tự hồi 0,4% máu/giây trước hệ số hồi phục. Các nguồn hồi lặp lại và Máu Ảo dùng chung giới hạn 6% máu/giây; trúng đòn giảm 75% trong 4s. Vật phẩm hồi phục không chịu giới hạn này.';

WIKI_TAGS['KIẾM SƯ']=WIKI_TAGS['KIẾM SƯ'].replace('80% phản đòn','55% phản đòn')+' Phản đòn tối đa 15% với boss; không chặn ngẫu nhiên chiêu nặng có báo trước.';
WIKI_TAGS['MAY MẮN']='2: cứ 30 mạng có 25% rơi Hộp Cứu Thương. 4: né ngẫu nhiên 20% đòn thường, 8% đòn boss; không né ngẫu nhiên chiêu nặng có báo trước.';
WIKI_TAGS['TRỢ GIÚP']='1: cứu nhanh hơn 30%. 2: người được cứu nhận 2 khiên. 3: chia 25% hồi máu cho đồng đội trong 320 đơn vị, vẫn chịu giới hạn hồi phục riêng.';
if(WIKI_TAGS['DONG_MINH'])WIKI_TAGS['DONG_MINH']=WIKI_TAGS['DONG_MINH'].replace('15% sát thương','8% sát thương');
WIKI_TAGS['CHỈ SỐ']='2/4: +8/15% sát thương. 4: giảm 6% sát thương nhận.';
WIKI_TAGS['ĐẶC BIỆT']='2: giảm 10% sát thương nhận.';
const balancedLoadPlayer=restorePlayer;
restorePlayer=function(...args){let p=balancedLoadPlayer(...args);if(p)p.vHp=Math.min(p.getMaxVHp(),p.vHp||0);return p;};
