// === ВАҚТЛАР — НАМОЗ ВА МАЪНАВИЙ ВАҚТЛАР ИЛОВАСИ ===
(function () {
  'use strict';

  const { prayers, spiritual } = VaqtlarData;
  const STORAGE_KEY = 'vaqtlar.settings.v1';
  const DEFAULT_LOC = { lat: 41.2995, lon: 69.2401, name: 'Тошкент' }; // фолбэк
  const KAABA = { lat: 21.4225, lon: 39.8262 };

  // === Қибла йўналиши (great-circle bearing шимолдан соат стрелкаси бўйича) ===
  function qiblaBearing(lat, lon) {
    const toRad = function (d) { return d * Math.PI / 180; };
    const φ1 = toRad(lat), φ2 = toRad(KAABA.lat);
    const Δλ = toRad(KAABA.lon - lon);
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }

  // === Settings (localStorage) ===
  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return Object.assign(defaults(), JSON.parse(raw));
    } catch (e) {}
    return defaults();
  }
  function saveSettings(s) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) {}
  }
  function defaults() {
    return { madhab: 'Hanafi', method: 'MWL', location: null };
  }
  let settings = loadSettings();

  // === Геолокация ===
  function detectLocation() {
    return new Promise(function (resolve) {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          resolve({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            name: 'Жорий жой'
          });
        },
        function () { resolve(null); },
        { timeout: 8000, maximumAge: 60 * 60 * 1000 }
      );
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function fmtTime(d) {
    if (!d) return '—';
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return h + ':' + m;
  }

  function fmtHHMM(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = function (n) { return String(n).padStart(2, '0'); };
    if (h > 0) return pad(h) + ':' + pad(m) + ':' + pad(s);
    return pad(m) + ':' + pad(s);
  }

  // Соатга кўра ҳаво ранги — Кунлар/Жойлар билан бир хил.
  // 4–7: dawn, 7–17: day, 17–19: dusk, 19–23: evening, 23–4: night.
  function currentMood() {
    const hr = new Date().getHours();
    if (hr >= 4 && hr < 7) return 'dawn';
    if (hr >= 7 && hr < 17) return 'day';
    if (hr >= 17 && hr < 19) return 'dusk';
    if (hr >= 19 && hr < 23) return 'evening';
    return 'night';
  }

  // "<сура> сураси, N-оят" ёки "<сура> сураси, N-M-оят" шаклидаги
  // манбани сура номи ва оят оралиғига ажратади.
  function parseVerseSource(source) {
    const m = String(source).match(/^(.+?)\s+сураси,\s*(\d+)(?:-(\d+))?-оят\s*$/);
    if (!m) return null;
    const start = parseInt(m[2], 10);
    const end = m[3] ? parseInt(m[3], 10) : start;
    return { surah: m[1].trim(), start: start, end: end };
  }

  // Битта сурадан кетма-кет келадиган оятларни битта картага бирлаштиради.
  function groupVerses(verses) {    const groups = [];
    let current = null;
    for (let i = 0; i < verses.length; i++) {
      const v = verses[i];
      const parsed = parseVerseSource(v.source);
      if (parsed && current && current.surah === parsed.surah && parsed.start === current.end + 1) {
        current.end = parsed.end;
        current.translations.push(v.translation);
        continue;
      }
      if (current) groups.push(current);
      current = parsed
        ? { surah: parsed.surah, start: parsed.start, end: parsed.end, translations: [v.translation] }
        : { source: v.source, translations: [v.translation] };
    }
    if (current) groups.push(current);
    return groups.map(function (g) {
      if (g.surah) {
        const range = g.start === g.end ? (g.start + '-оят') : (g.start + '-' + g.end + '-оят');
        return { source: g.surah + ' сураси, ' + range, translation: g.translations.join(' ') };
      }
      return { source: g.source, translation: g.translations.join(' ') };
    });
  }

  // Узун рўйхатни қисқартиради: биринчи 4 тасини доимо кўрсатиб, қолганини
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

  // Жорий вақт қайси намоз вақтига кириб турганини аниқлаш.
  // Аср фарзи кириб бўлгач — у вақт "ҳозирги" бўлади (Шом гача).
  // Қайтаради: ҳозирги намоз индекси (prayers ичида) + кейингиси Date.
  function currentAndNext(times, now) {
    const sequence = [
      { id: 'fajr',    t: times.fajr },
      { id: 'sunrise', t: times.sunrise },
      { id: 'dhuhr',   t: times.dhuhr },
      { id: 'asr',     t: times.asr },
      { id: 'maghrib', t: times.maghrib },
      { id: 'isha',    t: times.isha },
    ];
    let currentId = null;
    let nextId = null;
    let nextTime = null;
    for (let i = 0; i < sequence.length; i++) {
      if (now < sequence[i].t) {
        nextId = sequence[i].id;
        nextTime = sequence[i].t;
        // Бомдоддан олдин — Хуфтон вақти ҳамон давом этмоқда (кеча).
        currentId = i > 0 ? sequence[i - 1].id : 'isha';
        break;
      }
    }
    // Хуфтондан кейин — эртанги Бомдод гача.
    if (!nextId) {
      currentId = 'isha';
      nextId = 'fajr-next';
      // эртанги фажр'ни ҳисоблаб қояйлик (caller параметр сифатида беради).
    }
    return { currentId, nextId, nextTime };
  }

  // === БОШ САҲИФА ===
  function renderHome() {
    const loc = settings.location || DEFAULT_LOC;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

    const opts = { madhab: settings.madhab, method: settings.method };
    const times = PrayerTimes.calculate(today, loc.lat, loc.lon, opts);
    const tomTimes = PrayerTimes.calculate(tomorrow, loc.lat, loc.lon, opts);
    const tahajjud = PrayerTimes.tahajjudWindow(today, loc.lat, loc.lon, opts);

    const cn = currentAndNext(times, now);
    if (cn.nextId === 'fajr-next') {
      cn.nextTime = tomTimes.fajr;
    }

    // Кейинги намоз номини олиш.
    const nextLabel = (cn.nextId === 'fajr-next')
      ? 'Эртанги Бомдод'
      : prayers.find(p => p.id === cn.nextId).name;
    const countdownMs = cn.nextTime ? (cn.nextTime - now) : 0;

    const heroMood = currentMood();

    let html = '<div class="fade-in mood--' + heroMood + '">';

    // Header
    html += '<header class="page-head">';
    html += '<div class="page-eyebrow">Муҳим</div>';
    html += '<h1 class="page-title">Вақтлар</h1>';
    html += '</header>';

    // Кейинги намоз ва countdown — соатга мос ҳаво ранги ўйнаб туради.
    html += '<section class="today-hero today-hero--' + heroMood + '">';
    html += '<div class="countdown-block">';
    html += '<div class="countdown-eyebrow">';
    html +=   '<span>Кейинги</span>';
    html +=   '<span class="countdown-eyebrow-name">' + escapeHtml(nextLabel) + '</span>';
    if (cn.nextTime) {
      html += '<span class="countdown-eyebrow-at">' + escapeHtml(fmtTime(cn.nextTime)) + '</span>';
    }
    html += '</div>';
    html += '<div class="countdown-time" id="countdown-time">' + fmtHHMM(countdownMs) + '</div>';
    html += '</div>';
    html += '</section>';

    // Намоз вақтлари рўйхати
    html += '<section class="times-section">';
    html += '<div class="times-section-title">Бугунги вақтлар</div>';
    html += '<div class="prayers-list">';
    for (let i = 0; i < prayers.length; i++) {
      const p = prayers[i];
      const t = times[p.id];
      const isCurrent = (p.id === cn.currentId);
      const cls = 'prayer-row' + (isCurrent ? ' is-current' : '');
      html += '<button class="' + cls + '" onclick="showPrayer(\'' + p.id + '\')">';
      html += '<span class="prayer-dot" aria-hidden="true"></span>';
      html += '<span class="prayer-name">' + escapeHtml(p.name) + '</span>';
      html += '<span class="prayer-time">' + fmtTime(t) + '</span>';
      html += '</button>';
    }
    html += '</div>';
    html += '</section>';

    // Таҳажжуд ойнаси
    if (tahajjud) {
      html += '<section class="times-section">';
      html += '<div class="times-section-title">Маънавий вақтлар</div>';
      html += '<div class="spiritual-list">';

      html += '<button class="spiritual-card" onclick="showSpiritual(\'tahajjud\')">';
      html += '<div class="spiritual-name">Таҳажжуд ва Қиёмул-лайл</div>';
      html += '</button>';

      html += '<button class="spiritual-card" onclick="showSpiritual(\'azkar\')">';
      html += '<div class="spiritual-name">Эрталабки ва Кечқурунги зикрлар</div>';
      html += '</button>';

      // Зуҳо (Чошт) ойнаси — қуёш чиқишидан ~20 дақиқа кейин, Пешиндан ~5 дақиқа олдин.
      const duhaStart = new Date(times.sunrise.getTime() + 20 * 60 * 1000);
      const duhaEnd = new Date(times.dhuhr.getTime() - 5 * 60 * 1000);
      html += '<button class="spiritual-card" onclick="showSpiritual(\'duha\')">';
      html += '<div class="spiritual-head">';
      html +=   '<div class="spiritual-name">Зуҳо</div>';
      html +=   '<div class="spiritual-range">' + fmtTime(duhaStart) + ' → ' + fmtTime(duhaEnd) + '</div>';
      html += '</div>';
      html += '</button>';

      html += '<button class="spiritual-card" onclick="showSpiritual(\'sahar\')">';
      html += '<div class="spiritual-name">Саҳарлик / Ифтор</div>';
      html += '</button>';

      html += '<button class="spiritual-card" onclick="showSpiritual(\'mustajob\')">';
      html += '<div class="spiritual-name">Мустажоб соатлар</div>';
      html += '</button>';

      html += '</div></section>';
    }

    // Қибла йўналиши
    const qBear = qiblaBearing(loc.lat, loc.lon);
    html += '<section class="qibla-section">';
    html += '<div class="times-section-title">Қибла йўналиши</div>';
    html += '<div class="qibla-card">';
    html += '<div class="qibla-compass" id="qibla-compass" data-qibla="' + qBear.toFixed(2) + '">';
    html +=   '<div class="qibla-rose">';
    html +=     '<div class="qibla-arrow" id="qibla-arrow" style="transform: rotate(' + qBear.toFixed(2) + 'deg);">';
    html +=       '<span class="qibla-arrow-head">▲</span>';
    html +=     '</div>';
    html +=   '</div>';
    html += '</div>';
    html += '<div class="qibla-meta">';
    html +=   '<button class="qibla-live-btn" id="qibla-live-btn" onclick="enableQiblaLive()">Жонли компас</button>';
    html += '</div>';
    html += '</div>';
    html += '</section>';

    // Sozlamalar (collapsible)
    html += '<section class="settings-section">';
    html += '<details class="settings-details">';
    html += '<summary class="settings-summary">⚙ Созламалар</summary>';
    html += '<div class="settings-body">';

    html += '<div class="setting-row">';
    html += '<label class="setting-label">Мазҳаб (Аср вақтига таъсир қилади)</label>';
    html += '<div class="setting-options">';
    html += '<button class="opt-btn' + (settings.madhab === 'Hanafi' ? ' active' : '') + '" onclick="setMadhab(\'Hanafi\')">Ҳанафий</button>';
    html += '<button class="opt-btn' + (settings.madhab === 'Shafi' ? ' active' : '') + '" onclick="setMadhab(\'Shafi\')">Шофиъий</button>';
    html += '</div></div>';

    html += '<div class="setting-row">';
    html += '<label class="setting-label">Ҳисоблаш усули</label>';
    html += '<div class="setting-options">';
    const methods = [
      { id: 'MWL', label: 'MWL' },
      { id: 'Egypt', label: 'Миср' },
      { id: 'Karachi', label: 'Карачи' },
      { id: 'Makkah', label: 'Уммул Қуро' },
      { id: 'ISNA', label: 'ISNA' },
    ];
    for (let i = 0; i < methods.length; i++) {
      const m = methods[i];
      html += '<button class="opt-btn' + (settings.method === m.id ? ' active' : '') + '" '
           + 'onclick="setMethod(\'' + m.id + '\')">' + escapeHtml(m.label) + '</button>';
    }
    html += '</div></div>';

    html += '<div class="setting-row">';
    html += '<label class="setting-label">Шаҳар</label>';
    html += '<div class="city-search">';
    html +=   '<input class="city-input" type="search" autocomplete="off" '
         +     'placeholder="Шаҳар номини ёзинг…" oninput="cityQuery(this.value)" />';
    html +=   '<div class="city-results" id="city-results"></div>';
    html += '</div>';
    html += '<div class="setting-hint">Жорий: ' + escapeHtml(loc.name) + '</div>';
    html += '</div>';

    html += '</div></details>';
    html += '</section>';

    html += '</div>';

    document.getElementById('view-home').innerHTML = html;

    // Countdown'ни ҳар секунда янгилаймиз.
    startCountdown(cn.nextTime);
  }

  // === Countdown ticker ===
  let countdownTimer = null;
  function startCountdown(target) {
    if (countdownTimer) clearInterval(countdownTimer);
    if (!target) return;
    countdownTimer = setInterval(function () {
      const el = document.getElementById('countdown-time');
      if (!el) { clearInterval(countdownTimer); return; }
      const ms = target - new Date();
      if (ms <= 0) {
        clearInterval(countdownTimer);
        renderHome(); // вақт ўтди — қайта рендер.
        return;
      }
      el.innerHTML = fmtHHMM(ms);
    }, 1000);
  }

  // === ДЕТАЛЬ САҲИФА (намоз ёки маънавий вақт) ===
  function renderDetail(id, kind) {
    const list = kind === 'spiritual' ? spiritual : prayers;
    const p = list.find(x => x.id === id);
    if (!p) return;

    // Намоз учун бугунги вақтини ҳам кўрсатамиз.
    let timeStr = '';
    if (kind === 'prayer') {
      const loc = settings.location || DEFAULT_LOC;
      const opts = { madhab: settings.madhab, method: settings.method };
      const t = PrayerTimes.calculate(new Date(), loc.lat, loc.lon, opts);
      timeStr = fmtTime(t[id]);
    }

    let html = '<div class="fade-in detail-wrap mood--' + currentMood() + '">';
    html += '<div class="detail-topbar">';
    html += '<button class="back-btn" onclick="goBack()">← Орқага</button>';
    html += '<button class="share-btn" onclick="shareSubject(\'' + escapeHtml(id) + '\', \'' + escapeHtml(kind) + '\')" aria-label="Улашиш" title="Улашиш">';
    html +=   '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
    html +=     '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>';
    html +=     '<polyline points="16 6 12 2 8 6"/>';
    html +=     '<line x1="12" y1="2" x2="12" y2="15"/>';
    html +=   '</svg>';
    html += '</button>';
    html += '</div>';

    html += '<div class="detail-hero">';
    html += '<div class="detail-name">' + escapeHtml(p.name) + '</div>';
    if (timeStr) {
      html += '<div class="detail-time">' + escapeHtml(timeStr) + '</div>';
    }
    html += '</div>';

    html += '<section class="detail-block"><div class="block-title">Ҳақида</div>';
    html += '<p class="block-text">' + escapeHtml(p.description) + '</p>';
    html += '</section>';

    if (p.id === 'azkar') {
      const loc = settings.location || DEFAULT_LOC;
      const opts = { madhab: settings.madhab, method: settings.method };
      const t = PrayerTimes.calculate(new Date(), loc.lat, loc.lon, opts);
      // Эрталабки: Бомдоддан Зуҳо бошланишига қадар (қуёш чиқишидан +20 дақиқа).
      const morningEnd = new Date(t.sunrise.getTime() + 20 * 60 * 1000);
      html += '<section class="detail-block"><div class="block-title">Бугунги вақтлар</div>';
      html += '<div class="azkar-windows">';
      html +=   '<div class="azkar-window">';
      html +=     '<div class="azkar-window-label">Эрталабки зикрлар вақти</div>';
      html +=     '<div class="azkar-window-time">' + fmtTime(t.fajr) + ' → ' + fmtTime(morningEnd) + '</div>';
      html +=   '</div>';
      html +=   '<div class="azkar-window">';
      html +=     '<div class="azkar-window-label">Кечқурунги зикрлар вақти</div>';
      html +=     '<div class="azkar-window-time">' + fmtTime(t.asr) + ' → ' + fmtTime(t.isha) + '</div>';
      html +=   '</div>';
      html += '</div>';
      html += '</section>';
    }

    if (p.id === 'tahajjud') {
      const loc = settings.location || DEFAULT_LOC;
      const opts = { madhab: settings.madhab, method: settings.method };
      const today = new Date();
      const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
      const tToday = PrayerTimes.calculate(today, loc.lat, loc.lon, opts);
      const tTomorrow = PrayerTimes.calculate(tomorrow, loc.lat, loc.lon, opts);
      const tah = PrayerTimes.tahajjudWindow(today, loc.lat, loc.lon, opts);
      if (tah && tToday.isha && tTomorrow.fajr) {
        html += '<section class="detail-block"><div class="block-title">Бугунги вақтлар</div>';
        html += '<div class="azkar-windows">';
        html +=   '<div class="azkar-window">';
        html +=     '<div class="azkar-window-label">Қиёмул-лайл вақти</div>';
        html +=     '<div class="azkar-window-time">' + fmtTime(tToday.isha) + ' → ' + fmtTime(tTomorrow.fajr) + '</div>';
        html +=   '</div>';
        html +=   '<div class="azkar-window">';
        html +=     '<div class="azkar-window-label">Таҳажжуд вақти</div>';
        html +=     '<div class="azkar-window-time">' + fmtTime(tah.start) + ' → ' + fmtTime(tah.end) + '</div>';
        html +=   '</div>';
        html += '</div>';
        html += '</section>';
      }
    }

    if (p.id === 'sahar') {
      const loc = settings.location || DEFAULT_LOC;
      const opts = { madhab: settings.madhab, method: settings.method };
      const t = PrayerTimes.calculate(new Date(), loc.lat, loc.lon, opts);
      html += '<section class="detail-block"><div class="block-title">Бугунги вақтлар</div>';
      html += '<div class="ramadan-pair">';
      html +=   '<div class="ramadan-card">';
      html +=     '<div class="ramadan-label">Саҳарлик тугаши</div>';
      html +=     '<div class="ramadan-time">' + fmtTime(t.fajr) + '</div>';
      html +=     '<div class="ramadan-note">Бомдод вақти бошланиши</div>';
      html +=   '</div>';
      html +=   '<div class="ramadan-card">';
      html +=     '<div class="ramadan-label">Ифтор</div>';
      html +=     '<div class="ramadan-time">' + fmtTime(t.maghrib) + '</div>';
      html +=     '<div class="ramadan-note">Шом азони билан</div>';
      html +=   '</div>';
      html += '</div>';
      html += '</section>';
    }

    if (p.externalUrl) {
      html += '<section class="detail-block"><a class="detail-cta" '
           +   'href="' + escapeHtml(p.externalUrl) + '" target="_blank" rel="noopener">'
           +   '<span class="detail-cta-label">' + escapeHtml(p.externalLabel || 'Зикрларни ўқиш') + '</span>'
           +   '<span class="detail-cta-arrow" aria-hidden="true">↗</span>'
           + '</a></section>';
    }

    if (p.verses && p.verses.length) {
      html += '<section class="detail-block"><div class="block-title">Қуръон оятлари</div>';
      const grouped = groupVerses(p.verses);
      html += renderQuoteList(grouped, function (v) {
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

  // === НАВИГАЦИЯ (hash routing) ===
  function showHome()    { location.hash = ''; }
  function showPrayer(id){ location.hash = '#/prayer/' + encodeURIComponent(id); }
  function showSpiritual(id) { location.hash = '#/spiritual/' + encodeURIComponent(id); }
  function goBack()      { history.length > 1 ? history.back() : showHome(); }

  function route() {
    const h = (location.hash || '').replace(/^#\/?/, '');
    if (h.indexOf('prayer/') === 0) {
      renderDetail(decodeURIComponent(h.slice('prayer/'.length)), 'prayer');
      showView('detail');
    } else if (h.indexOf('spiritual/') === 0) {
      renderDetail(decodeURIComponent(h.slice('spiritual/'.length)), 'spiritual');
      showView('detail');
    } else {
      renderHome();
      showView('home');
    }
    window.scrollTo(0, 0);
  }
  function showView(which) {
    document.getElementById('view-home').classList.toggle('hidden', which !== 'home');
    document.getElementById('view-detail').classList.toggle('hidden', which !== 'detail');
  }

  // === Settings actions ===
  function setMadhab(v) { settings.madhab = v; saveSettings(settings); renderHome(); }
  function setMethod(v) { settings.method = v; saveSettings(settings); renderHome(); }

  // === Шаҳар қидириш — Nominatim (OpenStreetMap) === //
  // Дунёнинг исталган шаҳри: автокомплит, 600мс debounce, AbortController
  // билан зўрма-зўр сўровни бекор қилади. Nominatim — 1 сўров/сония лимит.
  let cityResults = [];
  let cityDebounce = null;
  let cityAbort = null;
  function cityQuery(q) {
    q = (q || '').trim();
    const box = document.getElementById('city-results');
    if (!box) return;
    if (cityDebounce) clearTimeout(cityDebounce);
    if (q.length < 2) {
      box.innerHTML = '';
      box.classList.remove('open');
      return;
    }
    box.innerHTML = '<div class="city-result-status">Қидирилмоқда…</div>';
    box.classList.add('open');
    cityDebounce = setTimeout(function () {
      if (cityAbort) cityAbort.abort();
      cityAbort = new AbortController();
      const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=6&accept-language=uz,en&q='
                + encodeURIComponent(q);
      fetch(url, { signal: cityAbort.signal, headers: { 'Accept': 'application/json' } })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          cityResults = Array.isArray(data) ? data : [];
          if (!cityResults.length) {
            box.innerHTML = '<div class="city-result-status">Топилмади</div>';
            return;
          }
          let h = '';
          for (let i = 0; i < cityResults.length; i++) {
            const it = cityResults[i];
            const short = (it.display_name || '').split(',')[0].trim();
            h += '<button class="city-result" onclick="setCityFromGeo(' + i + ')">';
            h +=   '<div class="city-result-name">' + escapeHtml(short) + '</div>';
            h +=   '<div class="city-result-meta">' + escapeHtml(it.display_name || '') + '</div>';
            h += '</button>';
          }
          box.innerHTML = h;
        })
        .catch(function (err) {
          if (err && err.name === 'AbortError') return;
          box.innerHTML = '<div class="city-result-status">Хатолик — тармоқни текширинг</div>';
        });
    }, 600);
  }
  function setCityFromGeo(idx) {
    const it = cityResults[idx];
    if (!it) return;
    const name = (it.display_name || '').split(',')[0].trim();
    settings.location = {
      lat: parseFloat(it.lat),
      lon: parseFloat(it.lon),
      name: name || 'Жорий жой',
    };
    saveSettings(settings);
    renderHome();
  }

  // === Жонли қибла компас (DeviceOrientation) ===
  // iOS 13+ — фойдаланувчи bosishi keрак, шунда permission сўралади.
  // Android — рухсатсиз ишлайди.
  let qiblaHandler = null;
  function enableQiblaLive() {
    const DOE = window.DeviceOrientationEvent;
    if (!DOE) {
      qiblaHintText('Қурилма йўналиш сенсорини қувватламайди.');
      return;
    }
    const startListening = function () {
      const arrow = document.getElementById('qibla-arrow');
      const compass = document.getElementById('qibla-compass');
      if (!arrow || !compass) return;
      const qibla = parseFloat(compass.getAttribute('data-qibla'));
      // webkitCompassHeading (iOS) — magnetic north, ўз тескари ҳаракатсиз
      // alpha (Android) — соат стрелкасига тескари; 360-alpha билан тўғрилаймиз.
      stopQiblaLive();
      qiblaHandler = function (e) {
        let heading = null;
        if (typeof e.webkitCompassHeading === 'number') {
          heading = e.webkitCompassHeading;
        } else if (typeof e.alpha === 'number') {
          heading = (360 - e.alpha) % 360;
        }
        if (heading == null) return;
        const angle = qibla - heading;
        arrow.style.transform = 'rotate(' + angle.toFixed(2) + 'deg)';
      };
      window.addEventListener('deviceorientationabsolute', qiblaHandler, true);
      window.addEventListener('deviceorientation', qiblaHandler, true);
      qiblaHintText('Стрелка тепага қараганда — юзингиз Қиблa томон.');
      const btn = document.getElementById('qibla-live-btn');
      if (btn) btn.style.display = 'none';
    };
    if (typeof DOE.requestPermission === 'function') {
      DOE.requestPermission().then(function (res) {
        if (res === 'granted') startListening();
        else qiblaHintText('Сенсорга рухсат берилмади.');
      }).catch(function () { qiblaHintText('Сенсорга рухсат берилмади.'); });
    } else {
      startListening();
    }
  }
  function stopQiblaLive() {
    if (qiblaHandler) {
      window.removeEventListener('deviceorientationabsolute', qiblaHandler, true);
      window.removeEventListener('deviceorientation', qiblaHandler, true);
      qiblaHandler = null;
    }
  }
  function qiblaHintText(msg) {
    const el = document.getElementById('qibla-hint');
    if (el) el.textContent = msg;
  }

  // === УЛАШИШ — намоз/маънавий вақт ҳақидаги расм ===
  // Web Share API орқали native шеринг ойнаси очилади. Расмда фарз вақт
  // ёзилмайди (жойга боғлиқ), фақат ном, тавсиф ва биринчи оят кетади —
  // бошқа жойлардаги юзерлар учун ҳам мос бўлиши учун.
  function shareSubject(id, kind) {
    const list = kind === 'spiritual' ? spiritual : prayers;
    const p = list.find(x => x.id === id);
    if (!p) return;
    buildSubjectImage(p).then(function (file) {
      const base = { title: p.name, text: p.short || p.description || '' };
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share(Object.assign({ files: [file] }, base)).catch(function () {});
      } else if (navigator.share) {
        navigator.share(base).catch(function () {});
      }
    });
  }

  function buildSubjectImage(p) {
    const W = 1080, H = 1350;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    const fontsReady = (document.fonts && document.fonts.load)
      ? Promise.all([
          document.fonts.load('800 96px "DM Sans"'),
          document.fonts.load('700 28px "DM Sans"'),
          document.fonts.load('500 28px "DM Sans"'),
          document.fonts.load('600 36px "DM Sans"')
        ]).catch(function () {})
      : Promise.resolve();
    return fontsReady.then(function () {
      drawSubjectCard(ctx, p, W, H);
      return new Promise(function (resolve) {
        canvas.toBlob(function (blob) {
          if (!blob) { resolve(null); return; }
          resolve(new File([blob], (p.id || 'namoz') + '.png', { type: 'image/png' }));
        }, 'image/png');
      });
    });
  }

  function drawSubjectCard(ctx, p, W, H) {
    // Градиент фон — намоз ранги асосида
    const color = p.color || '#0369a1';
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, color);
    grad.addColorStop(0.5, withAlpha(color, 'dd'));
    grad.addColorStop(1, withAlpha(color, 'aa'));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Декоратив юлдузлар
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    for (let i = 0; i < 30; i++) {
      const x = (i * 137 + 53) % W;
      const y = (i * 211 + 91) % (H * 0.5);
      const r = (i % 3) + 1.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const padX = 80;
    let cursorY = 100;

    // Тег пилл — eyebrow (Тонг намози / Кеча намози ва ҳ.к.)
    if (p.eyebrow) {
      const tagText = p.eyebrow.toUpperCase();
      ctx.font = '700 28px "DM Sans", system-ui, sans-serif';
      const tagW = ctx.measureText(tagText).width + 48;
      const tagH = 60;
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      roundRect(ctx, padX, cursorY, tagW, tagH, 30);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText(tagText, padX + 24, cursorY + tagH / 2 + 1);
      cursorY += tagH + 50;
    }

    // Намоз номи
    ctx.font = '800 116px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    const nameLines = layoutLines(ctx, p.name, W - padX * 2);
    const useNameLines = Math.min(nameLines.length, 2);
    for (let i = 0; i < useNameLines; i++) {
      ctx.fillText(nameLines[i], padX, cursorY + i * 128);
    }
    cursorY += useNameLines * 128 + 30;

    // Тавсиф блоки — баландлиги матнга мос
    if (p.description) {
      const maxBottom = (p.verses && p.verses.length) ? 1100 : 1240;
      cursorY = drawShareDescriptionBlock(ctx, padX, cursorY, W - padX * 2, maxBottom, 'ҲАҚИДА', p.description);
      cursorY += 20;
    }

    // Биринчи оят (ихтиёрий, тавсиф ва биринчи оят учун жой бўлса)
    if (p.verses && p.verses.length && cursorY < 1100) {
      const v = p.verses[0];
      drawShareVerseBlock(ctx, padX, cursorY, W - padX * 2, 1240, v);
    }

    // Сайт номи пастда
    ctx.font = '500 28px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('abuyahyo.github.io/muhim/vaqtlar', W / 2, H - 80);
  }

  function drawShareDescriptionBlock(ctx, x, y, w, maxBottom, label, text) {
    const padTop = 22, labelGap = 38, padBottom = 22, lineH = 36;
    const textX = x + 36;
    const textW = w - 72;
    ctx.font = '500 28px "DM Sans", system-ui, sans-serif';
    const lines = layoutLines(ctx, text, textW);
    const availLines = Math.max(1, Math.floor((maxBottom - y - padTop - labelGap - padBottom) / lineH));
    const useLines = Math.min(lines.length, availLines);
    const blockH = padTop + labelGap + useLines * lineH + padBottom;
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    roundRect(ctx, x, y, w, blockH, 28);
    ctx.fill();
    ctx.font = '700 22px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(label, textX, y + padTop);
    ctx.font = '500 28px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    const textY = y + padTop + labelGap;
    for (let i = 0; i < useLines; i++) {
      let txt = lines[i];
      if (i === useLines - 1 && lines.length > useLines) {
        while (ctx.measureText(txt + '…').width > textW && txt.length > 0) {
          txt = txt.slice(0, -1);
        }
        txt += '…';
      }
      ctx.fillText(txt, textX, textY + i * lineH);
    }
    return y + blockH;
  }

  function drawShareVerseBlock(ctx, x, y, w, maxBottom, verse) {
    const padTop = 22, srcGap = 30, padBottom = 22, lineH = 36;
    const textX = x + 36;
    const textW = w - 72;
    ctx.font = '500 26px "DM Sans", system-ui, sans-serif';
    const lines = layoutLines(ctx, '«' + verse.translation + '»', textW);
    const availLines = Math.max(1, Math.floor((maxBottom - y - padTop - srcGap - padBottom) / lineH));
    const useLines = Math.min(lines.length, availLines);
    const blockH = padTop + srcGap + useLines * lineH + padBottom;
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    roundRect(ctx, x, y, w, blockH, 28);
    ctx.fill();
    ctx.font = '700 22px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(String(verse.source || '').toUpperCase(), textX, y + padTop);
    ctx.font = '500 26px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    const textY = y + padTop + srcGap;
    for (let i = 0; i < useLines; i++) {
      let txt = lines[i];
      if (i === useLines - 1 && lines.length > useLines) {
        while (ctx.measureText(txt + '…').width > textW && txt.length > 0) {
          txt = txt.slice(0, -1);
        }
        txt += '…';
      }
      ctx.fillText(txt, textX, textY + i * lineH);
    }
  }

  function layoutLines(ctx, text, maxW) {
    const words = String(text).replace(/\n+/g, ' ').split(/\s+/);
    const lines = [];
    let line = '';
    for (let i = 0; i < words.length; i++) {
      const test = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > maxW && line) {
        lines.push(line);
        line = words[i];
      } else {
        line = test;
      }
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

  function withAlpha(hex, suffix) {
    return hex + suffix;
  }

  // Қайтариш — глобал.
  window.showHome = showHome;
  window.showPrayer = showPrayer;
  window.showSpiritual = showSpiritual;
  window.shareSubject = shareSubject;
  window.goBack = goBack;
  window.setMadhab = setMadhab;
  window.setMethod = setMethod;
  window.cityQuery = cityQuery;
  window.setCityFromGeo = setCityFromGeo;
  window.enableQiblaLive = enableQiblaLive;

  // === Boot ===
  window.addEventListener('hashchange', route);

  // Биринчи маротаба — геолокацияни синаб кўриш (агар сақланмаган бўлса).
  if (!settings.location) {
    detectLocation().then(function (loc) {
      if (loc) {
        settings.location = loc;
        saveSettings(settings);
      }
      route();
    });
  } else {
    route();
  }
})();
