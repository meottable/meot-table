/* Installation only: never reads, changes or transfers business records. */
(()=>{
  'use strict';
  const open=document.getElementById('installHelp'),dialog=document.getElementById('help'),install=document.getElementById('nativeInstall'),status=document.getElementById('installStatus');
  if(!open||!dialog||!install||!status)return;
  const mobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const mode=window.matchMedia('(display-mode: standalone)');
  let pending=null,working=false,installed=mode.matches||navigator.standalone===true;
  function paint(){
    open.textContent=installed?'앱 설치 안내':mobile?'홈 화면 추가':'PC에 설치';
    install.hidden=!pending||installed;install.disabled=working;
    if(installed)status.textContent='설치된 앱입니다. 다음부터 시작 메뉴나 홈 화면에서 열어주세요.';
  }
  open.addEventListener('click',()=>{paint();if(!dialog.open)dialog.showModal();});
  document.getElementById('closeHelp').addEventListener('click',()=>dialog.close());
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();pending=event;installed=false;status.textContent='‘지금 앱 설치’를 누르면 브라우저의 설치 확인창이 열립니다.';paint();});
  install.addEventListener('click',async()=>{
    if(!pending||working)return;
    const event=pending;pending=null;working=true;paint();
    try{
      await event.prompt();const choice=await event.userChoice;
      status.textContent=choice.outcome==='accepted'?'설치를 진행하고 있습니다. 완료되면 앱으로 열어주세요.':'설치를 취소했어요. 브라우저 메뉴에서 다시 설치할 수 있습니다.';
    }catch(_){status.textContent='설치창을 열지 못했어요. 아래 브라우저 메뉴로 설치해주세요.';}
    finally{working=false;paint();}
  });
  window.addEventListener('appinstalled',()=>{installed=true;pending=null;paint();});
  mode.addEventListener('change',event=>{installed=event.matches||navigator.standalone===true;paint();});
  paint();
  if(document.querySelector('script[data-admin-app]')&&'serviceWorker' in navigator){
    navigator.serviceWorker.register('admin-sw.js',{scope:'./admin.html',updateViaCache:'none'}).then(r=>r.update()).catch(()=>{});
  }
})();
