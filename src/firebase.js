import { initializeApp } from "firebase/app"

import { getAuth } from "firebase/auth"

import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyB6dDyGGaN6b_jAuX1Hu4WbZPX34ep982c",
  authDomain: "finsure-aef30.firebaseapp.com",
  projectId: "finsure-aef30",
  storageBucket: "finsure-aef30.firebasestorage.app",
  messagingSenderId: "615229290382",
  appId: "1:615229290382:web:ad9f9220f9e8c51fca16df",
  measurementId: "G-76NVRTDNBL"

}

// Initialize Firebase
const app =
  initializeApp(firebaseConfig)

// Authentication
export const auth =
  getAuth(app)

// Firestore Database
export const db =
  getFirestore(app)

export default app