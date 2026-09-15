/* Love Dot Point POS - exact single-page receipt print bridge
   The previous hidden-clone measurement was wrong because visibility:hidden changed the
   effective print measurement. Measure the LIVE receipt after print classes are applied. */
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
  const r=document.getElementById('receiptPrint');if(!r)return;
  r.querySelectorAll('.bill-table tbody td small').forEach(function(el){el.remove()});
  ['height','min-height','max-height','transform','zoom'].forEach(function(p){r.style.removeProperty(p)});
 }
 function measureLiveReceipt(){
  const r=document.getElementById('receiptPrint');if(!r)return 1800;
  /* Apply the same 1024px geometry used by @media print before measuring. */
  const old={position:r.style.position,left:r.style.left,top:r.style.top,width:r.style.width,minWidth:r.style.minWidth,maxWidth:r.style.maxWidth,height:r.style.height,minHeight:r.style.minHeight,maxHeight:r.style.maxHeight,transform:r.style.transform,zoom:r.style.zoom,overflow:r.style.overflow,boxSizing:r.style.boxSizing};
  r.style.setProperty('position','absolute','important');r.style.setProperty('left','0','important');r.style.setProperty('top','0','important');
  r.style.setProperty('width','1024px','important');r.style.setProperty('min-width','1024px','important');r.style.setProperty('max-width','1024px','important');
  r.style.setProperty('height','auto','important');r.style.setProperty('min-height','0','important');r.style.setProperty('max-height','none','important');
  r.style.setProperty('transform','none','important');r.style.setProperty('zoom','1','important');r.style.setProperty('overflow','visible','important');r.style.setProperty('box-sizing','border-box','important');
  void r.offsetHeight;
  const rect=r.getBoundingClientRect();
  const h=Math.ceil(Math.max(r.scrollHeight,r.offsetHeight,rect.height)+40);
  Object.keys(old).forEach(function(k){if(old[k])r.style[k]=old[k];else r.style.removeProperty(k.replace(/[A-Z]/g,function(m){return '-'+m.toLowerCase()}))});
  return Math.max(h,700);
 }
 function installMeasuredPage(){
  const h=measureLiveReceipt();
  const s=document.createElement('style');s.id='epsonMeasuredPage';s.setAttribute('data-thermal-page','1');
  s.textContent='@media print{@page{size:1024px '+h+'px!important;margin:0!important}html,body{width:1024px!important;min-width:1024px!important;max-width:1024px!important;height:'+h+'px!important;min-height:'+h+'px!important;max-height:'+h+'px!important;margin:0!important;padding:0!important;overflow:hidden!important}#receiptPrint{position:absolute!important;left:0!important;top:0!important;width:1024px!important;min-width:1024px!important;max-width:1024px!important;height:auto!important;min-height:0!important;max-height:none!important;margin:0!important;transform:none!important;zoom:1!important;overflow:visible!important}#receiptPrint .bill-table tr,#receiptPrint .bill-summary,#receiptPrint .receipt-footer{break-inside:avoid!important;page-break-inside:avoid!important}}';
  document.head.appendChild(s);
 }
 function cleanup(){document.documentElement.classList.remove('receipt-printing','android-epson-print')}
 window.continueReceiptPrint=function(){
  if(!receiptReady()){if(typeof toast==='function')toast('Final bill receipt abhi available nahi hai.');return}
  prepare();
  requestAnimationFrame(function(){requestAnimationFrame(function(){installMeasuredPage();setTimeout(function(){try{window.__nativePrint.call(window)}finally{setTimeout(cleanup,2200)}},120)})});
 };
 window.print=function(){if(!receiptReady()){if(typeof toast==='function')toast('Pehle payment complete karke final bill banayein.');return}return window.continueReceiptPrint()};
 window.mobilePrintInfo={receiptReady:receiptReady};
})();
