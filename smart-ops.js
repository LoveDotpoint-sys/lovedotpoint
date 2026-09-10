// Smart Ops enhancement: operational intelligence only. No order/payment mutation logic is changed here.
(function(){
  function activeFor(t){return sessions.find(s=>s.status==='active'&&(String(s.id)===String(t.active_session_id)||String(s.table_id)===String(t.id)))||null}
  function ageMin(t){const s=activeFor(t);return s?.started_at?Math.max(0,Math.floor((Date.now()-new Date(s.started_at).getTime())/60000)):0}
  function level(m){return m>=40?'critical':m>=20?'attention':'normal'}
  function myPriority(){
    if(!me||me.role!=='waiter')return '';
    const mine=tables.filter(t=>t.status==='occupied'&&String(t.assigned_waiter_id)===String(me.id)).map(t=>({t,m:ageMin(t)})).sort((a,b)=>b.m-a.m);
    if(!mine.length)return '<div class="smart-priority empty"><b>No active table assigned</b><span>Available table par tap karke service start karein.</span></div>';
    const top=mine.slice(0,3);
    return `<div class="smart-priority"><div class="smart-priority-title"><b>My Priority</b><span>Oldest table first</span></div>${top.map(x=>`<button onclick="openSharedTable(${x.t.table_no})"><b>Table ${x.t.table_no}</b><span>${x.m>=40?'Long Running':x.m>=20?'Needs Attention':'In Service'} · ${x.m} Min</span><strong>Open →</strong></button>`).join('')}</div>`;
  }
  function smartSummary(){
    if(!me||!Array.isArray(tables))return '';
    const occupied=tables.filter(t=>t.status==='occupied'),available=tables.filter(t=>t.status==='available');
    const long=occupied.filter(t=>ageMin(t)>=40),attention=occupied.filter(t=>ageMin(t)>=20&&ageMin(t)<40);
    const title=me.role==='owner'?'Live Operations':'Shift Snapshot';
    const desc=me.role==='owner'?'Automatic table-time monitoring for faster floor control.':'Live floor status and your service priority.';
    return `<section class="smart-ops"><div class="smart-ops-head"><div><div class="eyebrow">SMART POS · LIVE</div><h3>${title}</h3><small>${desc}</small></div><span class="smart-live-dot">● LIVE</span></div><div class="smart-kpis"><div><b>${occupied.length}</b><span>Occupied</span></div><div><b>${available.length}</b><span>Available</span></div><div><b>${attention.length}</b><span>20–39 Min</span></div><div class="${long.length?'danger':''}"><b>${long.length}</b><span>40+ Min</span></div></div>${long.length?`<div class="smart-alert"><b>Needs Attention</b><span>${long.map(t=>`Table ${t.table_no} · ${ageMin(t)} Min`).join(' &nbsp;•&nbsp; ')}</span></div>`:''}${myPriority()}</section>`;
  }
  function decorateCards(){
    document.querySelectorAll('.tablecard[data-table-no]').forEach(card=>{const no=Number(card.dataset.tableNo),t=tables.find(x=>x.table_no===no);if(!t||t.status!=='occupied')return;const m=ageMin(t),lv=level(m);card.classList.remove('smart-normal','smart-attention','smart-critical');card.classList.add('smart-'+lv);let b=card.querySelector('.smart-time-status');if(!b){b=document.createElement('div');b.className='smart-time-status';card.appendChild(b)}b.textContent=lv==='critical'?'LONG RUNNING · '+m+' MIN':lv==='attention'?'ATTENTION · '+m+' MIN':'NORMAL · '+m+' MIN';});
  }
  function inject(){
    const main=document.getElementById('main');if(!main||!me||!Array.isArray(tables))return;
    const isFloor=(view==='tables')||!!main.querySelector('.tablegrid');if(!isFloor)return;
    let box=main.querySelector('.smart-ops');
    if(!box){const grid=main.querySelector('.tablegrid');if(grid)grid.insertAdjacentHTML('beforebegin',smartSummary())}
    else{const fresh=document.createElement('div');fresh.innerHTML=smartSummary();if(fresh.firstElementChild)box.replaceWith(fresh.firstElementChild)}
    decorateCards();
  }
  function networkBanner(){
    let el=document.getElementById('posNetworkState');
    if(navigator.onLine){if(el)el.remove();return}
    if(el)return;
    el=document.createElement('div');el.id='posNetworkState';el.className='pos-network-offline';el.innerHTML='<b>Connection Offline</b><span>Internet wapas aane tak billing/order action avoid karein.</span>';
    document.body.appendChild(el);
  }
  window.addEventListener('online',()=>{networkBanner();toast('Internet connection restored')});
  window.addEventListener('offline',()=>{networkBanner();toast('Internet connection offline')});
  document.addEventListener('click',()=>setTimeout(inject,80));
  setInterval(inject,5000);
  setTimeout(()=>{inject();networkBanner()},500);
})();