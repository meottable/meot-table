/* Refresh the app shell without clearing the connection or encrypted local ledger. */
(()=>{
'use strict';
const current=document.documentElement.dataset.ledgerBuild,notice=document.getElementById('appUpdateStatus');
let pending='',checking=false,navigating=false,applying=false;
const setNotice=text=>{notice.textContent=text;notice.hidden=!text;};
function idle(){return typeof window.MeotLedgerCanReload==='function'&&window.MeotLedgerCanReload();}
async function apply(){
 if(!pending||navigating||applying||document.hidden)return;
 if(!idle()){setNotice('새 화면이 준비됐습니다. 입력을 저장하거나 닫으면 자동으로 갱신합니다.');return;}
 applying=true;const target=pending,url=new URL(location.href);url.searchParams.set('app',target);
 try{
  // Deployment/CDN propagation can briefly serve a new version file with old HTML.
  // Verify the matching shell before navigation to avoid a refresh loop.
  const response=await fetch(url.pathname+url.search,{cache:'no-store'});
  if(!response.ok)return;
  const doc=new DOMParser().parseFromString(await response.text(),'text/html');
  if(doc.documentElement.dataset.ledgerBuild!==target||!idle()||document.hidden)return;
  if(target===current)url.searchParams.set('refresh',String(Date.now()));
  navigating=true;setNotice('저장된 기록을 유지하고 최신 화면을 여는 중입니다.');
  location.replace(url.href);
 }catch(_){setNotice('화면 업데이트를 기다리는 중입니다. 인터넷 연결 후 다시 확인합니다.');}finally{applying=false;}
}
async function check(){
 if(checking||navigating)return;
 checking=true;
 try{
  const response=await fetch('app-version.json',{cache:'no-store'});if(!response.ok)return;
  const {version}=await response.json();
  if(typeof version!=='string'||!/^20\d{6}-[1-9]\d*$/.test(version))return;
  if(version!==current){pending=version;setNotice('최신 화면을 확인했습니다. 저장된 기록을 유지하며 업데이트합니다.');}
  await apply();
 }catch(_){}finally{checking=false;}
}
document.getElementById('refreshApp').addEventListener('click',async()=>{await check();if(!pending)pending=current;await apply();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)check();});
if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('controllerchange',()=>check());
setInterval(check,300000);
setInterval(()=>{if(pending)apply();},2000);
window.MeotLedgerAppUpdate={check};
check();
})();
