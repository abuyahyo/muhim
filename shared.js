// === МУҲИМ — БАРЧА БЎЛИМЛАР УЧУН УМУМИЙ ЁРДАМЧИ ФУНКЦИЯЛАР ===
// Вақтлар / Кунлар / Жойлар бўлимлари бир хил ишлатадиган функциялар бу
// ерда бир жойга жамланган. Build тизими йўқ — оддий global namespace
// (window.MuhimShared) орқали улашилади. Ҳар бир app.js буни IIFE
// бошида destructure қилиб олади.
(function () {
  'use strict';

  // HTML'га хавфсиз жойлаш учун махсус белгиларни escape қилади.
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  // Соатга кўра ҳаво ранги — барча бўлимларда бир хил.
  // 4–7: dawn, 7–17: day, 17–19: dusk, 19–23: evening, 23–4: night.
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

  window.MuhimShared = { escapeHtml, currentMood, renderQuoteList };
})();
