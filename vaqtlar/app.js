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

    let html = '<div class="fade-in">';

    // Header
    html += '<header class="page-head">';
    html += '<div class="page-eyebrow">Муҳим</div>';
    html += '<h1 class="page-title">Вақтлар</h1>';
    html += '</header>';

    // Кейинги намоз ва countdown
    html += '<section class="today-hero">';
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

    // Саҳарлик / Ифтор — Бомдод ва Шом'дан олинади.
    html += '<section class="times-section">';
    html += '<div class="times-section-title">Рўза вақти</div>';
    html += '<div class="ramadan-pair">';
    html += '<div class="ramadan-card">';
    html += '<div class="ramadan-label">Саҳарлик тугаши</div>';
    html += '<div class="ramadan-time">' + fmtTime(times.fajr) + '</div>';
    html += '<div class="ramadan-note">Бомдод вақти бошланиши</div>';
    html += '</div>';
    html += '<div class="ramadan-card">';
    html += '<div class="ramadan-label">Ифтор</div>';
    html += '<div class="ramadan-time">' + fmtTime(times.maghrib) + '</div>';
    html += '<div class="ramadan-note">Шом азони билан</div>';
    html += '</div>';
    html += '</div>';
    html += '</section>';

    // Таҳажжуд ойнаси
    if (tahajjud) {
      html += '<section class="times-section">';
      html += '<div class="times-section-title">Маънавий вақтлар</div>';
      html += '<div class="spiritual-list">';

      html += '<button class="spiritual-card" onclick="showSpiritual(\'azkar\')" style="--accent: #0f766e;">';
      html += '<div class="spiritual-name">Эрталабки / Кечқурунги зикрлар</div>';
      html += '</button>';

      html += '<button class="spiritual-card" onclick="showSpiritual(\'tahajjud\')" style="--accent: #312e81;">';
      html += '<div class="spiritual-head">';
      html +=   '<div class="spiritual-name">Таҳажжуд</div>';
      html +=   '<div class="spiritual-range">' + fmtTime(tahajjud.start) + ' → ' + fmtTime(tahajjud.end) + '</div>';
      html += '</div>';
      html += '</button>';

      html += '<button class="spiritual-card" onclick="showSpiritual(\'sahar\')" style="--accent: #92400e;">';
      html += '<div class="spiritual-head">';
      html += '<div class="spiritual-name">Саҳарлик / Ифтор</div>';
      html += '<div class="spiritual-tag">Рамазон</div>';
      html += '</div>';
      html += '<div class="spiritual-note">Тановулнинг барака топадиган икки вақти</div>';
      html += '</button>';

      html += '<button class="spiritual-card" onclick="showSpiritual(\'mustajob\')" style="--accent: #047857;">';
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
    html += '<div class="setting-hint">Жорий: ' + escapeHtml(loc.name)
         +   ' · ' + loc.lat.toFixed(3) + '°, ' + loc.lon.toFixed(3) + '°</div>';
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

    let html = '<div class="fade-in detail-wrap">';
    html += '<div class="detail-topbar">';
    html += '<button class="back-btn" onclick="goBack()">← Орқага</button>';
    html += '</div>';

    html += '<div class="detail-hero" style="background: linear-gradient(180deg, '
         + p.color + ' 0%, ' + p.color + 'cc 100%);">';
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
      html += '<section class="detail-block"><div class="block-title">Бугунги вақтлар</div>';
      html += '<div class="azkar-windows">';
      html +=   '<div class="azkar-window">';
      html +=     '<div class="azkar-window-label">Эрталабки зикрлар вақти</div>';
      html +=     '<div class="azkar-window-time">' + fmtTime(t.fajr) + ' → ' + fmtTime(t.sunrise) + '</div>';
      html +=   '</div>';
      html +=   '<div class="azkar-window">';
      html +=     '<div class="azkar-window-label">Кечқурунги зикрлар вақти</div>';
      html +=     '<div class="azkar-window-time">' + fmtTime(t.asr) + ' → ' + fmtTime(t.maghrib) + '</div>';
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

  // Қайтариш — глобал.
  window.showHome = showHome;
  window.showPrayer = showPrayer;
  window.showSpiritual = showSpiritual;
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
