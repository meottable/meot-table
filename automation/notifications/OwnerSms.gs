/** Server-only Apps Script add-on. No public RPC or HTTP entry points. */
const MEOT_SMS_TAB = '_문자알림';
const MEOT_SMS_HEADERS = ['접수ID','생성시각','상태','문자','처리시각','공급자그룹','결과'];
function meotSmsConfig_() {
  const p=PropertiesService.getScriptProperties();
  const c={p,db:p.getProperty('SMS_DB_ID'),key:p.getProperty('SOLAPI_API_KEY'),secret:p.getProperty('SOLAPI_API_SECRET'),from:p.getProperty('SMS_FROM'),to:p.getProperty('SMS_OWNER_TO'),enabled:p.getProperty('SMS_ENABLED')==='true',limit:Number(p.getProperty('SMS_DAILY_LIMIT')||20)};
  if(!c.db)throw Error('SMS_DB_ID 설정 필요');
  if(!Number.isInteger(c.limit)||c.limit<1||c.limit>100)throw Error('SMS_DAILY_LIMIT: 1~100');
  return c;
}
function meotSmsLock_(fn) {
  const lock=LockService.getScriptLock();lock.waitLock(20000);
  try{return fn();}finally{lock.releaseLock();}
}
function meotSmsSheet_(c) {
  const sh=SpreadsheetApp.openById(c.db).getSheetByName(MEOT_SMS_TAB);
  if(!sh||JSON.stringify(sh.getRange(1,1,1,7).getValues()[0])!==JSON.stringify(MEOT_SMS_HEADERS))throw Error('문자 알림 초기화 또는 열 확인 필요');
  return sh;
}
// Run once in the existing intake project's editor. Does NOT send or enable SMS.
function meotSmsSetup_() {
  const c=meotSmsConfig_();
  return meotSmsLock_(()=>{
    const ss=SpreadsheetApp.openById(c.db);
    if(!ss.getSheetByName(MEOT_SMS_TAB))ss.insertSheet(MEOT_SMS_TAB).appendRow(MEOT_SMS_HEADERS);
    meotSmsSheet_(c);
    if(!c.p.getProperty('SMS_ENABLED'))c.p.setProperty('SMS_ENABLED','false');
    return {configured:true,enabled:c.enabled};
  });
}
/** Call ONLY after the intake transaction commits and releases its lock.
 * Re-read a persisted receipt cell, never trust a browser's saved=true flag.
 * receiptId must be a unique immutable per-inquiry ID, NOT a customer ID.
 */
function meotSmsEnqueueStored_(sheetName,row,idColumn,receiptId) {
  const c=meotSmsConfig_();
  if(!/^[A-Za-z0-9_-]{6,80}$/.test(String(receiptId||'')))throw Error('고유 접수ID 필요');
  if(!Number.isInteger(row)||row<2||!Number.isInteger(idColumn)||idColumn<1||sheetName===MEOT_SMS_TAB)throw Error('저장 위치 확인 필요');
  return meotSmsLock_(()=>{
    const source=SpreadsheetApp.openById(c.db).getSheetByName(sheetName);
    SpreadsheetApp.flush();
    if(!source||String(source.getRange(row,idColumn).getValue())!==receiptId)throw Error('실제 저장 확인 실패');
    const sh=meotSmsSheet_(c),rows=sh.getDataRange().getValues();
    const existing=rows.slice(1).find(r=>r[0]===receiptId);
    if(existing)return {id:receiptId,state:existing[2],duplicate:true};
    // Fixed content: customer text/phone cannot become a recipient or SMS payload.
    const text='[멋테이블] 새 홈페이지 문의가 접수됐습니다.\n접수번호: '+receiptId+'\n영업콘솔의 고객 DB에서 확인하세요.\nhttps://meottable.github.io/meot-table/admin.html';
    sh.appendRow([receiptId,new Date().toISOString(),'queued',text,'','','']);
    SpreadsheetApp.flush();
    return {id:receiptId,state:'queued'};
  });
}
function meotSmsAuth_(c,date,salt) {
  const hex=Utilities.computeHmacSha256Signature(date+salt,c.secret,Utilities.Charset.UTF_8).map(b=>('0'+(b&255).toString(16)).slice(-2)).join('');
  return 'HMAC-SHA256 apiKey='+c.key+', date='+date+', salt='+salt+', signature='+hex;
}
function meotSmsProvider_(c,text) {
  const date=new Date().toISOString(),salt=Utilities.getUuid().replace(/-/g,'');
  try {
    const response=UrlFetchApp.fetch('https://api.solapi.com/messages/v4/send-many/detail',{
      method:'post',contentType:'application/json',muteHttpExceptions:true,
      headers:{Authorization:meotSmsAuth_(c,date,salt)},
      payload:JSON.stringify({messages:[{to:c.to,from:c.from,type:'LMS',text}],strict:true})
    });
    const code=response.getResponseCode();let body;
    try{body=JSON.parse(response.getContentText());}catch(_){return {state:'unknown',reason:'응답 해석 불가'};}
    const group=body.groupInfo||{},count=group.count||{};
    if(code>=200&&code<300&&Number(count.registeredSuccess)===1&&!(body.failedMessageList||[]).length)return {state:'accepted',group:String(group.groupId||''),reason:'공급자 접수 · 휴대폰 수신 미확인'};
    if(code>=400&&code<500)return {state:'rejected',reason:'HTTP '+code+' · 공급자 발송내역 확인'};
    if(code>=200&&code<300&&Number(count.registeredSuccess)===0&&Number(count.registeredFailed)===1)return {state:'rejected',reason:'공급자 접수 거절'};
    return {state:'unknown',reason:'발송 여부 확인 필요'};
  }catch(_){return {state:'unknown',reason:'통신 실패 · 중복 방지를 위해 자동 재전송 안 함'};}
}
/** Installable trigger handler. Underscore prevents google.script.run access. */
function meotSmsProcess_() {
  const c=meotSmsConfig_();if(!c.enabled)return {state:'disabled'};
  if(!c.key||!c.secret||!/^0\d{8,10}$/.test(c.from||'')||!/^010\d{8}$/.test(c.to||''))throw Error('문자 계정·발신번호·사장님 수신번호 설정 필요');
  return meotSmsLock_(()=>{
    const sh=meotSmsSheet_(c),rows=sh.getDataRange().getValues();
    const day=Utilities.formatDate(new Date(),'Asia/Seoul','yyyy-MM-dd');
    let counter=JSON.parse(c.p.getProperty('SMS_BUDGET')||'{}');
    if(counter.day!==day)counter={day,count:0};
    if(!Number.isInteger(counter.count)||counter.count<0)throw Error('발송 한도 기록 확인 필요');
    // At most 5 per execution; daily limit includes ambiguous and rejected attempts.
    let processed=0;
    for(let i=1;i<rows.length&&processed<5;i++) {
      if(rows[i][2]==='sending') {
        sh.getRange(i+1,3).setValue('unknown');
        sh.getRange(i+1,7).setValue('이전 실행 중단 · 공급자 내역 확인 필요');
      }
      if(rows[i][2]!=='queued'||counter.count>=c.limit)continue;
      counter.count++;c.p.setProperty('SMS_BUDGET',JSON.stringify(counter));
      sh.getRange(i+1,3).setValue('sending');
      sh.getRange(i+1,5).setValue(new Date().toISOString());
      SpreadsheetApp.flush(); // Crash after this point must never blindly resend.
      const result=meotSmsProvider_(c,String(rows[i][3]));
      sh.getRange(i+1,3).setValue(result.state);
      sh.getRange(i+1,6,1,2).setValues([[result.group||'',result.reason]]);
      SpreadsheetApp.flush();processed++;
    }
    return {processed,attemptsToday:counter.count};
  });
}
// Run only after secure config, recipient confirmation and controlled real test.
function meotSmsInstallTrigger_() {
  const c=meotSmsConfig_();
  if(!c.enabled)throw Error('SMS_ENABLED 설정 전에는 활성화하지 않습니다.');
  if(!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='meotSmsProcess_'))ScriptApp.newTrigger('meotSmsProcess_').timeBased().everyMinutes(1).create();
}
