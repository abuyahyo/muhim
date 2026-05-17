// === ҲИЖРИЙ КОНВЕРТАЦИЯ ===
// Tabular Islamic calendar (Hijri) ↔ Gregorian.
// Fliegel & Van Flandern, Kuwaiti algorithm. Astronomical Hijri'дан
// ±1 кунгача фарқ қилиши мумкин (расмий ой кўриниши кутиб турилмайди).
// Browser ва Node учун дуал экспорт.

(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.HijriCalc = api;
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function gregorianToHijri(gDate) {
    // Кирувчи Date'нинг локал санасини UTC тушдан позицияга солиб JD-ни
    // ҳисоблаймиз. `Math.floor(... + 0.5)` JD-чегараси тушда бошланганидан,
    // локал кун давомидаги ҳар қандай вақт битта JD-га тушиб қолади (туш-
    // дан олдин floor бир кун олдинги JD'га тушиб қолишини бартараф этади).
    const safeMs = Date.UTC(gDate.getFullYear(), gDate.getMonth(), gDate.getDate(), 12, 0, 0);
    const jd = Math.floor((safeMs / 86400000) + 2440587.5);
    const l = jd - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    const l2 = l - 10631 * n + 354;
    const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719)
           + Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
    const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50)
            - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
    const month = Math.floor((24 * l3) / 709);
    const day = l3 - Math.floor((709 * month) / 24);
    const year = 30 * n + j - 30;
    return { year, month, day };
  }

  function hijriToGregorian(hYear, hMonth, hDay) {
    const jd = Math.floor((11 * hYear + 3) / 30) + 354 * hYear + 30 * hMonth
             - Math.floor((hMonth - 1) / 2) + hDay + 1948440 - 385;
    return new Date((jd - 2440587.5) * 86400000);
  }

  function hijriMonthLength(hYear, hMonth) {
    const thisMonth = hijriToGregorian(hYear, hMonth, 1);
    const nextMonth = hMonth === 12
      ? hijriToGregorian(hYear + 1, 1, 1)
      : hijriToGregorian(hYear, hMonth + 1, 1);
    return Math.round((nextMonth - thisMonth) / 86400000);
  }

  return { gregorianToHijri, hijriToGregorian, hijriMonthLength };
}));
