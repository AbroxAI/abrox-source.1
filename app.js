// app.js — Telegram 2026 FINAL (true per-persona typing sync)

document.addEventListener("DOMContentLoaded", () => {

  const container = document.getElementById("tg-comments-container");
  const headerMeta = document.getElementById("tg-meta-line");
  const pinBanner = document.getElementById("tg-pin-banner");

  if (!container) {
    console.error("tg-comments-container missing");
    return;
  }

  /* ===============================
     HEADER TYPING STATE (REAL SYNC)
  =============================== */

  const headerTyping = new Set(); // active persona names typing

  function updateHeader() {
    if (!headerMeta) return;

    if (headerTyping.size === 0) {
      headerMeta.textContent =
        `${window.MEMBER_COUNT?.toLocaleString?.() || "0"} members, ` +
        `${window.ONLINE_COUNT?.toLocaleString?.() || "0"} online`;
      return;
    }

    const names = Array.from(headerTyping);

    if (names.length === 1) {
      headerMeta.textContent = `${names[0]} is typing…`;
    } else if (names.length === 2) {
      headerMeta.textContent = `${names[0]} & ${names[1]} are typing…`;
    } else {
      headerMeta.textContent =
        `${names.slice(0, 2).join(" & ")} and others are typing…`;
    }
  }

  function startHeaderTyping(name) {
    headerTyping.add(name);
    updateHeader();
  }

  function stopHeaderTyping(name) {
    headerTyping.delete(name);
    updateHeader();
  }

  /* ===============================
     SAFE MESSAGE APPEND
  =============================== */

  function appendSafe(persona, text, opts = {}) {
    if (!window.TGRenderer?.appendMessage) return;

    window.TGRenderer.appendMessage(persona, text, opts);

    stopHeaderTyping(persona.name);
  }

  /* ===============================
     TRUE PER-PERSONA TYPING FLOW
  =============================== */

  async function sendWithTyping(persona, message, opts = {}) {
    if (!persona?.name) return;

    startHeaderTyping(persona.name);

    // Wait for typing bubble to complete
    await window.TGRenderer.showTyping(persona, message);

    // Typing bubble finished → now append message
    appendSafe(persona, message, {
      timestamp: new Date(),
      type: "incoming",
      ...opts
    });
  }

  /* ===============================
     ADMIN AUTO RESPONSE
  =============================== */

  document.addEventListener("sendMessage", async (ev) => {
    const text = ev.detail?.text || "";

    const admin = window.identity?.Admin || {
      name: "Admin",
      avatar: "assets/admin.jpg",
      isAdmin: true
    };

    await sendWithTyping(
      admin,
      "Please use the Contact Admin button in the pinned banner above."
    );
  });

  /* ===============================
     AUTO REPLY HANDLER
  =============================== */

  document.addEventListener("autoReply", async (ev) => {
    const { persona, text, parentText } = ev.detail || {};
    if (!persona || !text) return;

    await sendWithTyping(persona, text, {
      replyToText: parentText
    });
  });

  /* ===============================
     PIN SYSTEM
  =============================== */

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

    const id = window.TGRenderer.appendMessage(admin, caption, {
      timestamp: new Date(2025, 2, 14, 10, 0, 0),
      type: "incoming"
    });

    return id;
  }

  function postPinNotice() {
    const system = { name: "System", avatar: "assets/admin.jpg" };

    window.TGRenderer.appendMessage(
      system,
      "Admin pinned a message",
      { timestamp: new Date(), type: "incoming" }
    );
  }

  const pinnedId = postAdminBroadcast();

  setTimeout(() => {
    postPinNotice();
  }, 1200);

  /* ===============================
     START REALISM ENGINE
  =============================== */

  if (window.realism?.simulateRandomCrowdV11) {
    setTimeout(() => {
      window.realism.simulateRandomCrowdV11();
    }, 800);
  }

  console.log("✅ app.js FINAL — typing fully synchronized, multi-safe, ghost-proof");
});
