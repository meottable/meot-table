/* Only encrypted ledger envelopes are persisted. Keys retain the existing connection flow. */
window.MeotLedgerStore=(()=>{
'use strict';
const bytes=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),x=>x.charCodeAt(0));
function b64(arr){let text='';for(let i=0;i<arr.length;i+=8192)text+=String.fromCharCode(...arr.subarray(i,i+8192));return btoa(text);}
async function cryptKey(key){return crypto.subtle.importKey('raw',bytes(key),'AES-GCM',false,['encrypt','decrypt']);}
async function encrypt(value,key){const iv=crypto.getRandomValues(new Uint8Array(12)),data=await crypto.subtle.encrypt({name:'AES-GCM',iv},await cryptKey(key),new TextEncoder().encode(JSON.stringify(value)));return {iv:b64(iv),data:b64(new Uint8Array(data))};}
async function decrypt(box,key){if(!box||typeof box.iv!=='string'||typeof box.data!=='string')throw Error('백업 파일 형식이 맞지 않습니다.');try{const raw=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(box.iv)},await cryptKey(key),bytes(box.data));return JSON.parse(new TextDecoder().decode(raw));}catch(_){throw Error('연결 코드가 다르거나 저장 파일이 손상되었습니다.');}}
async function identity(key){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes(key)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
let database;
function open(){if(database)return database;database=new Promise((resolve,reject)=>{const r=indexedDB.open('meot-ledger-monthly-v2',1);r.onupgradeneeded=()=>r.result.createObjectStore('ledgers',{keyPath:'id'});r.onsuccess=()=>{r.result.onversionchange=()=>r.result.close();resolve(r.result);};r.onerror=()=>reject(Error('이 브라우저에서 장부 저장소를 열지 못했습니다. 일반 브라우저로 다시 열어주세요.'));r.onblocked=()=>reject(Error('다른 장부 창을 닫고 다시 열어주세요.'));});return database;}
async function read(id){const db=await open();return new Promise((resolve,reject)=>{const r=db.transaction('ledgers','readonly').objectStore('ledgers').get(id);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(Error('저장한 장부를 읽지 못했습니다. 다시 열어주세요.'));});}
async function write(id,state,key,expected){const box=await encrypt(state,key),db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('ledgers','readwrite'),st=tx.objectStore('ledgers');let conflict=false;const revision=expected+1,r=st.get(id);r.onsuccess=()=>{const previous=r.result;if((previous?.revision||0)!==expected){conflict=true;tx.abort();return;}if(previous)st.put({...previous,id:id+':previous'});st.put({id,revision,box,updated:state.updated});};tx.oncomplete=()=>resolve(revision);tx.onabort=()=>reject(Error(conflict?'다른 창에서 장부가 변경되었습니다. 새로고침한 뒤 다시 입력해주세요.':'저장하지 못했습니다. 저장 공간을 확인하고 다시 시도해주세요.'));tx.onerror=()=>{};});}
return {encrypt,decrypt,identity,read,write};
})();
