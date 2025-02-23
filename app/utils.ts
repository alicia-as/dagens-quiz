export const isFriday = (date: Date) => {
  //   In development, it's always Friday
  if (process.env.NODE_ENV === "development") {
    return true;
  }
  return date.getDay() === 5;
};
