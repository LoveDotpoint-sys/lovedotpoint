// Waiter operations upgrade: summary, service status, order timing and quick note presets.
(function(){
  function minsSince(v){return v?Math.max(0,Math.floor((Date.now()-new Date(v).getTime())/60000)):0}
  function fmtDuration(v){const m=minsSince(v);if(m<60)return m+' Min';const h=Math.floor(m/60),r=m%60;return r?`${h}h ${r}m`:`${h}h`}
  function statusFor(v){const m=minsSince(v);if(m<20)return {label:'Normal',cls:'normal'};if(m<40)return {label:'Attention',cls:'attention'};return {label:'Long Running',cls:'long'} }
  function activeSessionFor(t){return sessions.find(s=>s.status==='active'&&(s.id===t.active_session_id||s.table_id===t.id))}
  function todayFinishedMine(){const d=new Date().toDateString();return sessions.filter(s=>s.status==='finished'&&s.waiter_id===me.id&&s.finished_at&&new Date(s.finished_at).toDateString()===d)}
  function enhanceWaiterTables(){
    if(!me||me.role!=='waiter'||view!=='tables')return;
    const main=document.getElementById('main'); if(!main)return;
    const mine=tables.filter(t=>t.status==='occupied'&&t.assigned_waiter_id===me.id);
    const available=tables.filter(t=>t.status==='available');
    const done=todayFinishedMine();
    const sales=done.reduce((a,s)=>a+Number(s.total_amount||0),0);
    const durations=done.filter(s=>s.started_at&&s.finished_at).map(s=>Math.max(0,(new Date(s.finished_at)-new Date(s.started_at))/60000));
    const avg=durations.length?Math.round(durations.reduce((a,b)=>a+b,0)/durations.length):0;
    const summary=`<section class="waiter-welcome"><div><small>WAITER WORKSPACE</small><h2>Welcome, ${me.name}</h2><p>Manage your assigned tables and orders from one place.</p></div></section><div class="waiter-kpis"><div><span>My Active Tables</span><b>${mine.length}</b></div><div><span>Available Tables</span><b>${available.length}</b></div><div><span>Today Served</span><b>${done.length}</b></div><div><span>My Sales Today</span><b>${money(sales)}</b></div><div><span>Avg. Table Time</span><b>${avg} Min</b></div></div>`;
    if(!main.querySelector('.waiter-welcome'))main.insertAdjacentHTML('afterbegin',summary);
    main.querySelectorAll('.tablecard').forEach(card=>{
      const txt=card.querySelector('.tn')?.textContent||''; const no=Number((txt.match(/\d+/)||[])[0]); const t=tables.find(x=>x.table_no===no); if(!t||t.status!=='occupied')return;
      const s=activeSessionFor(t); if(!s?.started_at)return; const st=statusFor(s.started_at);
      let box=card.querySelector('.service-status');
      if(!box){box=document.createElement('div');box.className='service-status';card.appendChild(box)}
      box.className='service-status '+st.cls; box.dataset.start=s.started_at; box.innerHTML=`<strong>⏱ ${fmtDuration(s.started_at)}</strong><span>${st.label}</span>`;
    })
  }
  function enhanceOrderHeader(){
    if(!me||me.role!=='waiter'||view!=='menu'||!selectedSession)return;
    const main=document.getElementById('main'); if(!main)return; const s=sessions.find(x=>x.id===selectedSession); if(!s?.started_at)return;
    const head=main.querySelector('.order-page-head>div'); if(!head)return;
    let row=head.querySelector('.order-running-info'); if(!row){row=document.createElement('div');row.className='order-running-info';head.appendChild(row)}
    const st=statusFor(s.started_at); row.dataset.start=s.started_at; row.innerHTML=`<span>Started ${new Date(s.started_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</span><b class="${st.cls}">⏱ ${fmtDuration(s.started_at)} · ${st.label}</b>`;
  }
  window.quickNote=async function(id,note){const {error}=await sb.from('order_items').update({note,updated_at:new Date().toISOString()}).eq('id',id);if(error)return toast(error.message);await refreshAll();renderMenu()}
  const oldNote=window.noteItem;
  window.noteItem=function(id,old){
    const presets=['Less Spicy','Medium Spicy','No Onion','No Garlic','Less Salt'];
    document.getElementById('modalbox').innerHTML=`<div class="quick-note-modal"><h2>Special Note</h2><div class="note">Common instruction select karein ya custom note likhein.</div><div class="note-presets">${presets.map(x=>`<button class="btn ghost" onclick="quickNote('${id}','${x}')">${x}</button>`).join('')}</div><textarea id="customItemNote" class="field" rows="3" placeholder="Custom note...">${(old||'').replaceAll('<','&lt;')}</textarea><div class="bill-actions"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" onclick="quickNote('${id}',document.getElementById('customItemNote').value.trim())">Save Note</button></div></div>`;
    document.getElementById('modal').classList.remove('hidden');
  };
  function tick(){
    document.querySelectorAll('.service-status[data-start]').forEach(el=>{const st=statusFor(el.dataset.start);el.className='service-status '+st.cls;el.innerHTML=`<strong>⏱ ${fmtDuration(el.dataset.start)}</strong><span>${st.label}</span>`});
    document.querySelectorAll('.order-running-info[data-start]').forEach(el=>{const st=statusFor(el.dataset.start);const started=new Date(el.dataset.start).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});el.innerHTML=`<span>Started ${started}</span><b class="${st.cls}">⏱ ${fmtDuration(el.dataset.start)} · ${st.label}</b>`})
  }
  function sync(){enhanceWaiterTables();enhanceOrderHeader();tick()}
  document.addEventListener('DOMContentLoaded',sync);document.addEventListener('click',()=>setTimeout(sync,80));setInterval(sync,1000);
})();
