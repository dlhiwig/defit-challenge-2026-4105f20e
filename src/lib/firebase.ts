/**
 * Firebase Configuration
 * 
 * Shared Firebase project with DEFIT App (defit.work)
 * This ensures users can sign up on either site and log into both.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

// Shared Firebase project: defit-2026 (controlled by Daniel)
const firebaseConfig = {
  projectId: "defit-2026",
  appId: "1:772961957739:web:fa6c2777fe08679a4fbe2e",
  apiKey: "AIzaSyADP4MkJFs72rDwNP63S41MPhoIKCDUnV8",
  authDomain: "defit-2026.firebaseapp.com",
  storageBucket: "defit-2026.firebasestorage.app",
  messagingSenderId: "772961957739",
  measurementId: "G-2ECTB05RGG",
};

let app: FirebaseApp;
let auth: Auth;

export function initializeFirebase() {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
  return { app, auth };
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    initializeFirebase();
  }
  return auth;
}

export { auth };
