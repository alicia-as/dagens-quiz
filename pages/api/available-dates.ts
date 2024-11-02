import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const questionsDirectory = path.join(process.cwd(), "questions");
  const files = fs.readdirSync(questionsDirectory);

  // Extract dates from filenames (assuming filenames are in the format YYYYMMDD.json)
  const dates = files
    .filter((file) => file.endsWith(".json"))
    .map((file) => file.replace(".json", ""))
    .sort(); // Ensure dates are sorted in ascending order

  res.status(200).json(dates);
}
