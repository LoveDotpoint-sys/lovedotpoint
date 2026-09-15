/* Love Dot Point POS - Epson/Android 1024px single-page print bridge
   Critical: measure AFTER the browser has switched to print media. Screen/modal height is
   not the same as the 1024px print layout and previously caused a second page. */
(function(){
 'use strict';
 function receiptReady(){return !!document.getElementById('receiptPrint')}
 if(!window.__nativePrint)window.__nativePrint=window.print.bind(window);
 function removePageSizing(){
  ['dynamicThermalPageSize','epsonMeasuredPage','epsonPrintProbe'].forEach(function(id){const x=document.getElementById(id);if(x)x.remove()});
  document.querySelectorAll('style[data-thermal-page]').forEach(function(x){x.remove()});
 }
 function prepare(){
  removePageSizing();
  document.documentElement.classList.add('receipt-printing');
  if(/Android/i.test(navigator.userAgent||''))document.documentElement.classList.add('android-epson-print');
  const r=document.getElementById('receiptPrint');
  if(r){
   r.querySelectorAll('.bill-table tbody td small').forEach(function(el){el.remove()});
   r.style.removeProperty('height');r.style.removeProperty('min-height');r.style.removeProperty('max-height');
   r.style.removeProperty('transform');r.style.removeProperty('zoom');
  }
 }
 function measureAtPrintWidth(){
  const r=document.getElementById('receiptPrint');if(!r)return 1200;
  const clone=r.cloneNode(true);clone.id='receiptPrintMeasure';
  clone.style.cssText='position:absolute!important;left:-20000px!important;top:0!important;display:block!important;visibility:hidden!important;width:1024px!important;min-width:1024px!important;max-width:1024px!important;height:auto!important;min-height:0!important;max-height:none!important;margin:0!important;padding:22px 30px 30px!important;box-sizing:border-box!important;font-family:Arial,Helvetica,sans-serif!important;font-size:30px!important;line-height:1.25!important;transform:none!important;zoom:1!important;overflow:visible!important;';
  clone.querySelectorAll('*').forEach(function(x){x.style.visibility='visible'});
  document.body.appendChild(clone);
  const h=Math.ceil(Math.max(clone.scrollHeight,clone.getBoundingClientRect().height)+24);
  clone.remove();return h;
 }
 function installMeasuredPage(){
  const h=measureAtPrintWidth();
  let s=document.createElement('style');s.id='epsonMeasuredPage';
  s.textContent='@media print{@page{size:1024px '+h+'px!important;margin:0!important}html,body{width:1024px!important;min-width:1024px!important;max-width:1024px!important;height:auto!important;min-height:0!important;max-height:none!important;margin:0!important;padding:0!important;overflow:visible!important}#receiptPrint{position:absolute!important;left:0!important;top:0!important;width:1024px!important;min-width:1024px!important;max-width:1024px!important;height:auto!important;min-height:0!important;max-height:none!important;margin:0!important;transform:none!important;zoom:1!important;overflow:visible!important}#receiptPrint .bill-table tr,#receiptPrint .bill-summary,#receiptPrint .receipt-footer{break-inside:avoid!important;page-break-inside:avoid!important}}';
  document.head.appendChild(s);
 }
 function cleanup(){document.documentElement.classList.remove('receipt-printing','android-epson-print')}
 window.continueReceiptPrint=function(){
  if(!receiptReady()){if(typeof toast==='function')toast('Final bill receipt abhi available nahi hai.');return}
  prepare();installMeasuredPage();
  setTimeout(function(){try{window.__nativePrint.call(window)}finally{setTimeout(cleanup,2200)}},180);
 };
 window.print=function(){if(!receiptReady()){if(typeof toast==='function')toast('Pehle payment complete karke final bill banayein.');return}return window.continueReceiptPrint()};
 window.mobilePrintInfo={receiptReady:receiptReady};
})();
