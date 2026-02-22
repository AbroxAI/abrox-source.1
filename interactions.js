// interactions.js (camera/send toggle hardened)

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("tg-comment-input");
  const sendBtn = document.getElementById("tg-send-btn");
  const cameraBtn = document.getElementById("tg-camera-btn");
  const metaLine = document.getElementById("tg-meta-line");
  const contactAdminLink = window.CONTACT_ADMIN_LINK || "https://t.me/ph_suppp";

  window.__abrox_seen_map = window.__abrox_seen_map || {};

  if (metaLine) {
    metaLine.textContent =
      `${(window.MEMBER_COUNT || 1284).toLocaleString()} members, ` +
      `${(window.ONLINE_COUNT || 128).toLocaleString()} online`;
  }

  function updateToggle() {
    if (!input) return;
    const hasText = input.value.trim().length > 0;

    if (sendBtn) sendBtn.classList.toggle("hidden", !hasText);
    if (cameraBtn) cameraBtn.classList.toggle("hidden", hasText);
  }

  if (input) {
    input.addEventListener("input", updateToggle);
    input.addEventListener("keyup", updateToggle);
    input.addEventListener("change", updateToggle);
  }

  updateToggle();

  function doSendMessage(replyToId = null) {
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const persona = { name: "You", avatar: null };

    if (window.TGRenderer?.showTyping) {
      window.TGRenderer.showTyping(persona, 400);
    }

    setTimeout(() => {
      let messageId = null;

      if (window.TGRenderer?.appendMessage) {
        messageId = window.TGRenderer.appendMessage(persona, text, {
          timestamp: new Date(),
          type: "outgoing",
          replyToId,
        });
      } else if (window.BubbleRenderer?.renderMessages) {
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
        window.__abrox_seen_map[messageId] = 1;
      }

      document.dispatchEvent(
        new CustomEvent("sendMessage", {
          detail: { text, replyToId },
        })
      );
    }, 500 + Math.random() * 300);

    input.value = "";
    updateToggle();
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

  document.addEventListener("click", (e) => {
    const btn = e.target.closest && e.target.closest(".contact-admin-btn");
    if (!btn) return;
    window.open(btn.dataset?.href || contactAdminLink, "_blank");
    e.preventDefault();
  });

  document.addEventListener("messageContext", (ev) => {
    const info = ev.detail;

    const persona = window.identity
      ? window.identity.getRandomPersona()
      : { name: "User", avatar: "https://ui-avatars.com/api/?name=U" };

    setTimeout(() => {
      const replyText = window.identity
        ? window.identity.generateHumanComment(persona, info.text)
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
