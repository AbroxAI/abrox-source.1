// interactions.js — FIXED for TGRenderer readiness & Blue Pill
(function () {
  'use strict';

  const input = document.getElementById('tg-comment-input');
  const sendBtn = document.getElementById('tg-send-btn');
  const cameraBtn = document.getElementById('tg-camera-btn');
  const emojiBtn = document.getElementById('tg-emoji-btn');
  const container = document.getElementById('tg-comments-container');
  const jumpIndicator = document.getElementById('tg-jump-indicator');
  const jumpText = document.getElementById('tg-jump-text');

  if (!input || !sendBtn) {
    console.error('interactions.js: required elements missing');
    return;
  }

  /* ======================================================
     INPUT STATE HANDLING (Blue circle send toggle)
  ====================================================== */
  function updateInputState() {
    const hasText = input.value.trim().length > 0;
    if (hasText) {
      sendBtn.classList.remove('hidden');
      cameraBtn?.classList.add('hidden');
    } else {
      sendBtn.classList.add('hidden');
      cameraBtn?.classList.remove('hidden');
    }
  }
  input.addEventListener('input', updateInputState);
  updateInputState();

  /* ======================================================
     WAIT FOR TGRenderer
  ====================================================== */
  function onTGRendererReady(callback) {
    if (window.TGRenderer && typeof window.TGRenderer.appendMessage === 'function') {
      callback();
    } else {
      const interval = setInterval(() => {
        if (window.TGRenderer && typeof window.TGRenderer.appendMessage === 'function') {
          clearInterval(interval);
          callback();
        }
      }, 50);
    }
  }

  /* ======================================================
     SEND MESSAGE
  ====================================================== */
  function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    const me = {
      name: "You",
      avatar: window.CURRENT_USER_AVATAR || null,
      isAdmin: false
    };

    onTGRendererReady(() => {
      const id = window.TGRenderer.appendMessage(me, text, {
        type: 'outgoing',
        timestamp: new Date()
      });

      input.value = '';
      updateInputState();

      simulateRealisticResponse(text);
    });
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  /* ======================================================
     REALISM ENGINE HOOK
  ====================================================== */
  function simulateRealisticResponse(userText) {
    onTGRendererReady(() => {
      if (!window.RealismEngine || !window.identityPool) return;

      const persona = window.identityPool.getRandomPersona?.();
      if (!persona) return;

      const delay = 800 + Math.random() * 1600;

      document.dispatchEvent(new CustomEvent('headerTyping', {
        detail: { name: persona.name }
      }));

      setTimeout(() => {
        const reply = window.RealismEngine.generateReply?.(userText, persona)
          || generateFallbackReply(userText);

        window.TGRenderer.appendMessage(persona, reply, {
          type: 'incoming',
          timestamp: new Date()
        });
      }, delay);
    });
  }

  function generateFallbackReply(text) {
    const responses = [
      "Nice one 🔥",
      "Interesting take",
      "Facts.",
      "Can you explain more?",
      "Agreed.",
      "That’s solid.",
      "100%",
      "Exactly what I was thinking"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /* ======================================================
     BLUE PILL / JUMP INDICATOR
  ====================================================== */
  function updateJump(unseenCount) {
    if (!jumpText) return;
    jumpText.textContent = unseenCount > 1
      ? `New messages · ${unseenCount}`
      : 'New messages';
  }

  function showJump() {
    jumpIndicator?.classList.remove('hidden');
  }

  function hideJump() {
    jumpIndicator?.classList.add('hidden');
  }

  jumpIndicator?.addEventListener('click', () => {
    if (container) container.scrollTop = container.scrollHeight;
    hideJump();
  });

  container?.addEventListener('scroll', () => {
    if (!container) return;
    const bottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    bottom > 100 ? showJump() : hideJump();
  });

  /* ======================================================
     EMOJI BUTTON
  ====================================================== */
  emojiBtn?.addEventListener('click', () => {
    input.value += "😊";
    input.focus();
    updateInputState();
  });

  /* ======================================================
     INITIAL ICON RENDER
  ====================================================== */
  if (window.lucide?.createIcons) {
    try { window.lucide.createIcons(); } catch (e) {}
  }

  console.log('interactions.js FIXED with TGRenderer-ready blue pill & realism');

})();
