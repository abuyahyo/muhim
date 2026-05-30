// PWA install banner — Chrome/Edge/Android (beforeinstallprompt).
// Иловамни ўрнатмаган фойдаланувчиларга экран остида чиройли таклиф
// banner'и кўрсатади. iOS Safari beforeinstallprompt'ни қўлламагани учун
// у ерда banner кўринмайди (бу нормал).
//
// localStorage калити: `muhim_install_dismissed_at`. Бекор қилинса 14 кун
// давомида қайта кўрсатилмайди.
(function () {
  'use strict';

  const css = `
    .install-banner {
      position: fixed;
      left: 16px;
      right: 16px;
      bottom: calc(env(safe-area-inset-bottom, 0px) + 16px);
      max-width: 480px;
      margin: 0 auto;
      background: #ffffff;
      color: #0f172a;
      border-radius: 16px;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 20px 50px -10px rgba(0,0,0,0.45), 0 6px 16px -6px rgba(0,0,0,0.3);
      z-index: 9000;
      font-family: 'DM Sans', system-ui, sans-serif;
      animation: install-slide-up 0.4s ease-out;
    }
    .install-banner[hidden] { display: none; }
    .install-banner-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      flex-shrink: 0;
      background: #f1f5f9;
      object-fit: cover;
    }
    .install-banner-text { flex: 1; min-width: 0; }
    .install-banner-text strong {
      display: block;
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.2;
    }
    .install-banner-text p {
      margin: 2px 0 0;
      font-size: 13px;
      line-height: 1.35;
      color: #475569;
    }
    #install-banner-action {
      background: #0e7490;
      color: #ffffff;
      border: 0;
      border-radius: 9999px;
      padding: 9px 16px;
      font-family: inherit;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      flex-shrink: 0;
      transition: background 0.2s ease, transform 0.1s ease;
    }
    #install-banner-action:hover { background: #155e75; }
    #install-banner-action:active { transform: scale(0.97); }
    #install-banner-close {
      background: transparent;
      border: 0;
      color: #94a3b8;
      font-size: 18px;
      line-height: 1;
      padding: 6px;
      cursor: pointer;
      flex-shrink: 0;
      border-radius: 50%;
      transition: color 0.2s ease;
    }
    #install-banner-close:hover { color: #475569; }
    @keyframes install-slide-up {
      from { opacity: 0; transform: translateY(120%); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 480px) {
      .install-banner { padding: 12px 14px; gap: 10px; }
      .install-banner-icon { width: 40px; height: 40px; }
      .install-banner-text strong { font-size: 14px; }
      .install-banner-text p { font-size: 12px; }
      #install-banner-action { padding: 8px 14px; font-size: 13px; }
    }
  `;

  const markup = `
    <img src="../icon.svg" alt="" class="install-banner-icon">
    <div class="install-banner-text">
      <strong>Иловани ўрнатиш</strong>
      <p>Иловани телефонингизга ўрнатинг — оффлайн ҳам ишлайди.</p>
    </div>
    <button id="install-banner-action">Ўрнатиш</button>
    <button id="install-banner-close" aria-label="Ёпиш">✕</button>
  `;

  const INSTALL_DISMISS_KEY = 'muhim_install_dismissed_at';
  const INSTALL_DISMISS_TTL = 14 * 24 * 60 * 60 * 1000;

  function isInstallDismissed() {
    try {
      const t = Number(localStorage.getItem(INSTALL_DISMISS_KEY) || 0);
      return t && (Date.now() - t < INSTALL_DISMISS_TTL);
    } catch (e) { return false; }
  }
  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
  }

  function init() {
    if (isStandalone()) return;

    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    const banner = document.createElement('div');
    banner.className = 'install-banner';
    banner.id = 'install-banner';
    banner.hidden = true;
    banner.innerHTML = markup;
    document.body.appendChild(banner);

    const actionBtn = banner.querySelector('#install-banner-action');
    const closeBtn = banner.querySelector('#install-banner-close');
    let deferredPrompt = null;

    function hide() { banner.hidden = true; }
    function show() {
      if (isStandalone() || isInstallDismissed()) return;
      banner.hidden = false;
    }

    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferredPrompt = e;
      show();
    });
    window.addEventListener('appinstalled', function () {
      deferredPrompt = null;
      hide();
    });
    actionBtn.addEventListener('click', function () {
      if (!deferredPrompt) { hide(); return; }
      hide();
      try {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.finally(function () { deferredPrompt = null; });
      } catch (e) { deferredPrompt = null; }
    });
    closeBtn.addEventListener('click', function () {
      try { localStorage.setItem(INSTALL_DISMISS_KEY, String(Date.now())); } catch (e) {}
      hide();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
