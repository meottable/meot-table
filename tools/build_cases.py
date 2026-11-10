"""홈페이지(index.html)의 납품 사례 섹션을 읽어 /cases/ 페이지를 만듭니다.

사용법: python tools/build_cases.py
- cases/index.html  : 납품 사례 목록
- cases/case-NN.html: 사례별 상세 페이지
- sitemap.xml       : 사례 페이지 주소를 자동으로 갱신
홈페이지 사례 내용을 고친 뒤 다시 실행하면 페이지도 같이 바뀝니다.
"""
import html
import json
import os
import re
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://meottable.com"
KAKAO = "https://pf.kakao.com/_BZeSX/chat"
PHONE = "010-6292-8562"

CAT_KO = {
    "RESTAURANT": "식당", "DINING": "다이닝", "K-BBQ": "고깃집", "GROUP DINING": "단체석",
    "PRIVATE DINING": "단체 다이닝", "PRIVATE ROOM": "룸", "CASUAL DINING": "캐주얼 다이닝",
    "COMMERCIAL": "대형 매장", "FAMILY DINING": "패밀리 다이닝",
}


def text(x):
    return html.unescape(re.sub(r"<[^>]+>", "", x)).strip()


def esc(x):
    return html.escape(x, quote=True)


def read_cases():
    src = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
    a = src.find('id="full-portfolio"')
    b = src.find("</section>", a)
    sec = src[a:b]
    out = []
    for c in re.findall(r'<article class="portfolioCase[^"]*">(.*?)</article>', sec, re.S):
        words = [w.strip() for w in re.sub(r"<[^>]+>", "\n", c).split("\n") if w.strip()]
        k = words.index("CASE")
        h3 = re.findall(r"<h3[^>]*>(.*?)</h3>", c, re.S)
        ps = re.findall(r"<p[^>]*>(.*?)</p>", c, re.S)
        lis = re.findall(r"<li[^>]*>(.*?)</li>", c, re.S)
        imgs = re.findall(r'<img src="([^"]+)" alt="([^"]*)"', c)
        out.append({
            "num": words[k + 1], "cat": words[k + 2], "title": text(h3[0]),
            "desc": text(ps[-1]), "tags": [text(x) for x in lis], "imgs": imgs,
        })
    return out


CSS = """
:root{--green:#173a2b;--green2:#21503b;--paper:#f4efe6;--ink:#1c1a16;--muted:#6b665d;--line:#ddd5c7;--gold:#c89438}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;font-family:Pretendard,"Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif;color:var(--ink);background:#fff;line-height:1.65;word-break:keep-all}
a{color:inherit}img{max-width:100%;display:block}
.top{background:var(--paper);border-bottom:1px solid var(--line)}
.top .in{max-width:1080px;margin:0 auto;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px}
.brand{font-weight:800;font-size:22px;color:var(--green);text-decoration:none;letter-spacing:-.5px}
.tel{background:var(--green);color:#fff;text-decoration:none;border-radius:999px;padding:8px 16px;font-weight:700;font-size:14px;white-space:nowrap}
main{max-width:1080px;margin:0 auto;padding:28px 20px 60px}
.crumb{font-size:13px;color:var(--muted);margin-bottom:14px}.crumb a{text-decoration:none}
.eyebrow{color:var(--gold);font-weight:700;font-size:13px;letter-spacing:.08em;margin:0}
h1{font-size:clamp(26px,4.4vw,38px);line-height:1.3;margin:6px 0 12px;letter-spacing:-.8px}
.lead{font-size:17px;color:#3c3a35;margin:0 0 18px;max-width:760px}
.tags{display:flex;flex-wrap:wrap;gap:8px;padding:0;margin:0 0 26px;list-style:none}
.tags li{background:var(--paper);border:1px solid var(--line);border-radius:999px;padding:5px 12px;font-size:14px}
.photos{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.photos img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:6px;background:#eee}
.photos img:first-child{grid-column:1/-1;aspect-ratio:16/9}
.cta{margin:34px 0 0;background:var(--green);color:#fff;border-radius:10px;padding:26px 22px}
.cta h2{margin:0 0 6px;font-size:22px}.cta p{margin:0 0 16px;color:#d9e3dc}
.btns{display:flex;flex-wrap:wrap;gap:10px}
.btn{display:inline-block;text-decoration:none;font-weight:700;border-radius:8px;padding:12px 18px}
.btn-gold{background:#e7c27d;color:#1c1a16}.btn-line{border:1px solid #9fb5a8;color:#fff}
.more{margin-top:40px}.more h2{font-size:20px;margin:0 0 14px}
.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.card{text-decoration:none;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:#fff;display:flex;flex-direction:column}
.card img{aspect-ratio:4/3;object-fit:cover;width:100%}
.card div{padding:12px 14px 16px}.card b{display:block;font-size:16px;margin:2px 0 4px}.card span{font-size:12px;color:var(--gold);font-weight:700}
.card p{margin:0;font-size:14px;color:var(--muted)}
.note{font-size:13px;color:var(--muted);margin-top:26px}
footer{border-top:1px solid var(--line);background:var(--paper);font-size:13px;color:var(--muted)}
footer .in{max-width:1080px;margin:0 auto;padding:20px}
@media(max-width:760px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.photos{gap:6px}}
@media(max-width:460px){.grid{grid-template-columns:1fr}.top .in{padding:12px 16px}main{padding:22px 16px 48px}}
"""


def head(title, desc, url, image, extra_ld):
    ld = json.dumps(extra_ld, ensure_ascii=False)
    return f"""<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="{url}">
<link rel="icon" href="/favicon.svg">
<meta property="og:type" content="article"><meta property="og:site_name" content="멋:테이블">
<meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{url}"><meta property="og:image" content="{SITE}{image}"><meta property="og:locale" content="ko_KR">
<link rel="stylesheet" href="/cases/cases.css">
<script type="application/ld+json">{ld}</script>
</head><body>
<header class="top"><div class="in"><a class="brand" href="/">멋:테이블</a><a class="tel" href="tel:{PHONE}">{PHONE}</a></div></header>
"""


FOOT = f"""<footer><div class="in">멋:테이블 · 업소용 테이블·의자 맞춤 제작 · 부산 연제구 과정로226번길 10, 2층 (상담) · 김해 공장 직접 제작 · {PHONE}</div></footer>
</body></html>
"""

CTA = f"""<section class="cta"><h2>우리 매장도 이렇게 맞출 수 있을까요?</h2>
<p>매장 사진 한 장과 좌석 수만 알려주세요. 크기·배치·견적을 함께 잡아드립니다.</p>
<div class="btns"><a class="btn btn-gold" href="{KAKAO}" rel="noopener">카카오톡 견적 상담</a><a class="btn btn-line" href="tel:{PHONE}">전화 상담 {PHONE}</a><a class="btn btn-line" href="/#estimate">10초 예상견적</a></div></section>
"""


def card(c, prefix=""):
    src, alt = c["imgs"][0]
    cat = CAT_KO.get(c["cat"], c["cat"])
    return (f'<a class="card" href="{prefix}case-{c["num"]}.html"><img src="{src}" alt="{esc(c["title"])} 대표 사진" loading="lazy" decoding="async">'
            f'<div><span>CASE {c["num"]} · {esc(cat)}</span><b>{esc(c["title"])}</b><p>{esc(c["desc"])}</p></div></a>')


def build():
    cases = read_cases()
    outdir = os.path.join(ROOT, "cases")
    os.makedirs(outdir, exist_ok=True)
    open(os.path.join(outdir, "cases.css"), "w", encoding="utf-8").write(CSS.strip() + "\n")

    for i, c in enumerate(cases):
        url = f"{SITE}/cases/case-{c['num']}.html"
        cat = CAT_KO.get(c["cat"], c["cat"])
        title = f"{c['title']} | 업소용 테이블 납품 사례 | 멋:테이블"
        desc = f"{c['desc']} {', '.join(c['tags'])}. 김해 공장에서 직접 제작한 업소용 테이블 납품 사례입니다."
        ld = [
            {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "멋:테이블", "item": f"{SITE}/"},
                {"@type": "ListItem", "position": 2, "name": "납품 사례", "item": f"{SITE}/cases/"},
                {"@type": "ListItem", "position": 3, "name": c["title"], "item": url}]},
            {"@context": "https://schema.org", "@type": "Article", "headline": c["title"], "description": desc,
             "image": [SITE + s for s, _ in c["imgs"]], "url": url,
             "author": {"@type": "Organization", "name": "멋:테이블", "url": f"{SITE}/"},
             "publisher": {"@type": "Organization", "name": "멋:테이블", "url": f"{SITE}/"}},
        ]
        photos = "".join(
            f'<img src="{s}" alt="{esc(c["title"])} 사진 {n}" {"" if n == 1 else "loading=\"lazy\" "}decoding="async">'
            for n, (s, _) in enumerate(c["imgs"], 1))
        tags = "".join(f"<li>{esc(t)}</li>" for t in c["tags"])
        others = [o for o in cases if o is not c]
        others = (others[i:] + others[:i])[:3]
        page = head(title, desc, url, c["imgs"][0][0], ld) + f"""<main>
<nav class="crumb"><a href="/">홈</a> › <a href="/cases/">납품 사례</a> › CASE {c['num']}</nav>
<p class="eyebrow">CASE {c['num']} · {esc(cat)} 업소용 테이블</p>
<h1>{esc(c['title'])}</h1>
<p class="lead">{esc(c['desc'])}</p>
<ul class="tags">{tags}</ul>
<div class="photos">{photos}</div>
{CTA}<section class="more"><h2>다른 납품 사례</h2><div class="grid">{''.join(card(o) for o in others)}</div>
<p class="note"><a href="/cases/">납품 사례 전체 보기 →</a></p></section>
<p class="note">사진은 실제 납품 매장입니다. 사진 속 다리·의자·기기 등 구성품의 포함 여부와 비용은 상담 시 확인합니다. 나뭇결·돌무늬는 LPM 표면 패턴이며 원목·천연석이 아닙니다.</p>
</main>
""" + FOOT
        open(os.path.join(outdir, f"case-{c['num']}.html"), "w", encoding="utf-8").write(page)

    url = f"{SITE}/cases/"
    title = "업소용 테이블 납품 사례 | 식당·고깃집·카페 | 멋:테이블"
    desc = f"멋:테이블이 김해 공장에서 직접 제작해 납품한 식당·고깃집·단체석 업소용 테이블 사례 {len(cases)}곳. 상판 무늬, 다리 모양, 좌석 배치를 사진으로 확인하세요."
    ld = {"@context": "https://schema.org", "@type": "CollectionPage", "name": "업소용 테이블 납품 사례", "url": url,
          "description": desc, "hasPart": [{"@type": "Article", "headline": c["title"], "url": f"{SITE}/cases/case-{c['num']}.html"} for c in cases]}
    page = head(title, desc, url, cases[0]["imgs"][0][0], ld) + f"""<main>
<nav class="crumb"><a href="/">홈</a> › 납품 사례</nav>
<p class="eyebrow">DELIVERY PORTFOLIO</p>
<h1>업소용 테이블 납품 사례</h1>
<p class="lead">김해 공장에서 직접 만들어 납품한 매장 사진입니다. 식당·고깃집·단체석·룸까지, 매장 크기와 업종에 맞춰 상판 무늬와 다리, 좌석 배치를 맞췄습니다.</p>
<div class="grid">{''.join(card(c) for c in cases)}</div>
{CTA}</main>
""" + FOOT
    open(os.path.join(outdir, "index.html"), "w", encoding="utf-8").write(page)

    # sitemap
    sm = os.path.join(ROOT, "sitemap.xml")
    s = open(sm, encoding="utf-8").read()
    s = re.sub(r"\s*<url>\s*<loc>https://meottable\.com/cases/[^<]*</loc>.*?</url>", "", s, flags=re.S)
    today = date.today().isoformat()
    add = "".join(
        f"\n  <url>\n    <loc>{u}</loc>\n    <lastmod>{today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>{p}</priority>\n  </url>"
        for u, p in [(f"{SITE}/cases/", "0.8")] + [(f"{SITE}/cases/case-{c['num']}.html", "0.6") for c in cases])
    s = s.replace("\n</urlset>", add + "\n</urlset>")
    open(sm, "w", encoding="utf-8").write(s)
    print(f"사례 {len(cases)}개 페이지 생성")


if __name__ == "__main__":
    build()
