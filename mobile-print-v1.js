/* Love Dot Point POS - Mobile Print V6
   Epson TM Print Assistant scale compensation: browser canvas 210mm -> physical 80mm.
   Keeps one bill on one continuous receipt by scaling dynamic height with the same ratio.
*/
(function(){
  'use strict';
  const SCALE=210/80;
  function receiptReady(){return !!document.getElementById('receiptPrint')}
  if(!window.__nativePrint)window.__nativePrint=window.print.bind(window);

  function installMeasuredPageSize(){
    const receipt=document.getElementById('receiptPrint');
    if(!receipt)return;
    const pxPerMm=96/25.4;
    const physicalMm=Math.ceil(receipt.scrollHeight/pxPerMm/SCALE)+12;
    const rows=receipt.querySelectorAll('.bill-table tbody tr').length;
    const physicalEstimate=Math.max(115,82+(rows*8));
    const pagePhysicalMm=Math.min(1200,Math.max(physicalMm,physicalEstimate));
    const browserMm=Math.ceil(pagePhysicalMm*SCALE);
    let style=document.getElementById('dynamicThermalPageSize');
    if(!style){style=document.createElement('style');style.id='dynamicThermalPageSize';document.head.appendChild(style)}
    style.textContent='@media print{@page{size:210mm '+browserMm+'mm;margin:0!important}html,body{width:210mm!important;max-width:210mm!important;height:'+browserMm+'mm!important;min-height:'+browserMm+'mm!important;margin:0!important;padding:0!important}#receiptPrint{width:210mm!important;min-width:210mm!important;max-width:210mm!important;transform:none!important;zoom:1!important}}';
  }

  function preparePrintMode(){
    document.documentElement.classList.add('receipt-printing');
    if(/Android/i.test(navigator.userAgent||''))document.documentElement.classList.add('android-epson-print');
    installMeasuredPageSize();
  }
  function cleanupPrintMode(){
    document.documentElement.classList.remove('receipt-printing');
    document.documentElement.classList.remove('android-epson-print');
  }

  window.continueReceiptPrint=function(){
    if(!receiptReady()){
      if(typeof toast==='function')toast('Final bill receipt abhi available nahi hai.');
      return;
    }
    preparePrintMode();
    setTimeout(function(){
      installMeasuredPageSize();
      try{window.__nativePrint.call(window)}finally{setTimeout(cleanupPrintMode,2200)}
    },300);
  };

  window.print=function(){
    if(!receiptReady()){
      if(typeof toast==='function')toast('Pehle payment complete karke final bill banayein.');
      return;
    }
    return window.continueReceiptPrint();
  };

  window.mobilePrintInfo={receiptReady:receiptReady};
})();