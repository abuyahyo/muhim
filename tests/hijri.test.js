import { describe, it, expect } from 'vitest';
import HijriCalc from '../hijri.js';

const { gregorianToHijri, hijriToGregorian, hijriMonthLength } = HijriCalc;

// UTC noon Date — TZ дан холи; алгоритм Julian Day floor'и UTC бўйича.
function utcNoon(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

describe('hijriToGregorian — anchor dates', () => {
  // Алгоритмнинг изчил чиқиши. Расмий Umm al-Qura'дан ±1 кунгача
  // фарқ қилиши мумкин — бу тестлар алгоритмнинг стабиллигини ушлайди,
  // расмий ой кўринишини эмас.
  const cases = [
    { h: [1447, 1, 1], g: '2025-06-27' },
    { h: [1447, 9, 1], g: '2026-02-18' },   // ~Рамазон бошланиши
    { h: [1447, 11, 1], g: '2026-04-18' },  // Зулқаъда (скриншотдан)
    { h: [1447, 11, 30], g: '2026-05-17' }, // Зулқаъда якуни
    { h: [1448, 1, 1], g: '2026-06-17' },   // Кейинги ҳижрий йил
    { h: [1400, 1, 1], g: '1979-11-21' },
  ];

  for (const { h, g } of cases) {
    it(`${h.join('-')} → ${g}`, () => {
      const date = hijriToGregorian(...h);
      expect(date.toISOString().slice(0, 10)).toBe(g);
    });
  }
});

describe('gregorianToHijri — anchor dates', () => {
  it('2025-06-27 UTC → 1447-01-01', () => {
    expect(gregorianToHijri(utcNoon(2025, 6, 27))).toEqual({ year: 1447, month: 1, day: 1 });
  });

  it('2026-04-18 UTC → 1447-11-01', () => {
    expect(gregorianToHijri(utcNoon(2026, 4, 18))).toEqual({ year: 1447, month: 11, day: 1 });
  });

  it('2026-05-15 UTC noon → 1447-11-28', () => {
    expect(gregorianToHijri(utcNoon(2026, 5, 15))).toEqual({ year: 1447, month: 11, day: 28 });
  });
});

describe('Roundtrip invariants', () => {
  // h → g → h ҳар доим бошланғич Hijri санани қайтариши керак.
  it('hijri → gregorian → hijri (диапазон бўйича)', () => {
    for (let y = 1440; y <= 1450; y++) {
      for (let m = 1; m <= 12; m++) {
        const len = hijriMonthLength(y, m);
        for (const d of [1, Math.floor(len / 2), len]) {
          const g = hijriToGregorian(y, m, d);
          // UTC noon ' га силжитамиз — JD floor чегарасидан четлашмаслик учун.
          g.setUTCHours(12, 0, 0, 0);
          const back = gregorianToHijri(g);
          expect(back).toEqual({ year: y, month: m, day: d });
        }
      }
    }
  });
});

describe('hijriMonthLength', () => {
  it('доим 29 ёки 30 кун қайтаради', () => {
    for (let y = 1440; y <= 1455; y++) {
      for (let m = 1; m <= 12; m++) {
        const len = hijriMonthLength(y, m);
        expect([29, 30]).toContain(len);
      }
    }
  });

  it('йил узунлиги 354 ёки 355 кун', () => {
    for (let y = 1440; y <= 1455; y++) {
      let total = 0;
      for (let m = 1; m <= 12; m++) total += hijriMonthLength(y, m);
      expect([354, 355]).toContain(total);
    }
  });

  it('Зулқаъда 1447 = 30 кун (скриншотдан тасдиқланган)', () => {
    expect(hijriMonthLength(1447, 11)).toBe(30);
  });
});

describe('Йил/ой чегаралари', () => {
  it('декабрь→январь ой алмашиши тоза', () => {
    const lastDay = hijriToGregorian(1447, 12, hijriMonthLength(1447, 12));
    const nextFirst = hijriToGregorian(1448, 1, 1);
    const diff = Math.round((nextFirst - lastDay) / 86400000);
    expect(diff).toBe(1);
  });

  it('ой охирги куни кейинги ой 1-кунидан 1 кун олдин', () => {
    for (let m = 1; m <= 11; m++) {
      const last = hijriToGregorian(1447, m, hijriMonthLength(1447, m));
      const next = hijriToGregorian(1447, m + 1, 1);
      expect(Math.round((next - last) / 86400000)).toBe(1);
    }
  });
});
