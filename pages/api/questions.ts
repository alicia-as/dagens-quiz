import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { date } = req.query;
  const formattedDate = date
    ? date.toString().replace(/-/g, "")
    : new Date().toISOString().split("T")[0].replace(/-/g, "");

  const questionsDirectory = path.join(process.cwd(), "questions");
  const filePath = path.join(questionsDirectory, `${formattedDate}.json`);

  if (fs.existsSync(filePath)) {
    const questions = JSON.parse(fs.readFileSync(filePath, "utf8"));
    res.status(200).json(questions);
  } else {
    res
      .status(404)
      .json({ message: "Questions for this date are not available." });
  }
}
