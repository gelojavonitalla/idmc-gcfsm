/**
 * Speakers Service
 * Provides functions to fetch speaker data from Firestore.
 *
 * @module services/speakers
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
import { COLLECTIONS, SPEAKER_STATUS } from '../constants';

/**
 * Fetches all published speakers from Firestore, ordered by their display order.
 *
 * @returns {Promise<Array>} Array of published speaker objects
 * @throws {Error} If the Firestore query fails
 */
export async function getPublishedSpeakers() {
  const speakersRef = collection(db, COLLECTIONS.SPEAKERS);
  const publishedQuery = query(
    speakersRef,
    where('status', '==', SPEAKER_STATUS.PUBLISHED),
    orderBy('order', 'asc')
  );

  const snapshot = await getDocs(publishedQuery);

  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }));
}

/**
 * Fetches a single speaker by their document ID.
 *
 * @param {string} speakerId - The speaker's document ID
 * @returns {Promise<Object|null>} The speaker object or null if not found
 * @throws {Error} If the Firestore query fails
 */
export async function getSpeakerById(speakerId) {
  if (!speakerId) {
    return null;
  }

  const speakerRef = doc(db, COLLECTIONS.SPEAKERS, speakerId);
  const snapshot = await getDoc(speakerRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

/**
 * Fetches all featured speakers from Firestore.
 * Featured speakers are those with featured === true and status === 'published'.
 *
 * @returns {Promise<Array>} Array of featured speaker objects ordered by display order
 * @throws {Error} If the Firestore query fails
 */
export async function getFeaturedSpeakers() {
  const speakersRef = collection(db, COLLECTIONS.SPEAKERS);
  const featuredQuery = query(
    speakersRef,
    where('featured', '==', true),
    where('status', '==', SPEAKER_STATUS.PUBLISHED),
    orderBy('order', 'asc')
  );

  const snapshot = await getDocs(featuredQuery);

  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }));
}
