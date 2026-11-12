// === МУҲИМ — И18Н (УЧ ТИЛ: uz-Cyrl / ru / en) ===
// Барча бўлимлар (Вақтлар / Кунлар / Жойлар) ишлатадиган умумий таржима луғати.
// Тил фойдаланувчи томонидан танланади (localStorage), автовикторлаш йўқ.
// Контент (оятлар, ҳадислар, тавсифлар) ҳозирча ўзбекча қолади.
(function () {
  'use strict';

  var LANG_KEY = 'muhim_lang';

  var DICT = {
    // Навигация ва умумий
    'Вақтлар': { ru: 'Времена', en: 'Times' },
    'Кунлар': { ru: 'Дни', en: 'Days' },
    'Жойлар': { ru: 'Места', en: 'Places' },
    'Тақвим': { ru: 'Календарь', en: 'Calendar' },
    'Муҳим Вақтлар': { ru: 'Мухим — Времена', en: 'Muhim — Times' },
    'Муҳим Кунлар': { ru: 'Мухим — Дни', en: 'Muhim — Days' },
    'Муҳим Жойлар': { ru: 'Мухим — Места', en: 'Muhim — Places' },
    'Исломий Тақвим': { ru: 'Исламский календарь', en: 'Islamic Calendar' },
    'Муқаддас Жойлар': { ru: 'Святые места', en: 'Sacred Places' },
    '← Орқага': { ru: '← Назад', en: '← Back' },
    'Улашиш': { ru: 'Поделиться', en: 'Share' },
    'Кўпроқ кўрсатиш': { ru: 'Показать ещё', en: 'Show more' },
    'Қуръон оятлари': { ru: 'Аяты Корана', en: 'Quran verses' },
    'Ҳадислар': { ru: 'Хадисы', en: 'Hadiths' },
    'Ҳақида': { ru: 'Описание', en: 'About' },
    'ИЗОҲ': { ru: 'ПРИМЕЧАНИЕ', en: 'NOTE' },

    // Вақтлар
    'Жорий жой': { ru: 'Текущее место', en: 'Current location' },
    'Эртанги Бомдод': { ru: 'Завтрашний Фаджр', en: "Tomorrow's Fajr" },
    'Кейинги': { ru: 'Следующее', en: 'Next' },
    'Бугунги вақтлар': { ru: 'Сегодняшние времена', en: "Today's times" },
    'Бугунги вақт': { ru: 'Сегодняшнее время', en: "Today's time" },
    'Маънавий вақтлар': { ru: 'Духовные времена', en: 'Spiritual times' },
    'Маънавий вақт': { ru: 'Духовное время', en: 'Spiritual time' },
    'Намоз вақти': { ru: 'Время намаза', en: 'Prayer time' },
    'Таҳажжуд ва Қиёмул-лайл': { ru: 'Тахаджуд и киям аль-лейль', en: 'Tahajjud & Qiyam al-Layl' },
    'Эрталабки ва Кечқурунги зикрлар': { ru: 'Утренние и вечерние зикры', en: 'Morning & evening dhikr' },
    'Зуҳо (Чошгоҳ)': { ru: 'Зуха (чаштгох)', en: 'Duha (Chasht)' },
    'Саҳарлик / Ифтор': { ru: 'Сухур / Ифтар', en: 'Suhoor / Iftar' },
    'Мустажоб соатлар': { ru: 'Часы исполнения дуа', en: 'Hours of answered dua' },
    'Қибла йўналиши': { ru: 'Направление киблы', en: 'Qibla direction' },
    'Жонли компас': { ru: 'Живой компас', en: 'Live compass' },
    '⚙ Созламалар': { ru: '⚙ Настройки', en: '⚙ Settings' },
    'Мазҳаб (Аср вақтига таъсир қилади)': { ru: 'Мазхаб (влияет на время Асра)', en: 'Madhab (affects Asr)' },
    'Ҳанафий': { ru: 'Ханафи', en: 'Hanafi' },
    'Шофиъий': { ru: 'Шафии', en: "Shafi'i" },
    'Ҳисоблаш усули': { ru: 'Метод расчёта', en: 'Calculation method' },
    'Автоматик': { ru: 'Автоматически', en: 'Auto' },
    'Миср': { ru: 'Египет', en: 'Egypt' },
    'Карачи': { ru: 'Карачи', en: 'Karachi' },
    'Уммул Қуро': { ru: 'Умм аль-Кура', en: 'Umm al-Qura' },
    'Шаҳар': { ru: 'Город', en: 'City' },
    'Шаҳар номини ёзинг…': { ru: 'Введите название города…', en: 'Type a city name…' },
    'Жорий: ': { ru: 'Текущее: ', en: 'Current: ' },
    'ҲАҚИДА': { ru: 'ОПИСАНИЕ', en: 'ABOUT' },
    'Эрталабки зикрлар вақти': { ru: 'Время утренних зикров', en: 'Morning dhikr time' },
    'Кечқурунги зикрлар вақти': { ru: 'Время вечерних зикров', en: 'Evening dhikr time' },
    'Зуҳо вақти': { ru: 'Время зуха', en: 'Duha time' },
    'Қиёмул-лайл вақти': { ru: 'Время киям аль-лейля', en: 'Qiyam al-Layl time' },
    'Таҳажжуд вақти': { ru: 'Время тахаджуда', en: 'Tahajjud time' },
    'Саҳарлик тугаши': { ru: 'Конец сухура', en: 'Suhoor ends' },
    'Ифтор': { ru: 'Ифтар', en: 'Iftar' },
    'Зикрларни ўқиш': { ru: 'Читать зикры', en: 'Read dhikr' },
    'Қидирилмоқда…': { ru: 'Поиск…', en: 'Searching…' },
    'Топилмади': { ru: 'Не найдено', en: 'Not found' },
    'Хатолик — тармоқни текширинг': { ru: 'Ошибка — проверьте сеть', en: 'Error — check your connection' },
    'Қурилма йўналиш сенсорини қувватламайди.': { ru: 'Устройство не поддерживает датчик ориентации.', en: 'Device does not support the orientation sensor.' },
    'Сенсорга рухсат берилмади.': { ru: 'Нет доступа к сенсору.', en: 'Sensor permission denied.' },
    'Тошкент': { ru: 'Ташкент', en: 'Tashkent' },

    // Намоз номлари
    'Бомдод': { ru: 'Фаджр', en: 'Fajr' },
    'Қуёш': { ru: 'Восход', en: 'Sunrise' },
    'Пешин': { ru: 'Зухр', en: 'Dhuhr' },
    'Аср': { ru: 'Аср', en: 'Asr' },
    'Шом': { ru: 'Магриб', en: 'Maghrib' },
    'Хуфтон': { ru: 'Иша', en: 'Isha' },

    // Кунлар
    'байрам/муҳим': { ru: 'праздник/важный', en: 'holiday/important' },
    'Ҳар ҳафта': { ru: 'Еженедельно', en: 'Weekly' },
    'Ҳар ой': { ru: 'Ежемесячно', en: 'Monthly' },
    'Ҳар йил': { ru: 'Ежегодно', en: 'Yearly' },
    'Изоҳ': { ru: 'Пояснение', en: 'Notes' },
    'Бугун': { ru: 'Сегодня', en: 'Today' },
    'Эртага': { ru: 'Завтра', en: 'Tomorrow' },
    'кун қолди': { ru: ' дн. осталось', en: ' days left' },
    'Бугунги сана': { ru: 'Сегодняшняя дата', en: "Today's date" },
    ' ҳижрий': { ru: ' по хиджре', en: ' AH' },
    'Милодий': { ru: 'Григорианский', en: 'Gregorian' },
    'Яқинлашаётган кунлар': { ru: 'Ближайшие дни', en: 'Upcoming days' },
    'Ҳар ҳафта · Ой': { ru: 'Еженедельно · Ежемесячно', en: 'Weekly · Monthly' },
    'Такрорий кунлар': { ru: 'Повторяющиеся дни', en: 'Recurring days' },
    'Расмлар тўплами': { ru: 'Галерея', en: 'Gallery' },
    'Тўлиқ маълумотли расмлар тўплами': { ru: 'Галерея с полной информацией', en: 'Full-info gallery' },
    'Ҳафталик': { ru: 'Еженедельно', en: 'Weekly' },
    ' ва ': { ru: ' и ', en: ' and ' },
    'Ҳар ҳижрий ой': { ru: 'Каждый хиджрий месяц', en: 'Every Hijri month' },
    '-куни': { ru: '-й день', en: ' (day)' },
    'Ҳижрий': { ru: 'Хиджра', en: 'Hijri' },
    'Ҳафта куни': { ru: 'День недели', en: 'Day of week' },
    'Кун ҳақида': { ru: 'О дне', en: 'About the day' },
    'Илмий шарҳ': { ru: 'Научное пояснение', en: 'Scientific note' },
    'Саҳиҳ ҳадислар': { ru: 'Хадисы Сахиха', en: 'Sahih hadiths' },
    'Бугунги ой фазаси': { ru: 'Сегодняшняя фаза луны', en: "Today's moon phase" },
    'Ёритилиш — ': { ru: 'Освещённость — ', en: 'Illumination — ' },
    'Ҳижрий тақвим': { ru: 'Календарь хиджры', en: 'Hijri calendar' },
    ' ҳижрий йил': { ru: ' год по хиджре', en: ' AH' },
    'Ой танлаш': { ru: 'Выбор месяца', en: 'Select month' },
    'Ҳужайрада Милодий рақамни кўрсатиш/беркитиш': { ru: 'Показать/скрыть григорианские числа', en: 'Show/hide Gregorian numbers' },
    'Милодий кунлар': { ru: 'Григорианские дни', en: 'Gregorian days' },
    'Муҳим кунларни катак ранги билан белгилаш': { ru: 'Выделять важные дни цветом', en: 'Highlight important days' },
    'Катак ранги': { ru: 'Цвет ячеек', en: 'Cell tint' },
    'Бу ойдаги муҳим кунлар': { ru: 'Важные дни этого месяца', en: 'Important days this month' },
    'Бу ойда муҳим кунлар йўқ': { ru: 'В этом месяце нет важных дней', en: 'No important days this month' },
    'Нусха олинди': { ru: 'Скопировано', en: 'Copied' },
    'Нусха олиб бўлмади': { ru: 'Не удалось скопировать', en: 'Copy failed' },
    'Браузер ulashish-ни қўлламайди': { ru: 'Браузер не поддерживает обмен', en: 'Browser does not support sharing' },
    'Зарур изоҳ': { ru: 'Важное примечание', en: 'Important note' },
    'КУН ҲАҚИДА': { ru: 'О ДНЕ', en: 'ABOUT THE DAY' },
    'ҲИҶРИЙ': { ru: 'ХИДЖРА', en: 'HIJRI' },
    'МИЛОДИЙ': { ru: 'ГРИГОР.', en: 'GREGORIAN' },
    'ҲАФТА КУНИ': { ru: 'ДЕНЬ НЕДЕЛИ', en: 'DAY OF WEEK' },

    // Муҳим кунлар номлари
    'Ҳижрий Янги Йил': { ru: 'Хиджрийский Новый год', en: 'Hijri New Year' },
    'Ашуро Куни': { ru: 'День Ашура', en: 'Day of Ashura' },
    'Мавлуди Шариф': { ru: 'Мавлид ан-Наби', en: 'Mawlid an-Nabi' },
    'Исро ва Меърож': { ru: 'Исра и Мирадж', en: 'Isra & Miraj' },
    'Бароат Кечаси': { ru: 'Ночь Бараат', en: 'Night of Baraat' },
    'Рамазон Бошланиши': { ru: 'Начало Рамадана', en: 'Start of Ramadan' },
    'Лайлатул Қадр': { ru: 'Ночь Предопределения', en: 'Laylat al-Qadr' },
    'Рамазон Ҳайити': { ru: 'Ид аль-Фитр', en: 'Eid al-Fitr' },
    'Шаввол ойининг 6 куни': { ru: '6 дней Шавваля', en: '6 days of Shawwal' },
    'Зулҳижжанинг дастлабки ўн куни': { ru: 'Первые 10 дней Зульхиджи', en: 'First 10 days of Dhul-Hijjah' },
    'Арафа Куни': { ru: 'День Арафа', en: 'Day of Arafah' },
    'Қурбон Ҳайити': { ru: 'Ид аль-Адха', en: 'Eid al-Adha' },
    'Ташриқ Кунлари': { ru: 'Дни ташрика', en: 'Days of Tashreeq' },
    'Аййамуль Бийз': { ru: 'Белые дни', en: 'White Days' },
    'Жума': { ru: 'Джума (пятница)', en: 'Jumuah (Friday)' },
    'Душанба ва Пайшанба рўзаси': { ru: 'Пост в пн и чт', en: 'Mon & Thu fast' },

    // Жойлар номлари
    'Масжидул Ҳаром': { ru: 'Заповедная мечеть', en: 'Masjid al-Haram' },
    'Масжидул Набавий': { ru: 'Мечеть Пророка', en: 'Masjid an-Nabawi' },
    'Масжидул Ақсо': { ru: 'Аль-Акса', en: 'Masjid al-Aqsa' },
    'Қубо Масжиди': { ru: 'Мечеть Куба', en: 'Quba Mosque' },
    'Арафот тоғи': { ru: 'Гора Арафат', en: 'Mount Arafat' },
    'Барча масжидлар': { ru: 'Все мечети', en: 'All mosques' }
  };

  var ARRAYS = {
    hijriMonths: {
      uz: ['Муҳаррам', 'Сафар', 'Рабиул аввал', 'Рабиул охир', 'Жумодул аввал', 'Жумодул охир', 'Ражаб', 'Шаъбон', 'Рамазон', 'Шаввол', 'Зулқаъда', 'Зулҳижжа'],
      ru: ['Мухаррам', 'Сафар', 'Раби аль-авваль', 'Раби ас-сани', 'Джумада аль-уля', 'Джумада ас-сания', 'Раджаб', 'Шаабан', 'Рамадан', 'Шавваль', 'Зулькада', 'Зульхиджа'],
      en: ['Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Ula', 'Jumada al-Thaniya', 'Rajab', 'Shaban', 'Ramadan', 'Shawwal', 'Dhul-Qadah', 'Dhul-Hijjah']
    },
    gregorianMonths: {
      uz: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
      ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
      en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    },
    gregorianMonthsShort: {
      uz: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
      ru: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
      en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    },
    weekDays: {
      uz: ['Якш', 'Душ', 'Сеш', 'Чор', 'Пай', 'Жум', 'Шан'],
      ru: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
      en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    },
    weekDaysFull: {
      uz: ['Якшанба', 'Душанба', 'Сешанба', 'Чоршанба', 'Пайшанба', 'Жума', 'Шанба'],
      ru: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
      en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    }
  };

  function androidLang() {
    try {
      var a = window.MuhimAndroid;
      if (a && a.lang) {
        var l = a.lang();
        if (l && l !== 'system') return l;
      }
    } catch (e) {}
    return null;
  }

  function lang() {
    var al = androidLang();
    if (al) return al;
    try { return localStorage.getItem(LANG_KEY) || 'uz'; } catch (e) { return 'uz'; }
  }

  function setLang(l) {
    try {
      var a = window.MuhimAndroid;
      if (a && a.saveLang) a.saveLang(l);
    } catch (e) {}
    try { localStorage.setItem(LANG_KEY, l); } catch (e) {}
    location.reload();
  }

  function t(s) {
    var e = DICT[s];
    if (!e) return s;
    return e[lang()] || s;
  }

  function arr(name) {
    var a = ARRAYS[name];
    if (!a) return [];
    return a[lang()] || a.uz;
  }

  // Kontent manbalarini ("<сура> сураси, N-оят" ва boshqalar) tarjima qilish.
  // Avval CONTENT (content-i18n.js), keyin DICT, keyin surah regexi tekshiriladi.
  function tc(s) {
    if (!s) return s;
    var l = lang();
    if (l === 'uz') return s;
    var c = window.MuhimI18N && window.MuhimI18N.CONTENT;
    if (c && c[s]) return c[s][l] || s;
    var d = DICT[s];
    if (d) return d[l] || s;
    var m = String(s).match(/^(.+?)\s+сураси,\s*(\d+)(?:\s*-\s*(\d+))?[\s-]*оят(лар)?\s*$/);
    if (m) {
      var su = window.MuhimI18N && window.MuhimI18N.SURAH && window.MuhimI18N.SURAH[m[1].trim()];
      if (su) {
        var range = m[3]
          ? (l === 'ru' ? 'аяты ' + m[2] + '-' + m[3] : 'verses ' + m[2] + '-' + m[3])
          : (l === 'ru' ? 'аят ' + m[2] : 'verse ' + m[2]);
        return (l === 'ru' ? 'Сура ' : 'Surah ') + su[l] + ', ' + range;
      }
    }
    return s;
  }

  // Сахифа юкланганда статик HTML'ни (нав, title, lang) локаллаштириш.
  function applyStatic() {
    var l = lang();
    document.documentElement.lang = (l === 'uz') ? 'uz-Cyrl' : l;
    var labels = document.querySelectorAll('.app-nav-label');
    for (var i = 0; i < labels.length; i++) {
      var txt = labels[i].textContent.trim();
      if (DICT[txt]) labels[i].textContent = t(txt);
    }
    if (DICT[document.title]) document.title = t(document.title);
  }

  // Тил танлаш тугмалари — саҳифа сарлавҳасига қўйилади.
  function switcherHtml() {
    var l = lang();
    var opts = [['uz', 'Oʻz'], ['ru', 'Рус'], ['en', 'Eng']];
    var h = '<div class="lang-switch" role="group" aria-label="Til / Язык / Language">';
    for (var i = 0; i < opts.length; i++) {
      h += '<button class="lang-switch-btn' + (l === opts[i][0] ? ' active' : '')
        + '" onclick="MuhimI18N.setLang(\'' + opts[i][0] + '\')">' + opts[i][1] + '</button>';
    }
    return h + '</div>';
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyStatic);
    else applyStatic();
  }

  window.MuhimI18N = { lang: lang, setLang: setLang, t: t, arr: arr, tc: tc, applyStatic: applyStatic, switcherHtml: switcherHtml };
})();
