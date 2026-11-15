const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const read=p=>fs.readFileSync(__dirname+'/../'+p,'utf8');

test('console matches the published estimator across size boundaries and all grades',()=>{
 const admin=read('admin.html').match(/function priceFor\([^\n]+/)[0];
 const pub=read('homepage-v3.js').match(/const sizePrices=[\s\S]*?\n }/)[0];
 const ctx={Number,Math};vm.runInNewContext(admin+'\n'+pub,ctx);
 for(const [a,b] of [['기본형','basic'],['중급형','middle'],['고급형','premium']]){
  for(const width of [600,800,1200,1201,1400,1600,1601,1699,1700,1701,1750,1800,2000]){
   assert.equal(ctx.priceFor(width+'×700',a),ctx.tableUnitPrice(b,width,700),a+' '+width);
  }
 }
 assert.equal(ctx.priceFor('1700×800','기본형'),110000);
 assert.equal(ctx.priceFor('1750×800','기본형'),145000);
});

test('factory copy preserves physical instructions and omits sales grade and price',()=>{
 const line=read('factory-order.js').match(/function orderText\([^\n]+/)[0];
 const ctx={Number};vm.runInNewContext(line,ctx);
 const result=ctx.orderText({number:'TEST',customer:'검증용',tableQty:16,size:'1050×700×700 14개 / 700×700×700 2개',grade:'중급형',cutlery:'없음',shipDate:'확인 필요',chairQty:0,memo:'오리발. 상판 색상·타공 규격 확인 필요.',grand:1742400});
 assert.match(result,/1050×700×700 14개/);assert.match(result,/오리발/);assert.match(result,/수저통: 없음/);
 assert.doesNotMatch(result,/등급|중급형|1742400|■ 의자/);
});

function visitorSetup(date,respond){
 const elements=new Map();
 const el=id=>{if(!elements.has(id))elements.set(id,{textContent:'',innerHTML:'',append(){},closest(){return{before(){}}}});return elements.get(id)};
 const calls=[];let done;
 const ctx={document:{createElement:()=>({innerHTML:'',id:''}),getElementById:el},window:{loadAnalytics(){}},selectedDate:date,location:{hash:''},API:'https://example.invalid/get/',PREFIX:'test_',AbortSignal,fetch:async url=>{calls.push(url);return respond(url)},Number,Set,Math};
 let code=read('visitor-console.js').replace('const original=window.loadAnalytics;','window.testLoad=load;\nconst original=window.loadAnalytics;');
 vm.runInNewContext(code,ctx);return{elements,el,calls,load:ctx.window.testLoad};
}
test('visitor metrics distinguish returned zero, missing record, denied and failed read',async()=>{
 const t=visitorSetup('20261115',async url=>{
  if(url.endsWith('_sessions'))return{ok:true,status:200,json:async()=>({value:0})};
  if(url.endsWith('_quote'))return{ok:false,status:404};
  if(url.endsWith('_contact'))return{ok:false,status:403};
  if(url.endsWith('_lead_saved'))throw Error('network');
  return{ok:false,status:404};
 });
 await t.load();const cards=t.el('visitor-cards').innerHTML;
 assert.match(cards,/방문 세션[\s\S]*?>0<\/div>/);
 assert.match(cards,/견적 사용 세션[\s\S]*?>기록 없음<\/div>/);
 assert.match(cards,/상담 클릭 세션[\s\S]*?>조회 실패<\/div>/);
 assert.match(cards,/고객 DB 저장 세션[\s\S]*?>조회 실패<\/div>/);
 assert.match(t.el('visitor-status').textContent,/조회 실패/);
 assert(t.calls.every(url=>url.startsWith('https://example.invalid/get/')));
});
test('pre-collection dates perform no reads and never show zero',async()=>{
 const t=visitorSetup('20261004',()=>{throw Error('must not fetch')});await t.load();
 assert.equal(t.calls.length,0);assert.match(t.el('visitor-cards').innerHTML,/수집 전/);
 assert.doesNotMatch(t.el('visitor-cards').innerHTML,/>0<\/div>/);
});
