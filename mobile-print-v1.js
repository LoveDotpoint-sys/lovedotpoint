/* Love Dot Point POS - Mobile Print V3
   Receipt-only browser printing tuned for Android + Epson TM Print Assistant.
*/
(function(){
  'use strict';
  function receiptReady(){return !!document.getElementById('receiptPrint')}
  if(!window.__nativePrint)window.__nativePrint=window.print.bind(window);

  function preparePrintMode(){
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
        setTimeout(cleanupPrintMode,1400);
      }
    },180);
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