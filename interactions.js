// interactions.js (wired for telegram-patch bubble renderer)

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("tg-comment-input");
  const sendBtn = document.getElementById("tg-send-btn");
  const metaLine = document.getElementById("tg-meta-line");

  const contactAdminLink =
    window.CONTACT_ADMIN_LINK || "https://t.me/ph_suppp";

  // Global seen counter map
  window.__abrox_seen_map = window.__abrox_seen_map || {};

  // Header meta info
  if (metaLine) {
    metaLine.textContent =
      `${(window.MEMBER_COUNT || 1284).toLocaleString()} members, ` +
      `${(window.ONLINE_COUNT || 128).toLocaleString()} online`;
  }

  function toggleSendButton() {
    if (!input || !sendBtn) return;
    const hasText = input.value.trim().length > 0;
    sendBtn.classList.toggle("hidden", !hasText);
  }

  if (input) input.addEventListener("input", toggleSendButton);
  toggleSendButton();

  // ===============================
  // SEEN SYSTEM
  // ===============================

  function updateSeenUI(messageId, count) {
    const bubble = document.querySelector(
      `.tg-bubble[data-id="${messageId}"]`
    );
    if (!bubble) return;

    const seenEl = bubble.querySelector(".seen");
    if (!seenEl) return;

    seenEl.innerHTML = `<i data-lucide="eye"></i> ${count}`;

    if (window.lucide?.createIcons) {
      try {
        window.lucide.createIcons();
      } catch (e) {}
    }
  }

  function simulateViews(messageId) {
    let count = 1;
    window.__abrox_seen_map[messageId] = count;
    updateSeenUI(messageId, count);

    const interval = setInterval(() => {
      count += Math.floor(Math.random() * 3) + 1;
      window.__abrox_seen_map[messageId] = count;
      updateSeenUI(messageId, count);

      if (count > 40 + Math.floor(Math.random() * 30)) {
        clearInterval(interval);
      }
    }, 2500 + Math.random() * 2000);
  }

  // ===============================
  // SEND MESSAGE
  // ===============================

  function doSendMessage(replyToId = null) {
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    const persona = {
      name: "You",
      avatar: null,
    };

    if (window.TGRenderer?.showTyping) {
      window.TGRenderer.showTyping(persona, 400);
    }

    setTimeout(() => {
      let messageId = null;

      if (window.TGRenderer?.appendMessage) {
        messageId = window.TGRenderer.appendMessage(persona, text, {
          timestamp: new Date(),
          type: "outgoing",
          replyToId: replyToId,
        });
      } else if (
        window.BubbleRenderer &&
        typeof window.BubbleRenderer.renderMessages === "function"
      ) {
        const id = "m_local_" + Date.now();
        window.BubbleRenderer.renderMessages([
          {
            id,
            name: "You",
            text,
            time: new Date().toLocaleTimeString(),
            isOwn: true,
            replyToId,
          },
        ]);
        messageId = id;
      }

      if (messageId) {
        simulateViews(messageId);
      }

      document.dispatchEvent(
        new CustomEvent("sendMessage", {
          detail: { text, replyToId },
        })
      );
    }, 500 + Math.random() * 300);

    input.value = "";
    toggleSendButton();
  }

  if (sendBtn) {
    sendBtn.addEventListener("click", () => doSendMessage());
  }

  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        doSendMessage();
      }
    });
  }

  // ===============================
  // CONTACT ADMIN BUTTON
  // ===============================

  document.addEventListener("click", (e) => {
    const btn =
      e.target.closest && e.target.closest(".contact-admin-btn");

    if (!btn) return;

    const href =
      btn.dataset?.href || contactAdminLink;

    window.open(href, "_blank");
    e.preventDefault();
  });

  // ===============================
  // AUTO REPLY SYSTEM
  // ===============================

  document.addEventListener("messageContext", (ev) => {
    const info = ev.detail;

    const persona = window.identity
      ? window.identity.getRandomPersona()
      : {
          name: "User",
          avatar:
            "https://ui-avatars.com/api/?name=U",
        };

    setTimeout(() => {
      const replyText = window.identity
        ? window.identity.generateHumanComment(
            persona,
            info.text
          )
        : "Nice point!";

      document.dispatchEvent(
        new CustomEvent("autoReply", {
          detail: {
            parentText: info.text,
            persona,
            text: replyText,
          },
        })
      );
    }, 700 + Math.random() * 1200);
  });
});
