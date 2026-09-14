/* Love Dot Point POS - Mobile Print V10
   Final Epson TM-T82X tuning: 80mm physical page, enlarged receipt, one continuous bill page.
*/
(function(){
 'use strict';
 const SCALE=1.30;
 function receiptReady(){return !!document.getElementById('receiptPrint')}
 if(!window.__nativePrint)window.__nativePrint=window.print.bind(window);
 function installPage(){
  const r=document.getElementById('receiptPrint');if(!r)return;
  const rows=r.querySelectorAll('.bill-table tbody tr').length;
  /* Enough height for scaled receipt so Android/Epson keeps one bill on one page. */
  const base=82+(rows*6.4);
  const heightMm=Math.min(1200,Math.max(135,Math.ceil((base*SCALE)+14)));
  let s=document.getElementById('dynamicThermalPageSize');
  if(!s){s=document.createElement('style');s.id='dynamicThermalPageSize';document.head.appendChild(s)}
  s.textContent='@media print{@page{size:80mm '+heightMm+'mm;margin:0!important}html,body{width:80mm!important;min-width:80mm!important;max-width:80mm!important;height:'+heightMm+'mm!important;min-height:'+heightMm+'mm!important;margin:0!important;padding:0!important;overflow:visible!important}#receiptPrint{left:1mm!important;width:59mm!important;min-width:59mm!important;max-width:59mm!important;transform:scale('+SCALE+')!important;transform-origin:top left!important}}';
 }
 function prepare(){document.documentElement.classList.add('receipt-printing');if(/Android/i.test(navigator.userAgent||''))document.documentElement.classList.add('android-epson-print');installPage()}
 function cleanup(){document.documentElement.classList.remove('receipt-printing','android-epson-print')}
 window.continueReceiptPrint=function(){if(!receiptReady()){if(typeof toast==='function')toast('Final bill receipt abhi available nahi hai.');return}prepare();setTimeout(function(){installPage();try{window.__nativePrint.call(window)}finally{setTimeout(cleanup,2200)}},300)};
 window.print=function(){if(!receiptReady()){if(typeof toast==='function')toast('Pehle payment complete karke final bill banayein.');return}return window.continueReceiptPrint()};
 window.mobilePrintInfo={receiptReady:receiptReady};
})();