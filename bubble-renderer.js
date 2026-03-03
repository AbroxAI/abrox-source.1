// bubble-renderer-final.js — Telegram 2026 (PERMANENT TYPING FIX)
(function () {
  'use strict';

  function init() {
    const container = document.getElementById('tg-comments-container');
    const jumpIndicator = document.getElementById('tg-jump-indicator');
    const jumpText = document.getElementById('tg-jump-text');

    if (!container) {
      console.error('bubble-renderer: container missing');
      return;
    }

    let unseenCount = 0;
    let lastDateKey = null;
    const MESSAGE_MAP = new Map();
    let PINNED_MESSAGE_ID = null;

    // 🔥 CORE: Per-persona typing state
    const activeTyping = new Map(); // name → { timer, resolver, bubble }

    /* ===============================
       DATE STICKERS
    =============================== */
    function formatDateKey(date) {
      const d = new Date(date);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }

    function insertDateSticker(date) {
      const key = formatDateKey(date);
      if (key === lastDateKey) return;
      lastDateKey = key;

      const sticker = document.createElement('div');
      sticker.className = 'tg-date-sticker';
      sticker.textContent = new Date(date).toLocaleDateString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      container.appendChild(sticker);
    }

    /* ===============================
       PERSONA COLOR ASSIGNMENT
    =============================== */
    const personaColorMap = new Map();
    const personaColors = ["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15"];

    function getPersonaColor(personaName) {
      if (!personaName) return "1";
      if (!personaColorMap.has(personaName)) {
        const assigned = personaColors[personaColorMap.size % personaColors.length];
        personaColorMap.set(personaName, assigned);
      }
      return personaColorMap.get(personaName);
    }

    /* ===============================
       TYPING DURATION
    =============================== */
    function calculateTypingDuration(message) {
      if (!message) return 1200;

      const baseSpeed = 45;
      const minTime = 1000;
      const maxTime = 6000;

      let duration = message.length * baseSpeed;
      duration += Math.random() * 600;

      if (duration < minTime) duration = minTime;
      if (duration > maxTime) duration = maxTime;

      return Math.floor(duration);
    }

    /* ===============================
       TYPING SYSTEM (PERMANENT FIX)
    =============================== */
    function showTyping(persona, message = "", customDuration = null) {
      if (!persona?.name) return Promise.resolve();

      const name = persona.name;

      // If already typing, cancel cleanly first
      if (activeTyping.has(name)) {
        hideTyping(name);
      }

      const duration = customDuration || calculateTypingDuration(message);

      return new Promise((resolve) => {

        const typingBubble = document.createElement('div');
        typingBubble.className = 'tg-bubble incoming tg-typing';
        typingBubble.dataset.typing = name;

        const avatar = document.createElement('img');
        avatar.className = 'tg-bubble-avatar';
        avatar.src = persona.avatar;
        avatar.alt = name;

        const content = document.createElement('div');
        content.className = 'tg-bubble-content';

        const sender = document.createElement('div');
        sender.className = 'tg-bubble-sender';
        sender.dataset.color = getPersonaColor(name);
        sender.textContent = name;

        const dots = document.createElement('div');
        dots.className = 'tg-typing-dots';
        dots.textContent = 'typing…';

        content.appendChild(sender);
        content.appendChild(dots);
        typingBubble.appendChild(avatar);
        typingBubble.appendChild(content);

        container.appendChild(typingBubble);
        container.scrollTop = container.scrollHeight;

        const timer = setTimeout(() => {
          internalClearTyping(name);
        }, duration);

        activeTyping.set(name, {
          timer,
          resolver: resolve,
          bubble: typingBubble
        });
      });
    }

    function internalClearTyping(name) {
      const state = activeTyping.get(name);
      if (!state) return;

      clearTimeout(state.timer);

      if (state.bubble && state.bubble.parentNode) {
        state.bubble.remove();
      }

      activeTyping.delete(name);

      // 🔥 THIS IS THE CRITICAL PART
      if (typeof state.resolver === 'function') {
        state.resolver(); // Promise resolves ONLY here
      }
    }

    function hideTyping(name) {
      if (!activeTyping.has(name)) return;
      internalClearTyping(name);
    }

    /* ===============================
       MESSAGE CREATION
    =============================== */
    function createBubble(persona, text, opts = {}) {
      const id = opts.id || ('m_' + Date.now() + '_' + Math.floor(Math.random() * 9999));
      const type = opts.type === 'outgoing' ? 'outgoing' : 'incoming';
      const timestamp = opts.timestamp || new Date();

      insertDateSticker(timestamp);

      const wrapper = document.createElement('div');
      wrapper.className = `tg-bubble ${type}`;
      wrapper.dataset.id = id;
      wrapper.dataset.persona = persona?.name || 'User';

      const avatar = document.createElement('img');
      avatar.className = 'tg-bubble-avatar';
      avatar.src = persona?.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(persona?.name || 'U')}`;

      const content = document.createElement('div');
      content.className = 'tg-bubble-content';

      const sender = document.createElement('div');
      sender.className = 'tg-bubble-sender';
      sender.dataset.color = getPersonaColor(persona?.name || 'User');
      sender.textContent = persona?.name || 'User';

      content.appendChild(sender);

      if (text) {
        const textEl = document.createElement('div');
        textEl.className = 'tg-bubble-text';
        textEl.style.whiteSpace = 'pre-line';
        textEl.textContent = text;
        content.appendChild(textEl);
      }

      const meta = document.createElement('div');
      meta.className = 'tg-bubble-meta';
      meta.textContent = new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });

      content.appendChild(meta);

      if (type === 'incoming') {
        wrapper.appendChild(avatar);
        wrapper.appendChild(content);
      } else {
        wrapper.style.flexDirection = 'row-reverse';
        wrapper.appendChild(avatar);
        wrapper.appendChild(content);
      }

      MESSAGE_MAP.set(id, { el: wrapper, text, persona, timestamp });

      return { el: wrapper, id };
    }

    function appendMessage(persona, text, opts = {}) {
      // 🔥 GUARANTEED CLEANUP BEFORE MESSAGE
      hideTyping(persona?.name);

      const result = createBubble(persona, text, opts);
      container.appendChild(result.el);

      container.scrollTop = container.scrollHeight;

      return result.id;
    }

    window.TGRenderer = {
      appendMessage,
      showTyping,
      hideTyping,
      calculateTypingDuration
    };

    console.log("✅ bubble-renderer FINAL — Promise-based typing, multi-safe, ghost-proof");
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();

})();
