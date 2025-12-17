/**
 * FAQ Service
 * Provides functions to fetch FAQ data from Firestore.
 *
 * @module services/faq
 */

import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getDocById, mapDocsWithId } from '../lib/firestoreQueries';
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
  return mapDocsWithId(snapshot);
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
  return mapDocsWithId(snapshot);
}

/**
 * Fetches a single FAQ item by its document ID.
 *
 * @param {string} faqId - The FAQ document ID
 * @returns {Promise<Object|null>} The FAQ object or null if not found
 * @throws {Error} If the Firestore query fails
 */
export async function getFAQById(faqId) {
  return getDocById(COLLECTIONS.FAQ, faqId);
}
