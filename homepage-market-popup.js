(function(){
 var KEY="meot-market-popup-v4-closed-at";
 var CSS=".meot-market-notice[hidden]{display:none!important}\n.meot-market-notice{position:static;width:calc(100% - 44px);max-width:1144px;margin:24px auto 0;color:#173147}\n.meot-market-notice *{box-sizing:border-box}\n.meot-market-notice__card{position:relative;display:grid;grid-template-columns:minmax(0,1fr) 230px;align-items:center;gap:28px;padding:24px 72px 24px 28px;border:1px solid #dfd5bf;border-radius:16px;background:#faf6eb}\n.meot-market-notice__copy,.meot-market-notice__actions{min-width:0}\n.meot-market-notice__eyebrow{margin:0 0 6px;color:#927024;font-size:11px;font-weight:800;letter-spacing:.12em}\n.meot-market-notice__title{margin:0;font-size:24px;font-weight:750;line-height:1.4;letter-spacing:-.04em;word-break:keep-all}\n.meot-market-notice__title em{color:#9b7016;font-style:normal}\n.meot-market-notice__lead{margin:8px 0 10px;color:#5d625f;font-size:14px;line-height:1.65;word-break:keep-all}\n.meot-market-notice__list{display:flex;flex-wrap:wrap;gap:6px 14px;margin:0;padding:0;list-style:none;color:#746950;font-size:12px}\n.meot-market-notice__cta{display:flex;align-items:center;justify-content:center;min-height:48px;padding:12px 16px;border-radius:10px;background:#e8bd44;color:#173147!important;font-size:15px;font-weight:750;line-height:1.5;text-align:center;text-decoration:none!important;word-break:keep-all}\n.meot-market-notice__cta:hover{background:#f1cd62}\n.meot-market-notice__note{margin:8px 0 0;color:#746d5e;font-size:11px;line-height:1.5;text-align:center}\n.meot-market-notice__close{position:absolute;top:10px;right:10px;display:flex;align-items:center;justify-content:center;width:44px;height:44px;padding:0;border:0;border-radius:50%;background:transparent;color:#5d625f;font:28px/1 sans-serif;cursor:pointer}\n.meot-market-notice__close:hover{background:#efe7d5}\n.meot-market-notice__close:focus-visible,.meot-market-notice__cta:focus-visible{outline:3px solid #173147;outline-offset:3px}\n@media(max-width:700px){\n .meot-market-notice{width:calc(100% - 32px);margin-top:16px}\n .meot-market-notice__card{grid-template-columns:minmax(0,1fr);gap:16px;padding:20px 18px;border-radius:12px}\n .meot-market-notice__eyebrow,.meot-market-notice__title{padding-right:36px}\n .meot-market-notice__title{font-size:21px}\n .meot-market-notice__lead{font-size:13px}\n .meot-market-notice__list{font-size:11px;gap:5px 12px}\n}";
 var HTML="<div class=\"meot-market-notice__card\"><button class=\"meot-market-notice__close\" type=\"button\" aria-label=\"안내창 닫기\">×</button><div class=\"meot-market-notice__copy\"><p class=\"meot-market-notice__eyebrow\">NEW CUSTOMER BENEFIT</p><h2 class=\"meot-market-notice__title\">신규 고객님께 <em>기본 상권분석 무료</em></h2><p class=\"meot-market-notice__lead\">주소와 업종만 알려주세요. 주변 수요와 경쟁 환경을 살펴 기본 분석을 정리해 드립니다.</p><ul class=\"meot-market-notice__list\"><li>고객층·유동 특성</li><li>경쟁 환경</li><li>운영 포인트</li></ul></div><div class=\"meot-market-notice__actions\"><a class=\"meot-market-notice__cta\" href=\"https://pf.kakao.com/_BZeSX/chat\" target=\"_blank\" rel=\"noopener noreferrer\" data-meot-db-gate=\"true\">카카오톡 견적 상담 →</a><p class=\"meot-market-notice__note\">신규 상담 고객 대상 · 기본 분석 기준</p></div></div>";
 function mount(){
  if(document.getElementById("meot-market-popup"))return;
  var anchor=document.querySelector("main > .trust-bar")||document.querySelector("main > .hero");
  if(!anchor)return;
  var force=new URLSearchParams(location.search).get("showPopup")==="1";
  try{var closedAt=parseInt(localStorage.getItem(KEY),10)||0;if(!force&&closedAt&&Date.now()-closedAt<604800000)return}catch(e){}
  var style=document.getElementById("meot-market-popup-style");
  if(!style){style=document.createElement("style");style.id="meot-market-popup-style";style.textContent=CSS;document.head.appendChild(style)}
  var popup=document.createElement("aside");
  popup.id="meot-market-popup";
  popup.className="meot-market-notice";
  popup.setAttribute("role","region");
  popup.setAttribute("aria-label","신규 고객 무료 상권분석 안내");
  popup.innerHTML=HTML;
  anchor.insertAdjacentElement("afterend",popup);
  popup.querySelector(".meot-market-notice__close").addEventListener("click",function(){
   popup.remove();
   try{localStorage.setItem(KEY,String(Date.now()))}catch(e){}
  });
 }
 if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",mount,{once:true});
 }else{mount()}
})();
