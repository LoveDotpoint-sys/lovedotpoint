/* Love Dot Point POS v12 — stable waiter ordering + clean customer receipt */
(function(){
'use strict';
function escAttr(v){return String(v??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function currentTotal(){return items.reduce((a,b)=>a+Number(b.unit_price)*Number(b.qty||0),0)}
function currentCount(){return items.reduce((a,b)=>a+Number(b.qty||0),0)}
function updateTotalsOnly(){
 const total=currentTotal(),count=currentCount();
 document.querySelectorAll('.cart .total span:last-child,.sheet-body .total span:last-child').forEach(x=>x.textContent=money(total));
 const bar=document.querySelector('.mobile-order-bar');if(bar){const b=bar.querySelector('b'),s=bar.querySelector('span');if(b)b.textContent=count+' item'+(count===1?'':'s');if(s)s.textContent=money(total)}
 const sh=document.querySelector('.sheet-head span');if(sh)sh.textContent=count+' items';
}
function replaceMenuCard(menuId){
 const m=menu.find(x=>String(x.id)===String(menuId));if(!m)return;
 const cards=[...document.querySelectorAll('.menuitem')];
 const card=cards.find(c=>{const b=c.querySelector('.menu-copy>b');return b&&b.textContent.trim()===String(m.name).trim()});if(!card)return;
 const existing=items.find(i=>String(i.menu_item_id)===String(menuId));
 const old=card.querySelector('.inline-qty,.add-item-btn');if(!old)return;
 if(existing){const d=document.createElement('div');d.className='inline-qty';d.innerHTML=`<button onclick="qty('${existing.id}',${existing.qty-1})">−</button><b>${existing.qty}</b><button onclick="qty('${existing.id}',${existing.qty+1})">+</button>`;old.replaceWith(d)}
 else{const b=document.createElement('button');b.className='add-item-btn';b.setAttribute('onclick',`addItem(${m.id})`);b.textContent='+ Add';old.replaceWith(b)}
}
function cartLine(i){const d=document.createElement('div');d.className='cartline';d.dataset.orderId=String(i.id);d.innerHTML=`<div class="row"><div><b>${escAttr(i.item_name)}</b>${i.note?`<div class="note">${escAttr(i.note)}</div>`:''}</div><span>${money(Number(i.unit_price)*i.qty)}</span></div><div class="qty"><button class="qbtn" onclick="qty('${i.id}',${i.qty-1})">−</button><b>${i.qty}</b><button class="qbtn" onclick="qty('${i.id}',${i.qty+1})">+</button><button class="btn ghost note-btn" onclick="noteItem('${i.id}','${String(i.note||'').replaceAll("'","\\'")}')">Note</button></div>`;return d}
function syncCartItem(i,remove){
 document.querySelectorAll('.desktop-cart,.sheet-body').forEach(root=>{
  let line=[...root.querySelectorAll('.cartline')].find(x=>x.dataset.orderId===String(i.id));
  if(remove){if(line)line.remove();return}
  const fresh=cartLine(i);if(line)line.replaceWith(fresh);else{const total=root.querySelector('.total');if(total)root.insertBefore(fresh,total)}
  const empty=root.querySelector('.empty-order');if(empty)empty.remove();
 });
 updateTotalsOnly();
}
window.addItem=async function(id){
 const m=menu.find(x=>x.id===id);if(!m)return;const existing=items.find(x=>x.menu_item_id===id);if(existing)return window.qty(existing.id,existing.qty+1);
 const {data,error}=await sb.from('order_items').insert({session_id:selectedSession,menu_item_id:m.id,item_name:m.name,unit_price:m.price,qty:1}).select('*').single();if(error)return toast(error.message);
 items.push(data);replaceMenuCard(m.id);syncCartItem(data,false);
};
window.qty=async function(id,q){
 if(q<=0)return window.removeItem(id);const before=items.find(x=>String(x.id)===String(id));if(!before)return;
 const {data,error}=await sb.from('order_items').update({qty:q,updated_at:new Date().toISOString()}).eq('id',id).select('*').single();if(error)return toast(error.message);
 const n=items.findIndex(x=>String(x.id)===String(id));items[n]=data;replaceMenuCard(data.menu_item_id);syncCartItem(data,false);
};
window.removeItem=async function(id){
 const old=items.find(x=>String(x.id)===String(id));if(!old)return;const {error}=await sb.from('order_items').delete().eq('id',id);if(error)return toast(error.message);
 items=items.filter(x=>String(x.id)!==String(id));replaceMenuCard(old.menu_item_id);syncCartItem(old,true);
};
window.noteItem=async function(id,old){
 const note=prompt('Special note',old||'');if(note===null)return;const {data,error}=await sb.from('order_items').update({note,updated_at:new Date().toISOString()}).eq('id',id).select('*').single();if(error)return toast(error.message);
 const n=items.findIndex(x=>String(x.id)===String(id));if(n>=0)items[n]=data;syncCartItem(data,false);
};
window.receiptHtml=function({orderNo='',payment='',total=0,preview=false}={}){const now=new Date();return `<div class="receipt" id="receiptPrint"><div class="receipt-head"><img class="receipt-logo" src="https://wlediyikwdcmrkndgcfh.supabase.co/functions/v1/pos-logo" alt="Love Dot Point"><div class="receipt-title">LOVE DOT POINT RESTAURANT</div><div class="receipt-sub">PURE VEG · A.C. RESTAURANT</div><div class="receipt-address">41, 42, 43, Madhav Mall, Opp. Ratanba School,<br>Thakkarbapa Nagar, Ahmedabad - 382350</div><div class="receipt-phone">M: 9898014793</div>${preview?'<div class="preview-tag">BILL PREVIEW</div>':''}</div><div class="receipt-meta"><div><span>Table No.</span><b>${selectedTable}</b></div>${orderNo?`<div><span>Order No.</span><b>${orderNo}</b></div>`:''}<div><span>Date</span><b>${now.toLocaleDateString('en-IN')}</b></div><div><span>Time</span><b>${now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</b></div></div><table class="bill-table"><thead><tr><th>#</th><th>Item</th><th class="num">Qty</th><th class="num">Rate</th><th class="num">Amount</th></tr></thead><tbody>${billItemRows()}</tbody></table><div class="bill-summary"><div><span>Subtotal</span><b>${money(total)}</b></div><div class="grand"><span>GRAND TOTAL</span><b>${money(total)}</b></div></div><div class="receipt-footer">Thank You! Visit Again<br><small>Love Dot Point Restaurant · Pure Veg</small></div></div>`};
const oldHistoric=window.viewHistoricBill;if(typeof oldHistoric==='function')window.viewHistoricBill=async function(sessionId){await oldHistoric(sessionId);const r=document.getElementById('receiptPrint');if(!r)return;r.querySelectorAll('.bill-summary>div').forEach(row=>{const t=(row.textContent||'').trim().toLowerCase();if(t.startsWith('gst')||t.startsWith('payment'))row.remove()})};
})();