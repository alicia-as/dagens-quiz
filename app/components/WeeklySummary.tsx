import React, { useEffect, useState } from "react";
import { tryDateFormats, getDayAbbr } from "../utils";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface WeeklySummaryProps {
  apiUrl: string;
}

interface DayStat {
  day: string;
  userCorrect: number;
  averageCorrect: number;
  played: boolean;
}

interface TooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
}

const getMotivation = (avg: number): string => {
  if (avg >= 4.5) return "Fantastisk uke! Du er en quizmaskin!";
  if (avg >= 3.5) return "Sterk uke! Godt jobba!";
  if (avg >= 2.5) return "Helt ok uke! Rom for forbedring.";
  if (avg > 0) return "Bedre lykke neste uke!";
  return "Spill mer neste uke!";
};

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg border border-gray-600">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {entry.value.toFixed(1)} / 5
        </p>
      ))}
    </div>
  );
};

const getWeekNumber = (date: Date): number => {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

/**
 * Look up user results in localStorage for a set of ISO date keys.
 * Checks for `-answers` existence to distinguish "played with 0 correct"
 * from "didn't play at all".
 */
const getUserStatsForDates = (
  isoDateKeys: string[]
): Record<string, { score: number; played: boolean }> => {
  const stats: Record<string, { score: number; played: boolean }> = {};

  for (const isoDate of isoDateKeys) {
    const date = new Date(isoDate + "T00:00:00");
    const possibleFormats = tryDateFormats(date);
    let played = false;
    let score = 0;

    for (const fmt of possibleFormats) {
      if (localStorage.getItem(`${fmt}-answers`)) {
        played = true;
        const correctArray = localStorage.getItem(`${fmt}-correct`);
        if (correctArray) {
          score = (JSON.parse(correctArray) as boolean[]).filter(Boolean)
            .length;
        }
        break;
      }
    }

    stats[isoDate] = { score, played };
  }

  return stats;
};

const WeeklySummary: React.FC<WeeklySummaryProps> = ({ apiUrl }) => {
  const [userWeeklyAverage, setUserWeeklyAverage] = useState<number | null>(
    null
  );
  const [weeklyAverage, setWeeklyAverage] = useState<number | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [dailyStats, setDailyStats] = useState<DayStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [daysPlayed, setDaysPlayed] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchWeeklySummary = async () => {
      try {
        const response = await fetch(apiUrl);
        const data: { dailyAverageStats: Record<string, number> } =
          await response.json();

        const dateKeys = Object.keys(data.dailyAverageStats);
        const userStats = getUserStatsForDates(dateKeys);

        const chartData: DayStat[] = dateKeys.map((dateKey) => ({
          day: getDayAbbr(dateKey),
          userCorrect: userStats[dateKey].score,
          averageCorrect: data.dailyAverageStats[dateKey] ?? 0,
          played: userStats[dateKey].played,
        }));

        setDailyStats(chartData);

        const played = chartData.filter((d) => d.played);
        setDaysPlayed(played.length);

        const userAvg =
          played.length > 0
            ? played.reduce((sum, d) => sum + d.userCorrect, 0) / played.length
            : 0;
        setUserWeeklyAverage(userAvg);

        const serverAvg =
          Object.values(data.dailyAverageStats).reduce(
            (sum, val) => sum + val,
            0
          ) / dateKeys.length;
        setWeeklyAverage(serverAvg);

        let streakCount = 0;
        for (let i = chartData.length - 1; i >= 0; i--) {
          if (chartData[i].played) streakCount++;
          else break;
        }
        setStreak(streakCount);

        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch weekly summary:", error);
        setIsLoading(false);
      }
    };

    fetchWeeklySummary();
  }, [apiUrl]);

  const handleShareWeek = () => {
    const weekNum = getWeekNumber(new Date());

    const lines = dailyStats.map((stat) => {
      if (!stat.played) return `${stat.day} ${"⚪".repeat(5)}`;
      const green = "🟢".repeat(stat.userCorrect);
      const red = "🔴".repeat(5 - stat.userCorrect);
      return `${stat.day} ${green}${red}`;
    });

    const avgStr =
      userWeeklyAverage !== null ? userWeeklyAverage.toFixed(1) : "-";
    const streakStr = streak > 0 ? ` | ${streak}d streak` : "";

    const text = [
      `Fem Kjappe - Uke ${weekNum}`,
      ...lines,
      `Snitt: ${avgStr}/5${streakStr}`,
      `Spill på: femkjappe.no`,
    ].join("\n");

    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      (err) => console.error("Could not copy text:", err)
    );
  };

  if (isLoading) {
    return (
      <div className="mt-6 p-6 rounded-xl bg-white/10 animate-pulse">
        <div className="h-6 bg-white/20 rounded w-48 mx-auto mb-4" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 bg-white/20 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const totalWeekDays = dailyStats.length;
  const userAvgDisplay =
    userWeeklyAverage !== null ? userWeeklyAverage.toFixed(1) : "-";
  const allAvgDisplay =
    weeklyAverage !== null ? weeklyAverage.toFixed(1) : "-";

  return (
    <div className="mt-6 rounded-xl overflow-hidden shadow-lg">
      <div className="bg-gradient-to-r from-primary to-blue-500 px-4 py-3">
        <h2 className="text-lg font-bold text-white text-center tracking-wide">
          Ukens oppsummering
        </h2>
      </div>

      <div className="bg-white dark:bg-gray-700 px-4 py-4">
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {userAvgDisplay}
              <span className="text-sm font-normal text-green-500/70">
                {" "}
                / 5
              </span>
            </p>
            <p className="text-[11px] text-green-700 dark:text-green-300 font-medium mt-0.5">
              Ditt snitt
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {allAvgDisplay}
              <span className="text-sm font-normal text-blue-500/70">
                {" "}
                / 5
              </span>
            </p>
            <p className="text-[11px] text-blue-700 dark:text-blue-300 font-medium mt-0.5">
              Alles snitt
            </p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {streak}
              <span className="text-sm font-normal text-orange-500/70">
                {" "}
                d
              </span>
            </p>
            <p className="text-[11px] text-orange-700 dark:text-orange-300 font-medium mt-0.5">
              Streak
            </p>
          </div>
        </div>

        {userWeeklyAverage !== null && userWeeklyAverage > 0 && (
          <p className="text-center text-sm italic text-gray-500 dark:text-gray-400 mb-3">
            {getMotivation(userWeeklyAverage)} ({daysPlayed}/{totalWeekDays}{" "}
            dager spilt)
          </p>
        )}

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 -mx-1">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyStats} barGap={2} barCategoryGap="20%">
              <XAxis
                dataKey="day"
                interval={0}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 5]}
                ticks={[0, 1, 2, 3, 4, 5]}
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                width={20}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(255,255,255,0.05)" }}
              />
              <Bar dataKey="userCorrect" name="Du" radius={[4, 4, 0, 0]}>
                {dailyStats.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.played ? "#22c55e" : "#d1d5db"}
                    fillOpacity={entry.played ? 0.85 : 0.3}
                  />
                ))}
              </Bar>
              <Bar
                dataKey="averageCorrect"
                name="Snitt"
                radius={[4, 4, 0, 0]}
                fill="#60a5fa"
                fillOpacity={0.6}
              />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-green-500" />{" "}
              Du
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-400 opacity-60" />{" "}
              Snitt
            </span>
          </div>
        </div>

        <button
          onClick={handleShareWeek}
          className={`w-full mt-4 font-medium p-2 rounded-lg transition-colors ${
            copied
              ? "bg-green-500 text-white"
              : "bg-primary/80 hover:bg-primary text-white"
          }`}
        >
          {copied ? "Kopiert!" : "Del ukens resultat"}
        </button>
      </div>
    </div>
  );
};

export default WeeklySummary;
