// Shared live floor: all waiters see every table/order, only assigned waiter can edit.
(function(){
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function waiterName(t,s){return t.staff_profiles?.name||s?.staff_profiles?.name||'Assigned waiter'}
  async function openSharedTable(no){
    const t=tables.find(x=>x.table_no===no); if(!t)return;
    if(t.status==='available')return openTable(no);
    if(t.assigned_waiter_id===me.id)return openTable(no);
    return viewSharedTable(no);
  }
  window.openSharedTable=openSharedTable;
  window.viewSharedTable=async function(no){
    const t=tables.find(x=>x.table_no===no);if(!t||t.status!=='occupied'||!t.active_session_id)return toast('Table is available.');
    const s=sessions.find(x=>x.id===t.active_session_id);
    const {data,error}=await sb.from('order_items').select('*').eq('session_id',t.active_session_id).order('created_at');if(error)return toast(error.message);
    const order=data||[], total=order.reduce((a,b)=>a+Number(b.unit_price)*b.qty,0);
    const started=s?.started_at?new Date(s.started_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}):'-';
    const duration=s?.started_at?durationText(s.started_at):'-';
    document.getElementById('modalbox').innerHTML=`<div class="shared-order-head"><div><div class="eyebrow">VIEW ONLY · ANOTHER WAITER'S TABLE</div><h2>Table ${no} · Live Order</h2><div class="note">Waiter: <b>${esc(waiterName(t,s))}</b> · Started ${started} · ⏱ ${duration}</div></div><button class="btn ghost" onclick="closeModal()">Close</button></div><div class="owner-order-list">${order.length?order.map((i,idx)=>`<div class="owner-order-row"><span>${idx+1}</span><div><b>${esc(i.item_name)}</b>${i.note?`<small>${esc(i.note)}</small>`:''}</div><div>${i.qty} × ${money(i.unit_price)}</div><b>${money(Number(i.unit_price)*i.qty)}</b></div>`).join(''):'<div class="empty-order">No items added yet.</div>'}</div><div class="owner-total"><span>Current Total</span><b>${money(total)}</b></div><div class="shared-lock-note">🔒 Read only — sirf ${esc(waiterName(t,s))} is order ko change, bill ya finish kar sakte hain.</div>`;
    document.getElementById('modal').classList.remove('hidden');
  };
  const baseTableHtml=window.tableHtml;
  window.tableHtml=function(){
    if(!me||me.role==='owner')return baseTableHtml();
    return `<div class="tablegrid">${tables.map(t=>{const mine=t.assigned_waiter_id===me.id,s=t.status==='occupied'?sessionForTable(t):null;const name=t.status==='occupied'?waiterName(t,s):'Tap to assign';const timer=t.status==='occupied'&&s?.started_at?`<div class="table-duration" data-start="${s.started_at}">⏱ ${durationText(s.started_at)}</div>`:'';const lock=t.status==='occupied'&&!mine?'<div class="shared-view-badge">VIEW ONLY · Tap to see order</div>':mine?'<div class="mine-edit-badge">YOUR TABLE · Full Control</div>':'';return `<button class="tablecard ${t.status==='occupied'?'occupied':''} ${mine?'mine':'shared-table'}" onclick="openSharedTable(${t.table_no})"><span class="status">${t.status==='occupied'?'Occupied':'Available'}</span><div class="tn">Table ${t.table_no}</div><div class="meta">Capacity: ${esc(t.capacity_label||'-')}<br>${t.status==='occupied'?'Waiter: '+esc(name):name}</div>${timer}${lock}</button>`}).join('')}</div>`
  };
  window.renderTables=function(){document.getElementById('main').innerHTML=head(me.role==='owner'?'Live Tables':'Live Table Floor',me.role==='waiter'?'Sabhi tables aur live orders visible hain. Aap sirf apne assigned table ka order change kar sakte hain.':'All live tables and waiter activity.')+tableHtml()};
})();
