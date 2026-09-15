/* Love Dot Point POS - Mobile Print FINAL
   Physical 80mm page width. Height grows with receipt content so one bill stays one page.
*/
(function(){
 'use strict';
 function receiptReady(){return !!document.getElementById('receiptPrint')}
 if(!window.__nativePrint)window.__nativePrint=window.print.bind(window);
 function installPage(){
  const r=document.getElementById('receiptPrint');if(!r)return;
  const rows=r.querySelectorAll('.bill-table tbody tr').length;
  const notes=[...r.querySelectorAll('.itemname small')].filter(x=>x.textContent.trim()).length;
  /* Compact base + actual rows. No huge blank page and no 1024px canvas scaling. */
  const mm=Math.min(1200,Math.max(105,72+(rows*6.2)+(notes*2.5)));
  let s=document.getElementById('dynamicThermalPageSize');
  if(!s){s=document.createElement('style');s.id='dynamicThermalPageSize';document.head.appendChild(s)}
  s.textContent='@media print{@page{size:80mm '+mm+'mm;margin:0!important}html,body{width:80mm!important;min-width:80mm!important;max-width:80mm!important;height:'+mm+'mm!important;min-height:'+mm+'mm!important;margin:0!important;padding:0!important;overflow:visible!important}#receiptPrint{width:80mm!important;min-width:80mm!important;max-width:80mm!important;transform:none!important;zoom:1!important}}';
 }
 function prepare(){document.documentElement.classList.add('receipt-printing');if(/Android/i.test(navigator.userAgent||''))document.documentElement.classList.add('android-epson-print');installPage()}
 function cleanup(){document.documentElement.classList.remove('receipt-printing','android-epson-print')}
 window.continueReceiptPrint=function(){if(!receiptReady()){if(typeof toast==='function')toast('Final bill receipt abhi available nahi hai.');return}prepare();setTimeout(function(){installPage();try{window.__nativePrint.call(window)}finally{setTimeout(cleanup,2200)}},250)};
 window.print=function(){if(!receiptReady()){if(typeof toast==='function')toast('Pehle payment complete karke final bill banayein.');return}return window.continueReceiptPrint()};
 window.mobilePrintInfo={receiptReady:receiptReady};
})();