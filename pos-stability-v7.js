/* Love Dot Point POS - authoritative role/header stability and safe page guards */
(function(){
  'use strict';
  let authoritative=null,checking=false;

  function esc7(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function roleLabel(role){return role==='owner'?'OWNER':role==='cashier'?'CASHIER':'WAITER'}

  async function resolveRole(){
    if(checking)return authoritative;
    checking=true;
    try{
      const {data:{user}}=await sb.auth.getUser();
      if(!user)return authoritative;
      const {data,error}=await sb.from('staff_profiles').select('id,name,role,active').eq('auth_user_id',user.id).maybeSingle();
      if(error||!data||!data.active)return authoritative;
      authoritative=data;
      if(window.me&&String(me.id)===String(data.id)){
        me.role=data.role;
        me.name=data.name;
        me.active=data.active;
      }
      return authoritative;
    }catch(e){console.warn('Role verification skipped',e)}
    finally{checking=false}
    return authoritative;
  }

  function activeRole(){return authoritative?.role||window.me?.role||null}
  function activeName(){return authoritative?.name||window.me?.name||''}

  function enforceHeader(){
    const role=activeRole(),name=activeName();
    if(!role)return;
    const who=document.getElementById('who');if(!who)return;
    const label=roleLabel(role);
    if(role==='cashier'){
      const wanted='<b>CASHIER</b>';
      if(who.innerHTML!==wanted)who.innerHTML=wanted;
      who.dataset.authoritativeRole='cashier';
      delete who.dataset.authoritativeName;
      who.setAttribute('aria-label','CASHIER');
      return;
    }
    if(!name)return;
    const wanted=`<span class="staff-role-label">${esc7(label)}</span><b>${esc7(name)}</b>`;
    if(who.innerHTML!==wanted)who.innerHTML=wanted;
    who.dataset.authoritativeRole=role;
    who.dataset.authoritativeName=name;
    who.setAttribute('aria-label',`${label} ${name}`);
  }

  function enforceRoleView(){
    const role=activeRole();if(!role||!window.me)return;
    if(role==='cashier'&&window.view&&!['cashierqueue','cashierreports'].includes(window.view)){
      window.view='cashierqueue';
      if(typeof window.renderNav==='function')window.renderNav();
      if(typeof window.renderCashierQueue==='function')window.renderCashierQueue();
    }
  }

  function healthAudit(){
    const required=['renderNav','render','logout','refreshAll'];
    const missing=required.filter(k=>typeof window[k]!=='function');
    if(missing.length)console.warn('POS health: missing core functions',missing);
    const role=activeRole();
    if(role==='cashier'){
      const cm=['renderCashierQueue','renderCashierReports','cashierOpenBill'].filter(k=>typeof window[k]!=='function');
      if(cm.length)console.warn('POS health: missing cashier functions',cm);
    }
    if(role==='owner'){
      const om=['renderDashboard','renderHistory','renderStaff','renderMenuManager'].filter(k=>typeof window[k]!=='function');
      if(om.length)console.warn('POS health: missing owner functions',om);
    }
  }

  async function syncAll(){
    if(window.me&&!authoritative)await resolveRole();
    enforceHeader();
    enforceRoleView();
  }

  document.addEventListener('DOMContentLoaded',()=>setTimeout(syncAll,80));
  document.addEventListener('click',()=>setTimeout(syncAll,20));
  const obs=new MutationObserver(()=>{clearTimeout(window.__posStabilityV7);window.__posStabilityV7=setTimeout(()=>{enforceHeader();enforceRoleView()},15)});
  obs.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  setInterval(syncAll,500);
  setTimeout(async()=>{await syncAll();healthAudit()},1400);
  sb.auth.onAuthStateChange((event)=>{if(event==='SIGNED_OUT'){authoritative=null;return}setTimeout(async()=>{authoritative=null;await syncAll()},100)});
})();
