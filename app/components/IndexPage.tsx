"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  displayDate,
  normalizeQuizDate,
  matches,
  parseAnswers,
  quizNeighbors,
  firstMissingAnswer,
} from "../quiz-helpers.mjs";
import ScoreBoxes from "../ScoreBoxes";
import WeeklySummary from "./WeeklySummary";

interface Question {
  question: string;
  answer: string;
  aliases?: string[];
}
interface Data {
  questions: Question[];
  theme?: string;
  announcement?: string;
}

export default function IndexPage({ quizDate }: { quizDate?: string }) {
  // Match the UTC day used by the submission and summary APIs.
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const date = normalizeQuizDate(quizDate || today);
  return <Quiz key={date} date={date} today={today} />;
}

function Quiz({ date, today }: { date: string; today: string }) {
  const [data, setData] = useState<Data>({ questions: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [dates, setDates] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const [shareFallback, setShareFallback] = useState(false);
  const [summary, setSummary] = useState<{
    averageCorrect: number;
    totalSubmissions: number;
  } | null>(null);
  const [summaryError, setSummaryError] = useState(false);
  const [summaryAttempt, setSummaryAttempt] = useState(0);
  const locked = useRef(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const storageKey = `${date}-answers`;
  const draftKey = `${date}-draft`;
  const { questions, theme, announcement } = data;
  const correct = questions.map((question, index) =>
    [question.answer, ...(question.aliases || [])].some((answer) =>
      matches(answers[index] || "", answer),
    ),
  );
  const score = correct.filter(Boolean).length;
  const answered = questions.filter((_, index) =>
    answers[index]?.trim(),
  ).length;
  const { previous, next } = quizNeighbors(dates, date);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError(false);
    (async () => {
      try {
        const response = await fetch(`/api/questions?date=${date}`, {
          signal: controller.signal,
        });
        if (response.status === 404) {
          setData({ questions: [] });
          return;
        }
        if (!response.ok) throw new Error("Questions unavailable");
        const raw = await response.json();
        const loaded: Data = Array.isArray(raw) ? { questions: raw } : raw;
        if (!Array.isArray(loaded.questions))
          throw new Error("Invalid questions");
        setData(loaded);
        try {
          // Read older keys so existing players retain their completed quizzes.
          const legacyKeys = [
            `${displayDate(date).replace(/\./g, "/")}-answers`,
          ];
          if (date === today)
            legacyKeys.push(`${new Date().toLocaleDateString()}-answers`);
          const saved = [storageKey, ...legacyKeys]
            .map((key) =>
              parseAnswers(localStorage.getItem(key), loaded.questions.length),
            )
            .find(Boolean);
          const draft = parseAnswers(
            localStorage.getItem(draftKey),
            loaded.questions.length,
          );
          setAnswers(saved || draft || Array(loaded.questions.length).fill(""));
          setSubmitted(!!saved);
          locked.current = !!saved;
        } catch {
          setAnswers(Array(loaded.questions.length).fill(""));
          setStorageWarning(true);
        }
      } catch {
        if (!controller.signal.aborted) setLoadError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [date, today, storageKey, draftKey, attempt]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/available-dates", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((values) => {
        if (Array.isArray(values))
          setDates(values.filter((value) => /^\d{8}$/.test(value)).sort());
      })
      .catch(() => {});
    return () => controller.abort();
  }, [attempt]);

  useEffect(() => {
    if (!submitted || date !== today || saveStatus === "Lagrer resultatet …")
      return;
    const controller = new AbortController();
    setSummaryError(false);
    fetch("/api/summary", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((value) => {
        const average = Number(value.averageCorrect);
        if (
          value.averageCorrect == null ||
          !Number.isFinite(average) ||
          typeof value.totalSubmissions !== "number"
        )
          throw new Error();
        setSummary({
          averageCorrect: average,
          totalSubmissions: value.totalSubmissions,
        });
      })
      .catch(() => {
        if (!controller.signal.aborted) setSummaryError(true);
      });
    return () => controller.abort();
  }, [submitted, date, today, saveStatus, summaryAttempt]);

  useEffect(() => {
    if (submitted) resultHeading.current?.focus();
  }, [submitted]);

  function changeAnswer(index: number, value: string) {
    const updated = answers.map((answer, i) => (i === index ? value : answer));
    setAnswers(updated);
    try {
      localStorage.setItem(draftKey, JSON.stringify(updated));
    } catch {
      setStorageWarning(true);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (locked.current || loading || !questions.length) return;
    const missing = firstMissingAnswer(answers, questions.length);
    if (missing !== -1) {
      setShowErrors(true);
      inputs.current[missing]?.focus();
      return;
    }
    locked.current = true;
    try {
      localStorage.setItem(storageKey, JSON.stringify(answers));
      localStorage.setItem(`${date}-correct`, JSON.stringify(correct));
      localStorage.removeItem(draftKey);
    } catch {
      setStorageWarning(true);
    }
    setSubmitted(true);
    // The server records every submission as today; archived quizzes stay local.
    if (date !== today) return;
    setSaveStatus("Lagrer resultatet …");
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, numberOfCorrect: score }),
      });
      if (!response.ok) throw new Error();
      setSaveStatus("Resultatet er registrert i dagens statistikk.");
    } catch {
      setSaveStatus(
        "Resultatet vises her, men kunne ikke registreres i dagens statistikk.",
      );
    }
  }

  const shareText = `${correct.map((value) => (value ? "🟩" : "🟥")).join("")} ${score}/${questions.length}\nFem kjappe · ${displayDate(date)}${theme ? ` · ${theme}` : ""}\nhttps://www.femkjappe.no/${date}`;
  async function handleShare() {
    try {
      await navigator.clipboard.writeText(shareText);
      setShareStatus("Resultatet og lenken er kopiert!");
      setShareFallback(false);
    } catch {
      setShareStatus(
        "Kunne ikke kopiere automatisk. Marker og kopier teksten nedenfor.",
      );
      setShareFallback(true);
    }
  }

  return (
    <main className="quiz-shell">
      <header className="quiz-header">
        <Link
          href="/"
          className="quiz-brand"
          aria-label="Fem kjappe – dagens quiz"
        >
          <Image src="/logo.svg" alt="" width={40} height={48} />
          <span>kjappe</span>
        </Link>
        <p className="quiz-eyebrow">Fem spørsmål hver ukedag</p>
        <p className="quiz-date">
          {displayDate(date)}
          {date > today
            ? " · Forhåndsvisning"
            : date < today
              ? " · Arkiv"
              : " · Dagens quiz"}
        </p>
        <h1>{theme || "Fem kjappe"}</h1>
        {announcement && <p className="quiz-announcement">{announcement}</p>}
      </header>

      {loading ? (
        <p role="status" className="quiz-message">
          Laster spørsmål …
        </p>
      ) : loadError ? (
        <section className="quiz-message" role="alert">
          <h2>Vi fikk ikke lastet quizen</h2>
          <p>Sjekk tilkoblingen og prøv igjen.</p>
          <button
            className="quiz-button"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Prøv igjen
          </button>
        </section>
      ) : questions.length === 0 ? (
        <section className="quiz-message">
          <h2>Ingen quiz denne dagen</h2>
          <p>
            Vi legger ut fem nye spørsmål hver ukedag. Prøv en tidligere quiz
            mens du venter.
          </p>
          {previous && (
            <Link className="quiz-button" href={`/${previous}`}>
              Spill forrige quiz
            </Link>
          )}
        </section>
      ) : (
        <>
          {submitted ? (
            <section className="quiz-result" aria-label="Ditt resultat">
              <p className="quiz-eyebrow">Ditt resultat</p>
              <h2 ref={resultHeading} tabIndex={-1}>
                {score} av {questions.length} riktige
              </h2>
              <p>
                {score === questions.length
                  ? "Full pott! Godt jobbet."
                  : "Se svarene og fasiten nedenfor."}
              </p>
              {date !== today && (
                <p className="quiz-muted">
                  Denne quizen teller ikke i dagens statistikk
                </p>
              )}
            </section>
          ) : (
            <div className="quiz-progress">
              <p id="quiz-help">
                Skriv ett svar per spørsmål, og sjekk alle svarene til slutt.
              </p>
              <p role="status">
                {answered} av {questions.length} besvart
              </p>
              <progress
                value={answered}
                max={questions.length}
                aria-label="Besvarte spørsmål"
              />
            </div>
          )}
          {storageWarning && (
            <p role="status" className="quiz-notice">
              Nettleseren kunne ikke lagre svarene. Hold siden åpen for å
              beholde dem.
            </p>
          )}
          <form
            onSubmit={handleSubmit}
            noValidate
            aria-describedby={!submitted ? "quiz-help" : undefined}
          >
            {showErrors && !submitted && answered < questions.length && (
              <p role="alert" className="quiz-error-summary">
                Svar på de markerte spørsmålene før du sjekker fasiten.
              </p>
            )}
            {questions.map((question, index) => {
              const invalid = showErrors && !answers[index]?.trim();
              return (
                <section
                  className="quiz-question"
                  key={index}
                  aria-labelledby={`question-${index}`}
                >
                  <p className="quiz-eyebrow">
                    Spørsmål {index + 1} av {questions.length}
                  </p>
                  <h2 id={`question-${index}`}>
                    <label htmlFor={!submitted ? `answer-${index}` : undefined}>
                      {question.question}
                    </label>
                  </h2>
                  {submitted ? (
                    <div
                      className={`quiz-answer ${correct[index] ? "quiz-correct" : "quiz-incorrect"}`}
                    >
                      <p className="quiz-verdict">
                        {correct[index] ? "✓ Riktig" : "✕ Feil"}
                      </p>
                      <p>
                        Ditt svar: <strong>{answers[index]}</strong>
                      </p>
                      <p>
                        Fasit: <strong>{question.answer.trim()}</strong>
                      </p>
                    </div>
                  ) : (
                    <>
                      <input
                        id={`answer-${index}`}
                        ref={(element) => {
                          inputs.current[index] = element;
                        }}
                        type="text"
                        value={answers[index] || ""}
                        onChange={(event) =>
                          changeAnswer(index, event.target.value)
                        }
                        autoComplete="off"
                        spellCheck={false}
                        aria-invalid={invalid || undefined}
                        aria-describedby={
                          invalid ? `error-${index}` : undefined
                        }
                      />
                      {invalid && (
                        <p id={`error-${index}`} className="quiz-field-error">
                          Skriv inn et svar.
                        </p>
                      )}
                    </>
                  )}
                </section>
              );
            })}
            {!submitted && (
              <button type="submit" className="quiz-button quiz-full">
                Sjekk svarene
              </button>
            )}
          </form>
          {submitted && (
            <section className="quiz-sharing" aria-label="Del resultatet">
              <button
                type="button"
                className="quiz-button quiz-full"
                onClick={handleShare}
              >
                Kopier resultat og lenke
              </button>
              <p role="status">{shareStatus}</p>
              {shareFallback && (
                <>
                  <label htmlFor="share-result">
                    Resultat som kan kopieres
                  </label>
                  <textarea
                    id="share-result"
                    value={shareText}
                    readOnly
                    rows={5}
                    onFocus={(event) => event.target.select()}
                  />
                </>
              )}
              {saveStatus && (
                <p role="status" className="quiz-muted">
                  {saveStatus}
                </p>
              )}
            </section>
          )}
          {submitted && summary && (
            <section className="quiz-statistics">
              <h2>Dagens fellesskap</h2>
              <p>
                Snitt: {(summary.averageCorrect * questions.length).toFixed(2)}{" "}
                av {questions.length} · {summary.totalSubmissions} innsendte
                svar
              </p>
              <ScoreBoxes average={summary.averageCorrect} />
            </section>
          )}
          {submitted && summaryError && (
            <p className="quiz-notice">
              Dagens statistikk er utilgjengelig.{" "}
              <button
                className="quiz-text-button"
                onClick={() => setSummaryAttempt((value) => value + 1)}
              >
                Prøv igjen
              </button>
            </p>
          )}
          {submitted &&
            date === today &&
            new Date(
              `${today.slice(0, 4)}-${today.slice(4, 6)}-${today.slice(6, 8)}T12:00:00Z`,
            ).getUTCDay() === 5 && (
              <WeeklySummary apiUrl="/api/weeklySummary" />
            )}
        </>
      )}
      <nav className="quiz-navigation" aria-label="Velg quiz">
        {previous ? (
          <Link href={`/${previous}`}>
            ← Forrige quiz<span>{displayDate(previous)}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/${next}`}>
            Neste quiz →<span>{displayDate(next)}</span>
          </Link>
        )}
      </nav>
      {date !== today && (
        <Link className="quiz-home" href="/">
          Til dagens quiz
        </Link>
      )}
    </main>
  );
}
