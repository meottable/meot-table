/* Aggregate homepage behaviour only: no names, contacts, raw queries or location. */
(function () {
  'use strict';
  if (!window.meotAnalytics || /admin|preview/.test(location.pathname)) return;
  const KEY='meot_visitor_session_v1', SEEN='meot_visitor_seen_v1';
  const now=Date.now(), day=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date()).replaceAll('-','');
  let state;
  try { state=JSON.parse(sessionStorage.getItem(KEY)||'null'); } catch (_) {}
  if (!state || state.day!==day || now-state.last>1800000) state={day,last:now,events:{}};
  const persist=()=>{try{sessionStorage.setItem(KEY,JSON.stringify(state));}catch(_){}};
  function once(name) {
    if(state.events[name])return;
    state.events[name]=true;state.last=Date.now();persist();
    window.meotAnalytics.hit('v1_'+name);
  }
  once('sessions');
  if(!state.events.new&&!state.events.returning&&!state.events.unclassified){
    try {const prior=Number(localStorage.getItem(SEEN));once(prior && now-prior<7776000000?'returning':'new');localStorage.setItem(SEEN,String(now));}
    catch(_){once('unclassified');}
  }
  once('device_'+(/iPad|Tablet/i.test(navigator.userAgent)?'tablet':/Mobi|Android/i.test(navigator.userAgent)?'mobile':'desktop'));
  let ref='';try{ref=new URL(document.referrer).hostname;}catch(_){}
  const raw=(new URLSearchParams(location.search).get('utm_source')||ref).toLowerCase();
  const source=/chatgpt|openai|perplexity|claude|copilot|gemini/.test(raw)?'ai':/naver/.test(raw)?'naver':/google/.test(raw)?'google':/instagram|facebook|threads|meta/.test(raw)?'social':/kakao/.test(raw)?'kakao':raw&&raw!==location.hostname?'other':'direct';
  once('source_'+source);
  const sections=[['factory','공장'],['estimate','견적'],['grades','등급'],['design','디자인'],['chairs','의자'],['portfolio','납품'],['customer-reviews','후기']];
  let lastSection='other', exits=0;
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){once('section_'+e.target.id);lastSection=e.target.id;}});},{rootMargin:'-15% 0px -15% 0px',threshold:0});
    sections.forEach(([id])=>{const el=document.getElementById(id);if(el)observer.observe(el);});
  }
  let pending=false;
  function scrollDepth(){pending=false;const h=document.documentElement.scrollHeight-innerHeight;if(h<=0)return;const depth=scrollY/h*100;[25,50,75,90].forEach(v=>{if(depth>=v)once('scroll_'+v);});}
  addEventListener('scroll',()=>{if(!pending){pending=true;requestAnimationFrame(scrollDepth);}}, {passive:true});scrollDepth();
  let active=0, tick=Date.now();
  setInterval(()=>{const t=Date.now();if(document.visibilityState==='visible')active+=Math.min(t-tick,2000);tick=t;if(active>=30000)once('active30');if(active>=60000)once('active60');},1000);
  document.addEventListener('click',e=>{
    const el=e.target.closest('a,button');if(!el)return;
    const all=(el.getAttribute('href')||'')+' '+el.textContent;
    if(/pf\.kakao|카카오|^tel:|전화 상담/.test(all)){once('contact');once('contact_source_'+source);}
    if(el.closest('#estimate'))once('quote');
  },true);
  document.addEventListener('change',e=>{if(e.target.closest('#estimate'))once('quote');},true);
  const originalTrack=window.meotAnalytics.track;
  window.meotAnalytics.track=function(name,detail){
    originalTrack.call(this,name,detail);
    if(name==='lead_saved')once('lead_saved');
  };
  // Best-effort page departure; does not prove abandonment or its cause.
  addEventListener('pagehide',()=>{if(!exits++){window.meotAnalytics.hit('v1_leave_'+lastSection);}});
  addEventListener('pageshow',()=>{exits=0;});
})();
