
(function(){
 var KEY="meot-market-popup-v4-closed-at";
 var CSS=".meot-market-popup[hidden]{display:none!important}.meot-market-popup{position:fixed;right:24px;bottom:24px;z-index:2147483000;width:min(400px,calc(100vw - 40px));pointer-events:none}.meot-market-popup__card{position:relative;overflow:hidden;border:1px solid rgba(175,126,47,.28);border-radius:20px;background:#f7f2e8;color:#171512;box-shadow:0 18px 55px rgba(0,0,0,.27);pointer-events:auto}.meot-market-popup__head{padding:24px 62px 17px 24px;background:linear-gradient(135deg,#1c1b18,#34302a);color:#fff}.meot-market-popup__eyebrow{margin:0 0 9px;color:#d3a13e;font-size:11px;font-weight:800;letter-spacing:.17em}.meot-market-popup__title{margin:0;font-size:28px;font-weight:750;line-height:1.22;letter-spacing:-.045em}.meot-market-popup__title em{color:#e2b24d;font-style:normal}.meot-market-popup__body{padding:20px 24px 22px}.meot-market-popup__lead{margin:0 0 16px;color:#58534b;font-size:14px;line-height:1.65;letter-spacing:-.02em}.meot-market-popup__list{display:flex;flex-wrap:wrap;gap:7px;margin:0 0 18px;padding:0;list-style:none}.meot-market-popup__list li{padding:7px 10px;border-radius:999px;background:#ece3d3;color:#3b352c;font-size:12px;font-weight:700}.meot-market-popup__cta{display:flex;align-items:center;justify-content:center;min-height:50px;border-radius:11px;background:#d39b2f;color:#17120a!important;font-size:15px;font-weight:850;text-decoration:none!important}.meot-market-popup__note{margin:10px 0 0;text-align:center;color:#807a70;font-size:11px;line-height:1.45}.meot-market-popup__close{position:absolute;top:14px;right:14px;z-index:3;width:40px;height:40px;border:1px solid rgba(255,255,255,.38);border-radius:50%;background:#fff;color:#171512;font-size:25px;line-height:1;box-shadow:0 5px 15px rgba(0,0,0,.2);cursor:pointer}@media(max-width:640px){.meot-market-popup{right:18px;bottom:calc(98px + env(safe-area-inset-bottom));width:calc(100vw - 36px)}.meot-market-popup__card{max-height:calc(100dvh - 135px);overflow:auto;border-radius:18px}.meot-market-popup__head{padding:21px 58px 15px 20px}.meot-market-popup__title{font-size:22px}.meot-market-popup__body{padding:17px 20px 19px}.meot-market-popup__lead{margin-bottom:13px;font-size:13px;line-height:1.58}.meot-market-popup__list{display:none;margin-bottom:14px}.meot-market-popup__cta{min-height:48px}}@media(prefers-reduced-motion:no-preference){.meot-market-popup__card{animation:meotPopupIn .34s cubic-bezier(.2,.8,.2,1)}@keyframes meotPopupIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}}";
 var HTML='<div class="meot-market-popup__card"><button class="meot-market-popup__close" type="button" aria-label="안내창 닫기">×</button><div class="meot-market-popup__head"><p class="meot-market-popup__eyebrow">NEW CUSTOMER BENEFIT</p><h2 class="meot-market-popup__title">신규 고객님께<br><em>기본 상권분석 무료</em></h2></div><div class="meot-market-popup__body"><p class="meot-market-popup__lead">주소와 업종만 알려주세요. 주변 수요와 경쟁 환경을 살펴 기본 분석을 정리해 드립니다.</p><ul class="meot-market-popup__list"><li>고객층·유동 특성</li><li>경쟁 환경</li><li>운영 포인트</li></ul><a class="meot-market-popup__cta" href="https://pf.kakao.com/_BZeSX/chat" target="_blank" rel="noopener noreferrer">카카오톡 견적 상담 →</a><p class="meot-market-popup__note">신규 상담 고객 대상 · 기본 분석 기준</p></div></div>';
 function mount(){
  document.documentElement.style.overflow="";
  document.body.style.overflow="";
  if(document.getElementById("meot-market-popup"))return;
  var force=new URLSearchParams(location.search).get("showPopup")==="1";
  try{var closedAt=parseInt(localStorage.getItem(KEY),10)||0;if(!force&&closedAt&&Date.now()-closedAt<604800000)return}catch(e){}
  var style=document.getElementById("meot-market-popup-style");
  if(!style){style=document.createElement("style");style.id="meot-market-popup-style";style.textContent=CSS;document.head.appendChild(style)}
  var popup=document.createElement("aside");
  popup.id="meot-market-popup";
  popup.className="meot-market-popup";
  popup.setAttribute("role","region");
  popup.setAttribute("aria-label","신규 고객 무료 상권분석 안내");
  popup.innerHTML=HTML;
  document.body.appendChild(popup);
  popup.querySelector(".meot-market-popup__close").addEventListener("click",function(){
   popup.remove();
   try{localStorage.setItem(KEY,String(Date.now()))}catch(e){}
  });
 }
 window.addEventListener("load",function(){setTimeout(mount,9000)},{once:true});
 setTimeout(mount,12000);
})();
