// interactions.js — Telegram 2026 interactions with ultra-real typing + reply preview + pinned view
(function () {
  'use strict';

  const input = document.getElementById('tg-comment-input');
  const sendBtn = document.getElementById('tg-send-btn');
  const cameraBtn = document.getElementById('tg-camera-btn');
  const emojiBtn = document.getElementById('tg-emoji-btn');
  const container = document.getElementById('tg-comments-container');
  const jumpIndicator = document.getElementById('tg-jump-indicator');
  const jumpText = document.getElementById('tg-jump-text');
  const pinBtn = document.querySelector('.tg-pin-banner .pin-btn');

  if (!input || !sendBtn || !container) {
    console.error('interactions.js: required elements missing');
    return;
  }

  let unseenCount = 0;

  /* ===============================
     INPUT STATE HANDLING
  =============================== */
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

  /* ===============================
     TYPING DURATION CALCULATOR
  =============================== */
  function getTypingDelay(text) {
    if (!text) return 800;
    const base = 600;
    const perChar = 35;
    const randomFactor = Math.random() * 400;
    return Math.min(8000, base + text.length * perChar + randomFactor);
  }

  /* ===============================
     SEND MESSAGE
  =============================== */
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
    hideJump();

    simulateRealisticResponse(text);

    document.dispatchEvent(new CustomEvent('sendMessage', { detail: { text } }));

    return id;
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  /* ===============================
     REALISM ENGINE HOOK
  =============================== */
  function simulateRealisticResponse(userText) {
    if (!window.RealismEngine || !window.identityPool) return;

    const persona = window.identityPool.getRandomPersona?.();
    if (!persona) return;

    window.TGRenderer?.showTyping(persona);
    document.dispatchEvent(new CustomEvent('headerTyping', { detail: { name: persona.name } }));

    const delay = getTypingDelay(userText);

    setTimeout(() => {
      const reply = window.RealismEngine.generateReply?.(userText, persona)
        || generateFallbackReply(userText);

      const bubbleEl = window.TGRenderer.appendMessage(persona, reply, {
        type: 'incoming',
        timestamp: new Date()
      });

      attachReplyPreview(bubbleEl, reply);

      const atBottom = (container.scrollTop + container.clientHeight) >= (container.scrollHeight - 50);
      if (!atBottom) {
        unseenCount++;
        updateJump();
        showJump();
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

  /* ===============================
     REPLY PREVIEW / YELLOW HIGHLIGHT
  =============================== */
  function attachReplyPreview(bubbleEl, replyText) {
    if (!bubbleEl || !replyText) return;
    const replyButton = bubbleEl.querySelector('.tg-bubble-reply');
    if (!replyButton) return;

    replyButton.addEventListener('click', () => {
      const allBubbles = Array.from(document.querySelectorAll('.tg-bubble'));
      const target = allBubbles.find(b =>
        b !== bubbleEl && b.querySelector('.tg-bubble-text')?.textContent.includes(replyText)
      );

      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.classList.add('tg-highlight');
        setTimeout(() => target.classList.remove('tg-highlight'), 2600);
      }
    });
  }

  /* ===============================
     NEW MESSAGE BLUE PILL
  =============================== */
  function updateJump() {
    if (jumpText) {
      jumpText.textContent = unseenCount > 1
        ? `New messages · ${unseenCount}`
        : 'New messages';
    }
  }

  function showJump() { jumpIndicator?.classList.remove('hidden'); }
  function hideJump() { jumpIndicator?.classList.add('hidden'); unseenCount = 0; updateJump(); }

  jumpIndicator?.addEventListener('click', () => {
    container.scrollTop = container.scrollHeight;
    hideJump();
  });

  container?.addEventListener('scroll', () => {
    const bottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    bottom > 100 ? showJump() : hideJump();
  });

  /* ===============================
     VIEW PINNED BUTTON
  =============================== */
  pinBtn?.addEventListener('click', () => {
    const pinnedId = window.TGRenderer.getPinnedMessageId?.();
    if (!pinnedId) return;

    const pinnedBubble = document.querySelector(`.tg-bubble[data-id="${pinnedId}"]`);
    if (!pinnedBubble) return;

    pinnedBubble.scrollIntoView({ behavior: 'smooth', block: 'center' });
    pinnedBubble.classList.add('tg-highlight');
    setTimeout(() => pinnedBubble.classList.remove('tg-highlight'), 2600);
  });

  /* ===============================
     EMOJI BUTTON
  =============================== */
  emojiBtn?.addEventListener('click', () => {
    input.value += "😊";
    input.focus();
    updateInputState();
  });

  /* ===============================
     INITIAL ICON RENDER
  =============================== */
  if (window.lucide?.createIcons) {
    try { window.lucide.createIcons(); } catch (e) {}
  }

  console.log('interactions.js fully integrated with bubble-renderer, realism engine, new message pill, reply preview, and View Pinned button');

})();
