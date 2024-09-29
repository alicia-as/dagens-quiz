"use client";
import React, { useEffect, useState } from "react";
import ClipboardModal from "./ClipboardModal";
import ScoreBoxes from "./ScoreBoxes";
import levenshtein from "js-levenshtein";

const LEVENSHTEIN_THRESHOLD = 2; // Adjust this value as needed

interface Data {
  questions: Question[];
  theme?: string;
}
interface Question {
  question: string;
  answer: string; // Ideally, this shouldn't be on the client side
  aliases?: string[]; // Optional, but useful for handling typos, etc.
}

const IndexPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [theme, setTheme] = useState<string | undefined>();
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [averageCorrect, setAverageCorrect] = useState<number | null>(null);
  const [totalSubmissions, setTotalSubmissions] = useState<number | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  useEffect(() => {
    // Fetch questions from your API
    const fetchQuestions = async () => {
      const response = await fetch("/api/questions");
      if (!response.ok) {
        console.error("Failed to fetch questions");
        setIsLoading(false);
        return;
      }
      const data = await response.json();
      setQuestions(data.questions || data);
      setTheme(data.theme);
      // setUserAnswers(new Array(data.questions.length).fill("")); // Initialize with empty strings
      setIsLoading(false);
    };

    fetchQuestions();
  }, []);

  // Function to fetch summary
  const fetchSummary = async () => {
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
  const answersKey = new Date().toLocaleDateString() + "-answers";
  useEffect(() => {
    const answers = localStorage.getItem(answersKey);
    if (answers) {
      setUserAnswers(JSON.parse(answers));
      setIsSubmitted(true);
      fetchSummary(); // Fetch summary when answers are cached
    }
  }, []);

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

    // Save answers to local storage
    if (process.env.NODE_ENV !== "development") {
      localStorage.setItem(answersKey, JSON.stringify(userAnswers));
    }
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
        // Handle success, e.g., display a message or redirect
        console.log("Submission successful", result);
      } else {
        // Handle server errors or invalid responses
        console.error("Submission failed", result);
      }
    } catch (error) {
      // Handle network errors
      console.error("Error submitting answers", error);
    }

    // Fetch summary after submission
    fetchSummary();
  };

  const isAliasCorrect = (index: number) => {
    const userAnswer = userAnswers[index]?.toLowerCase().trim();
    return (
      questions[index].aliases &&
      questions[index].aliases?.some(
        (alias) =>
          levenshtein(userAnswer, alias.toLowerCase()) <= LEVENSHTEIN_THRESHOLD
      )
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
    // Check answers and generate result string
    const resultString = questions
      .map((question, index) => {
        return isCorrect(index) ? "🟩" : "🟥"; // Replace '🟥' with other emojis as needed
      })
      .join("");

    // Copy result string and link to clipboard
    navigator.clipboard
      .writeText(
        resultString +
          "\nSpill fem kjappe på: https://www.femkjappe.no." +
          (theme ? ` Dagens tema: ${theme}` : "")
      )
      .then(
        () => {
          // Show confirmation message
          setIsModalOpen(true);
        },
        (err) => {
          console.error("Could not copy text: ", err);
        }
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
    <div className="max-w-md mx-auto mt-4 rounded-lg p-4 bg-slate-500">
      <div className="text-center" id="temp">
        <span>Dagens Quiz heter nå Fem Kjappe.</span>
        <br />
        Nytt domene er{" "}
        <a className="font-bold" href="https://www.femkjappe.no">
          femkjappe.no
        </a>
      </div>
      <ClipboardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <p>Resultatene er kopiert til din utklippstavle!</p>
      </ClipboardModal>
      <h1 className="text-2xl font-bold text-center m2-4">Fem Kjappe</h1>
      {theme && (
        <p className="text-center text-gray-200 text-sm my-2">
          <span className="font-semibold">Tema:</span> {theme}
        </p>
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
            className="w-full bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
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
      {isSubmitted && (
        <button
          onClick={handleShare}
          className="w-full bg-green-500 font-medium text-white p-2 rounded-lg hover:bg-green-600 mt-4"
        >
          Del ditt resultat!
        </button>
      )}
    </div>
  );
};

export default IndexPage;
