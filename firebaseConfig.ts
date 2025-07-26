
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

// Your web app's Firebase configuration from your project
const firebaseConfig = {
  apiKey: "AIzaSyBXyA6rETj67LRQ9NgQwTUPLKryZ3HlJQY",
  authDomain: "enxebre-futbol.firebaseapp.com",
  projectId: "enxebre-futbol",
  storageBucket: "enxebre-futbol.firebasestorage.app",
  messagingSenderId: "1098791988895",
  appId: "1:1098791988895:web:d179fad84abdc0100efcaa"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
export const db = firebase.firestore();
export const storage = firebase.storage();
