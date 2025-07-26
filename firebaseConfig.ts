import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// Replace with your actual config values
const firebaseConfig = {
  apiKey: "AIzaSyBXyA6rETj67LRQ9NgQwTUPLKryZ3HlJQY",
  authDomain: "enxebre-futbol.firebaseapp.com",
  projectId: "enxebre-futbol",
  storageBucket: "enxebre-futbol.firebasestorage.app",
  messagingSenderId: "1098791988895",
  appId: "1:1098791988895:web:d179fad84abdc0100efcaa",
  measurementId: "G-ZH31PM9VXS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
