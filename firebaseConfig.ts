import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBXyA6rETj67LRQ9NgQwTUPLKryZ3HlJQY",
  authDomain: "enxebre-futbol.firebaseapp.com",
  projectId: "enxebre-futbol",
  storageBucket: "enxebre-futbol.appspot.com",
  messagingSenderId: "1098791988895",
  appId: "1:1098791988895:web:d179fad84abdc0100efcaa",
  measurementId: "G-ZH31PM9VXS"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const db = firebase.firestore();
export const storage = firebase.storage();
