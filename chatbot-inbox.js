(function(){
'use strict';
const ENDPOINT='https://meottable-kakao-ai.vercel.app/api/inbox';
const $=id=>document.getElementById(id);
let token='',poll=null,request=0,lastSeen=new Set(),first=true,lastRendered='';
const panel=document.createElement('article');panel.className='panel bot-inbox';
panel.innerHTML='<div class="panel-head"><div><h3>챗봇 문의 수신함</h3><p>카카오 챗봇으로 들어온 상담 · 직접 카톡 상담과 별도 집계</p></div></div>'+
 '<p id="botStatus" class="notice" role="status">연결 상태 확인 중…</p>'+
 '<form id="botLogin" class="bot-tools"><label>조회 날짜 <input id="botDate" type="date" required></label><label>관리자 비밀번호 <input id="botKey" type="password" autocomplete="off" placeholder="설정한 관리자 비밀번호" required></label><button class="btn gold" type="submit">문의 조회</button><button class="btn light" type="button" id="botLogout">잠금</button></form>'+
 '<p class="bot-note">서버에 설정한 관리자 비밀번호를 입력하세요. 비밀번호는 이 화면이 열려 있는 동안만 사용합니다. 상담 내용은 기기 저장소에 복사하지 않으며, 서버에서 30일간 보관합니다.</p>'+
 '<div class="bot-counts"><span>챗봇 상담 고객 <b id="botPeople">미확인</b></span><span>담당자 확인 필요 <b id="botHandoff">미확인</b></span><span>테스트 메시지 <b id="botTests">미확인</b></span></div>'+
 '<p id="botNotification" class="bot-note">사장님 개인 카톡 알림: 미연결 · 이 화면을 열고 조회 중일 때만 새 문의를 표시합니다.</p><div id="botRecords"></div>';
document.querySelector('#customers .notice').after(panel);
const style=document.createElement('style');style.textContent='.bot-inbox{margin:20px 0}.bot-inbox p{line-height:1.7}.bot-tools{display:flex;gap:12px;flex-wrap:wrap;align-items:end}.bot-tools label{display:grid;gap:6px;flex:1;min-width:160px}.bot-tools input{padding:11px;border:1px solid #cbd5e1;border-radius:7px;font:inherit;width:100%;box-sizing:border-box}.bot-note{font-size:13px;color:#64748b}.bot-counts{display:flex;gap:24px;flex-wrap:wrap;margin:20px 0}.bot-counts b{display:block;font-size:24px;margin-top:5px}.bot-record{border-top:1px solid #e2e8f0;padding:18px 0}.bot-record p{white-space:pre-wrap;overflow-wrap:anywhere;margin:8px 0}.bot-record details{margin:12px 0}.bot-record small{color:#64748b}.bot-record.is-test{opacity:.7}.bot-record button{margin-top:8px}.bot-inbox .notice{margin-top:8px}';document.head.append(style);
const kday=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
$('botDate').value=kday();$('botDate').max=kday();
function unknown(text){$('botStatus').textContent=text;['botPeople','botHandoff','botTests'].forEach(id=>$(id).textContent='미확인');$('botRecords').replaceChildren();lastRendered='';}
function lock(){token='';request++;clearInterval(poll);poll=null;$('botKey').value='';first=true;lastSeen.clear();unknown('잠금 상태입니다. 관리자 비밀번호를 입력하면 상담을 확인할 수 있습니다.');}
async function api(method='GET',body){
 const r=await fetch(ENDPOINT+(method==='GET'?'?date='+encodeURIComponent($('botDate').value):''),{method,headers:{...(token?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),cache:'no-store',signal:AbortSignal.timeout(15000)});
 const data=await r.json();if(!r.ok)throw Object.assign(new Error(data.error||'load_failed'),{status:r.status,data});return data;
}
function el(tag,text){const e=document.createElement(tag);e.textContent=text;return e;}
function render(data){
 if(!data.lastWrite){unknown('저장소는 연결됐지만 실제 수신·저장이 아직 검증되지 않았습니다. 현재 상담 건수는 미확인입니다.');return;}
 const suffix=data.truncated?' 이상':'';
 $('botPeople').textContent=data.counts.customers+'명'+suffix;$('botHandoff').textContent=data.counts.handoffs+'명'+suffix;$('botTests').textContent=data.counts.testMessages+'건'+suffix;
 const added=data.events.filter(e=>!e.test&&!lastSeen.has(e.id)).length;
 $('botStatus').textContent=(data.truncated?'일부 기록만 표시 중입니다. 전체 건수로 사용하지 마세요. ':'조회 완료 · ')+(first?'':added?`새 메시지 ${added}건 · `:'')+'최근 저장 '+new Date(data.lastWrite).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'});
 lastSeen=new Set(data.events.map(e=>e.id));first=false;
 const fingerprint=JSON.stringify([data.date,data.events]);
 if(fingerprint===lastRendered)return;
 const list=$('botRecords'),open=new Set([...list.querySelectorAll('section[data-customer]')].filter(s=>s.querySelector('details')?.open).map(s=>s.dataset.customer));
 list.replaceChildren();lastRendered=fingerprint;
 const groups=new Map();for(const event of data.events){if(!groups.has(event.customerId))groups.set(event.customerId,[]);groups.get(event.customerId).push(event);}
 if(!groups.size)list.append(el('p','선택한 날짜에 저장된 챗봇 상담이 없습니다. 전화·직접 카톡 상담 여부는 별도로 확인하세요.'));
 for(const [id,events] of [...groups].reverse()){
  const latest=events.at(-1),box=el('section','');box.className='bot-record'+(latest.test?' is-test':'');box.dataset.customer=id;
  box.append(el('b',(latest.test?'[테스트] ':'')+'상담 '+id.slice(0,8)+(events.some(e=>e.route==='handoff')?' · 담당자 확인 필요':'')));
  box.append(el('p',latest.question));
  const details=el('details','');details.open=open.has(id);details.append(el('summary','대화 '+events.length+'개 보기'));
  for(const e of events){details.append(el('small',new Date(e.receivedAt).toLocaleTimeString('ko-KR',{timeZone:'Asia/Seoul'})),el('p','고객: '+e.question),el('p','챗봇: '+e.answer));}
  box.append(details);
  const button=el('button',latest.test?'실제 문의로 분류':'테스트로 제외');button.type='button';button.className='btn light';
  button.onclick=async()=>{button.disabled=true;try{await api('POST',{date:data.date,customerId:id,test:!latest.test});await refresh();}catch{button.disabled=false;$('botStatus').textContent='분류를 저장하지 못했습니다. 기존 분류를 유지합니다.';}};
  box.append(button);list.append(box);
 }
}
async function refresh(){const n=++request;try{const data=await api();if(n===request)render(data);}catch(e){if(n!==request)return;if(e.status===401){lock();$('botStatus').textContent='관리자 비밀번호가 맞지 않습니다. 다시 확인해주세요.';}else if(e.data?.error==='not_configured'){unknown('연결 미완료 — 문의 저장소와 관리자 인증 설정이 필요합니다. 0건으로 집계하지 않습니다.');clearInterval(poll);}else unknown('챗봇 기록을 불러오지 못했습니다. 문의가 없다는 뜻이 아닙니다.');}}
$('botLogin').onsubmit=e=>{e.preventDefault();token=$('botKey').value.trim();$('botKey').value='';first=true;clearInterval(poll);refresh();poll=setInterval(()=>{if(!document.hidden&&token)refresh();},30000);};
$('botLogout').onclick=lock;$('botDate').onchange=()=>{first=true;lastSeen.clear();if(token)refresh();};
window.addEventListener('pagehide',lock);
// Do not submit an empty credential on page load or display a false login error.
unknown('관리자 비밀번호로 문의를 조회해주세요. 문의 저장은 화면을 닫아도 계속됩니다.');
})();
