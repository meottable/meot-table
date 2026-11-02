/* 관리자 화면 잠금 (기기별 비밀번호)
 * - 이 기기에서 처음 열면 비밀번호를 새로 정합니다. 비밀번호 자체는 저장하지 않고 해시값만 이 기기에 저장합니다.
 * - 30분 동안 사용하지 않으면 자동으로 잠깁니다.
 * - 잠금 화면에서 "이 기기 자료 지우기"로 공용 PC에 남은 고객 자료를 지울 수 있습니다.
 * 정적 홈페이지라 서버 로그인과 같은 수준의 보안은 아닙니다. 공용 PC에서 남이 바로 보는 것을 막는 용도입니다.
 */
(function(){
  'use strict';
  var HASH_KEY='meot_admin_lock_hash_v1', SALT_KEY='meot_admin_lock_salt_v1', SESSION_KEY='meot_admin_unlocked_until';
  var IDLE_MS=30*60*1000;

  var css='#meotLock{position:fixed;inset:0;z-index:2147483600;background:#171512;display:grid;place-items:center;padding:20px;font-family:Pretendard,-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif}'+
  '#meotLock .box{width:min(380px,100%);background:#fff;border-radius:14px;padding:30px 26px;box-shadow:0 30px 90px #0008;text-align:center}'+
  '#meotLock .logo{font-weight:900;font-size:22px;letter-spacing:-.03em}#meotLock .logo span{color:#c7a25a}'+
  '#meotLock h2{margin:14px 0 6px;font-size:18px}#meotLock p{margin:0 0 18px;color:#777;font-size:13px;line-height:1.6}'+
  '#meotLock input{width:100%;box-sizing:border-box;font-size:18px;padding:13px 14px;border:1px solid #ddd;border-radius:10px;text-align:center;letter-spacing:.2em;margin-bottom:10px}'+
  '#meotLock button{width:100%;padding:13px;border:0;border-radius:10px;font-size:15px;font-weight:800;cursor:pointer}'+
  '#meotLock .go{background:#111;color:#fff}#meotLock .wipe{background:none;color:#a33;font-size:12px;font-weight:600;margin-top:14px;padding:6px}'+
  '#meotLock .err{color:#c0392b;font-size:13px;min-height:18px;margin:2px 0 8px}'+
  'body.meot-locked>*:not(#meotLock){visibility:hidden}';

  function b64(u8){return btoa(String.fromCharCode.apply(null,u8))}
  async function hash(pin,salt){
    var key=await crypto.subtle.importKey('raw',new TextEncoder().encode(pin),'PBKDF2',false,['deriveBits']);
    var bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:200000,hash:'SHA-256'},key,256);
    return b64(new Uint8Array(bits));
  }
  function get(k){try{return localStorage.getItem(k)}catch(_){return null}}
  function set(k,v){try{localStorage.setItem(k,v)}catch(_){}}
  function unlockedUntil(){return Number(sessionStorage.getItem(SESSION_KEY)||0)}
  function touch(){sessionStorage.setItem(SESSION_KEY,String(Date.now()+IDLE_MS))}

  function build(){
    var style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
    var first=!get(HASH_KEY);
    var el=document.createElement('div');el.id='meotLock';
    el.innerHTML='<form class="box" autocomplete="off"><div class="logo">멋<span>:</span>테이블</div>'+
      '<h2>'+(first?'관리자 비밀번호 설정':'관리자 화면 잠금')+'</h2>'+
      '<p>'+(first?'이 기기에서 처음 여셨어요.<br>앞으로 쓸 비밀번호를 정해주세요. (6자리 이상)':'비밀번호를 입력해주세요.<br>30분 동안 사용하지 않으면 자동으로 잠깁니다.')+'</p>'+
      '<input type="password" id="meotPin" inputmode="numeric" placeholder="비밀번호" required>'+
      (first?'<input type="password" id="meotPin2" inputmode="numeric" placeholder="비밀번호 확인" required>':'')+
      '<div class="err" id="meotErr"></div><button class="go" type="submit">'+(first?'설정하고 열기':'열기')+'</button>'+
      (first?'':'<button class="wipe" type="button" id="meotWipe">비밀번호를 잊었어요 / 이 기기 자료 지우기</button>')+'</form>';
    document.body.appendChild(el);document.body.classList.add('meot-locked');
    var err=el.querySelector('#meotErr'),pin=el.querySelector('#meotPin');setTimeout(function(){pin.focus()},50);
    el.querySelector('form').addEventListener('submit',async function(e){
      e.preventDefault();var v=pin.value.trim();
      if(first){
        var v2=el.querySelector('#meotPin2').value.trim();
        if(v.length<6){err.textContent='6자리 이상으로 정해주세요.';return}
        if(v!==v2){err.textContent='두 번 입력한 비밀번호가 달라요.';return}
        var salt=b64(crypto.getRandomValues(new Uint8Array(16)));set(SALT_KEY,salt);set(HASH_KEY,await hash(v,salt));
      }else{
        if(await hash(v,get(SALT_KEY)||'')!==get(HASH_KEY)){err.textContent='비밀번호가 맞지 않아요.';pin.value='';pin.focus();return}
      }
      touch();el.remove();document.body.classList.remove('meot-locked');
    });
    var wipe=el.querySelector('#meotWipe');
    if(wipe)wipe.addEventListener('click',function(){
      if(!confirm('이 기기에 저장된 관리자 자료(고객·견적·상담 기록)와 비밀번호를 모두 지웁니다.\n구글시트 고객DB는 지워지지 않습니다. 계속할까요?'))return;
      try{Object.keys(localStorage).filter(function(k){return /^meot_/.test(k)}).forEach(function(k){localStorage.removeItem(k)})}catch(_){}
      sessionStorage.removeItem(SESSION_KEY);location.reload();
    });
  }

  function check(){if(Date.now()>unlockedUntil()&&!document.getElementById('meotLock'))build()}
  ['click','keydown','touchstart','scroll'].forEach(function(t){window.addEventListener(t,function(){if(!document.getElementById('meotLock'))touch()},{passive:true})});
  setInterval(check,30000);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',check);else check();
})();
