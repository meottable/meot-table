(function () {
  var products = ["MT001", "MT002", "MT003", "MT004", "MT005", "MT006", "MT007", "MT008"];
  var chatUrl = "https://pf.kakao.com/_BZeSX/chat";

  function card(name, index) {
    var number = String(index + 1).padStart(3, "0");
    return '<a class="signatureDesignCard" href="' + chatUrl + '" target="_blank" rel="noreferrer" aria-label="' + name + ' 시그니처 상판 문의하기">' +
      '<img src="/meot-table/images/signature/mt' + number + '.webp" alt="' + name + ' 시그니처 상판 디자인" loading="lazy" decoding="async"/>' +
      '<div class="signatureDesignMeta"><strong>' + name + '</strong><span>SIGNATURE</span></div>' +
    '</a>';
  }

  function mount() {
    var head = document.querySelector("#design .catalogHead");
    if (!head) return;

    var section = document.getElementById("signature-design");
    if (!section) {
      section = document.createElement("section");
      section.id = "signature-design";
    }

    section.className = "signatureCollection";
    section.setAttribute("aria-labelledby", "signature-design-title");
    section.innerHTML =
      '<div class="signatureCollectionHead">' +
        '<div><p class="signatureCollectionEyebrow">MEOT : TABLE SIGNATURE COLLECTION</p>' +
        '<h3 id="signature-design-title">시그니처 디자인</h3></div>' +
        '<p class="signatureCollectionIntro">멋:테이블에서만 만날 수 있는 전용 상판 8종입니다. 매장 조명과 콘셉트에 맞춰 실제 샘플과 함께 안내해 드립니다.</p>' +
      '</div>' +
      '<div class="signatureDesignGrid">' + products.map(card).join("") + '</div>';

    head.insertAdjacentElement("afterend", section);
  }

  function boot() {
    mount();
    setTimeout(mount, 250);
    setTimeout(mount, 900);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
