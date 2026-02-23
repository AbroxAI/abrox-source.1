// bubble-renderer.js — Telegram-style grouped bubbles + typing + unread + SVG tail
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

    // Read avatar size from CSS variable
    let AVATAR_DIAM = 40;
    try{
      const v = getComputedStyle(document.documentElement).getPropertyValue('--tg-avatar-size');
      if(v){
        const parsed = parseInt(v.trim(), 10);
        if(!Number.isNaN(parsed) && parsed > 0) AVATAR_DIAM = parsed;
      }
    }catch(e){}

    const BUBBLE_RADIUS = 16;
    const INCOMING_BG = '#182533';
    const OUTGOING_BG = '#2b6df6';
    const INCOMING_TEXT = '#e6eef8';

    let lastMessageDateKey = null;
    let unseenCount = 0;
    const MESSAGE_MAP = new Map();

    const typingSet = new Set();
    const typingTimeouts = new Map();

    function formatTime(date){
      try{
        return new Date(date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
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
        year:'numeric', month:'short', day:'numeric'
      });
      container.appendChild(sticker);
    }

    // Determine grouped position (first/middle/last)
    function updateGrouping(){
      const bubbles = Array.from(container.querySelectorAll('.tg-bubble'));
      let prevType = null;
      let groupStart = 0;

      for(let i=0;i<bubbles.length;i++){
        const b = bubbles[i];
        const type = b.classList.contains('outgoing') ? 'outgoing' : 'incoming';

        // reset group classes
        b.classList.remove('tg-grouped-first','tg-grouped-middle','tg-grouped-last');

        if(prevType === type){
          // continue group
          for(let j=groupStart;j<=i;j++){
            if(j===groupStart) bubbles[j].classList.add('tg-grouped-first');
            else if(j<i) bubbles[j].classList.add('tg-grouped-middle');
            else bubbles[j].classList.add('tg-grouped-last');
          }
        } else {
          // previous group ended
          if(i>0 && prevType!==null){
            const last = i-1;
            const first = groupStart;
            for(let j=first;j<=last;j++){
              if(j===first) bubbles[j].classList.add('tg-grouped-first');
              else if(j<last) bubbles[j].classList.add('tg-grouped-middle');
              else bubbles[j].classList.add('tg-grouped-last');
            }
          }
          groupStart = i;
        }
        prevType = type;
      }

      // finalize last group
      if(groupStart < bubbles.length){
        const last = bubbles.length-1;
        const first = groupStart;
        for(let j=first;j<=last;j++){
          if(j===first) bubbles[j].classList.add('tg-grouped-first');
          else if(j<last) bubbles[j].classList.add('tg-grouped-middle');
          else bubbles[j].classList.add('tg-grouped-last');
        }
      }
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
      wrapper.style.position = 'relative';

      // avatar
      const avatar = document.createElement('img');
      avatar.className = 'tg-bubble-avatar';
      avatar.alt = persona?.name || 'user';
      avatar.src = persona?.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(persona?.name || 'U')}&size=${AVATAR_DIAM}`;
      avatar.onerror = () => {
        avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(persona?.name || 'U')}&size=${AVATAR_DIAM}`;
      };

      // content
      const content = document.createElement('div');
      content.className = 'tg-bubble-content';

      if(type === 'incoming'){
        content.style.background = INCOMING_BG;
        content.style.color = INCOMING_TEXT;
      } else {
        content.style.background = OUTGOING_BG;
        content.style.color = '#fff';
      }

      // reply preview
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
      const time = document.createElement('span');
      time.textContent = formatTime(timestamp);
      meta.appendChild(time);

      if(type==='outgoing'){
        const seen = document.createElement('div');
        seen.className = 'seen';
        const count = window.__abrox_seen_map?.[id] || 1;
        seen.innerHTML = `<i data-lucide="eye"></i> ${count}`;
        meta.appendChild(seen);
      }

      content.appendChild(meta);

      // assembly
      if(type==='incoming'){
        wrapper.appendChild(avatar);
        wrapper.appendChild(content);
      } else {
        wrapper.style.flexDirection = 'row-reverse';
        wrapper.appendChild(avatar);
        wrapper.appendChild(content);
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

      updateGrouping();

      const atBottom =
        (container.scrollTop + container.clientHeight) >= (container.scrollHeight - 120);

      if(atBottom){
        container.scrollTop = container.scrollHeight;
        hideJump();
      } else {
        unseenCount++;
        updateJump();
        showJump();
      }

      if(window.lucide?.createIcons){
        try{ window.lucide.createIcons(); }catch(e){}
      }

      return id;
    }

    function updateJump(){
      if(jumpText){
        jumpText.textContent = unseenCount > 1
          ? `New messages · ${unseenCount}`
          : 'New messages';
      }
    }
    function showJump(){ jumpIndicator?.classList.remove('hidden'); }
    function hideJump(){ jumpIndicator?.classList.add('hidden'); unseenCount = 0; updateJump(); }

    jumpIndicator?.addEventListener('click', ()=>{
      container.scrollTop = container.scrollHeight;
      hideJump();
    });

    container.addEventListener('scroll', ()=>{
      const bottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      bottom > 100 ? showJump() : hideJump();
    });

    document.addEventListener('headerTyping', (ev)=>{
      try{
        const name = ev.detail?.name || 'Someone';
        typingSet.add(name);
        if(typingTimeouts.has(name)) clearTimeout(typingTimeouts.get(name));

        if(metaLine){
          metaLine.style.opacity = '0.95';
          if(typingSet.size > 2){
            metaLine.textContent = `${Array.from(typingSet).slice(0,2).join(', ')} and others are typing...`;
          } else {
            metaLine.textContent = Array.from(typingSet).join(' ') +
              (typingSet.size > 1 ? ' are typing...' : ' is typing...');
          }
        }

        typingTimeouts.set(name, setTimeout(()=>{
          typingSet.delete(name);
          typingTimeouts.delete(name);
          if(metaLine){
            metaLine.textContent =
              `${(window.MEMBER_COUNT||0).toLocaleString()} members, ${(window.ONLINE_COUNT||0).toLocaleString()} online`;
            metaLine.style.opacity = '';
          }
        }, 1600 + Math.random()*1200));

      }catch(e){}
    });

    window.TGRenderer = {
      appendMessage:(p,t,o)=> appendMessage(p||{}, String(t||''), o||{}),
      showTyping:(p)=>{
        document.dispatchEvent(new CustomEvent('headerTyping',{
          detail:{ name:(p&&p.name)?p.name:'Someone' }
        }));
      }
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
            caption:m.caption,
            replyToText: m.replyToText,
            replyToId: m.replyToId
          });
        });
      }
    };

    console.log('bubble-renderer fully integrated with grouping');
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
