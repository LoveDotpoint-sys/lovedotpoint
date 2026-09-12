/* Love Dot Point POS - cross-device report/history refresh after owner clear */
(function(){
  'use strict';
  let ch=null,timer=null;
  function schedule(){
    clearTimeout(timer);
    timer=setTimeout(async()=>{
      if(!window.me)return;
      try{
        if(typeof window.refreshAll==='function')await window.refreshAll();
        if(window.me.role==='cashier'){
          window.cashierQueue=[];
          if(window.view==='cashierreports'&&typeof window.renderCashierReports==='function')return window.renderCashierReports();
          if(typeof window.renderCashierQueue==='function')return window.renderCashierQueue();
        }
        if(window.view==='history'&&typeof window.renderHistory==='function')return window.renderHistory();
        if(window.me.role==='owner'&&window.view==='dashboard'&&typeof window.renderDashboard==='function')return window.renderDashboard();
      }catch(e){console.warn('Report sync refresh skipped',e)}
    },350);
  }
  function start(){
    if(ch||!window.sb)return;
    ch=sb.channel('report-history-sync-v9')
      .on('postgres_changes',{event:'DELETE',schema:'public',table:'table_sessions'},schedule)
      .subscribe();
  }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(start,500));
  setTimeout(start,1200);
})();
