// app-fixed.js — FINAL Telegram 2026 Integration (Header-only typing, fully synced)
document.addEventListener("DOMContentLoaded", () => {

  const pinBanner = document.getElementById("tg-pin-banner");
  const container = document.getElementById("tg-comments-container");
  const headerMeta = document.getElementById("tg-meta-line");

  if (!container) {
    console.error("tg-comments-container missing in DOM");
    return;
  }

  /* =====================================================
     TELEGRAM HIGHLIGHT PULSE
  ===================================================== */
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
  }`;
  document.head.appendChild(style);

  /* =====================================================
     SAFE APPEND WRAPPER
  ===================================================== */
  function appendSafe(persona, text, opts = {}) {

    if (!window.TGRenderer?.appendMessage) {
      console.warn("TGRenderer not ready");
      return null;
    }

    const result = window.TGRenderer.appendMessage(persona, text, opts);

    document.dispatchEvent(
      new CustomEvent("messageAppended", { detail: { persona } })
    );

    return result;
  }

  /* =====================================================
     HEADER TYPING MANAGER (AUTHORITATIVE SOURCE)
  ===================================================== */
  const typingPersons = new Map();

  document.addEventListener("headerTyping", (ev) => {
    const name = ev.detail?.name;
    if (!name) return;

    // Reset existing timer if same person types again
    if (typingPersons.has(name)) {
      clearTimeout(typingPersons.get(name));
    }

    const timeout = setTimeout(() => {
      typingPersons.delete(name);
      updateHeaderTyping();
    }, 5000);

    typingPersons.set(name, timeout);
    updateHeaderTyping();
  });

  document.addEventListener("messageAppended", (ev) => {
    const persona = ev.detail?.persona;
    if (!persona?.name) return;

    if (typingPersons.has(persona.name)) {
      clearTimeout(typingPersons.get(persona.name));
      typingPersons.delete(persona.name);
      updateHeaderTyping();
    }
  });

  function updateHeaderTyping() {
    if (!headerMeta) return;

    const names = Array.from(typingPersons.keys());

    if (names.length === 0) {
      headerMeta.textContent =
        `${window.MEMBER_COUNT?.toLocaleString?.() || "0"} members, ` +
        `${window.ONLINE_COUNT?.toLocaleString?.() || "0"} online`;
    }
    else if (names.length === 1) {
      headerMeta.textContent = `${names[0]} is typing…`;
    }
    else if (names.length === 2) {
      headerMeta.textContent = `${names[0]} & ${names[1]} are typing…`;
    }
    else {
      headerMeta.textContent =
        `${names[0]}, ${names[1]} +${names.length - 2} are typing…`;
    }
  }

  /* =====================================================
     PIN SYSTEM
  ===================================================== */
  function jumpToMessage(el) {
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("tg-highlight");
    setTimeout(() => el.classList.remove("tg-highlight"), 2600);
  }

  function safeJumpById(id, retries = 6) {
    const el = document.querySelector(`[data-id="${id}"]`);
    if (el) jumpToMessage(el);
    else if (retries > 0)
      setTimeout(() => safeJumpById(id, retries - 1), 200);
  }

  function postAdminBroadcast() {
    const admin = window.identity?.Admin || {
      name: "Admin",
      avatar: "assets/admin.jpg",
      isAdmin: true
    };

    const caption = `📌 Group Rules

1️⃣ New members are read-only until verified.
2️⃣ Admins do NOT DM directly.
3️⃣ 🚫 No screenshots in chat.
4️⃣ ⚠️ Ignore unsolicited messages.

✅ To verify or contact admin, use the Contact Admin button below.`;

    const image = "assets/broadcast.jpg";
    const timestamp = new Date(2025, 2, 14, 10, 0, 0);

    const id = appendSafe(admin, "", {
      timestamp,
      type: "incoming",
      image,
      caption
    });

    return { id, image };
  }

  function showPinBanner(image, pinnedMessageId) {

    if (!pinBanner) return;
    pinBanner.innerHTML = "";

    const img = document.createElement("img");
    img.src = image;
    img.onerror = () => (img.src = "assets/admin.jpg");

    const text = document.createElement("div");
    text.className = "tg-pin-text";
    text.textContent = "📌 Group Rules";

    const blueBtn = document.createElement("button");
    blueBtn.className = "pin-btn";
    blueBtn.textContent = "View Pinned";
    blueBtn.onclick = () => pinnedMessageId && safeJumpById(pinnedMessageId);

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
    appendSafe(
      { name: "System", avatar: "assets/admin.jpg" },
      "Admin pinned a message",
      { timestamp: new Date(), type: "incoming" }
    );
  }

  const broadcast = postAdminBroadcast();

  setTimeout(() => {
    postPinNotice();
    showPinBanner(broadcast.image, broadcast.id);
  }, 1200);

  /* =====================================================
     GLOBAL HEADER TYPING QUEUE
  ===================================================== */
  let typingQueue = Promise.resolve();

  function queuedTyping(persona, message) {

    if (!persona?.name) return Promise.resolve();

    typingQueue = typingQueue.then(async () => {

      document.dispatchEvent(
        new CustomEvent("headerTyping", { detail: { name: persona.name } })
      );

      const duration =
        window.TGRenderer?.calculateTypingDuration?.(message) || 1200;

      await new Promise(resolve => setTimeout(resolve, duration));

    }).catch(err => {
      console.error("Typing queue error:", err);
    });

    return typingQueue;
  }

  /* =====================================================
     ADMIN AUTO RESPONSE
  ===================================================== */
  document.addEventListener("sendMessage", async (ev) => {

    const text = ev.detail?.text || "";

    const admin = window.identity?.Admin || {
      name: "Admin",
      avatar: "assets/admin.jpg"
    };

    await queuedTyping(admin, text);

    appendSafe(
      admin,
      "Please use the Contact Admin button in the pinned banner above.",
      { timestamp: new Date(), type: "incoming" }
    );
  });

  /* =====================================================
     AUTO REPLY HANDLER
  ===================================================== */
  document.addEventListener("autoReply", async (ev) => {

    const { parentText, persona, text } = ev.detail || {};
    if (!persona || !text) return;

    await queuedTyping(persona, text);

    appendSafe(persona, text, {
      timestamp: new Date(),
      type: "incoming",
      replyToText: parentText
    });
  });

  /* =====================================================
     START REALISM ENGINE (SAFE)
  ===================================================== */
  if (window.realism?.simulate) {
    setTimeout(() => {
      window.realism.simulate();
    }, 800);
  }

  console.log("✅ app.js FINAL — header-only typing authoritative, no ghost typing, fully synced.");

});
