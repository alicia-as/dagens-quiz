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

// For backwards compatibility
export const tryDateFormats = (date: Date): string[] => {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return [
    `${year}${month}${day}`, // YYYYMMDD (new format)
    `${year}-${month}-${day}`, // ISO
    `${day}/${month}/${year}`, // Norwegian (DD/MM/YYYY)
    `${month}/${day}/${year}`, // US (MM/DD/YYYY)
    `${day}.${month}.${year}`, // Norwegian with dots (DD.MM.YYYY)
    `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`, // Unpadded D.M.YYYY
  ];
};
