// realism-engine-v11.js — ULTRA-REALISM ENGINE V11 (with variable typing durations)

(function(){

/* =====================================================
   FULL ORIGINAL DATA POOLS
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
   DEDUPE
===================================================== */

const GENERATED = new Set();
const QUEUE = [];

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

/* =====================================================
   GENERATION
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
   POOL & JOINER REACTIVE
===================================================== */

const POOL = [];
window.realismEngineV11Pool = POOL;
window.realismEngineV11EMOJIS = EMOJIS;

function ensurePool(min=2000){
  while(POOL.length < min){
    POOL.push(generateComment());
    if(POOL.length > 10000) break;
  }
}

// React to joiner-simulator messages
window.addEventListener("joiner:new", (ev)=>{
  const joiner = ev.detail;
  if(!joiner || !joiner.name) return;

  const replyCount = 1 + Math.floor(Math.random()*3);
  for(let i=0;i<replyCount;i++){
    const persona = window.identity?.getRandomPersona?.() || { name:"User", avatar:`https://ui-avatars.com/api/?name=U` };
    const baseText = `Welcome ${joiner.name}! ${random(TESTIMONIALS)}`;
    POOL.push({ text: baseText, timestamp: new Date(), persona });
  }
});

/* =====================================================
   SAFE APPEND
===================================================== */

function appendSafe(persona,text,opts={}){
  if(window.TGRenderer?.appendMessage){
    return window.TGRenderer.appendMessage(persona,text,opts);
  }
  return null;
}

/* =====================================================
   TYPING DELAY BASED ON MESSAGE LENGTH
===================================================== */

function getTypingDelay(text){
  if(!text) return 600 + Math.random()*400;
  const base = 400;
  const perChar = 35;
  const randomFactor = Math.random()*300;
  return Math.min(8000, base + text.length*perChar + randomFactor);
}

/* =====================================================
   TRUE REPLY LOGIC
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
   POSTING
===================================================== */

function post(count=1){
  ensurePool(Math.max(1000,count));
  for(let i=0;i<count;i++){
    const item = POOL.shift();
    if(!item) break;

    const delay = getTypingDelay(item.text);

    setTimeout(()=>{
      const persona = item.persona || window.identity?.getRandomPersona?.() || { name:"User", avatar:`https://ui-avatars.com/api/?name=U` };

      if(window.TGRenderer?.showTyping) window.TGRenderer.showTyping(persona);

      // Trigger ultra-real header typing
      document.dispatchEvent(new CustomEvent('headerTyping', { detail: { name: persona.name } }));

      let replyData = {};
      if(maybe(0.28)){
        const existing = getRandomExistingMessage();
        if(existing) replyData = existing;
      }

      appendSafe(persona,item.text,{
        timestamp:item.timestamp,
        type:"incoming",
        id:`realism_${Date.now()}_${rand(9999)}`,
        ...replyData
      });

    }, delay);

  }
}

/* =====================================================
   SCHEDULER
===================================================== */

let started=false;

function schedule(){
  const min=20000;
  const max=90000;
  const interval=min+Math.random()*(max-min);
  setTimeout(()=>{
    post(1);
    schedule();
  },interval);
}

function simulate(){
  if(started) return;
  started=true;
  schedule();
}

/* =====================================================
   START
===================================================== */

setTimeout(()=>{
  ensurePool(2000);
  post(60);
  simulate();
  console.log("Realism Engine V11 FULL — Joiner-reactive dynamic replies with variable typing durations active.");
},900);

})();
