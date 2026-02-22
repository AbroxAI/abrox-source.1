// bubble-renderer.js – Telegram-style renderer (tail & spacing tuned)
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
    const BUBBLE_RADIUS = 18;
    const GAP = 14; // matches CSS tail spacing
    const TAIL_SIZE = 18;

    let lastDay = null;
    let unseen = 0;
    const MESSAGE_MAP = new Map();

    function formatTime(d){
      try{ return new Date(d).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}); }
      catch(e){ return ''; }
    }

    function formatDay(d){
      const t = new Date(d);
      return `${t.getFullYear()}-${t.getMonth()+1}-${t.getDate()}`;
    }

    function insertDate(d){
      const key = formatDay(d);
      if(key === lastDay) return;
      lastDay = key;

      const sticker = document.createElement('div');
      sticker.className = 'tg-date-sticker';
      sticker.textContent = new Date(d).toLocaleDateString([], {
        year:'numeric', month:'short', day:'numeric'
      });
      container.appendChild(sticker);
    }

    function showJump(){ jumpIndicator?.classList.remove('hidden'); }
    function hideJump(){ jumpIndicator?.classList.add('hidden'); unseen = 0; }
    function updateJump(){
      if(jumpText) jumpText.textContent = unseen > 1 ? `New messages · ${unseen}` : `New messages`;
    }
    jumpIndicator?.addEventListener('click', ()=>{ container.scrollTop = container.scrollHeight; hideJump(); });
    container.addEventListener('scroll', ()=>{
      const bottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      bottom > 120 ? showJump() : hideJump();
    });

    function showTyping(persona, duration=1400){
      const id = 'typing_' + Date.now();
      const bubble = createBubble(persona, '', { id, type:'incoming', isTyping:true });
      const dots = bubble.querySelector('.tg-bubble-text');
      if(dots) dots.innerHTML = '● ● ●';
      container.appendChild(bubble);
      container.scrollTop = container.scrollHeight;
      setTimeout(()=> bubble.remove(), Math.max(700, duration));
    }

    function createBubble(persona, text, opts={}){
      const type = opts.type === 'outgoing' ? 'outgoing' : 'incoming';
      const id = opts.id || `m_${Date.now()}_${Math.random()}`;
      const ts = opts.timestamp || new Date();
      insertDate(ts);

      const wrapper = document.createElement('div');
      wrapper.className = `tg-bubble ${type}`;
      wrapper.dataset.id = id;
      wrapper.style.maxWidth = '78%';

      const avatar = document.createElement('img');
      avatar.className = 'tg-bubble-avatar';
      avatar.src = persona?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(persona?.name||'U')}&size=${AVATAR_DIAM}`;
      avatar.alt = persona?.name || 'user';
      avatar.onerror = ()=> avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(persona?.name||'U')}&size=${AVATAR_DIAM}`;

      const content = document.createElement('div');
      content.className = 'tg-bubble-content';
      content.style.borderRadius = BUBBLE_RADIUS + 'px';
      content.style.padding = '10px 14px';
      content.style.position = 'relative';
      content.style.lineHeight = '1.35';

      if(type === 'incoming'){
        content.style.background = '#182533';
        content.style.color = '#e6eef8';
      } else {
        content.style.background = '#2b6df6';
        content.style.color = '#fff';
      }

      if(opts.replyToText){
        const rp = document.createElement('div');
        rp.className = 'tg-reply-preview';
        rp.textContent = opts.replyToText;
        content.appendChild(rp);
      }

      const sender = document.createElement('div');
      sender.className = 'tg-bubble-sender';
      sender.textContent = persona?.name || 'User';
      content.appendChild(sender);

      if(opts.image){
        const img = document.createElement('img');
        img.className = 'tg-bubble-image';
        img.src = opts.image;
        img.onerror = ()=> img.style.display = 'none';
        content.appendChild(img);
      }

      const body = document.createElement('div');
      body.className = 'tg-bubble-text';
      body.textContent = text || '';
      content.appendChild(body);

      const meta = document.createElement('div');
      meta.className = 'tg-bubble-meta';
      meta.textContent = formatTime(ts);
      content.appendChild(meta);

      wrapper.style.gap = GAP + 'px';

      if(type === 'incoming'){
        wrapper.appendChild(avatar);
        wrapper.appendChild(content);
      } else {
        wrapper.style.flexDirection = 'row-reverse';
        wrapper.appendChild(avatar);
        wrapper.appendChild(content);
      }

      wrapper.style.opacity = '0';
      requestAnimationFrame(()=>{
        wrapper.style.transition = 'all 220ms ease';
        wrapper.style.opacity = '1';
      });

      return wrapper;
    }

    function appendMessage(persona, text, opts={}){
      const id = opts.id || `m_${Date.now()}`;
      const el = createBubble(persona, text, opts);
      container.appendChild(el);

      MESSAGE_MAP.set(id, { el, text, persona, timestamp: opts.timestamp });

      const atBottom = (container.scrollTop + container.clientHeight) >= (container.scrollHeight - 120);
      if(atBottom) container.scrollTop = container.scrollHeight;
      else { unseen++; updateJump(); showJump(); }

      return id;
    }

    // expose renderer
    window.TGRenderer = window.TGRenderer || {};
    window.TGRenderer.appendMessage = (p,t,o)=> appendMessage(p||{}, String(t||''), o||{});
    window.TGRenderer.showTyping = (p,d)=> showTyping(p||{name:'Someone'}, d);

    console.log('bubble-renderer tuned (curved tail & spacing)');
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
