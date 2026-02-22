// bubble-renderer.js (Telegram-style – refined curved tail & avatar metrics)
(function(){
  'use strict';

  function init(){
    const container = document.getElementById('tg-comments-container');
    const jumpIndicator = document.getElementById('tg-jump-indicator');
    const jumpText = document.getElementById('tg-jump-text');
    const metaLine = document.getElementById('tg-meta-line');

    if(!container){
      console.error('bubble-renderer: tg-comments-container missing');
      return;
    }

    const AVATAR_DIAM = 40;
    const BUBBLE_RADIUS = 16;

    let lastMessageDateKey = null;
    let unseenCount = 0;
    const MESSAGE_MAP = new Map();

    function now(){ return new Date(); }
    function formatTime(date){
      try{
        const d = new Date(date);
        return d.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
      }catch(e){ return ''; }
    }
    function formatDateKey(date){
      const d = new Date(date);
      return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
    }

    function insertDateSticker(dateObj){
      const key = formatDateKey(dateObj);
      if(key === lastMessageDateKey) return;
      lastMessageDateKey = key;

      const sticker = document.createElement('div');
      sticker.className = 'tg-date-sticker';
      const d = new Date(dateObj);
      sticker.textContent = d.toLocaleDateString([], {
        year:'numeric',
        month:'short',
        day:'numeric'
      });
      container.appendChild(sticker);
    }

    function showJumpIndicator(){
      if(jumpIndicator) jumpIndicator.classList.remove('hidden');
    }
    function hideJumpIndicator(){
      if(jumpIndicator) jumpIndicator.classList.add('hidden');
      unseenCount = 0;
      updateJumpIndicator();
    }
    function updateJumpIndicator(){
      if(jumpText){
        jumpText.textContent = unseenCount > 1
          ? `New messages · ${unseenCount}`
          : `New messages`;
      }
    }

    if(jumpIndicator){
      jumpIndicator.addEventListener('click', ()=>{
        container.scrollTop = container.scrollHeight;
        hideJumpIndicator();
      });
    }

    container.addEventListener('scroll', ()=>{
      const bottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      if(bottom > 120) showJumpIndicator();
      else hideJumpIndicator();
    });

    function showTypingIndicator(persona, duration=1400){
      try{
        const id = 'typing_' + Date.now();
        const bubble = createBubble(persona, '', { id, type:'incoming', isTyping:true });
        container.appendChild(bubble);
        container.scrollTop = container.scrollHeight;

        setTimeout(()=>{
          if(bubble?.parentNode) bubble.parentNode.removeChild(bubble);
        }, Math.max(800, duration));
      }catch(e){}
    }

    function createBubble(persona, text, opts={}){
      const timestamp = opts.timestamp || new Date();
      const type = opts.type === 'outgoing' ? 'outgoing' : 'incoming';
      const replyToText = opts.replyToText || null;
      const replyToId = opts.replyToId || null;
      const image = opts.image || null;
      const caption = opts.caption || null;
      const id = opts.id || ('m_' + Date.now());

      insertDateSticker(timestamp);

      const wrapper = document.createElement('div');
      wrapper.className = `tg-bubble ${type}`;
      wrapper.dataset.id = id;
      wrapper.style.maxWidth = '78%';
      wrapper.style.position = 'relative';

      const avatar = document.createElement('img');
      avatar.className = 'tg-bubble-avatar';
      avatar.src = persona?.avatar
        ? persona.avatar
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(persona?.name || 'U')}&size=${AVATAR_DIAM}`;
      avatar.alt = persona?.name || 'user';
      avatar.style.width = avatar.style.height = AVATAR_DIAM + 'px';
      avatar.style.borderRadius = '50%';
      avatar.style.objectFit = 'cover';
      avatar.onerror = () => {
        avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(persona?.name || 'U')}&size=${AVATAR_DIAM}`;
      };

      const content = document.createElement('div');
      content.className = 'tg-bubble-content';
      content.style.borderRadius = `${BUBBLE_RADIUS}px`;

      if(type === 'incoming'){
        content.style.background = 'rgba(24,37,51,0.9)';
        content.style.color = '#e6eef8';
      } else {
        content.style.background = 'rgba(43,109,246,0.95)';
        content.style.color = '#fff';
      }

      // reply preview
      if(replyToText || replyToId){
        const rp = document.createElement('div');
        rp.className = 'tg-reply-preview';
        rp.textContent = replyToText
          ? (replyToText.length > 120 ? replyToText.slice(0,117)+'...' : replyToText)
          : 'Reply';
        rp.addEventListener('click', ()=>{
          if(replyToId && MESSAGE_MAP.has(replyToId)){
            const target = MESSAGE_MAP.get(replyToId).el;
            target.scrollIntoView({ behavior:'smooth', block:'center' });
            target.classList.add('tg-highlight');
            setTimeout(()=> target.classList.remove('tg-highlight'), 2600);
          }
        });
        content.appendChild(rp);
      }

      const sender = document.createElement('div');
      sender.className = 'tg-bubble-sender';
      sender.textContent = persona?.name || 'User';
      content.appendChild(sender);

      if(image){
        const img = document.createElement('img');
        img.className = 'tg-bubble-image';
        img.src = image;
        img.alt = 'image';
        img.onerror = () => {
          if(!img.src.includes('assets/broadcast.jpg')) img.src = 'assets/broadcast.jpg';
          else img.style.display = 'none';
        };
        content.appendChild(img);
      }

      const textEl = document.createElement('div');
      textEl.className = 'tg-bubble-text';
      textEl.textContent = text || '';
      content.appendChild(textEl);

      if(caption){
        const cap = document.createElement('div');
        cap.className = 'tg-bubble-text';
        cap.style.marginTop = '6px';
        cap.textContent = caption;
        content.appendChild(cap);
      }

      const meta = document.createElement('div');
      meta.className = 'tg-bubble-meta';
      const time = document.createElement('span');
      time.textContent = formatTime(timestamp);
      meta.appendChild(time);

      if(type === 'outgoing'){
        const seen = document.createElement('div');
        seen.className = 'seen';
        const count = window.__abrox_seen_map?.[id] || 1;
        seen.innerHTML = `<i data-lucide="eye"></i> ${count}`;
        meta.appendChild(seen);
      }
      content.appendChild(meta);

      const reactions = document.createElement('div');
      reactions.className = 'tg-reactions';
      content.appendChild(reactions);

      if(type === 'incoming'){
        wrapper.appendChild(avatar);
        wrapper.appendChild(content);
      } else {
        wrapper.style.flexDirection = 'row-reverse';
        wrapper.appendChild(avatar);
        wrapper.appendChild(content);
      }

      wrapper.addEventListener('contextmenu', (e)=>{
        e.preventDefault();
        document.dispatchEvent(new CustomEvent('messageContext', {
          detail: { id, persona, text }
        }));
      });

      return { wrapper, id, text, persona, timestamp };
    }

    function appendMessage(persona, text, opts={}){
      const id = opts.id || ('m_' + Date.now());
      opts.id = id;

      const created = createBubble(persona, text, opts);
      if(!created) return null;

      const el = created.wrapper;
      container.appendChild(el);

      MESSAGE_MAP.set(id, {
        el,
        text: created.text,
        persona: created.persona,
        timestamp: created.timestamp
      });

      const atBottom = (container.scrollTop + container.clientHeight) >
        (container.scrollHeight - 120);

      if(atBottom){
        container.scrollTop = container.scrollHeight;
        hideJumpIndicator();
      } else {
        unseenCount++;
        updateJumpIndicator();
        showJumpIndicator();
      }

      el.style.opacity = '0';
      el.style.transform = 'translateY(6px)';
      requestAnimationFrame(()=>{
        el.style.transition = 'all 200ms ease';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });

      if(window.lucide?.createIcons){
        try{ window.lucide.createIcons(); }catch(e){}
      }

      return id;
    }

    document.addEventListener('headerTyping', (ev)=>{
      if(metaLine){
        const name = ev.detail?.name || 'Someone';
        metaLine.textContent = `${name} is typing...`;
        setTimeout(()=>{
          metaLine.textContent =
            `${(window.MEMBER_COUNT||0).toLocaleString()} members, ` +
            `${(window.ONLINE_COUNT||0).toLocaleString()} online`;
        }, 1200);
      }
    });

    window.TGRenderer = window.TGRenderer || {
      appendMessage: (persona, text, opts)=> appendMessage(persona||{}, String(text||''), opts||{}),
      showTyping: (persona, duration)=> showTypingIndicator(persona||{}, duration)
    };

    window.BubbleRenderer = window.BubbleRenderer || {
      renderMessages: (arr)=>{
        if(!Array.isArray(arr)) return;
        arr.forEach(m=>{
          appendMessage(
            { name:m.name, avatar:m.avatar },
            m.text,
            { id:m.id, timestamp: m.time ? new Date(m.time) : new Date(), type:m.isOwn?'outgoing':'incoming', image:m.image, caption:m.caption }
          );
        });
      }
    };

    if(window.lucide?.createIcons){
      try{ window.lucide.createIcons(); }catch(e){}
    }

    console.log('bubble-renderer initialized');
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 0);
  }
})();
