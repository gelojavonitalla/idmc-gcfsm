/**
 * Firebase Client Configuration
 * Initializes Firebase app, Firestore, Authentication, and App Check
 * for the IDMC Conference frontend.
 *
 * @module lib/firebase
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
} from 'firebase/app-check';

/**
 * Firebase database and storage configuration
 */
const FIREBASE_CONFIG = {
  DATABASE_ID: 'idmc-2026',
  STORAGE_BUCKET: 'idmc-2026',
};

/**
 * Firebase configuration object
 * Values are loaded from environment variables for security
 */
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'idmc-gcfsm-dev',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

/**
 * Initialize Firebase app
 * Creates a singleton Firebase app instance
 */
const app = initializeApp(firebaseConfig);

/**
 * Initialize Firebase App Check
 *
 * App Check helps protect your backend resources from abuse by attesting
 * that incoming traffic is coming from your app running on a valid device.
 *
 * In production, it uses reCAPTCHA v3 for web attestation.
 * In development, it uses debug tokens for testing.
 *
 * @see https://firebase.google.com/docs/app-check
 */
let appCheck = null;

if (typeof window !== 'undefined') {
  const isProduction = process.env.NODE_ENV === 'production';
  const recaptchaSiteKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY;

  if (isProduction && recaptchaSiteKey) {
    // Production: Use reCAPTCHA v3 provider
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } else if (!isProduction) {
    // Development: Enable debug mode for App Check
    // This allows testing without reCAPTCHA in development
    // Debug tokens are automatically generated and logged to console
    // Add these tokens to Firebase Console > App Check > Apps > Manage debug tokens
    if (process.env.REACT_APP_APPCHECK_DEBUG_TOKEN) {
      // Use specific debug token if provided
      window.FIREBASE_APPCHECK_DEBUG_TOKEN =
        process.env.REACT_APP_APPCHECK_DEBUG_TOKEN;
    } else {
      // Auto-generate debug token (will be logged to console)
      window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }

    try {
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(
          recaptchaSiteKey || 'placeholder-key-for-dev'
        ),
        isTokenAutoRefreshEnabled: true,
      });
    } catch (error) {
      // App Check initialization may fail in development without valid key
      // This is expected and doesn't affect functionality
      console.info('App Check not initialized in development mode');
    }
  }
}

/**
 * Firestore database instance
 * Uses the named database 'idmc-2026' for this project
 */
const db = getFirestore(app, FIREBASE_CONFIG.DATABASE_ID);

/**
 * Firebase Authentication instance
 */
const auth = getAuth(app);

/**
 * Firebase Storage instance
 * Uses the named bucket 'idmc-2026' for this project
 */
const storage = getStorage(app, `gs://${FIREBASE_CONFIG.STORAGE_BUCKET}`);

/**
 * Firebase Functions instance
 * Region set to asia-southeast1 to match Cloud Functions deployment
 */
const functions = getFunctions(app, 'asia-southeast1');

/**
 * Connect to emulators in development
 */
if (process.env.REACT_APP_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectStorageEmulator(storage, 'localhost', 9199);
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

export { app, appCheck, db, auth, storage, functions, FIREBASE_CONFIG };
