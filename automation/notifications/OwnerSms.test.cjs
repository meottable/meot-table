const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs'),crypto=require('node:crypto');
const source=fs.readFileSync(__dirname+'/OwnerSms.gs','utf8');
function fixture(){
 const props={SMS_DB_ID:'test-db',SMS_FROM:'0212345678',SMS_OWNER_TO:'01000000000',SOLAPI_API_KEY:'test',SOLAPI_API_SECRET:'secret'};
 const tables={intake:[['id'],['receipt-001']]};let sends=0,mode='accepted',lastPayload;
 function sheet(name){return {appendRow(r){tables[name].push(r)},getDataRange(){return {getValues:()=>tables[name].map(r=>r.slice())}},getRange(row,col,n=1,m=1){return {getValue:()=>tables[name][row-1]?.[col-1],getValues:()=>Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>tables[name][row+i-1]?.[col+j-1]??'')),setValue(v){tables[name][row-1][col-1]=v},setValues(a){a.forEach((r,i)=>r.forEach((v,j)=>tables[name][row+i-1][col+j-1]=v))}}}}};
 const db={getSheetByName:n=>tables[n]?sheet(n):null,insertSheet(n){tables[n]=[];return sheet(n)}};
 const context={PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]??null,setProperty:(k,v)=>props[k]=v})},SpreadsheetApp:{openById:()=>db,flush(){}},LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},Utilities:{Charset:{UTF_8:'UTF-8'},formatDate:()=> '2026-10-08',getUuid:()=> '00000000-0000-4000-8000-000000000000',computeHmacSha256Signature:(d,k)=>Array.from(crypto.createHmac('sha256',k).update(d).digest())},UrlFetchApp:{fetch(url,options){sends++;lastPayload=JSON.parse(options.payload);if(mode==='timeout')throw Error('timeout');return {getResponseCode:()=>mode==='rejected'?401:200,getContentText:()=>mode==='malformed'?'oops':JSON.stringify({groupInfo:{groupId:'group-test',count:{registeredSuccess:1}},failedMessageList:[]})}}}};
 vm.createContext(context);vm.runInContext(source,context);context.meotSmsSetup_();
 return {context,props,tables,get sends(){return sends},get payload(){return lastPayload},set mode(v){mode=v}};
}
let f=fixture();
assert.throws(()=>f.context.meotSmsEnqueueStored_('intake',2,1,'receipt-missing'),/실제 저장/);
assert.equal(f.tables._문자알림.length,1);
f.context.meotSmsEnqueueStored_('intake',2,1,'receipt-001');
assert.equal(f.context.meotSmsEnqueueStored_('intake',2,1,'receipt-001').duplicate,true);
assert.equal(f.tables._문자알림.length,2);
f.context.meotSmsProcess_();assert.equal(f.sends,0);
f.props.SMS_ENABLED='true';f.context.meotSmsProcess_();f.context.meotSmsProcess_();
assert.equal(f.sends,1);assert.equal(f.tables._문자알림[1][2],'accepted');
assert.equal(f.payload.messages[0].to,'01000000000');assert.equal(f.payload.messages[0].type,'LMS');
for(const mode of ['timeout','malformed','rejected']){
 f=fixture();f.props.SMS_ENABLED='true';f.mode=mode;
 f.context.meotSmsEnqueueStored_('intake',2,1,'receipt-001');
 f.context.meotSmsProcess_();f.context.meotSmsProcess_();
 assert.equal(f.sends,1);assert.equal(f.tables._문자알림[1][2],mode==='rejected'?'rejected':'unknown');
}
f=fixture();f.props.SMS_ENABLED='true';f.props.SMS_DAILY_LIMIT='1';
f.tables.intake.push(['receipt-002']);
f.context.meotSmsEnqueueStored_('intake',2,1,'receipt-001');f.context.meotSmsEnqueueStored_('intake',3,1,'receipt-002');
f.context.meotSmsProcess_();assert.equal(f.sends,1);assert.equal(f.tables._문자알림[2][2],'queued');
f.tables._문자알림[2][2]='sending';f.context.meotSmsProcess_();assert.equal(f.tables._문자알림[2][2],'unknown');
assert.match(f.context.meotSmsAuth_({key:'key',secret:'secret'},'date','salt'),new RegExp(crypto.createHmac('sha256','secret').update('datesalt').digest('hex')+'$'));
console.log('PASS: persisted-row check, deduplication, disabled default, owner-only recipient, accepted != delivered, timeout/malformed/rejection no retry, daily cap, crash recovery, HMAC');
