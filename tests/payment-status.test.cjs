const test=require('node:test'),assert=require('node:assert/strict'),M=require('../ledger/model.js'),S=require('../ledger/source-sync.js');
const feed=(version=1)=>({schema:3,updated:'2026-10-15',source:{version,modifiedAt:'2026-10-15T09:00:00Z'},target:10000000,orders:[{number:'QA-UNKNOWN',date:'2026-10-15',name:'검증용 고객',amount:1000000,paymentStatus:'unknown',paid:null,balance:null}],cash:[]});
test('unknown payments survive migration, edits, close, backup and reload without inventing money',()=>{
 const s=M.migrate(feed(),'2026-10'),o=s.orders[0];assert.equal(M.totals(s,'2026-10').revenue,1000000);assert.equal(M.orderView(s,o).paid,null);assert.equal(M.orderView(s,o).balance,null);assert.equal(o.adjustment,null);assert.equal(M.outstanding(s,'2026-10').length,0);assert.equal(M.unconfirmed(s,'2026-10').length,1);
 M.saveOrder(s,{...o,amount:1100000,note:'현장 메모'});assert.equal(s.orders[0].basePaid,null);assert.equal(s.orders[0].baseBalance,null);M.closeMonth(s,'2026-10');M.validate(JSON.parse(JSON.stringify(s)));assert.equal(s.months['2026-10'].snapshot.orders[0].balance,null);
});
test('unknown is not zero: source transitions remain distinct and closed history is preserved',()=>{
 const f=feed(),s=M.migrate(f,'2026-10');M.closeMonth(s,'2026-10');const closed=JSON.stringify(s.months['2026-10']);const next=feed(2);Object.assign(next.orders[0],{paymentStatus:'known',paid:0,balance:1000000});const r=S.merge(s,next).state;assert.equal(M.unconfirmed(r,'2026-10').length,0);assert.equal(M.outstanding(r,'2026-10')[0].balance,1000000);assert.equal(JSON.stringify(r.months['2026-10']),closed);
 const back=feed(3),r2=S.merge(r,back).state;assert.equal(r2.orders[0].basePaid,null);assert.equal(r2.orders[0].baseBalance,null);assert.equal(r2.orders[0].adjustment,null);assert.equal(S.merge(r2,back).changed,false);
});
test('new unknown sale is merged once and independent local notes and transactions survive',()=>{
 const old=feed();old.orders=[];const s=M.migrate(old,'2026-10');M.saveOrder(s,{id:'local',date:'2026-10-15',name:'기기 고객',amount:200000});const r=S.merge(s,feed(2)).state;assert.equal(M.totals(r,'2026-10').revenue,1200000);assert.equal(r.orders.length,2);r.orders.find(o=>o.number==='QA-UNKNOWN').note='기기 메모';const f=feed(3);Object.assign(f.orders[0],{paymentStatus:'known',paid:1000000,balance:0});const settled=S.merge(r,f).state;assert.equal(settled.orders.find(o=>o.number==='QA-UNKNOWN').note,'기기 메모');assert.equal(M.unconfirmed(settled,'2026-10').length,0);
});
test('unknown cannot accept linked receipts or contradictory numeric values',()=>{
 const s=M.migrate(feed(),'2026-10');assert.throws(()=>M.saveCash(s,{id:'pay',date:'2026-10-15',type:'입금',name:'검증용 고객',orderId:s.orders[0].id,amount:1}),/원본 입금액/);const malformed=feed();malformed.orders[0].paid=0;assert.throws(()=>M.migrate(malformed),/일치/);const bad=M.clone(s);bad.orders[0].basePaid=0;assert.throws(()=>M.validate(bad),/비워/);
});
test('local settlement conflicts are preserved instead of replaced with an unknown status',()=>{
 const f=feed();Object.assign(f.orders[0],{paymentStatus:'known',paid:0,balance:1000000});const s=M.migrate(f,'2026-10');M.saveCash(s,{id:'pay',date:'2026-10-15',type:'입금',name:'검증용 고객',orderId:s.orders[0].id,amount:100000});assert.throws(()=>S.merge(s,feed(2)),/함께/);assert.equal(M.orderView(s,s.orders[0]).paid,100000);
});
