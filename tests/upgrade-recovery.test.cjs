const {test}=require('node:test');
const assert=require('node:assert/strict');
const {game}=require('./defense-lifesteal.test.cjs');

test('P3/P4 clients get fresh choices for each upgrade round',()=>{
    for(let pid of [3,4]){
        const {run}=game();
        run(`players=Array.from({length:4},(_,i)=>new Player(i+1,0,0,'#fff')); NET.mode='guest';NET.localIdx=${pid-1};
            let renders=0;renderCards=()=>renders++;gameState='UPGRADE';NET.upgradeRound=1;upgConfirmed=[true,true,true,true];
            let packet={gs:'UPGRADE',round:2,lvl:5,pl:players.map(p=>({pend:p.id===${pid}?2:0,lvl:1})),cf:[1,1,0,0]};netApplySync(packet);`);
        assert.equal(run(`isUpgConfirmed(${pid})`),false);
        assert.equal(run('renders'),1);
        run('netApplySync(packet)');assert.equal(run('renders'),1);
        run(`setUpgConfirmed(${pid},true);packet.round=3;netApplySync(packet)`);
        assert.equal(run('renders'),2);
        assert.equal(run(`isUpgConfirmed(${pid})`),false);
    }
});
test('quick fix skips pending choices for four players and advances only once',()=>{
    const {run}=game();
    run(`players=Array.from({length:4},(_,i)=>new Player(i+1,0,0,'#fff'));players.forEach(p=>p.pendingUpgrades=2);
        gameState='UPGRADE';NET.mode='host';upgradeRound=9;let starts=0;startLevel=()=>{starts++;gameState='PLAYING'};
        netOnData({t:'force_ready',round:9},{pid:4});`);
    assert.equal(run('starts'),1);assert.equal(run('currentLevel'),6);
    assert.equal(run('players.every(p=>p.pendingUpgrades===0)'),true);
    run(`netOnData({t:'force_ready',round:9},{pid:3});forceReadyAllUpgrades()`);
    assert.equal(run('starts'),1);
});
test('old recovery requests cannot skip a later upgrade round',()=>{
    const {run}=game();
    run(`gameState='UPGRADE';NET.mode='host';upgradeRound=3;players[0].pendingUpgrades=1;
        netOnData({t:'force_ready',round:2},{pid:2});`);
    assert.equal(run('players[0].pendingUpgrades'),1);assert.equal(run('gameState'),'UPGRADE');
});
