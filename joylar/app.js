// === ЖОЙЛАР — МАСЖИДЛАР ИЛОВАСИ ===
(function () {
  'use strict';

  const { places } = JoylarData;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  // Соатга кўра ҳаво ранги — Кунлар ва Вақтлар саҳифалари билан бир хил.
  function currentMood() {
    const hr = new Date().getHours();
    if (hr >= 4 && hr < 7) return 'dawn';
    if (hr >= 7 && hr < 17) return 'day';
    if (hr >= 17 && hr < 19) return 'dusk';
    if (hr >= 19 && hr < 23) return 'evening';
    return 'night';
  }

  // Узун рўйхатни қисқартиради: биринчи 3 тасини доимо кўрсатиб, қолганини
  // «Кўпроқ кўрсатиш» тугмаси ортида яширади (HTML details/summary).
  function renderQuoteList(items, renderItem) {
    const VISIBLE = 3;
    let out = '';
    const limit = Math.min(items.length, VISIBLE);
    for (let i = 0; i < limit; i++) out += renderItem(items[i]);
    if (items.length > VISIBLE) {
      const remaining = items.length - VISIBLE;
      out += '<details class="quote-more">';
      out += '<summary class="quote-more-summary">Кўпроқ кўрсатиш (' + remaining + ')</summary>';
      for (let i = VISIBLE; i < items.length; i++) out += renderItem(items[i]);
      out += '</details>';
    }
    return out;
  }

  // === БОШ САҲИФА — жойлар рўйхати ===
  function renderList() {
    let html = '<div class="fade-in mood--' + currentMood() + '">';
    html += '<header class="page-head">';
    html += '<div class="page-eyebrow">Муҳим</div>';
    html += '<h1 class="page-title">Жойлар</h1>';
    html += '</header>';

    html += '<div class="places-stack">';
    for (let i = 0; i < places.length; i++) {
      const p = places[i];
      const loc = [p.city, p.country].filter(Boolean).join(' · ');
      html += '<button class="place-card" onclick="showPlace(\'' + escapeHtml(p.id) + '\')">';
      html += '<img class="place-photo" src="img/' + escapeHtml(p.id) + '.webp" alt="" loading="lazy"/>';
      html += '<div class="place-scrim"></div>';
      html += '<div class="place-body">';
      html += '<div class="place-name">' + escapeHtml(p.name) + '</div>';
      if (loc) html += '<div class="place-loc">' + escapeHtml(loc) + '</div>';
      html += '</div>';
      html += '</button>';
    }
    html += '</div>';
    html += '</div>';

    document.getElementById('view-list').innerHTML = html;
  }

  // === ДЕТАЛЬ САҲИФА ===
  function renderDetail(id) {
    let p = null;
    for (let i = 0; i < places.length; i++) if (places[i].id === id) { p = places[i]; break; }
    if (!p) return;

    let html = '<div class="fade-in detail-wrap mood--' + currentMood() + '">';
    html += '<div class="detail-topbar">';
    html += '<button class="back-btn" onclick="goBack()">← Орқага</button>';
    html += '</div>';

    html += '<div class="detail-hero" style="background-image:url(img/' + escapeHtml(p.id) + '.webp);">';
    html += '<div class="detail-hero-scrim"></div>';
    html += '<div class="detail-hero-body">';
    const loc = [p.city, p.country].filter(Boolean).join(' · ');
    if (loc) html += '<div class="detail-eyebrow">' + escapeHtml(loc) + '</div>';
    html += '<div class="detail-name">' + escapeHtml(p.name) + '</div>';
    if (p.short) html += '<div class="detail-tagline">' + escapeHtml(p.short) + '</div>';
    html += '</div>';
    html += '</div>';

    if (p.description) {
      html += '<section class="detail-block"><div class="block-title">Ҳақида</div>';
      html += '<p class="block-text">' + escapeHtml(p.description) + '</p>';
      html += '</section>';
    }

    if (p.verses && p.verses.length) {
      html += '<section class="detail-block"><div class="block-title">Қуръон оятлари</div>';
      html += renderQuoteList(p.verses, function (v) {
        let card = '<div class="quote-card">';
        card += '<div class="quote-source">' + escapeHtml(v.source) + '</div>';
        card += '<div class="quote-text">«' + escapeHtml(v.translation) + '»</div>';
        card += '</div>';
        return card;
      });
      html += '</section>';
    }

    if (p.hadiths && p.hadiths.length) {
      html += '<section class="detail-block"><div class="block-title">Ҳадислар</div>';
      html += renderQuoteList(p.hadiths, function (h) {
        let card = '<div class="quote-card">';
        card += '<div class="quote-source">' + escapeHtml(h.source) + '</div>';
        card += '<div class="quote-text">«' + escapeHtml(h.text) + '»</div>';
        if (h.narrator) card += '<div class="quote-attr">— ' + escapeHtml(h.narrator) + '</div>';
        card += '</div>';
        return card;
      });
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
