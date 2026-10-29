const {test}=require('node:test');
const assert=require('node:assert/strict');
const {game}=require('./defense-lifesteal.test.cjs');
function lab(){let g=game();g.run(`gameState='PLAYING';currentMapType=15;story.lab={stage:'breach'};enterProceduralLab();`);return g;}
test('random labs have connected room graph, three filters and two bunkers',()=>{
    const {run}=game();
    for(let i=0;i<40;i++){
        assert.equal(run(`(()=>{let D=makeLabLayout(),seen=new Set([7]);for(let pass=0;pass<9;pass++)for(let d of D.doors){if(seen.has(d.a))seen.add(d.b);if(seen.has(d.b))seen.add(d.a);}return seen.size===9&&D.rooms.filter(r=>r.kind==='filter').length===3&&D.rooms.filter(r=>r.kind==='bunker').length===2;})()`),true);
    }
});
test('gas begins after 180 seconds and stops when all filters are active',()=>{
    const {run}=lab();run('let D=labDungeon();D.elapsed=179;D.waveT=999;zombies=[];');
    run('tickProceduralLab(.5,D)');assert.equal(run('story.lab.gas'),0);
    run('tickProceduralLab(.6,D)');assert.equal(run('story.lab.gas'),1);
    assert.ok(run('players[0].labWeak')>0);
    run(`story.props.filter(p=>p.kind==='machine').forEach(p=>p.on=true);tickProceduralLab(.1,D)`);
    assert.equal(run('story.lab.gas'),0);
});
test('hack interruption preserves checkpoint; ownership, distance and replay are checked',()=>{
    const {run}=lab();
    run(`let D=labDungeon(),d=D.doors[0],p=players[0];d.type='secure';d.open=false;d.puzzle=2;p.x=d.cx-70;p.y=d.cy;labCommand(1,'start',d.id);labCommand(1,'solve',d.id,d.sequence[0],0);`);
    assert.equal(run('d.step'),1);
    run(`labCommand(1,'solve',d.id,d.sequence[0],0)`);assert.equal(run('d.step'),1);
    run('p.takeDamage(1)');assert.ok(run('d.ambush')>0);assert.equal(run('d.step'),1);assert.equal(run('d.owner'),0);
    run(`zombies=[];tickProceduralLab(.1,D);labCommand(1,'start',d.id);labCommand(1,'solve',d.id,d.sequence[1],1);labCommand(1,'solve',d.id,d.sequence[2],2);`);
    assert.equal(run('d.open'),true);
});
test('normal doors open in two seconds and keycards open secure doors',()=>{
    const {run}=lab();run(`let D=labDungeon(),d=D.doors[0],p=players[0];d.type='normal';d.open=false;p.x=d.cx-70;p.y=d.cy;zombies=[];tickProceduralLab(1,D)`);
    assert.equal(run('d.open'),false);run('tickProceduralLab(1,D)');assert.equal(run('d.open'),true);
    run(`d.open=false;d.type='secure';D.keys=1;labCommand(1,'key',d.id)`);assert.equal(run('D.keys'),0);assert.equal(run('d.open'),true);
});
test('exclusive Lab zombie death creates acid lasting six seconds',()=>{
    const {run}=lab();
    run(`let D=labDungeon();let z=new Zombie(1500,1500,0);z.type=53;z.hp=0;zombieDown(z,players[0]);`);
    assert.equal(run('D.acid.length'),1);assert.equal(run('D.acid[0].life'),6);
});
test('cart roster assigns 1/2/3/4 players to the specified roles',()=>{
    const {run}=game();
    for(let n=1;n<=4;n++){
        run(`players=Array.from({length:${n}},(_,i)=>new Player(i+1,0,0,'#fff'));gameState='PLAYING';startMinecart()`);
        assert.equal(run('cartRun.carts.length'),Math.ceil(n/2));
        assert.equal(run('cartRun.carts[0].spotter'),n>1?2:0);
        if(n>2)assert.equal(run('cartRun.carts[1].spotter'),n===4?4:0);
    }
});
test('only drivers steer; navigators ping/fire; disconnect transfers the wheel',()=>{
    const {run}=game();run(`players=[new Player(1,0,0,'#fff'),new Player(2,0,0,'#fff')];gameState='PLAYING';startMinecart();cartRun.stage='race';let c=cartRun.carts[0];cartCommand(2,'steer',1);`);
    assert.equal(run('c.lane'),1);run(`cartCommand(1,'steer',1)`);assert.equal(run('c.lane'),2);
    run(`cartCommand(1,'ping',0)`);assert.equal(run('c.ping'),-1);
    run(`cartCommand(2,'ping',0)`);assert.equal(run('c.ping'),0);
    run('players[0].netLeft=true;tickMinecart(.1)');assert.equal(run('c.driver'),2);assert.equal(run('c.spotter'),0);
});
test('cart hazards apply distinct penalties and surviving course completes',()=>{
    const {run}=game();run(`gameState='PLAYING';startMinecart();cartRun.stage='race';let c=cartRun.carts[0];cartHit(c,'collapse')`);
    assert.equal(run('c.hp'),70);assert.equal(run('c.stun'),1.5);
    run(`cartHit(c,'fall')`);assert.equal(run('c.slow'),2);
    run(`c.distance=51.99;c.stun=0;c.slow=0;c.ants=0;tickMinecart(.02)`);
    assert.equal(run('cartRun.win'),true);assert.equal(run('queenSlain'),true);
});

test('ambient gas allows hacking, circuit and frequency puzzles complete',()=>{
    const {run}=lab();run(`let D=labDungeon(),d=D.doors[0],p=players[0];zombies=[];D.elapsed=181;D.waveT=999;d.type='secure';d.open=false;d.puzzle=0;p.x=d.cx-70;p.y=d.cy;labCommand(1,'start',d.id);tickProceduralLab(.1,D);`);
    assert.equal(run('d.owner'),1);
    run(`for(let s=0;s<3;s++){while(d.turns[s]!==d.target[s])labCommand(1,'solve',d.id,s,s);labCommand(1,'solve',d.id,3,s);}`);
    assert.equal(run('d.open'),true);
    run(`d.open=false;d.step=0;d.puzzle=1;labCommand(1,'start',d.id);for(let s=0;s<3;s++){d.phase=.5;labCommand(1,'solve',d.id,0,s);}`);
    assert.equal(run('d.open'),true);
});

test('host authenticates peer roles and expedition state round trips to guest',()=>{
    const host=lab(),guest=game();
    host.run(`NET.mode='host';players.push(new Player(2,0,0,'#fff'),new Player(3,0,0,'#fff'),new Player(4,0,0,'#fff'));let D=labDungeon(),d=D.doors[0];d.type='secure';d.open=false;players[2].x=d.cx-70;players[2].y=d.cy;netOnData({t:'labcmd',action:'start',id:d.id,pid:1},{pid:3});`);
    assert.equal(host.run('d.owner'),3);
    let snapshot=host.run('JSON.stringify(storyNetState())');
    guest.run(`currentMapType=15;NET.mode='guest';storyNetApply(${snapshot})`);
    assert.equal(guest.run('labDungeon().doors[0].owner'),3);
    host.run(`NET.peers=[{pid:1}];for(let z of zombies){z.x=players[0].x+50;z.y=players[0].y+50;}`);
    snapshot=host.run('JSON.stringify(netBuildSnapshot(true))');
    guest.run(`netApplySnapshot(${snapshot})`);
    assert.ok(guest.run('zombies.some(z=>z.type>=52&&z.type<=54)'));
    assert.equal(guest.run('zombies.every(z=>Number.isFinite(z.radius)&&Number.isFinite(z.baseSpeed))'),true);
    host.run(`currentMapType=14;startMinecart();cartRun.stage='race';netOnData({t:'cartcmd',action:'steer',value:1,pid:3},{pid:4});`);
    assert.equal(host.run('cartRun.carts[1].lane'),1);
    host.run(`netOnData({t:'cartcmd',action:'steer',value:1},{pid:3});netOnData({t:'cartcmd',action:'ping',value:2},{pid:4});`);
    snapshot=host.run('JSON.stringify(storyNetState())');
    guest.run(`currentMapType=14;storyNetApply(${snapshot})`);
    assert.equal(guest.run('cartRun.carts[1].lane'),2);
    assert.equal(guest.run('cartRun.carts[1].ping'),2);
    guest.run('storyNetApply({})');assert.equal(guest.run('cartRun'),null);
});

test('breach waits for all living players and train opens without killing Hucker',()=>{
    const {run}=game();run(`gameState='PLAYING';currentMapType=15;players.push(new Player(2,0,0,'#fff'));story.lab={stage:'breach'};players[0].x=LAB.doorS.x;players[0].y=LAB.doorS.y;updateLab(1.1)`);
    assert.equal(run('story.lab.stage'),'breach');
    run(`players[1].isDowned=true;updateLab(1.1)`);assert.equal(run('story.lab.stage'),'explore');
    run(`labStartStation();story.lab.hold=.01;updateLab(.02)`);
    assert.equal(run('story.lab.stage'),'board');assert.equal(run('zombies.some(z=>z.type===37&&z.hp>0)'),true);
});
