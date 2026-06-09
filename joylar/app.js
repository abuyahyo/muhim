// === ЖОЙЛАР — МАСЖИДЛАР ИЛОВАСИ ===
(function () {
  'use strict';

  const { places } = JoylarData;
  const { escapeHtml, currentMood, renderQuoteList } = MuhimShared;

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
      html += '<button class="place-card" style="--pc:' + escapeHtml(p.color || '#0f172a') + '" onclick="showPlace(\'' + escapeHtml(p.id) + '\')">';
      html += '<img class="place-photo" src="img/' + escapeHtml(p.id) + '.webp" alt="" loading="lazy" onerror="this.remove()"/>';
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
    html += '<div class="detail-actions">';
    const hasShareContent = (p.verses && p.verses.length) || (p.hadiths && p.hadiths.length) || (p.notes && p.notes.length);
    if (hasShareContent) {
      html += '<button class="share-btn" onclick="sharePlaceSheet(\'' + escapeHtml(p.id) + '\')" aria-label="Расмлар тўплами" title="Тўлиқ маълумотли расмлар тўплами">';
      html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
      html += '<rect x="6" y="2" width="16" height="16" rx="2"/>';
      html += '<circle cx="12" cy="8" r="2"/>';
      html += '<path d="m22 13-1.3-1.3a2.4 2.4 0 0 0-3.4 0L11 18"/>';
      html += '<path d="M18 22H4a2 2 0 0 1-2-2V6"/>';
      html += '</svg></button>';
    }
    html += '<button class="share-btn" onclick="sharePlace(\'' + escapeHtml(p.id) + '\')" aria-label="Улашиш" title="Улашиш">';
    html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
    html += '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>';
    html += '<polyline points="16 6 12 2 8 6"/>';
    html += '<line x1="12" y1="2" x2="12" y2="15"/>';
    html += '</svg></button>';
    html += '</div>';
    html += '</div>';

    html += '<div class="detail-hero" style="background-color:' + escapeHtml(p.color || '#0f172a') + ';background-image:url(img/' + escapeHtml(p.id) + '.webp);">';
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
        if (v.arabic) card += '<div class="quote-arabic" dir="rtl">' + escapeHtml(v.arabic) + '</div>';
        card += '<div class="quote-text">«' + escapeHtml(v.translation) + '»</div>';
        if (v.commentary) card += '<div class="quote-commentary">' + escapeHtml(v.commentary) + '</div>';
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
        if (h.commentary) card += '<div class="quote-commentary">' + escapeHtml(h.commentary) + '</div>';
        card += '</div>';
        return card;
      });
      html += '</section>';
    }

    if (p.notes && p.notes.length) {
      for (let i = 0; i < p.notes.length; i++) {
        const n = p.notes[i];
        html += '<section class="detail-block"><div class="block-title">' + escapeHtml(n.title) + '</div>';
        html += '<p class="block-text">' + escapeHtml(n.text) + '</p>';
        html += '</section>';
      }
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

  // === УЛАШИШ (Web Share API + canvas расм) ===
  const SHARE_W = 1080;
  const SHARE_H = 1350;
  const SHARE_PAD_X = 80;
  const SHARE_CONTENT_TOP = 240;
  const SHARE_CONTENT_BOTTOM = 1240;
  const SHARE_BLOCK_GAP = 16;

  function findPlace(id) {
    for (let i = 0; i < places.length; i++) if (places[i].id === id) return places[i];
    return null;
  }

  // Жой суратини canvas учун юклаб олиш (бўлмаса null қайтаради).
  function loadPlacePhoto(id) {
    return new Promise(function (resolve) {
      const img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = 'img/' + id + '.webp';
    });
  }

  function fontsReady() {
    if (!(document.fonts && document.fonts.load)) return Promise.resolve();
    return Promise.all([
      document.fonts.load('800 96px "DM Sans"'),
      document.fonts.load('700 28px "DM Sans"'),
      document.fonts.load('500 28px "DM Sans"'),
      document.fonts.load('600 36px "DM Sans"')
    ]).catch(function () {});
  }

  // Якка муқова расмни улашиш.
  function sharePlace(id) {
    const p = findPlace(id);
    if (!p) return;
    Promise.all([fontsReady(), loadPlacePhoto(id)]).then(function (res) {
      const photo = res[1];
      const canvas = document.createElement('canvas');
      canvas.width = SHARE_W; canvas.height = SHARE_H;
      const ctx = canvas.getContext('2d');
      drawPlaceCover(ctx, p, photo);
      canvas.toBlob(function (blob) {
        const file = blob ? new File([blob], (p.id || 'joy') + '.png', { type: 'image/png' }) : null;
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share({ files: [file], title: p.name }).catch(function () {});
        } else if (navigator.share) {
          navigator.share({ title: p.name, text: p.short || '' }).catch(function () {});
        }
      }, 'image/png');
    });
  }

  // Кўп расмли тўплам (муқова + оят/ҳадис/изоҳ саҳифалари).
  function sharePlaceSheet(id) {
    const p = findPlace(id);
    if (!p) return;
    Promise.all([fontsReady(), loadPlacePhoto(id)]).then(function (res) {
      const photo = res[1];
      const measureCtx = document.createElement('canvas').getContext('2d');
      const items = collectPlaceShareItems(measureCtx, p);
      const pages = packSharePages(items);
      const allPages = [{ kind: 'cover' }].concat(pages);
      const total = allPages.length;
      Promise.all(allPages.map(function (page, idx) {
        return renderPlaceSharePage(p, page, idx + 1, total, photo);
      })).then(function (files) {
        const filtered = (files || []).filter(Boolean);
        if (filtered.length && navigator.canShare && navigator.canShare({ files: filtered })) {
          navigator.share({ files: filtered }).catch(function () {});
        } else if (filtered.length && navigator.canShare && navigator.canShare({ files: [filtered[0]] })) {
          navigator.share({ files: [filtered[0]] }).catch(function () {});
        } else if (navigator.share) {
          navigator.share({ title: p.name, text: p.short || '' }).catch(function () {});
        }
      });
    });
  }

  function collectPlaceShareItems(ctx, p) {
    const innerW = SHARE_W - SHARE_PAD_X * 2 - 72;
    const items = [];
    (p.verses || []).forEach(function (v) {
      items.push(measureBlock(ctx, String(v.source || '').toUpperCase(), '«' + v.translation + '»', innerW, v.commentary));
    });
    (p.hadiths || []).forEach(function (h) {
      const block = measureBlock(ctx, String(h.source || '').toUpperCase(), '«' + h.text + '»', innerW, h.commentary);
      if (h.narrator) { block.narrator = h.narrator; block.height += 36; }
      items.push(block);
    });
    (p.notes || []).forEach(function (n) {
      items.push(measureBlock(ctx, String(n.title || '').toUpperCase(), n.text, innerW));
    });
    return items;
  }

  function measureBlock(ctx, label, text, innerW, commentary) {
    const padTop = 22, labelGap = 38, padBottom = 22, lineH = 36;
    ctx.font = '500 28px "DM Sans", system-ui, sans-serif';
    const lines = layoutLines(ctx, text, innerW);
    const block = { label: label, lines: lines, height: padTop + labelGap + lines.length * lineH + padBottom };
    if (commentary) {
      ctx.font = '500 25px "DM Sans", system-ui, sans-serif';
      block.commentary = layoutLines(ctx, commentary, innerW);
      block.height += 18 + 30 + block.commentary.length * 34;
    }
    return block;
  }

  function packSharePages(items) {
    const pages = [];
    const budget = SHARE_CONTENT_BOTTOM - SHARE_CONTENT_TOP - 100;
    let page = { kind: 'content', items: [] };
    let used = 0;
    items.forEach(function (item) {
      const inc = item.height + (page.items.length ? SHARE_BLOCK_GAP : 0);
      if (page.items.length > 0 && used + inc > budget) {
        pages.push(page);
        page = { kind: 'content', items: [] };
        used = 0;
      }
      page.items.push(item);
      used += page.items.length === 1 ? item.height : inc;
    });
    if (page.items.length) pages.push(page);
    return pages;
  }

  function renderPlaceSharePage(p, page, pageNum, totalPages, photo) {
    const canvas = document.createElement('canvas');
    canvas.width = SHARE_W; canvas.height = SHARE_H;
    const ctx = canvas.getContext('2d');
    if (page.kind === 'cover') {
      drawPlaceCover(ctx, p, photo);
    } else {
      drawPlaceBackground(ctx, p);
      const headerBottom = drawPlaceHeaderCompact(ctx, p);
      drawShareContent(ctx, page.items, headerBottom + 30);
      drawShareFooter(ctx, pageNum, totalPages);
    }
    return new Promise(function (resolve) {
      canvas.toBlob(function (blob) {
        resolve(blob ? new File([blob], (p.id || 'joy') + '-' + pageNum + '.png', { type: 'image/png' }) : null);
      }, 'image/png');
    });
  }

  // Муқова: жой сурати фон + қоронғу парда + шаҳар·мамлакат, ном, таглайн.
  function drawPlaceCover(ctx, p, photo) {
    if (photo) drawPhotoCover(ctx, photo);
    else drawPlaceBackground(ctx, p);
    const scrim = ctx.createLinearGradient(0, 0, 0, SHARE_H);
    scrim.addColorStop(0, 'rgba(2,6,23,0.15)');
    scrim.addColorStop(0.45, 'rgba(2,6,23,0.35)');
    scrim.addColorStop(1, 'rgba(2,6,23,0.94)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, 0, SHARE_W, SHARE_H);

    const x = SHARE_PAD_X;
    const maxW = SHARE_W - SHARE_PAD_X * 2;
    ctx.textAlign = 'left';

    const siteY = SHARE_H - 70;
    ctx.font = '500 24px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.textBaseline = 'middle';
    ctx.fillText('abuyahyo.github.io/muhim/joylar', x, siteY);

    let cursorBottom = siteY - 40;
    if (p.short) {
      ctx.font = '500 30px "DM Sans", system-ui, sans-serif';
      const sLines = layoutLines(ctx, p.short, maxW);
      const sLineH = 40;
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.textBaseline = 'top';
      const sTop = cursorBottom - sLines.length * sLineH;
      for (let i = 0; i < sLines.length; i++) ctx.fillText(sLines[i], x, sTop + i * sLineH);
      cursorBottom = sTop - 18;
    }

    const fit = fitNameFont(ctx, p.name, maxW, 3, 96, 56, '800');
    const nameLines = Math.min(fit.lines.length, 3);
    const nLineH = Math.round(fit.size * 1.1);
    const nTop = cursorBottom - nameLines * nLineH;
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'top';
    ctx.font = '800 ' + fit.size + 'px "DM Sans", system-ui, sans-serif';
    for (let i = 0; i < nameLines; i++) ctx.fillText(fit.lines[i], x, nTop + i * nLineH);

    const loc = [p.city, p.country].filter(Boolean).join(' · ');
    if (loc) {
      ctx.font = '700 24px "DM Sans", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.82)';
      ctx.textBaseline = 'bottom';
      ctx.fillText(loc.toUpperCase(), x, nTop - 14);
    }
  }

  // Суратни "cover" тарзда (нисбатни сақлаб) тўлдириб чизиш.
  function drawPhotoCover(ctx, img) {
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    const scale = Math.max(SHARE_W / iw, SHARE_H / ih);
    const dw = iw * scale, dh = ih * scale;
    ctx.drawImage(img, (SHARE_W - dw) / 2, (SHARE_H - dh) / 2, dw, dh);
  }

  function drawPlaceBackground(ctx, p) {
    const color = p.color || '#0369a1';
    const grad = ctx.createLinearGradient(0, 0, SHARE_W, SHARE_H);
    grad.addColorStop(0, color);
    grad.addColorStop(0.5, color + 'dd');
    grad.addColorStop(1, color + 'aa');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, SHARE_W, SHARE_H);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    for (let i = 0; i < 30; i++) {
      const x = (i * 137 + 53) % SHARE_W;
      const y = (i * 211 + 91) % (SHARE_H * 0.5);
      const r = (i % 3) + 1.5;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawPlaceHeaderCompact(ctx, p) {
    ctx.textAlign = 'left';
    const loc = [p.city, p.country].filter(Boolean).join(' · ');
    ctx.font = '700 22px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.textBaseline = 'top';
    if (loc) ctx.fillText(loc.toUpperCase(), SHARE_PAD_X, 110);
    const fit = fitNameFont(ctx, p.name, SHARE_W - SHARE_PAD_X * 2, 2, 64, 40, '800');
    ctx.fillStyle = '#ffffff';
    const lineH = Math.round(fit.size * 1.1);
    const limit = Math.min(fit.lines.length, 2);
    ctx.font = '800 ' + fit.size + 'px "DM Sans", system-ui, sans-serif';
    for (let i = 0; i < limit; i++) ctx.fillText(fit.lines[i], SHARE_PAD_X, 145 + i * lineH);
    return 145 + limit * lineH;
  }

  function drawShareContent(ctx, items, startY) {
    const areaTop = Math.max(startY || SHARE_CONTENT_TOP, SHARE_CONTENT_TOP);
    let totalH = 0;
    for (let i = 0; i < items.length; i++) totalH += items[i].height + (i ? SHARE_BLOCK_GAP : 0);
    const avail = SHARE_CONTENT_BOTTOM - areaTop;
    let cursorY = areaTop;
    if (totalH < avail) cursorY = Math.round(areaTop + (avail - totalH) / 2);
    items.forEach(function (item) {
      drawShareBlock(ctx, SHARE_PAD_X, cursorY, SHARE_W - SHARE_PAD_X * 2, item);
      cursorY += item.height + SHARE_BLOCK_GAP;
    });
  }

  function drawShareBlock(ctx, x, y, w, item) {
    const padTop = 22, labelGap = 38, lineH = 36;
    const textX = x + 36;
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    roundRect(ctx, x, y, w, item.height, 28);
    ctx.fill();
    ctx.font = '700 22px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(item.label, textX, y + padTop);
    ctx.font = '500 28px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    let ty = y + padTop + labelGap;
    for (let i = 0; i < item.lines.length; i++) ctx.fillText(item.lines[i], textX, ty + i * lineH);
    ty += item.lines.length * lineH;
    if (item.narrator) {
      ctx.font = '600 22px "DM Sans", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText('— ' + item.narrator, textX, ty + 4);
      ty += 36;
    }
    if (item.commentary && item.commentary.length) {
      ty += 18;
      ctx.font = '700 20px "DM Sans", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText('ИЗОҲ', textX, ty);
      ty += 30;
      ctx.font = '500 25px "DM Sans", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      for (let i = 0; i < item.commentary.length; i++) ctx.fillText(item.commentary[i], textX, ty + i * 34);
    }
  }

  function drawShareFooter(ctx, pageNum, totalPages) {
    ctx.font = '500 24px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.textBaseline = 'middle';
    if (totalPages > 1) {
      ctx.textAlign = 'left';
      ctx.fillText(pageNum + ' / ' + totalPages, SHARE_PAD_X, SHARE_H - 80);
    }
    ctx.textAlign = 'right';
    ctx.fillText('abuyahyo.github.io/muhim/joylar', SHARE_W - SHARE_PAD_X, SHARE_H - 80);
  }

  function fitNameFont(ctx, name, maxW, maxLines, startSize, minSize, weight) {
    let size = startSize;
    while (size >= minSize) {
      ctx.font = weight + ' ' + size + 'px "DM Sans", system-ui, sans-serif';
      const lines = layoutLines(ctx, name, maxW);
      if (lines.length <= maxLines) return { size: size, lines: lines };
      size -= 8;
    }
    ctx.font = weight + ' ' + minSize + 'px "DM Sans", system-ui, sans-serif';
    return { size: minSize, lines: layoutLines(ctx, name, maxW) };
  }

  function layoutLines(ctx, text, maxW) {
    const words = String(text).replace(/\n+/g, ' ').split(/\s+/);
    const lines = [];
    let line = '';
    for (let i = 0; i < words.length; i++) {
      const test = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = words[i]; }
      else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  window.sharePlace = sharePlace;
  window.sharePlaceSheet = sharePlaceSheet;

  window.addEventListener('hashchange', route);
  route();
})();
