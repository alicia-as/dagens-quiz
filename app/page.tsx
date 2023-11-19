"use client";
import React, { useEffect, useState } from "react";
import ClipboardModal from "./ClipboardModal";

interface Question {
  question: string;
  answer: string; // Ideally, this shouldn't be on the client side
}

const IndexPage: React.FC = () => {
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
        return;
      }
      const data = await response.json();
      setQuestions(data);
      setUserAnswers(Array(data.length).fill(""));
    };

    fetchQuestions();
  }, []);

  const handleSubmit = () => {
    setIsSubmitted(true);

    // Check answers and generate result string
    const resultString = questions
      .map((question, index) => {
        return userAnswers[index].toLowerCase() ===
          question.answer.toLowerCase()
          ? "🟩"
          : "🟥"; // Replace '🟥' with other emojis as needed
      })
      .join("");

    // Copy result string and link to clipboard
    navigator.clipboard
      .writeText(resultString + "\nPlay the quiz: https://quiz.alicia.app")
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
        <p>Results copied to clipboard!</p>
      </ClipboardModal>
      <h1 className="text-2xl font-bold text-center mb-4">Dagens Quiz</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        {" "}
        {questions.map((question, index) => (
          <div key={index} className="mb-4">
            <p className="font-medium mb-2">{question.question}</p>
            {isSubmitted ? (
              <div>
                <p className="font-medium">
                  Your Answer:{" "}
                  <span className="font-normal text-gray-200">
                    {userAnswers[index]}
                  </span>
                </p>
                <p
                  className={
                    userAnswers[index].toLowerCase() ===
                    question.answer.toLowerCase()
                      ? "text-green-200"
                      : "text-red-200"
                  }
                >
                  {userAnswers[index].toLowerCase() ===
                  question.answer.toLowerCase()
                    ? "✅ Correct!"
                    : `❌ Incorrect. Correct Answer: ${question.answer}`}
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
        <button
          onClick={handleSubmit}
          disabled={isSubmitted}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Submit Answers
        </button>
      </form>
      {isSubmitted && <div className="mt-4">{/* Display results here */}</div>}
    </div>
  );
};

export default IndexPage;
