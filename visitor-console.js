(function(){
'use strict';
const start='20261005';
const groups=[
 ['방문 성향',[['처음 확인된 브라우저','new'],['재방문 브라우저','returning'],['저장 제한·미분류','unclassified']]],
 ['접속 기기',[['모바일','device_mobile'],['태블릿','device_tablet'],['컴퓨터','device_desktop']]],
 ['관심 구간 · 화면 노출 세션',[['공장·영상','section_factory'],['예상견적','section_estimate'],['등급 비교','section_grades'],['상판 디자인','section_design'],['의자','section_chairs'],['납품 사례','section_portfolio'],['고객 후기','section_customer-reviews']]],
 ['스크롤 깊이 · 누적 세션',[['25% 이상','scroll_25'],['50% 이상','scroll_50'],['75% 이상','scroll_75'],['90% 이상','scroll_90']]],
 ['화면이 열린 시간 · 누적',[['30초 이상','active30'],['60초 이상','active60']]],
 ['페이지를 떠나기 전 마지막 관찰 구간 · 참고용',[['공장','leave_factory'],['견적','leave_estimate'],['등급','leave_grades'],['디자인','leave_design'],['의자','leave_chairs'],['납품','leave_portfolio'],['후기','leave_customer-reviews'],['그 외','leave_other']]]
];
const sources=[['네이버','naver'],['구글','google'],['인스타·Meta','social'],['카카오','kakao'],['AI 서비스','ai'],['직접·출처 없음','direct'],['기타','other']];
const panel=document.createElement('div');panel.id='visitor-analysis';
panel.innerHTML='<div class="panel" style="margin:16px 0"><h3>방문자 행동 분석</h3><p id="visitor-status" role="status">날짜를 선택하면 조회합니다.</p><p class="notice">2026년 10월 5일 기능 게시 이후부터 수집합니다. 이전 방문 기록은 복원되지 않습니다. 세션은 탭·날짜별로 구분하며 재접속 때 30분 이상 공백이면 새로 집계합니다. 실제 사람 수와 다릅니다.</p><div class="cards" id="visitor-cards"></div><p id="visitor-insight" class="insight-box"></p></div><div class="analytics-grid" id="visitor-groups"></div><article class="panel" style="margin-top:14px"><h3>유입 경로별 상담 클릭</h3><p>현재 유입 출처 기준 · 반복 클릭은 세션당 한 번 · 실제 상담·계약과 다릅니다.</p><div class="table-wrap"><table><thead><tr><th>출처</th><th>방문 세션</th><th>상담 클릭 세션</th><th>클릭 비율</th></tr></thead><tbody id="visitor-sources"></tbody></table></div></article><article class="panel" style="margin:14px 0"><h3>지역 · 연령 · 성별</h3><p><b>미연동 — 현재 방문자 속성 데이터가 없습니다.</b></p><p>접속 지역과 매장 설치 지역은 다릅니다. 고객 이름·사진으로 나이와 성별을 추측하지 않습니다. 분석 서비스에서 제공하는 집계 데이터가 연결되면 표시할 수 있습니다.</p><p class="notice">재방문은 이 브라우저의 최근 90일 방문 표시 기준입니다. 기기 변경·저장 공간 삭제 시 신규로 보일 수 있습니다. 마지막 관찰 구간은 페이지 종료 신호 누락이 있을 수 있어 이탈 원인을 뜻하지 않습니다.</p></article>';
const anchor=document.getElementById('actualConsultationForm').closest('article');anchor.before(panel);
groups.forEach((g,i)=>{const article=document.createElement('article');article.className='panel';article.innerHTML='<div class="panel-head"><h3>'+g[0]+'</h3></div><div id="visitor-group-'+i+'" class="metric-rows"></div>';document.getElementById('visitor-groups').append(article);});
let token=0;
const core=['sessions','quote','contact','lead_saved'];
const names=[...new Set([...core,...groups.flatMap(g=>g[1].map(r=>r[1])),...sources.flatMap(s=>['source_'+s[1],'contact_source_'+s[1]])])];
const show=v=>v===null?'기록 없음':v.toLocaleString();
async function load(){
 const date=selectedDate,request=++token,status=document.getElementById('visitor-status');
 const values=Object.fromEntries(names.map(n=>[n,null]));
 status.textContent='방문 행동 통계를 조회하고 있습니다.';
 document.getElementById('visitor-cards').textContent='조회 중';document.getElementById('visitor-sources').textContent='';document.getElementById('visitor-insight').textContent='';groups.forEach((g,i)=>document.getElementById('visitor-group-'+i).textContent='조회 중');
 let failures=0;
 if(date>=start){let cursor=0;await Promise.all(Array.from({length:8},async()=>{while(cursor<names.length){const name=names[cursor++];if(request!==token)return;try{const r=await fetch(API+PREFIX+date+'_v1_'+name,{cache:'no-store',signal:AbortSignal.timeout(8000)});if(r.status===404)continue;if(!r.ok)throw Error();const data=await r.json();if(data.value===null||data.value===undefined||data.value==='')continue;const n=Number(data.value);if(!Number.isFinite(n)||n<0)throw Error();values[name]=n;}catch(_){failures++;}}}));}
 if(request!==token)return;
 status.textContent=date<start?'수집 시작 전 날짜입니다.':failures?'일부 통계 조회 실패 — 빈 항목은 0건으로 판단하지 마세요.':'조회 완료 · 기록 없음은 미수집·전송 누락·해당 행동 없음 등을 포함합니다.';
 const labels=['방문 세션','견적 사용 세션','상담 클릭 세션','고객 DB 저장 세션'];
 document.getElementById('visitor-cards').innerHTML=core.map((n,i)=>'<div class="card"><div class="label">'+labels[i]+'</div><div class="value" style="font-size:22px">'+show(values[n])+'</div></div>').join('');
 groups.forEach((g,i)=>{const max=Math.max(1,...g[1].map(r=>values[r[1]]||0));document.getElementById('visitor-group-'+i).innerHTML=g[1].map(([label,n])=>'<div class="metric-row" style="grid-template-columns:minmax(95px,1fr) 1fr 65px"><span>'+label+'</span><div class="track"><div class="fill" style="--w:'+((values[n]||0)/max*100)+'%"></div></div><b>'+show(values[n])+'</b></div>').join('');});
 document.getElementById('visitor-sources').innerHTML=sources.map(([label,n])=>{const v=values['source_'+n],c=values['contact_source_'+n];return '<tr><td>'+label+'</td><td>'+show(v)+'</td><td>'+show(c)+'</td><td>'+(v>0&&c!==null&&c<=v?(c/v*100).toFixed(1)+'%':'—')+'</td></tr>';}).join('');
 const ranked=groups[2][1].filter(r=>values[r[1]]>0).sort((a,b)=>values[b[1]]-values[a[1]]);
 document.getElementById('visitor-insight').textContent=ranked.length?'가장 많이 관찰된 구간: '+ranked[0][0]+'. 화면에 보였다는 뜻이며 구매 의도나 이탈 이유를 단정할 수 없습니다. 아래 실제 상담 기록과 함께 확인하세요.':'관심 구간 기록이 쌓이면 관찰 결과를 표시합니다. 실제 상담은 아래 확인한 건수를 따로 기록하세요.';
}
const original=window.loadAnalytics;
window.loadAnalytics=function(){const result=original.apply(this,arguments);load();return result;};
if(location.hash==='#analytics')load();
})();
