// app.js — Telegram 2026 Replica with Pin Banner, Reply Preview, Pulse Highlight
document.addEventListener("DOMContentLoaded", () => {
  const pinBanner = document.getElementById("tg-pin-banner");
  const container = document.getElementById("tg-comments-container");
  const headerMeta = document.getElementById("tg-meta-line");
  if (!container) { console.error("tg-comments-container missing in DOM"); return; }

  /* =====================================================
     CSS for Telegram-style highlight + pulse + banner
  ====================================================== */
  const style = document.createElement('style');
  style.textContent = `
  .tg-highlight {
    background-color: rgba(255, 229, 100, 0.3);
    border-radius: 14px;
    animation: tgFadePulse 2.6s ease-out forwards;
  }
  @keyframes tgFadePulse {
    0% { opacity: 1; transform: scale(1.02); }
    20% { opacity: 1; transform: scale(1); }
    100% { opacity: 0; transform: scale(1); }
  }
  /* Replica pin banner */
  .pin-banner-wrapper {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    background: rgba(23,33,43,0.95);
    border-radius: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  }
  .pin-banner-img {
    width: 120px;
    height: 120px;
    border-radius: 12px;
    object-fit: cover;
    flex-shrink: 0;
  }
  .pin-banner-content {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    flex: 1;
  }
  .pin-text {
    color: #fff;
    font-size: 0.875rem;
    line-height: 1.4;
    white-space: pre-wrap; /* keeps line breaks intact */
    margin-bottom: 8px;
  }
  .pin-btn-container {
    display: flex;
    gap: 8px;
  }
  .pin-btn {
    background: #1d9bf0;
    color: #fff;
    border: none;
    padding: 6px 12px;
    border-radius: 8px;
    cursor: pointer;
  }
  .glass-btn {
    background: rgba(255,255,255,0.1);
    color: #fff;
    border: none;
    padding: 6px 12px;
    border-radius: 8px;
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  `;
  document.head.appendChild(style);

  /* =====================================================
     SAFE APPEND WRAPPER
  ====================================================== */
  function appendSafe(persona, text, opts = {}) {
    if (window.TGRenderer?.appendMessage) {
      const id = window.TGRenderer.appendMessage(persona, text, opts);
      document.dispatchEvent(new CustomEvent("messageAppended", { detail: { persona } }));
      if (opts.replyToText) attachReplyJump(id, opts.replyToText);
      return id;
    }
    console.warn("TGRenderer not ready");
    return null;
  }

  /* =====================================================
     ULTRA-REAL TYPING MANAGER
  ====================================================== */
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
    if (typingPersons.has(persona.name)) {
      typingPersons.delete(persona.name);
      updateHeaderTyping();
    }
  });
  function updateHeaderTyping() {
    if (!headerMeta) return;
    if (typingPersons.size === 0) {
      headerMeta.textContent = `${window.MEMBER_COUNT.toLocaleString()} members, ${window.ONLINE_COUNT.toLocaleString()} online`;
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
  ====================================================== */
  function getTypingDelay(text) {
    if (!text) return 800;
    const speed = 40;
    const base = 600;
    return Math.max(base, text.length * speed + Math.random() * 400);
  }

  /* =====================================================
     JUMP TO MESSAGE + PULSE
  ====================================================== */
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
      const allBubbles = Array.from(document.querySelectorAll('.tg-bubble'));
      const target = allBubbles.find(b =>
        b.dataset.id !== newMessageId &&
        b.querySelector('.tg-bubble-text')?.textContent.includes(replyText)
      );
      if (target) jumpToMessage(target);
    });
  }

  /* =====================================================
     ADMIN BROADCAST + PIN BANNER (Replica Style)
  ====================================================== */
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
    const timestamp = new Date(2025, 2, 14, 10, 0, 0);
    const id = appendSafe(admin, "", { timestamp, type: "incoming", image, caption });
    return { id, caption, image };
  }

  function showPinBanner(image, caption, pinnedMessageId) {
    if (!pinBanner) return;
    pinBanner.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.className = "pin-banner-wrapper";

    const img = document.createElement("img");
    img.src = image;
    img.onerror = () => img.src = "assets/admin.jpg";
    img.className = "pin-banner-img";

    const right = document.createElement("div");
    right.className = "pin-banner-content";

    const text = document.createElement("div");
    text.className = "pin-text";
    text.style.whiteSpace = "pre-wrap";
    text.textContent = caption || "Pinned message";

    const btnContainer = document.createElement("div");
    btnContainer.className = "pin-btn-container";

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
    adminBtn.href = window.CONTACT_ADMIN_LINK || "https://t.me/ph_suppp";
    adminBtn.target = "_blank";
    adminBtn.rel = "noopener";
    adminBtn.textContent = "Contact Admin";

    btnContainer.appendChild(blueBtn);
    btnContainer.appendChild(adminBtn);

    right.appendChild(text);
    right.appendChild(btnContainer);

    wrapper.appendChild(img);
    wrapper.appendChild(right);

    pinBanner.appendChild(wrapper);
    pinBanner.classList.remove("hidden");
    requestAnimationFrame(() => pinBanner.classList.add("show"));
  }

  function postPinNotice() {
    const system = { name: "System", avatar: "assets/admin.jpg" };
    appendSafe(system, "Admin pinned a message", { timestamp: new Date(), type: "incoming" });
  }

  const broadcast = postAdminBroadcast();
  setTimeout(() => {
    postPinNotice();
    showPinBanner(broadcast.image, broadcast.caption, broadcast.id);
  }, 1200);

  /* =====================================================
     ADMIN AUTO RESPONSE
  ====================================================== */
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
  ====================================================== */
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
  ====================================================== */
  if (window.realism?.simulateRandomCrowdV11) {
    setTimeout(() => window.realism.simulateRandomCrowdV11(), 800);
  }

  /* =====================================================
     SAFE INPUT BAR FIX
  ====================================================== */
  const inputBar = document.querySelector(".tg-input-bar");
  if (inputBar) {
    inputBar.style.background = "rgba(23,33,43,0.78)";
    inputBar.style.backdropFilter = "blur(24px)";
    inputBar.style.webkitBackdropFilter = "blur(24px)";
    inputBar.style.borderRadius = "26px";
  }

  console.log("app.js patched: replica pin banner, reply preview, and Telegram-style pulse highlight active");
});
