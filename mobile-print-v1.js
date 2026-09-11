/* Love Dot Point POS - Mobile Print V1
   Browser-safe receipt printing UX for Android/USB workflows.
   Note: a web page cannot install an Android USB printer driver. This layer
   makes receipt printing predictable and prevents accidental non-receipt prints.
*/
(function(){
  'use strict';

  function isMobile(){return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent||'')}
  function isAndroid(){return /Android/i.test(navigator.userAgent||'')}
  function receiptReady(){return !!document.getElementById('receiptPrint')}

  function showPrintHelp(){
    const box=document.getElementById('modalbox');
    const modal=document.getElementById('modal');
    if(!box||!modal)return;
    box.innerHTML=`
      <div class="mobile-print-help">
        <h2>Print Bill</h2>
        <div class="note" style="margin-bottom:14px">Epson TM-T82X · 80mm Receipt</div>
        <div style="display:grid;gap:10px;margin:14px 0">
          <div class="print-step"><b>1</b><span>Printer ON rakhein aur 80mm paper check karein.</span></div>
          <div class="print-step"><b>2</b><span>Phone ko OTG + USB printer cable se connect karein.</span></div>
          <div class="print-step"><b>3</b><span>Android USB permission aaye to Allow karein.</span></div>
          <div class="print-step"><b>4</b><span>Continue Print dabakar receipt print service/printer select karein.</span></div>
        </div>
        <div class="note">Print preview me sirf bill copy aayegi. Paper: 80mm, Scale: 100%, Headers/Footers: Off.</div>
        <div class="row" style="margin-top:16px">
          <button class="btn ghost" onclick="closeModal()">Cancel</button>
          <button class="btn" onclick="window.continueReceiptPrint()">Continue Print</button>
        </div>
      </div>`;
    modal.classList.remove('hidden');
  }

  window.continueReceiptPrint=function(){
    if(!receiptReady()){
      if(typeof toast==='function')toast('Bill receipt ready nahi hai. Pehle billing complete kijiye.');
      return;
    }
    if(typeof closeModal==='function')closeModal();
    document.documentElement.classList.add('receipt-printing');
    setTimeout(function(){
      try{window.__nativePrint.call(window)}finally{
        setTimeout(function(){document.documentElement.classList.remove('receipt-printing')},700);
      }
    },120);
  };

  // Keep original browser print available for the final system dialog.
  if(!window.__nativePrint)window.__nativePrint=window.print.bind(window);

  window.print=function(){
    if(!receiptReady())return window.__nativePrint.call(window);
    if(isMobile())return showPrintHelp();
    return window.__nativePrint.call(window);
  };

  window.mobilePrintInfo={isMobile:isMobile,isAndroid:isAndroid,receiptReady:receiptReady};
})();