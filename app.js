// app.js — FIXED Telegram 2026 with Pin Jumper, Typing, Yellow Fade & Admin Banner
document.addEventListener("DOMContentLoaded", () => {

  const pinBanner = document.getElementById("tg-pin-banner");
  const container = document.getElementById("tg-comments-container");
  const headerMeta = document.getElementById("tg-meta-line");
  const headerLogo = document.getElementById("tg-logo");

  if (!container) { console.error("tg-comments-container missing in DOM"); return; }

  /* =====================================================
     HEADER LOGO FIX
  ===================================================== */
  if (headerLogo) {
    headerLogo.src = "assets/logo.png";
    headerLogo.onerror = () => headerLogo.src = "assets/logo.png";
  }

  /* =====================================================
     TELEGRAM STYLE HIGHLIGHT + YELLOW FADE
  ===================================================== */
  const style = document.createElement('style');
  style.textContent = `
    .tg-highlight {
      background-color: rgba(255, 229, 100, 0.4);
      border-radius: 16px;
      animation: tgFadePulse 2.6s ease-out forwards;
    }

    @keyframes tgFadePulse {
      0% { opacity: 1; transform: scale(1.03); }
      10% { transform: scale(1); }
      90% { opacity: 1; transform: scale(1); }
      100% { opacity: 0; }
    }

    .tg-pin-text { 
      font-size: 13px; 
      line-height: 1.3; 
      margin: 0; 
      color: #e6eef8; 
    }
  `;
  document.head.appendChild(style);

  /* =====================================================
     SAFE APPEND WRAPPER
  ===================================================== */
  function appendSafe(persona, text, opts = {}) {
    if (window.TGRenderer?.appendMessage) {
      const bubbleEl = window.TGRenderer.appendMessage(persona, text, opts);
      const bubbleId = bubbleEl?.dataset?.id || null;
      document.dispatchEvent(new CustomEvent("messageAppended", { detail: { persona, bubbleId } }));

      // Attach reply preview jumper
      if (opts.replyToText && bubbleId) attachReplyJump(bubbleId, opts.replyToText);
      return bubbleId;
    }
    console.warn("TGRenderer not ready");
    return null;
  }

  /* =====================================================
     ULTRA-REAL TYPING MANAGER
  ===================================================== */
  const typingPersons = new Set();

  document.addEventListener("headerTyping", (ev) => {
    const name = ev.detail?.name;
    if (!name) return;
    typingPersons.add(name);
    updateHeaderTyping();
  });

  document.addEventListener("messageAppended", (ev) => {
    const persona = ev.detail?.persona;
    if (!persona || !persona.name) return;
    typingPersons.delete(persona.name);
    updateHeaderTyping();
  });

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

  /* =====================================================
     TYPING DURATION CALCULATOR
  ===================================================== */
  function getTypingDelay(text) {
    if (!text) return 800;
    const speed = 40;
    const base = 600;
    return Math.max(base, text.length * speed + Math.random() * 400);
  }

  /* =====================================================
     JUMP TO MESSAGE + PULSE
  ===================================================== */
  function jumpToMessage(el) {
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('tg-highlight');
    setTimeout(() => el.classList.remove('tg-highlight'), 2600);
  }

  function attachReplyJump(newMessageId, replyText) {
    const newMsgEl = document.querySelector(`[data-id="${newMessageId}"]`);
    if (!newMsgEl) return;

    const replyPreview = newMsgEl.querySelector('.tg-bubble-reply');
    if (!replyPreview) return;

    replyPreview.style.cursor = 'pointer';
    replyPreview.addEventListener('click', () => {
      const target = Array.from(document.querySelectorAll('.tg-bubble'))
        .find(b => b.dataset.id !== newMessageId && b.querySelector('.tg-bubble-text')?.textContent.includes(replyText));
      if (target) jumpToMessage(target);
    });
  }

  /* =====================================================
     ADMIN BROADCAST + PIN BANNER FIXES
  ===================================================== */
  function postAdminBroadcast() {
    const admin = window.identity?.Admin || { name: "Admin", avatar: "assets/admin.jpg", isAdmin: true };
    const caption = 
`📌 Group Rules
1️⃣ New members are read-only until verified.
2️⃣ Admins do NOT DM directly.
3️⃣ 🚫 No screenshots in chat.
4️⃣ ⚠️ Ignore unsolicited messages.
✅ To verify or contact admin, use the Contact Admin button below.`;
    const image = "assets/broadcast.jpg";
    const timestamp = new Date();

    const id = appendSafe(admin, "", { timestamp, type: "incoming", image, caption });
    return { id, caption, image };
  }

  function showPinBanner(image, caption, pinnedMessageId) {
    if (!pinBanner) return;
    pinBanner.innerHTML = "";

    const img = document.createElement("img");
    img.src = image;
    img.alt = "Pinned";
    img.onerror = () => img.src = "assets/admin.jpg";

    const text = document.createElement("p");
    text.className = "tg-pin-text";
    text.textContent = caption || "Pinned message";

    const blueBtn = document.createElement("button");
    blueBtn.className = "pin-btn";
    blueBtn.textContent = "View Pinned";
    blueBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const el = pinnedMessageId ? document.querySelector(`[data-id="${pinnedMessageId}"]`) : null;
      if (el) jumpToMessage(el);
    });

    const adminBtn = document.createElement("a");
    adminBtn.className = "glass-btn";
    adminBtn.href = window.CONTACT_ADMIN_LINK || "https://t.me/";
    adminBtn.target = "_blank";
    adminBtn.rel = "noopener";
    adminBtn.textContent = "Contact Admin";

    const btnContainer = document.createElement("div");
    btnContainer.className = "pin-btn-container";
    btnContainer.appendChild(blueBtn);
    btnContainer.appendChild(adminBtn);

    pinBanner.appendChild(img);
    pinBanner.appendChild(text);
    pinBanner.appendChild(btnContainer);
    pinBanner.classList.remove("hidden");
    requestAnimationFrame(() => pinBanner.classList.add("show"));
  }

  function postPinNotice() {
    const system = { name: "System", avatar: "assets/admin.jpg" };
    appendSafe(system, "Admin pinned a message", { timestamp: new Date(), type: "incoming" });
  }

  /* =====================================================
     POST BROADCAST & SHOW PIN
  ===================================================== */
  const broadcast = postAdminBroadcast();
  setTimeout(() => {
    postPinNotice();
    showPinBanner(broadcast.image, broadcast.caption, broadcast.id);
  }, 1000);

  /* =====================================================
     ADMIN AUTO RESPONSE
  ===================================================== */
  document.addEventListener("sendMessage", (ev) => {
    const text = ev.detail?.text || "";
    const admin = window.identity?.Admin || { name: "Admin", avatar: "assets/admin.jpg" };

    window.TGRenderer?.showTyping(admin);
    document.dispatchEvent(new CustomEvent("headerTyping", { detail: { name: admin.name } }));

    setTimeout(() => {
      appendSafe(admin, "Please use the Contact Admin button in the pinned banner above.", {
        timestamp: new Date(),
        type: "incoming"
      });
    }, getTypingDelay(text));
  });

  /* =====================================================
     AUTO REPLY HANDLER
  ===================================================== */
  document.addEventListener("autoReply", (ev) => {
    const { parentText, persona, text } = ev.detail || {};
    if (!persona || !text) return;

    window.TGRenderer?.showTyping(persona);
    document.dispatchEvent(new CustomEvent("headerTyping", { detail: { name: persona.name } }));

    setTimeout(() => {
      appendSafe(persona, text, {
        timestamp: new Date(),
        type: "incoming",
        replyToText: parentText
      });
    }, getTypingDelay(text));
  });

  /* =====================================================
     START REALISM ENGINE
  ===================================================== */
  if (window.realism?.simulateRandomCrowdV11) {
    setTimeout(() => window.realism.simulateRandomCrowdV11(), 800);
  }

  console.log("✅ app.js fully fixed: pin jumper, typing, yellow fade, admin avatar, caption alignment, header logo active");

});
