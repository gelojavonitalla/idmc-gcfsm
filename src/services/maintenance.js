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
  limit,
  startAfter,
  where,
  getCountFromServer,
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
 * Fetches registrations with pagination
 *
 * @param {Object} options - Query options
 * @param {number} [options.pageSize=50] - Number of registrations per page
 * @param {Object} [options.lastDoc] - Last document for pagination cursor
 * @param {string} [options.status] - Filter by registration status
 * @returns {Promise<Object>} { registrations, lastDoc, hasMore }
 */
export async function getRegistrations(options = {}) {
  try {
    const { pageSize = 50, lastDoc, status } = options;

    const registrationsRef = collection(db, COLLECTIONS.REGISTRATIONS);
    const constraints = [orderBy('createdAt', 'desc'), limit(pageSize + 1)];

    // Add status filter if provided
    if (status && status !== 'all') {
      constraints.unshift(where('status', '==', status));
    }

    // Add pagination cursor
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    const registrationsQuery = query(registrationsRef, ...constraints);
    const snapshot = await getDocs(registrationsQuery);

    const docs = snapshot.docs;
    const hasMore = docs.length > pageSize;

    // Remove the extra document used to check for more
    const registrations = (hasMore ? docs.slice(0, -1) : docs).map((docSnapshot) => ({
      id: docSnapshot.id,
      ...docSnapshot.data(),
      _doc: docSnapshot, // Keep reference for pagination cursor
    }));

    return {
      registrations,
      lastDoc: registrations.length > 0 ? registrations[registrations.length - 1]._doc : null,
      hasMore,
    };
  } catch (error) {
    console.error('Failed to fetch registrations:', error);
    return { registrations: [], lastDoc: null, hasMore: false };
  }
}

/**
 * Gets the total count of registrations with optional status filter
 *
 * @param {Object} filters - Optional filters
 * @param {string} [filters.status] - Filter by registration status
 * @returns {Promise<Object>} Count object with total and by-status breakdown
 */
export async function getRegistrationsCount(filters = {}) {
  try {
    const registrationsRef = collection(db, COLLECTIONS.REGISTRATIONS);

    // Get total count
    const totalSnapshot = await getCountFromServer(registrationsRef);
    const total = totalSnapshot.data().count;

    // If a specific status filter is requested, get that count too
    if (filters.status && filters.status !== 'all') {
      const statusQuery = query(registrationsRef, where('status', '==', filters.status));
      const statusSnapshot = await getCountFromServer(statusQuery);
      return {
        total,
        filtered: statusSnapshot.data().count,
      };
    }

    return { total, filtered: total };
  } catch (error) {
    console.error('Failed to get registrations count:', error);
    return { total: 0, filtered: 0 };
  }
}

/**
 * Gets registration counts broken down by status from the database.
 * This provides accurate counts from the server, not from loaded data.
 *
 * @returns {Promise<Object>} Object with count by status and total
 */
export async function getRegistrationsStatusCounts() {
  try {
    const registrationsRef = collection(db, COLLECTIONS.REGISTRATIONS);

    // Get total count
    const totalSnapshot = await getCountFromServer(registrationsRef);
    const total = totalSnapshot.data().count;

    // Get counts by status in parallel
    const statusValues = ['confirmed', 'pending_verification', 'pending_payment', 'cancelled', 'refunded'];
    const countPromises = statusValues.map(async (status) => {
      const statusQuery = query(registrationsRef, where('status', '==', status));
      const snapshot = await getCountFromServer(statusQuery);
      return { status, count: snapshot.data().count };
    });

    const statusCounts = await Promise.all(countPromises);

    // Build result object
    const result = {
      total,
      confirmed: 0,
      pendingVerification: 0,
      pendingPayment: 0,
      cancelled: 0,
      refunded: 0,
    };

    statusCounts.forEach(({ status, count }) => {
      switch (status) {
        case 'confirmed':
          result.confirmed = count;
          break;
        case 'pending_verification':
          result.pendingVerification = count;
          break;
        case 'pending_payment':
          result.pendingPayment = count;
          break;
        case 'cancelled':
          result.cancelled = count;
          break;
        case 'refunded':
          result.refunded = count;
          break;
        default:
          break;
      }
    });

    return result;
  } catch (error) {
    console.error('Failed to get registration status counts:', error);
    return {
      total: 0,
      confirmed: 0,
      pendingVerification: 0,
      pendingPayment: 0,
      cancelled: 0,
      refunded: 0,
    };
  }
}

/**
 * Searches registrations by various criteria (server-side search).
 * Searches across: registration ID, short code, email, phone, and name.
 *
 * @param {string} searchQuery - Search query string
 * @param {Object} options - Search options
 * @param {string} [options.status] - Optional status filter
 * @returns {Promise<Array>} Array of matching registrations
 */
export async function searchRegistrations(searchQuery, options = {}) {
  if (!searchQuery || searchQuery.trim().length < 2) {
    return [];
  }

  const query_str = searchQuery.trim();
  const queryLower = query_str.toLowerCase();
  const queryUpper = query_str.toUpperCase();
  const results = new Map(); // Use Map to deduplicate by ID

  try {
    const registrationsRef = collection(db, COLLECTIONS.REGISTRATIONS);

    // Build base constraints
    const baseConstraints = [];
    if (options.status && options.status !== 'all') {
      baseConstraints.push(where('status', '==', options.status));
    }

    // Strategy 1: Search by exact short code (6 chars)
    if (query_str.length === 6 && /^[A-Za-z0-9]+$/.test(query_str)) {
      const shortCodeQuery = query(
        registrationsRef,
        where('shortCode', '==', queryUpper),
        ...baseConstraints
      );
      const snapshot = await getDocs(shortCodeQuery);
      snapshot.docs.forEach((docSnap) => {
        results.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
      });
    }

    // Strategy 2: Search by short code suffix (4 chars)
    if (query_str.length === 4 && /^[A-Za-z0-9]+$/.test(query_str)) {
      const suffixQuery = query(
        registrationsRef,
        where('shortCodeSuffix', '==', queryUpper),
        ...baseConstraints
      );
      const snapshot = await getDocs(suffixQuery);
      snapshot.docs.forEach((docSnap) => {
        results.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
      });
    }

    // Strategy 3: Search by exact email
    if (query_str.includes('@')) {
      const emailQuery = query(
        registrationsRef,
        where('primaryAttendee.email', '==', queryLower),
        ...baseConstraints
      );
      const snapshot = await getDocs(emailQuery);
      snapshot.docs.forEach((docSnap) => {
        results.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
      });
    }

    // Strategy 4: Search by phone number
    const cleanPhone = query_str.replace(/[\s-]/g, '');
    if (/^\d{10,13}$/.test(cleanPhone) || /^(\+63|0)?9\d{9}$/.test(cleanPhone)) {
      const phoneQuery = query(
        registrationsRef,
        where('primaryAttendee.cellphone', '==', cleanPhone),
        ...baseConstraints
      );
      const snapshot = await getDocs(phoneQuery);
      snapshot.docs.forEach((docSnap) => {
        results.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
      });
    }

    // Strategy 5: Search by registration ID (exact match)
    if (queryUpper.startsWith('REG-') || query_str.length >= 4) {
      const possibleId = queryUpper.startsWith('REG-') ? queryUpper : `REG-2026-${queryUpper}`;
      const docRef = doc(db, COLLECTIONS.REGISTRATIONS, possibleId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (!options.status || options.status === 'all' || data.status === options.status) {
          results.set(docSnap.id, { id: docSnap.id, ...data });
        }
      }
    }

    // Strategy 6: For short queries (2-6 chars), do a broader search with client-side filtering
    // This helps find partial matches on names and codes
    if (query_str.length >= 2 && query_str.length <= 10 && results.size < 20) {
      // Build query with correct constraint order: where -> orderBy -> limit
      const broadQuery = query(
        registrationsRef,
        ...baseConstraints,
        orderBy('createdAt', 'desc'),
        limit(500)
      );
      const snapshot = await getDocs(broadQuery);

      snapshot.docs.forEach((docSnap) => {
        if (results.has(docSnap.id)) {
          return; // Skip already found
        }

        const data = docSnap.data();
        const firstName = (data.primaryAttendee?.firstName || '').toLowerCase();
        const lastName = (data.primaryAttendee?.lastName || '').toLowerCase();
        const fullName = `${firstName} ${lastName}`.trim();
        const email = (data.primaryAttendee?.email || '').toLowerCase();
        const shortCode = (data.shortCode || '').toLowerCase();
        const regId = (data.registrationId || docSnap.id).toLowerCase();

        // Check if any field contains the search query
        if (
          firstName.includes(queryLower) ||
          lastName.includes(queryLower) ||
          fullName.includes(queryLower) ||
          email.includes(queryLower) ||
          shortCode.includes(queryLower) ||
          regId.includes(queryLower)
        ) {
          results.set(docSnap.id, { id: docSnap.id, ...data });
        }
      });
    }

    // Convert Map to array and sort by createdAt desc
    return Array.from(results.values()).sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Failed to search registrations:', error);
    return [];
  }
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
