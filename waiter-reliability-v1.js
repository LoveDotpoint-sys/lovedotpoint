// Waiter Reliability V1: stable shared-floor loading, waiter-only sales KPIs, and no auto-jump away from My Tables.
(function(){
  'use strict';

  let refreshPromise=null;

  window.refreshAll=async function(){
    if(refreshPromise)return refreshPromise;
    refreshing=true;
    refreshPromise=(async()=>{
      try{
        const [t,s,m]=await Promise.all([
          sb.from('restaurant_tables').select('*').order('table_no'),
          sb.from('table_sessions').select('*').order('started_at',{ascending:false}).limit(1000),
          sb.from('menu_items').select('*').eq('active',true).order('category').order('name')
        ]);
        if(t.error)throw t.error;
        if(s.error)throw s.error;
        if(m.error)throw m.error;

        tables=t.data||[];
        const tableMap={};
        tables.forEach(x=>tableMap[String(x.id)]={table_no:x.table_no});
        sessions=(s.data||[]).map(x=>({...x,restaurant_tables:tableMap[String(x.table_id)]||{table_no:'-'}}));
        menu=m.data||[];

        if(selectedSession){
          const q=await sb.from('order_items').select('*').eq('session_id',selectedSession).order('created_at');
          if(q.error)throw q.error;
          items=q.data||[];
        }else items=[];
      }catch(e){
        console.error('POS refresh failed',e);
        if(typeof toast==='function')toast('Live POS data refresh failed. Please retry.');
      }finally{
        refreshing=false;
        refreshPromise=null;
      }
    })();
    return refreshPromise;
  };

  window.boot=async function(){
    const {data:{user}}=await sb.auth.getUser();
    if(!user)return;
    const {data,error}=await sb.from('staff_profiles').select('*').eq('auth_user_id',user.id).single();
    if(error||!data){toast('Staff profile not linked');return}
    me=data;
    document.getElementById('loginView').classList.add('hidden');
    document.getElementById('appView').classList.remove('hidden');
    const who=document.getElementById('who');
    if(me.role==='cashier')who.textContent='CASHIER';
    else who.textContent=me.name+' · '+(me.role==='owner'?'Owner':'Waiter');
    if(me.role==='cashier'){
      view='cashierqueue';
      selectedTable=null;selectedSession=null;items=[];
      renderNav();
      if(typeof window.renderCashierQueue==='function')await window.renderCashierQueue();
      return;
    }
    view=me.role==='owner'?'dashboard':'tables';
    selectedTable=null;selectedSession=null;items=[];
    renderNav();
    await refreshAll();
    render();
    subscribe();
    startTableClock();
  };

  const baseRenderTables=window.renderTables;

  async function waiterTodayStats(){
    const start=new Date();start.setHours(0,0,0,0);
    const {data,error}=await sb.from('table_sessions')
      .select('id,total_amount,payment_mode,started_at,finished_at,voided,status')
      .eq('waiter_id',me.id)
      .eq('status','finished')
      .gte('finished_at',start.toISOString())
      .order('finished_at',{ascending:false});
    if(error)throw error;
    const valid=(data||[]).filter(x=>!x.voided);
    const total=valid.reduce((a,b)=>a+Number(b.total_amount||0),0);
    const cash=valid.filter(x=>(x.payment_mode||'').toLowerCase()==='cash').reduce((a,b)=>a+Number(b.total_amount||0),0);
    const upi=valid.filter(x=>(x.payment_mode||'').toLowerCase()==='upi').reduce((a,b)=>a+Number(b.total_amount||0),0);
    const durations=valid.filter(x=>x.started_at&&x.finished_at).map(x=>(new Date(x.finished_at)-new Date(x.started_at))/60000);
    return {served:valid.length,total,cash,upi,avg:durations.length?Math.round(durations.reduce((a,b)=>a+b,0)/durations.length):0};
  }

  window.renderTables=function(){
    if(!me)return;
    if(me.role==='owner')return baseRenderTables();
    if(me.role!=='waiter')return;

    const mine=tables.filter(t=>t.status==='occupied'&&t.assigned_waiter_id===me.id);
    const available=tables.filter(t=>t.status==='available');
    const main=document.getElementById('main');
    main.innerHTML=head('My Tables','All 15 dine-in tables live dikhte hain. Aapke tables full control me hain; doosre waiter ke tables view-only hain.')+
      `<section class="waiter-welcome"><div><small>WAITER WORKSPACE</small><h2>${me.name}</h2><p>Live tables, today sales aur completed service ek jagah.</p></div></section>`+
      `<div class="waiter-kpis" id="waiterLiveKpis">
        <div><span>My Active Tables</span><b>${mine.length}</b></div>
        <div><span>Available Tables</span><b>${available.length}</b></div>
        <div><span>Today Served</span><b>...</b></div>
        <div><span>My Sales Today</span><b>...</b></div>
        <div><span>Cash Today</span><b>...</b></div>
        <div><span>UPI Today</span><b>...</b></div>
      </div>`+tableHtml();

    Promise.resolve(waiterTodayStats()).then(st=>{
      if(view!=='tables'||me?.role!=='waiter')return;
      const box=document.getElementById('waiterLiveKpis');if(!box)return;
      box.innerHTML=`
        <div><span>My Active Tables</span><b>${mine.length}</b></div>
        <div><span>Available Tables</span><b>${available.length}</b></div>
        <div><span>Today Served</span><b>${st.served}</b></div>
        <div><span>My Sales Today</span><b>${money(st.total)}</b></div>
        <div><span>Cash Today</span><b>${money(st.cash)}</b></div>
        <div><span>UPI Today</span><b>${money(st.upi)}</b></div>`;
    }).catch(e=>{console.warn('Waiter today stats failed',e)});
  };
})();
