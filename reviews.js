(function(){
 'use strict';
 const config=window.MEOT_REVIEWS||{};
 function valid(value){try{const u=new URL(value);return u.origin==='https://script.google.com'&&/^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(u.pathname);}catch(_){return false;}}
 const section=document.getElementById('customer-reviews');
 if(section&&valid(config.publicUrl)){
   const bridge=crypto.randomUUID(),url=new URL(config.publicUrl);url.searchParams.set('bridge',bridge);url.searchParams.set('view','list');
   const frame=document.createElement('iframe');frame.title='고객 후기 작성 및 새 후기';frame.src=url.href;frame.referrerPolicy='strict-origin-when-cross-origin';frame.style.cssText='display:block;width:100%;height:900px;border:0;margin:0 0 25px;background:#fff';
   const writeUrl=new URL(config.publicUrl);writeUrl.searchParams.set('view','write');
   const card=document.createElement('a');card.id='review-write-card';card.className='review-write-card';card.href=writeUrl.href;card.setAttribute('aria-label','사장님의 이야기도 들려주세요. 후기 남기기');
   card.innerHTML='<span class="review-write-eyebrow">멋:테이블을 사용하고 계신가요?</span><strong class="review-write-title">사장님의 이야기도 들려주세요.</strong><span class="review-write-copy">짧은 후기 한 줄, 매장 사진 한 장도 좋아요.</span><span class="review-write-button"><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m4 16-1 5 5-1L20 8l-4-4L4 16Z"/><path d="m13.5 6.5 4 4M4 16l4 4m8-16 2-2a1.4 1.4 0 0 1 2 0l2 2a1.4 1.4 0 0 1 0 2l-2 2"/></svg> 후기 남기기</span>';
   const style=document.createElement('style');style.textContent='.legacy-home .review-write-card{display:block;margin:0 0 22px;padding:32px 28px;border-radius:18px;background:#193d4e;color:#fff;text-decoration:none}.legacy-home .review-write-card:focus-visible{outline:3px solid #c89725;outline-offset:4px}.legacy-home .review-write-card span,.legacy-home .review-write-card strong{display:block}.legacy-home .review-write-eyebrow,.legacy-home .review-write-copy{color:#ccd9df;font-size:17px;line-height:1.65}.legacy-home .review-write-title{margin:16px 0 13px;font-size:30px;line-height:1.4;letter-spacing:-.04em}.legacy-home .review-write-button{display:flex!important;align-items:center;justify-content:center;gap:10px;margin-top:27px;min-height:61px;border-radius:12px;background:linear-gradient(110deg,#f6ce54,#dcaf30);color:#183b4b;font-size:22px;font-weight:800}.legacy-home .review-write-card:hover .review-write-button{filter:brightness(1.04)}@media(max-width:580px){.legacy-home .review-write-card{padding:26px 22px;border-radius:15px}.legacy-home .review-write-eyebrow,.legacy-home .review-write-copy{font-size:14px}.legacy-home .review-write-title{font-size:23px}.legacy-home .review-write-button{font-size:20px;margin-top:23px}}';document.head.append(style);
   const panel=document.createElement('details');panel.style.cssText='margin:0 0 25px;border:1px solid #ddd6ca;border-radius:12px;overflow:hidden;background:#faf8f2';
   const summary=document.createElement('summary');summary.textContent='고객이 직접 남긴 새 후기 보기';summary.style.cssText='padding:20px;color:#173247;font-weight:700;cursor:pointer;line-height:1.6';
   const full=document.createElement('a');full.href=config.publicUrl;full.target='_blank';full.rel='noopener noreferrer';full.textContent='새 창에서 후기 보기 ↗';full.style.cssText='display:block;padding:14px 20px;color:#173247;text-decoration:underline';
   panel.append(summary,full,frame);section.querySelector('.customerReviewsHead').after(card,panel);
   window.addEventListener('message',event=>{
     if(!/^https:\/\/([a-z0-9-]+\.)?script\.googleusercontent\.com$/.test(event.origin)&&event.origin!=='https://script.google.com')return;
     const d=event.data;if(!d||d.type!=='meot-review-height'||d.bridge!==bridge||!Number.isFinite(d.height))return;
     frame.style.height=Math.min(12000,Math.max(900,Math.ceil(d.height)+8))+'px';
   });
 }
 const link=document.getElementById('review-admin-open'),note=document.getElementById('review-admin-setup');
 if(link&&valid(config.adminUrl)){const url=new URL(config.adminUrl);url.searchParams.set('page','admin');link.href=url.href;link.hidden=false;if(note)note.hidden=true;}
})();

