(function(){
  'use strict';
  var API='https://script.google.com/macros/s/AKfycbxUZkdYnyXte8ApViMaI_370jY1lLrDCN61p6GzjvDvvPSqshOHln6HzTo2Hx4ux9dt7g/exec';
  var pending=null;

  function clean(v){return String(v||'').trim()}
  function digits(v){return clean(v).replace(/\D/g,'')}
  function channelFor(href){
    if(/^tel:/i.test(href))return '전화';
    if(/^sms:/i.test(href))return '문자';
    if(/pf\.kakao|kakao/i.test(href))return '카카오톡';
    return '기타';
  }
  function source(base){
    base=clean(base)||'홈페이지';
    var label=window.meotAnalytics&&window.meotAnalytics.label?clean(window.meotAnalytics.label()):'';
    return label&&label!=='direct'?base+' · '+label:base;
  }
  function memo(v){
    v=clean(v);
    if(window.meotAnalytics&&window.meotAnalytics.decorateMemo&&!/\[광고 유입\]/.test(v))return window.meotAnalytics.decorateMemo(v);
    return v;
  }
  function save(data){
    var body=new URLSearchParams({
      name:clean(data.name),phone:digits(data.phone),region:clean(data.region),
      industry:clean(data.industry),opening:clean(data.opening),source:source(data.source),
      channel:clean(data.channel)||'기타',memo:memo(data.memo),page:clean(data.page)||location.href,
      website:clean(data.website)
    });
    if(body.get('phone').length<10)return Promise.reject(new Error('invalid_phone'));
    return fetch(API,{method:'POST',mode:'no-cors',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:body.toString(),keepalive:true}).then(function(result){
      if(window.meotAnalytics&&window.meotAnalytics.track)window.meotAnalytics.track('lead_saved',{channel:body.get('channel')});
      return result;
    });
  }
  function continueTo(href){
    if(/^tel:|^sms:/i.test(href))location.href=href;
    else window.open(href,'_blank','noopener,noreferrer');
  }
  function ensureGate(){
    if(document.getElementById('meotLeadGate'))return;
    var style=document.createElement('style');
    style.textContent='.meotLeadGate{position:fixed;inset:0;z-index:2147483000;display:none;place-items:center;padding:18px;background:rgba(20,18,15,.68);backdrop-filter:blur(3px)}.meotLeadGate.on{display:grid}.meotLeadGateCard{width:min(520px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:12px;box-shadow:0 30px 90px #0007}.meotLeadGateHead{padding:24px 24px 15px}.meotLeadGateHead h2{margin:0 0 8px;font-size:24px;letter-spacing:-.04em}.meotLeadGateHead p{margin:0;color:#726b62;font-size:13px;line-height:1.6}.meotLeadGateForm{display:grid;grid-template-columns:1fr 1fr;gap:13px;padding:0 24px 24px}.meotLeadGateForm label{font-size:12px;font-weight:800;color:#5d574f}.meotLeadGateForm label.wide{grid-column:1/-1}.meotLeadGateForm input,.meotLeadGateForm select{width:100%;margin-top:7px;padding:12px;border:1px solid #d7d0c5;border-radius:6px;background:#fff;font:inherit}.meotLeadGateAgree{grid-column:1/-1;display:flex!important;gap:8px;align-items:flex-start;font-weight:500!important;line-height:1.45}.meotLeadGateAgree input{width:auto;margin:2px 0 0}.meotLeadGateActions{grid-column:1/-1;display:flex;gap:8px}.meotLeadGateActions button{flex:1;border:0;border-radius:6px;padding:13px;font-weight:850;cursor:pointer}.meotLeadGateCancel{background:#eee9e1;color:#28231d}.meotLeadGateSubmit{background:#c9932e;color:#1e1609}.meotLeadGateStatus{grid-column:1/-1;min-height:18px;margin:0;color:#9a6411;font-size:12px;font-weight:750}@media(max-width:560px){.meotLeadGateForm{grid-template-columns:1fr}.meotLeadGateForm label.wide,.meotLeadGateAgree,.meotLeadGateActions,.meotLeadGateStatus{grid-column:1}.meotLeadGateHead{padding:21px 18px 14px}.meotLeadGateForm{padding:0 18px 20px}}';
    document.head.appendChild(style);
    var gate=document.createElement('div');gate.id='meotLeadGate';gate.className='meotLeadGate';gate.setAttribute('role','dialog');gate.setAttribute('aria-modal','true');gate.setAttribute('aria-labelledby','meotLeadGateTitle');
    gate.innerHTML='<div class="meotLeadGateCard"><div class="meotLeadGateHead"><h2 id="meotLeadGateTitle">상담 전 연락처 확인</h2><p>문의 내용을 놓치지 않도록 담당자가 확인할 기본 정보만 남겨주세요.</p></div><form class="meotLeadGateForm"><label>성함 또는 매장명<input name="name" required autocomplete="name" placeholder="예: 김멋 / 멋식당"></label><label>연락처<input name="phone" required inputmode="tel" autocomplete="tel" placeholder="010-0000-0000"></label><label>지역<input name="region" placeholder="예: 경기 화성시"></label><label>업종<input name="industry" placeholder="예: 카페, 고깃집"></label><label class="wide">오픈 예정 시기<input name="opening" placeholder="예: 10월 중순"></label><input name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true"><label class="meotLeadGateAgree"><input name="privacy" type="checkbox" required><span>상담 응대를 위한 개인정보 수집·이용에 동의합니다. 입력 정보는 상담 목적으로만 사용됩니다.</span></label><div class="meotLeadGateActions"><button class="meotLeadGateCancel" type="button">취소</button><button class="meotLeadGateSubmit" type="submit">저장하고 상담 계속</button></div><p class="meotLeadGateStatus" role="status" aria-live="polite"></p></form></div>';
    document.body.appendChild(gate);
    var form=gate.querySelector('form'),status=gate.querySelector('.meotLeadGateStatus');
    gate.querySelector('.meotLeadGateCancel').onclick=function(){pending=null;gate.classList.remove('on')};
    gate.addEventListener('click',function(e){if(e.target===gate){pending=null;gate.classList.remove('on')}});
    form.addEventListener('submit',function(e){
      e.preventDefault();if(!form.reportValidity()||!pending)return;
      var d=Object.fromEntries(new FormData(form)),href=pending.href;
      Object.assign(d,{channel:pending.channel,source:'홈페이지',memo:pending.memo||'',page:location.href});
      status.textContent='고객 DB에 저장하고 있습니다…';
      save(d).then(function(){status.textContent='저장되었습니다. 상담 화면을 엽니다.';gate.classList.remove('on');form.reset();pending=null;continueTo(href)}).catch(function(){status.textContent='저장 중 문제가 생겼습니다. 번호를 확인하고 다시 시도해 주세요.'});
    });
  }
  function openGate(opts){
    ensureGate();pending={href:opts.href,channel:opts.channel||channelFor(opts.href),memo:opts.memo||''};
    if(window.meotAnalytics&&window.meotAnalytics.track)window.meotAnalytics.track('lead_gate_open',{channel:pending.channel});
    var gate=document.getElementById('meotLeadGate'),form=gate.querySelector('form');
    ['name','phone','region','industry','opening'].forEach(function(k){if(opts[k])form.elements[k].value=opts[k]});
    gate.querySelector('.meotLeadGateStatus').textContent='';gate.classList.add('on');setTimeout(function(){form.elements.name.focus()},30);
  }
  document.addEventListener('click',function(e){
    var a=e.target.closest('a[href]');if(!a||a.dataset.meotDbSkip==='true')return;
    var href=a.getAttribute('href')||'';if(!(/^tel:|^sms:/i.test(href)||/pf\.kakao|kakao/i.test(href)))return;
    e.preventDefault();e.stopImmediatePropagation();openGate({href:href,channel:channelFor(href)});
  },true);
  window.meotLeadDb={save:save,openGate:openGate,api:API};
})();
