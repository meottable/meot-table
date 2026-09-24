(function(){
 'use strict';
 const rail=document.getElementById('quality-cards');
 if(!rail)return;
 const cards=Array.from(rail.querySelectorAll('.quality-card'));
 const controls=document.querySelector('#grades .quality-carousel-controls');
 const dots=Array.from(controls.querySelectorAll('.quality-dot'));
 const count=controls.querySelector('.quality-count');
 const prev=controls.querySelector('[data-quality-step="-1"]');
 const next=controls.querySelector('[data-quality-step="1"]');
 let active=0,scheduled=false;
 controls.hidden=false;
 function sync(){
  const start=rail.getBoundingClientRect().left;
  active=cards.reduce((best,card,i)=>Math.abs(card.getBoundingClientRect().left-start)<Math.abs(cards[best].getBoundingClientRect().left-start)?i:best,0);
  count.textContent=(active+1)+' / '+cards.length;
  dots.forEach((dot,i)=>dot.setAttribute('aria-current',String(i===active)));
  prev.disabled=active===0;next.disabled=active===cards.length-1;scheduled=false;
 }
 function move(index){
  index=Math.max(0,Math.min(cards.length-1,index));
  rail.scrollTo({left:rail.scrollLeft+cards[index].getBoundingClientRect().left-rail.getBoundingClientRect().left,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 }
 rail.addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(sync);}},{passive:true});
 rail.addEventListener('keydown',event=>{if(event.target===rail&&['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();move(event.key==='Home'?0:event.key==='End'?cards.length-1:active+(event.key==='ArrowRight'?1:-1));}});
 prev.addEventListener('click',()=>move(active-1));next.addEventListener('click',()=>move(active+1));
 dots.forEach((dot,i)=>dot.addEventListener('click',()=>move(i)));
 window.addEventListener('resize',sync);sync();
})();
