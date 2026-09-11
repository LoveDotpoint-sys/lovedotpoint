// POS Safety V3: save state, duplicate protection, quick qty, audited item cancel, repeat order, owner alerts, daily close lock.
(function(){
  const opLocks=new Set();
  let pendingOps=0;
  let syncState='saved';
  let lastOwnerAlertAt=0;
  let ownerAlertBusy=false;

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmtTime=v=>{try{return new Date(v).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}catch(e){return '-'}};
  const todayIndia=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());

  function ensureSyncBadge(){
    if(!me)return null;
    let el=document.getElementById('posSyncBadge');
    if(!el){
      el=document.createElement('div');el.id='posSyncBadge';el.className='pos-sync saved';
      const top=document.querySelector('.userbox');
      if(top)top.insertBefore(el,top.firstChild);else document.body.appendChild(el);
    }
    return el;
  }
  function paintSync(){
    const el=ensureSyncBadge();if(!el)return;
    el.className='pos-sync '+syncState;
    el.innerHTML=syncState==='saving'?'⟳ Saving...':syncState==='failed'?'! Save Failed':'✓ Saved';
  }
  function setSync(s){syncState=s;paintSync()}
  async function guarded(key,fn){
    if(opLocks.has(key)){toast('Update already in progress');return null}
    opLocks.add(key);pendingOps++;setSync('saving');
    try{const r=await fn();setSync('saved');return r}catch(e){setSync('failed');toast(e?.message||'Save failed');throw e}finally{opLocks.delete(key);pendingOps=Math.max(0,pendingOps-1);if(!pendingOps&&syncState!=='failed')setSync('saved')}
  }

  const baseAdd=window.addItem;
  const baseQty=window.qty;
  const baseNote=window.noteItem;
  if(typeof baseAdd==='function')window.addItem=function(id){return guarded('add:'+id,()=>baseAdd(id))};
  if(typeof baseQty==='function')window.qty=function(id,q){
    q=Number(q);
    if(q<=0)return window.showVoidItemModal(id);
    return guarded('qty:'+id,()=>baseQty(id,q));
  };
  if(typeof baseNote==='function')window.noteItem=function(id,old){return guarded('note:'+id,()=>baseNote(id,old))};

  window.repeatOrderItem=function(id){
    const i=items.find(x=>String(x.id)===String(id));if(!i)return toast('Item not found');
    return window.qty(id,Number(i.qty||0)+1);
  };
  window.quickQty=function(id,n){return window.qty(id,Number(n))};

  window.showVoidItemModal=function(id){
    const i=items.find(x=>String(x.id)===String(id));if(!i)return toast('Item not found');
    window.__voidItemId=id;
    const box=document.getElementById('modalbox');if(!box)return;
    box.innerHTML=`<div class="eyebrow">ORDER CONTROL · AUDITED CANCEL</div><h2>Cancel ${esc(i.item_name)}</h2><div class="note">Item order se remove hoga aur cancel reason owner audit me save rahega.</div><div class="void-reasons"><label><input type="radio" name="voidReason" value="Customer Cancelled" checked> Customer Cancelled</label><label><input type="radio" name="voidReason" value="Wrong Entry"> Wrong Entry</label><label><input type="radio" name="voidReason" value="Duplicate Entry"> Duplicate Entry</label><label><input type="radio" name="voidReason" value="Unavailable Item"> Unavailable Item</label><label><input type="radio" name="voidReason" value="Other"> Other</label></div><input id="voidReasonOther" class="field" placeholder="Optional note / other reason"><div class="bill-actions"><button class="btn ghost" onclick="closeModal()">Keep Item</button><button class="btn red" onclick="confirmVoidOrderItem()">Cancel Item</button></div>`;
    document.getElementById('modal').classList.remove('hidden');
  };

  window.confirmVoidOrderItem=async function(){
    const id=window.__voidItemId;if(!id)return;
    const selected=document.querySelector('input[name="voidReason"]:checked')?.value||'Other';
    const extra=(document.getElementById('voidReasonOther')?.value||'').trim();
    const reason=selected==='Other'?(extra||'Other'):selected+(extra?' · '+extra:'');
    await guarded('void:'+id,async()=>{
      const {error}=await sb.rpc('void_order_item',{p_item_id:id,p_reason:reason});
      if(error)throw error;
      closeModal();await refreshAll();if(view==='menu')renderMenu();toast('Item cancelled · reason saved');
    });
  };

  function qtyInput(i,cls=''){
    const q=Math.max(1,Number(i.qty)||1);
    return `<input class="qty-number ${cls}" type="number" inputmode="numeric" min="1" max="999" step="1" value="${q}" data-item-id="${i.id}" onfocus="this.select()" onkeydown="if(event.key==='Enter')this.blur()" onchange="setQtyFromInput('${i.id}',this)">`;
  }
  function presets(i){return `<div class="quick-qty"><span>Quick Qty</span>${[1,2,3,5,10].map(n=>`<button class="${Number(i.qty)===n?'active':''}" onclick="quickQty('${i.id}',${n})">${n}</button>`).join('')}</div>`}

  window.orderCartHtml=function(mobile=false){
    const total=items.reduce((a,b)=>a+Number(b.unit_price)*Number(b.qty||0),0);
    return `${items.length?items.map(i=>`<div class="cartline safety-cartline"><div class="row"><div><b>${esc(i.item_name)}</b><div class="item-time">Added ${fmtTime(i.created_at)}</div>${i.note?`<div class="note">${esc(i.note)}</div>`:''}</div><span>${money(Number(i.unit_price)*Number(i.qty||0))}</span></div><div class="qty qty-editable"><button class="qbtn" onclick="qty('${i.id}',${Number(i.qty)-1})">−</button>${qtyInput(i,'cart-qty-input')}<button class="qbtn" onclick="qty('${i.id}',${Number(i.qty)+1})">+</button><button class="btn ghost note-btn" onclick="noteItem('${i.id}','${String(i.note||'').replaceAll("'","\\'")}')">Note</button></div>${presets(i)}<div class="item-actions"><button onclick="repeatOrderItem('${i.id}')">↻ Repeat +1</button><button class="danger-link" onclick="showVoidItemModal('${i.id}')">Cancel Item</button></div></div>`).join(''):'<div class="empty-order">No items added yet</div>'}<div class="total"><span>Total</span><span>${money(total)}</span></div><button class="btn green bill-btn" onclick="billing()" ${items.length?'':'disabled'}>Billing / Payment</button>`;
  };

  window.menuResultHtml=function(q,cat){
    const list=q?menu.filter(x=>x.name.toLowerCase().includes(q)||x.category.toLowerCase().includes(q)):menu.filter(x=>x.category===cat);
    return `${q?`<div class="note" style="margin-bottom:8px">Search results from all categories · ${list.length} item${list.length===1?'':'s'} found</div>`:''}<div class="menugrid">${list.length?list.map(x=>{const existing=items.find(i=>String(i.menu_item_id)===String(x.id));return `<div class="menuitem"><div class="menu-copy"><b>${esc(x.name)}</b><span class="price">${money(x.price)}</span>${q?`<small class="note">${esc(x.category)}</small>`:''}</div>${existing?`<div class="inline-qty qty-editable"><button onclick="qty('${existing.id}',${Number(existing.qty)-1})">−</button>${qtyInput(existing,'menu-qty-input')}<button onclick="qty('${existing.id}',${Number(existing.qty)+1})">+</button></div>`:`<button class="add-item-btn" onclick="addItem(${x.id})">+ Add</button>`}</div>`}).join(''):`<div class="card note">${q?'No menu item found. Try another name.':'No item found in this category.'}</div>`}</div>`;
  };

  const baseGo=window.go;
  if(typeof baseGo==='function')window.go=function(v){if(pendingOps){toast('Order save ho raha hai · ek moment wait karein');return}return baseGo(v)};
  window.addEventListener('beforeunload',e=>{if(pendingOps){e.preventDefault();e.returnValue='Order update is still saving.'}});

  async function ownerAlerts(){
    if(!me||me.role!=='owner'||view!=='tables'||ownerAlertBusy)return;
    if(Date.now()-lastOwnerAlertAt<12000)return;
    ownerAlertBusy=true;lastOwnerAlertAt=Date.now();
    try{
      const activeTables=tables.filter(t=>t.status==='occupied'&&t.active_session_id);
      const ids=[...new Set(activeTables.map(t=>t.active_session_id).filter(Boolean))];
      let rows=[];
      if(ids.length){const q=await sb.from('order_items').select('session_id,unit_price,qty').in('session_id',ids);if(q.error)throw q.error;rows=q.data||[]}
      const totals={};rows.forEach(r=>totals[r.session_id]=(totals[r.session_id]||0)+Number(r.unit_price||0)*Number(r.qty||0));
      const high=activeTables.filter(t=>(totals[t.active_session_id]||0)>=3000);
      const empty=[];
      activeTables.forEach(t=>{const s=sessions.find(x=>String(x.id)===String(t.active_session_id));const age=s?.started_at?Math.floor((Date.now()-new Date(s.started_at).getTime())/60000):0;if((totals[t.active_session_id]||0)===0&&age>=10)empty.push({t,age})});
      const grid=document.querySelector('#main .tablegrid');if(!grid)return;
      let box=document.getElementById('ownerLiveAlerts');
      const html=`<section id="ownerLiveAlerts" class="owner-live-alerts"><div class="owner-alert-head"><b>Owner Live Alerts</b><span>Auto checks every 15 sec</span></div>${high.length?`<div class="owner-alert-row high"><b>High Bill</b><span>${high.map(t=>`Table ${t.table_no} · ${money(totals[t.active_session_id])}`).join(' • ')}</span></div>`:''}${empty.length?`<div class="owner-alert-row warn"><b>Empty Occupied</b><span>${empty.map(x=>`Table ${x.t.table_no} · ${x.age} Min`).join(' • ')}</span></div>`:''}${!high.length&&!empty.length?'<div class="owner-alert-row ok"><b>All Clear</b><span>No high-bill or empty-occupied alert right now.</span></div>':''}</section>`;
      if(box){box.outerHTML=html}else grid.insertAdjacentHTML('beforebegin',html);
    }catch(e){console.warn('Owner alerts',e)}finally{ownerAlertBusy=false}
  }

  async function closingState(){
    const date=todayIndia();
    const {data,error}=await sb.from('daily_closings').select('*').eq('business_date',date).maybeSingle();
    if(error)throw error;return {date,row:data,locked:!!(data&&!data.reopened_at)};
  }
  async function injectClosingLock(){
    if(!me||me.role!=='owner')return;
    const box=document.getElementById('modalbox');if(!box||!box.textContent.includes('Daily Closing'))return;
    let state;try{state=await closingState()}catch(e){return}
    let host=document.getElementById('dailyCloseLockPanel');if(host)return;
    host=document.createElement('div');host.id='dailyCloseLockPanel';host.className='daily-close-lock';
    const active=tables.filter(t=>t.status==='occupied').length;
    if(state.locked){host.innerHTML=`<div><b>🔒 Day Locked</b><span>${state.date} · New table assignment blocked at database level.</span></div><button class="btn ghost" onclick="ownerReopenToday()">Reopen Today</button>`}
    else{host.innerHTML=`<div><b>Final Day Lock</b><span>${active?active+' active table(s) must be finished/released first.':'Floor clear · lock creates final sales snapshot.'}</span></div><button class="btn" ${active?'disabled':''} onclick="ownerLockToday()">Lock Today</button>`}
    box.appendChild(host);
  }
  window.ownerLockToday=async function(){
    if(me?.role!=='owner')return;
    if(!confirm('Final Daily Closing lock karein? New tables tab tak start nahi honge jab tak owner day reopen na kare.'))return;
    await guarded('daily-close',async()=>{const {error}=await sb.rpc('owner_close_business_day',{p_date:todayIndia()});if(error)throw error;toast('Daily closing locked');const p=document.getElementById('dailyCloseLockPanel');if(p)p.remove();await injectClosingLock()});
  };
  window.ownerReopenToday=async function(){
    if(me?.role!=='owner')return;
    if(!confirm('Today business day reopen karein? New orders phir se allow honge.'))return;
    await guarded('daily-reopen',async()=>{const {error}=await sb.rpc('owner_reopen_business_day',{p_date:todayIndia()});if(error)throw error;toast('Business day reopened');const p=document.getElementById('dailyCloseLockPanel');if(p)p.remove();await injectClosingLock()});
  };

  const baseClosing=window.ownerDailyClosing;
  if(typeof baseClosing==='function')window.ownerDailyClosing=async function(){await baseClosing();setTimeout(injectClosingLock,150)};

  setInterval(()=>{paintSync();ownerAlerts()},5000);
  document.addEventListener('click',()=>setTimeout(()=>{paintSync();ownerAlerts()},120));
  setTimeout(()=>{paintSync();ownerAlerts()},600);
})();