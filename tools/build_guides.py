"""업소용 테이블 가이드 페이지(/guide/)를 만듭니다.

사용법: python tools/build_guides.py
- guide/index.html   : 가이드 목록
- guide/<slug>.html  : 가이드 본문
- sitemap.xml        : 가이드 주소를 자동으로 갱신

원칙
- 업체 확인 정보(가격·사양·옵션·혜택)만 사실로 적고, 납기 약속·A/S 약속·근거 없는 수치는 쓰지 않습니다.
- 네이버 블로그 원고와 문장이 겹치지 않도록 기준표·체크리스트 형식으로 씁니다.
- 내용을 고친 뒤에는 UPDATED 날짜를 바꾸고 다시 실행하세요.
"""
import html
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://meottable.com"
KAKAO = "https://pf.kakao.com/_BZeSX/chat"
PHONE = "0507-1311-8562"
PUBLISHED = "2026-11-25"
UPDATED = "2026-11-25"
OG = "/images/og/og-meottable-1200x630.jpg"


def esc(x):
    return html.escape(x, quote=True)


def plain(x):
    return html.unescape(re.sub(r"<[^>]+>", "", x)).strip()


# ---------------------------------------------------------------------------
# 가이드 본문 (body는 HTML, faq는 (질문, 답) 목록)
# ---------------------------------------------------------------------------
GUIDES = [
    {
        "slug": "table-size",
        "title": "업소용 테이블 사이즈 기준표",
        "h1": "업소용 테이블 사이즈 기준표<br>2인석·4인석·단체석·바 좌석",
        "desc": "식당 테이블 크기를 정할 때 쓰는 기준표입니다. 4인석 1200×800, 2인석 600~700 정사각, 6~8인석 1600~1800×800, 테이블 높이와 통로 폭까지 한 페이지에 정리했습니다.",
        "summary": "4인석은 1200×800을 기준으로 잡고, 2인석은 600~700mm 정사각, 6~8인석은 1600~1800×800 또는 4인석 두 대를 붙여 씁니다. 높이는 의자 좌판에 맞추고, 직원이 다니는 주 통로는 900mm 정도를 먼저 비워 둔 뒤 테이블 수를 정합니다.",
        "image": "/images/portfolio/all/case-05-01.webp",
        "body": """
<h2>좌석별 상판 크기</h2>
<div class="tbl"><table>
<thead><tr><th>좌석</th><th>상판 크기 (가로×세로, mm)</th><th>이렇게 조정합니다</th></tr></thead>
<tbody>
<tr><td>2인석</td><td>600×600 ~ 700×700</td><td>두 대를 붙이면 4인석으로 쓸 수 있어 회전이 빠른 매장에 맞습니다.</td></tr>
<tr><td>4인석</td><td><b>1200×800</b></td><td>홀이 좁으면 세로 700, 반찬이 많이 깔리면 세로 900까지 조정합니다.</td></tr>
<tr><td>6인석</td><td>1600×800 전후</td><td>의자 폭이 넓으면 가로를 조금 늘립니다.</td></tr>
<tr><td>8인석</td><td>1800×800 전후</td><td>평소에 나눠 쓰려면 4인석 두 대를 붙이는 방식도 많이 씁니다.</td></tr>
<tr><td>1인 바 좌석</td><td>1인당 폭 600 안팎</td><td>깊이는 실제로 쓰는 쟁반이 여유 있게 놓이는지를 기준으로 정합니다.</td></tr>
<tr><td>불판·인덕션 테이블</td><td>기기 치수에 맞춤</td><td>기기 모델과 타공 치수를 먼저 정한 뒤 상판 크기를 맞춥니다.</td></tr>
</tbody></table></div>
<p class="small">모든 치수는 출발점입니다. 실제로 나가는 그릇과 의자를 놓아 보고 최종 치수를 정합니다.</p>

<h2>테이블 높이</h2>
<div class="tbl"><table>
<thead><tr><th>좌석 형태</th><th>상판 높이 기준</th><th>확인할 것</th></tr></thead>
<tbody>
<tr><td>일반 의자석</td><td>700mm 초중반</td><td>의자 좌판 높이를 재서 맞춥니다.</td></tr>
<tr><td>소파석</td><td>의자석보다 한 단계 낮게</td><td>앉았을 때 쿠션이 꺼지는 정도까지 봅니다.</td></tr>
<tr><td>바·창가 스툴석</td><td>1m 안팎</td><td>스툴 좌판 높이와 발 올릴 곳을 함께 정합니다.</td></tr>
</tbody></table></div>
<p class="small">높이는 숫자보다 "의자 좌판과 상판 사이 간격"으로 맞추는 것이 정확합니다. 의자를 함께 주문하면 높이를 같이 보고 맞춥니다.</p>

<h2>통로와 테이블 수를 정하는 순서</h2>
<ol class="steps">
<li><b>주 통로부터</b> 입구 → 주방 → 홀 끝으로 이어지는 직원 동선을 먼저 그립니다. 900mm 정도를 권합니다.</li>
<li><b>의자 뒤 여유</b> 손님이 의자를 빼고 앉는 공간, 등을 맞대는 배치라면 양쪽 의자가 빠지는 공간을 잡습니다.</li>
<li><b>남은 자리에 테이블</b> 위 표의 크기로 채우고, 넘치면 상판 크기나 좌석 비율을 줄입니다.</li>
<li><b>바닥에 표시해 보기</b> 테이프로 상판 크기를 표시하고 실제 의자를 놓아 앉아 봅니다.</li>
</ol>
<p>기둥, 출입구, 주방 출구 위치는 테이블 크기를 바꾸는 경우가 많으니 평면도에 꼭 표시해 주세요.</p>
""",
        "faq": [
            ("식당 4인 테이블은 몇 mm가 기본인가요?", "1200×800mm를 기본으로 봅니다. 홀이 좁으면 1200×700, 반찬이 많이 깔리는 한식당은 1200×900까지 조정합니다."),
            ("단체석은 긴 테이블 한 대와 4인석 연결 중 무엇이 낫나요?", "평소에 인원별로 나눠 쓰려면 4인석 두 대를 붙이는 방식이 편합니다. 이때 붙일 테이블은 높이·무늬·다리 위치를 똑같이 맞춰야 이음 자리가 어색하지 않습니다."),
            ("매장 치수를 몰라도 상담할 수 있나요?", "매장 사진과 대략적인 가로·세로 길이만 있어도 몇 인석을 몇 개 넣을 수 있는지 함께 계산해 볼 수 있습니다."),
        ],
        "related": ["grade-price", "order-schedule"],
    },
    {
        "slug": "grade-price",
        "title": "업소용 테이블 가격과 등급 비교",
        "h1": "업소용 테이블 가격과 등급 비교<br>스탠다드·프로·시그니처",
        "desc": "멋:테이블 업소용 테이블 등급별 가격표입니다. 1200×800 이하 스탠다드 59,000원·프로 89,000원·시그니처 129,000원부터(부가세·배송비·옵션 별도). 크기별 가격, 공통 사양, 등급별 압착 공정 차이를 정리했습니다.",
        "summary": "가격은 크기 × 등급 + 옵션으로 정해집니다. 1200×800 이하 기준 스탠다드 59,000원, 프로 89,000원, 시그니처 129,000원부터이며 부가세·배송비·옵션은 별도입니다. 세 등급의 상판 구성은 같고, 공장 압착 공정의 온도·압력 설정이 다릅니다.",
        "image": "/images/portfolio/all/case-01-01.webp",
        "body": """
<h2>크기별 시작 가격 (테이블 1개, 부가세 별도)</h2>
<div class="tbl"><table>
<thead><tr><th>상판 가로 길이</th><th>스탠다드</th><th>프로 <span class="badge">BEST</span></th><th>시그니처</th></tr></thead>
<tbody>
<tr><td>1200 이하 (예: 1200×800)</td><td>59,000원</td><td>89,000원</td><td>129,000원</td></tr>
<tr><td>1201~1799 (1600급)</td><td>110,000원</td><td>150,000원</td><td>180,000원</td></tr>
<tr><td>1800 이상</td><td>145,000원</td><td>185,000원</td><td>220,000원</td></tr>
</tbody></table></div>
<p class="small">배송비와 옵션(타공·수저통·서랍·콘센트·다리 형태 등)은 별도이며, 최종 금액은 규격·옵션·배송 지역을 확인한 뒤 견적서로 안내합니다.</p>

<h2>세 등급 공통 사양</h2>
<ul class="checks">
<li>LPM 압착 상판 (나뭇결·돌무늬는 LPM 표면 패턴이며 원목·천연석이 아닙니다)</li>
<li>상판 테두리 36mm</li>
<li>옆면 PVC 엣지밴딩 마감</li>
<li>김해 공장에서 상판부터 다리까지 직접 제작</li>
</ul>

<h2>등급별로 다른 것: 압착 공정 설정</h2>
<div class="tbl"><table>
<thead><tr><th>등급</th><th>압착 온도</th><th>압력</th><th>이런 매장에 많이 고릅니다</th></tr></thead>
<tbody>
<tr><td>스탠다드</td><td>180℃</td><td>150ton</td><td>초기 비용을 줄여야 하거나 테이블 수가 많은 매장</td></tr>
<tr><td>프로</td><td>190℃</td><td>200ton</td><td>가격과 마감의 균형을 원하는 매장 (가장 많이 선택)</td></tr>
<tr><td>시그니처</td><td>200℃</td><td>400ton</td><td>테이블이 인테리어의 일부인 다이닝·상판 무늬를 보여 주고 싶은 매장 (월 10팀 한정)</td></tr>
</tbody></table></div>
<p class="warn">표의 온도는 공장에서 상판을 압착할 때의 <b>공정 설정값</b>입니다. 테이블 위에 올려도 되는 온도나 수명을 뜻하지 않습니다. 뜨거운 뚝배기·냄비는 받침을 써 주세요.</p>

<h2>견적을 빨리 받는 방법</h2>
<ol class="steps">
<li><b>사이즈별 수량</b> 예: 4인석 ○개, 6인석 ○개</li>
<li><b>원하는 등급</b> 아직 모르면 비워 두셔도 됩니다.</li>
<li><b>필요한 옵션</b> 불판·인덕션 타공, 수저통, 서랍, 콘센트, 다리 형태, 의자·벤치</li>
<li><b>배송 지역</b> 배송비 계산에 필요합니다.</li>
</ol>
<p>테이블을 제작하시는 고객께는 상권분석 보고서를 무료로 드립니다.</p>
""",
        "faq": [
            ("업소용 테이블 가격은 얼마부터인가요?", "1200×800 이하 기준 스탠다드 59,000원, 프로 89,000원, 시그니처 129,000원부터입니다. 부가세·배송비·옵션은 별도입니다."),
            ("등급이 올라가면 무엇이 달라지나요?", "상판 구성(LPM 상판, 36mm 테두리, PVC 엣지)은 세 등급이 같고, 공장 압착 공정의 설정이 스탠다드 180℃·150ton, 프로 190℃·200ton, 시그니처 200℃·400ton으로 다릅니다. 이 온도는 사용 가능 온도가 아닙니다."),
            ("시그니처 등급은 언제든 주문할 수 있나요?", "시그니처는 월 10팀 한정으로 제작합니다. 오픈 일정이 정해졌다면 일찍 상담해 주세요."),
        ],
        "related": ["lpm-top", "table-size"],
    },
    {
        "slug": "lpm-top",
        "title": "LPM 상판이란? 원목·천연석과 차이",
        "h1": "LPM 상판이란?<br>원목·천연석 상판과 무엇이 다를까",
        "desc": "LPM 상판은 무늬지를 보드 표면에 열과 압력으로 압착한 상판입니다. 나뭇결·돌무늬는 LPM 패턴이며 원목·천연석이 아닙니다. 원목과의 차이, 무늬 고르는 법, 매일 관리법을 표로 정리했습니다.",
        "summary": "LPM(Low Pressure Melamine) 상판은 멜라민 수지를 먹인 무늬지를 보드 위에 열과 압력으로 붙인 상판입니다. 나뭇결이나 돌처럼 보여도 원목·천연석이 아니며, 같은 패턴을 쓰기 때문에 테이블을 여러 대 맞춰도 색과 결이 고르게 나옵니다.",
        "image": "/images/portfolio/all/case-04-01.webp",
        "body": """
<h2>LPM 상판의 구조</h2>
<div class="tbl"><table>
<thead><tr><th>부위</th><th>멋:테이블 사양</th></tr></thead>
<tbody>
<tr><td>윗면</td><td>LPM 무늬지 압착 (우드·마블·스톤·빈티지 계열)</td></tr>
<tr><td>테두리</td><td>36mm</td></tr>
<tr><td>옆면</td><td>PVC 엣지밴딩 마감</td></tr>
<tr><td>무늬 수</td><td>일반 45종 + 시그니처 8종 (총 53종)</td></tr>
</tbody></table></div>
<p class="small">카탈로그의 무늬 이름(예: 노송원목, 월넛자연무늬, 마블)은 <b>무늬명</b>입니다. 모든 상판은 LPM이며 원목·천연석 상판이 아닙니다.</p>

<h2>원목·천연석 상판과 비교</h2>
<div class="tbl"><table>
<thead><tr><th>비교 항목</th><th>LPM 상판</th><th>원목·천연석 상판</th></tr></thead>
<tbody>
<tr><td>무늬</td><td>정해진 패턴이라 여러 대가 거의 같게 나옴</td><td>재료 자체의 결이라 한 장씩 다름</td></tr>
<tr><td>여러 대 맞추기</td><td>같은 무늬·같은 높이로 대량 제작이 쉬움</td><td>색과 결을 맞추기 어려움</td></tr>
<tr><td>평소 관리</td><td>젖은 행주 → 마른 행주로 닦기</td><td>마감 상태에 따라 오일·코팅 관리가 필요할 수 있음</td></tr>
<tr><td>어울리는 곳</td><td>테이블 수가 많은 식당·고깃집·카페</td><td>테이블 몇 대를 오래 두고 쓰는 공간</td></tr>
</tbody></table></div>

<h2>무늬 고르는 기준</h2>
<ul class="checks">
<li>바닥·벽·의자 색을 먼저 적고, 바닥보다 한 톤 밝거나 어두운 무늬를 고릅니다.</li>
<li>작은 조각만 보지 말고, 영업할 때 켜는 조명 아래에서 샘플을 확인합니다.</li>
<li>월넛 계열은 따뜻하고 묵직한 분위기, 애쉬 계열은 밝고 넓어 보이는 분위기를 냅니다.</li>
<li>스톤·콘크리트 무늬는 손으로 만져 보고 정합니다. 무게감·차가운 촉감은 실제 돌과 다릅니다.</li>
</ul>

<h2>매일 관리 수칙</h2>
<div class="tbl"><table>
<thead><tr><th>상황</th><th>이렇게 하세요</th><th>피할 것</th></tr></thead>
<tbody>
<tr><td>평소</td><td>젖은 행주(묽은 중성세제) → 마른 행주</td><td>세제 원액</td></tr>
<tr><td>눌어붙은 양념</td><td>따뜻한 물수건으로 불린 뒤 닦기</td><td>철 수세미·거친 수세미</td></tr>
<tr><td>뜨거운 그릇</td><td>받침 위에 올리기</td><td>뚝배기·냄비를 상판에 바로</td></tr>
<tr><td>모서리</td><td>옆면까지 물기 훑기</td><td>엣지 이음부에 물 고인 채 두기</td></tr>
<tr><td>자리 옮길 때</td><td>들어서 옮기기</td><td>바닥에 끌기</td></tr>
</tbody></table></div>
""",
        "faq": [
            ("LPM 상판은 원목인가요?", "아닙니다. LPM은 나무·돌 무늬가 인쇄된 무늬지를 보드 표면에 열과 압력으로 압착한 상판입니다. 나뭇결·돌무늬는 LPM 표면 패턴이며 원목·천연석이 아닙니다."),
            ("LPM 상판은 어떻게 닦나요?", "젖은 행주(필요하면 묽게 푼 중성세제)로 닦고 마른 행주로 물기를 걷어 내면 됩니다. 철 수세미나 거친 수세미는 피하고, 모서리 옆면까지 물기를 닦아 주세요."),
            ("뜨거운 뚝배기를 바로 올려도 되나요?", "받침을 써 주세요. 등급 설명의 180~200℃는 공장 압착 공정의 설정값이며 사용 가능 온도가 아닙니다."),
        ],
        "related": ["grade-price", "grill-induction"],
    },
    {
        "slug": "grill-induction",
        "title": "불판·인덕션 테이블 타공 체크리스트",
        "h1": "불판·인덕션 테이블<br>타공 전 체크리스트",
        "desc": "고깃집 불판 테이블, 샤브샤브·전골 인덕션 테이블을 맞춤 제작하기 전에 확인할 것. 기기 모델과 타공 치수, 배기 방식, 전원 위치, 상판 아래 공간, 좌석 형태를 체크리스트로 정리했습니다.",
        "summary": "불판·인덕션 테이블은 기기를 먼저 정하고, 그 치수로 상판을 뚫은 뒤, 마지막에 다리를 정합니다. 타공 전에 기기 모델·타공 치수, 배기 방식(불판) 또는 전원 위치(인덕션), 상판 아래 본체 공간, 좌석 형태가 정해져 있어야 다시 뚫거나 상판을 새로 만드는 일을 피할 수 있습니다.",
        "image": "/images/portfolio/all/case-07-01.webp",
        "body": """
<h2>정하는 순서</h2>
<ol class="steps">
<li><b>기기 결정</b> 불판·인덕션 모델과 제조사 타공 치수를 받습니다.</li>
<li><b>상판 타공</b> 그 치수로 상판 크기와 타공 위치를 잡습니다.</li>
<li><b>콘센트 위치</b> 전원이 필요한 경우 선이 지나갈 길을 정합니다.</li>
<li><b>수저통·서랍</b> 남은 자리에 맞춰 넣습니다.</li>
<li><b>다리 형태</b> 기기 본체와 좌석을 피해 다리·프레임 위치를 정합니다.</li>
</ol>

<h2>타공 전 체크리스트</h2>
<div class="tbl"><table>
<thead><tr><th>항목</th><th>불판 테이블</th><th>인덕션 테이블</th></tr></thead>
<tbody>
<tr><td>기기 정보</td><td>불판 모델명 또는 불판 업체 타공 치수</td><td>인덕션 모델명, 제조사 설치 설명서의 타공 치수</td></tr>
<tr><td>설치 방식</td><td>매립식인지 확인</td><td>상판과 높이를 맞추는 매립형인지, 테두리가 걸치는 형태인지</td></tr>
<tr><td>배기·전원</td><td>상부 배기인지 하부(바닥) 배기인지</td><td>전원이 바닥에서 오는지 벽에서 오는지</td></tr>
<tr><td>상판 아래</td><td>불판 몸체 깊이, 하부 배관 자리</td><td>본체 깊이와 제조사가 정한 하부 여유 공간</td></tr>
<tr><td>좌석 형태</td><td colspan="2">의자·벤치·붙박이 소파 중 무엇인지 (다리 형태가 달라짐)</td></tr>
<tr><td>위치</td><td colspan="2">4인석 1구는 보통 가운데, 2구·단체석은 양쪽 손이 고르게 닿는 거리</td></tr>
</tbody></table></div>

<h2>자주 생기는 문제와 예방</h2>
<ul class="checks">
<li><b>쓰던 테이블에 구멍만 뚫기</b> 다리 프레임·보강재가 본체 자리에 지나가면 뚫을 수 없습니다. 처음부터 기기 자리를 비워 두고 프레임을 짜는 편이 안전합니다.</li>
<li><b>모델 변경</b> 같은 계열이라도 모델·연식에 따라 치수가 다를 수 있습니다. 확정 모델의 설명서로 다시 확인합니다.</li>
<li><b>서랍과 본체 겹침</b> 위에서는 괜찮아 보여도 상판 아래에서 부딪힐 수 있어 위아래를 함께 그려 확인합니다.</li>
<li><b>테이블이 많은 매장</b> 타공 기준을 하나 정해 두고 같은 기준으로 가공해야 홀에 줄지어 놓았을 때 라인이 맞습니다.</li>
</ul>
<p class="small">전기 용량과 배선 공사는 인테리어 전기 작업에서 정하고, 테이블은 그 위치에 맞춰 선이 지나갈 길을 잡습니다.</p>
""",
        "faq": [
            ("불판 테이블 주문 전에 무엇을 준비하나요?", "불판 모델명 또는 불판 업체 타공 치수, 배기 방식(상부·하부), 좌석 형태(의자·벤치·붙박이 소파) 세 가지가 있으면 상담이 빨라집니다."),
            ("기존 테이블에 인덕션 구멍만 뚫어도 되나요?", "가능한 경우도 있지만 다리 프레임이나 보강재가 본체 자리에 지나가면 뚫을 수 없고 전선 길이 막히기도 합니다. 처음부터 인덕션 자리를 비워 두고 만드는 편이 안전합니다."),
            ("타공 치수는 누가 정하나요?", "기기 제조사 설치 설명서나 불판 업체 도면의 치수를 기준으로 합니다. 모델명과 함께 설명서 사진을 보내 주시면 가장 정확합니다."),
        ],
        "related": ["table-size", "order-schedule"],
    },
    {
        "slug": "order-schedule",
        "title": "식당 오픈 전 테이블 발주 순서",
        "h1": "식당 오픈 전<br>테이블 발주 순서와 준비물",
        "desc": "식당 창업 때 테이블은 언제, 무엇을 정해 두고 주문해야 할까요. 평면도·좌석 비율·기기 타공·콘센트·반입까지 오픈 전 가구 발주 순서와 상담 준비물을 단계별로 정리했습니다.",
        "summary": "테이블 상담은 인테리어가 끝날 때가 아니라 평면도가 나오고 공사가 시작될 무렵에 시작하는 것이 좋습니다. 테이블 치수가 콘센트·배기·바닥 마감 같은 공사 항목과 얽혀 있기 때문입니다. 제작 기간은 수량·옵션·공장 작업량에 따라 달라지므로 오픈 예정일부터 알려 주시면 그 날짜를 기준으로 일정을 함께 잡습니다.",
        "image": "/images/portfolio/all/case-10-01.webp",
        "body": """
<h2>단계별 발주 순서</h2>
<div class="tbl"><table>
<thead><tr><th>단계</th><th>정할 것</th><th>함께 맞출 곳</th></tr></thead>
<tbody>
<tr><td>1. 매장 계약 직후</td><td>좌석 수, 2인석·4인석·단체석 비율</td><td>상권분석 (테이블 제작 고객 무료)</td></tr>
<tr><td>2. 평면도 확정</td><td>주 통로, 기둥·출입구·주방 출구 위치, 테이블 크기</td><td>인테리어 업체</td></tr>
<tr><td>3. 공사 초반</td><td>불판·인덕션 모델과 타공 치수, 콘센트 위치, 배기 방식</td><td>인테리어 전기·불판 업체</td></tr>
<tr><td>4. 공사 중반</td><td>상판 무늬, 다리 형태, 의자·벤치 (매장 조명 아래 샘플 확인)</td><td>인테리어 마감재</td></tr>
<tr><td>5. 주문 확정</td><td>사이즈·수량·무늬·옵션 위치를 한 장 정리본으로 최종 확인</td><td>멋:테이블</td></tr>
<tr><td>6. 반입</td><td>바닥 공사·청소 뒤로 날짜 잡기, 문 폭·계단·엘리베이터 확인</td><td>건물 관리</td></tr>
</tbody></table></div>
<p class="small">공장에서 재단에 들어가기 전에는 조정 여지가 있지만, 재단·압착·타공이 끝난 상판은 크기를 바꾸기 어렵습니다. 바꿀 부분은 확정 정리본 단계에서 모두 알려 주세요.</p>

<h2>상담 전에 준비하면 좋은 것</h2>
<ul class="checks">
<li>매장 주소 (상권 확인·배송비 계산)</li>
<li>업종과 주력 메뉴</li>
<li>매장 가로·세로 길이 또는 평면도 사진 (없으면 매장 사진만으로도 시작 가능)</li>
<li>오픈 예정일과 배송받을 지역</li>
<li>불판·인덕션을 쓰는 경우 기기 모델명</li>
<li>의자·벤치를 함께 맞출지 여부</li>
</ul>

<h2>일정에서 놓치기 쉬운 것</h2>
<ul class="checks">
<li><b>연락 시점</b> 주문을 확정할 때가 아니라 치수를 정할 수 있게 됐을 때 연락하는 편이 일정 잡기에 좋습니다.</li>
<li><b>시그니처 등급</b> 월 10팀 한정이라 오픈 일정이 나오는 대로 미리 상담하는 것이 좋습니다.</li>
<li><b>반입 경로</b> 긴 단체석 상판은 문 폭·엘리베이터에서 걸릴 수 있어 상판을 나눠 만들지 미리 정합니다.</li>
<li><b>납품일</b> 공장·배송 일정을 확인한 뒤 확정합니다. 받으셔야 하는 날짜를 먼저 알려 주세요.</li>
</ul>
""",
        "faq": [
            ("식당 테이블은 오픈 얼마 전에 주문해야 하나요?", "제작 기간은 수량·등급·옵션과 그 시기 공장 작업량에 따라 달라 한 가지로 말하기 어렵습니다. 오픈 예정일을 먼저 알려 주시면 그 날짜를 기준으로 일정을 함께 잡고, 공장·배송 일정을 확인한 뒤 납품일을 확정합니다."),
            ("인테리어 공사와 테이블 결정은 어떤 순서인가요?", "가구는 공사가 끝나야 들어가지만, 콘센트 매립·하부 배기처럼 공사와 얽힌 결정은 공사 중에 끝나 있어야 합니다. 평면도가 나오면 바로 상담을 시작하는 것이 좋습니다."),
            ("주문 후에 크기를 바꿀 수 있나요?", "공장에서 재단에 들어가기 전이라면 조정할 여지가 있습니다. 재단·압착·타공이 끝난 상판은 크기를 바꾸기 어렵습니다."),
        ],
        "related": ["table-size", "grill-induction"],
    },
]

EXTRA_CSS = """
.guide-wrap{max-width:820px}
.summary{background:var(--paper);border-left:4px solid var(--gold);border-radius:6px;padding:16px 18px;margin:0 0 24px;font-size:16px}
.summary b{display:block;font-size:13px;color:var(--gold);letter-spacing:.06em;margin-bottom:4px}
.guide-wrap h2{font-size:22px;margin:34px 0 12px;letter-spacing:-.4px}
.tbl{overflow-x:auto;-webkit-overflow-scrolling:touch;margin:0 0 8px}
.tbl table{border-collapse:collapse;width:100%;min-width:520px;font-size:15px}
.tbl th,.tbl td{border:1px solid var(--line);padding:9px 10px;text-align:left;vertical-align:top}
.tbl th{background:var(--paper);font-weight:700;white-space:nowrap}
.badge{display:inline-block;background:var(--gold);color:#fff;font-size:11px;border-radius:4px;padding:0 5px;vertical-align:middle}
.small{font-size:14px;color:var(--muted);margin:6px 0 0}
.warn{background:#fff6e3;border:1px solid #edd6a6;border-radius:8px;padding:12px 14px;font-size:15px}
.steps{padding-left:22px}.steps li{margin:8px 0}.steps b{margin-right:6px}
.checks{padding-left:20px}.checks li{margin:7px 0}
.faq h3{font-size:17px;margin:18px 0 6px}.faq p{margin:0}
.meta{font-size:13px;color:var(--muted);margin:0 0 18px}
.related{margin-top:36px}.related h2{margin-top:0}
.glist{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:18px}
.glist a{display:block;text-decoration:none;border:1px solid var(--line);border-radius:10px;padding:16px;background:#fff}
.glist b{display:block;font-size:17px;margin-bottom:4px}.glist span{font-size:14px;color:var(--muted)}
@media(max-width:600px){.glist{grid-template-columns:1fr}}
"""


def head(title, desc, url, image, ld, og_type="article"):
    return f"""<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="{url}">
<link rel="icon" href="/favicon.svg">
<meta property="og:type" content="{og_type}"><meta property="og:site_name" content="멋:테이블">
<meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{url}"><meta property="og:image" content="{SITE}{image}"><meta property="og:locale" content="ko_KR">
<meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="/cases/cases.css">
<link rel="stylesheet" href="/guide/guide.css">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
</head><body>
<header class="top"><div class="in"><a class="brand" href="/">멋:테이블</a><a class="tel" href="tel:{PHONE}">{PHONE}</a></div></header>
"""


FOOT = f"""<footer><div class="in">멋:테이블 · 업소용 테이블·의자 맞춤 제작 · 대표 이창용 · 부산 연제구 과정로226번길 10, 2층 (사무실, 방문은 사전 연락) · 공장 경남 김해시 서부로 909-19 · {PHONE} · <a href="/guide/">테이블 가이드</a> · <a href="/cases/">납품 사례</a></div></footer>
</body></html>
"""

CTA = f"""<section class="cta"><h2>우리 매장 기준으로 다시 계산해 볼까요?</h2>
<p>매장 사진과 좌석 수만 보내 주세요. 크기·배치·견적을 함께 잡아 드립니다.</p>
<div class="btns"><a class="btn btn-gold" href="{KAKAO}" rel="noopener">카카오톡 견적 상담</a><a class="btn btn-line" href="tel:{PHONE}">전화 상담 {PHONE}</a><a class="btn btn-line" href="/cases/">납품 사례 보기</a></div></section>
"""

ORG = {"@type": "Organization", "name": "멋:테이블", "url": f"{SITE}/", "logo": f"{SITE}/favicon.svg"}


def build():
    outdir = os.path.join(ROOT, "guide")
    os.makedirs(outdir, exist_ok=True)
    open(os.path.join(outdir, "guide.css"), "w", encoding="utf-8").write(EXTRA_CSS.strip() + "\n")
    by_slug = {g["slug"]: g for g in GUIDES}

    for g in GUIDES:
        url = f"{SITE}/guide/{g['slug']}.html"
        title = f"{g['title']} | 멋:테이블"
        ld = [
            {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "멋:테이블", "item": f"{SITE}/"},
                {"@type": "ListItem", "position": 2, "name": "테이블 가이드", "item": f"{SITE}/guide/"},
                {"@type": "ListItem", "position": 3, "name": g["title"], "item": url}]},
            {"@context": "https://schema.org", "@type": "Article", "headline": g["title"], "description": g["desc"],
             "image": [SITE + g["image"]], "url": url, "inLanguage": "ko-KR",
             "datePublished": PUBLISHED, "dateModified": UPDATED,
             "author": {"@type": "Person", "name": "이창용", "jobTitle": "멋:테이블 대표", "worksFor": ORG},
             "publisher": ORG, "mainEntityOfPage": url},
            {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
                {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in g["faq"]]},
        ]
        faq = "".join(f"<h3>Q. {esc(q)}</h3><p>{esc(a)}</p>" for q, a in g["faq"])
        rel = "".join(f'<a href="{r}.html"><b>{esc(by_slug[r]["title"])}</b><span>{esc(by_slug[r]["desc"][:70])}…</span></a>'
                      for r in g["related"])
        page = head(title, g["desc"], url, g["image"], ld) + f"""<main class="guide-wrap">
<nav class="crumb"><a href="/">홈</a> › <a href="/guide/">테이블 가이드</a> › {esc(g['title'])}</nav>
<p class="eyebrow">MEOT:TABLE GUIDE</p>
<h1>{g['h1']}</h1>
<p class="meta">멋:테이블 대표 이창용 · 김해 공장 직접 제작 기준 · 업데이트 {UPDATED}</p>
<div class="summary"><b>한 줄 요약</b>{esc(g['summary'])}</div>
{g['body']}
<section class="faq"><h2>자주 묻는 질문</h2>{faq}</section>
{CTA}
<section class="related"><h2>함께 보면 좋은 가이드</h2><div class="glist">{rel}</div>
<p class="note"><a href="/guide/">가이드 전체 보기 →</a></p></section>
<p class="note">이 가이드의 치수·높이는 상담에서 쓰는 출발 기준이며, 최종 사양은 매장·의자·기기를 확인한 뒤 견적서로 정합니다. 가격은 부가세·배송비·옵션 별도입니다. 나뭇결·돌무늬는 LPM 표면 패턴이며 원목·천연석이 아닙니다.</p>
</main>
""" + FOOT
        open(os.path.join(outdir, f"{g['slug']}.html"), "w", encoding="utf-8").write(page)

    url = f"{SITE}/guide/"
    title = "업소용 테이블 가이드 | 사이즈·가격·LPM·타공·발주 | 멋:테이블"
    desc = "식당·고깃집·카페 창업 때 업소용 테이블을 고르는 기준을 정리했습니다. 테이블 사이즈 기준표, 등급별 가격, LPM 상판, 불판·인덕션 타공 체크리스트, 오픈 전 발주 순서."
    ld = [
        {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "멋:테이블", "item": f"{SITE}/"},
            {"@type": "ListItem", "position": 2, "name": "테이블 가이드", "item": url}]},
        {"@context": "https://schema.org", "@type": "CollectionPage", "name": "업소용 테이블 가이드", "url": url, "description": desc,
         "publisher": ORG,
         "hasPart": [{"@type": "Article", "headline": g["title"], "url": f"{SITE}/guide/{g['slug']}.html"} for g in GUIDES]},
    ]
    cards = "".join(f'<a href="{g["slug"]}.html"><b>{esc(g["title"])}</b><span>{esc(g["summary"][:90])}…</span></a>' for g in GUIDES)
    page = head(title, desc, url, OG, ld, og_type="website") + f"""<main class="guide-wrap">
<nav class="crumb"><a href="/">홈</a> › 테이블 가이드</nav>
<p class="eyebrow">MEOT:TABLE GUIDE</p>
<h1>업소용 테이블 가이드</h1>
<p class="lead">김해 공장에서 업소용 테이블을 직접 만들며 상담 때 실제로 쓰는 기준을 표와 체크리스트로 정리했습니다. 매장 계약부터 반입까지, 필요한 순서대로 보시면 됩니다.</p>
<div class="glist">{cards}</div>
{CTA}
<p class="note">가격은 부가세·배송비·옵션 별도이며, 최종 사양과 금액은 상담 후 견적서로 안내합니다.</p>
</main>
""" + FOOT
    open(os.path.join(outdir, "index.html"), "w", encoding="utf-8").write(page)

    # sitemap
    sm = os.path.join(ROOT, "sitemap.xml")
    s = open(sm, encoding="utf-8").read()
    s = re.sub(r"\s*<url>\s*<loc>https://meottable\.com/guide/[^<]*</loc>.*?</url>", "", s, flags=re.S)
    add = "".join(
        f"\n  <url>\n    <loc>{u}</loc>\n    <lastmod>{UPDATED}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>{p}</priority>\n  </url>"
        for u, p in [(f"{SITE}/guide/", "0.8")] + [(f"{SITE}/guide/{g['slug']}.html", "0.7") for g in GUIDES])
    s = s.replace("\n</urlset>", add + "\n</urlset>")
    open(sm, "w", encoding="utf-8").write(s)
    print(f"가이드 {len(GUIDES)}개 페이지 생성")


if __name__ == "__main__":
    build()
