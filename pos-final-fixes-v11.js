/* Love Dot Point POS v11 — targeted production fixes
   1) Waiter order changes update only order UI/local state (no refreshAll/full page reload).
   2) Customer receipt never prints GST status or payment mode.
   3) Historical reprint removes those internal/accounting rows too.
*/
(function(){
'use strict';
function repaintOrder(){
  const search=document.getElementById('menuSearchInput');
  const focus=!!search&&document.activeElement===search;
  const start=focus?search.selectionStart:null,end=focus?search.selectionEnd:null;
  if(typeof renderMenu==='function')renderMenu();
  if(focus){const n=document.getElementById('menuSearchInput');if(n){n.focus({preventScroll:true});try{n.setSelectionRange(start,end)}catch(e){}}}
}
window.addItem=async function(id){
  const m=menu.find(x=>x.id===id);if(!m)return;
  const existing=items.find(x=>x.menu_item_id===id);if(existing)return window.qty(existing.id,existing.qty+1);
  const {data,error}=await sb.from('order_items').insert({session_id:selectedSession,menu_item_id:m.id,item_name:m.name,unit_price:m.price,qty:1}).select('*').single();
  if(error)return toast(error.message);items.push(data);repaintOrder();
};
window.qty=async function(id,q){
  if(q<=0)return window.removeItem(id);
  const {data,error}=await sb.from('order_items').update({qty:q,updated_at:new Date().toISOString()}).eq('id',id).select('*').single();
  if(error)return toast(error.message);const i=items.findIndex(x=>String(x.id)===String(id));if(i>=0)items[i]=data;repaintOrder();
};
window.removeItem=async function(id){
  const {error}=await sb.from('order_items').delete().eq('id',id);if(error)return toast(error.message);
  items=items.filter(x=>String(x.id)!==String(id));repaintOrder();
};
window.noteItem=async function(id,old){
  const note=prompt('Special note',old||'');if(note===null)return;
  const {data,error}=await sb.from('order_items').update({note,updated_at:new Date().toISOString()}).eq('id',id).select('*').single();
  if(error)return toast(error.message);const i=items.findIndex(x=>String(x.id)===String(id));if(i>=0)items[i]=data;repaintOrder();
};

window.receiptHtml=function({orderNo='',payment='',total=0,preview=false}={}){
  const now=new Date();
  return `<div class="receipt" id="receiptPrint"><div class="receipt-head"><img class="receipt-logo" src="https://wlediyikwdcmrkndgcfh.supabase.co/functions/v1/pos-logo" alt="Love Dot Point"><div class="receipt-title">LOVE DOT POINT RESTAURANT</div><div class="receipt-sub">PURE VEG · A.C. RESTAURANT</div><div class="receipt-address">41, 42, 43, Madhav Mall, Opp. Ratanba School,<br>Thakkarbapa Nagar, Ahmedabad - 382350</div><div class="receipt-phone">M: 9898014793</div>${preview?'<div class="preview-tag">BILL PREVIEW</div>':''}</div><div class="receipt-meta"><div><span>Table No.</span><b>${selectedTable}</b></div>${orderNo?`<div><span>Order No.</span><b>${orderNo}</b></div>`:''}<div><span>Date</span><b>${now.toLocaleDateString('en-IN')}</b></div><div><span>Time</span><b>${now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</b></div></div><table class="bill-table"><thead><tr><th>#</th><th>Item</th><th class="num">Qty</th><th class="num">Rate</th><th class="num">Amount</th></tr></thead><tbody>${billItemRows()}</tbody></table><div class="bill-summary"><div><span>Subtotal</span><b>${money(total)}</b></div><div class="grand"><span>GRAND TOTAL</span><b>${money(total)}</b></div></div><div class="receipt-footer">Thank You! Visit Again<br><small>Love Dot Point Restaurant · Pure Veg</small></div></div>`;
};

const oldHistoric=window.viewHistoricBill;
if(typeof oldHistoric==='function')window.viewHistoricBill=async function(sessionId){
  await oldHistoric(sessionId);
  const r=document.getElementById('receiptPrint');if(!r)return;
  r.querySelectorAll('.bill-summary>div').forEach(function(row){const t=(row.textContent||'').trim().toLowerCase();if(t.startsWith('gst')||t.startsWith('payment'))row.remove()});
};
})();
