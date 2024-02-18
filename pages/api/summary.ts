// pages/api/summary.ts
import { NextApiRequest, NextApiResponse } from "next";
import { app } from "../api/firebaseConfig"; // Adjust the path as necessary
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

const db = getFirestore(app);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).end("Method Not Allowed");
  }

  const submissionDate = new Date().toISOString().split("T")[0]; // Format as YYYY-MM-DD
  const submissionsRef = collection(db, "submissions");
  const q = query(
    submissionsRef,
    where("submissionDate", "==", submissionDate)
  );

  try {
    const querySnapshot = await getDocs(q);
    let totalCorrect = 0;
    let totalSubmissions = 0;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      totalCorrect += data.numberOfCorrect;
      totalSubmissions++;
    });

    const averageCorrect =
      totalSubmissions > 0
        ? (totalCorrect / (totalSubmissions * 5)).toFixed(2)
        : 0; // There are always 5 questions

    res.status(200).json({ averageCorrect });
  } catch (error) {
    console.error("Error fetching summary: ", error);
    res.status(500).json({ error: "Failed to fetch summary" });
  }
}
