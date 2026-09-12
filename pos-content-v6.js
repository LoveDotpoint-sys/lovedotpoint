/* Love Dot Point POS - role-aware content polish */
(function(){
  'use strict';
  function esc2(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function roleName(){return me?.role==='owner'?'Owner':me?.role==='cashier'?'Cashier':'Waiter'}
  function pageCopy(){
    const r=me?.role,v=window.view;
    if(r==='owner'&&v==='dashboard')return null;
    const map={
      'owner:tables':['Live Floor Control','All dine-in tables, assigned staff and running service time in one live view.','View live orders','Release/Force Close','No item editing'],
      'owner:staff':['Waiter Management','Create and manage waiter access while keeping historical bills and reports safe.','Add / Edit Login','Reset Password','History Preserved'],
      'owner:menumanager':['Menu Management','Maintain live menu availability, names, categories and prices used by waiter ordering.','Add / Edit Item','Show / Hide','Pure Veg Menu'],
      'owner:history':['Sales & Bill Reports','Review date-wise sales, Cash/UPI collections, waiter performance, bill reprints and void control.','Date-wise Reports','Waiter Ranking','Bill Reprint / Void'],
      'owner:cashiersetup':['Cashier Control','Manage the dedicated billing desk and review print activity without giving order-edit permissions.','Billing Desk Access','Print Audit','Read-only Bills'],
      'cashier:cashierqueue':['Billing & Print Queue','Pending bills stay at the top. After physical receipt is confirmed, they move to Printed Bills automatically.','Pending First','Search Bill/Table','Printed Archive'],
      'cashier:cashierreports':['Waiter Reports','Read-only waiter sales and completed-bill reporting for the billing desk.','Today / Date Range','Cash / UPI','Waiter Performance'],
      'waiter:tables':['My Table Floor','All 15 tables are visible. Your assigned tables have full control; other occupied tables remain view-only.','Assign Available Table','My Tables Full Control','Others View Only'],
      'waiter:menu':['Take Order','Search the full menu, enter quantity directly, add internal notes and complete billing with Cash or UPI.','Fast Search','Direct Qty','Internal Notes Only'],
      'waiter:history':['My History & Reports','Review your own completed tables, sales and payment summary. Void bills stay excluded from net sales.','My Bills Only','Cash / UPI','Reprint History']
    };
    return map[(r||'')+':'+(v||'')]||null;
  }
  function syncRole(){
    if(!me)return;
    const who=document.getElementById('who');if(!who)return;
    const role=roleName().toUpperCase();
    if(me.role==='cashier'){
      if(who.dataset.contentV6==='CASHIER')return;
      who.innerHTML='<b>CASHIER</b>';
      who.dataset.contentV6='CASHIER';
      return;
    }
    if(who.dataset.contentV6===role+'|'+me.name)return;
    who.innerHTML='<span class="staff-role-label">'+esc2(role)+'</span><b>'+esc2(me.name)+'</b>';
    who.dataset.contentV6=role+'|'+me.name;
  }
  function syncContext(){
    const main=document.getElementById('main');if(!main||!me)return;
    const copy=pageCopy();
    const old=main.querySelector(':scope > .pos-context-v6');
    if(!copy){if(old)old.remove();return}
    const key=(me.role||'')+'|'+(window.view||'')+'|'+copy[0];
    if(old?.dataset.key===key)return;
    if(old)old.remove();
    const el=document.createElement('section');el.className='pos-context-v6';el.dataset.key=key;
    el.innerHTML='<div class="pos-context-copy"><small>'+esc2(roleName()).toUpperCase()+' WORKSPACE</small><b>'+esc2(copy[0])+'</b><span>'+esc2(copy[1])+'</span></div><div class="pos-context-tags"><span>'+esc2(copy[2])+'</span><span>'+esc2(copy[3])+'</span><span>'+esc2(copy[4])+'</span></div>';
    const head=main.querySelector(':scope > .head');
    if(head)head.insertAdjacentElement('afterend',el);else main.prepend(el);
  }
  function sync(){syncRole();syncContext()}
  document.addEventListener('DOMContentLoaded',sync);
  document.addEventListener('click',()=>setTimeout(sync,30));
  const obs=new MutationObserver(()=>{clearTimeout(window.__posContentSync);window.__posContentSync=setTimeout(sync,40)});
  obs.observe(document.documentElement,{childList:true,subtree:true});
  setInterval(sync,1000);
})();