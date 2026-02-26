// joiner-simulator.js — Fully integrated Joiner Simulator for Telegram 2026 replica
// Works seamlessly with Bubble Renderer, Interactions.js & Widget CSS

(function(){
  'use strict';

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

  const WELCOME_TEXT_POOL = [
    "Hi everyone! 👋","Hello! Glad to join.","Hey — excited to learn and trade with you all.","New here — say hi!","Thanks for having me 😊",
    "Just joined, looking forward to the signals.","Excited to be here 🙌","Looking forward to contributing 🚀","Happy to join the group 💡",
    "Hi all, hope to learn something new today 😎","Hey team! Ready to grow together 💪","Good to be here! Looking forward to insights 📈",
    "Glad to be part of this community 🌟","Hello traders! Let's make this a profitable journey 💸","Hi everyone, excited to follow trends 📊",
    "Hey all, ready to share ideas and strategies 🧠","Happy to connect with like-minded people 🤝","Ready to follow the signals and grow 💹",
    "Excited to trade with you all 🚀","Hi, looking forward to collaborative learning ✨","Hello, let's make some smart moves together 📊",
    "Glad to join this awesome group 😎","Hi team, here to learn and contribute 🎯","Happy to meet everyone, excited to start 💡",
    "Hello traders, looking forward to profitable trades 🏆","Excited to be on board and learn daily 📈","Hi, hoping to gain valuable insights 💹",
    "Hey, let's make consistent profits together 💰","Glad to be here, looking forward to signals 🔥","Hello everyone, excited to start trading 💸",
    "Hi, hoping to improve my trading skills 📊","Hey all, looking forward to a great experience 🚀","Happy to be part of this community 🌟",
    "Hello team, ready to grow and learn together 🧠","Hi everyone, excited to follow trends and signals 📈","Glad to join, ready to trade smart 💹",
    "Hey, looking forward to learning new strategies ✨","Hi team, excited for collaborative trading 🤝","Hello, happy to join and contribute ideas 💡",
    "Hi all, ready for profitable trading sessions 🔥","Hello traders, let's make the most of this group 🚀"
  ];

  function randInt(min, max){ return Math.floor(Math.random() * (max - min + 1)) + min; }
  function random(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
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
    let p;
    if(window.identity && typeof window.identity.getRandomPersona === "function"){
      const pRaw = window.identity.getRandomPersona();
      p = Object.assign({}, pRaw);
      p.name = uniqueNameCandidate(String(p.name || ("User" + randInt(1000,9999))));
      if(!p.avatar || String(p.avatar).toLowerCase().includes("assets/admin.jpg")){
        p.avatar = safeBuildAvatar(p.name);
      }
      p.lastSeen = Date.now();
      p.isAdmin = !!p.isAdmin;
    } else {
      const fName = uniqueNameCandidate("NewMember" + randInt(1000, 99999));
      p = { name: fName, avatar: safeBuildAvatar(fName), isAdmin:false };
    }

    document.dispatchEvent(new CustomEvent("joiner:new", { detail: p }));
    return p;
  }

  function preGenerate(count){
    preGenPool = preGenPool || [];
    const toCreate = Math.max(0, Math.min(2000, count - preGenPool.length));
    for(let i=0;i<toCreate;i++) preGenPool.push(createJoinerFromIdentity());
    return preGenPool.length;
  }

  function nextJoiner(){
    return preGenPool && preGenPool.length ? preGenPool.shift() : createJoinerFromIdentity();
  }

  function randomWelcomeText(){ return random(WELCOME_TEXT_POOL); }

  function postWelcomeAsBubbles(joiner){
    const persona = joiner;
    const text = randomWelcomeText(joiner);

    if(window.TGRenderer?.showTyping){
      window.TGRenderer.showTyping(persona, 700 + Math.random()*500);
    }

    setTimeout(()=>{
      if(window.TGRenderer?.appendMessage){
        window.TGRenderer.appendMessage(persona, text, { type:"incoming" });
      }

      if(window.realismEngineV11Pool){
        const replyCount = 1 + Math.floor(Math.random()*3);
        for(let i=0;i<replyCount;i++){
          const personaRE = window.identity?.getRandomPersona?.() || { name:"User", avatar:safeBuildAvatar("U") };
          let baseText = `${random(WELCOME_TEXT_POOL)}`;
          if(Math.random() < 0.55) baseText += " " + (window.realismEngineV11EMOJIS ? random(window.realismEngineV11EMOJIS) : "🎉");
          window.realismEngineV11Pool.push({ text: baseText, timestamp: new Date(), persona: personaRE });
        }
      }
    }, 700 + Math.random()*500);
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

  function postJoinerFlow(joiners){
    bumpMemberCount(joiners.length || 1);

    if((joiners.length || 1) > 2){
      const stickerEl = createJoinStickerElement(joiners);
      const chat = document.getElementById("tg-comments-container");
      if(chat) chat.appendChild(stickerEl);
      joiners.slice(0, cfg.initialBurstPreview).forEach(postWelcomeAsBubbles);
    } else {
      joiners.forEach(postWelcomeAsBubbles);
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

  // fire initial burst
  setTimeout(()=> joinNow(cfg.initialBurstPreview || 3), 500);

})();
