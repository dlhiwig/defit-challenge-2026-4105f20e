/**
 * Firebase Configuration
 * 
 * Shared Firebase project with DEFIT App (defit.work)
 * This ensures users can sign up on either site and log into both.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

// Same Firebase project as DEFIT App
const firebaseConfig = {
  projectId: "studio-3541826900-e65c5",
  appId: "1:831310688334:web:0486a3d1d7d76e00d8131f",
  apiKey: "AIzaSyCue0HweVo_KWC0nW1yqNHxt0oc_A4REXk",
  authDomain: "studio-3541826900-e65c5.firebaseapp.com",
  messagingSenderId: "831310688334",
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
