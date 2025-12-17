/**
 * Registration Service
 * Handles registration operations including creating, retrieving, and updating registrations.
 *
 * @module services/registration
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import {
  COLLECTIONS,
  STORAGE_PATHS,
  REGISTRATION_STATUS,
  PAYMENT_INFO,
  SHORT_CODE_LENGTH,
  SHORT_CODE_SUFFIX_LENGTH,
} from '../constants';

/**
 * Error codes for registration operations
 */
export const REGISTRATION_ERROR_CODES = {
  DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
  REGISTRATION_NOT_FOUND: 'REGISTRATION_NOT_FOUND',
  REGISTRATION_CLOSED: 'REGISTRATION_CLOSED',
  INVALID_DATA: 'INVALID_DATA',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
};

/**
 * Generates a unique filename with timestamp for storage
 *
 * @param {string} originalName - Original file name
 * @returns {string} Unique filename with timestamp
 */
function generateUniqueFilename(originalName) {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop();
  const baseName = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '-');
  return `${baseName}-${timestamp}.${extension}`;
}

/**
 * Checks if an email is already registered for the current conference
 *
 * @param {string} email - Email address to check
 * @returns {Promise<Object|null>} Existing registration or null
 */
export async function getRegistrationByEmail(email) {
  if (!email) {
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const registrationsRef = collection(db, COLLECTIONS.REGISTRATIONS);
  const emailQuery = query(
    registrationsRef,
    where('primaryAttendee.email', '==', normalizedEmail)
  );

  const snapshot = await getDocs(emailQuery);

  if (snapshot.empty) {
    return null;
  }

  const docData = snapshot.docs[0];
  return {
    id: docData.id,
    ...docData.data(),
  };
}

/**
 * Gets a registration by its registration ID (e.g., REG-2026-A7K3)
 *
 * @param {string} registrationId - Full registration ID
 * @returns {Promise<Object|null>} Registration data or null
 */
export async function getRegistrationById(registrationId) {
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
 * Gets a registration by its full short code
 *
 * @param {string} shortCode - 6-character short code
 * @returns {Promise<Object|null>} Registration data or null
 */
export async function getRegistrationByShortCode(shortCode) {
  if (!shortCode) {
    return null;
  }

  const normalizedCode = shortCode.trim().toUpperCase();
  const registrationsRef = collection(db, COLLECTIONS.REGISTRATIONS);
  const codeQuery = query(
    registrationsRef,
    where('shortCode', '==', normalizedCode)
  );

  const snapshot = await getDocs(codeQuery);

  if (snapshot.empty) {
    return null;
  }

  const docData = snapshot.docs[0];
  return {
    id: docData.id,
    ...docData.data(),
  };
}

/**
 * Gets a registration by its short code suffix (last 4 characters).
 * Allows quick lookup using just the last 4 digits shown on tickets.
 *
 * @param {string} suffix - 4-character short code suffix
 * @returns {Promise<Object|null>} Registration data or null
 */
export async function getRegistrationByShortCodeSuffix(suffix) {
  if (!suffix) {
    return null;
  }

  const normalizedSuffix = suffix.trim().toUpperCase();
  const registrationsRef = collection(db, COLLECTIONS.REGISTRATIONS);
  const suffixQuery = query(
    registrationsRef,
    where('shortCodeSuffix', '==', normalizedSuffix)
  );

  const snapshot = await getDocs(suffixQuery);

  if (snapshot.empty) {
    return null;
  }

  const docData = snapshot.docs[0];
  return {
    id: docData.id,
    ...docData.data(),
  };
}

/**
 * Gets a registration by phone number
 *
 * @param {string} phone - Phone number to search
 * @returns {Promise<Object|null>} Registration data or null
 */
export async function getRegistrationByPhone(phone) {
  if (!phone) {
    return null;
  }

  const cleanPhone = phone.replace(/[\s-]/g, '');
  const registrationsRef = collection(db, COLLECTIONS.REGISTRATIONS);
  const phoneQuery = query(
    registrationsRef,
    where('primaryAttendee.cellphone', '==', cleanPhone)
  );

  const snapshot = await getDocs(phoneQuery);

  if (snapshot.empty) {
    return null;
  }

  const docData = snapshot.docs[0];
  return {
    id: docData.id,
    ...docData.data(),
  };
}

/**
 * Uploads a payment proof file to Firebase Storage
 *
 * @param {File} file - File to upload
 * @param {string} registrationId - Registration ID for organizing the file
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<string>} Download URL of uploaded file
 */
export async function uploadPaymentProof(file, registrationId, onProgress) {
  if (!file) {
    throw new Error('No file provided');
  }

  if (!registrationId) {
    throw new Error('Registration ID is required for file upload');
  }

  const filename = generateUniqueFilename(file.name);
  const storagePath = `${STORAGE_PATHS.PAYMENT_PROOFS}/${registrationId}/${filename}`;
  const storageRef = ref(storage, storagePath);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        if (onProgress) {
          onProgress(progress);
        }
      },
      (error) => {
        console.error('Upload error:', error);
        reject(new Error('Failed to upload payment proof. Please try again.'));
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadUrl);
        } catch (error) {
          reject(new Error('Failed to get download URL. Please try again.'));
        }
      }
    );
  });
}

/**
 * Creates a new registration
 *
 * @param {Object} registrationData - Registration data
 * @param {string} registrationData.registrationId - Unique registration ID
 * @param {string} registrationData.shortCode - 6-character short code
 * @param {Object} registrationData.primaryAttendee - Primary attendee information
 * @param {Array} registrationData.additionalAttendees - Additional attendees
 * @param {Object} registrationData.church - Church information
 * @param {Object} registrationData.payment - Payment information
 * @param {Object} registrationData.invoice - Invoice request data (optional)
 * @param {number} registrationData.totalAmount - Total amount to pay
 * @param {string} registrationData.pricingTier - Pricing tier ID
 * @returns {Promise<Object>} Created registration data
 */
export async function createRegistration(registrationData) {
  const {
    registrationId,
    shortCode,
    primaryAttendee,
    additionalAttendees,
    church,
    payment,
    invoice,
    totalAmount,
    pricingTier,
  } = registrationData;

  if (!registrationId || !shortCode || !primaryAttendee) {
    throw new Error(REGISTRATION_ERROR_CODES.INVALID_DATA);
  }

  // Check for duplicate email
  const existing = await getRegistrationByEmail(primaryAttendee.email);
  if (existing) {
    const error = new Error('Email already registered');
    error.code = REGISTRATION_ERROR_CODES.DUPLICATE_EMAIL;
    error.existingRegistrationId = existing.registrationId;
    throw error;
  }

  // Calculate payment deadline (7 days from now)
  const paymentDeadline = new Date();
  paymentDeadline.setDate(paymentDeadline.getDate() + PAYMENT_INFO.PAYMENT_DEADLINE_DAYS);

  // Normalize email
  const normalizedPrimaryAttendee = {
    ...primaryAttendee,
    email: primaryAttendee.email.trim().toLowerCase(),
    cellphone: primaryAttendee.cellphone.replace(/[\s-]/g, ''),
  };

  // Normalize additional attendees
  const normalizedAdditionalAttendees = (additionalAttendees || []).map((attendee) => ({
    ...attendee,
    email: attendee.email ? attendee.email.trim().toLowerCase() : '',
    cellphone: attendee.cellphone.replace(/[\s-]/g, ''),
  }));

  const docRef = doc(db, COLLECTIONS.REGISTRATIONS, registrationId);

  // Extract last 4 characters for quick lookup
  const shortCodeSuffix = shortCode.slice(-SHORT_CODE_SUFFIX_LENGTH);

  const registrationDoc = {
    registrationId,
    shortCode,
    shortCodeSuffix,
    primaryAttendee: normalizedPrimaryAttendee,
    additionalAttendees: normalizedAdditionalAttendees,
    church,
    payment: {
      ...payment,
      status: REGISTRATION_STATUS.PENDING_PAYMENT,
    },
    invoice: invoice || null,
    totalAmount,
    pricingTier,
    status: REGISTRATION_STATUS.PENDING_PAYMENT,
    paymentDeadline: paymentDeadline.toISOString(),
    // Communication tracking
    confirmationEmailSent: false,
    reminderEmailSent: false,
    ticketEmailSent: false,
    // Check-in status
    checkedIn: false,
    checkedInAt: null,
    checkedInBy: null,
    // QR code (generated after payment confirmation)
    qrCodeData: null,
    // Timestamps
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(docRef, registrationDoc);

  return {
    id: registrationId,
    ...registrationDoc,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Updates the payment proof for a registration
 *
 * @param {string} registrationId - Registration ID
 * @param {string} paymentProofUrl - URL of the uploaded payment proof
 * @returns {Promise<void>}
 */
export async function updatePaymentProof(registrationId, paymentProofUrl) {
  const docRef = doc(db, COLLECTIONS.REGISTRATIONS, registrationId);

  await updateDoc(docRef, {
    'payment.proofUrl': paymentProofUrl,
    'payment.uploadedAt': serverTimestamp(),
    status: REGISTRATION_STATUS.PENDING_VERIFICATION,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Confirms payment for a registration (admin action)
 *
 * @param {string} registrationId - Registration ID
 * @param {Object} paymentDetails - Payment verification details
 * @param {string} paymentDetails.method - Payment method used
 * @param {string} paymentDetails.referenceNumber - Payment reference number
 * @param {string} paymentDetails.verifiedBy - Admin who verified
 * @param {string} paymentDetails.notes - Additional notes
 * @returns {Promise<void>}
 */
export async function confirmPayment(registrationId, paymentDetails) {
  const docRef = doc(db, COLLECTIONS.REGISTRATIONS, registrationId);

  // Generate QR code data (the registration ID is sufficient for scanning)
  const qrCodeData = registrationId;

  await updateDoc(docRef, {
    status: REGISTRATION_STATUS.CONFIRMED,
    'payment.status': REGISTRATION_STATUS.CONFIRMED,
    'payment.method': paymentDetails.method,
    'payment.referenceNumber': paymentDetails.referenceNumber,
    'payment.verifiedBy': paymentDetails.verifiedBy,
    'payment.verifiedAt': serverTimestamp(),
    'payment.notes': paymentDetails.notes || null,
    qrCodeData,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Cancels a registration
 *
 * @param {string} registrationId - Registration ID
 * @param {string} reason - Cancellation reason
 * @param {string} cancelledBy - Admin who cancelled (or 'system' for auto-cancel)
 * @returns {Promise<void>}
 */
export async function cancelRegistration(registrationId, reason, cancelledBy) {
  const docRef = doc(db, COLLECTIONS.REGISTRATIONS, registrationId);

  await updateDoc(docRef, {
    status: REGISTRATION_STATUS.CANCELLED,
    'payment.status': REGISTRATION_STATUS.CANCELLED,
    cancellation: {
      reason,
      cancelledBy,
      cancelledAt: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
  });
}

/**
 * Marks a registration email as sent
 *
 * @param {string} registrationId - Registration ID
 * @param {string} emailType - Type of email ('confirmation', 'reminder', 'ticket')
 * @returns {Promise<void>}
 */
export async function markEmailSent(registrationId, emailType) {
  const docRef = doc(db, COLLECTIONS.REGISTRATIONS, registrationId);
  const fieldMap = {
    confirmation: 'confirmationEmailSent',
    reminder: 'reminderEmailSent',
    ticket: 'ticketEmailSent',
  };

  const field = fieldMap[emailType];
  if (!field) {
    throw new Error('Invalid email type');
  }

  await updateDoc(docRef, {
    [field]: true,
    [`${field}At`]: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Looks up a registration by various identifiers.
 * Supports: registration ID, 6-char short code, 4-char suffix, email, or phone.
 *
 * @param {string} identifier - Registration ID, short code (4 or 6 chars), email, or phone
 * @returns {Promise<Object|null>} Registration data or null
 */
export async function lookupRegistration(identifier) {
  if (!identifier) {
    return null;
  }

  const trimmed = identifier.trim();

  // Try registration ID format (REG-YYYY-XXXXXX)
  if (trimmed.toUpperCase().startsWith('REG-')) {
    const result = await getRegistrationById(trimmed.toUpperCase());
    if (result) {
      return result;
    }
  }

  // Try 6-character full short code
  if (trimmed.length === SHORT_CODE_LENGTH && /^[A-Za-z0-9]+$/.test(trimmed)) {
    const result = await getRegistrationByShortCode(trimmed);
    if (result) {
      return result;
    }
  }

  // Try 4-character short code suffix (last 4 digits)
  if (trimmed.length === SHORT_CODE_SUFFIX_LENGTH && /^[A-Za-z0-9]+$/.test(trimmed)) {
    const result = await getRegistrationByShortCodeSuffix(trimmed);
    if (result) {
      return result;
    }
  }

  // Try email
  if (trimmed.includes('@')) {
    const result = await getRegistrationByEmail(trimmed);
    if (result) {
      return result;
    }
  }

  // Try phone number
  const cleanPhone = trimmed.replace(/[\s-]/g, '');
  if (/^(\+63|0)?9\d{9}$/.test(cleanPhone)) {
    const result = await getRegistrationByPhone(cleanPhone);
    if (result) {
      return result;
    }
  }

  return null;
}

/**
 * Increments workshop registered count atomically
 *
 * @param {string} workshopId - Workshop session ID
 * @returns {Promise<void>}
 */
export async function incrementWorkshopCount(workshopId) {
  if (!workshopId) {
    return;
  }

  const workshopRef = doc(db, COLLECTIONS.SESSIONS, workshopId);

  await runTransaction(db, async (transaction) => {
    const workshopDoc = await transaction.get(workshopRef);
    if (workshopDoc.exists()) {
      const currentCount = workshopDoc.data().registeredCount || 0;
      transaction.update(workshopRef, {
        registeredCount: currentCount + 1,
        updatedAt: serverTimestamp(),
      });
    }
  });
}
