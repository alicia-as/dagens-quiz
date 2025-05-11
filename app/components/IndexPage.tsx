"use client";
import React, { useEffect, useState } from "react";

import ScoreBoxes from "../ScoreBoxes";
import levenshtein from "js-levenshtein";
import { useRouter, useSearchParams } from "next/navigation";
import ClipboardModal from "../ClipboardModal";
import Image from "next/image";
import WeeklySummary from "./WeeklySummary";
import {
  formatDateToYYYYMMDD,
  isFriday,
  parseYYYYMMDD,
  tryDateFormats,
} from "../utils";

const LEVENSHTEIN_THRESHOLD = 2; // Adjust this value as needed

interface Data {
  questions: Question[];
  theme?: string;
  announcement?: string; // Optional, but useful for handling typos, etc.
}
interface Question {
  question: string;
  answer: string; // Ideally, this shouldn't be on the client side
  aliases?: string[]; // Optional, but useful for handling typos, etc.
}

interface IndexPageProps {
  quizDate?: string;
}

const IndexPage: React.FC<IndexPageProps> = ({ quizDate }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [theme, setTheme] = useState<string | undefined>();
  const [announcement, setAnnouncement] = useState<string | undefined>();
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [averageCorrect, setAverageCorrect] = useState<number | null>(null);
  const [totalSubmissions, setTotalSubmissions] = useState<number | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [prevDate, setPrevDate] = useState<string | null>(null);
  const [nextDate, setNextDate] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Fetch questions from your API
    const fetchQuestions = async () => {
      const dateQuery = quizDate ?? new Date().toISOString().split("T")[0];
      const response = await fetch(`/api/questions?date=${dateQuery}`);
      if (!response.ok) {
        console.error("Failed to fetch questions");
        setIsLoading(false);
        return;
      }
      const data = await response.json();
      setQuestions(data.questions || data);
      setTheme(data.theme);
      setAnnouncement(data.announcement);
      setIsLoading(false);
    };

    fetchQuestions();
  }, []);

  useEffect(() => {
    // Fetch the list of available dates
    const fetchDates = async () => {
      const response = await fetch("/api/available-dates");
      const dates = await response.json();

      const quizDateForReal =
        quizDate ?? new Date().toISOString().split("T")[0].replace(/-/g, "");

      // Find previous and next dates
      const currentIndex = dates.indexOf(quizDateForReal);
      if (currentIndex !== -1) {
        setPrevDate(currentIndex > 0 ? dates[currentIndex - 1] : null);
        setNextDate(
          currentIndex < dates.length - 1 ? dates[currentIndex + 1] : null
        );
      } else {
        setPrevDate(dates[dates.length - 1]);
        setNextDate(null);
      }
    };

    fetchDates();
  }, [quizDate]);

  // Function to fetch summary
  const fetchSummary = async () => {
    // We only fetch summary for the current date (if quizDate is not provided)
    if (quizDate) return;
    try {
      const response = await fetch("/api/summary");
      const data = await response.json();
      setAverageCorrect(data.averageCorrect);
      setTotalSubmissions(data.totalSubmissions);
    } catch (error) {
      console.error("Couldn't fetch summary", error);
    }
  };

  // Retrieve answers from local storage
  useEffect(() => {
    console.log("Quiz date:", quizDate);
    const date = parseYYYYMMDD(
      quizDate ?? new Date().toISOString().split("T")[0]
    );
    const possibleDateKeys = tryDateFormats(date);

    let foundAnswers = null;

    for (const key of possibleDateKeys) {
      const stored = localStorage.getItem(`${key}-answers`);
      console.log("Trying to get answers from local storage", key, stored);
      if (stored) {
        foundAnswers = stored;

        break;
      }
    }

    if (foundAnswers) {
      setUserAnswers(JSON.parse(foundAnswers));
      setIsSubmitted(true);
      fetchSummary(); // Fetch summary when answers are cached
    }
  }, [quizDate]);

  const handleSubmit = async () => {
    if (
      userAnswers.length !== questions.length ||
      userAnswers.some(
        (answer) => !answer || answer.trim() === "" || answer === null
      )
    ) {
      setWarningMessage("Vennligst fyll ut alle svarene før du sender inn.");
      return;
    }

    // Use quizDate if provided, otherwise use today's date
    const dateKey = quizDate ?? formatDateToYYYYMMDD(new Date());

    const answersKey = `${dateKey}-answers`;

    // Save answers to local storage
    // if (process.env.NODE_ENV !== "development") {
    localStorage.setItem(answersKey, JSON.stringify(userAnswers));

    // Store correct/incorrect classification
    const correctKey = `${dateKey}-correct`;
    const correctArray = questions.map((_, index) => isCorrect(index));
    localStorage.setItem(correctKey, JSON.stringify(correctArray));
    // }
    setIsSubmitted(true);

    // Submit answers to the server
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers: userAnswers,
          numberOfCorrect: questions.filter((_, index) => isCorrect(index))
            .length,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        console.log("Submission successful", result);
      } else {
        console.error("Submission failed", result);
      }
    } catch (error) {
      console.error("Error submitting answers", error);
    }

    // Fetch summary after submission
    fetchSummary();
  };

  // The date is on YYYYMMDD format
  const formatDate = (date: string) => {
    const year = date.slice(0, 4);
    const month = date.slice(4, 6);
    const day = date.slice(6, 8);
    // Format it to locale date format
    return `${day}/${month}/${year}`;
  };

  const isAliasCorrect = (index: number) => {
    const userAnswer = userAnswers[index]?.toLowerCase().trim();
    return questions[index].aliases?.some(
      (alias) =>
        levenshtein(userAnswer, alias.toLowerCase()) <= LEVENSHTEIN_THRESHOLD
    );
  };

  const isCorrect = (index: number) => {
    const userAnswer = userAnswers[index]?.toLowerCase().trim();
    if (!userAnswer) return false;
    const correctAnswer = questions[index]?.answer.toLowerCase();
    const isAlias = isAliasCorrect(index);

    return (
      userAnswer === correctAnswer ||
      isAlias ||
      levenshtein(userAnswer, correctAnswer) <= LEVENSHTEIN_THRESHOLD
    );
  };

  const handleShare = () => {
    // Determine the date to include in the URL
    const today = formatDateToYYYYMMDD(new Date());
    const dateFromURL = searchParams?.get("date");

    const quizDateToUse = quizDate ?? dateFromURL ?? today; // Use quizDate prop, then URL param, else today

    // Generate result string
    const resultString = questions
      .map((_, index) => (isCorrect(index) ? "🟩" : "🟥"))
      .join("");

    // Construct URL with date
    const shareableURL = `https://www.femkjappe.no${
      quizDateToUse !== today ? `?date=${quizDateToUse}` : ""
    }`;

    // Copy result string and link to clipboard
    navigator.clipboard
      .writeText(
        `${resultString}\nSpill fem kjappe på: ${shareableURL}${
          theme ? ` Dagens tema: ${theme}` : ""
        }`
      )
      .then(
        () => setIsModalOpen(true),
        (err) => console.error("Could not copy text: ", err)
      );
  };

  const handleAnswerChange = (index: number, answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[index] = answer;
    setUserAnswers(newAnswers);
    if (warningMessage) {
      setWarningMessage(null);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-4 rounded-lg p-4 bg-slate-400 dark:bg-gray-600 text-gray-800 dark:text-gray-300">
      <ClipboardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <p>Resultatene er kopiert til din utklippstavle!</p>
      </ClipboardModal>
      <div className="flex items-center justify-center mb-4">
        <Image src="/logo.svg" alt="Fem Kjappe logo" width={40} height={100} />
        {/* ITalic */}
        <h1 className="text-3xl font-bold text-center m2-4  text-primary italic">
          kjappe{quizDate ? ` - ${formatDate(quizDate)}` : ""}
        </h1>
      </div>
      {theme && (
        <p className="text-center text-gray-700 dark:text-gray-200 text-sm my-2">
          <span className="font-semibold">Tema:</span> {theme}
        </p>
      )}
      {announcement && (
        <div className="my-4 px-4 py-2 text-center text-sm text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center gap-2 border-2 border-dashed border-gray-400 dark:border-gray-500">
          {announcement}
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        {" "}
        {isLoading && <p>Laster spørsmål...</p>}
        {!isLoading && questions.length === 0 && (
          // Nice message to show when there are no questions
          <div className="my-4 text-center">
            <p>Ingen spørsmål i dag!</p>
            <p>Sjekk tilbake i morgen 😎</p>
          </div>
        )}
        {warningMessage && (
          <p className="text-red-500 text-center mt-2">{warningMessage}</p>
        )}
        {questions.map((question, index) => (
          <div key={index} className="mb-4">
            <p className="font-semibold mb-2">{question.question}</p>
            {isSubmitted ? (
              <div>
                <p className="font-medium">
                  Ditt svar:{" "}
                  <span className="font-normal text-gray-200">
                    {userAnswers[index]}
                  </span>
                </p>
                <p
                  className={
                    isCorrect(index) ? "text-green-200" : "text-red-200"
                  }
                >
                  {isCorrect(index)
                    ? isAliasCorrect(index)
                      ? `✅ Korrekt.\n${question.answer}`
                      : "✅ Korrekt!"
                    : `❌ Feil. Rett svar: '${question.answer}'`}
                </p>
              </div>
            ) : (
              <input
                type="text"
                value={userAnswers[index]}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                className="w-full p-2 border-2 text-gray-800 border-gray-300 rounded"
              />
            )}
          </div>
        ))}
        {!isSubmitted && questions.length > 0 && (
          <button
            onClick={handleSubmit}
            disabled={isSubmitted}
            className="w-full bg-primary text-gray-300 p-2 rounded-lg hover:bg-opacity-80 "
          >
            Sjekk svarene
          </button>
        )}
      </form>
      {isSubmitted && <div className="mt-4">{/* Display results here */}</div>}
      {isSubmitted && averageCorrect !== null && (
        <div>
          <p>
            Dagens gjennomsnittlige riktige svar:{" "}
            {(averageCorrect * 5).toFixed(2)} / 5 ({totalSubmissions} svar)
          </p>
          <ScoreBoxes average={averageCorrect} />
        </div>
      )}

      {isSubmitted && isFriday(new Date()) && (
        <WeeklySummary apiUrl="/api/weeklySummary" />
      )}
      {isSubmitted && (
        <button
          onClick={handleShare}
          className="w-full bg-green-400 dark:bg-green-600 font-medium text-white dark:text-gray-300 p-2 rounded-lg hover:bg-opacity-80 mt-4"
        >
          Del ditt resultat!
        </button>
      )}

      <div className="flex justify-between mt-4 text-xl">
        {prevDate && (
          <button
            onClick={() => router.push(`/${prevDate}`)}
            className=" p-2 rounded hover:text-primary"
          >
            ←<span className="text-sm"> Forrige</span>
          </button>
        )}
        {nextDate && (
          <button
            onClick={() => router.push(`/${nextDate}`)}
            className=" p-2 rounded hover:text-primary"
          >
            <span className="text-sm">Neste </span>→
          </button>
        )}
      </div>
    </div>
  );
};

export default IndexPage;
