import React, { useState } from 'react';

interface QuestionProps {
  question: string;
  correctAnswer: string; 
  aliases?: string[]; // Optional, but useful for handling typos, etc.
}

const Question: React.FC<QuestionProps> = ({ question, correctAnswer }) => {
  const [userAnswer, setUserAnswer] = useState('');

  const checkAnswer = () => {
    // Logic to compare userAnswer with correctAnswer and determine correctness
    // Update the UI to show correctness (e.g., green/yellow squares)
  };

  return (
    <div>
      <p>{question}</p>
      <input
        type="text"
        value={userAnswer}
        onChange={(e) => setUserAnswer(e.target.value)}
      />
      <button onClick={checkAnswer}>Submit</button>
    </div>
  );
};

export default Question;
