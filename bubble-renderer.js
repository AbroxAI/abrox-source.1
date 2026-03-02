// bubble-renderer.js — Telegram 2026 Renderer (clean unified text system + fixed typing sync)

(function () {
  'use strict';

  function init() {
    const container = document.getElementById('tg-comments-container');
    const jumpIndicator = document.getElementById('tg-jump-indicator');
    const jumpText = document.getElementById('tg-jump-text');
    if (!container) { console.error('bubble-renderer: container missing'); return; }

    let unseenCount = 0;
    let lastDateKey = null;
    const MESSAGE_MAP = new Map();
    let PINNED_MESSAGE_ID = null;

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
        year: 'numeric', month: 'short', day: 'numeric'
      });

      container.appendChild(sticker);
    }

    /* ===============================
       PERSONA COLOR ASSIGNMENT
    =============================== */
    const personaColorMap = new Map();
    const personaColors = [
      "1","2","3","4","5","6","7","8","9","10","11","12","13","14","15"
    ];

    function getPersonaColor(personaName) {
      if (!personaName) return "1";
      if (!personaColorMap.has(personaName)) {
        const assigned = personaColors[personaColorMap.size % personaColors.length];
        personaColorMap.set(personaName, assigned);
      }
      return personaColorMap.get(personaName);
    }

    /* ===============================
       CREATE BUBBLE
    =============================== */
    function createBubble(persona, text, opts = {}) {
      const id = opts.id || ('m_' + Date.now() + '_' + Math.floor(Math.random() * 9999));
      const type = opts.type === 'outgoing' ? 'outgoing' : 'incoming';
      const timestamp = opts.timestamp || new Date();
      const replyToId = opts.replyToId || null;
      const replyToText = opts.replyToText || null;
      const image = opts.image || null;
      const caption = opts.caption || null;

      insertDateSticker(timestamp);

      const wrapper = document.createElement('div');
      wrapper.className = `tg-bubble ${type}`;
      wrapper.dataset.id = id;
      wrapper.dataset.persona = persona?.name || 'User';

      const avatar = document.createElement('img');
      avatar.className = 'tg-bubble-avatar';
      avatar.alt = persona?.name || 'User';
      avatar.src = persona?.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(persona?.name || 'U')}`;
      avatar.onerror = () =>
        avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(persona?.name || 'U')}`;

      const content = document.createElement('div');
      content.className = 'tg-bubble-content';

      const sender = document.createElement('div');
      sender.className = 'tg-bubble-sender';
      sender.textContent = persona?.name || 'User';
      sender.dataset.color = getPersonaColor(persona?.name || 'User');
      content.appendChild(sender);

      if (replyToText || replyToId) {
        const replyPreview = document.createElement('div');
        replyPreview.className = 'tg-reply-preview';
        replyPreview.textContent = replyToText
          ? (replyToText.length > 120
              ? replyToText.slice(0, 117) + '...'
              : replyToText)
          : 'Reply';

        replyPreview.addEventListener('click', () => {
          if (!replyToId) return;
          const target = MESSAGE_MAP.get(replyToId);
          if (!target) return;
          target.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          target.el.classList.add('tg-highlight');
          setTimeout(() => target.el.classList.remove('tg-highlight'), 2600);
        });

        content.appendChild(replyPreview);
      }

      if (image) {
        const img = document.createElement('img');
        img.className = 'tg-bubble-image';
        img.src = image;
        img.style.width = '100%';
        img.style.borderRadius = '12px';
        img.onerror = () => img.remove();
        content.appendChild(img);
      }

      const finalText = caption || text;

      if (finalText) {
        const textEl = document.createElement('div');
        textEl.className = 'tg-bubble-text';
        textEl.style.whiteSpace = 'pre-line';
        textEl.textContent = finalText;
        content.appendChild(textEl);

        if (caption) PINNED_MESSAGE_ID = id;
      }

      if (persona?.isAdmin) {
        const adminBtn = document.createElement('a');
        adminBtn.className = 'glass-btn';
        adminBtn.href = window.CONTACT_ADMIN_LINK || 'https://t.me/';
        adminBtn.target = '_blank';
        adminBtn.textContent = 'Contact Admin';
        adminBtn.style.marginTop = '8px';
        content.appendChild(adminBtn);
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

      MESSAGE_MAP.set(id, { el: wrapper, text: finalText, persona, timestamp });

      return { el: wrapper, id };
    }

    function appendMessage(persona, text, opts = {}) {
      const result = createBubble(persona, text, opts);
      const bubble = result.el;
      const id = result.id;

      container.appendChild(bubble);

      const atBottom =
        container.scrollTop + container.clientHeight >=
        container.scrollHeight - 80;

      if (atBottom) {
        container.scrollTop = container.scrollHeight;
        hideJump();
      } else {
        unseenCount++;
        updateJump();
        showJump();
      }

      return id;
    }

    function updateJump() {
      if (!jumpText) return;
      jumpText.textContent =
        unseenCount > 1
          ? `New messages · ${unseenCount}`
          : 'New messages';
    }

    function showJump() {
      jumpIndicator?.classList.remove('hidden');
    }

    function hideJump() {
      unseenCount = 0;
      updateJump();
      jumpIndicator?.classList.add('hidden');
    }

    jumpIndicator?.addEventListener('click', () => {
      container.scrollTop = container.scrollHeight;
      hideJump();
    });

    container.addEventListener('scroll', () => {
      const distanceFromBottom =
        container.scrollHeight -
        container.scrollTop -
        container.clientHeight;
      if (distanceFromBottom < 80) hideJump();
    });

    /* ===============================
       FIXED TYPING SYSTEM
    =============================== */

    function calculateTypingDuration(message) {
      if (!message) return 1200;

      const baseSpeed = 45;
      const minTime = 1000;
      const maxTime = 6000;

      let duration = message.length * baseSpeed;
      duration += Math.random() * 800;

      if (duration < minTime) duration = minTime;
      if (duration > maxTime) duration = maxTime;

      return Math.floor(duration);
    }

    function showTyping(persona, message = "", customDuration = null) {
      if (!persona || !container) return Promise.resolve();

      return new Promise((resolve) => {

        const duration = customDuration || calculateTypingDuration(message);

        const typingBubble = document.createElement('div');
        typingBubble.className = 'tg-bubble incoming tg-typing';
        typingBubble.dataset.typing = 'true';

        const avatar = document.createElement('img');
        avatar.className = 'tg-bubble-avatar';
        avatar.src = persona.avatar;
        avatar.alt = persona.name;

        const content = document.createElement('div');
        content.className = 'tg-bubble-content';

        const sender = document.createElement('div');
        sender.className = 'tg-bubble-sender';
        sender.dataset.color = getPersonaColor(persona.name);
        sender.textContent = persona.name;

        const dots = document.createElement('div');
        dots.className = 'tg-typing-dots';
        dots.textContent = 'typing…';

        content.appendChild(sender);
        content.appendChild(dots);
        typingBubble.appendChild(avatar);
        typingBubble.appendChild(content);

        container.appendChild(typingBubble);
        container.scrollTop = container.scrollHeight;

        setTimeout(() => {
          const existing = container.querySelector('[data-typing="true"]');
          if (existing) existing.remove();
          resolve();
        }, duration);
      });
    }

    function hideTyping() {
      const existing = container.querySelector('[data-typing="true"]');
      if (existing) existing.remove();
    }

    window.TGRenderer = {
      appendMessage,
      showTyping,
      hideTyping,
      getPinnedMessageId: () => PINNED_MESSAGE_ID
    };

    console.log('✅ bubble-renderer fixed — typing fully synchronized');
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();

})();
