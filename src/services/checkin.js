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
import { COLLECTIONS, REGISTRATION_STATUS, STATS_DOC_ID } from '../constants';
import { logActivity, ACTIVITY_TYPES, ENTITY_TYPES } from './activityLog';

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
  ATTENDEE_ALREADY_CHECKED_IN: 'ATTENDEE_ALREADY_CHECKED_IN',
  ATTENDEE_NOT_FOUND: 'ATTENDEE_NOT_FOUND',
  NOT_CONFIRMED: 'NOT_CONFIRMED',
  CANCELLED: 'CANCELLED',
  INVALID_QR_CODE: 'INVALID_QR_CODE',
  UPDATE_FAILED: 'UPDATE_FAILED',
});

/**
 * Validates a registration for check-in eligibility (legacy - checks entire registration)
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

  // Check if ALL attendees are checked in (legacy behavior)
  const allCheckedIn = areAllAttendeesCheckedIn(registration);
  if (allCheckedIn) {
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
 * Validates a specific attendee for check-in eligibility
 *
 * @param {Object} registration - Registration document
 * @param {number} attendeeIndex - Index of the attendee (0 for primary, 1+ for additional)
 * @returns {{ valid: boolean, errorCode: string|null, message: string, attendeeName: string|null }}
 */
export function validateAttendeeCheckInEligibility(registration, attendeeIndex) {
  if (!registration) {
    return {
      valid: false,
      errorCode: CHECK_IN_ERROR_CODES.REGISTRATION_NOT_FOUND,
      message: 'Registration not found',
      attendeeName: null,
    };
  }

  if (registration.status === REGISTRATION_STATUS.CANCELLED) {
    return {
      valid: false,
      errorCode: CHECK_IN_ERROR_CODES.CANCELLED,
      message: 'Registration has been cancelled',
      attendeeName: null,
    };
  }

  if (registration.status !== REGISTRATION_STATUS.CONFIRMED) {
    return {
      valid: false,
      errorCode: CHECK_IN_ERROR_CODES.NOT_CONFIRMED,
      message: 'Payment not yet confirmed',
      attendeeName: null,
    };
  }

  // Get attendee info
  const attendeeInfo = getAttendeeByIndex(registration, attendeeIndex);
  if (!attendeeInfo) {
    return {
      valid: false,
      errorCode: CHECK_IN_ERROR_CODES.ATTENDEE_NOT_FOUND,
      message: `Attendee #${attendeeIndex + 1} not found in this registration`,
      attendeeName: null,
    };
  }

  const attendeeName = `${attendeeInfo.firstName || ''} ${attendeeInfo.lastName || ''}`.trim();

  // Check if this specific attendee is already checked in
  const checkInStatus = getAttendeeCheckInStatus(registration, attendeeIndex);
  if (checkInStatus?.checkedIn) {
    const checkedInAt = checkInStatus.checkedInAt?.toDate?.() || checkInStatus.checkedInAt;
    const timeString = checkedInAt
      ? new Date(checkedInAt).toLocaleTimeString('en-PH', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'earlier';
    return {
      valid: false,
      errorCode: CHECK_IN_ERROR_CODES.ATTENDEE_ALREADY_CHECKED_IN,
      message: `${attendeeName} already checked in at ${timeString}`,
      attendeeName,
    };
  }

  return { valid: true, errorCode: null, message: 'Eligible for check-in', attendeeName };
}

/**
 * Gets attendee information by index
 *
 * @param {Object} registration - Registration document
 * @param {number} attendeeIndex - Index of the attendee (0 for primary, 1+ for additional)
 * @returns {Object|null} Attendee data or null if not found
 */
export function getAttendeeByIndex(registration, attendeeIndex) {
  if (!registration) {
    return null;
  }

  if (attendeeIndex === 0) {
    return registration.primaryAttendee || null;
  }

  const additionalIndex = attendeeIndex - 1;
  return registration.additionalAttendees?.[additionalIndex] || null;
}

/**
 * Gets the check-in status for a specific attendee
 *
 * @param {Object} registration - Registration document
 * @param {number} attendeeIndex - Index of the attendee (0 for primary, 1+ for additional)
 * @returns {Object|null} Check-in status object or null
 */
export function getAttendeeCheckInStatus(registration, attendeeIndex) {
  if (!registration) {
    return null;
  }

  // If attendeeCheckIns array exists, use it (new per-attendee tracking)
  if (registration.attendeeCheckIns && Array.isArray(registration.attendeeCheckIns)) {
    return registration.attendeeCheckIns[attendeeIndex] || null;
  }

  // Fallback to legacy behavior: if checkedIn is true, all attendees are considered checked in
  if (registration.checkedIn) {
    return {
      checkedIn: true,
      checkedInAt: registration.checkedInAt,
      checkedInBy: registration.checkedInBy,
      checkInMethod: registration.checkInMethod,
    };
  }

  return { checkedIn: false };
}

/**
 * Checks if all attendees in a registration are checked in
 *
 * @param {Object} registration - Registration document
 * @returns {boolean} True if all attendees are checked in
 */
export function areAllAttendeesCheckedIn(registration) {
  if (!registration) {
    return false;
  }

  const totalAttendees = 1 + (registration.additionalAttendees?.length || 0);

  // If attendeeCheckIns array exists, check each attendee
  if (registration.attendeeCheckIns && Array.isArray(registration.attendeeCheckIns)) {
    if (registration.attendeeCheckIns.length < totalAttendees) {
      return false;
    }
    return registration.attendeeCheckIns.every((checkIn) => checkIn?.checkedIn === true);
  }

  // Fallback to legacy behavior
  return registration.checkedIn === true;
}

/**
 * Gets the count of checked-in attendees for a registration
 *
 * @param {Object} registration - Registration document
 * @returns {number} Number of checked-in attendees
 */
export function getCheckedInAttendeeCount(registration) {
  if (!registration) {
    return 0;
  }

  const totalAttendees = 1 + (registration.additionalAttendees?.length || 0);

  // If attendeeCheckIns array exists, count checked-in attendees
  if (registration.attendeeCheckIns && Array.isArray(registration.attendeeCheckIns)) {
    return registration.attendeeCheckIns.filter((checkIn) => checkIn?.checkedIn === true).length;
  }

  // Fallback to legacy behavior
  return registration.checkedIn ? totalAttendees : 0;
}

/**
 * Parses QR code data to extract registration ID and attendee index
 *
 * Supports formats:
 * - REG-2026-XXXXXX (legacy - no attendee index, defaults to null)
 * - REG-2026-XXXXXX-0 (new - primary attendee)
 * - REG-2026-XXXXXX-1 (new - additional attendee 1)
 *
 * @param {string} qrData - Raw QR code data
 * @returns {{ valid: boolean, registrationId: string|null, attendeeIndex: number|null }}
 */
export function parseQRCode(qrData) {
  if (!qrData || typeof qrData !== 'string') {
    return { valid: false, registrationId: null, attendeeIndex: null };
  }

  const trimmed = qrData.trim().toUpperCase();

  // QR code format: REG-YYYY-XXXXXX or REG-YYYY-XXXXXX-N
  if (trimmed.startsWith('REG-')) {
    // Check for new format with attendee index: REG-2026-XXXXXX-N
    const partsWithIndex = trimmed.match(/^(REG-\d{4}-[A-Z0-9]+)-(\d+)$/);
    if (partsWithIndex) {
      const registrationId = partsWithIndex[1];
      const attendeeIndex = parseInt(partsWithIndex[2], 10);
      return { valid: true, registrationId, attendeeIndex };
    }

    // Legacy format without attendee index: REG-2026-XXXXXX
    const legacyMatch = trimmed.match(/^(REG-\d{4}-[A-Z0-9]+)$/);
    if (legacyMatch) {
      return { valid: true, registrationId: legacyMatch[1], attendeeIndex: null };
    }
  }

  // Try parsing as JSON (in case QR contains structured data)
  try {
    const parsed = JSON.parse(qrData);
    if (parsed.registrationId) {
      return {
        valid: true,
        registrationId: parsed.registrationId.toUpperCase(),
        attendeeIndex: typeof parsed.attendeeIndex === 'number' ? parsed.attendeeIndex : null,
      };
    }
  } catch {
    // Not JSON, continue
  }

  return { valid: false, registrationId: null, attendeeIndex: null };
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

  // Search by short code suffix (last 4 characters) or full short code (6 characters)
  const upperTerm = searchTerm.trim().toUpperCase();
  if (/^[A-Z0-9]+$/.test(upperTerm)) {
    if (upperTerm.length === 4) {
      // Search by shortCodeSuffix (last 4 characters of the 6-char code)
      const suffixQuery = query(
        registrationsRef,
        where('shortCodeSuffix', '==', upperTerm)
      );
      const suffixSnapshot = await getDocs(suffixQuery);
      suffixSnapshot.forEach((docSnap) => {
        if (!seenIds.has(docSnap.id)) {
          seenIds.add(docSnap.id);
          results.push({ id: docSnap.id, ...docSnap.data() });
        }
      });
    } else if (upperTerm.length === 6) {
      // Search by full shortCode (6 characters)
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

    // Normalize search term: trim and collapse multiple spaces
    const normalizedSearchTerm = normalizedTerm.trim().replace(/\s+/g, ' ');

    confirmedSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      // Normalize full name: trim each part, concatenate, collapse spaces
      const firstName = (data.primaryAttendee?.firstName || '').trim();
      const lastName = (data.primaryAttendee?.lastName || '').trim();
      const fullName = `${firstName} ${lastName}`.toLowerCase().trim().replace(/\s+/g, ' ');
      const phone = (data.primaryAttendee?.cellphone || '').replace(/[\s-]/g, '');

      if (
        fullName.includes(normalizedSearchTerm) ||
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
 * Checks in an attendee (legacy - checks in all attendees or a specific attendee)
 *
 * @param {string} registrationId - Registration ID to check in
 * @param {Object} checkInData - Check-in details
 * @param {string} checkInData.adminId - Admin user ID performing check-in
 * @param {string} checkInData.adminName - Admin display name
 * @param {string} checkInData.adminEmail - Admin email for activity logging
 * @param {string} checkInData.method - Check-in method (qr or manual)
 * @param {string} [checkInData.stationId] - Optional check-in station identifier
 * @param {number|null} [checkInData.attendeeIndex] - Optional attendee index for selective check-in
 * @returns {Promise<Object>} Updated registration data
 * @throws {Error} If check-in fails
 */
export async function checkInAttendee(registrationId, checkInData) {
  const { adminId, adminName, adminEmail, method, stationId, attendeeIndex } = checkInData;

  if (!registrationId || !adminId) {
    const error = new Error('Registration ID and admin ID are required');
    error.code = CHECK_IN_ERROR_CODES.UPDATE_FAILED;
    throw error;
  }

  // Get registration
  const registration = await getRegistrationForCheckIn(registrationId);

  // If attendeeIndex is provided, do per-attendee check-in
  if (typeof attendeeIndex === 'number') {
    return checkInSingleAttendee(registration, attendeeIndex, {
      adminId,
      adminName,
      adminEmail,
      method,
      stationId,
    });
  }

  // Legacy behavior: check in all attendees at once
  // Validate eligibility
  const validation = validateCheckInEligibility(registration);
  if (!validation.valid) {
    const error = new Error(validation.message);
    error.code = validation.errorCode;
    error.registration = registration;
    throw error;
  }

  // Create attendeeCheckIns array for all attendees
  // Note: Use Timestamp.now() for array items since serverTimestamp() is not supported inside arrays
  const totalAttendees = 1 + (registration.additionalAttendees?.length || 0);
  const arrayTimestamp = Timestamp.now();
  const attendeeCheckIns = [];

  for (let i = 0; i < totalAttendees; i++) {
    attendeeCheckIns.push({
      checkedIn: true,
      checkedInAt: arrayTimestamp,
      checkedInBy: adminId,
      checkedInByName: adminName || null,
      checkInMethod: method || CHECK_IN_METHODS.MANUAL,
    });
  }

  // Perform check-in update
  const docRef = doc(db, COLLECTIONS.REGISTRATIONS, registrationId);

  await updateDoc(docRef, {
    checkedIn: true,
    checkedInAt: serverTimestamp(),
    checkedInBy: adminId,
    checkedInByName: adminName || null,
    checkInMethod: method || CHECK_IN_METHODS.MANUAL,
    attendeeCheckIns,
    updatedAt: serverTimestamp(),
  });

  // Create check-in log entry for each attendee
  const logRef = collection(db, COLLECTIONS.CHECK_IN_LOGS);

  // Log primary attendee
  await addDoc(logRef, {
    registrationId,
    attendeeIndex: 0,
    attendeeName: `${registration.primaryAttendee?.firstName || ''} ${registration.primaryAttendee?.lastName || ''}`.trim(),
    attendeeEmail: registration.primaryAttendee?.email || '',
    category: registration.pricingTier || 'standard',
    church: registration.church?.name || null,
    checkedInAt: serverTimestamp(),
    checkedInBy: adminId,
    checkedInByName: adminName || null,
    checkInMethod: method || CHECK_IN_METHODS.MANUAL,
    stationId: stationId || null,
    attendeeCount: 1,
    createdAt: serverTimestamp(),
  });

  // Log additional attendees
  for (let i = 0; i < (registration.additionalAttendees?.length || 0); i++) {
    const attendee = registration.additionalAttendees[i];
    await addDoc(logRef, {
      registrationId,
      attendeeIndex: i + 1,
      attendeeName: `${attendee?.firstName || ''} ${attendee?.lastName || ''}`.trim(),
      attendeeEmail: attendee?.email || '',
      category: registration.pricingTier || 'standard',
      church: registration.church?.name || null,
      checkedInAt: serverTimestamp(),
      checkedInBy: adminId,
      checkedInByName: adminName || null,
      checkInMethod: method || CHECK_IN_METHODS.MANUAL,
      stationId: stationId || null,
      attendeeCount: 1,
      createdAt: serverTimestamp(),
    });
  }

  // Log to activity log
  await logActivity({
    type: ACTIVITY_TYPES.CHECKIN,
    entityType: ENTITY_TYPES.REGISTRATION,
    entityId: registrationId,
    description: `Checked in ${totalAttendees} attendee(s): ${registration.primaryAttendee?.firstName || ''} ${registration.primaryAttendee?.lastName || ''}`,
    adminId,
    adminEmail: adminEmail || 'Unknown',
  });

  return {
    ...registration,
    checkedIn: true,
    checkedInAt: new Date(),
    checkedInBy: adminId,
    checkedInByName: adminName,
    checkInMethod: method,
    attendeeCheckIns,
  };
}

/**
 * Checks in a single attendee by index
 *
 * @param {Object} registration - Registration document
 * @param {number} attendeeIndex - Index of the attendee (0 for primary, 1+ for additional)
 * @param {Object} checkInData - Check-in details
 * @param {string} checkInData.adminId - Admin user ID performing check-in
 * @param {string} checkInData.adminName - Admin display name
 * @param {string} checkInData.adminEmail - Admin email for activity logging
 * @param {string} checkInData.method - Check-in method (qr or manual)
 * @param {string} [checkInData.stationId] - Optional check-in station identifier
 * @returns {Promise<Object>} Updated registration data with check-in info
 * @throws {Error} If check-in fails
 */
export async function checkInSingleAttendee(registration, attendeeIndex, checkInData) {
  const { adminId, adminName, adminEmail, method, stationId } = checkInData;

  // Validate attendee eligibility
  const validation = validateAttendeeCheckInEligibility(registration, attendeeIndex);
  if (!validation.valid) {
    const error = new Error(validation.message);
    error.code = validation.errorCode;
    error.registration = registration;
    throw error;
  }

  const attendeeInfo = getAttendeeByIndex(registration, attendeeIndex);
  const attendeeName = `${attendeeInfo?.firstName || ''} ${attendeeInfo?.lastName || ''}`.trim();

  // Get or initialize attendeeCheckIns array
  // Note: Use Timestamp.now() for array items since serverTimestamp() is not supported inside arrays
  const totalAttendees = 1 + (registration.additionalAttendees?.length || 0);
  const existingCheckIns = registration.attendeeCheckIns || [];
  const arrayTimestamp = Timestamp.now();
  const attendeeCheckIns = [];

  // Initialize array with existing or empty check-in status
  for (let i = 0; i < totalAttendees; i++) {
    if (i === attendeeIndex) {
      // This is the attendee we're checking in
      attendeeCheckIns.push({
        checkedIn: true,
        checkedInAt: arrayTimestamp,
        checkedInBy: adminId,
        checkedInByName: adminName || null,
        checkInMethod: method || CHECK_IN_METHODS.MANUAL,
      });
    } else if (existingCheckIns[i]) {
      // Preserve existing check-in status
      attendeeCheckIns.push(existingCheckIns[i]);
    } else {
      // Not checked in yet
      attendeeCheckIns.push({ checkedIn: false });
    }
  }

  // Check if all attendees are now checked in
  const allCheckedIn = attendeeCheckIns.every((ci) => ci.checkedIn === true);

  // Perform check-in update
  const docRef = doc(db, COLLECTIONS.REGISTRATIONS, registration.id || registration.registrationId);
  const checkInTimestamp = serverTimestamp();

  const updateData = {
    attendeeCheckIns,
    updatedAt: checkInTimestamp,
  };

  // Also set legacy fields if all attendees are checked in
  if (allCheckedIn) {
    updateData.checkedIn = true;
    updateData.checkedInAt = checkInTimestamp;
    updateData.checkedInBy = adminId;
    updateData.checkedInByName = adminName || null;
    updateData.checkInMethod = method || CHECK_IN_METHODS.MANUAL;
  }

  await updateDoc(docRef, updateData);

  // Create check-in log entry
  const logRef = collection(db, COLLECTIONS.CHECK_IN_LOGS);
  await addDoc(logRef, {
    registrationId: registration.id || registration.registrationId,
    attendeeIndex,
    attendeeName,
    attendeeEmail: attendeeInfo?.email || '',
    category: registration.pricingTier || 'standard',
    church: registration.church?.name || null,
    checkedInAt: checkInTimestamp,
    checkedInBy: adminId,
    checkedInByName: adminName || null,
    checkInMethod: method || CHECK_IN_METHODS.MANUAL,
    stationId: stationId || null,
    attendeeCount: 1,
    createdAt: checkInTimestamp,
  });

  // Log to activity log
  await logActivity({
    type: ACTIVITY_TYPES.CHECKIN,
    entityType: ENTITY_TYPES.REGISTRATION,
    entityId: registration.id || registration.registrationId,
    description: `Checked in attendee: ${attendeeName}`,
    adminId,
    adminEmail: adminEmail || 'Unknown',
  });

  return {
    ...registration,
    attendeeCheckIns,
    checkedIn: allCheckedIn,
    checkedInAt: allCheckedIn ? new Date() : registration.checkedInAt,
    checkedInBy: allCheckedIn ? adminId : registration.checkedInBy,
    checkedInByName: allCheckedIn ? adminName : registration.checkedInByName,
    checkInMethod: allCheckedIn ? method : registration.checkInMethod,
    // Include info about the attendee that was just checked in
    lastCheckedInAttendee: {
      index: attendeeIndex,
      name: attendeeName,
    },
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
  let fullyCheckedIn = 0;
  let partiallyCheckedIn = 0;
  let totalAttendees = 0;
  let checkedInAttendees = 0;

  confirmedSnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    totalConfirmed++;
    const attendeeCount = 1 + (data.additionalAttendees?.length || 0);
    totalAttendees += attendeeCount;

    // Count checked-in attendees using the new per-attendee tracking
    const checkedInCount = getCheckedInAttendeeCount(data);
    checkedInAttendees += checkedInCount;

    if (checkedInCount === attendeeCount) {
      fullyCheckedIn++;
    } else if (checkedInCount > 0) {
      partiallyCheckedIn++;
    }
  });

  const percentage = totalConfirmed > 0 ? Math.round((fullyCheckedIn / totalConfirmed) * 100) : 0;
  const attendeePercentage = totalAttendees > 0 ? Math.round((checkedInAttendees / totalAttendees) * 100) : 0;

  return {
    totalConfirmed,
    checkedIn: fullyCheckedIn,
    partiallyCheckedIn,
    pending: totalConfirmed - fullyCheckedIn - partiallyCheckedIn,
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
    let fullyCheckedIn = 0;
    let partiallyCheckedIn = 0;
    let totalAttendees = 0;
    let checkedInAttendees = 0;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      totalConfirmed++;
      const attendeeCount = 1 + (data.additionalAttendees?.length || 0);
      totalAttendees += attendeeCount;

      // Count checked-in attendees using the new per-attendee tracking
      const checkedInCount = getCheckedInAttendeeCount(data);
      checkedInAttendees += checkedInCount;

      if (checkedInCount === attendeeCount) {
        fullyCheckedIn++;
      } else if (checkedInCount > 0) {
        partiallyCheckedIn++;
      }
    });

    const percentage = totalConfirmed > 0 ? Math.round((fullyCheckedIn / totalConfirmed) * 100) : 0;
    const attendeePercentage = totalAttendees > 0 ? Math.round((checkedInAttendees / totalAttendees) * 100) : 0;

    callback({
      totalConfirmed,
      checkedIn: fullyCheckedIn,
      partiallyCheckedIn,
      pending: totalConfirmed - fullyCheckedIn - partiallyCheckedIn,
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
 * @param {number|null} [attendeeIndex] - Optional attendee index to undo specific attendee
 * @returns {Promise<void>}
 */
export async function undoCheckIn(registrationId, adminId, reason, attendeeIndex = null) {
  if (!registrationId || !adminId) {
    throw new Error('Registration ID and admin ID are required');
  }

  const docRef = doc(db, COLLECTIONS.REGISTRATIONS, registrationId);

  // If attendeeIndex is provided, undo only that attendee
  if (typeof attendeeIndex === 'number') {
    const registration = await getRegistrationForCheckIn(registrationId);
    if (!registration) {
      throw new Error('Registration not found');
    }

    const totalAttendees = 1 + (registration.additionalAttendees?.length || 0);
    const existingCheckIns = registration.attendeeCheckIns || [];
    const attendeeCheckIns = [];

    for (let i = 0; i < totalAttendees; i++) {
      if (i === attendeeIndex) {
        // Reset this attendee's check-in
        attendeeCheckIns.push({ checkedIn: false });
      } else if (existingCheckIns[i]) {
        attendeeCheckIns.push(existingCheckIns[i]);
      } else {
        attendeeCheckIns.push({ checkedIn: false });
      }
    }

    const legacyCheckedIn = attendeeCheckIns.some((attendee) => attendee.checkedIn);

    await updateDoc(docRef, {
      attendeeCheckIns,
      checkedIn: legacyCheckedIn,
      checkInUndoneAt: serverTimestamp(),
      checkInUndoneBy: adminId,
      checkInUndoReason: reason || null,
      checkInUndoAttendeeIndex: attendeeIndex,
      updatedAt: serverTimestamp(),
    });
  } else {
    // Undo all attendees (legacy behavior)
    await updateDoc(docRef, {
      checkedIn: false,
      checkedInAt: null,
      checkedInBy: null,
      checkedInByName: null,
      checkInMethod: null,
      attendeeCheckIns: null,
      checkInUndoneAt: serverTimestamp(),
      checkInUndoneBy: adminId,
      checkInUndoReason: reason || null,
      updatedAt: serverTimestamp(),
    });
  }
}

/**
 * Subscribes to real-time check-in stats from the stats collection
 * This uses pre-computed stats maintained by Cloud Functions for efficiency
 *
 * @param {Function} callback - Callback function receiving stats updates
 * @returns {Function} Unsubscribe function
 */
export function subscribeToCheckInStatsFromCollection(callback) {
  const statsRef = doc(db, COLLECTIONS.STATS, STATS_DOC_ID);

  return onSnapshot(
    statsRef,
    (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        const totalConfirmed = data.confirmedRegistrationCount || 0;
        const checkedIn = data.checkedInRegistrationCount || 0;
        const partiallyCheckedIn = data.partiallyCheckedInCount || 0;
        const totalAttendees = data.registeredAttendeeCount || 0;
        const checkedInAttendees = data.checkedInAttendeeCount || 0;

        const percentage = totalConfirmed > 0
          ? Math.round((checkedIn / totalConfirmed) * 100)
          : 0;
        const attendeePercentage = totalAttendees > 0
          ? Math.round((checkedInAttendees / totalAttendees) * 100)
          : 0;

        callback({
          totalConfirmed,
          checkedIn,
          partiallyCheckedIn,
          pending: totalConfirmed - checkedIn - partiallyCheckedIn,
          percentage,
          totalAttendees,
          checkedInAttendees,
          pendingAttendees: totalAttendees - checkedInAttendees,
          attendeePercentage,
        });
      } else {
        // Return default empty stats
        callback({
          totalConfirmed: 0,
          checkedIn: 0,
          partiallyCheckedIn: 0,
          pending: 0,
          percentage: 0,
          totalAttendees: 0,
          checkedInAttendees: 0,
          pendingAttendees: 0,
          attendeePercentage: 0,
        });
      }
    },
    (error) => {
      console.error('Error subscribing to check-in stats:', error);
      callback({
        totalConfirmed: 0,
        checkedIn: 0,
        partiallyCheckedIn: 0,
        pending: 0,
        percentage: 0,
        totalAttendees: 0,
        checkedInAttendees: 0,
        pendingAttendees: 0,
        attendeePercentage: 0,
      });
    }
  );
}
