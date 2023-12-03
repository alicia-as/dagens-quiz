import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// Handler for your API endpoint
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const today = new Date();
  const dateString = today.toISOString().split('T')[0].replace(/-/g, '');  
  

  // Path to your questions directory
  const questionsDirectory = path.join(process.cwd(), 'questions');

  // Construct the file path for today's questions
  const filePath = path.join(questionsDirectory, `${dateString}.json`);

  // Check if the file exists
  if (fs.existsSync(filePath)) {
    // Read the file and parse the JSON
    const questions = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.status(200).json(questions);
  } else {
    // If the file doesn't exist, send a 404 response
    res.status(404).json({ message: 'Questions for today are not available.' });
  }
}
