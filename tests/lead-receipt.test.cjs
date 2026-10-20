const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const code=fs.readFileSync(__dirname+'/../lead-db.js','utf8');
const requestId='12345678-1234-4234-8234-123456789abc';
function setup(response){
 const events=[];let calls=0;
 const ctx={window:{meotAnalytics:{track:n=>events.push(n)}},document:{addEventListener(){},dispatchEvent:e=>events.push(e.type)},location:{href:'https://meottable.github.io/meot-table/'},URLSearchParams,AbortController,setTimeout,clearTimeout,CustomEvent:class{constructor(type){this.type=type;}},fetch:async()=>{calls++;if(response instanceof Error)throw response;return response;}};
 vm.runInNewContext(code,ctx);
 return {save:ctx.window.meotLeadDb.save,events,calls:()=>calls};
}
const data={requestId,phone:'010-0000-0000',consent:true,memo:'TEST ONLY'};
test('only matching saved receipt counts as success',async()=>{const t=setup({ok:true,type:'cors',json:async()=>({ok:true,status:'saved',requestId})});assert.equal((await t.save(data)).status,'saved');assert.deepEqual(t.events,['lead_saved','meot:lead-saved']);});
for(const [name,response] of Object.entries({opaque:{ok:true,type:'opaque'},http:{ok:false},wrongId:{ok:true,json:async()=>({ok:true,status:'saved',requestId:'wrong'})},legacy:{ok:true,json:async()=>({ok:true})},html:{ok:true,json:async()=>{throw Error('not json');}},network:Error('network')}))test(name+' never marks saved',async()=>{const t=setup(response);await assert.rejects(t.save(data));assert.deepEqual(t.events,[]);});
test('missing consent prevents network request',async()=>{const t=setup({});await assert.rejects(t.save({...data,consent:false}));assert.equal(t.calls(),0);});
test('invalid phone prevents network request',async()=>{const t=setup({});await assert.rejects(t.save({...data,phone:'123'}));assert.equal(t.calls(),0);});
