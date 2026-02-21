// bubble-renderer.js (patched for telegram-like avatar/bubble/tail metrics)
// - avatar diameter = 40px
// - bubble padding, tails, colors tuned for Telegram-like look
// - reply preview prefers replyToId -> falls back to fuzzy text search
// - robust image fallbacks & safe DOM ops
// - returns stable message id
(function(){
  'use strict';

  // DOM ready init
  function init(){
    const container = document.getElementById('tg-comments-container');
    const jumpIndicator = document.getElementById('tg-jump-indicator');
    const jumpText = document.getElementById('tg-jump-text');
    const metaLine = document.getElementById('tg-meta-line');

    if(!container){
      console.error('bubble-renderer: tg-comments-container missing — abort');
      return;
    }

    // configuration tuned for Telegram-like metrics
    const AVATAR_DIAM = 40;            // px (avatar diameter)
    const BUBBLE_RADIUS = 16;          // px
    const BUBBLE_PADDING_V = 10;       // vertical padding px
    const BUBBLE_PADDING_H = 14;       // horizontal padding px
    const TAIL_WIDTH = 10;             // tail triangle width px
    const TAIL_HEIGHT = 12;            // tail triangle height px
    const INCOMING_BG = '#ffffff10';   // subtle dark translucent (widget uses dark theme)
    const OUTGOING_BG = '#2b6df6';     // Telegram-ish blue for outgoing
    const INCOMING_TEXT = '#e6eef8';
    const OUTGOING_TEXT = '#ffffff';

    // state
    let lastMessageDateKey = null;
    let unseenCount = 0;
    const MESSAGE_MAP = new Map(); // id -> { el, text, persona, timestamp }

    // utilities
    function now(){ return new Date(); }
    function formatTime(date){ try{ const d = new Date(date); return d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}); }catch(e){ return ''; } }
    function formatDateKey(date){ const d = new Date(date); return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`; }

    // insert date sticker (only when day changes)
    function insertDateSticker(dateObj){
      const key = formatDateKey(dateObj);
      if(key === lastMessageDateKey) return;
      lastMessageDateKey = key;
      const sticker = document.createElement('div');
      sticker.className = 'tg-date-sticker';
      const d = new Date(dateObj);
      sticker.textContent = d.toLocaleDateString([], { year:'numeric', month:'short', day:'numeric' });
      container.appendChild(sticker);
    }

    // create a small SVG tail element so we can control color precisely
    function createTailElement(color, side = 'left'){
      // side: 'left' (incoming) -> tail on left, pointing leftwards
      //       'right' (outgoing) -> tail on right, pointing rightwards
      const svgns = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgns, 'svg');
      svg.setAttribute('width', String(TAIL_WIDTH + 4));
      svg.setAttribute('height', String(TAIL_HEIGHT));
      svg.setAttribute('viewBox', `0 0 ${TAIL_WIDTH+4} ${TAIL_HEIGHT}`);
      svg.style.position = 'absolute';
      svg.style.top = `${BUBBLE_PADDING_V}px`;
      svg.style[ side === 'left' ? 'left' : 'right' ] = (side === 'left' ? `-${TAIL_WIDTH - 2}px` : `-${TAIL_WIDTH - 2}px`);
      svg.style.pointerEvents = 'none';
      // rounded triangle path
      const path = document.createElementNS(svgns, 'path');
      if(side === 'left'){
        // draw triangular tail pointing left with slight rounded corner
        const w = TAIL_WIDTH, h = TAIL_HEIGHT;
        const d = `M ${w} 0 Q ${w-2} ${Math.round(h/2)} ${w} ${h} L 0 ${Math.round(h/2)} Z`;
        path.setAttribute('d', d);
      } else {
        const w = TAIL_WIDTH, h = TAIL_HEIGHT;
        const d = `M 0 0 Q 2 ${Math.round(h/2)} 0 ${h} L ${w} ${Math.round(h/2)} Z`;
        path.setAttribute('d', d);
      }
      path.setAttribute('fill', color);
      path.setAttribute('opacity', '1');
      svg.appendChild(path);
      return svg;
    }

    // typing indicator bubble (small)
    function showTypingIndicator(persona, duration=1400){
      try{
        const id = 'typing_' + Date.now() + '_' + Math.floor(Math.random()*9999);
        const el = createBubbleElement(persona, '', { id, type: 'incoming', isTyping: true });
        // replace text content with typing dots
        const dots = el.querySelector('.tg-bubble-text');
        if(dots){
          dots.innerHTML = '<span class="typing-dot">●</span><span class="typing-dot">●</span><span class="typing-dot">●</span>';
          const style = el.querySelector('.tg-bubble-content');
          if(style) style.style.opacity = '0.95';
        }
        container.appendChild(el);
        container.scrollTop = container.scrollHeight;
        setTimeout(()=>{ try{ if(el && el.parentNode) el.parentNode.removeChild(el); }catch(e){} }, Math.max(700, duration));
      }catch(e){}
    }

    // create a single bubble element (incoming or outgoing)
    function createBubbleElement(persona, text, opts={}){
      const timestamp = opts.timestamp || new Date();
      const type = (opts.type === 'outgoing') ? 'outgoing' : 'incoming';
      const replyToText = opts.replyToText || null;
      const replyToId = opts.replyToId || null;
      const image = opts.image || null;
      const caption = opts.caption || null;
      const id = opts.id || ('m_' + Date.now() + '_' + Math.floor(Math.random()*9999));
      const pinned = !!opts.pinned;
      insertDateSticker(timestamp);

      // wrapper
      const wrapper = document.createElement('div');
      wrapper.className = `tg-bubble ${type}` + (pinned ? ' pinned' : '');
      wrapper.dataset.id = id;
      wrapper.style.maxWidth = '78%';
      wrapper.style.marginBottom = '14px';
      wrapper.style.alignItems = 'flex-start';
      wrapper.style.position = 'relative';

      // avatar
      const avatar = document.createElement('img');
      avatar.className = 'tg-bubble-avatar';
      avatar.alt = (persona && persona.name) ? persona.name : 'user';
      avatar.src = (persona && persona.avatar) ? persona.avatar : `https://ui-avatars.com/api/?name=${encodeURIComponent((persona && persona.name) ? persona.name : 'U')}&background=0D1F2B&color=fff&size=${AVATAR_DIAM}`;
      // sizing
      avatar.style.width = avatar.style.height = AVATAR_DIAM + 'px';
      avatar.style.borderRadius = '50%';
      avatar.style.objectFit = 'cover';
      avatar.style.flexShrink = '0';
      avatar.style.marginTop = '2px';
      avatar.onerror = function(){
        // avoid using admin.jpg as generic fallback; use deterministic ui-avatar
        try{
          const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent((persona && persona.name) ? persona.name : 'U')}&background=3b82f6&color=fff&size=${AVATAR_DIAM}`;
          if(this.src && this.src.indexOf('assets/admin.jpg') === -1) this.src = fallback;
          else this.src = fallback;
        }catch(e){ this.style.display = 'none'; }
      };

      // content box
      const content = document.createElement('div');
      content.className = 'tg-bubble-content';
      content.style.position = 'relative';
      content.style.borderRadius = BUBBLE_RADIUS + 'px';
      content.style.padding = `${BUBBLE_PADDING_V}px ${BUBBLE_PADDING_H}px`;
      content.style.fontSize = '14px';
      content.style.lineHeight = '1.3';
      content.style.wordBreak = 'break-word';
      content.style.boxShadow = '0 6px 18px rgba(0,0,0,0.18)';
      content.style.maxWidth = '100%';
      content.style.display = 'inline-block';

      // set colors depending on side
      if(type === 'incoming'){
        content.style.background = INCOMING_BG;
        content.style.color = INCOMING_TEXT;
      } else {
        content.style.background = OUTGOING_BG;
        content.style.color = OUTGOING_TEXT;
      }

      // add tail svg
      try{
        const tail = createTailElement(type === 'incoming' ? content.style.background || INCOMING_BG : content.style.background || OUTGOING_BG, (type === 'incoming' ? 'left' : 'right'));
        // make sure the tail is behind text but within content container
        tail.style.zIndex = '0';
        content.appendChild(tail);
      }catch(e){ /* ignore tail */ }

      // reply preview: prefer to scroll to replyToId if provided
      if(replyToText || replyToId){
        const rp = document.createElement('div');
        rp.className = 'tg-reply-preview';
        rp.style.cursor = 'pointer';
        rp.textContent = replyToText ? (replyToText.length > 120 ? replyToText.substring(0,117) + '...' : replyToText) : 'Reply';
        rp.addEventListener('click', ()=>{
          // 1) prefer replyToId
          if(replyToId && MESSAGE_MAP.has(replyToId)){
            const target = MESSAGE_MAP.get(replyToId).el;
            try{
              target.scrollIntoView({ behavior:'smooth', block:'center' });
              target.classList.add('tg-highlight');
              setTimeout(()=> target.classList.remove('tg-highlight'), 2600);
              return;
            }catch(e){}
          }
          // 2) fuzzy match fallback (first occurrence)
          try{
            const norm = (replyToText || '').toLowerCase().replace(/[\W\d_]+/g," ").trim().substring(0,120);
            for(const [mid, mobj] of MESSAGE_MAP.entries()){
              try{
                const mnorm = ((mobj.text||'').toLowerCase().replace(/[\W\d_]+/g," ").trim()).substring(0,120);
                if(mnorm && norm && mnorm.indexOf(norm) !== -1){
                  mobj.el.scrollIntoView({ behavior:'smooth', block:'center' });
                  mobj.el.classList.add('tg-highlight');
                  setTimeout(()=> mobj.el.classList.remove('tg-highlight'), 2600);
                  break;
                }
              }catch(e){}
            }
          }catch(e){}
        });
        content.appendChild(rp);
      }

      // sender name (small)
      const sender = document.createElement('div');
      sender.className = 'tg-bubble-sender';
      sender.textContent = (persona && persona.name) ? persona.name : 'User';
      sender.style.fontSize = '13px';
      sender.style.fontWeight = '600';
      sender.style.marginBottom = '6px';
      sender.style.color = 'inherit';
      content.appendChild(sender);

      // optional image attachment
      if(image){
        const img = document.createElement('img');
        img.className = 'tg-bubble-image';
        img.src = image;
        img.alt = 'image';
        img.style.maxWidth = '100%';
        img.style.borderRadius = '12px';
        img.style.display = 'block';
        img.style.marginBottom = '8px';
        img.onerror = function(){
          try{
            if(!this.src.includes('assets/broadcast.jpg')) this.src = 'assets/broadcast.jpg';
            else this.style.display = 'none';
          }catch(e){ this.style.display = 'none'; }
        };
        content.appendChild(img);
      }

      // message text
      const textEl = document.createElement('div');
      textEl.className = 'tg-bubble-text';
      textEl.textContent = text || '';
      textEl.style.position = 'relative';
      textEl.style.zIndex = '1'; // ensure above tail
      content.appendChild(textEl);

      // caption
      if(caption){
        const cap = document.createElement('div');
        cap.className = 'tg-bubble-text';
        cap.style.marginTop = '6px';
        cap.textContent = caption;
        content.appendChild(cap);
      }

      // meta row
      const meta = document.createElement('div');
      meta.className = 'tg-bubble-meta';
      meta.style.marginTop = '8px';
      meta.style.display = 'flex';
      meta.style.gap = '8px';
      meta.style.alignItems = 'center';
      meta.style.fontSize = '11px';
      meta.style.color = 'rgba(255,255,255,0.6)';
      const timeSpan = document.createElement('span');
      timeSpan.textContent = formatTime(timestamp);
      meta.appendChild(timeSpan);

      // outgoing seen placeholder
      if(type === 'outgoing'){
        const seen = document.createElement('div');
        seen.className = 'seen';
        // if interactions already stored a count, show it; otherwise "1"
        const seenCount = (window.__abrox_seen_map && window.__abrox_seen_map[id]) ? window.__abrox_seen_map[id] : 1;
        seen.innerHTML = `<i data-lucide="eye"></i> ${seenCount}`;
        meta.appendChild(seen);
      }
      content.appendChild(meta);

      // reactions container (empty)
      const reactions = document.createElement('div');
      reactions.className = 'tg-reactions';
      reactions.style.marginTop = '8px';
      content.appendChild(reactions);

      // assemble: left-to-right or reversed for outgoing
      if(type === 'incoming'){
        wrapper.appendChild(avatar);
        wrapper.appendChild(content);
        wrapper.style.justifyContent = 'flex-start';
      } else {
        // outgoing: avatar on right (reverse order)
        wrapper.style.flexDirection = 'row-reverse';
        wrapper.appendChild(avatar);
        wrapper.appendChild(content);
        wrapper.style.justifyContent = 'flex-end';
      }

      // compact class for typing state
      if(opts.isTyping) wrapper.classList.add('typing');

      // attach contextmenu event (delegated elsewhere too)
      wrapper.addEventListener('contextmenu', (e)=>{ try{ e.preventDefault(); e.stopPropagation(); const ev = new CustomEvent('messageContext', { detail: { id, persona, text } }); document.dispatchEvent(ev); }catch(err){} });

      // return assembled element (without appending to DOM)
      return { wrapper, id, text, persona, timestamp };
    } // end createBubbleElement

    // append message and track
    function appendMessage(persona, text, opts={}){
      const id = opts.id || ('m_' + Date.now() + '_' + Math.floor(Math.random()*9999));
      opts.id = id;
      const created = createBubbleElement(persona, text, opts);
      if(!created || !created.wrapper) return null;
      const el = created.wrapper;
      container.appendChild(el);

      // store
      MESSAGE_MAP.set(id, { el, text: created.text, persona: created.persona, timestamp: created.timestamp });

      // scroll behavior
      const atBottom = (container.scrollTop + container.clientHeight) > (container.scrollHeight - 120);
      if(atBottom){
        container.scrollTop = container.scrollHeight;
        hideJumpIndicator();
      } else {
        unseenCount++;
        updateJumpIndicator();
        showJumpIndicator();
      }

      // micro entry animation (subtle)
      el.style.opacity = '0';
      el.style.transform = 'translateY(6px)';
      requestAnimationFrame(()=>{ el.style.transition = 'all 220ms ease'; el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });

      // try to init lucide icons (for seen eye etc.)
      if(window.lucide && typeof window.lucide.createIcons === 'function') {
        try { window.lucide.createIcons(); } catch(e) {}
      }

      return id;
    } // end appendMessage

    // jump indicator helpers
    function showJumpIndicator(){ if(jumpIndicator) jumpIndicator.classList.remove('hidden'); }
    function hideJumpIndicator(){ if(jumpIndicator) jumpIndicator.classList.add('hidden'); unseenCount = 0; updateJumpIndicator(); }
    function updateJumpIndicator(){ if(jumpText) jumpText.textContent = unseenCount > 1 ? `New messages · ${unseenCount}` : `New messages`; }

    if(jumpIndicator){
      jumpIndicator.addEventListener('click', ()=>{ container.scrollTop = container.scrollHeight; hideJumpIndicator(); });
    }
    container.addEventListener('scroll', ()=>{ const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight; if(scrollBottom > 100) showJumpIndicator(); else hideJumpIndicator(); });

    // header typing stack
    const typingNames = [];
    document.addEventListener('headerTyping', (ev)=> {
      try{
        const name = ev.detail && ev.detail.name ? ev.detail.name : 'Someone';
        typingNames.push(name);
        // show condensed typing
        if(metaLine){
          metaLine.style.opacity = '0.95';
          metaLine.style.color = '#b9c7d8';
          metaLine.textContent = typingNames.length > 2 ? `${typingNames.slice(0,2).join(', ')} and others are typing...` : (typingNames.join(' ') + (typingNames.length>1 ? ' are typing...' : ' is typing...'));
          setTimeout(()=>{ if(metaLine) metaLine.textContent = `${(window.MEMBER_COUNT||0).toLocaleString()} members, ${(window.ONLINE_COUNT||0).toLocaleString()} online`; metaLine.style.color=''; }, 900 + Math.floor(Math.random()*1500));
        }
        setTimeout(()=>{ typingNames.shift(); }, 1000 + Math.floor(Math.random()*2000));
      }catch(e){}
    });

    // expose TGRenderer & BubbleRenderer (stable)
    window.TGRenderer = window.TGRenderer || {
      appendMessage: function(persona, text, opts){
        try{ return appendMessage(persona || {}, String(text || ''), opts || {}); }catch(e){ console.warn('TGRenderer.appendMessage failed', e); return null; }
      },
      showTyping: function(persona, duration){
        try{ showTypingIndicator(persona || { name: 'Someone', avatar: null }, duration || 1400); document.dispatchEvent(new CustomEvent('headerTyping', { detail: { name: (persona && persona.name) ? persona.name : 'Someone' } })); }catch(e){}
      }
    };

    window.BubbleRenderer = window.BubbleRenderer || {
      renderMessages: function(arr){
        try{
          if(!Array.isArray(arr)) return;
          arr.forEach(m => {
            appendMessage({ name: m.name, avatar: m.avatar || null }, m.text, { id: m.id, timestamp: m.time ? new Date(m.time) : new Date(), type: m.isOwn ? 'outgoing' : 'incoming', image: m.image, caption: m.caption });
          });
        }catch(e){ console.warn('BubbleRenderer.renderMessages err', e); }
      }
    };

    // safe lucide init
    if(window.lucide && typeof window.lucide.createIcons === 'function'){
      try{ window.lucide.createIcons(); }catch(e){}
    }

    console.log('bubble-renderer (telegram-patch) initialized');
  } // init()

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else setTimeout(init, 0);
})();
