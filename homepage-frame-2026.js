(function(){
  'use strict';
  var form=document.getElementById('b2bForm');
  if(!form)return;
  var status=document.getElementById('b2bStatus'),button=form.querySelector('.nf-submit');
  var pending=false,done=false,requestId='',payload='',started=false;

  function track(name,data){try{if(window.meotAnalytics&&window.meotAnalytics.track)window.meotAnalytics.track(name,data||{});}catch(_){}}
  function val(name){return String((form.elements[name]&&form.elements[name].value)||'').trim();}
  function setStatus(text,kind){status.textContent=text;status.className='nf-status'+(kind?' is-'+kind:'');}
  function uuid(){
    if(window.crypto&&crypto.randomUUID)return crypto.randomUUID();
    var b=crypto.getRandomValues(new Uint8Array(16));b[6]=b[6]&15|64;b[8]=b[8]&63|128;
    var h=Array.from(b,function(x){return x.toString(16).padStart(2,'0');}).join('');
    return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);
  }

  // Audience cards preselect the inquiry type.
  document.querySelectorAll('[data-b2b-type]').forEach(function(a){
    a.addEventListener('click',function(){
      var type=a.getAttribute('data-b2b-type');
      Array.prototype.forEach.call(form.elements.type,function(r){r.checked=r.value===type;});
    });
  });

  form.addEventListener('focusin',function(){if(!started){started=true;track('form_start',{form:'b2b_v1'});}});
  form.addEventListener('input',function(){
    if(pending)return;
    if(done){done=false;button.disabled=false;button.textContent='견적 요청 보내기';setStatus('');}
  });

  function summary(){
    var lines=['[B2B 대량 견적]','구분: '+form.elements.type.value,'회사명: '+val('company'),'담당자: '+val('name')];
    if(val('email'))lines.push('이메일: '+val('email'));
    lines.push('예상 수량: '+(val('qty')||'미정'),'희망 등급: '+(val('grade')||'상담 후 결정'),'납품 지역: '+(val('region')||'미정'),'희망 납품일: '+(val('due')||'미정'),'의자 견적: '+(form.elements.chair.checked?'포함':'미포함'));
    if(val('memo'))lines.push('요청 사항: '+val('memo'));
    return lines.join('\n');
  }

  form.addEventListener('submit',function(e){
    e.preventDefault();
    if(pending||done)return;
    var phone=val('phone').replace(/\D/g,''),miss=[];
    form.querySelectorAll('[aria-invalid]').forEach(function(el){el.removeAttribute('aria-invalid');});
    function bad(name,label){miss.push(label);var el=form.elements[name];if(el&&el.setAttribute)el.setAttribute('aria-invalid','true');}
    if(!val('company'))bad('company','회사명');
    if(!val('name'))bad('name','담당자');
    if(!/^0\d{9,10}$/.test(phone))bad('phone','연락처');
    if(val('email')&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val('email')))bad('email','이메일 형식');
    if(!form.elements.agree.checked)bad('agree','개인정보 동의');
    if(miss.length){setStatus(miss.join(', ')+' 항목을 확인해 주세요.','error');var first=form.querySelector('[aria-invalid=true]');if(first)first.focus();return;}

    var memo=summary()+'\n연락처: '+phone;
    // Reuse the id for an identical retry so a timeout cannot create duplicates.
    if(payload!==memo){requestId=uuid();payload=memo;}
    pending=true;button.disabled=true;form.setAttribute('aria-busy','true');
    setStatus('견적 요청을 접수하고 있습니다…');
    var save=window.meotLeadDb&&window.meotLeadDb.save;
    var job=save?save({requestId:requestId,name:val('company')+' / '+val('name'),phone:phone,region:val('region'),industry:form.elements.type.value,opening:val('due'),consent:true,consentVersion:'20261103-b2b-v1',channel:'전화',source:'B2B 대량 견적',memo:memo,page:location.href,website:val('website')}):Promise.reject(new Error('service_unavailable'));
    job.then(function(receipt){
      if(!receipt||receipt.status!=='saved')throw new Error('unconfirmed');
      done=true;button.textContent='접수 완료';
      setStatus('견적 요청이 접수되었습니다. 남겨주신 번호로 연락드리겠습니다.\n접수번호: '+receipt.requestId,'done');
      track('form_success',{form:'b2b_v1'});
    }).catch(function(){
      button.textContent='다시 접수하기';
      setStatus('접수 완료를 확인하지 못했습니다. 입력한 내용은 그대로 있습니다. 다시 시도하시거나 010-6292-8562로 전화 주세요.','error');
      track('form_error',{form:'b2b_v1'});
    }).then(function(){
      pending=false;form.setAttribute('aria-busy','false');button.disabled=done;
    });
  });
})();
