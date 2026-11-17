/* One-time transfer from the original encrypted device ledger to the owner-private shared ledger. */
(()=>{'use strict';
const destination='https://meot-ledger-shared.slrlalhh1.chatgpt.site',url=destination+'/ledger/index.html',flag='meot_shared_ledger_connected_v1';
const button=document.getElementById('connectSharedLedger'),notice=document.getElementById('sharedLedgerStatus');let child=null,nonce='',sending=false;
try{if(localStorage.getItem(flag)==='yes'){location.replace(url);return;}}catch(_){}
button.addEventListener('click',()=>{
 if(typeof window.MeotLedgerCanReload==='function'&&!window.MeotLedgerCanReload()){notice.textContent='입력 중인 내용을 저장하거나 닫은 뒤 연결해주세요.';return;}
 let key='';try{key=localStorage.getItem('meot_ledger_access_v1')||'';}catch(_){}
 if(!/^[A-Za-z0-9_-]{43}$/.test(key)){notice.textContent='아래에서 기존 장부 연결 코드로 장부를 먼저 열어주세요.';return;}
 nonce=crypto.randomUUID();sending=false;child=window.open(url+'?import='+nonce,'meot_shared_ledger');
 if(!child){notice.textContent='새 창을 허용한 뒤 다시 눌러주세요. 기존 기록은 그대로 있습니다.';return;}
 notice.textContent='새 창에서 같은 ChatGPT 계정으로 로그인해주세요. 로그인 후 이 기기에 저장된 기록을 공통 장부에 합칩니다.';
 setTimeout(()=>{if(child&&nonce)notice.textContent='로그인 후 연결을 기다리는 중입니다. 새 창에서 연결되지 않으면 기존 장부의 전체 백업을 받아 공통 장부의 ‘기존 백업 합치기’로 넣어주세요.';},60000);
});
window.addEventListener('message',async e=>{
 if(e.origin!==destination||e.source!==child||e.data?.nonce!==nonce||!nonce)return;
 if(e.data.type==='MEOT_LEDGER_IMPORTED'){try{localStorage.setItem(flag,'yes');}catch(_){}nonce='';notice.textContent='공통 장부 연결 완료. 이제 같은 장부에서 이어서 사용합니다.';location.replace(url);return;}
 if(e.data.type!=='MEOT_LEDGER_READY'||sending)return;
 if(typeof window.MeotLedgerCanReload==='function'&&!window.MeotLedgerCanReload()){notice.textContent='현재 장부의 입력을 저장하거나 닫아주세요. 기록을 보존하며 연결을 기다립니다.';return;}
 sending=true;
 try{const key=localStorage.getItem('meot_ledger_access_v1'),id=await MeotLedgerStore.identity(key),record=await MeotLedgerStore.read(id);if(!record)throw Error('현재 기기의 장부가 아직 저장되지 않았습니다.');child.postMessage({type:'MEOT_LEDGER_TRANSFER',nonce,key,box:record.box},destination);}
 catch(err){sending=false;notice.textContent='연결 보류: '+err.message;}
});
})();
