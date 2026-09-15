/* Love Dot Point POS - Epson/Android print bridge
   Physical paper width/length is controlled by Epson TM Print Assistant.
   Never inject a fixed/dynamic @page height: Android may fit that virtual page and shrink
   an 80mm receipt, or paginate it into a blank second page. */
(function(){
 'use strict';
 function receiptReady(){return !!document.getElementById('receiptPrint')}
 if(!window.__nativePrint)window.__nativePrint=window.print.bind(window);
 function removeLegacyPageSizing(){
  const old=document.getElementById('dynamicThermalPageSize');
  if(old)old.remove();
  document.querySelectorAll('style[data-thermal-page]').forEach(function(x){x.remove()});
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
  setTimeout(function(){try{window.__nativePrint.call(window)}finally{setTimeout(cleanup,2200)}},180);
 };
 window.print=function(){if(!receiptReady()){if(typeof toast==='function')toast('Pehle payment complete karke final bill banayein.');return}return window.continueReceiptPrint()};
 window.mobilePrintInfo={receiptReady:receiptReady};
})();
