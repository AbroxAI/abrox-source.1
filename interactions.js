// interactions.js — FULL integration for Telegram 2026 widget
(function () {
  'use strict';

  const input = document.getElementById('tg-comment-input');
  const sendBtn = document.getElementById('tg-send-btn');
  const cameraBtn = document.getElementById('tg-camera-btn');
  const emojiBtn = document.getElementById('tg-emoji-btn');
  const container = document.getElementById('tg-comments-container');

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

    const id = window.TGRenderer?.appendMessage(me, text, {
      type: 'outgoing',
      timestamp: new Date()
    });

    input.value = '';
    updateInputState();

    simulateRealisticResponse(text);

    return id;
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
    if (!window.RealismEngine || !window.identityPool) return;

    const persona = window.identityPool.getRandomPersona?.();
    if (!persona) return;

    const delay = 800 + Math.random() * 1600;

    // Trigger header typing
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
     SCROLL BEHAVIOR FIX
  ====================================================== */

  container?.addEventListener('scroll', () => {
    const atBottom =
      container.scrollTop + container.clientHeight >=
      container.scrollHeight - 50;

    if (atBottom) {
      const jump = document.getElementById('tg-jump-indicator');
      jump?.classList.add('hidden');
    }
  });

  /* ======================================================
     EMOJI BUTTON (basic insertion)
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

  console.log('interactions.js fully integrated with bubble-renderer & realism engine');

})();
