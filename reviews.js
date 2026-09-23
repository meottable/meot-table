(function(){
 'use strict';
 const config=window.MEOT_REVIEWS||{};
 function valid(value){try{const u=new URL(value);return u.origin==='https://script.google.com'&&/^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(u.pathname);}catch(_){return false;}}
 const section=document.getElementById('customer-reviews');
 if(section&&valid(config.publicUrl)){
   const bridge=crypto.randomUUID(),url=new URL(config.publicUrl);url.searchParams.set('bridge',bridge);
   const frame=document.createElement('iframe');frame.title='고객 후기 작성 및 새 후기';frame.src=url.href;frame.referrerPolicy='strict-origin-when-cross-origin';frame.style.cssText='display:block;width:100%;height:210px;border:0;margin:0 0 25px;background:#fff';
   section.querySelector('.customerReviewsHead').after(frame);
   window.addEventListener('message',event=>{
     if(!/^https:\/\/([a-z0-9-]+\.)?script\.googleusercontent\.com$/.test(event.origin)&&event.origin!=='https://script.google.com')return;
     const d=event.data;if(!d||d.type!=='meot-review-height'||d.bridge!==bridge||!Number.isFinite(d.height))return;
     frame.style.height=Math.min(12000,Math.max(190,Math.ceil(d.height)+8))+'px';
   });
 }
 const link=document.getElementById('review-admin-open'),note=document.getElementById('review-admin-setup');
 if(link&&valid(config.adminUrl)){const url=new URL(config.adminUrl);url.searchParams.set('page','admin');link.href=url.href;link.hidden=false;if(note)note.hidden=true;}
})();
