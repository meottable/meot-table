(function(){
  'use strict';
  // A copy/open action never sends a Kakao message on the customer's behalf.
  function legacyCopy(text){
    var field=document.createElement('textarea'),active=document.activeElement;
    field.value=text;field.readOnly=true;field.style.cssText='position:fixed;left:-9999px;top:0;font-size:16px';
    document.body.appendChild(field);field.select();field.setSelectionRange(0,text.length);
    var ok=false;try{ok=document.execCommand('copy')===true;}catch(_){}
    field.remove();if(active&&active.focus)active.focus();return ok;
  }
  async function copyText(text){
    if(navigator.clipboard&&window.isSecureContext){
      var timer;
      try{
        await Promise.race([navigator.clipboard.writeText(text),new Promise(function(_,reject){timer=setTimeout(function(){reject(new Error('copy_timeout'));},3000);})]);
        return true;
      }catch(_){}finally{clearTimeout(timer);}
    }
    return legacyCopy(text);
  }
  async function copyAndOpen(opts){
    if(opts.button.disabled)return false;
    var url=new URL(opts.href);
    if(url.origin!=='https://pf.kakao.com'||url.pathname!=='/_BZeSX/chat')throw new Error('invalid_chat_url');
    url.searchParams.delete('bot');
    opts.button.disabled=true;opts.button.setAttribute('aria-busy','true');
    opts.status.textContent='내용을 복사하고 있습니다…';
    try{
      var copied=await copyText(opts.text);
      if(!copied){
        opts.textarea.value=opts.text;opts.fallback.hidden=false;
        opts.status.textContent='자동 복사가 안 되었습니다. 아래 내용을 복사한 뒤 카카오톡을 열어주세요.';
        opts.textarea.focus();opts.textarea.select();return false;
      }
      opts.fallback.hidden=true;
      opts.status.textContent='복사했습니다. 카카오 채팅창에 붙여넣고 전송해 주세요.';
      location.assign(url.href);return true;
    }catch(_){
      opts.textarea.value=opts.text;opts.fallback.hidden=false;
      opts.status.textContent='카카오톡을 자동으로 열지 못했습니다. 아래 바로 열기 링크를 이용해 주세요.';
      return false;
    }finally{
      opts.button.disabled=false;opts.button.removeAttribute('aria-busy');
    }
  }
  window.meotContactFlow={copyAndOpen:copyAndOpen};
})();
