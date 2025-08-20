
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "leaveease-5o9gj",
  appId: "1:652600742966:web:8ce4a208a083f8b92fb497",
  storageBucket: "leaveease-5o9gj.firebasestorage.app",
  apiKey: "AIzaSyB8IDf6saX-g1ICG6s1AtrjpSR-URZtcfE",
  authDomain: "leaveease-5o9gj.firebaseapp.com",
  messagingSenderId: "652600742966",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
