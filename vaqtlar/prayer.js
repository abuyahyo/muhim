// === НАМОЗ ВАҚТЛАРИНИ ҲИСОБЛАШ ===
// Stand astronomik алгоритм (PrayTimes.org формуласи).
// Кириш: сана, lat, lon, метод (Фажр/Иссиҳ угалари), мазҳаб (Аср фактори).
// Чиқиш: Date object'лар — Бомдод / Қуёш / Пешин / Аср / Шом / Хуфтон.

window.PrayerTimes = (function () {
  'use strict';

  // Градус asosli trigonometria
  const dToR = d => d * Math.PI / 180;
  const rToD = r => r * 180 / Math.PI;
  const sin = d => Math.sin(dToR(d));
  const cos = d => Math.cos(dToR(d));
  const tan = d => Math.tan(dToR(d));
  const asin = x => rToD(Math.asin(x));
  const acos = x => rToD(Math.acos(x));
  const atan2 = (y, x) => rToD(Math.atan2(y, x));
  const acot = x => rToD(Math.atan(1 / x));

  function fixHour(h) { h = h - 24 * Math.floor(h / 24); return h < 0 ? h + 24 : h; }
  function fixAngle(a) { a = a - 360 * Math.floor(a / 360); return a < 0 ? a + 360 : a; }

  // Юлиан кун — Гриж сана учун (UT 0h).
  function julianDay(year, month, day) {
    if (month <= 2) { year -= 1; month += 12; }
    const A = Math.floor(year / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (year + 4716))
         + Math.floor(30.6001 * (month + 1))
         + day + B - 1524.5;
  }

  // Қуёшнинг декларaцияси ва "equation of time" (соатларда).
  function sunPosition(jd) {
    const D = jd - 2451545.0;
    const g = fixAngle(357.529 + 0.98560028 * D);
    const q = fixAngle(280.459 + 0.98564736 * D);
    const L = fixAngle(q + 1.915 * sin(g) + 0.020 * sin(2 * g));
    const e = 23.439 - 0.00000036 * D;
    const RA = atan2(cos(e) * sin(L), cos(L)) / 15;
    const eqt = q / 15 - fixHour(RA);
    const decl = asin(sin(e) * sin(L));
    return { decl, eqt };
  }

  // Қуёш горизонтдан бурчак билан паст(юқори)да бўлганидаги вақт — туш­дан фарқ (соат).
  // `angle`: горизонтдан паст градус (мусбат). `direction='ccw'` — тушдан олдин (Фажр/Қуёш).
  function sunAngleTime(angle, lat, decl, direction) {
    const cosT = (-sin(angle) - sin(lat) * sin(decl)) / (cos(lat) * cos(decl));
    if (cosT < -1 || cosT > 1) return NaN; // юқори кенгликларда конвергенция йўқ
    const t = acos(cosT) / 15;
    return direction === 'ccw' ? -t : t;
  }

  // Аср — соя узунлиги = factor * объект баландлиги.
  function asrTime(factor, lat, decl) {
    const angle = -acot(factor + tan(Math.abs(lat - decl)));
    return sunAngleTime(angle, lat, decl, 'cw');
  }

  // Соатлар (0..24) → локал кун­ичи Date.
  function timeToDate(date, h) {
    if (!isFinite(h)) return null;
    h = fixHour(h);
    const hr = Math.floor(h);
    const min = Math.floor((h - hr) * 60);
    const sec = Math.floor(((h - hr) * 60 - min) * 60);
    const d = new Date(date);
    d.setHours(hr, min, sec, 0);
    return d;
  }

  // Ҳисоблаш методлари (Фажр / Иссиҳ).
  const METHODS = {
    MWL:     { fajr: 18,   isha: 17,   name: 'Жаҳон Мусулмонлар Лигаси (MWL)' },
    Egypt:   { fajr: 19.5, isha: 17.5, name: 'Миср — Geneва университети' },
    Karachi: { fajr: 18,   isha: 18,   name: 'Карачи — Ислом ўрганиш институти' },
    Makkah:  { fajr: 18.5, isha: 90, ishaMinutes: true, name: 'Уммул Қуро (Макка)' },
    ISNA:    { fajr: 15,   isha: 15,   name: 'ISNA — Шимолий Америка' },
  };

  function calculate(date, lat, lon, opts) {
    opts = opts || {};
    const method = METHODS[opts.method] || METHODS.MWL;
    const asrFactor = (opts.madhab === 'Shafi') ? 1 : 2; // default Hanafi

    const tz = -date.getTimezoneOffset() / 60;
    // Локал тушга мос JD — узоқлик орқали тузатиш керак эмас, чунки eqt/decl
    // 1-2 секунд аниқлик берса бас.
    const jd = julianDay(date.getFullYear(), date.getMonth() + 1, date.getDate());
    const sun = sunPosition(jd);

    // Маҳаллий тенгкунлик (Дҳур, local clock).
    const dhuhr   = 12 - sun.eqt - lon / 15 + tz;
    const fajr    = dhuhr + sunAngleTime(method.fajr, lat, sun.decl, 'ccw');
    const sunrise = dhuhr + sunAngleTime(0.833, lat, sun.decl, 'ccw');
    const asr     = dhuhr + asrTime(asrFactor, lat, sun.decl);
    const sunset  = dhuhr + sunAngleTime(0.833, lat, sun.decl, 'cw');
    const maghrib = sunset;
    const isha    = method.ishaMinutes
      ? maghrib + method.isha / 60
      : dhuhr + sunAngleTime(method.isha, lat, sun.decl, 'cw');

    return {
      fajr:    timeToDate(date, fajr),
      sunrise: timeToDate(date, sunrise),
      dhuhr:   timeToDate(date, dhuhr),
      asr:     timeToDate(date, asr),
      maghrib: timeToDate(date, maghrib),
      isha:    timeToDate(date, isha),
    };
  }

  // Таҳажжуд — кеча давомининг охирги 1/3си. (Шом → эртанги Бомдод).
  // Қайтаради: { start, end } — Date object.
  function tahajjudWindow(today, lat, lon, opts) {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const t1 = calculate(today, lat, lon, opts);
    const t2 = calculate(tomorrow, lat, lon, opts);
    if (!t1.maghrib || !t2.fajr) return null;
    const nightMs = t2.fajr.getTime() - t1.maghrib.getTime();
    const lastThirdStart = new Date(t1.maghrib.getTime() + (nightMs * 2 / 3));
    return { start: lastThirdStart, end: t2.fajr };
  }

  return { calculate, tahajjudWindow, METHODS };
})();
