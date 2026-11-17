(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const help = $('help');
  const button = $('nativeInstall');
  const status = $('installStatus');
  const standalone = window.matchMedia('(display-mode: standalone)');
  const ua = navigator.userAgent || '';
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const mobile = ios || /Android/.test(ua);
  let pending = null;
  let installing = false;
  let installed = standalone.matches || navigator.standalone === true;

  function render() {
    $('installHelp').textContent = installed ? '설치 안내' : mobile ? '홈 화면 추가' : 'PC에 설치';
    $('installTitle').textContent = installed ? '장부 앱을 사용 중이에요' : mobile ? '장부를 홈 화면에 추가' : 'PC에 매출장부 설치';
    $('desktopInstall').hidden = mobile || installed;
    $('mobileInstall').hidden = !mobile || installed;
    $('installedHelp').hidden = !installed;
    button.hidden = !pending || installed;
    button.disabled = installing;
    button.textContent = installing ? '설치 창을 여는 중…' : '장부 앱 설치';
  }

  $('installHelp').addEventListener('click', () => {
    render();
    if (!help.open) help.showModal();
  });
  $('closeHelp').addEventListener('click', () => help.close());

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    pending = event;
    status.textContent = '설치할 준비가 됐어요. 아래 버튼을 눌러주세요.';
    render();
  });

  button.addEventListener('click', async () => {
    if (!pending || installing) return;
    const event = pending;
    pending = null;
    installing = true;
    button.disabled = true;
    button.textContent = '설치 창을 여는 중…';
    try {
      await event.prompt();
      const choice = await event.userChoice;
      if (!installed) {
        status.textContent = choice.outcome === 'accepted'
          ? '설치 요청을 보냈어요. 브라우저의 안내를 완료해주세요.'
          : '설치를 취소했어요. 나중에 주소창의 설치 아이콘으로 다시 설치할 수 있어요.';
      }
    } catch (_) {
      status.textContent = '설치 창을 열지 못했어요. 주소창의 설치 아이콘이나 브라우저 메뉴를 이용해주세요.';
    } finally {
      installing = false;
      render();
    }
  });

  window.addEventListener('appinstalled', () => {
    installed = true;
    pending = null;
    status.textContent = '설치가 완료됐어요. 앱 목록에서 멋테이블 매출장부를 열어주세요.';
    render();
  });

  const modeChanged = event => {
    installed = event.matches || navigator.standalone === true;
    render();
  };
  if (standalone.addEventListener) standalone.addEventListener('change', modeChanged);
  else if (standalone.addListener) standalone.addListener(modeChanged);
  render();
})();
