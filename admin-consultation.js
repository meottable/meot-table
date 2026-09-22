/* Website events and owner-confirmed consultation totals are separate records. */
const CONSULT_KEY='meot_admin_daily_consultations_v1';
let consultationLoadId=0;
function dailyConsultations(){return parse(CONSULT_KEY,{})}
function renderActualConsultations(){
  const entry=dailyConsultations()[dateKeyToInput(selectedDate)];
  ['kakao','phone','other'].forEach(k=>$('actual-'+k).value=entry?.[k]??'');
  $('actualDate').textContent=dateKeyToInput(selectedDate);
  $('actualTotal').textContent=entry?String(entry.kakao+entry.phone+entry.other)+'건':'미입력';
  $('actualStatus').textContent=entry?'직접 확인한 상담 건수입니다.':'아직 실제 상담 건수를 입력하지 않았습니다.';
}
function saveActualConsultations(e){
  e.preventDefault();
  const entry={};
  for(const k of ['kakao','phone','other']){
    const raw=String($('actual-'+k).value).trim(),n=Number(raw);
    if(raw===''||!Number.isSafeInteger(n)||n<0){$('actualStatus').textContent='세 항목을 모두 입력하세요. 상담이 없으면 0을 입력하세요.';return}
    entry[k]=n;
  }
  const entries=dailyConsultations();entries[dateKeyToInput(selectedDate)]=entry;
  try{save(CONSULT_KEY,entries);renderActualConsultations();$('actualStatus').textContent='이 기기에 저장했습니다.'}
  catch(_){$('actualStatus').textContent='저장하지 못했습니다. 브라우저 저장 공간을 확인하세요.'}
}
metric=async function(d,m){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
  try{const r=await fetch(API+PREFIX+d+'_'+m,{cache:'no-store',signal:controller.signal});
    if(!r.ok)return null;const data=await r.json();
    if(data.value===null||data.value===undefined||data.value==='')return null;
    const value=Number(data.value);return Number.isFinite(value)&&value>=0?value:null;
  }catch(_){return null}finally{clearTimeout(timer)}
};
metricRows=function(id,defs,vals){
  const max=Math.max(1,...vals.filter(v=>v!==null));
  $(id).innerHTML=defs.map((x,i)=>'<div class="metric-row"><span>'+x[0]+'</span><div class="track"><div class="fill" style="--w:'+(vals[i]===null?0:Math.round(vals[i]/max*100))+'%"></div></div><b>'+(vals[i]===null?'확인 불가':vals[i])+'</b></div>').join('');
};
loadAnalytics=async function(){
  if(!selectedDate)selectedDate=kDate();
  const date=selectedDate,request=++consultationLoadId;
  $('datePicker').value=dateKeyToInput(date);$('datePicker').max=dateKeyToInput(kDate());$('nextDate').disabled=date>=kDate();
  renderActualConsultations();
  ['views','visitors','clicks','rate'].forEach(id=>$(id).textContent='조회 중');
  ['sources','clickMetrics','contentMetrics','trend'].forEach(id=>$(id).textContent='조회 중');
  $('analyticsStatus').textContent='홈페이지 통계를 조회하고 있습니다.';
  const core=await Promise.all(['pageviews','visitors','click_kakao','click_phone'].map(m=>metric(date,m)));
  if(request!==consultationLoadId)return;
  const clicks=core[2]===null||core[3]===null?null:core[2]+core[3];
  $('views').textContent=core[0]===null?'확인 불가':core[0].toLocaleString();
  $('visitors').textContent=core[1]===null?'확인 불가':core[1].toLocaleString();
  const knownClicks=core.slice(2).filter(v=>v!==null).reduce((a,b)=>a+b,0);
  $('clicks').textContent=clicks===null?(knownClicks>0?knownClicks.toLocaleString()+'회 이상':'확인 불가'):clicks.toLocaleString();
  $('rate').textContent=core[1]===null||clicks===null?'확인 불가':core[1]===0?'—':(clicks/core[1]*100).toFixed(1)+'%';
  const base=dateObj(date),days=[];
  for(let i=6;i>=0;i--){const key=kDate(new Date(base.getTime()-i*86400000));days.push({key,label:Number(key.slice(4,6))+'/'+Number(key.slice(6))})}
  const [sv,cv,av,vals]=await Promise.all([
    Promise.all(sourceDefs.map(x=>metric(date,x[1]))),
    Promise.all(conversionDefs.map(x=>metric(date,x[1]))),
    Promise.all(contentDefs.map(x=>metric(date,x[1]))),
    Promise.all(days.map(x=>metric(x.key,'visitors')))
  ]);
  if(request!==consultationLoadId)return;
  metricRows('sources',sourceDefs,sv);metricRows('clickMetrics',conversionDefs,cv);metricRows('contentMetrics',contentDefs,av);
  const max=Math.max(1,...vals.filter(v=>v!==null));
  $('trend').innerHTML=days.map((x,i)=>'<div class="bar-wrap"><div class="bar-value">'+(vals[i]===null?'—':vals[i])+'</div><div class="bar" style="--h:'+(vals[i]===null?0:Math.max(2,Math.round(vals[i]/max*175)))+'px"></div><div class="bar-label">'+x.label+'</div></div>').join('');
  $('analyticsStatus').textContent=[...core,...sv,...cv,...av,...vals].some(v=>v===null)?'일부 통계를 불러오지 못했습니다. 확인 불가는 0건이 아닙니다.':'조회 완료 · 문의 클릭은 실제 상담 인원과 다릅니다.';
};
backupData=function(){
  const data={version:3,exportedAt:new Date().toISOString(),customers,quotes,leads:parse(LKEY),leadStates,dailyConsultations:dailyConsultations()};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download='meot-admin-backup-'+today()+'.json';a.click();URL.revokeObjectURL(a.href);
};
const existingRestore=$('restoreFile').onchange;
$('restoreFile').onchange=async function(e){
  // Existing importer owns its confirmation. Add consultation data only if its
  // current customer/quote state matches the chosen backup after import.
  let data;try{data=JSON.parse(await e.target.files[0].text())}catch(_){return existingRestore(e)}
  if(!data.dailyConsultations)return existingRestore(e);
  const entries=data.dailyConsultations;
  if(!entries||Array.isArray(entries)||typeof entries!=='object'||Object.entries(entries).some(([d,v])=>!/^\d{4}-\d{2}-\d{2}$/.test(d)||!v||['kakao','phone','other'].some(k=>!Number.isSafeInteger(v[k])||v[k]<0))){alert('실제 상담 기록 형식이 올바르지 않습니다.');return}
  if(!confirm('백업 파일의 고객·견적·실제 상담 기록으로 이 기기의 자료를 바꿀까요?'))return;
  customers=data.customers||[];quotes=data.quotes||[];leadStates=data.leadStates||{};
  save(CKEY,customers);save(QKEY,quotes);save(LKEY,data.leads||[]);save('meot_lead_states_v2',leadStates);save(CONSULT_KEY,entries);renderAll();if(selectedDate)renderActualConsultations();alert('복원이 완료됐습니다.');
};
$('actualConsultationForm').onsubmit=saveActualConsultations;
if(location.hash==='#analytics')go('analytics');
