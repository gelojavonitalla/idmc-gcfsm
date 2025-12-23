/**
 * What to Bring Service
 * Provides CRUD operations for managing "What to Bring" checklist items.
 * These items are displayed in confirmation emails and registration success pages.
 *
 * @module services/whatToBring
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { COLLECTIONS, WHAT_TO_BRING_STATUS } from '../constants';
import { logActivity, ACTIVITY_TYPES, ENTITY_TYPES } from './activityLog';

/**
 * Fetches all "What to Bring" items from Firestore
 *
 * @returns {Promise<Array>} Array of what to bring items
 */
export async function getAllWhatToBringItems() {
  const whatToBringRef = collection(db, COLLECTIONS.WHAT_TO_BRING);
  const orderedQuery = query(whatToBringRef, orderBy('order', 'asc'));

  const snapshot = await getDocs(orderedQuery);

  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }));
}

/**
 * Fetches only published "What to Bring" items from Firestore
 *
 * @returns {Promise<Array>} Array of published what to bring items
 */
export async function getPublishedWhatToBringItems() {
  const whatToBringRef = collection(db, COLLECTIONS.WHAT_TO_BRING);
  const publishedQuery = query(
    whatToBringRef,
    where('status', '==', WHAT_TO_BRING_STATUS.PUBLISHED),
    orderBy('order', 'asc')
  );

  const snapshot = await getDocs(publishedQuery);

  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }));
}

/**
 * Gets a single "What to Bring" item by ID
 *
 * @param {string} itemId - What to bring item document ID
 * @returns {Promise<Object|null>} What to bring item data or null if not found
 */
export async function getWhatToBringItem(itemId) {
  if (!itemId) {
    return null;
  }

  const docRef = doc(db, COLLECTIONS.WHAT_TO_BRING, itemId);
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
 * Creates or updates a "What to Bring" item
 *
 * @param {string} itemId - What to bring item document ID
 * @param {Object} itemData - What to bring item data to save
 * @param {string} adminId - Admin user ID performing the action
 * @param {string} adminEmail - Admin email performing the action
 * @returns {Promise<Object>} Saved what to bring item data
 */
export async function saveWhatToBringItem(itemId, itemData, adminId = null, adminEmail = null) {
  const existing = await getWhatToBringItem(itemId);
  const isNew = !existing;

  const docRef = doc(db, COLLECTIONS.WHAT_TO_BRING, itemId);
  const timestamp = serverTimestamp();

  const docData = {
    ...itemData,
    updatedAt: timestamp,
  };

  if (!existing) {
    docData.createdAt = timestamp;
  }

  await setDoc(docRef, docData, { merge: true });

  if (adminId && adminEmail) {
    await logActivity({
      type: isNew ? ACTIVITY_TYPES.CREATE : ACTIVITY_TYPES.UPDATE,
      entityType: ENTITY_TYPES.WHAT_TO_BRING,
      entityId: itemId,
      description: `${isNew ? 'Created' : 'Updated'} what to bring item: ${itemData.text || itemId}`,
      adminId,
      adminEmail,
    });
  }

  return {
    id: itemId,
    ...itemData,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Updates specific fields of a "What to Bring" item
 *
 * @param {string} itemId - What to bring item document ID
 * @param {Object} updates - Fields to update
 * @param {string} adminId - Admin user ID performing the action
 * @param {string} adminEmail - Admin email performing the action
 * @returns {Promise<void>}
 */
export async function updateWhatToBringItem(itemId, updates, adminId = null, adminEmail = null) {
  const docRef = doc(db, COLLECTIONS.WHAT_TO_BRING, itemId);

  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });

  if (adminId && adminEmail) {
    const item = await getWhatToBringItem(itemId);
    await logActivity({
      type: ACTIVITY_TYPES.UPDATE,
      entityType: ENTITY_TYPES.WHAT_TO_BRING,
      entityId: itemId,
      description: `Updated what to bring item: ${item?.text || itemId}`,
      adminId,
      adminEmail,
    });
  }
}

/**
 * Deletes a "What to Bring" item
 *
 * @param {string} itemId - What to bring item document ID
 * @param {string} adminId - Admin user ID performing the action
 * @param {string} adminEmail - Admin email performing the action
 * @returns {Promise<void>}
 */
export async function deleteWhatToBringItem(itemId, adminId = null, adminEmail = null) {
  const item = await getWhatToBringItem(itemId);
  const docRef = doc(db, COLLECTIONS.WHAT_TO_BRING, itemId);
  await deleteDoc(docRef);

  if (adminId && adminEmail) {
    await logActivity({
      type: ACTIVITY_TYPES.DELETE,
      entityType: ENTITY_TYPES.WHAT_TO_BRING,
      entityId: itemId,
      description: `Deleted what to bring item: ${item?.text || itemId}`,
      adminId,
      adminEmail,
    });
  }
}
