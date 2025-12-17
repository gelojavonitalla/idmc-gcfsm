/**
 * Sessions Service
 * Provides functions to fetch session data from Firestore.
 *
 * @module services/sessions
 */

import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getDocById, getPublishedItems, mapDocsWithId } from '../lib/firestoreQueries';
import { COLLECTIONS, SESSION_STATUS } from '../constants';

/**
 * Fetches all published sessions from Firestore, ordered by their schedule order.
 *
 * @returns {Promise<Array>} Array of published session objects
 * @throws {Error} If the Firestore query fails
 */
export async function getPublishedSessions() {
  console.log('[sessions] Querying Firestore for published sessions...');
  console.log('[sessions] Collection:', COLLECTIONS.SESSIONS);
  console.log('[sessions] Filter: status ==', SESSION_STATUS.PUBLISHED);

  const sessions = await getPublishedItems(COLLECTIONS.SESSIONS, SESSION_STATUS.PUBLISHED);
  console.log('[sessions] Firestore returned', sessions.length, 'documents');

  return sessions;
}

/**
 * Fetches a single session by its document ID.
 *
 * @param {string} sessionId - The session's document ID
 * @returns {Promise<Object|null>} The session object or null if not found
 * @throws {Error} If the Firestore query fails
 */
export async function getSessionById(sessionId) {
  return getDocById(COLLECTIONS.SESSIONS, sessionId);
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
  return mapDocsWithId(snapshot);
}
