/* Love Dot Point POS - single authoritative top header renderer */
(function(){
  'use strict';
  let cachedIdentity=null;
  let resolving=false;

  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function labelFor(role,view){
    if(view==='cashierqueue'||view==='cashierreports'||role==='cashier')return 'BILLING CASHIER';
    if(role==='owner')return 'OWNER';
    return 'WAITER';
  }

  async function resolveIdentity(){
    if(resolving)return cachedIdentity;
    resolving=true;
    try{
      const {data:{user}}=await sb.auth.getUser();
      if(!user)return cachedIdentity;
      const {data,error}=await sb.from('staff_profiles').select('id,name,role,active').eq('auth_user_id',user.id).maybeSingle();
      if(!error&&data?.active){
        cachedIdentity=data;
        if(window.me&&String(window.me.id)===String(data.id)){
          window.me.role=data.role;
          window.me.name=data.name;
        }
      }
    }catch(e){console.warn('Header identity lookup failed',e)}
    finally{resolving=false}
    return cachedIdentity;
  }

  function identity(){
    const role=cachedIdentity?.role||window.me?.role||null;
    const name=cachedIdentity?.name||window.me?.name||'';
    return {role,name};
  }

  function renderHeader(){
    const who=document.getElementById('who');
    if(!who)return;
    const {role,name}=identity();
    if(!name)return;
    const label=labelFor(role,window.view);
    const html=`<span class="top-role-label">${esc(label)}</span><b class="top-role-name">${esc(name)}</b>`;
    if(who.innerHTML!==html)who.innerHTML=html;
    who.dataset.roleLock=label;
  }

  function guardView(){
    const {role}=identity();
    if(!role)return;
    if((role==='cashier'||window.view==='cashierqueue'||window.view==='cashierreports')&&!['cashierqueue','cashierreports'].includes(window.view)){
      window.view='cashierqueue';
      if(typeof window.renderNav==='function')window.renderNav();
      if(typeof window.renderCashierQueue==='function')window.renderCashierQueue();
    }
  }

  async function sync(){
    if(window.me&&!cachedIdentity)await resolveIdentity();
    guardView();
    renderHeader();
  }

  const whoObserver=new MutationObserver(()=>renderHeader());
  function attachObserver(){
    const who=document.getElementById('who');
    if(who){whoObserver.disconnect();whoObserver.observe(who,{childList:true,subtree:true,characterData:true});}
  }

  document.addEventListener('DOMContentLoaded',()=>{attachObserver();setTimeout(sync,50)});
  document.addEventListener('click',()=>setTimeout(sync,0));
  setInterval(()=>{attachObserver();sync()},250);
  sb.auth.onAuthStateChange((event)=>{
    if(event==='SIGNED_OUT'){cachedIdentity=null;return}
    cachedIdentity=null;setTimeout(sync,80);
  });
})();
