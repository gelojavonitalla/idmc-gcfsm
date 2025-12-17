/**
 * Firestore Query Helpers
 * Reusable functions for common Firestore operations to reduce code duplication.
 *
 * @module lib/firestoreQueries
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
import { db } from './firebase';

/**
 * Maps Firestore document snapshots to objects with id field.
 *
 * @param {QuerySnapshot} snapshot - Firestore query snapshot
 * @returns {Array<Object>} Array of documents with id field
 */
export function mapDocsWithId(snapshot) {
  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }));
}

/**
 * Gets a single document by ID from a collection.
 *
 * @param {string} collectionName - Firestore collection name
 * @param {string} docId - Document ID
 * @returns {Promise<Object|null>} Document data with id, or null if not found
 * @throws {Error} If the Firestore query fails
 */
export async function getDocById(collectionName, docId) {
  if (!docId) {
    return null;
  }

  const docRef = doc(db, collectionName, docId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

/**
 * Gets all published items from a collection.
 * Items must have a 'status' field matching the publishedStatus value.
 *
 * @param {string} collectionName - Firestore collection name
 * @param {string} publishedStatus - Status value for published items
 * @param {Object} options - Query options
 * @param {string} options.orderField - Field to order by (default: 'order')
 * @param {string} options.orderDirection - Order direction (default: 'asc')
 * @returns {Promise<Array<Object>>} Array of published items with id field
 * @throws {Error} If the Firestore query fails
 */
export async function getPublishedItems(
  collectionName,
  publishedStatus,
  options = {}
) {
  const { orderField = 'order', orderDirection = 'asc' } = options;

  const collRef = collection(db, collectionName);
  const publishedQuery = query(
    collRef,
    where('status', '==', publishedStatus),
    orderBy(orderField, orderDirection)
  );

  const snapshot = await getDocs(publishedQuery);
  return mapDocsWithId(snapshot);
}

/**
 * Gets all items from a collection with optional ordering.
 *
 * @param {string} collectionName - Firestore collection name
 * @param {Object} options - Query options
 * @param {string} options.orderField - Field to order by (default: 'order')
 * @param {string} options.orderDirection - Order direction (default: 'asc')
 * @returns {Promise<Array<Object>>} Array of all items with id field
 * @throws {Error} If the Firestore query fails
 */
export async function getAllItems(collectionName, options = {}) {
  const { orderField = 'order', orderDirection = 'asc' } = options;

  const collRef = collection(db, collectionName);
  const orderedQuery = query(collRef, orderBy(orderField, orderDirection));

  const snapshot = await getDocs(orderedQuery);
  return mapDocsWithId(snapshot);
}

/**
 * Gets items from a collection with custom filters.
 *
 * @param {string} collectionName - Firestore collection name
 * @param {Array<Object>} filters - Array of filter objects { field, operator, value }
 * @param {Object} options - Query options
 * @param {string} options.orderField - Field to order by
 * @param {string} options.orderDirection - Order direction (default: 'asc')
 * @returns {Promise<Array<Object>>} Array of matching items with id field
 * @throws {Error} If the Firestore query fails
 */
export async function getItemsWithFilters(collectionName, filters, options = {}) {
  const { orderField, orderDirection = 'asc' } = options;

  const collRef = collection(db, collectionName);
  const queryConstraints = filters.map((f) => where(f.field, f.operator, f.value));

  if (orderField) {
    queryConstraints.push(orderBy(orderField, orderDirection));
  }

  const filteredQuery = query(collRef, ...queryConstraints);
  const snapshot = await getDocs(filteredQuery);

  return mapDocsWithId(snapshot);
}
