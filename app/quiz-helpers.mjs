import levenshtein from "js-levenshtein";

/** @param {string} date */
export const normalizeQuizDate = (date) => date.replace(/-/g, "");

/** @param {string} date */
export const displayDate = (date) =>
  `${date.slice(6, 8)}.${date.slice(4, 6)}.${date.slice(0, 4)}`;

/**
 * Keep stored-answer whitespace: some quizzes use padding to limit typo tolerance.
 * @param {string} input
 * @param {string} answer
 */
export const matches = (input, answer) =>
  !!input.trim() &&
  levenshtein(input.toLowerCase().trim(), answer.toLowerCase()) <= 2;

/**
 * Invalid or outdated browser data must not prevent someone from playing.
 * @param {string | null} value
 * @param {number} count
 * @returns {string[] | null}
 */
export function parseAnswers(value, count) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) &&
      parsed.length === count &&
      parsed.every((value) => typeof value === "string")
      ? parsed
      : null;
  } catch {
    return null;
  }
}

/** @param {string[]} dates @param {string} date */
export function quizNeighbors(dates, date) {
  const sorted = dates.filter((value) => /^\d{8}$/.test(value)).sort();
  return {
    previous: sorted.filter((value) => value < date).at(-1),
    next: sorted.find((value) => value > date),
  };
}

/** @param {string[]} answers @param {number} count */
export function firstMissingAnswer(answers, count) {
  return (
    Array.from({ length: count }, (_, index) => index).find(
      (index) => !answers[index]?.trim(),
    ) ?? -1
  );
}
