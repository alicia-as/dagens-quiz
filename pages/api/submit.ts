import { app } from "../api/firebaseConfig"; // Adjust the path as necessary
import {
  getFirestore,
  collection,
  addDoc,
  Timestamp,
} from "firebase/firestore";

const db = getFirestore(app);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  const { numberOfCorrect, answers } = req.body;
  const submissionDate = new Date().toISOString().split("T")[0]; // Format as YYYY-MM-DD

  try {
    const submission = await addDoc(collection(db, "submissions/"), {
      numberOfCorrect,
      answers,
      createdAt: Timestamp.fromDate(new Date()), // Store the exact submission time
      submissionDate, // Store the submission date for grouping
    });

    res
      .status(200)
      .json({ id: submission.id, message: "Submission stored successfully." });
  } catch (error) {
    console.error("Error saving submission: ", error);
    res.status(500).json({ error: "Failed to store submission" });
  }
}
