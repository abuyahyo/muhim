// === МУҲИМ КУННИНГ КЕЙИНГИ САНАСИНИ ҲИСОБЛАШ ===
// Берилган муҳим кун (yearly / monthly / weekly) учун кейинги такрорини
// ҳисоблайди. Ҳижрий ↔ милодий ўгиришга боғлиқ (HijriCalc).
//
// Соф қилиш учун "бугун" ихтиёрий параметр сифатида берилади
// (nextOccurrence(day, today)). Берилмаса — жорий сана ишлатилади.
// Шу туфайли алоҳида, аниқ саналар билан тестланади.
// Browser ва Node учун дуал экспорт.

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory(require('./hijri.js'));
  } else {
    root.Occurrence = factory(root.HijriCalc);
  }
}(typeof self !== 'undefined' ? self : this, function (HijriCalc) {
  'use strict';

  const { gregorianToHijri, hijriToGregorian } = HijriCalc;

  // Кейинги такрорини ҳисоблаш — ҳар частота учун.
  // Қайтаради: { date: Date, daysLeft: int, hijri: {year, month, day} }
  //
  // frequency:
  //  - 'yearly' (default) — hMonth + hDay
  //  - 'monthly' — hDays массиви (масалан [13,14,15] ҳар ҳижрий ойда)
  //  - 'weekly' — weekDay (0=Якш, 5=Жума, ҳ.к. — Date.getDay() форматида)
  function nextOccurrence(day, today) {
    today = today ? new Date(today) : new Date();
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

    const current = gregorianToHijri(today);

    if (day.frequency === 'monthly') {
      const sortedDays = day.hDays.slice().sort(function (a, b) { return a - b; });
      // Шу ойда қолган тоифа кунини топиш
      for (let i = 0; i < sortedDays.length; i++) {
        if (current.day <= sortedDays[i]) {
          const date = hijriToGregorian(current.year, current.month, sortedDays[i]);
          const daysLeft = Math.round((new Date(date.getFullYear(), date.getMonth(), date.getDate()) - today) / 86400000);
          return { date: date, daysLeft: daysLeft, hijri: { year: current.year, month: current.month, day: sortedDays[i] } };
        }
      }
      // Шу ойда ҳаммаси ўтиб бўлган — кейинги ойнинг биринчи тоифа куни
      let nextMonth = current.month + 1;
      let nextYear = current.year;
      if (nextMonth > 12) { nextMonth = 1; nextYear += 1; }
      const date = hijriToGregorian(nextYear, nextMonth, sortedDays[0]);
      const daysLeft = Math.round((new Date(date.getFullYear(), date.getMonth(), date.getDate()) - today) / 86400000);
      return { date: date, daysLeft: daysLeft, hijri: { year: nextYear, month: nextMonth, day: sortedDays[0] } };
    }

    // yearly (default)
    let year = current.year;
    if (day.hMonth < current.month || (day.hMonth === current.month && day.hDay < current.day)) {
      year = current.year + 1;
    }
    const date = hijriToGregorian(year, day.hMonth, day.hDay);
    const daysLeft = Math.round((new Date(date.getFullYear(), date.getMonth(), date.getDate()) - today) / 86400000);
    return { date: date, daysLeft: daysLeft, hijri: { year: year, month: day.hMonth, day: day.hDay } };
  }

  return { nextOccurrence };
}));
