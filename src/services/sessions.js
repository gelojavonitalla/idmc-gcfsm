/**
 * Sessions Service
 * Provides functions to fetch session data from Firestore.
 *
 * @module services/sessions
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { COLLECTIONS, SESSION_STATUS } from '../constants';

/**
 * Fetches all published sessions from Firestore, ordered by their schedule order.
 *
 * @returns {Promise<Array>} Array of published session objects
 * @throws {Error} If the Firestore query fails
 */
export async function getPublishedSessions() {
  const sessionsRef = collection(db, COLLECTIONS.SESSIONS);
  const publishedQuery = query(
    sessionsRef,
    where('status', '==', SESSION_STATUS.PUBLISHED),
    orderBy('order', 'asc')
  );

  const snapshot = await getDocs(publishedQuery);

  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }));
}

/**
 * Fetches a single session by its document ID.
 *
 * @param {string} sessionId - The session's document ID
 * @returns {Promise<Object|null>} The session object or null if not found
 * @throws {Error} If the Firestore query fails
 */
export async function getSessionById(sessionId) {
  if (!sessionId) {
    return null;
  }

  const sessionRef = doc(db, COLLECTIONS.SESSIONS, sessionId);
  const snapshot = await getDoc(sessionRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

/**
 * Fetches all sessions of a specific type from Firestore.
 *
 * @param {string} sessionType - The session type to filter by
 * @returns {Promise<Array>} Array of session objects of the specified type
 * @throws {Error} If the Firestore query fails
 */
export async function getSessionsByType(sessionType) {
  if (!sessionType) {
    return [];
  }

  const sessionsRef = collection(db, COLLECTIONS.SESSIONS);
  const typeQuery = query(
    sessionsRef,
    where('sessionType', '==', sessionType),
    where('status', '==', SESSION_STATUS.PUBLISHED),
    orderBy('order', 'asc')
  );

  const snapshot = await getDocs(typeQuery);

  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }));
}
