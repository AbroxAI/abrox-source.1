// realism-engine-v11-human-fixed-sync.js — ULTRA-REALISM ENGINE V11 (fully queued typing + staggered crowd + self-replies + humanized typing)
(function(){

/* =====================================================
   DATA POOLS
===================================================== */

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
  "Consistent 5–10% daily growth",
  "Doubled small account this week",
  "Low drawdown strategy works",
  "Finally profitable after months",
  "Swing trades hitting clean targets",
  "Abrox nailed the breakout entry",
  "Risk management improved massively",
  "Caught gold rally early",
  "Crypto volatility handled perfectly",
  "London session was smooth today",
  "NY open signals were sharp",
  "Good for swing entries into trend"
];

const EMOJIS = [
  "💸","🔥","💯","✨","😎","👀","📈","🚀","💰","🤑","🎯","🏆","🤖","🎉","🍀","📊","⚡","💎","👑","🦄",
  "🧠","🔮","🪙","🥂","💡","🛸","📉","📱","💬","🙌","👏","👍","❤️","😂","😅","🤞","✌️","😴","🤩",
  "😬","🤝","🧾","📌","🔔","⚠️","✅","❌","📎","🧩","🔗","🔒","🌕","🌑","🌟","🏁","💹","🏦","🧭","🧯",
  "🧨","📣","💤","🕐","🕒","🕘","🕛","🕓","🧿","🎚️","📬","🎲","📡","🪄","🧰","🔭","🌊","🌪️","🌤️","🛰️"
];

/* =====================================================
   UTILITIES
===================================================== */

function random(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function maybe(p){ return Math.random() < p; }
function rand(max=9999){ return Math.floor(Math.random()*max); }

function hash(str){
  let h = 5381;
  for(let i=0;i<str.length;i++) h = ((h<<5)+h)+str.charCodeAt(i);
  return (h>>>0).toString(36);
}

/* =====================================================
   DEDUPE & QUEUE
===================================================== */

const GENERATED = new Set();
const QUEUE = [];
const POOL = [];
window.realismEngineV11Pool = POOL;
window.realismEngineV11EMOJIS = EMOJIS;

function mark(text){
  const fp = hash(text.toLowerCase());
  if(GENERATED.has(fp)) return false;
  GENERATED.add(fp);
  QUEUE.push(fp);
  while(QUEUE.length > 50000){
    GENERATED.delete(QUEUE.shift());
  }
  return true;
}

function ensurePool(min=2000){
  while(POOL.length < min){
    POOL.push(generateComment());
    if(POOL.length > 10000) break;
  }
}

/* =====================================================
   COMMENT GENERATION
===================================================== */

function generateTimestamp(days=120){
  return new Date(Date.now() - Math.random()*days*86400000);
}

function generateComment(){
  const templates = [
    () => `Guys, ${random(TESTIMONIALS)}`,
    () => `Anyone trading ${random(ASSETS)} on ${random(BROKERS)}?`,
    () => `Signal for ${random(ASSETS)} ${random(TIMEFRAMES)} is ${random(RESULT_WORDS)}`,
    () => `Abrox alerted ${random(ASSETS)} ${random(TIMEFRAMES)} — ${random(RESULT_WORDS)}`,
    () => `Closed ${random(ASSETS)} on ${random(TIMEFRAMES)} — ${random(RESULT_WORDS)}`,
    () => `Scalped ${random(ASSETS)} on ${random(BROKERS)}, result ${random(RESULT_WORDS)}`,
    () => `Testimonial: ${random(TESTIMONIALS)}`
  ];

  let text = random(templates)();

  if(maybe(0.35)){
    const extras = ["good execution","tight stop","wide stop","no slippage","perfect timing","partial TP hit"];
    text += " — " + random(extras);
  }

  if(maybe(0.45)) text += " " + random(EMOJIS);

  let tries = 0;
  while(!mark(text) && tries < 30){
    text += " " + rand(999);
    tries++;
  }

  return { text, timestamp: generateTimestamp() };
}

/* =====================================================
   HUMANIZED TYPING QUEUE
===================================================== */

let typingQueue = Promise.resolve();

function humanTypingDuration(message){
  if(!message) return 400;
  const len = message.length;
  let duration = 0;

  if(len <= 5) duration = 300 + Math.random()*200;
  else if(len <= 20) duration = 500 + len*50 + Math.random()*200;
  else duration = 1000 + len*35 + Math.random()*400;

  if(duration>7000) duration=7000;
  return Math.floor(duration);
}

function queuedTyping(persona,message){
  typingQueue = typingQueue.then(()=>{
    const duration = humanTypingDuration(message);
    return window.TGRenderer?.showTyping?.(persona,message,duration) || Promise.resolve();
  });
  return typingQueue;
}

// clear any typing immediately after a message is sent
document.addEventListener("messageAppended", (ev)=>{
  window.TGRenderer?.hideTyping();
  typingQueue = Promise.resolve();
});

/* =====================================================
   POST MESSAGE
===================================================== */

async function postMessage(item){
  const persona = item.persona || window.identity?.getRandomPersona?.() || { name:"User", avatar:`https://ui-avatars.com/api/?name=U` };

  // Dispatch header typing
  document.dispatchEvent(new CustomEvent('headerTyping',{ detail:{ name: persona.name } }));

  // Wait for typing before appending
  await queuedTyping(persona,item.text);

  // Decide replies
  let replyData = {};
  if(maybe(0.28)){
    const existing = getRandomExistingMessage();
    if(existing) replyData = existing;
  }
  if(maybe(0.12)){
    const selfMessages = Array.from(document.querySelectorAll('.tg-bubble'))
      .filter(b=>b.dataset.persona===persona.name);
    if(selfMessages.length){
      const selfTarget = selfMessages[Math.floor(Math.random()*selfMessages.length)];
      const selfText = selfTarget.querySelector('.tg-bubble-text')?.textContent;
      if(selfText) replyData={ replyToId: selfTarget.dataset.id, replyToText: selfText.slice(0,120) };
    }
  }

  appendSafe(persona,item.text,{
    timestamp:item.timestamp,
    type:"incoming",
    id:`realism_${Date.now()}_${rand(9999)}`,
    ...replyData
  });
}

/* =====================================================
   RANDOM EXISTING MESSAGE HELPER
===================================================== */

function getRandomExistingMessage(){
  const messages = Array.from(document.querySelectorAll('.tg-bubble'));
  if(messages.length < 5) return null;
  const target = messages[Math.floor(Math.random() * messages.length)];
  const id = target.dataset.id;
  const text = target.querySelector('.tg-bubble-text')?.textContent;
  if(!id || !text) return null;
  return { replyToId: id, replyToText: text.slice(0,120) };
}

/* =====================================================
   CROWD SIMULATION
===================================================== */

async function simulateCrowd(count = 60, minDelay=400, maxDelay=1200){
  ensurePool(count);
  for(let i=0;i<count;i++){
    const item = POOL.shift();
    if(!item) break;
    await postMessage(item);
    const pause = minDelay + Math.random()*(maxDelay-minDelay);
    await new Promise(res=>setTimeout(res,pause));
  }
}

/* =====================================================
   SCHEDULER
===================================================== */

let started=false;
function schedule(){
  const min=20000;
  const max=90000;
  const interval = min + Math.random()*(max-min);
  setTimeout(async ()=>{
    await simulateCrowd(1);
    schedule();
  }, interval);
}

function simulate(){
  if(started) return;
  started=true;
  simulateCrowd(60,400,1200); // initial staggered crowd
  schedule();                  // continuous schedule
}

/* =====================================================
   SAFE APPEND
===================================================== */

function appendSafe(persona,text,opts={}){
  if(window.TGRenderer?.appendMessage){
    window.TGRenderer.hideTyping(); // clear typing
    return window.TGRenderer.appendMessage(persona,text,opts);
  }
  return null;
}

/* =====================================================
   START ENGINE
===================================================== */

setTimeout(async ()=>{
  ensurePool(2000);
  await simulateCrowd(60,400,1200);
  simulate();
  console.log("✅ Realism Engine V11 fully synced — humanized typing, queued, cleared after member message, messages follow typing.");
},900);

})();
