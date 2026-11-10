/* 첫 화면 아래 후기 띠: reviews/reviews.json의 실제 후기에서 평균 별점·건수·한 줄 후기를 보여줍니다. */
(function(){
 'use strict';
 const root=document.getElementById('proof');if(!root)return;
 const box=root.querySelector('[data-hp-quotes]');
 function short(text){
  const t=String(text||'').replace(/\s+/g,' ').trim();
  const m=t.match(/^.{12,58}?[.!~](?=\s|$)/);
  return m?m[0].replace(/[.]$/,'').trim():null;
 }
 fetch('/reviews/reviews.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(d=>{
  const list=(d&&d.reviews||[]).filter(r=>r.body);if(!list.length){box.hidden=true;return;}
  const avg=list.reduce((a,r)=>a+(Number(r.rating)||5),0)/list.length;
  root.querySelector('[data-hp-avg]').textContent=avg.toFixed(1);
  root.querySelector('[data-hp-count]').textContent=list.length;
  const quotes=list.filter(r=>(Number(r.rating)||5)>=5).map(r=>({q:short(r.body),who:[r.storeName,r.business].filter(Boolean).join(' · ')})).filter(x=>x.q);
  quotes.forEach((x,i)=>{const f=document.createElement('figure');f.className='hp-quote'+(i===0?' is-on':'');const b=document.createElement('blockquote');b.textContent='“'+x.q+'”';const c=document.createElement('figcaption');c.textContent=x.who+' 사장님';f.append(b,c);box.append(f);});
  if(quotes.length<2||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  let i=0;const items=box.children;
  setInterval(()=>{if(document.hidden)return;items[i].classList.remove('is-on');i=(i+1)%items.length;items[i].classList.add('is-on');},2500);
 }).catch(()=>{box.hidden=true;});
})();
