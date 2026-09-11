/* Love Dot Point POS - Mobile Print V2
   Receipt-only browser printing for the final completed bill.
   Keeps #receiptPrint in the DOM so mobile printing cannot lose the receipt.
*/
(function(){
  'use strict';
  function receiptReady(){return !!document.getElementById('receiptPrint')}
  if(!window.__nativePrint)window.__nativePrint=window.print.bind(window);

  window.continueReceiptPrint=function(){
    if(!receiptReady()){
      if(typeof toast==='function')toast('Final bill receipt abhi available nahi hai.');
      return;
    }
    document.documentElement.classList.add('receipt-printing');
    setTimeout(function(){
      try{window.__nativePrint.call(window)}finally{
        setTimeout(function(){document.documentElement.classList.remove('receipt-printing')},700);
      }
    },80);
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