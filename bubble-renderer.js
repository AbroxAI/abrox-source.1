// bubble-renderer.js (Telegram-style refined)
// avatar 40px, curved tail, glass-friendly metrics, reply preview & fallbacks
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

    let lastDateKey = null;
    let unseenCount = 0;
    const MESSAGE_MAP = new Map();

    function formatTime(d){
      try { return new Date(d).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}); }
      catch(e){ return ''; }
    }
    function dateKey(d){
      const x = new Date(d);
      return `${x.getFullYear()}-${x.getMonth()+1}-${x.getDate()}`;
    }

    function insertDateSticker(date){
      const key = dateKey(date);
      if(key === lastDateKey) return;
      lastDateKey = key;
      const s = document.createElement('div');
      s.className = 'tg-date-sticker';
      s.textContent = new Date(date).toLocaleDateString([], {
        year:'numeric', month:'short', day:'numeric'
      });
      container.appendChild(s);
    }

    function showJump(){ if(jumpIndicator) jumpIndicator.classList.remove('hidden'); }
    function hideJump(){ if(jumpIndicator) jumpIndicator.classList.add('hidden'); unseenCount = 0; updateJump(); }
    function updateJump(){ if(jumpText) jumpText.textContent = unseenCount > 1 ? `New messages · ${unseenCount}` : 'New messages'; }

    if(jumpIndicator){
      jumpIndicator.addEventListener('click', ()=>{
        container.scrollTop = container.scrollHeight;
        hideJump();
      });
    }

    container.addEventListener('scroll', ()=>{
      const bottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      if(bottom > 100) showJump(); else hideJump();
    });

    function createTail(color, side){
      const div = document.createElement('div');
      div.style.position = 'absolute';
      div.style.width = '16px';
      div.style.height = '16px';
      div.style.bottom = '4px';
      div.style.background = color;
      div.style.pointerEvents = 'none';
      div.style.boxShadow = `0 2px 0 0 ${color}`;

      if(side === 'left'){
        div.style.left = '-20px';
        div.style.borderRadius = '6px 0 18px 6px';
        div.style.transform = 'rotate(-26deg)';
      } else {
        div.style.right = '-20px';
        div.style.borderRadius = '0 6px 6px 18px';
        div.style.transform = 'rotate(26deg)';
      }
      return div;
    }

    function createBubble(persona, text, opts={}){
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

      const avatar = document.createElement('img');
      avatar.className = 'tg-bubble-avatar';
      avatar.src = persona?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(persona?.name || 'U')}&size=${AVATAR_DIAM}`;
      avatar.style.width = avatar.style.height = AVATAR_DIAM + 'px';
      avatar.onerror = () => {
        avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(persona?.name || 'U')}&size=${AVATAR_DIAM}`;
      };

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
        content.style.background = '#182533';
        content.style.color = '#e6eef8';
      } else {
        content.style.background = '#2b6df6';
        content.style.color = '#fff';
      }

      // curved tail (farther from avatar)
      try{
        content.appendChild(createTail(content.style.background, type === 'incoming' ? 'left' : 'right'));
      }catch(e){}

      if(replyToText || replyToId){
        const rp = document.createElement('div');
        rp.className = 'tg-reply-preview';
        rp.textContent = replyToText
          ? (replyToText.length > 120 ? replyToText.slice(0,117) + '...' : replyToText)
          : 'Reply';
        rp.addEventListener('click', ()=>{
          if(replyToId && MESSAGE_MAP.has(replyToId)){
            const t = MESSAGE_MAP.get(replyToId).el;
            t.scrollIntoView({behavior:'smooth', block:'center'});
            t.classList.add('tg-highlight');
            setTimeout(()=> t.classList.remove('tg-highlight'), 2600);
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
        img.onerror = () => { img.style.display = 'none'; };
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
        const c = window.__abrox_seen_map?.[id] || 1;
        seen.innerHTML = `<i data-lucide="eye"></i> ${c}`;
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

      wrapper.addEventListener('contextmenu', e=>{
        e.preventDefault();
        document.dispatchEvent(new CustomEvent('messageContext', {
          detail:{ id, persona, text }
        }));
      });

      return { wrapper, id, text, persona, timestamp };
    }

    function appendMessage(persona, text, opts={}){
      const id = opts.id || ('m_' + Date.now() + '_' + Math.floor(Math.random()*9999));
      opts.id = id;

      const created = createBubble(persona, text, opts);
      if(!created) return null;

      container.appendChild(created.wrapper);
      MESSAGE_MAP.set(id, { el: created.wrapper, text: created.text, persona: created.persona, timestamp: created.timestamp });

      const atBottom = (container.scrollTop + container.clientHeight) > (container.scrollHeight - 120);
      if(atBottom){
        container.scrollTop = container.scrollHeight;
        hideJump();
      } else {
        unseenCount++;
        updateJump();
        showJump();
      }

      created.wrapper.style.opacity = '0';
      created.wrapper.style.transform = 'translateY(6px)';
      requestAnimationFrame(()=>{
        created.wrapper.style.transition = 'all 220ms ease';
        created.wrapper.style.opacity = '1';
        created.wrapper.style.transform = 'translateY(0)';
      });

      if(window.lucide?.createIcons){
        try{ window.lucide.createIcons(); }catch(e){}
      }
      return id;
    }

    function showTyping(persona, duration=1400){
      const id = 'typing_' + Date.now();
      const bubble = createBubble(persona, '', { id, type:'incoming', isTyping:true });
      if(!bubble) return;
      const el = bubble.wrapper;
      const dots = document.createElement('div');
      dots.className = 'tg-bubble-text';
      dots.innerHTML = '<span class="typing-dot">●</span><span class="typing-dot">●</span><span class="typing-dot">●</span>';
      el.querySelector('.tg-bubble-content').appendChild(dots);

      container.appendChild(el);
      container.scrollTop = container.scrollHeight;
      setTimeout(()=> el.remove(), Math.max(700, duration));
    }

    window.TGRenderer = window.TGRenderer || {};
    window.TGRenderer.appendMessage = (p,t,o)=> appendMessage(p||{}, String(t||''), o||{});
    window.TGRenderer.showTyping = (p,d)=> showTyping(p||{name:'Someone'}, d);

    window.BubbleRenderer = window.BubbleRenderer || {};
    window.BubbleRenderer.renderMessages = arr=>{
      if(!Array.isArray(arr)) return;
      arr.forEach(m=>{
        appendMessage({name:m.name, avatar:m.avatar}, m.text, {
          id:m.id, timestamp:m.time||new Date(), type:m.isOwn?'outgoing':'incoming',
          image:m.image, caption:m.caption
        });
      });
    };

    if(window.lucide?.createIcons){
      try{ window.lucide.createIcons(); }catch(e){}
    }
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else setTimeout(init, 0);
})();
