let presentationQuality='auto';
try{let savedQuality=localStorage.getItem('zs_visual_quality');if(['auto','high','low'].includes(savedQuality))presentationQuality=savedQuality;}catch(e){}
function presentationLow(){return presentationQuality==='low'||(presentationQuality==='auto'&&W<900);}
function setPresentationQuality(value){if(!['auto','high','low'].includes(value))return;presentationQuality=value;try{localStorage.setItem('zs_visual_quality',value);}catch(e){}let el=document.getElementById('visualQuality');if(el)el.value=value;}

drawMiniBar=function(x,y,w,h,cur,max,color){
    let pct=Math.max(0,Math.min(1,cur/Math.max(1,max||1)));ctx.save();
    ctx.beginPath();ctx.roundRect(x-w/2,y,w,h,Math.min(3,h/2));ctx.fillStyle='rgba(25,25,25,.87)';ctx.fill();
    if(pct>0){ctx.beginPath();ctx.roundRect(x-w/2+1,y+1,Math.max(0,(w-2)*pct),Math.max(1,h-2),Math.min(2,h/2));ctx.fillStyle=color;ctx.fill();}
    ctx.strokeStyle='rgba(171,171,171,.3)';ctx.lineWidth=1;ctx.strokeRect(x-w/2+.5,y+.5,w-1,h-1);ctx.restore();
};
function hudBar(x,y,w,h,pct,color){ctx.fillStyle='#343330';ctx.fillRect(x,y,w,h);ctx.fillStyle=color;ctx.fillRect(x,y,w*Math.max(0,Math.min(1,pct)),h);}
function drawModernPlayerPanel(p,x,y,w,h,T){
    ctx.save();artBox(x,y,w,h,'rgba(30,30,30,.94)','#595754',8);artBox(x+1,y+10,3,h-20,p.color,null,1);
    ctx.textBaseline='middle';ctx.textAlign='left';ctx.fillStyle='#cfcdca';ctx.font='600 10px Segoe UI, Arial';
    ctx.fillText('MAP '+currentLevel+' / '+getMapName(),x+12,y+13,w-24);
    ctx.font='600 11px Segoe UI, Arial';ctx.fillStyle=p.isDowned?'#aca7a0':'#c0bebb';ctx.fillText(p.isDowned?'CẦN ĐỒNG ĐỘI CỨU':'THỂ LỰC',x+12,y+30);
    ctx.textAlign='right';ctx.fillStyle='#d9d7d4';ctx.fillText(Math.max(0,Math.ceil(p.hp))+' / '+Math.round(p.maxHp)+(p.vHp>=1?' +'+Math.ceil(p.vHp):''),x+w-12,y+30);
    hudBar(x+12,y+40,w-24,6,p.hp/Math.max(1,p.maxHp),p.hp<p.maxHp*.3?'#b86652':'#a2a98b');
    if(p.vHp>0)hudBar(x+12,y+40,(w-24)*Math.min(1,p.vHp/p.maxHp),2,1,'#adbfb7');
    hudBar(x+12,y+50,w-24,3,p.hunger/100,'#a6926e');hudBar(x+12,y+57,w-24,3,p.xp/getXpRequired(p.level),'#8f9b83');
    ctx.font='600 10px Segoe UI, Arial';ctx.textAlign='left';ctx.fillStyle='#b1b0ad';ctx.fillText('LV '+p.level+'   ⚙ '+shopScrap+'   ◆ '+breakthroughShards+'   ☠ '+killCount,x+12,y+h-11,w-24);
    if(p.pendingUpgrades>0){ctx.textAlign='right';ctx.fillStyle='#bab6b1';ctx.fillText('+'+p.pendingUpgrades+' THẺ',x+w-12,y+13);}
    ctx.restore();
}
drawBossHud=function(b,y,bw){
    let pct=Math.max(0,Math.min(1,b.hp/Math.max(1,b.maxHp))),x=W/2-bw/2,now=performance.now()/1000;
    let locked=b.hidden||b.invuln||(b.type===45&&typeof queenIsShielded==='function'&&queenIsShielded(b));
    let state=locked?(b.type===45?'BẢO VỆ · PHÁ XÚC TU':'LỚP BẢO VỆ'):b.exhaust>0?'KIỆT SỨC ×2':b.downed||b.mineStun>0?'LỘ ĐIỂM YẾU':b.chargeStun>0||b.stunTimer>0?'CHOÁNG':b.phase2Done?'PHA CUỒNG NỘ':'';
    ctx.save();artBox(x-10,y,bw+20,48,'rgba(29,29,29,.95)','#706f6d',7);
    ctx.font='600 11px Segoe UI, Arial';ctx.textBaseline='middle';ctx.textAlign='left';ctx.fillStyle='#a8a39b';ctx.fillText('BOSS / '+(BOSS_NAMES[b.type]||'DỊ THỂ'),x,y+13,bw*.68);
    ctx.textAlign='right';ctx.fillStyle='#ceccca';ctx.fillText(Math.ceil(pct*100)+'%',x+bw,y+13);
    let dt=Math.max(0,Math.min(.1,now-(b._artTime??now)));b._artTime=now;
    b._artTrail=Math.max(pct,(b._artTrail??pct)-dt*.35);hudBar(x,y+28,bw,9,b._artTrail,'#797875');hudBar(x,y+28,bw,9,pct,locked?'#807e7c':'#a65b49');
    for(let ph of BOSS_PHASES[b.type]||[])artLine([[x+bw*ph,y+26],[x+bw*ph,y+39]],'#3e3d3b',2);
    if(state){ctx.font='600 8px Segoe UI, Arial';ctx.textAlign='center';ctx.fillStyle='#bbb9b6';ctx.fillText(state,W/2,y+42);}
    let used=55,c=bossCast,age=c?now-c.at/1000:10;
    if(c&&age<1.9){ctx.font='600 12px Segoe UI, Arial';ctx.textAlign='center';ctx.fillStyle='#b7b3ac';ctx.fillText(c.text,W/2,y+65,bw);used+=25;}
    ctx.restore();return used;
};

const interfaceSupplyHud=drawSupplyHud;
drawSupplyHud=function(){interfaceSupplyHud();let el=document.getElementById('supplyHud');if(el){let mates=NET.mode?Math.max(0,players.length-1):0;el.style.top=((H<480?78:88)+20+mates*20)+'px';}
    let pause=document.getElementById('pauseBtn');if(pause){let touch=showTouchUI&&soloControls();pause.style.top=touch?'106px':'';pause.style.bottom=touch?'auto':'';}
};

drawHubTasks=function(){
    if(objState!=='HUB')return;
    let compact=W>H&&H<500,w=compact?Math.max(220,Math.min(380,W-440)):Math.min(W-20,395),x=compact?(W-w)/2:10,y=compact?50:(W<640?154:108),fs=compact?9:11;
    ctx.save();ctx.font='500 '+fs+'px Segoe UI, Arial';
    let lines=hubTaskLines().flatMap(([text,color])=>storyWrap(text,w-24).map(text=>[text,color])),h=33+lines.length*(fs+6);
    artBox(x,y,w,h,'rgba(30,30,30,.95)','#5c5b58',7);ctx.textAlign='left';ctx.textBaseline='middle';ctx.font='600 10px Segoe UI, Arial';ctx.fillStyle='#aaa59e';ctx.fillText('TRẠM CHỈ HUY / NHIỆM VỤ',x+12,y+15);
    ctx.font='500 '+fs+'px Segoe UI, Arial';lines.forEach(([text,color],i)=>{ctx.fillStyle=color==='#ff4757'?'#d3927a':i===0?'#ceccca':'#adacaa';ctx.fillText(text,x+12,y+34+i*(fs+6),w-24);});ctx.restore();
};

// Cards retain the original purchase/selection handlers, with keyboard equivalents.
function keyboardCards(nodes,selected=false){for(let el of nodes){if(typeof el.setAttribute!=='function')continue;el.setAttribute('role',selected?'option':'button');el.tabIndex=0;if(!el.dataset.keyboardReady){el.dataset.keyboardReady='1';el.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target===el){e.preventDefault();el.click();}});}}}
const interfaceCards=renderCards;
renderCards=function(...args){let r=interfaceCards(...args);let box=document.getElementById(args[1]);if(box?.querySelectorAll){box.setAttribute?.('role','listbox');box.setAttribute?.('aria-label','Thẻ nâng cấp người chơi '+args[0]);let cards=box.querySelectorAll('.upg-card');keyboardCards(cards,true);cards.forEach((card,i)=>{card.setAttribute('aria-selected','false');if(card.dataset){card.dataset.index=String(i+1).padStart(2,'0');card.dataset.kind=card.classList.contains('border-purple-600')?'exclusive':card.classList.contains('border-amber-500')?'breakthrough':'standard';}});}return r;};
function syncUpgradePresentation(){let root=document.getElementById('upgradeScreen'),a=document.getElementById('p1Half'),b=document.getElementById('p2Half');if(root&&a&&b)root.classList.toggle('one-half',a.style.display==='none'||b.style.display==='none');}
const interfaceUpgrade=triggerUpgradeScreen;
triggerUpgradeScreen=function(...args){let r=interfaceUpgrade(...args);syncUpgradePresentation();return r;};
const interfaceSync=netApplySync;
netApplySync=function(...args){let r=interfaceSync(...args);syncUpgradePresentation();return r;};
const interfaceSelectCard=selectCard;
selectCard=function(pid,id,index,...rest){let r=interfaceSelectCard(pid,id,index,...rest),slot=upgDomSlot(pid),box=document.getElementById('p'+slot+'Cards');if(box?.querySelectorAll)for(let card of box.querySelectorAll('.upg-card'))card.setAttribute('aria-selected',String(card.id==='p'+slot+'Card'+index));return r;};
const interfaceRoute=selectRoute;
selectRoute=function(route){let r=interfaceRoute(route);for(let el of document.querySelectorAll('#routeList [onclick]'))el.setAttribute('aria-pressed',String((el.getAttribute('onclick')||'').includes("'"+route+"'")));return r;};

function initializePresentationUI(){
    if(typeof HTMLElement==='undefined')return;
    setPresentationQuality(presentationQuality);
    keyboardCards(document.querySelectorAll('#routeList [onclick]'));
    const modalIds=['onlineModal','guideModal','confirmDialog','exclusiveWarningDialog'];
    let activeModal=null,previousFocus=null,queued=false;
    function refreshDialogs(){
        queued=false;
        let visible=null;
        for(let id of modalIds){let el=document.getElementById(id);if(!el)continue;let open=getComputedStyle(el).display!=='none';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-hidden',String(!open));
            let heading=el.querySelector('h2,h3,[id=confirmTitle]');if(heading){if(!heading.id)heading.id=id+'Heading';el.setAttribute('aria-labelledby',heading.id);}else el.setAttribute('aria-label',id==='exclusiveWarningDialog'?'Cảnh báo độc tôn':'Xác nhận');if(open)visible=el;
        }
        if(visible!==activeModal){if(visible){previousFocus=document.activeElement;let first=visible.querySelector('input,button:not([disabled]),[tabindex="0"]');if(first)first.focus({preventScroll:true});}else if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});activeModal=visible;}
    }
    let observer=new MutationObserver(()=>{if(!queued){queued=true;requestAnimationFrame(refreshDialogs);}});
    for(let id of modalIds){let el=document.getElementById(id);if(el)observer.observe(el,{attributes:true,attributeFilter:['style','class']});}
    window.addEventListener('keydown',e=>{
        if(e.key==='Escape'&&activeModal?.id==='guideModal'){e.preventDefault();e.stopImmediatePropagation();toggleGuideModal(false);}
        else if(e.key==='Escape'&&activeModal?.id==='onlineModal'){e.preventDefault();e.stopImmediatePropagation();netCloseLobby();}
        if(e.key==='Tab'&&activeModal){let items=[...activeModal.querySelectorAll('button:not([disabled]),input,select,a[href],[tabindex="0"]')].filter(el=>el.offsetParent!==null);if(!items.length)return;let first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
    },true);
    refreshDialogs();
}
initializePresentationUI();
