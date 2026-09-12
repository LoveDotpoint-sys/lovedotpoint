/* Love Dot Point POS - Cashier Console
   Dedicated read-only billing desk with live print queue and waiter reports.
*/
(function(){
  'use strict';

  const baseBoot=window.boot;
  const baseNavs=window.navs;
  const baseRender=window.render;
  const baseGo=window.go;
  let cashierChannel=null;
  let lastPendingCount=0;

  function roleLabel(role){return role==='owner'?'Owner':role==='cashier'?'Cashier':'Waiter'}
  function safe(v){return typeof esc==='function'?esc(v):String(v??'').replace(/[&<>"']/g,'')}
  function tableLabel(b){const arr=Array.isArray(b.joined_table_nos)?b.joined_table_nos.filter(Boolean):[];return arr.length?arr.join(' + '):(b.table_no||'-')}
  function isToday(v){if(!v)return false;return new Date(v).toDateString()===new Date().toDateString()}

  async function rpc(name,args={}){
    const {data,error}=await sb.rpc(name,args);
    if(error)throw error;
    return data;
  }

  async function admin(body){
    const {data,error}=await sb.functions.invoke('pos-admin',{body});
    if(error)throw error;
    if(data?.error)throw new Error(data.error);
    return data||{};
  }

  window.boot=async function(){
    const {data:{user}}=await sb.auth.getUser();
    if(!user)return;
    const {data,error}=await sb.from('staff_profiles').select('*').eq('auth_user_id',user.id).single();
    if(error||!data){toast('Staff profile not linked');return}
    if(data.role!=='cashier')return baseBoot();

    me=data;
    document.getElementById('loginView').classList.add('hidden');
    document.getElementById('appView').classList.remove('hidden');
    document.getElementById('who').textContent=me.name+' · Cashier';
    view='cashierqueue';
    selectedTable=null;selectedSession=null;items=[];
    renderNav();
    await renderCashierQueue();
    subscribeCashier();
  };

  window.navs=function(){
    if(me?.role==='cashier')return [['cashierqueue','Print Queue'],['cashierreports','Reports']];
    const list=baseNavs();
    if(me?.role==='owner'&&!list.some(x=>x[0]==='cashiersetup')){
      const copy=list.slice();
      const pos=Math.max(0,copy.findIndex(x=>x[0]==='history'));
      copy.splice(pos,0,['cashiersetup','Cashier']);
      return copy;
    }
    return list;
  };

  window.go=function(v){
    if(me?.role==='cashier'){
      if(!['cashierqueue','cashierreports'].includes(v))v='cashierqueue';
      view=v;renderNav();return v==='cashierreports'?renderCashierReports():renderCashierQueue();
    }
    if(me?.role==='owner'&&v==='cashiersetup'){view=v;renderNav();return renderCashierSetup()}
    return baseGo(v);
  };

  window.render=function(){
    if(me?.role==='cashier')return view==='cashierreports'?renderCashierReports():renderCashierQueue();
    if(me?.role==='owner'&&view==='cashiersetup')return renderCashierSetup();
    return baseRender();
  };

  async function loadQueue(){return await rpc('cashier_bill_queue',{p_limit:500})||[]}

  function queueStats(list){
    const today=list.filter(x=>isToday(x.finished_at)&&!x.voided);
    return {
      pending:list.filter(x=>x.print_status==='pending'&&!x.voided).length,
      bills:today.length,
      sales:today.reduce((a,b)=>a+Number(b.total_amount||0),0),
      cash:today.filter(x=>(x.payment_mode||'').toLowerCase()==='cash').reduce((a,b)=>a+Number(b.total_amount||0),0),
      upi:today.filter(x=>(x.payment_mode||'').toLowerCase()==='upi').reduce((a,b)=>a+Number(b.total_amount||0),0)
    }
  }

  function queueCard(b){
    const pending=b.print_status==='pending'&&!b.voided;
    const status=b.voided?'VOID':pending?'PRINT PENDING':'PRINTED';
    return `<div class="cashier-bill ${pending?'pending':''} ${b.voided?'voided':''}">
      <div class="cashier-bill-main"><div><span class="cashier-status">${status}</span><b>${safe(b.order_no||'Bill')}</b><small>Table ${safe(tableLabel(b))} · ${safe(b.waiter_name||'Waiter')}</small></div><strong>${money(b.total_amount)}</strong></div>
      <div class="cashier-meta"><span>${b.finished_at?new Date(b.finished_at).toLocaleString('en-IN'):'-'}</span><span>${safe(b.payment_mode||'-')}</span>${b.print_count?`<span>Printed ${b.print_count}x</span>`:''}</div>
      <div class="cashier-actions"><button class="btn ${pending?'green':'ghost'}" onclick="cashierOpenBill('${b.id}')">${pending?'Open & Print':'View / Reprint'}</button>${!b.voided&&!pending?`<button class="btn ghost" onclick="cashierMarkPending('${b.id}')">Send to Queue</button>`:''}</div>
    </div>`;
  }

  window.renderCashierQueue=async function(){
    if(me?.role!=='cashier')return;
    const main=document.getElementById('main');
    main.innerHTML=head('Billing & Print Queue','Waiter completes a bill → it appears here automatically for printing.')+'<div class="card">Loading bills...</div>';
    try{
      const list=await loadQueue();window.cashierQueue=list;
      const st=queueStats(list);const pending=list.filter(x=>x.print_status==='pending'&&!x.voided);
      if(st.pending>lastPendingCount&&lastPendingCount>=0){try{navigator.vibrate?.([150,80,150])}catch{};toast('New bill ready to print')}
      lastPendingCount=st.pending;
      const q=(window.cashierSearch||'').trim().toLowerCase();
      const shown=list.filter(x=>!q||(x.order_no||'').toLowerCase().includes(q)||String(tableLabel(x)).includes(q)||(x.waiter_name||'').toLowerCase().includes(q));
      main.innerHTML=head('Billing & Print Queue','Dedicated cashier phone · all completed waiter bills in one place.')+
        `<section class="cashier-hero"><div><small>LOVE DOT POINT · CASHIER</small><h2>${safe(me.name)}</h2><p>Printer phone ko Epson TM-T82X ke paas rakhein.</p></div><button class="btn ghost" onclick="renderCashierQueue()">↻ Refresh</button></section>`+
        `<div class="cashier-kpis"><div><span>Print Pending</span><b>${st.pending}</b></div><div><span>Today Bills</span><b>${st.bills}</b></div><div><span>Today Sales</span><b>${money(st.sales)}</b></div><div><span>Cash / UPI</span><b>${money(st.cash)} / ${money(st.upi)}</b></div></div>`+
        `${pending.length?`<div class="cashier-alert">🧾 ${pending.length} bill${pending.length===1?'':'s'} waiting for print</div>`:''}`+
        `<div class="cashier-toolbar card"><input class="field" placeholder="Search bill no / table / waiter" value="${safe(window.cashierSearch||'')}" oninput="window.cashierSearch=this.value;renderCashierQueue()"></div>`+
        `<div class="cashier-section"><div class="history-section-title"><h3>Completed Bills</h3><span>${shown.length} records</span></div><div class="cashier-list">${shown.length?shown.map(queueCard).join(''):'<div class="card note">No bills found.</div>'}</div></div>`;
    }catch(e){main.innerHTML=head('Billing & Print Queue','Unable to load')+`<div class="card">${safe(e.message)}</div>`}
  };

  window.renderCashierReports=async function(){
    if(me?.role!=='cashier')return;
    const main=document.getElementById('main');main.innerHTML=head('Waiter Reports','Today waiter-wise sales and completed bills.')+'<div class="card">Loading...</div>';
    try{
      const list=await loadQueue();const today=list.filter(x=>isToday(x.finished_at)&&!x.voided);const perf={};
      today.forEach(x=>{const n=x.waiter_name||'Unknown';if(!perf[n])perf[n]={bills:0,sales:0,cash:0,upi:0};perf[n].bills++;perf[n].sales+=Number(x.total_amount||0);if((x.payment_mode||'').toLowerCase()==='cash')perf[n].cash+=Number(x.total_amount||0);if((x.payment_mode||'').toLowerCase()==='upi')perf[n].upi+=Number(x.total_amount||0)});
      const ranking=Object.entries(perf).sort((a,b)=>b[1].sales-a[1].sales);const st=queueStats(list);
      main.innerHTML=head('Waiter Reports','Read-only cashier report · order/menu controls disabled.')+
        `<div class="cashier-kpis"><div><span>Today Sales</span><b>${money(st.sales)}</b></div><div><span>Completed Bills</span><b>${st.bills}</b></div><div><span>Cash</span><b>${money(st.cash)}</b></div><div><span>UPI</span><b>${money(st.upi)}</b></div></div>`+
        `<section class="card"><div class="history-section-title"><h3>Waiter Performance Today</h3><span>${ranking.length} waiters</span></div>${ranking.length?ranking.map((r,i)=>`<div class="cashier-rank"><span>#${i+1}</span><div><b>${safe(r[0])}</b><small>${r[1].bills} completed bills · Cash ${money(r[1].cash)} · UPI ${money(r[1].upi)}</small></div><strong>${money(r[1].sales)}</strong></div>`).join(''):'<div class="note">No completed bills today.</div>'}</section>`;
    }catch(e){main.innerHTML=head('Waiter Reports','Unable to load')+`<div class="card">${safe(e.message)}</div>`}
  };

  window.cashierOpenBill=async function(id){
    if(me?.role!=='cashier')return;
    const b=(window.cashierQueue||[]).find(x=>x.id===id);if(!b)return toast('Bill not found');
    try{
      const order=await rpc('cashier_bill_items',{p_session_id:id});
      const rows=(order||[]).map((i,idx)=>`<tr><td>${idx+1}</td><td class="itemname">${safe(i.item_name)}</td><td class="num">${i.qty}</td><td class="num">${Number(i.unit_price).toFixed(2)}</td><td class="num">${(Number(i.unit_price)*Number(i.qty)).toFixed(2)}</td></tr>`).join('');
      document.getElementById('modalbox').innerHTML=`<div class="bill-modal-head"><div><h2>${b.print_status==='pending'?'Print Bill':'Bill Reprint'}</h2><div class="note">${safe(b.order_no||'Bill')} · Table ${safe(tableLabel(b))} · ${safe(b.waiter_name||'Waiter')}</div></div><button class="btn ghost" onclick="closeModal()">Close</button></div><div class="receipt" id="receiptPrint"><div class="receipt-head"><img class="receipt-logo" src="https://wlediyikwdcmrkndgcfh.supabase.co/functions/v1/pos-logo"><div class="receipt-title">LOVE DOT POINT RESTAURANT</div><div class="receipt-sub">PURE VEG · A.C. RESTAURANT</div><div class="receipt-address">41, 42, 43, Madhav Mall, Opp. Ratanba School,<br>Thakkarbapa Nagar, Ahmedabad - 382350</div><div class="receipt-phone">M: 9898014793</div></div><div class="receipt-meta"><div><span>Table No.</span><b>${safe(tableLabel(b))}</b></div><div><span>Order No.</span><b>${safe(b.order_no||'-')}</b></div><div><span>Date</span><b>${b.finished_at?new Date(b.finished_at).toLocaleDateString('en-IN'):'-'}</b></div><div><span>Time</span><b>${b.finished_at?new Date(b.finished_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}):'-'}</b></div></div><table class="bill-table"><thead><tr><th>#</th><th>Item</th><th class="num">Qty</th><th class="num">Rate</th><th class="num">Amount</th></tr></thead><tbody>${rows}</tbody></table><div class="bill-summary"><div><span>GST</span><b>Not Applicable</b></div><div class="grand"><span>GRAND TOTAL</span><b>${money(b.total_amount)}</b></div><div><span>Payment Mode</span><b>${safe(b.payment_mode||'-')}</b></div></div><div class="receipt-footer">Thank You! Visit Again<br><small>Love Dot Point Restaurant · Pure Veg</small></div></div><div class="bill-actions"><button class="btn green" onclick="cashierPrintBill('${id}')">Print Bill</button>${b.print_status==='pending'?`<button class="btn ghost" onclick="cashierConfirmPrinted('${id}')">Mark Printed ✓</button>`:''}</div>`;
      document.getElementById('modal').classList.remove('hidden');
    }catch(e){toast(e.message)}
  };

  window.cashierPrintBill=function(id){
    window.__cashierAfterPrintId=id;
    try{window.print()}catch(e){toast(e.message)}
  };

  window.cashierConfirmPrinted=async function(id){
    try{await rpc('cashier_mark_printed',{p_session_id:id});toast('Bill marked printed');closeModal();await renderCashierQueue()}catch(e){toast(e.message)}
  };

  window.cashierMarkPending=async function(id){
    try{await rpc('cashier_mark_pending',{p_session_id:id});toast('Bill sent to print queue');await renderCashierQueue()}catch(e){toast(e.message)}
  };

  window.addEventListener('afterprint',async()=>{
    const id=window.__cashierAfterPrintId;if(!id||me?.role!=='cashier')return;window.__cashierAfterPrintId=null;
    try{await rpc('cashier_mark_printed',{p_session_id:id});toast('Bill printed ✓');closeModal();await renderCashierQueue()}catch(e){console.warn(e)}
  });

  function subscribeCashier(){
    if(cashierChannel)sb.removeChannel(cashierChannel);
    cashierChannel=sb.channel('cashier-print-queue').on('postgres_changes',{event:'UPDATE',schema:'public',table:'table_sessions'},payload=>{
      if(me?.role!=='cashier')return;const n=payload.new||{};if(n.status==='finished')setTimeout(()=>view==='cashierreports'?renderCashierReports():renderCashierQueue(),180);
    }).subscribe();
  }

  window.renderCashierSetup=async function(){
    if(me?.role!=='owner')return;
    const main=document.getElementById('main');main.innerHTML=head('Cashier / Billing Captain','Dedicated billing phone and print queue access.')+'<div class="card">Loading cashier...</div>';
    try{
      const j=await admin({action:'list_staff'});const c=(j.data||[]).find(x=>x.role==='cashier'&&!String(x.login_id||'').startsWith('removed_'));
      window.currentCashier=c||null;
      if(!c){main.innerHTML=head('Cashier / Billing Captain','Create one dedicated billing login.')+`<div class="card cashier-setup"><h3>Create Cashier Login</h3><div class="formrow"><input id="cashName" class="field" value="Kartik001" placeholder="Cashier Name"></div><div class="formrow"><input id="cashLogin" class="field" value="Kartik001" placeholder="Login ID"></div><div class="formrow"><input id="cashPw" class="field" type="password" placeholder="Password (6+)"></div><button class="btn" onclick="ownerActivateCashier()">Create Cashier</button></div>`;return}
      main.innerHTML=head('Cashier / Billing Captain','Dedicated print operator account.')+`<div class="card cashier-setup"><div class="cashier-profile"><div><small>CASHIER</small><h3>${safe(c.name)}</h3><p>Login ID: <b>${safe(c.login_id)}</b></p></div><span class="staff-status ${c.active?'on':'off'}">${c.active?'Active':'Inactive'}</span></div>${c.auth_user_id?`<div class="cashier-actions"><button class="btn ghost" onclick="ownerResetCashierPassword('${c.id}')">Reset Password</button><button class="btn ${c.active?'red':'green'}" onclick="ownerSetCashierActive('${c.id}',${!c.active})">${c.active?'Deactivate':'Activate'}</button></div>`:`<div class="cashier-activate"><p>This cashier profile is ready. Set password once to activate login.</p><input id="cashPw" class="field" type="password" placeholder="Password (6+)"><button class="btn" onclick="ownerActivateCashier()">Activate Cashier Login</button></div>`}</div>`;
    }catch(e){main.innerHTML=head('Cashier / Billing Captain','Unable to load')+`<div class="card">${safe(e.message)}</div>`}
  };

  window.ownerActivateCashier=async function(){
    if(me?.role!=='owner')return;
    const c=window.currentCashier;const name=(document.getElementById('cashName')?.value||c?.name||'Kartik001').trim();const login=(document.getElementById('cashLogin')?.value||c?.login_id||'Kartik001').trim();const password=document.getElementById('cashPw')?.value||'';
    if(password.length<6)return toast('Password minimum 6 characters hona chahiye');
    try{await admin({action:'add_cashier',name,login_id:login,password});toast('Cashier login activated');await renderCashierSetup()}catch(e){toast(e.message)}
  };

  window.ownerResetCashierPassword=async function(id){const password=prompt('New cashier password (6+ characters)');if(!password)return;try{await admin({action:'reset_cashier_password',staff_id:id,password});toast('Cashier password updated')}catch(e){toast(e.message)}};
  window.ownerSetCashierActive=async function(id,active){try{await admin({action:'set_cashier_active',staff_id:id,active});toast(active?'Cashier activated':'Cashier deactivated');await renderCashierSetup()}catch(e){toast(e.message)}};

  const note=document.querySelector('#loginView .note');if(note&&note.textContent.includes('Secure Owner & Waiter Login'))note.textContent='Secure Owner, Waiter & Cashier Login';
})();