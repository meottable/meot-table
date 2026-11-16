const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),M=require('../ledger/model.js'),S=require('../ledger/source-sync.js');
function feed(v=1){return {schema:3,updated:'2026-11-16',target:20000000,source:{version:v,modifiedAt:'2026-11-16T00:00:00Z'},orders:[{number:'QA-UNKNOWN',date:'2026-10-01',name:'가상 미확인 거래',amount:1000000,paid:null,balance:null,paymentStatus:'unknown',note:'가상 메모'}],cash:[]};}
function state(){return M.migrate(feed(),'2026-11');}
function confirm(s,paid=500000){return M.confirmPayment(s,s.orders[0].id,{paid,acknowledged:true});}
test('unknown remains null until explicit confirmation; nothing is treated as zero',()=>{
 const s=state(),o=s.orders[0],before=JSON.stringify(s);
 assert.throws(()=>M.confirmPayment(s,o.id,{paid:500000}),/확인/);
 for(const paid of [undefined,null,NaN,-1,1.5,1000001])assert.throws(()=>M.confirmPayment(s,o.id,{paid,acknowledged:true}));
 assert.equal(JSON.stringify(s),before);assert.equal(M.orderView(s,o).balance,null);
});
test('confirmed 50 and 100 change current receivable only, never invent dated cash or source facts',()=>{
 const s=state();M.closeMonth(s,'2026-10');const source=JSON.stringify(s.sourceBaseline),closed=JSON.stringify(s.months['2026-10']),cash=JSON.stringify(s.cash);
 confirm(s);assert.equal(M.orderView(s,s.orders[0]).paid,500000);assert.equal(M.orderView(s,s.orders[0]).balance,500000);
 confirm(s,1000000);assert.equal(M.orderView(s,s.orders[0]).balance,0);assert.equal(M.collectionRows(s,'2026-11',{filter:'paid'}).length,1);
 assert.equal(JSON.stringify(s.sourceBaseline),source);assert.equal(JSON.stringify(s.months['2026-10']),closed);assert.equal(JSON.stringify(s.cash),cash);assert.equal(M.totals(s,'2026-11').received,0);
 const restored=M.validate(M.clone(s));assert.equal(restored.orders[0].paymentConfirmation.paid,1000000);
});
test('explicit zero, correction and undo work without touching notes or creating cash',()=>{
 const s=state();M.saveCollection(s,s.orders[0].id,{note:'관리 메모',dueDate:''});confirm(s,0);assert.equal(M.orderView(s,s.orders[0]).balance,1000000);
 confirm(s,500000);M.clearPaymentConfirmation(s,s.orders[0].id);assert.equal(s.orders[0].basePaid,null);assert.equal(s.orders[0].baseBalance,null);assert.equal(s.orders[0].paymentStatus,'unknown');assert.equal(s.orders[0].collection.note,'관리 메모');assert.equal(s.cash.length,0);M.validate(s);
});
test('after confirmation new cash is counted once and blocks unsafe edits to the confirmed baseline',()=>{
 const s=state(),id=s.orders[0].id;confirm(s);
 M.saveCash(s,{id:'cash',orderId:id,date:'2026-11-16',type:'입금',amount:M.receiptPreset(s,id,100).amount,name:'가상 거래',category:'잔금'});
 assert.equal(M.orderView(s,s.orders[0]).paid,1000000);assert.equal(M.totals(s,'2026-11').received,500000);
 const before=JSON.stringify(s);assert.throws(()=>confirm(s,1000000),/추가 입금/);assert.throws(()=>M.clearPaymentConfirmation(s,id),/추가 입금/);assert.equal(JSON.stringify(s),before);
 M.remove(s,'cash','cash');confirm(s,1000000);M.validate(s);
});
test('unchanged unknown source preserves user confirmation; matching known source reconciles',()=>{
 const s=state();confirm(s);const f=feed(2);f.orders[0].note='새 메모';const next=S.merge(s,f).state;
 assert.equal(next.orders[0].basePaid,500000);assert.equal(next.orders[0].note,'새 메모');assert.equal(next.sourceBaseline.orders[0].paid,null);
 const known=feed(3);Object.assign(known.orders[0],{paid:500000,balance:500000,paymentStatus:'known'});
 const reconciled=S.merge(next,known).state;assert.equal(reconciled.orders[0].paymentConfirmation,undefined);assert.equal(reconciled.orders[0].basePaid,500000);assert.equal(reconciled.cash.length,0);
 assert.throws(()=>confirm(reconciled),/이미 확인/);
});
test('different source payment, amount, deletion and overlapping cash are held without mutation',()=>{
 const s=state();confirm(s);const before=JSON.stringify(s);
 const different=feed(2);Object.assign(different.orders[0],{paid:1000000,balance:0,paymentStatus:'known'});assert.throws(()=>S.merge(s,different),/다르게/);
 const changed=feed(2);changed.orders[0].amount=1200000;assert.throws(()=>S.merge(s,changed),/계약금액/);
 const deleted=feed(2);deleted.orders=[];assert.throws(()=>S.merge(s,deleted),/삭제/);assert.equal(JSON.stringify(s),before);
 M.saveCash(s,{id:'new',date:'2026-11-16',name:'가상 미확인 거래',amount:500000,type:'입금',orderId:s.orders[0].id});assert.throws(()=>S.merge(s,different),/원본 정산과 기기 입금/);
});
test('invalid confirmation metadata and changing confirmed contract amount are rejected',()=>{
 const s=state();confirm(s);assert.throws(()=>M.saveOrder(s,{...s.orders[0],amount:1200000}),/되돌린/);
 s.orders[0].paymentConfirmation.paid=100;assert.throws(()=>M.validate(s),/일치/);
});
test('confirmation dialog exists and every static UI lookup has a matching element',()=>{
 const html=fs.readFileSync(require.resolve('../ledger/index.html'),'utf8'),js=fs.readFileSync(require.resolve('../ledger/ledger.js'),'utf8');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(new Set(ids).size,ids.length);
 for(const [,id] of js.matchAll(/\$\('([^']+)'\)/g))assert.ok(ids.includes(id),'Missing UI id '+id);
 assert.ok(html.includes('id="paymentDialog"'));assert.ok(js.includes('paymentActions(live)'));assert.ok(js.includes('#paymentDialog[open]'));assert.ok(html.includes('id="paymentAck" type="checkbox" required'));
});
