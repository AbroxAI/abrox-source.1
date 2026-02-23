// bubble-renderer.js — Telegram style bubble renderer with dynamic tail alignment
(function(){
  'use strict';

  function init(){
    const container = document.getElementById('tg-comments-container');
    const jumpIndicator = document.getElementById('tg-jump-indicator');
    const jumpText = document.getElementById('tg-jump-text');
    const metaLine = document.getElementById('tg-meta-line');

    if(!container){ console.error('bubble-renderer: container missing'); return; }

    // Read avatar size from CSS variable
    let AVATAR_DIAM = 40;
    try{
      const v = getComputedStyle(document.documentElement).getPropertyValue('--tg-avatar-size');
      if(v){ const parsed = parseInt(v.trim(), 10); if(!Number.isNaN(parsed) && parsed>0) AVATAR_DIAM=parsed; }
    }catch(e){}

    const BUBBLE_RADIUS = 18;
    const GAP = Math.floor(AVATAR_DIAM * 0.6); // fallback gap

    let lastMessageDateKey = null;
    let unseenCount = 0;
    const MESSAGE_MAP = new Map();

    const typingSet = new Set();
    const typingTimeouts = new Map();

    function formatTime(date){ try{ return new Date(date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}); }catch(e){ return ''; } }
    function formatDateKey(date){ const d = new Date(date); return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`; }

    function insertDateSticker(dateObj){
      const key = formatDateKey(dateObj);
      if(key===lastMessageDateKey) return;
      lastMessageDateKey = key;
      const sticker = document.createElement('div');
      sticker.className = 'tg-date-sticker';
      sticker.textContent = new Date(dateObj).toLocaleDateString([], {year:'numeric', month:'short', day:'numeric'});
      container.appendChild(sticker);
    }

    function createBubbleElement(persona, text, opts={}){
      const timestamp = opts.timestamp||new Date();
      const type = opts.type==='outgoing'?'outgoing':'incoming';
      const replyToText = opts.replyToText||null;
      const replyToId = opts.replyToId||null;
      const image = opts.image||null;
      const caption = opts.caption||null;
      const id = opts.id||('m_'+Date.now()+'_'+Math.floor(Math.random()*9999));

      insertDateSticker(timestamp);

      const wrapper = document.createElement('div');
      wrapper.className = `tg-bubble ${type}`;
      wrapper.dataset.id = id;
      wrapper.style.position='relative';

      const avatar = document.createElement('img');
      avatar.className='tg-bubble-avatar';
      avatar.alt = persona?.name||'user';
      avatar.src=persona?.avatar||`https://ui-avatars.com/api/?name=${encodeURIComponent(persona?.name||'U')}&size=${AVATAR_DIAM}`;
      avatar.style.objectFit='cover';
      avatar.onerror=()=>{ avatar.src=`https://ui-avatars.com/api/?name=${encodeURIComponent(persona?.name||'U')}&size=${AVATAR_DIAM}`; };

      const content = document.createElement('div');
      content.className='tg-bubble-content';
      content.style.borderRadius=BUBBLE_RADIUS+'px';
      content.style.padding='10px 14px';
      content.style.fontSize='14px';
      content.style.lineHeight='1.35';
      content.style.wordBreak='break-word';
      content.style.position='relative';
      content.style.boxShadow='0 4px 12px rgba(0,0,0,0.18)';
      content.style.background=type==='incoming'?'#182533':'#2b6df6';
      content.style.color=type==='incoming'?'#e6eef8':'#fff';

      // dynamically align tail
      const tailOffset = Math.floor(GAP/2 - 2); // tweak visually
      content.style.setProperty('--tg-tail-offset', tailOffset+'px');

      if(replyToText||replyToId){
        const rp=document.createElement('div');
        rp.className='tg-reply-preview';
        rp.textContent=replyToText? (replyToText.length>120?replyToText.slice(0,117)+'...':replyToText) : 'Reply';
        rp.addEventListener('click',()=>{ if(replyToId&&MESSAGE_MAP.has(replyToId)){ const target=MESSAGE_MAP.get(replyToId).el; target.scrollIntoView({behavior:'smooth', block:'center'}); target.classList.add('tg-highlight'); setTimeout(()=>target.classList.remove('tg-highlight'),2600); } });
        content.appendChild(rp);
      }

      const sender=document.createElement('div'); sender.className='tg-bubble-sender'; sender.textContent=persona?.name||'User'; content.appendChild(sender);

      if(image){ const img=document.createElement('img'); img.className='tg-bubble-image'; img.src=image; img.style.maxWidth='100%'; img.style.borderRadius='12px'; img.onerror=()=>{img.style.display='none'}; content.appendChild(img); }

      const textEl=document.createElement('div'); textEl.className='tg-bubble-text'; textEl.textContent=text||''; content.appendChild(textEl);
      if(caption){ const cap=document.createElement('div'); cap.className='tg-bubble-text'; cap.style.marginTop='6px'; cap.textContent=caption; content.appendChild(cap); }

      const meta=document.createElement('div'); meta.className='tg-bubble-meta';
      const time=document.createElement('span'); time.textContent=formatTime(timestamp); meta.appendChild(time); content.appendChild(meta);

      if(type==='incoming'){ wrapper.appendChild(avatar); wrapper.appendChild(content); wrapper.style.justifyContent='flex-start'; }
      else{ wrapper.style.flexDirection='row-reverse'; wrapper.appendChild(avatar); wrapper.appendChild(content); wrapper.style.justifyContent='flex-end'; }

      wrapper.addEventListener('contextmenu',(e)=>{ e.preventDefault(); document.dispatchEvent(new CustomEvent('messageContext',{detail:{id,persona,text}})); });

      return {wrapper,id,text,persona,timestamp};
    }

    function appendMessage(persona,text,opts={}){ const id=opts.id||('m_'+Date.now()+'_'+Math.floor(Math.random()*9999)); opts.id=id;
      const created=createBubbleElement(persona,text,opts); if(!created) return null;
      const el=created.wrapper; container.appendChild(el);
      MESSAGE_MAP.set(id,{el,text:created.text,persona:created.persona,timestamp:created.timestamp});

      const atBottom=(container.scrollTop+container.clientHeight)>=(container.scrollHeight-120);
      if(atBottom){ container.scrollTop=container.scrollHeight; hideJump(); } else { unseenCount++; updateJump(); showJump(); }

      if(window.lucide?.createIcons){ try{window.lucide.createIcons()}catch(e){} }
      return id;
    }

    function updateJump(){ if(jumpText){ jumpText.textContent=unseenCount>1? `New messages · ${unseenCount}`:'New messages'; } }
    function showJump(){ jumpIndicator?.classList.remove('hidden'); }
    function hideJump(){ jumpIndicator?.classList.add('hidden'); unseenCount=0; updateJump(); }

    jumpIndicator?.addEventListener('click',()=>{ container.scrollTop=container.scrollHeight; hideJump(); });
    container.addEventListener('scroll',()=>{ const bottom=container.scrollHeight-container.scrollTop-container.clientHeight; bottom>100?showJump():hideJump(); });

    document.addEventListener('headerTyping',(ev)=>{ try{
      const name=ev.detail?.name||'Someone';
      typingSet.add(name); if(typingTimeouts.has(name)) clearTimeout(typingTimeouts.get(name));
      if(metaLine){ metaLine.style.opacity='0.95'; metaLine.textContent=typingSet.size>1? Array.from(typingSet).join(', ')+' are typing...':Array.from(typingSet)[0]+' is typing...'; }
      typingTimeouts.set(name,setTimeout(()=>{ typingSet.delete(name); typingTimeouts.delete(name); if(metaLine){ metaLine.textContent=`${(window.MEMBER_COUNT||0).toLocaleString()} members, ${(window.ONLINE_COUNT||0).toLocaleString()} online`; metaLine.style.opacity=''; } },1600+Math.random()*1200));
    }catch(e){} });

    window.TGRenderer={ appendMessage:(p,t,o)=>appendMessage(p||{},String(t||''),o||{}), showTyping:(p)=>{document.dispatchEvent(new CustomEvent('headerTyping',{detail:{name:(p&&p.name)?p.name:'Someone'}}));} };
    window.BubbleRenderer={ renderMessages:(arr)=>{ if(!Array.isArray(arr)) return; arr.forEach(m=>{ appendMessage({name:m.name,avatar:m.avatar},m.text,{ id:m.id, timestamp:m.time?new Date(m.time):new Date(), type:m.isOwn?'outgoing':'incoming', image:m.image, caption:m.caption }); }); } };

    console.log('bubble-renderer fully integrated with dynamic tail');
  }

  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
