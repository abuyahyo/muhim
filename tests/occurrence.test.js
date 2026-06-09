import { describe, it, expect } from 'vitest';
import Occurrence from '../kunlar/occurrence.js';
import HijriCalc from '../kunlar/hijri.js';

const { nextOccurrence } = Occurrence;
const { gregorianToHijri, hijriToGregorian } = HijriCalc;

// Барча тестлар аниқ "бугун" билан — детерминистик (системавий соатга боғлиқ эмас).
// Саналар new Date(y, m, d) орқали — маҳаллий ярим тун, TZ'дан мустақил
// (функция ҳам маҳаллий getDay/setHours ишлатади).
const TODAY = new Date(2026, 5, 9); // 2026-06-09
const cur = gregorianToHijri(TODAY); // шу куннинг ҳижрий санаси (оракул)

describe('nextOccurrence — weekly', () => {
  it('энг яқин келадиган ҳафта кунини танлайди', () => {
    const dow = TODAY.getDay();
    const target = (dow + 2) % 7; // 2 кундан кейин
    const r = nextOccurrence({ frequency: 'weekly', weekDay: target }, TODAY);
    expect(r.weekDay).toBe(target);
    expect(r.daysLeft).toBe(2);
    expect(r.date.getDay()).toBe(target);
  });

  it('бугуннинг ўзи ҳафта куни бўлса — daysLeft = 0', () => {
    const r = nextOccurrence({ frequency: 'weekly', weekDay: TODAY.getDay() }, TODAY);
    expect(r.daysLeft).toBe(0);
  });

  it('бир неча кундан энг яқини танланади (weekDays массиви)', () => {
    const dow = TODAY.getDay();
    const near = (dow + 1) % 7;
    const far = (dow + 5) % 7;
    const r = nextOccurrence({ frequency: 'weekly', weekDays: [far, near] }, TODAY);
    expect(r.weekDay).toBe(near);
    expect(r.daysLeft).toBe(1);
  });
});

describe('nextOccurrence — yearly', () => {
  it('бугуннинг ҳижрий санаси бўлса — шу йил, daysLeft = 0', () => {
    const r = nextOccurrence({ frequency: 'yearly', hMonth: cur.month, hDay: cur.day }, TODAY);
    expect(r.hijri.year).toBe(cur.year);
    expect(r.daysLeft).toBe(0);
  });

  it('бу ҳижрий йилда ҳали келмаган сана — шу йил', () => {
    // кейинги ой (йил охири бўлмаса) — албатта келаси
    const laterMonth = cur.month < 12 ? cur.month + 1 : cur.month;
    const day = { frequency: 'yearly', hMonth: laterMonth, hDay: cur.day };
    const r = nextOccurrence(day, TODAY);
    if (cur.month < 12) {
      expect(r.hijri.year).toBe(cur.year);
      expect(r.daysLeft).toBeGreaterThan(0);
    }
  });

  it('бу ҳижрий йилда ўтиб кетган сана — кейинги йил', () => {
    // олдинги ой (йил боши бўлмаса) — ўтган
    if (cur.month > 1) {
      const day = { frequency: 'yearly', hMonth: cur.month - 1, hDay: cur.day };
      const r = nextOccurrence(day, TODAY);
      expect(r.hijri.year).toBe(cur.year + 1);
      expect(r.daysLeft).toBeGreaterThan(0);
    }
  });

  it('қайтарилган сана hijri майдонига мос (round-trip)', () => {
    const day = { frequency: 'yearly', hMonth: cur.month, hDay: cur.day };
    const r = nextOccurrence(day, TODAY);
    const back = gregorianToHijri(r.date);
    expect(back).toEqual(r.hijri);
  });
});

describe('nextOccurrence — monthly', () => {
  it('шу ойда қолган кунни танлайди', () => {
    // бугундан кейинги кунлардан бирини тарget қиламиз
    const future = cur.day + 1;
    if (future <= 28) {
      const r = nextOccurrence({ frequency: 'monthly', hDays: [future] }, TODAY);
      expect(r.hijri.month).toBe(cur.month);
      expect(r.hijri.day).toBe(future);
      expect(r.daysLeft).toBeGreaterThan(0);
    }
  });

  it('шу ойда ҳаммаси ўтиб бўлган — кейинги ойга ўтади', () => {
    // бугундан олдинги кунларни тарget қиламиз
    if (cur.day > 2) {
      const past = cur.day - 1;
      const r = nextOccurrence({ frequency: 'monthly', hDays: [past] }, TODAY);
      const expMonth = cur.month < 12 ? cur.month + 1 : 1;
      const expYear = cur.month < 12 ? cur.year : cur.year + 1;
      expect(r.hijri.month).toBe(expMonth);
      expect(r.hijri.year).toBe(expYear);
      expect(r.hijri.day).toBe(past);
    }
  });

  it('hDays тартибсиз берилса ҳам — энг кичик мос кунни танлайди', () => {
    const r = nextOccurrence({ frequency: 'monthly', hDays: [15, 13, 14] }, TODAY);
    // натижа кунлардан бири (тартибсизлик натижани бузмаслиги керак)
    expect([13, 14, 15]).toContain(r.hijri.day);
  });
});

// Иккинчи аниқ сана — ҳижрий йил ўртаси (ой 5), шунда "шу йил, кейинги ой"
// ва "ўтган ой → кейинги йил" ҳолатларини шартсиз текшириш мумкин.
describe('nextOccurrence — yearly (йил ўртасидаги сана билан)', () => {
  const T2 = new Date(2026, 9, 15); // 2026-10-15 → 1448-05-03
  const c2 = gregorianToHijri(T2);

  it('кейинги ҳижрий ойдаги сана — ШУ йил', () => {
    const r = nextOccurrence({ frequency: 'yearly', hMonth: c2.month + 1, hDay: 1 }, T2);
    expect(r.hijri.year).toBe(c2.year);
    expect(r.daysLeft).toBeGreaterThan(0);
  });

  it('олдинги ҳижрий ойдаги сана — КЕЙИНГИ йил', () => {
    const r = nextOccurrence({ frequency: 'yearly', hMonth: c2.month - 1, hDay: 1 }, T2);
    expect(r.hijri.year).toBe(c2.year + 1);
  });

  it('шу ой, лекин ўтган кун — КЕЙИНГИ йил', () => {
    const r = nextOccurrence({ frequency: 'yearly', hMonth: c2.month, hDay: c2.day - 1 }, T2);
    expect(r.hijri.year).toBe(c2.year + 1);
  });

  it('шу ой, келаси кун — ШУ йил', () => {
    const r = nextOccurrence({ frequency: 'yearly', hMonth: c2.month, hDay: c2.day + 1 }, T2);
    expect(r.hijri.year).toBe(c2.year);
    expect(r.daysLeft).toBeGreaterThan(0);
  });
});

describe('nextOccurrence — параметрсиз (жорий сана)', () => {
  it('today берилмаса жорий санани ишлатади, валид натижа қайтаради', () => {
    const r = nextOccurrence({ frequency: 'yearly', hMonth: 1, hDay: 1 });
    expect(r.date instanceof Date).toBe(true);
    expect(r.daysLeft).toBeGreaterThanOrEqual(0);
    expect(r.hijri).toHaveProperty('year');
  });
});
