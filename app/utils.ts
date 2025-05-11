export const isFriday = (date: Date) => {
  //   In development, it's always Friday
  if (process.env.NODE_ENV === "development") {
    return true;
  }
  return date.getDay() === 5;
};

// utils.ts
export const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}${month}${day}`;
};

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
        `${year}${m}${d}`, // YYYYMMDD
        `${year}-${m}-${d}`, // ISO
        `${d}/${m}/${year}`, // Norwegian
        `${d}.${m}.${year}`, // Norwegian with dots
        `${m}/${d}/${year}`, // US
        `${d}.${m}.${year}`, // D.M.YYYY (repeated for clarity)
        `${d}.${m}.${shortYear}` // D.M.YY
      );
    }
  }

  return Array.from(new Set(formats)); // remove duplicates
};

export const parseYYYYMMDD = (dateStr: string): Date => {
  const year = parseInt(dateStr.slice(0, 4));
  const month = parseInt(dateStr.slice(4, 6)) - 1;
  const day = parseInt(dateStr.slice(6, 8));
  return new Date(year, month, day);
};
