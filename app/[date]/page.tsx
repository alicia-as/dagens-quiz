"use client";
import React from "react";
import IndexPage from "../components/IndexPage";

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
