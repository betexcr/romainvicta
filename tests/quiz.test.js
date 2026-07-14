import { describe, it, expect } from 'vitest';
import {
  generateQuizQuestions,
  isQuizAnswerCorrect,
  stripYearSuffixes,
} from '../src/lib/quiz.js';
import { translateItem } from '../src/lib/i18n.js';
import { DATA } from '../src/data/data.js';
import { DATA_ES } from '../src/data/data_es.js';
import { CATS } from '../src/data/app-core.js';

describe('quiz helpers', () => {
  it('stripYearSuffixes removes trailing dates', () => {
    expect(stripYearSuffixes('Julius Caesar (100 BC)')).toMatch(/Julius Caesar/);
  });

  it('generateQuizQuestions returns 10 answerable items', () => {
    const questions = generateQuizQuestions({
      data: DATA,
      cats: CATS,
      lang: 'en',
      translateItem: (item, lang) => translateItem(item, lang, DATA_ES),
      t: (k) => k,
      catName: (id) => id,
      formatYear: (y) => String(y),
    });
    expect(questions.length).toBe(10);
    for (const q of questions) {
      expect(q.correct).toBeTruthy();
      expect(q.options?.length).toBeGreaterThanOrEqual(2);
      expect(isQuizAnswerCorrect(q, q.correct)).toBe(true);
    }
  });
});
