// app.js — FINAL Telegram 2026 Pro Glass + Clean Caption + Joiner Integration
document.addEventListener("DOMContentLoaded", () => {

  const pinBanner = document.getElementById("tg-pin-banner");
  const container = document.getElementById("tg-comments-container");
  const input = document.getElementById("tg-comment-input");

  if(!container){
    console.error("tg-comments-container missing in DOM");
    return;
  }

  /* =====================================================
     SAFE APPEND WRAPPER
  ===================================================== */
  function appendSafe(persona, text, opts = {}){
    if(window.TGRenderer?.appendMessage){
      return window.TGRenderer.appendMessage(persona, text, opts);
    }
    console.error("TGRenderer not ready — cannot append message");
    return null;
  }

  /* =====================================================
     ADMIN BROADCAST
  ===================================================== */
  function postAdminBroadcast(){
    const admin = window.identity?.Admin || {
      name:"Admin",
      avatar:"assets/admin.jpg",
      isAdmin:true
    };

    const caption =
`📌 Group Rules

1️⃣ New members are read-only until verified.
2️⃣ Admins do NOT DM directly.
3️⃣ 🚫 No screenshots in chat.
4️⃣ ⚠️ Ignore unsolicited messages.

✅ To verify or contact admin, use the Contact Admin button below.`;

    const image = "assets/broadcast.jpg";
    const timestamp = new Date();

    const id = appendSafe(admin, "", {
      timestamp,
      type:"incoming",
      image,
      caption
    });

    return { id, caption, image };
  }

  /* =====================================================
     PIN BANNER
  ===================================================== */
  function showPinBanner(image, caption, pinnedMessageId){
    if(!pinBanner) return;

    pinBanner.innerHTML = "";

    const img = document.createElement("img");
    img.src = image;
    img.onerror = ()=> img.src = "assets/admin.jpg";

    const text = document.createElement("div");
    text.className = "pin-text";
    text.textContent = (caption || "Pinned message").split("\n")[0];

    /* Blue View Pinned */
    const blueBtn = document.createElement("button");
    blueBtn.className = "pin-btn";
    blueBtn.textContent = "View Pinned";
    blueBtn.onclick = (e)=>{
      e.stopPropagation();
      const el = pinnedMessageId
        ? document.querySelector(`[data-id="${pinnedMessageId}"]`)
        : null;

      if(el){
        el.scrollIntoView({behavior:"smooth", block:"center"});
        el.classList.add("tg-highlight");
        setTimeout(()=> el.classList.remove("tg-highlight"), 2600);
      }
    };

    /* Contact Admin Button */
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
    requestAnimationFrame(()=>{
      pinBanner.classList.add("show");
    });
  }

  function postPinNotice(){
    const system = { name:"System", avatar:"assets/admin.jpg" };
    appendSafe(system, "Admin pinned a message", {
      timestamp:new Date(),
      type:"incoming"
    });
  }

  /* =====================================================
     INITIAL PIN FLOW
  ===================================================== */
  const broadcast = postAdminBroadcast();

  setTimeout(()=>{
    postPinNotice();
    showPinBanner(broadcast.image, broadcast.caption, broadcast.id);
  }, 1200);

  /* =====================================================
     ADMIN AUTO RESPONSE
  ===================================================== */
  document.addEventListener("sendMessage", (ev)=>{
    const text = ev.detail?.text?.toLowerCase() || "";

    if(text.includes("admin") || text.includes("contact")){
      const admin = window.identity?.Admin || {
        name:"Admin",
        avatar:"assets/admin.jpg"
      };

      window.TGRenderer?.showTyping(admin);

      setTimeout(()=>{
        appendSafe(admin,
          "Please use the Contact Admin button in the pinned banner above.",
          { timestamp:new Date(), type:"incoming" }
        );
      }, 1600);
    }
  });

  /* =====================================================
     AUTO REPLY HANDLER
  ===================================================== */
  document.addEventListener("autoReply", (ev)=>{
    const { parentText, persona, text } = ev.detail;

    window.TGRenderer?.showTyping(persona);

    setTimeout(()=>{
      appendSafe(persona, text, {
        timestamp:new Date(),
        type:"incoming",
        replyToText: parentText
      });
    }, 1400);
  });

  /* =====================================================
     DARK INPUT BAR + Send/Camera Toggle Fix
  ===================================================== */
  if(input){
    input.style.background = "#1a242f";
    input.style.color = "#e6eef8";
    input.style.border = "none";
    input.style.borderRadius = "24px";
    input.style.padding = "0 14px";
    input.style.caretColor = "#2ea6ff";
  }

  /* =====================================================
     START REALISM ENGINE / JOINER SIMULATOR
  ===================================================== */
  if(window.realism?.simulateRandomCrowdV11){
    setTimeout(()=> window.realism.simulateRandomCrowdV11(), 600);
  }

  if(window.joiner){
    setTimeout(()=> window.joiner.start(), 1200);
  }

});
