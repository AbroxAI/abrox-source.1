// app.js (fully aligned with realism-engine-v11)

document.addEventListener("DOMContentLoaded", () => {

  const pinBanner = document.getElementById("tg-pin-banner");
  const container = document.getElementById("tg-comments-container");

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

    const id = `msg_${Date.now()}`;
    const el = document.createElement("div");
    el.className = `tg-bubble ${opts.type === "outgoing" ? "outgoing" : "incoming"}`;
    el.dataset.id = id;

    el.innerHTML = `
      <img class="tg-bubble-avatar" src="${persona.avatar || "assets/admin.jpg"}">
      <div class="tg-bubble-content">
        <div class="tg-bubble-sender">${persona.name}</div>
        <div class="tg-bubble-text">${text}</div>
        <div class="tg-bubble-meta"></div>
      </div>
    `;

    container.appendChild(el);
    container.scrollTop = container.scrollHeight;

    return id;
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

    const caption = `📌 Group Rules

- New members are read-only until verified
- Admins do NOT DM directly
- No screenshots in chat
- Ignore unsolicited messages

✅ To verify or contact admin, use the “Contact Admin” button below.`;

    const image = "assets/broadcast.jpg";
    const timestamp = new Date(2025,2,14,10,0,0);

    const id = appendSafe(admin, "Broadcast", {
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

    const btn = document.createElement("button");
    btn.className = "contact-admin-btn";
    btn.dataset.href = window.CONTACT_ADMIN_LINK || "https://t.me/ph_suppp";
    btn.textContent = "Contact Admin";

    pinBanner.appendChild(img);
    pinBanner.appendChild(text);
    pinBanner.appendChild(btn);

    pinBanner.classList.remove("hidden");
    pinBanner.classList.add("show");

    pinBanner.onclick = ()=> {
      const el = pinnedMessageId
        ? document.querySelector(`[data-id="${pinnedMessageId}"]`)
        : null;

      if(el){
        el.scrollIntoView({behavior:"smooth", block:"center"});
        el.classList.add("tg-highlight");
        setTimeout(()=> el.classList.remove("tg-highlight"), 2600);
      }
    };
  }

  function postPinNotice(){
    const system = { name:"System", avatar:"assets/admin.jpg" };
    appendSafe(system, "Admin pinned a message", {
      timestamp: new Date(),
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

    const text = ev.detail.text.toLowerCase();

    if(text.includes("admin") || text.includes("contact")){

      const admin = window.identity?.Admin || {
        name:"Admin",
        avatar:"assets/admin.jpg"
      };

      window.TGRenderer?.showTyping(admin, 1200 + Math.random()*800);

      setTimeout(()=>{
        appendSafe(admin,
          "Thanks — please use the Contact Admin button in the pinned banner. We'll respond there.",
          { timestamp:new Date(), type:"incoming" }
        );
      }, 1800 + Math.random()*1200);
    }
  });

  /* =====================================================
     AUTO REPLY HANDLER
  ===================================================== */

  document.addEventListener("autoReply", (ev)=>{

    const { parentText, persona, text } = ev.detail;

    window.TGRenderer?.showTyping(persona, 1000 + Math.random()*1200);

    setTimeout(()=>{
      appendSafe(persona, text, {
        timestamp:new Date(),
        type:"incoming",
        replyToText: parentText
      });
    }, 1200 + Math.random()*800);
  });

  /* =====================================================
     START REALISM ENGINE (FIXED CALL)
  ===================================================== */

  if(window.realism){
    setTimeout(()=>{
      window.realism.simulate();
    }, 600);
  } else {
    console.warn("realism engine not available (window.realism).");
  }

});
