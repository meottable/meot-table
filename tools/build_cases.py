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


# 사례별 Q&A: 홈페이지 사례 설명·태그에 있는 사실만 씁니다 (지역·매장명·수치 추가 금지).
# (질문, 답, 관련 가이드 slug 목록)
CASE_QA = {
    "01": ([
        ("4인석과 단체석은 어떻게 함께 구성했나요?", "같은 월넛 투톤 무늬 LPM 상판과 블랙 철제 프레임으로 4인석과 단체석을 맞춰, 테이블을 이어 붙여도 하나의 단체석처럼 보이도록 연결 배치했습니다. 이어 붙일 테이블은 높이·무늬·다리 위치를 똑같이 맞추는 것이 기본입니다."),
        ("월넛 투톤 상판은 원목인가요?", "아닙니다. 월넛 투톤은 LPM 표면 무늬입니다. 같은 패턴을 쓰기 때문에 여러 대를 만들어도 색과 결이 고르게 나옵니다."),
    ], ["table-size", "lpm-top"]),
    "02": ([
        ("테이블과 벤치를 한 세트로 맞추면 무엇이 좋나요?", "벤치 길이와 테이블 배치를 같이 정할 수 있어 앉는 자리가 어긋나지 않고, 높이와 색도 함께 맞출 수 있습니다. 이 매장은 벽면 벤치와 이동식 벤치에 맞춰 테이블을 배치했습니다."),
        ("2인·4인 모듈은 어떻게 쓰나요?", "2인석과 4인석을 같은 규격 체계로 만들어 손님 수에 따라 붙이거나 나눠 씁니다. 붙여 쓸 테이블은 높이와 다리 위치를 맞춰 제작합니다."),
    ], ["table-size", "order-schedule"]),
    "03": ([
        ("붙박이 소파 쪽 테이블은 왜 패널형 다리를 썼나요?", "붙박이 소파는 의자처럼 뒤로 뺄 수 없어 테이블 다리가 무릎에 닿지 않는 것이 중요합니다. 패널형 다리는 모서리 기둥 대신 판 형태로 받쳐 소파 쪽 공간을 확보하기 좋고 옆에서 본 선도 깔끔합니다."),
        ("매립식 불판 테이블을 맞추려면 무엇이 필요한가요?", "불판 모델명 또는 불판 업체 타공 치수, 배기 방식(상부·하부), 좌석 형태가 필요합니다. 불판을 먼저 정하고 그 치수로 상판을 뚫은 뒤 다리를 정합니다."),
    ], ["grill-induction", "table-size"]),
    "04": ([
        ("서랍은 나중에 따로 달 수 있나요?", "서랍은 상판 아래 구조와 맞물려 있어 다리·프레임을 짤 때 함께 정하는 옵션입니다. 이 매장은 스톤 무늬 상판에 태블릿과 서랍을 함께 배치했습니다."),
        ("라운드 모서리와 스톤 무늬는 어떤 사양인가요?", "라운드 모서리는 주문 때 선택하는 모서리 가공이고, 스톤 무늬는 LPM 표면 패턴입니다. 천연석 상판이 아니므로 무게감이나 촉감은 실제 돌과 다릅니다."),
    ], ["lpm-top", "grade-price"]),
    "05": ([
        ("대형 매장 단체석은 어떻게 배치했나요?", "애쉬 무늬 테이블을 이어 배치하면서 홀 가운데에 넓은 통로를 확보했습니다. 중앙 통로를 기준선으로 두면 서빙 동선이 한 줄로 정리되고 손님도 자리를 찾기 쉽습니다."),
        ("모듈형 단체석이란 무엇인가요?", "같은 규격의 테이블을 이어 붙여 단체석을 만들고, 필요하면 다시 나눠 쓰는 구성입니다. 이 매장에는 맞춤 수납 서랍도 함께 넣었습니다."),
    ], ["table-size", "order-schedule"]),
    "06": ([
        ("4인석부터 8인석까지 어떻게 연결하나요?", "같은 브라운 애쉬 무늬 상판과 같은 높이로 만들어 4인석을 기본으로 8인 단체석까지 이어지도록 구성했습니다. 이음 자리가 덜컹이지 않게 다리 위치까지 맞춥니다."),
        ("하부 맞춤 수납은 어떤 옵션인가요?", "상판 아래에 수납 공간을 넣는 구성으로, 다리와 프레임을 설계할 때 함께 정합니다. 앉은 손님 무릎에 닿지 않는 위치로 잡습니다."),
    ], ["table-size", "grade-price"]),
    "07": ([
        ("테이블이 많은 고깃집은 불판 타공을 어떻게 맞추나요?", "타공 기준을 하나 정해 두고 같은 기준으로 모든 상판을 가공합니다. 타공 위치가 조금만 달라도 홀에 줄지어 놓았을 때 불판 라인이 어긋나 보이기 때문입니다."),
        ("4인석과 단체석을 섞어도 불판 위치가 맞나요?", "4인석 1구는 보통 가운데, 단체석은 양쪽 손님 손이 고르게 닿는 거리로 나눠 배치합니다. 이 매장은 짙은 월넛 무늬 LPM 상판에 불판을 매립해 4인석과 단체석을 함께 구성했습니다."),
    ], ["grill-induction", "lpm-top"]),
    "08": ([
        ("룸 테이블에 콘센트를 매립하면 무엇이 좋나요?", "노트북이나 휴대폰 충전이 필요한 모임이 자리에서 바로 쓸 수 있고, 바닥으로 선을 끌어오지 않아 깔끔합니다. 위치는 자리 수와 접시가 놓이는 자리를 함께 보고 정합니다."),
        ("최대 14인 룸 테이블 상담에는 무엇이 필요한가요?", "룸의 가로·세로와 문 폭, 최대 인원, 필요한 콘센트 개수, 의자를 함께 맞출지 여부가 필요합니다. 긴 상판은 반입 경로를 보고 나눠 만들지 정합니다."),
    ], ["order-schedule", "table-size"]),
    "09": ([
        ("콘크리트·스톤 무늬 상판에는 어떤 의자가 어울리나요?", "이 매장은 콘크리트 패턴 LPM 상판에 밝은 우드 톤 의자를 맞췄습니다. 무늬는 의자 샘플과 나란히 놓고 매장 조명 아래에서 확인하면 실패가 적습니다."),
        ("2인·4인 모듈과 하부 수납을 함께 넣을 수 있나요?", "넣을 수 있습니다. 2인석·4인석을 붙였다 뗐다 쓰는 구성에 하부 수납을 더할 때는 붙이는 쪽 다리·프레임 위치를 함께 맞춰 설계합니다."),
    ], ["lpm-top", "table-size"]),
    "10": ([
        ("홀과 룸에 같은 테이블을 쓰면 좋은 점이 있나요?", "이 매장은 홀과 룸 모두 우드 투톤 무늬 LPM 테이블로 맞춰 공간 전체의 톤을 통일했습니다. 같은 무늬로 맞추면 나중에 테이블을 옮기거나 추가할 때도 어색하지 않습니다."),
        ("가변형 좌석 배치는 어떻게 하나요?", "같은 규격 테이블을 인원에 따라 붙이거나 나눠 쓰는 방식입니다. 대형 매장은 테이블보다 운영 통로를 먼저 넓게 잡고 남은 자리에 배치합니다."),
    ], ["table-size", "order-schedule"]),
    "11": ([
        ("파티션·조명 색감에 맞춰 상판을 고르려면 어떻게 하나요?", "인테리어 사진을 보내 주시면 비슷한 톤의 무늬를 골라 드리고, 샘플은 영업 때 켜는 조명 아래에서 확인하도록 권합니다. 이 매장은 내추럴 애쉬 무늬와 그레이 쿠션 좌판으로 맞췄습니다."),
        ("의자도 테이블과 함께 주문할 수 있나요?", "가능합니다. 의자를 함께 맞추면 상판 높이와 의자 좌판 높이, 색을 한 번에 보고 정할 수 있습니다. 의자 가격은 모델과 수량에 따라 개별 견적입니다."),
    ], ["lpm-top", "grade-price"]),
}
COMMON_QA = ("비슷하게 맞추려면 무엇을 보내면 되나요?", "매장 사진이나 도면, 필요한 좌석 수와 사이즈, 배송 지역을 카카오톡으로 보내 주세요. 크기를 몰라도 사진만으로 상담을 시작할 수 있습니다.")
GUIDE_TITLES = {
    "table-size": "업소용 테이블 사이즈 기준표", "grade-price": "업소용 테이블 가격과 등급 비교",
    "lpm-top": "LPM 상판이란? 원목·천연석과 차이", "grill-induction": "불판·인덕션 테이블 타공 체크리스트",
    "order-schedule": "식당 오픈 전 테이블 발주 순서",
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
.qa{margin-top:34px}.qa h2{font-size:20px;margin:0 0 6px}
.qa h3{font-size:17px;margin:16px 0 4px}.qa p{margin:0;color:#3c3a35}
.guides{margin-top:30px}.guides h2{font-size:18px;margin:0 0 10px}
.guides ul{margin:0;padding-left:18px}.guides li{margin:4px 0}
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
<meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="/cases/cases.css">
<script type="application/ld+json">{ld}</script>
</head><body>
<header class="top"><div class="in"><a class="brand" href="/">멋:테이블</a><a class="tel" href="tel:{PHONE}">{PHONE}</a></div></header>
"""


FOOT = f"""<footer><div class="in">멋:테이블 · 업소용 테이블·의자 맞춤 제작 · 부산 연제구 과정로226번길 10, 2층 (상담) · 김해 공장 직접 제작 · {PHONE} · <a href="/guide/">테이블 가이드</a></div></footer>
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
        qa_list, guide_slugs = CASE_QA.get(c["num"], ([], ["table-size", "grade-price"]))
        qa_list = qa_list + [COMMON_QA]
        ld.append({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in qa_list]})
        qa_html = "".join(f"<h3>Q. {esc(q)}</h3><p>{esc(a)}</p>" for q, a in qa_list)
        guides_html = "".join(f'<li><a href="/guide/{g}.html">{esc(GUIDE_TITLES[g])}</a></li>' for g in guide_slugs)
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
<section class="qa"><h2>이 사례 Q&amp;A</h2>{qa_html}</section>
<section class="guides"><h2>함께 보면 좋은 가이드</h2><ul>{guides_html}</ul></section>
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
