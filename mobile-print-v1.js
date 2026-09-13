/* Love Dot Point POS - Mobile Print V4
   One bill = one dynamic long 80mm thermal page for Android + Epson TM Print Assistant.
*/
(function(){
  'use strict';
  function receiptReady(){return !!document.getElementById('receiptPrint')}
  if(!window.__nativePrint)window.__nativePrint=window.print.bind(window);

  function installDynamicPageSize(){
    const receipt=document.getElementById('receiptPrint');
    if(!receipt)return;
    const rows=receipt.querySelectorAll('.bill-table tbody tr').length;
    /* Generous thermal length so large orders stay on the same physical receipt. */
    const mm=Math.min(1000,Math.max(125,115+(rows*10)));
    let style=document.getElementById('dynamicThermalPageSize');
    if(!style){style=document.createElement('style');style.id='dynamicThermalPageSize';document.head.appendChild(style)}
    style.textContent=`@media print{@page{size:80mm ${mm}mm;margin:0}html,body{width:80mm!important;min-width:80mm!important;height:${mm}mm!important;min-height:${mm}mm!important}}`;
  }

  function preparePrintMode(){
    installDynamicPageSize();
    document.documentElement.classList.add('receipt-printing');
    if(/Android/i.test(navigator.userAgent||''))document.documentElement.classList.add('android-epson-print');
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
      try{window.__nativePrint.call(window)}finally{
        setTimeout(cleanupPrintMode,1800);
      }
    },220);
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