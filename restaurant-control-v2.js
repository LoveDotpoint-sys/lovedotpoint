// Restaurant Control V2: owner-only transfer + daily closing summary. Existing order/billing item edits remain unchanged.
(function(){
  function escV2(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

  async function getWaiters(){
    const {data,error}=await sb.rpc('live_waiter_directory');
    if(error)throw error;
    return data||[];
  }

  window.ownerTransferTablePrompt=async function(sessionId,tableNo){
    if(me?.role!=='owner')return toast('Owner access required');
    const t=tables.find(x=>x.table_no===tableNo),current=String(t?.assigned_waiter_id||'');
    let waiters=[];try{waiters=(await getWaiters()).filter(w=>String(w.id)!==current)}catch(e){return toast(e.message)}
    if(!waiters.length)return toast('No other active waiter available');
    document.getElementById('modalbox').innerHTML=`<div class="eyebrow">OWNER CONTROL · AUDITED ACTION</div><h2>Transfer Table ${tableNo}</h2><div class="note">Current live order, items, notes and running time same rahenge. Sirf assigned waiter change hoga aur transfer audit save hoga.</div><div class="formrow"><label class="v2-label">Transfer To</label><select id="transferWaiter" class="field">${waiters.map(w=>`<option value="${w.id}">${escV2(w.name)}</option>`).join('')}</select></div><div class="formrow"><label class="v2-label">Reason (optional)</label><input id="transferReason" class="field" placeholder="e.g. Shift change / section handover"></div><div class="bill-actions"><button class="btn ghost" onclick="viewSharedTable(${tableNo})">Cancel</button><button class="btn" onclick="ownerTransferTable('${sessionId}',${tableNo})">Transfer Table</button></div>`;
    document.getElementById('modal').classList.remove('hidden');
  };

  window.ownerTransferTable=async function(sessionId,tableNo){
    if(me?.role!=='owner')return toast('Owner access required');
    const to=document.getElementById('transferWaiter')?.value,reason=(document.getElementById('transferReason')?.value||'').trim();
    if(!to)return toast('Select waiter');
    if(!confirm(`Transfer Table ${tableNo} to selected waiter?`))return;
    const {error}=await sb.rpc('owner_transfer_table',{p_session_id:sessionId,p_to_waiter_id:to,p_reason:reason||null});
    if(error)return toast(error.message);
    closeModal();await refreshAll();view='tables';renderNav();render();toast(`Table ${tableNo} transferred successfully`);
  };

  async function dailyData(){
    const now=new Date(),start=new Date(now);start.setHours(0,0,0,0);const end=new Date(start);end.setDate(end.getDate()+1);
    const {data,error}=await sb.from('table_sessions').select('id,status,total_amount,payment_mode,finished_at,voided,void_reason,staff_profiles:waiter_id(name),restaurant_tables(table_no)').gte('started_at',start.toISOString()).lt('started_at',end.toISOString()).order('started_at',{ascending:false});
    if(error)throw error;
    let transfers=[];try{const q=await sb.from('table_transfer_audit').select('id,transferred_at').gte('transferred_at',start.toISOString()).lt('transferred_at',end.toISOString());transfers=q.data||[]}catch(e){}
    return {rows:data||[],transfers};
  }

  window.ownerDailyClosing=async function(){
    if(me?.role!=='owner')return toast('Owner access required');
    document.getElementById('modalbox').innerHTML='<h2>Daily Closing</h2><div class="note">Loading today summary...</div>';
    document.getElementById('modal').classList.remove('hidden');
    let d;try{d=await dailyData()}catch(e){return toast(e.message)}
    const finished=d.rows.filter(x=>x.status==='finished'&&!x.voided),voided=d.rows.filter(x=>x.voided),active=d.rows.filter(x=>x.status==='active'&&!x.voided),sales=finished.reduce((a,b)=>a+Number(b.total_amount||0),0),cash=finished.filter(x=>(x.payment_mode||'').toLowerCase()==='cash').reduce((a,b)=>a+Number(b.total_amount||0),0),upi=finished.filter(x=>(x.payment_mode||'').toLowerCase()==='upi').reduce((a,b)=>a+Number(b.total_amount||0),0);
    const waiter={};finished.forEach(x=>{const n=x.staff_profiles?.name||'Unknown';waiter[n]=(waiter[n]||0)+Number(x.total_amount||0)});
    const waiterRows=Object.entries(waiter).sort((a,b)=>b[1]-a[1]);
    document.getElementById('modalbox').innerHTML=`<div class="v2-closing-head"><div><div class="eyebrow">OWNER · DAILY CLOSING</div><h2>${new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</h2><div class="note">Operational closing summary. No data is modified from this screen.</div></div><button class="btn ghost" onclick="closeModal()">Close</button></div><div class="v2-close-grid"><div><span>Net Sales</span><b>${money(sales)}</b></div><div><span>Completed Bills</span><b>${finished.length}</b></div><div><span>Cash</span><b>${money(cash)}</b></div><div><span>UPI</span><b>${money(upi)}</b></div><div><span>Active Tables</span><b>${active.length}</b></div><div><span>Voids / Force Close</span><b>${voided.length}</b></div><div><span>Table Transfers</span><b>${d.transfers.length}</b></div><div><span>Collection Check</span><b>${money(cash+upi)}</b></div></div><div class="v2-section"><div class="panel-title"><h3>Waiter-wise Sales</h3><span>Today</span></div>${waiterRows.length?waiterRows.map(([n,v])=>`<div class="v2-row"><span>${escV2(n)}</span><b>${money(v)}</b></div>`).join(''):'<div class="note">No completed bills today.</div>'}</div>${active.length?'<div class="v2-warning"><b>Closing Attention</b><span>Active tables abhi open hain. Final closing se pehle Live Floor check karein.</span></div>':'<div class="v2-ok"><b>Floor Clear</b><span>No active table in today summary.</span></div>'}`;
  };

  function injectDashboardAction(){
    if(!me||me.role!=='owner'||view!=='dashboard')return;
    const actions=document.querySelector('.dash-actions');if(actions&&!document.getElementById('dailyClosingBtn'))actions.insertAdjacentHTML('beforeend','<button id="dailyClosingBtn" onclick="ownerDailyClosing()"><b>Daily Closing</b><span>Cash / UPI / voids / transfers →</span></button>');
  }

  const baseView=window.viewSharedTable;
  if(typeof baseView==='function')window.viewSharedTable=async function(no){
    await baseView(no);
    if(me?.role!=='owner')return;
    const t=tables.find(x=>x.table_no===no);if(!t||t.status!=='occupied'||!t.active_session_id)return;
    const actions=document.querySelector('#modalbox .bill-actions');
    if(actions&&!document.getElementById('transferTableBtn'))actions.insertAdjacentHTML('afterbegin',`<button id="transferTableBtn" class="btn ghost" onclick="ownerTransferTablePrompt('${t.active_session_id}',${no})">Transfer Waiter</button>`);
  };

  const baseDashboard=window.renderDashboard;
  if(typeof baseDashboard==='function')window.renderDashboard=async function(){await baseDashboard();setTimeout(injectDashboardAction,0)};
  document.addEventListener('click',()=>setTimeout(injectDashboardAction,100));
})();