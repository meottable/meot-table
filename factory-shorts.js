/* 공장 숏츠: 화면에 보일 때만 재생, 탭하면 일시정지, 단계 표시 동기화 */
(function(){
  var box=document.getElementById('fs-phone'); if(!box) return;
  var v=box.querySelector('video'), btn=document.getElementById('fs-state');
  var steps=[].slice.call(document.querySelectorAll('#fs-steps li'));
  var cuts=[2.6,5.6,9.0,12.0,15.0,18.4,21.0]; // 각 장면 끝 시점(초)
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var userPaused=reduce;
  function label(){var p=v.paused;btn.textContent=p?'▶':'❚❚';btn.setAttribute('aria-label',p?'영상 재생':'영상 일시정지');}
  function play(){var r=v.play();if(r&&r.catch)r.catch(function(){});}
  function toggle(){if(v.paused){userPaused=false;play();}else{userPaused=true;v.pause();}}
  box.addEventListener('click',function(e){if(e.target!==btn)toggle();});
  btn.addEventListener('click',function(e){e.stopPropagation();toggle();});
  v.addEventListener('play',label);v.addEventListener('pause',label);
  v.addEventListener('timeupdate',function(){
    var t=v.currentTime,idx=-1;
    for(var i=0;i<cuts.length;i++){if(t<cuts[i]){idx=i-1;break;}}
    if(t>=cuts[cuts.length-1])idx=-1;
    steps.forEach(function(li,i){li.classList.toggle('is-on',i===idx);});
  });
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){es.forEach(function(e){
      if(e.isIntersecting){if(v.preload==='none')v.preload='auto';if(!userPaused)play();}else{v.pause();}
    });},{threshold:.35}).observe(box);
  }
  label();
})();
