"""Google 후기 → 홈페이지 저장본(reviews/reviews.json + reviews/photos/*.webp) 동기화.
사용: python tools/sync_reviews.py   (환경변수 REVIEWS_EXPORT_URL 이 있으면 그 주소 사용)
"""
import base64, hashlib, io, json, os, re, sys, urllib.request
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'reviews')
PHOTOS = os.path.join(OUT, 'photos')

def export_url():
    url = os.environ.get('REVIEWS_EXPORT_URL')
    if not url:
        cfg = open(os.path.join(ROOT, 'reviews-config.js'), encoding='utf-8').read()
        url = re.search(r'publicUrl:\s*"([^"]+)"', cfg).group(1)
    return url + ('&' if '?' in url else '?') + 'format=json'

def fetch():
    req = urllib.request.Request(export_url(), headers={'User-Agent': 'meottable-review-sync'})
    with urllib.request.urlopen(req, timeout=120) as r:
        data = json.loads(r.read().decode('utf-8'))
    if not isinstance(data, dict) or not isinstance(data.get('reviews'), list):
        raise SystemExit('후기 응답 형식이 올바르지 않습니다: Apps Script에 format=json 내보내기가 연결됐는지 확인하세요.')
    return data['reviews']

def save_photo(review_id, i, data_url):
    m = re.match(r'data:image/[a-z]+;base64,(.+)$', data_url or '', re.S)
    if not m:
        return None
    raw = base64.b64decode(m.group(1))
    name = f"{re.sub(r'[^A-Za-z0-9_-]', '', str(review_id))[:40]}-{i+1}-{hashlib.sha1(raw).hexdigest()[:8]}.webp"
    path = os.path.join(PHOTOS, name)
    if not os.path.exists(path):
        im = Image.open(io.BytesIO(raw)).convert('RGB')
        im.thumbnail((1200, 1200))
        im.save(path, 'WEBP', quality=78, method=6)
    return 'photos/' + name

GRADE = {'기본형': '스탠다드', '중급형': '프로', '고급형': '시그니처'}

def build_page(reviews):
    """검색엔진·AI가 자바스크립트 없이 읽을 수 있는 후기 전문 페이지(reviews/index.html)."""
    from html import escape as e
    avg = sum(r['rating'] for r in reviews) / len(reviews) if reviews else 0
    cards = []
    for r in reviews:
        store = r['storeName'] or '고객님'
        grade = GRADE.get(r['grade'], r['grade'])
        tags = ' · '.join(x for x in [r['business'], (grade + ' 테이블') if grade else ''] if x)
        imgs = ''.join(
            f'<img src="{e(p)}" alt="{e(store)} 매장에 납품한 업소용 테이블 사진" loading="lazy" decoding="async" width="640" height="480">'
            for p in r['photos'])
        body = ''.join(f'<p>{e(line)}</p>' for line in r['body'].splitlines() if line.strip())
        cards.append(
            f'<article class="rv"><h2>{e(store)}</h2>'
            f'<p class="meta"><span aria-label="별점 {r["rating"]}점">{"★" * r["rating"]}</span>'
            f'{" · " + e(tags) if tags else ""}{" · <time datetime=" + chr(34) + e(r["created"]) + chr(34) + ">" + e(r["created"].replace("-", ".")) + "</time>" if r["created"] else ""}</p>'
            f'<div class="body">{body}</div>{"<div class=" + chr(34) + "ph" + chr(34) + ">" + imgs + "</div>" if imgs else ""}</article>')
    desc = (f'멋:테이블 업소용 테이블을 받은 식당·고깃집 사장님 후기 {len(reviews)}건 전문. '
            f'평균 별점 {avg:.1f}점. 김해 공장에서 직접 제작한 테이블의 실제 사용 후기와 매장 사진.')
    ld = json.dumps([
        {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': '멋:테이블', 'item': 'https://meottable.com/'},
            {'@type': 'ListItem', 'position': 2, 'name': '고객 후기', 'item': 'https://meottable.com/reviews/'}]},
        {'@context': 'https://schema.org', '@type': 'WebPage', 'name': '멋:테이블 고객 후기',
         'url': 'https://meottable.com/reviews/', 'description': desc,
         'about': {'@type': 'FurnitureStore', 'name': '멋:테이블', 'url': 'https://meottable.com/'}},
    ], ensure_ascii=False)
    page = f'''<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>업소용 테이블 고객 후기 {len(reviews)}건 | 멋:테이블</title>
<meta name="description" content="{e(desc)}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="https://meottable.com/reviews/">
<link rel="icon" href="/favicon.svg">
<meta property="og:type" content="website"><meta property="og:site_name" content="멋:테이블">
<meta property="og:title" content="업소용 테이블 고객 후기 {len(reviews)}건 | 멋:테이블"><meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="https://meottable.com/reviews/"><meta property="og:image" content="https://meottable.com/images/og/og-meottable-1200x630.jpg"><meta property="og:locale" content="ko_KR">
<link rel="stylesheet" href="/cases/cases.css">
<style>.sum{{font-size:18px;font-weight:700;color:var(--green);margin:0 0 22px}}.list{{display:grid;gap:18px}}.rv{{border:1px solid var(--line);border-radius:14px;padding:20px;background:#fff}}.rv h2{{font-size:19px;margin:0 0 4px}}.rv .meta{{color:var(--muted);font-size:14px;margin:0 0 10px}}.rv .meta span{{color:var(--gold)}}.rv .body p{{margin:0 0 6px}}.rv .ph{{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:12px}}.rv .ph img{{width:100%;height:auto;aspect-ratio:4/3;object-fit:cover;border-radius:8px}}.cta{{display:inline-block;margin-top:26px;background:var(--green);color:#fff;text-decoration:none;border-radius:999px;padding:12px 22px;font-weight:700}}</style>
<script type="application/ld+json">{ld}</script>
</head><body>
<header class="top"><div class="in"><a class="brand" href="/">멋:테이블</a><a class="tel" href="tel:010-6292-8562">010-6292-8562</a></div></header>
<main>
<nav class="crumb"><a href="/">홈</a> › 고객 후기</nav>
<p class="eyebrow">CUSTOMER REVIEWS</p>
<h1>사장님이 직접 남긴 후기</h1>
<p class="lead">멋:테이블 업소용 테이블을 받아 매장에서 쓰고 계신 사장님들의 후기입니다. 받은 그대로 옮겼습니다.</p>
<p class="sum">★ {avg:.1f} · 후기 {len(reviews)}건</p>
<div class="list">{''.join(cards) or '<p>첫 후기를 기다리고 있어요.</p>'}</div>
<a class="cta" href="https://pf.kakao.com/_BZeSX/chat">우리 매장 견적 상담 →</a>
<p style="margin-top:18px"><a href="/cases/">납품 사례 보기 →</a></p>
</main>
<footer><div class="in">멋:테이블 · 업소용 테이블·의자 맞춤 제작 · 부산 연제구 과정로226번길 10, 2층 (상담) · 김해 공장 직접 제작 · 010-6292-8562</div></footer>
</body></html>
'''
    path = os.path.join(OUT, 'index.html')
    old = open(path, encoding='utf-8').read() if os.path.exists(path) else ''
    if page != old:
        open(path, 'w', encoding='utf-8').write(page)

def main():
    if '--page-only' in sys.argv:
        build_page(json.load(open(os.path.join(OUT, 'reviews.json'), encoding='utf-8'))['reviews'])
        print('후기 페이지만 다시 만들었습니다')
        return
    os.makedirs(PHOTOS, exist_ok=True)
    reviews, keep = [], set()
    for r in fetch():
        body = str(r.get('body') or '').strip()
        if not body:
            continue
        photos = [p for i, d in enumerate((r.get('photos') or [])[:3]) if (p := save_photo(r.get('id'), i, d))]
        keep.update(os.path.basename(p) for p in photos)
        reviews.append({
            'id': str(r.get('id') or ''),
            'storeName': str(r.get('storeName') or r.get('name') or '').strip(),
            'business': str(r.get('business') or '').strip(),
            'grade': str(r.get('grade') or '').strip(),
            'rating': max(1, min(5, int(float(r.get('rating') or 5)))),
            'created': str(r.get('created') or '')[:10],
            'body': body,
            'photos': photos,
        })
    reviews.sort(key=lambda x: x['created'], reverse=True)
    for f in os.listdir(PHOTOS):
        if f.endswith('.webp') and f not in keep:
            os.remove(os.path.join(PHOTOS, f))
    path = os.path.join(OUT, 'reviews.json')
    new = json.dumps({'schemaVersion': 1, 'reviews': reviews}, ensure_ascii=False, indent=1)
    old = open(path, encoding='utf-8').read() if os.path.exists(path) else ''
    if new != old:
        open(path, 'w', encoding='utf-8').write(new)
    build_page(reviews)
    print(f'후기 {len(reviews)}건, 사진 {len(keep)}장 동기화')

if __name__ == '__main__':
    main()
