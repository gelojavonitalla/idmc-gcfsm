/**
 * Workshops Service
 * Provides functions to fetch workshop data from Firestore.
 * Workshops are sessions with sessionType "workshop" that have additional
 * fields for track, category, and capacity management.
 *
 * @module services/workshops
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
import {
  COLLECTIONS,
  SESSION_STATUS,
  SESSION_TYPES,
} from '../constants';

/**
 * Fetches all published workshop sessions from Firestore, ordered by their schedule order.
 * Workshops are sessions where sessionType equals "workshop".
 *
 * @returns {Promise<Array>} Array of published workshop session objects
 * @throws {Error} If the Firestore query fails
 */
export async function getPublishedWorkshops() {
  const sessionsRef = collection(db, COLLECTIONS.SESSIONS);
  const workshopsQuery = query(
    sessionsRef,
    where('sessionType', '==', SESSION_TYPES.WORKSHOP),
    where('status', '==', SESSION_STATUS.PUBLISHED),
    orderBy('order', 'asc')
  );

  const snapshot = await getDocs(workshopsQuery);

  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }));
}

/**
 * Fetches a single workshop by its document ID.
 *
 * @param {string} workshopId - The workshop's document ID
 * @returns {Promise<Object|null>} The workshop object or null if not found
 * @throws {Error} If the Firestore query fails
 */
export async function getWorkshopById(workshopId) {
  if (!workshopId) {
    return null;
  }

  const workshopRef = doc(db, COLLECTIONS.SESSIONS, workshopId);
  const snapshot = await getDoc(workshopRef);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();

  if (data.sessionType !== SESSION_TYPES.WORKSHOP) {
    return null;
  }

  return {
    id: snapshot.id,
    ...data,
  };
}

/**
 * Fetches all published workshops for a specific category.
 *
 * @param {string} category - The workshop category to filter by
 * @returns {Promise<Array>} Array of workshop objects for the specified category
 * @throws {Error} If the Firestore query fails
 */
export async function getWorkshopsByCategory(category) {
  if (!category) {
    return [];
  }

  const sessionsRef = collection(db, COLLECTIONS.SESSIONS);
  const categoryQuery = query(
    sessionsRef,
    where('sessionType', '==', SESSION_TYPES.WORKSHOP),
    where('category', '==', category),
    where('status', '==', SESSION_STATUS.PUBLISHED),
    orderBy('order', 'asc')
  );

  const snapshot = await getDocs(categoryQuery);

  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }));
}

/**
 * Fetches all published workshops for a specific time slot.
 * Used for registration selection where attendees choose one workshop per time slot.
 *
 * @param {string} timeSlot - The time slot identifier (e.g., "day1_afternoon")
 * @returns {Promise<Array>} Array of workshop objects for the specified time slot
 * @throws {Error} If the Firestore query fails
 */
export async function getWorkshopsByTimeSlot(timeSlot) {
  if (!timeSlot) {
    return [];
  }

  const sessionsRef = collection(db, COLLECTIONS.SESSIONS);
  const timeSlotQuery = query(
    sessionsRef,
    where('sessionType', '==', SESSION_TYPES.WORKSHOP),
    where('timeSlot', '==', timeSlot),
    where('status', '==', SESSION_STATUS.PUBLISHED),
    orderBy('order', 'asc')
  );

  const snapshot = await getDocs(timeSlotQuery);

  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }));
}

/**
 * Checks if a workshop has available capacity.
 * Returns true if capacity is not set (unlimited) or if registeredCount < capacity.
 *
 * @param {Object} workshop - The workshop object to check
 * @param {number|null} workshop.capacity - Maximum capacity (null for unlimited)
 * @param {number} workshop.registeredCount - Current number of registered attendees
 * @returns {boolean} True if the workshop has available spots
 */
export function hasAvailableCapacity(workshop) {
  if (!workshop) {
    return false;
  }

  if (workshop.capacity === null || workshop.capacity === undefined) {
    return true;
  }

  return workshop.registeredCount < workshop.capacity;
}

/**
 * Gets the remaining capacity for a workshop.
 * Returns null if capacity is unlimited.
 *
 * @param {Object} workshop - The workshop object
 * @param {number|null} workshop.capacity - Maximum capacity (null for unlimited)
 * @param {number} workshop.registeredCount - Current number of registered attendees
 * @returns {number|null} Remaining spots or null if unlimited
 */
export function getRemainingCapacity(workshop) {
  if (!workshop) {
    return null;
  }

  if (workshop.capacity === null || workshop.capacity === undefined) {
    return null;
  }

  return Math.max(0, workshop.capacity - (workshop.registeredCount || 0));
}

/**
 * Groups workshops by their time slot.
 *
 * @param {Array} workshops - Array of workshop objects
 * @returns {Object} Object with time slot IDs as keys and arrays of workshops as values
 */
export function groupWorkshopsByTimeSlot(workshops) {
  if (!Array.isArray(workshops)) {
    return {};
  }

  return workshops.reduce((groups, workshop) => {
    const timeSlot = workshop.timeSlot || 'unspecified';
    if (!groups[timeSlot]) {
      groups[timeSlot] = [];
    }
    groups[timeSlot].push(workshop);
    return groups;
  }, {});
}
