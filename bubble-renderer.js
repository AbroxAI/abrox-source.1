// bubble-renderer.js (Telegram full grouping logic integrated)
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

    let AVATAR_DIAM = 40;
    try{
      const v = getComputedStyle(document.documentElement)
        .getPropertyValue('--tg-avatar-size');
      const parsed = parseInt(v,10);
      if(!Number.isNaN(parsed) && parsed > 0) AVATAR_DIAM = parsed;
    }catch(e){}

    let lastMessageDateKey = null;
    let unseenCount = 0;
    const MESSAGE_MAP = new Map();

    const typingSet = new Set();
    const typingTimeouts = new Map();

    function formatTime(date){
      try{
        return new Date(date)
          .toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
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
      sticker.textContent = new Date(dateObj)
        .toLocaleDateString([], {year:'numeric', month:'short', day:'numeric'});
      container.appendChild(sticker);
    }

    function createBubbleElement(persona, text, opts={}){
      const timestamp = opts.timestamp || new Date();
      const type = opts.type === 'outgoing' ? 'outgoing' : 'incoming';
      const id = opts.id || ('m_' + Date.now() + '_' + Math.random());

      insertDateSticker(timestamp);

      const wrapper = document.createElement('div');
      wrapper.className = `tg-bubble ${type}`;
      wrapper.dataset.id = id;

      const avatar = document.createElement('img');
      avatar.className = 'tg-bubble-avatar';
      avatar.alt = persona?.name || 'user';
      avatar.src = persona?.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(persona?.name || 'U')}&size=${AVATAR_DIAM}`;
      avatar.onerror = () => {
        avatar.src =
          `https://ui-avatars.com/api/?name=${encodeURIComponent(persona?.name || 'U')}&size=${AVATAR_DIAM}`;
      };

      const content = document.createElement('div');
      content.className = 'tg-bubble-content';

      const sender = document.createElement('div');
      sender.className = 'tg-bubble-sender';
      sender.textContent = persona?.name || 'User';
      content.appendChild(sender);

      const textEl = document.createElement('div');
      textEl.className = 'tg-bubble-text';
      textEl.textContent = text || '';
      content.appendChild(textEl);

      const meta = document.createElement('div');
      meta.className = 'tg-bubble-meta';

      const time = document.createElement('span');
      time.textContent = formatTime(timestamp);
      meta.appendChild(time);

      content.appendChild(meta);

      wrapper.appendChild(avatar);
      wrapper.appendChild(content);

      return { wrapper, id, persona, timestamp, type };
    }

    function applyGrouping(newBubble, personaName, type){
      const last = container.lastElementChild;
      if(!last || !last.classList.contains('tg-bubble')) return;

      const lastType = last.classList.contains('outgoing')
        ? 'outgoing' : 'incoming';
      const lastSender =
        last.querySelector('.tg-bubble-sender')?.textContent;

      if(lastType === type && lastSender === personaName){
        // last becomes grouped-first or grouped-middle
        if(!last.classList.contains('tg-grouped')){
          last.classList.add('tg-grouped-first');
        } else {
          last.classList.remove('tg-grouped-last');
          last.classList.add('tg-grouped-middle');
        }

        newBubble.classList.add('tg-grouped-last');

        // hide avatar for grouped messages
        newBubble.querySelector('.tg-bubble-avatar').style.visibility = 'hidden';
      }
    }

    function appendMessage(persona, text, opts={}){
      const created = createBubbleElement(persona, text, opts);
      const el = created.wrapper;

      applyGrouping(
        el,
        persona?.name || 'User',
        created.type
      );

      container.appendChild(el);

      MESSAGE_MAP.set(created.id,{
        el,
        persona: created.persona,
        timestamp: created.timestamp
      });

      const atBottom =
        (container.scrollTop + container.clientHeight) >=
        (container.scrollHeight - 120);

      if(atBottom){
        container.scrollTop = container.scrollHeight;
        hideJump();
      } else {
        unseenCount++;
        updateJump();
        showJump();
      }

      return created.id;
    }

    function updateJump(){
      if(jumpText){
        jumpText.textContent = unseenCount > 1
          ? `New messages · ${unseenCount}`
          : 'New messages';
      }
    }
    function showJump(){ jumpIndicator?.classList.remove('hidden'); }
    function hideJump(){
      jumpIndicator?.classList.add('hidden');
      unseenCount = 0;
      updateJump();
    }

    window.TGRenderer = {
      appendMessage:(p,t,o)=> appendMessage(p||{}, String(t||''), o||{})
    };

    console.log('bubble-renderer with Telegram grouping loaded');
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
