import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import 'firebase/compat/auth';

// Your web app's Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
// Primary app instance for main app logic
if (firebase.apps.every(app => app?.name !== 'PRIMARY')) {
  firebase.initializeApp(firebaseConfig, 'PRIMARY');
}

// Secondary app instance specifically for user creation to avoid session conflicts
if (firebase.apps.every(app => app?.name !== 'SECONDARY')) {
  firebase.initializeApp(firebaseConfig, 'SECONDARY');
}

const primaryApp = firebase.app('PRIMARY');
const secondaryApp = firebase.app('SECONDARY');

export const db = primaryApp.firestore();
export const storage = primaryApp.storage();
export const auth = primaryApp.auth();
export const secondaryAuth = secondaryApp.auth();
