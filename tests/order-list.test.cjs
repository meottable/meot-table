const test=require('node:test'),assert=require('node:assert/strict'),M=require('../ledger/model.js');
function seed(){return M.migrate({schema:3,target:20000000,updated:'2026-11-16',orders:[
 {date:'2026-11-01',name:'가상 완납',number:'QA-PAID',amount:1000000,paid:1000000,balance:0},
 {date:'2026-11-02',name:'가상 부분입금',number:'QA-PART',amount:1000000,paid:500000,balance:500000},
 {date:'2026-11-03',name:'가상 미확인',number:'QA-UNKNOWN',amount:1000000,paid:null,balance:null,paymentStatus:'unknown'},
 {date:'2026-11-04',name:'가상 미입금',number:'QA-NONE',amount:1000000,paid:0,balance:1000000}
 ],cash:[]},'2026-11');}
const rows=s=>M.totals(s,'2026-11').orders;
test('default list hides only settled rows and paid tab keeps them accessible without mutation',()=>{
 const s=seed(),before=JSON.stringify(s),r=rows(s);
 assert.deepEqual(M.orderListRows(r).map(o=>o.number),['QA-NONE','QA-UNKNOWN','QA-PART']);
 assert.deepEqual(M.orderListRows(r,{filter:'paid'}).map(o=>o.number),['QA-PAID']);
 assert.equal(M.orderListRows(r,{filter:'all'}).length,4);
 assert.equal(M.orderListRows(r,{filter:'paid',query:'미확인'}).length,0);
 assert.equal(M.orderListRows(r,{query:'qa-unknown'})[0].balance,null);
 assert.equal(JSON.stringify(s),before);assert.equal(M.totals(s,'2026-11').revenue,4000000);
});
test('50% stays pending; 100% receipt moves to paid; reversing a receipt restores pending',()=>{
 const s=seed(),o=s.orders[3],receipt={id:'qa-cash',date:'2026-11-16',type:'입금',name:o.name,orderId:o.id,amount:500000};
 M.saveCash(s,receipt);assert(M.orderListRows(rows(s)).some(x=>x.id===o.id));
 M.saveCash(s,{...receipt,amount:1000000});assert(!M.orderListRows(rows(s)).some(x=>x.id===o.id));
 assert(M.orderListRows(rows(s),{filter:'paid'}).some(x=>x.id===o.id));
 assert.equal(s.orders.length,4);assert.equal(M.totals(s,'2026-11').revenue,4000000);
 M.remove(s,'cash',receipt.id);assert(M.orderListRows(rows(s)).some(x=>x.id===o.id));
});
test('unknown confirmation moves only at full payment and can be undone without changing cash',()=>{
 const s=seed(),o=s.orders[2];M.confirmPayment(s,o.id,{paid:500000,acknowledged:true});
 assert(M.orderListRows(rows(s)).some(x=>x.id===o.id));
 M.confirmPayment(s,o.id,{paid:1000000,acknowledged:true});
 assert(!M.orderListRows(rows(s)).some(x=>x.id===o.id));
 assert(M.orderListRows(rows(s),{filter:'paid'}).some(x=>x.id===o.id));
 M.clearPaymentConfirmation(s,o.id);assert(M.orderListRows(rows(s)).some(x=>x.id===o.id));
 assert.equal(s.cash.length,0);assert.equal(M.validate(M.clone(s)).orders.length,4);
});
test('closed month filtering preserves historic payments and the entire close snapshot',()=>{
 const s=seed();M.closeMonth(s,'2026-11');const snapshot=s.months['2026-11'].snapshot,before=JSON.stringify(snapshot);
 M.confirmPayment(s,s.orders[2].id,{paid:1000000,acknowledged:true});
 assert.equal(M.orderListRows(snapshot.orders,{filter:'paid'}).length,1);
 assert.equal(M.orderListRows(rows(s),{filter:'paid'}).length,2);
 assert.equal(JSON.stringify(snapshot),before);
});
test('dedicated paid tab is wired, default remains pending, and build versions agree',()=>{
 const fs=require('node:fs'),path=require('node:path'),read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
 const html=read('ledger/index.html'),js=read('ledger/ledger.js'),version=JSON.parse(read('ledger/app-version.json')).version;
 assert.match(html,/<button data-tab="paid" aria-selected="false">정산 완료<\/button>/);
 assert.match(js,/tab==='paid'\?'paid':'pending'/);assert.match(js,/paid:'정산 완료'/);
 assert(html.includes('data-ledger-build="'+version+'"'));assert(read('ledger/sw.js').includes(version));
});
