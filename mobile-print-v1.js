/* Love Dot Point POS - isolated thermal receipt printing
   Do NOT paginate the full POS page. Build a temporary print-only document containing
   only the final receipt, then size that document from its rendered content. */
(function(){
 'use strict';
 function receiptReady(){return !!document.getElementById('receiptPrint')}
 if(!window.__nativePrint)window.__nativePrint=window.print.bind(window);
 function cleanReceipt(node){
  node.querySelectorAll('.bill-table tbody td small').forEach(function(el){el.remove()});
  node.querySelectorAll('.payment-mode-row,.gst-row,[data-print-hide="true"]').forEach(function(el){el.remove()});
  return node;
 }
 function printIsolated(){
  const src=document.getElementById('receiptPrint');if(!src)return;
  const receipt=cleanReceipt(src.cloneNode(true));
  const frame=document.createElement('iframe');
  frame.setAttribute('aria-hidden','true');
  frame.style.cssText='position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none';
  document.body.appendChild(frame);
  const d=frame.contentDocument;
  d.open();
  d.write('<!doctype html><html><head><meta charset="utf-8"><title></title><style>html,body{margin:0;padding:0;background:#fff;width:1024px;overflow:hidden}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#000}#receiptPrint{position:relative;width:1024px;margin:0;padding:0 30px 12px;background:#fff;font-size:30px;line-height:1.25}.receipt-logo{display:block;width:130px;height:130px;object-fit:contain;margin:0 auto 4px;filter:grayscale(1) contrast(1.35)}.receipt-head{text-align:center;border-bottom:2px dashed #000;padding:0 0 10px;margin:0 0 10px}.receipt-title{font-size:44px;line-height:1.02;font-weight:900}.receipt-sub{font-size:28px;font-weight:900;margin-top:3px}.receipt-address,.receipt-phone{font-size:25px;line-height:1.15;margin-top:3px}.preview-tag{display:none!important}.receipt-meta{display:grid;grid-template-columns:1fr 1fr;gap:5px 28px;padding:0 0 10px;margin:0 0 7px;border-bottom:2px dashed #000}.receipt-meta>div{display:flex;justify-content:space-between;gap:10px;font-size:25px;min-width:0}.receipt-meta span{white-space:nowrap}.receipt-meta b{text-align:right}.bill-table{width:100%;border-collapse:collapse;table-layout:fixed;margin:0;font-size:27px}.bill-table th{font-size:25px;font-weight:900;border-bottom:2px solid #000;padding:8px 4px;text-align:left}.bill-table td{padding:9px 4px;vertical-align:top;overflow-wrap:anywhere}.bill-table th:nth-child(1),.bill-table td:nth-child(1){width:48px}.bill-table th:nth-child(2),.bill-table td:nth-child(2){width:auto}.bill-table th:nth-child(3),.bill-table td:nth-child(3){width:92px}.bill-table th:nth-child(4),.bill-table td:nth-child(4){width:145px}.bill-table th:nth-child(5),.bill-table td:nth-child(5){width:190px}.num{text-align:right;white-space:nowrap}.itemname{font-weight:700}.itemname small,.bill-table tbody td small{display:none!important}.bill-summary{width:100%;margin:7px 0 0;border-top:2px dashed #000;padding-top:6px}.bill-summary>div{display:flex;justify-content:space-between;gap:20px;padding:4px 0;font-size:28px}.bill-summary .grand{font-size:40px;line-height:1.1;font-weight:900;border-top:3px solid #000;border-bottom:3px solid #000;margin:5px 0;padding:7px 0}.receipt-footer{text-align:center;border-top:2px dashed #000;margin-top:9px;padding:9px 0 4px;font-size:28px;font-weight:900}.receipt-footer small{font-size:23px;font-weight:400}.bill-actions,.payment-box{display:none!important}</style></head><body></body></html>');
  d.close();
  d.body.appendChild(d.importNode(receipt,true));
  function finish(){
   const r=d.getElementById('receiptPrint');if(!r)return;
   const h=Math.ceil(Math.max(r.scrollHeight,r.getBoundingClientRect().height)+8);
   const s=d.createElement('style');
   s.textContent='@page{size:1024px '+h+'px;margin:0}@media print{html,body{margin:0!important;padding:0!important;width:1024px!important;height:'+h+'px!important;overflow:hidden!important}#receiptPrint{margin:0!important;page-break-after:avoid!important;break-after:avoid-page!important}.bill-table tr,.bill-summary,.receipt-footer{break-inside:avoid!important;page-break-inside:avoid!important}}';
   d.head.appendChild(s);
   setTimeout(function(){try{frame.contentWindow.focus();frame.contentWindow.print()}finally{setTimeout(function(){frame.remove()},3000)}},120);
  }
  const imgs=[].slice.call(d.images||[]);
  if(!imgs.length||imgs.every(function(i){return i.complete}))requestAnimationFrame(function(){requestAnimationFrame(finish)});
  else{let left=imgs.filter(function(i){return !i.complete}).length;imgs.forEach(function(i){if(i.complete)return;i.onload=i.onerror=function(){left--;if(left<=0)finish()}});setTimeout(finish,1200)}
 }
 window.continueReceiptPrint=function(){if(!receiptReady()){if(typeof toast==='function')toast('Final bill receipt abhi available nahi hai.');return}printIsolated()};
 window.print=function(){if(!receiptReady()){if(typeof toast==='function')toast('Pehle payment complete karke final bill banayein.');return}return window.continueReceiptPrint()};
 window.mobilePrintInfo={receiptReady:receiptReady};
})();
