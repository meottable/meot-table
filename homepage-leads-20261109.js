/* 2026-11-09 문의 동선: 배치 시안 요청(매장 사진 + 크기 + 연락처) / 전화 요청
   - 연락처·크기는 기존 문의 시트(meotLeadDb)에 저장
   - 사진은 PHOTO_API(구글 앱스스크립트 → 드라이브 폴더 + 지메일 알림)로 올림
   - 사진 업로드가 안 되면 카톡으로 보내는 버튼이 대신 뜸 */
(function(){
  'use strict';
  var PHOTO_API='https://script.google.com/macros/s/AKfycbwbc6gIET2Qj1eKaBPupUt_-3YUboSnb2XWKeBmrgH7q8_3OONgzkrjLeBo7dm5V_SI/exec';
  var KAKAO='https://pf.kakao.com/_BZeSX/chat', CONSENT='20261020-v1', MAX=3;
  var $=function(id){return document.getElementById(id)};
  function track(n,d){try{if(window.meotAnalytics&&window.meotAnalytics.track)window.meotAnalytics.track(n,d||{})}catch(_){}}
  function uuid(){return (crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){var r=Math.random()*16|0;return (c==='x'?r:(r&3|8)).toString(16)}))}
  function open(d){if(d.showModal)d.showModal();else d.setAttribute('open','')}
  function close(d){if(d.close)d.close();else d.removeAttribute('open')}
  document.querySelectorAll('[data-mt-close]').forEach(function(b){b.addEventListener('click',function(){close(b.closest('dialog'))})});
  document.querySelectorAll('.mtDlg').forEach(function(d){d.addEventListener('click',function(e){if(e.target===d)close(d)})});

  /* ── 배치 시안 요청 ── */
  var dlg=$('mtLayoutDlg'); if(!dlg) return;
  document.querySelectorAll('[data-mt-layout]').forEach(function(b){b.addEventListener('click',function(){open(dlg);track('layout_open')})});
  var photos=[], mode='wd', reqId=uuid(), sent='';
  var thumbs=$('mtThumbs'), status=$('mtLStatus'), btn=$('mtLSubmit');

  function shrink(file){
    return new Promise(function(res,rej){
      var img=new Image(), url=URL.createObjectURL(file);
      img.onload=function(){
        var s=Math.min(1,1600/Math.max(img.width,img.height)), c=document.createElement('canvas');
        c.width=Math.round(img.width*s); c.height=Math.round(img.height*s);
        c.getContext('2d').drawImage(img,0,0,c.width,c.height); URL.revokeObjectURL(url);
        res(c.toDataURL('image/jpeg',0.82));
      };
      img.onerror=function(){URL.revokeObjectURL(url);rej(new Error('image'))};
      img.src=url;
    });
  }
  function drawThumbs(){
    thumbs.innerHTML='';
    photos.forEach(function(p,i){
      var d=document.createElement('div');d.className='mtThumb';
      d.innerHTML='<img alt="올린 매장 사진 '+(i+1)+'"><button type="button" aria-label="사진 '+(i+1)+' 빼기">×</button>';
      d.querySelector('img').src=p;
      d.querySelector('button').onclick=function(){photos.splice(i,1);drawThumbs()};
      thumbs.appendChild(d);
    });
    $('mtPhotoAddText').textContent=photos.length>=MAX?'사진은 '+MAX+'장까지 올릴 수 있어요':(photos.length?'사진 더 올리기 ('+photos.length+'/'+MAX+')':'사진 올리기');
  }
  $('mtPhotos').addEventListener('change',function(e){
    var files=[].slice.call(e.target.files||[]).slice(0,MAX-photos.length); e.target.value='';
    if(!files.length)return;
    status.textContent='사진을 준비하고 있어요…';
    Promise.all(files.map(shrink)).then(function(list){photos=photos.concat(list).slice(0,MAX);drawThumbs();status.textContent=''})
      .catch(function(){status.textContent='사진을 읽지 못했어요. 다른 사진으로 해주세요.'});
  });

  function setMode(m){
    mode=m;
    document.querySelectorAll('#mtSeg button').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.m===m))});
    $('mtWD').hidden=m!=='wd'; $('mtPY').hidden=m!=='py'; calc();
  }
  document.querySelectorAll('#mtSeg button').forEach(function(b){b.addEventListener('click',function(){setMode(b.dataset.m)})});
  function num(id){var v=parseFloat(String($(id).value).replace(',','.'));return isFinite(v)&&v>0?v:0}
  function sizeText(){
    if(mode==='wd'){var w=num('mtW'),d=num('mtD');if(!w||!d)return '';var m2=w*d;return '가로 '+w+'m × 세로 '+d+'m (약 '+(m2/3.3058).toFixed(1)+'평, '+m2.toFixed(1)+'㎡)'}
    var p=num('mtPy');return p?'약 '+p+'평 ('+(p*3.3058).toFixed(0)+'㎡)':'';
  }
  function calc(){var t=sizeText();$('mtCalc').textContent=t?'→ '+t:''}
  ['mtW','mtD','mtPy'].forEach(function(id){$(id).addEventListener('input',calc)});

  function upload(phone,summary){
    if(!PHOTO_API||!photos.length)return Promise.reject(new Error('skip'));
    var body=new URLSearchParams({action:'uploadLayoutPhotos',requestId:reqId,phone:phone,consent:'true',summary:summary});
    photos.forEach(function(p,i){body.append('photo'+i,p)});
    var ctl=new AbortController(),t=setTimeout(function(){ctl.abort()},45000);
    return fetch(PHOTO_API,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:body.toString(),signal:ctl.signal})
      .then(function(r){return r.json()}).then(function(j){if(!j||j.ok!==true)throw new Error(j&&j.error||'fail');return j})
      .finally(function(){clearTimeout(t)});
  }

  var busy=false, message='';
  $('mtLayoutForm').addEventListener('submit',function(e){
    e.preventDefault(); if(busy)return;
    var size=sizeText(); if(!size){status.textContent='가게 크기를 넣어주세요. 대략이어도 괜찮아요.';return}
    var phone=$('mtLPhone').value.replace(/\D/g,''); if(!/^0\d{9,10}$/.test(phone)){status.textContent='연락받을 번호를 확인해 주세요.';return}
    if(!$('mtLPrivacy').checked){status.textContent='개인정보 수집·이용에 동의해 주세요.';return}
    var biz=$('mtBiz').value.trim();
    message=['[배치 시안 요청]','가게 크기: '+size,'업종: '+(biz||'미입력'),'사진: '+(photos.length?photos.length+'장':'카톡으로 보낼 예정'),'연락처: '+phone].join('\n');
    if(sent!==message+photos.length){reqId=uuid();sent=message+photos.length}
    busy=true;btn.disabled=true;status.style.color='#5c635e';status.textContent=photos.length?'사진을 올리고 있어요… (몇 초 걸려요)':'접수하고 있어요…';
    var lead=window.meotLeadDb&&window.meotLeadDb.save?window.meotLeadDb.save({requestId:reqId,name:'배치 시안 요청',phone:phone,industry:biz,consent:true,consentVersion:CONSENT,channel:'홈페이지',source:'홈페이지 배치 시안 요청',memo:message,page:location.href}).then(function(){return true},function(){return false}):Promise.resolve(false);
    var up=upload(phone,message).then(function(){return true},function(){return false});
    Promise.all([lead,up]).then(function(r){
      var leadOk=r[0],photoOk=r[1];status.style.color='';
      if(photoOk){$('mtLayoutForm').hidden=true;$('mtLayoutDone').hidden=false;status.textContent='';track('layout_saved',{photos:photos.length});return}
      $('mtLayoutNext').hidden=false;
      status.textContent=leadOk?(photos.length?'요청은 접수됐어요. 사진은 아래 버튼으로 카톡에 한 번 더 보내주세요.':'접수됐어요. 이제 카톡으로 매장 사진만 보내주세요.'):'접수 확인이 안 됐어요. 카톡으로 사진과 함께 보내주시면 바로 확인할게요.';
      track(leadOk?'layout_saved_no_photo':'layout_error');
    }).finally(function(){busy=false;btn.disabled=false});
  });
  $('mtLayoutKakao').addEventListener('click',function(){
    var b=$('mtLayoutKakao');
    if(window.meotContactFlow&&window.meotContactFlow.copyAndOpen)window.meotContactFlow.copyAndOpen({text:message,href:KAKAO,button:b,status:status,fallback:status,textarea:document.createElement('textarea')});
    else location.assign(KAKAO);
  });

  /* ── 전화 요청 ── */
  var cdlg=$('mtCallDlg');
  document.querySelectorAll('[data-mt-call]').forEach(function(b){b.addEventListener('click',function(){open(cdlg);track('callback_open')})});
  var cbusy=false,cid=uuid(),csent='';
  $('mtCallForm').addEventListener('submit',function(e){
    e.preventDefault(); if(cbusy)return;
    var st=$('mtCStatus'), phone=$('mtCPhone').value.replace(/\D/g,'');
    if(!/^0\d{9,10}$/.test(phone)){st.textContent='연락받을 번호를 확인해 주세요.';return}
    if(!$('mtCPrivacy').checked){st.textContent='개인정보 수집·이용에 동의해 주세요.';return}
    var when=$('mtCWhen').value, memo='[전화 요청] 통화 희망: '+when+' / 연락처: '+phone;
    if(csent!==memo){cid=uuid();csent=memo}
    if(!window.meotLeadDb||!window.meotLeadDb.save){st.textContent='지금은 접수가 안 돼요. 010-6292-8562로 바로 전화 주세요.';return}
    cbusy=true;$('mtCSubmit').disabled=true;st.style.color='#5c635e';st.textContent='접수하고 있어요…';
    window.meotLeadDb.save({requestId:cid,name:'전화 요청',phone:phone,consent:true,consentVersion:CONSENT,channel:'전화',source:'홈페이지 전화 요청',memo:memo,page:location.href})
      .then(function(){$('mtCallForm').hidden=true;$('mtCallDone').hidden=false;track('callback_saved')})
      .catch(function(){st.style.color='';st.textContent='접수가 확인되지 않았어요. 010-6292-8562로 바로 전화 주세요.';track('callback_error')})
      .finally(function(){cbusy=false;$('mtCSubmit').disabled=false});
  });
})();
