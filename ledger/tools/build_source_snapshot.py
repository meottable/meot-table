"""Build the encrypted website projection from the authoritative workbook.
No connection key or plaintext financial records are written into the repository.
"""
import argparse, base64, datetime as dt, hashlib, json, os, re
from pathlib import Path
from zoneinfo import ZoneInfo
import openpyxl
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

def decode(value): return base64.urlsafe_b64decode(value + '=' * (-len(value) % 4))
def text(value): return str(value or '').strip()
def blank(value): return value is None or value == ''
def amount(value):
    if value is None or value == '': return 0
    if isinstance(value, bool) or not isinstance(value, (int,float)) or int(value) != value or not 0 <= value <= 10**12: raise ValueError('Invalid numeric cell; recalculate and verify the workbook before publishing')
    return int(value)
def date(value):
    if not value: return ''
    if isinstance(value, (dt.date, dt.datetime)): return value.strftime('%Y-%m-%d')
    value=str(value)[:10]
    dt.date.fromisoformat(value)
    return value

def table(sheet,first):
    rows=list(sheet.values)
    header=next(i for i,r in enumerate(rows) if text(r[0])==first)
    names=[text(x).replace('\n','') for x in rows[header]]
    return [dict(zip(names,r)) for r in rows[header+1:] if r[0] is not None]

def projection(path):
    book=openpyxl.load_workbook(path,data_only=True)
    orders=[]
    for r in table(book['주문관리'],'주문일'):
        if not r.get('견적번호'): continue
        total=amount(r['총 계약금액']);adjustment=amount(r.get('정산 차감액'))
        unknown=text(r.get('결제상태'))=='입금 미확인'
        if unknown:
            if adjustment or any(not blank(r[k]) for k in ['계약금 입금','잔금 입금','총입금','미수금']): raise ValueError('Unknown payment contains amounts; verify the workbook')
            paid=balance=None
        else:
            paid=amount(r['계약금 입금'])+amount(r['잔금 입금'])
            balance=total-paid-adjustment
            if any(blank(r[k]) for k in ['총입금','미수금']) or balance<0 or paid!=amount(r['총입금']) or balance!=amount(r['미수금']): raise ValueError('Order totals/formula cache disagree; do not publish')
        orders.append(dict(date=date(r['주문일']),number=text(r['견적번호']),name=text(r['고객/상호']) or '상호 미정',size=text(r['규격']),grade=text(r['등급']),tables=amount(r['테이블']),chairs=amount(r['의자']),cutlery=amount(r['수저통']),amount=total,paymentStatus='unknown' if unknown else 'known',paid=paid,balance=balance,production=text(r['생산상태']),deliveryDate=date(r.get('납품예정일')),delivery=text(r['납품상태']),note=text(r['비고'])))
    sale_rows=table(book['매출입력'],'거래일자')
    sales={text(r['견적번호']):r for r in sale_rows if r.get('견적번호')}
    if len(orders)!=len(sales) or len({o['number'] for o in orders})!=len(orders): raise ValueError('Duplicate or unmatched order/sales records')
    for o in orders:
        r=sales[o['number']]
        unknown=text(r.get('결제상태'))=='입금 미확인'
        if unknown:
            if any(not blank(r[k]) for k in ['입금액','미수금']): raise ValueError('Unknown sales payment contains amounts; verify the workbook')
            paid=balance=None
        else:
            if any(blank(r[k]) for k in ['입금액','미수금']): raise ValueError('Missing sales payment cache; do not publish')
            paid=amount(r['입금액']);balance=amount(r['미수금'])
        if unknown!=(o['paymentStatus']=='unknown') or (o['amount'],o['paid'],o['balance']) != (amount(r['합계금액']),paid,balance): raise ValueError('Sales and order ledger disagree; do not publish')
    cash=[]
    for r in table(book['모바일입력'],'날짜'):
        if r.get('입출금') not in ['입금','출금']: continue
        if r.get('금액') is None or amount(r['금액'])<=0: raise ValueError('Incomplete cash amount; do not publish')
        cash.append(dict(date=date(r['날짜']),type=r['입출금'],category=text(r['분류']),name=text(r['내용/거래처']),amount=amount(r['금액']),note=text(r['메모'])))
    if not orders: raise ValueError('No orders: refusing to erase the website projection')
    for row in book['영업관리'].values:
        if text(row[0])=='월 목표': break
    # The current approved default is KRW 10,000,000; the dashboard stores its value below its label.
    target=10000000
    rows=list(book['영업관리'].values)
    for i,row in enumerate(rows[:-1]):
        if text(row[0])=='월 목표' and isinstance(rows[i+1][0],(int,float)): target=amount(rows[i+1][0]);break
    return dict(schema=3,target=target,orders=orders,cash=cash)

def main():
    p=argparse.ArgumentParser();p.add_argument('--xlsx',required=True);p.add_argument('--access',required=True);p.add_argument('--previous',required=True);p.add_argument('--source-version',type=int,required=True);p.add_argument('--modified-at',required=True);p.add_argument('--output',required=True);p.add_argument('--status-output',required=True);a=p.parse_args()
    access=Path(a.access).read_text();match=re.search(r'(?:#|&|&amp;)key=([A-Za-z0-9_-]{43})',access)
    if not match: raise ValueError('Existing ledger connection not found')
    key=decode(match.group(1));box=json.loads(Path(a.previous).read_text());previous=json.loads(AESGCM(key).decrypt(decode(box['iv']),decode(box['data']),None))
    if previous.get('schema') not in (1,3): raise ValueError('Unexpected previous source format')
    source=projection(a.xlsx)
    digest=hashlib.sha256(json.dumps(source,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
    old_version=int(previous.get('source',{}).get('version',0))
    if a.source_version<old_version: raise ValueError('Stale Library version; do not publish')
    if previous.get('source',{}).get('contentHash')==digest and a.source_version==old_version:
        print(json.dumps(dict(changed=False,sourceVersion=old_version)));return
    if a.source_version==old_version and old_version: raise ValueError('Different content at same version; investigate before publishing')
    now=dt.datetime.now(dt.timezone.utc).isoformat()
    source['updated']=dt.datetime.fromisoformat(a.modified_at.replace('Z','+00:00')).astimezone(ZoneInfo('Asia/Seoul')).date().isoformat();source['source']=dict(version=a.source_version,modifiedAt=a.modified_at,syncedAt=now,contentHash=digest,name='멋테이블_월별_매출기록표.xlsx')
    source['legacy']=previous.get('legacy') or {k:previous[k] for k in ['schema','updated','target','orders','cash']}
    iv=os.urandom(12);cipher=AESGCM(key).encrypt(iv,json.dumps(source,ensure_ascii=False,separators=(',',':')).encode(),None)
    encoded=dict(iv=base64.b64encode(iv).decode(),data=base64.b64encode(cipher).decode())
    assert json.loads(AESGCM(key).decrypt(iv,cipher,None))==source
    Path(a.output).write_text(json.dumps(encoded,separators=(',',':'))+'\n')
    Path(a.status_output).write_text(json.dumps(dict(sourceVersion=a.source_version,sourceModifiedAt=a.modified_at,publishedAt=now,contentHash=digest),separators=(',',':'))+'\n')
    print(json.dumps(dict(changed=True,sourceVersion=a.source_version,orders=len(source['orders']),cash=len(source['cash']),paymentUnknownCount=sum(o['paymentStatus']=='unknown' for o in source['orders']))))
if __name__=='__main__': main()

