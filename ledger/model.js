(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MeotLedger=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const sum=(rows,field)=>rows.reduce((n,x)=>n+Number(x[field]||0),0);
function dateOK(s){return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&s>='2000-01-01'&&s<='2199-12-31'&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;}
function monthOK(s){return typeof s==='string'&&/^20\d{2}-(0[1-9]|1[0-2])$/.test(s);}
function money(n,label='금액'){if(!Number.isSafeInteger(n)||n<0||n>1000000000000)throw Error(label+'은 0 이상의 정수로 입력해주세요.');return n;}
function today(now=new Date()){const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);return ['year','month','day'].map(k=>p.find(x=>x.type===k).value).join('-');}
function nextMonth(m,step=1){if(!monthOK(m))throw Error('월을 확인해주세요.');const [y,n]=m.split('-').map(Number),d=new Date(Date.UTC(y,n-1+step,1));const result=d.toISOString().slice(0,7);if(!monthOK(result))throw Error('지원하는 연도 범위를 벗어났습니다.');return result;}
function ensureMonth(s,m){if(!monthOK(m))throw Error('월을 확인해주세요.');if(!Object.hasOwn(s.months,m))s.months[m]={target:s.defaultTarget,status:'open',history:[]};return s.months[m];}
function assertOpen(s,date){if(!dateOK(date))throw Error('날짜를 확인해주세요.');if(s.months[date.slice(0,7)]?.status==='closed')throw Error('마감된 달입니다. 해당 월에서 마감 해제 후 수정해주세요.');}
function orderView(s,o){const extra=sum(s.cash.filter(c=>c.orderId===o.id),'amount');return {...o,paid:o.basePaid+extra,balance:Math.max(0,o.baseBalance-extra)};}
function totals(s,m){const orders=s.orders.filter(o=>o.date.startsWith(m)).map(o=>orderView(s,o)),cash=s.cash.filter(c=>c.date.startsWith(m));return {orders,cash,revenue:sum(orders,'amount'),received:sum(cash.filter(c=>c.type==='입금'),'amount'),spent:sum(cash.filter(c=>c.type==='출금'),'amount')};}
function outstanding(s,m){return s.orders.filter(o=>o.date.slice(0,7)<=m).map(o=>orderView(s,o)).filter(o=>o.balance>0);}
function migrate(base,current=today().slice(0,7)){
 if(base.schema!==1||!Array.isArray(base.orders)||!Array.isArray(base.cash))throw Error('기존 장부 형식을 확인해주세요.');
 const s={schema:2,sourceUpdated:String(base.updated||''),updated:new Date().toISOString(),defaultTarget:10000000,orders:base.orders.map((o,i)=>({...o,id:'import-order-'+i,basePaid:Number(o.paid||0),baseBalance:Number(o.balance||0),adjustment:Number(o.amount||0)-Number(o.paid||0)-Number(o.balance||0),imported:true})),cash:base.cash.map((c,i)=>({...c,id:'import-cash-'+i,orderId:'',imported:true})),months:{}};
 for(const r of [...s.orders,...s.cash]){const m=ensureMonth(s,r.date.slice(0,7));if(Number.isSafeInteger(base.target)&&base.target>=0)m.target=base.target;}
 if(base.source){s.sourceVersion=base.source.version;s.sourceMeta=clone(base.source);s.sourceBaseline=clone({schema:1,updated:base.updated,target:base.target,orders:base.orders,cash:base.cash,source:base.source});}ensureMonth(s,current);validate(s);return s;
}
function validate(s){
 if(!s||s.schema!==2||!Array.isArray(s.orders)||!Array.isArray(s.cash)||!s.months||typeof s.months!=='object'||Array.isArray(s.months))throw Error('지원하지 않는 장부 파일입니다.');
 money(s.defaultTarget);if(s.orders.length>50000||s.cash.length>100000)throw Error('장부 파일이 너무 큽니다.');
 const ids=new Set(),orders=new Map();
 for(const o of s.orders){if(!o||typeof o.id!=='string'||!o.id||ids.has(o.id)||!dateOK(o.date)||typeof o.name!=='string'||!o.name.trim())throw Error('매출 기록 형식을 확인해주세요.');ids.add(o.id);orders.set(o.id,o);['amount','basePaid','baseBalance'].forEach(k=>money(o[k]));if(!Number.isSafeInteger(o.adjustment)||o.amount-o.basePaid-o.baseBalance!==o.adjustment)throw Error('매출·입금·미수금이 일치하지 않습니다.');}
 for(const c of s.cash){if(!c||typeof c.id!=='string'||!c.id||ids.has(c.id)||!dateOK(c.date)||!['입금','출금'].includes(c.type)||typeof c.name!=='string')throw Error('입출금 기록 형식을 확인해주세요.');ids.add(c.id);money(c.amount);if(c.orderId&&(!orders.has(c.orderId)||c.type!=='입금'))throw Error('연결된 매출을 찾을 수 없습니다.');}
 for(const o of s.orders)if(sum(s.cash.filter(c=>c.orderId===o.id),'amount')>o.baseBalance)throw Error('입금액이 남은 미수금보다 큽니다.');
 for(const [m,v] of Object.entries(s.months)){if(!monthOK(m)||!v||!['open','closed'].includes(v.status)||!Array.isArray(v.history))throw Error('월별 저장 형식을 확인해주세요.');money(v.target);if(v.status==='closed'){const x=v.snapshot;if(!x||!Array.isArray(x.orders)||!Array.isArray(x.cash))throw Error('월 마감 내역을 확인해주세요.');['revenue','received','spent'].forEach(k=>money(x[k]));for(const o of x.orders){if(!dateOK(o.date)||!o.date.startsWith(m)||typeof o.name!=='string')throw Error('마감 매출 형식을 확인해주세요.');['amount','paid','balance'].forEach(k=>money(o[k]));}for(const c of x.cash){if(!dateOK(c.date)||!c.date.startsWith(m)||!['입금','출금'].includes(c.type))throw Error('마감 입출금 형식을 확인해주세요.');money(c.amount);}if(x.revenue!==sum(x.orders,'amount')||x.received!==sum(x.cash.filter(c=>c.type==='입금'),'amount')||x.spent!==sum(x.cash.filter(c=>c.type==='출금'),'amount'))throw Error('마감 합계가 내역과 다릅니다.');}}
 return s;
}
function saveOrder(s,input){
 const existing=s.orders.find(o=>o.id===input.id);if(existing)assertOpen(s,existing.date);assertOpen(s,input.date);
 if(!String(input.name||'').trim())throw Error('고객명 또는 상호를 입력해주세요.');money(input.amount);if(input.amount===0)throw Error('매출금액을 입력해주세요.');
 const basePaid=existing?.basePaid||0,adjustment=existing?.adjustment||0,extra=sum(s.cash.filter(c=>c.orderId===input.id),'amount'),baseBalance=input.amount-basePaid-adjustment;
 if(baseBalance<extra)throw Error('매출금액이 입금·정산 금액보다 작습니다.');
 if(input.number&&s.orders.some(o=>o.id!==input.id&&o.number===input.number))throw Error('같은 견적번호가 이미 있습니다. 기존 기록을 확인해주세요.');
 const o={...existing,...input,basePaid,baseBalance,adjustment};delete o.paid;delete o.balance;
 const idx=s.orders.findIndex(x=>x.id===o.id);if(idx>=0)s.orders[idx]=o;else s.orders.push(o);ensureMonth(s,o.date.slice(0,7));return o;
}
function saveCash(s,input){
 const old=s.cash.find(c=>c.id===input.id);if(old)assertOpen(s,old.date);assertOpen(s,input.date);money(input.amount);if(!input.amount)throw Error('입출금액을 입력해주세요.');
 if(!['입금','출금'].includes(input.type))throw Error('입출금 구분을 선택해주세요.');
 const c={...old,...input};if(c.type==='출금')c.orderId='';
 if(c.orderId){const o=s.orders.find(o=>o.id===c.orderId);if(!o)throw Error('연결할 매출을 선택해주세요.');const others=sum(s.cash.filter(x=>x.id!==c.id&&x.orderId===c.orderId),'amount');if(c.amount>o.baseBalance-others)throw Error('입금액이 남은 미수금보다 큽니다.');c.name=o.name;}
 const idx=s.cash.findIndex(x=>x.id===c.id);if(idx>=0)s.cash[idx]=c;else s.cash.push(c);ensureMonth(s,c.date.slice(0,7));return c;
}
function remove(s,kind,id){const rows=kind==='order'?s.orders:s.cash,r=rows.find(x=>x.id===id);if(!r)throw Error('기록을 찾을 수 없습니다.');assertOpen(s,r.date);if(kind==='order'&&s.cash.some(c=>c.orderId===id))throw Error('연결된 입금 기록을 먼저 확인·삭제해주세요.');rows.splice(rows.indexOf(r),1);}
function closeMonth(s,m){const v=ensureMonth(s,m);if(v.status==='closed')throw Error('이미 마감된 달입니다.');v.snapshot=clone(totals(s,m));v.closedAt=new Date().toISOString();v.status='closed';ensureMonth(s,nextMonth(m));}
function reopen(s,m){const v=ensureMonth(s,m);if(v.status!=='closed')throw Error('마감된 달이 아닙니다.');v.history.push({closedAt:v.closedAt,snapshot:v.snapshot});delete v.snapshot;delete v.closedAt;v.status='open';}
return {clone,sum,money,today,dateOK,monthOK,nextMonth,ensureMonth,assertOpen,orderView,totals,outstanding,migrate,validate,saveOrder,saveCash,remove,closeMonth,reopen};
});
