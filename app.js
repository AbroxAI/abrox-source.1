// app.js — fully aligned with fixed BubbleRenderer / TGRenderer
document.addEventListener("DOMContentLoaded", () => {

  const pinBanner = document.getElementById("tg-pin-banner");
  const container = document.getElementById("tg-comments-container");

  if(!container){
    console.error("tg-comments-container missing in DOM");
    return;
  }

  /* =====================================================
     SAFE APPEND WRAPPER — always uses TGRenderer
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

    const caption = `
📌 Group Rules

1️⃣ New members are read-only until verified.
2️⃣ Admins do NOT DM directly.
3️⃣ 🚫 No screenshots in chat.
4️⃣ ⚠️ Ignore unsolicited messages.

✅ To verify or contact admin, use the Contact Admin button below.
`;

    const image = "assets/broadcast.jpg";
    const timestamp = new Date(2025,2,14,10,0,0);

    const id = appendSafe(admin, "Broadcast", {
      timestamp,
      type:"incoming",
      image,
      caption,
      imageStyle: { maxWidth: "100%", height: "auto", objectFit: "cover" }
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
    img.style.width = "100%";
    img.style.height = "auto";
    img.style.objectFit = "cover";

    const text = document.createElement("div");
    text.className = "pin-text";
    text.textContent = (caption || "Pinned message").split("\n")[0];

    // Blue "View Pinned" button
    const blueBtn = document.createElement("button");
    blueBtn.className = "pin-btn";
    blueBtn.textContent = "View Pinned";

    // Glass animated inline "Contact Admin" button
    const adminBtn = document.createElement("a");
    adminBtn.className = "contact-admin-btn glass-btn"; // glass + animated
    adminBtn.href = window.CONTACT_ADMIN_LINK || "https://t.me/ph_suppp";
    adminBtn.target = "_blank";
    adminBtn.textContent = "Contact Admin";

    // Button container (inline)
    const btnContainer = document.createElement("div");
    btnContainer.className = "pin-btn-container";
    btnContainer.style.display = "flex";
    btnContainer.style.gap = "8px";
    btnContainer.appendChild(blueBtn);
    btnContainer.appendChild(adminBtn);

    pinBanner.appendChild(img);
    pinBanner.appendChild(text);
    pinBanner.appendChild(btnContainer);

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
     START REALISM ENGINE (FIXED)
  ===================================================== */
  if(window.realism?.simulateRandomCrowdV11){
    setTimeout(()=>{
      window.realism.simulateRandomCrowdV11();
    }, 600);
  } else {
    console.warn("realism engine not available (window.realism).");
  }

});
