/* 고객 후기: 홈페이지에 저장된 후기(reviews/reviews.json)를 바로 그립니다.
 * - 후기 쓰기·관리자 승인은 기존 Google 후기 화면을 그대로 씁니다.
 * - reviews.json이 없거나 비어 있으면 예전 방식(Google 화면 끼워넣기)으로 자동 전환합니다.
 */
(function(){
 'use strict';
 const config=window.MEOT_REVIEWS||{};
 const section=document.getElementById('customer-reviews');
 const BASE='/meot-table/reviews/';
 function valid(value){try{const u=new URL(value);return u.origin==='https://script.google.com'&&/^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(u.pathname);}catch(_){return false;}}
 function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
 const GRADE={'기본형':'스탠다드','중급형':'프로','고급형':'시그니처'};
 const PAGE=window.matchMedia("(min-width:1001px)").matches?6:4;

 function writeUrl(){const u=new URL(config.publicUrl);u.searchParams.set('view','list');return u.href;}

 function renderStatic(data){
  const reviews=(data.reviews||[]).filter(r=>r&&r.body);
  const wrap=el('div','rv');
  const top=el('div','rv-top');
  const avg=reviews.length?(reviews.reduce((a,r)=>a+(Number(r.rating)||5),0)/reviews.length):0;
  const sum=el('p','rv-sum');sum.append(el('b','', '★ '+avg.toFixed(1)),' · 후기 '+reviews.length+'건');
  const write=el('a','rv-write','후기 남기기 ↗');write.href=valid(config.publicUrl)?writeUrl():'#';write.target='_blank';write.rel='noopener noreferrer';
  top.append(sum,write);
  const list=el('div','rv-list');
  const more=el('button','rv-more');more.type='button';
  let shown=0;
  function card(r){
   const c=el('article','rv-card');
   const photos=(r.photos||[]).slice(0,3);
   if(photos.length){
    const fig=el('button','rv-photo');fig.type='button';fig.setAttribute('aria-label',(r.storeName||'고객')+' 매장 사진 크게 보기');
    const img=el('img');img.src=BASE+photos[0];img.alt=(r.storeName||'고객')+' 매장 사진';img.loading='lazy';img.decoding='async';img.width=640;img.height=480;
    fig.append(img);if(photos.length>1)fig.append(el('span','rv-count','사진 '+photos.length+'장'));
    fig.onclick=()=>openViewer(r,0);c.append(fig);
   }
   const body=el('div','rv-body');
   const head=el('div','rv-head');head.append(el('h3','',r.storeName||'고객님'));
   if(r.business)head.append(el('span','rv-biz',r.business));
   if(GRADE[r.grade])head.append(el('span','rv-grade',GRADE[r.grade]+' 테이블'));
   const meta=el('div','rv-meta');const stars=el('span','rv-stars','★'.repeat(Math.min(5,Math.max(1,Number(r.rating)||5))));stars.setAttribute('aria-label','별점 '+(r.rating||5)+'점');
   meta.append(stars);if(r.created)meta.append(el('time','',String(r.created).slice(0,10).replaceAll('-','.')));
   const p=el('p','rv-text',r.body);
   body.append(head,meta,p);
   const t=el('button','rv-toggle','더 읽기');t.type='button';t.hidden=true;t.onclick=()=>{const open=c.classList.toggle('is-open');t.textContent=open?'접기':'더 읽기';};body.append(t);
   requestAnimationFrame(()=>{t.hidden=p.scrollHeight<=p.clientHeight+2;});
   c.append(body);return c;
  }
  function paint(){reviews.slice(shown,shown+PAGE).forEach(r=>list.append(card(r)));shown=Math.min(reviews.length,shown+PAGE);const left=reviews.length-shown;more.hidden=left<=0;more.textContent='후기 '+Math.min(PAGE,left)+'개 더 보기 ↓';}
  more.onclick=paint;
  wrap.append(top,list,more);
  if(!reviews.length)list.append(el('p','rv-empty','첫 후기를 기다리고 있어요.'));
  section.querySelector('.customerReviewsHead').after(wrap);
  paint();
 }

 let viewer;
 function openViewer(r,i){
  if(!viewer){
   viewer=el('dialog','rv-viewer');
   viewer.innerHTML='<button type="button" class="rv-x" aria-label="닫기">×</button><img alt=""><div class="rv-nav"><button type="button" class="rv-prev" aria-label="이전 사진">←</button><span></span><button type="button" class="rv-next" aria-label="다음 사진">→</button></div>';
   document.body.append(viewer);
   viewer.querySelector('.rv-x').onclick=()=>viewer.close();
   viewer.addEventListener('click',e=>{if(e.target===viewer)viewer.close();});
  }
  const photos=r.photos||[];let k=i;
  const img=viewer.querySelector('img'),label=viewer.querySelector('.rv-nav span');
  function show(){img.src=BASE+photos[k];img.alt=(r.storeName||'고객')+' 매장 사진 '+(k+1);label.textContent=(k+1)+' / '+photos.length;viewer.querySelector('.rv-nav').hidden=photos.length<2;}
  viewer.querySelector('.rv-prev').onclick=()=>{k=(k+photos.length-1)%photos.length;show();};
  viewer.querySelector('.rv-next').onclick=()=>{k=(k+1)%photos.length;show();};
  show();viewer.showModal();
 }

 /* 예전 방식: Google 후기 화면을 끼워 넣기 (reviews.json이 없을 때만) */
 function renderLegacy(){
  if(!valid(config.publicUrl))return;
  const bridge=crypto.randomUUID(),url=new URL(config.publicUrl);
  url.searchParams.set('bridge',bridge);url.searchParams.set('view','list');url.searchParams.set('ui','photos-first-20260924');
  const frame=document.createElement('iframe');frame.title='고객 후기와 매장 사진';frame.className='review-reader-frame is-loading';frame.referrerPolicy='strict-origin-when-cross-origin';frame.setAttribute('aria-hidden','true');
  const status=el('p','review-reader-status','후기를 불러오고 있습니다…');status.setAttribute('role','status');
  const fallback=el('p','review-reader-fallback');fallback.hidden=true;fallback.append('후기가 열리지 않나요? ');
  const full=el('a','','후기 새 창에서 보기 ↗');full.href=writeUrl();full.target='_blank';full.rel='noopener noreferrer';fallback.append(full);
  const timer=setTimeout(()=>{fallback.hidden=false;status.hidden=true;},4500);
  let host=window;try{if(window.top.location.origin===window.location.origin)host=window.top;}catch(_){}
  host.addEventListener('message',e=>{
   if(!/^https:\/\/([a-z0-9-]+[.-])?script\.googleusercontent\.com$/.test(e.origin)&&e.origin!=='https://script.google.com')return;
   const d=e.data;if(!d||d.bridge!==bridge)return;
   if(d.type==='meot-review-height'&&Number.isFinite(d.height)&&d.height>0){frame.classList.remove('is-loading');frame.removeAttribute('aria-hidden');frame.style.height=Math.min(30000,Math.max(220,Math.ceil(d.height)+12))+'px';status.hidden=true;fallback.hidden=true;clearTimeout(timer);}
  });
  frame.src=url.href;section.querySelector('.customerReviewsHead').after(status,frame,fallback);
 }

 if(section){
  fetch(BASE+'reviews.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw 0;return r.json();})
   .then(d=>{if(d&&Array.isArray(d.reviews)&&d.reviews.length)renderStatic(d);else renderLegacy();})
   .catch(renderLegacy);
 }

 const link=document.getElementById('review-admin-open'),note=document.getElementById('review-admin-setup');
 if(link&&valid(config.adminUrl)){const url=new URL(config.adminUrl);url.searchParams.set('page','admin');link.href=url.href;link.hidden=false;if(note)note.hidden=true;}
})();
