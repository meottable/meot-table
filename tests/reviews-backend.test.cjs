const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto'),path=require('node:path');
const props=new Map(),cache=new Map(),folders=new Map();let active='',counter=0;
const iterator=items=>{let i=0;return {hasNext:()=>i<items.length,next:()=>items[i++]};};
function blob(data,type){return {getBytes:()=>Array.from(Buffer.isBuffer(data)?data:Buffer.from(data)),getDataAsString:()=>String(data),type};}
class Folder{
 constructor(name,parent){this.id='folder_'+String(++counter).padStart(10,'0');this.name=name;this.parent=parent;this.children=[];this.files=[];this.trash=false;folders.set(this.id,this);}
 getId(){return this.id;}isTrashed(){return this.trash;}setTrashed(v){this.trash=v;return this;}
 createFolder(name){const f=new Folder(name,this);this.children.push(f);return f;}
 getFolders(){return iterator(this.children);}getFoldersByName(name){return iterator(this.children.filter(f=>f.name===name));}getParents(){return iterator(this.parent?[this.parent]:[]);}
 createFile(name,data,type){if(typeof name==='object'){data=Buffer.from(name.getBytes());type=name.type;name=name.name;}const file={name,data,type,getBlob(){return blob(this.data,this.type);},setContent(v){this.data=v;}};this.files.push(file);return file;}
 getFilesByName(name){return iterator(this.files.filter(f=>f.name===name));}
}
const context={console,Date,JSON,Array,String,Number,Math,Error,RegExp,
 PropertiesService:{getScriptProperties:()=>({getProperty:k=>props.get(k)||null,setProperty:(k,v)=>props.set(k,v)})},
 Session:{getActiveUser:()=>({getEmail:()=>active}),getEffectiveUser:()=>({getEmail:()=> 'owner@example.test'})},
 DriveApp:{createFolder:name=>new Folder(name),getFolderById:id=>{if(!folders.has(id))throw Error('not found');return folders.get(id);}},
 CacheService:{getScriptCache:()=>({get:k=>cache.get(k)||null,put:(k,v)=>cache.set(k,v)})},
 LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},
 MimeType:{PLAIN_TEXT:'text/plain'},
 Utilities:{getUuid:()=>crypto.randomUUID(),formatDate:()=> '20260924',base64Decode:s=>Array.from(Buffer.from(s,'base64')),base64Encode:b=>Buffer.from(b).toString('base64'),newBlob:(bytes,type,name)=>Object.assign(blob(Buffer.from(bytes),type),{name})}
};
vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../backend/Code.gs'),'utf8'),context);
context.setup_();const root=folders.get(props.get('REVIEW_FOLDER'));
const draft=()=>({requestId:crypto.randomUUID(),storeName:'테스트 숯불구이',business:'고깃집',rating:5,body:'서버 검증용이며 실제 게시하지 않는 후기입니다.',consent:true,photos:[{data:'data:image/jpeg;base64,/9j/2Q=='}]});
let checks=0;function test(name,fn){fn();checks++;console.log('PASS',name);}
let id;
test('anonymous submission is durable and stays pending',()=>{const d=draft(),result=context.submitReview(d);id=result.id;assert.equal(result.ok,true);assert.equal(context.getPublicReviews().length,0);assert.equal(context.record_(folders.get(id)).status,'pending');assert.equal(folders.get(id).files.length,2);assert.equal(context.submitReview(d).id,id);assert.equal(root.children.length,1);});
test('anonymous callers cannot obtain admin session or pending images',()=>{assert.throws(()=>context.getAdminSession(),/관리자/);assert.throws(()=>context.getReviewPhotos(id,false),/공개/);assert.throws(()=>context.getReviewPhotos(id,true),/관리자/);assert.throws(()=>context.mutateReview(id,'delete','fake'),/관리자/);});
test('non-owner Google user cannot manage reviews',()=>{active='other@example.test';assert.throws(()=>context.getAdminSession(),/관리자/);active='';});
let session;
test('owner can read pending photos but mutation requires valid session',()=>{active='owner@example.test';session=context.getAdminSession();assert.equal(session.reviews.length,1);assert.equal(context.getReviewPhotos(id,true).length,1);assert.throws(()=>context.mutateReview(id,'publish','invalid'),/로그인 시간/);});
test('approval publishes text and permits anonymous image access',()=>{context.mutateReview(id,'publish',session.token);active='';assert.equal(context.getPublicReviews()[0].id,id);assert.equal(context.getReviewPhotos(id,false).length,1);assert.equal('consentAt' in context.getPublicReviews()[0],false);});
test('deletion removes text and images from both public and admin APIs',()=>{active='owner@example.test';context.mutateReview(id,'delete',session.token);assert.equal(context.getAdminSession().reviews.length,0);assert.equal(context.getPublicReviews().length,0);assert.throws(()=>context.getReviewPhotos(id,true),/찾지/);active='';assert.throws(()=>context.getReviewPhotos(id,false),/찾지/);assert.equal(folders.get(id).trash,true);});
test('foreign Drive folders cannot be read or deleted',()=>{const outside=new Folder('other private folder');active='owner@example.test';assert.throws(()=>context.getReviewPhotos(outside.id,true),/찾지/);assert.throws(()=>context.mutateReview(outside.id,'delete',session.token),/찾지/);assert.equal(outside.trash,false);active='';});
test('bad input and photos rejected before storage',()=>{const n=root.children.length;for(const patch of [{rating:6},{body:'짧음'},{consent:false},{storeName:' '},{website:'spam'},{photos:[{data:'data:image/svg+xml;base64,PHN2Zz4='}]},{photos:Array(4).fill({data:'data:image/jpeg;base64,/9j/2Q=='})}])assert.throws(()=>context.submitReview({...draft(),...patch}));assert.equal(root.children.length,n);});
test('interrupted idempotency folder is not reported as saved',()=>{const d=draft(),broken=root.createFolder(d.requestId);const result=context.submitReview(d);assert.equal(broken.trash,true);assert.notEqual(result.id,broken.id);assert.equal(context.record_(folders.get(result.id)).body,d.body);});
test('store name and custom business survive review publication',()=>{const d={...draft(),storeName:'  테스트 매장 해운대점  ',business:'  숯불구이·와인바  '};const result=context.submitReview(d);active='owner@example.test';const token=context.getAdminSession().token;context.mutateReview(result.id,'publish',token);active='';const review=context.getPublicReviews().find(r=>r.id===result.id);assert.equal(review.storeName,'테스트 매장 해운대점');assert.equal(review.business,'숯불구이·와인바');assert.equal('name' in review,false);});
console.log(`${checks} behavioral and authorization checks passed; no external services contacted.`);
