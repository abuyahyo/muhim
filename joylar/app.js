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

  // SVG иллюстратциялар — ҳар бир жой ўз архитектураси ва атмосфераси билан.
  // viewBox 240×240 — ўлчам CSS ҳал қилади.
  function iconFor(id) {
    if (id === 'haram') return haramSvg();
    if (id === 'nabawi') return nabawiSvg();
    if (id === 'aqsa') return aqsaSvg();
    return '';
  }

  // Каъба: туннги осмон, юлдузлар + ярим-ой, узоқ миноралар силуэтлари,
  // марказда қора кисва билан куб, олтин ҳизам ва эшик.
  function haramSvg() {
    return [
      '<svg viewBox="0 0 240 240" aria-hidden="true">',
      '<defs>',
        '<linearGradient id="haram-sky" x1="0" y1="0" x2="0" y2="1">',
          '<stop offset="0" stop-color="#1e3a8a" stop-opacity="0.7"/>',
          '<stop offset="1" stop-color="#0c1531" stop-opacity="0.95"/>',
        '</linearGradient>',
        '<linearGradient id="haram-gold" x1="0" y1="0" x2="0" y2="1">',
          '<stop offset="0" stop-color="#fde047"/>',
          '<stop offset="1" stop-color="#a16207"/>',
        '</linearGradient>',
      '</defs>',
      // Осмон
      '<rect width="240" height="240" rx="20" fill="url(#haram-sky)"/>',
      // Юлдузлар
      '<g fill="#fef3c7">',
        '<circle cx="32" cy="40" r="1.5"/>',
        '<circle cx="65" cy="22" r="1"/>',
        '<circle cx="105" cy="34" r="1.2"/>',
        '<circle cx="155" cy="20" r="1"/>',
        '<circle cx="205" cy="42" r="1.5"/>',
        '<circle cx="225" cy="68" r="1"/>',
        '<circle cx="20" cy="78" r="1"/>',
        '<circle cx="48" cy="92" r="0.8"/>',
      '</g>',
      // Ярим-ой ўнг тепада
      '<g transform="translate(190, 50)">',
        '<circle r="12" fill="#fef3c7"/>',
        '<circle cx="4" cy="-2" r="10.5" fill="#0c1531"/>',
      '</g>',
      // Узоқ миноралар (қоронғи силуэт)
      '<g fill="rgba(15, 23, 42, 0.7)" stroke="rgba(255,255,255,0.18)" stroke-width="0.6">',
        '<rect x="22" y="120" width="7" height="80"/>',
        '<path d="M 19 120 L 25.5 110 L 32 120 Z"/>',
        '<line x1="25.5" y1="110" x2="25.5" y2="102" stroke="#fbbf24" stroke-width="1"/>',
        '<rect x="48" y="135" width="6" height="65"/>',
        '<path d="M 45 135 L 51 127 L 57 135 Z"/>',
        '<rect x="188" y="125" width="7" height="75"/>',
        '<path d="M 185 125 L 191.5 116 L 198 125 Z"/>',
        '<line x1="191.5" y1="116" x2="191.5" y2="108" stroke="#fbbf24" stroke-width="1"/>',
        '<rect x="213" y="138" width="6" height="62"/>',
        '<path d="M 210 138 L 216 130 L 222 138 Z"/>',
      '</g>',
      // Ер
      '<rect x="0" y="195" width="240" height="45" fill="rgba(120, 53, 15, 0.55)"/>',
      '<path d="M 0 200 Q 120 197 240 200" stroke="rgba(255,255,255,0.2)" stroke-width="1" fill="none"/>',
      // Зиёратчилар силуэтлари (тавоф)
      '<g fill="rgba(0,0,0,0.55)">',
        '<ellipse cx="58" cy="195" rx="4" ry="6"/>',
        '<ellipse cx="78" cy="193" rx="3.5" ry="5.5"/>',
        '<ellipse cx="92" cy="194" rx="3" ry="5"/>',
        '<ellipse cx="148" cy="194" rx="3" ry="5"/>',
        '<ellipse cx="162" cy="193" rx="3.5" ry="5.5"/>',
        '<ellipse cx="182" cy="195" rx="4" ry="6"/>',
        '<ellipse cx="36" cy="197" rx="2.5" ry="4"/>',
        '<ellipse cx="204" cy="197" rx="2.5" ry="4"/>',
      '</g>',
      // Каъба
      '<g>',
        // Мармарли асос
        '<rect x="75" y="172" width="90" height="8" fill="rgba(241, 245, 249, 0.85)" stroke="rgba(0,0,0,0.3)" stroke-width="0.5"/>',
        // Куб (қора кисва)
        '<rect x="82" y="92" width="76" height="80" fill="#0a0a0a" stroke="rgba(255,255,255,0.25)" stroke-width="1"/>',
        // Енгил матоҳ-чизиқлар (вертикал)
        '<line x1="100" y1="100" x2="100" y2="170" stroke="rgba(255,255,255,0.04)" stroke-width="0.6"/>',
        '<line x1="120" y1="100" x2="120" y2="170" stroke="rgba(255,255,255,0.04)" stroke-width="0.6"/>',
        '<line x1="140" y1="100" x2="140" y2="170" stroke="rgba(255,255,255,0.04)" stroke-width="0.6"/>',
        // Олтин Ҳизам (тилла камар)
        '<rect x="82" y="111" width="76" height="16" fill="url(#haram-gold)" stroke="#78350f" stroke-width="0.5"/>',
        // Калли-graphic ишора (стилизованний)
        '<g stroke="#78350f" stroke-width="0.8" fill="none">',
          '<path d="M 87 119 q 2.5 -3 5 0 q 2.5 3 5 0"/>',
          '<path d="M 100 119 q 2.5 -3 5 0 q 2.5 3 5 0"/>',
          '<path d="M 113 119 q 2.5 -3 5 0 q 2.5 3 5 0"/>',
          '<path d="M 126 119 q 2.5 -3 5 0 q 2.5 3 5 0"/>',
          '<path d="M 139 119 q 2.5 -3 5 0 q 2.5 3 5 0"/>',
          '<path d="M 152 119 q 2 -2.5 4 0"/>',
        '</g>',
        // Эшик (ўнг тарафда)
        '<rect x="142" y="138" width="14" height="32" fill="url(#haram-gold)" stroke="#78350f" stroke-width="0.5"/>',
        '<line x1="149" y1="140" x2="149" y2="168" stroke="#78350f" stroke-width="0.5"/>',
        '<circle cx="146" cy="155" r="0.6" fill="#78350f"/>',
        '<circle cx="152" cy="155" r="0.6" fill="#78350f"/>',
        // Юқори ажралиш
        '<line x1="82" y1="92" x2="158" y2="92" stroke="rgba(255,255,255,0.35)" stroke-width="0.6"/>',
      '</g>',
      '</svg>'
    ].join('');
  }

  // Масжидул Набавий: яшил гумбаз (Қуббат-ул-Хадра), миноралар, ҳурмо
  // дарахтлари ва арккали девор.
  function nabawiSvg() {
    return [
      '<svg viewBox="0 0 240 240" aria-hidden="true">',
      '<defs>',
        '<linearGradient id="nab-sky" x1="0" y1="0" x2="0" y2="1">',
          '<stop offset="0" stop-color="#7dd3fc"/>',
          '<stop offset="1" stop-color="#082f49"/>',
        '</linearGradient>',
        '<linearGradient id="nab-dome" x1="0" y1="0" x2="0" y2="1">',
          '<stop offset="0" stop-color="#4ade80"/>',
          '<stop offset="0.5" stop-color="#16a34a"/>',
          '<stop offset="1" stop-color="#14532d"/>',
        '</linearGradient>',
      '</defs>',
      // Осмон
      '<rect width="240" height="240" rx="20" fill="url(#nab-sky)"/>',
      // Юлдузлар
      '<g fill="rgba(255,255,255,0.7)">',
        '<circle cx="30" cy="28" r="1"/>',
        '<circle cx="195" cy="35" r="1.2"/>',
        '<circle cx="215" cy="20" r="0.8"/>',
        '<circle cx="55" cy="50" r="0.8"/>',
      '</g>',
      // Узоқ ҳурмо силуэтлари
      '<g>',
        '<rect x="14" y="135" width="3" height="65" fill="rgba(20, 30, 50, 0.7)"/>',
        '<g transform="translate(15.5, 135)" fill="rgba(34, 197, 94, 0.65)">',
          '<path d="M 0 0 Q -12 -8 -18 -2 Q -10 0 0 0 Z"/>',
          '<path d="M 0 0 Q 12 -8 18 -2 Q 10 0 0 0 Z"/>',
          '<path d="M 0 0 Q -6 -18 -3 -22 Q 2 -12 0 0 Z"/>',
          '<path d="M 0 0 Q 6 -18 3 -22 Q -2 -12 0 0 Z"/>',
          '<circle cx="-12" cy="-3" r="1" fill="#854d0e"/>',
          '<circle cx="10" cy="-2" r="1" fill="#854d0e"/>',
        '</g>',
        '<rect x="223" y="140" width="3" height="60" fill="rgba(20, 30, 50, 0.7)"/>',
        '<g transform="translate(224.5, 140)" fill="rgba(34, 197, 94, 0.65)">',
          '<path d="M 0 0 Q -12 -8 -18 -2 Q -10 0 0 0 Z"/>',
          '<path d="M 0 0 Q 10 -7 15 -1 Q 8 0 0 0 Z"/>',
          '<path d="M 0 0 Q -6 -18 -3 -22 Q 2 -12 0 0 Z"/>',
        '</g>',
      '</g>',
      // Масжид деворлари (кенг)
      '<g>',
        '<rect x="30" y="148" width="180" height="58" fill="rgba(248, 250, 252, 0.92)" stroke="rgba(15, 23, 42, 0.25)" stroke-width="0.6"/>',
        // Аркаллар
        '<g fill="rgba(15, 23, 42, 0.35)">',
          '<path d="M 42 206 L 42 178 Q 42 168 51 168 Q 60 168 60 178 L 60 206 Z"/>',
          '<path d="M 72 206 L 72 178 Q 72 168 81 168 Q 90 168 90 178 L 90 206 Z"/>',
          '<path d="M 102 206 L 102 178 Q 102 168 111 168 Q 120 168 120 178 L 120 206 Z"/>',
          '<path d="M 132 206 L 132 178 Q 132 168 141 168 Q 150 168 150 178 L 150 206 Z"/>',
          '<path d="M 162 206 L 162 178 Q 162 168 171 168 Q 180 168 180 178 L 180 206 Z"/>',
          '<path d="M 192 206 L 192 178 Q 192 168 199 168 Q 206 168 206 178 L 206 206 Z"/>',
        '</g>',
        // Юқори безак
        '<rect x="30" y="142" width="180" height="6" fill="#15803d"/>',
      '</g>',
      // 4 минораҳ — иккита олд, иккита орқа кичкина
      '<g fill="rgba(248, 250, 252, 0.95)" stroke="rgba(0,0,0,0.2)" stroke-width="0.5">',
        // Чап олд
        '<rect x="34" y="78" width="10" height="70"/>',
        '<rect x="32" y="74" width="14" height="6"/>',
        '<ellipse cx="39" cy="72" rx="6.5" ry="3"/>',
        '<rect x="36" y="54" width="6" height="18"/>',
        '<path d="M 33 56 L 39 44 L 45 56 Z" fill="#16a34a"/>',
        '<line x1="39" y1="44" x2="39" y2="35" stroke="rgba(255,255,255,0.85)" stroke-width="1.2"/>',
        '<circle cx="39" cy="32" r="2.3" fill="#16a34a"/>',
        // Ўнг олд
        '<rect x="196" y="78" width="10" height="70"/>',
        '<rect x="194" y="74" width="14" height="6"/>',
        '<ellipse cx="201" cy="72" rx="6.5" ry="3"/>',
        '<rect x="198" y="54" width="6" height="18"/>',
        '<path d="M 195 56 L 201 44 L 207 56 Z" fill="#16a34a"/>',
        '<line x1="201" y1="44" x2="201" y2="35" stroke="rgba(255,255,255,0.85)" stroke-width="1.2"/>',
        '<circle cx="201" cy="32" r="2.3" fill="#16a34a"/>',
      '</g>',
      // Марказий Қуббат-ул-Хадра (яшил гумбаз)
      '<g>',
        '<ellipse cx="120" cy="148" rx="32" ry="6" fill="rgba(248, 250, 252, 0.85)"/>',
        '<path d="M 88 148 Q 88 100 120 92 Q 152 100 152 148 Z" fill="url(#nab-dome)" stroke="rgba(0,0,0,0.25)" stroke-width="0.6"/>',
        // Гумбаздаги ёруғлик
        '<path d="M 98 142 Q 95 115 108 98" stroke="rgba(255, 255, 255, 0.3)" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
        // Ярим-ой устида
        '<line x1="120" y1="92" x2="120" y2="76" stroke="#16a34a" stroke-width="1.8"/>',
        '<g transform="translate(120, 70)">',
          '<circle r="6" fill="#16a34a"/>',
          '<circle cx="2.5" cy="-1.2" r="5.2" fill="url(#nab-sky)"/>',
        '</g>',
      '</g>',
      '</svg>'
    ].join('');
  }

  // Масжидул Ақсо: Қуббатус-Сахра (олтин гумбаз) + Қудс девори + зайтун
  // дарахтлари. Айни жанубида Ал-Ақсо ўзи кумуш гумбаз билан.
  function aqsaSvg() {
    return [
      '<svg viewBox="0 0 240 240" aria-hidden="true">',
      '<defs>',
        '<linearGradient id="aqsa-sky" x1="0" y1="0" x2="0" y2="1">',
          '<stop offset="0" stop-color="#fbcfe8" stop-opacity="0.7"/>',
          '<stop offset="0.5" stop-color="#9333ea" stop-opacity="0.5"/>',
          '<stop offset="1" stop-color="#1e1b4b"/>',
        '</linearGradient>',
        '<radialGradient id="aqsa-gold" cx="0.5" cy="0.3">',
          '<stop offset="0" stop-color="#fef08a"/>',
          '<stop offset="0.5" stop-color="#f59e0b"/>',
          '<stop offset="1" stop-color="#854d0e"/>',
        '</radialGradient>',
      '</defs>',
      // Осмон
      '<rect width="240" height="240" rx="20" fill="url(#aqsa-sky)"/>',
      // Юлдузлар
      '<g fill="rgba(255,255,255,0.8)">',
        '<circle cx="30" cy="28" r="1"/>',
        '<circle cx="208" cy="22" r="1.3"/>',
        '<circle cx="180" cy="40" r="0.8"/>',
        '<circle cx="65" cy="45" r="0.8"/>',
      '</g>',
      // Қудс шаҳар девори
      '<path d="M 0 215 L 0 178 L 12 178 L 12 170 L 22 170 L 22 178 L 38 178 L 38 172 L 48 172 L 48 178 L 70 178 L 70 175 L 86 175 L 86 178 L 240 178 L 240 215 Z" fill="rgba(120, 53, 15, 0.85)" stroke="rgba(0,0,0,0.3)" stroke-width="0.5"/>',
      '<g fill="rgba(0,0,0,0.4)">',
        '<rect x="2" y="187" width="3" height="6"/>',
        '<rect x="50" y="187" width="3" height="6"/>',
        '<rect x="74" y="187" width="3" height="6"/>',
        '<rect x="232" y="187" width="3" height="6"/>',
      '</g>',
      // Зайтун дарахтлари
      '<g>',
        '<rect x="10" y="170" width="2.5" height="15" fill="rgba(0,0,0,0.6)"/>',
        '<circle cx="11.5" cy="168" r="6" fill="rgba(101, 163, 13, 0.7)"/>',
        '<circle cx="8" cy="170" r="3.5" fill="rgba(132, 204, 22, 0.5)"/>',
        '<rect x="226" y="172" width="2.5" height="13" fill="rgba(0,0,0,0.6)"/>',
        '<circle cx="227.5" cy="170" r="5.5" fill="rgba(101, 163, 13, 0.7)"/>',
      '</g>',
      // Кичкина Ал-Ақсо масжиди (кумуш гумбаз) — чап томонда
      '<g>',
        '<rect x="35" y="148" width="36" height="30" fill="#c2b07e" stroke="rgba(0,0,0,0.3)" stroke-width="0.4"/>',
        '<rect x="35" y="148" width="36" height="4" fill="#92400e"/>',
        // Аркаллар
        '<path d="M 41 178 L 41 162 Q 41 156 47 156 Q 53 156 53 162 L 53 178 Z" fill="rgba(0,0,0,0.35)"/>',
        '<path d="M 55 178 L 55 162 Q 55 156 61 156 Q 67 156 67 162 L 67 178 Z" fill="rgba(0,0,0,0.35)"/>',
        // Кумуш гумбаз
        '<path d="M 44 148 Q 44 130 53 126 Q 62 130 62 148 Z" fill="#94a3b8" stroke="rgba(0,0,0,0.3)" stroke-width="0.5"/>',
        '<path d="M 47 145 Q 46 134 51 128" stroke="rgba(255,255,255,0.5)" stroke-width="1.2" fill="none" stroke-linecap="round"/>',
        '<line x1="53" y1="126" x2="53" y2="118" stroke="rgba(148, 163, 184, 0.9)" stroke-width="1.2"/>',
        '<g transform="translate(53, 113)">',
          '<circle r="3.5" fill="rgba(203, 213, 225, 0.95)"/>',
          '<circle cx="1.5" cy="-0.8" r="3" fill="url(#aqsa-sky)"/>',
        '</g>',
      '</g>',
      // Қуббатус-Сахра — олтин гумбаз ва саккиз-қиррали асос
      '<g>',
        // Саккиз-қиррали базис (фронтнад 5 қиррани кўрсатамиз)
        '<polygon points="92,178 102,138 122,128 152,128 172,138 182,178" fill="#d4a574" stroke="rgba(0,0,0,0.3)" stroke-width="0.5"/>',
        // Безак нақшлари (плитка)
        '<g fill="rgba(56, 189, 248, 0.7)" stroke="rgba(0,0,0,0.2)" stroke-width="0.3">',
          '<rect x="107" y="145" width="11" height="22"/>',
          '<rect x="122" y="143" width="11" height="22"/>',
          '<rect x="137" y="143" width="11" height="22"/>',
          '<rect x="152" y="145" width="11" height="22"/>',
        '</g>',
        // Безак ва ёзув жойи (юқори чизиқ)
        '<rect x="94" y="135" width="86" height="5" fill="rgba(56, 189, 248, 0.55)"/>',
        // Цилиндр (барабан)
        '<rect x="100" y="115" width="60" height="20" fill="#fbbf24" stroke="rgba(0,0,0,0.3)" stroke-width="0.5"/>',
        // Деразалар барабанда
        '<g fill="rgba(0,0,0,0.4)">',
          '<rect x="108" y="120" width="4" height="9" rx="1"/>',
          '<rect x="118" y="120" width="4" height="9" rx="1"/>',
          '<rect x="128" y="120" width="4" height="9" rx="1"/>',
          '<rect x="138" y="120" width="4" height="9" rx="1"/>',
          '<rect x="148" y="120" width="4" height="9" rx="1"/>',
        '</g>',
        // Олтин гумбаз
        '<path d="M 100 115 Q 100 70 130 64 Q 160 70 160 115 Z" fill="url(#aqsa-gold)" stroke="rgba(139, 69, 19, 0.5)" stroke-width="0.6"/>',
        // Гумбаздаги ёруғлик
        '<path d="M 110 110 Q 107 85 122 70" stroke="rgba(255, 255, 255, 0.4)" stroke-width="3" fill="none" stroke-linecap="round"/>',
        // Ярим-ой ва найза
        '<line x1="130" y1="64" x2="130" y2="48" stroke="#f59e0b" stroke-width="2"/>',
        '<g transform="translate(130, 41)">',
          '<circle r="6.5" fill="#fbbf24"/>',
          '<circle cx="2.5" cy="-1.5" r="5.5" fill="url(#aqsa-sky)"/>',
        '</g>',
      '</g>',
      '</svg>'
    ].join('');
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
