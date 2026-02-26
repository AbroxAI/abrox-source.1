// app.js — FINAL Telegram 2026 integrated with Pro Glass, joiner & realism engine
document.addEventListener("DOMContentLoaded", () => {

  const pinBanner = document.getElementById("tg-pin-banner");
  const container = document.getElementById("tg-comments-container");
  const input = document.getElementById("tg-comment-input");
  const sendBtn = document.getElementById("tg-send-btn");
  const cameraBtn = document.getElementById("tg-camera-btn");
  const metaLine = document.getElementById("tg-meta-line");

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
     INITIAL META LINE
  ===================================================== */
  if(metaLine){
    metaLine.textContent =
      `${(window.MEMBER_COUNT || 1284).toLocaleString()} members, ` +
      `${(window.ONLINE_COUNT || 128).toLocaleString()} online`;
  }

  /* =====================================================
     SEND / CAMERA TOGGLE
  ===================================================== */
  function updateToggle() {
    if(!input) return;
    const hasText = input.value.trim().length>0;
    if(sendBtn) sendBtn.classList.toggle("hidden", !hasText);
    if(cameraBtn) cameraBtn.classList.toggle("hidden", hasText);
  }

  if(input){
    input.addEventListener("input", updateToggle);
    input.addEventListener("keyup", updateToggle);
    input.addEventListener("change", updateToggle);
    input.addEventListener("keydown", (e)=>{
      if(e.key==="Enter"){
        e.preventDefault();
        doSendMessage();
      }
    });
  }
  updateToggle();

  function doSendMessage(replyToId=null){
    if(!input) return;
    const text=input.value.trim();
    if(!text) return;
    const persona={name:"You", avatar:null};

    if(window.TGRenderer?.showTyping){
      window.TGRenderer.showTyping(persona);
    }

    setTimeout(()=>{
      const messageId = appendSafe(persona, text, {
        timestamp:new Date(),
        type:"outgoing",
        replyToId
      });

      if(messageId) window.__abrox_seen_map[messageId] = 1;

      document.dispatchEvent(new CustomEvent("sendMessage",{detail:{text, replyToId}}));
    },500+Math.random()*300);

    input.value="";
    updateToggle();
  }

  if(sendBtn){
    sendBtn.addEventListener("click", ()=>doSendMessage());
  }

  /* =====================================================
     ADMIN BROADCAST WITH CLEAN CAPTION
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

  const broadcast = postAdminBroadcast();

  /* =====================================================
     PIN BANNER
  ===================================================== */
  function showPinBanner(image, caption, pinnedMessageId){
    if(!pinBanner) return;

    pinBanner.innerHTML="";

    const img=document.createElement("img");
    img.src=image;
    img.onerror=()=> img.src="assets/admin.jpg";

    const text=document.createElement("div");
    text.className="pin-text";
    text.textContent=(caption||"Pinned message").split("\n")[0];

    const blueBtn=document.createElement("button");
    blueBtn.className="pin-btn";
    blueBtn.textContent="View Pinned";
    blueBtn.onclick=(e)=>{
      e.stopPropagation();
      const el=pinnedMessageId?document.querySelector(`[data-id="${pinnedMessageId}"]`):null;
      if(el){
        el.scrollIntoView({behavior:"smooth", block:"center"});
        el.classList.add("tg-highlight");
        setTimeout(()=>el.classList.remove("tg-highlight"),2600);
      }
    };

    const adminBtn=document.createElement("a");
    adminBtn.className="glass-btn";
    adminBtn.href=window.CONTACT_ADMIN_LINK || "https://t.me/ph_suppp";
    adminBtn.target="_blank";
    adminBtn.rel="noopener";
    adminBtn.textContent="Contact Admin";

    const btnContainer=document.createElement("div");
    btnContainer.className="pin-btn-container";
    btnContainer.appendChild(blueBtn);
    btnContainer.appendChild(adminBtn);

    pinBanner.appendChild(img);
    pinBanner.appendChild(text);
    pinBanner.appendChild(btnContainer);

    pinBanner.classList.remove("hidden");
    requestAnimationFrame(()=>pinBanner.classList.add("show"));
  }

  setTimeout(()=>{
    showPinBanner(broadcast.image, broadcast.caption, broadcast.id);
  },1200);

  /* =====================================================
     ADMIN AUTO RESPONSE
  ===================================================== */
  document.addEventListener("sendMessage",(ev)=>{
    const text=ev.detail?.text?.toLowerCase()||"";
    if(text.includes("admin")||text.includes("contact")){
      const admin=window.identity?.Admin||{name:"Admin", avatar:"assets/admin.jpg"};
      window.TGRenderer?.showTyping(admin);
      setTimeout(()=>{
        appendSafe(admin,"Please use the Contact Admin button in the pinned banner above.",{timestamp:new Date(), type:"incoming"});
      },1600);
    }
  });

  /* =====================================================
     AUTO REPLY HANDLER
  ===================================================== */
  document.addEventListener("autoReply",(ev)=>{
    const { parentText, persona, text } = ev.detail;
    window.TGRenderer?.showTyping(persona);
    setTimeout(()=>{
      appendSafe(persona, text, {
        timestamp:new Date(),
        type:"incoming",
        replyToText: parentText
      });
    },1400);
  });

  /* =====================================================
     JOINER INTEGRATION
  ===================================================== */
  if(window.joiner){
    window.joiner.start();
    document.addEventListener("joiner:new",(ev)=>{
      const persona = ev.detail;
      const text = window.WELCOME_TEXT_POOL
        ? window.WELCOME_TEXT_POOL[Math.floor(Math.random()*window.WELCOME_TEXT_POOL.length)]
        : "Hi!";
      appendSafe(persona,text,{type:"incoming"});
    });
  }

  /* =====================================================
     REALISM ENGINE
  ===================================================== */
  if(window.realism?.simulateRandomCrowdV11){
    setTimeout(()=>{
      window.realism.simulateRandomCrowdV11();
    },600);
  }

});
