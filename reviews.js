(function(){
 'use strict';
 const config=window.MEOT_REVIEWS||{};
 function valid(value){try{const u=new URL(value);return u.origin==='https://script.google.com'&&/^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(u.pathname);}catch(_){return false;}}
 const section=document.getElementById('customer-reviews');
 if(section&&valid(config.publicUrl)){
   const bridge=crypto.randomUUID(),url=new URL(config.publicUrl);url.searchParams.set('bridge',bridge);
   const frame=document.createElement('iframe');frame.title='고객 후기 작성 및 새 후기';frame.src=url.href;frame.referrerPolicy='strict-origin-when-cross-origin';frame.style.cssText='display:block;width:100%;height:900px;border:0;margin:0 0 25px;background:#fff';
   const panel=document.createElement('details');panel.style.cssText='margin:0 0 25px;border:1px solid #ddd6ca;border-radius:12px;overflow:hidden;background:#faf8f2';
   const summary=document.createElement('summary');summary.textContent='✎ 사진과 함께 후기 남기기 · 새 후기 보기';summary.style.cssText='padding:20px;color:#173247;font-weight:700;cursor:pointer;line-height:1.6';
   const full=document.createElement('a');full.href=config.publicUrl;full.target='_blank';full.rel='noopener noreferrer';full.textContent='새 창에서 후기 작성하기 ↗';full.style.cssText='display:block;padding:14px 20px;color:#173247;text-decoration:underline';
   panel.append(summary,full,frame);section.querySelector('.customerReviewsHead').after(panel);
   window.addEventListener('message',event=>{
     if(!/^https:\/\/([a-z0-9-]+\.)?script\.googleusercontent\.com$/.test(event.origin)&&event.origin!=='https://script.google.com')return;
     const d=event.data;if(!d||d.type!=='meot-review-height'||d.bridge!==bridge||!Number.isFinite(d.height))return;
     frame.style.height=Math.min(12000,Math.max(900,Math.ceil(d.height)+8))+'px';
   });
 }
 const link=document.getElementById('review-admin-open'),note=document.getElementById('review-admin-setup');
 if(link&&valid(config.adminUrl)){const url=new URL(config.adminUrl);url.searchParams.set('page','admin');link.href=url.href;link.hidden=false;if(note)note.hidden=true;}
})();

