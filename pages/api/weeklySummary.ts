// pages/api/weeklySummary.ts
import { NextApiRequest, NextApiResponse } from "next";
import { app } from "../api/firebaseConfig";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

const db = getFirestore(app);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).end("Method Not Allowed");
  }

  try {
    const { startDate, endDate, weekDays } = getCurrentWeekRange();
    const submissionsRef = collection(db, "submissions");

    let totalCorrect = 0;
    let totalSubmissions = 0;

    const dailyAverageStats: Record<string, number> = {};

    for (const day of weekDays) {
      const q = query(submissionsRef, where("submissionDate", "==", day));
      const querySnapshot = await getDocs(q);

      let dayCorrect = 0;
      let daySubmissions = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        dayCorrect += data.numberOfCorrect;
        daySubmissions++;
      });

      dailyAverageStats[day] =
        daySubmissions > 0 ? dayCorrect / daySubmissions : 0;

      totalCorrect += dayCorrect;
      totalSubmissions += daySubmissions;
    }

    const weeklyAverage =
      totalSubmissions > 0
        ? (totalCorrect / (totalSubmissions * 5)).toFixed(2)
        : 0;

    res.status(200).json({
      weeklyAverage: Number(weeklyAverage),
      totalSubmissions,
      dailyAverageStats,
      startDate,
      endDate,
    });
  } catch (error) {
    console.error("Error fetching weekly summary: ", error);
    res.status(500).json({ error: "Failed to fetch weekly summary" });
  }
}

function getCurrentWeekRange() {
  const today = new Date();
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const startDate = new Date(today);
  startDate.setDate(today.getDate() + diffToMonday);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 4);

  const weekDays = Array.from({ length: 5 }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    return formatDate(date);
  });

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    weekDays,
  };
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}
