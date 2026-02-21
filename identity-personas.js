// identity-personas.js (expanded names + emojis) — patched for unique avatars & safe fallbacks
// ============================================================
// ELITE HUMAN-LIKE PERSONA ENGINE v2 — EXPANDED
// - larger name pools
// - larger emoji set
// - robust unique avatar builder (no admin.jpg fallbacks)
// - deterministic DiceBear seed to avoid random collisions
// ============================================================

(function(){
  // ================= ADMIN =================
  const Admin = { name: "Profit Hunter 🌐", avatar: "assets/admin.jpg", isAdmin: true, gender: "male", country: "GLOBAL", personality: "authority", tone: "direct", timezoneOffset: 0, memory: [] };

  // ================= COUNTRY GROUPS =================
  const COUNTRY_GROUPS = {
    US:"western", UK:"western", CA:"western", AU:"western", DE:"western", FR:"western", IT:"western",
    NG:"african", ZA:"african", GH:"african",
    IN:"asian", JP:"asian", KR:"asian", CN:"asian",
    BR:"latin", MX:"latin", AR:"latin",
    RU:"eastern", TR:"eastern"
  };
  const COUNTRIES = Object.keys(COUNTRY_GROUPS);

  // ================= NAME DATA (expanded) =================
  const MALE_FIRST = [
    "Alex","John","Max","Leo","Sam","David","Liam","Noah","Ethan","James","Ryan","Michael","Daniel","Kevin","Oliver","William",
    "Henry","Jack","Mason","Lucas","Elijah","Benjamin","Sebastian","Logan","Jacob","Wyatt","Carter","Julian","Luke","Isaac",
    "Nathan","Aaron","Adrian","Victor","Caleb","Dominic","Xavier","Evan","Connor","Jason","Owen","Thomas","Charles","Jeremiah",
    "Dylan","Zachary","Gabriel","Nicholas","Christian","Austin","Brandon","Ian","Colin","Rafael","Marcus","Simon","Tobias","Victoriano"
  ];

  const FEMALE_FIRST = [
    "Maria","Lily","Emma","Zoe","Ivy","Sophia","Mia","Olivia","Ava","Charlotte","Amelia","Ella","Grace","Chloe","Hannah","Aria",
    "Scarlett","Luna","Ruby","Sofia","Emily","Layla","Nora","Victoria","Aurora","Isabella","Madison","Penelope","Camila","Stella",
    "Hazel","Violet","Savannah","Bella","Claire","Sienna","Juliet","Evelyn","Maya","Naomi","Alice","Serena","Daphne","Leah","Miriam"
  ];

  const LAST_NAMES = [
    "Smith","Johnson","Brown","Taylor","Anderson","Thomas","Jackson","White","Harris","Martin","Thompson","Garcia","Martinez",
    "Robinson","Clark","Rodriguez","Lewis","Walker","Hall","Allen","Young","King","Wright","Scott","Green","Baker","Adams","Nelson",
    "Hill","Campbell","Mitchell","Carter","Roberts","Gonzalez","Perez","Edwards","Collins","Stewart","Sanchez","Morris","Rogers",
    "Reed","Cook","Morgan","Bell","Murphy","Bailey","Rivera","Cooper","Richardson","Cox","Howard","Ward","Flores"
  ];

  const CRYPTO_ALIASES = [
    "BlockKing","PumpMaster","CryptoWolf","FomoKing","Hodler","TraderJoe","BitHunter","AltcoinAce","ChainGuru","DeFiLord","MetaWhale",
    "CoinSniper","YieldFarmer","NFTDegen","ChartWizard","TokenShark","AirdropKing","WhaleHunter","BullRider","BearBuster","SatoshiFan",
    "GasSaver","MoonChaser","RektRecover","Nodesman","LiquidityLord","OnChainOwl"
  ];

  const TITLES = [
    "Trader","Investor","HODLer","Analyst","Whale","Shark","Mooner","Scalper","SwingTrader","DeFi","Miner","Blockchain","NFT","Quant",
    "Signals","Mentor","Founder","CTO","RiskMgr","Ops"
  ];

  // ================= EMOJI SET (expanded) =================
  const EMOJIS = [
    "💸","🔥","💯","✨","😎","👀","📈","🚀","💰","🤑","🎯","🏆","🤖","🎉","🍀","📊","⚡","💎","👑","🦄",
    "🧠","🔮","🪙","🥂","💡","🛸","📉","📱","💬","🙌","👏","👍","❤️","😂","😅","🤞","✌️","😴","🤩","😬",
    "🤝","🧾","📌","🔔","⚠️","✅","❌","📎","🧩","🪙","🔗","🔒","🌕","🌑","🌟","🏁","💹","🏦","🧭","🧯"
  ];

  // ================= SLANG ENGINE =================
  const SLANG = {
    western:["bro","ngl","lowkey","fr","tbh","wild","solid move","bet","dope","lit","clutch","savage","meme","cheers","respect","hype","flex","mad","cap","no cap","real talk","yo","fam","legit","sick"],
    african:["my guy","omo","chai","no wahala","sharp move","gbam","yawa","sweet","jollof","palava","chop","fine boy","hustle","ehen","kolo","sisi","big man","on point","correct","naija","bros","guyz"],
    asian:["lah","brother","steady","respect","solid one","ok lah","si","good move","ganbatte","wa","neat","ke","nice one","yah","cool","aiyo","steady bro"],
    latin:["amigo","vamos","muy bueno","fuerte move","dale","epa","buenisimo","chevere","que pasa","vamo","oye","pura vida","mano","buena","vamos ya","olé"],
    eastern:["comrade","strong move","not bad","serious play","da","top","nu","excellent","good work","correct","bravo","fine","nice move","pro","cheers"]
  };

  // ================= AVATAR SOURCES (mix) =================
  const AVATAR_SOURCES = [
    {type:"randomuser"}, {type:"pravatar"}, {type:"robohash"}, {type:"multiavatar"},
    {type:"dicebear",style:"avataaars"}, {type:"dicebear",style:"bottts"},
    {type:"dicebear",style:"identicon"}, {type:"dicebear",style:"open-peeps"},
    {type:"dicebear",style:"micah"}, {type:"dicebear",style:"pixel-art"},
    {type:"dicebear",style:"thumbs"}, {type:"dicebear",style:"lorelei"},
    {type:"dicebear",style:"notionists"}, {type:"dicebear",style:"rings"},
    {type:"dicebear",style:"initials"}, {type:"dicebear",style:"shapes"},
    {type:"dicebear",style:"fun-emoji"}, {type:"dicebear",style:"adventurer"},
    {type:"dicebear",style:"adventurer-neutral"}, {type:"ui-avatars"}
  ];

  // ================= MIXED AVATAR POOL =================
  const MIXED_AVATAR_POOL = [
    "https://i.pravatar.cc/300?img=3","https://i.pravatar.cc/300?img=5","https://i.pravatar.cc/300?img=7","https://i.pravatar.cc/300?img=9",
    "https://randomuser.me/api/portraits/men/21.jpg","https://randomuser.me/api/portraits/women/22.jpg",
    "https://picsum.photos/seed/alpha/300/300","https://picsum.photos/seed/bravo/300/300","https://picsum.photos/seed/charlie/300/300",
    "https://picsum.photos/seed/delta/300/300","https://picsum.photos/seed/echo/300/300","https://picsum.photos/seed/foxtrot/300/300",
    "https://robohash.org/seed_a.png","https://robohash.org/seed_b.png","https://robohash.org/seed_c.png","https://robohash.org/seed_d.png",
    "https://api.multiavatar.com/seed_one.png","https://api.multiavatar.com/seed_two.png","https://api.multiavatar.com/seed_three.png","https://api.multiavatar.com/seed_four.png",
    "https://api.multiavatar.com/seed_five.png","https://api.multiavatar.com/seed_six.png",
    "https://ui-avatars.com/api/?name=A","https://ui-avatars.com/api/?name=B","https://ui-avatars.com/api/?name=C",
    "https://images.unsplash.com/photo-1502764613149-7f1d229e230f?w=400&q=80","https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80","https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&q=80",
    "https://picsum.photos/seed/golf/300/300","https://picsum.photos/seed/hotel/300/300","https://picsum.photos/seed/india/300/300"
  ];

  // ================= TRACKERS =================
  const TOTAL_PERSONAS = Math.max(300, Math.min((window.REALISM_CONFIG && window.REALISM_CONFIG.TOTAL_PERSONAS) || 1200, 30000));
  const SyntheticPool = [];
  const AVATAR_PERSIST_KEY = "abrox_used_avatars_v1";
  const UsedAvatarURLs = new Set();

  (function loadUsedAvs(){
    try{
      const raw = localStorage.getItem(AVATAR_PERSIST_KEY);
      if(!raw) return;
      const arr = JSON.parse(raw);
      if(Array.isArray(arr)) arr.forEach(u => UsedAvatarURLs.add(u));
    }catch(e){ console.warn("identity: loadUsedAvs failed", e); }
  })();

  function saveUsedAvs(){
    try{ localStorage.setItem(AVATAR_PERSIST_KEY, JSON.stringify(Array.from(UsedAvatarURLs))); }
    catch(e){ console.warn("identity: saveUsedAvs failed", e); }
  }
  setInterval(saveUsedAvs, 1000*60*2);
  window.addEventListener("beforeunload", saveUsedAvs);

  // ================= UTILITIES =================
  function random(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function maybe(p){ return Math.random() < p; }
  function rand(max=9999){ return Math.floor(Math.random()*max); }

  // ================= NAME BUILDER =================
  const UsedNames = new Set();
  function buildUniqueName(gender){
    let base;
    if(maybe(0.18)){
      base = random(CRYPTO_ALIASES) + (maybe(0.6)? " " + random(TITLES): "");
      if(maybe(0.6)) base += " " + rand(999);
      if(maybe(0.5)) base += " " + random(EMOJIS);
      if(UsedNames.has(base) && maybe(0.6)) base += "." + rand(99);
    } else {
      base = (gender==="male"?random(MALE_FIRST):random(FEMALE_FIRST)) + " " + random(LAST_NAMES);
      if(maybe(0.55)) base += " " + random(TITLES);
      if(maybe(0.6)) base += " " + rand(999);
      if(maybe(0.45)) base = base.replace(/\s+/g, maybe(0.5)?"_":".");
      if(maybe(0.5)) base += " " + random(EMOJIS);
    }
    let candidate = base.trim();
    let guard = 0;
    while(UsedNames.has(candidate) && guard < 10){ candidate = base.trim() + "_" + rand(9999); guard++; }
    UsedNames.add(candidate);
    return candidate;
  }

  // ================= AVATAR BUILD HELPERS =================
  function hash32(str){
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
    return (h >>> 0);
  }
  function colorFromName(name){
    const h = hash32(String(name || "").toLowerCase());
    const r = ((h & 0xFF0000) >>> 16) & 0xFF;
    const g = ((h & 0x00FF00) >>> 8) & 0xFF;
    const b = (h & 0x0000FF) & 0xFF;
    const rr = Math.min(220, Math.max(30, Math.floor((r + 30) * 0.9)));
    const gg = Math.min(220, Math.max(30, Math.floor((g + 30) * 0.9)));
    const bb = Math.min(220, Math.max(30, Math.floor((b + 30) * 0.9)));
    return ((rr << 16) | (gg << 8) | bb).toString(16).padStart(6, '0');
  }
  function makeDeterministicUiAvatar(name, size=256){
    const bg = colorFromName(name);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name||"U")}&background=${bg}&color=fff&size=${size}`;
  }
  function makeDicebearUrl(style, seed, size=300){
    return `https://api.dicebear.com/6.x/${encodeURIComponent(style)}/svg?seed=${encodeURIComponent(seed)}&size=${size}`;
  }

  function pickUniqueFromArray(arr){
    if(!arr || !arr.length) return null;
    const order = arr.slice().sort(()=>Math.random()-0.5);
    for(const candidateRaw of order){
      const candidate = String(candidateRaw).trim();
      if(!candidate) continue;
      if(candidate.toLowerCase().includes("assets/admin.jpg")) continue;
      if(!UsedAvatarURLs.has(candidate)){
        UsedAvatarURLs.add(candidate);
        return candidate;
      }
    }
    const fallback = order[Math.floor(Math.random()*order.length)];
    const chosen = (String(fallback).toLowerCase().includes("assets/admin.jpg"))
      ? makeDeterministicUiAvatar("User_"+rand(99999))
      : fallback;
    UsedAvatarURLs.add(chosen);
    return chosen;
  }

  function buildUniqueAvatar(name){
    const pick = pickUniqueFromArray(MIXED_AVATAR_POOL);
    if(pick) return pick;

    try{
      const style = (random(AVATAR_SOURCES) && random(AVATAR_SOURCES).style) || "pixel-art";
      const dbSeed = (name && String(name).trim()) ? ('h' + hash32(name).toString(36)) : ('u' + rand(999999).toString(36));
      const db = makeDicebearUrl(style, dbSeed, 300);
      if(!UsedAvatarURLs.has(db)){ UsedAvatarURLs.add(db); return db; }
    }catch(e){}

    const ui = makeDeterministicUiAvatar(name, 256);
    if(!UsedAvatarURLs.has(ui)) UsedAvatarURLs.add(ui);
    return ui;
  }

  // ================= PERSONA GENERATOR =================
  function generateSyntheticPersona(){
    const gender = maybe(0.5) ? "male" : "female";
    const country = random(COUNTRIES);
    const name = buildUniqueName(gender);
    return {
      name,
      avatar: buildUniqueAvatar(name),
      isAdmin:false,
      gender,
      country,
      region: COUNTRY_GROUPS[country] || "western",
      personality: random(["hype","analytical","casual","quiet","aggressive"]),
      tone: random(["short","normal","long"]),
      timezoneOffset: rand(24)-12,
      rhythm: 0.5 + Math.random()*1.8,
      lastSeen: Date.now() - rand(6000000),
      memory: [],
      sentiment: random(["bullish","neutral","bearish"])
    };
  }

  // ================= BUILD POOL =================
  const INITIAL_SYNC = Math.min(400, Math.floor(TOTAL_PERSONAS * 0.25));
  for(let i=0;i<INITIAL_SYNC;i++) SyntheticPool.push(generateSyntheticPersona());

  (function fillRemaining(){
    const batch = 300;
    function batchFill(){
      const toDo = Math.min(batch, TOTAL_PERSONAS - SyntheticPool.length);
      for(let i=0;i<toDo;i++) SyntheticPool.push(generateSyntheticPersona());
      if(SyntheticPool.length < TOTAL_PERSONAS) setTimeout(batchFill, 120);
      else console.log("identity-personas: SyntheticPool fully built:", SyntheticPool.length);
    }
    setTimeout(batchFill, 120);
  })();

  // ================= COMMENT ENGINE =================
  function generateHumanComment(persona, baseText){
    let text = baseText || "Nice!";
    if(maybe(0.6)){
      const s=[]; for(let i=0;i<rand(3)+1;i++) s.push(random(SLANG[persona.region]||[]));
      text = s.join(" ") + " " + text;
    }
    if(persona.tone === "long") text += " — solid if volume confirms.";
    if(maybe(0.5)) text += " " + random(EMOJIS);
    return text;
  }

  function getLastSeenStatus(persona){
    const diff = Date.now() - persona.lastSeen;
    if(diff < 300000) return "online";
    if(diff < 3600000) return "last seen recently";
    if(diff < 86400000) return "last seen today";
    return "last seen long ago";
  }

  function getRandomPersona(){
    return SyntheticPool.length
      ? SyntheticPool[Math.floor(Math.random()*SyntheticPool.length)]
      : { name:"Guest", avatar: makeDeterministicUiAvatar("G") };
  }

  window.identity = window.identity || {};
  Object.assign(window.identity, {
    Admin,
    getRandomPersona,
    generateHumanComment,
    getLastSeenStatus,
    SyntheticPool,
    UsedAvatarURLs,
    EMOJIS,
    buildUniqueName,
    buildUniqueAvatar,
    pickUniqueFromArray
  });

  console.log("identity-personas initialized — pool:", SyntheticPool.length, "target:", TOTAL_PERSONAS);
})();
