import test from "node:test";
import assert from "node:assert/strict";
import {
  matches,
  normalizeQuizDate,
  displayDate,
  parseAnswers,
  quizNeighbors,
  firstMissingAnswer,
} from "../app/quiz-helpers.mjs";

test("padded single-letter answers accept case and whitespace but reject every other letter", () => {
  for (const answer of ["Q", "V", "D", "c", "X"]) {
    assert.equal(matches(` ${answer.toLowerCase()} `, ` ${answer} `), true);
    for (const letter of "abcdefghijklmnopqrstuvwxyzæøå") {
      assert.equal(
        matches(letter, ` ${answer} `),
        letter === answer.toLowerCase(),
      );
    }
  }
  assert.equal(matches("", " Q "), false);
  assert.equal(matches("   ", " Q "), false);
});

test("normal questions retain two-edit typo tolerance", () => {
  assert.equal(matches(" Indoneisa ", "Indonesia"), true);
  assert.equal(matches("Peru", "Indonesia"), false);
});

test("dated URLs and old query links use the same storage date", () => {
  assert.equal(normalizeQuizDate("2026-09-07"), normalizeQuizDate("20260907"));
  assert.equal(displayDate(normalizeQuizDate("2026-09-07")), "07.09.2026");
});

test("missing days navigate to their chronological neighbors", () => {
  const dates = ["20260907", "20260904", "not-a-date", "20260903"];
  assert.deepEqual(quizNeighbors(dates, "20260906"), {
    previous: "20260904",
    next: "20260907",
  });
  assert.deepEqual(quizNeighbors(dates, "20260903"), {
    previous: undefined,
    next: "20260904",
  });
  assert.deepEqual(quizNeighbors([], "20260906"), {
    previous: undefined,
    next: undefined,
  });
});

test("corrupt, wrong-length, and non-string cached answers are ignored", () => {
  for (const value of [null, "bad json", "{}", "[1,2]", '["one"]']) {
    assert.equal(parseAnswers(value, 2), null);
  }
  assert.deepEqual(parseAnswers('["one", ""]', 2), ["one", ""]);
});

test("validation catches sparse arrays and focuses the first unanswered question", () => {
  const answers = [];
  answers[4] = "X";
  assert.equal(firstMissingAnswer(answers, 5), 0);
  assert.equal(firstMissingAnswer(["Q", "V", " ", "c", "X"], 5), 2);
  assert.equal(firstMissingAnswer(["Q", "V", "D", "c", "X"], 5), -1);
});
