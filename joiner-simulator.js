           // joiner-simulator.js (patched & tightened)
// -------------------------------------------------
// Simulates joiners, builds Telegram-style join stickers,
// posts welcome messages, seeds history, and updates member counts.
// Robust: avoids admin.jpg fallbacks, reduces avatar duplication,
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

  function randInt(min, max){ return Math.floor(Math.random() * (max - min + 1)) + min; }
  function safeMeta(){ return document.getElementById("tg-meta-line"); }

  function bumpMemberCount(n = 1){
    window.MEMBER_COUNT = Math.max(0, (window.MEMBER_COUNT || 0) + n);
    const m = safeMeta();
    if(m) m.textContent = `${(window.MEMBER_COUNT||0).toLocaleString()} members, ${(window.ONLINE_COUNT||0).toLocaleString()} online`;
  }

  function safeBuildAvatar(name){
    try{
      if(window.identity && typeof window.identity.buildUniqueAvatar === "function"){
        return window.identity.buildUniqueAvatar(name);
      }
    }catch(e){}
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name||"U")}&background=random&size=256`;
  }

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
    if(window.identity && typeof window.identity.getRandomPersona === "function"){
      const pRaw = window.identity.getRandomPersona();
      const p = Object.assign({}, pRaw);
      p.name = uniqueNameCandidate(String(p.name || ("User" + randInt(1000,9999))));
      if(!p.avatar || String(p.avatar).toLowerCase().includes("assets/admin.jpg")){
        p.avatar = safeBuildAvatar(p.name);
      }
      p.lastSeen = Date.now();
      p.isAdmin = !!p.isAdmin;
      return p;
    }
    const fName = uniqueNameCandidate("NewMember" + randInt(1000, 99999));
    return { name: fName, avatar: safeBuildAvatar(fName), isAdmin:false };
  }

  function preGenerate(count){
    preGenPool = preGenPool || [];
    const toCreate = Math.max(0, Math.min(1000, count - preGenPool.length));
    for(let i=0;i<toCreate;i++) preGenPool.push(createJoinerFromIdentity());
    return preGenPool.length;
  }

  function nextJoiner(){
    return preGenPool && preGenPool.length ? preGenPool.shift() : createJoinerFromIdentity();
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
    return variants[Math.floor(Math.random()*variants.length)];
  }

  function createJoinStickerElement(joiners){
    const container = document.createElement("div");
    container.className = "tg-join-sticker";

    const cluster = document.createElement("div");
    cluster.className = "join-cluster";

    const maxAv = Math.min(cfg.stickerMaxAvatars, joiners.length);
    const shown = joiners.slice(0, maxAv);

    shown.forEach(p => {
      const a = document.createElement("img");
      a.src = p.avatar || safeBuildAvatar(p.name);
      a.alt = p.name || "user";
      a.className = "join-avatar";
      a.width = cfg.stickerAvatarSize;
      a.height = cfg.stickerAvatarSize;
      a.onerror = () => { a.src = safeBuildAvatar(p.name); };
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
    names.textContent = shown.map(p => p.name).join(", ") +
      (joiners.length > shown.length ? ` and ${joiners.length - shown.length} others` : "");
    container.appendChild(names);

    const sub = document.createElement("div");
    sub.className = "join-sub";
    sub.textContent = "joined the group";
    container.appendChild(sub);

    return container;
  }

  function appendStickerToChat(stickerEl, timestamp){
    const chat = document.getElementById("tg-comments-container");
    if(!chat) return;
    const wrapper = document.createElement("div");
    wrapper.className = "tg-join-wrapper";
    if(timestamp) wrapper.dataset.joinTimestamp = new Date(timestamp).toISOString();
    wrapper.appendChild(stickerEl);
    chat.appendChild(wrapper);
    try{ chat.scrollTo({ top: chat.scrollHeight, behavior: "smooth" }); }
    catch(e){ chat.scrollTop = chat.scrollHeight; }
  }

  function postWelcomeAsBubbles(joiner){
    const persona = joiner;
    const text = randomWelcomeText(joiner);
    if(window.TGRenderer && typeof window.TGRenderer.showTyping === "function"){
      window.TGRenderer.showTyping(persona, 700 + Math.random()*500);
    }
    setTimeout(()=>{
      if(window.TGRenderer && typeof window.TGRenderer.appendMessage === "function"){
        window.TGRenderer.appendMessage(persona, text, { type: "incoming" });
      }
    }, 700 + Math.random()*500);
  }

  function postJoinerFlow(joiners, opts){
    opts = opts || {};
    bumpMemberCount(joiners.length || 1);

    if((joiners.length || 1) > 2){
      const stickerEl = createJoinStickerElement(joiners);
      appendStickerToChat(stickerEl);

      if(opts.welcomeAsSystem || cfg.welcomeAsSystem){
        if(window.TGRenderer && typeof window.TGRenderer.appendMessage === "function"){
          window.TGRenderer.appendMessage({ name: "System" },
            `${joiners.length} new members joined`, { type: "system" });
        }
      }

      joiners.slice(0, cfg.initialBurstPreview).forEach((p, idx) => {
        setTimeout(()=> postWelcomeAsBubbles(p), 800 + idx*600);
      });
    } else {
      joiners.forEach((p, idx) => {
        setTimeout(()=> {
          if(opts.welcomeAsSystem || cfg.welcomeAsSystem){
            if(window.TGRenderer && typeof window.TGRenderer.appendMessage === "function"){
              window.TGRenderer.appendMessage({ name: "System" },
                `${p.name} joined the group`, { type: "system" });
              setTimeout(()=> postWelcomeAsBubbles(p), 350);
              return;
            }
          }
          postWelcomeAsBubbles(p);
        }, idx*600);
      });
    }

    if(Math.random() < cfg.verifyMessageProbability){
      const admin = (window.identity && window.identity.Admin) || { name: "Admin" };
      setTimeout(()=>{
        if(window.TGRenderer && typeof window.TGRenderer.appendMessage === "function"){
          window.TGRenderer.appendMessage(admin,
            "Please verify via Contact Admin.", { type: "outgoing" });
        }
      }, 1200);
    }
  }

  function scheduleNext(){
    if(!running) return;
    const min = Math.max(1000, cfg.minIntervalMs);
    const max = Math.max(min+1, cfg.maxIntervalMs);
    const next = Math.floor(min + Math.random()*(max-min));
    _timer = setTimeout(()=>{
      const burst = randInt(cfg.burstMin, cfg.burstMax);
      const joiners = [];
      for(let i=0;i<burst;i++) joiners.push(nextJoiner());
      postJoinerFlow(joiners);
      scheduleNext();
    }, next);
  }

  function start(){
    if(running) return;
    running = true;
    preGenerate(Math.max(6, cfg.initialBurstPreview));
    scheduleNext();
  }

  function stop(){
    if(_timer) clearTimeout(_timer);
    running = false;
  }

  function joinNow(n){
    n = Math.max(1, n || 1);
    const CHUNK = 40;
    let done = 0;
    function doChunk(){
      const take = Math.min(CHUNK, n - done);
      const arr = [];
      for(let i=0;i<take;i++) arr.push(nextJoiner());
      postJoinerFlow(arr);
      done += take;
      if(done < n) setTimeout(doChunk, 120);
    }
    doChunk();
  }

  window.joiner = window.joiner || {};
  Object.assign(window.joiner, { start, stop, joinNow, preGenerate, config: cfg });
  setTimeout(()=> joinNow(cfg.initialBurstPreview || 3), 500);

})();             
