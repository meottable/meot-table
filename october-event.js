/* October 2026 event teaser. Dates use Asia/Seoul, never visitor timezone. */
(function(){
'use strict';
var start=Date.parse('2026-10-01T00:00:00+09:00'),end=Date.parse('2026-10-08T00:00:00+09:00');
var preview=new URLSearchParams(location.search).get('eventPreview')==='oct2026';
var key='meot-event-oct2026-hidden';
function day(){return new Date(Date.now()+9*3600000).toISOString().slice(0,10)}
function active(){return Date.now()>=start&&Date.now()<end}
if(!preview&&!active())return;
try{if(!preview&&localStorage.getItem(key)===day())return}catch(e){}
var style=document.createElement('style');
style.textContent=`#meotOctoberEvent{box-sizing:border-box;padding:0;border:0;border-radius:4px;width:min(440px,calc(100vw - 32px));max-height:calc(100dvh - 32px);overflow:auto;background:#f5f1e9;color:#27231e;box-shadow:0 24px 90px #0005;font-family:inherit}#meotOctoberEvent::backdrop{background:rgba(17,16,14,.72);backdrop-filter:blur(5px)}#meotOctoberEvent *{box-sizing:border-box}#meotOctoberEvent header{display:flex;align-items:center;justify-content:space-between;padding:8px 18px;font-family:Georgia,'Noto Serif KR',serif;font-size:19px}#meotOctoberEvent button{cursor:pointer;font-family:inherit}#meotOctoberEvent .me-close{border:0;background:none;color:#27231e;width:44px;height:44px;font-size:30px;font-weight:300}#meotOctoberEvent .me-photo{display:block;width:100%;height:180px;object-fit:cover;object-position:center 65%}#meotOctoberEvent .me-copy{text-align:center;padding:23px 24px 0}#meotOctoberEvent .me-eyebrow{font-size:13px;letter-spacing:.14em;color:#816b4e;margin:0 0 13px}#meotOctoberEvent h2{font-family:Georgia,'Noto Serif KR',serif;font-size:29px;font-weight:500;line-height:1.45;letter-spacing:-.055em;margin:0 0 15px;color:#27231e}#meotOctoberEvent .me-status{color:#816b4e;font-size:14px;margin:0 0 17px}#meotOctoberEvent .me-body{font-size:14px;line-height:1.7;margin:0 0 20px;color:#48423b}#meotOctoberEvent .me-cta{width:100%;min-height:52px;border:0;border-radius:3px;background:#292622;color:#fffaf0;font-size:15px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:10px}#meotOctoberEvent .me-chat{width:19px;height:16px;background:#fee500;border-radius:50%;position:relative}#meotOctoberEvent .me-chat:after{content:'';position:absolute;bottom:-3px;left:3px;border-top:6px solid #fee500;border-right:5px solid transparent}#meotOctoberEvent footer{display:flex;align-items:center;justify-content:space-between;border-top:1px solid #dcd5ca;margin:20px 24px 0;padding:5px 0;min-height:52px;font-size:12px}#meotOctoberEvent footer label{display:flex;align-items:center;gap:8px;cursor:pointer}#meotOctoberEvent input{width:18px;height:18px;accent-color:#292622}#meotOctoberEvent footer button{border:0;background:none;padding:12px;color:#48423b;font-size:13px}#meotOctoberEvent button:focus-visible{outline:2px solid #9a793e;outline-offset:3px}@media(max-height:700px){#meotOctoberEvent .me-photo{height:125px}#meotOctoberEvent .me-copy{padding-top:16px}#meotOctoberEvent h2{font-size:26px;margin-bottom:10px}#meotOctoberEvent .me-body{margin-bottom:14px}#meotOctoberEvent footer{margin-top:14px}}@media(max-width:360px){#meotOctoberEvent .me-copy{padding-left:16px;padding-right:16px}#meotOctoberEvent h2{font-size:25px}#meotOctoberEvent .me-cta{font-size:14px}}`;
document.head.appendChild(style);
var d=document.createElement('dialog');d.id='meotOctoberEvent';d.setAttribute('aria-labelledby','meOctoberTitle');
d.innerHTML='<header><span>멋:테이블</span><button type="button" class="me-close" aria-label="이벤트 팝업 닫기">×</button></header><img class="me-photo" src="/meot-table/images/grades/premium-real-20260928.webp" alt="멋테이블 실제 납품 상판"><div class="me-copy"><p class="me-eyebrow">10월 첫 주 · 특별 초대</p><h2 id="meOctoberTitle">더 좋은 선택을 위한<br>특별한 혜택</h2><p class="me-status">10월 첫 주 특별 이벤트 진행 중</p><p class="me-body">자세한 혜택은 카카오톡으로<br>편하게 문의해주세요.</p><button type="button" class="me-cta"><span class="me-chat" aria-hidden="true"></span>카카오톡으로 혜택 문의하기</button></div><footer><label><input type="checkbox">오늘 하루 보지 않기</label><button type="button" class="me-dismiss">닫기</button></footer>';
document.body.appendChild(d);
function close(){if(d.querySelector('input').checked){try{localStorage.setItem(key,day())}catch(e){}}d.close()}
d.querySelector('.me-close').onclick=close;
d.querySelector('.me-dismiss').onclick=close;
d.addEventListener('cancel',function(e){e.preventDefault();close()});
d.addEventListener('click',function(e){if(e.target===d){var r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close()}});
d.querySelector('.me-cta').onclick=function(){
close();
if(window.meotLeadDb&&window.meotLeadDb.openGate){window.meotLeadDb.openGate({href:'https://pf.kakao.com/_BZeSX/chat',channel:'카카오톡',source:'10월 첫 주 이벤트 팝업',memo:'10월 첫 주 이벤트 혜택 문의'})}
else location.href='https://pf.kakao.com/_BZeSX/chat';
};
function show(){if(document.querySelector('dialog[open],.meotLeadGate.on'))return;if(preview||active())d.showModal()}
setTimeout(show,900);
if(!preview){var timer=setInterval(function(){if(!active()){if(d.open)d.close();clearInterval(timer)}},30000)}
})();
