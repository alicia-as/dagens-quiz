import React, { useEffect, useState } from "react";
import { formatDateToYYYYMMDD, tryDateFormats } from "../utils";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface WeeklySummaryProps {
  apiUrl: string;
}

const WEEK_DAYS = [
  "Mandag",
  "Tirsdag",
  "Onsdag",
  "Torsdag",
  "Fredag",
  "Lørdag",
  "Søndag",
];

const WeeklySummary: React.FC<WeeklySummaryProps> = ({ apiUrl }) => {
  const [userWeeklyAverage, setUserWeeklyAverage] = useState<number | null>(
    null
  );
  const [weeklyAverage, setWeeklyAverage] = useState<number | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWeeklySummary = async () => {
      try {
        const response = await fetch(apiUrl);
        const data: { dailyAverageStats: Record<string, number> } =
          await response.json();

        const dailyUserStats = getUserDailyCorrect(); // Get user results from localStorage

        const chartData = Object.entries(data.dailyAverageStats).map(
          ([dateKey, average], index) => {
            const [year, month, day] = dateKey.split("-");
            const formattedDateKey = `${year}${month}${day}`;
            return {
              day: WEEK_DAYS[index],
              userCorrect: dailyUserStats[formattedDateKey] ?? 0,
              averageCorrect: average ?? 0,
            };
          }
        );

        setDailyStats(chartData);

        // Calculate user's weekly average (only days they played)
        const playedDays = Object.values(dailyUserStats).filter(
          (val) => val !== 0
        );
        const userAvg =
          playedDays.length > 0
            ? playedDays.reduce((sum, val) => sum + val, 0) / playedDays.length
            : 0;
        setUserWeeklyAverage(userAvg);

        // Calculate server weekly average (average of daily averages)
        const serverAvg =
          Object.values(data.dailyAverageStats).reduce(
            (sum: number, val: number) => sum + val,
            0
          ) / Object.values(data.dailyAverageStats).length;
        setWeeklyAverage(serverAvg);

        // Calculate streak (all consecutive days the user has played, including weekends)
        const streakCount = calculateStreak(dailyUserStats);
        setStreak(streakCount);

        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch weekly summary:", error);
        setIsLoading(false);
      }
    };

    fetchWeeklySummary();
  }, [apiUrl]);

  const getUserDailyCorrect = () => {
    const dailyUserStats: Record<string, number> = {};
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);

      const possibleFormats = tryDateFormats(date);
      let found = false;
      let correctCount = 0;

      for (const formattedDate of possibleFormats) {
        const key = `${formattedDate}-correct`;
        const correctArray = localStorage.getItem(key);
        if (correctArray) {
          const parsed = JSON.parse(correctArray) as boolean[];
          correctCount = parsed.filter((isCorrect) => isCorrect).length;
          found = true;
          break;
        }
      }

      const dateKey = formatDateToYYYYMMDD(date);
      dailyUserStats[dateKey] = found ? correctCount : 0;
    }

    return dailyUserStats;
  };

  const calculateStreak = (dailyUserStats: Record<string, number>) => {
    let streakCount = 0;
    const values = Object.values(dailyUserStats);

    for (const correctCount of values.reverse()) {
      if (correctCount > 0) streakCount++;
      else break;
    }

    return streakCount;
  };

  if (isLoading) return <p>Laster ukentlig sammendrag...</p>;

  return (
    <div className="mt-6 p-4 border rounded-lg shadow-lg bg-white dark:bg-gray-700">
      <h2 className="text-2xl font-bold text-center mb-4">
        📅 Ukentlig Sammendrag
      </h2>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-lg font-semibold">✅ Ditt snitt</p>
          <p className="text-3xl">
            {userWeeklyAverage !== null ? userWeeklyAverage.toFixed(2) : "-"}
          </p>
        </div>
        <div>
          <p className="text-lg font-semibold">📊 Alles snitt</p>
          <p className="text-3xl">
            {weeklyAverage !== null ? weeklyAverage.toFixed(2) : "-"}
          </p>
        </div>
        <div>
          <p className="text-lg font-semibold">🔥 Streak</p>
          <p className="text-3xl">{streak}</p>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-xl font-bold text-center mb-4">
          📊 Resultat per Dag
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dailyStats}>
            <XAxis
              dataKey="day"
              interval={0}
              tickFormatter={(day) => {
                const abbreviations: Record<string, string> = {
                  Mandag: "Man",
                  Tirsdag: "Tir",
                  Onsdag: "Ons",
                  Torsdag: "Tor",
                  Fredag: "Fre",
                  Lørdag: "Lør",
                  Søndag: "Søn",
                };
                return abbreviations[day] || day; // Default to full name if no abbreviation is found
              }}
            />
            <YAxis domain={[0, 5]} />
            <Tooltip />
            <Legend />
            <Bar dataKey="userCorrect" fill="#4caf50" name="Din score" />
            <Bar dataKey="averageCorrect" fill="#2196f3" name="Gjennomsnitt" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WeeklySummary;
