/* 시그니처 월 10팀 한정 제작: 남은 자리 + 이번 달 마감까지 남은 시간.
   - 남은 자리는 production-bookings.json 의 이번 달(한국시간) 확정 팀 수로만 계산한다. 숫자가 없으면 띄우지 않는다.
   - 마감 시각은 다음 달 1일 00:00(한국시간). 새로고침해도 리셋되지 않는 실제 월말 기준.
   - 미리보기: ?eventPreview=limited&left=3 */
(function(){
'use strict';
var CAP=10,KAKAO='https://pf.kakao.com/_BZeSX/chat',KEY='meot-limited-strip-hidden';
var qs=new URLSearchParams(location.search),preview=qs.get('eventPreview')==='limited';

function kstParts(){var d=new Date(Date.now()+9*3600000);return{y:d.getUTCFullYear(),m:d.getUTCMonth()+1}}
function monthKey(p){return p.y+'-'+(p.m<10?'0':'')+p.m}
function monthEnd(p){var y=p.m===12?p.y+1:p.y,m=p.m===12?1:p.m+1;return Date.parse(y+'-'+(m<10?'0':'')+m+'-01T00:00:00+09:00')}
function pad(n){return(n<10?'0':'')+n}

var css=[
'.meotSlots{background:#173326;color:#f5efe5;font-family:inherit;word-break:keep-all}',
'.meotSlots b{font-weight:700}',
'.meotSlots .ms-num{display:inline-block;min-width:1.9em;padding:2px 6px;margin:0 2px;border-radius:6px;background:#fffdfa;color:#173326;font-family:"IBM Plex Mono",ui-monospace,monospace;font-weight:600;text-align:center;font-variant-numeric:tabular-nums}',
'.meotSlots .ms-num.is-left{background:#e4cca0}',
'.meotSlots .ms-sep{opacity:.7;margin:0 1px}',
'.meotSlots .ms-title{color:#e4cca0;font-weight:700}',
'.meotSlots button{border:0;background:none;color:#fffdfa;font:inherit;font-weight:600;text-decoration:underline;text-underline-offset:3px;cursor:pointer;padding:4px 2px;min-height:0}',
/* top strip */
'#meotSlotsStrip{position:relative;z-index:5;font-size:14px}',
'#meotSlotsStrip .ms-in{max-width:1180px;margin:auto;padding:8px 48px 8px 16px;display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap}',
'#meotSlotsStrip .ms-x{position:absolute;right:6px;top:50%;transform:translateY(-50%);text-decoration:none;font-size:22px;width:40px;height:40px;opacity:.75}',
/* card above the grade table */
'#meotSlotsCard{border-radius:14px;padding:16px 18px;margin:0 0 20px;text-align:center}',
'#meotSlotsCard .ms-title{display:block;font-size:15px;margin-bottom:8px}',
'#meotSlotsCard .ms-row{font-size:16px;display:flex;justify-content:center;align-items:center;gap:14px;flex-wrap:wrap}',
'#meotSlotsCard .ms-note{display:block;margin-top:8px;font-size:12px;color:#cfd8cf}',
'@media(max-width:600px){#meotSlotsStrip{font-size:13px}#meotSlotsStrip .ms-in{gap:8px;padding:7px 40px 7px 10px}#meotSlotsStrip .ms-long{display:none}#meotSlotsCard .ms-row{font-size:15px;gap:8px}}',
'@media(min-width:601px){#meotSlotsStrip .ms-short{display:none}}'
].join('');

function openChat(source){
  var memo='시그니처 월 10팀 한정 제작 자리 문의';
  if(window.meotLeadDb&&window.meotLeadDb.openGate)window.meotLeadDb.openGate({href:KAKAO,channel:'카카오톡',source:source,memo:memo});
  else location.href=KAKAO;
}

function render(left,confirmed,updatedAt){
  var p=kstParts(),end=monthEnd(p),closed=left<=0;
  var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  var count=closed?'<b>'+p.m+'월 예약 마감</b>':'남은 자리 <span class="ms-num is-left">'+left+'</span>팀';
  var clock='<span class="ms-clock" aria-hidden="true"><span class="ms-num" data-d>--</span>일 <span class="ms-num" data-h>--</span><span class="ms-sep">:</span><span class="ms-num" data-mi>--</span><span class="ms-sep">:</span><span class="ms-num" data-s>--</span></span>';
  var label=p.m+'월 시그니처 제작 '+(closed?'마감':'남은 자리 '+left+'팀')+', '+p.m+'월 말일까지';

  var hidden=false;try{hidden=sessionStorage.getItem(KEY)==='1'}catch(e){}
  if(!hidden){
    var s=document.createElement('div');s.id='meotSlotsStrip';s.className='meotSlots';s.setAttribute('role','region');s.setAttribute('aria-label',label);
    s.innerHTML='<div class="ms-in"><span class="ms-title"><span class="ms-long">시그니처 등급 </span>'+p.m+'월 10팀 한정</span><span>'+count+'</span>'+(closed?'':clock)+'<button type="button" class="ms-go">'+(closed?(p.m%12+1)+'월 예약 문의 →':'자리 문의 →')+'</button></div><button type="button" class="ms-x" aria-label="안내 닫기">×</button>';
    var header=document.querySelector('.site-header');
    if(header&&header.parentNode)header.parentNode.insertBefore(s,header);else document.body.insertBefore(s,document.body.firstChild);
    s.querySelector('.ms-go').onclick=function(){openChat('한정 제작 띠배너')};
    s.querySelector('.ms-x').onclick=function(){s.remove();try{sessionStorage.setItem(KEY,'1')}catch(e){}};
  }

  var table=document.querySelector('#grades .comparison');
  if(table&&table.parentNode){
    var c=document.createElement('div');c.id='meotSlotsCard';c.className='meotSlots';c.setAttribute('role','note');c.setAttribute('aria-label',label);
    var upd=updatedAt?String(updatedAt).slice(0,10).replace(/-/g,'.'):'';
    c.innerHTML='<span class="ms-title">시그니처 등급 '+p.m+'월 한정 제작</span><span class="ms-row"><span>'+count+'</span>'+(closed?'':clock)+'</span>'+
      '<span class="ms-note">공장 생산 일정상 시그니처는 한 달 10팀까지만 받습니다'+(confirmed!=null?' · 확정 '+confirmed+'팀':'')+(upd?' ('+upd+' 기준)':'')+'</span>';
    table.parentNode.insertBefore(c,table);
  }

  function tick(){
    var ms=Math.max(0,end-Date.now()),t=Math.floor(ms/1000);
    var v={d:Math.floor(t/86400),h:Math.floor(t%86400/3600),mi:Math.floor(t%3600/60),s:t%60};
    document.querySelectorAll('.meotSlots [data-d]').forEach(function(e){e.textContent=pad(v.d)});
    document.querySelectorAll('.meotSlots [data-h]').forEach(function(e){e.textContent=pad(v.h)});
    document.querySelectorAll('.meotSlots [data-mi]').forEach(function(e){e.textContent=pad(v.mi)});
    document.querySelectorAll('.meotSlots [data-s]').forEach(function(e){e.textContent=pad(v.s)});
    if(ms===0)location.reload();
  }
  if(!closed){tick();setInterval(tick,1000)}
}

function start(){
  var key=monthKey(kstParts());
  fetch('/production-bookings.json',{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).catch(function(){return null}).then(function(data){
    var c=data&&data.months&&data.months[key]&&data.months[key].confirmed;
    var known=Number.isInteger(c)&&c>=0&&c<=CAP;
    if(preview&&qs.get('left')!==null){var l=Math.max(0,Math.min(CAP,parseInt(qs.get('left'),10)||0));render(l,CAP-l,null);return}
    if(!known)return; // 이번 달 확정 팀 수가 없으면 숫자를 지어내지 않고 아무것도 띄우지 않음
    render(CAP-c,c,data.updatedAt);
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
