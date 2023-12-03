"use client";
import React, { useEffect, useState } from "react";
import ClipboardModal from "./ClipboardModal";

interface Question {
  question: string;
  answer: string; // Ideally, this shouldn't be on the client side
  aliases?: string[]; // Optional, but useful for handling typos, etc.
}

const IndexPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      setQuestions(data);
      setUserAnswers(Array(data.length).fill(""));
      setIsLoading(false);
    };

    fetchQuestions();
  }, []);

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  const isCorrect = (index: number) => {
    return userAnswers[index].toLowerCase() ===
      questions[index].answer.toLowerCase()
      || (questions[index].aliases && questions[index].aliases?.map(a => a.toLowerCase()).includes(userAnswers[index].toLowerCase()));
  }

  const handleShare = () => {
    // Check answers and generate result string
    const resultString = questions
      .map((question, index) => {
        return isCorrect(index)
          ? "🟩"
          : "🟥"; // Replace '🟥' with other emojis as needed
      })
      .join("");

    // Copy result string and link to clipboard
    navigator.clipboard
      .writeText(
        resultString + "\nSpill dagens quiz på: https://quiz.alicia.app"
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
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-slate-500">
      <ClipboardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <p>Resultatene er kopiert til din utklippstavle!</p>
      </ClipboardModal>
      <h1 className="text-2xl font-bold text-center mb-4">Dagens Quiz</h1>
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
                    isCorrect(index)
                      ? "text-green-200"
                      : "text-red-200"
                  }
                >
                  {isCorrect(index)
                    ? "✅ Korrekt!"
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
        {!isSubmitted && (
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
