(()=>{
  let busy=false;

  function releaseLabel(){
    if(typeof window.jointTableLabel==='function'&&selectedSession)return window.jointTableLabel(selectedSession,selectedTable);
    return String(selectedTable||'-');
  }

  function showReleaseTableModal(){
    if(busy||!selectedSession)return;
    if(items.length){toast('Order items already added. Table release nahi ho sakta.');return;}
    const label=releaseLabel(),joint=String(label).includes(' + ');
    document.getElementById('modalbox').innerHTML=`
      <div class="release-modal">
        <div class="release-modal-top">
          <div class="release-icon">↩</div>
          <div>
            <div class="eyebrow">EMPTY TABLE · SAFE RELEASE</div>
            <h2>${joint?'Release Joined Tables':'Release Table '+label}</h2>
            <div class="note">No order item has been added, so this assignment can be safely removed.</div>
          </div>
          <button class="assign-close" onclick="closeModal()" aria-label="Close">×</button>
        </div>
        <div class="release-summary">
          <div><span>${joint?'Tables':'Table'}</span><b>${label}</b></div>
          <div><span>Current Status</span><b>Occupied · Empty Order</b></div>
          <div><span>After Release</span><b class="release-ready">● Available</b></div>
        </div>
        <div class="release-warning"><b>Release only removes the empty table assignment.</b><span>No sale or bill will be created. ${joint?'All joined tables in this empty session will become Available together.':'This table will immediately return to the Available floor.'}</span></div>
        <div class="assign-actions release-actions">
          <button class="btn ghost assign-cancel" onclick="closeModal()">Keep Table</button>
          <button id="releaseConfirmBtn" class="btn release-confirm" onclick="confirmReleaseCurrentTable()"><span>Release ${joint?'Tables':'Table'}</span><small>Make Available →</small></button>
        </div>
      </div>`;
    document.getElementById('modal').classList.remove('hidden');
  }

  async function confirmReleaseCurrentTable(){
    if(busy||!selectedSession)return;
    if(items.length){toast('Order items already added. Table release nahi ho sakta.');return;}
    const btn=document.getElementById('releaseConfirmBtn');
    busy=true;
    if(btn){btn.disabled=true;btn.innerHTML='<span>Releasing...</span><small>Please wait</small>'}
    try{
      const label=releaseLabel();
      const {error}=await sb.rpc('release_empty_table',{p_session_id:selectedSession});
      if(error)throw error;
      selectedTable=null;
      selectedSession=null;
      items=[];
      window.menuSearch='';
      window.orderSheetOpen=false;
      closeModal();
      await refreshAll();
      view='tables';
      renderNav();
      render();
      toast(`Table ${label} released · Available now`);
    }catch(e){
      toast(e.message||String(e));
      if(btn){btn.disabled=false;btn.innerHTML='<span>Release Table</span><small>Make Available →</small>'}
    }finally{
      busy=false;
    }
  }

  window.releaseCurrentTable=showReleaseTableModal;
  window.showReleaseTableModal=showReleaseTableModal;
  window.confirmReleaseCurrentTable=confirmReleaseCurrentTable;

  function injectReleaseButton(){
    if(!me||me.role!=='waiter'||!selectedSession||items.length)return;
    const h=document.querySelector('.order-page-head');
    if(!h||document.getElementById('releaseTableBtn'))return;
    const b=document.createElement('button');
    b.id='releaseTableBtn';
    b.className='btn ghost release-trigger';
    b.type='button';
    b.innerHTML='<span>↩</span> Release Table';
    b.onclick=showReleaseTableModal;
    h.appendChild(b);
  }

  function syncExtras(){injectReleaseButton();}
  document.addEventListener('DOMContentLoaded',syncExtras);
  document.addEventListener('click',()=>setTimeout(syncExtras,0));
  setInterval(syncExtras,750);
})();