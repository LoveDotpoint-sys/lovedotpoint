/* Love Dot Point POS - Mobile Print V7 FINAL
   Epson TM Print Assistant: enlarged canvas -> full 80mm physical width,
   measured continuous height -> one bill / one thermal page.
*/
(function(){
 'use strict';
 const CANVAS_MM=250, PAPER_MM=80, SCALE=CANVAS_MM/PAPER_MM;
 function receiptReady(){return !!document.getElementById('receiptPrint')}
 if(!window.__nativePrint)window.__nativePrint=window.print.bind(window);
 function installPage(){
  const r=document.getElementById('receiptPrint'); if(!r)return;
  const pxPerMm=96/25.4;
  const measuredPhysical=Math.ceil((r.scrollHeight/pxPerMm)/SCALE)+10;
  const rows=r.querySelectorAll('.bill-table tbody tr').length;
  const estimatedPhysical=82+(rows*8.5);
  const physical=Math.min(1500,Math.max(105,measuredPhysical,estimatedPhysical));
  const browser=Math.ceil(physical*SCALE);
  let s=document.getElementById('dynamicThermalPageSize');
  if(!s){s=document.createElement('style');s.id='dynamicThermalPageSize';document.head.appendChild(s)}
  s.textContent='@media print{@page{size:'+CANVAS_MM+'mm '+browser+'mm;margin:0!important}html,body{width:'+CANVAS_MM+'mm!important;max-width:'+CANVAS_MM+'mm!important;height:'+browser+'mm!important;min-height:'+browser+'mm!important;margin:0!important;padding:0!important}#receiptPrint{width:'+CANVAS_MM+'mm!important;min-width:'+CANVAS_MM+'mm!important;max-width:'+CANVAS_MM+'mm!important;transform:none!important;zoom:1!important}}';
 }
 function prepare(){document.documentElement.classList.add('receipt-printing');if(/Android/i.test(navigator.userAgent||''))document.documentElement.classList.add('android-epson-print');installPage()}
 function cleanup(){document.documentElement.classList.remove('receipt-printing','android-epson-print')}
 window.continueReceiptPrint=function(){if(!receiptReady()){if(typeof toast==='function')toast('Final bill receipt abhi available nahi hai.');return}prepare();setTimeout(function(){installPage();try{window.__nativePrint.call(window)}finally{setTimeout(cleanup,2200)}},300)};
 window.print=function(){if(!receiptReady()){if(typeof toast==='function')toast('Pehle payment complete karke final bill banayein.');return}return window.continueReceiptPrint()};
 window.mobilePrintInfo={receiptReady:receiptReady};
})();