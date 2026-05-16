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

  function getDayDate(hMonth, hDay) {
    const current = getCurrentHijri();
    let year = current.year;
    if (hMonth < current.month || (hMonth === current.month && hDay < current.day)) {
      year = current.year + 1;
    }
    return hijriToGregorian(year, hMonth, hDay);
  }

  function daysUntil(hMonth, hDay) {
    const target = getDayDate(hMonth, hDay);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  }

  // === ХАВФСИЗ HTML ===
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
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

  // === БОШ САҲИФА ===
  function renderHome() {
    const hijri = getCurrentHijri();
    const today = new Date();

    const sorted = importantDays.map(function (d) {
      const c = Object.assign({}, d);
      c.daysLeft = daysUntil(d.hMonth, d.hDay);
      return c;
    }).sort(function (a, b) { return a.daysLeft - b.daysLeft; });

    const nextDay = sorted[0];

    let html = '<div class="fade-in">';

    html += '<section class="hero">';
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

      const tagClass = nextDay.category === 'байрам' ? 'tag-bayram' : 'tag-muhim';

      html += '<section class="upcoming">';
      html += '<button class="upcoming-card" onclick="showDay(\'' + escapeHtml(nextDay.id) + '\')">';
      html += '<div class="upcoming-visual" style="background: linear-gradient(135deg, ' + nextDay.color + ', ' + nextDay.color + 'cc);">' + nextDay.hDay + '</div>';
      html += '<div class="upcoming-info">';
      html += '<span class="upcoming-tag ' + tagClass + '">' + escapeHtml(nextDay.category) + '</span>';
      html += '<div class="upcoming-name">' + escapeHtml(nextDay.name) + '</div>';
      html += '<div class="upcoming-short">' + escapeHtml(nextDay.short) + '</div>';
      html += '</div>';
      html += '<div class="upcoming-countdown">';
      html += '<div class="countdown-number">' + countdownDisplay + '</div>';
      html += '<div class="countdown-label">' + countdownLabel + '</div>';
      html += '</div>';
      html += '</button></section>';
    }

    // МУҲИМ КУНЛАР
    html += '<section>';
    html += '<div class="section-head">';
    html += '<div class="section-title">Муҳим кунлар</div>';
    html += '<div class="section-meta">' + importantDays.length + ' та кун</div>';
    html += '</div>';
    html += '<div class="cards-grid">';

    for (let i = 0; i < sorted.length; i++) {
      const d = sorted[i];
      const gDate = getDayDate(d.hMonth, d.hDay);
      const tagCls = d.category === 'байрам' ? 'tag-bayram' : 'tag-muhim';
      let cdCls = 'day-card-countdown';
      let cdText;
      if (d.daysLeft === 0) { cdText = '● Бугун'; cdCls += ' today'; }
      else if (d.daysLeft === 1) { cdText = 'Эртага'; }
      else { cdText = d.daysLeft + ' кун қолди'; }

      html += '<button class="day-card" onclick="showDay(\'' + escapeHtml(d.id) + '\')">';
      html += '<div class="day-card-banner" style="background: linear-gradient(135deg, ' + d.color + ', ' + d.color + 'cc);">';
      html += '<div class="day-card-number">' + d.hDay + '</div>';
      html += '<div class="day-card-month-pill">' + escapeHtml(hijriMonths[d.hMonth - 1]) + '</div>';
      html += '</div>';
      html += '<div class="day-card-body">';
      html += '<span class="day-card-tag ' + tagCls + '">' + escapeHtml(d.category) + '</span>';
      html += '<div class="day-card-name">' + escapeHtml(d.name) + '</div>';
      html += '<div class="day-card-short">' + escapeHtml(d.short) + '</div>';
      html += '<div class="day-card-footer">';
      html += '<span class="day-card-greg">' + gDate.getDate() + ' ' + escapeHtml(gregorianMonthsShort[gDate.getMonth()]) + ' ' + gDate.getFullYear() + '</span>';
      html += '<span class="' + cdCls + '">' + cdText + '</span>';
      html += '</div></div></button>';
    }

    html += '</div></section></div>';

    document.getElementById('view-home').innerHTML = html;
  }

  // === БАТАФСИЛ ===
  function renderDay(dayId) {
    let day = null;
    for (let i = 0; i < importantDays.length; i++) {
      if (importantDays[i].id === dayId) { day = importantDays[i]; break; }
    }
    if (!day) return;

    const gDate = getDayDate(day.hMonth, day.hDay);

    let html = '<div class="fade-in detail-wrap">';
    html += '<button class="back-btn" onclick="goBack()">← Орқага</button>';

    html += '<div class="detail-hero" style="background: linear-gradient(135deg, ' + day.color + ' 0%, ' + day.color + 'dd 50%, ' + day.color + 'aa 100%);">';
    html += '<div class="detail-content">';
    html += '<span class="detail-cat">' + escapeHtml(day.category) + '</span>';
    html += '<div class="detail-name">' + escapeHtml(day.name) + '</div>';
    html += '<div class="detail-dates">';
    html += '<div class="detail-date-block">';
    html += '<div class="detail-date-label">Ҳижрий</div>';
    html += '<div class="detail-date-value">' + day.hDay + ' ' + escapeHtml(hijriMonths[day.hMonth - 1]) + '</div>';
    html += '</div>';
    html += '<div class="detail-date-block">';
    html += '<div class="detail-date-label">Милодий</div>';
    html += '<div class="detail-date-value">' + gDate.getDate() + ' ' + escapeHtml(gregorianMonths[gDate.getMonth()]) + ' ' + gDate.getFullYear() + '</div>';
    html += '</div>';
    html += '</div></div></div>';

    html += '<div class="detail-block">';
    html += '<div class="detail-block-label">Кун ҳақида</div>';
    html += '<div class="detail-text">' + escapeHtml(day.description) + '</div>';
    html += '</div>';

    // Оятлар
    html += '<div style="margin: 28px 0 16px;"><div class="section-title" style="font-size:22px;">Қуръон оятлари</div></div>';
    if (day.verses.length === 0) {
      html += '<div class="placeholder verses">';
      html += '<div class="placeholder-icon">۞</div>';
      html += '<div class="placeholder-title">Оятлар тез орада қўшилади</div>';
      html += '<div class="placeholder-text">Бу кунга оид Қуръон оятлари кейинроқ киритилади, инша Аллоҳ.</div>';
      html += '</div>';
    } else {
      for (let v = 0; v < day.verses.length; v++) {
        const verse = day.verses[v];
        html += '<div class="detail-block">';
        html += '<div class="detail-block-label">' + escapeHtml(verse.source) + '</div>';
        if (verse.arabic) html += '<div class="arabic" style="font-size:26px;text-align:right;line-height:1.9;margin-bottom:16px;color:var(--ink);" dir="rtl">' + escapeHtml(verse.arabic) + '</div>';
        html += '<div class="detail-text">' + escapeHtml(verse.translation) + '</div>';
        html += renderCommentary(verse.commentary);
        html += '</div>';
      }
    }

    // Ҳадислар
    html += '<div style="margin: 28px 0 16px;"><div class="section-title" style="font-size:22px;">Шарифа ҳадислар</div></div>';
    if (day.hadiths.length === 0) {
      html += '<div class="placeholder hadiths">';
      html += '<div class="placeholder-icon">ﷺ</div>';
      html += '<div class="placeholder-title">Ҳадислар тез орада қўшилади</div>';
      html += '<div class="placeholder-text">Бу кунга оид саҳиҳ ҳадислар кейинроқ киритилади, инша Аллоҳ.</div>';
      html += '</div>';
    } else {
      for (let h = 0; h < day.hadiths.length; h++) {
        const hadith = day.hadiths[h];
        html += '<div class="detail-block">';
        html += '<div class="detail-block-label">' + escapeHtml(hadith.source) + '</div>';
        html += '<div class="detail-text" style="margin-bottom:12px;font-style:italic;">«' + escapeHtml(hadith.text) + '»</div>';
        if (hadith.narrator) html += '<div style="font-size:13px;color:var(--ink-mute);font-weight:600;">— ' + escapeHtml(hadith.narrator) + '</div>';
        html += renderCommentary(hadith.commentary);
        html += '</div>';
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

    const lastGreg = hijriToGregorian(hYear, hMonth, daysInMonth);

    const todayHijri = getCurrentHijri();
    const isCurrentMonth = (todayHijri.year === hYear && todayHijri.month === hMonth);

    // Бу ойдаги муҳим кунларни топиш
    const monthEvents = [];
    for (let e = 0; e < importantDays.length; e++) {
      if (importantDays[e].hMonth === hMonth) {
        monthEvents.push(importantDays[e]);
      }
    }
    monthEvents.sort(function (a, b) { return a.hDay - b.hDay; });

    const eventMap = {};
    for (let em = 0; em < monthEvents.length; em++) {
      eventMap[monthEvents[em].hDay] = monthEvents[em];
    }

    let html = '<div class="fade-in">';

    // Тақвим шакли
    html += '<div class="cal-shell">';
    html += '<div class="cal-top">';
    html += '<div class="cal-title-block">';
    html += '<div class="cal-eyebrow">Ҳижрий тақвим</div>';
    html += '<div class="cal-month-name">' + escapeHtml(hijriMonths[hMonth - 1]) + '</div>';
    html += '<div class="cal-year">' + hYear + ' ҳижрий йил</div>';
    html += '</div>';
    html += '<div class="cal-controls">';
    html += '<button class="cal-btn" onclick="calPrev()" aria-label="Олдинги ой">←</button>';
    html += '<button class="cal-btn wide" onclick="calToday()">Бугун</button>';
    html += '<button class="cal-btn" onclick="calNext()" aria-label="Кейинги ой">→</button>';
    html += '</div></div>';

    // Милодий маълумот
    let gregInfo;
    if (firstGreg.getMonth() === lastGreg.getMonth()) {
      gregInfo = firstGreg.getDate() + '–' + lastGreg.getDate() + ' ' + gregorianMonths[firstGreg.getMonth()] + ' ' + firstGreg.getFullYear();
    } else if (firstGreg.getFullYear() === lastGreg.getFullYear()) {
      gregInfo = firstGreg.getDate() + ' ' + gregorianMonthsShort[firstGreg.getMonth()] + ' – ' + lastGreg.getDate() + ' ' + gregorianMonthsShort[lastGreg.getMonth()] + ' ' + lastGreg.getFullYear();
    } else {
      gregInfo = firstGreg.getDate() + ' ' + gregorianMonthsShort[firstGreg.getMonth()] + ' ' + firstGreg.getFullYear() + ' – ' + lastGreg.getDate() + ' ' + gregorianMonthsShort[lastGreg.getMonth()] + ' ' + lastGreg.getFullYear();
    }
    html += '<div class="cal-greg-info"><div class="cal-greg-info-icon">М</div><div>Милодий бўйича: ' + escapeHtml(gregInfo) + '</div></div>';

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
      const event = eventMap[dd];

      let cls = 'cal-cell';
      if (isFriday) cls += ' friday';
      if (event) cls += ' important';
      if (isToday) cls += ' today';

      let style = '';
      if (event && !isFriday) {
        style = 'background: linear-gradient(135deg, ' + event.color + ', ' + event.color + 'cc);';
      }

      const onclick = event ? 'onclick="showDay(\'' + escapeHtml(event.id) + '\')"' : '';

      html += '<button class="' + cls + '" style="' + style + '" ' + onclick + '>';
      html += '<div class="cal-h-day">' + dd + '</div>';
      html += '<div class="cal-g-day">' + cellGreg.getDate() + ' ' + escapeHtml(gregorianMonthsShort[cellGreg.getMonth()]) + '</div>';
      html += '</button>';
    }
    html += '</div>';

    // Маънолар
    html += '<div class="cal-legend">';
    html += '<div class="legend-item"><div class="legend-swatch today"></div><span>Бугун</span></div>';
    html += '<div class="legend-item"><div class="legend-swatch friday"></div><span>Жума</span></div>';
    html += '<div class="legend-item"><div class="legend-swatch important"></div><span>Муҳим кун</span></div>';
    html += '</div>';

    html += '</div>'; // cal-shell

    // Бу ойдаги муҳим кунлар
    if (monthEvents.length > 0) {
      html += '<div class="month-events">';
      html += '<div class="month-events-title">Бу ойдаги муҳим кунлар</div>';
      for (let me = 0; me < monthEvents.length; me++) {
        const ev = monthEvents[me];
        const evGreg = hijriToGregorian(hYear, hMonth, ev.hDay);
        html += '<button class="event-row" onclick="showDay(\'' + escapeHtml(ev.id) + '\')">';
        html += '<div class="event-day-num" style="background: linear-gradient(135deg, ' + ev.color + ', ' + ev.color + 'cc);">' + ev.hDay + '</div>';
        html += '<div class="event-info">';
        html += '<div class="event-name">' + escapeHtml(ev.name) + '</div>';
        html += '<div class="event-meta">' + ev.hDay + ' ' + escapeHtml(hijriMonths[hMonth - 1]) + ' · ' + evGreg.getDate() + ' ' + escapeHtml(gregorianMonthsShort[evGreg.getMonth()]) + ' ' + evGreg.getFullYear() + '</div>';
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

  // Ой алмаштириш URL ни replaceState билан янгилайди — ҳар тугмада
  // browser history га ёзилмайди (back бирданига чиқиш олиб боради).
  function calPrev() {
    if (hijriCalView.month === 1) {
      hijriCalView = { year: hijriCalView.year - 1, month: 12 };
    } else {
      hijriCalView = { year: hijriCalView.year, month: hijriCalView.month - 1 };
    }
    history.replaceState(null, '', calendarHash());
    renderCalendar();
  }

  function calNext() {
    if (hijriCalView.month === 12) {
      hijriCalView = { year: hijriCalView.year + 1, month: 1 };
    } else {
      hijriCalView = { year: hijriCalView.year, month: hijriCalView.month + 1 };
    }
    history.replaceState(null, '', calendarHash());
    renderCalendar();
  }

  function calToday() {
    hijriCalView = getCurrentHijri();
    history.replaceState(null, '', calendarHash());
    renderCalendar();
  }

  // Инлайн onclick ҳандлерлари учун глобал экспорт
  window.showHome = showHome;
  window.showDay = showDay;
  window.showCalendar = showCalendar;
  window.goBack = goBack;
  window.calPrev = calPrev;
  window.calNext = calNext;
  window.calToday = calToday;

  // БОШЛАШ
  window.addEventListener('hashchange', route);
  route();
})();
