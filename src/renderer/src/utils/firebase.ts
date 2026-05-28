// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyBI4oJtpWgdaoYyAYwCsbD7z7Peo5BgW6w",
  authDomain: "creator-hub-auth-6c1fb.firebaseapp.com",
  projectId: "creator-hub-auth-6c1fb",
  storageBucket: "creator-hub-auth-6c1fb.firebasestorage.app",
  messagingSenderId: "931267623856",
  appId: "1:931267623856:web:909ba13b33aae8acf97475",
  measurementId: "G-TK3JV8F8P3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app)