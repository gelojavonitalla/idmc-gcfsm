/**
 * Stats Service
 * Manages conference statistics stored in a dedicated collection.
 * Stats are updated by Cloud Functions and read by the frontend.
 *
 * @module services/stats
 */

import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { COLLECTIONS, STATS_DOC_ID } from '../constants';

/**
 * Default stats object when document doesn't exist
 */
const DEFAULT_STATS = {
  registeredAttendeeCount: 0,
  workshopCounts: {},
  lastSyncedAt: null,
  lastUpdatedAt: null,
};

/**
 * Fetches conference statistics
 *
 * @returns {Promise<Object>} Conference stats object
 */
export async function getConferenceStats() {
  try {
    const statsRef = doc(db, COLLECTIONS.STATS, STATS_DOC_ID);
    const statsDoc = await getDoc(statsRef);

    if (statsDoc.exists()) {
      return {
        id: statsDoc.id,
        ...statsDoc.data(),
      };
    }

    return { id: STATS_DOC_ID, ...DEFAULT_STATS };
  } catch (error) {
    console.error('Failed to fetch conference stats:', error);
    return { id: STATS_DOC_ID, ...DEFAULT_STATS };
  }
}

/**
 * Subscribes to real-time conference stats updates
 *
 * @param {Function} callback - Called with updated stats on each change
 * @returns {Function} Unsubscribe function
 */
export function subscribeToConferenceStats(callback) {
  const statsRef = doc(db, COLLECTIONS.STATS, STATS_DOC_ID);

  return onSnapshot(
    statsRef,
    (docSnapshot) => {
      if (docSnapshot.exists()) {
        callback({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        });
      } else {
        callback({ id: STATS_DOC_ID, ...DEFAULT_STATS });
      }
    },
    (error) => {
      console.error('Error subscribing to conference stats:', error);
      callback({ id: STATS_DOC_ID, ...DEFAULT_STATS });
    }
  );
}
