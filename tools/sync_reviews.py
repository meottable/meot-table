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

def main():
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
    print(f'후기 {len(reviews)}건, 사진 {len(keep)}장 동기화')

if __name__ == '__main__':
    main()
