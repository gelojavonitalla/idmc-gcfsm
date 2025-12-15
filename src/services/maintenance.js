/**
 * Maintenance Service
 * Provides CRUD operations for managing seeded content (speakers, sessions, workshops, FAQ).
 * This service is used by IDMC team members in the maintenance page.
 *
 * @module services/maintenance
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

/**
 * Generic function to fetch all documents from a collection
 *
 * @param {string} collectionName - Name of the Firestore collection
 * @param {string} [orderField='order'] - Field to order results by
 * @returns {Promise<Array>} Array of documents with their IDs
 */
async function getAllDocuments(collectionName, orderField = 'order') {
  const collectionRef = collection(db, collectionName);
  const orderedQuery = query(collectionRef, orderBy(orderField, 'asc'));

  const snapshot = await getDocs(orderedQuery);

  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }));
}

/**
 * Generic function to get a single document by ID
 *
 * @param {string} collectionName - Name of the Firestore collection
 * @param {string} documentId - Document ID to fetch
 * @returns {Promise<Object|null>} Document data or null if not found
 */
async function getDocumentById(collectionName, documentId) {
  if (!documentId) {
    return null;
  }

  const docRef = doc(db, collectionName, documentId);
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
 * Generic function to create or update a document
 *
 * @param {string} collectionName - Name of the Firestore collection
 * @param {string} documentId - Document ID
 * @param {Object} data - Document data to save
 * @param {boolean} [merge=false] - Whether to merge with existing data
 * @returns {Promise<Object>} Saved document data
 */
async function saveDocument(collectionName, documentId, data, merge = false) {
  const docRef = doc(db, collectionName, documentId);
  const timestamp = serverTimestamp();

  const docData = {
    ...data,
    updatedAt: timestamp,
  };

  const existing = await getDoc(docRef);
  if (!existing.exists()) {
    docData.createdAt = timestamp;
  }

  await setDoc(docRef, docData, { merge });

  return {
    id: documentId,
    ...data,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Generic function to update specific fields of a document
 *
 * @param {string} collectionName - Name of the Firestore collection
 * @param {string} documentId - Document ID to update
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
async function updateDocument(collectionName, documentId, updates) {
  const docRef = doc(db, collectionName, documentId);

  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Generic function to delete a document
 *
 * @param {string} collectionName - Name of the Firestore collection
 * @param {string} documentId - Document ID to delete
 * @returns {Promise<void>}
 */
async function removeDocument(collectionName, documentId) {
  const docRef = doc(db, collectionName, documentId);
  await deleteDoc(docRef);
}

/**
 * Fetches all speakers including drafts
 *
 * @returns {Promise<Array>} Array of all speakers
 */
export async function getAllSpeakers() {
  return getAllDocuments(COLLECTIONS.SPEAKERS, 'order');
}

/**
 * Gets a speaker by ID
 *
 * @param {string} speakerId - Speaker document ID
 * @returns {Promise<Object|null>} Speaker data or null
 */
export async function getSpeaker(speakerId) {
  return getDocumentById(COLLECTIONS.SPEAKERS, speakerId);
}

/**
 * Creates or updates a speaker
 *
 * @param {string} speakerId - Speaker document ID
 * @param {Object} speakerData - Speaker data to save
 * @returns {Promise<Object>} Saved speaker data
 */
export async function saveSpeaker(speakerId, speakerData) {
  return saveDocument(COLLECTIONS.SPEAKERS, speakerId, speakerData);
}

/**
 * Updates specific fields of a speaker
 *
 * @param {string} speakerId - Speaker document ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export async function updateSpeaker(speakerId, updates) {
  return updateDocument(COLLECTIONS.SPEAKERS, speakerId, updates);
}

/**
 * Deletes a speaker
 *
 * @param {string} speakerId - Speaker document ID
 * @returns {Promise<void>}
 */
export async function deleteSpeaker(speakerId) {
  return removeDocument(COLLECTIONS.SPEAKERS, speakerId);
}

/**
 * Fetches all sessions including drafts
 *
 * @returns {Promise<Array>} Array of all sessions
 */
export async function getAllSessions() {
  return getAllDocuments(COLLECTIONS.SESSIONS, 'order');
}

/**
 * Gets a session by ID
 *
 * @param {string} sessionId - Session document ID
 * @returns {Promise<Object|null>} Session data or null
 */
export async function getSession(sessionId) {
  return getDocumentById(COLLECTIONS.SESSIONS, sessionId);
}

/**
 * Creates or updates a session
 *
 * @param {string} sessionId - Session document ID
 * @param {Object} sessionData - Session data to save
 * @returns {Promise<Object>} Saved session data
 */
export async function saveSession(sessionId, sessionData) {
  return saveDocument(COLLECTIONS.SESSIONS, sessionId, sessionData);
}

/**
 * Updates specific fields of a session
 *
 * @param {string} sessionId - Session document ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export async function updateSession(sessionId, updates) {
  return updateDocument(COLLECTIONS.SESSIONS, sessionId, updates);
}

/**
 * Deletes a session
 *
 * @param {string} sessionId - Session document ID
 * @returns {Promise<void>}
 */
export async function deleteSession(sessionId) {
  return removeDocument(COLLECTIONS.SESSIONS, sessionId);
}

/**
 * Fetches all FAQ items including drafts
 *
 * @returns {Promise<Array>} Array of all FAQ items
 */
export async function getAllFAQs() {
  return getAllDocuments(COLLECTIONS.FAQ, 'order');
}

/**
 * Gets an FAQ by ID
 *
 * @param {string} faqId - FAQ document ID
 * @returns {Promise<Object|null>} FAQ data or null
 */
export async function getFAQ(faqId) {
  return getDocumentById(COLLECTIONS.FAQ, faqId);
}

/**
 * Creates or updates an FAQ
 *
 * @param {string} faqId - FAQ document ID
 * @param {Object} faqData - FAQ data to save
 * @returns {Promise<Object>} Saved FAQ data
 */
export async function saveFAQ(faqId, faqData) {
  return saveDocument(COLLECTIONS.FAQ, faqId, faqData);
}

/**
 * Updates specific fields of an FAQ
 *
 * @param {string} faqId - FAQ document ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export async function updateFAQ(faqId, updates) {
  return updateDocument(COLLECTIONS.FAQ, faqId, updates);
}

/**
 * Deletes an FAQ
 *
 * @param {string} faqId - FAQ document ID
 * @returns {Promise<void>}
 */
export async function deleteFAQ(faqId) {
  return removeDocument(COLLECTIONS.FAQ, faqId);
}

/**
 * Fetches all registrations
 *
 * @returns {Promise<Array>} Array of all registrations
 */
export async function getAllRegistrations() {
  const collectionRef = collection(db, COLLECTIONS.REGISTRATIONS);
  const orderedQuery = query(collectionRef, orderBy('createdAt', 'desc'));

  const snapshot = await getDocs(orderedQuery);

  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }));
}

/**
 * Gets a registration by ID
 *
 * @param {string} registrationId - Registration document ID
 * @returns {Promise<Object|null>} Registration data or null
 */
export async function getRegistration(registrationId) {
  return getDocumentById(COLLECTIONS.REGISTRATIONS, registrationId);
}

/**
 * Updates a registration status
 *
 * @param {string} registrationId - Registration document ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export async function updateRegistration(registrationId, updates) {
  return updateDocument(COLLECTIONS.REGISTRATIONS, registrationId, updates);
}

/**
 * Fetches all contact inquiries
 *
 * @returns {Promise<Array>} Array of all contact inquiries
 */
export async function getAllContactInquiries() {
  const collectionRef = collection(db, COLLECTIONS.CONTACT_INQUIRIES);
  const orderedQuery = query(collectionRef, orderBy('createdAt', 'desc'));

  const snapshot = await getDocs(orderedQuery);

  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }));
}

/**
 * Updates a contact inquiry status
 *
 * @param {string} inquiryId - Inquiry document ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export async function updateContactInquiry(inquiryId, updates) {
  return updateDocument(COLLECTIONS.CONTACT_INQUIRIES, inquiryId, updates);
}
