(function(){
 'use strict';
 const config=window.MEOT_REVIEWS||{};
 function valid(value){try{const u=new URL(value);return u.origin==='https://script.google.com'&&/^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(u.pathname);}catch(_){return false;}}
 const section=document.getElementById('customer-reviews');
 if(section&&valid(config.publicUrl)){
   const bridge=crypto.randomUUID(),url=new URL(config.publicUrl);
   url.searchParams.set('bridge',bridge);url.searchParams.set('view','list');url.searchParams.set('ui','photos-first-20260924');
   const frame=document.createElement('iframe');frame.title='고객 후기와 매장 사진';frame.className='review-reader-frame';frame.referrerPolicy='strict-origin-when-cross-origin';
   const status=document.createElement('p');status.className='review-reader-status';status.textContent='고객 후기와 사진을 불러오고 있어요.';status.setAttribute('role','status');
   const fallback=document.createElement('p');fallback.className='review-reader-fallback';fallback.hidden=true;fallback.append('후기가 열리지 않나요? ');
   const full=document.createElement('a');const fullUrl=new URL(config.publicUrl);fullUrl.searchParams.set('view','list');full.href=fullUrl.href;full.target='_blank';full.rel='noopener noreferrer';full.textContent='후기 새 창에서 보기 ↗';fallback.append(full);
   const timer=setTimeout(()=>{fallback.hidden=false;status.hidden=true;},15000);
   window.addEventListener('message',event=>{
     if(!/^https:\/\/([a-z0-9-]+\.)?script\.googleusercontent\.com$/.test(event.origin)&&event.origin!=='https://script.google.com')return;
     const d=event.data;if(!d||d.bridge!==bridge)return;
     if(d.type==='meot-review-height'&&Number.isFinite(d.height)&&d.height>0){frame.style.height=Math.min(30000,Math.max(220,Math.ceil(d.height)+12))+'px';status.hidden=true;fallback.hidden=true;clearTimeout(timer);}
     if(d.type==='meot-review-focus'){section.scrollIntoView({block:'start',behavior:'auto'});}
   });
   frame.src=url.href;section.querySelector('.customerReviewsHead').after(status,frame,fallback);
 }
 const link=document.getElementById('review-admin-open'),note=document.getElementById('review-admin-setup');
 if(link&&valid(config.adminUrl)){const url=new URL(config.adminUrl);url.searchParams.set('page','admin');link.href=url.href;link.hidden=false;if(note)note.hidden=true;}
})();
