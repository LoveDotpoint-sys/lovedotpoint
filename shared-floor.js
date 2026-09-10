// Shared live floor: all waiters see every table/order, only assigned waiter can edit.
(function(){
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let waiterDirectory={};
  let sessionMeta={};

  function minsSince(v){return v?Math.max(0,Math.floor((Date.now()-new Date(v).getTime())/60000)):0}
  function elapsed(v){const m=minsSince(v);if(m<60)return `${m} Min`;const h=Math.floor(m/60),r=m%60;return r?`${h}h ${r}m`:`${h}h`}
  function getSession(t){return sessions.find(s=>String(s.id)===String(t.active_session_id))||sessionMeta[String(t.active_session_id)]||null}
  function waiterName(t,s){return waiterDirectory[String(t.assigned_waiter_id)]||t.staff_profiles?.name||s?.staff_profiles?.name||'Assigned waiter'}

  async function hydrateLiveMeta(){
    if(!me)return;
    const occupied=tables.filter(t=>t.status==='occupied');
    if(!occupied.length)return;
    try{
      const [{data:dir},{data:ss}]=await Promise.all([
        sb.rpc('live_waiter_directory'),
        sb.from('table_sessions').select('id,waiter_id,started_at,status').in('id',occupied.map(t=>t.active_session_id).filter(Boolean))
      ]);
      waiterDirectory={};(dir||[]).forEach(w=>waiterDirectory[String(w.id)]=w.name);
      sessionMeta={};(ss||[]).forEach(s=>sessionMeta[String(s.id)]=s);
      occupied.forEach(t=>{
        const card=document.querySelector(`.tablecard[data-table-no="${t.table_no}"]`);if(!card)return;
        const s=getSession(t);const name=waiterName(t,s);
        const wn=card.querySelector('.shared-waiter-name');if(wn)wn.textContent=name;
        const tm=card.querySelector('.shared-live-time');if(tm&&s?.started_at){tm.dataset.start=s.started_at;tm.textContent='⏱ '+elapsed(s.started_at)}
      });
    }catch(e){console.warn('Live floor metadata refresh failed',e)}
  }

  async function openSharedTable(no){
    const t=tables.find(x=>x.table_no===no); if(!t)return;
    if(t.status==='available')return openTable(no);
    if(t.assigned_waiter_id===me.id)return openTable(no);
    return viewSharedTable(no);
  }
  window.openSharedTable=openSharedTable;

  window.viewSharedTable=async function(no){
    const t=tables.find(x=>x.table_no===no);if(!t||t.status!=='occupied'||!t.active_session_id)return toast('Table is available.');
    await hydrateLiveMeta();
    const s=getSession(t);
    const {data,error}=await sb.from('order_items').select('*').eq('session_id',t.active_session_id).order('created_at');if(error)return toast(error.message);
    const order=data||[], total=order.reduce((a,b)=>a+Number(b.unit_price)*b.qty,0);
    const started=s?.started_at?new Date(s.started_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}):'-';
    const duration=s?.started_at?elapsed(s.started_at):'-';
    const name=waiterName(t,s);
    document.getElementById('modalbox').innerHTML=`<div class="shared-order-head"><div><div class="eyebrow">VIEW ONLY · ANOTHER WAITER'S TABLE</div><h2>Table ${no} · Live Order</h2><div class="note">Waiter: <b>${esc(name)}</b> · Started ${started} · ⏱ ${duration}</div></div><button class="btn ghost" onclick="closeModal()">Close</button></div><div class="owner-order-list">${order.length?order.map((i,idx)=>`<div class="owner-order-row"><span>${idx+1}</span><div><b>${esc(i.item_name)}</b>${i.note?`<small>${esc(i.note)}</small>`:''}</div><div>${i.qty} × ${money(i.unit_price)}</div><b>${money(Number(i.unit_price)*i.qty)}</b></div>`).join(''):'<div class="empty-order">No items added yet.</div>'}</div><div class="owner-total"><span>Current Total</span><b>${money(total)}</b></div><div class="shared-lock-note">🔒 Read only — sirf ${esc(name)} is order ko change, bill ya finish kar sakte hain.</div>`;
    document.getElementById('modal').classList.remove('hidden');
  };

  const baseTableHtml=window.tableHtml;
  window.tableHtml=function(){
    if(!me||me.role==='owner')return baseTableHtml();
    const html=`<div class="tablegrid">${tables.map(t=>{const mine=t.assigned_waiter_id===me.id,occupied=t.status==='occupied',s=occupied?getSession(t):null,name=occupied?waiterName(t,s):'Tap to assign';const timer=occupied?`<div class="table-duration shared-live-time" data-start="${s?.started_at||''}">⏱ ${s?.started_at?elapsed(s.started_at):'Loading...'}</div>`:'';const lock=occupied&&!mine?'<div class="shared-view-badge">VIEW ONLY · Tap to see order</div>':mine?'<div class="mine-edit-badge">YOUR TABLE · Full Control</div>':'';return `<button data-table-no="${t.table_no}" class="tablecard ${occupied?'occupied':''} ${mine?'mine':'shared-table'}" onclick="openSharedTable(${t.table_no})"><span class="status">${occupied?'Occupied':'Available'}</span><div class="tn">Table ${t.table_no}</div><div class="meta">Capacity: ${esc(t.capacity_label||'-')}<br>${occupied?`Waiter: <span class="shared-waiter-name">${esc(name)}</span>`:name}</div>${timer}${lock}</button>`}).join('')}</div>`;
    setTimeout(hydrateLiveMeta,0);return html;
  };

  window.renderTables=function(){document.getElementById('main').innerHTML=head(me.role==='owner'?'Live Tables':'Live Table Floor',me.role==='waiter'?'Sabhi tables aur live orders visible hain. Aap sirf apne assigned table ka order change kar sakte hain.':'All live tables and waiter activity.')+tableHtml();setTimeout(hydrateLiveMeta,0)};

  setInterval(()=>{
    document.querySelectorAll('.shared-live-time[data-start]').forEach(el=>{if(el.dataset.start)el.textContent='⏱ '+elapsed(el.dataset.start)});
  },1000);
})();
