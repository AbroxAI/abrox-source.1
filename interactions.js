// interactions.js — FULL Telegram 2026 integration (Ultra-Real Typing + Variable Durations + Reply Preview Jumper + Fixed Header Typing)
(function () {
  'use strict';

  const input = document.getElementById('tg-comment-input');
  const sendBtn = document.getElementById('tg-send-btn');
  const cameraBtn = document.getElementById('tg-camera-btn');
  const emojiBtn = document.getElementById('tg-emoji-btn');
  const container = document.getElementById('tg-comments-container');
  const jumpIndicator = document.getElementById('tg-jump-indicator');
  const jumpText = document.getElementById('tg-jump-text');
  const headerMeta = document.getElementById('tg-meta-line');

  if (!input || !sendBtn || !container) {
    console.error('interactions.js: required elements missing');
    return;
  }

  let unseenCount = 0;
  const typingPersons = new Set();

  /* ======================================================
     INPUT STATE HANDLING
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
     TYPING DURATION CALCULATOR
  ====================================================== */
  function getTypingDelay(text) {
    if (!text) return 800;
    const base = 600;
    const perChar = 35;
    const randomFactor = Math.random() * 400;
    return Math.min(8000, base + text.length * perChar + randomFactor);
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

    const id = window.TGRenderer?.appendMessage(me, text, {
      type: 'outgoing',
      timestamp: new Date()
    });

    input.value = '';
    updateInputState();
    hideJump();

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
     REALISM ENGINE HOOK + HEADER TYPING
  ====================================================== */
  function simulateRealisticResponse(userText) {
    if (!window.RealismEngine || !window.identityPool) return;

    const persona = window.identityPool.getRandomPersona?.();
    if (!persona) return;

    window.TGRenderer?.showTyping(persona);
    typingPersons.add(persona.name);
    updateHeaderTyping();

    const delay = getTypingDelay(userText);

    setTimeout(() => {
      const reply = window.RealismEngine.generateReply?.(userText, persona)
        || generateFallbackReply(userText);

      const bubbleId = window.TGRenderer.appendMessage(persona, reply, {
        type: 'incoming',
        timestamp: new Date()
      });

      attachReplyPreview(bubbleId, reply); // ✅ Attach reply preview jumper

      typingPersons.delete(persona.name);
      updateHeaderTyping();

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

  /* ======================================================
     HEADER TYPING UPDATE
  ====================================================== */
  function updateHeaderTyping() {
    if (!headerMeta) return;
    if (typingPersons.size === 0) {
      headerMeta.textContent = `${window.MEMBER_COUNT?.toLocaleString() || 0} members, ${window.ONLINE_COUNT?.toLocaleString() || 0} online`;
    } else if (typingPersons.size === 1) {
      const [name] = typingPersons;
      headerMeta.textContent = `${name} is typing…`;
    } else {
      const names = Array.from(typingPersons).slice(0, 2).join(" & ");
      headerMeta.textContent = `${names} are typing…`;
    }
  }

  /* ======================================================
     REPLY PREVIEW / YELLOW HIGHLIGHT
  ====================================================== */
  function attachReplyPreview(bubbleId, replyText) {
    if (!bubbleId || !replyText) return;
    const newMsgEl = document.querySelector(`[data-id="${bubbleId}"]`);
    if (!newMsgEl) return;

    const replyPreview = newMsgEl.querySelector('.tg-bubble-reply');
    if (!replyPreview) return;

    replyPreview.addEventListener('click', () => {
      const allBubbles = Array.from(document.querySelectorAll('.tg-bubble'));
      const target = allBubbles.find(b =>
        b.dataset.id !== bubbleId &&
        b.querySelector('.tg-bubble-text')?.textContent.includes(replyText)
      );
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.classList.add('tg-highlight');
        setTimeout(() => target.classList.remove('tg-highlight'), 2600);
      }
    });
  }

  /* ======================================================
     NEW MESSAGE PILL
  ====================================================== */
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

  console.log('interactions.js fully integrated: fixed typing indicator, reply preview jumper, new message pill, ultra-real typing');
})();
