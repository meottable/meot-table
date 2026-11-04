/* Scope is admin.html only. Always fetch fresh; do not cache customer data or API replies. */
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
  if(event.request.mode!=='navigate')return;
  event.respondWith(fetch(event.request).catch(()=>new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>멋테이블 영업콘솔</title><h1>인터넷 연결을 확인해주세요.</h1><p>영업콘솔은 인터넷에 연결한 뒤 다시 열어주세요. 이 기기의 저장 자료는 삭제되지 않았습니다.</p><a href="./admin.html">다시 열기</a>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8'}})));
});
