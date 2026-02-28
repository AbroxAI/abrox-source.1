// app.js — Telegram 2026 FINAL (Old Pin Banner Layout + All Fixes Synced)

document.addEventListener("DOMContentLoaded", () => {

  const pinBanner = document.getElementById("tg-pin-banner");
  const container = document.getElementById("tg-comments-container");
  const headerMeta = document.getElementById("tg-meta-line");

  if (!container) {
    console.error("tg-comments-container missing in DOM");
    return;
  }

  /* =====================================================
     TELEGRAM STYLE PULSE HIGHLIGHT
  ===================================================== */
  const style = document.createElement("style");
  style.textContent = `
    .tg-highlight {
      background-color: rgba(255, 229, 100, 0.35);
      border-radius: 14px;
      animation: tgFadePulse 2.4s cubic-bezier(.4,0,.2,1) forwards;
    }

    @keyframes tgFadePulse {
      0% { opacity:1; }
      100% { opacity:0; }
    }
  `;
  document.head.appendChild(style);

  /* =====================================================
     SAFE APPEND WRAPPER
  ===================================================== */
  function appendSafe(persona, text, opts = {}) {
    if (!window.TGRenderer?.appendMessage) return null;

    const id = window.TGRenderer.appendMessage(persona, text, opts);

    document.dispatchEvent(
      new CustomEvent("messageAppended", { detail: { persona, id } })
    );

    if (opts.replyToText) attachReplyJump(id, opts.replyToText);

    return id;
  }

  /* =====================================================
     FIXED HEADER TYPING MANAGER (NO MORE STUCK)
  ===================================================== */
  const typingPersons = new Set();

  function updateHeaderMeta() {
    if (!headerMeta) return;

    if (typingPersons.size === 0) {
      const members = window.MEMBER_COUNT || 0;
      const online = window.ONLINE_COUNT || 0;
      headerMeta.textContent =
        `${members.toLocaleString()} members, ${online.toLocaleString()} online`;
    } else if (typingPersons.size === 1) {
      const [name] = typingPersons;
      headerMeta.textContent = `${name} is typing…`;
    } else {
      const names = Array.from(typingPersons).slice(0, 2).join(" & ");
      headerMeta.textContent = `${names} are typing…`;
    }
  }

  document.addEventListener("headerTyping", (ev) => {
    const name = ev.detail?.name;
    if (!name) return;
    typingPersons.add(name);
    updateHeaderMeta();
  });

  document.addEventListener("messageAppended", (ev) => {
    const persona = ev.detail?.persona;
    if (!persona?.name) return;

    if (typingPersons.has(persona.name)) {
      typingPersons.delete(persona.name);
      updateHeaderMeta();
    }
  });

  /* =====================================================
     TYPING DELAY
  ===================================================== */
  function getTypingDelay(text) {
    if (!text) return 800;
    return Math.max(600, text.length * 35 + Math.random() * 300);
  }

  /* =====================================================
     JUMP + PULSE
  ===================================================== */
  function jumpToMessage(el) {
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("tg-highlight");
    setTimeout(() => el.classList.remove("tg-highlight"), 2400);
  }

  function attachReplyJump(newMessageId, replyText) {
    const newMsgEl = document.querySelector(`[data-id="${newMessageId}"]`);
    if (!newMsgEl) return;

    const replyPreview = newMsgEl.querySelector(".tg-reply-preview");
    if (!replyPreview) return;

    replyPreview.style.cursor = "pointer";

    replyPreview.addEventListener("click", () => {
      let target = null;

      if (window.TGRenderer?.MESSAGE_MAP) {
        for (const [id, msg] of window.TGRenderer.MESSAGE_MAP.entries()) {
          if (id !== newMessageId && msg.text === replyText) {
            target = msg.el;
            break;
          }
        }
      }

      if (!target) {
        const all = Array.from(document.querySelectorAll(".tg-bubble"));
        target = all.find(b =>
          b.dataset.id !== newMessageId &&
          b.querySelector(".tg-bubble-text")?.textContent.includes(replyText)
        );
      }

      if (target) jumpToMessage(target);
    });
  }

  /* =====================================================
     ADMIN BROADCAST
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
      caption,
      pinned: true
    });

    return { id, caption, image };
  }

  /* =====================================================
     OLD CLEAN PIN BANNER (SINGLE LINE PREVIEW)
  ===================================================== */
  function showPinBanner(image, caption, pinnedMessageId) {
    if (!pinBanner) return;

    pinBanner.innerHTML = "";

    const img = document.createElement("img");
    img.src = image;
    img.onerror = () => img.src = "assets/admin.jpg";

    // Only first non-empty line (Telegram behavior)
    const firstLine = caption
      ? caption.split("\n").find(line => line.trim() !== "")
      : "Pinned message";

    const text = document.createElement("div");
    text.className = "pin-text";
    text.textContent = firstLine;

    const viewBtn = document.createElement("button");
    viewBtn.className = "pin-btn";
    viewBtn.textContent = "View";

    viewBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const el = document.querySelector(`[data-id="${pinnedMessageId}"]`);
      if (el) jumpToMessage(el);
    });

    pinBanner.appendChild(img);
    pinBanner.appendChild(text);
    pinBanner.appendChild(viewBtn);

    pinBanner.classList.remove("hidden");
    requestAnimationFrame(() => pinBanner.classList.add("show"));
  }

  function postPinNotice() {
    const system = { name: "System", avatar: "assets/admin.jpg" };
    appendSafe(system, "Admin pinned a message", {
      timestamp: new Date(),
      type: "incoming"
    });
  }

  /* =====================================================
     INIT
  ===================================================== */
  const broadcast = postAdminBroadcast();

  setTimeout(() => {
    postPinNotice();
    showPinBanner(broadcast.image, broadcast.caption, broadcast.id);
  }, 1200);

  /* =====================================================
     ADMIN AUTO RESPONSE
  ===================================================== */
  document.addEventListener("sendMessage", (ev) => {
    const text = ev.detail?.text || "";
    const admin = window.identity?.Admin || {
      name: "Admin",
      avatar: "assets/admin.jpg"
    };

    document.dispatchEvent(
      new CustomEvent("headerTyping", { detail: { name: admin.name } })
    );

    setTimeout(() => {
      appendSafe(admin,
        "Please use the Contact Admin button in the pinned banner above.",
        { timestamp: new Date(), type: "incoming" }
      );
    }, getTypingDelay(text));
  });

  /* =====================================================
     AUTO REPLY
  ===================================================== */
  document.addEventListener("autoReply", (ev) => {
    const { parentText, persona, text } = ev.detail || {};
    if (!persona || !text) return;

    document.dispatchEvent(
      new CustomEvent("headerTyping", { detail: { name: persona.name } })
    );

    setTimeout(() => {
      appendSafe(persona, text, {
        timestamp: new Date(),
        type: "incoming",
        replyToText: parentText
      });
    }, getTypingDelay(text));
  });

  /* =====================================================
     REALISM ENGINE
  ===================================================== */
  if (window.realism?.simulateRandomCrowdV11) {
    setTimeout(() => window.realism.simulateRandomCrowdV11(), 800);
  }

  updateHeaderMeta();

  console.log("✅ app.js FINAL — Old pin banner restored + typing fixed + pulse synced");

});
