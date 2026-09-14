/* Love Dot Point POS - Mobile Print V11
   Epson TM Print Assistant: 1024px canvas mapped to 80mm full width, dynamic unlimited-height single bill.
*/
(function(){
 'use strict';
 function receiptReady(){return !!document.getElementById('receiptPrint')}
 if(!window.__nativePrint)window.__nativePrint=window.print.bind(window);
 function installPage(){
  const r=document.getElementById('receiptPrint');if(!r)return;
  const rows=r.querySelectorAll('.bill-table tbody tr').length;
  const notes=[...r.querySelectorAll('.itemname small')].filter(x=>x.textContent.trim()).length;
  /* 1024px canvas width; height grows with bill items. One bill remains one print page. */
  const heightPx=Math.min(24000,Math.max(1500,980+(rows*92)+(notes*36)));
  let s=document.getElementById('dynamicThermalPageSize');
  if(!s){s=document.createElement('style');s.id='dynamicThermalPageSize';document.head.appendChild(s)}
  s.textContent='@media print{@page{size:1024px '+heightPx+'px;margin:0!important}html,body{width:1024px!important;min-width:1024px!important;max-width:1024px!important;height:'+heightPx+'px!important;min-height:'+heightPx+'px!important;margin:0!important;padding:0!important;overflow:visible!important}#receiptPrint{left:0!important;top:0!important;width:1024px!important;min-width:1024px!important;max-width:1024px!important;transform:none!important;zoom:1!important}}';
 }
 function prepare(){document.documentElement.classList.add('receipt-printing');if(/Android/i.test(navigator.userAgent||''))document.documentElement.classList.add('android-epson-print');installPage()}
 function cleanup(){document.documentElement.classList.remove('receipt-printing','android-epson-print')}
 window.continueReceiptPrint=function(){if(!receiptReady()){if(typeof toast==='function')toast('Final bill receipt abhi available nahi hai.');return}prepare();setTimeout(function(){installPage();try{window.__nativePrint.call(window)}finally{setTimeout(cleanup,2200)}},300)};
 window.print=function(){if(!receiptReady()){if(typeof toast==='function')toast('Pehle payment complete karke final bill banayein.');return}return window.continueReceiptPrint()};
 window.mobilePrintInfo={receiptReady:receiptReady};
})();