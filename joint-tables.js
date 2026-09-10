// Advanced Joint Tables: one live session/order/bill across multiple physical tables.
(function(){
  const escJoint=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function cleanId(v){
    if(typeof v==='string')return v.trim();
    if(v&&typeof v==='object')return String(v.id||v.session_id||v.active_session_id||'').trim();
    return v==null?'':String(v).trim();
  }
  function tableByNo(no){return tables.find(t=>Number(t.table_no)===Number(no))||null}
  function resolveSessionId(sessionId,tableNo){
    const direct=cleanId(sessionId);
    if(direct&&direct!=='undefined'&&direct!=='null'&&direct!=='[object Object]')return direct;
    const t=tableByNo(tableNo);
    return cleanId(t?.active_session_id);
  }
  function sessionRow(id){const sid=cleanId(id);return sessions.find(s=>String(s.id)===sid)||null}
  async function ensureSessionRow(sessionId,tableNo){
    let sid=resolveSessionId(sessionId,tableNo);
    if(!sid){
      await refreshAll();
      sid=resolveSessionId(sessionId,tableNo);
    }
    if(!sid)return {sid:null,row:null};
    let s=sessionRow(sid);if(s)return {sid,row:s};
    const {data,error}=await sb.from('table_sessions').select('*,restaurant_tables(table_no),staff_profiles:waiter_id(name)').eq('id',sid).maybeSingle();
    if(error){toast(error.message);return {sid,row:null}}
    if(data){sessions=[data,...sessions.filter(x=>String(x.id)!==String(data.id))];return {sid,row:data}}
    // Final recovery: re-read the table itself in case the local floor state is stale.
    if(tableNo!=null){
      const {data:liveTable}=await sb.from('restaurant_tables').select('active_session_id,status').eq('table_no',Number(tableNo)).maybeSingle();
      const liveSid=cleanId(liveTable?.active_session_id);
      if(liveSid&&liveSid!==sid){
        const {data:liveSession,error:liveErr}=await sb.from('table_sessions').select('*,restaurant_tables(table_no),staff_profiles:waiter_id(name)').eq('id',liveSid).maybeSingle();
        if(!liveErr&&liveSession){sessions=[liveSession,...sessions.filter(x=>String(x.id)!==String(liveSession.id))];return {sid:liveSid,row:liveSession}}
      }
    }
    return {sid,row:null};
  }
  function jointNos(id){
    const sid=cleanId(id);
    const active=tables.filter(t=>String(t.active_session_id||'')===sid).map(t=>Number(t.table_no)).sort((a,b)=>a-b);
    if(active.length)return active;
    const s=sessionRow(sid),saved=Array.isArray(s?.joined_table_nos)?s.joined_table_nos.map(Number).sort((a,b)=>a-b):[];
    if(saved.length)return saved;
    const primary=tables.find(t=>String(t.id)===String(s?.table_id));return primary?[Number(primary.table_no)]:[];
  }
  function jointLabel(id,fallback){const a=jointNos(id);return a.length?a.join(' + '):String(fallback??'-')}
  function isJoint(id){return jointNos(id).length>1}
  window.jointTableLabel=jointLabel;

  function repaintFloor(){
    document.querySelectorAll('.tablecard[data-table-no]').forEach(card=>{
      const no=Number(card.dataset.tableNo),t=tableByNo(no);if(!t?.active_session_id)return;
      const nums=jointNos(t.active_session_id);if(nums.length<2)return;
      card.classList.add('joint-table-card');
      const st=card.querySelector('.status');if(st)st.textContent='Joined';
      let tag=card.querySelector('.joint-table-tag');if(!tag){tag=document.createElement('div');tag.className='joint-table-tag';const tn=card.querySelector('.tn');(tn||card).insertAdjacentElement('afterend',tag)}
      tag.textContent='JOINT · '+nums.join(' + ');
    });
  }

  function injectOrderJointBar(){
    if(me?.role!=='waiter'||!selectedSession)return;
    const headEl=document.querySelector('.order-page-head');if(!headEl)return;
    const nums=jointNos(selectedSession),label=nums.join(' + ')||String(selectedTable||'');
    const title=headEl.querySelector('h2');if(title)title.textContent=(nums.length>1?'Tables ':'Table ')+label;
    document.querySelectorAll('.sheet-head b').forEach(x=>x.textContent=(nums.length>1?'Tables ':'Table ')+label+' · Current Order');
    let bar=document.getElementById('jointOrderBar');if(bar)return;
    bar=document.createElement('div');bar.id='jointOrderBar';bar.className='joint-order-bar';
    bar.innerHTML=`<div><span>${nums.length>1?'JOINT TABLE ACTIVE':'TABLE SERVICE'}</span><b>${nums.length>1?'Tables '+escJoint(label):'Table '+escJoint(label)}</b><small>${nums.length>1?'One combined order · one bill · all joined tables release together':'Need extra seating? Join available tables into this same order.'}</small></div><button class="btn ghost" onclick="manageJointTables('${cleanId(selectedSession)}',${Number(selectedTable)})">${nums.length>1?'Manage Joint Tables':'＋ Join Tables'}</button>`;
    headEl.insertAdjacentElement('afterend',bar);
  }

  window.manageJointTables=async function(sessionId,tableNo){
    const resolved=await ensureSessionRow(sessionId,tableNo);
    const s=resolved.row, sid=resolved.sid;
    if(!s||!sid)return toast('Live session load nahi hua. Table ko ek baar Live Tables se reopen karke try karein.');
    if(s.status!=='active')return toast('Ye table session ab active nahi hai.');
    if(me?.role!=='owner'&&String(s.waiter_id)!==String(me?.id))return toast('Only assigned waiter or owner can manage joined tables');
    if(me?.role==='waiter'){selectedSession=sid;if(tableNo!=null)selectedTable=Number(tableNo)}
    const current=jointNos(sid),available=tables.filter(t=>t.status==='available'&&!t.active_session_id).sort((a,b)=>a.table_no-b.table_no);
    const currentHtml=current.map(no=>`<div class="joint-current-chip"><span>Table ${no}</span>${current.length>1?`<button onclick="unjoinOneTable('${sid}',${no})" title="Unjoin Table ${no}">×</button>`:''}</div>`).join('');
    const availHtml=available.length?available.map(t=>`<label class="joint-choice"><input type="checkbox" name="jointAdd" value="${t.table_no}"><span><b>Table ${t.table_no}</b><small>${escJoint(t.capacity_label||'Available')}</small></span></label>`).join(''):'<div class="joint-empty">No other table is currently available.</div>';
    document.getElementById('modalbox').innerHTML=`<div class="joint-modal-head"><div><div class="eyebrow">SMART FLOOR · JOINT TABLES</div><h2>Manage Joined Tables</h2><div class="note">Current order stays exactly the same. Joining only links physical tables to one live session.</div></div><button class="btn ghost" onclick="closeModal()">Close</button></div><section class="joint-section"><label>Current Group</label><div class="joint-current-list">${currentHtml}</div><div class="joint-rule">✓ One combined order &nbsp;•&nbsp; ✓ One bill &nbsp;•&nbsp; ✓ Same waiter &nbsp;•&nbsp; ✓ Same running time</div></section><section class="joint-section"><label>Add Available Tables</label><div class="joint-choice-grid">${availHtml}</div></section><div class="joint-safety"><b>Safe rule</b><span>Occupied table cannot be joined. On billing/finish, every table in this group becomes Available together.</span></div><div class="bill-actions"><button class="btn ghost" onclick="closeModal()">Cancel</button><button class="btn" ${available.length?'':'disabled'} onclick="joinSelectedTables('${sid}',${Number(tableNo)})">Join Selected Tables</button></div>`;
    document.getElementById('modal').classList.remove('hidden');
  };

  window.joinSelectedTables=async function(sessionId,tableNo){
    const resolved=await ensureSessionRow(sessionId,tableNo),sid=resolved.sid;
    if(!resolved.row||!sid)return toast('Live session load nahi hua. Table ko reopen karke try karein.');
    const nos=[...document.querySelectorAll('input[name="jointAdd"]:checked')].map(x=>Number(x.value));if(!nos.length)return toast('Select at least one available table');
    const {data,error}=await sb.rpc('join_tables',{p_session_id:sid,p_table_nos:nos});if(error)return toast(error.message);
    await refreshAll();closeModal();
    if(me.role==='waiter'){selectedSession=sid;selectedTable=(data||jointNos(sid))[0]||tableNo;view='menu';renderNav();render()}else{view='tables';renderNav();render()}
    toast(`Joint Table ready · ${(data||[]).join(' + ')}`);
  };

  window.unjoinOneTable=async function(sessionId,tableNo){
    const resolved=await ensureSessionRow(sessionId,tableNo),sid=resolved.sid;if(!resolved.row||!sid)return toast('Live session load nahi hua.');
    const nums=jointNos(sid);if(nums.length<=1)return toast('Last table cannot be unjoined');
    if(!confirm(`Unjoin Table ${tableNo}?\n\nCurrent order will remain on the other joined tables.`))return;
    const {data,error}=await sb.rpc('unjoin_table',{p_session_id:sid,p_table_no:tableNo});if(error)return toast(error.message);
    await refreshAll();
    if(String(selectedSession||'')===String(sid)&&Number(selectedTable)===Number(tableNo))selectedTable=(data||[])[0]||null;
    manageJointTables(sid,selectedTable||((data||[])[0]));toast(`Table ${tableNo} released from joint group`);
  };

  const baseTables=renderTables;renderTables=function(){baseTables();setTimeout(repaintFloor,0)};
  const baseMenu=renderMenu;renderMenu=function(){baseMenu();setTimeout(injectOrderJointBar,0)};

  const baseShared=window.viewSharedTable;
  if(typeof baseShared==='function')window.viewSharedTable=async function(no){
    await baseShared(no);const t=tableByNo(no);if(!t?.active_session_id)return;
    const nums=jointNos(t.active_session_id),h=document.querySelector('#modalbox h2');if(h&&nums.length>1)h.textContent='Tables '+nums.join(' + ')+' · Live Order';
    if(me?.role==='owner'){
      const actions=document.querySelector('#modalbox .bill-actions');
      if(actions&&!document.getElementById('manageJointBtn'))actions.insertAdjacentHTML('afterbegin',`<button id="manageJointBtn" class="btn ghost" onclick="manageJointTables('${cleanId(t.active_session_id)}',${no})">${nums.length>1?'Manage Joint Tables':'＋ Join Tables'}</button>`);
    }
  };

  const baseReceipt=receiptHtml;receiptHtml=function(args){
    const html=baseReceipt(args),label=jointLabel(selectedSession,selectedTable);
    return html.replace(`<span>Table No.</span><b>${selectedTable}</b>`,`<span>${isJoint(selectedSession)?'Table Nos.':'Table No.'}</span><b>${label}</b>`);
  };
  const baseBilling=billing;billing=function(){baseBilling();const h=document.querySelector('#modalbox .bill-modal-head h2'),label=jointLabel(selectedSession,selectedTable);if(h)h.textContent=(isJoint(selectedSession)?'Tables ':'Table ')+label+' · Billing'};
  const baseFinish=finishTable;finishTable=async function(){const label=jointLabel(selectedSession,selectedTable),wasJoint=isJoint(selectedSession);await baseFinish();const h=document.querySelector('#modalbox .bill-modal-head h2'),n=document.querySelector('#modalbox .bill-modal-head .note');if(h&&wasJoint)h.textContent='Payment Complete · Tables '+label;if(n&&wasJoint)n.textContent='Joined tables '+label+' are now available for next customers.'};

  document.addEventListener('click',()=>setTimeout(()=>{repaintFloor();injectOrderJointBar()},120));
  setInterval(repaintFloor,4000);
})();