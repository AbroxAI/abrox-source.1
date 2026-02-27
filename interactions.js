// interactions-fixed.js — Telegram 2026 widget integration with bubble pill
(function () {
  'use strict';

  const input = document.getElementById('tg-comment-input');
  const sendBtn = document.getElementById('tg-send-btn');
  const cameraBtn = document.getElementById('tg-camera-btn');
  const emojiBtn = document.getElementById('tg-emoji-btn');
  const container = document.getElementById('tg-comments-container');
  const jumpIndicator = document.getElementById('tg-jump-indicator');
  const jumpText = document.getElementById('tg-jump-text');

  if (!input || !sendBtn || !container) {
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

    // Append outgoing message
    const id = window.TGRenderer?.appendMessage(me, text, {
      type: 'outgoing',
      timestamp: new Date()
    });

    input.value = '';
    updateInputState();

    // Reset new message pill if user was at bottom
    if (jumpIndicator) {
      jumpIndicator.classList.add('hidden');
      if (jumpText) jumpText.textContent = 'New messages';
    }

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
     REALISM ENGINE RESPONSE
  ====================================================== */
  function simulateRealisticResponse(userText) {
    if (!window.RealismEngine || !window.identityPool) return;

    const persona = window.identityPool.getRandomPersona?.();
    if (!persona) return;

    const delay = 800 + Math.random() * 1600;

    // Trigger typing header
    document.dispatchEvent(new CustomEvent('headerTyping', { detail: { name: persona.name } }));

    setTimeout(() => {
      const reply = window.RealismEngine.generateReply?.(userText, persona)
        || generateFallbackReply(userText);

      window.TGRenderer.appendMessage(persona, reply, {
        type: 'incoming',
        timestamp: new Date()
      });

      // Show new message pill if user is not at bottom
      const atBottom = (container.scrollTop + container.clientHeight) >= (container.scrollHeight - 120);
      if (!atBottom && jumpIndicator && jumpText) {
        let currentCount = parseInt(jumpText.dataset.count || '0', 10);
        currentCount++;
        jumpText.dataset.count = currentCount;
        jumpText.textContent = currentCount > 1 ? `New messages · ${currentCount}` : 'New messages';
        jumpIndicator.classList.remove('hidden');
      }

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
     EMOJI BUTTON
  ====================================================== */
  emojiBtn?.addEventListener('click', () => {
    input.value += "😊";
    input.focus();
    updateInputState();
  });

  /* ======================================================
     SCROLL HANDLING FOR NEW MESSAGE PILL
  ====================================================== */
  container.addEventListener('scroll', () => {
    const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 50;
    if (atBottom) {
      if (jumpIndicator) jumpIndicator.classList.add('hidden');
      if (jumpText) {
        jumpText.dataset.count = 0;
        jumpText.textContent = 'New messages';
      }
    }
  });

  jumpIndicator?.addEventListener('click', () => {
    container.scrollTop = container.scrollHeight;
    if (jumpIndicator) jumpIndicator.classList.add('hidden');
    if (jumpText) {
      jumpText.dataset.count = 0;
      jumpText.textContent = 'New messages';
    }
  });

  /* ======================================================
     INITIAL ICON RENDER
  ====================================================== */
  if (window.lucide?.createIcons) {
    try { window.lucide.createIcons(); } catch (e) {}
  }

  console.log('interactions.js fixed with new message pill integration');
})();
