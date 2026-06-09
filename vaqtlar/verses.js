// === ОЯТ МАНБАЛАРИНИ ТАҲЛИЛ ВА БИРЛАШТИРИШ ===
// Қуръон оятларининг "<сура> сураси, N-оят" манбаларини таҳлил қилади
// ва битта сурадан кетма-кет келадиган оятларни битта картага
// бирлаштиради. Соф функциялар (I/O йўқ) — алоҳида тестланади.
// Browser ва Node учун дуал экспорт.

(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.Verses = api;
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // "<сура> сураси, N-оят" ёки "<сура> сураси, N-M-оят" шаклидаги
  // манбани сура номи ва оят оралиғига ажратади. Мос келмаса — null.
  function parseVerseSource(source) {
    const m = String(source).match(/^(.+?)\s+сураси,\s*(\d+)(?:-(\d+))?-оят\s*$/);
    if (!m) return null;
    const start = parseInt(m[2], 10);
    const end = m[3] ? parseInt(m[3], 10) : start;
    return { surah: m[1].trim(), start: start, end: end };
  }

  // Битта сурадан кетма-кет (start === олдингининг end + 1) келадиган
  // оятларни битта картага бирлаштиради. Таҳлил қилиб бўлмайдиган
  // манбалар (parseVerseSource = null) ўз ҳолича қолдирилади.
  function groupVerses(verses) {
    const groups = [];
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

  return { parseVerseSource, groupVerses };
}));
