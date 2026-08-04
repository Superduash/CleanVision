/**
 * CleanVision Firebase initialization with automatic local fallback.
 * If VITE_FIREBASE_API_KEY is provided in .env.local, real Firebase is used.
 * If missing, it gracefully falls back to local mode so localhost loads instantly.
 */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

export const isFirebaseConfigured = Boolean(apiKey && apiKey.length > 5 && !apiKey.includes("your-"));

// Fallback config for local dev when Firebase keys aren't added yet
const firebaseConfig = {
  apiKey: isFirebaseConfigured ? apiKey : "AIzaSyDummyKeyForLocalDevTesting1234567",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "cleanvision-demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "cleanvision-demo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "cleanvision-demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:1234567890",
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.warn("Firebase initialization warning (using local fallback mode):", e);
  app = {} as FirebaseApp;
  auth = {} as Auth;
  db = {} as Firestore;
}

export { app, auth, db };
export default app;
