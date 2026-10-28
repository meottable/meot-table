/* Product detail overlay. Selecting a chair delegates to the existing quote flow. */
(function(){
 'use strict';
 const cards=Array.from(document.querySelectorAll('#chairs [data-product]'));
 if(!cards.length)return;
 const assetBase=new URL('images/chairs/detail/',document.currentScript.src);
 const dialog=document.createElement('dialog');
 dialog.id='chair-detail-dialog';dialog.setAttribute('aria-labelledby','chair-detail-title');
 dialog.innerHTML='<header class="cd-head"><span class="cd-brand">멋:테이블</span><button type="button" class="cd-close" aria-label="의자 상세보기 닫기">목록으로 ×</button></header><div class="cd-body"><div class="cd-gallery"><div class="cd-stage" tabindex="0" aria-label="의자 사진. 방향키 또는 옆으로 밀어 사진 전환"><img class="cd-photo" alt=""><div class="cd-angle" hidden><img alt=""></div></div><div class="cd-gallery-meta"><span class="cd-position" role="status" aria-live="polite"></span><div class="cd-arrows"><button type="button" class="cd-prev" aria-label="이전 의자 사진">←</button><button type="button" class="cd-next" aria-label="다음 의자 사진">→</button></div></div><div class="cd-tabs" role="group" aria-label="의자 사진 선택"></div></div><section class="cd-info"><p class="cd-eyebrow">MEOT TABLE · CHAIR</p><h2 id="chair-detail-title"></h2><p class="cd-description">매장 분위기에 어울리는 의자.<br>테이블과 함께 구성해 보세요.</p><dl class="cd-specs"><div><dt>모델</dt><dd class="cd-model"></dd></div><div><dt>가격</dt><dd>수량·구성별 별도 문의</dd></div><div><dt>색상·납기</dt><dd>상담 후 확인</dd></div></dl><p class="cd-note">화면과 조명에 따라 색상이 다르게 보일 수 있습니다.<br>최종 색상·규격·구성은 주문 전 확인해 주세요.</p><div class="cd-footer"><button type="button" class="cd-select">이 의자로 견적 선택 →</button></div></section></div>';
 document.body.append(dialog);
 const find=s=>dialog.querySelector(s),stage=find('.cd-stage'),photo=find('.cd-photo'),angle=find('.cd-angle'),angleImage=angle.querySelector('img'),tabs=find('.cd-tabs');
 let selected=null,index=0,views=[],restoreOverflow='',selecting=false,returningToQuote=false,touchStart=null;
 const angles=[{label:'정면',left:'-10.638%'},{label:'측면',left:'-115.319%'},{label:'뒷면',left:'-220.213%'}];
 function render(){
  const view=views[index],original=!view.left;
  photo.hidden=!original;angle.hidden=original;
  if(original){photo.src=selected.querySelector('img').src;photo.alt=selected.dataset.productId+' 제품 사진';}
  else{angle.style.setProperty('--cd-left',view.left);angleImage.src=new URL('yg-001-views.webp',assetBase).href;angleImage.alt='yg-001 '+view.label;}
  const shown=original?photo:angle;shown.classList.remove('cd-image-motion');void shown.offsetWidth;shown.classList.add('cd-image-motion');
  find('.cd-position').textContent=view.label+' · '+(index+1)+' / '+views.length;
  Array.from(tabs.children).forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
  find('.cd-arrows').hidden=views.length<2;tabs.hidden=views.length<2;
 }
 function open(card){
  selected=card;index=0;const name=card.querySelector('h3,strong')?.textContent.trim()||card.querySelector('img').alt;
  views=[{label:'제품 사진'},...(card.dataset.productId==='yg-001'?angles:[])];
  find('h2').textContent=name;find('.cd-model').textContent=name;tabs.replaceChildren();
  views.forEach((view,i)=>{const button=document.createElement('button');button.type='button';button.textContent=view.label;button.addEventListener('click',()=>{index=i;render();});tabs.append(button);});
  document.querySelectorAll('dialog[open]').forEach(d=>d.close());render();
  restoreOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal();dialog.scrollTop=0;find('.cd-close').focus({preventScroll:true});
 }
 function move(delta){if(views.length<2)return;index=(index+delta+views.length)%views.length;render();}
 cards.forEach(card=>{card.setAttribute('aria-label',(card.querySelector('h3,strong')?.textContent.trim()||card.dataset.productId)+' 상세보기');card.setAttribute('aria-haspopup','dialog');card.setAttribute('aria-controls',dialog.id);});
 const desc=document.querySelector('#chairs .compactCatalogDesc');if(desc)desc.textContent='의자를 눌러 자세히 보고, 원하는 모델을 견적에 담아보세요.';
 // Capture only chair cards; table selection and contact-consent handlers stay intact.
 document.addEventListener('click',event=>{const card=event.target.closest('#chairs [data-product]');if(!card||selecting||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();event.stopImmediatePropagation();open(card);},true);
 find('.cd-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{document.body.style.overflow=restoreOverflow;if(!returningToQuote&&selected)selected.focus({preventScroll:true});returningToQuote=false;});
 find('.cd-prev').addEventListener('click',()=>move(-1));find('.cd-next').addEventListener('click',()=>move(1));
 dialog.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();move(event.key==='ArrowLeft'?-1:1);}});
 stage.addEventListener('touchstart',event=>{const t=event.touches[0];touchStart={x:t.clientX,y:t.clientY};},{passive:true});
 stage.addEventListener('touchend',event=>{if(!touchStart)return;const t=event.changedTouches[0],dx=t.clientX-touchStart.x,dy=t.clientY-touchStart.y;touchStart=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.5)move(dx<0?1:-1);},{passive:true});
 stage.addEventListener('touchcancel',()=>touchStart=null,{passive:true});
 find('.cd-select').addEventListener('click',()=>{if(!selected)return;selecting=true;returningToQuote=true;dialog.close();document.body.style.overflow=restoreOverflow;selected.click();selecting=false;});
})();
