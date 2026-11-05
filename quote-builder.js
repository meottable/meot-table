/* 견적 직접 맞춰보기: a friendlier front for the existing #estimate form.
   Every choice is written into the original (hidden) form, and sending uses the
   original confirm button, so tracking, lead saving and the Kakao copy flow stay the same. */
(function(){
 'use strict';
 const sec=document.getElementById('estimate');
 if(!sec||!document.getElementById('quote-top'))return;
 const q=s=>document.querySelector(s),qa=s=>Array.from(document.querySelectorAll(s));
 const P={basic:[59000,110000,145000],middle:[89000,150000,185000],premium:[129000,180000,220000]};
 const GN={basic:'스탠다드',middle:'프로',premium:'시그니처'};
 const SIZES=['1200×800','1600×800','1800×800'],SN=['가로 1200 이하','가로 1600 이하','가로 1800 이상'];
 const won=n=>n.toLocaleString('ko-KR')+'원';
 const cardName=el=>(el.querySelector('h3,strong')?.textContent||el.querySelector('img')?.alt||'').trim();
 const cardImg=el=>{const im=el.querySelector('img');return im?(im.currentSrc||im.getAttribute('src')):'';};
 const tops=qa('#design [data-product]').map(el=>({n:cardName(el),img:cardImg(el)})).filter(x=>x.n);
 const chairs=qa('#chairs [data-product]').map(el=>({n:cardName(el),img:cardImg(el)})).filter(x=>x.n);
 const st={top:'',grade:'basic',size:0,qty:10,chair:''};

 function readLegacy(){
  st.top=q('#quote-top').value||'';
  const g=q('#estimate [data-grade][aria-pressed="true"]');if(g&&P[g.dataset.grade])st.grade=g.dataset.grade;
  const i=SIZES.indexOf(q('#quote-size').value);st.size=i<0?0:i;
  const n=parseInt(q('#quantity').value,10);st.qty=n>=1&&n<=999?n:10;
  st.chair=q('#estimate-chair').checked?(q('#quote-chair').value||''):'';
 }
 function fire(el,type){el.dispatchEvent(new Event(type,{bubbles:true}));}
 function writeLegacy(){
  const t=q('#quote-top');if(t.value!==st.top){t.value=st.top;fire(t,'change');}
  const g=q('#estimate [data-grade="'+st.grade+'"]');if(g&&g.getAttribute('aria-pressed')!=='true')g.click();
  const s=q('#quote-size');if(s.value!==SIZES[st.size]){s.value=SIZES[st.size];fire(s,'input');fire(s,'change');}
  const qt=q('#quantity');if(qt.value!==String(st.qty)){qt.value=String(st.qty);fire(qt,'input');}
  const c=q('#quote-chair'),ec=q('#estimate-chair');
  if(c.value!==st.chair){c.value=st.chair;fire(c,'change');}
  if(ec.checked!==!!st.chair){ec.checked=!!st.chair;fire(ec,'change');}
 }

 const sigFirst=[...tops.filter(t=>/시그니처|MT0/.test(t.n)),...tops.filter(t=>!/시그니처|MT0/.test(t.n))];
 const box=document.createElement('div');box.className='qb';
 box.innerHTML=`
  <h2>견적, 직접 맞춰보세요</h2>
  <p class="qb-lead">고르는 대로 금액이 바로 바뀝니다. 다 고르면 그 구성 그대로 카카오톡으로 보내실 수 있어요.</p>
  <div class="qb-step"><h3>상판 무늬 <em>${tops.length}종</em></h3><p class="qb-pick">선택: <b data-qb="pickTop"></b></p><div class="qb-sw" data-qb="tops"></div><button type="button" class="qb-more" data-qb="more"></button></div>
  <div class="qb-step"><h3>등급</h3><div class="qb-opts">
   <label class="qb-opt"><input type="radio" name="qb-grade" value="basic"><span><span class="n">스탠다드</span><span class="s">압착 180℃ · 가압력 150톤</span></span><span class="p">59,000<small>원부터</small></span></label>
   <label class="qb-opt"><input type="radio" name="qb-grade" value="middle"><span><span class="n">프로<i>BEST</i></span><span class="s">압착 190℃ · 가압력 200톤</span></span><span class="p">89,000<small>원부터</small></span></label>
   <label class="qb-opt"><input type="radio" name="qb-grade" value="premium"><span><span class="n">시그니처</span><span class="s">압착 200℃ · 가압력 400톤 · 월 10팀 한정</span></span><span class="p">129,000<small>원부터</small></span></label>
  </div><p class="qb-pick" style="margin-top:10px">온도와 가압력은 제조 공정 설정값입니다. 사용 가능 온도나 수명을 뜻하지 않습니다.</p></div>
  <div class="qb-step"><h3>규격과 수량 <em>세로 800mm 이하</em></h3><div class="qb-opts">
   ${SN.map((n,i)=>`<label class="qb-opt"><input type="radio" name="qb-size" value="${i}"><span><span class="n">${n}</span><span class="s">${['2~4인석','4~6인석','단체석'][i]}</span></span><span class="p" data-qb-sp="${i}"></span></label>`).join('')}
  </div><div class="qb-qty" role="group" aria-label="테이블 수량"><button type="button" data-qb="minus" aria-label="수량 줄이기">−</button><output data-qb="qty" aria-live="polite"></output><button type="button" data-qb="plus" aria-label="수량 늘리기">+</button></div></div>
  <div class="qb-step"><h3>의자 <em>선택 · 금액은 별도 견적</em></h3><p class="qb-pick">선택: <b data-qb="pickChair"></b></p><div class="qb-rail" data-qb="chairs"></div></div>
  <div class="qb-sum">
   <div class="qb-tag" data-qb="tag"><small>테이블 예상 금액 · 부가세 포함</small><b data-qb="total"></b>
    <dl><dt>상판</dt><dd data-qb="sTop"></dd><dt>등급</dt><dd data-qb="sGrade"></dd><dt>규격</dt><dd data-qb="sSize"></dd><dt>의자</dt><dd data-qb="sChair"></dd><dt>공급가</dt><dd data-qb="sSupply"></dd></dl></div>
   <div><p class="qb-note">배송비, 다리 형태, 수저통, 의자 금액은 견적서에 항목별로 따로 적어드립니다. 최종 금액은 상담 후 확정됩니다.</p><button type="button" class="qb-send" data-qb="send">이 구성으로 카카오톡 견적 받기</button></div>
  </div>`;
 sec.prepend(box);sec.classList.add('qb-on');
 const bar=document.createElement('div');bar.className='qb-bar';bar.setAttribute('aria-hidden','true');
 bar.innerHTML='<div><small>예상 금액</small><b data-qb="barTotal"></b></div><button type="button" tabindex="-1" data-qb="barSend">이 구성으로 상담</button>';
 document.body.append(bar);
 const $=k=>document.querySelector('[data-qb="'+k+'"]');

 let showAll=false;
 function drawTops(){
  const el=$('tops');el.innerHTML='';
  (showAll?sigFirst:sigFirst.slice(0,16)).forEach(t=>{
   const b=document.createElement('button');b.type='button';b.className='qb-s'+(/시그니처|MT0/.test(t.n)?' sig':'');
   b.setAttribute('aria-pressed',String(st.top===t.n));b.setAttribute('aria-label',t.n+' 상판 선택');
   b.innerHTML='<img alt="" loading="lazy"><span></span>';b.querySelector('img').src=t.img;b.querySelector('span').textContent=t.n.replace('시그니처 ','');
   b.onclick=()=>{st.top=st.top===t.n?'':t.n;drawTops();sync();};el.append(b);
  });
  $('more').textContent=showAll?'접기':'상판 '+tops.length+'종 모두 보기';
 }
 $('more').onclick=()=>{showAll=!showAll;drawTops();if(!showAll)$('tops').scrollIntoView({block:'start'});};
 function drawChairs(){
  const el=$('chairs');el.innerHTML='';
  const none=document.createElement('button');none.type='button';none.className='qb-c none';none.textContent='선택 안 함';
  none.setAttribute('aria-pressed',String(!st.chair));none.onclick=()=>{st.chair='';drawChairs();sync();};el.append(none);
  chairs.forEach(c=>{
   const b=document.createElement('button');b.type='button';b.className='qb-c';b.setAttribute('aria-pressed',String(st.chair===c.n));
   b.innerHTML='<img alt="" loading="lazy"><span></span>';b.querySelector('img').src=c.img;b.querySelector('span').textContent=c.n;
   b.onclick=()=>{st.chair=c.n;drawChairs();sync();};el.append(b);
  });
 }
 qa('input[name=qb-grade]').forEach(i=>i.onchange=()=>{st.grade=i.value;sync();});
 qa('input[name=qb-size]').forEach(i=>i.onchange=()=>{st.size=+i.value;sync();});
 $('minus').onclick=()=>{st.qty=Math.max(1,st.qty-1);sync();};
 $('plus').onclick=()=>{st.qty=Math.min(999,st.qty+1);sync();};

 function render(){
  const unit=P[st.grade][st.size],supply=unit*st.qty,total=Math.round(supply*1.1);
  qa('input[name=qb-grade]').forEach(i=>i.checked=i.value===st.grade);
  qa('input[name=qb-size]').forEach(i=>i.checked=+i.value===st.size);
  qa('[data-qb-sp]').forEach(e=>e.innerHTML=P[st.grade][+e.dataset.qbSp].toLocaleString('ko-KR')+'<small>원 / 개</small>');
  $('qty').textContent=st.qty;
  $('total').innerHTML=total.toLocaleString('ko-KR')+'<span>원</span>';
  const tag=$('tag');tag.classList.remove('qb-bump');void tag.offsetWidth;tag.classList.add('qb-bump');
  $('barTotal').textContent=won(total);
  $('pickTop').textContent=st.top||'아직 안 골랐어요 (상담 때 골라도 돼요)';
  $('pickChair').textContent=st.chair||'선택 안 함';
  $('sTop').textContent=st.top||'상담 후 결정';
  $('sGrade').textContent=GN[st.grade];
  $('sSize').textContent=SN[st.size]+' × '+st.qty+'개';
  $('sChair').textContent=st.chair?st.chair+' (별도 견적)':'선택 안 함';
  $('sSupply').textContent=won(supply)+' (개당 '+won(unit)+')';
 }
 function sync(){writeLegacy();render();}
 function send(){writeLegacy();q('#estimate-confirm').click();}
 $('send').onclick=send;$('barSend').onclick=send;

 // Picks made elsewhere on the page (design/chair cards, grade table) land in the legacy form; pull them in.
 function pull(){readLegacy();drawTops();drawChairs();render();}
 new IntersectionObserver(es=>es.forEach(e=>{
  bar.classList.toggle('show',e.isIntersecting);
  if(e.isIntersecting)pull();
 }),{threshold:.06}).observe(box);
 pull();
})();
