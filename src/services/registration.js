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
  limit,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { db, storage, functions } from '../lib/firebase';
import {
  COLLECTIONS,
  STORAGE_PATHS,
  REGISTRATION_STATUS,
  PAYMENT_INFO,
  SHORT_CODE_LENGTH,
  SHORT_CODE_SUFFIX_LENGTH,
  WAITLIST_DEADLINE_HOURS,
} from '../constants';
import { logActivity, ACTIVITY_TYPES, ENTITY_TYPES } from './activityLog';

/**
 * Error codes for registration operations
 */
export const REGISTRATION_ERROR_CODES = {
  DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
  REGISTRATION_NOT_FOUND: 'REGISTRATION_NOT_FOUND',
  REGISTRATION_CLOSED: 'REGISTRATION_CLOSED',
  INVALID_DATA: 'INVALID_DATA',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  CONFERENCE_FULL: 'CONFERENCE_FULL',
  WAITLIST_FULL: 'WAITLIST_FULL',
  WAITLIST_DISABLED: 'WAITLIST_DISABLED',
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
 * Normalizes a Philippine phone number to possible storage formats.
 * Returns an array of formats to search: local (09XX) and international (+639XX).
 *
 * @param {string} phone - Phone number to normalize
 * @returns {string[]} Array of possible phone formats to search
 */
function getPhoneSearchVariants(phone) {
  const cleanPhone = phone.replace(/[\s-]/g, '');
  const variants = new Set();

  // Add the cleaned input as-is
  variants.add(cleanPhone);

  // Convert to local format (09XXXXXXXXX)
  if (cleanPhone.startsWith('+63')) {
    variants.add('0' + cleanPhone.slice(3));
  } else if (cleanPhone.startsWith('63')) {
    variants.add('0' + cleanPhone.slice(2));
  }

  // Convert to international format (+639XXXXXXXXX)
  if (cleanPhone.startsWith('0')) {
    variants.add('+63' + cleanPhone.slice(1));
  } else if (cleanPhone.startsWith('9') && cleanPhone.length === 10) {
    variants.add('+63' + cleanPhone);
    variants.add('0' + cleanPhone);
  }

  return Array.from(variants);
}

/**
 * Gets a registration by phone number.
 * Searches multiple phone format variants to handle different storage formats.
 *
 * @param {string} phone - Phone number to search
 * @returns {Promise<Object|null>} Registration data or null
 */
export async function getRegistrationByPhone(phone) {
  if (!phone) {
    return null;
  }

  const phoneVariants = getPhoneSearchVariants(phone);
  const registrationsRef = collection(db, COLLECTIONS.REGISTRATIONS);

  // Try each phone variant
  for (const variant of phoneVariants) {
    const phoneQuery = query(
      registrationsRef,
      where('primaryAttendee.cellphone', '==', variant)
    );

    const snapshot = await getDocs(phoneQuery);

    if (!snapshot.empty) {
      const docData = snapshot.docs[0];
      return {
        id: docData.id,
        ...docData.data(),
      };
    }
  }

  return null;
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

  // Determine initial status based on whether payment proof was uploaded
  // If totalAmount is 0 (volunteers/speakers), set to PENDING_VERIFICATION for admin approval
  // If payment proof is provided, set to PENDING_VERIFICATION
  // Otherwise, set to PENDING_PAYMENT (for manual/admin registrations)
  const hasPaymentProof = payment && payment.proofUrl;
  const isFreeRegistration = totalAmount === 0;
  const initialStatus = isFreeRegistration || hasPaymentProof
    ? REGISTRATION_STATUS.PENDING_VERIFICATION
    : REGISTRATION_STATUS.PENDING_PAYMENT;

  const registrationDoc = {
    registrationId,
    shortCode,
    shortCodeSuffix,
    primaryAttendee: normalizedPrimaryAttendee,
    additionalAttendees: normalizedAdditionalAttendees,
    church,
    payment: {
      ...payment,
      status: initialStatus,
    },
    invoice: invoice || null,
    totalAmount,
    pricingTier,
    status: initialStatus,
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

  // Increment workshop counts for all selected workshops
  const allWorkshopSelections = [
    ...(normalizedPrimaryAttendee.workshopSelections || []),
    ...(normalizedAdditionalAttendees || []).flatMap((attendee) => attendee.workshopSelections || []),
  ];

  // Increment each workshop's registered count
  for (const selection of allWorkshopSelections) {
    if (selection.sessionId) {
      try {
        await incrementWorkshopCount(selection.sessionId);
      } catch (error) {
        console.error(`Failed to increment workshop count for ${selection.sessionId}:`, error);
      }
    }
  }

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
 * Generates per-attendee QR code data for a registration
 *
 * @param {string} registrationId - Registration ID
 * @param {number} totalAttendees - Total number of attendees
 * @returns {Array<Object>} Array of QR code data objects
 */
function generateAttendeeQRCodes(registrationId, totalAttendees) {
  const qrCodes = [];
  for (let i = 0; i < totalAttendees; i++) {
    qrCodes.push({
      attendeeIndex: i,
      qrData: `${registrationId}-${i}`,
    });
  }
  return qrCodes;
}

/**
 * Verifies payment and updates registration with payment tracking
 * Handles both full and partial payments
 *
 * @param {string} registrationId - Registration ID
 * @param {Object} verificationDetails - Payment verification details
 * @param {number} verificationDetails.amountPaid - Amount received from user
 * @param {string} verificationDetails.method - Payment method used
 * @param {string} verificationDetails.referenceNumber - Payment reference number
 * @param {string} verificationDetails.verifiedBy - Admin who verified
 * @param {string} verificationDetails.notes - Additional notes
 * @param {string} verificationDetails.rejectionReason - Reason if payment rejected (optional)
 * @param {string} adminId - Admin user ID performing the action
 * @param {string} adminEmail - Admin email performing the action
 * @returns {Promise<void>}
 */
export async function verifyPayment(registrationId, verificationDetails, adminId = null, adminEmail = null) {
  const docRef = doc(db, COLLECTIONS.REGISTRATIONS, registrationId);

  // Get current registration to check total amount and count attendees
  const registration = await getRegistrationById(registrationId);
  const totalAmount = registration?.totalAmount || 0;
  const amountPaid = verificationDetails.amountPaid || 0;
  const balance = totalAmount - amountPaid;

  // Determine if payment is fully paid and if there's an overpayment
  const isFullyPaid = balance <= 0;
  const overpaymentAmount = amountPaid > totalAmount ? amountPaid - totalAmount : 0;

  let updateData = {
    'payment.amountPaid': amountPaid,
    'payment.balance': Math.max(0, balance),
    'payment.overpayment': overpaymentAmount,
    'payment.method': verificationDetails.method,
    'payment.referenceNumber': verificationDetails.referenceNumber,
    'payment.verifiedBy': verificationDetails.verifiedBy,
    'payment.verifiedAt': serverTimestamp(),
    'payment.notes': verificationDetails.notes || null,
    updatedAt: serverTimestamp(),
  };

  if (isFullyPaid) {
    // Full payment confirmed or free registration (volunteers/speakers)
    const isFreeRegistration = totalAmount === 0;
    const totalAttendees = 1 + (registration?.additionalAttendees?.length || 0);

    updateData = {
      ...updateData,
      status: REGISTRATION_STATUS.CONFIRMED,
      'payment.status': REGISTRATION_STATUS.CONFIRMED,
    };

    // Only generate QR codes for paid registrations (not for volunteers/speakers)
    if (!isFreeRegistration) {
      const qrCodeData = registrationId;
      const attendeeQRCodes = generateAttendeeQRCodes(registrationId, totalAttendees);
      updateData.qrCodeData = qrCodeData;
      updateData.attendeeQRCodes = attendeeQRCodes;
    }
  } else {
    // Partial payment or rejected - set back to PENDING_PAYMENT
    updateData = {
      ...updateData,
      status: REGISTRATION_STATUS.PENDING_PAYMENT,
      'payment.status': REGISTRATION_STATUS.PENDING_PAYMENT,
      'payment.rejectionReason': verificationDetails.rejectionReason || `Partial payment received. Balance: ₱${balance.toFixed(2)}`,
      'payment.rejectedAt': serverTimestamp(),
      'payment.rejectedBy': verificationDetails.verifiedBy,
    };
  }

  await updateDoc(docRef, updateData);

  // Log the activity
  if (adminId && adminEmail) {
    await logActivity({
      type: isFullyPaid ? ACTIVITY_TYPES.APPROVE : ACTIVITY_TYPES.REJECT,
      entityType: ENTITY_TYPES.REGISTRATION,
      entityId: registrationId,
      description: isFullyPaid
        ? `Confirmed full payment (₱${amountPaid}) for registration: ${registration?.primaryAttendee?.firstName || ''} ${registration?.primaryAttendee?.lastName || registrationId}`
        : `Partial payment verified (₱${amountPaid} of ₱${totalAmount}) for registration: ${registration?.primaryAttendee?.firstName || ''} ${registration?.primaryAttendee?.lastName || registrationId}`,
      adminId,
      adminEmail,
    });
  }
}

/**
 * Confirms payment for a registration (admin action)
 * Legacy function - consider using verifyPayment instead for better tracking
 *
 * @param {string} registrationId - Registration ID
 * @param {Object} paymentDetails - Payment verification details
 * @param {string} paymentDetails.method - Payment method used
 * @param {string} paymentDetails.referenceNumber - Payment reference number
 * @param {string} paymentDetails.verifiedBy - Admin who verified
 * @param {string} paymentDetails.notes - Additional notes
 * @param {string} adminId - Admin user ID performing the action
 * @param {string} adminEmail - Admin email performing the action
 * @returns {Promise<void>}
 */
export async function confirmPayment(registrationId, paymentDetails, adminId = null, adminEmail = null) {
  const docRef = doc(db, COLLECTIONS.REGISTRATIONS, registrationId);

  // Get current registration to count attendees
  const registration = await getRegistrationById(registrationId);
  const totalAttendees = 1 + (registration?.additionalAttendees?.length || 0);
  const isFreeRegistration = (registration?.totalAmount || 0) === 0;

  const updateData = {
    status: REGISTRATION_STATUS.CONFIRMED,
    'payment.status': REGISTRATION_STATUS.CONFIRMED,
    'payment.method': paymentDetails.method,
    'payment.referenceNumber': paymentDetails.referenceNumber,
    'payment.verifiedBy': paymentDetails.verifiedBy,
    'payment.verifiedAt': serverTimestamp(),
    'payment.notes': paymentDetails.notes || null,
    'payment.amountPaid': registration?.totalAmount || 0,
    'payment.balance': 0,
    updatedAt: serverTimestamp(),
  };

  // Only generate QR codes for paid registrations (not for volunteers/speakers)
  if (!isFreeRegistration) {
    const qrCodeData = registrationId;
    const attendeeQRCodes = generateAttendeeQRCodes(registrationId, totalAttendees);
    updateData.qrCodeData = qrCodeData;
    updateData.attendeeQRCodes = attendeeQRCodes;
  }

  await updateDoc(docRef, updateData);

  // Log the activity
  if (adminId && adminEmail) {
    await logActivity({
      type: ACTIVITY_TYPES.APPROVE,
      entityType: ENTITY_TYPES.REGISTRATION,
      entityId: registrationId,
      description: `Confirmed payment for registration: ${registration?.primaryAttendee?.firstName || ''} ${registration?.primaryAttendee?.lastName || registrationId}`,
      adminId,
      adminEmail,
    });
  }
}

/**
 * Cancels a registration.
 * Decrements workshop counts if the registration had incremented them.
 *
 * @param {string} registrationId - Registration ID
 * @param {string} reason - Cancellation reason
 * @param {string} cancelledBy - Admin who cancelled (or 'system' for auto-cancel)
 * @param {string} adminId - Admin user ID performing the action
 * @param {string} adminEmail - Admin email performing the action
 * @returns {Promise<void>}
 */
export async function cancelRegistration(registrationId, reason, cancelledBy, adminId = null, adminEmail = null) {
  const registration = await getRegistrationById(registrationId);
  const docRef = doc(db, COLLECTIONS.REGISTRATIONS, registrationId);

  // Check if this registration had workshop counts incremented
  // Workshop counts are incremented for: regular registrations and WAITLIST_OFFERED
  // Workshop counts are NOT incremented for: WAITLISTED (only)
  const hadWorkshopCountsIncremented = registration &&
    registration.status !== REGISTRATION_STATUS.WAITLISTED;

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

  // Decrement workshop counts if they were previously incremented
  if (hadWorkshopCountsIncremented && registration) {
    const allWorkshopSelections = [
      ...(registration.primaryAttendee?.workshopSelections || []),
      ...(registration.additionalAttendees || []).flatMap((attendee) => attendee.workshopSelections || []),
    ];

    for (const selection of allWorkshopSelections) {
      if (selection.sessionId) {
        try {
          await decrementWorkshopCount(selection.sessionId);
        } catch (error) {
          console.error(`Failed to decrement workshop count for ${selection.sessionId}:`, error);
        }
      }
    }
  }

  // Log the activity
  if (adminId && adminEmail) {
    await logActivity({
      type: ACTIVITY_TYPES.REJECT,
      entityType: ENTITY_TYPES.REGISTRATION,
      entityId: registrationId,
      description: `Cancelled registration: ${registration?.primaryAttendee?.firstName || ''} ${registration?.primaryAttendee?.lastName || registrationId}`,
      adminId,
      adminEmail,
    });
  }
}

/**
 * Refunds a registration.
 * Can only be applied to CANCELLED or CONFIRMED registrations.
 * Tracks refund amount, reason, and processing details.
 *
 * @param {string} registrationId - Registration ID
 * @param {Object} refundDetails - Refund details
 * @param {number} refundDetails.refundAmount - Amount refunded
 * @param {string} refundDetails.reason - Reason for refund
 * @param {string} refundDetails.refundMethod - How refund was processed (e.g., 'gcash', 'bank_transfer')
 * @param {string} refundDetails.referenceNumber - Refund transaction reference
 * @param {string} refundDetails.notes - Additional notes
 * @param {string} adminId - Admin user ID performing the action
 * @param {string} adminEmail - Admin email performing the action
 * @returns {Promise<void>}
 */
export async function refundRegistration(registrationId, refundDetails, adminId = null, adminEmail = null) {
  const registration = await getRegistrationById(registrationId);
  if (!registration) {
    throw new Error(REGISTRATION_ERROR_CODES.REGISTRATION_NOT_FOUND);
  }

  // Only allow refund from CANCELLED or CONFIRMED status
  const refundableStatuses = [
    REGISTRATION_STATUS.CANCELLED,
    REGISTRATION_STATUS.CONFIRMED,
  ];

  if (!refundableStatuses.includes(registration.status)) {
    throw new Error('Registration must be cancelled or confirmed to process a refund');
  }

  const docRef = doc(db, COLLECTIONS.REGISTRATIONS, registrationId);

  // If status was CONFIRMED, decrement workshop counts
  if (registration.status === REGISTRATION_STATUS.CONFIRMED) {
    const allWorkshopSelections = [
      ...(registration.primaryAttendee?.workshopSelections || []),
      ...(registration.additionalAttendees || []).flatMap((attendee) => attendee.workshopSelections || []),
    ];

    for (const selection of allWorkshopSelections) {
      if (selection.sessionId) {
        try {
          await decrementWorkshopCount(selection.sessionId);
        } catch (error) {
          console.error(`Failed to decrement workshop count for ${selection.sessionId}:`, error);
        }
      }
    }
  }

  await updateDoc(docRef, {
    status: REGISTRATION_STATUS.REFUNDED,
    'payment.status': REGISTRATION_STATUS.REFUNDED,
    refund: {
      amount: refundDetails.refundAmount || 0,
      reason: refundDetails.reason,
      method: refundDetails.refundMethod,
      referenceNumber: refundDetails.referenceNumber || null,
      notes: refundDetails.notes || null,
      processedBy: adminEmail,
      processedAt: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
  });

  // Log the activity
  if (adminId && adminEmail) {
    await logActivity({
      type: ACTIVITY_TYPES.UPDATE,
      entityType: ENTITY_TYPES.REGISTRATION,
      entityId: registrationId,
      description: `Processed refund (₱${refundDetails.refundAmount || 0}) for registration: ${registration.primaryAttendee?.firstName || ''} ${registration.primaryAttendee?.lastName || registrationId}`,
      adminId,
      adminEmail,
    });
  }
}

/**
 * Directly promotes a waitlisted registration to pending verification.
 * Skips the WAITLIST_OFFERED step and allows immediate payment upload.
 * Used when a slot becomes available and admin wants to fast-track a waitlisted registrant.
 *
 * @param {string} registrationId - Registration ID
 * @param {string} adminId - Admin user ID (null for system-triggered)
 * @param {string} adminEmail - Admin email (null for system-triggered)
 * @returns {Promise<Object>} Updated registration
 */
export async function promoteFromWaitlist(registrationId, adminId = null, adminEmail = null) {
  const registration = await getRegistrationById(registrationId);
  if (!registration) {
    throw new Error(REGISTRATION_ERROR_CODES.REGISTRATION_NOT_FOUND);
  }

  // Only allow promotion from WAITLISTED or WAITLIST_EXPIRED status
  const promotableStatuses = [
    REGISTRATION_STATUS.WAITLISTED,
    REGISTRATION_STATUS.WAITLIST_EXPIRED,
  ];

  if (!promotableStatuses.includes(registration.status)) {
    throw new Error('Registration must be waitlisted or expired to promote');
  }

  const docRef = doc(db, COLLECTIONS.REGISTRATIONS, registrationId);

  // Calculate payment deadline (7 days from now)
  const paymentDeadline = new Date();
  paymentDeadline.setDate(paymentDeadline.getDate() + 7);

  await updateDoc(docRef, {
    status: REGISTRATION_STATUS.PENDING_PAYMENT,
    'payment.status': REGISTRATION_STATUS.PENDING_PAYMENT,
    paymentDeadline: paymentDeadline.toISOString(),
    promotedFromWaitlistAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Increment workshop counts for all selected workshops
  const allWorkshopSelections = [
    ...(registration.primaryAttendee?.workshopSelections || []),
    ...(registration.additionalAttendees || []).flatMap((attendee) => attendee.workshopSelections || []),
  ];

  for (const selection of allWorkshopSelections) {
    if (selection.sessionId) {
      try {
        await incrementWorkshopCount(selection.sessionId);
      } catch (error) {
        console.error(`Failed to increment workshop count for ${selection.sessionId}:`, error);
      }
    }
  }

  // Log the activity
  if (adminId && adminEmail) {
    await logActivity({
      type: ACTIVITY_TYPES.UPDATE,
      entityType: ENTITY_TYPES.REGISTRATION,
      entityId: registrationId,
      description: `Promoted from waitlist to pending payment: ${registration.primaryAttendee?.firstName || ''} ${registration.primaryAttendee?.lastName || registrationId}`,
      adminId,
      adminEmail,
    });
  }

  return {
    ...registration,
    status: REGISTRATION_STATUS.PENDING_PAYMENT,
    paymentDeadline: paymentDeadline.toISOString(),
  };
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
 * Includes fallback search for partial short code matches.
 *
 * @param {string} identifier - Registration ID, short code (4 or 6 chars), email, or phone
 * @returns {Promise<Object|null>} Registration data or null
 */
export async function lookupRegistration(identifier) {
  if (!identifier) {
    return null;
  }

  const trimmed = identifier.trim();
  const upperTrimmed = trimmed.toUpperCase();

  // Try registration ID format (REG-YYYY-XXXXXX)
  if (upperTrimmed.startsWith('REG-')) {
    const result = await getRegistrationById(upperTrimmed);
    if (result) {
      return result;
    }
  }

  // Check if input looks like a short code (alphanumeric, 4-6 chars)
  const isAlphanumeric = /^[A-Za-z0-9]+$/.test(trimmed);

  // Try 6-character full short code
  if (trimmed.length === SHORT_CODE_LENGTH && isAlphanumeric) {
    const result = await getRegistrationByShortCode(trimmed);
    if (result) {
      return result;
    }
  }

  // Try 4-character short code suffix (last 4 digits)
  if (trimmed.length === SHORT_CODE_SUFFIX_LENGTH && isAlphanumeric) {
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

  // Fallback: For alphanumeric codes (4-6 chars), search by partial match on shortCode
  // This handles cases where shortCodeSuffix field might not exist on older registrations
  if (isAlphanumeric && trimmed.length >= SHORT_CODE_SUFFIX_LENGTH && trimmed.length <= SHORT_CODE_LENGTH) {
    const result = await findRegistrationByPartialShortCode(upperTrimmed);
    if (result) {
      return result;
    }
  }

  return null;
}

/**
 * Looks up a registration using the rate-limited Cloud Function.
 * This function calls the server-side lookupRegistrationSecure function which:
 * - Rate limits requests to prevent abuse (10 requests/minute for public users)
 * - Exempts authenticated admins/volunteers from rate limiting
 * - Returns masked data (partial email, masked names) for privacy
 * - Logs access for audit purposes
 *
 * Use this for public-facing status pages where rate limiting is needed.
 * For admin operations, use lookupRegistration() instead.
 *
 * @param {string} identifier - Registration ID, short code (4 or 6 chars), email, or phone
 * @returns {Promise<Object|null>} Masked registration data or null
 * @throws {Error} If rate limit exceeded or other server error
 */
export async function secureLookupRegistration(identifier) {
  if (!identifier) {
    return null;
  }

  try {
    const lookupRegistrationSecureFn = httpsCallable(functions, 'lookupRegistrationSecure');
    const result = await lookupRegistrationSecureFn({
      identifier: identifier.trim(),
    });

    return result.data;
  } catch (error) {
    // Handle Firebase function errors
    if (error.code === 'functions/resource-exhausted') {
      throw new Error('Too many lookup requests. Please wait a minute and try again.');
    }
    if (error.code === 'functions/not-found') {
      return null;
    }
    if (error.code === 'functions/invalid-argument') {
      throw new Error(error.message || 'Please provide a valid registration ID, email, or phone number');
    }
    throw error;
  }
}

/**
 * Fallback search for registrations by partial short code match.
 * Searches through registrations to find ones where the shortCode ends with or equals the search term.
 * Used when direct field queries don't find a match.
 *
 * @param {string} searchTerm - Uppercase alphanumeric search term (4-6 chars)
 * @returns {Promise<Object|null>} Registration data or null
 */
async function findRegistrationByPartialShortCode(searchTerm) {
  const registrationsRef = collection(db, COLLECTIONS.REGISTRATIONS);

  // Fetch a limited set of registrations to search through
  // Use status filter to prioritize confirmed registrations
  const registrationQuery = query(
    registrationsRef,
    where('status', 'in', [
      REGISTRATION_STATUS.CONFIRMED,
      REGISTRATION_STATUS.PENDING_PAYMENT,
      REGISTRATION_STATUS.PENDING_VERIFICATION,
    ]),
    limit(500)
  );

  const snapshot = await getDocs(registrationQuery);

  // Client-side search for partial short code match
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const shortCode = (data.shortCode || '').toUpperCase();

    // Check if shortCode ends with the search term (for 4-char suffix)
    // or equals the search term (for 6-char full code)
    if (shortCode.endsWith(searchTerm) || shortCode === searchTerm) {
      return {
        id: docSnap.id,
        ...data,
      };
    }
  }

  return null;
}

/**
 * Gets the total number of confirmed attendees for the conference.
 * Counts both primary attendees and additional attendees from confirmed registrations.
 * This is used to check against conference capacity limits.
 *
 * @returns {Promise<number>} Total number of confirmed attendees
 */
export async function getTotalConfirmedAttendeeCount() {
  try {
    const registrationsRef = collection(db, COLLECTIONS.REGISTRATIONS);
    const confirmedQuery = query(
      registrationsRef,
      where('status', 'in', [
        REGISTRATION_STATUS.CONFIRMED,
        REGISTRATION_STATUS.PENDING_VERIFICATION,
      ])
    );

    const snapshot = await getDocs(confirmedQuery);

    let totalAttendees = 0;
    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      // Count primary attendee
      totalAttendees += 1;
      // Count additional attendees
      totalAttendees += (data.additionalAttendees?.length || 0);
    });

    return totalAttendees;
  } catch (error) {
    console.error('Failed to get total attendee count:', error);
    return 0;
  }
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

/**
 * Decrements workshop registered count atomically.
 * Used when a registration is cancelled or waitlist offer expires.
 *
 * @param {string} workshopId - Workshop session ID
 * @returns {Promise<void>}
 */
export async function decrementWorkshopCount(workshopId) {
  if (!workshopId) {
    return;
  }

  const workshopRef = doc(db, COLLECTIONS.SESSIONS, workshopId);

  await runTransaction(db, async (transaction) => {
    const workshopDoc = await transaction.get(workshopRef);
    if (workshopDoc.exists()) {
      const currentCount = workshopDoc.data().registeredCount || 0;
      // Don't go below 0
      const newCount = Math.max(0, currentCount - 1);
      transaction.update(workshopRef, {
        registeredCount: newCount,
        updatedAt: serverTimestamp(),
      });
    }
  });
}

/**
 * Gets the total number of waitlisted registrations.
 * Counts registrations with status WAITLISTED or WAITLIST_OFFERED.
 *
 * @returns {Promise<number>} Total number of waitlisted registrations
 */
export async function getWaitlistCount() {
  try {
    const registrationsRef = collection(db, COLLECTIONS.REGISTRATIONS);
    const waitlistQuery = query(
      registrationsRef,
      where('status', 'in', [
        REGISTRATION_STATUS.WAITLISTED,
        REGISTRATION_STATUS.WAITLIST_OFFERED,
      ])
    );

    const snapshot = await getDocs(waitlistQuery);
    return snapshot.size;
  } catch (error) {
    console.error('Failed to get waitlist count:', error);
    return 0;
  }
}

/**
 * Gets the count of registrations with WAITLISTED status only (excluding WAITLIST_OFFERED).
 * Used for calculating accurate waitlist position for new registrants.
 *
 * @returns {Promise<number>} Count of WAITLISTED registrations only
 */
export async function getWaitlistedOnlyCount() {
  try {
    const registrationsRef = collection(db, COLLECTIONS.REGISTRATIONS);
    const waitlistQuery = query(
      registrationsRef,
      where('status', '==', REGISTRATION_STATUS.WAITLISTED)
    );

    const snapshot = await getDocs(waitlistQuery);
    return snapshot.size;
  } catch (error) {
    console.error('Failed to get waitlisted only count:', error);
    return 0;
  }
}

/**
 * Gets all waitlisted registrations ordered by waitlist position (FIFO).
 *
 * @returns {Promise<Array>} Array of waitlisted registrations sorted by waitlistedAt
 */
export async function getWaitlistedRegistrations() {
  try {
    const registrationsRef = collection(db, COLLECTIONS.REGISTRATIONS);
    const waitlistQuery = query(
      registrationsRef,
      where('status', '==', REGISTRATION_STATUS.WAITLISTED)
    );

    const snapshot = await getDocs(waitlistQuery);
    const registrations = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    // Sort by waitlistedAt (FIFO order)
    registrations.sort((a, b) => {
      const dateA = a.waitlistedAt?.toDate?.() || new Date(a.waitlistedAt) || new Date(0);
      const dateB = b.waitlistedAt?.toDate?.() || new Date(b.waitlistedAt) || new Date(0);
      return dateA - dateB;
    });

    return registrations;
  } catch (error) {
    console.error('Failed to get waitlisted registrations:', error);
    return [];
  }
}

/**
 * Gets the waitlist position for a specific registration.
 *
 * @param {string} registrationId - Registration ID to check
 * @returns {Promise<number|null>} Position in waitlist (1-based) or null if not on waitlist
 */
export async function getWaitlistPosition(registrationId) {
  try {
    const registration = await getRegistrationById(registrationId);
    if (!registration ||
        (registration.status !== REGISTRATION_STATUS.WAITLISTED &&
         registration.status !== REGISTRATION_STATUS.WAITLIST_OFFERED)) {
      return null;
    }

    const waitlistedRegistrations = await getWaitlistedRegistrations();
    const position = waitlistedRegistrations.findIndex((r) => r.id === registrationId);

    // For WAITLIST_OFFERED status, they're essentially at position 0 (being processed)
    if (registration.status === REGISTRATION_STATUS.WAITLIST_OFFERED) {
      return 0;
    }

    return position >= 0 ? position + 1 : null;
  } catch (error) {
    console.error('Failed to get waitlist position:', error);
    return null;
  }
}

/**
 * Creates a waitlisted registration (no payment required).
 *
 * @param {Object} registrationData - Registration data
 * @returns {Promise<Object>} Created waitlisted registration data
 */
export async function createWaitlistRegistration(registrationData) {
  const {
    registrationId,
    shortCode,
    primaryAttendee,
    additionalAttendees,
    church,
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
  const shortCodeSuffix = shortCode.slice(-SHORT_CODE_SUFFIX_LENGTH);

  const registrationDoc = {
    registrationId,
    shortCode,
    shortCodeSuffix,
    primaryAttendee: normalizedPrimaryAttendee,
    additionalAttendees: normalizedAdditionalAttendees,
    church,
    payment: {
      method: null,
      proofUrl: null,
      status: REGISTRATION_STATUS.WAITLISTED,
    },
    invoice: null,
    totalAmount,
    pricingTier,
    status: REGISTRATION_STATUS.WAITLISTED,
    // Waitlist-specific fields
    waitlistedAt: serverTimestamp(),
    waitlistOfferSentAt: null,
    waitlistOfferExpiresAt: null,
    promotedFromWaitlistAt: null,
    // No payment deadline for waitlisted registrations
    paymentDeadline: null,
    // Communication tracking
    confirmationEmailSent: false,
    waitlistEmailSent: false,
    waitlistOfferEmailSent: false,
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
    waitlistedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Calculates the payment deadline based on time until conference.
 *
 * @param {string} conferenceStartDate - Conference start date ISO string
 * @returns {Date} Payment deadline date
 */
export function calculateWaitlistPaymentDeadline(conferenceStartDate) {
  const now = new Date();
  const conferenceDate = new Date(conferenceStartDate);
  const hoursUntilConference = (conferenceDate - now) / (1000 * 60 * 60);

  let deadlineHours;
  if (hoursUntilConference <= 12) {
    deadlineHours = WAITLIST_DEADLINE_HOURS.LESS_THAN_12H;
  } else if (hoursUntilConference <= 24) {
    deadlineHours = WAITLIST_DEADLINE_HOURS.LESS_THAN_24H;
  } else if (hoursUntilConference <= 48) {
    deadlineHours = WAITLIST_DEADLINE_HOURS.LESS_THAN_48H;
  } else {
    deadlineHours = WAITLIST_DEADLINE_HOURS.DEFAULT;
  }

  // Ensure deadline doesn't exceed conference start time
  const deadline = new Date(now.getTime() + deadlineHours * 60 * 60 * 1000);
  return deadline < conferenceDate ? deadline : conferenceDate;
}

/**
 * Offers a slot to a waitlisted registration.
 * Updates status to WAITLIST_OFFERED and sets payment deadline.
 *
 * @param {string} registrationId - Registration ID
 * @param {string} conferenceStartDate - Conference start date ISO string
 * @param {string} adminId - Admin user ID (null for system-triggered)
 * @param {string} adminEmail - Admin email (null for system-triggered)
 * @returns {Promise<Object>} Updated registration
 */
export async function offerSlotToWaitlistedRegistration(
  registrationId,
  conferenceStartDate,
  adminId = null,
  adminEmail = null
) {
  const registration = await getRegistrationById(registrationId);
  if (!registration) {
    throw new Error(REGISTRATION_ERROR_CODES.REGISTRATION_NOT_FOUND);
  }

  if (registration.status !== REGISTRATION_STATUS.WAITLISTED) {
    throw new Error('Registration is not in waitlisted status');
  }

  const paymentDeadline = calculateWaitlistPaymentDeadline(conferenceStartDate);
  const docRef = doc(db, COLLECTIONS.REGISTRATIONS, registrationId);

  await updateDoc(docRef, {
    status: REGISTRATION_STATUS.WAITLIST_OFFERED,
    'payment.status': REGISTRATION_STATUS.WAITLIST_OFFERED,
    paymentDeadline: paymentDeadline.toISOString(),
    waitlistOfferSentAt: serverTimestamp(),
    waitlistOfferExpiresAt: paymentDeadline.toISOString(),
    updatedAt: serverTimestamp(),
  });

  // Increment workshop counts for all selected workshops
  const allWorkshopSelections = [
    ...(registration.primaryAttendee?.workshopSelections || []),
    ...(registration.additionalAttendees || []).flatMap((attendee) => attendee.workshopSelections || []),
  ];

  for (const selection of allWorkshopSelections) {
    if (selection.sessionId) {
      try {
        await incrementWorkshopCount(selection.sessionId);
      } catch (error) {
        console.error(`Failed to increment workshop count for ${selection.sessionId}:`, error);
      }
    }
  }

  // Log the activity
  if (adminId && adminEmail) {
    await logActivity({
      type: ACTIVITY_TYPES.UPDATE,
      entityType: ENTITY_TYPES.REGISTRATION,
      entityId: registrationId,
      description: `Offered waitlist slot to: ${registration.primaryAttendee?.firstName || ''} ${registration.primaryAttendee?.lastName || registrationId}`,
      adminId,
      adminEmail,
    });
  }

  return {
    ...registration,
    status: REGISTRATION_STATUS.WAITLIST_OFFERED,
    paymentDeadline: paymentDeadline.toISOString(),
    waitlistOfferExpiresAt: paymentDeadline.toISOString(),
  };
}

/**
 * Gets the next registration in waitlist (FIFO order).
 *
 * @returns {Promise<Object|null>} Next waitlisted registration or null
 */
export async function getNextWaitlistedRegistration() {
  const waitlistedRegistrations = await getWaitlistedRegistrations();
  return waitlistedRegistrations.length > 0 ? waitlistedRegistrations[0] : null;
}

/**
 * Marks a waitlist offer as expired and optionally promotes the next person.
 * Decrements workshop counts that were incremented when the offer was made.
 *
 * @param {string} registrationId - Registration ID with expired offer
 * @returns {Promise<void>}
 */
export async function expireWaitlistOffer(registrationId) {
  const registration = await getRegistrationById(registrationId);
  const docRef = doc(db, COLLECTIONS.REGISTRATIONS, registrationId);

  await updateDoc(docRef, {
    status: REGISTRATION_STATUS.WAITLIST_EXPIRED,
    'payment.status': REGISTRATION_STATUS.WAITLIST_EXPIRED,
    updatedAt: serverTimestamp(),
  });

  // Decrement workshop counts for all selected workshops
  if (registration) {
    const allWorkshopSelections = [
      ...(registration.primaryAttendee?.workshopSelections || []),
      ...(registration.additionalAttendees || []).flatMap((attendee) => attendee.workshopSelections || []),
    ];

    for (const selection of allWorkshopSelections) {
      if (selection.sessionId) {
        try {
          await decrementWorkshopCount(selection.sessionId);
        } catch (error) {
          console.error(`Failed to decrement workshop count for ${selection.sessionId}:`, error);
        }
      }
    }
  }
}

/**
 * Cancels a waitlisted registration (user-initiated).
 *
 * @param {string} registrationId - Registration ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<void>}
 */
export async function cancelWaitlistRegistration(registrationId, reason = 'User cancelled') {
  const registration = await getRegistrationById(registrationId);
  if (!registration) {
    throw new Error(REGISTRATION_ERROR_CODES.REGISTRATION_NOT_FOUND);
  }

  const validStatuses = [
    REGISTRATION_STATUS.WAITLISTED,
    REGISTRATION_STATUS.WAITLIST_OFFERED,
  ];

  if (!validStatuses.includes(registration.status)) {
    throw new Error('Only waitlisted registrations can be cancelled this way');
  }

  const docRef = doc(db, COLLECTIONS.REGISTRATIONS, registrationId);

  await updateDoc(docRef, {
    status: REGISTRATION_STATUS.CANCELLED,
    'payment.status': REGISTRATION_STATUS.CANCELLED,
    cancellation: {
      reason,
      cancelledBy: 'user',
      cancelledAt: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
  });
}

/**
 * Cancels a user registration (user-initiated from status page).
 * Allows users to cancel their own PENDING_PAYMENT, PENDING_VERIFICATION, or CONFIRMED registrations.
 * Decrements workshop counts if applicable.
 *
 * @param {string} registrationId - Registration ID
 * @param {string} reason - Cancellation reason provided by user
 * @param {Object} refundEligibility - Refund eligibility info at time of cancellation
 * @param {string} refundEligibility.type - 'full', 'partial', or 'none'
 * @param {number} refundEligibility.percent - Refund percentage (0-100)
 * @returns {Promise<void>}
 */
export async function cancelUserRegistration(registrationId, reason, refundEligibility = null) {
  const registration = await getRegistrationById(registrationId);
  if (!registration) {
    throw new Error(REGISTRATION_ERROR_CODES.REGISTRATION_NOT_FOUND);
  }

  const validStatuses = [
    REGISTRATION_STATUS.PENDING_PAYMENT,
    REGISTRATION_STATUS.PENDING_VERIFICATION,
    REGISTRATION_STATUS.CONFIRMED,
  ];

  if (!validStatuses.includes(registration.status)) {
    throw new Error('This registration cannot be cancelled. Please contact support.');
  }

  const docRef = doc(db, COLLECTIONS.REGISTRATIONS, registrationId);

  // Decrement workshop counts if the registration had them incremented
  // (all statuses except WAITLISTED have counts incremented)
  const allWorkshopSelections = [
    ...(registration.primaryAttendee?.workshopSelections || []),
    ...(registration.additionalAttendees || []).flatMap((attendee) => attendee.workshopSelections || []),
  ];

  for (const selection of allWorkshopSelections) {
    if (selection.sessionId) {
      try {
        await decrementWorkshopCount(selection.sessionId);
      } catch (error) {
        console.error(`Failed to decrement workshop count for ${selection.sessionId}:`, error);
      }
    }
  }

  await updateDoc(docRef, {
    status: REGISTRATION_STATUS.CANCELLED,
    'payment.status': REGISTRATION_STATUS.CANCELLED,
    cancellation: {
      reason,
      cancelledBy: 'user',
      cancelledAt: serverTimestamp(),
      refundEligibility: refundEligibility ? {
        type: refundEligibility.type,
        percent: refundEligibility.percent,
      } : null,
    },
    updatedAt: serverTimestamp(),
  });
}

/**
 * Transfers a registration to a new attendee (user-initiated from status page).
 * Allows users to transfer their registration to another person.
 * The new attendee inherits the payment status and workshop selections.
 *
 * @param {string} registrationId - Registration ID
 * @param {Object} newAttendee - New attendee information
 * @param {string} newAttendee.firstName - New attendee first name
 * @param {string} newAttendee.lastName - New attendee last name
 * @param {string} newAttendee.middleName - New attendee middle name
 * @param {string} newAttendee.email - New attendee email
 * @param {string} newAttendee.cellphone - New attendee cellphone
 * @param {string} newAttendee.ministryRole - New attendee ministry role
 * @param {string} transferReason - Reason for the transfer
 * @returns {Promise<void>}
 */
export async function transferUserRegistration(registrationId, newAttendee, transferReason) {
  const registration = await getRegistrationById(registrationId);
  if (!registration) {
    throw new Error(REGISTRATION_ERROR_CODES.REGISTRATION_NOT_FOUND);
  }

  const validStatuses = [
    REGISTRATION_STATUS.PENDING_PAYMENT,
    REGISTRATION_STATUS.PENDING_VERIFICATION,
    REGISTRATION_STATUS.CONFIRMED,
  ];

  if (!validStatuses.includes(registration.status)) {
    throw new Error('This registration cannot be transferred. Please contact support.');
  }

  // Check if the new email is already registered
  const existingRegistration = await getRegistrationByEmail(newAttendee.email);
  if (existingRegistration && existingRegistration.id !== registrationId) {
    throw new Error('The new attendee email is already registered for this event.');
  }

  const docRef = doc(db, COLLECTIONS.REGISTRATIONS, registrationId);

  // Store the original attendee info before transfer
  const originalAttendee = registration.primaryAttendee;

  // Create the updated primary attendee (keep workshop selections, category from original)
  const updatedPrimaryAttendee = {
    ...originalAttendee,
    firstName: newAttendee.firstName.trim(),
    lastName: newAttendee.lastName.trim(),
    middleName: newAttendee.middleName?.trim() || '',
    email: newAttendee.email.trim().toLowerCase(),
    cellphone: newAttendee.cellphone.replace(/[\s-]/g, ''),
    ministryRole: newAttendee.ministryRole || originalAttendee.ministryRole,
  };

  await updateDoc(docRef, {
    primaryAttendee: updatedPrimaryAttendee,
    transfer: {
      transferredAt: serverTimestamp(),
      transferredBy: 'user',
      reason: transferReason,
      originalAttendee: {
        firstName: originalAttendee.firstName,
        lastName: originalAttendee.lastName,
        email: originalAttendee.email,
        cellphone: originalAttendee.cellphone,
      },
    },
    updatedAt: serverTimestamp(),
  });
}

/**
 * Updates payment proof for a waitlist-offered registration.
 * Changes status to pending_verification.
 *
 * @param {string} registrationId - Registration ID
 * @param {string} paymentProofUrl - URL of the uploaded payment proof
 * @param {string} paymentMethod - Payment method used
 * @returns {Promise<void>}
 */
export async function uploadWaitlistPayment(registrationId, paymentProofUrl, paymentMethod) {
  const registration = await getRegistrationById(registrationId);
  if (!registration) {
    throw new Error(REGISTRATION_ERROR_CODES.REGISTRATION_NOT_FOUND);
  }

  if (registration.status !== REGISTRATION_STATUS.WAITLIST_OFFERED) {
    throw new Error('Registration must have an active slot offer to upload payment');
  }

  const docRef = doc(db, COLLECTIONS.REGISTRATIONS, registrationId);

  await updateDoc(docRef, {
    status: REGISTRATION_STATUS.PENDING_VERIFICATION,
    'payment.proofUrl': paymentProofUrl,
    'payment.method': paymentMethod,
    'payment.status': REGISTRATION_STATUS.PENDING_VERIFICATION,
    'payment.uploadedAt': serverTimestamp(),
    promotedFromWaitlistAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Checks conference and waitlist availability.
 *
 * @param {Object} settings - Conference settings
 * @param {number} attendeeCount - Number of attendees being registered
 * @returns {Promise<Object>} Availability status
 */
export async function checkRegistrationAvailability(settings, attendeeCount = 1) {
  const conferenceCapacity = settings?.conferenceCapacity;
  const waitlistEnabled = settings?.waitlist?.enabled || false;
  const waitlistCapacity = settings?.waitlist?.capacity;

  // If no capacity limit, registration is always open
  if (!conferenceCapacity) {
    return {
      canRegister: true,
      isWaitlist: false,
      message: null,
    };
  }

  const confirmedCount = await getTotalConfirmedAttendeeCount();
  const remainingSlots = conferenceCapacity - confirmedCount;

  // If there are enough slots, allow regular registration
  if (remainingSlots >= attendeeCount) {
    return {
      canRegister: true,
      isWaitlist: false,
      remainingSlots,
      message: null,
    };
  }

  // Conference is full, check waitlist
  if (!waitlistEnabled) {
    return {
      canRegister: false,
      isWaitlist: false,
      message: 'Registration is closed. The conference has reached maximum capacity.',
    };
  }

  // Check waitlist capacity (includes both WAITLISTED and WAITLIST_OFFERED)
  const waitlistCount = await getWaitlistCount();

  if (waitlistCapacity && waitlistCount >= waitlistCapacity) {
    return {
      canRegister: false,
      isWaitlist: false,
      message: 'Registration is closed. Both the conference and waitlist are full.',
    };
  }

  // Get count of only WAITLISTED registrations for accurate position calculation
  // WAITLIST_OFFERED registrations are not counted as they are being processed
  const waitlistedOnlyCount = await getWaitlistedOnlyCount();

  // Waitlist is available
  return {
    canRegister: true,
    isWaitlist: true,
    waitlistPosition: waitlistedOnlyCount + 1,
    message: 'The conference is full, but you can join the waitlist.',
  };
}

/**
 * Gets all attendees registered for a specific workshop.
 * Searches both primary attendees and additional attendees for workshop selections
 * matching the given workshop ID.
 *
 * @param {string} workshopId - The workshop session ID to search for
 * @returns {Promise<Array>} Array of attendee objects with registration info
 */
export async function getWorkshopAttendees(workshopId) {
  if (!workshopId) {
    return [];
  }

  const registrationsRef = collection(db, COLLECTIONS.REGISTRATIONS);
  const confirmedQuery = query(
    registrationsRef,
    where('status', '==', REGISTRATION_STATUS.CONFIRMED)
  );

  const snapshot = await getDocs(confirmedQuery);
  const attendees = [];

  snapshot.docs.forEach((docSnap) => {
    const registration = docSnap.data();
    const registrationId = docSnap.id;

    // Check primary attendee's workshop selections
    const primarySelections = registration.primaryAttendee?.workshopSelections || [];
    const primaryHasWorkshop = primarySelections.some(
      (selection) => selection.sessionId === workshopId
    );

    if (primaryHasWorkshop) {
      attendees.push({
        registrationId,
        shortCode: registration.shortCode,
        firstName: registration.primaryAttendee?.firstName || '',
        lastName: registration.primaryAttendee?.lastName || '',
        email: registration.primaryAttendee?.email || '',
        cellphone: registration.primaryAttendee?.cellphone || '',
        church: registration.church,
        ministryRole: registration.primaryAttendee?.ministryRole || '',
        category: registration.primaryAttendee?.category || '',
        checkedIn: registration.checkedIn || false,
        isPrimary: true,
      });
    }

    // Check additional attendees' workshop selections
    const additionalAttendees = registration.additionalAttendees || [];
    additionalAttendees.forEach((attendee, index) => {
      const attendeeSelections = attendee.workshopSelections || [];
      const hasWorkshop = attendeeSelections.some(
        (selection) => selection.sessionId === workshopId
      );

      if (hasWorkshop) {
        attendees.push({
          registrationId,
          shortCode: registration.shortCode,
          firstName: attendee.firstName || '',
          lastName: attendee.lastName || '',
          email: attendee.email || '',
          cellphone: attendee.cellphone || '',
          church: registration.church,
          ministryRole: attendee.ministryRole || '',
          category: attendee.category || '',
          checkedIn: registration.additionalAttendeesCheckedIn?.[index] || false,
          isPrimary: false,
        });
      }
    });
  });

  // Sort by last name, then first name
  attendees.sort((a, b) => {
    const lastNameCompare = a.lastName.localeCompare(b.lastName);
    if (lastNameCompare !== 0) return lastNameCompare;
    return a.firstName.localeCompare(b.firstName);
  });

  return attendees;
}

// ============================================
// Verification Code Functions
// ============================================

/**
 * Verification action types for cancel/transfer
 */
export const VERIFICATION_ACTION = {
  CANCEL: 'cancel',
  TRANSFER: 'transfer',
};

/**
 * Sends a verification code for cancel/transfer operations.
 * The code will be sent to the registered email (and optionally SMS).
 *
 * @param {string} registrationId - Registration ID
 * @param {string} action - Action type: 'cancel' or 'transfer'
 * @param {boolean} sendSms - Whether to also send SMS (optional)
 * @returns {Promise<Object>} Result with success status and expiry info
 */
export async function sendVerificationCode(registrationId, action, sendSms = false) {
  if (!registrationId) {
    throw new Error('Registration ID is required');
  }

  if (!action || !Object.values(VERIFICATION_ACTION).includes(action)) {
    throw new Error('Invalid action type. Must be "cancel" or "transfer"');
  }

  try {
    const sendVerificationCodeFn = httpsCallable(functions, 'sendVerificationCode');
    const result = await sendVerificationCodeFn({
      registrationId,
      action,
      sendSms,
    });

    return result.data;
  } catch (error) {
    // Handle Firebase function errors
    if (error.code === 'functions/resource-exhausted') {
      throw new Error('Too many verification code requests. Please try again later.');
    }
    if (error.code === 'functions/not-found') {
      throw new Error('Registration not found');
    }
    if (error.code === 'functions/failed-precondition') {
      throw new Error(error.message || 'Unable to send verification code');
    }
    throw error;
  }
}

/**
 * Verifies a verification code for cancel/transfer operations.
 *
 * @param {string} registrationId - Registration ID
 * @param {string} action - Action type: 'cancel' or 'transfer'
 * @param {string} code - The verification code to verify
 * @returns {Promise<Object>} Result with success and verified status
 */
export async function verifyCode(registrationId, action, code) {
  if (!registrationId || !action || !code) {
    throw new Error('Registration ID, action, and code are required');
  }

  try {
    const verifyCodeFn = httpsCallable(functions, 'verifyCode');
    const result = await verifyCodeFn({
      registrationId,
      action,
      code: code.trim(),
    });

    return result.data;
  } catch (error) {
    // Handle Firebase function errors
    if (error.code === 'functions/resource-exhausted') {
      throw new Error('Too many verification attempts. Please request a new code.');
    }
    if (error.code === 'functions/not-found') {
      throw new Error('No verification code found. Please request a new code.');
    }
    if (error.code === 'functions/permission-denied') {
      throw new Error(error.message || 'Invalid verification code');
    }
    if (error.code === 'functions/failed-precondition') {
      throw new Error(error.message || 'Code expired or already used');
    }
    throw error;
  }
}

/**
 * Sends a notification email to the new attendee after a transfer.
 * This should be called after a successful transfer operation.
 *
 * @param {string} registrationId - Registration ID
 * @param {string} newAttendeeEmail - New attendee's email
 * @param {string} newAttendeeName - New attendee's name (first + last)
 * @param {string} originalAttendeeName - Original attendee's name (first + last)
 * @returns {Promise<Object>} Result with success status
 */
export async function sendTransferNotification(
  registrationId,
  newAttendeeEmail,
  newAttendeeName,
  originalAttendeeName
) {
  if (!registrationId || !newAttendeeEmail || !newAttendeeName) {
    throw new Error('Registration ID, new attendee email, and name are required');
  }

  try {
    const sendTransferNotificationFn = httpsCallable(functions, 'sendTransferNotification');
    const result = await sendTransferNotificationFn({
      registrationId,
      newAttendeeEmail,
      newAttendeeName,
      originalAttendeeName,
    });

    return result.data;
  } catch (error) {
    // Transfer notification failure is not critical - don't throw
    console.error('Failed to send transfer notification:', error);
    return { success: false, emailSent: false, error: error.message };
  }
}

/**
 * Sends a confirmation email to the original attendee after a successful transfer.
 * This notifies the original attendee that their registration has been transferred.
 *
 * @param {string} registrationId - Registration ID
 * @param {string} originalAttendeeEmail - Original attendee's email
 * @param {string} originalAttendeeName - Original attendee's name (first + last)
 * @param {string} newAttendeeName - New attendee's name (first + last)
 * @returns {Promise<Object>} Result with success status
 */
export async function sendTransferConfirmation(
  registrationId,
  originalAttendeeEmail,
  originalAttendeeName,
  newAttendeeName
) {
  if (!registrationId || !originalAttendeeEmail || !originalAttendeeName) {
    throw new Error('Registration ID, original attendee email, and name are required');
  }

  try {
    const sendTransferConfirmationFn = httpsCallable(functions, 'sendTransferConfirmation');
    const result = await sendTransferConfirmationFn({
      registrationId,
      originalAttendeeEmail,
      originalAttendeeName,
      newAttendeeName,
    });

    return result.data;
  } catch (error) {
    // Transfer confirmation failure is not critical - don't throw
    console.error('Failed to send transfer confirmation:', error);
    return { success: false, emailSent: false, error: error.message };
  }
}
