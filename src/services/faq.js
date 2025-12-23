/**
 * FAQ Service
 * Provides functions to fetch FAQ data from Firestore.
 *
 * @module services/faq
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
import { COLLECTIONS, FAQ_STATUS } from '../constants';

/**
 * Fetches all published FAQ items from Firestore, ordered by category and then by order.
 *
 * @returns {Promise<Array>} Array of published FAQ objects
 * @throws {Error} If the Firestore query fails
 */
export async function getPublishedFAQs() {
  const faqRef = collection(db, COLLECTIONS.FAQ);
  const publishedQuery = query(
    faqRef,
    where('status', '==', FAQ_STATUS.PUBLISHED),
    orderBy('category', 'asc'),
    orderBy('order', 'asc')
  );

  const snapshot = await getDocs(publishedQuery);

  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }));
}

/**
 * Fetches all published FAQ items for a specific category.
 *
 * @param {string} category - The category to filter by
 * @returns {Promise<Array>} Array of FAQ objects for the given category
 * @throws {Error} If the Firestore query fails
 */
export async function getFAQsByCategory(category) {
  if (!category) {
    return [];
  }

  const faqRef = collection(db, COLLECTIONS.FAQ);
  const categoryQuery = query(
    faqRef,
    where('category', '==', category),
    where('status', '==', FAQ_STATUS.PUBLISHED),
    orderBy('order', 'asc')
  );

  const snapshot = await getDocs(categoryQuery);

  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }));
}

/**
 * Fetches a single FAQ item by its document ID.
 *
 * @param {string} faqId - The FAQ document ID
 * @returns {Promise<Object|null>} The FAQ object or null if not found
 * @throws {Error} If the Firestore query fails
 */
export async function getFAQById(faqId) {
  if (!faqId) {
    return null;
  }

  const faqRef = doc(db, COLLECTIONS.FAQ, faqId);
  const snapshot = await getDoc(faqRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}
