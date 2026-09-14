/* Love Dot Point POS - Mobile Print V9
   Epson TM-T82X: physical 80mm width; only page length changes with bill items.
*/
(function(){
 'use strict';
 function receiptReady(){return !!document.getElementById('receiptPrint')}
 if(!window.__nativePrint)window.__nativePrint=window.print.bind(window);
 function installPage(){
  const r=document.getElementById('receiptPrint');if(!r)return;
  const rows=r.querySelectorAll('.bill-table tbody tr').length;
  /* Width must always remain physical 80mm. Height grows with the receipt. */
  const heightMm=Math.min(1000,Math.max(115,82+(rows*6.8)));
  let s=document.getElementById('dynamicThermalPageSize');
  if(!s){s=document.createElement('style');s.id='dynamicThermalPageSize';document.head.appendChild(s)}
  s.textContent='@media print{@page{size:80mm '+heightMm+'mm;margin:0!important}html,body{width:80mm!important;min-width:80mm!important;max-width:80mm!important;height:'+heightMm+'mm!important;min-height:'+heightMm+'mm!important;margin:0!important;padding:0!important;overflow:visible!important}#receiptPrint{width:80mm!important;min-width:80mm!important;max-width:80mm!important;transform:none!important;zoom:1!important}}';
 }
 function prepare(){document.documentElement.classList.add('receipt-printing');if(/Android/i.test(navigator.userAgent||''))document.documentElement.classList.add('android-epson-print');installPage()}
 function cleanup(){document.documentElement.classList.remove('receipt-printing','android-epson-print')}
 window.continueReceiptPrint=function(){if(!receiptReady()){if(typeof toast==='function')toast('Final bill receipt abhi available nahi hai.');return}prepare();setTimeout(function(){installPage();try{window.__nativePrint.call(window)}finally{setTimeout(cleanup,2200)}},300)};
 window.print=function(){if(!receiptReady()){if(typeof toast==='function')toast('Pehle payment complete karke final bill banayein.');return}return window.continueReceiptPrint()};
 window.mobilePrintInfo={receiptReady:receiptReady};
})();