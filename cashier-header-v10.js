/* Dedicated cashier header: cashier sessions physically remove the legacy waiter identity pill. */
(function(){
'use strict';
let busy=false;
function enforceCashierHeader(role){
  document.body.setAttribute('data-pos-role',role);
  const cp=document.getElementById('cashierIdentityPill');
  if(cp)cp.textContent='CASHIER';
  if(role==='cashier'){
    const old=document.getElementById('who');
    if(old)old.remove();
  }
}
async function syncCashierHeader(){
  if(busy)return; busy=true;
  try{
    const {data:{user}}=await sb.auth.getUser();
    if(!user){document.body.removeAttribute('data-pos-role');return;}
    const {data,error}=await sb.from('staff_profiles').select('role,active').eq('auth_user_id',user.id).maybeSingle();
    if(error||!data?.active)return;
    enforceCashierHeader(data.role);
  }catch(e){console.warn('Cashier header sync failed',e)}finally{busy=false}
}
window.syncCashierHeader=syncCashierHeader;
document.addEventListener('DOMContentLoaded',()=>setTimeout(syncCashierHeader,0));
document.addEventListener('click',()=>setTimeout(syncCashierHeader,0));
sb.auth.onAuthStateChange((event)=>{if(event==='SIGNED_OUT')document.body.removeAttribute('data-pos-role');else setTimeout(syncCashierHeader,20)});
setInterval(syncCashierHeader,250);
})();
