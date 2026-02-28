// app.js — FINAL Telegram 2026 (Pinned + Realism + Joiner Safe + Ultra-Real Typing + Variable Durations)

document.addEventListener("DOMContentLoaded", () => {

  const pinBanner = document.getElementById("tg-pin-banner");
  const container = document.getElementById("tg-comments-container");
  const headerMeta = document.getElementById("tg-meta-line");

  if (!container) {
    console.error("tg-comments-container missing in DOM");
    return;
  }

  /* =====================================================
     SAFE APPEND WRAPPER
  ===================================================== */
  function appendSafe(persona, text, opts = {}) {
    if (window.TGRenderer?.appendMessage) {
      const id = window.TGRenderer.appendMessage(persona, text, opts);
      // Notify typing manager
      document.dispatchEvent(new CustomEvent("messageAppended", { detail: { persona } }));
      return id;
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
  ===================================================== */
  function getTypingDelay(text) {
    if (!text) return 800;
    const speed = 40; // ms per character
    const base = 600; // minimum delay
    return Math.max(base, text.length * speed + Math.random() * 400);
  }

  /* =====================================================
     ADMIN BROADCAST (Image + Caption + Glass Button)
  ===================================================== */
  function postAdminBroadcast() {
    const admin = window.identity?.Admin || {
      name: "Admin",
      avatar: "assets/admin.jpg",
      isAdmin: true
    };

    const caption =
`📌 Group Rules

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

    return { id, caption, image };
  }

  /* =====================================================
     PIN BANNER
  ===================================================== */
  function showPinBanner(image, caption, pinnedMessageId) {
    if (!pinBanner) return;

    pinBanner.innerHTML = "";

    const img = document.createElement("img");
    img.src = image;
    img.onerror = () => img.src = "assets/admin.jpg";

    const text = document.createElement("div");
    text.className = "pin-text";
    text.textContent = (caption || "Pinned message").split("\n")[0];

    const blueBtn = document.createElement("button");
    blueBtn.className = "pin-btn";
    blueBtn.textContent = "View Pinned";

    blueBtn.onclick = (e) => {
      e.stopPropagation();

      const el = pinnedMessageId
        ? document.querySelector(`[data-id="${pinnedMessageId}"]`)
        : null;

      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("tg-highlight");
        setTimeout(() => el.classList.remove("tg-highlight"), 2600);
      }
    };

    const adminBtn = document.createElement("a");
    adminBtn.className = "glass-btn";
    adminBtn.href = window.CONTACT_ADMIN_LINK || "https://t.me/ph_suppp";
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
    requestAnimationFrame(() => {
      pinBanner.classList.add("show");
    });
  }

  function postPinNotice() {
    const system = { name: "System", avatar: "assets/admin.jpg" };
    appendSafe(system, "Admin pinned a message", {
      timestamp: new Date(),
      type: "incoming"
    });
  }

  /* =====================================================
     INITIAL PIN FLOW
  ===================================================== */
  const broadcast = postAdminBroadcast();

  setTimeout(() => {
    postPinNotice();
    showPinBanner(broadcast.image, broadcast.caption, broadcast.id);
  }, 1200);

  /* =====================================================
     ADMIN AUTO RESPONSE (uses sendMessage event)
  ===================================================== */
  document.addEventListener("sendMessage", (ev) => {
    const text = ev.detail?.text || "";
    const admin = window.identity?.Admin || {
      name: "Admin",
      avatar: "assets/admin.jpg"
    };

    // Trigger ultra-real typing
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
     AUTO REPLY HANDLER (Realism Reply Mode)
  ===================================================== */
  document.addEventListener("autoReply", (ev) => {
    const { parentText, persona, text } = ev.detail || {};
    if (!persona || !text) return;

    // Trigger ultra-real typing
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
    setTimeout(() => {
      window.realism.simulateRandomCrowdV11();
    }, 800);
  }

  /* =====================================================
     SAFE INPUT BAR FIX (No White Box)
  ===================================================== */
  const inputBar = document.querySelector(".tg-input-bar");

  if (inputBar) {
    inputBar.style.background = "rgba(23,33,43,0.78)";
    inputBar.style.backdropFilter = "blur(24px)";
    inputBar.style.webkitBackdropFilter = "blur(24px)";
    inputBar.style.borderRadius = "26px";
  }

  console.log("app.js fully synced with renderer + interactions + realism + ultra-real typing with variable durations");

});
