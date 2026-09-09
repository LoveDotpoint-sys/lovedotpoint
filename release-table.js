(()=>{
  let busy=false;
  async function releaseCurrentTable(){
    if(busy||!window.selectedSession)return;
    if((window.items||[]).length){toast('Order items already added. Table release nahi ho sakta.');return;}
    if(!confirm('Release Table '+window.selectedTable+'?\n\nTable Available ho jayega aur empty assignment remove ho jayega.'))return;
    busy=true;
    try{
      const {error}=await sb.rpc('release_empty_table',{p_session_id:window.selectedSession});
      if(error)throw error;
      window.selectedTable=null;window.selectedSession=null;window.items=[];window.menuSearch='';window.orderSheetOpen=false;
      await refreshAll();
      window.view='tables';renderNav();render();toast('Table released. Ab Available hai.');
    }catch(e){toast(e.message||String(e))}finally{busy=false}
  }
  window.releaseCurrentTable=releaseCurrentTable;
  function inject(){
    if(!window.me||me.role==='owner'||!window.selectedSession||(window.items||[]).length)return;
    const h=document.querySelector('.order-page-head');
    if(!h||document.getElementById('releaseTableBtn'))return;
    const b=document.createElement('button');
    b.id='releaseTableBtn';b.className='btn ghost';b.textContent='Release Table';
    b.style.cssText='border-color:#b42318;color:#b42318;margin-left:8px';
    b.onclick=releaseCurrentTable;h.appendChild(b);
  }
  new MutationObserver(inject).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',inject);setTimeout(inject,300);
})();