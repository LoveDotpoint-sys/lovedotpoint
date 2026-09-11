// Inline Note V4: instant visible note editing with live preview + autosave. Replaces blocking prompt behavior.
(function(){
  const timers=new Map();
  const saving=new Set();
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const escAttr=v=>esc(v).replace(/`/g,'&#96;');

  function itemById(id){return Array.isArray(items)?items.find(x=>String(x.id)===String(id)):null}
  function noteValue(id){return String(itemById(id)?.note||'')}

  function noteEditorHtml(id,note){
    return `<div class="inline-note-wrap" data-note-id="${escAttr(id)}">
      <div class="inline-note-current ${note?'has-note':'empty'}" data-note-display="${escAttr(id)}">${note?`<span>NOTE</span><b>${esc(note)}</b>`:'<span>NOTE</span><b>No note added</b>'}</div>
      <div class="inline-note-editor" data-note-editor="${escAttr(id)}" hidden>
        <label>Order Note</label>
        <div class="inline-note-entry">
          <input class="field inline-note-input" type="text" maxlength="160" value="${escAttr(note)}" data-saved-note="${escAttr(note)}" placeholder="e.g. Medium spicy / Less salt / No onion" oninput="previewInlineOrderNote('${escAttr(id)}',this)" onkeydown="if(event.key==='Enter'){event.preventDefault();saveInlineOrderNote('${escAttr(id)}',this)}">
          <button class="btn inline-note-save" type="button" onclick="saveInlineOrderNote('${escAttr(id)}',this.parentElement.querySelector('.inline-note-input'))">Save Note</button>
        </div>
        <div class="inline-note-status" data-note-status="${escAttr(id)}">Type karte hi note yahin show hoga aur auto-save hoga.</div>
        <button class="inline-note-close" type="button" onclick="closeInlineOrderNote('${escAttr(id)}',this)">Done</button>
      </div>
    </div>`;
  }

  function decorate(){
    if(!Array.isArray(items)||!items.length)return;
    document.querySelectorAll('.safety-cartline .note-btn').forEach(btn=>{
      const old=btn.getAttribute('onclick')||'';
      let id=btn.dataset.noteId||'';
      if(!id){const m=old.match(/noteItem\('([^']+)'/);if(m)id=m[1]}
      if(!id)return;
      btn.dataset.noteId=id;
      btn.setAttribute('onclick',`openInlineOrderNote('${id}',this);return false`);
      const item=itemById(id),note=String(item?.note||'');
      btn.textContent=note?'Edit Note':'+ Add Note';
      const card=btn.closest('.safety-cartline');if(!card)return;
      const legacy=card.querySelector('.row .note');if(legacy)legacy.classList.add('legacy-note-hidden');
      if(!card.querySelector(`.inline-note-wrap[data-note-id="${CSS.escape(id)}"]`)){
        const qty=card.querySelector('.qty');
        if(qty)qty.insertAdjacentHTML('afterend',noteEditorHtml(id,note));
        else card.insertAdjacentHTML('beforeend',noteEditorHtml(id,note));
      }
    });
  }

  function updateCopies(id,note,status){
    document.querySelectorAll(`[data-note-display="${CSS.escape(String(id))}"]`).forEach(el=>{
      el.classList.toggle('has-note',!!note);el.classList.toggle('empty',!note);
      el.innerHTML=note?`<span>NOTE</span><b>${esc(note)}</b>`:'<span>NOTE</span><b>No note added</b>';
    });
    document.querySelectorAll(`.note-btn[data-note-id="${CSS.escape(String(id))}"]`).forEach(btn=>btn.textContent=note?'Edit Note':'+ Add Note');
    if(status!==undefined)document.querySelectorAll(`[data-note-status="${CSS.escape(String(id))}"]`).forEach(el=>el.textContent=status);
  }

  window.openInlineOrderNote=function(id,btn){
    decorate();
    const card=btn?.closest?.('.safety-cartline')||document.querySelector(`.safety-cartline .note-btn[data-note-id="${CSS.escape(String(id))}"]`)?.closest('.safety-cartline');
    if(!card)return toast('Note editor load nahi hua');
    const editor=card.querySelector(`[data-note-editor="${CSS.escape(String(id))}"]`);if(!editor)return;
    editor.hidden=false;
    const input=editor.querySelector('.inline-note-input');
    if(input){input.value=noteValue(id);input.dataset.savedNote=noteValue(id);setTimeout(()=>{input.focus();input.setSelectionRange(input.value.length,input.value.length)},20)}
    updateCopies(id,noteValue(id),'Type karte hi note yahin show hoga aur auto-save hoga.');
  };

  window.previewInlineOrderNote=function(id,input){
    const value=String(input?.value||'').trim();
    updateCopies(id,value,'Saving note...');
    clearTimeout(timers.get(String(id)));
    timers.set(String(id),setTimeout(()=>window.saveInlineOrderNote(id,input,true),650));
  };

  window.saveInlineOrderNote=async function(id,input,quiet=false){
    id=String(id);if(!input)return;
    clearTimeout(timers.get(id));
    if(saving.has(id))return;
    const item=itemById(id);if(!item)return toast('Order item not found');
    const next=String(input.value||'').trim(),previous=String(input.dataset.savedNote??item.note??'');
    if(next===previous){updateCopies(id,next,'✓ Note saved');return}
    saving.add(id);updateCopies(id,next,'Saving note...');
    const {error}=await sb.from('order_items').update({note:next,updated_at:new Date().toISOString()}).eq('id',id);
    saving.delete(id);
    if(error){input.value=previous;updateCopies(id,previous,'Save failed · try again');toast(error.message);return}
    item.note=next;input.dataset.savedNote=next;
    document.querySelectorAll(`.inline-note-input`).forEach(other=>{if(other.closest(`[data-note-editor="${CSS.escape(id)}"]`)){other.value=next;other.dataset.savedNote=next}});
    updateCopies(id,next,'✓ Note saved');
    if(!quiet)toast(next?'Note saved':'Note removed');
  };

  window.closeInlineOrderNote=async function(id,btn){
    const editor=btn?.closest?.('.inline-note-editor');
    const input=editor?.querySelector('.inline-note-input');
    if(input)await window.saveInlineOrderNote(id,input,true);
    document.querySelectorAll(`[data-note-editor="${CSS.escape(String(id))}"]`).forEach(el=>el.hidden=true);
  };

  // Backward compatibility: any old Note click now opens the inline editor instead of browser prompt.
  window.noteItem=function(id){
    decorate();
    const btn=document.querySelector(`.note-btn[data-note-id="${CSS.escape(String(id))}"]`);
    if(btn)return window.openInlineOrderNote(id,btn);
    toast('Note editor load nahi hua');
  };

  let scheduled=false;
  const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;decorate()})};
  const observer=new MutationObserver(schedule);
  observer.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',()=>setTimeout(decorate,20));
  setTimeout(decorate,300);
})();