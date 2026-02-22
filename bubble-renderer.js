// bubble-renderer.js (telegram-patch validated)
// - avatar diameter 40px
// - curved nub (Telegram-style, no triangle)
// - glass-safe shadows
// - reply targeting + highlight
// - jump indicator + unseen count
// - returns stable message id
(function(){
  'use strict';

  function init(){
    const container = document.getElementById('tg-comments-container');
    const jumpIndicator = document.getElementById('tg-jump-indicator');
    const jumpText = document.getElementById('tg-jump-text');
    const metaLine = document.getElementById('tg-meta-line');

    if(!container){
      console.error('bubble-renderer: container missing');
      return;
    }

    const AVATAR_DIAM = 40;
    const BUBBLE_RADIUS = 16;
    const INCOMING_BG = '#182533';
    const OUTGOING_BG = '#2b6df6';
    const INCOMING_TEXT = '#e6eef8';

    let lastMessageDateKey = null;
    let unseenCount = 0;
    const MESSAGE_MAP = new Map();

    function formatTime(date){
      try{ return new Date(date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}); }
      catch(e){ return ''; }
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
        year:'numeric', month:'short', day:'numeric'
      });
      container.appendChild(sticker);
    }

    function createBubbleElement(persona, text, opts={}){
      const timestamp = opts.timestamp || new Date();
      const type = opts.type === 'outgoing' ? 'outgoing' : 'incoming';
      const replyToText = opts.replyToText || null;
      const replyToId = opts.replyToId || null;
      const image = opts.image || null;
      const caption = opts.caption || null;
      const id = opts.id || ('m_' + Date.now() + '_' + Math.floor(Math.random()*9999));

      insertDateSticker(timestamp);

      const wrapper = document.createElement('div');
      wrapper.className = `tg-bubble ${type}`;
      wrapper.dataset.id = id;
      wrapper.style.maxWidth = '78%';
      wrapper.style.marginBottom = '14px';
      wrapper.style.position = 'relative';

      // avatar
      const avatar = document.createElement('img');
      avatar.className = 'tg-bubble-avatar';
      avatar.alt = persona?.name || 'user';
      avatar.src = persona?.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(persona?.name || 'U')}&size=${AVATAR_DIAM}`;
      avatar.style.width = avatar.style.height = AVATAR_DIAM + 'px';
      avatar.style.borderRadius = '50%';
      avatar.style.objectFit = 'cover';
      avatar.onerror = () => {
        avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(persona?.name || 'U')}&size=${AVATAR_DIAM}`;
      };

      // content
      const content = document.createElement('div');
      content.className = 'tg-bubble-content';
      content.style.borderRadius = BUBBLE_RADIUS + 'px';
      content.style.padding = '10px 14px';
      content.style.fontSize = '14px';
      content.style.lineHeight = '1.35';
      content.style.wordBreak = 'break-word';
      content.style.position = 'relative';
      content.style.boxShadow = '0 6px 18px rgba(0,0,0,0.18)';

      if(type === 'incoming'){
        content.style.background = INCOMING_BG;
        content.style.color = INCOMING_TEXT;
      } else {
        content.style.background = OUTGOING_BG;
        content.style.color = '#fff';
      }

      // curved nub (Telegram-style)
      const nub = document.createElement('div');
      nub.style.position = 'absolute';
      nub.style.width = '16px';
      nub.style.height = '16px';
      nub.style.bottom = '4px';

      if(type === 'incoming'){
        nub.style.left = '-20px';
        nub.style.background = INCOMING_BG;
        nub.style.borderRadius = '6px 0 18px 6px';
        nub.style.transform = 'rotate(-26deg)';
      } else {
        nub.style.right = '-20px';
        nub.style.background = OUTGOING_BG;
        nub.style.borderRadius = '0 6px 6px 18px';
        nub.style.transform = 'rotate(26deg)';
      }
      nub.style.boxShadow = `0 2px 0 0 ${type === 'incoming' ? INCOMING_BG : OUTGOING_BG}`;

      content.appendChild(nub);

      // reply preview (click scroll)
      if(replyToText || replyToId){
        const rp = document.createElement('div');
        rp.className = 'tg-reply-preview';
        rp.textContent = replyToText
          ? (replyToText.length > 120 ? replyToText.slice(0,117)+'...' : replyToText)
          : 'Reply';

        rp.addEventListener('click', () => {
          if(replyToId && MESSAGE_MAP.has(replyToId)){
            const target = MESSAGE_MAP.get(replyToId).el;
            target.scrollIntoView({behavior:'smooth', block:'center'});
            target.classList.add('tg-highlight');
            setTimeout(()=> target.classList.remove('tg-highlight'), 2600);
            return;
          }
        });
        content.appendChild(rp);
      }

      // sender
      const sender = document.createElement('div');
      sender.className = 'tg-bubble-sender';
      sender.textContent = persona?.name || 'User';
      content.appendChild(sender);

      // image
      if(image){
        const img = document.createElement('img');
        img.className = 'tg-bubble-image';
        img.src = image;
        img.style.maxWidth = '100%';
        img.style.borderRadius = '12px';
        img.onerror = () => { img.style.display = 'none'; };
        content.appendChild(img);
      }

      // text
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

      // meta
      const meta = document.createElement('div');
      meta.className = 'tg-bubble-meta';
      meta.style.marginTop = '8px';
      meta.style.display = 'flex';
      meta.style.gap = '8px';
      meta.style.fontSize = '11px';

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

      // assembly (avatar + content)
      if(type === 'incoming'){
        wrapper.appendChild(avatar);
        wrapper.appendChild(content);
        wrapper.style.justifyContent = 'flex-start';
      } else {
        wrapper.style.flexDirection = 'row-reverse';
        wrapper.appendChild(avatar);
        wrapper.appendChild(content);
        wrapper.style.justifyContent = 'flex-end';
      }

      wrapper.addEventListener('contextmenu', (e)=>{
        e.preventDefault();
        document.dispatchEvent(new CustomEvent('messageContext',{
          detail:{ id, persona, text }
        }));
      });

      return { wrapper, id, text, persona, timestamp };
    }

    function appendMessage(persona, text, opts={}){
      const id = opts.id || ('m_' + Date.now() + '_' + Math.floor(Math.random()*9999));
      opts.id = id;

      const created = createBubbleElement(persona, text, opts);
      if(!created) return null;

      const el = created.wrapper;
      container.appendChild(el);
      MESSAGE_MAP.set(id,{
        el,
        text: created.text,
        persona: created.persona,
        timestamp: created.timestamp
      });

      const atBottom =
        (container.scrollTop + container.clientHeight) >
        (container.scrollHeight - 120);

      if(atBottom){
        container.scrollTop = container.scrollHeight;
      } else {
        unseenCount++;
      }

      if(window.lucide?.createIcons){
        try{ window.lucide.createIcons(); }catch(e){}
      }

      return id;
    }

    function showTypingIndicator(persona, duration=1400){
      const el = createBubbleElement(persona, '', { type:'incoming', isTyping:true });
      const wrapper = el.wrapper;
      const dots = document.createElement('div');
      dots.className = 'tg-bubble-text';
      dots.innerHTML = '<span>●</span><span>●</span><span>●</span>';
      wrapper.querySelector('.tg-bubble-content').appendChild(dots);

      container.appendChild(wrapper);
      container.scrollTop = container.scrollHeight;
      setTimeout(()=> wrapper.remove(), Math.max(700, duration));
    }

    // jump indicator
    function updateJump(){
      if(jumpText) jumpText.textContent =
        unseenCount > 1 ? `New messages · ${unseenCount}` : 'New messages';
    }
    function showJump(){ jumpIndicator?.classList.remove('hidden'); }
    function hideJump(){ jumpIndicator?.classList.add('hidden'); unseenCount = 0; updateJump(); }

    jumpIndicator?.addEventListener('click', ()=>{
      container.scrollTop = container.scrollHeight;
      hideJump();
    });

    container.addEventListener('scroll', ()=>{
      const bottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      bottom > 100 ? showJump() : hideJump();
    });

    // expose renderer
    window.TGRenderer = {
      appendMessage:(p,t,o)=> appendMessage(p||{}, String(t||''), o||{}),
      showTyping:(p,d)=> showTypingIndicator(p||{name:'Someone'}, d)
    };

    window.BubbleRenderer = {
      renderMessages:(arr)=>{
        if(!Array.isArray(arr)) return;
        arr.forEach(m=>{
          appendMessage({name:m.name, avatar:m.avatar}, m.text, {
            id:m.id,
            timestamp:m.time ? new Date(m.time) : new Date(),
            type:m.isOwn ? 'outgoing' : 'incoming',
            image:m.image,
            caption:m.caption
          });
        });
      }
    };

    console.log('bubble-renderer initialized');
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
