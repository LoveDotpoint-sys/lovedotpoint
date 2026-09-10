// Premium waiter table-assignment UI. Replaces browser confirm with a clear mobile-first POS modal.
(function(){
  const previousOpenSharedTable=window.openSharedTable;
  let assigning=false;

  function escAssign(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

  window.showAssignTableModal=function(no){
    if(me?.role!=='waiter')return previousOpenSharedTable?.(no);
    const t=tables.find(x=>Number(x.table_no)===Number(no));
    if(!t)return toast('Table not found');
    if(t.status!=='available'||t.active_session_id)return previousOpenSharedTable?.(no);
    const capacity=escAssign(t.capacity_label||'Dine-in seating');
    document.getElementById('modalbox').innerHTML=`
      <div class="assign-modal">
        <div class="assign-modal-top">
          <div class="assign-icon">${Number(no)}</div>
          <div>
            <div class="eyebrow">AVAILABLE TABLE · READY TO SERVE</div>
            <h2>Assign Table ${Number(no)}</h2>
            <div class="note">Start a new dine-in order under your waiter account.</div>
          </div>
          <button class="assign-close" onclick="closeModal()" aria-label="Close">×</button>
        </div>
        <div class="assign-info-grid">
          <div><span>Status</span><b class="assign-ready">● Available</b></div>
          <div><span>Capacity</span><b>${capacity}</b></div>
          <div><span>Assigned To</span><b>${escAssign(me.name||'You')}</b></div>
          <div><span>Order</span><b>New Dine-In</b></div>
        </div>
        <div class="assign-tip"><b>What happens next?</b><span>Table will become Occupied and the Take Order screen will open immediately. You can also join extra available tables from the order screen.</span></div>
        <div class="assign-actions">
          <button class="btn ghost assign-cancel" onclick="closeModal()">Cancel</button>
          <button id="assignStartBtn" class="btn assign-start" onclick="confirmAssignTable(${Number(no)})"><span>Assign to Me</span><small>Start Order →</small></button>
        </div>
      </div>`;
    document.getElementById('modal').classList.remove('hidden');
  };

  window.confirmAssignTable=async function(no){
    if(assigning)return;
    assigning=true;
    const btn=document.getElementById('assignStartBtn');
    if(btn){btn.disabled=true;btn.innerHTML='<span>Assigning...</span><small>Please wait</small>'}
    try{
      const {data,error}=await sb.rpc('assign_table',{p_table_no:Number(no)});
      if(error)throw error;
      selectedTable=Number(no);selectedSession=data;window.orderSheetOpen=false;
      closeModal();
      await refreshAll();
      view='menu';renderNav();render();
      toast(`Table ${Number(no)} assigned · Start taking order`);
    }catch(e){
      toast(e?.message||'Could not assign table');
      if(btn){btn.disabled=false;btn.innerHTML='<span>Assign to Me</span><small>Start Order →</small>'}
    }finally{assigning=false}
  };

  window.openSharedTable=function(no){
    const t=tables.find(x=>Number(x.table_no)===Number(no));
    if(me?.role==='waiter'&&t?.status==='available'&&!t.active_session_id)return window.showAssignTableModal(no);
    return previousOpenSharedTable?.(no);
  };
})();
