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
  function freqTagClass(day) {
    if (day.frequency === 'weekly') return 'tag-weekly';
    if (day.frequency === 'monthly') return 'tag-monthly';
    return 'tag-yearly';
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

  // === КУН КАРТОЧКАЛАРИ ГРИДИ ===
  // Бош саҳифадаги бир секция учун. Йиллик ва такрорий
  // кунлар алоҳида секцияларда бир хил тузилмадан фойдаланади.
  function renderDayGrid(title, items) {
    if (!items.length) return '';
    let html = '<section>';
    html += '<div class="section-head">';
    html += '<div class="section-title">' + escapeHtml(title) + '</div>';
    html += '<div class="section-meta">' + items.length + ' та кун</div>';
    html += '</div>';
    html += '<div class="cards-grid">';

    for (let i = 0; i < items.length; i++) {
      const d = items[i];
      const gDate = d.nextDate;
      const tagCls = freqTagClass(d);
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

      html += '<button class="day-card" onclick="showDay(\'' + escapeHtml(d.id) + '\')">';
      html += '<div class="day-card-banner" style="background: linear-gradient(135deg, ' + d.color + ', ' + d.color + 'cc);">';
      html += stamp;
      html += '</div>';
      html += '<div class="day-card-body">';
      html += '<span class="day-card-tag ' + tagCls + '">' + escapeHtml(freqLabel(d)) + '</span>';
      html += '<div class="day-card-name">' + escapeHtml(d.name) + '</div>';
      html += '<div class="day-card-short">' + escapeHtml(d.short) + '</div>';
      html += '<div class="day-card-footer">';
      html += '<span class="day-card-greg">' + gDate.getDate() + ' ' + escapeHtml(gregorianMonthsShort[gDate.getMonth()]) + ' ' + gDate.getFullYear() + '</span>';
      html += '<span class="' + cdCls + '">' + cdText + '</span>';
      html += '</div></div></button>';
    }

    html += '</div></section>';
    return html;
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

    const nextDay = sorted[0];
    const yearly = sorted.filter(function (d) { return !d.frequency || d.frequency === 'yearly'; });
    const recurring = sorted.filter(function (d) { return d.frequency === 'monthly' || d.frequency === 'weekly'; });

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

    // БУГУНГИ event'лар — йиллик/ойлик/ҳафталик мос келганлари
    const todayDow = today.getDay();
    const todayEvents = [];
    for (let i = 0; i < importantDays.length; i++) {
      const d = importantDays[i];
      if (!d.frequency || d.frequency === 'yearly') {
        if (d.hMonth === hijri.month && d.hDay === hijri.day) todayEvents.push(d);
      } else if (d.frequency === 'monthly') {
        if (d.hDays.indexOf(hijri.day) !== -1) todayEvents.push(d);
      } else if (d.frequency === 'weekly') {
        const targets = d.weekDays || [d.weekDay];
        if (targets.indexOf(todayDow) !== -1) todayEvents.push(d);
      }
    }
    if (todayEvents.length) {
      html += '<section class="today-banner">';
      html += '<div class="today-banner-label">Бугун</div>';
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

      const tagClass = freqTagClass(nextDay);

      html += '<section class="upcoming">';
      html += '<button class="upcoming-card" onclick="showDay(\'' + escapeHtml(nextDay.id) + '\')">';
      html += '<div class="upcoming-visual" style="background: linear-gradient(135deg, ' + nextDay.color + ', ' + nextDay.color + 'cc);">' + nextDay.nextHijri.day + '</div>';
      html += '<div class="upcoming-info">';
      html += '<span class="upcoming-tag ' + tagClass + '">' + escapeHtml(freqLabel(nextDay)) + '</span>';
      html += '<div class="upcoming-name">' + escapeHtml(nextDay.name) + '</div>';
      html += '<div class="upcoming-short">' + escapeHtml(nextDay.short) + '</div>';
      html += '</div>';
      html += '<div class="upcoming-countdown">';
      html += '<div class="countdown-number">' + countdownDisplay + '</div>';
      html += '<div class="countdown-label">' + countdownLabel + '</div>';
      html += '</div>';
      html += '</button></section>';
    }

    html += renderDayGrid('Муҳим кунлар', yearly);
    if (recurring.length) html += renderDayGrid('Такрорий кунлар', recurring);

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

    let html = '<div class="fade-in detail-wrap">';
    html += '<button class="back-btn" onclick="goBack()">← Орқага</button>';

    html += '<div class="detail-hero" style="background: linear-gradient(135deg, ' + day.color + ' 0%, ' + day.color + 'dd 50%, ' + day.color + 'aa 100%);">';
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
      for (let v = 0; v < day.verses.length; v++) {
        const verse = day.verses[v];
        html += '<div class="detail-block">';
        if (verse.arabic) html += '<div class="arabic" style="font-size:26px;text-align:right;line-height:1.9;margin-bottom:16px;color:var(--ink);" dir="rtl">' + escapeHtml(verse.arabic) + '</div>';
        html += '<div class="detail-text">«' + escapeHtml(verse.translation) + '»</div>';
        html += '<div class="source-attrib">' + escapeHtml(verse.source) + '</div>';
        html += renderCommentary(verse.commentary);
        html += '</div>';
      }
    }

    }

    // Ҳадислар — `hadiths` майдони мавжуд бўлмаса, секция чиқмайди.
    if (day.hadiths) {
    html += '<div style="margin: 28px 0 16px;"><div class="section-title" style="font-size:22px;">Саҳиҳ ҳадислар</div></div>';
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
        html += '<div class="detail-text" style="margin-bottom:12px;">«' + escapeHtml(hadith.text) + '»</div>';
        if (hadith.narrator) html += '<div style="font-size:13px;color:var(--ink-mute);font-weight:600;">— ' + escapeHtml(hadith.narrator) + '</div>';
        html += renderCommentary(hadith.commentary);
        html += '</div>';
      }
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

      let dots = '';
      if (dotEvents.length) {
        dots = '<div class="cal-dots">';
        for (let i = 0; i < dotEvents.length; i++) {
          dots += '<span class="cal-dot" style="background:' + dotEvents[i].color + ';"></span>';
        }
        dots += '</div>';
      }

      const onclick = linkEvent ? 'onclick="showDay(\'' + escapeHtml(linkEvent.id) + '\')"' : '';

      html += '<button class="' + cls + '" ' + onclick + '>';
      html += '<div class="cal-h-day">' + dd + '</div>';
      html += dots;
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
