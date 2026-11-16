const test=require('node:test'),assert=require('node:assert/strict'),M=require('../ledger/model.js'),S=require('../ledger/source-sync.js');
function feed(version=1){return {schema:3,target:20000000,updated:'2026-11-16',source:{version,modifiedAt:'2026-11-16T00:00:00Z'},orders:[
 {date:'2026-10-01',number:'QA-A',name:'가상 매장 A',amount:1000000,paid:400000,balance:600000,note:'원본 메모'},
 {date:'2026-11-01',number:'QA-B',name:'가상 매장 B',amount:2000000,paid:null,balance:null,paymentStatus:'unknown'},
 {date:'2026-11-01',number:'QA-C',name:'가상 매장 C',amount:300000,paid:300000,balance:0}
 ],cash:[]};}
test('collection notes change neither money nor source and preserve closed history and backups',()=>{
 const s=M.migrate(feed(),'2026-11');M.closeMonth(s,'2026-10');
 const history=JSON.stringify(s.months['2026-10']),baseline=JSON.stringify(s.sourceBaseline),before=M.orderView(s,s.orders[0]);
 M.saveCollection(s,s.orders[0].id,{dueDate:'2026-11-20',note:'가상 관리 메모'});
 assert.equal(M.orderView(s,s.orders[0]).balance,before.balance);assert.equal(s.cash.length,0);
 assert.equal(JSON.stringify(s.months['2026-10']),history);assert.equal(JSON.stringify(s.sourceBaseline),baseline);
 assert.equal(M.validate(M.clone(s)).orders[0].collection.note,'가상 관리 메모');assert.equal(s.orders[0].note,'원본 메모');
});
test('notes survive source note and payment changes; annotated source deletion is held',()=>{
 const s=M.migrate(feed(),'2026-11');M.saveCollection(s,s.orders[0].id,{dueDate:'2026-11-20',note:'내 메모'});
 const f=feed(2);f.orders[0].note='새 원본 메모';f.orders[0].paid=1000000;f.orders[0].balance=0;
 const next=S.merge(s,f).state;assert.equal(next.orders[0].collection.note,'내 메모');assert.equal(next.orders[0].note,'새 원본 메모');assert.equal(M.orderView(next,next.orders[0]).balance,0);
 const removed=feed(3);removed.orders.shift();assert.throws(()=>S.merge(next,removed),/관리 메모/);
 M.saveCollection(next,next.orders[0].id,{dueDate:'',note:''});assert.equal(S.merge(next,removed).state.orders.length,2);
});
test('filters distinguish unknown, pending, overdue and settled without inventing amounts',()=>{
 const s=M.migrate(feed(),'2026-11');M.saveCollection(s,s.orders[0].id,{dueDate:'2026-11-15',note:'금요일 확인'});
 M.saveCollection(s,s.orders[1].id,{dueDate:'2026-11-16',note:'확인 필요'});
 const list=(filter,extra={})=>M.collectionRows(s,'2026-11',{filter,asOf:'2026-11-16',...extra});
 assert.equal(list('pending').length,2);assert.equal(list('unknown')[0].balance,null);assert.equal(list('unpaid').length,1);
 assert.equal(list('paid').length,1);assert.equal(list('overdue').length,1);assert.equal(list('all').length,3);
 assert.equal(list('pending',{query:'금요일'}).length,1);assert.equal(list('pending',{sort:'date'})[0].number,'QA-A');
 assert.equal(M.collectionRows(s,'2026-10').length,1);assert.equal(M.orderView(s,s.orders[1]).paid,null);
});
test('partial/full receipts, corrections and deletion update receivables and cash once',()=>{
 const s=M.migrate(feed(),'2026-11'),o=s.orders[0],cash={id:'receipt',date:'2026-11-16',type:'입금',orderId:o.id,name:o.name,category:'잔금',amount:100000,note:'가상 입금'};
 M.saveCash(s,cash);assert.equal(M.orderView(s,o).balance,500000);assert.equal(M.totals(s,'2026-11').received,100000);
 M.saveCash(s,{...cash,amount:600000});assert.equal(M.orderView(s,o).balance,0);assert.equal(s.cash.length,1);
 assert.equal(M.collectionRows(s,'2026-11',{filter:'paid'}).length,2);M.remove(s,'cash','receipt');assert.equal(M.orderView(s,o).balance,600000);
 assert.throws(()=>M.saveCash(s,{...cash,amount:600001}),/보다 큽니다/);assert.throws(()=>M.saveCash(s,{...cash,orderId:s.orders[1].id}),/원본 입금액/);M.validate(s);
});
test('invalid note data fails validation and blank fields clear only follow-up metadata',()=>{
 const s=M.migrate(feed(),'2026-11'),id=s.orders[0].id;
 assert.throws(()=>M.saveCollection(s,id,{dueDate:'2026-02-30',note:''}),/예정일/);
 assert.throws(()=>M.saveCollection(s,id,{dueDate:'',note:'x'.repeat(3001)}),/3,000/);
 assert.throws(()=>M.saveCollection(s,'missing',{note:''}),/찾을 수/);
 M.saveCollection(s,id,{dueDate:'',note:'  '});assert.deepEqual(s.orders[0].collection,{dueDate:'',note:''});
 s.orders[0].collection={note:4,dueDate:''};assert.throws(()=>M.validate(s),/관리 메모/);
});
