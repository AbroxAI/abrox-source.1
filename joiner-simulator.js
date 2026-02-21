// joiner-simulator.js (patched)
// -------------------------------------------------
// Simulates joiners, builds Telegram-style join stickers,
// posts welcome messages, seeds history, and updates member counts.
// Robust: avoids admin.jpg fallbacks, reduces avatar/name duplication,
// non-blocking chunking, respects identity API when available.
// -------------------------------------------------

(function(){
  const LS_KEY = "abrox_joiner_state_v1_v2";
  const DEFAULTS = {
    minIntervalMs: 1000*60*60*6,
    maxIntervalMs: 1000*60*60*24,
    burstMin: 1,
    burstMax: 6,
    welcomeAsSystem: true,
    verifyMessageProbability: 0.18,
    stickerMaxAvatars: 8,
    stickerAvatarSize: 42,
    stickerOverlap: 12,
    initialBurstPreview: 6
  };

  const cfg = Object.assign({}, DEFAULTS, window.JOINER_CONFIG || {});
  let running = false;
  let _timer = null;
  const usedJoinNames = new Set();
  let preGenPool = [];

  // small helpers
  function randInt(min, max){ return Math.floor(Math.random() * (max - min + 1)) + min; }
  function safeMeta(){ return document.getElementById("tg-meta-line"); }
  function bumpMemberCount(n = 1){
    window.MEMBER_COUNT = Math.max(0, (window.MEMBER_COUNT || 0) + n);
    const m = safeMeta();
    if(m) m.textContent = `${(window.MEMBER_COUNT||0).toLocaleString()} members, ${(window.ONLINE_COUNT||0).toLocaleString()} online`;
  }

  // Use identity API for avatar generation/fallbacks (safe checks)
  function safeBuildAvatar(name, gender){
    try{
      if(window.identity && typeof window.identity.buildUniqueAvatar === "function"){
        return window.identity.buildUniqueAvatar(name, gender);
      }
      if(window.identity && typeof window.identity.buildUniqueAvatar === "undefined" && window.identity.buildUniqueAvatar !== undefined){
        // if older identity API uses different name
        return window.identity.buildUniqueAvatar(name, gender);
      }
    }catch(e){}
    // fallback deterministic ui-avatar (no admin.jpg fallback)
    try{
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name||"U")}&background=random&size=256`;
    }catch(e){
      return `https://ui-avatars.com/api/?name=U`;
    }
  }

  // Ensure joiner name uniqueness (local session-level)
  function uniqueNameCandidate(base){
    let candidate = base;
    let guard = 0;
    while(usedJoinNames.has(candidate) && guard < 12){
      candidate = `${base}_${Math.floor(Math.random()*9999)}`;
      guard++;
    }
    usedJoinNames.add(candidate);
    return candidate;
  }

  function createJoinerFromIdentity(){
    // Use identity persona where available and patch avatar if admin.jpg is used incorrectly
    if(window.identity && typeof window.identity.getRandomPersona === "function"){
      const pRaw = window.identity.getRandomPersona();
      // clone to avoid mutating identity pool
      const p = Object.assign({}, pRaw);
      // name uniqueness
      p.name = uniqueNameCandidate(String(p.name || ("User" + randInt(1000,9999))));
      // ensure avatar is not the generic admin fallback
      if(!p.avatar || (String(p.avatar).toLowerCase().includes("assets/admin.jpg") && !p.isAdmin)){
        p.avatar = safeBuildAvatar(p.name, p.gender);
      }
      p.lastSeen = Date.now();
      p.isAdmin = !!p.isAdmin;
      return p;
    }

    // fallback synthetic joiner
    const fName = uniqueNameCandidate("NewMember" + randInt(1000, 99999));
    const f = { name: fName, avatar: `https://i.pravatar.cc/100?img=${randInt(1,90)}`, isAdmin:false };
    // ensure pravatar doesn't equal admin.jpg (very unlikely) — if failure, use deterministic avatar
    if(String(f.avatar).toLowerCase().includes("assets/admin.jpg")) f.avatar = safeBuildAvatar(f.name);
    return f;
  }

  // pre-generate pool to avoid small-latency at join time
  function preGenerate(count){
    preGenPool = preGenPool || [];
    const toCreate = Math.max(0, Math.min(1000, count - preGenPool.length)); // safety cap
    for(let i=0;i<toCreate;i++) preGenPool.push(createJoinerFromIdentity());
    return preGenPool.length;
  }

  function nextJoiner(){
    if(preGenPool && preGenPool.length) return preGenPool.shift();
    return createJoinerFromIdentity();
  }

  function randomWelcomeText(persona){
    const variants = [
      "Hi everyone! 👋",
      "Hello! Glad to join.",
      "Hey — excited to learn and trade with you all.",
      "New here — say hi!",
      "Thanks for having me 😊",
      "Just joined, looking forward to the signals."
    ];
    let v = variants[Math.floor(Math.random()*variants.length)];
    if(persona && persona.sentiment === "bullish" && Math.random() < 0.4) v = "Ready to go long 🔥";
    return v;
  }

  // create a Telegram-like join sticker element (clustered avatars + names)
  function createJoinStickerElement(joiners){
    const container = document.createElement("div");
    container.className = "tg-join-sticker";

    const cluster = document.createElement("div");
    cluster.className = "join-cluster";

    const maxAv = Math.min(cfg.stickerMaxAvatars, joiners.length);
    const shown = joiners.slice(0, maxAv);

    shown.forEach((p, i) => {
      const a = document.createElement("img");
      // use persona avatar or safe fallback
      a.src = p.avatar || safeBuildAvatar(p.name, p.gender);
      a.alt = p.name || "user";
      a.className = "join-avatar";
      a.width = cfg.stickerAvatarSize;
      a.height = cfg.stickerAvatarSize;
      a.onerror = function(){
        // robust fallback: deterministic avatar from name
        try{
          this.onerror = null;
          this.src = safeBuildAvatar(p.name, p.gender);
        }catch(e){
          this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name||"U")}`;
        }
      };
      cluster.appendChild(a);
    });

    if(joiners.length > shown.length){
      const more = document.createElement("div");
      more.className = "join-more";
      more.textContent = `+${joiners.length - shown.length}`;
      more.style.width = cfg.stickerAvatarSize + "px";
      more.style.height = cfg.stickerAvatarSize + "px";
      cluster.appendChild(more);
    }

    container.appendChild(cluster);

    const names = document.createElement("div");
    names.className = "join-names";
    names.textContent = shown.map(p => p.name).join(", ") + (joiners.length > shown.length ? ` and ${joiners.length - shown.length} others` : "");
    container.appendChild(names);

    const sub = document.createElement("div");
    sub.className = "join-sub";
    sub.textContent = "joined the group";
    container.appendChild(sub);

    return container;
  }

  function appendStickerToChat(stickerEl, timestamp){
    const chat = document.getElementById("tg-comments-container");
    if(!chat){
      console.warn("joiner-simulator: chat container missing - can't append sticker");
      return null;
    }
    const wrapper = document.createElement("div");
    wrapper.className = "tg-join-wrapper";
    wrapper.style.display = "flex";
    wrapper.style.justifyContent = "center";
    wrapper.style.padding = "6px 0";
    if(timestamp) wrapper.dataset.joinTimestamp = new Date(timestamp).toISOString();
    wrapper.appendChild(stickerEl);

    // prefer TGRenderer if it provides a safe method to append a raw node (most don't) — append DOM directly
    chat.appendChild(wrapper);
    // scroll to latest (smooth if supported)
    try{ chat.scrollTo({ top: chat.scrollHeight, behavior: "smooth" }); }catch(e){ chat.scrollTop = chat.scrollHeight; }
    return wrapper;
  }

  function postWelcomeAsBubbles(joiner, opts){
    const persona = joiner;
    const text = randomWelcomeText(joiner);
    if(window.TGRenderer && typeof window.TGRenderer.showTyping === "function"){
      try{ window.TGRenderer.showTyping(persona, 700 + Math.random()*500); }catch(e){}
    }
    setTimeout(()=>{
      if(window.TGRenderer && typeof window.TGRenderer.appendMessage === "function"){
        try{ window.TGRenderer.appendMessage(persona, text, { timestamp: opts && opts.timestamp ? opts.timestamp : new Date(), type: "incoming" }); }catch(e){}
      } else {
        // fallback: create a simple DOM bubble so the visitor sees the welcome
        const chat = document.getElementById("tg-comments-container");
        if(chat){
          const el = document.createElement("div");
          el.className = "tg-bubble incoming";
          el.dataset.id = `join_manual_${Date.now().toString(36)}${Math.floor(Math.random()*9999)}`;
          el.innerHTML = `<div class="tg-bubble-avatar"><img src="${persona.avatar || safeBuildAvatar(persona.name)}" alt="${persona.name}"></div>
                          <div class="tg-bubble-body"><div class="tg-bubble-sender">${persona.name}</div><div class="tg-bubble-text">${text}</div></div>`;
          chat.appendChild(el);
          try{ chat.scrollTo({ top: chat.scrollHeight, behavior: "smooth" }); }catch(e){ chat.scrollTop = chat.scrollHeight; }
        }
      }
    }, 700 + Math.random()*500);
  }

  function postJoinerFlow(joiners, opts){
    opts = opts || {};
    const timestamp = opts.timestamp || new Date();
    bumpMemberCount(joiners.length || 1);

    // Large joins -> sticker + small personal welcomes
    if((joiners.length || 1) > 2){
      const stickerEl = createJoinStickerElement(joiners);
      appendStickerToChat(stickerEl, timestamp);

      // Optionally post as system messages if configured
      if(opts.welcomeAsSystem || cfg.welcomeAsSystem){
        // use TGRenderer 'system' type for the join (if present)
        try{
          if(window.TGRenderer && typeof window.TGRenderer.appendMessage === "function"){
            const sys = { name: "System", avatar: "assets/admin.jpg" };
            window.TGRenderer.appendMessage(sys, `${joiners.length} new members joined`, { timestamp, type: "system" });
          }
        }catch(e){}
      }

      const sample = joiners.slice(0, Math.min(cfg.initialBurstPreview, joiners.length));
      sample.forEach((p, idx) => {
        setTimeout(()=> postWelcomeAsBubbles(p, { timestamp: new Date() }), 800 + idx*600 + Math.random()*300);
      });
    } else {
      // small burst -> direct welcome messages
      joiners.forEach((p, idx) => {
        setTimeout(()=> {
          if(opts.welcomeAsSystem || cfg.welcomeAsSystem){
            // prefer system append if requested
            try{
              if(window.TGRenderer && typeof window.TGRenderer.appendMessage === "function"){
                window.TGRenderer.appendMessage({ name: "System" }, `${p.name} joined the group`, { timestamp: new Date(), type: "system" });
                // small personal bubble after system message
                setTimeout(()=> postWelcomeAsBubbles(p, { timestamp: new Date() }), 350 + Math.random()*250);
                return;
              }
            }catch(e){}
          }
          postWelcomeAsBubbles(p, { timestamp: new Date() });
        }, idx*600 + Math.random()*200);
      });
    }

    // small probability admin asks to verify via Contact Admin
    if(Math.random() < cfg.verifyMessageProbability){
      const admin = (window.identity && window.identity.Admin) ? window.identity.Admin : { name: "Admin", avatar: "assets/admin.jpg" };
      setTimeout(()=> {
        if(window.TGRenderer && typeof window.TGRenderer.appendMessage === "function"){
          try{ window.TGRenderer.appendMessage(admin, "Please verify via Contact Admin.", { timestamp: new Date(), type: "outgoing" }); }catch(e){}
        }
      }, 1200 + (joiners.length * 200));
    }
  }

  // schedule repeated joiner bursts
  function scheduleNext(){
    if(!running) return;
    const min = Math.max(1000, cfg.minIntervalMs || DEFAULTS.minIntervalMs);
    const max = Math.max(min+1, cfg.maxIntervalMs || DEFAULTS.maxIntervalMs);
    const base = Math.floor(min + Math.random() * (max - min));
    const jitter = Math.floor(Math.random() * Math.min(60000, Math.floor(base * 0.25)));
    const next = base + jitter;
    _timer = setTimeout(()=>{
      const burst = randInt(cfg.burstMin, cfg.burstMax);
      const joiners = [];
      for(let i=0;i<burst;i++) joiners.push(nextJoiner());
      try{ postJoinerFlow(joiners, { timestamp: new Date() }); }catch(e){ console.warn("joiner-simulator: postJoinerFlow failed", e); }
      scheduleNext();
    }, next);
  }

  function start(){
    if(running) return;
    running = true;
    // small pre-generate safely bounded set
    try{ preGenerate( Math.max(6, Math.min(80, cfg.initialBurstPreview || 8)) ); }catch(e){}
    scheduleNext();
    try{ localStorage.setItem(LS_KEY, JSON.stringify({ lastRun: Date.now() })); }catch(e){}
    console.log("joiner-simulator started");
  }

  function stop(){
    if(_timer) clearTimeout(_timer);
    running = false;
    console.log("joiner-simulator stopped");
  }

  // immediate join now (non-blocking chunked if many)
  function joinNow(n){
    n = Math.max(1, Math.floor(n || 1));
    const CHUNK = 40;
    let done = 0;
    function doChunk(){
      const take = Math.min(CHUNK, n - done);
      const arr = [];
      for(let i=0;i<take;i++) arr.push(nextJoiner());
      try{ postJoinerFlow(arr, { timestamp: new Date() }); }catch(e){ console.warn("joiner-simulator chunk post failed", e); }
      done += take;
      if(done < n) setTimeout(doChunk, 120);
    }
    doChunk();
  }

  // seed history in chunks to avoid freezing UI
  function seedHistory(days = 90, perDay = 5){
    days = Math.max(1, Math.floor(days));
    perDay = Math.max(0, Math.floor(perDay));
    const total = days * perDay;
    if(total === 0) return Promise.resolve(0);
    return new Promise(resolve => {
      const CHUNK = 80;
      let done = 0;
      function doChunk(){
        const take = Math.min(CHUNK, total - done);
        for(let i=0;i<take;i++){
          const idx = done + i;
          const day = Math.floor(idx / perDay);
          const timeInDay = Math.floor(Math.random() * 24 * 60 * 60 * 1000);
          const ts = new Date(Date.now() - day * 24 * 60 * 60 * 1000 - timeInDay);
          const j = nextJoiner();
          try{ postJoinerFlow([j], { timestamp: ts, welcomeAsSystem: true }); }catch(e){ /* continue */ }
        }
        done += take;
        if(done < total) setTimeout(doChunk, 120);
        else resolve(total);
      }
      setTimeout(doChunk, 40);
    });
  }

  function sanityCheck(){
    return {
      identity: !!(window.identity && typeof window.identity.getRandomPersona === "function"),
      TGRenderer: !!(window.TGRenderer && typeof window.TGRenderer.appendMessage === "function"),
      chat: !!document.getElementById("tg-comments-container"),
      meta: !!document.getElementById("tg-meta-line")
    };
  }

  // expose API
  window.joiner = window.joiner || {};
  Object.assign(window.joiner, {
    start,
    stop,
    joinNow,
    seedHistory,
    preGenerate,
    get preGenPool(){ return preGenPool; },
    sanityCheck,
    config: cfg,
    isRunning: () => running
  });

  // small preview burst to show activity on load (non-blocking)
  setTimeout(()=>{ try{ joinNow(Math.max(1, (window.JOINER_CONFIG && window.JOINER_CONFIG.initialJoins) || 3)); }catch(e){} }, 500);

  console.log("joiner-simulator ready");
})();
