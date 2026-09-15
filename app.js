// Sur — app logic. Backed by Supabase (Postgres + Realtime + Anonymous Auth).
// See supabase-schema.sql for the tables this reads and writes, and README.md
// for the two dashboard settings this needs turned on before it will work.

// ================= data =================
const DIMS = [
  {k:"warmth",   n:"Warmth",      hi:"expressive",  lo:"reserved",   kind:"temper"},
  {k:"steady",   n:"Steadiness",  hi:"unshakeable", lo:"feels it all", kind:"temper"},
  {k:"curious",  n:"Curiosity",   hi:"explorer",    lo:"settled",    kind:"value"},
  {k:"social",   n:"Sociability", hi:"the host",    lo:"the listener", kind:"temper"},
  {k:"drive",    n:"Drive",       hi:"ambitious",   lo:"easygoing",  kind:"value"},
  {k:"rooted",   n:"Rootedness",  hi:"family-first",lo:"self-made",  kind:"value"},
];
const Q = [
  [0,"I say “I love you” (or my version of it) easily and often.",false],
  [0,"When someone close to me is upset, I feel it in my own body.",false],
  [0,"I find it hard to show affection where others can see.",true],
  [0,"Friends come to me when they need to be comforted.",false],
  [1,"When plans fall apart, I stay calm and simply re-plan.",false],
  [1,"A small criticism can stay with me for days.",true],
  [1,"I can sit with a difficult feeling without needing to act on it.",false],
  [1,"A stressful week at work spills into my relationships.",true],
  [2,"I would rather try a new restaurant than go back to a favourite.",false],
  [2,"I enjoy conversations that change my mind.",false],
  [2,"I like my routines and see no reason to change them.",true],
  [2,"Moving to a new city sounds exciting, not scary.",false],
  [3,"A weekend full of people leaves me energised.",false],
  [3,"I am usually the one who gets the group together.",false],
  [3,"After a big gathering I need a day alone to recover.",true],
  [3,"I make friends easily wherever I go.",false],
  [4,"My career is one of the most important things in my life.",false],
  [4,"I set goals for myself and actually track them.",false],
  [4,"I am happy with “good enough” if it means more free time.",true],
  [4,"I want a partner who is as ambitious as I am.",false],
  [5,"My family's opinion matters a lot in my big decisions.",false],
  [5,"I would like to live close to my parents as I grow older.",false],
  [5,"Festivals and family rituals matter to me.",false],
  [5,"I would rather build my own traditions than inherit them.",true],
];
const NPC = [
  ["Ananya",27,"W",["M"],"Bengaluru","M","I plan the trip, then lose the itinerary on purpose.",[4.2,3.0,4.5,4.0,4.0,3.5]],
  ["Meera",29,"W",["M"],"Pune","M","Sunday means my mother's kitchen, no exceptions.",[4.5,4.0,2.5,3.0,3.0,4.8]],
  ["Ritika",26,"W",["M","W"],"Delhi","L","I read the last page first. I like knowing where things go.",[3.5,2.5,3.0,2.5,4.5,2.5]],
  ["Sana",31,"W",["M"],"Hyderabad","M","Calm is a skill I practised. Ask me about 2019.",[3.8,4.7,3.5,2.8,3.8,3.8]],
  ["Priya",28,"W",["M"],"Mumbai","O","Loud laugh, quiet mornings.",[4.7,3.2,4.0,4.6,3.4,3.9]],
  ["Ishita",25,"W",["M","W","N"],"Kolkata","L","I will argue about films for hours and mean none of it.",[3.9,2.8,4.6,3.8,2.9,2.4]],
  ["Nandini",30,"W",["M"],"Chennai","M","I want a house with a swing and my parents down the road.",[4.4,3.9,2.4,3.3,3.2,4.9]],
  ["Kavya",27,"W",["M"],"Bengaluru","O","Startup hours, temple on Tuesdays.",[3.4,3.4,3.8,3.6,4.8,4.1]],
  ["Zoya",29,"W",["M"],"Lucknow","M","Poetry in the morning, spreadsheets by noon.",[4.6,3.6,3.7,2.6,4.2,3.6]],
  ["Diya",24,"W",["M","W"],"Goa","L","If I am not near water I get restless.",[3.7,2.4,4.9,4.2,2.6,2.1]],
  ["Aditi",32,"W",["M"],"Gurugram","M","Ten-year plan, revised quarterly.",[3.0,4.2,3.2,3.4,4.9,3.7]],
  ["Shreya",26,"W",["W"],"Mumbai","L","I remember everyone's birthday and no one's surname.",[4.8,3.1,3.6,4.4,3.1,3.3]],
  ["Tara",28,"W",["M","N"],"Bengaluru","O","Introvert with a very good excuse for every party.",[4.1,4.3,3.9,1.9,3.6,2.8]],
  ["Pooja",30,"W",["M"],"Jaipur","M","Family first, always, and then chai.",[4.3,3.7,2.2,3.5,2.8,4.9]],
  ["Anjali",27,"W",["M"],"Noida","O","I cry at ads and negotiate like a shark.",[4.9,2.2,3.5,3.7,4.4,3.4]],
  ["Riya",25,"W",["W","N"],"Pune","L","Weekend hikes, weekday deadlines.",[3.6,3.8,4.4,3.9,4.1,2.7]],
  ["Lakshmi",33,"W",["M"],"Coimbatore","M","I am the steady one. Someone has to be.",[3.9,4.9,2.6,2.7,3.3,4.6]],
  ["Naina",29,"W",["M"],"Chandigarh","M","I'll host forty people and not sleep the night before.",[4.4,2.6,3.4,4.8,3.5,4.2]],
  ["Aarav",29,"M",["W"],"Bengaluru","M","I will cook if you will taste honestly.",[4.3,3.8,3.9,3.4,4.0,3.9]],
  ["Vihaan",27,"M",["W"],"Mumbai","O","Product manager by day, terrible guitarist by night.",[3.8,3.3,4.4,4.3,4.5,2.9]],
  ["Kabir",31,"M",["W"],"Delhi","M","My parents are my best friends. I know how that sounds.",[4.6,4.1,2.7,3.6,3.4,4.9]],
  ["Rohan",28,"M",["W","M"],"Pune","L","Marathons and mystery novels.",[3.2,4.5,3.6,2.4,4.3,2.6]],
  ["Arjun",30,"M",["W"],"Hyderabad","M","I would move cities for the right person, not the right job.",[4.5,3.6,4.3,3.2,3.0,3.7]],
  ["Dev",26,"M",["W","N"],"Goa","L","Surfing, coding, sleeping. In that order.",[3.4,3.0,4.8,3.9,2.7,1.9]],
  ["Siddharth",33,"M",["W"],"Gurugram","M","Founder. Recovering workaholic. Learning to rest.",[3.1,3.1,3.5,3.0,4.9,3.4]],
  ["Karan",28,"M",["W"],"Chandigarh","O","Big family, bigger weddings, I love all of it.",[4.7,3.4,3.0,4.9,3.2,4.7]],
  ["Nikhil",29,"M",["M"],"Mumbai","L","Quiet dinners over loud bars, every time.",[4.2,4.4,3.4,2.3,3.7,3.1]],
  ["Ayaan",27,"M",["W"],"Lucknow","M","Ghazals, cricket, and my nani's recipes.",[4.8,3.5,3.1,3.7,3.3,4.6]],
  ["Ishaan",25,"M",["W","M","N"],"Bengaluru","O","I ask too many questions. It's a feature.",[3.9,2.7,4.9,4.1,3.6,2.3]],
  ["Rahul",32,"M",["W"],"Chennai","M","Engineer. Plans everything. Secretly sentimental.",[3.7,4.6,2.8,2.9,4.4,4.3]],
  ["Advait",30,"M",["W"],"Pune","M","I keep a garden. It taught me patience.",[4.4,4.8,3.3,2.6,3.2,4.1]],
  ["Yash",26,"M",["W"],"Jaipur","L","I'll drive six hours for good dal baati.",[4.1,3.2,4.2,4.5,2.8,3.8]],
  ["Manav",31,"M",["W"],"Noida","M","Steady job, loud laugh, wants two kids and a dog.",[4.5,4.2,2.9,3.9,3.6,4.5]],
  ["Farhan",28,"M",["W"],"Kolkata","O","Films, debates, long walks that go nowhere.",[4.0,3.0,4.6,3.5,3.1,2.8]],
  ["Sam",29,"N",["W","N","M"],"Bengaluru","L","I collect maps of places I haven't been yet.",[3.8,3.6,4.7,3.1,3.5,2.2]],
  ["Jai",27,"N",["N","W"],"Mumbai","O","Therapist. Yes, I'm listening. No, I'm not analysing you.",[4.7,4.5,3.8,2.8,3.4,2.9]],
  ["Neel",34,"M",["W"],"Bengaluru","M","Two startups down, one marriage up, hopefully.",[3.5,3.9,3.7,3.3,4.7,3.6]],
  ["Vedant",26,"M",["W"],"Indore","M","Homebody who will follow you anywhere.",[4.6,4.0,2.5,2.4,2.9,4.7]],
];
const REASONS = ["Too far from me","Not ambitious enough","Too intense","Want someone calmer","Want more family-focus","Just no spark"];
const NPC_REPLY_FALLBACK = [
  "Haha, I like that.", "Tell me more — I'm actually curious.",
  "That's such a specific thing to say. I mean that as a compliment.",
  "Okay, that made me smile at my phone like an idiot.",
  "Same page, I think. Keep going.",
  "I wasn't expecting to be asked that today, but I like it.",
];
const W = [1.0,0.8,1.2,0.8,1.5,2.0];

// ================= supabase + identity =================
const sb = window.supabase.createClient(window.SUR_CONFIG.SUPABASE_URL, window.SUR_CONFIG.SUPABASE_ANON_KEY);
let uid = null;

// ================= dom helpers =================
const $ = s => document.querySelector(s);
const LS = "sur.app.v1";
let state = load() || {user:{}, answers:Array(Q.length).fill(null), i:0, passed:[]};
function save(){ try{ localStorage.setItem(LS, JSON.stringify(state)); }catch(e){} }
function load(){ try{ const s = JSON.parse(localStorage.getItem(LS)); return s && s.answers && s.answers.length===Q.length ? s : null; }catch(e){ return null; } }
function show(id){ document.querySelectorAll(".screen").forEach(s=>s.classList.toggle("on", s.id===id)); const sc=$("#"+id); if(sc) sc.scrollTop=0; }
function toast(t){ const el=$("#toast"); el.textContent=t; el.classList.add("show"); setTimeout(()=>el.classList.remove("show"),2200); }
function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }
function esc(s){ return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]); }
function nowIso(){ return new Date().toISOString(); }

let currentCand=null, msgChannel=null, callChannel=null, recipChannel=null, matchChannel=null;

// ================= boot / auth =================
(async function init(){
  wireIntroForm();
  wireStaticHandlers();
  wirePhoneOtpHandlers();
  try{
    const { data:{ session } } = await sb.auth.getSession();
    if(session){ uid = session.user.id; await afterLogin(); }
    else { show("s-brand"); }
  }catch(e){
    console.error("Auth check failed", e);
    show("s-brand");
  }
})();

// Runs once we have a real, phone-verified session — either just now, or
// resumed from a previous visit.
async function afterLogin(){
  await hydrateFromServer();
  if(state.vec) publishProfile().catch(()=>{});
  watchForMatches();
  resume();
}

// If this device has no local quiz progress but this phone number already
// has a profile in Supabase (e.g. they registered on another device),
// pull it down instead of making them redo the 24 questions.
async function hydrateFromServer(){
  if(state.vec) return;
  try{
    const { data } = await sb.from("profiles").select("*").eq("id", uid).maybeSingle();
    if(data){
      state.user = { name:data.name, age:String(data.age), gender:data.gender, seek: (data.seek||[]).length>1?"A":(data.seek||["W"])[0], city:data.city, intent:data.intent, bio:data.bio };
      state.vec = data.vector;
      state.answers = Array(Q.length).fill(4);
      save();
    }
  }catch(e){ console.error("hydrateFromServer", e); }
}

// ================= phone + OTP registration =================
let pendingPhone = null, resendTimer = null;
function wirePhoneOtpHandlers(){
  $("#b-brand-start").onclick = ()=> show("s-phone");
  const phoneEl = $("#f-phone");
  phoneEl.oninput = ()=>{
    phoneEl.value = phoneEl.value.replace(/\D/g,"").slice(0,10);
    $("#b-phone-send").disabled = phoneEl.value.length !== 10;
  };
  $("#b-phone-send").onclick = ()=> sendOtp(false);
  $("#b-otp-edit").onclick = ()=> show("s-phone");
  const otpEl = $("#f-otp");
  otpEl.oninput = ()=>{
    otpEl.value = otpEl.value.replace(/\D/g,"").slice(0,6);
    $("#b-otp-verify").disabled = otpEl.value.length !== 6;
    $("#otp-error").hidden = true;
  };
  $("#b-otp-verify").onclick = verifyOtpCode;
  $("#b-otp-resend").onclick = ()=>{ if(!$("#b-otp-resend").disabled) sendOtp(true); };
}
async function sendOtp(isResend){
  const phone = isResend && pendingPhone ? pendingPhone : ("+91" + $("#f-phone").value.trim());
  const sendBtn = $("#b-phone-send");
  if(sendBtn) sendBtn.disabled = true;
  const { error } = await sb.auth.signInWithOtp({ phone });
  if(sendBtn) sendBtn.disabled = false;
  if(error){
    console.error("signInWithOtp", error);
    toast(/provider|sms|not.*enabled/i.test(error.message) ? "SMS isn't connected on our end yet — try again once it is." : "Couldn't send the code. Check the number and try again.");
    return;
  }
  pendingPhone = phone;
  $("#otp-phone-display").textContent = phone;
  $("#f-otp").value=""; $("#b-otp-verify").disabled = true; $("#otp-error").hidden = true;
  show("s-otp");
  startResendCooldown();
}
function startResendCooldown(){
  let s = 30;
  const btn = $("#b-otp-resend");
  clearInterval(resendTimer);
  const tick = ()=>{ btn.textContent = s>0 ? `Resend code (${s}s)` : "Resend code"; btn.disabled = s>0; if(s<=0) clearInterval(resendTimer); s--; };
  tick(); resendTimer = setInterval(tick,1000);
}
async function verifyOtpCode(){
  const code = $("#f-otp").value.trim();
  $("#b-otp-verify").disabled = true;
  const { data, error } = await sb.auth.verifyOtp({ phone: pendingPhone, token: code, type: "sms" });
  if(error){
    console.error("verifyOtp", error);
    $("#otp-error").textContent = "That code didn't match. Check it and try again.";
    $("#otp-error").hidden = false;
    $("#b-otp-verify").disabled = false;
    return;
  }
  uid = data.user.id;
  clearInterval(resendTimer);
  await afterLogin();
}

// ================= intro form =================
function seg(id,key){
  const box=$(id);
  box.querySelectorAll("button").forEach(b=>{
    b.type="button";
    if(state.user[key]===b.dataset.v) b.classList.add("sel");
    b.onclick=()=>{ box.querySelectorAll("button").forEach(x=>x.classList.remove("sel")); b.classList.add("sel"); state.user[key]=b.dataset.v; checkIntro(); };
  });
}
function wireIntroForm(){
  seg("#f-gender","gender"); seg("#f-seek","seek"); seg("#f-intent","intent");
  ["name","age","city","bio"].forEach(k=>{ const el=$("#f-"+k); if(state.user[k]) el.value=state.user[k]; el.oninput=()=>{ state.user[k]=el.value.trim(); checkIntro(); }; });
  checkIntro();
  $("#b-start").onclick=()=>{ save(); state.i = state.answers.findIndex(a=>a===null); if(state.i<0) state.i=0; renderQ(); show("s-quiz"); };
}
function checkIntro(){ const u=state.user; $("#b-start").disabled = !(u.name && u.age>=18 && u.gender && u.seek && u.intent); }

// ================= quiz =================
function renderQ(){
  const [d,t]=Q[state.i];
  $("#q-dim").textContent=DIMS[d].n; $("#q-count").textContent=(state.i+1)+" / "+Q.length;
  $("#q-bar").style.width=((state.i)/Q.length*100)+"%";
  $("#q-text").textContent=t;
  $("#q-scale").querySelectorAll("button").forEach(b=>b.classList.toggle("sel", state.answers[state.i]==b.dataset.v));
  $("#q-back").disabled = state.i===0;
}
function wireStaticHandlers(){
  $("#q-scale").querySelectorAll("button").forEach(b=>b.onclick=()=>{
    state.answers[state.i]=+b.dataset.v; b.classList.add("sel"); save();
    setTimeout(()=>{ if(state.i<Q.length-1){ state.i++; renderQ(); } else finishQuiz(); },180);
  });
  $("#q-back").onclick=()=>{ if(state.i>0){ state.i--; renderQ(); } };
  $("#q-skip").onclick=()=>{
    let seed=(state.user.name||"x").length*7+3;
    const rnd=()=>{ seed=(seed*9301+49297)%233280; return seed/233280; };
    state.answers=state.answers.map(a=>a??Math.min(5,Math.max(1,Math.round(1+rnd()*4)))); save(); finishQuiz();
  };
  $("#b-find").onclick=runAgent;
  $("#b-retake").onclick=()=>{ const u=state.user; state={user:u, answers:Array(Q.length).fill(null), i:0, passed:state.passed||[]}; save(); renderQ(); show("s-quiz"); };
  $("#b-pass").onclick=()=>{ $("#m-why").hidden=false; $("#m-why").scrollIntoView({behavior:"smooth",block:"nearest"}); };
  $("#b-hello").onclick=async()=>{ $("#b-hello").disabled=true; try{ await sayHello(currentCand); } finally { $("#b-hello").disabled=false; } };
  $("#b-wait-back").onclick=()=>show("s-profile");
  $("#b-mutual-start").onclick=openChat;
  $("#chat-send").onclick=sendMessage;
  $("#chat-input").addEventListener("keydown", e=>{ if(e.key==="Enter"){ e.preventDefault(); sendMessage(); } });
  $("#b-call-voice").onclick=()=>startCall("voice");
  $("#b-call-video").onclick=()=>startCall("video");
}
async function finishQuiz(){
  state.vec=vector(state.answers); save();
  await publishProfile().catch(e=>console.error(e));
  renderProfile(); show("s-profile");
}

// ================= vector math =================
function vector(ans){
  const sums=Array(6).fill(0);
  Q.forEach(([d,,rev],i)=>{ const v=ans[i]??3; sums[d]+= rev? 6-v : v; });
  return sums.map(s=>+(s/4).toFixed(2));
}
function describe(v){
  const order=[...v.keys()].sort((a,b)=>v[b]-v[a]);
  const hi=order.slice(0,2), lo=order[5];
  const phr = {
    warmth:{hi:"You love out loud.",lo:"You show love in acts, not words."},
    steady:{hi:"Storms pass over you; they do not move in.",lo:"You feel things fully and quickly."},
    curious:{hi:"New is your default setting.",lo:"You know what you like and return to it."},
    social:{hi:"People are where you refuel.",lo:"You refuel alone, then show up completely."},
    drive:{hi:"You are building something and it shows.",lo:"You measure a good life in evenings, not titles."},
    rooted:{hi:"Family is not a chapter for you; it is the spine.",lo:"You are writing your own script."},
  };
  const title=DIMS[hi[0]].hi.replace(/^the /,"")+", "+DIMS[hi[1]].hi.replace(/^the /,"")+", "+(v[lo]<2.6? DIMS[lo].lo : DIMS[lo].hi)+".";
  const head=phr[DIMS[hi[0]].k].hi;
  const body=phr[DIMS[hi[1]].k].hi+" "+(v[lo]<2.6? phr[DIMS[lo].k].lo : "")+" Your agent will look for someone who shares your "+DIMS[hi[0]].n.toLowerCase()+" and can sit comfortably beside the rest.";
  return {title:title[0].toUpperCase()+title.slice(1),head,body,hi,lo};
}
function radar(canvas, a, b){
  const c=canvas.getContext("2d"), W2=canvas.width, H=canvas.height, cx=W2/2, cy=H/2, R=W2*0.34;
  const css=getComputedStyle(document.documentElement);
  const col=n=>css.getPropertyValue(n).trim();
  c.clearRect(0,0,W2,H);
  c.lineWidth=1.5; c.strokeStyle=col("--line");
  for(let r=1;r<=4;r++){ c.beginPath(); for(let i=0;i<6;i++){ const ang=-Math.PI/2+i*Math.PI/3, x=cx+Math.cos(ang)*R*r/4, y=cy+Math.sin(ang)*R*r/4; i?c.lineTo(x,y):c.moveTo(x,y);} c.closePath(); c.stroke(); }
  for(let i=0;i<6;i++){ const ang=-Math.PI/2+i*Math.PI/3; c.beginPath(); c.moveTo(cx,cy); c.lineTo(cx+Math.cos(ang)*R, cy+Math.sin(ang)*R); c.stroke(); }
  const poly=(v,fill,stroke)=>{ c.beginPath(); v.forEach((s,i)=>{ const ang=-Math.PI/2+i*Math.PI/3, rr=R*(s-1)/4; const x=cx+Math.cos(ang)*rr, y=cy+Math.sin(ang)*rr; i?c.lineTo(x,y):c.moveTo(x,y); }); c.closePath(); c.fillStyle=fill; c.fill(); c.lineWidth=3; c.strokeStyle=stroke; c.stroke(); };
  if(b) poly(b, hexA(col("--haldi"),.28), col("--haldi"));
  poly(a, hexA(col("--rose"),.22), col("--rose"));
  c.fillStyle=col("--ink-2"); c.font="600 22px Figtree, sans-serif"; c.textAlign="center"; c.textBaseline="middle";
  DIMS.forEach((d,i)=>{ const ang=-Math.PI/2+i*Math.PI/3, x=cx+Math.cos(ang)*(R+58), y=cy+Math.sin(ang)*(R+40); c.fillText(d.n.toUpperCase(), x, y); });
}
function hexA(h,a){ h=h.replace("#",""); if(h.length===3) h=h.split("").map(x=>x+x).join(""); const n=parseInt(h,16); return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`; }
function renderProfile(){
  const v=state.vec, d=describe(v);
  $("#p-title").textContent=d.title; $("#p-head").textContent=d.head; $("#p-body").textContent=d.body;
  radar($("#p-radar"), v);
  $("#p-traits").innerHTML = DIMS.map((dm,i)=>{ const cls = v[i]>=3.75?"hi": v[i]<=2.25?"lo":""; return `<span class="chip ${cls}">${dm.n} ${v[i].toFixed(1)}</span>`; }).join("");
}

// ================= avatars =================
function initials(name){ return (name||"?").trim().split(/\s+/).map(w=>w[0]).slice(0,2).join("").toUpperCase(); }
function avatarColor(id){
  const palette=["--rose","--haldi","--neel","--good"]; let h=0;
  for(const c of String(id)) h=(h*31+c.charCodeAt(0))>>>0;
  return getComputedStyle(document.documentElement).getPropertyValue(palette[h%palette.length]).trim();
}
function paintAvatar(sel, person){ const el=$(sel); if(!el) return; el.textContent=initials(person.name); el.style.background=avatarColor(person.id||person.name); }

// ================= candidate model =================
function npcToCand(p, idx){ return {id:"npc:"+idx, name:p[0], age:p[1], gender:p[2], seekArr:p[3], city:p[4], intent:p[5], bio:p[6], vector:p[7], real:false}; }
function rowToCand(d){ return {id:d.id, name:d.name, age:d.age, gender:d.gender, seekArr:d.seek||[], city:d.city, intent:d.intent, bio:d.bio||"", vector:d.vector||[3,3,3,3,3,3], real:true}; }

async function publishProfile(){
  const u=state.user;
  const seekArr = u.seek==="A" ? ["W","M","N"] : [u.seek];
  const { error } = await sb.from("profiles").upsert({
    id: uid, name:u.name, age:+u.age, gender:u.gender, seek:seekArr,
    city:u.city||"", intent:u.intent, bio:u.bio||"", vector:state.vec, updated_at:nowIso(),
  });
  if(error) console.error("publishProfile", error);
}
async function loadOtherProfile(id){
  if(id.indexOf("npc:")===0) return npcToCand(NPC[+id.slice(4)], +id.slice(4));
  const { data, error } = await sb.from("profiles").select("*").eq("id", id).maybeSingle();
  if(!error && data) return rowToCand(data);
  return {id, name:"Someone", age:0, gender:"", seekArr:[], city:"", intent:"O", bio:"", vector:[3,3,3,3,3,3], real:true};
}

function score(u,m){
  let s=0, mx=0; for(let i=0;i<6;i++){ s+=W[i]*(u[i]-m[i])**2; mx+=W[i]*16; }
  let sc = 1-Math.sqrt(s/mx);
  if(u[1]<2.75 && m[1]>=3.75) sc+=0.04;
  const sd=Math.abs(u[3]-m[3]); if(sd>=0.75 && sd<=1.5) sc+=0.02;
  return Math.min(0.97, sc);
}
async function candidates(){
  const u=state.user;
  const seekOk = c => (u.seek==="A" || c.gender===u.seek) && c.seekArr.includes(u.gender);
  const intentOk = c => u.intent==="O" || c.intent==="O" || c.intent===u.intent;
  const ageOk = c => Math.abs(c.age-u.age)<=7;
  let real=[];
  try{
    const { data, error } = await sb.from("profiles").select("*").neq("id", uid);
    if(!error && data) real = data.map(rowToCand);
  }catch(e){ real=[]; }
  const npc = NPC.map(npcToCand);
  const all = [...real, ...npc];
  const s1=all.filter(seekOk), s2=s1.filter(intentOk), s3=s2.filter(ageOk);
  const pool=(s3.length?s3:s2.length?s2:s1).filter(c=>!state.passed.includes(c.id));
  const ranked = pool.map(c=>({...c, sc:score(state.vec,c.vector)})).sort((a,b)=>b.sc-a.sc);
  let chosen = ranked[0];
  const realOk = pool.filter(c=>c.real).map(c=>({...c, sc:score(state.vec,c.vector)})).sort((a,b)=>b.sc-a.sc);
  if(realOk.length && realOk[0].sc>=0.5) chosen = realOk[0];
  return {total:all.length, afterSeek:s1.length, afterIntent:s2.length, afterAge:s3.length, ranked, chosen};
}

// ================= agent + match card =================
async function runAgent(){
  show("s-agent");
  const c = await candidates(); state.cand={rankedCount:c.ranked.length}; save();
  const u=state.user; const chosen=c.chosen;
  const steps = [
    `Carrying your six-number signature: ${state.vec.map(x=>x.toFixed(1)).join(" · ")}`,
    `Started from <b>${c.total}</b> people in the pool.`,
    `Kept the ones looking for a ${({W:"woman",M:"man",N:"non-binary person"})[u.gender]} who you'd also consider: <b>${c.afterSeek}</b>.`,
    `Matched intent (${({M:"marriage",L:"long-term",O:"open"})[u.intent]}): <b>${c.afterIntent}</b> left.`,
    `Within a sensible age range: <b>${c.afterAge}</b>.`,
    `Ranked by values first, temperament second.`,
    chosen ? `Held back <b>${Math.max(0,c.ranked.length-1)}</b> near-misses. Introducing one.` : `Nobody clears the bar today. I would rather introduce no one than the wrong one.`,
  ];
  const log=$("#a-log"); log.innerHTML=steps.map(s=>`<div>${s}</div>`).join("");
  const st=$("#a-status span");
  const items=[...log.children];
  for(let i=0;i<items.length;i++){ await wait(i===0?500:420); items[i].classList.add("done"); st.textContent=["Reading you","Opening the pool","Filtering","Filtering","Filtering","Ranking","Deciding"][i]; }
  await wait(600);
  if(!chosen){ toast("No match today. Try 'Open to both' or 'Everyone'."); show("s-intro"); return; }
  currentCand = chosen;
  state.matchScore = score(state.vec, chosen.vector); save();
  renderMatchCard(chosen); show("s-match");
}
function renderMatchCard(cand){
  $("#m-date").textContent=new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short"});
  paintAvatar("#m-avatar", cand);
  $("#m-name").textContent=cand.name+", "+cand.age;
  $("#m-meta").textContent=cand.city+" · "+({M:"Wants marriage",L:"Wants long-term",O:"Open to both"})[cand.intent]+(cand.real?" · a real person, using this too":"");
  $("#m-score").textContent=Math.round(state.matchScore*100)+"%";
  $("#m-quote").textContent=cand.bio || "Still finding the words for their bio — but the numbers speak.";
  $("#m-dims").innerHTML=DIMS.map((d,i)=>{
    const v=state.vec, m=cand.vector, diff=Math.abs(v[i]-m[i]);
    const tag = diff<0.75 ? ["Aligned","al"] : diff<1.5 ? (d.kind==="temper"?["Complementary","co"]:["Close","al"]) : ["Different",""];
    const lo=Math.min(v[i],m[i]), hi=Math.max(v[i],m[i]);
    const pct=x=>((x-1)/4*100);
    return `<div class="drow"><span class="n">${d.n}</span><span class="track"><em style="left:${pct(lo)}%;width:${pct(hi)-pct(lo)}%"></em><i class="m" style="left:${pct(m[i])}%"></i><i class="u" style="left:${pct(v[i])}%"></i></span><span class="tag ${tag[1]}">${tag[0]}</span></div>`;
  }).join("");
  const rc=(state.cand&&state.cand.rankedCount)||1; const held=Math.max(0,rc-1);
  $("#m-held").innerHTML = held ? `Your agent looked at <b>${rc}</b> people and is showing you <b>one</b>. The next introduction arrives the moment a better one turns up.` : `This was the last person in the pool who fits.`;
  $("#m-why").hidden=true;
  $("#m-reasons").innerHTML=REASONS.map(r=>`<button type="button">${r}</button>`).join("");
  $("#m-reasons").querySelectorAll("button").forEach(b=>b.onclick=()=>{ state.passed.push(cand.id); save(); toast("Noted. Finding the next one."); $("#m-why").hidden=true; setTimeout(runAgent,700); });
  applyNote(fallbackNote(cand));
}
function fallbackNote(cand){
  const v=state.vec, m=cand.vector;
  const diffs=DIMS.map((d,i)=>({d,i,diff:Math.abs(v[i]-m[i])}));
  const al=diffs.filter(x=>x.diff<0.75).sort((a,b)=>W[b.i]-W[a.i]);
  const df=diffs.filter(x=>x.diff>=1.0).sort((a,b)=>b.diff-a.diff)[0];
  const alTxt = al.length? `You and ${cand.name} sit close on ${al.slice(0,2).map(x=>x.d.n.toLowerCase()).join(" and ")}, which is where most long relationships are actually decided.` : `You and ${cand.name} are built differently, but your values point the same way.`;
  let dfTxt="";
  if(df){
    const who = v[df.i]>m[df.i] ? "you" : cand.name;
    const other = who==="you" ? cand.name : "you";
    const hiWord=df.d.hi.replace(/^the /,""), loWord=df.d.lo.replace(/^the /,"");
    dfTxt = ` On ${df.d.n.toLowerCase()} you differ: ${who} lean${who==="you"?"":"s"} ${hiWord}, ${other} ${other==="you"?"lean":"leans"} ${loWord}. That gap is usually a relief, not a problem.`;
  }
  const head = al.length>=3 ? "Same direction, different pace." : df ? `${df.d.n} is the interesting difference.` : "A quiet, sensible fit.";
  return {head, body: alTxt+dfTxt+` They said they want ${({M:"marriage",L:"something long-term",O:"either, depending on the person"})[cand.intent]}, same as your intent, so nobody is wasting anyone's time.`};
}
function applyNote(n){ $("#n-head").textContent=n.head; $("#n-body").textContent=n.body; }

// ================= mutual consent gate =================
async function sayHello(cand){
  currentCand=cand;
  paintAvatar("#wa-avatar", cand); $("#wa-name").textContent=cand.name;
  $("#wa-line").textContent = cand.real ? "You said hello. Your agent will let you know the moment they say it back." : "You said hello. Their agent is checking with them now.";
  show("s-waiting");
  const { error:e1 } = await sb.from("likes").upsert({from_id: uid, to_id: cand.id});
  if(e1) console.error("like insert", e1);
  if(!cand.real){
    await wait(1300);
    await sb.from("likes").upsert({from_id: cand.id, to_id: uid});
    await createMatchIfMutual(cand.id);
  } else {
    const { data } = await sb.from("likes").select("*").eq("from_id", cand.id).eq("to_id", uid).maybeSingle();
    if(data) await createMatchIfMutual(cand.id);
    else watchReciprocal(cand.id);
  }
}
function watchReciprocal(candId){
  if(recipChannel){ sb.removeChannel(recipChannel); recipChannel=null; }
  recipChannel = sb.channel("recip-"+candId+"-"+uid)
    .on("postgres_changes", {event:"INSERT", schema:"public", table:"likes", filter:`to_id=eq.${uid}`}, payload=>{
      if(payload.new.from_id === candId){ sb.removeChannel(recipChannel); recipChannel=null; createMatchIfMutual(candId); }
    })
    .subscribe();
}
async function createMatchIfMutual(otherId){
  const pair=[uid, otherId].sort();
  const { error } = await sb.from("matches").upsert({a: pair[0], b: pair[1]});
  if(error) console.error("match upsert", error);
}

async function watchForMatches(){
  try{
    const { data } = await sb.from("matches").select("*").or(`a.eq.${uid},b.eq.${uid}`).order("created_at",{ascending:false}).limit(1);
    if(data && data.length) enterMatch(data[0], true);
  }catch(e){ console.error(e); }
  matchChannel = sb.channel("matches-"+uid)
    .on("postgres_changes", {event:"INSERT", schema:"public", table:"matches", filter:`a=eq.${uid}`}, p=>enterMatch(p.new,false))
    .on("postgres_changes", {event:"INSERT", schema:"public", table:"matches", filter:`b=eq.${uid}`}, p=>enterMatch(p.new,false))
    .subscribe();
}
function enterMatch(m, isResume){
  if(state.matchA) return; // one relationship in focus at a time
  state.matchA=m.a; state.matchB=m.b; state.matchWith = m.a===uid? m.b : m.a; save();
  loadOtherProfile(state.matchWith).then(other=>{
    state.matchOther=other; state.matchScore=score(state.vec, other.vector); save();
    if(isResume) openChat(); else showMutual(other);
  });
}
function showMutual(other){
  paintAvatar("#mu-you", {name:state.user.name, id:uid});
  paintAvatar("#mu-them", other);
  $("#mu-line").textContent = `${state.user.name} and ${other.name} both said hello. ${Math.round(score(state.vec,other.vector)*100)}% in tune, by your agents' reading.`;
  show("s-mutual");
}

// ================= chat =================
async function openChat(){
  show("s-chat");
  paintAvatar("#chat-avatar", state.matchOther);
  $("#chat-name").textContent=state.matchOther.name;
  $("#chat-meta").textContent=(state.matchOther.city||"")+" · "+Math.round((state.matchScore||0)*100)+"% in tune"+(state.matchOther.real?"":" · demo profile");
  const { data:msgs } = await sb.from("messages").select("*").eq("match_a", state.matchA).eq("match_b", state.matchB).order("created_at",{ascending:true});
  renderMessages(msgs||[]);
  if(msgChannel) sb.removeChannel(msgChannel);
  msgChannel = sb.channel("messages-"+state.matchA+"-"+state.matchB)
    .on("postgres_changes", {event:"INSERT", schema:"public", table:"messages", filter:`match_a=eq.${state.matchA}`}, p=>{ if(p.new.match_b===state.matchB) appendMessage(p.new); })
    .subscribe();
  if(callChannel) sb.removeChannel(callChannel);
  const { data:callRow } = await sb.from("calls").select("*").eq("match_a", state.matchA).eq("match_b", state.matchB).maybeSingle();
  renderCallRow(callRow, true); // initial paint only — never re-log a call that had already ended before this page load
  callChannel = sb.channel("calls-"+state.matchA+"-"+state.matchB)
    .on("postgres_changes", {event:"*", schema:"public", table:"calls", filter:`match_a=eq.${state.matchA}`}, p=>{ if((p.new||p.old).match_b===state.matchB) renderCallRow(p.new, false); })
    .subscribe();
}
let renderedMsgs=[];
function nearBottom(el){ return el.scrollHeight - el.scrollTop - el.clientHeight < 80; }
function renderMessages(rows){ renderedMsgs=rows; paintMessages(); }
function appendMessage(row){ renderedMsgs.push(row); paintMessages(); }
function paintMessages(){
  const body=$("#chat-body");
  const wasBottom = nearBottom(body);
  body.innerHTML = renderedMsgs.map(m=>{
    if(m.kind==="system") return `<div class="bubble sys">${esc(m.body)}</div>`;
    const mine = m.from_id===uid;
    return `<div class="bubble ${mine?"me":"them"}">${esc(m.body)}</div>`;
  }).join("") || `<p class="held" style="margin-top:40px">Say hi to ${esc(state.matchOther.name)}.</p>`;
  if(wasBottom) body.scrollTop = body.scrollHeight;
}
async function sendMessage(){
  const inp=$("#chat-input"); const text=inp.value.trim(); if(!text) return; inp.value="";
  const { error } = await sb.from("messages").insert({match_a: state.matchA, match_b: state.matchB, from_id: uid, body: text, kind:"text"});
  if(error) console.error(error);
  if(!state.matchOther.real) triggerNpcReply(text);
}
async function triggerNpcReply(userText){
  await wait(900+Math.random()*900);
  const reply = NPC_REPLY_FALLBACK[Math.floor(Math.random()*NPC_REPLY_FALLBACK.length)];
  await sb.from("messages").insert({match_a: state.matchA, match_b: state.matchB, from_id: state.matchOther.id, body: reply, kind:"text"});
}

// ================= simulated call =================
let callTimerInt=null; const loggedEnds=new Set();
function ts(v){ return v ? Date.parse(v) : null; }
async function startCall(mode){
  const row = {match_a:state.matchA, match_b:state.matchB, status:"ringing", mode, by_id:uid, started_at:nowIso(), connected_at:null, ended_at:null, end_reason:null, muted:{[uid]:false}, camera_off:{[uid]:mode==="voice"}, updated_at:nowIso()};
  await sb.from("calls").upsert(row);
  const isNpc = !state.matchOther.real;
  if(isNpc){
    setTimeout(async()=>{
      const {data} = await sb.from("calls").select("*").eq("match_a",state.matchA).eq("match_b",state.matchB).maybeSingle();
      if(data && data.status==="ringing") await sb.from("calls").update({status:"active", connected_at:nowIso()}).eq("match_a",state.matchA).eq("match_b",state.matchB);
    }, 1400);
  } else {
    setTimeout(async()=>{
      const {data} = await sb.from("calls").select("*").eq("match_a",state.matchA).eq("match_b",state.matchB).maybeSingle();
      if(data && data.status==="ringing" && data.by_id===uid) await sb.from("calls").update({status:"ended", end_reason:"no_answer", ended_at:nowIso()}).eq("match_a",state.matchA).eq("match_b",state.matchB);
    }, 25000);
  }
}
async function acceptCall(){ await sb.from("calls").update({status:"active", connected_at:nowIso()}).eq("match_a",state.matchA).eq("match_b",state.matchB); }
async function endCall(reason){ await sb.from("calls").update({status:"ended", end_reason:reason, ended_at:nowIso()}).eq("match_a",state.matchA).eq("match_b",state.matchB); }
async function toggleSelf(field, val, current){
  const col = field==="muted" ? "muted" : "camera_off";
  const merged = {...(current||{}), [uid]: val};
  await sb.from("calls").update({[col]: merged}).eq("match_a",state.matchA).eq("match_b",state.matchB);
}
function renderCallRow(row, isInitialPaint){
  if(!row){ $("#s-call").hidden=true; clearInterval(callTimerInt); return; }
  const c = {status:row.status, mode:row.mode, by:row.by_id, startedAt:ts(row.started_at), connectedAt:ts(row.connected_at), endedAt:ts(row.ended_at), endReason:row.end_reason, muted:row.muted||{}, cameraOff:row.camera_off||{}};
  renderCall(c, isInitialPaint);
}
function renderCall(c, isInitialPaint){
  const ov=$("#s-call");
  if(!c || c.status==="ended"){
    if(c && c.by===uid && !isInitialPaint) maybeLogCallEnd(c);
    if(c && c.by!==uid && c.endReason && c.endReason!=="hangup"){
      toast(c.endReason==="declined"?"Call declined":c.endReason==="no_answer"?"No answer":"Call ended");
    }
    ov.hidden=true; clearInterval(callTimerInt); return;
  }
  ov.hidden=false;
  paintAvatar("#call-avatar", state.matchOther);
  $("#call-who").textContent=state.matchOther.name;
  $("#call-mode-label").textContent=(c.mode==="video"?"Video call":"Voice call");
  const otherId=state.matchWith;
  const otherMuted = !!(c.muted&&c.muted[otherId]);
  const selfMuted = !!(c.muted&&c.muted[uid]);
  const selfCamOff = !!(c.cameraOff&&c.cameraOff[uid]);
  $("#call-other-badge").textContent = otherMuted ? state.matchOther.name+" is muted" : "";
  if(c.status==="ringing" && c.by===uid){
    $("#call-state").textContent="Calling "+state.matchOther.name+"…"; $("#call-timer").hidden=true;
    $("#call-actions").innerHTML=`<button class="ctrlBtn danger" id="b-call-cancel">Cancel</button>`;
    $("#b-call-cancel").onclick=()=>endCall("cancelled");
  } else if(c.status==="ringing"){
    $("#call-state").textContent=state.matchOther.name+" is calling you"; $("#call-timer").hidden=true;
    $("#call-actions").innerHTML=`<button class="ctrlBtn danger" id="b-call-decline">Decline</button><button class="ctrlBtn accept" id="b-call-accept">Accept</button>`;
    $("#b-call-decline").onclick=()=>endCall("declined");
    $("#b-call-accept").onclick=()=>acceptCall();
  } else if(c.status==="active"){
    $("#call-state").textContent="Connected"; $("#call-timer").hidden=false;
    startCallTimer(c.connectedAt);
    $("#call-actions").innerHTML=`<button class="ctrlBtn" id="b-call-mute">${selfMuted?"Unmute":"Mute"}</button>`+
      (c.mode==="video" ? `<button class="ctrlBtn" id="b-call-cam">${selfCamOff?"Camera on":"Camera off"}</button>` : "")+
      `<button class="ctrlBtn danger" id="b-call-end">End</button>`;
    $("#b-call-mute").onclick=()=>toggleSelf("muted", !selfMuted, c.muted);
    if(c.mode==="video") $("#b-call-cam").onclick=()=>toggleSelf("cameraOff", !selfCamOff, c.cameraOff);
    $("#b-call-end").onclick=()=>endCall("hangup");
  }
}
function startCallTimer(connectedAt){
  clearInterval(callTimerInt);
  const tick=()=>{ const s=Math.max(0,Math.floor((Date.now()-connectedAt)/1000)); $("#call-timer").textContent=String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0"); };
  tick(); callTimerInt=setInterval(tick,1000);
}
async function maybeLogCallEnd(c){
  const key=c.startedAt; if(!key || loggedEnds.has(key)) return; loggedEnds.add(key);
  const dur = c.connectedAt ? Math.max(0,Math.round((c.endedAt-c.connectedAt)/1000)) : 0;
  const label = c.mode==="video" ? "Video call" : "Voice call";
  const text = dur>0 ? `${label} · ${Math.floor(dur/60)}:${String(dur%60).padStart(2,"0")}` : `${label} not answered`;
  await sb.from("messages").insert({match_a:state.matchA, match_b:state.matchB, from_id:null, body:text, kind:"system"});
}

// ================= resume / theme =================
function resume(){
  if(state.matchA && state.matchOther){ openChat(); }
  else if(state.vec){ renderProfile(); show("s-profile"); }
  else if(state.answers.some(a=>a!==null) && state.user.name){ state.i=Math.max(0,state.answers.findIndex(a=>a===null)); renderQ(); show("s-quiz"); }
  else show("s-intro");
}
matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{ if(state.vec && $("#s-profile").classList.contains("on")) radar($("#p-radar"),state.vec); });
