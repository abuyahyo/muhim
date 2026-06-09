// === ВАҚТЛАР — НАМОЗ ВА МАЪНАВИЙ ВАҚТЛАР ИЛОВАСИ ===
(function () {
  'use strict';

  const { prayers, spiritual } = VaqtlarData;
  const { escapeHtml, currentMood, renderQuoteList } = MuhimShared;
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
    // Созламалар панели очиқ бўлса, қайта чизишдан кейин ҳам очиқ қолсин.
    const prevDetails = document.querySelector('.settings-details');
    const settingsOpen = prevDetails ? prevDetails.open : false;

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
      const isNext = (p.id === cn.nextId);
      const isPast = !isCurrent && t < now;
      let cls = 'prayer-row';
      if (isCurrent) cls += ' is-current';
      else if (isNext) cls += ' is-next';
      if (isPast) cls += ' is-past';
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

      html += '<button class="spiritual-card" onclick="showSpiritual(\'duha\')">';
      html += '<div class="spiritual-name">Зуҳо (Чошгоҳ)</div>';
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
    html +=   '<div class="qibla-hint" id="qibla-hint"></div>';
    html += '</div>';
    html += '</div>';
    html += '</section>';

    // Sozlamalar (collapsible)
    html += '<section class="settings-section">';
    html += '<details class="settings-details"' + (settingsOpen ? ' open' : '') + '>';
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

    // Намоз (маънавий эмас) учун — бугунги вақтини оламиз.
    let prayerTime = null;
    if (kind !== 'spiritual') {
      const loc = settings.location || DEFAULT_LOC;
      const opts = { madhab: settings.madhab, method: settings.method };
      const t = PrayerTimes.calculate(new Date(), loc.lat, loc.lon, opts);
      prayerTime = t[p.id];
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
    html += '<div class="detail-eyebrow">' + (kind === 'spiritual' ? 'Маънавий вақт' : 'Намоз вақти') + '</div>';
    html += '<div class="detail-name">' + escapeHtml(p.name) + '</div>';
    if (prayerTime) {
      html += '<div class="detail-hero-time">' + escapeHtml(fmtTime(prayerTime)) + '</div>';
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

    if (p.id === 'duha') {
      const loc = settings.location || DEFAULT_LOC;
      const opts = { madhab: settings.madhab, method: settings.method };
      const t = PrayerTimes.calculate(new Date(), loc.lat, loc.lon, opts);
      // Зуҳо ойнаси: қуёш чиқишидан +20 дақиқадан Пешиндан -5 дақиқагача.
      const dStart = new Date(t.sunrise.getTime() + 20 * 60 * 1000);
      const dEnd = new Date(t.dhuhr.getTime() - 5 * 60 * 1000);
      html += '<section class="detail-block"><div class="block-title">Бугунги вақт</div>';
      html += '<div class="azkar-windows">';
      html +=   '<div class="azkar-window">';
      html +=     '<div class="azkar-window-label">Зуҳо вақти</div>';
      html +=     '<div class="azkar-window-time">' + fmtTime(dStart) + ' → ' + fmtTime(dEnd) + '</div>';
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
      html +=   '</div>';
      html +=   '<div class="ramadan-card">';
      html +=     '<div class="ramadan-label">Ифтор</div>';
      html +=     '<div class="ramadan-time">' + fmtTime(t.maghrib) + '</div>';
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

  // === УЛАШИШ — намоз/маънавий вақт ҳақидаги расмлар (1+ карусел) ===
  // Web Share API орқали native шеринг ойнаси очилади. Тавсиф, барча
  // оятлар ва барча ҳадислар бирор саҳифа сиғмаса, бир неча 1080×1350
  // расимга бўлинади — Instagram карусел сифатида. Намознинг вақти
  // атайин ёзилмайди — жойга боғлиқ бўлгани учун чалғитувчи бўлмаслиги
  // керак.
  const SHARE_W = 1080;
  const SHARE_H = 1350;
  const SHARE_PAD_X = 80;
  const SHARE_CONTENT_TOP = 240;
  const SHARE_CONTENT_BOTTOM = 1240;
  const SHARE_BLOCK_GAP = 16;

  function shareSubject(id, kind) {
    const list = kind === 'spiritual' ? spiritual : prayers;
    const p = list.find(x => x.id === id);
    if (!p) return;
    buildSubjectImages(p).then(function (files) {
      const filtered = (files || []).filter(Boolean);
      // Файл юборилганда матн/title қўшилмайди — Telegram каби илловалар
      // уни алоҳида хабар сифатида ёзиб қойилмаслиги учун.
      if (filtered.length && navigator.canShare && navigator.canShare({ files: filtered })) {
        navigator.share({ files: filtered }).catch(function () {});
      } else if (filtered.length && navigator.canShare && navigator.canShare({ files: [filtered[0]] })) {
        // Кўп файлни қувватламайдиган илова бўлса — биринчи расимни юбориш.
        navigator.share({ files: [filtered[0]] }).catch(function () {});
      } else if (navigator.share) {
        navigator.share({ title: p.name, text: p.short || p.description || '' }).catch(function () {});
      }
    });
  }

  function buildSubjectImages(p) {
    const fontsReady = (document.fonts && document.fonts.load)
      ? Promise.all([
          document.fonts.load('800 96px "DM Sans"'),
          document.fonts.load('700 28px "DM Sans"'),
          document.fonts.load('500 28px "DM Sans"'),
          document.fonts.load('600 36px "DM Sans"')
        ]).catch(function () {})
      : Promise.resolve();
    return fontsReady.then(function () {
      const measureCanvas = document.createElement('canvas');
      const measureCtx = measureCanvas.getContext('2d');
      const items = collectShareItems(measureCtx, p);
      const pages = packSharePages(items);
      // Cover саҳифа доимо биринчи.
      const allPages = [{ kind: 'cover' }].concat(pages);
      const total = allPages.length;
      return Promise.all(allPages.map(function (page, idx) {
        return renderSharePage(p, page, idx + 1, total);
      }));
    });
  }

  function collectShareItems(ctx, p) {
    const innerW = SHARE_W - SHARE_PAD_X * 2 - 72; // блок ичида 36+36 padding
    const items = [];
    // Тавсиф обложкада тўлиқ кўрсатилади. Агар обложкада сиғмаса
    // (`coverTruncatesDescription` true қайтарса), қолганлари аввалги
    // контент саҳифаси бошида блок сифатида чиқади.
    if (p.description && coverTruncatesDescription(ctx, p)) {
      items.push(measureBlock(ctx, 'ҲАҚИДА', p.description, innerW));
    }
    (p.verses || []).forEach(function (v) {
      items.push(measureBlock(ctx, String(v.source || '').toUpperCase(), '«' + v.translation + '»', innerW));
    });
    (p.hadiths || []).forEach(function (h) {
      const block = measureBlock(ctx, String(h.source || '').toUpperCase(), '«' + h.text + '»', innerW);
      if (h.narrator) {
        block.narrator = h.narrator;
        block.height += 36;
      }
      items.push(block);
    });
    return items;
  }

  // Обложка drawShareCover'нинг қаторлар сонини симул қилади ва агар
  // тавсиф у ерга тўлиқ сиғмаса true қайтаради — шунда тавсиф контент
  // саҳифаларида ҳам блок сифатида қайтарилади.
  function coverTruncatesDescription(ctx, p) {
    let cursorY = 220;
    if (p.eyebrow) cursorY += 60 + 60;
    const fit = fitNameFont(ctx, p.name, SHARE_W - SHARE_PAD_X * 2, 2, 132, 72, '800');
    const useNameLines = Math.min(fit.lines.length, 3);
    const nameLineH = Math.round(fit.size * 1.12);
    cursorY += useNameLines * nameLineH + 40;
    ctx.font = '500 30px "DM Sans", system-ui, sans-serif';
    const lines = layoutLines(ctx, p.description, SHARE_W - SHARE_PAD_X * 2);
    const lineH = 42;
    const maxBottom = SHARE_CONTENT_BOTTOM - 20;
    const availLines = Math.max(1, Math.floor((maxBottom - cursorY) / lineH));
    return lines.length > availLines;
  }

  function measureBlock(ctx, label, text, innerW) {
    const padTop = 22, labelGap = 38, padBottom = 22, lineH = 36;
    ctx.font = '500 28px "DM Sans", system-ui, sans-serif';
    const lines = layoutLines(ctx, text, innerW);
    return {
      label: label,
      lines: lines,
      height: padTop + labelGap + lines.length * lineH + padBottom
    };
  }

  function packSharePages(items) {
    const pages = [];
    // 2-қаторли компакт ҳедер жой эгаллашига захира — 100px.
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

  function renderSharePage(p, page, pageNum, totalPages) {
    const canvas = document.createElement('canvas');
    canvas.width = SHARE_W;
    canvas.height = SHARE_H;
    const ctx = canvas.getContext('2d');
    drawShareBackground(ctx, p);
    if (page.kind === 'cover') {
      drawShareCover(ctx, p);
    } else {
      const headerBottom = drawShareHeaderCompact(ctx, p);
      drawShareContent(ctx, page.items, headerBottom + 30);
    }
    drawShareFooter(ctx, pageNum, totalPages);
    return new Promise(function (resolve) {
      canvas.toBlob(function (blob) {
        if (!blob) { resolve(null); return; }
        resolve(new File([blob], (p.id || 'namoz') + '-' + pageNum + '.png', { type: 'image/png' }));
      }, 'image/png');
    });
  }

  function drawShareBackground(ctx, p) {
    const color = p.color || '#0369a1';
    const grad = ctx.createLinearGradient(0, 0, SHARE_W, SHARE_H);
    grad.addColorStop(0, color);
    grad.addColorStop(0.5, color + 'dd');
    grad.addColorStop(1, color + 'aa');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, SHARE_W, SHARE_H);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    for (let i = 0; i < 30; i++) {
      const x = (i * 137 + 53) % SHARE_W;
      const y = (i * 211 + 91) % (SHARE_H * 0.5);
      const r = (i % 3) + 1.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawShareCover(ctx, p) {
    let cursorY = 220;
    if (p.eyebrow) {
      const tagText = p.eyebrow.toUpperCase();
      ctx.font = '700 28px "DM Sans", system-ui, sans-serif';
      const tagW = ctx.measureText(tagText).width + 48;
      const tagH = 60;
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      roundRect(ctx, SHARE_PAD_X, cursorY, tagW, tagH, 30);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText(tagText, SHARE_PAD_X + 24, cursorY + tagH / 2 + 1);
      cursorY += tagH + 60;
    }
    ctx.font = '800 132px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    // Узун номлар учун шрифтни автомат кичрайтириб иккита қаторга
    // сиғдирамиз.
    const fit = fitNameFont(ctx, p.name, SHARE_W - SHARE_PAD_X * 2, 2, 132, 72, '800');
    const useNameLines = Math.min(fit.lines.length, 3);
    const lineH = Math.round(fit.size * 1.12);
    for (let i = 0; i < useNameLines; i++) {
      ctx.fillText(fit.lines[i], SHARE_PAD_X, cursorY + i * lineH);
    }
    cursorY += useNameLines * lineH + 40;
    // Тавсиф обложкага тўлиқ сиғсагина шу ерда чиқади. Сиғмаса — у
    // контент саҳифасида блок сифатида кўрсатилади (такрорламаслик учун).
    if (p.description && !coverTruncatesDescription(ctx, p)) {
      ctx.font = '500 30px "DM Sans", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      const dLineH = 42;
      const lines = layoutLines(ctx, p.description, SHARE_W - SHARE_PAD_X * 2);
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], SHARE_PAD_X, cursorY + i * dLineH);
      }
    }
  }

  // Қайтаради: компакт ҳедернинг пастки чегараси (y).
  function drawShareHeaderCompact(ctx, p) {
    ctx.font = '700 22px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    if (p.eyebrow) ctx.fillText(p.eyebrow.toUpperCase(), SHARE_PAD_X, 110);
    // Узун ном бўлса шрифт кичрайиб иккита қаторгача сиғади.
    const fit = fitNameFont(ctx, p.name, SHARE_W - SHARE_PAD_X * 2, 2, 64, 40, '800');
    ctx.fillStyle = '#ffffff';
    const lineH = Math.round(fit.size * 1.1);
    const limit = Math.min(fit.lines.length, 2);
    for (let i = 0; i < limit; i++) {
      ctx.fillText(fit.lines[i], SHARE_PAD_X, 145 + i * lineH);
    }
    return 145 + limit * lineH;
  }

  // Энг катта шрифт ўлчамини топади (start'дан min'гача 8px қадам билан
  // камайтиради) — ном maxLines қаторда сиғадиган бўлгунча. Қайтаради:
  // { size, lines }. Минимал ўлчамда ҳам сиғмаса, у ўлчам қайтарилади.
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

  function drawShareContent(ctx, items, startY) {
    const areaTop = Math.max(startY || SHARE_CONTENT_TOP, SHARE_CONTENT_TOP);
    let totalH = 0;
    for (let i = 0; i < items.length; i++) {
      totalH += items[i].height + (i ? SHARE_BLOCK_GAP : 0);
    }
    // Матн кам бўлса — қолган бўш жойда вертикал марказга суриб қўямиз.
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
    const textY = y + padTop + labelGap;
    for (let i = 0; i < item.lines.length; i++) {
      ctx.fillText(item.lines[i], textX, textY + i * lineH);
    }
    if (item.narrator) {
      ctx.font = '600 22px "DM Sans", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText('— ' + item.narrator, textX, textY + item.lines.length * lineH + 4);
    }
  }

  function drawShareFooter(ctx, pageNum, totalPages) {
    ctx.font = '500 24px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    if (totalPages > 1) {
      ctx.fillText(pageNum + ' / ' + totalPages, SHARE_PAD_X, SHARE_H - 80);
    }
    ctx.textAlign = 'right';
    ctx.fillText('abuyahyo.github.io/muhim/vaqtlar', SHARE_W - SHARE_PAD_X, SHARE_H - 80);
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
