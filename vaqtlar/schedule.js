// === НАМОЗ ЖАДВАЛИ — ҲОЛАТ ЛОГИКАСИ ===
// Берилган бугунги намоз вақтлари ва ҳозирги вақтдан — ҳозир қайси намоз
// "жорий" ва кейингиси нима эканини аниқлайди. Соф функция (I/O йўқ),
// шунинг учун алоҳида тестланади. Browser ва Node учун дуал экспорт.

(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.Schedule = api;
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Жорий вақт қайси намоз вақтига кириб турганини аниқлаш.
  // Аср фарзи кириб бўлгач — у вақт "ҳозирги" бўлади (Шом гача).
  // Чегаравий ҳоллар:
  //   - Бомдоддан олдин (ярим тун): жорий — кеча Хуфтони, кейингиси — Бомдод.
  //   - Хуфтондан кейин: жорий — Хуфтон, кейингиси — 'fajr-next' (эртанги
  //     Бомдод). nextTime null қайтади — уни чақирувчи эртанги фажрдан
  //     ҳисоблаб қояди.
  // Кириш: times = { fajr, sunrise, dhuhr, asr, maghrib, isha } (Date),
  //        now (Date). Қайтаради: { currentId, nextId, nextTime }.
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
    }
    return { currentId, nextId, nextTime };
  }

  return { currentAndNext };
}));
