(()=>{
  let busy=false;
  async function releaseCurrentTable(){
    if(busy||!selectedSession)return;
    if(items.length){toast('Order items already added. Table release nahi ho sakta.');return;}
    if(!confirm('Release Table '+selectedTable+'?\n\nTable Available ho jayega aur empty assignment remove ho jayega.'))return;
    busy=true;
    try{
      const {error}=await sb.rpc('release_empty_table',{p_session_id:selectedSession});
      if(error)throw error;
      selectedTable=null;selectedSession=null;items=[];window.menuSearch='';window.orderSheetOpen=false;
      await refreshAll();
      view='tables';renderNav();render();toast('Table released. Ab Available hai.');
    }catch(e){toast(e.message||String(e))}finally{busy=false}
  }
  window.releaseCurrentTable=releaseCurrentTable;
  function polishHeader(){
    if(!me)return;
    const who=document.getElementById('who');
    if(!who)return;
    who.innerHTML=me.role==='owner'?`<span style="display:block;font-size:10px;opacity:.7;line-height:1">OWNER</span><b>${me.name}</b>`:`<span style="display:block;font-size:10px;opacity:.7;line-height:1">WAITER</span><b>${me.name}</b>`;
    who.style.cssText='text-align:left;line-height:1.15;padding:7px 11px;white-space:nowrap';
  }
  function inject(){
    polishHeader();
    if(!me||me.role==='owner'||!selectedSession||items.length)return;
    const h=document.querySelector('.order-page-head');
    if(!h||document.getElementById('releaseTableBtn'))return;
    const b=document.createElement('button');
    b.id='releaseTableBtn';b.className='btn ghost';b.type='button';b.textContent='Release Table';
    b.style.cssText='border-color:#b42318;color:#b42318;margin-left:8px;white-space:nowrap';
    b.onclick=releaseCurrentTable;h.appendChild(b);
  }
  new MutationObserver(inject).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',inject);setTimeout(inject,300);
})();