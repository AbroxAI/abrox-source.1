// bubble-renderer.js — Telegram 2026 bubble renderer fully integrated
window.TGRenderer = (function () {
  const container = document.getElementById("tg-comments-container");

  function createBubbleElement(persona, text, opts = {}) {
    const bubble = document.createElement("div");
    bubble.className = "tg-bubble " + (opts.type === "outgoing" ? "outgoing" : "incoming");

    // Avatar
    const avatar = document.createElement("img");
    avatar.className = "tg-bubble-avatar";
    avatar.src = persona.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(persona.name || "U")}`;
    avatar.alt = persona.name || "user";
    avatar.onerror = () => {
      avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(persona.name || "U")}`;
    };
    bubble.appendChild(avatar);

    // Bubble content
    const content = document.createElement("div");
    content.className = "tg-bubble-content";

    // Sender name (incoming only)
    if (opts.type !== "outgoing" && persona.name) {
      const sender = document.createElement("div");
      sender.className = "tg-bubble-sender";
      sender.textContent = persona.name;
      content.appendChild(sender);
    }

    // Text
    const textEl = document.createElement("div");
    textEl.className = "tg-bubble-text";
    textEl.textContent = text;
    content.appendChild(textEl);

    // Optional reply
    if (opts.replyToText) {
      const reply = document.createElement("div");
      reply.className = "tg-reply-preview";
      reply.textContent = opts.replyToText;
      reply.onclick = () => {
        bubble.scrollIntoView({ behavior: "smooth", block: "center" });
      };
      content.insertBefore(reply, textEl);
    }

    // Optional image / caption (admin broadcast)
    if (opts.image) {
      const img = document.createElement("img");
      img.src = opts.image;
      img.alt = "image";
      img.style.maxWidth = "100%";
      img.style.borderRadius = "12px";
      content.appendChild(img);

      if (opts.caption) {
        const captionWrapper = document.createElement("div");
        captionWrapper.style.marginTop = "6px";
        captionWrapper.style.display = "flex";
        captionWrapper.style.gap = "8px";
        captionWrapper.style.alignItems = "center";

        const captionText = document.createElement("div");
        captionText.textContent = opts.caption.split("\n")[0];
        captionText.style.flex = "1";
        captionText.style.color = "var(--tg-text)";
        captionWrapper.appendChild(captionText);

        if (opts.adminBtn) {
          captionWrapper.appendChild(opts.adminBtn);
        }

        content.appendChild(captionWrapper);
      }
    }

    bubble.appendChild(content);
    container.appendChild(bubble);

    // Scroll to bottom
    setTimeout(() => {
      bubble.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 20);

    return bubble;
  }

  function appendMessage(persona, text, opts = {}) {
    const bubbleEl = createBubbleElement(persona, text, opts);
    return bubbleEl.dataset.id || `m_${Date.now()}`;
  }

  function showTyping(persona, duration = 1000) {
    const typingBubble = document.createElement("div");
    typingBubble.className = "tg-bubble incoming tg-typing";
    const avatar = document.createElement("img");
    avatar.className = "tg-bubble-avatar";
    avatar.src = persona.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(persona.name||"U")}`;
    typingBubble.appendChild(avatar);

    const content = document.createElement("div");
    content.className = "tg-bubble-content";
    const dots = document.createElement("div");
    dots.textContent = "…";
    content.appendChild(dots);
    typingBubble.appendChild(content);

    container.appendChild(typingBubble);
    setTimeout(() => {
      typingBubble.remove();
    }, duration);
  }

  return {
    appendMessage,
    showTyping,
  };
})();
