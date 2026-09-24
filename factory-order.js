/* Order text is generated locally. Copying never sends or places an order. */
(function(){
'use strict';
const f=quoteForm.elements;
function orderText(q){return ['[멋:테이블 공장 발주]', '견적번호: '+q.number,'고객/상호: '+q.customer,'','■ 테이블','수량: '+q.tableQty+'개','사이즈: '+q.size,'등급: '+q.grade,'수저통: '+q.cutlery+(q.cutlery==='있음'?' · '+q.cutleryQty+'개':''),'출고일: '+q.shipDate,...(Number(q.chairQty)>0?['','■ 의자','수량: '+q.chairQty+'개']:[]),...(q.memo?['','■ 요청사항',q.memo]:[]),'','위 내용으로 제작 및 출고 일정 확인 부탁드립니다.'].join('\n')}
function complete(q){return ['있음','없음'].includes(q.cutlery)&&/^\d{4}-\d{2}-\d{2}$/.test(q.shipDate||'')&&Number.isInteger(Number(q.tableQty))&&Number(q.tableQty)>0&&String(q.size||'').trim()&&(q.cutlery==='없음'||Number(q.cutleryQty)>0)}
window.showFactoryOrder=function(id){const q=quotes.find(x=>x.id===id);if(!q)return;if(!complete(q)){editQuote(id);alert('발주문을 만들려면 수저통 유무·수량과 출고일을 입력한 뒤 저장하세요.');return}document.getElementById('factoryOrderText').value=orderText(q);document.getElementById('factoryOrderStatus').textContent='복사 후 카카오톡에서 직접 보내주세요.';document.getElementById('factoryOrderDialog').showModal()};
const originalRender=renderQuotes;
renderQuotes=function(){originalRender();document.querySelectorAll('#quoteRows tr').forEach((row,i)=>{const q=quotes[i],actions=row.querySelector('.row-actions');if(!q||!actions)return;const btn=document.createElement('button');btn.type='button';btn.className='icon-btn';btn.textContent='공장 발주 복사';btn.addEventListener('click',()=>showFactoryOrder(q.id));actions.prepend(btn)})};
quoteCalc=function(){const unit=Number(f.tableUnit.value)||priceFor(f.size.value,f.grade.value),cutleryQty=f.cutlery.value==='있음'?Number(f.cutleryQty.value)||0:0,cutleryUnit=Number(f.cutleryUnit.value)||0,supply=unit*(Number(f.tableQty.value)||0)+(Number(f.chairUnit.value)||0)*(Number(f.chairQty.value)||0)+cutleryQty*cutleryUnit,vat=Math.round(supply*.1);$('quoteSupply').textContent=won(supply);$('quoteVat').textContent=won(vat);$('quoteGrand').textContent=won(supply+vat);return{unit,supply,vat,grand:supply+vat}};
// Recalculate after the original listeners so all totals include cutlery.
quoteForm.addEventListener('input',()=>quoteCalc());quoteForm.addEventListener('change',()=>quoteCalc());
f.cutlery.addEventListener('change',()=>{if(f.cutlery.value==='없음')f.cutleryQty.value=0;else if(!Number(f.cutleryQty.value))f.cutleryQty.value=f.tableQty.value;quoteCalc()});
f.tableQty.min='1';f.tableQty.step='1';f.size.required=true;
const originalOpen=openQuote;
openQuote=function(data={}){originalOpen(data);f.cutlery.value=data.cutlery||'';f.cutleryQty.value=data.cutleryQty??0;f.cutleryUnit.value=data.cutleryUnit??28000;f.shipDate.value=data.shipDate||'';quoteCalc()};
quoteForm.onsubmit=function(e){e.preventDefault();if(!quoteForm.reportValidity())return;const d=Object.fromEntries(new FormData(quoteForm)),old=quotes.find(q=>q.id===d.id);d.cutleryQty=d.cutlery==='있음'?Number(d.cutleryQty):0;d.cutleryUnit=Number(d.cutleryUnit)||0;
if(!complete(d)){alert('테이블 수량·사이즈, 수저통 유무·수량, 출고일을 확인해주세요.');return}
const calc=quoteCalc(),date=old?.created||today(),prefix='MT-'+date.replaceAll('-','')+'-';let seq=1;while(quotes.some(q=>q.number===prefix+String(seq).padStart(2,'0')))seq++;
Object.assign(d,calc,{id:d.id||uid('Q'),number:old?.number||prefix+String(seq).padStart(2,'0'),created:date,tableQty:Number(d.tableQty),chairQty:Number(d.chairQty)||0,chairUnit:Number(d.chairUnit)||0,tableUnit:calc.unit});d.factoryOrder=orderText(d);const next=old?quotes.map(q=>q.id===d.id?d:q):[d,...quotes];
try{save(QKEY,next)}catch(_){alert('견적을 저장하지 못했습니다. 저장 공간을 확인해주세요.');return}quotes=next;quoteDialog.close();renderAll();showFactoryOrder(d.id)};
document.getElementById('factoryOrderCopy').addEventListener('click',async()=>{const field=document.getElementById('factoryOrderText'),status=document.getElementById('factoryOrderStatus');try{await navigator.clipboard.writeText(field.value);status.textContent='복사했습니다. 공장 카카오톡에 붙여넣어 보내주세요.'}catch(_){field.focus();field.select();field.setSelectionRange(0,field.value.length);status.textContent='내용을 전체 선택했습니다. 길게 눌러 복사해주세요.'}});
renderQuotes();
})();
