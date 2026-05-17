// === ЖОЙЛАР — МАСЖИДЛАР ИЛОВАСИ ===
(function () {
  'use strict';

  const { places } = JoylarData;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  // === БОШ САҲИФА — жойлар рўйхати ===
  function renderList() {
    let html = '<div class="fade-in">';
    html += '<header class="page-head">';
    html += '<div class="page-eyebrow">Муқаддас</div>';
    html += '<h1 class="page-title">Жойлар</h1>';
    html += '<p class="page-lede">Исломнинг учта улуғ масжиди — ҳар бирининг тарихи, оят ва ҳадислари.</p>';
    html += '</header>';

    html += '<div class="places-stack">';
    for (let i = 0; i < places.length; i++) {
      const p = places[i];
      html += '<button class="place-card" onclick="showPlace(\'' + escapeHtml(p.id) + '\')" '
            + 'style="--accent: ' + p.color + ';">';
      html += '<div class="place-art">' + iconFor(p.id) + '</div>';
      html += '<div class="place-body">';
      html += '<div class="place-arabic">' + escapeHtml(p.arabic) + '</div>';
      html += '<div class="place-name">' + escapeHtml(p.name) + '</div>';
      html += '<div class="place-loc">' + escapeHtml(p.city) + ' · ' + escapeHtml(p.country) + '</div>';
      html += '<div class="place-short">' + escapeHtml(p.short) + '</div>';
      html += '</div>';
      html += '<div class="place-arrow">→</div>';
      html += '</button>';
    }
    html += '</div>';
    html += '</div>';

    document.getElementById('view-list').innerHTML = html;
  }

  // SVG иллюстрациялар — joylar/svg.js'да жойлашган.
  function iconFor(id) {
    if (!window.JoylarSvg || typeof JoylarSvg[id] !== 'function') return '';
    return JoylarSvg[id]();
  }

  // === ДЕТАЛЬ САҲИФА ===
  function renderDetail(id) {
    let p = null;
    for (let i = 0; i < places.length; i++) if (places[i].id === id) { p = places[i]; break; }
    if (!p) return;

    let html = '<div class="fade-in detail-wrap">';
    html += '<div class="detail-topbar">';
    html += '<button class="back-btn" onclick="goBack()">← Орқага</button>';
    html += '</div>';

    html += '<div class="detail-hero" style="background: linear-gradient(160deg, ' + p.color + ' 0%, ' + p.color + 'cc 50%, ' + p.color + '88 100%);">';
    html += '<div class="detail-art">' + iconFor(p.id) + '</div>';
    html += '<div class="detail-arabic">' + escapeHtml(p.arabic) + '</div>';
    html += '<div class="detail-name">' + escapeHtml(p.name) + '</div>';
    html += '<div class="detail-loc">📍 ' + escapeHtml(p.city) + ' · ' + escapeHtml(p.country) + '</div>';
    html += '</div>';

    html += '<section class="detail-block"><div class="block-title">Ҳақида</div>';
    html += '<p class="block-text">' + escapeHtml(p.description) + '</p>';
    html += '</section>';

    if (p.verses && p.verses.length) {
      html += '<section class="detail-block"><div class="block-title">Қуръон оятлари</div>';
      for (let i = 0; i < p.verses.length; i++) {
        const v = p.verses[i];
        html += '<div class="quote-card">';
        html += '<div class="quote-source">' + escapeHtml(v.source) + '</div>';
        html += '<div class="quote-text">«' + escapeHtml(v.translation) + '»</div>';
        html += '</div>';
      }
      html += '</section>';
    }

    if (p.hadiths && p.hadiths.length) {
      html += '<section class="detail-block"><div class="block-title">Ҳадислар</div>';
      for (let i = 0; i < p.hadiths.length; i++) {
        const h = p.hadiths[i];
        html += '<div class="quote-card">';
        html += '<div class="quote-source">' + escapeHtml(h.source) + '</div>';
        html += '<div class="quote-text">«' + escapeHtml(h.text) + '»</div>';
        if (h.narrator) html += '<div class="quote-attr">— ' + escapeHtml(h.narrator) + '</div>';
        html += '</div>';
      }
      html += '</section>';
    }

    html += '</div>';
    document.getElementById('view-detail').innerHTML = html;
  }

  // === НАВИГАЦИЯ ===
  function showList() { location.hash = ''; }
  function showPlace(id) { location.hash = '#/place/' + encodeURIComponent(id); }
  function goBack() { history.length > 1 ? history.back() : showList(); }

  function route() {
    const h = (location.hash || '').replace(/^#\/?/, '');
    if (h.indexOf('place/') === 0) {
      const id = decodeURIComponent(h.slice('place/'.length));
      renderDetail(id);
      show('detail');
    } else {
      renderList();
      show('list');
    }
    window.scrollTo(0, 0);
  }

  function show(which) {
    document.getElementById('view-list').classList.toggle('hidden', which !== 'list');
    document.getElementById('view-detail').classList.toggle('hidden', which !== 'detail');
  }

  window.showList = showList;
  window.showPlace = showPlace;
  window.goBack = goBack;

  window.addEventListener('hashchange', route);
  route();
})();
