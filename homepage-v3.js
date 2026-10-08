(function(){
 'use strict';
 const q=s=>document.querySelector(s),qa=s=>Array.from(document.querySelectorAll(s));
 // Keep page navigation short even when sections are far apart.
 let sectionScrollFrame=0;
 function cancelSectionScroll(){cancelAnimationFrame(sectionScrollFrame);sectionScrollFrame=0;}
 function closeMobileMenu(){
  q('#mobile-nav').hidden=true;
  q('#menu-toggle').setAttribute('aria-expanded','false');
  q('#menu-toggle').setAttribute('aria-label','메뉴 열기');
 }
 function scrollToSection(target){
  if(!target)return;
  cancelSectionScroll();closeMobileMenu();
  const start=window.scrollY,started=performance.now();
  const duration=matchMedia('(prefers-reduced-motion: reduce)').matches?0:400;
  function destination(){
   const header=q('.site-header');
   const offset=(header?header.getBoundingClientRect().height:0)+12;
   return Math.max(0,Math.min(target.getBoundingClientRect().top+window.scrollY-offset,document.documentElement.scrollHeight-window.innerHeight));
  }
  function finish(){
   sectionScrollFrame=0;
   const temporary=!target.hasAttribute('tabindex');
   if(temporary)target.setAttribute('tabindex','-1');
   target.focus({preventScroll:true});
   if(temporary)target.addEventListener('blur',()=>target.removeAttribute('tabindex'),{once:true});
  }
  function step(now){
   const progress=duration?Math.min(1,(now-started)/duration):1;
   const eased=1-Math.pow(1-progress,3);
   window.scrollTo({top:start+(destination()-start)*eased,behavior:'instant'});
   if(progress<1)sectionScrollFrame=requestAnimationFrame(step);else finish();
  }
  if(duration)sectionScrollFrame=requestAnimationFrame(step);else step(started);
 }
 document.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const link=event.target.closest('a[href^="#"]');
  if(!link||link.hasAttribute('download')||(link.target&&link.target!=='_self'))return;
  const hash=link.getAttribute('href');let target;
  try{target=document.getElementById(decodeURIComponent(hash.slice(1)));}catch(_){return;}
  if(!target)return;
  event.preventDefault();
  if(location.hash!==hash)history.pushState(null,'',hash);
  scrollToSection(target);
 });
 ['wheel','touchstart','pointerdown'].forEach(type=>window.addEventListener(type,cancelSectionScroll,{passive:true}));
 window.addEventListener('keydown',event=>{if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End','Escape',' '].includes(event.key))cancelSectionScroll();});
 window.addEventListener('popstate',cancelSectionScroll);
 const prices={basic:{name:'기본형',price:59000},middle:{name:'중급형',price:89000},premium:{name:'고급형',price:129000}};
 const state={grade:'basic',quantity:10,top:'',chair:''};
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
  qa('[data-confirmed-summary]').forEach(el=>el.textContent=status.known?'월 10팀 · 확정 '+status.confirmed+'팀':'월 10팀 · 예약 현황 문의');
  qa('[data-reservation-left]').forEach(el=>el.textContent=status.known?String(status.remaining):'문의');
  qa('[data-reservation-state]').forEach(el=>el.textContent=status.closed?'예약 마감':status.known?'남은 자리':'예약 현황');
  qa('[data-reservation-unit]').forEach(el=>el.hidden=!status.known);
  qa('[data-booking-panel]').forEach(el=>{
   el.classList.toggle('is-unknown',!status.known);
   el.classList.toggle('is-closed',status.closed);
   el.setAttribute('aria-label',month+' 프리미엄 고급형 제작 예약: 월 10팀 한정, '+(status.known?'확정 '+status.confirmed+'팀, 남은 자리 '+status.remaining+'팀':'현재 예약 현황은 상담으로 안내합니다.'));
  });
  qa('[data-reservation-progress]').forEach(el=>{
   el.hidden=!status.known;
   el.setAttribute('aria-valuenow',status.known?String(status.confirmed):'0');
   el.setAttribute('aria-valuetext',status.known?'10팀 중 '+status.confirmed+'팀 확정, '+status.remaining+'팀 남음':'예약 현황 확인 중');
  });
  qa('[data-reservation-fill]').forEach(el=>el.style.width=status.known?String(status.confirmed/BOOKING_CAPACITY*100)+'%':'0%');
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

 const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const catalog={top:[],chair:[]};
 qa('[data-product]').forEach(el=>{
  const kind=el.closest('#chairs')?'chair':'top',im=el.querySelector('img');
  const name=el.querySelector('h3,strong')?.textContent.trim()||im.alt;
  catalog[kind].push({name,el});
  const option=document.createElement('option');option.value=name;option.textContent=name;
  q(kind==='chair'?'#quote-chair':'#quote-top').append(option);
  el.setAttribute('aria-label',name+' 선택하고 견적 보기');
 });
 function config(){
  const size=q('#quote-size').value,qty=Number(q('#quantity').value);
  const fixed=['1200×800','1100×700','800×800'].includes(size);
  const valid=Number.isInteger(qty)&&qty>=1&&qty<=999;
  const supply=fixed&&valid?prices[state.grade].price*qty:null;
  return {top:state.top||'상담 후 결정',chair:q('#estimate-chair').checked?(state.chair||'상담 후 결정'):'미포함',chairQty:q('#quote-chair-quantity').value,
   size:size==='custom'?(q('#quote-width').value||'미정')+'×'+(q('#quote-depth').value||'미정'):size==='undecided'?'상담 후 결정':size,
   qty,cutlery:q('#estimate-cutlery').selectedOptions[0].textContent,delivery:q('#quote-delivery').value||'상담 후 결정',supply,total:supply===null?null:Math.round(supply*1.1)};
 }
 function saveConfiguration(){
  // Store only product choices, never contact details; preserve choices after returning from Kakao.
  try{sessionStorage.setItem('meot_product_quote_v1',JSON.stringify({grade:state.grade,top:state.top,chair:state.chair,fields:Object.fromEntries(['quantity','quote-size','quote-width','quote-depth','quote-chair-quantity','estimate-cutlery','quote-delivery'].map(id=>[id,q('#'+id).value])),includeChair:q('#estimate-chair').checked}));}catch(_){}
 }
 function renderEstimate(){
  const c=config();
  qa('[data-grade]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.grade===state.grade)));
  q('#total').textContent=c.total===null?'맞춤 견적 안내':won(c.total);
  q('#estimate-breakdown').textContent=c.total===null?'규격과 제작 사양을 확인해 금액을 안내합니다.':'공급가 '+won(c.supply)+' + 부가세 '+won(c.total-c.supply);
  q('#qty-minus').disabled=state.quantity<=1;q('#qty-plus').disabled=state.quantity>=999;
  q('#quote-custom').hidden=q('#quote-size').value!=='custom';
  q('#quote-chair-quantity-label').hidden=!q('#estimate-chair').checked;
  q('#chair-scope').hidden=!q('#estimate-chair').checked;
  q('#quote-picked').textContent='선택한 구성 · 상판 '+c.top+' / 의자 '+c.chair;
  saveConfiguration();
 }
 function validateQuantity(){
  const raw=q('#quantity').value,n=Number(raw),valid=raw.trim()!==''&&Number.isInteger(n)&&n>=1&&n<=999;
  q('#quantity').setAttribute('aria-invalid',String(!valid));q('#qty-error').textContent=valid?'':'수량은 1~999개의 정수로 입력해 주세요.';
  if(valid){state.quantity=n;renderEstimate();}else{q('#total').textContent='수량 확인';q('#qty-minus').disabled=true;q('#qty-plus').disabled=true;}
  return valid;
 }
 function validateConfig(){
  if(!validateQuantity()){q('#quantity').focus();return false;}
  let field=null,message='';
  if(q('#quote-size').value==='custom'){
   field=['#quote-width','#quote-depth'].map(q).find(el=>!el.value||!el.checkValidity());
   if(field)message='가로·세로 규격을 100~10000 mm의 정수로 입력해 주세요.';
  }
  if(!field&&q('#estimate-chair').checked&&(!q('#quote-chair-quantity').value||!q('#quote-chair-quantity').checkValidity())){field=q('#quote-chair-quantity');message='의자 수량은 1~9999개의 정수로 입력해 주세요.';}
  q('#quote-config-error').textContent=message;if(field){field.focus();return false;}return true;
 }
 function chooseGrade(grade){if(!prices[grade])return;state.grade=grade;renderEstimate();validateQuantity();}
 qa('[data-grade]').forEach(el=>el.addEventListener('click',()=>chooseGrade(el.dataset.grade)));
 q('#quantity').addEventListener('input',validateQuantity);
 q('#qty-minus').addEventListener('click',()=>{q('#quantity').value=Math.max(1,state.quantity-1);validateQuantity();});
 q('#qty-plus').addEventListener('click',()=>{q('#quantity').value=Math.min(999,state.quantity+1);validateQuantity();});
 qa('[data-select-grade]').forEach(el=>el.addEventListener('click',()=>{chooseGrade(el.dataset.selectGrade);scrollToSection(q('#estimate'));}));
 ['quote-size','quote-width','quote-depth','quote-chair-quantity','estimate-cutlery','quote-delivery'].forEach(id=>q('#'+id).addEventListener('input',renderEstimate));
 q('#quote-top').addEventListener('change',()=>{state.top=q('#quote-top').value;renderEstimate();});
 q('#quote-chair').addEventListener('change',()=>{state.chair=q('#quote-chair').value;q('#estimate-chair').checked=!!state.chair;renderEstimate();});
 q('#estimate-chair').addEventListener('change',()=>{if(!q('#estimate-chair').checked){state.chair='';q('#quote-chair').value='';}renderEstimate();});
 function selectProduct(el){
  const kind=el.closest('#chairs')?'chair':'top',item=catalog[kind].find(x=>x.el===el);
  if(!item)return;state[kind]=item.name;q(kind==='chair'?'#quote-chair':'#quote-top').value=item.name;
  if(kind==='chair')q('#estimate-chair').checked=true;
  qa('dialog[open]').forEach(d=>d.close());renderEstimate();scrollToSection(q('#estimate'));
 }
 function quoteSummary(){
  const c=config(),rows=[['상판 디자인',c.top],['제작 등급',prices[state.grade].name],['테이블 규격·수량',c.size+' / '+c.qty+'개'],['수저통',c.cutlery],['의자',c.chair+(c.chair==='미포함'?'':' / '+c.chairQty+'개')],['희망 납품일',c.delivery],['테이블 기준 예상금액',c.total===null?'상담 후 안내':won(c.total)+' (부가세 포함)']];
  return rows.map(([label,value])=>'<div class="summary-row"><span>'+label+'</span><strong>'+escapeHtml(value)+'</strong></div>').join('');
 }
 function quoteText(){const c=config();return ['[멋:테이블 견적 상담]','상판: '+c.top,'제작 등급: '+prices[state.grade].name,'테이블: '+c.size+' / '+c.qty+'개','수저통: '+c.cutlery,'의자: '+c.chair+(c.chair==='미포함'?'':' / '+c.chairQty+'개'),'희망 납품일: '+c.delivery,'테이블 기준 예상금액: '+(c.total===null?'상담 후 안내':won(c.total)+' (부가세 포함)'),'선택 디자인·다리 구성·수저통·의자·배송비 상담 후 확정'].join('\n');}
 try{
  const saved=JSON.parse(sessionStorage.getItem('meot_product_quote_v1')||'null');
  if(saved){if(prices[saved.grade])state.grade=saved.grade;
   ['top','chair'].forEach(kind=>{if(catalog[kind].some(x=>x.name===saved[kind])){state[kind]=saved[kind];q('#quote-'+kind).value=saved[kind];}});
   for(const id of ['quantity','quote-size','quote-width','quote-depth','quote-chair-quantity','estimate-cutlery','quote-delivery'])if(typeof saved.fields?.[id]==='string')q('#'+id).value=saved.fields[id];
   if(!q('#quote-size').value)q('#quote-size').value='1200×800';if(!q('#estimate-cutlery').value)q('#estimate-cutlery').value='undecided';
   q('#estimate-chair').checked=!!saved.includeChair;state.quantity=Number(q('#quantity').value)||10;
  }
 }catch(_){}
 function openDialog(selector){qa('dialog[open]').forEach(d=>d.close());q(selector).showModal();}
 qa('[data-close]').forEach(el=>el.addEventListener('click',()=>el.closest('dialog').close()));
 qa('dialog').forEach(d=>d.addEventListener('click',event=>{if(event.target===d){const r=d.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)d.close();}}));
 q('#estimate-confirm').addEventListener('click',()=>{if(!validateConfig())return;q('#estimate-summary').innerHTML=quoteSummary();q('#quote-copy-text').value=quoteText();openDialog('#estimate-dialog');});
 let toastTimer;
 function toast(text){q('#toast').textContent=text;q('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>q('#toast').hidden=true,2800);}
 q('#copy-quote').addEventListener('click',()=>window.meotContactFlow.copyAndOpen({text:quoteText(),href:'https://pf.kakao.com/_BZeSX/chat',button:q('#copy-quote'),status:q('#quote-chat-status'),fallback:q('#quote-copy-fallback'),textarea:q('#quote-copy-text')}));
 q('#menu-toggle').addEventListener('click',()=>{const expanded=q('#menu-toggle').getAttribute('aria-expanded')==='true';q('#menu-toggle').setAttribute('aria-expanded',String(!expanded));q('#menu-toggle').setAttribute('aria-label',expanded?'메뉴 열기':'메뉴 닫기');q('#mobile-nav').hidden=expanded;});
 qa('#mobile-nav a').forEach(a=>a.addEventListener('click',()=>{q('#mobile-nav').hidden=true;q('#menu-toggle').setAttribute('aria-expanded','false');q('#menu-toggle').setAttribute('aria-label','메뉴 열기');}));

 const photos=qa('.photo-card img').map(im=>({src:im.src,alt:im.alt}));let photoIndex=0;
 function renderPhoto(){q('#gallery-image').src=photos[photoIndex].src;q('#gallery-image').alt=photos[photoIndex].alt;q('#gallery-counter').textContent=(photoIndex+1)+' / '+photos.length;}
 qa('[data-photo]').forEach(el=>el.addEventListener('click',()=>{photoIndex=Number(el.dataset.photo);renderPhoto();openDialog('#gallery-dialog');}));
 q('#gallery-open').addEventListener('click',()=>scrollToSection(q('#full-portfolio')));
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
  el.addEventListener('click',event=>{event.preventDefault();selectProduct(el);});
  if(el.getAttribute('role')==='button')el.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();selectProduct(el);}});
 });
 qa('[data-review]').forEach(el=>el.addEventListener('click',()=>showCatalog(el,true)));
 q('#portfolio-more').addEventListener('click',()=>{
  const btn=q('#portfolio-more'),expanded=btn.getAttribute('aria-expanded')==='true';
  btn.setAttribute('aria-expanded',String(!expanded));q('#all-portfolio-cases').classList.toggle('portfolioCollapsed',expanded);
  btn.innerHTML=expanded?'포트폴리오 더보기 <span aria-hidden="true">↓</span>':'포트폴리오 접기 <span aria-hidden="true">↓</span>';
  if(expanded)scrollToSection(q('#full-portfolio'));
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

 function openRequest(){if(!validateConfig())return;q('#cSeats').value=state.quantity;q('#cCutlery').value=q('#estimate-cutlery').selectedOptions[0].textContent;q('#cDelivery').value=q('#quote-delivery').value;q('#consult-config-summary').innerHTML=quoteSummary();openDialog('#consult-dialog');}
 qa('[data-contact-form]').forEach(el=>el.addEventListener('click',openRequest));q('#quote-request-open').addEventListener('click',openRequest);
 ['cSeats','cCutlery','cDelivery'].forEach(id=>q('#'+id).addEventListener('input',()=>{
  q('#quantity').value=q('#cSeats').value;state.quantity=Number(q('#cSeats').value);
  const option=Array.from(q('#estimate-cutlery').options).find(o=>o.textContent===q('#cCutlery').value);if(option)q('#estimate-cutlery').value=option.value;
  q('#quote-delivery').value=q('#cDelivery').value;renderEstimate();q('#consult-config-summary').innerHTML=quoteSummary();
 }));
 const form=q('#consultForm'),formStatus=q('#consultStatus');let formStarted=false,consultMessage='',consultPending=false;
 form.addEventListener('focusin',()=>{if(!formStarted){formStarted=true;window.meotAnalytics?.track('form_start',{form:'consult_detail_v3'});}});
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(consultPending||form.querySelector('[type="submit"]').disabled||!form.reportValidity())return;
  const phone=q('#cPhone').value.replace(/\D/g,'');
  if(!/^\d{10,11}$/.test(phone)){formStatus.textContent='연락처를 다시 확인해 주세요.';q('#cPhone').focus();return;}
  if(!window.meotLeadDb?.save){formStatus.textContent='현재 문의 접수를 연결할 수 없습니다. 카카오톡으로 바로 문의해 주세요.';return;}
  const region=q('#cRegion').value.trim(),industry=q('#cType').value.trim(),quantity=q('#cSeats').value.trim();
  const message=quoteText()+'\n상호: '+(q('#cStore').value.trim()||'미입력')+'\n지역: '+region+'\n업종: '+industry+'\n연락처: '+phone;
  consultMessage=message;q('#consult-copy-text').value=message;
  const button=form.querySelector('[type="submit"]');button.disabled=true;consultPending=true;formStatus.textContent='상담 내용을 전송하고 있습니다…';
  try{
   await window.meotLeadDb.save({name:q('#cStore').value.trim()||'홈페이지 고객',phone,region,industry,opening:q('#cDelivery').value,channel:'카카오톡',source:'홈페이지 견적 요청',memo:message,page:location.href});
   // Current opaque Apps Script response cannot prove a DB commit or owner receipt.
   formStatus.textContent='전송 요청을 보냈지만 저장 완료는 확인하지 못했습니다. 기다리지만 마시고 아래 버튼으로 카카오 상담을 이어가 주세요.';
  }catch(error){formStatus.textContent='접수 여부를 확인하지 못했습니다. 작성 내용은 유지됩니다. 중복 신청 대신 아래 버튼으로 카카오 상담을 이어가 주세요.';}
  finally{consultPending=false;button.textContent='접수 확인 필요';q('#consultFallback').hidden=false;}
 });
 q('#consult-copy-chat').addEventListener('click',()=>window.meotContactFlow.copyAndOpen({text:consultMessage,href:'https://pf.kakao.com/_BZeSX/chat',button:q('#consult-copy-chat'),status:formStatus,fallback:q('#consult-copy-manual'),textarea:q('#consult-copy-text')}));
 form.addEventListener('input',()=>{if(consultPending)return;const button=form.querySelector('[type="submit"]');if(button.textContent==='접수 확인 필요'){button.disabled=false;button.textContent='견적 요청 보내기';formStatus.textContent='';q('#consultFallback').hidden=true;}});
 renderEstimate();renderBookings();loadBookings();
 window.MeotSite={monthKey,reservationStatus};
})();




/* Compact catalogs: native touch scrolling, keyboard arrows and full-grid toggle. */
(function(){
 'use strict';
 document.querySelectorAll('.compactCatalog').forEach(section=>{
  const rail=section.querySelector('.compactCatalogRail'),toggle=section.querySelector('[data-catalog-all]');
  const arrows=section.querySelector('.compactCatalogArrows'),buttons=[...arrows.querySelectorAll('button')];
  const original=toggle.textContent;
  function sync(){buttons[0].disabled=rail.scrollLeft<=2;buttons[1].disabled=rail.scrollLeft+rail.clientWidth>=rail.scrollWidth-2;}
  function move(direction){const card=rail.firstElementChild;const gap=parseFloat(getComputedStyle(rail).gap)||0;rail.scrollBy({left:direction*(card.getBoundingClientRect().width+gap),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
  buttons.forEach(button=>button.addEventListener('click',()=>move(Number(button.dataset.catalogStep))));
  rail.addEventListener('scroll',sync,{passive:true});window.addEventListener('resize',sync);
  rail.addEventListener('keydown',event=>{if(event.target===rail&&!section.classList.contains('is-expanded')&&['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();move(event.key==='ArrowRight'?1:-1);}});
  toggle.addEventListener('click',()=>{
   const expanded=section.classList.toggle('is-expanded');toggle.setAttribute('aria-expanded',String(expanded));
   toggle.textContent=expanded?'접고 옆으로 보기 ↑':original;arrows.hidden=expanded;
   rail.setAttribute('aria-label',expanded?'전체 디자인 목록':'디자인, 옆으로 넘겨 보기');
   if(!expanded){rail.scrollLeft=0;section.scrollIntoView({block:'start',behavior:'instant'});}
   sync();
  });sync();
 });
})();



