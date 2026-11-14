const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../ledger/ledger.js'),'utf8');
const body=source.slice(source.indexOf('function connectionKey('),source.indexOf('\nasync function unlock'));
const key='A'.repeat(43);
for(const origin of ['https://meottable.com/ledger/','https://meottable.github.io/meot-table/ledger/','http://localhost:8080/ledger/']){
 const ctx={URL,URLSearchParams,location:new URL(origin)};vm.createContext(ctx);vm.runInContext(body,ctx);
 for(const value of [key,' '+key+'\n','https://meottable.com/ledger/#key='+key,'https://meottable.com/ledger?app=20261114-1#key='+key,'https://meottable.com/ledger/index.html#key='+key,'https://meottable.github.io/meot-table/ledger/?app=20261015-2#key='+key,origin+'#key='+key]){
  assert.equal(ctx.connectionKey(value),key,'accept '+origin+' '+value);
 }
 for(const value of ['',key.slice(1),'not a link','https://example.com/ledger/#key='+key,'https://meottable.com.evil.example/ledger/#key='+key,'https://meottable.github.io/other/ledger/#key='+key,'https://meottable.com/ledger/other/#key='+key,'https://meottable.com/ledger/?key='+key,'https://meottable.com/ledger/#key=short','https://user@meottable.com/ledger/#key='+key,'http://meottable.com/ledger/#key='+key]){
  assert.equal(ctx.connectionKey(value),'','reject '+origin+' '+value);
 }
}
const html=fs.readFileSync(require('node:path').join(__dirname,'../ledger/index.html'),'utf8');
const sw=fs.readFileSync(require('node:path').join(__dirname,'../ledger/sw.js'),'utf8');
const version=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'../ledger/app-version.json'),'utf8')).version;
assert(html.includes('data-ledger-build="'+version+'"'));
assert(html.includes('ledger.js?v='+version));
assert(sw.includes('ledger.js?v='+version));
new vm.Script(source);
console.log('PASS: legacy and current links, raw codes, invalid/untrusted links, syntax and build consistency');
