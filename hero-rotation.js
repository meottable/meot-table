(function(){
 'use strict';
 const media=document.querySelector('.hero-media');
 if(media){
  const slides=[...media.querySelectorAll('.hero-slide')],count=document.getElementById('hero-image-count'),pause=document.getElementById('hero-pause');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let current=0,timer=null,paused=reduced.matches,inView=true,hover=false,focused=false,moving=false,startX=0,startY=0;
  function load(img){if(img.dataset.src){img.src=img.dataset.src;delete img.dataset.src;}return img.decode().catch(()=>{});}
  function sync(){clearTimeout(timer);if(!paused&&!document.hidden&&inView&&!hover&&!focused)timer=setTimeout(()=>show(current+1),2000);}
  async function show(index){
   if(moving)return;moving=true;clearTimeout(timer);const next=(index+slides.length)%slides.length;
   await load(slides[next]);
   if(slides[next].naturalWidth){slides[current].classList.remove('is-active');slides[current].setAttribute('aria-hidden','true');current=next;slides[current].classList.add('is-active');slides[current].setAttribute('aria-hidden','false');count.textContent=(current+1)+' / '+slides.length;}
   moving=false;load(slides[(current+1)%slides.length]);sync();
  }
  function pauseLabel(){pause.textContent=paused?'▶':'Ⅱ';pause.setAttribute('aria-pressed',String(paused));pause.setAttribute('aria-label',paused?'메인 사진 자동 전환 재생':'메인 사진 자동 전환 일시정지');}
  pause.addEventListener('click',()=>{paused=!paused;if(!paused){focused=false;hover=false;}pauseLabel();sync();});
  document.getElementById('hero-previous').addEventListener('click',()=>show(current-1));document.getElementById('hero-next').addEventListener('click',()=>show(current+1));
  media.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();show(current+(event.key==='ArrowRight'?1:-1));}});
  media.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'){hover=true;sync();}});media.addEventListener('pointerleave',()=>{hover=false;sync();});
  media.addEventListener('focusin',()=>{focused=true;sync();});media.addEventListener('focusout',event=>{focused=media.contains(event.relatedTarget);sync();});
  media.addEventListener('touchstart',event=>{startX=event.changedTouches[0].clientX;startY=event.changedTouches[0].clientY;},{passive:true});
  media.addEventListener('touchend',event=>{const dx=event.changedTouches[0].clientX-startX,dy=event.changedTouches[0].clientY-startY;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.3)show(current+(dx<0?1:-1));},{passive:true});
  document.addEventListener('visibilitychange',sync);new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;sync();},{threshold:.1}).observe(media);
  reduced.addEventListener('change',event=>{paused=event.matches;pauseLabel();sync();});pauseLabel();load(slides[1]);sync();
 }
 const videoButton=document.getElementById('factory-video-play');
 if(videoButton)videoButton.addEventListener('click',()=>{const frame=videoButton.parentElement.querySelector('iframe');frame.src=frame.dataset.src;frame.hidden=false;videoButton.hidden=true;frame.focus();});
})();
