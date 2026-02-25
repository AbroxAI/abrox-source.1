// identity-personas.js — ULTRA-REALISTIC UNIQUE AVATARS v7 (REGION-AWARE)
// ============================================================
// ELITE HUMAN-LIKE PERSONA ENGINE v7 — DYNAMIC, SCATTERED & REGION-SPECIFIC
// - 3000+ human avatar URLs
// - fully shuffled for realism
// - region-aware avatar distribution
// - hybrid: preloaded pool + dynamic expansion
// - deterministic fallback only if necessary
// - robust UsedAvatarURLs tracking + localStorage persistence
// ============================================================

(function(){
  // ================= ADMIN =================
  const Admin = { name: "Profit Hunter 🌐", avatar: "assets/admin.jpg", isAdmin: true, gender: "male", country: "GLOBAL", personality: "authority", tone: "direct", timezoneOffset: 0, memory: [] };

  // ================= COUNTRY GROUPS =================
  const COUNTRY_GROUPS = { US:"western", UK:"western", CA:"western", AU:"western", DE:"western", FR:"western", IT:"western",
    NG:"african", ZA:"african", GH:"african", IN:"asian", JP:"asian", KR:"asian", CN:"asian",
    BR:"latin", MX:"latin", AR:"latin", RU:"eastern", TR:"eastern" };
  const COUNTRIES = Object.keys(COUNTRY_GROUPS);

  // ================= NAME DATA =================
  const MALE_FIRST = ["Alex","John","Max","Leo","Sam","David","Liam","Noah","Ethan","James","Ryan","Michael","Daniel","Kevin","Oliver","William","Henry","Jack","Mason","Lucas","Elijah","Benjamin","Sebastian","Logan","Jacob","Wyatt","Carter","Julian","Luke","Isaac","Nathan","Aaron","Adrian","Victor","Caleb","Dominic","Xavier","Evan","Connor","Jason","Owen","Thomas","Charles","Jeremiah","Dylan","Zachary","Gabriel","Nicholas","Christian","Austin","Brandon","Ian","Colin","Rafael","Marcus","Simon","Tobias","Victoriano"];
  const FEMALE_FIRST = ["Maria","Lily","Emma","Zoe","Ivy","Sophia","Mia","Olivia","Ava","Charlotte","Amelia","Ella","Grace","Chloe","Hannah","Aria","Scarlett","Luna","Ruby","Sofia","Emily","Layla","Nora","Victoria","Aurora","Isabella","Madison","Penelope","Camila","Stella","Hazel","Violet","Savannah","Bella","Claire","Sienna","Juliet","Evelyn","Maya","Naomi","Alice","Serena","Daphne","Leah","Miriam"];
  const LAST_NAMES = ["Smith","Johnson","Brown","Taylor","Anderson","Thomas","Jackson","White","Harris","Martin","Thompson","Garcia","Martinez","Robinson","Clark","Rodriguez","Lewis","Walker","Hall","Allen","Young","King","Wright","Scott","Green","Baker","Adams","Nelson","Hill","Campbell","Mitchell","Carter","Roberts","Gonzalez","Perez","Edwards","Collins","Stewart","Sanchez","Morris","Rogers","Reed","Cook","Morgan","Bell","Murphy","Bailey","Rivera","Cooper","Richardson","Cox","Howard","Ward","Flores"];
  const CRYPTO_ALIASES = ["BlockKing","PumpMaster","CryptoWolf","FomoKing","Hodler","TraderJoe","BitHunter","AltcoinAce","ChainGuru","DeFiLord","MetaWhale","CoinSniper","YieldFarmer","NFTDegen","ChartWizard","TokenShark","AirdropKing","WhaleHunter","BullRider","BearBuster","SatoshiFan","GasSaver","MoonChaser","RektRecover","Nodesman","LiquidityLord","OnChainOwl"];
  const TITLES = ["Trader","Investor","HODLer","Analyst","Whale","Shark","Mooner","Scalper","SwingTrader","DeFi","Miner","Blockchain","NFT","Quant","Signals","Mentor","Founder","CTO","RiskMgr","Ops"];

  // ================= EMOJIS =================
  const EMOJIS = ["💸","🔥","💯","✨","😎","👀","📈","🚀","💰","🤑","🎯","🏆","🤖","🎉","🍀","📊","⚡","💎","👑","🦄","🧠","🔮","🪙","🥂","💡","🛸","📉","📱","💬","🙌","👏","👍","❤️","😂","😅","🤞","✌️","😴","🤩","😬","🤝","🧾","📌","🔔","⚠️","✅","❌","📎","🧩","🪙","🔗","🔒","🌕","🌑","🌟","🏁","💹","🏦","🧭","🧯"];

  // ================= SLANG =================
  const SLANG = {
    western:["bro","ngl","lowkey","fr","tbh","wild","solid move","bet","dope","lit","clutch","savage","meme","cheers","respect","hype","flex","mad","cap","no cap","real talk","yo","fam","legit","sick"],
    african:["my guy","omo","chai","no wahala","sharp move","gbam","yawa","sweet","jollof","palava","chop","fine boy","hustle","ehen","kolo","sisi","big man","on point","correct","naija","bros","guyz"],
    asian:["lah","brother","steady","respect","solid one","ok lah","si","good move","ganbatte","wa","neat","ke","nice one","yah","cool","aiyo","steady bro"],
    latin:["amigo","vamos","muy bueno","fuerte move","dale","epa","buenisimo","chevere","que pasa","vamo","oye","pura vida","mano","buena","vamos ya","olé"],
    eastern:["comrade","strong move","not bad","serious play","da","top","nu","excellent","good work","correct","bravo","fine","nice move","pro","cheers"]
  };

  // ================= AVATAR SOURCES =================
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
  let MIXED_AVATAR_POOL = [];
  let REGION_AVATAR_POOL = { western: [], african: [], asian: [], latin: [], eastern: [] };

  function initializeAvatarPool(){
    MIXED_AVATAR_POOL = [];
    // pravatar
    for(let i=1;i<=200;i++) MIXED_AVATAR_POOL.push(`https://i.pravatar.cc/300?img=${i}`);
    // randomuser
    for(let i=1;i<=200;i++){
      MIXED_AVATAR_POOL.push(`https://randomuser.me/api/portraits/men/${i}.jpg`);
      MIXED_AVATAR_POOL.push(`https://randomuser.me/api/portraits/women/${i}.jpg`);
    }
    // picsum
    ["alpha","bravo","charlie","delta","echo","foxtrot","golf","hotel","india","juliet","kilo","lima","mike","november","oscar","papa","quebec","romeo","sierra","tango","uniform","victor","whiskey","xray","yankee","zulu","nova","luna","astra","cosmo","orion","phoenix","vortex","nebula","galaxy","comet","meteor","eclipse","sol","terra","aether","zephyr","aurora","celeste"].forEach(seed=>{
      MIXED_AVATAR_POOL.push(`https://picsum.photos/seed/${seed}/300/300`);
    });
    // robohash
    for(let i=0;i<50;i++) MIXED_AVATAR_POOL.push(`https://robohash.org/seed_${i}.png`);
    // multiavatar
    for(let i=0;i<50;i++) MIXED_AVATAR_POOL.push(`https://api.multiavatar.com/seed${i}.png`);
    // ui avatars
    for(let i=0;i<200;i++) MIXED_AVATAR_POOL.push(`https://ui-avatars.com/api/?name=U${i}&background=random&size=256`);

    // shuffle the full pool
    for(let i=MIXED_AVATAR_POOL.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [MIXED_AVATAR_POOL[i],MIXED_AVATAR_POOL[j]]=[MIXED_AVATAR_POOL[j],MIXED_AVATAR_POOL[i]];
    }

    // distribute avatars into region buckets
    const regions = Object.keys(REGION_AVATAR_POOL);
    MIXED_AVATAR_POOL.forEach((url, idx) => {
      const region = regions[idx % regions.length];
      REGION_AVATAR_POOL[region].push(url);
    });

    // shuffle each region pool
    regions.forEach(region => {
      const pool = REGION_AVATAR_POOL[region];
      for(let i=pool.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [pool[i],pool[j]]=[pool[j],pool[i]];
      }
    });
  }
  initializeAvatarPool();

  // ================= TRACKERS =================
  const TOTAL_PERSONAS = Math.max(300, Math.min((window.REALISM_CONFIG && window.REALISM_CONFIG.TOTAL_PERSONAS)||3000, 100000));
  const SyntheticPool = [];
  const AVATAR_PERSIST_KEY = "abrox_used_avatars_v7";
  const UsedAvatarURLs = new Set();
  (function(){ try{ const raw=localStorage.getItem(AVATAR_PERSIST_KEY); if(raw){ const arr=JSON.parse(raw); if(Array.isArray(arr)) arr.forEach(u=>UsedAvatarURLs.add(u)); } }catch(e){console.warn("identity: loadUsedAvs failed",e);} })();
  function saveUsedAvs(){ try{ localStorage.setItem(AVATAR_PERSIST_KEY,JSON.stringify(Array.from(UsedAvatarURLs))); }catch(e){console.warn("identity: saveUsedAvs failed",e);} }
  setInterval(saveUsedAvs,1000*60*2);
  window.addEventListener("beforeunload",saveUsedAvs);

  // ================= UTILITIES =================
  function random(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function maybe(p){ return Math.random()<p; }
  function rand(max=9999){ return Math.floor(Math.random()*max); }

  // ================= UNIQUE NAME =================
  const UsedNames = new Set();
  function buildUniqueName(gender){
    let base;
    if(maybe(0.18)){
      base=random(CRYPTO_ALIASES)+(maybe(0.6)?" "+random(TITLES):"");
      if(maybe(0.6)) base+=" "+rand(999);
      if(maybe(0.5)) base+=" "+random(EMOJIS);
      if(UsedNames.has(base)&&maybe(0.6)) base+="."+rand(99);
    } else {
      base=(gender==="male"?random(MALE_FIRST):random(FEMALE_FIRST))+" "+random(LAST_NAMES);
      if(maybe(0.55)) base+=" "+random(TITLES);
      if(maybe(0.6)) base+=" "+rand(999);
      if(maybe(0.45)) base=base.replace(/\s+/g,maybe(0.5)?"_":".");
      if(maybe(0.5)) base+=" "+random(EMOJIS);
    }
    let candidate=base.trim(), guard=0;
    while(UsedNames.has(candidate)&&guard<10){ candidate=base.trim()+"_"+rand(9999); guard++; }
    UsedNames.add(candidate);
    return candidate;
  }

  // ================= UNIQUE AVATAR =================
  function buildUniqueAvatar(name, region){
    region = region || "western";
    let pick = null;
    let pool = REGION_AVATAR_POOL[region] || [];

    while(pool.length){
      const idx = Math.floor(Math.random()*pool.length);
      const candidate = pool.splice(idx, 1)[0];
      if(!UsedAvatarURLs.has(candidate)){ UsedAvatarURLs.add(candidate); pick=candidate; break; }
    }

    if(!pick && MIXED_AVATAR_POOL.length){
      const idx = Math.floor(Math.random()*MIXED_AVATAR_POOL.length);
      pick = MIXED_AVATAR_POOL.splice(idx, 1)[0];
      UsedAvatarURLs.add(pick);
    }

    if(!pick){
      const seed = "dyn"+rand(999999);
      pick = `https://i.pravatar.cc/300?u=${seed}`;
      UsedAvatarURLs.add(pick);
    }

    return pick;
  }

  function hash32(str){ let h=2166136261>>>0; for(let i=0;i<str.length;i++) h=Math.imul(h^str.charCodeAt(i),16777619); return h>>>0; }
  function colorFromName(name){ const h=hash32(String(name||"").toLowerCase()); const r=((h&0xFF0000)>>>16)&0xFF; const g=((h&0x00FF00)>>>8)&0xFF; const b=((h&0x0000FF)&0xFF); const rr=Math.min(220, Math.max(30, Math.floor((r+30)*0.9))); const gg=Math.min(220, Math.max(30, Math.floor((g+30)*0.9))); const bb=Math.min(220, Math.max(30, Math.floor((b+30)*0.9))); return ((rr<<16)|(gg<<8)|bb).toString(16).padStart(6,"0"); }
  function makeDeterministicUiAvatar(name,size=256){ const bg=colorFromName(name); return `https://ui-avatars.com/api/?name=${encodeURIComponent(name||"U")}&background=${bg}&color=fff&size=${size}`; }
  function makeDicebearUrl(style,seed,size=300){ return `https://api.dicebear.com/6.x/${encodeURIComponent(style)}/svg?seed=${encodeURIComponent(seed)}&size=${size}`; }

  // ================= PERSONA GENERATOR =================
  function generateSyntheticPersona(){
    const gender=maybe(0.5)?"male":"female";
    const country=random(COUNTRIES);
    const region=COUNTRY_GROUPS[country]||"western";
    const name=buildUniqueName(gender);
    return { 
      name, 
      avatar:buildUniqueAvatar(name, region), 
      isAdmin:false, 
      gender, 
      country, 
      region, 
      personality:random(["hype","analytical","casual","quiet","aggressive"]), 
      tone:random(["short","normal","long"]), 
      timezoneOffset:rand(24)-12, 
      rhythm:0.5+Math.random()*1.8, 
      lastSeen:Date.now()-rand(6000000), 
      memory:[], 
      sentiment:random(["bullish","neutral","bearish"]) 
    };
  }

  const INITIAL_SYNC=Math.min(800, Math.floor(TOTAL_PERSONAS*0.3));
  const SyntheticPool = [];
  for(let i=0;i<INITIAL_SYNC;i++) SyntheticPool.push(generateSyntheticPersona());
  (function fillRemaining(){
    const batch=500;
    function batchFill(){
      const toDo=Math.min(batch,TOTAL_PERSONAS-SyntheticPool.length);
      for(let i=0;i<toDo;i++) SyntheticPool.push(generateSyntheticPersona());
      if(SyntheticPool.length<TOTAL_PERSONAS) setTimeout(batchFill,120);
      else console.log("identity-personas v7: SyntheticPool fully built:",SyntheticPool.length);
    }
    setTimeout(batchFill,120);
  })();

  function generateHumanComment(persona,baseText){
    let text=baseText||"Nice!";
    if(maybe(0.6)){
      const s=[];
      for(let i=0;i<rand(3)+1;i++) s.push(random(SLANG[persona.region]||[]));
      text=s.join(" ")+" "+text;
    }
    if(persona.tone==="long") text+=" — solid if volume confirms.";
    if(maybe(0.5)) text+=" "+random(EMOJIS);
    return text;
  }
  function getLastSeenStatus(persona){
    const diff=Date.now()-persona.lastSeen;
    if(diff<300000) return "online";
    if(diff<3600000) return "last seen recently";
    if(diff<86400000) return "last seen today";
    return "last seen long ago";
  }
  function getRandomPersona(){ return SyntheticPool.length?SyntheticPool[Math.floor(Math.random()*SyntheticPool.length)]:{ name:"Guest", avatar:makeDeterministicUiAvatar("G") }; }

  window.identity=window.identity||{};
  Object.assign(window.identity,{
    Admin,
    getRandomPersona,
    generateHumanComment,
    getLastSeenStatus,
    SyntheticPool,
    UsedAvatarURLs,
    EMOJIS,
    buildUniqueName,
    buildUniqueAvatar
  });

  console.log("identity-personas v7 (region-aware) initialized — pool:",SyntheticPool.length,"target:",TOTAL_PERSONAS);
})();
