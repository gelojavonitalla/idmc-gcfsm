/**
 * Food Menu Service
 * Provides CRUD operations for managing food menu items.
 *
 * @module services/foodMenu
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
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { COLLECTIONS } from '../constants';
import { logActivity, ACTIVITY_TYPES, ENTITY_TYPES } from './activityLog';

/**
 * Settings document ID for food menu configuration
 */
const FOOD_SETTINGS_DOC_ID = 'food-settings';

/**
 * Fetches all food menu items from Firestore
 *
 * @returns {Promise<Array>} Array of food menu items
 */
export async function getAllFoodMenuItems() {
  const foodMenuRef = collection(db, COLLECTIONS.FOOD_MENU);
  const orderedQuery = query(foodMenuRef, orderBy('order', 'asc'));

  const snapshot = await getDocs(orderedQuery);

  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }));
}

/**
 * Gets a single food menu item by ID
 *
 * @param {string} itemId - Food menu item document ID
 * @returns {Promise<Object|null>} Food menu item data or null if not found
 */
export async function getFoodMenuItem(itemId) {
  if (!itemId) {
    return null;
  }

  const docRef = doc(db, COLLECTIONS.FOOD_MENU, itemId);
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
 * Creates or updates a food menu item
 *
 * @param {string} itemId - Food menu item document ID
 * @param {Object} itemData - Food menu item data to save
 * @param {string} adminId - Admin user ID performing the action
 * @param {string} adminEmail - Admin email performing the action
 * @returns {Promise<Object>} Saved food menu item data
 */
export async function saveFoodMenuItem(itemId, itemData, adminId = null, adminEmail = null) {
  const existing = await getFoodMenuItem(itemId);
  const isNew = !existing;

  const docRef = doc(db, COLLECTIONS.FOOD_MENU, itemId);
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
      entityType: ENTITY_TYPES.FOOD_MENU,
      entityId: itemId,
      description: `${isNew ? 'Created' : 'Updated'} food menu item: ${itemData.name || itemId}`,
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
 * Updates specific fields of a food menu item
 *
 * @param {string} itemId - Food menu item document ID
 * @param {Object} updates - Fields to update
 * @param {string} adminId - Admin user ID performing the action
 * @param {string} adminEmail - Admin email performing the action
 * @returns {Promise<void>}
 */
export async function updateFoodMenuItem(itemId, updates, adminId = null, adminEmail = null) {
  const docRef = doc(db, COLLECTIONS.FOOD_MENU, itemId);

  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });

  if (adminId && adminEmail) {
    const item = await getFoodMenuItem(itemId);
    await logActivity({
      type: ACTIVITY_TYPES.UPDATE,
      entityType: ENTITY_TYPES.FOOD_MENU,
      entityId: itemId,
      description: `Updated food menu item: ${item?.name || itemId}`,
      adminId,
      adminEmail,
    });
  }
}

/**
 * Deletes a food menu item
 *
 * @param {string} itemId - Food menu item document ID
 * @param {string} adminId - Admin user ID performing the action
 * @param {string} adminEmail - Admin email performing the action
 * @returns {Promise<void>}
 */
export async function deleteFoodMenuItem(itemId, adminId = null, adminEmail = null) {
  const item = await getFoodMenuItem(itemId);
  const docRef = doc(db, COLLECTIONS.FOOD_MENU, itemId);
  await deleteDoc(docRef);

  if (adminId && adminEmail) {
    await logActivity({
      type: ACTIVITY_TYPES.DELETE,
      entityType: ENTITY_TYPES.FOOD_MENU,
      entityId: itemId,
      description: `Deleted food menu item: ${item?.name || itemId}`,
      adminId,
      adminEmail,
    });
  }
}

/**
 * Gets food menu settings (e.g., whether food selection is enabled)
 *
 * @returns {Promise<Object>} Food menu settings
 */
export async function getFoodMenuSettings() {
  try {
    const settingsRef = doc(db, COLLECTIONS.CONFERENCES, FOOD_SETTINGS_DOC_ID);
    const settingsDoc = await getDoc(settingsRef);

    if (settingsDoc.exists()) {
      return {
        id: settingsDoc.id,
        ...settingsDoc.data(),
      };
    }

    return {
      id: FOOD_SETTINGS_DOC_ID,
      foodSelectionEnabled: false,
    };
  } catch (error) {
    console.error('Failed to fetch food menu settings:', error);
    return {
      id: FOOD_SETTINGS_DOC_ID,
      foodSelectionEnabled: false,
    };
  }
}

/**
 * Updates food menu settings
 *
 * @param {Object} settings - Settings to update
 * @param {string} adminId - Admin user ID performing the action
 * @param {string} adminEmail - Admin email performing the action
 * @returns {Promise<Object>} Updated settings
 */
export async function updateFoodMenuSettings(settings, adminId = null, adminEmail = null) {
  try {
    const settingsRef = doc(db, COLLECTIONS.CONFERENCES, FOOD_SETTINGS_DOC_ID);
    const settingsDoc = await getDoc(settingsRef);

    const updateData = {
      ...settings,
      updatedAt: serverTimestamp(),
    };

    delete updateData.id;

    if (settingsDoc.exists()) {
      await updateDoc(settingsRef, updateData);
    } else {
      await setDoc(settingsRef, {
        foodSelectionEnabled: false,
        ...updateData,
        createdAt: serverTimestamp(),
      });
    }

    if (adminId && adminEmail) {
      await logActivity({
        type: ACTIVITY_TYPES.SETTINGS,
        entityType: ENTITY_TYPES.FOOD_MENU,
        entityId: FOOD_SETTINGS_DOC_ID,
        description: `Updated food menu settings: Food selection ${settings.foodSelectionEnabled ? 'enabled' : 'disabled'}`,
        adminId,
        adminEmail,
      });
    }

    return { id: FOOD_SETTINGS_DOC_ID, ...settings };
  } catch (error) {
    console.error('Failed to update food menu settings:', error);
    throw error;
  }
}
