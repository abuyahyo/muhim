import { describe, it, expect } from 'vitest';
import Schedule from '../vaqtlar/schedule.js';

const { currentAndNext } = Schedule;

// Битта кун учун намунавий намоз вақтлари (Date object'лар).
// Соатлар маҳаллий вақтда — currentAndNext фақат Date солиштиради,
// timezone'дан мустақил.
function buildTimes(day) {
  const at = (h, m) => new Date(2026, 5, day, h, m, 0); // 2026-06-(day)
  return {
    fajr:    at(4, 16),
    sunrise: at(5, 52),
    dhuhr:   at(12, 53),
    asr:     at(17, 46),
    maghrib: at(19, 54),
    isha:    at(21, 30),
  };
}

const DAY = 9;
const times = buildTimes(DAY);
const at = (h, m) => new Date(2026, 5, DAY, h, m, 0);

describe('currentAndNext — кун давомидаги ҳолатлар', () => {
  it('Бомдод билан Қуёш орасида: жорий=fajr, кейинги=sunrise', () => {
    const r = currentAndNext(times, at(5, 0));
    expect(r.currentId).toBe('fajr');
    expect(r.nextId).toBe('sunrise');
    expect(r.nextTime).toEqual(times.sunrise);
  });

  it('Пешиндан кейин, Асрдан олдин: жорий=dhuhr, кейинги=asr', () => {
    const r = currentAndNext(times, at(14, 0));
    expect(r.currentId).toBe('dhuhr');
    expect(r.nextId).toBe('asr');
    expect(r.nextTime).toEqual(times.asr);
  });

  it('Аср кириб бўлгач (Шомгача): жорий=asr, кейинги=maghrib', () => {
    const r = currentAndNext(times, at(18, 0));
    expect(r.currentId).toBe('asr');
    expect(r.nextId).toBe('maghrib');
  });

  it('Шом билан Хуфтон орасида: жорий=maghrib, кейинги=isha', () => {
    const r = currentAndNext(times, at(20, 30));
    expect(r.currentId).toBe('maghrib');
    expect(r.nextId).toBe('isha');
  });
});

describe('currentAndNext — чегаравий ҳолатлар', () => {
  it('Хуфтондан кейин (кеч кеча): жорий=isha, кейинги=fajr-next, nextTime=null', () => {
    const r = currentAndNext(times, at(23, 0));
    expect(r.currentId).toBe('isha');
    expect(r.nextId).toBe('fajr-next');
    expect(r.nextTime).toBeNull();
  });

  it('Ярим тундан кейин, Бомдоддан олдин: жорий=isha (кеча), кейинги=fajr', () => {
    const r = currentAndNext(times, at(2, 0));
    expect(r.currentId).toBe('isha');
    expect(r.nextId).toBe('fajr');
    expect(r.nextTime).toEqual(times.fajr);
  });

  it('Айнан Бомдод вақтида (now == fajr): ҳали fajr "кейинги" эмас — ўтган деб саналади', () => {
    // now < t шарти қатъий — тенг бўлса ўша вақт ўтган ҳисобланади.
    const r = currentAndNext(times, times.fajr);
    expect(r.currentId).toBe('fajr');
    expect(r.nextId).toBe('sunrise');
  });

  it('Бомдоддан бир дақиқа олдин: ҳамон кеча Хуфтони', () => {
    const r = currentAndNext(times, at(4, 15));
    expect(r.currentId).toBe('isha');
    expect(r.nextId).toBe('fajr');
  });

  it('Айнан Хуфтон вақтида (now == isha): жорий=isha, кейинги=fajr-next', () => {
    const r = currentAndNext(times, times.isha);
    expect(r.currentId).toBe('isha');
    expect(r.nextId).toBe('fajr-next');
    expect(r.nextTime).toBeNull();
  });
});
