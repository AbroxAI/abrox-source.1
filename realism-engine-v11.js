// realism-engine-v11.patched.js (safe, hardened)
// ULTRA-REALISM ENGINE V11 — patched for robustness and DOM fallbacks
(function(){
  // ---------- expanded data pools (unchanged) ----------
  const ASSETS = [
    "EUR/USD","USD/JPY","GBP/USD","AUD/USD","BTC/USD","ETH/USD","USD/CHF","EUR/JPY","NZD/USD",
    "US30","NAS100","SPX500","DAX30","FTSE100","GOLD","SILVER","WTI","BRENT",
    "ADA/USD","SOL/USD","DOGE/USD","DOT/USD","LINK/USD","MATIC/USD","LUNC/USD","AVAX/USD",
    "JPY/CHF","GBP/JPY","EUR/GBP","AUD/JPY","CAD/JPY","US500","RUS_50"
  ];

  const BROKERS = [
    "IQ Option","Binomo","Pocket Option","Deriv","Olymp Trade","OlympTrade","Binary.com",
    "eToro","Plus500","IG","XM","FXTM","Pepperstone","IC Markets","Bybit","Binance","OKX","Kraken"
  ];

  const TIMEFRAMES = ["M1","M5","M15","M30","H1","H4","D1","W1","MN1"];

  const RESULT_WORDS = [
    "green","red","profit","loss","win","missed entry","recovered","scalped nicely","small win","big win","moderate loss",
    "loss recovered","double profit","consistent profit","partial win","micro win","entry late but profitable",
    "stopped loss","hedged correctly","full green streak","partial loss","break-even","tight stop","wide stop",
    "re-entry success","slippage hit","perfect exit","stop hunted","rolled over","swing profit","scalp win","gap fill",
    "retest failed","trend follow","mean reversion hit","liquidity grab","fakeout","nice tp hit","sloppy execution"
  ];

  const TESTIMONIALS = [
    "Made $450 in 2 hours using Abrox",
    "Closed 3 trades, all green today ✅",
    "Recovered a losing trade thanks to Abrox",
    "7 days straight of consistent profit 💹",
    "Abrox saved me from a $200 loss",
    "50% ROI in a single trading session 🚀",
    "Signal timing was perfect today",
    "Scalped 5 trades successfully today 🚀",
    "Missed entry but recovered",
    "Made $120 in micro trades this session",
    "Small wins add up over time, Abrox is legit",
    "Never had such accurate entries before",
    "This bot reduced stress, makes trading predictable 😌",
    "Entry was late but still profitable 💹",
    "Hedged correctly thanks to bot signals",
    "Altcoin signals were on point today",
    "Recovered yesterday’s loss in one trade",
    "Made $300 in under 3 hours",
    "Bot suggested perfect exit on USD/JPY",
    "Day trading made predictable thanks to Abrox",
    // ... (trimmed for brevity)
    "Good for swing entries into trend"
  ];

  const EMOJIS = [
    "💸","🔥","💯","✨","😎","👀","📈","🚀","💰","🤑","🎯","🏆","🤖","🎉","🍀","📊","⚡","💎","👑","🦄",
    "🧠","🔮","🪙","🥂","💡","🛸","📉","📱","💬","🙌","👏","👍","❤️","😂","😅","🤞","✌️","😴","🤩",
    "😬","🤝","🧾","📌","🔔","⚠️","✅","❌","📎","🧩","🔗","🔒","🌕","🌑","🌟","🏁","💹","🏦","🧭","🧯",
    "🧨","📣","💤","🕐","🕒","🕘","🕛","🕓","🧿","🎚️","📬","🎲","📡","🪄","🧰","🔭","🌊","🌪️","🌤️","🛰️"
  ];

  // ---------- utilities & dedupe ----------
  function random(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function maybe(p){ return Math.random() < p; }
  function rand(max=9999){ return Math.floor(Math.random()*max); }

  // stable fingerprint (djb2) and normalized text
  function djb2(str){
    let h = 5381;
    for(let i=0;i<str.length;i++) h = ((h << 5) + h) + str.charCodeAt(i);
    return (h >>> 0).toString(36);
  }
  function normalizeText(t){ return String(t||"").toLowerCase().replace(/[\W\d_]+/g," ").trim().substring(0,300); }

  // dedupe structures with LRU cap
  const GENERATED_TEXTS_V11 = new Set();
  const GENERATED_QUEUE = [];
  function markGenerated(text){
    try{
      const norm = normalizeText(text);
      if(!norm) return false;
      const fp = djb2(norm);
      if(GENERATED_TEXTS_V11.has(fp)) return false;
      GENERATED_TEXTS_V11.add(fp);
      GENERATED_QUEUE.push(fp);
      const cap = (window.REALISM_CONFIG && window.REALISM_CONFIG.DEDUP_LIMIT) || 50000;
      while(GENERATED_QUEUE.length > cap){
        const old = GENERATED_QUEUE.shift();
        GENERATED_TEXTS_V11.delete(old);
      }
      return true;
    }catch(e){
      return false;
    }
  }

  // persistence helpers (safe)
  const PERSIST_KEY = "abrox_realism_state_v1";
  function saveRealismState(){
    try{
      const cap = (window.REALISM_CONFIG && window.REALISM_CONFIG.DEDUP_LIMIT) || 50000;
      const dump = { generatedQueue: GENERATED_QUEUE.slice(-cap), ts: Date.now() };
      localStorage.setItem(PERSIST_KEY, JSON.stringify(dump));
    }catch(e){ /* swallow */ }
  }
  function loadRealismState(){
    try{
      const raw = localStorage.getItem(PERSIST_KEY);
      if(!raw) return;
      const s = JSON.parse(raw);
      if(Array.isArray(s.generatedQueue)) s.generatedQueue.forEach(fp => { GENERATED_QUEUE.push(fp); GENERATED_TEXTS_V11.add(fp); });
    }catch(e){ /* swallow */ }
  }
  loadRealismState();
  window.addEventListener("beforeunload", saveRealismState);
  const _persistInterval = setInterval(saveRealismState, 1000*60*2);

  // ---------- generation logic ----------
  function generateTimestamp(pastDaysMax=90){
    const now = Date.now();
    const delta = Math.floor(Math.random()*pastDaysMax*24*60*60*1000);
    return new Date(now - delta - Math.floor(Math.random()*1000*60*60));
  }

  function generateTradingCommentV11(){
    const templates = [
      () => `Guys, ${random(TESTIMONIALS)}`,
      () => `Anyone trading ${random(ASSETS)} on ${random(BROKERS)}?`,
      () => `Signal for ${random(ASSETS)} ${random(TIMEFRAMES)} is ${random(RESULT_WORDS)}`,
      () => `Abrox alerted ${random(ASSETS)} ${random(TIMEFRAMES)} — ${random(RESULT_WORDS)}`,
      () => `Waiting for ${random(ASSETS)} news impact`,
      () => `Did anyone catch ${random(ASSETS)} reversal?`,
      () => `Closed ${random(ASSETS)} on ${random(TIMEFRAMES)} — ${random(RESULT_WORDS)}`,
      () => `${random(TESTIMONIALS)}`,
      () => `Scalped ${random(ASSETS)} on ${random(BROKERS)}, result ${random(RESULT_WORDS)}`,
      () => `Testimonial: ${random(TESTIMONIALS)}`
    ];

    let text = (typeof random === "function") ? random(templates)() : templates[Math.floor(Math.random()*templates.length)]();

    if(maybe(0.35)){
      const extras = ["good execution","tight stop","wide stop","no slippage","perfect timing","missed by 2s","partial TP hit","closed manually"];
      text += " — " + random(extras);
    }

    if(maybe(0.12)){
      text = text.replace(/\w{6,}/g, word => {
        if(maybe(0.2)){
          const i = Math.max(1, Math.floor(Math.random()*(word.length-2)));
          return word.substring(0,i) + word[i+1] + word[i] + word.substring(i+2);
        }
        return word;
      });
    }

    if(maybe(0.45)) text += " " + random(EMOJIS);

    let attempts = 0;
    while(!markGenerated(text) && attempts < 30){
      text += " " + rand(999);
      attempts++;
    }
    return { text, timestamp: generateTimestamp(120) };
  }

  // LONG TERM POOL
  const LONG_TERM_POOL_V11 = [];
  function ensurePoolV11(minSize = (window.REALISM_CONFIG && window.REALISM_CONFIG.POOL_MIN) || 800){
    minSize = Math.max(0, Math.min(minSize, (window.REALISM_CONFIG && window.REALISM_CONFIG.POOL_MAX) || 4000));
    while(LONG_TERM_POOL_V11.length < minSize){
      LONG_TERM_POOL_V11.push(generateTradingCommentV11());
      if(LONG_TERM_POOL_V11.length > ((window.REALISM_CONFIG && window.REALISM_CONFIG.POOL_MAX) || 4000)) break;
    }
    return LONG_TERM_POOL_V11.length;
  }

  // ---------- safe append to UI ----------
  const MESSAGE_STATS = new Map();

  function createDomFallbackBubble(persona, text, opts){
    try{
      const chat = document.getElementById("tg-comments-container");
      if(!chat) return null;
      const id = opts && opts.id ? opts.id : `realism_fallback_${Date.now().toString(36)}${Math.floor(Math.random()*9999)}`;
      const bubble = document.createElement("div");
      bubble.className = `tg-bubble ${opts && opts.type === "outgoing" ? "outgoing" : "incoming"}`;
      bubble.dataset.id = id;
      bubble.innerHTML = `
        <div class="tg-bubble-avatar"><img src="${persona.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(persona.name||"U")}`}" alt="${persona.name||'User'}"></div>
        <div class="tg-bubble-body">
          <div class="tg-bubble-sender">${persona.name || "User"}</div>
          <div class="tg-bubble-text">${text}</div>
          <div class="tg-bubble-meta"><span class="seen"></span></div>
        </div>
      `;
      chat.appendChild(bubble);
      try{ chat.scrollTo({ top: chat.scrollHeight, behavior: "smooth" }); }catch(e){ chat.scrollTop = chat.scrollHeight; }
      return id;
    }catch(e){
      return null;
    }
  }

  function safeAppendMessage(persona, text, opts){
    try{
      opts = opts || {};
      // prefer TGRenderer if available
      if(window.TGRenderer && typeof window.TGRenderer.appendMessage === "function"){
        try{
          const id = window.TGRenderer.appendMessage(persona, text, opts);
          const effectiveId = id || (opts && opts.id) || (`realism_${Date.now().toString(36)}${Math.floor(Math.random()*9999)}`);
          if(!MESSAGE_STATS.has(effectiveId)) MESSAGE_STATS.set(effectiveId, { views: rand(8)+1, reactions: new Map(), createdAt: Date.now(), popularity: 0 });
          return effectiveId;
        }catch(e){
          // fallthrough to DOM fallback
        }
      }
      // DOM fallback
      const fallbackId = createDomFallbackBubble(persona, text, opts);
      if(fallbackId && !MESSAGE_STATS.has(fallbackId)) MESSAGE_STATS.set(fallbackId, { views: rand(4)+1, reactions: new Map(), createdAt: Date.now(), popularity: 0 });
      return fallbackId;
    }catch(e){
      console.warn("realism.safeAppendMessage failed", e);
      return null;
    }
  }

  // ---------- post from pool ----------
  function postFromPoolV11(count=1, personaPicker){
    try{
      ensurePoolV11(Math.max((window.REALISM_CONFIG && window.REALISM_CONFIG.POOL_MIN) || 800, count));
      const stagger = Math.max(40, (window.REALISM_CONFIG && window.REALISM_CONFIG.POST_STAGGER_MS) || 140);
      for(let i=0;i<count;i++){
        const item = LONG_TERM_POOL_V11.shift();
        if(!item) break;
        ((it, idx) => {
          setTimeout(()=>{
            const persona = (typeof personaPicker === "function") ? personaPicker() : (window.identity && typeof window.identity.getRandomPersona === "function" ? window.identity.getRandomPersona() : { name:"User", avatar:`https://ui-avatars.com/api/?name=${encodeURIComponent("User")}` });
            try{ if(window.TGRenderer && typeof window.TGRenderer.showTyping === "function") window.TGRenderer.showTyping(persona, 700 + Math.random()*1200); }catch(e){}
            setTimeout(()=> safeAppendMessage(persona, it.text, { timestamp: it.timestamp, type: "incoming" }), 700 + Math.random()*900);
          }, idx * stagger);
        })(item, i);
      }
    }catch(e){
      console.warn("postFromPoolV11 failed", e);
    }
  }

  // ---------- trending reactions ----------
  function triggerTrendingReactionV11(baseText, personaPicker){
    try{
      if(!baseText) return;
      const replies = Math.max(1, rand(5) + 1);
      for(let i=0;i<replies;i++){
        setTimeout(()=>{
          const item = generateTradingCommentV11();
          const persona = (typeof personaPicker === "function") ? personaPicker() : (window.identity && window.identity.getRandomPersona ? window.identity.getRandomPersona() : { name:"User", avatar:`https://ui-avatars.com/api/?name=U` });
          safeAppendMessage(persona, item.text, { timestamp: item.timestamp, type: "incoming", replyToText: baseText });
        }, 700*(i+1) + rand(1200));
      }
    }catch(e){ /* ignore */ }
  }

  // ---------- scheduler (idempotent) ----------
  let _crowdTimer = null;
  let _started = false;
  function scheduleNext(){
    try{
      const cfg = window.REALISM_CONFIG || {};
      const min = Math.max(20000, cfg.MIN_INTERVAL_MS || cfg.minIntervalMs || 20000);
      const max = Math.max(min+1, cfg.MAX_INTERVAL_MS || cfg.maxIntervalMs || 90000);
      const interval = min + Math.floor(Math.random()*(max-min));
      const jitter = Math.floor(Math.random()*5000);
      _crowdTimer = setTimeout(()=>{ postFromPoolV11(1); scheduleNext(); }, interval + jitter);
    }catch(e){ console.warn("realism.scheduleNext", e); }
  }
  function simulateRandomCrowdV11(){ if(_started) return; _started = true; if(_crowdTimer) clearTimeout(_crowdTimer); setTimeout(scheduleNext, 500); }

  // ---------- message stats UI updates ----------
  function updateMessageStatsInUI(messageId, stats){
    try{
      const el = document.querySelector(`[data-id="${messageId}"]`);
      if(!el) return;
      const reactionsContainer = el.querySelector(".tg-reactions");
      if(reactionsContainer){
        reactionsContainer.innerHTML = "";
        if(stats.reactions){
          for(const [emoji, count] of stats.reactions.entries()){
            const pill = document.createElement("div");
            pill.className = "tg-reaction";
            pill.textContent = `${emoji} ${count}`;
            reactionsContainer.appendChild(pill);
          }
        }
      }
      const metaSeen = el.querySelector(".tg-bubble-meta .seen");
      if(metaSeen) metaSeen.innerHTML = `<i data-lucide="eye"></i> ${stats.views}`;
      if(window.lucide && typeof window.lucide.createIcons === "function") window.lucide.createIcons();
    }catch(e){}
  }

  function reactionTick(){
    try{
      MESSAGE_STATS.forEach((stats, id) => {
        const inc = maybe(0.6) ? rand(2) : 0;
        stats.views = (stats.views || 0) + inc;
        if(maybe(0.085)){
          const emoji = random(["👍","❤️","🔥","😂","👏","💯","🚀"]);
          stats.reactions.set(emoji, (stats.reactions.get(emoji)||0) + 1);
        }
        if(maybe((window.REALISM_CONFIG && window.REALISM_CONFIG.TREND_SPIKE_PROB) || 0.03)) stats.popularity = (stats.popularity||0) + rand(6) + 3;
        updateMessageStatsInUI(id, stats);
      });
    }catch(e){ /* ignore */ }
  }
  const _reactionInterval = setInterval(reactionTick, (window.REALISM_CONFIG && window.REALISM_CONFIG.REACTION_TICK_MS) || 27000);

  // cleanup on unload
  window.addEventListener("unload", ()=>{
    try{ clearInterval(_reactionInterval); clearInterval(_persistInterval); if(_crowdTimer) clearTimeout(_crowdTimer); }catch(e){}
  });

  // ---------- public API ----------
  window.realism = window.realism || {};
  Object.assign(window.realism, {
    postFromPoolV11,
    triggerTrendingReactionV11,
    simulateRandomCrowdV11,
    ensurePoolV11,
    LONG_TERM_POOL_V11,
    MESSAGE_STATS,
    GENERATED_TEXTS_V11,
    _started: () => _started
  });

  // ---------- startup (non-blocking) ----------
  (function startup(){
    try{
      const initialPool = (window.REALISM_CONFIG && window.REALISM_CONFIG.INITIAL_POOL) || 1000;
      const initialImmediate = Math.min(80, Math.max(12, Math.floor(initialPool * 0.06)));
      ensurePoolV11(Math.min(initialPool, 6000));
      setTimeout(()=> postFromPoolV11(initialImmediate), 700);
      setTimeout(()=> simulateRandomCrowdV11(), 1400);
      console.log("realism-engine-v11 started:", initialImmediate, "pool size:", LONG_TERM_POOL_V11.length);
    }catch(e){
      console.warn("realism startup failed", e);
    }
  })();

})();
