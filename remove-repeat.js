// Remove the Repeat action from the waiter order UI. Quantity remains controlled by +/- , direct input and Quick Qty presets.
(function(){
  const baseOrderCartHtml=window.orderCartHtml;
  if(typeof baseOrderCartHtml!=='function')return;
  window.orderCartHtml=function(mobile=false){
    return baseOrderCartHtml(mobile).replace(/<button onclick="repeatOrderItem\('[^']+'\)">↻ Repeat \+1<\/button>/g,'');
  };
  try{delete window.repeatOrderItem}catch(e){window.repeatOrderItem=undefined}
})();
