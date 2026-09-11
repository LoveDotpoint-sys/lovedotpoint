(function(){
  function qtyInputHtml(item, cls=''){
    const q=Math.max(1,Number(item.qty)||1);
    return `<input class="qty-number ${cls}" type="number" inputmode="numeric" min="1" max="999" step="1" value="${q}" aria-label="Quantity for ${String(item.item_name||'item').replaceAll('"','&quot;')}" onfocus="this.select()" onwheel="this.blur()" onkeydown="if(event.key==='Enter')this.blur()" onchange="setQtyFromInput('${item.id}',this)">`;
  }

  window.setQtyFromInput=async function(id,input){
    const current=items.find(x=>String(x.id)===String(id));
    if(!current)return;
    const raw=String(input?.value??'').trim();
    let next=Number.parseInt(raw,10);
    if(!Number.isFinite(next)||next<1){
      input.value=current.qty;
      return toast('Quantity 1 ya usse zyada rakhein.');
    }
    if(next>999){
      next=999;
      input.value=999;
      toast('Maximum quantity 999 hai.');
    }
    if(Number(current.qty)===next)return;
    input.disabled=true;
    try{
      await qty(id,next);
    }finally{
      if(input)input.disabled=false;
    }
  };

  window.orderCartHtml=function(mobile=false){
    const total=items.reduce((a,b)=>a+Number(b.unit_price)*b.qty,0);
    return `${items.length?items.map(i=>`<div class="cartline"><div class="row"><div><b>${i.item_name}</b>${i.note?`<div class="note">${i.note}</div>`:''}</div><span>${money(Number(i.unit_price)*i.qty)}</span></div><div class="qty qty-editable"><button class="qbtn" onclick="qty('${i.id}',${i.qty-1})" aria-label="Decrease ${i.item_name}">−</button>${qtyInputHtml(i,'cart-qty-input')}<button class="qbtn" onclick="qty('${i.id}',${i.qty+1})" aria-label="Increase ${i.item_name}">+</button><button class="btn ghost note-btn" onclick="noteItem('${i.id}','${(i.note||'').replaceAll("'","\\'")}')">Note</button></div></div>`).join(''):'<div class="empty-order">No items added yet</div>'}<div class="total"><span>Total</span><span>${money(total)}</span></div><button class="btn green bill-btn" onclick="billing()" ${items.length?'':'disabled'}>Billing / Payment</button>`;
  };

  window.menuResultHtml=function(q,cat){
    const list=q?menu.filter(x=>x.name.toLowerCase().includes(q)||x.category.toLowerCase().includes(q)):menu.filter(x=>x.category===cat);
    return `${q?`<div class="note" style="margin-bottom:8px">Search results from all categories · ${list.length} item${list.length===1?'':'s'} found</div>`:''}<div class="menugrid">${list.length?list.map(x=>{const existing=items.find(i=>i.menu_item_id===x.id);return `<div class="menuitem"><div class="menu-copy"><b>${x.name}</b><span class="price">${money(x.price)}</span>${q?`<small class="note">${x.category}</small>`:''}</div>${existing?`<div class="inline-qty qty-editable"><button onclick="qty('${existing.id}',${existing.qty-1})" aria-label="Decrease ${x.name}">−</button>${qtyInputHtml(existing,'menu-qty-input')}<button onclick="qty('${existing.id}',${existing.qty+1})" aria-label="Increase ${x.name}">+</button></div>`:`<button class="add-item-btn" onclick="addItem(${x.id})">+ Add</button>`}</div>`}).join(''):`<div class="card note">${q?'No menu item found. Try another name.':'No item found in this category.'}</div>`}</div>`;
  };
})();