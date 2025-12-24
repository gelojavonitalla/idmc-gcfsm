/**
 * Feedback Service
 * Provides functions to submit event feedback to Firestore.
 *
 * @module services/feedback
 */

import { collection, addDoc, serverTimestamp, getDocs, doc, deleteDoc, getDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { COLLECTIONS } from '../constants';
import { logActivity, ACTIVITY_TYPES, ENTITY_TYPES } from './activityLog';

/**
 * Processes a value for storage, trimming strings and handling nested objects.
 *
 * @param {*} value - The value to process
 * @returns {*} The processed value
 */
function processValue(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    // Handle nested objects (e.g., checkboxGroup values)
    const processed = {};
    let hasValue = false;
    Object.entries(value).forEach(([key, val]) => {
      if (typeof val === 'boolean' && val) {
        processed[key] = val;
        hasValue = true;
      }
    });
    // Return the object only if it has truthy values, otherwise null
    return hasValue ? processed : null;
  }

  return value;
}

/**
 * Submits event feedback to Firestore.
 * Accepts dynamic field data based on form configuration.
 *
 * @param {Object} feedbackData - The feedback data (dynamic key-value pairs)
 * @returns {Promise<string>} The ID of the created feedback document
 * @throws {Error} If the Firestore operation fails
 */
export async function submitFeedback(feedbackData) {
  if (!feedbackData || typeof feedbackData !== 'object') {
    throw new Error('Invalid feedback data');
  }

  const feedbackRef = collection(db, COLLECTIONS.FEEDBACK);

  // Process all fields
  const processedData = {};
  Object.entries(feedbackData).forEach(([key, value]) => {
    const processed = processValue(value);
    // Only include non-null values to keep documents clean
    if (processed !== null) {
      processedData[key] = processed;
    }
  });

  // Add metadata
  const docData = {
    ...processedData,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(feedbackRef, docData);

  return docRef.id;
}

/**
 * Retrieves all feedback responses from Firestore.
 * Ordered by creation date (newest first).
 *
 * @returns {Promise<Array>} Array of feedback response objects with IDs
 * @throws {Error} If the Firestore operation fails
 */
export async function getFeedbackResponses() {
  const feedbackRef = collection(db, COLLECTIONS.FEEDBACK);
  const feedbackQuery = query(feedbackRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(feedbackQuery);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

/**
 * Deletes a feedback response from Firestore.
 *
 * @param {string} feedbackId - The ID of the feedback to delete
 * @param {string} adminId - Admin user ID who performed the action
 * @param {string} adminEmail - Admin email for display
 * @returns {Promise<void>}
 * @throws {Error} If the Firestore operation fails or feedbackId is invalid
 */
export async function deleteFeedbackResponse(feedbackId, adminId = null, adminEmail = null) {
  if (!feedbackId || typeof feedbackId !== 'string') {
    throw new Error('Invalid feedback ID');
  }

  const feedbackDocRef = doc(db, COLLECTIONS.FEEDBACK, feedbackId);

  // Get feedback data before deletion for logging
  const feedbackSnap = await getDoc(feedbackDocRef);
  const feedbackData = feedbackSnap.exists() ? feedbackSnap.data() : null;

  await deleteDoc(feedbackDocRef);

  // Log the activity
  if (adminId && adminEmail) {
    await logActivity({
      type: ACTIVITY_TYPES.DELETE,
      entityType: ENTITY_TYPES.FEEDBACK,
      entityId: feedbackId,
      description: `Deleted feedback response: ${feedbackId}`,
      adminId,
      adminEmail,
    });
  }
}
