// Smart Ops enhancement: display-only operational intelligence. No order/payment mutation logic is changed.
(function(){
  function escOps(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function activeFor(t){return (window.sessions||[]).find(s=>s.status==='active'&&(String(s.id)===String(t.active_session_id)||String(s.table_id)===String(t.id)))||null}
  function ageMin(t){const s=activeFor(t);return s?.started_at?Math.max(0,Math.floor((Date.now()-new Date(s.started_at).getTime())/60000)):0}
  function level(m){return m>=40?'critical':m>=20?'attention':'normal'}
  function smartSummary(){
    if(!window.me||!Array.isArray(window.tables))return '';
    const occupied=tables.filter(t=>t.status==='occupied'),available=tables.filter(t=>t.status==='available');
    const long=occupied.filter(t=>ageMin(t)>=40),attention=occupied.filter(t=>ageMin(t)>=20&&ageMin(t)<40);
    const title=me.role==='owner'?'Live Operations':'My Shift Snapshot';
    const desc=me.role==='owner'?'Automatic table-time monitoring. No order data is changed by these alerts.':'Live floor status for faster table service.';
    return `<section class="smart-ops"><div class="smart-ops-head"><div><div class="eyebrow">SMART POS · LIVE</div><h3>${title}</h3><small>${desc}</small></div><span class="smart-live-dot">● LIVE</span></div><div class="smart-kpis"><div><b>${occupied.length}</b><span>Occupied</span></div><div><b>${available.length}</b><span>Available</span></div><div><b>${attention.length}</b><span>20–39 Min</span></div><div class="${long.length?'danger':''}"><b>${long.length}</b><span>40+ Min</span></div></div>${long.length?`<div class="smart-alert"><b>Needs Attention</b><span>${long.map(t=>`Table ${t.table_no} · ${ageMin(t)} Min`).join(' &nbsp;•&nbsp; ')}</span></div>`:''}</section>`;
  }
  function decorateCards(){
    document.querySelectorAll('.tablecard[data-table-no]').forEach(card=>{const no=Number(card.dataset.tableNo),t=tables.find(x=>x.table_no===no);if(!t||t.status!=='occupied')return;const m=ageMin(t),lv=level(m);card.classList.remove('smart-normal','smart-attention','smart-critical');card.classList.add('smart-'+lv);let b=card.querySelector('.smart-time-status');if(!b){b=document.createElement('div');b.className='smart-time-status';card.appendChild(b)}b.textContent=lv==='critical'?'LONG RUNNING · '+m+' MIN':lv==='attention'?'ATTENTION · '+m+' MIN':'NORMAL · '+m+' MIN';});
  }
  function inject(){const main=document.getElementById('main');if(!main||!me||!Array.isArray(tables))return;const isFloor=(window.view==='tables')||!!main.querySelector('.tablegrid');if(!isFloor)return;let box=main.querySelector('.smart-ops');if(!box){const grid=main.querySelector('.tablegrid');if(grid)grid.insertAdjacentHTML('beforebegin',smartSummary())}else{const fresh=document.createElement('div');fresh.innerHTML=smartSummary();if(fresh.firstElementChild)box.replaceWith(fresh.firstElementChild)}decorateCards()}
  document.addEventListener('click',()=>setTimeout(inject,80));
  setInterval(inject,5000);
  setTimeout(inject,500);
})();