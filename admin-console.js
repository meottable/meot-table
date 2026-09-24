(function(){
'use strict';
const cfg=window.MEOT_REVIEWS||{};
function reviewUrl(raw,params){try{const u=new URL(raw);if(u.origin!=='https://script.google.com'||!/^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(u.pathname))return null;Object.entries(params).forEach(([k,v])=>u.searchParams.set(k,v));return u.href}catch(_){return null}}
const admin=reviewUrl(cfg.adminUrl,{page:'admin'}),publicUrl=reviewUrl(cfg.publicUrl,{view:'list'}),panel=document.getElementById('review-inline-panel'),frame=document.getElementById('review-admin-frame');
const inline=document.getElementById('review-inline-open'),pub=document.getElementById('review-public-open');
inline.disabled=!admin;
inline.addEventListener('click',()=>{if(!admin)return;frame.src=admin;panel.hidden=false;panel.scrollIntoView({behavior:'smooth',block:'start'})});
document.getElementById('review-inline-close').addEventListener('click',()=>{panel.hidden=true;frame.removeAttribute('src')});
if(publicUrl)pub.href=publicUrl;else pub.hidden=true;
const pages=['dashboard','customers','quotes','reviews','settings','analytics','leads'];
function route(){const id=location.hash.slice(1);if(pages.includes(id))go(id)}
window.addEventListener('hashchange',route);route();
})();
