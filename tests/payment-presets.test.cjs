const test=require('node:test'),assert=require('node:assert/strict'),M=require('../ledger/model.js');
function state(paid=0,balance=1000000-paid,amount=1000000){return M.migrate({schema:3,updated:'2026-11-16',orders:[{date:'2026-11-01',name:'가상 비율 테스트',number:'QA-P',amount,paid,balance}],cash:[]},'2026-11');}
function receipt(s,amount,id='receipt'){return {id,date:'2026-11-16',type:'입금',orderId:s.orders[0].id,name:'가상 비율 테스트',category:'잔금',amount};}
test('new order presets validate amounts, percentages and whole-won rounding',()=>{
 assert.equal(M.percentageAmount(1000000,50),500000);assert.equal(M.percentageAmount(1000000,100),1000000);
 assert.equal(M.percentageAmount(101,50),51);assert.equal(M.percentageAmount(1000000000000,100),1000000000000);
 for(const amount of [0,-1,1.5,NaN,1000000000001])assert.throws(()=>M.percentageAmount(amount,50));
 for(const percent of [0,25,75,101,'50'])assert.throws(()=>M.percentageAmount(100,percent));
});
test('50 then 100 fills only remaining money and never mutates until save',()=>{
 const s=state(),id=s.orders[0].id,before=JSON.stringify(s);
 assert.equal(M.receiptPreset(s,id,50).amount,500000);assert.equal(JSON.stringify(s),before);
 M.saveCash(s,receipt(s,M.receiptPreset(s,id,50).amount));assert.equal(M.receiptPreset(s,id,50).amount,0);
 assert.equal(M.receiptPreset(s,id,100).amount,500000);M.saveCash(s,receipt(s,500000,'receipt2'));
 assert.equal(M.orderView(s,s.orders[0]).paid,1000000);assert.equal(M.orderView(s,s.orders[0]).balance,0);
 assert.equal(M.receiptPreset(s,id,100).amount,0);assert.equal(M.totals(s,'2026-11').received,1000000);
 const reloaded=M.validate(M.clone(s));assert.equal(M.receiptPreset(reloaded,id,100).amount,0);
});
test('existing 40% needs only 10% more for 50%; editing excludes itself',()=>{
 const s=state(400000),id=s.orders[0].id;assert.equal(M.receiptPreset(s,id,50).amount,100000);
 M.saveCash(s,receipt(s,100000));assert.equal(M.receiptPreset(s,id,50,'receipt').amount,100000);
 assert.equal(M.receiptPreset(s,id,100,'receipt').amount,600000);
 M.saveCash(s,receipt(s,M.receiptPreset(s,id,100,'receipt').amount));assert.equal(s.cash.length,1);
 assert.equal(M.orderView(s,s.orders[0]).balance,0);M.validate(s);
});
test('other order receipts and unlinked cash do not affect presets',()=>{
 const s=state(400000),id=s.orders[0].id;
 M.saveOrder(s,{id:'other',date:'2026-11-01',name:'다른 가상 거래',amount:1000000});
 M.saveCash(s,{...receipt(s,200000,'other-receipt'),orderId:'other'});
 M.saveCash(s,{...receipt(s,300000,'unlinked'),orderId:''});
 assert.equal(M.receiptPreset(s,id,50).amount,100000);assert.equal(M.receiptPreset(s,id,100,'other-receipt').amount,600000);
});
test('settlement differences are preserved and no preset exceeds actual balance',()=>{
 const discounted=state(100000,200000),id=discounted.orders[0].id;
 assert.equal(M.receiptPreset(discounted,id,50).amount,200000);assert.equal(M.receiptPreset(discounted,id,100).amount,200000);
 M.saveCash(discounted,receipt(discounted,200000));assert.equal(discounted.orders[0].adjustment,700000);
 assert.equal(M.orderView(discounted,discounted.orders[0]).balance,0);M.validate(discounted);
 const extra=state(400000,700000);assert.equal(M.receiptPreset(extra,extra.orders[0].id,100).amount,700000);
 assert.equal(extra.orders[0].adjustment,-100000);
});
test('unknown payment, source cash and missing orders cannot use presets',()=>{
 const s=state(),id=s.orders[0].id;
 assert.throws(()=>M.receiptPreset(s,'missing',50),/매출/);
 s.cash.push({...receipt(s,10000,'import-cash'),orderId:'',imported:true});assert.throws(()=>M.receiptPreset(s,id,100,'import-cash'),/원본 입출금/);
 Object.assign(s.orders[0],{paymentStatus:'unknown',basePaid:null,baseBalance:null,adjustment:null});
 const before=JSON.stringify(s);assert.throws(()=>M.receiptPreset(s,id,50),/원본 입금액/);assert.equal(JSON.stringify(s),before);
});
test('preset saves retain overpayment and closed-month protection',()=>{
 const s=state(),id=s.orders[0].id;assert.throws(()=>M.saveCash(s,receipt(s,1000001)),/보다 큽니다/);
 M.closeMonth(s,'2026-11');const before=JSON.stringify(s.months['2026-11']);
 assert.throws(()=>M.saveCash(s,receipt(s,M.receiptPreset(s,id,50).amount)),/마감/);
 assert.equal(JSON.stringify(s.months['2026-11']),before);assert.equal(s.cash.length,0);
});
