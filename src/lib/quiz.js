/** Pure quiz question generation (no React). */

export function stripYearSuffixes(s) {
  return s
    .replace(/\s*\(?\d{1,4}\s*(BC|AD|a\.C\.|d\.C\.)?\)?\s*$/gi, '')
    .replace(/\s*\(\d{1,4}\)\s*/g, ' ')
    .replace(/,?\s*\d{1,4}\s*(BC|AD|a\.C\.|d\.C\.)/gi, '')
    .trim();
}

function pickWrongYears(correct, count = 3) {
  const opts = new Set([correct]);
  while (opts.size < count + 1) {
    const offset = Math.floor(Math.random() * 200) - 100;
    const v = correct + offset;
    if (v !== correct) opts.add(v);
  }
  return [...opts].sort(() => Math.random() - 0.5);
}

/**
 * @param {object} deps
 * @param {Array} deps.data
 * @param {Array} deps.cats
 * @param {string} deps.lang
 * @param {(item: object, lang: string) => object} deps.translateItem
 * @param {(key: string) => string} deps.t
 * @param {(id: string) => string} deps.catName
 * @param {(y: number) => string} deps.formatYear
 * @param {number} [deps.count=10]
 */
export function generateQuizQuestions({
  data,
  cats,
  lang,
  translateItem,
  t,
  catName,
  formatYear,
  count = 10,
}) {
  const shuffled = [...data].sort(() => Math.random() - 0.5);
  const questions = [];
  const used = new Set();

  for (const d of shuffled) {
    if (questions.length >= count) break;
    if (used.has(d.id)) continue;
    used.add(d.id);
    const di = translateItem(d, lang);
    const qType = questions.length % 4;

    if (qType === 3 && d.locs?.length > 0) {
      const loc = di.locs[0];
      const correct = loc.n;
      const pool = data
        .filter((x) => x.id !== d.id && x.locs?.length)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((x) => translateItem(x, lang).locs[0].n);
      const options = [correct, ...pool].sort(() => Math.random() - 0.5);
      questions.push({
        type: 'location',
        question: t('questionLocation'),
        context: stripYearSuffixes(di.name),
        correct,
        options,
      });
      continue;
    }

    if (qType === 0) {
      const correct = d.y1;
      const shuffOpts = pickWrongYears(correct);
      questions.push({
        type: 'date',
        question: t('questionDate'),
        context: stripYearSuffixes(di.name),
        correct: String(correct),
        options: shuffOpts.map(String),
        correctDisplay: formatYear(correct),
      });
      continue;
    }

    if (qType === 1 && d.locs?.length > 0) {
      const correct = cats.find((c) => c.id === d.cat);
      const otherCats = cats
        .filter((c) => c.id !== d.cat)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      const opts = [correct, ...otherCats].sort(() => Math.random() - 0.5);
      questions.push({
        type: 'category',
        question: t('questionMatch'),
        context: di.name,
        correct: correct.id,
        options: opts.map((c) => ({
          id: c.id,
          label: catName(c.id),
          icon: c.icon,
        })),
        eventId: d.id,
      });
      continue;
    }

    if (qType === 2 && (d.cat === 'figures' || d.cat === 'biography')) {
      const correct = di.name;
      const others = data
        .filter(
          (x) =>
            (x.cat === 'figures' || x.cat === 'biography') && x.id !== d.id,
        )
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((x) => translateItem(x, lang).name);
      const options = [correct, ...others].sort(() => Math.random() - 0.5);
      questions.push({
        type: 'who',
        question: t('questionWho'),
        context: stripYearSuffixes(di.desc || di.facts?.[0] || ''),
        correct,
        options,
      });
      continue;
    }

    const correct = d.y1;
    const shuffOpts = pickWrongYears(correct);
    questions.push({
      type: 'date',
      question: t('questionDate'),
      context: stripYearSuffixes(di.name),
      correct: String(correct),
      options: shuffOpts.map(String),
      correctDisplay: formatYear(correct),
    });
  }

  return questions;
}

export function isQuizAnswerCorrect(question, answer) {
  return answer === question.correct;
}
