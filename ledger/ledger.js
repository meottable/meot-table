(()=>{
'use strict';
const $=id=>document.getElementById(id),M=MeotLedger,S=MeotLedgerStore,ACCESS='meot_ledger_access_v1';
const won=n=>n===null?'미확인':Number(n||0).toLocaleString('ko-KR')+'원',esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label=m=>m.replace('-','년 ')+'월',stamp=s=>new Date(s).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}),uuid=()=>crypto.randomUUID();
let data,key='',identity='',revision=0,selected=M.today().slice(0,7),tab='orders',busy=false,confirmAction=null,installEvent=null,dirty=false,backupURL='',syncBusy=false,lastSyncCheck=0,initialPreset=0,cashPreset=0;
function status(message,error=false){$('saveStatus').textContent=message;$('saveStatus').classList.toggle('error',error);}
function monthMeta(){return M.ensureMonth(data,selected);}
function report(){return monthMeta().status==='closed'?monthMeta().snapshot:M.totals(data,selected);}
function renderMonths(){const all=[...Object.keys(data.months),selected,M.today().slice(0,7)].sort(),months=[];for(let m=all[0];m<=all.at(-1);m=M.nextMonth(m)){months.push(m);if(m==='2099-12')break;}$('month').innerHTML=months.reverse().map(m=>'<option value="'+m+'">'+label(m)+(data.months[m]?.status==='closed'?' · 마감':'')+'</option>').join('');$('month').value=selected;}
function render(){
 const info=monthMeta(),closed=info.status==='closed',r=report(),due=M.outstanding(data,selected),unknown=M.unconfirmed(data,selected),target=info.target;
 renderMonths();$('asof').textContent=(data.sourceVersion?'원본 반영 ':'최초 자료 ')+data.sourceUpdated+' · 월별 기록 보관';$('monthBadge').textContent=closed?'마감 완료':'작성 중';$('monthBadge').className='badge '+(closed?'':'due');
 $('revenue').textContent=won(r.revenue);$('orderCount').textContent=r.orders.length+'건';$('received').textContent=won(r.received);$('spent').textContent=won(r.spent);$('netCash').textContent=won(r.received-r.spent);$('balance').textContent=(unknown.length?'확인분 ':'')+won(M.sum(due,'balance'));$('balanceCount').textContent=due.length+'건'+(unknown.length?' · 입금 미확인 '+unknown.length+'건 별도':'')+' · 이전 달 계약 포함 / 현재 잔액';$('receivedNote').textContent='선택 월 입금 기록'+(r.orders.some(M.paymentUnknown)?' · 입금 미확인 거래 제외':'');
 $('goalText').textContent=target?'월 목표 '+won(target):'월 목표 미설정';$('goalRate').textContent=target?(r.revenue/target*100).toFixed(1)+'%':'—';$('goalBar').value=target?Math.min(100,r.revenue/target*100):0;$('goalExtra').textContent=target?(r.revenue>=target?'목표보다 '+won(r.revenue-target)+' 더 달성했어요.':'목표까지 '+won(target-r.revenue)+' 남았어요.'):'월 목표를 설정할 수 있습니다.';
 ['addOrder','addCash','editTarget'].forEach(id=>$(id).disabled=closed||busy||syncBusy);$('closeMonth').disabled=busy||syncBusy;$('reopenMonth').disabled=busy||syncBusy;$('importBackup').disabled=busy||syncBusy;$('closeMonth').hidden=closed;$('reopenMonth').hidden=!closed;
 $('closeTitle').textContent=closed?label(selected)+' 마감 기록':label(selected)+' 기록을 보관하세요.';$('closeText').textContent=closed?stamp(info.closedAt)+' 마감. 매출·입출금은 마감 당시 내역이며 미수금은 현재 잔액입니다.':'마감하면 이달 내역을 보존하고 다음 달로 이동합니다. 남은 미수금은 계속 관리할 수 있습니다.';
 renderList();
}
function actionButton(action,id,text){return '<button class="ghost" data-action="'+action+'" data-id="'+esc(id)+'">'+text+'</button>';}
function paymentActions(o){
 if(!o)return '';const v=M.orderView(data,o),unknown=M.paymentUnknown(o);
 return '<div class="recordActions">'+(unknown?actionButton('payment',o.id,'50% · 100% 입금 확인'):'')+(v.balance>0?actionButton('receive',o.id,'50% · 100% 입금'):'')+(o.paymentConfirmation?actionButton('payment',o.id,'확인금액 수정'):'')+'</div>'+(o.paymentConfirmation?'<p class="localPaymentNote">이 기기에서 직접 확인한 입금액 반영</p>':'');
}
function orderCard(o){const editable=data.months[o.date.slice(0,7)]?.status!=='closed',live=data.orders.find(x=>x.id===o.id),canReceive=live&&M.orderView(data,live).balance>0;return '<article class="record"><details><summary><div class="recordTop"><b>'+esc(o.name)+'</b><span class="badge '+(M.paymentUnknown(o)||o.balance?'due':'')+'">'+(M.paymentUnknown(o)?'입금 미확인':o.balance?(o.paid?'부분입금':'미입금'):'완납')+'</span></div><div class="meta">'+esc(o.date)+' · '+esc(o.number||'견적번호 없음')+'</div><p class="desc">'+esc(o.size||'구성 미입력')+' '+esc(o.grade)+'</p><div class="recordAmounts"><strong>'+won(o.amount)+'</strong><span>'+(M.paymentUnknown(o)?'입금·미수금 미확인':o.balance?'미수금 '+won(o.balance):'입금 완료')+'</span></div><span class="expand">상세 보기 ⌄</span></summary><div class="detail"><dl><dt>입금액</dt><dd>'+won(o.paid)+'</dd><dt>미수금</dt><dd>'+won(o.balance)+'</dd><dt>수량</dt><dd>테이블 '+esc(o.tables||0)+' · 수저통 '+esc(o.cutlery||0)+' · 의자 '+esc(o.chairs||0)+'</dd><dt>생산</dt><dd>'+esc(o.production||'—')+'</dd><dt>출고</dt><dd>'+esc(o.deliveryDate||o.delivery||'—')+'</dd></dl><p>'+esc(o.note)+'</p><div class="recordActions">'+(editable?actionButton('editOrder',o.id,'매출 수정'):'')+'</div></div></details><div class="orderQuickPayment">'+paymentActions(live)+'</div></article>';}
function cashCard(c){return '<details class="record"><summary><div class="recordTop"><b>'+esc(c.category||'기타')+'</b><span class="badge '+(c.type==='출금'?'due':'')+'">'+esc(c.type)+'</span></div><div class="meta">'+esc(c.date)+' · '+esc(c.name)+'</div><div class="recordAmounts"><strong>'+(c.type==='출금'?'−':'+')+won(c.amount)+'</strong></div><span class="expand">상세 보기 ⌄</span></summary><div class="detail"><p>'+esc(c.note)+'</p>'+(c.orderId?'<p>매출 연결 · 미수금 반영</p>':'')+(data.months[c.date.slice(0,7)]?.status!=='closed'?actionButton('editCash',c.id,'입출금 수정'):'')+'</div></details>';}
function collectionCard(o){
 const unknown=M.paymentUnknown(o),pending=unknown||o.balance>0,c=o.collection||{},overdue=pending&&c.dueDate&&c.dueDate<M.today();
 const receipts=data.cash.filter(x=>x.orderId===o.id).slice().sort((a,b)=>b.date.localeCompare(a.date));
 return '<article class="record receivable"><div class="recordTop"><b>'+esc(o.name)+'</b><span class="badge '+(pending?'due':'')+'">'+(unknown?'입금 미확인':o.balance?(o.paid?'부분입금':'미입금'):'정산 완료')+'</span></div><div class="meta">'+esc(o.date)+' · '+esc(o.number||'견적번호 없음')+'</div><div class="recordAmounts"><span>'+(unknown?'미수금 확인 필요':'남은 미수금')+'</span><strong>'+won(o.balance)+'</strong></div><div class="collectionMeta"><span>계약 '+won(o.amount)+'</span><span>누적 입금 '+won(o.paid)+'</span></div><div class="collectionMeta"><span class="'+(overdue?'overdue':'')+'">입금 예정 '+esc(c.dueDate||'미정')+(overdue?' · 예정일 지남':'')+'</span></div>'+(c.note?'<p class="collectionMemo">'+esc(c.note)+'</p>':'')+paymentActions(o)+'<div class="recordActions">'+actionButton('collection',o.id,'예정일·메모')+'</div>'+(unknown?'<p class="muted">원본 입금액은 미확인입니다. 실제 받은 누적 금액을 50%·100% 또는 직접 입력으로 확인할 수 있습니다.</p>':'')+'<details><summary>원본 메모 · 기기 입금 내역</summary><p>원본/매출 메모: '+esc(o.note||'없음')+'</p><p>기초 입금 '+won(o.basePaid)+' · 기초 미수금 '+won(o.baseBalance)+(o.adjustment?' · 정산 차이 '+won(o.adjustment):'')+'</p>'+receipts.map(x=>'<div class="receiptRow"><span>'+esc(x.date)+' · '+won(x.amount)+'<small>'+esc(x.note||x.category)+'</small></span>'+(data.months[x.date.slice(0,7)]?.status!=='closed'?actionButton('editCash',x.id,'수정'):'<span>마감</span>')+'</div>').join('')+'<p>기기 입금만 이 목록에 표시합니다. 잘못 입력한 기기 입금은 수정·삭제하면 미수금도 다시 계산됩니다.</p></details></article>';
}
function renderList(){
 const r=report(),q=$('search').value.trim().toLowerCase(),unpaid=tab==='unpaid';
 $('orderTools').hidden=tab==='unpaid'||tab==='cash';
 $('orderFilterNote').textContent=(tab==='paid'?'완납된 거래를 따로 모았습니다. 기록은 삭제하지 않으며 매출 합계에도 그대로 포함됩니다.':'완납된 거래는 ‘정산 완료’ 탭으로 옮겨 표시합니다. 여기에는 미수금·입금 미확인 건만 남습니다.')+(monthMeta().status==='closed'?' 이 달은 마감 당시 입금 상태 기준입니다.':'');
 $('unpaidTools').hidden=!unpaid;
 if(unpaid){const due=M.outstanding(data,selected),unknown=M.unconfirmed(data,selected),late=M.collectionRows(data,selected,{filter:'overdue'});$('collectionSummary').innerHTML='<div><span>확인된 미수금</span><strong>'+won(M.sum(due,'balance'))+'</strong></div><div><span>입금 미확인</span><strong>'+unknown.length+'건</strong></div><div><span>예정일 지남</span><strong>'+late.length+'건</strong></div>';}
 const rows=unpaid?M.collectionRows(data,selected,{filter:$('collectionFilter').value,sort:$('collectionSort').value,query:q}):tab!=='cash'?M.orderListRows(r.orders,{filter:tab==='paid'?'paid':'pending',query:q}):r.cash.filter(x=>[x.name,x.note,x.category].join(' ').toLowerCase().includes(q)).slice().sort((a,b)=>b.date.localeCompare(a.date));
 $('listTitle').textContent={orders:'매출 내역',paid:'정산 완료',unpaid:'미수금 정리',cash:'입출금 내역'}[tab];
 $('listCount').textContent=rows.length+'건'+(unpaid?' · '+label(selected)+'까지 계약한 고객 · 선택한 보기·검색 기준':tab!=='cash'?' 표시 · 이달 전체 '+r.orders.length+'건':'');
 const empty=q?'검색 결과가 없습니다.':tab==='paid'?'이 달에 정산 완료된 거래가 없습니다.':tab==='orders'&&r.orders.length?'남은 미수금·미확인 거래가 없습니다. 완납 내역은 ‘정산 완료’ 탭에서 볼 수 있습니다.':unpaid?'선택한 보기에 해당하는 내역이 없습니다.':'아직 기록이 없습니다. 위 입력 버튼으로 추가하세요.';
 $('records').innerHTML=rows.length?rows.map(x=>unpaid?collectionCard(x):tab==='cash'?cashCard(x):orderCard(x)).join(''):'<div class="panel empty">'+empty+'</div>';
 document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===tab)));
}
function paymentPreview(){
 const o=data.orders.find(x=>x.id===$('paymentId').value),raw=$('paymentAmount').value;
 if(!o||raw===''){$('paymentPreview').textContent='50% 또는 100%를 선택해주세요.';return;}
 try{const paid=M.money(Number(raw),'누적 입금액');if(paid>o.amount)throw Error('계약금액보다 많이 입력할 수 없습니다.');$('paymentPreview').textContent='누적 입금 '+won(paid)+' · 남은 미수금 '+won(o.amount-paid);}
 catch(e){$('paymentPreview').textContent=e.message;}
}
function openPayment(id){
 if(busy||syncBusy)return;const o=data.orders.find(x=>x.id===id);if(!o||(!M.paymentUnknown(o)&&!o.paymentConfirmation))return;
 $('paymentForm').reset();$('paymentId').value=id;$('paymentCustomer').textContent=o.name+' · '+(o.number||o.date);$('paymentContract').textContent='계약금액 '+won(o.amount);
 $('paymentAmount').value=o.paymentConfirmation?.paid??'';$('paymentError').textContent='';$('clearPayment').hidden=!o.paymentConfirmation;markPreset('confirm',0);paymentPreview();dirty=false;$('paymentDialog').showModal();
}
function openCollection(id){if(syncBusy||busy)return;const o=data.orders.find(x=>x.id===id);if(!o)return;$('collectionId').value=id;$('collectionCustomer').textContent=o.name+' · '+(o.number||o.date);$('collectionDate').value=o.collection?.dueDate||'';$('collectionNote').value=o.collection?.note||'';$('collectionError').textContent='';dirty=false;$('collectionDialog').showModal();}
async function prepareBackup(){const box=await S.encrypt(data,key),file={format:'meot-ledger-backup',version:2,identity,exportedAt:new Date().toISOString(),box};if(backupURL)URL.revokeObjectURL(backupURL);backupURL=URL.createObjectURL(new Blob([JSON.stringify(file)],{type:'application/json'}));}
function downloadBackup(){if(!backupURL)throw Error('백업을 준비 중입니다. 잠시 후 다시 눌러주세요.');const a=document.createElement('a');a.href=backupURL;a.download='멋테이블_전체장부_'+M.today()+'_'+String(revision)+'.json';document.body.append(a);a.click();a.remove();}
async function commit(change,message){if(busy)throw Error('저장 중입니다. 잠시 기다려주세요.');busy=true;document.querySelectorAll('form button[type="submit"]').forEach(b=>b.disabled=true);status('저장 중…');try{const next=M.clone(data);change(next);next.updated=new Date().toISOString();M.validate(next);const v=await S.write(identity,next,key,revision);data=next;revision=v;dirty=false;render();status(message+' · '+stamp(data.updated));await prepareBackup();if(navigator.storage?.persist)navigator.storage.persist().catch(()=>{});}catch(e){status(e.message,true);throw e;}finally{busy=false;document.querySelectorAll('form button[type="submit"]').forEach(b=>b.disabled=false);if(data)render();}}
function connectionKey(value){
 const text=String(value||'').trim();
 if(/^[A-Za-z0-9_-]{43}$/.test(text))return text;
 try{
  const u=new URL(text),path=u.pathname.replace(/\/index\.html$/,'/').replace(/\/?$/,'/');
  const currentPath=new URL('./',location.href).pathname;
  const sameLedger=u.origin===location.origin&&path===currentPath;
  const publishedLedger=(u.origin==='https://meottable.com'&&path==='/ledger/')||
   (u.origin==='https://meottable.github.io'&&path==='/meot-table/ledger/');
  if(u.username||u.password||!(sameLedger||publishedLedger))return '';
  const k=new URLSearchParams(u.hash.slice(1)).get('key')||'';
  return /^[A-Za-z0-9_-]{43}$/.test(k)?k:'';
 }catch(_){return '';}
}
async function unlock(candidate){if(busy)return;busy=true;$('connectLedger').disabled=true;try{let chosen=typeof candidate==='string'?candidate:(new URLSearchParams(location.hash.slice(1)).get('key')||key);try{chosen=chosen||localStorage.getItem(ACCESS)||'';}catch(_){}if(!/^[A-Za-z0-9_-]{43}$/.test(chosen))throw Error('장부 연결 코드를 한 번 입력해주세요.');const id=await S.identity(chosen),saved=await S.read(id);let state,v=0;if(saved){state=M.validate(await S.decrypt(saved.box,chosen));v=saved.revision;if(M.applyTargetPolicy(state)){state.updated=new Date().toISOString();v=await S.write(id,state,chosen,v);}}else{const response=await fetch('snapshot.enc.json',{cache:'no-cache'});if(!response.ok)throw Error('기존 장부를 불러오지 못했습니다. 인터넷 연결을 확인해주세요.');state=M.migrate(await S.decrypt(await response.json(),chosen));v=await S.write(id,state,chosen,0);}key=chosen;identity=id;data=state;revision=v;M.ensureMonth(data,M.today().slice(0,7));let remembered=true;try{localStorage.setItem(ACCESS,key);}catch(_){remembered=false;}history.replaceState(null,'',location.pathname+location.search+'#key='+key);$('accessCode').value='';$('connectStatus').textContent='';$('locked').hidden=true;$('app').hidden=false;dirty=false;render();status('이 기기에 저장됨 · '+stamp(data.updated));$('connection').textContent=remembered?'현재 기기·브라우저에 연결과 기록을 보관합니다.':'연결 코드는 기억하지 못했습니다. 다음에도 전용 링크로 열어주세요.';await prepareBackup();}catch(e){$('locked').hidden=false;$('app').hidden=true;$('lockText').textContent=e.message;$('connectStatus').textContent=e.message;}finally{busy=false;$('connectLedger').disabled=false;if(data&&!$('app').hidden){render();syncSource();}}}
async function syncSource(){
 if(!data||busy||syncBusy||dirty||document.querySelector('#orderDialog[open],#cashDialog[open],#targetDialog[open],#collectionDialog[open],#paymentDialog[open],#confirmDialog[open]'))return;
 syncBusy=true;render();$('syncSource').disabled=true;$('syncStatus').textContent='원본 반영본 확인 중…';
 try{
  const response=await fetch('snapshot.enc.json',{cache:'no-store'});if(!response.ok)throw Error('원본 자료를 가져오지 못했습니다.');
  const feed=await S.decrypt(await response.json(),key);if(dirty||document.querySelector('#orderDialog[open],#cashDialog[open],#targetDialog[open],#collectionDialog[open],#paymentDialog[open],#confirmDialog[open]')){$('syncStatus').textContent='입력 완료 후 원본을 다시 확인합니다.';return;}
  if(!feed.source){$('syncStatus').textContent='원본 연동 자료 배포 중입니다. 잠시 후 다시 확인해주세요.';return;}
  const result=MeotLedgerSync.merge(data,feed);
  if(result.changed)await commit(s=>{for(const k of Object.keys(s))delete s[k];Object.assign(s,result.state);},'원본 장부 변경 반영 완료');
  lastSyncCheck=Date.now();$('syncStatus').textContent='원본 v'+data.sourceVersion+' · 원본 수정 '+stamp(data.sourceMeta.modifiedAt)+' · 확인 '+new Date().toLocaleTimeString('ko-KR',{timeZone:'Asia/Seoul'});$('syncStatus').classList.remove('error');
 }catch(e){window.MeotLedgerAppUpdate?.check();$('syncStatus').textContent='동기화 보류: '+e.message+' 저장된 기록은 그대로 볼 수 있습니다.';$('syncStatus').classList.add('error');}
 finally{syncBusy=false;$('syncSource').disabled=false;render();}
}
$('syncSource').addEventListener('click',()=>syncSource());
setInterval(()=>{if(!document.hidden)syncSource();},300000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-lastSyncCheck>60000)syncSource();});
function goMonth(m){selected=m;M.ensureMonth(data,m);$('search').value='';render();}
function formDate(){return selected===M.today().slice(0,7)?M.today():selected+'-01';}
function receivingDate(){let m=selected;if(data.months[m]?.status==='closed')m=M.today().slice(0,7);while(data.months[m]?.status==='closed')m=M.nextMonth(m);return m===M.today().slice(0,7)?M.today():m+'-01';}
function markPreset(kind,percent){document.querySelectorAll('[data-'+kind+'-percent]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset[kind+'Percent'])===percent)));}
function initialPercent(percent){
 if($('orderId').value)return;
 try{const total=Number($('orderAmount').value);$('initialAmount').value=M.percentageAmount(total,percent);initialPreset=percent;markPreset('initial',percent);$('initialPercentHint').textContent=percent+'% · '+won(Number($('initialAmount').value))+(percent===50&&total%2?' (원 단위 반올림)':'')+' — 실제 입금일을 확인하고 저장하세요.';$('orderError').textContent='';dirty=true;}
 catch(e){$('initialAmount').value=0;$('initialPercentHint').textContent=e.message;initialPreset=0;markPreset('initial',0);}
}
function openOrder(id){if(syncBusy)return;const o=data.orders.find(x=>x.id===id);$('orderForm').reset();$('orderId').value=o?.id||'';$('orderTitle').textContent=o?'매출 수정':'매출 입력';for(const [field,k] of [['Date','date'],['Name','name'],['Number','number'],['Amount','amount'],['Size','size'],['Tables','tables'],['Chairs','chairs'],['Cutlery','cutlery'],['Delivery','deliveryDate'],['Production','production'],['Note','note']])$('order'+field).value=o?.[k]??(['Tables','Chairs','Cutlery'].includes(field)?0:'');$('orderDate').value=o?.date||formDate();const grade=o?.grade||'';if(grade&&![...$('orderGrade').options].some(x=>x.value===grade))$('orderGrade').add(new Option(grade,grade));$('orderGrade').value=grade;$('initialDate').value=formDate();$('initialPayment').hidden=!!o;initialPreset=0;markPreset('initial',0);$('initialPercentHint').textContent='비율을 누르거나 받은 금액을 직접 입력하세요.';$('deleteOrder').hidden=!o;$('orderError').textContent='';dirty=false;$('orderDialog').showModal();}
function cashFields(){
 const linked=$('cashType').value==='입금',o=linked?data.orders.find(x=>x.id===$('cashOrder').value):null,old=data.cash.find(x=>x.id===$('cashId').value);
 $('cashOrderLabel').hidden=!linked;$('cashName').readOnly=!!o;if(o)$('cashName').value=o.name;
 $('cashOrder').disabled=!!old?.imported;$('cashPresets').hidden=!o||M.paymentUnknown(o)||!!old?.imported;markPreset('cash',cashPreset);
 $('cashHint').textContent=o?(M.paymentUnknown(o)?'원본 입금액 확인이 먼저 필요합니다.':'남은 미수금 '+won(M.orderView(data,o).balance+(old?.orderId===o.id?old.amount:0))):(old?.imported?'이전 장부에서 가져온 입출금입니다. 기존 입금액은 이미 매출에 반영되어 있어 매출에 다시 연결하지 않습니다.':'');
 if(!$('cashPresets').hidden){
  const half=M.receiptPreset(data,o.id,50,old?.id),full=M.receiptPreset(data,o.id,100,old?.id);
  $('fillHalf').disabled=half.amount===0;$('fillBalance').disabled=full.amount===0;
  $('cashPercentHint').textContent=half.amount?'비율을 누르면 이번에 받을 금액만 입력됩니다.':full.amount?'이미 50% 이상 입금됐습니다. 100%를 누르면 남은 금액이 입력됩니다.':'더 받을 미수금이 없습니다.';
  if(o.adjustment)$('cashPercentHint').textContent+=' 원본 정산 차이는 그대로 유지합니다.';
 }
}
function cashPercent(percent){
 if($('cashPresets').hidden)return;
 try{const p=M.receiptPreset(data,$('cashOrder').value,percent,$('cashId').value);if(!p.amount)return;
  $('cashAmount').value=p.amount;if(!$('cashId').value)$('cashCategory').value=percent===100?'잔금':'계약금';cashPreset=percent;markPreset('cash',percent);dirty=true;$('cashError').textContent='';
  const o=data.orders.find(x=>x.id===$('cashOrder').value);
  $('cashPercentHint').textContent='기존 '+won(p.paid)+' + 이번 '+won(p.amount)+(percent===50&&o.amount%2?' (50%는 원 단위 반올림)':'')+' — 실제 입금일과 금액을 확인한 뒤 저장하세요.'+(p.adjustment?' 원본 정산 차이는 유지됩니다.':'');
 }catch(e){$('cashError').textContent=e.message;}
}
function openCash(id,orderId){if(syncBusy)return;const c=data.cash.find(x=>x.id===id);$('cashForm').reset();cashPreset=0;markPreset('cash',0);$('cashId').value=c?.id||'';$('cashTitle').textContent=c?'입출금 수정':orderId?'입금 기록':'입출금 입력';$('cashDate').value=c?.date||(orderId?receivingDate():formDate());$('cashType').value=c?.type||'입금';$('cashName').value=c?.name||'';$('cashCategory').value=c?.category||(orderId?'잔금':'');$('cashAmount').value=c?.amount||'';$('cashNote').value=c?.note||'';$('cashOrder').innerHTML='<option value="">연결 안 함 · 기타 입출금</option>'+data.orders.filter(o=>M.orderView(data,o).balance>0||o.id===c?.orderId||o.id===orderId).map(o=>'<option value="'+esc(o.id)+'">'+esc(o.name)+' · '+esc(o.number||o.date)+'</option>').join('');$('cashOrder').value=c?.orderId||orderId||'';cashFields();$('deleteCash').hidden=!c;$('cashError').textContent='';dirty=false;$('cashDialog').showModal();}
function confirm(title,text,action){$('confirmTitle').textContent=title;$('confirmText').textContent=text;$('confirmError').textContent='';confirmAction=action;$('confirmDialog').showModal();}
$('confirmYes').addEventListener('click',async()=>{if(!confirmAction||busy)return;$('confirmYes').disabled=true;try{await confirmAction();$('confirmDialog').close();}catch(e){$('confirmError').textContent=e.message;}finally{$('confirmYes').disabled=false;}});
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>{const d=$(b.dataset.close);if(busy)return;if(dirty&&['orderDialog','cashDialog','targetDialog','collectionDialog','paymentDialog'].includes(d.id)&&!window.confirm('아직 저장하지 않은 입력이 있습니다. 닫을까요?'))return;d.close();if(d.id!=='confirmDialog')dirty=false;}));
for(const id of ['orderDialog','cashDialog','targetDialog','collectionDialog','paymentDialog']){$(id).addEventListener('input',()=>dirty=true);$(id).addEventListener('cancel',e=>{if(busy||(dirty&&!window.confirm('저장하지 않은 입력을 닫을까요?')))e.preventDefault();else dirty=false;});}
$('orderForm').addEventListener('submit',async e=>{e.preventDefault();const oldId=$('orderId').value,id=oldId||uuid();try{const input={id,date:$('orderDate').value,name:$('orderName').value.trim(),number:$('orderNumber').value.trim(),amount:Number($('orderAmount').value),size:$('orderSize').value.trim(),grade:$('orderGrade').value,tables:Number($('orderTables').value),chairs:Number($('orderChairs').value),cutlery:Number($('orderCutlery').value),deliveryDate:$('orderDelivery').value,production:$('orderProduction').value.trim(),note:$('orderNote').value.trim()};const initial=Number($('initialAmount').value||0);await commit(s=>{M.saveOrder(s,input);if(!oldId&&initial>0)M.saveCash(s,{id:uuid(),date:$('initialDate').value,type:'입금',orderId:id,name:input.name,category:initial===input.amount?'전액':'계약금',amount:initial,note:'매출 입력 시 함께 기록'});},'매출 저장 완료');$('orderDialog').close();goMonth(input.date.slice(0,7));}catch(err){$('orderError').textContent=err.message;}});
$('cashForm').addEventListener('submit',async e=>{e.preventDefault();try{const input={id:$('cashId').value||uuid(),date:$('cashDate').value,type:$('cashType').value,orderId:$('cashType').value==='입금'?$('cashOrder').value:'',name:$('cashName').value.trim(),category:$('cashCategory').value.trim(),amount:Number($('cashAmount').value),note:$('cashNote').value.trim()};await commit(s=>M.saveCash(s,input),'입출금 저장 완료');$('cashDialog').close();goMonth(input.date.slice(0,7));}catch(err){$('cashError').textContent=err.message;}});
$('collectionFilter').addEventListener('change',renderList);$('collectionSort').addEventListener('change',renderList);
document.querySelectorAll('[data-confirm-percent]').forEach(b=>b.addEventListener('click',()=>{
 try{const o=data.orders.find(x=>x.id===$('paymentId').value),percent=Number(b.dataset.confirmPercent);$('paymentAmount').value=M.percentageAmount(o.amount,percent);markPreset('confirm',percent);$('paymentAck').checked=false;$('paymentError').textContent='';dirty=true;paymentPreview();if(percent===50&&o.amount%2)$('paymentPreview').textContent+=' (원 단위 반올림)';}catch(e){$('paymentError').textContent=e.message;}
}));
$('paymentAmount').addEventListener('input',()=>{markPreset('confirm',0);$('paymentAck').checked=false;paymentPreview();});
$('paymentForm').addEventListener('submit',async e=>{e.preventDefault();try{if($('paymentAmount').value==='')throw Error('누적 입금액을 선택하거나 입력해주세요.');await commit(s=>M.confirmPayment(s,$('paymentId').value,{paid:Number($('paymentAmount').value),acknowledged:$('paymentAck').checked}),'누적 입금 확인 완료 · 새 입출금 추가 없음');$('paymentDialog').close();}catch(err){$('paymentError').textContent=err.message;}});
$('clearPayment').addEventListener('click',()=>confirm('입금 확인 되돌리기','이 기기에서 직접 확인한 금액을 취소하고 입금·미수금을 다시 미확인으로 표시할까요? 원본과 마감본은 그대로 유지됩니다.',async()=>{await commit(s=>M.clearPaymentConfirmation(s,$('paymentId').value),'입금 미확인으로 되돌림');$('paymentDialog').close();}));
$('collectionForm').addEventListener('submit',async e=>{e.preventDefault();try{await commit(s=>M.saveCollection(s,$('collectionId').value,{dueDate:$('collectionDate').value,note:$('collectionNote').value}),'미수금 정리 저장 완료');$('collectionDialog').close();}catch(err){$('collectionError').textContent=err.message;}});
document.querySelectorAll('[data-initial-percent]').forEach(b=>b.addEventListener('click',()=>initialPercent(Number(b.dataset.initialPercent))));
$('orderAmount').addEventListener('input',()=>{if(initialPreset)initialPercent(initialPreset);});
$('initialAmount').addEventListener('input',()=>{initialPreset=0;markPreset('initial',0);$('initialPercentHint').textContent='직접 입력한 금액으로 저장합니다.';});
document.querySelectorAll('[data-cash-percent]').forEach(b=>b.addEventListener('click',()=>cashPercent(Number(b.dataset.cashPercent))));
$('cashAmount').addEventListener('input',()=>{cashPreset=0;markPreset('cash',0);if(!$('cashPresets').hidden)$('cashPercentHint').textContent='직접 입력한 금액으로 저장합니다.';});
function cashSelectionChanged(){if(cashPreset){$('cashAmount').value='';cashPreset=0;}cashFields();}
$('targetForm').addEventListener('submit',async e=>{e.preventDefault();try{await commit(s=>{M.assertOpen(s,selected+'-01');const month=M.ensureMonth(s,selected);month.target=M.money(Number($('targetAmount').value));month.targetCustomized=true;},'월 목표 저장 완료');$('targetDialog').close();}catch(err){$('targetError').textContent=err.message;}});
$('deleteOrder').addEventListener('click',()=>confirm('매출 삭제','선택한 매출을 삭제할까요? 연결된 입금이 있으면 삭제할 수 없습니다.',async()=>{await commit(s=>M.remove(s,'order',$('orderId').value),'매출 삭제 완료');$('orderDialog').close();}));
$('deleteCash').addEventListener('click',()=>confirm('입출금 삭제','선택한 입출금을 삭제할까요? 매출에 연결된 입금이면 미수금도 다시 계산됩니다.',async()=>{await commit(s=>M.remove(s,'cash',$('cashId').value),'입출금 삭제 완료');$('cashDialog').close();}));
$('closeMonth').addEventListener('click',()=>{const r=report(),m=selected;confirm(label(m)+' 마감', '계약매출 '+won(r.revenue)+'\n실제 입금 '+won(r.received)+'\n실제 출금 '+won(r.spent)+'\n\n이달 기록을 보존하고 '+label(M.nextMonth(m))+'로 이동합니다. 마감 후 전체 백업도 받아주세요.',async()=>{await commit(s=>M.closeMonth(s,m),'월 마감 저장 완료');goMonth(M.nextMonth(m));status(label(m)+' 마감 완료 · 다음 달을 시작합니다. 전체 백업도 받아주세요.');});});
$('reopenMonth').addEventListener('click',()=>confirm('마감 해제',label(selected)+' 기록을 다시 수정할까요? 이전 마감본은 백업 데이터 안에 보존됩니다.',()=>commit(s=>M.reopen(s,selected),'마감 해제 완료')));
$('editTarget').addEventListener('click',()=>{$('targetAmount').value=monthMeta().target;$('targetError').textContent='';dirty=false;$('targetDialog').showModal();});
$('cashType').addEventListener('change',cashSelectionChanged);$('cashOrder').addEventListener('change',cashSelectionChanged);
$('addOrder').addEventListener('click',()=>openOrder());$('addCash').addEventListener('click',()=>openCash());
$('records').addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b||busy)return;const {action,id}=b.dataset;if(action==='editOrder')openOrder(id);if(action==='editCash')openCash(id);if(action==='receive')openCash('',id);if(action==='collection')openCollection(id);if(action==='payment')openPayment(id);});
$('month').addEventListener('change',()=>goMonth($('month').value));$('prevMonth').addEventListener('click',()=>goMonth(M.nextMonth(selected,-1)));$('nextMonth').addEventListener('click',()=>goMonth(M.nextMonth(selected)));$('thisMonth').addEventListener('click',()=>goMonth(M.today().slice(0,7)));$('search').addEventListener('input',renderList);
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.tab;renderList();}));$('showUnpaid').addEventListener('click',()=>{tab='unpaid';$('collectionFilter').value='pending';$('search').value='';renderList();$('listTitle').scrollIntoView({behavior:'smooth',block:'center'});});
$('exportBackup').addEventListener('click',()=>{try{downloadBackup();status('모든 달의 백업 다운로드를 요청했습니다. 파일 앱에 저장됐는지 확인해주세요.');}catch(e){status(e.message,true);}});
$('importBackup').addEventListener('click',()=>{$('backupFile').value='';$('backupFile').click();});
$('backupFile').addEventListener('change',async()=>{const file=$('backupFile').files[0];if(!file)return;try{if(file.size>25000000)throw Error('백업 파일이 너무 큽니다.');const backup=JSON.parse(await file.text());if(backup.format!=='meot-ledger-backup'||backup.version!==2||backup.identity!==identity)throw Error('이 장부의 백업 파일이 아닙니다. 연결 코드를 확인해주세요.');const restored=M.validate(await S.decrypt(backup.box,key));confirm('전체 장부 복원','백업: '+stamp(backup.exportedAt)+'\n매출 '+restored.orders.length+'건 · 입출금 '+restored.cash.length+'건\n\n현재 모든 달의 기록을 이 백업으로 교체합니다. 복원 전 현재 장부의 백업 파일도 다운로드합니다.',async()=>{downloadBackup();await commit(s=>{for(const k of Object.keys(s))delete s[k];Object.assign(s,M.clone(restored));M.applyTargetPolicy(s);},'백업 복원 완료');goMonth(M.today().slice(0,7));});}catch(e){status('복원하지 않았습니다. '+e.message,true);}});
$('connectLedger').addEventListener('click',()=>{const k=connectionKey($('accessCode').value);if(!k){$('connectStatus').textContent='연결 코드 또는 #key=가 포함된 전용 링크를 전체 붙여넣어주세요.';return;}unlock(k);});$('retry').addEventListener('click',()=>unlock());$('refresh').addEventListener('click',()=>unlock());
$('installHelp').addEventListener('click',()=>$('help').showModal());$('closeHelp').addEventListener('click',()=>$('help').close());window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvent=e;$('nativeInstall').hidden=false;});$('nativeInstall').addEventListener('click',async()=>{if(installEvent){await installEvent.prompt();installEvent=null;$('nativeInstall').hidden=true;}});
window.addEventListener('beforeunload',e=>{if(busy||dirty){e.preventDefault();e.returnValue='저장하지 않은 내용이 있습니다.';}});
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js',{scope:'./',updateViaCache:'none'}).then(r=>r.update()).catch(()=>{});
window.MeotLedgerCanReload=()=>!busy&&!syncBusy&&!dirty&&!document.querySelector('dialog[open]')&&!$('accessCode').value.trim();
unlock();
})();







