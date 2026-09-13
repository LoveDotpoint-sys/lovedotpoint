/* Love Dot Point POS - Mobile Print V8
   1024px portrait source canvas; dynamic height; one bill = one print page.
*/
(function(){
 'use strict';
 const CANVAS_PX=1024;
 function receiptReady(){return !!document.getElementById('receiptPrint')}
 if(!window.__nativePrint)window.__nativePrint=window.print.bind(window);
 function installPage(){
  const r=document.getElementById('receiptPrint'); if(!r)return;
  const rows=r.querySelectorAll('.bill-table tbody tr').length;
  const measured=Math.ceil(r.scrollHeight)+80;
  const estimated=720+(rows*72);
  const height=Math.min(16000,Math.max(1000,measured,estimated));
  let s=document.getElementById('dynamicThermalPageSize');
  if(!s){s=document.createElement('style');s.id='dynamicThermalPageSize';document.head.appendChild(s)}
  s.textContent='@media print{@page{size:'+CANVAS_PX+'px '+height+'px;margin:0!important}html,body{width:'+CANVAS_PX+'px!important;min-width:'+CANVAS_PX+'px!important;max-width:'+CANVAS_PX+'px!important;height:'+height+'px!important;min-height:'+height+'px!important;margin:0!important;padding:0!important;overflow:visible!important}#receiptPrint{width:'+CANVAS_PX+'px!important;min-width:'+CANVAS_PX+'px!important;max-width:'+CANVAS_PX+'px!important;transform:none!important;zoom:1!important}}';
 }
 function prepare(){document.documentElement.classList.add('receipt-printing');if(/Android/i.test(navigator.userAgent||''))document.documentElement.classList.add('android-epson-print');installPage()}
 function cleanup(){document.documentElement.classList.remove('receipt-printing','android-epson-print')}
 window.continueReceiptPrint=function(){if(!receiptReady()){if(typeof toast==='function')toast('Final bill receipt abhi available nahi hai.');return}prepare();setTimeout(function(){installPage();try{window.__nativePrint.call(window)}finally{setTimeout(cleanup,2200)}},300)};
 window.print=function(){if(!receiptReady()){if(typeof toast==='function')toast('Pehle payment complete karke final bill banayein.');return}return window.continueReceiptPrint()};
 window.mobilePrintInfo={receiptReady:receiptReady};
})();