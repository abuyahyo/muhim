// === АСОСИЙ ИЛОВА ===
// Ҳижрий тақвим конвертацияси, рендеринг ва навигация.
// AppData (data.js) дан фойдаланади.

(function () {
  'use strict';

  const {
    hijriMonths,
    gregorianMonths,
    gregorianMonthsShort,
    weekDays,
    weekDaysFull,
    importantDays
  } = AppData;

  const { gregorianToHijri, hijriToGregorian, hijriMonthLength } = HijriCalc;

  // === ҚЎШИМЧА КАЛЕНДАР ЁРДАМЧИЛАРИ ===
  function getCurrentHijri() {
    return gregorianToHijri(new Date());
  }

  // Соатга кўра ҳаво ранги — 4–7: dawn, 7–17: day, 17–19: dusk,
  // 19–23: evening, 23–4: night. Барча асосий саҳифалар шу мооддан
  // ранг олади: hero градиенти, акцент чизиқлари, нуқта индикаторлари.
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

  // === ОЙ ФАЗАСИ ===
  // Синодик ой ~ 29.530588 кун. 2000-01-06 18:14 UTC — маълум янги ой.
  // Шу нуқтадан бошлаб phase 0..1 ҳисобланади: 0=янги ой, 0.5=тўлин,
  // 1=янги. Бу астрономик ҳисоб — диний ҳилол кўриш билан 1-2 кун
  // фарқ қилиши мумкин.
  const SYNODIC = 29.530588853;
  const MOON_EPOCH = Date.UTC(2000, 0, 6, 18, 14, 0);
  function moonPhase(date) {
    const ms = SYNODIC * 86400 * 1000;
    let p = ((date.getTime() - MOON_EPOCH) % ms) / ms;
    if (p < 0) p += 1;
    return p;
  }
  function moonIllumination(phase) {
    return (1 - Math.cos(2 * Math.PI * phase)) / 2;
  }
  // Ой фазаси SVG'си. Қоронғи фон + ёруғ ярим диск + терминатор
  // эллипси орқали кресент/гиббус шакли қурилади.
  function moonPhaseSVG(phase) {
    const R = 50;
    const isWaxing = phase < 0.5;
    const isCrescent = (phase < 0.25 || phase > 0.75);
    const rx = R * Math.abs(Math.cos(2 * Math.PI * phase));
    const lit = '#f8fafc';
    const shadow = '#0f172a';
    const litHalf = isWaxing
      ? 'M 0,-' + R + ' A ' + R + ',' + R + ' 0 0,1 0,' + R + ' L 0,-' + R + ' Z'
      : 'M 0,-' + R + ' A ' + R + ',' + R + ' 0 0,0 0,' + R + ' L 0,-' + R + ' Z';
    const ellipseFill = isCrescent ? shadow : lit;
    return '<svg viewBox="-' + (R + 4) + ' -' + (R + 4) + ' ' + (R * 2 + 8) + ' ' + (R * 2 + 8) + '" width="120" height="120" aria-hidden="true">'
      +   '<defs><clipPath id="moon-clip"><circle cx="0" cy="0" r="' + R + '"/></clipPath></defs>'
      +   '<circle cx="0" cy="0" r="' + R + '" fill="' + shadow + '"/>'
      +   '<path d="' + litHalf + '" fill="' + lit + '" clip-path="url(#moon-clip)"/>'
      +   '<ellipse cx="0" cy="0" rx="' + rx + '" ry="' + R + '" fill="' + ellipseFill + '" clip-path="url(#moon-clip)"/>'
      +   '<circle cx="0" cy="0" r="' + R + '" fill="none" stroke="rgba(255,255,255,0.1)"/>'
      + '</svg>';
  }

  // Кейинги такрорини ҳисоблаш — ҳар частота учун.
  // Қайтаради: { date: Date, daysLeft: int, hijri: {year, month, day} }
  //
  // frequency:
  //  - 'yearly' (default) — hMonth + hDay
  //  - 'monthly' — hDays массиви (масалан [13,14,15] ҳар ҳижрий ойда)
  //  - 'weekly' — weekDay (0=Якш, 5=Жума, ҳ.к. — Date.getDay() форматида)
  function nextOccurrence(day) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (day.frequency === 'weekly') {
      // weekDays массиви ёки битта weekDay — иккаласи қабул қилинади.
      const targets = day.weekDays || [day.weekDay];
      const todayDow = today.getDay();
      let minDaysLeft = Infinity;
      let chosenDow = targets[0];
      for (let i = 0; i < targets.length; i++) {
        const dl = (targets[i] - todayDow + 7) % 7;
        if (dl < minDaysLeft) { minDaysLeft = dl; chosenDow = targets[i]; }
      }
      const date = new Date(today);
      date.setDate(today.getDate() + minDaysLeft);
      return { date: date, daysLeft: minDaysLeft, weekDay: chosenDow, hijri: gregorianToHijri(date) };
    }

    const current = getCurrentHijri();

    if (day.frequency === 'monthly') {
      const sortedDays = day.hDays.slice().sort(function (a, b) { return a - b; });
      // Шу ойда қолган тоифа кунини топиш
      for (let i = 0; i < sortedDays.length; i++) {
        if (current.day <= sortedDays[i]) {
          const date = hijriToGregorian(current.year, current.month, sortedDays[i]);
          const daysLeft = Math.ceil((date - today) / 86400000);
          return { date: date, daysLeft: daysLeft, hijri: { year: current.year, month: current.month, day: sortedDays[i] } };
        }
      }
      // Шу ойда ҳаммаси ўтиб бўлган — кейинги ойнинг биринчи тоифа куни
      let nextMonth = current.month + 1;
      let nextYear = current.year;
      if (nextMonth > 12) { nextMonth = 1; nextYear += 1; }
      const date = hijriToGregorian(nextYear, nextMonth, sortedDays[0]);
      const daysLeft = Math.ceil((date - today) / 86400000);
      return { date: date, daysLeft: daysLeft, hijri: { year: nextYear, month: nextMonth, day: sortedDays[0] } };
    }

    // yearly (default)
    let year = current.year;
    if (day.hMonth < current.month || (day.hMonth === current.month && day.hDay < current.day)) {
      year = current.year + 1;
    }
    const date = hijriToGregorian(year, day.hMonth, day.hDay);
    const daysLeft = Math.ceil((date - today) / 86400000);
    return { date: date, daysLeft: daysLeft, hijri: { year: year, month: day.hMonth, day: day.hDay } };
  }

  // === ХАВФСИЗ HTML ===
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // === ЧАСТОТА ЁРЛИҒИ ===
  // Карточкадаги тег матни ва унга мос CSS синфи. Олдин 'байрам/муҳим'
  // ёзиларди — энди такрор-частотага ўтилди.
  function freqLabel(day) {
    if (day.frequency === 'weekly') return 'Ҳар ҳафта';
    if (day.frequency === 'monthly') return 'Ҳар ой';
    return 'Ҳар йил';
  }

  // === ИЗОҲ ===
  // Оят ёки ҳадисга ихтиёрий шарҳ. <details> элементи орқали JS'сиз
  // тугма ҳолатида туради, босилгач кенгаяди.
  function renderCommentary(text) {
    if (!text) return '';
    return '<details class="commentary"><summary>Изоҳ</summary>'
         + '<div class="commentary-body">' + escapeHtml(text) + '</div>'
         + '</details>';
  }

  // === ҲОЛАТ ===
  let hijriCalView = getCurrentHijri();

  // Тақвим устуворлиги: ҳар ҳужайрада Милодий рақамни ҳам кўрсатиш/беркитиш.
  const CAL_PREF_KEY = 'cal.showGregDays.v1';
  let showGregDays = (function () {
    try { return localStorage.getItem(CAL_PREF_KEY) !== '0'; }
    catch (e) { return true; }
  })();
  function toggleGregDays() {
    showGregDays = !showGregDays;
    try { localStorage.setItem(CAL_PREF_KEY, showGregDays ? '1' : '0'); }
    catch (e) {}
    renderCalendar();
  }

  // Муҳим кунларни катак ранги билан белгилашни ёқиш/ўчириш.
  const CAL_TINT_KEY = 'cal.showCellTint.v1';
  let showCellTint = (function () {
    try { return localStorage.getItem(CAL_TINT_KEY) !== '0'; }
    catch (e) { return true; }
  })();
  function toggleCellTint() {
    showCellTint = !showCellTint;
    try { localStorage.setItem(CAL_TINT_KEY, showCellTint ? '1' : '0'); }
    catch (e) {}
    renderCalendar();
  }

  // Юлдузлар — қатъий тарзда жойлашган, ҳар page reload'да бир хил
  // кўринади. Math.random() рандомлик берса, фойдаланувчи саҳифани
  // янгилаганда юлдузлар "сакраб" қолади — енгил визуал шовқин.
  const STARS_HTML = [
    [3.4, 12, 18, 0.3], [2.1, 28, 72, 1.4], [4.2, 45, 8, 2.7],
    [2.8, 8, 55, 0.9], [3.1, 62, 88, 2.1], [2.4, 78, 22, 0.5],
    [4.5, 35, 41, 1.8], [2.7, 90, 65, 2.4], [3.6, 18, 92, 1.1],
    [2.3, 55, 30, 0.7], [3.8, 72, 50, 2.9], [2.9, 5, 80, 1.6]
  ].map(function (s) {
    return '<div class="star" style="width:' + s[0] + 'px;height:' + s[0] + 'px;top:' + s[1] + '%;left:' + s[2] + '%;animation-delay:' + s[3] + 's;"></div>';
  }).join('');

  // === КУН КАРТОЧКАЛАРИ ГРИДИ ===
  // Бош саҳифадаги бир секция учун. Йиллик ва такрорий
  // кунлар алоҳида секцияларда бир хил тузилмадан фойдаланади.
  function renderDayGrid(eyebrow, title, items, collapsed) {
    if (!items.length) return '';
    let cards = '';

    for (let i = 0; i < items.length; i++) {
      const d = items[i];
      const gDate = d.nextDate;
      let cdCls = 'day-card-countdown';
      let cdText;
      if (d.daysLeft === 0) { cdText = '● Бугун'; cdCls += ' today'; }
      else if (d.daysLeft === 1) { cdText = 'Эртага'; }
      else { cdText = d.daysLeft + ' кун қолди'; }

      // Баннер ичида рақам ва ой бирлаштирилган "дата-штамп":
      //   27
      //   РАМАЗОН
      // Ҳафталик кунлар учун эса штамп ичида ҳафта куни номи катта ҳарфда.
      let stamp;
      if (d.frequency === 'weekly') {
        stamp = '<div class="day-card-stamp"><div class="day-card-weekday">'
              + escapeHtml(weekDaysFull[d.nextWeekDay]) + '</div></div>';
      } else {
        stamp = '<div class="day-card-stamp">'
              + '<div class="day-card-number">' + d.nextHijri.day + '</div>'
              + '<div class="day-card-month">' + escapeHtml(hijriMonths[d.nextHijri.month - 1]) + '</div>'
              + '</div>';
      }

      cards += '<button class="day-card" onclick="showDay(\'' + escapeHtml(d.id) + '\')">';
      cards += '<div class="day-card-banner" style="background: linear-gradient(135deg, ' + d.color + ', ' + d.color + 'cc);">';
      cards += stamp;
      cards += '</div>';
      cards += '<div class="day-card-body">';
      cards += '<div class="day-card-name">' + escapeHtml(d.name) + '</div>';
      cards += '<div class="day-card-short">' + escapeHtml(d.short) + '</div>';
      cards += '<div class="day-card-footer">';
      cards += '<span class="day-card-greg">' + gDate.getDate() + ' ' + escapeHtml(gregorianMonthsShort[gDate.getMonth()]) + ' ' + gDate.getFullYear() + '</span>';
      cards += '<span class="' + cdCls + '">' + cdText + '</span>';
      cards += '</div></div></button>';
    }

    if (collapsed) {
      return '<details class="day-grid-fold">'
           + '<summary class="day-grid-summary">'
           +   '<div class="day-grid-summary-text">'
           +     '<div class="day-grid-summary-eyebrow">' + escapeHtml(eyebrow) + '</div>'
           +     '<div class="day-grid-summary-title">' + escapeHtml(title) + '</div>'
           +   '</div>'
           +   '<span class="day-grid-summary-meta">' + items.length + '</span>'
           +   '<span class="day-grid-summary-chev" aria-hidden="true">▾</span>'
           + '</summary>'
           + '<div class="cards-grid">' + cards + '</div>'
           + '</details>';
    }
    return '<section>'
         + '<div class="section-head"><div class="section-title">' + escapeHtml(title) + '</div></div>'
         + '<div class="cards-grid">' + cards + '</div>'
         + '</section>';
  }

  // === БОШ САҲИФА ===
  function renderHome() {
    const hijri = getCurrentHijri();
    const today = new Date();

    const sorted = importantDays.map(function (d) {
      const c = Object.assign({}, d);
      const occ = nextOccurrence(d);
      c.daysLeft = occ.daysLeft;
      c.nextDate = occ.date;
      c.nextHijri = occ.hijri;
      c.nextWeekDay = occ.weekDay; // weekly учун, бошқа холатларда undefined
      return c;
    }).sort(function (a, b) { return a.daysLeft - b.daysLeft; });

    // "Яқинлашаётган кун" — фақат йилда бир мартагина келадиган event'лар
    // орасидан энг яқинини оламиз. Жума ва Душ./Пай. каби такрорийлар
    // пастдаги ўз бўлимида аллақачон тузук кўриниб турибди.
    const nextDay = sorted.find(function (d) { return !d.frequency || d.frequency === 'yearly'; });
    const yearly = sorted.filter(function (d) { return !d.frequency || d.frequency === 'yearly'; });
    // Такрорий event'лар учун data.js дагидек тартиб — "qancha kun qoldi"
    // сортировкаси Душ./Пай.ни ҳамиша биринчи қилиб юбораркан, бу беҳосаб
    // эди. Маълумотлардаги тартибни сақлаймиз.
    const recurring = sorted.filter(function (d) { return d.frequency === 'monthly' || d.frequency === 'weekly'; })
      .sort(function (a, b) {
        const ai = importantDays.findIndex(function (x) { return x.id === a.id; });
        const bi = importantDays.findIndex(function (x) { return x.id === b.id; });
        return ai - bi;
      });

    let html = '<div class="fade-in mood--' + currentMood() + '">';

    html += '<header class="page-head">';
    html += '<div class="page-eyebrow">Муҳим</div>';
    html += '<h1 class="page-title">Кунлар</h1>';
    html += '</header>';

    html += '<section class="hero hero--' + currentMood() + '">';
    html += '<div class="hero-stars">' + STARS_HTML + '</div>';
    html += '<div class="hero-content">';
    html += '<div class="hero-label"><span class="live-dot"></span><span>Бугунги сана</span></div>';
    html += '<div class="hero-grid">';
    html += '<div class="hijri-main">';
    html += '<div class="hijri-day">' + hijri.day + '</div>';
    html += '<div class="hijri-month">' + escapeHtml(hijriMonths[hijri.month - 1]) + '</div>';
    html += '<div class="hijri-year">' + hijri.year + ' ҳижрий</div>';
    html += '</div>';
    html += '<div class="gregorian-box">';
    html += '<div class="gregorian-label">Милодий</div>';
    html += '<div class="gregorian-date">' + today.getDate() + ' ' + escapeHtml(gregorianMonths[today.getMonth()]) + '</div>';
    html += '<div class="gregorian-week">' + escapeHtml(weekDaysFull[today.getDay()]) + ' · ' + today.getFullYear() + '</div>';
    html += '</div>';
    html += '</div></div></section>';

    // Бугун баннери — фақат йилда бир мартагина келадиган муҳим кунлар учун.
    // Жума ва Аййамул Бийз каби такрорий event'лар бу банерда чиқмайди.
    const todayEvents = [];
    for (let i = 0; i < importantDays.length; i++) {
      const d = importantDays[i];
      if ((!d.frequency || d.frequency === 'yearly') && d.hMonth === hijri.month && d.hDay === hijri.day) {
        todayEvents.push(d);
      }
    }
    if (todayEvents.length) {
      html += '<section class="today-banner" style="--banner-tint:' + todayEvents[0].color + ';">';
      html += '<div class="today-banner-label">● Бугун</div>';
      html += '<div class="today-banner-chips">';
      for (let i = 0; i < todayEvents.length; i++) {
        const ev = todayEvents[i];
        html += '<button class="today-chip" onclick="showDay(\'' + escapeHtml(ev.id) + '\')">';
        html += '<span class="today-chip-dot" style="background:' + ev.color + ';"></span>';
        html += '<span>' + escapeHtml(ev.name) + '</span>';
        html += '</button>';
      }
      html += '</div></section>';
    }

    // ЯҚИНЛАШАЁТГАН КУН
    if (nextDay && nextDay.daysLeft >= 0 && nextDay.daysLeft <= 365) {
      let countdownDisplay = '';
      let countdownLabel = '';
      if (nextDay.daysLeft === 0) {
        countdownDisplay = '0';
        countdownLabel = 'Бугун';
      } else if (nextDay.daysLeft === 1) {
        countdownDisplay = '1';
        countdownLabel = 'Эртага';
      } else {
        countdownDisplay = nextDay.daysLeft;
        countdownLabel = 'кун қолди';
      }

      html += '<section class="upcoming">';
      html += '<div class="upcoming-eyebrow">Яқинлашаётган кун</div>';
      html += '<button class="upcoming-card" style="--up-tint:' + nextDay.color + ';" onclick="showDay(\'' + escapeHtml(nextDay.id) + '\')">';
      html += '<div class="upcoming-visual" style="background: linear-gradient(135deg, ' + nextDay.color + ', ' + nextDay.color + 'cc);">' + nextDay.nextHijri.day + '</div>';
      html += '<div class="upcoming-info">';
      html += '<div class="upcoming-name">' + escapeHtml(nextDay.name) + '</div>';
      html += '<div class="upcoming-short">' + escapeHtml(nextDay.short) + '</div>';
      html += '</div>';
      html += '<div class="upcoming-countdown">';
      html += '<div class="countdown-number">' + countdownDisplay + '</div>';
      html += '<div class="countdown-label">' + countdownLabel + '</div>';
      html += '</div>';
      html += '</button></section>';
    }

    html += renderDayGrid('Йиллик', 'Муҳим кунлар', yearly, true);
    if (recurring.length) html += renderDayGrid('Ҳар ҳафта · Ой', 'Такрорий кунлар', recurring, true);

    html += '</div>';

    document.getElementById('view-home').innerHTML = html;
  }

  // === БАТАФСИЛ ===
  function renderDay(dayId) {
    let day = null;
    for (let i = 0; i < importantDays.length; i++) {
      if (importantDays[i].id === dayId) { day = importantDays[i]; break; }
    }
    if (!day) return;

    const occ = nextOccurrence(day);
    const gDate = occ.date;

    let html = '<div class="fade-in detail-wrap mood--' + currentMood() + '">';
    html += '<div class="detail-topbar">';
    html += '<button class="back-btn" onclick="goBack()">← Орқага</button>';
    html += '<div class="detail-actions">';
    const hasShareContent = (day.verses && day.verses.length) || (day.hadiths && day.hadiths.length);
    if (hasShareContent) {
      html += '<button class="share-btn" onclick="shareDaySheet(\'' + escapeHtml(day.id) + '\')" aria-label="Расмлар тўплами" title="Оят ва ҳадислар билан расмлар">';
      html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
      html += '<rect x="6" y="2" width="16" height="16" rx="2"/>';
      html += '<circle cx="12" cy="8" r="2"/>';
      html += '<path d="m22 13-1.3-1.3a2.4 2.4 0 0 0-3.4 0L11 18"/>';
      html += '<path d="M18 22H4a2 2 0 0 1-2-2V6"/>';
      html += '</svg></button>';
    }
    html += '<button class="share-btn" onclick="shareDay(\'' + escapeHtml(day.id) + '\')" aria-label="Улашиш" title="Улашиш">';
    html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
    html += '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>';
    html += '<polyline points="16 6 12 2 8 6"/>';
    html += '<line x1="12" y1="2" x2="12" y2="15"/>';
    html += '</svg></button>';
    html += '</div>';
    html += '</div>';

    html += '<div class="detail-hero">';
    html += '<div class="detail-content">';
    html += '<span class="detail-cat">' + escapeHtml(freqLabel(day)) + '</span>';
    html += '<div class="detail-name">' + escapeHtml(day.name) + '</div>';
    html += '<div class="detail-dates">';

    // Ҳижрий ёки такрорлик ёзуви (частотага қараб)
    let leftLabel, leftValue;
    if (day.frequency === 'weekly') {
      leftLabel = 'Ҳафталик';
      const dows = day.weekDays || [day.weekDay];
      leftValue = dows.map(function (d) { return escapeHtml(weekDaysFull[d]); }).join(' ва ');
    } else if (day.frequency === 'monthly') {
      leftLabel = 'Ҳар ҳижрий ой';
      leftValue = day.hDays.join(', ') + '-куни';
    } else {
      leftLabel = 'Ҳижрий';
      leftValue = day.hDay + ' ' + escapeHtml(hijriMonths[day.hMonth - 1]);
    }
    html += '<div class="detail-date-block">';
    html += '<div class="detail-date-label">' + leftLabel + '</div>';
    html += '<div class="detail-date-value">' + leftValue + '</div>';
    html += '</div>';

    // Кейинги — гар частота учун
    const rightLabel = day.frequency ? 'Кейинги' : 'Милодий';
    html += '<div class="detail-date-block">';
    html += '<div class="detail-date-label">' + rightLabel + '</div>';
    html += '<div class="detail-date-value">' + gDate.getDate() + ' ' + escapeHtml(gregorianMonths[gDate.getMonth()]) + ' ' + gDate.getFullYear() + '</div>';
    html += '</div>';

    // Ҳафта куни — ҳафталик кунларда чап блокда аллақачон кўрсатилгани учун
    // фақат йиллик ва ойлик кунларга қўшилади (кўрсатилаётган санага кўра).
    if (day.frequency !== 'weekly') {
      html += '<div class="detail-date-block">';
      html += '<div class="detail-date-label">Ҳафта куни</div>';
      html += '<div class="detail-date-value">' + escapeHtml(weekDaysFull[gDate.getDay()]) + '</div>';
      html += '</div>';
    }
    html += '</div></div></div>';

    html += '<div class="detail-block">';
    html += '<div class="detail-block-label">Кун ҳақида</div>';
    html += '<div class="detail-text">' + escapeHtml(day.description) + '</div>';
    html += '</div>';

    if (day.note) {
      html += '<div class="detail-block">';
      html += '<div class="detail-block-label">' + escapeHtml(day.noteTitle || 'Илмий шарҳ') + '</div>';
      html += '<div class="detail-text">' + escapeHtml(day.note) + '</div>';
      html += '</div>';
    }

    // Оятлар — `verses` майдони мавжуд бўлмаса, секция умуман чиқмайди
    // (масалан Мавлуд каби, бу кунга оид Қуръон ояти йўқлиги аниқ бўлганда).
    if (day.verses) {
    html += '<div style="margin: 28px 0 16px;"><div class="section-title" style="font-size:22px;">Қуръон оятлари</div></div>';
    if (day.verses.length === 0) {
      html += '<div class="placeholder verses">';
      html += '<div class="placeholder-icon">۞</div>';
      html += '<div class="placeholder-title">Оятлар тез орада қўшилади</div>';
      html += '<div class="placeholder-text">Бу кунга оид Қуръон оятлари кейинроқ киритилади, инша Аллоҳ.</div>';
      html += '</div>';
    } else {
      html += renderQuoteList(day.verses, function (verse) {
        let card = '<div class="detail-block">';
        if (verse.arabic) card += '<div class="arabic" style="font-size:26px;text-align:right;line-height:1.9;margin-bottom:16px;color:var(--ink);" dir="rtl">' + escapeHtml(verse.arabic) + '</div>';
        card += '<div class="detail-text">«' + escapeHtml(verse.translation) + '»</div>';
        card += '<div class="source-attrib">' + escapeHtml(verse.source) + '</div>';
        card += renderCommentary(verse.commentary);
        card += '</div>';
        return card;
      });
    }

    }

    // Ҳадислар — `hadiths` майдони мавжуд бўлмаса, секция чиқмайди.
    if (day.hadiths) {
    html += '<div style="margin: 28px 0 16px;"><div class="section-title" style="font-size:22px;">Саҳиҳ ҳадислар</div></div>';
    if (day.hadiths.length === 0) {
      html += '<div class="placeholder hadiths">';
      html += '<div class="placeholder-icon">☾</div>';
      html += '<div class="placeholder-title">Ҳадислар тез орада қўшилади</div>';
      html += '<div class="placeholder-text">Бу кунга оид саҳиҳ ҳадислар кейинроқ киритилади, инша Аллоҳ.</div>';
      html += '</div>';
    } else {
      html += renderQuoteList(day.hadiths, function (hadith) {
        let card = '<div class="detail-block">';
        card += '<div class="detail-block-label">' + escapeHtml(hadith.source) + '</div>';
        card += '<div class="detail-text" style="margin-bottom:12px;">«' + escapeHtml(hadith.text) + '»</div>';
        if (hadith.narrator) card += '<div style="font-size:13px;color:var(--ink-mute);font-weight:600;">— ' + escapeHtml(hadith.narrator) + '</div>';
        card += renderCommentary(hadith.commentary);
        card += '</div>';
        return card;
      });
    }
    }

    html += '</div>';

    document.getElementById('view-day').innerHTML = html;
  }

  // === ҲИЖРИЙ ТАҚВИМ ===
  function renderCalendar() {
    const hYear = hijriCalView.year;
    const hMonth = hijriCalView.month;
    const daysInMonth = hijriMonthLength(hYear, hMonth);
    const firstGreg = hijriToGregorian(hYear, hMonth, 1);
    // Душанба = 0, ..., Якшанба = 6 (хафта Душанбадан бошланади)
    const startWeekDay = (firstGreg.getDay() + 6) % 7;

    const todayHijri = getCurrentHijri();
    const isCurrentMonth = (todayHijri.year === hYear && todayHijri.month === hMonth);

    // Йиллик муҳим кунлар (фақат шу ой ҳижрий-ойига мос)
    const monthEvents = [];
    for (let e = 0; e < importantDays.length; e++) {
      const d = importantDays[e];
      if ((!d.frequency || d.frequency === 'yearly') && d.hMonth === hMonth) {
        monthEvents.push(d);
      }
    }
    monthEvents.sort(function (a, b) { return a.hDay - b.hDay; });

    const eventMap = {};
    for (let em = 0; em < monthEvents.length; em++) {
      eventMap[monthEvents[em].hDay] = monthEvents[em];
    }

    // Ойлик такрорий event ёрдамчиси (масалан Аййамул Бийз 13-15)
    const monthlyEvents = importantDays.filter(function (d) { return d.frequency === 'monthly'; });
    function findMonthly(dd) {
      for (let i = 0; i < monthlyEvents.length; i++) {
        if (monthlyEvents[i].hDays.indexOf(dd) !== -1) return monthlyEvents[i];
      }
      return null;
    }
    // Жума ҳужайраси босилганда Жума карточкасига ўтиш учун кириш нуқтаси.
    // Бошқа ҳафталик event'лар (Душ./Пай.) ҳужайра кўринишига киритилмайди —
    // календар тоза туришига урғу.
    let jumuaEntry = null;
    for (let i = 0; i < importantDays.length; i++) {
      if (importantDays[i].id === 'jumua') { jumuaEntry = importantDays[i]; break; }
    }

    let html = '<div class="fade-in mood--' + currentMood() + '">';

    // Ой фазаси картаси (астрономик маълумот).
    const nowForMoon = new Date();
    const phaseNow = moonPhase(nowForMoon);
    const illumPct = Math.round(moonIllumination(phaseNow) * 100);
    html += '<section class="moon-card">';
    html += '<div class="moon-card-art">' + moonPhaseSVG(phaseNow) + '</div>';
    html += '<div class="moon-card-body">';
    html += '<div class="moon-card-eyebrow">Бугунги ой фазаси</div>';
    html += '<div class="moon-card-illum">Ёритилиш — ' + illumPct + '%</div>';
    html += '</div>';
    html += '</section>';

    // Тақвим шакли
    html += '<div class="cal-shell'
         + (showGregDays ? ' show-greg' : '')
         + (showCellTint ? ' show-tint' : '')
         + '">';
    html += '<div class="cal-top">';
    html += '<div class="cal-title-block">';
    html += '<div class="cal-eyebrow">Ҳижрий тақвим</div>';
    html += '<div class="cal-month-name">' + escapeHtml(hijriMonths[hMonth - 1]) + '</div>';
    html += '<div class="cal-year">' + hYear + ' ҳижрий йил</div>';
    html += '</div>';
    html += '<div class="cal-controls">';
    html += '<select class="cal-picker" aria-label="Ой танлаш" onchange="calJumpMonth(this.value)">';
    for (let mi = 1; mi <= 12; mi++) {
      html += '<option value="' + mi + '"' + (mi === hMonth ? ' selected' : '') + '>'
           + escapeHtml(hijriMonths[mi - 1]) + '</option>';
    }
    html += '</select>';
    html += '</div></div>';

    // Ҳафта кунлари (Душанбадан бошланади). weekDays массиви Якшанба=0
    // тартибида сақланади (`getDay()` индексига мос); экранда Душанбадан
    // кўрсатиш учун `(w + 1) % 7` орқали оламиз.
    html += '<div class="cal-weekdays">';
    for (let w = 0; w < 7; w++) {
      html += '<div class="cal-wd' + (w === 4 ? ' friday' : '') + '">' + escapeHtml(weekDays[(w + 1) % 7]) + '</div>';
    }
    html += '</div>';

    // Кунлар
    html += '<div class="cal-days">';
    for (let sp = 0; sp < startWeekDay; sp++) {
      html += '<div class="cal-cell empty"></div>';
    }
    for (let dd = 1; dd <= daysInMonth; dd++) {
      const cellGreg = hijriToGregorian(hYear, hMonth, dd);
      const isFriday = cellGreg.getDay() === 5;
      const isToday = isCurrentMonth && dd === todayHijri.day;
      const yearlyEvent = eventMap[dd];
      // Йиллик ва ойлик event бир куни тўғри келиб қолса — иккала нуқта ҳам.
      const monthlyEvent = findMonthly(dd);
      // Босилганда таркибга мос карточка очилиши: йиллик > ойлик > Жума.
      const linkEvent = yearlyEvent || monthlyEvent || (isFriday ? jumuaEntry : null);

      // Бир ҳужайрага мос event'ларнинг ҳаммаси (йиллик + ойлик + Жума
      // мос келса) — ҳар бири учун рангли нуқта чизилади. Босилганда
      // йиллик > ойлик > Жума устуворлиги билан тегишли карточка очилади.
      const dotEvents = [];
      if (yearlyEvent) dotEvents.push(yearlyEvent);
      if (monthlyEvent) dotEvents.push(monthlyEvent);
      if (isFriday && jumuaEntry) dotEvents.push(jumuaEntry);

      let cls = 'cal-cell';
      if (dotEvents.length) cls += ' important';
      if (isToday) cls += ' today';

      const onclick = linkEvent ? 'onclick="showDay(\'' + escapeHtml(linkEvent.id) + '\')"' : '';
      const tint = dotEvents.length ? ' style="--cell-tint:' + dotEvents[0].color + ';"' : '';

      html += '<button class="' + cls + '"' + tint + ' ' + onclick + '>';
      html += '<div class="cal-g-day">' + cellGreg.getDate() + '</div>';
      html += '<div class="cal-h-day">' + dd + '</div>';
      html += '</button>';
    }
    html += '</div>';

    // Кўриниш toggleси — Милодий рақамларни кўрсатиш/беркитиш (тақвимдан кейин)
    html += '<div class="cal-greg-bar">';
    html +=   '<button class="cal-greg-toggle' + (showGregDays ? ' is-on' : '') + '" '
         +         'onclick="toggleGregDays()" '
         +         'aria-pressed="' + showGregDays + '" '
         +         'title="Ҳужайрада Милодий рақамни кўрсатиш/беркитиш">';
    html +=     '<span class="cal-greg-toggle-dot" aria-hidden="true"></span>';
    html +=     '<span>Милодий кунлар</span>';
    html +=   '</button>';
    html +=   '<button class="cal-greg-toggle' + (showCellTint ? ' is-on' : '') + '" '
         +         'onclick="toggleCellTint()" '
         +         'aria-pressed="' + showCellTint + '" '
         +         'title="Муҳим кунларни катак ранги билан белгилаш">';
    html +=     '<span class="cal-greg-toggle-dot" aria-hidden="true"></span>';
    html +=     '<span>Катак ранги</span>';
    html +=   '</button>';
    html += '</div>';

    html += '</div>'; // cal-shell

    // Бу ойдаги муҳим кунлар (йиллик + ойлик + ҳафталик такрорий)
    const monthRows = monthEvents.slice();
    for (let i = 0; i < monthlyEvents.length; i++) monthRows.push(monthlyEvents[i]);
    for (let i = 0; i < importantDays.length; i++) {
      if (importantDays[i].frequency === 'weekly') monthRows.push(importantDays[i]);
    }
    if (monthRows.length > 0) {
      html += '<div class="month-events">';
      html += '<div class="month-events-title">Бу ойдаги муҳим кунлар</div>';
      for (let me = 0; me < monthRows.length; me++) {
        const ev = monthRows[me];
        let dayNum, meta;
        if (ev.frequency === 'monthly') {
          dayNum = ev.hDays[0]; // штампда биринчи кун (масалан 13)
          const firstG = hijriToGregorian(hYear, hMonth, ev.hDays[0]);
          const lastG = hijriToGregorian(hYear, hMonth, ev.hDays[ev.hDays.length - 1]);
          meta = ev.hDays.join(', ') + ' ' + escapeHtml(hijriMonths[hMonth - 1])
               + ' · ' + firstG.getDate() + '–' + lastG.getDate() + ' ' + escapeHtml(gregorianMonthsShort[firstG.getMonth()]) + ' ' + firstG.getFullYear();
        } else if (ev.frequency === 'weekly') {
          // Шу ҳижрий ойда event'нинг ҳафта кунига тушадиган барча кунларини
          // тўплаб, штампда биринчисини, метада эса рўйхатни кўрсатамиз.
          const targets = ev.weekDays || [ev.weekDay];
          const matches = [];
          for (let d = 1; d <= daysInMonth; d++) {
            const g = hijriToGregorian(hYear, hMonth, d);
            if (targets.indexOf(g.getDay()) !== -1) matches.push(d);
          }
          dayNum = matches[0];
          meta = matches.join(', ') + ' ' + escapeHtml(hijriMonths[hMonth - 1]);
        } else {
          dayNum = ev.hDay;
          const evGreg = hijriToGregorian(hYear, hMonth, ev.hDay);
          meta = ev.hDay + ' ' + escapeHtml(hijriMonths[hMonth - 1]) + ' · ' + evGreg.getDate() + ' ' + escapeHtml(gregorianMonthsShort[evGreg.getMonth()]) + ' ' + evGreg.getFullYear();
        }
        html += '<button class="event-row" onclick="showDay(\'' + escapeHtml(ev.id) + '\')">';
        html += '<div class="event-day-num" style="background: linear-gradient(135deg, ' + ev.color + ', ' + ev.color + 'cc);">' + dayNum + '</div>';
        html += '<div class="event-info">';
        html += '<div class="event-name">' + escapeHtml(ev.name) + '</div>';
        html += '<div class="event-meta">' + meta + '</div>';
        html += '</div>';
        html += '<div class="event-arrow">→</div>';
        html += '</button>';
      }
      html += '</div>';
    } else {
      html += '<div class="month-events">';
      html += '<div style="text-align:center;padding:32px;color:var(--ink-mute);font-size:14px;">Бу ойда муҳим кунлар йўқ</div>';
      html += '</div>';
    }

    html += '</div>';

    document.getElementById('view-calendar').innerHTML = html;
  }

  // === НАВИГАЦИЯ (Hash routing) ===
  // URL форматлари:
  //   ""           ёки "#/"                    → бош саҳифа
  //   "#/day/qadr"                              → батафсил кун
  //   "#/calendar"                              → жорий ой
  //   "#/calendar/1447-09"                      → аниқ ҳижрий ой
  // Бу ёндашув брауzer 'back' тугмаси, bookmark ва share ни таъминлайди;
  // ички "prevView" стек керак эмас — history.back() ишлатилади.

  function parseHash() {
    const raw = (location.hash || '').replace(/^#\/?/, '');
    if (!raw) return { name: 'home' };
    const parts = raw.split('/');
    if (parts[0] === 'day' && parts[1]) {
      let id;
      try { id = decodeURIComponent(parts[1]); }
      catch (e) { return { name: 'home' }; }
      return { name: 'day', id };
    }
    if (parts[0] === 'calendar') {
      if (parts[1]) {
        const m = parts[1].match(/^(\d+)-(\d+)$/);
        if (m) {
          const year = parseInt(m[1], 10);
          const month = parseInt(m[2], 10);
          if (month >= 1 && month <= 12) return { name: 'calendar', year, month };
        }
      }
      return { name: 'calendar' };
    }
    return { name: 'home' };
  }

  function setActiveView(name) {
    document.getElementById('view-home').classList.toggle('hidden', name !== 'home');
    document.getElementById('view-day').classList.toggle('hidden', name !== 'day');
    document.getElementById('view-calendar').classList.toggle('hidden', name !== 'calendar');
    document.getElementById('nav-home').classList.toggle('active', name === 'home');
    document.getElementById('nav-cal').classList.toggle('active', name === 'calendar');
  }

  function route() {
    const r = parseHash();
    if (r.name === 'day') {
      setActiveView('day');
      renderDay(r.id);
    } else if (r.name === 'calendar') {
      hijriCalView = (r.year && r.month) ? { year: r.year, month: r.month } : getCurrentHijri();
      setActiveView('calendar');
      renderCalendar();
    } else {
      setActiveView('home');
      renderHome();
    }
    window.scrollTo(0, 0);
  }

  function calendarHash() {
    return '#/calendar/' + hijriCalView.year + '-' + hijriCalView.month;
  }

  // === КЎРИНИШЛАР ===
  // showHome/showDay/showCalendar фақат URL ни ўзгартиради;
  // ҳақиқий рендер hashchange event'ида route() орқали бажарилади.
  function showHome() { location.hash = '#/'; }
  function showDay(dayId) { location.hash = '#/day/' + encodeURIComponent(dayId); }
  function showCalendar() { location.hash = '#/calendar'; }
  function goBack() { history.back(); }

  // Ой алмаштириш URL ни replaceState билан янгилайди — ҳар ўзгартирилишда
  // browser history га ёзилмайди (back бирданига чиқиш олиб боради).
  function calJumpMonth(m) {
    const month = parseInt(m, 10);
    if (!month || month < 1 || month > 12) return;
    hijriCalView = { year: hijriCalView.year, month };
    history.replaceState(null, '', calendarHash());
    renderCalendar();
  }

  // Инлайн onclick ҳандлерлари учун глобал экспорт
  window.showHome = showHome;
  window.showDay = showDay;
  window.showCalendar = showCalendar;
  window.goBack = goBack;
  window.calJumpMonth = calJumpMonth;
  window.toggleGregDays = toggleGregDays;
  window.toggleCellTint = toggleCellTint;
  window.shareDay = shareDay;
  window.shareDaySheet = shareDaySheet;

  // Кун-карточкасини улашиш — Web Share API орқали native ulashish ойнаси
  // очилади. Иложи бўлса — карточка-расм ҳам бирга юборилади (canShare files).
  function shareDay(dayId) {
    let day = null;
    for (let i = 0; i < importantDays.length; i++) {
      if (importantDays[i].id === dayId) { day = importantDays[i]; break; }
    }
    if (!day) return;
    const url = location.origin + location.pathname + '#/day/' + encodeURIComponent(dayId);
    const baseShare = { title: day.name, text: day.short || day.name, url: url };

    buildCardImage(day).then(function (file) {
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        // Telegram/WhatsApp каби илловалар share'дан расм ёки URLдан
        // фақат бирини олиб қолади (одатда URLни). Расм юборилаётганда
        // URLни киритмаймиз — ҳавола расм ичида аллақачон ёзилган.
        navigator.share({ files: [file], title: day.name }).catch(function () {});
        return;
      }
      // Расмсиз варианти
      if (navigator.share) {
        navigator.share(baseShare).catch(function () {});
        return;
      }
      const fallback = day.name + ' — ' + (day.short || '') + '\n' + url;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fallback).then(function () {
          showToast('Нусха олинди');
        }).catch(function () {
          showToast('Нусха олиб бўлмади');
        });
      } else {
        showToast('Браузер ulashish-ни қўлламайди');
      }
    });
  }

  // Кун карточкасини 1080×1350 canvas'га чизиб, PNG `File` сифатида қайтаради.
  // Шрифтлар Google Fonts'дан юкланган бўлсин — canvas синхрон ишлашидан олдин
  // `document.fonts.load` чақирилади.
  function buildCardImage(day) {
    const W = 1080, H = 1350;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    const fontsReady = (document.fonts && document.fonts.load)
      ? Promise.all([
          document.fonts.load('800 96px "DM Sans"'),
          document.fonts.load('700 28px "DM Sans"'),
          document.fonts.load('500 26px "DM Sans"'),
          document.fonts.load('600 36px "DM Sans"')
        ]).catch(function () {})
      : Promise.resolve();

    return fontsReady.then(function () {
      drawCard(ctx, day, W, H);
      return new Promise(function (resolve) {
        canvas.toBlob(function (blob) {
          if (!blob) { resolve(null); return; }
          resolve(new File([blob], 'kun.png', { type: 'image/png' }));
        }, 'image/png');
      });
    });
  }

  // === КЎП-САҲИФАЛИ УЛАШИШ (оят ва ҳадислар билан — Instagram карусели) ===
  const SHARE_W = 1080;
  const SHARE_H = 1350;
  const SHARE_PAD_X = 80;
  const SHARE_CONTENT_TOP = 240;
  const SHARE_CONTENT_BOTTOM = 1240;
  const SHARE_BLOCK_GAP = 16;

  function shareDaySheet(dayId) {
    let day = null;
    for (let i = 0; i < importantDays.length; i++) {
      if (importantDays[i].id === dayId) { day = importantDays[i]; break; }
    }
    if (!day) return;
    buildDayImages(day).then(function (files) {
      const filtered = (files || []).filter(Boolean);
      if (filtered.length && navigator.canShare && navigator.canShare({ files: filtered })) {
        navigator.share({ files: filtered }).catch(function () {});
      } else if (filtered.length && navigator.canShare && navigator.canShare({ files: [filtered[0]] })) {
        navigator.share({ files: [filtered[0]] }).catch(function () {});
      } else if (navigator.share) {
        navigator.share({ title: day.name, text: day.short || day.description || '' }).catch(function () {});
      }
    });
  }

  function buildDayImages(day) {
    const fontsReady = (document.fonts && document.fonts.load)
      ? Promise.all([
          document.fonts.load('800 96px "DM Sans"'),
          document.fonts.load('700 28px "DM Sans"'),
          document.fonts.load('500 28px "DM Sans"'),
          document.fonts.load('600 36px "DM Sans"')
        ]).catch(function () {})
      : Promise.resolve();
    return fontsReady.then(function () {
      const measureCtx = document.createElement('canvas').getContext('2d');
      const items = collectDayShareItems(measureCtx, day);
      const pages = packSharePages(items);
      const allPages = [{ kind: 'cover' }].concat(pages);
      const total = allPages.length;
      return Promise.all(allPages.map(function (page, idx) {
        return renderDaySharePage(day, page, idx + 1, total);
      }));
    });
  }

  function collectDayShareItems(ctx, day) {
    const innerW = SHARE_W - SHARE_PAD_X * 2 - 72;
    const items = [];
    (day.verses || []).forEach(function (v) {
      items.push(measureBlock(ctx, String(v.source || '').toUpperCase(), '«' + v.translation + '»', innerW));
    });
    (day.hadiths || []).forEach(function (h) {
      const block = measureBlock(ctx, String(h.source || '').toUpperCase(), '«' + h.text + '»', innerW);
      if (h.narrator) {
        block.narrator = h.narrator;
        block.height += 36;
      }
      items.push(block);
    });
    return items;
  }

  function measureBlock(ctx, label, text, innerW) {
    const padTop = 22, labelGap = 38, padBottom = 22, lineH = 36;
    ctx.font = '500 28px "DM Sans", system-ui, sans-serif';
    const lines = layoutLines(ctx, text, innerW);
    return { label: label, lines: lines, height: padTop + labelGap + lines.length * lineH + padBottom };
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

  function renderDaySharePage(day, page, pageNum, totalPages) {
    const canvas = document.createElement('canvas');
    canvas.width = SHARE_W;
    canvas.height = SHARE_H;
    const ctx = canvas.getContext('2d');
    if (page.kind === 'cover') {
      drawDayShareCover(ctx, day);
    } else {
      drawDayShareBackground(ctx, day);
      const headerBottom = drawDayHeaderCompact(ctx, day);
      drawShareContent(ctx, page.items, headerBottom + 30);
    }
    drawShareFooter(ctx, pageNum, totalPages, page.kind !== 'cover');
    return new Promise(function (resolve) {
      canvas.toBlob(function (blob) {
        if (!blob) { resolve(null); return; }
        resolve(new File([blob], (day.id || 'kun') + '-' + pageNum + '.png', { type: 'image/png' }));
      }, 'image/png');
    });
  }

  // Карусель муқоваси — тег, ном ва «КУН ҲАҚИДА» тавсиф блоки (сана блоклари йўқ).
  function drawDayShareCover(ctx, day) {
    drawDayShareBackground(ctx, day);
    let cursorY = 220;
    const tagText = freqLabel(day).toUpperCase();
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
    ctx.textBaseline = 'top';
    const fit = fitNameFont(ctx, day.name, SHARE_W - SHARE_PAD_X * 2, 2, 132, 72, '800');
    const useNameLines = Math.min(fit.lines.length, 3);
    const lineH = Math.round(fit.size * 1.12);
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < useNameLines; i++) {
      ctx.fillText(fit.lines[i], SHARE_PAD_X, cursorY + i * lineH);
    }
    cursorY += useNameLines * lineH + 48;

    if (day.description) {
      drawCoverDescription(ctx, SHARE_PAD_X, cursorY, SHARE_W - SHARE_PAD_X * 2, SHARE_CONTENT_BOTTOM, day.description);
    }
  }

  // «КУН ҲАҚИДА» блоки — баландлиги матнга мос; узун бўлса maxBottom'гача
  // кесилиб «…» билан тугатилади.
  function drawCoverDescription(ctx, x, y, w, maxBottom, text) {
    const padTop = 28, labelGap = 44, padBottom = 28, lineH = 42;
    const textX = x + 40;
    const textW = w - 80;
    ctx.font = '500 30px "DM Sans", system-ui, sans-serif';
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
    ctx.fillText('КУН ҲАҚИДА', textX, y + padTop);
    ctx.font = '500 30px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    const textY = y + padTop + labelGap;
    for (let i = 0; i < useLines; i++) {
      let txt = lines[i];
      if (i === useLines - 1 && lines.length > useLines) {
        while (ctx.measureText(txt + '…').width > textW && txt.length > 0) txt = txt.slice(0, -1);
        txt += '…';
      }
      ctx.fillText(txt, textX, textY + i * lineH);
    }
  }

  function drawDayShareBackground(ctx, day) {
    const color = day.color || '#0369a1';
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

  function drawDayHeaderCompact(ctx, day) {
    ctx.font = '700 22px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(freqLabel(day).toUpperCase(), SHARE_PAD_X, 110);
    const fit = fitNameFont(ctx, day.name, SHARE_W - SHARE_PAD_X * 2, 2, 64, 40, '800');
    ctx.fillStyle = '#ffffff';
    const lineH = Math.round(fit.size * 1.1);
    const limit = Math.min(fit.lines.length, 2);
    for (let i = 0; i < limit; i++) {
      ctx.fillText(fit.lines[i], SHARE_PAD_X, 145 + i * lineH);
    }
    return 145 + limit * lineH;
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

  function drawShareContent(ctx, items, startY) {
    let cursorY = Math.max(startY || SHARE_CONTENT_TOP, SHARE_CONTENT_TOP);
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

  function drawShareFooter(ctx, pageNum, totalPages, withSite) {
    ctx.font = '500 24px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.textBaseline = 'middle';
    if (totalPages > 1) {
      ctx.textAlign = 'left';
      ctx.fillText(pageNum + ' / ' + totalPages, SHARE_PAD_X, SHARE_H - 80);
    }
    if (withSite) {
      ctx.textAlign = 'right';
      ctx.fillText('abuyahyo.github.io/muhim', SHARE_W - SHARE_PAD_X, SHARE_H - 80);
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


  function drawCard(ctx, day, W, H) {
    // Градиент фон — деталь-hero бошқа жойда қандай чизилса шу тарзда.
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, day.color);
    grad.addColorStop(0.5, day.color + 'dd');
    grad.addColorStop(1, day.color + 'aa');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Юлдузли субтил тасвир (декоратив)
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    for (let i = 0; i < 30; i++) {
      const x = (i * 137 + 53) % W;
      const y = (i * 211 + 91) % (H * 0.7);
      const r = (i % 3) + 1.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const padX = 80;

    // Тег пилл
    const tagText = freqLabel(day).toUpperCase();
    ctx.font = '700 30px "DM Sans", system-ui, sans-serif';
    const tagW = ctx.measureText(tagText).width + 56;
    const tagH = 64;
    const tagY = 100;
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    roundRect(ctx, padX, tagY, tagW, tagH, 32);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(tagText, padX + 28, tagY + tagH / 2 + 2);

    // Кун номи (керак бўлса 2 қаторга)
    ctx.font = '800 104px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'top';
    wrapTextEllipsis(ctx, day.name, padX, tagY + tagH + 60, W - padX * 2, 116, 2);

    // Маълумот блоклари — ҳижрий ва милодий
    const occ = nextOccurrence(day);
    const hijriLine = formatHijriLine(day, occ);
    const gregLine = formatGregLine(day, occ);
    drawInfoBlock(ctx, padX, 540, W - padX * 2, 'ҲИЖРИЙ', hijriLine);
    drawInfoBlock(ctx, padX, 720, W - padX * 2, 'МИЛОДИЙ', gregLine);

    // Ҳафта куни — ҳафталик кунларда ҲИЖРИЙ блок аллақачон кўрсатгани учун
    // фақат йиллик ва ойлик кунларга алоҳида блок сифатида қўшилади.
    if (day.frequency !== 'weekly') {
      drawInfoBlock(ctx, padX, 900, W - padX * 2, 'ҲАФТА КУНИ', weekDaysFull[occ.date.getDay()]);
    }

    // Сайт номи пастда
    ctx.font = '500 28px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('abuyahyo.github.io/muhim', W / 2, H - 80);
  }

  function wrapTextEllipsis(ctx, text, x, y, maxW, lineH, maxLines) {
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
    for (let li = 0; li < lines.length && li < maxLines; li++) {
      let txt = lines[li];
      if (li === maxLines - 1 && lines.length > maxLines) {
        while (ctx.measureText(txt + '…').width > maxW && txt.length > 0) {
          txt = txt.slice(0, -1);
        }
        txt += '…';
      }
      ctx.fillText(txt, x, y + li * lineH);
    }
  }

  function drawInfoBlock(ctx, x, y, w, label, value) {
    const h = 160;
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    roundRect(ctx, x, y, w, h, 28);
    ctx.fill();
    ctx.font = '700 26px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(label, x + 36, y + 28);
    ctx.font = '700 52px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(value, x + 36, y + 72);
  }

  function formatHijriLine(day, occ) {
    if (day.frequency === 'weekly') {
      const dows = day.weekDays || [day.weekDay];
      return dows.map(function (d) { return weekDaysFull[d]; }).join(' ва ');
    }
    if (day.frequency === 'monthly') {
      return (day.hDays || []).join(', ');
    }
    return occ.hijri.day + ' ' + hijriMonths[occ.hijri.month - 1];
  }

  function formatGregLine(day, occ) {
    const d = occ.date;
    return d.getDate() + ' ' + gregorianMonths[d.getMonth()] + ' ' + d.getFullYear();
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


  function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2200);
  }

  // БОШЛАШ
  window.addEventListener('hashchange', route);
  route();
})();
