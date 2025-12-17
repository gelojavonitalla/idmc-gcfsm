/**
 * Check-in Service
 * Handles attendee check-in operations including QR scanning, manual lookup,
 * duplicate detection, and check-in statistics.
 *
 * @module services/checkin
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { COLLECTIONS, REGISTRATION_STATUS } from '../constants';

/**
 * Check-in method identifiers
 */
export const CHECK_IN_METHODS = Object.freeze({
  QR: 'qr',
  MANUAL: 'manual',
});

/**
 * Error codes for check-in operations
 */
export const CHECK_IN_ERROR_CODES = Object.freeze({
  REGISTRATION_NOT_FOUND: 'REGISTRATION_NOT_FOUND',
  ALREADY_CHECKED_IN: 'ALREADY_CHECKED_IN',
  NOT_CONFIRMED: 'NOT_CONFIRMED',
  CANCELLED: 'CANCELLED',
  INVALID_QR_CODE: 'INVALID_QR_CODE',
  UPDATE_FAILED: 'UPDATE_FAILED',
});

/**
 * Validates a registration for check-in eligibility
 *
 * @param {Object} registration - Registration document
 * @returns {{ valid: boolean, errorCode: string|null, message: string }}
 */
export function validateCheckInEligibility(registration) {
  if (!registration) {
    return {
      valid: false,
      errorCode: CHECK_IN_ERROR_CODES.REGISTRATION_NOT_FOUND,
      message: 'Registration not found',
    };
  }

  if (registration.checkedIn) {
    const checkedInAt = registration.checkedInAt?.toDate?.() || registration.checkedInAt;
    const timeString = checkedInAt
      ? new Date(checkedInAt).toLocaleTimeString('en-PH', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'earlier';
    return {
      valid: false,
      errorCode: CHECK_IN_ERROR_CODES.ALREADY_CHECKED_IN,
      message: `Already checked in at ${timeString}`,
    };
  }

  if (registration.status === REGISTRATION_STATUS.CANCELLED) {
    return {
      valid: false,
      errorCode: CHECK_IN_ERROR_CODES.CANCELLED,
      message: 'Registration has been cancelled',
    };
  }

  if (registration.status !== REGISTRATION_STATUS.CONFIRMED) {
    return {
      valid: false,
      errorCode: CHECK_IN_ERROR_CODES.NOT_CONFIRMED,
      message: 'Payment not yet confirmed',
    };
  }

  return { valid: true, errorCode: null, message: 'Eligible for check-in' };
}

/**
 * Parses QR code data to extract registration ID
 *
 * @param {string} qrData - Raw QR code data
 * @returns {{ valid: boolean, registrationId: string|null }}
 */
export function parseQRCode(qrData) {
  if (!qrData || typeof qrData !== 'string') {
    return { valid: false, registrationId: null };
  }

  const trimmed = qrData.trim().toUpperCase();

  // QR code should contain the registration ID directly (e.g., REG-2026-A7K3)
  if (trimmed.startsWith('REG-')) {
    return { valid: true, registrationId: trimmed };
  }

  // Try parsing as JSON (in case QR contains structured data)
  try {
    const parsed = JSON.parse(qrData);
    if (parsed.registrationId) {
      return { valid: true, registrationId: parsed.registrationId.toUpperCase() };
    }
  } catch {
    // Not JSON, continue
  }

  return { valid: false, registrationId: null };
}

/**
 * Gets a registration by its ID for check-in purposes
 *
 * @param {string} registrationId - Registration ID
 * @returns {Promise<Object|null>} Registration data or null
 */
export async function getRegistrationForCheckIn(registrationId) {
  if (!registrationId) {
    return null;
  }

  const docRef = doc(db, COLLECTIONS.REGISTRATIONS, registrationId);
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
 * Searches for registrations by name, email, phone, or short code
 *
 * @param {string} searchTerm - Search query
 * @returns {Promise<Array>} Array of matching registrations
 */
export async function searchRegistrations(searchTerm) {
  if (!searchTerm || searchTerm.trim().length < 2) {
    return [];
  }

  const normalizedTerm = searchTerm.trim().toLowerCase();
  const registrationsRef = collection(db, COLLECTIONS.REGISTRATIONS);
  const results = [];
  const seenIds = new Set();

  // Search by email (exact match, case-insensitive)
  if (normalizedTerm.includes('@')) {
    const emailQuery = query(
      registrationsRef,
      where('primaryAttendee.email', '==', normalizedTerm)
    );
    const emailSnapshot = await getDocs(emailQuery);
    emailSnapshot.forEach((docSnap) => {
      if (!seenIds.has(docSnap.id)) {
        seenIds.add(docSnap.id);
        results.push({ id: docSnap.id, ...docSnap.data() });
      }
    });
  }

  // Search by short code (exact match)
  const upperTerm = searchTerm.trim().toUpperCase();
  if (upperTerm.length === 4 && /^[A-Z0-9]+$/.test(upperTerm)) {
    const codeQuery = query(
      registrationsRef,
      where('shortCode', '==', upperTerm)
    );
    const codeSnapshot = await getDocs(codeQuery);
    codeSnapshot.forEach((docSnap) => {
      if (!seenIds.has(docSnap.id)) {
        seenIds.add(docSnap.id);
        results.push({ id: docSnap.id, ...docSnap.data() });
      }
    });
  }

  // Search by registration ID (exact match)
  if (upperTerm.startsWith('REG-')) {
    const regDoc = await getRegistrationForCheckIn(upperTerm);
    if (regDoc && !seenIds.has(regDoc.id)) {
      seenIds.add(regDoc.id);
      results.push(regDoc);
    }
  }

  // Name/phone search requires 3+ characters to reduce unnecessary fetches
  // This fallback only runs when email/code/ID searches found nothing
  if (results.length === 0 && normalizedTerm.length >= 3) {
    // Fetch confirmed registrations in batches for client-side filtering
    // Limit to 200 docs (~80-160KB) for acceptable performance on mobile
    const confirmedQuery = query(
      registrationsRef,
      where('status', '==', REGISTRATION_STATUS.CONFIRMED),
      limit(200)
    );
    const confirmedSnapshot = await getDocs(confirmedQuery);

    confirmedSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const fullName = `${data.primaryAttendee?.firstName || ''} ${data.primaryAttendee?.lastName || ''}`.toLowerCase();
      const phone = (data.primaryAttendee?.cellphone || '').replace(/[\s-]/g, '');

      if (
        fullName.includes(normalizedTerm) ||
        phone.includes(normalizedTerm.replace(/[\s-]/g, ''))
      ) {
        if (!seenIds.has(docSnap.id)) {
          seenIds.add(docSnap.id);
          results.push({ id: docSnap.id, ...data });
        }
      }
    });
  }

  return results.slice(0, 20);
}

/**
 * Checks in an attendee
 *
 * @param {string} registrationId - Registration ID to check in
 * @param {Object} checkInData - Check-in details
 * @param {string} checkInData.adminId - Admin user ID performing check-in
 * @param {string} checkInData.adminName - Admin display name
 * @param {string} checkInData.method - Check-in method (qr or manual)
 * @param {string} [checkInData.stationId] - Optional check-in station identifier
 * @returns {Promise<Object>} Updated registration data
 * @throws {Error} If check-in fails
 */
export async function checkInAttendee(registrationId, checkInData) {
  const { adminId, adminName, method, stationId } = checkInData;

  if (!registrationId || !adminId) {
    const error = new Error('Registration ID and admin ID are required');
    error.code = CHECK_IN_ERROR_CODES.UPDATE_FAILED;
    throw error;
  }

  // Get registration
  const registration = await getRegistrationForCheckIn(registrationId);

  // Validate eligibility
  const validation = validateCheckInEligibility(registration);
  if (!validation.valid) {
    const error = new Error(validation.message);
    error.code = validation.errorCode;
    error.registration = registration;
    throw error;
  }

  // Perform check-in update
  const docRef = doc(db, COLLECTIONS.REGISTRATIONS, registrationId);
  const checkInTimestamp = serverTimestamp();

  await updateDoc(docRef, {
    checkedIn: true,
    checkedInAt: checkInTimestamp,
    checkedInBy: adminId,
    checkedInByName: adminName || null,
    checkInMethod: method || CHECK_IN_METHODS.MANUAL,
    updatedAt: checkInTimestamp,
  });

  // Create check-in log entry
  const logRef = collection(db, COLLECTIONS.CHECK_IN_LOGS);
  await addDoc(logRef, {
    registrationId,
    attendeeName: `${registration.primaryAttendee?.firstName || ''} ${registration.primaryAttendee?.lastName || ''}`.trim(),
    attendeeEmail: registration.primaryAttendee?.email || '',
    category: registration.pricingTier || 'standard',
    church: registration.church?.name || null,
    checkedInAt: checkInTimestamp,
    checkedInBy: adminId,
    checkedInByName: adminName || null,
    checkInMethod: method || CHECK_IN_METHODS.MANUAL,
    stationId: stationId || null,
    attendeeCount: 1 + (registration.additionalAttendees?.length || 0),
    createdAt: checkInTimestamp,
  });

  return {
    ...registration,
    checkedIn: true,
    checkedInAt: new Date(),
    checkedInBy: adminId,
    checkedInByName: adminName,
    checkInMethod: method,
  };
}

/**
 * Gets check-in statistics
 *
 * @returns {Promise<Object>} Check-in statistics
 */
export async function getCheckInStats() {
  const registrationsRef = collection(db, COLLECTIONS.REGISTRATIONS);

  // Get all confirmed registrations
  const confirmedQuery = query(
    registrationsRef,
    where('status', '==', REGISTRATION_STATUS.CONFIRMED)
  );
  const confirmedSnapshot = await getDocs(confirmedQuery);

  let totalConfirmed = 0;
  let checkedIn = 0;
  let totalAttendees = 0;
  let checkedInAttendees = 0;

  confirmedSnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    totalConfirmed++;
    const attendeeCount = 1 + (data.additionalAttendees?.length || 0);
    totalAttendees += attendeeCount;

    if (data.checkedIn) {
      checkedIn++;
      checkedInAttendees += attendeeCount;
    }
  });

  const percentage = totalConfirmed > 0 ? Math.round((checkedIn / totalConfirmed) * 100) : 0;
  const attendeePercentage = totalAttendees > 0 ? Math.round((checkedInAttendees / totalAttendees) * 100) : 0;

  return {
    totalConfirmed,
    checkedIn,
    pending: totalConfirmed - checkedIn,
    percentage,
    totalAttendees,
    checkedInAttendees,
    pendingAttendees: totalAttendees - checkedInAttendees,
    attendeePercentage,
  };
}

/**
 * Gets recent check-ins
 *
 * @param {number} [count=10] - Number of recent check-ins to retrieve
 * @returns {Promise<Array>} Array of recent check-in logs
 */
export async function getRecentCheckIns(count = 10) {
  const logsRef = collection(db, COLLECTIONS.CHECK_IN_LOGS);
  const recentQuery = query(
    logsRef,
    orderBy('checkedInAt', 'desc'),
    limit(count)
  );

  const snapshot = await getDocs(recentQuery);
  const results = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    results.push({
      id: docSnap.id,
      ...data,
      checkedInAt: data.checkedInAt?.toDate?.() || data.checkedInAt,
    });
  });

  return results;
}

/**
 * Subscribes to real-time check-in stats updates
 *
 * @param {Function} callback - Callback function receiving stats updates
 * @returns {Function} Unsubscribe function
 */
export function subscribeToCheckInStats(callback) {
  const registrationsRef = collection(db, COLLECTIONS.REGISTRATIONS);
  const confirmedQuery = query(
    registrationsRef,
    where('status', '==', REGISTRATION_STATUS.CONFIRMED)
  );

  return onSnapshot(confirmedQuery, (snapshot) => {
    let totalConfirmed = 0;
    let checkedIn = 0;
    let totalAttendees = 0;
    let checkedInAttendees = 0;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      totalConfirmed++;
      const attendeeCount = 1 + (data.additionalAttendees?.length || 0);
      totalAttendees += attendeeCount;

      if (data.checkedIn) {
        checkedIn++;
        checkedInAttendees += attendeeCount;
      }
    });

    const percentage = totalConfirmed > 0 ? Math.round((checkedIn / totalConfirmed) * 100) : 0;
    const attendeePercentage = totalAttendees > 0 ? Math.round((checkedInAttendees / totalAttendees) * 100) : 0;

    callback({
      totalConfirmed,
      checkedIn,
      pending: totalConfirmed - checkedIn,
      percentage,
      totalAttendees,
      checkedInAttendees,
      pendingAttendees: totalAttendees - checkedInAttendees,
      attendeePercentage,
    });
  });
}

/**
 * Subscribes to real-time recent check-ins updates
 *
 * @param {number} count - Number of recent check-ins to retrieve
 * @param {Function} callback - Callback function receiving updates
 * @returns {Function} Unsubscribe function
 */
export function subscribeToRecentCheckIns(count, callback) {
  const logsRef = collection(db, COLLECTIONS.CHECK_IN_LOGS);
  const recentQuery = query(
    logsRef,
    orderBy('checkedInAt', 'desc'),
    limit(count)
  );

  return onSnapshot(recentQuery, (snapshot) => {
    const results = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      results.push({
        id: docSnap.id,
        ...data,
        checkedInAt: data.checkedInAt?.toDate?.() || data.checkedInAt,
      });
    });
    callback(results);
  });
}

/**
 * Gets check-in statistics by hour for charts
 *
 * @returns {Promise<Array>} Array of hourly check-in counts
 */
export async function getCheckInsByHour() {
  const logsRef = collection(db, COLLECTIONS.CHECK_IN_LOGS);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = Timestamp.fromDate(today);

  const todayQuery = query(
    logsRef,
    where('checkedInAt', '>=', todayTimestamp),
    orderBy('checkedInAt', 'asc')
  );

  const snapshot = await getDocs(todayQuery);
  const hourlyData = {};

  // Initialize hours 7 AM to 6 PM
  for (let hour = 7; hour <= 18; hour++) {
    const hourLabel = hour < 12 ? `${hour}AM` : hour === 12 ? '12PM' : `${hour - 12}PM`;
    hourlyData[hourLabel] = 0;
  }

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const checkInTime = data.checkedInAt?.toDate?.();
    if (checkInTime) {
      const hour = checkInTime.getHours();
      const hourLabel = hour < 12 ? `${hour}AM` : hour === 12 ? '12PM' : `${hour - 12}PM`;
      if (hourlyData[hourLabel] !== undefined) {
        hourlyData[hourLabel]++;
      }
    }
  });

  return Object.entries(hourlyData).map(([hour, count]) => ({
    hour,
    count,
  }));
}

/**
 * Undoes a check-in (admin recovery function)
 *
 * @param {string} registrationId - Registration ID
 * @param {string} adminId - Admin user ID performing the undo
 * @param {string} reason - Reason for undoing check-in
 * @returns {Promise<void>}
 */
export async function undoCheckIn(registrationId, adminId, reason) {
  if (!registrationId || !adminId) {
    throw new Error('Registration ID and admin ID are required');
  }

  const docRef = doc(db, COLLECTIONS.REGISTRATIONS, registrationId);

  await updateDoc(docRef, {
    checkedIn: false,
    checkedInAt: null,
    checkedInBy: null,
    checkedInByName: null,
    checkInMethod: null,
    checkInUndoneAt: serverTimestamp(),
    checkInUndoneBy: adminId,
    checkInUndoReason: reason || null,
    updatedAt: serverTimestamp(),
  });
}
