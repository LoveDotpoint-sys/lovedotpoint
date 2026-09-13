/* Love Dot Point POS - Mobile Print V5
   Epson TM Print Assistant: full 80mm width + one measured continuous page.
*/
(function(){
  'use strict';
  function receiptReady(){return !!document.getElementById('receiptPrint')}
  if(!window.__nativePrint)window.__nativePrint=window.print.bind(window);

  function installMeasuredPageSize(){
    const receipt=document.getElementById('receiptPrint');
    if(!receipt)return;
    const pxPerMm=96/25.4;
    const measured=Math.ceil(receipt.scrollHeight/pxPerMm)+10;
    const rows=receipt.querySelectorAll('.bill-table tbody tr').length;
    const estimated=78+(rows*7.5);
    const mm=Math.min(1500,Math.max(110,measured,estimated));
    let style=document.getElementById('dynamicThermalPageSize');
    if(!style){style=document.createElement('style');style.id='dynamicThermalPageSize';document.head.appendChild(style)}
    style.textContent='@media print{@page{size:80mm '+mm+'mm;margin:0!important}html,body{width:80mm!important;max-width:80mm!important;height:'+mm+'mm!important;min-height:'+mm+'mm!important;margin:0!important;padding:0!important}#receiptPrint{width:80mm!important;min-width:80mm!important;max-width:80mm!important;transform:none!important;zoom:1!important}}';
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