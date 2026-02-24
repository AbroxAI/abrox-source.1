// bubble-renderer.js — Fully validated Telegram-style bubbles

(function(){
  window.TGRenderer = window.TGRenderer || {};

  const container = document.getElementById("tg-comments-container");

  if(!container){
    console.error("tg-comments-container not found");
    return;
  }

  /* =====================================================
     APPEND SINGLE MESSAGE
  ===================================================== */
  window.TGRenderer.appendMessage = function(persona, text, opts={}){
    const type = opts.type === "outgoing" ? "outgoing" : "incoming";
    const id = `msg_${Date.now()}_${Math.floor(Math.random()*9999)}`;

    const bubble = document.createElement("div");
    bubble.className = `tg-bubble ${type}`;
    if(opts.groupedClass) bubble.classList.add(opts.groupedClass);
    bubble.dataset.id = id;

    // inner content
    const contentHTML = `
      <img class="tg-bubble-avatar" src="${persona.avatar || 'assets/admin.jpg'}">
      <div class="tg-bubble-content">
        <div class="tg-bubble-sender">${persona.name}</div>
        <div class="tg-bubble-text">${text || ""}</div>
        <div class="tg-bubble-meta">
          ${opts.timestamp ? `<span class="time">${opts.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>` : ""}
          <span class="seen"></span>
        </div>
        ${opts.replyToText ? `<div class="tg-reply-preview">${opts.replyToText}</div>` : ""}
        ${opts.image ? `<img src="${opts.image}" class="tg-bubble-image">` : ""}
      </div>
    `;
    bubble.innerHTML = contentHTML;

    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;

    return id;
  };

  /* =====================================================
     SHOW TYPING INDICATOR
  ===================================================== */
  window.TGRenderer.showTyping = function(persona, duration=1200){
    const typingBubble = document.createElement("div");
    typingBubble.className = "tg-bubble incoming typing";

    typingBubble.innerHTML = `
      <img class="tg-bubble-avatar" src="${persona.avatar || 'assets/admin.jpg'}">
      <div class="tg-bubble-content">
        <div class="tg-bubble-sender">${persona.name}</div>
        <div class="tg-bubble-text">Typing…</div>
      </div>
    `;

    container.appendChild(typingBubble);
    container.scrollTop = container.scrollHeight;

    setTimeout(()=> typingBubble.remove(), duration);
  };

  /* =====================================================
     GROUPING UTILITY
  ===================================================== */
  window.TGRenderer.groupMessages = function(){
    const bubbles = Array.from(container.querySelectorAll(".tg-bubble"));
    for(let i=0;i<bubbles.length;i++){
      const prev = bubbles[i-1];
      const curr = bubbles[i];

      // group if same sender
      if(prev && curr.querySelector(".tg-bubble-sender").textContent === prev.querySelector(".tg-bubble-sender").textContent){
        curr.classList.remove("tg-grouped-first","tg-grouped-middle","tg-grouped-last");
        if(i===1) prev.classList.add("tg-grouped-first");
        curr.classList.add("tg-grouped-middle");
      } else {
        curr.classList.remove("tg-grouped-middle","tg-grouped-last");
        curr.classList.add("tg-grouped-first");
      }
    }
    if(bubbles.length>1) bubbles[bubbles.length-1].classList.remove("tg-grouped-middle"), bubbles[bubbles.length-1].classList.add("tg-grouped-last");
  };

})();
