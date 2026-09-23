/* Deploy this project twice: public (execute as owner, anyone), and admin
 * (execute as accessing user, owner only). Run setup_ from the editor first.
 * All storage stays private in a NEW Drive folder; existing customer DB is untouched. */
const REVIEW_PARENT = 'https://meottable.github.io';
function setup_() {
  const props=PropertiesService.getScriptProperties();
  const owner=Session.getEffectiveUser().getEmail();
  if(!owner)throw new Error('소유자 계정을 확인할 수 없습니다.');
  if(!props.getProperty('REVIEW_FOLDER'))props.setProperty('REVIEW_FOLDER',DriveApp.createFolder('멋테이블 고객 후기 · 비공개 원본').getId());
  props.setProperty('REVIEW_OWNER',owner.toLowerCase());
}
function store_(){const id=PropertiesService.getScriptProperties().getProperty('REVIEW_FOLDER');if(!id)throw new Error('후기 서비스 연결을 준비하고 있습니다.');return DriveApp.getFolderById(id);}
function owner_(){
  const expected=PropertiesService.getScriptProperties().getProperty('REVIEW_OWNER');
  const active=Session.getActiveUser().getEmail().toLowerCase();
  if(!expected||!active||active!==expected)throw new Error('관리자 계정으로 로그인해 주세요.');
  return active;
}
function doGet(e){
  const page=e&&e.parameter&&e.parameter.page==='admin'?'admin':'public';
  if(page==='admin')owner_();
  const template=HtmlService.createTemplateFromFile('App');
  template.mode=page;
  template.bridge=/^[a-z0-9-]{1,80}$/i.test(e&&e.parameter&&e.parameter.bridge||'')?e.parameter.bridge:'';
  const out=template.evaluate().setTitle(page==='admin'?'멋:테이블 후기 관리':'멋:테이블 후기 남기기').addMetaTag('viewport','width=device-width, initial-scale=1');
  // Admin is never embeddable. Public UI is embedded only by the homepage.
  if(page==='public')out.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  return out;
}
function locked_(fn){const lock=LockService.getScriptLock();lock.waitLock(30000);try{return fn();}finally{lock.releaseLock();}}
function clean_(v,max){return String(v||'').trim().slice(0,max);}
function validate_(d){
  if(!d||typeof d!=='object')throw new Error('입력 내용을 확인해 주세요.');
  if(d.website)throw new Error('접수할 수 없습니다.');
  if(!/^[a-f0-9-]{36}$/i.test(d.requestId||''))throw new Error('접수 번호를 확인해 주세요.');
  const name=clean_(d.name,16),body=clean_(d.body,1000),rating=Number(d.rating);
  if(!name||body.length<10||!Number.isInteger(rating)||rating<1||rating>5||d.consent!==true)throw new Error('이름·별점·후기·공개 동의를 확인해 주세요.');
  const photos=d.photos||[];
  if(!Array.isArray(photos)||photos.length>3)throw new Error('사진은 최대 3장입니다.');
  const blobs=photos.map((p,i)=>{
    if(!p||typeof p.data!=='string'||p.data.length>1400000||!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(p.data))throw new Error('사진 형식을 확인해 주세요.');
    const bytes=Utilities.base64Decode(p.data.split(',')[1]);
    if(bytes.length>1000000||bytes.length<4||(bytes[0]&255)!==255||(bytes[1]&255)!==216||(bytes[2]&255)!==255||(bytes[bytes.length-2]&255)!==255||(bytes[bytes.length-1]&255)!==217)throw new Error('사진 파일을 확인해 주세요.');
    return Utilities.newBlob(bytes,'image/jpeg','photo-'+(i+1)+'.jpg');
  });
  return {name,body,rating,business:clean_(d.business,30),blobs};
}
function submitReview(d){
  const value=validate_(d);
  return locked_(function(){
    const root=store_(),existing=root.getFoldersByName(d.requestId);
    while(existing.hasNext()){const folder=existing.next();if(!folder.isTrashed()){try{record_(folder);return {ok:true,id:folder.getId()};}catch(error){folder.setTrashed(true);}}}
    const cache=CacheService.getScriptCache(),key='submissions:'+Utilities.formatDate(new Date(),'Asia/Seoul','yyyyMMdd');
    const count=Number(cache.get(key)||0);if(count>=100)throw new Error('오늘 접수가 많습니다. 잠시 후 다시 이용해 주세요.');
    const folder=root.createFolder(d.requestId);
    try{
      value.blobs.forEach(blob=>folder.createFile(blob));
      folder.createFile('review.json',JSON.stringify({id:folder.getId(),created:new Date().toISOString(),name:value.name,business:value.business,rating:value.rating,body:value.body,status:'pending',photoCount:value.blobs.length,consentAt:new Date().toISOString()}),MimeType.PLAIN_TEXT);
      cache.put(key,String(count+1),21600);
      return {ok:true,id:folder.getId()};
    }catch(error){console.error('review-save-error: '+error.message);folder.setTrashed(true);throw new Error('저장하지 못했습니다. 작성 내용을 유지한 채 다시 시도해 주세요.');}
  });
}
function record_(folder){const files=folder.getFilesByName('review.json');if(!files.hasNext())throw new Error('후기를 찾지 못했습니다.');return JSON.parse(files.next().getBlob().getDataAsString());}
function folder_(id){
  if(!/^[A-Za-z0-9_-]{10,200}$/.test(String(id||'')))throw new Error('잘못된 후기 번호입니다.');
  const folder=DriveApp.getFolderById(id),parents=folder.getParents(),rootId=store_().getId();let belongs=false;
  while(parents.hasNext())if(parents.next().getId()===rootId)belongs=true;
  if(!belongs||folder.isTrashed())throw new Error('후기를 찾지 못했습니다.');return folder;
}
function image_(folder,index){const files=folder.getFilesByName('photo-'+(index+1)+'.jpg');return files.hasNext()?'data:image/jpeg;base64,'+Utilities.base64Encode(files.next().getBlob().getBytes()):null;}
function list_(admin){
  const folders=store_().getFolders(),items=[];
  while(folders.hasNext()){
    const folder=folders.next();if(folder.isTrashed())continue;
    try{const r=record_(folder);if(admin||r.status==='published')items.push(r);}catch(error){/* interrupted upload is never exposed */}
  }
  return items.sort((a,b)=>b.created.localeCompare(a.created));
}
function getPublicReviews(){return list_(false).slice(0,30).map(r=>({id:r.id,name:r.name,business:r.business,rating:r.rating,body:r.body,created:r.created,photoCount:r.photoCount}));}
function getReviewPhotos(id,admin){
  if(admin===true)owner_();
  const folder=folder_(id),record=record_(folder);
  if(admin!==true&&record.status!=='published')throw new Error('공개된 후기가 아닙니다.');
  return Array.from({length:Math.min(record.photoCount,3)},(_,i)=>image_(folder,i)).filter(Boolean);
}
function getAdminSession(){const owner=owner_(),token=Utilities.getUuid()+Utilities.getUuid();CacheService.getScriptCache().put('csrf:'+token,owner,1800);return {token,reviews:list_(true)};}
function mutateReview(id,action,token){
  const owner=owner_();if(!token||CacheService.getScriptCache().get('csrf:'+token)!==owner)throw new Error('로그인 시간이 지났습니다. 새로고침해 주세요.');
  if(!['publish','delete'].includes(action))throw new Error('지원하지 않는 작업입니다.');
  return locked_(function(){
    const folder=folder_(id),r=record_(folder);
    if(action==='delete')folder.setTrashed(true);
    else{r.status='published';r.publishedAt=new Date().toISOString();folder.getFilesByName('review.json').next().setContent(JSON.stringify(r));}
    return {ok:true};
  });
}
