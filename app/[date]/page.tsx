"use client";
import React from "react";
import IndexPage from "../page"; // Adjust the path if necessary

interface DatePageProps {
  params: {
    date: string;
  };
}

const DatePage: React.FC<DatePageProps> = ({ params }) => {
  const { date } = params;

  return <IndexPage quizDate={date} />;
};

export default DatePage;
