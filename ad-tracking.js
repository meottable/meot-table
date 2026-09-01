(function(){
  'use strict';
  var API='https://countapi.mileshilliard.com/api/v1/hit/';
  var PREFIX='meottable_a91f4_';
  var STORE='meot_ad_attribution_v1';

  function clean(v){return String(v||'').trim()}
  function slug(v){return clean(v).toLowerCase().replace(/[^a-z0-9가-힣_-]+/g,'_').replace(/^_+|_+$/g,'').slice(0,60)||'none'}
  function day(){var p=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()),o={};p.forEach(function(x){o[x.type]=x.value});return o.year+o.month+o.day}
  function hit(metric){var img=new Image();img.referrerPolicy='no-referrer';img.src=API+PREFIX+day()+'_'+slug(metric)+'?t='+Date.now()+Math.random()}
  function externalReferrer(){
    if(!document.referrer)return '';
    try{var u=new URL(document.referrer);return u.hostname===location.hostname?'':u.hostname}catch(e){return ''}
  }
  function normalizedSource(v){
    v=clean(v).toLowerCase();
    if(/naver/.test(v))return 'naver';
    if(/google/.test(v))return 'google';
    if(/instagram|facebook|threads|meta/.test(v))return 'instagram';
    if(/kakao/.test(v))return 'kakao';
    return v?'other':'direct';
  }
  function readStore(){try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch(e){return {}}}
  function writeStore(v){try{localStorage.setItem(STORE,JSON.stringify(v))}catch(e){}}
  function currentTouch(){
    var p=new URLSearchParams(location.search),ref=externalReferrer();
    var rawSource=clean(p.get('utm_source'))||ref;
    return {
      source:normalizedSource(rawSource),
      sourceRaw:clean(p.get('utm_source'))||ref||'direct',
      medium:clean(p.get('utm_medium')),
      campaign:clean(p.get('utm_campaign')),
      content:clean(p.get('utm_content')),
      term:clean(p.get('utm_term')),
      landing:location.pathname,
      referrer:ref,
      at:new Date().toISOString()
    };
  }
  var touch=currentTouch(),saved=readStore();
  var hasCampaign=touch.source!=='direct'||touch.medium||touch.campaign||touch.content||touch.term;
  if(!saved.first)saved.first=touch;
  if(hasCampaign||!saved.last)saved.last=touch;
  saved.current=touch;writeStore(saved);

  function attribution(){var a=readStore();return a.last||a.first||touch}
  function label(){
    var a=attribution(),parts=[a.sourceRaw||a.source||'direct'];
    if(a.campaign)parts.push(a.campaign);
    if(a.content)parts.push(a.content);
    if(a.term)parts.push(a.term);
    return parts.join(' / ');
  }
  function contentBucket(v){
    v=clean(v).toLowerCase();
    if(/59000|price|가격/.test(v))return 'price';
    if(/factory|direct|공장|제작/.test(v))return 'factory';
    if(/analysis|상권/.test(v))return 'analysis';
    return v?'other':'none';
  }
  function track(name,detail){
    name=slug(name);hit('event_'+name);
    detail=detail||{};
    if(detail.channel)hit('channel_'+slug(detail.channel));
    if(window.gtag)try{window.gtag('event','meot_'+name,detail)}catch(e){}
    if(window.fbq)try{window.fbq('trackCustom','Meot_'+name,detail)}catch(e){}
  }

  hit('pageviews');
  var sessionKey='meot_session_'+day();
  if(!sessionStorage.getItem(sessionKey)){sessionStorage.setItem(sessionKey,'1');hit('visitors')}
  var sourceKey='meot_source_'+day();
  if(!sessionStorage.getItem(sourceKey)){
    sessionStorage.setItem(sourceKey,'1');
    hit('source_'+attribution().source);
    hit('content_'+contentBucket(attribution().content));
  }

  document.addEventListener('click',function(e){
    var el=e.target.closest('a,button');if(!el)return;
    var href=(el.getAttribute('href')||'').toLowerCase(),txt=(el.textContent||'').toLowerCase(),all=href+' '+txt,m='other';
    if(/pf\.kakao|kakao|카카오/.test(all))m='kakao';
    else if(/^tel:|전화/.test(all))m='phone';
    else if(/analysis\.html|상권/.test(all))m='analysis';
    else if(/table-x76u|제품|테이블 디자인|의자 디자인|catalog/.test(all))m='products';
    else if(/견적서|견적 받기/.test(all))m='quote_document';
    else if(/quick-quote|예상견적|견적 계산|견적계산/.test(all))m='quote';
    else if(href.charAt(0)==='#')m='navigation';
    else if(el.tagName==='BUTTON')m='ui';
    hit('click_'+m);
    if(el.closest('#quick-quote')&&!sessionStorage.getItem('meot_quote_used_'+day())){
      sessionStorage.setItem('meot_quote_used_'+day(),'1');track('quote_interact')
    }
  },{capture:true});

  document.addEventListener('change',function(e){
    if(e.target&&e.target.closest&&e.target.closest('#quick-quote')&&!sessionStorage.getItem('meot_quote_used_'+day())){
      sessionStorage.setItem('meot_quote_used_'+day(),'1');track('quote_interact')
    }
  },true);
  document.addEventListener('submit',function(e){
    var form=e.target;
    if(form&&form.classList&&form.classList.contains('meotConsultForm')&&form.checkValidity())track('form_submit',{channel:'kakao'})
  },true);

  window.meotAnalytics={
    track:track,
    hit:hit,
    attribution:attribution,
    label:label,
    decorateMemo:function(memo){return clean(memo)+'\n\n[광고 유입]\n'+label()}
  };
})();
