(function(){
'use strict';
if(!window.MEOT_CLOUD)return;
let revision=window.MEOT_CLOUD.revision,saving=false,dirty=false,failed=false,timer;
const status=document.createElement('div');status.className='auto-alert';status.setAttribute('role','status');status.textContent='Google 공통 DB 불러옴';document.querySelector('main').prepend(status);
function snapshot(){return{customers,quotes,automation:JSON.parse(localStorage.getItem('meot_cloud_automation_v1')||JSON.stringify(MeotAutomation.empty()))}}
function flush(){if(saving||!dirty||failed)return;saving=true;dirty=false;status.textContent='Google 공통 DB 저장 중…';google.script.run.withSuccessHandler(result=>{revision=result.revision;saving=false;status.textContent='Google 공통 DB 저장됨 · '+new Date().toLocaleTimeString('ko-KR');if(dirty)flush()}).withFailureHandler(err=>{saving=false;failed=true;dirty=true;status.textContent='공통 DB 저장 실패: '+err.message+' 현재 내용은 이 기기에 남아 있습니다. 자동화 설정에서 백업 후 새로고침하세요.';status.style.borderColor='#c33'}).saveSnapshot(revision,snapshot())}
window.addEventListener('meot:stored',()=>{dirty=true;clearTimeout(timer);timer=setTimeout(flush,500)});
window.addEventListener('beforeunload',e=>{if(dirty||saving){e.preventDefault();e.returnValue='저장이 완료되지 않았습니다.'}});
})();
