// interactions-v11-full-sync.js — FINAL FIXED (Header-only typing, fully queued, no ghost conflicts)
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

  /* =====================================================
     INPUT STATE
  ===================================================== */
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

  /* =====================================================
     TRUE GLOBAL TYPING QUEUE (CRITICAL FIX)
  ===================================================== */
  let typingQueue = Promise.resolve();

  function queuedHeaderTyping(persona, message) {
    if (!persona?.name) return Promise.resolve();

    typingQueue = typingQueue.then(async () => {

      // Trigger header typing
      document.dispatchEvent(
        new CustomEvent('headerTyping', { detail: { name: persona.name } })
      );

      // Wait realistic duration
      const duration =
        window.TGRenderer?.calculateTypingDuration?.(message) || 1200;

      await new Promise(resolve => setTimeout(resolve, duration));

    }).catch(err => {
      console.error("Typing queue error:", err);
    });

    return typingQueue;
  }

  /* =====================================================
     SEND MESSAGE (USER)
  ===================================================== */
  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    const me = {
      name: "You",
      avatar: window.CURRENT_USER_AVATAR || null,
      isAdmin: false
    };

    window.TGRenderer?.appendMessage(me, text, {
      type: 'outgoing',
      timestamp: new Date()
    });

    input.value = '';
    updateInputState();
    hideJump();

    // Simulate group response
    await simulateRealisticResponse(text);

    // Notify app.js (admin auto handler etc)
    document.dispatchEvent(
      new CustomEvent('sendMessage', { detail: { text } })
    );
  }

  sendBtn.addEventListener('click', sendMessage);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  /* =====================================================
     REALISM RESPONSE HANDLER
  ===================================================== */
  async function simulateRealisticResponse(userText) {
    if (!window.realism || !window.identityPool) return;

    const persona = window.identityPool.getRandomPersona?.();
    if (!persona) return;

    // 1️⃣ Queue header typing (prevents overlap bugs)
    await queuedHeaderTyping(persona, userText);

    // 2️⃣ Generate reply safely
    const reply =
      window.realism.generateReply?.(userText, persona)
      || generateFallbackReply(userText);

    // 3️⃣ Append message (auto-clears header typing via app.js)
    const bubbleEl = window.TGRenderer?.appendMessage(persona, reply, {
      type: 'incoming',
      timestamp: new Date()
    });

    attachReplyPreview(bubbleEl, reply);

    handleJumpIndicator();
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

  /* =====================================================
     JUMP INDICATOR (NEW MESSAGE PILL)
  ===================================================== */
  function handleJumpIndicator() {
    const atBottom =
      (container.scrollTop + container.clientHeight) >=
      (container.scrollHeight - 50);

    if (!atBottom) {
      unseenCount++;
      updateJump();
      showJump();
    }
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
    jumpIndicator?.classList.add('hidden');
    unseenCount = 0;
    updateJump();
  }

  jumpIndicator?.addEventListener('click', () => {
    container.scrollTop = container.scrollHeight;
    hideJump();
  });

  container?.addEventListener('scroll', () => {
    const bottom =
      container.scrollHeight -
      container.scrollTop -
      container.clientHeight;

    bottom > 100 ? showJump() : hideJump();
  });

  /* =====================================================
     REPLY PREVIEW / HIGHLIGHT
  ===================================================== */
  function attachReplyPreview(bubbleEl, replyText) {
    if (!bubbleEl || !replyText) return;

    const replyButton = bubbleEl.querySelector('.tg-bubble-reply');
    if (!replyButton) return;

    replyButton.addEventListener('click', () => {

      const allBubbles =
        Array.from(document.querySelectorAll('.tg-bubble'));

      const target = allBubbles.find(b =>
        b !== bubbleEl &&
        b.querySelector('.tg-bubble-text')?.textContent
          ?.includes(replyText)
      );

      if (!target) return;

      target.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

      target.classList.add('tg-highlight');
      setTimeout(() =>
        target.classList.remove('tg-highlight'),
        2600
      );
    });
  }

  /* =====================================================
     PIN HANDLER
  ===================================================== */
  pinBtn?.addEventListener('click', () => {
    const pinnedId =
      window.TGRenderer.getPinnedMessageId?.();

    if (!pinnedId) return;

    const pinnedBubble =
      document.querySelector(
        `.tg-bubble[data-id="${pinnedId}"]`
      );

    if (!pinnedBubble) return;

    pinnedBubble.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });

    pinnedBubble.classList.add('tg-highlight');
    setTimeout(() =>
      pinnedBubble.classList.remove('tg-highlight'),
      2600
    );
  });

  /* =====================================================
     EMOJI BUTTON
  ===================================================== */
  emojiBtn?.addEventListener('click', () => {
    input.value += "😊";
    input.focus();
    updateInputState();
  });

  /* =====================================================
     ICON RENDER
  ===================================================== */
  if (window.lucide?.createIcons) {
    try { window.lucide.createIcons(); } catch (e) {}
  }

  console.log('✅ interactions.js — FULLY FIXED, header-only typing, queue-safe, realism synced.');

})();
