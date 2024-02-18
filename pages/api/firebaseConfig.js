// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD2h3UVn8ttcqPx1jFwHgjlTZpQ8ZsGne0",
  authDomain: "dagens-quiz-7dced.firebaseapp.com",
  projectId: "dagens-quiz-7dced",
  storageBucket: "dagens-quiz-7dced.appspot.com",
  messagingSenderId: "916941030996",
  appId: "1:916941030996:web:643541093713c1ed340fc1",
  measurementId: "G-0TTPE5LLV5",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
