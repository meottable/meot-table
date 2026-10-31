const {chromium}=require('playwright');
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),legacy=process.env.LEGACY_LEDGER_DIR;
if(!legacy)throw Error('Set LEGACY_LEDGER_DIR to the ledger directory from commit 199dce7164e897d6571fdc3c499a2d12b31b5fa6');
const current=JSON.parse(fs.readFileSync(path.join(root,'ledger/app-version.json'),'utf8')).version;
const future=current.replace(/-(\d+)$/,(_,n)=>'-'+(Number(n)+1));
const key=crypto.randomBytes(32),access=key.toString('base64url');
const seed={schema:1,updated:'2026-10-12',source:{version:45,modifiedAt:'2026-10-12T11:00:00Z'},target:10000000,orders:[{date:'2026-10-12',number:'QA-PAID',name:'검증용 기존 매장',amount:1000000,paid:1000000,balance:0,size:'테스트',note:'가상 자료'}],cash:[{date:'2026-10-12',type:'입금',name:'검증용 기존 매장',category:'잔금',amount:1000000,note:'가상 자료'}]};
const latest=JSON.parse(JSON.stringify(seed));latest.schema=3;latest.source={version:47,modifiedAt:'2026-10-15T09:00:00Z'};latest.updated='2026-10-15';latest.legacy=JSON.parse(JSON.stringify(seed));latest.orders.push({date:'2026-10-15',number:'QA-UNKNOWN',name:'검증용 새 매장',amount:2000000,paymentStatus:'unknown',paid:null,balance:null,size:'테스트'});
function encrypt(value){const iv=crypto.randomBytes(12),c=crypto.createCipheriv('aes-256-gcm',key,iv),bytes=Buffer.concat([c.update(JSON.stringify(value)),c.final(),c.getAuthTag()]);return JSON.stringify({iv:iv.toString('base64'),data:bytes.toString('base64')});}
let stage=0;
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost'),base=path.basename(u.pathname);res.setHeader('Cache-Control','max-age=3600');
 if(base==='snapshot.enc.json'){res.setHeader('Content-Type','application/json');return res.end(encrypt(stage?latest:seed));}
 if(base==='app-version.json'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({version:stage>=2?future:current}));}
 if(/\.(png|svg)$/.test(base)){res.setHeader('Content-Type','image/png');return res.end(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64'));}
 const file=path.join(stage?path.join(root,'ledger'):legacy,u.pathname.endsWith('/')?'index.html':base);
 if(!fs.existsSync(file)){res.statusCode=404;return res.end('not found');}
 let content=fs.readFileSync(file);if(stage>=2&&['index.html','sw.js'].includes(path.basename(file)))content=Buffer.from(content.toString().replaceAll(current,future).replace(/meot-ledger-shell-([^']+)/g,'meot-ledger-shell-test-$1'));
 res.setHeader('Content-Type',mime[path.extname(file)]||'text/plain');res.end(content);
});
async function run(){
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const url='http://127.0.0.1:'+server.address().port+'/ledger/';await p.clock.install({time:new Date('2026-10-15T10:16:00Z')});await p.goto(url+'#key='+access);await p.locator('#app').waitFor({state:'visible'});await p.locator('#addOrder:not([disabled])').waitFor();await p.waitForFunction(()=>!!navigator.serviceWorker.controller);
 await p.click('#addOrder');await p.fill('#orderName','기기 입력 검증용');await p.fill('#orderNumber','QA-LOCAL');await p.fill('#orderAmount','100000');await p.click('#orderForm button[type=submit]');await p.locator('#orderDialog').waitFor({state:'hidden'});assert.equal(await p.locator('#revenue').innerText(),'1,100,000원');
 stage=1;await p.click('#syncSource');await p.locator('#syncStatus').filter({hasText:'형식이 올바르지 않습니다'}).waitFor();assert.equal(await p.locator('#revenue').innerText(),'1,100,000원');
 // User opens the cache-busting link in the same browser, without passing a key again.
 await p.goto(url+'?app='+current);await p.locator('#app').waitFor({state:'visible'});await p.locator('#syncStatus').filter({hasText:'원본 v47'}).waitFor();assert.equal(await p.locator('html').getAttribute('data-ledger-build'),current);assert.equal(await p.locator('#revenue').innerText(),'3,100,000원');assert.equal(await p.locator('#received').innerText(),'1,000,000원');assert.equal(await p.locator('.record').filter({hasText:'QA-LOCAL'}).count(),1);assert.equal(await p.locator('.record').filter({hasText:'QA-UNKNOWN'}).count(),1);
 assert.equal(await p.evaluate(()=>new URLSearchParams(location.hash.slice(1)).get('key')),access);
 // A subsequent app release waits for an unsaved draft, then refreshes safely.
 await p.click('#addOrder');await p.fill('#orderName','업데이트 중 작성');await p.fill('#orderNumber','QA-DRAFT');await p.fill('#orderAmount','300000');
 stage=2;await p.evaluate(()=>MeotLedgerAppUpdate.check());assert.equal(await p.locator('html').getAttribute('data-ledger-build'),current);assert.equal(await p.locator('#orderName').inputValue(),'업데이트 중 작성');assert.match(await p.locator('#appUpdateStatus').innerText(),/저장하거나 닫으면/);
 await p.click('#orderForm button[type=submit]');await p.locator('#orderDialog').waitFor({state:'hidden'});await p.clock.fastForward(2000);await p.waitForURL(u=>u.searchParams.get('app')===future);await p.locator('#syncStatus').filter({hasText:'원본 v47'}).waitFor();assert.equal(await p.locator('#revenue').innerText(),'3,400,000원');assert.equal(await p.locator('.record').filter({hasText:'QA-DRAFT'}).count(),1);assert.equal(await p.evaluate(()=>new URLSearchParams(location.hash.slice(1)).get('key')),access);
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);await context.close();await browser.close();console.log('PASS: old cached app reproduced; fresh link preserves connection and local entries; future updates preserve unsaved draft and refresh automatically');
}
server.listen(0,'127.0.0.1',async()=>{try{await run();}catch(e){console.error(e.message);process.exitCode=1;}finally{server.close();}});

