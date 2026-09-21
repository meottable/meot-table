
(function(){
  var ACCOUNT_ID="s_1f15dd13245c";
  function initialize(){
    if(!window.wcs)return;
    window.wcs_add=window.wcs_add||{};
    window.wcs_add.wa=ACCOUNT_ID;
    window.wcs.inflow("meottable.github.io/meot-table");
    window.wcs_do();
  }
  function sendConversion(type){
    if(window.wcs&&typeof window.wcs.trans==="function")window.wcs.trans({type:type});
  }
  initialize();
  document.addEventListener("click",function(event){
    var target=event.target instanceof Element?event.target.closest("a[href]"):null;
    if(!target)return;
    var href=(target.getAttribute("href")||"").toLowerCase();
    if(href.indexOf("pf.kakao.com")!==-1)sendConversion("custom001");
    else if(href.indexOf("tel:")===0)sendConversion("custom002");
  },true);
  document.addEventListener("submit",function(event){
    var form=event.target;
    if(form&&form.id==="consultForm")sendConversion("custom001");
  },true);
  window.meotNaverConversion=sendConversion;
})();
