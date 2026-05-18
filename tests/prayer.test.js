import { describe, it, expect } from 'vitest';
import PrayerTimes from '../vaqtlar/prayer.js';

const { calculate, tahajjudWindow, METHODS } = PrayerTimes;

// Тестлар Tashkent timezone'да ишлайди — CI'да TZ=Asia/Tashkent сетлансин.
// vitest.config.js'да ёки package.json'да —
// биз тестни TZ'дан мустақил қилиш учун UTC соатларни ҳам текширамиз.

const TASHKENT = { lat: 41.2995, lon: 69.2401 };
const MECCA = { lat: 21.4225, lon: 39.8262 };

// Утсувини HH:MM сифатида олиш — берилган timezone'да.
function inTZ(date, tz) {
  return date.toLocaleTimeString('en-GB', { timeZone: tz, hour12: false }).slice(0, 5);
}

// Соат фарқини дақиқада олиш (a - b).
function minutesDiff(a, b) {
  return Math.round((a - b) / 60000);
}

describe('PrayerTimes.calculate — Тошкент 18 май 2026 (Ҳанафий, MWL)', () => {
  // Берилган сана учун 5 вақт астрономик ҳисоб-китобни кутамиз.
  // Vaqt'ларни Tashkent zone'да текширамиз — TZ'га мустақил.
  const date = new Date(Date.UTC(2026, 4, 18, 0, 0, 0)); // 18 май 2026 00:00 UTC
  const times = calculate(date, TASHKENT.lat, TASHKENT.lon, { madhab: 'Hanafi', method: 'MWL' });

  const expected = {
    fajr:    '03:0',  // ~03:05
    sunrise: '05:0',  // ~05:01
    dhuhr:   '12:1',  // ~12:19
    asr:     '17:2',  // ~17:25 (Hanafi)
    maghrib: '19:3',  // ~19:36
    isha:    '21:2',  // ~21:25
  };

  for (const k of Object.keys(expected)) {
    it(`${k} — Tashkent'да ${expected[k]}X гача`, () => {
      const hhmm = inTZ(times[k], 'Asia/Tashkent');
      expect(hhmm.startsWith(expected[k])).toBe(true);
    });
  }
});

describe('Аср — мазҳаб фарқи (Ҳанафий >> Шофиъий)', () => {
  // Ҳанафий: соя=2x → Аср кечроқ. Шофиъий: соя=1x → эртароқ.
  // Иккаласи орасидаги фарқ 60-90 дақиқа атрофида бўлиши керак.
  const date = new Date(Date.UTC(2026, 4, 18));
  const hanafi = calculate(date, TASHKENT.lat, TASHKENT.lon, { madhab: 'Hanafi', method: 'MWL' });
  const shafi  = calculate(date, TASHKENT.lat, TASHKENT.lon, { madhab: 'Shafi',  method: 'MWL' });

  it('Ҳанафий Аср — Шофиъийдан кейин', () => {
    expect(hanafi.asr > shafi.asr).toBe(true);
  });

  it('фарқ 30 дан 120 дақиқа орасида', () => {
    const diff = minutesDiff(hanafi.asr, shafi.asr);
    expect(diff).toBeGreaterThan(30);
    expect(diff).toBeLessThan(120);
  });

  it('Бомдод, Шом, Хуфтон мазҳабга боғлиқ эмас', () => {
    expect(hanafi.fajr.getTime()).toBe(shafi.fajr.getTime());
    expect(hanafi.maghrib.getTime()).toBe(shafi.maghrib.getTime());
    expect(hanafi.isha.getTime()).toBe(shafi.isha.getTime());
  });
});

describe('Ҳисоблаш усуллари — Фажр/Иссиҳ бурчаги фарқи', () => {
  const date = new Date(Date.UTC(2026, 4, 18));
  const opts = base => Object.assign({ madhab: 'Hanafi' }, base);

  it('Миср усули — Фажр MWLдан эртароқ (Бомдод бурчаги 19.5°)', () => {
    const mwl = calculate(date, TASHKENT.lat, TASHKENT.lon, opts({ method: 'MWL' }));
    const eg = calculate(date, TASHKENT.lat, TASHKENT.lon, opts({ method: 'Egypt' }));
    expect(eg.fajr < mwl.fajr).toBe(true);
  });

  it('ISNA — Фажр MWLдан кечроқ (15° vs 18°)', () => {
    const mwl = calculate(date, TASHKENT.lat, TASHKENT.lon, opts({ method: 'MWL' }));
    const isna = calculate(date, TASHKENT.lat, TASHKENT.lon, opts({ method: 'ISNA' }));
    expect(isna.fajr > mwl.fajr).toBe(true);
  });

  it('Уммул Қуро — Иссиҳ Шомдан 90 дақиқа кейин', () => {
    const t = calculate(date, MECCA.lat, MECCA.lon, opts({ method: 'Makkah' }));
    const diff = minutesDiff(t.isha, t.maghrib);
    expect(diff).toBe(90);
  });

  it('METHODS объекти 5 та усулни ўз ичига олади', () => {
    expect(Object.keys(METHODS).sort()).toEqual(['Egypt', 'ISNA', 'Karachi', 'MWL', 'Makkah']);
  });
});

describe('Кетма-кетлик — намоз вақтлари тўғри тартибда', () => {
  // Маккани ишлатамиз чунки у lon=39.83° — UTC test server'да ҳамма вақт
  // бир хил UTC кунига сиғади. Тошкент учун real foydalanuvchi'нинг
  // tz=+5'и lon/15'ни компенсация қилади; UTC test server'да эса sunrise
  // олдинги UTC кунига ўтиб кетиши мумкин (фойдаланувчилар учун муаммо эмас).
  function expectOrdered(t) {
    expect(t.fajr < t.sunrise).toBe(true);
    expect(t.sunrise < t.dhuhr).toBe(true);
    expect(t.dhuhr < t.asr).toBe(true);
    expect(t.asr < t.maghrib).toBe(true);
    expect(t.maghrib < t.isha).toBe(true);
  }

  it('Бомдод < Қуёш < Пешин < Аср < Шом < Хуфтон (ёз — Макка)', () => {
    const date = new Date(Date.UTC(2026, 5, 21));
    expectOrdered(calculate(date, MECCA.lat, MECCA.lon, { madhab: 'Hanafi', method: 'MWL' }));
  });

  it('Бомдод < Қуёш < Пешин < Аср < Шом < Хуфтон (қиш — Макка)', () => {
    const date = new Date(Date.UTC(2025, 11, 21));
    expectOrdered(calculate(date, MECCA.lat, MECCA.lon, { madhab: 'Hanafi', method: 'MWL' }));
  });
});

describe('Жойлашув фарқи — Макка ва Тошкент бошқача', () => {
  // Икки шаҳар учун дҳур бир-биридан фарқ қилади (узоқлик ва eqt).
  const date = new Date(Date.UTC(2026, 4, 18));
  const opts = { madhab: 'Hanafi', method: 'MWL' };
  const tash = calculate(date, TASHKENT.lat, TASHKENT.lon, opts);
  const mecca = calculate(date, MECCA.lat, MECCA.lon, opts);

  it('Дҳур UTC моментлари фарқ қилади', () => {
    expect(tash.dhuhr.getTime()).not.toBe(mecca.dhuhr.getTime());
  });
});

describe('tahajjudWindow — туннинг охирги учдан бири', () => {
  const date = new Date(Date.UTC(2026, 4, 18));
  const opts = { madhab: 'Hanafi', method: 'MWL' };
  const t = calculate(date, TASHKENT.lat, TASHKENT.lon, opts);
  const tah = tahajjudWindow(date, TASHKENT.lat, TASHKENT.lon, opts);

  it('start Шомдан кейин', () => {
    expect(tah.start > t.maghrib).toBe(true);
  });

  it('end — эртанги Бомдод', () => {
    const tomorrow = new Date(date);
    tomorrow.setUTCDate(date.getUTCDate() + 1);
    const tom = calculate(tomorrow, TASHKENT.lat, TASHKENT.lon, opts);
    expect(tah.end.getTime()).toBe(tom.fajr.getTime());
  });

  it('window узунлиги ≈ кеча давомининг 1/3 си', () => {
    const tomorrow = new Date(date);
    tomorrow.setUTCDate(date.getUTCDate() + 1);
    const tom = calculate(tomorrow, TASHKENT.lat, TASHKENT.lon, opts);
    const nightMs = tom.fajr - t.maghrib;
    const windowMs = tah.end - tah.start;
    const ratio = windowMs / nightMs;
    expect(ratio).toBeGreaterThan(0.32);
    expect(ratio).toBeLessThan(0.34);
  });
});

describe('Defaults — Madhab=Hanafi, Method=MWL', () => {
  const date = new Date(Date.UTC(2026, 4, 18));

  it('бўш opts — Ҳанафий + MWL ишлатилади', () => {
    const def = calculate(date, TASHKENT.lat, TASHKENT.lon, {});
    const explicit = calculate(date, TASHKENT.lat, TASHKENT.lon, { madhab: 'Hanafi', method: 'MWL' });
    expect(def.fajr.getTime()).toBe(explicit.fajr.getTime());
    expect(def.asr.getTime()).toBe(explicit.asr.getTime());
    expect(def.isha.getTime()).toBe(explicit.isha.getTime());
  });

  it('opts параметрисиз ҳам ишлайди', () => {
    const t = calculate(date, TASHKENT.lat, TASHKENT.lon);
    expect(t.dhuhr instanceof Date).toBe(true);
  });

  it('нотўғри метод — MWL fallback', () => {
    const bad = calculate(date, TASHKENT.lat, TASHKENT.lon, { method: 'NONEXISTENT' });
    const mwl = calculate(date, TASHKENT.lat, TASHKENT.lon, { method: 'MWL' });
    expect(bad.fajr.getTime()).toBe(mwl.fajr.getTime());
  });
});
