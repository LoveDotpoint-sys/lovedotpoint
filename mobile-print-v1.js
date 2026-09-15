/* Love Dot Point POS - Epson/Android 1024px print bridge
   Epson preview uses a 1024px document canvas. Keep width fixed at 1024px and set the
   print page height from the fully rendered receipt so one bill is one content-sized page. */
(function(){
 'use strict';
 function receiptReady(){return !!document.getElementById('receiptPrint')}
 if(!window.__nativePrint)window.__nativePrint=window.print.bind(window);
 function removeLegacyPageSizing(){
  const old=document.getElementById('dynamicThermalPageSize');if(old)old.remove();
  document.querySelectorAll('style[data-thermal-page]').forEach(function(x){x.remove()});
 }
 function installMeasuredPage(){
  const r=document.getElementById('receiptPrint');if(!r)return;
  let s=document.getElementById('epsonMeasuredPage');
  if(!s){s=document.createElement('style');s.id='epsonMeasuredPage';document.head.appendChild(s)}
  const h=Math.ceil(Math.max(r.scrollHeight,r.getBoundingClientRect().height)+8);
  s.textContent='@media print{@page{size:1024px '+h+'px;margin:0!important}html,body{width:1024px!important;min-width:1024px!important;max-width:1024px!important;height:'+h+'px!important;min-height:'+h+'px!important;max-height:'+h+'px!important;margin:0!important;padding:0!important;overflow:hidden!important}#receiptPrint{left:0!important;top:0!important;width:1024px!important;min-width:1024px!important;max-width:1024px!important;height:auto!important;transform:none!important;zoom:1!important}}';
 }
 function prepare(){
  removeLegacyPageSizing();
  document.documentElement.classList.add('receipt-printing');
  if(/Android/i.test(navigator.userAgent||''))document.documentElement.classList.add('android-epson-print');
  const r=document.getElementById('receiptPrint');
  if(r){
   r.querySelectorAll('.bill-table tbody td small').forEach(function(el){el.remove()});
   r.style.removeProperty('height');r.style.removeProperty('min-height');r.style.removeProperty('max-height');
   r.style.removeProperty('transform');r.style.removeProperty('zoom');
  }
 }
 function cleanup(){document.documentElement.classList.remove('receipt-printing','android-epson-print')}
 window.continueReceiptPrint=function(){
  if(!receiptReady()){if(typeof toast==='function')toast('Final bill receipt abhi available nahi hai.');return}
  prepare();
  requestAnimationFrame(function(){requestAnimationFrame(function(){installMeasuredPage();setTimeout(function(){try{window.__nativePrint.call(window)}finally{setTimeout(cleanup,2200)}},100)})});
 };
 window.print=function(){if(!receiptReady()){if(typeof toast==='function')toast('Pehle payment complete karke final bill banayein.');return}return window.continueReceiptPrint()};
 window.mobilePrintInfo={receiptReady:receiptReady};
})();
