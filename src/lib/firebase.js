/**
 * Firebase Client Configuration
 * Initializes Firebase app, Firestore, and Authentication for the IDMC Conference frontend.
 *
 * @module lib/firebase
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

/**
 * Firebase database configuration
 */
const FIREBASE_CONFIG = {
  DATABASE_ID: 'idmc-2026',
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
 */
const storage = getStorage(app);

/**
 * Connect to emulators in development
 */
if (process.env.REACT_APP_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectStorageEmulator(storage, 'localhost', 9199);
}

export { app, db, auth, storage, FIREBASE_CONFIG };
