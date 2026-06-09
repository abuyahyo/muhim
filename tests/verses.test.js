import { describe, it, expect } from 'vitest';
import Verses from '../vaqtlar/verses.js';

const { parseVerseSource, groupVerses } = Verses;

describe('parseVerseSource', () => {
  it('битта оят: "Бақара сураси, 255-оят"', () => {
    expect(parseVerseSource('Бақара сураси, 255-оят')).toEqual({
      surah: 'Бақара', start: 255, end: 255,
    });
  });

  it('оралиқ: "Бақара сураси, 1-5-оят"', () => {
    expect(parseVerseSource('Бақара сураси, 1-5-оят')).toEqual({
      surah: 'Бақара', start: 1, end: 5,
    });
  });

  it('кўп сўзли сура номи: "Оли Имрон сураси, 8-оят"', () => {
    expect(parseVerseSource('Оли Имрон сураси, 8-оят')).toEqual({
      surah: 'Оли Имрон', start: 8, end: 8,
    });
  });

  it('бўшлиқларга чидамли', () => {
    expect(parseVerseSource('Нос сураси,  3-оят  ')).toEqual({
      surah: 'Нос', start: 3, end: 3,
    });
  });

  it('мос келмаган формат — null', () => {
    expect(parseVerseSource('Саҳиҳ Бухорий, 1-ҳадис')).toBeNull();
    expect(parseVerseSource('текст')).toBeNull();
    expect(parseVerseSource('')).toBeNull();
  });
});

describe('groupVerses', () => {
  it('бир сурадан кетма-кет оятлар битта картага бирлашади', () => {
    const out = groupVerses([
      { source: 'Бақара сураси, 1-оят', translation: 'А' },
      { source: 'Бақара сураси, 2-оят', translation: 'Б' },
      { source: 'Бақара сураси, 3-оят', translation: 'В' },
    ]);
    expect(out).toEqual([
      { source: 'Бақара сураси, 1-3-оят', translation: 'А Б В' },
    ]);
  });

  it('узилиш (кетма-кет эмас) — алоҳида карталар', () => {
    const out = groupVerses([
      { source: 'Бақара сураси, 1-оят', translation: 'А' },
      { source: 'Бақара сураси, 5-оят', translation: 'Б' }, // 2 эмас → узилади
    ]);
    expect(out).toHaveLength(2);
    expect(out[0].source).toBe('Бақара сураси, 1-оят');
    expect(out[1].source).toBe('Бақара сураси, 5-оят');
  });

  it('бошқа сура — бирлашмайди', () => {
    const out = groupVerses([
      { source: 'Бақара сураси, 1-оят', translation: 'А' },
      { source: 'Оли Имрон сураси, 2-оят', translation: 'Б' },
    ]);
    expect(out).toHaveLength(2);
  });

  it('оралиқдан кейин кетма-кет давом этади (1-3 сўнг 4)', () => {
    const out = groupVerses([
      { source: 'Бақара сураси, 1-3-оят', translation: 'АБВ' },
      { source: 'Бақара сураси, 4-оят', translation: 'Г' },
    ]);
    expect(out).toEqual([
      { source: 'Бақара сураси, 1-4-оят', translation: 'АБВ Г' },
    ]);
  });

  it('таҳлил қилиб бўлмайдиган манба ўз ҳолича қолади', () => {
    const out = groupVerses([
      { source: 'Саҳиҳ Бухорий, 1-ҳадис', translation: 'Ҳадис матни' },
    ]);
    expect(out).toEqual([
      { source: 'Саҳиҳ Бухорий, 1-ҳадис', translation: 'Ҳадис матни' },
    ]);
  });

  it('аралаш рўйхат: оят гуруҳи + ҳадис', () => {
    const out = groupVerses([
      { source: 'Бақара сураси, 1-оят', translation: 'А' },
      { source: 'Бақара сураси, 2-оят', translation: 'Б' },
      { source: 'Саҳиҳ Муслим, 5-ҳадис', translation: 'Ҳ' },
    ]);
    expect(out).toHaveLength(2);
    expect(out[0]).toEqual({ source: 'Бақара сураси, 1-2-оят', translation: 'А Б' });
    expect(out[1]).toEqual({ source: 'Саҳиҳ Муслим, 5-ҳадис', translation: 'Ҳ' });
  });

  it('бўш рўйхат — бўш натижа', () => {
    expect(groupVerses([])).toEqual([]);
  });
});
