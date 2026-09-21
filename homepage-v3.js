(function(){
 'use strict';
 const q=s=>document.querySelector(s),qa=s=>Array.from(document.querySelectorAll(s));
 const prices={basic:{name:'기본형',price:59000},middle:{name:'중급형',price:89000},premium:{name:'고급형',price:129000}};
 const state={grade:'basic',quantity:10};
 const won=n=>n.toLocaleString('ko-KR')+'원';
 const BOOKING_CAPACITY=10;
 let bookingData={"capacity":10,"months":{"2026-09":{"confirmed":7}},"updatedAt":"2026-09-21T23:56:10+09:00"};
 let lastBookingFetch=0,bookingRequest=null;
 function monthKey(date=new Date()){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit'}).formatToParts(date);
  return parts.find(p=>p.type==='year').value+'-'+parts.find(p=>p.type==='month').value;
 }
 function reservationStatus(key=monthKey()){
  const confirmed=bookingData.months?.[key]?.confirmed;
  const known=Number.isInteger(confirmed)&&confirmed>=0&&confirmed<=BOOKING_CAPACITY;
  return {key,known,confirmed:known?confirmed:null,remaining:known?BOOKING_CAPACITY-confirmed:null,closed:known&&confirmed===BOOKING_CAPACITY};
 }
 function renderBookings(){
  const status=reservationStatus(),month=Number(status.key.split('-')[1])+'월';
  qa('[data-reservation-month]').forEach(el=>el.textContent=month+' 맞춤 제작 예약');
  qa('[data-reservation-confirmed]').forEach(el=>el.textContent=status.known?String(status.confirmed):'—');
  qa('[data-reservation-left]').forEach(el=>el.textContent=status.known?String(status.remaining):'문의');
  qa('[data-reservation-state]').forEach(el=>el.textContent=status.closed?'예약 마감':status.known?'남은 예약':'예약 현황');
  qa('[data-reservation-unit]').forEach(el=>el.hidden=!status.known);
  qa('[data-booking-panel]').forEach(el=>{
   el.classList.toggle('is-unknown',!status.known);
   el.classList.toggle('is-closed',status.closed);
   el.setAttribute('aria-label',month+' 맞춤 제작 예약: '+(status.known?'확정 '+status.confirmed+'팀, 남은 예약 '+status.remaining+'팀':'월 10팀 한정, 현재 예약 현황은 상담으로 안내합니다.'));
  });
 }
 function loadBookings(){
  if(bookingRequest)return bookingRequest;
  bookingRequest=fetch('/meot-table/production-bookings.json',{cache:'no-store'})
   .then(response=>{if(!response.ok)throw new Error('booking_unavailable');return response.json();})
   .then(data=>{if(data&&data.capacity===BOOKING_CAPACITY&&data.months&&typeof data.months==='object'&&!Array.isArray(data.months)){bookingData=data;renderBookings();}})
   .catch(()=>{})
   .finally(()=>{lastBookingFetch=Date.now();bookingRequest=null;});
  return bookingRequest;
 }
 let lastMonth=monthKey();
 function tickMonth(){const now=monthKey();if(now!==lastMonth){lastMonth=now;renderBookings();loadBookings();}}
 setInterval(tickMonth,60000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){tickMonth();if(Date.now()-lastBookingFetch>60000)loadBookings();}});

 function renderEstimate(){
  qa('[data-grade]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.grade===state.grade)));
  q('#total').textContent=won(prices[state.grade].price*state.quantity);
  q('#qty-minus').disabled=state.quantity<=1;q('#qty-plus').disabled=state.quantity>=999;
 }
 function validateQuantity(){
  const raw=q('#quantity').value,n=Number(raw);
  const valid=raw.trim()!==''&&Number.isInteger(n)&&n>=1&&n<=999;
  q('#quantity').setAttribute('aria-invalid',String(!valid));
  q('#qty-error').textContent=valid?'':'수량은 1~999개의 정수로 입력해 주세요.';
  if(valid){state.quantity=n;renderEstimate();}
  else{q('#total').textContent='수량 확인';q('#qty-minus').disabled=true;q('#qty-plus').disabled=true;}
  return valid;
 }
 function chooseGrade(grade){if(!prices[grade])return;state.grade=grade;renderEstimate();validateQuantity();}
 qa('[data-grade]').forEach(el=>el.addEventListener('click',()=>chooseGrade(el.dataset.grade)));
 q('#quantity').addEventListener('input',validateQuantity);
 q('#qty-minus').addEventListener('click',()=>{q('#quantity').value=Math.max(1,state.quantity-1);validateQuantity();});
 q('#qty-plus').addEventListener('click',()=>{q('#quantity').value=Math.min(999,state.quantity+1);validateQuantity();});
 qa('[data-select-grade]').forEach(el=>el.addEventListener('click',()=>{chooseGrade(el.dataset.selectGrade);q('#estimate').scrollIntoView({behavior:'smooth',block:'start'});}));
 function quoteSummary(){
  const grade=prices[state.grade];
  return '<div class="summary-row"><span>테이블 등급</span><strong>'+grade.name+'</strong></div><div class="summary-row"><span>기준 규격</span><strong>1200×800 이하</strong></div><div class="summary-row"><span>단가 · 수량</span><strong>'+won(grade.price)+' × '+state.quantity+'개</strong></div><div class="summary-row emphasis"><span>예상 금액</span><strong>'+won(grade.price*state.quantity)+'</strong></div>';
 }
 function quoteText(){return ['[멋:테이블 예상견적]','등급: '+prices[state.grade].name,'규격: 1200×800 이하','수량: '+state.quantity+'개','예상 금액: '+won(prices[state.grade].price*state.quantity),'부가세·배송비·추가 옵션 별도'].join('\n');}
 function openDialog(selector){qa('dialog[open]').forEach(d=>d.close());q(selector).showModal();}
 qa('[data-close]').forEach(el=>el.addEventListener('click',()=>el.closest('dialog').close()));
 qa('dialog').forEach(d=>d.addEventListener('click',event=>{if(event.target===d){const r=d.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)d.close();}}));
 q('#estimate-confirm').addEventListener('click',()=>{if(!validateQuantity()){q('#quantity').focus();return;}q('#estimate-summary').innerHTML=quoteSummary();openDialog('#estimate-dialog');});
 let toastTimer;
 function toast(text){q('#toast').textContent=text;q('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>q('#toast').hidden=true,2800);}
 q('#copy-quote').addEventListener('click',()=>{if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(quoteText()).then(()=>toast('예상견적을 복사했습니다. 카카오톡에 붙여넣어 주세요.')).catch(()=>toast('표시된 등급과 수량을 카카오톡에 알려주세요.'));else toast('표시된 등급과 수량을 카카오톡에 알려주세요.');});
 q('#menu-toggle').addEventListener('click',()=>{const expanded=q('#menu-toggle').getAttribute('aria-expanded')==='true';q('#menu-toggle').setAttribute('aria-expanded',String(!expanded));q('#menu-toggle').setAttribute('aria-label',expanded?'메뉴 열기':'메뉴 닫기');q('#mobile-nav').hidden=expanded;});
 qa('#mobile-nav a').forEach(a=>a.addEventListener('click',()=>{q('#mobile-nav').hidden=true;q('#menu-toggle').setAttribute('aria-expanded','false');q('#menu-toggle').setAttribute('aria-label','메뉴 열기');}));

 const photos=qa('.photo-card img').map(im=>({src:im.src,alt:im.alt}));let photoIndex=0;
 function renderPhoto(){q('#gallery-image').src=photos[photoIndex].src;q('#gallery-image').alt=photos[photoIndex].alt;q('#gallery-counter').textContent=(photoIndex+1)+' / '+photos.length;}
 qa('[data-photo]').forEach(el=>el.addEventListener('click',()=>{photoIndex=Number(el.dataset.photo);renderPhoto();openDialog('#gallery-dialog');}));
 q('#gallery-open').addEventListener('click',()=>q('#full-portfolio').scrollIntoView({behavior:'smooth'}));
 function movePhoto(delta){photoIndex=(photoIndex+delta+photos.length)%photos.length;renderPhoto();}
 q('#photo-prev').addEventListener('click',()=>movePhoto(-1));q('#photo-next').addEventListener('click',()=>movePhoto(1));
 q('#gallery-dialog').addEventListener('keydown',event=>{if(event.key==='ArrowLeft')movePhoto(-1);if(event.key==='ArrowRight')movePhoto(1);});
 function showCatalog(el,review=false){
  const im=el.querySelector('img'),name=el.querySelector('h3,strong')?.textContent||im.alt;
  q('#catalog-dialog-title').textContent=review?'고객 후기':name;
  q('#catalog-image').src=im.src;q('#catalog-image').alt=im.alt;
  q('#catalog-actions').hidden=review;
  q('#catalog-consult').dataset.product=name;
  openDialog('#catalog-dialog');
 }
 qa('[data-product]').forEach(el=>{
  el.addEventListener('click',event=>{event.preventDefault();showCatalog(el);});
  if(el.getAttribute('role')==='button')el.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();showCatalog(el);}});
 });
 qa('[data-review]').forEach(el=>el.addEventListener('click',()=>showCatalog(el,true)));
 q('#portfolio-more').addEventListener('click',()=>{
  const btn=q('#portfolio-more'),expanded=btn.getAttribute('aria-expanded')==='true';
  btn.setAttribute('aria-expanded',String(!expanded));q('#all-portfolio-cases').classList.toggle('portfolioCollapsed',expanded);
  btn.innerHTML=expanded?'포트폴리오 더보기 <span aria-hidden="true">↓</span>':'포트폴리오 접기 <span aria-hidden="true">↓</span>';
  if(expanded)q('#full-portfolio').scrollIntoView({behavior:'smooth'});
 });
 qa('.legacy-home .portfolioGallery').forEach(gallery=>{
  const track=gallery.querySelector('.galleryTrack'),slides=Array.from(track.querySelectorAll('.gallerySlide'));
  gallery.querySelectorAll('.galleryTop button').forEach((button,index)=>button.addEventListener('click',()=>{
   const left=track.scrollLeft;
   let active=slides.reduce((best,el,i)=>Math.abs(el.offsetLeft-left)<Math.abs(slides[best].offsetLeft-left)?i:best,0);
   active=(active+(index===0?-1:1)+slides.length)%slides.length;
   track.scrollTo({left:slides[active].offsetLeft,behavior:'smooth'});
  }));
 });

 qa('[data-contact-form]').forEach(el=>el.addEventListener('click',()=>{q('#cSeats').value=state.quantity;openDialog('#consult-dialog');}));
 const form=q('#consultForm'),formStatus=q('#consultStatus');let formStarted=false;
 form.addEventListener('focusin',()=>{if(!formStarted){formStarted=true;window.meotAnalytics?.track('form_start',{form:'consult_detail_v3'});}});
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(!form.reportValidity())return;
  const phone=q('#cPhone').value.replace(/\D/g,'');
  if(!/^\d{10,11}$/.test(phone)){formStatus.textContent='연락처를 다시 확인해 주세요.';q('#cPhone').focus();return;}
  if(!window.meotLeadDb?.save){formStatus.textContent='현재 문의 접수를 연결할 수 없습니다. 카카오톡으로 바로 문의해 주세요.';return;}
  const region=q('#cRegion').value.trim(),industry=q('#cType').value.trim(),quantity=q('#cSeats').value.trim();
  const message=['[멋:테이블 견적 요청]','지역: '+region,'업종: '+industry,'테이블 수량: '+quantity,'관심 등급: '+prices[state.grade].name,'연락처: '+phone].join('\n');
  const button=form.querySelector('[type="submit"]');button.disabled=true;formStatus.textContent='상담 내용을 전송하고 있습니다…';
  try{
   await window.meotLeadDb.save({name:'홈페이지 고객',phone,region,industry,opening:'',channel:'카카오톡',source:'홈페이지 견적 요청',memo:message,page:location.href});
   window.meotAnalytics?.track('form_submit',{form:'consult_detail_v3',channel:'kakao'});
   formStatus.textContent='상담 내용을 전송했습니다. 매장 사진이나 도면은 카카오톡으로 보내주세요.';
   button.textContent='전송 완료';
  }catch(error){formStatus.textContent='전송하지 못했습니다. 다시 시도하거나 카카오톡으로 문의해 주세요.';button.disabled=false;}
 });
 form.addEventListener('input',()=>{const button=form.querySelector('[type="submit"]');if(button.textContent==='전송 완료'){button.disabled=false;button.textContent='견적 요청 보내기';formStatus.textContent='';}});
 renderEstimate();renderBookings();loadBookings();
 window.MeotSite={monthKey,reservationStatus};
})();
