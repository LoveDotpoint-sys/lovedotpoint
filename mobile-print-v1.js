/* Love Dot Point POS - Epson/Android 1024px single-page print bridge
   Measure a clone with the REAL #receiptPrint selector so every thermal print rule is
   applied before calculating the custom page height. */
(function(){
 'use strict';
 function receiptReady(){return !!document.getElementById('receiptPrint')}
 if(!window.__nativePrint)window.__nativePrint=window.print.bind(window);
 function removePageSizing(){
  ['dynamicThermalPageSize','epsonMeasuredPage','epsonPrintProbe'].forEach(function(id){const x=document.getElementById(id);if(x)x.remove()});
  document.querySelectorAll('style[data-thermal-page]').forEach(function(x){x.remove()});
 }
 function prepare(){
  removePageSizing();document.documentElement.classList.add('receipt-printing');
  if(/Android/i.test(navigator.userAgent||''))document.documentElement.classList.add('android-epson-print');
  const r=document.getElementById('receiptPrint');if(!r)return;
  r.querySelectorAll('.bill-table tbody td small').forEach(function(el){el.remove()});
  ['height','min-height','max-height','transform','zoom'].forEach(function(p){r.style.removeProperty(p)});
 }
 function measureAtRealPrintStyle(){
  const original=document.getElementById('receiptPrint');if(!original)return 1600;
  const clone=original.cloneNode(true);
  original.id='receiptPrintOriginal';clone.id='receiptPrint';
  clone.setAttribute('aria-hidden','true');
  clone.style.setProperty('position','absolute','important');clone.style.setProperty('left','-20000px','important');clone.style.setProperty('top','0','important');
  clone.style.setProperty('display','block','important');clone.style.setProperty('visibility','hidden','important');
  clone.style.setProperty('width','1024px','important');clone.style.setProperty('min-width','1024px','important');clone.style.setProperty('max-width','1024px','important');
  clone.style.setProperty('height','auto','important');clone.style.setProperty('min-height','0','important');clone.style.setProperty('max-height','none','important');
  clone.style.setProperty('transform','none','important');clone.style.setProperty('zoom','1','important');clone.style.setProperty('overflow','visible','important');
  document.body.appendChild(clone);
  void clone.offsetHeight;
  const h=Math.ceil(Math.max(clone.scrollHeight,clone.getBoundingClientRect().height)+80);
  clone.remove();original.id='receiptPrint';return Math.max(h,900);
 }
 function installMeasuredPage(){
  const h=measureAtRealPrintStyle();
  const s=document.createElement('style');s.id='epsonMeasuredPage';
  s.textContent='@media print{@page{size:1024px '+h+'px!important;margin:0!important}html,body{width:1024px!important;min-width:1024px!important;max-width:1024px!important;height:'+h+'px!important;min-height:'+h+'px!important;max-height:'+h+'px!important;margin:0!important;padding:0!important;overflow:hidden!important}#receiptPrint{position:absolute!important;left:0!important;top:0!important;width:1024px!important;min-width:1024px!important;max-width:1024px!important;height:auto!important;min-height:0!important;max-height:none!important;margin:0!important;transform:none!important;zoom:1!important;overflow:visible!important}#receiptPrint .bill-table tr,#receiptPrint .bill-summary,#receiptPrint .receipt-footer{break-inside:avoid!important;page-break-inside:avoid!important}}';
  document.head.appendChild(s);
 }
 function cleanup(){document.documentElement.classList.remove('receipt-printing','android-epson-print')}
 window.continueReceiptPrint=function(){
  if(!receiptReady()){if(typeof toast==='function')toast('Final bill receipt abhi available nahi hai.');return}
  prepare();installMeasuredPage();
  setTimeout(function(){try{window.__nativePrint.call(window)}finally{setTimeout(cleanup,2200)}},220);
 };
 window.print=function(){if(!receiptReady()){if(typeof toast==='function')toast('Pehle payment complete karke final bill banayein.');return}return window.continueReceiptPrint()};
 window.mobilePrintInfo={receiptReady:receiptReady};
})();
