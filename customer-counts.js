/* Display recorded aggregates only. Missing data never becomes zero or a timed increment. */
(function(){
 'use strict';
 const root=document.getElementById('customer-counts');if(!root)return;
 const snapshotURL=new URL('customer-counts.json',document.currentScript.src).href;
 const API='https://countapi.mileshilliard.com/api/v1/get/meottable_a91f4_';
 const metrics={visits:'v1_sessions',inquiries:'event_lead_saved'};
 const START={visits:'2026-10-05',inquiries:'2026-10-20'};
 const valid=n=>Number.isSafeInteger(n)&&n>=0;
 const number=n=>n.toLocaleString('ko-KR');
 const localDay=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 let month='',days={},contracts=null,contractDate=null,reportedInquiries=null,reportedAt=null,lastRefresh=0,inFlight=false,visible=false,finished=false,sourceAt=null;
 const cacheKey='meot_public_counts_v1';
 const cards=Object.fromEntries(['visits','inquiries','contracts'].map(key=>[key,{value:root.querySelector('[data-count="'+key+'"]'),unit:root.querySelector('[data-unit="'+key+'"]'),detail:root.querySelector('[data-count-detail="'+key+'"]'),shown:null,raf:0}]));
 function resetMonth(){
  const next=localDay().slice(0,7);if(next===month)return false;
  month=next;days={};contracts=null;contractDate=null;reportedInquiries=null;reportedAt=null;sourceAt=null;
  Object.values(cards).forEach(card=>{cancelAnimationFrame(card.raf);card.shown=null;});
  root.querySelector('.cc-period').textContent=Number(month.slice(5))+'월 · 한국 시간 기준';return true;
 }
 function save(){try{sessionStorage.setItem(cacheKey,JSON.stringify({month,days,updatedAt:sourceAt}));}catch(_){} }
 function setValue(key,value,suffix){
  const card=cards[key];cancelAnimationFrame(card.raf);card.value.classList.toggle('is-unknown',value===null);
  card.unit.hidden=value===null;
  if(value===null){card.value.textContent=finished?'집계 중':'확인 중';card.shown=null;return;}
  card.unit.textContent=suffix;const from=card.shown===null?0:card.shown,duration=card.shown===null?1500:500;
  const paint=n=>{card.value.textContent=number(n);card.shown=n;};
  if(!visible||matchMedia('(prefers-reduced-motion: reduce)').matches){paint(value);return;}
  const started=performance.now();function frame(now){const p=Math.min(1,(now-started)/duration);paint(Math.round(from+(value-from)*(1-Math.pow(1-p,3))));if(p<1)card.raf=requestAnimationFrame(frame);}
  if(from===value)paint(value);else card.raf=requestAnimationFrame(frame);
 }
 function render(){
  const today=localDay();resetMonth();
  for(const key of Object.keys(metrics)){
   if(key==='inquiries'&&valid(reportedInquiries)){setValue(key,reportedInquiries,'건');cards[key].detail.textContent='이번 달 · 업체 제공 집계';continue;}
   const entries=Object.entries(days).filter(([day,values])=>day.startsWith(month)&&day<=today&&valid(values[key]));
   const sum=entries.length?entries.reduce((total,[,values])=>total+values[key],0):null;
   const first=[month+'-01',START[key]].sort().pop();
   const expected=first>today?0:Number(today.slice(8))-Number(first.slice(8))+1;
   const partial=entries.length<expected||first>month+'-01';
   setValue(key,sum,(partial?'＋':'')+(key==='visits'?'회':'건'));
   cards[key].detail.textContent=key==='visits'?(first>month+'-01'?Number(first.slice(5,7))+'/'+Number(first.slice(8))+'부터 · 방문 세션':'이번 달 · 방문 세션 기준'):'이번 달 · 홈페이지 접수 기록';
  }
  setValue('contracts',valid(contracts)?contracts:null,'명');
  cards.contracts.detail.textContent=valid(contracts)?'이번 달 · 업체 제공 집계':'계약 현황 확인 중';
  const stamp=sourceAt?new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(sourceAt)):'';
  root.querySelector('.cc-update').textContent=stamp?stamp+' 집계 확인':'집계 자료 확인 중';
 }
 async function getJSON(url){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);try{const response=await fetch(url,{cache:'no-store',credentials:'omit',signal:controller.signal});if(!response.ok)throw Error('unavailable');return await response.json();}finally{clearTimeout(timer);} }
 async function refresh(){
  if(inFlight||document.hidden)return;inFlight=true;const rolled=resetMonth();const today=localDay(),requestMonth=month;
  try{
   const snapshot=await getJSON(snapshotURL);
   if(snapshot.schemaVersion===1&&snapshot.month===month){
    for(const [day,values] of Object.entries(snapshot.days||{})){if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!day.startsWith(month)||day>today)continue;days[day]??={};for(const key of Object.keys(metrics))if(valid(values[key])&&!valid(days[day][key]))days[day][key]=values[key];}
    contracts=valid(snapshot.contracts)?snapshot.contracts:null;contractDate=snapshot.contractsReportedAt||snapshot.contractsVerifiedAt;
    reportedAt=snapshot.inquiriesReportedAt;
    reportedInquiries=valid(snapshot.inquiries)&&Number.isFinite(Date.parse(reportedAt))?snapshot.inquiries:null;
    if(contracts!==null&&!Number.isFinite(Date.parse(contractDate)))contracts=null;
    if(Number.isFinite(Date.parse(snapshot.updatedAt)))sourceAt=snapshot.updatedAt;
   }
  }catch(_){}
  const knownDays=Object.keys(days).filter(day=>day.startsWith(month)).sort();
  // Read today's records each minute; catch up missing days only once per page/month.
  const firstLoad=!finished||rolled,lastKnown=knownDays.at(-1),from=firstLoad?(lastKnown?Number(lastKnown.slice(8)):1):Number(today.slice(8));
  const jobs=[];
  for(let d=from;d<=Number(today.slice(8));d++){
   const day=month+'-'+String(d).padStart(2,'0');
   for(const key of Object.keys(metrics))if(day>=START[key]&&!(key==='inquiries'&&valid(reportedInquiries)))jobs.push({day,key});
  }
  render();let cursor=0,success=false;
  await Promise.all(Array.from({length:Math.min(4,jobs.length)},async()=>{
   while(cursor<jobs.length){const {day,key}=jobs[cursor++];try{
    const data=await getJSON(API+day.replaceAll('-','')+'_'+metrics[key]);const n=typeof data.value==='number'?data.value:typeof data.value==='string'&&/^\d+$/.test(data.value)?Number(data.value):null;
    if(valid(n)&&requestMonth===month){days[day]??={};days[day][key]=n;success=true;}
   }catch(_){/* Preserve known values; unknown remains unknown. */}}
  }));
  if(success)sourceAt=new Date().toISOString();finished=true;lastRefresh=Date.now();inFlight=false;save();render();
 }
 resetMonth();try{const saved=JSON.parse(sessionStorage.getItem(cacheKey)||'null');if(saved?.month===month&&saved.days&&typeof saved.days==='object')days=saved.days;}catch(_){}
 const start=()=>{if(visible)return;visible=true;refresh();};
 if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();start();}},{rootMargin:'120px'});observer.observe(root);}else start();
 setInterval(()=>{if(visible&&!document.hidden&&Date.now()-lastRefresh>=60000)refresh();},60000);
 document.addEventListener('visibilitychange',()=>{if(visible&&!document.hidden&&Date.now()-lastRefresh>=60000)refresh();});
})();
