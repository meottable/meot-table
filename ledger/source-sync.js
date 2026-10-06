(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./model.js'));else root.MeotLedgerSync=factory(root.MeotLedger);})(typeof globalThis!=='undefined'?globalThis:this,function(M){
'use strict';
const clone=M.clone,numeric=new Set(['amount','tables','chairs','cutlery','basePaid','baseBalance','adjustment']);
const fields=['date','number','name','size','grade','tables','chairs','cutlery','amount','basePaid','baseBalance','adjustment','production','deliveryDate','delivery','note'];
const value=(o,k)=>numeric.has(k)?Number(o?.[k]||0):String(o?.[k]||'');
const comparable=o=>JSON.stringify(fields.map(k=>value(o,k)));
function sourceOrder(o,id){const n={...o,id,imported:true,basePaid:Number(o.paid||0),baseBalance:Number(o.balance||0),adjustment:o.amount-Number(o.paid||0)-Number(o.balance||0)};delete n.paid;delete n.balance;return n;}
const cashComparable=c=>JSON.stringify(['date','type','category','name','amount','note'].map(k=>k==='amount'?Number(c?.[k]||0):String(c?.[k]||'')));
function baseline(feed){return clone({schema:1,updated:feed.updated,target:feed.target,orders:feed.orders,cash:feed.cash,source:feed.source});}
function error(message){throw Error(message+' 기기 기록은 보존했습니다. 백업을 받은 뒤 겹친 기록을 확인해주세요.');}
function merge(state,feed){
 if(feed?.schema!==1||!feed.source||!Number.isSafeInteger(feed.source.version)||feed.source.version<1)throw Error('원본 연동 자료의 형식이 올바르지 않습니다.');
 M.validate(M.migrate(feed));
 if(feed.source.version<Number(state.sourceVersion||0))throw Error('이전 버전의 원본입니다. 현재 저장본을 유지합니다.');
 if(feed.source.version===Number(state.sourceVersion||0))return {changed:false,state};
 const old=state.sourceBaseline||feed.legacy;if(!old?.orders||!old?.cash)throw Error('이전 원본을 확인할 수 없어 자동 반영을 중단했습니다.');
 const next=clone(state),previous=new Map(old.orders.map(o=>[o.number,o])),incoming=new Map(feed.orders.map(o=>[o.number,o]));
 if(previous.size!==old.orders.length||incoming.size!==feed.orders.length)throw Error('원본에 중복된 견적번호가 있습니다.');
 // Legacy imported cash is already included in each order's baseline paid amount.
 // Any local edit or deletion of those rows needs reconciliation rather than replacement.
 const localImportedCash=next.cash.filter(c=>c.imported);
 if(localImportedCash.length!==old.cash.length||localImportedCash.some((c,i)=>cashComparable(c)!==cashComparable(old.cash[i])))error('기기에서 원본 입출금 내역을 수정해 자동으로 합칠 수 없습니다.');
 const newlyPublished=feed.cash.filter(c=>!old.cash.some(p=>cashComparable(p)===cashComparable(c)));
 for(const c of next.cash.filter(c=>!c.imported))if(newlyPublished.some(n=>n.date===c.date&&n.type===c.type&&n.amount===c.amount&&n.name===c.name))error('같은 날짜·거래처·금액의 입출금이 원본과 기기에 함께 있습니다.');
 const orderResult=[];
 for(const o of next.orders){
  if(!o.imported){if(incoming.has(o.number))error('견적번호 '+o.number+'가 원본과 기기에 함께 있습니다.');orderResult.push(o);continue;}
  const before=previous.get(o.number),after=incoming.get(o.number);
  if(!before)error('기기에서 원본 견적번호가 바뀌어 자동으로 합칠 수 없습니다.');
  const b=sourceOrder(before,o.id),links=next.cash.filter(c=>c.orderId===o.id);
  if(!after){if(comparable(o)!==comparable(b)||links.length)error('원본에서 삭제된 '+o.number+'에 기기 수정·입금이 남아 있습니다.');continue;}
  const a=sourceOrder(after,o.id);
  if(links.length&&(a.basePaid!==b.basePaid||a.baseBalance!==b.baseBalance||a.amount!==b.amount))error(o.number+'의 원본 정산과 기기 입금이 함께 바뀌었습니다.');
  const combined={...o};
  for(const k of fields){const bv=value(b,k),av=value(a,k),lv=value(o,k);if(av!==bv&&lv!==bv&&lv!==av)error(o.number+'의 '+({amount:'매출액',note:'메모',basePaid:'입금액',baseBalance:'미수금'}[k]||k)+'이 원본과 기기에서 다르게 바뀌었습니다.');if(av!==bv)combined[k]=a[k]??(numeric.has(k)?0:'');}
  combined.imported=true;orderResult.push(combined);incoming.delete(o.number);
 }
 for(const [number,o] of incoming)orderResult.push(sourceOrder(o,'source-order-'+encodeURIComponent(number)));
 next.orders=orderResult;
 next.cash=[...feed.cash.map((c,i)=>({...c,id:'source-cash-'+i,orderId:'',imported:true})),...next.cash.filter(c=>!c.imported)];
 for(const r of [...feed.orders,...feed.cash]){const m=r.date.slice(0,7),info=M.ensureMonth(next,m);if(info.status!=='closed'&&info.target===old.target)info.target=feed.target;}
 next.sourceVersion=feed.source.version;next.sourceMeta=clone(feed.source);next.sourceBaseline=baseline(feed);next.sourceUpdated=feed.updated;M.validate(next);
 return {changed:true,state:next};
}
return {merge,baseline};
});
