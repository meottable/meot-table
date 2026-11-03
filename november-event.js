/* November 2026 first-week event: popup + top strip. Dates use Asia/Seoul, never visitor timezone. */
(function(){
'use strict';
var start=Date.parse('2026-11-01T00:00:00+09:00'),end=Date.parse('2026-11-08T00:00:00+09:00');
var preview=new URLSearchParams(location.search).get('eventPreview')==='nov2026';
var key='meot-event-nov2026-hidden';
var KAKAO='https://pf.kakao.com/_BZeSX/chat';
function day(){return new Date(Date.now()+9*3600000).toISOString().slice(0,10)}
function active(){return Date.now()>=start&&Date.now()<end}
function daysLeft(){var today=Date.parse(day()+'T00:00:00+09:00');return Math.max(0,Math.round((end-today)/86400000)-1)}
if(!preview&&!active())return;

var style=document.createElement('style');
style.textContent=[
'#meotNovStrip{position:relative;z-index:5;background:#173326;color:#f5efe5;font-size:14px}',
'#meotNovStrip .mns-in{max-width:1180px;margin:auto;padding:9px 48px 9px 34px;display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;text-align:center}',
'#meotNovStrip b{color:#e4cca0;font-weight:700}',
'#meotNovStrip .mns-dday{font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:12px;background:#e4cca0;color:#173326;border-radius:999px;padding:2px 9px;font-weight:500}',
'#meotNovStrip button.mns-go{border:0;background:none;color:#fffdfa;text-decoration:underline;text-underline-offset:3px;font:inherit;font-weight:600;cursor:pointer;padding:4px 2px;min-height:0}',
'#meotNovStrip .mns-x{position:absolute;right:8px;top:50%;transform:translateY(-50%);border:0;background:none;color:#f5efe5;font-size:22px;width:40px;height:40px;min-height:0;cursor:pointer;opacity:.75}',
'@media(max-width:600px){#meotNovStrip{font-size:13px}#meotNovStrip .mns-in{padding:8px 44px 8px 14px;gap:6px}}',
'#meotNovEvent{box-sizing:border-box;padding:0;border:0;border-radius:16px;width:min(420px,calc(100vw - 32px));max-height:calc(100dvh - 32px);overflow:auto;background:#fffdfa;color:#243b2e;box-shadow:0 30px 90px #0006;font-family:inherit}',
'#meotNovEvent::backdrop{background:rgba(16,24,20,.7);backdrop-filter:blur(4px)}',
'#meotNovEvent *{box-sizing:border-box}',
'#meotNovEvent:focus{outline:none}',
'#meotNovEvent .mne-media{position:relative;height:190px;background:#173326}',
'#meotNovEvent .mne-media img{display:block;width:100%;height:100%;object-fit:cover;object-position:center 60%}',
'#meotNovEvent .mne-media:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(23,51,38,.15),rgba(23,51,38,.85))}',
'#meotNovEvent .mne-badge{position:absolute;z-index:2;left:20px;bottom:16px;color:#fffdfa}',
'#meotNovEvent .mne-badge small{display:block;font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:11.5px;letter-spacing:.14em;color:#e4cca0}',
'#meotNovEvent .mne-badge strong{display:block;font-size:30px;line-height:1.15;letter-spacing:-.03em;margin-top:4px}',
'#meotNovEvent .mne-dday{position:absolute;z-index:2;right:16px;top:14px;background:#e4cca0;color:#173326;border-radius:999px;padding:5px 12px;font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:13px;font-weight:500}',
'#meotNovEvent .mne-close{position:absolute;z-index:3;left:8px;top:6px;border:0;background:none;color:#fffdfa;width:44px;height:44px;min-height:0;font-size:28px;cursor:pointer}',
'#meotNovEvent .mne-copy{padding:22px 24px 0}',
'#meotNovEvent h2{font-size:22px;line-height:1.4;letter-spacing:-.03em;margin:0;color:#173326}',
'#meotNovEvent .mne-period{margin:8px 0 0;font-size:14px;color:#9a7a45;font-weight:600}',
'#meotNovEvent .mne-price{display:flex;align-items:center;gap:10px;margin:14px 0 0}',
'#meotNovEvent .mne-price div{flex:1;border:1px solid #d9cbbb;border-radius:10px;padding:9px 12px}',
'#meotNovEvent .mne-price div.is-up{border-color:#28523e;background:#e1eadf}',
'#meotNovEvent .mne-price span{display:block;font-size:12px;color:#627165}',
'#meotNovEvent .mne-price b{font-size:17px;color:#173326}',
'#meotNovEvent .mne-price div:first-child b{text-decoration:line-through;text-decoration-color:#9a7a45;color:#627165}',
'#meotNovEvent .mne-price i{font-style:normal;color:#9a7a45;font-weight:700}',
'#meotNovEvent .mne-body{margin:12px 0 0;font-size:14.5px;line-height:1.7;color:#3d4a41}',
'#meotNovEvent ul{list-style:none;margin:16px 0 0;padding:12px 14px;background:#f5efe5;border-radius:10px;display:grid;gap:6px}',
'#meotNovEvent li{position:relative;padding-left:20px;font-size:13.5px;color:#3d4a41}',
'#meotNovEvent li:before{content:"";position:absolute;left:3px;top:6px;width:8px;height:4px;border-left:2px solid #28523e;border-bottom:2px solid #28523e;transform:rotate(-45deg)}',
'#meotNovEvent .mne-cta{margin-top:18px;width:100%;min-height:52px;border:0;border-radius:999px;background:#28523e;color:#fffdfa;font:inherit;font-size:15.5px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:9px;cursor:pointer}',
'#meotNovEvent .mne-cta:hover{background:#173326}',
'#meotNovEvent .mne-chat{width:19px;height:16px;background:#fee500;border-radius:50%;position:relative}',
'#meotNovEvent .mne-chat:after{content:"";position:absolute;bottom:-3px;left:3px;border-top:6px solid #fee500;border-right:5px solid transparent}',
'#meotNovEvent footer{display:flex;align-items:center;justify-content:space-between;border-top:1px solid #e7dfd2;margin:18px 24px 0;min-height:50px;font-size:12.5px;color:#627165}',
'#meotNovEvent footer label{display:flex;align-items:center;gap:8px;cursor:pointer}',
'#meotNovEvent footer input{width:18px;height:18px;accent-color:#28523e}',
'#meotNovEvent footer button{border:0;background:none;padding:12px;color:#3d4a41;font:inherit;font-size:13px;cursor:pointer;min-height:0}',
'#meotNovEvent button:focus-visible,#meotNovStrip button:focus-visible{outline:2px solid #9a7a45;outline-offset:3px}',
'@media(max-height:700px){#meotNovEvent .mne-media{height:140px}#meotNovEvent .mne-badge strong{font-size:25px}}'
].join('');
document.head.appendChild(style);

function openChat(source){
  if(window.meotLeadDb&&window.meotLeadDb.openGate){window.meotLeadDb.openGate({href:KAKAO,channel:'카카오톡',source:source,memo:'11월 첫 주 프로→시그니처 무료 업그레이드 문의'})}
  else location.href=KAKAO;
}
var left=daysLeft(),dday=left===0?'D-DAY':'D-'+left;

/* Top strip: stays visible for the whole event, can be dismissed for the session. */
var stripHidden=false;try{stripHidden=sessionStorage.getItem(key+'-strip')==='1'}catch(e){}
if(!stripHidden){
  var strip=document.createElement('div');strip.id='meotNovStrip';strip.setAttribute('role','region');strip.setAttribute('aria-label','11월 첫 주 이벤트 안내');
  strip.innerHTML='<div class="mns-in"><span class="mns-dday">'+dday+'</span><span><b>11월 첫 주 한정</b> 프로 가격으로 시그니처 등급 제작, 11월 7일(토)까지</span><button type="button" class="mns-go">업그레이드 문의 →</button></div><button type="button" class="mns-x" aria-label="이벤트 안내 닫기">×</button>';
  var header=document.querySelector('.site-header');
  if(header&&header.parentNode)header.parentNode.insertBefore(strip,header);else document.body.insertBefore(strip,document.body.firstChild);
  strip.querySelector('.mns-go').onclick=function(){openChat('11월 첫 주 이벤트 띠배너')};
  strip.querySelector('.mns-x').onclick=function(){strip.remove();try{sessionStorage.setItem(key+'-strip','1')}catch(e){}};
}

/* Popup: once per day unless dismissed for today. */
try{if(!preview&&localStorage.getItem(key)===day())return}catch(e){}
var d=document.createElement('dialog');d.id='meotNovEvent';d.setAttribute('aria-labelledby','meNovTitle');d.tabIndex=-1;
d.innerHTML='<div class="mne-media"><img src="/meot-table/images/grades/premium-real-20260928.webp" alt="시그니처 등급 실제 제작 테이블"><button type="button" class="mne-close" aria-label="이벤트 팝업 닫기">×</button><span class="mne-dday">'+dday+'</span><div class="mne-badge"><small>NOVEMBER, WEEK 1</small><strong>프로 → 시그니처<br>무료 업그레이드</strong></div></div>'+
'<div class="mne-copy"><h2 id="meNovTitle">프로 등급 가격으로<br>시그니처 등급을 받아보세요</h2><p class="mne-period">11월 7일(토)까지 프로 등급 계약 고객</p><div class="mne-price"><div><span>시그니처 정가</span><b>129,000원</b></div><i aria-hidden="true">→</i><div class="is-up"><span>이벤트가 (프로 가격)</span><b>89,000원</b></div></div><p class="mne-body">1200×800 이하 테이블 1개 기준, 부가세·배송비 별도입니다. 프로 가격 그대로 시그니처 등급으로 제작해 드립니다. 시그니처는 한 달 10팀만 제작해 자리가 차면 일찍 마감될 수 있어요.</p>'+
'<ul><li>상판 압착 조건 190℃ 200t → 200℃ 400t</li><li>김해 공장 직접 제작, 매장에 맞춘 규격</li><li>테이블 제작 고객 무료 상권분석</li></ul>'+
'<button type="button" class="mne-cta"><span class="mne-chat" aria-hidden="true"></span>카카오톡으로 업그레이드 문의</button></div>'+
'<footer><label><input type="checkbox">오늘 하루 보지 않기</label><button type="button" class="mne-dismiss">닫기</button></footer>';
document.body.appendChild(d);
function close(){if(d.querySelector('footer input').checked){try{localStorage.setItem(key,day())}catch(e){}}d.close()}
d.querySelector('.mne-close').onclick=close;
d.querySelector('.mne-dismiss').onclick=close;
d.addEventListener('cancel',function(e){e.preventDefault();close()});
d.addEventListener('click',function(e){if(e.target===d){var r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close()}});
d.querySelector('.mne-cta').onclick=function(){close();openChat('11월 첫 주 이벤트 팝업')};

// Never interrupt a visitor who has started navigating or using the estimate.
var autoShowTimer=null,activityEvents=['pointerdown','keydown','input','scroll','hashchange'];
function stopScheduledShow(){
  if(autoShowTimer!==null){clearTimeout(autoShowTimer);autoShowTimer=null}
  activityEvents.forEach(function(type){window.removeEventListener(type,stopScheduledShow,true)});
}
function show(){
  stopScheduledShow();
  if(document.querySelector('dialog[open],.meotLeadGate.on'))return;
  if(!preview){
    var focused=document.activeElement;
    if((location.hash&&location.hash!=='#top')||window.scrollY>80||(focused&&focused.matches('input,textarea,select,[contenteditable="true"]')))return;
  }
  if(preview||active()){d.showModal();d.focus({preventScroll:true});}
}
if(!preview)activityEvents.forEach(function(type){window.addEventListener(type,stopScheduledShow,{capture:true,passive:true})});
autoShowTimer=setTimeout(show,900);
if(!preview){var timer=setInterval(function(){if(!active()){if(d.open)d.close();var s=document.getElementById('meotNovStrip');if(s)s.remove();clearInterval(timer)}},30000)}
})();
