export const isFriday = (date: Date) => {
  if (process.env.NODE_ENV === "development") {
    return true;
  }
  return date.getDay() === 5;
};

export const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}${month}${day}`;
};

/**
 * Canonical storage key: always YYYYMMDD.
 * Accepts an optional YYYYMMDD quizDate string; falls back to today.
 */
export const toStorageKey = (quizDate?: string): string => {
  if (quizDate) return quizDate;
  return formatDateToYYYYMMDD(new Date());
};

/** Parse a YYYYMMDD string into a Date (local time). */
export const parseYYYYMMDD = (s: string): Date =>
  new Date(
    Number(s.slice(0, 4)),
    Number(s.slice(4, 6)) - 1,
    Number(s.slice(6, 8))
  );

const DAY_ABBR = ["Søn", "Man", "Tir", "Ons", "Tor", "Fre", "Lør"];

/** Derive a short weekday name from an ISO date string (YYYY-MM-DD). */
export const getDayAbbr = (isoDate: string): string => {
  const date = new Date(isoDate + "T00:00:00");
  return DAY_ABBR[date.getDay()];
};

/**
 * Generate all legacy localStorage key prefixes for a given date.
 * Used for backward-compatible reads before keys were standardized to YYYYMMDD.
 */
export const tryDateFormats = (date: Date): string[] => {
  const year = date.getFullYear();
  const shortYear = year.toString().slice(2);
  const day = date.getDate();
  const month = date.getMonth() + 1;

  const dayVariants = [day.toString(), day.toString().padStart(2, "0")];
  const monthVariants = [month.toString(), month.toString().padStart(2, "0")];

  const formats: string[] = [];

  for (const d of dayVariants) {
    for (const m of monthVariants) {
      formats.push(
        `${year}${m}${d}`,
        `${year}-${m}-${d}`,
        `${d}/${m}/${year}`,
        `${d}.${m}.${year}`,
        `${m}/${d}/${year}`,
        `${d}.${m}.${shortYear}`
      );
    }
  }

  return Array.from(new Set(formats));
};
