/**
 * Invoice Service
 * Handles invoice request tracking, upload, and delivery operations.
 *
 * @module services/invoice
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { COLLECTIONS, INVOICE_STATUS, REGISTRATION_STATUS, CONFERENCE } from '../constants';

/**
 * Error codes for invoice operations
 */
export const INVOICE_ERROR_CODES = {
  NOT_FOUND: 'INVOICE_NOT_FOUND',
  NO_INVOICE_REQUEST: 'NO_INVOICE_REQUEST',
  INVALID_STATUS: 'INVALID_STATUS',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  EMAIL_FAILED: 'EMAIL_FAILED',
  GENERATION_FAILED: 'GENERATION_FAILED',
  REGISTRATION_NOT_CONFIRMED: 'REGISTRATION_NOT_CONFIRMED',
};

/**
 * Generates the next invoice number using atomic Firestore transaction
 * Invoice numbers follow the format: INV-YYYY-NNNN (e.g., INV-2026-0001)
 * Uses the conference year from settings to ensure consistency.
 *
 * @returns {Promise<string>} The generated invoice number (e.g., "INV-2026-0042")
 * @throws {Error} If the transaction fails
 *
 * @example
 * const invoiceNumber = await generateInvoiceNumber();
 * // Returns: "INV-2026-0001"
 */
async function generateInvoiceNumber() {
  const counterRef = doc(db, 'settings', 'invoiceCounter');
  const conferenceYear = CONFERENCE.YEAR;

  try {
    const invoiceNumber = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);

      if (!counterDoc.exists() || counterDoc.data().year !== conferenceYear) {
        // Reset counter for new year or first invoice
        transaction.set(counterRef, {
          year: conferenceYear,
          lastNumber: 1,
          updatedAt: new Date(),
        });
        return `INV-${conferenceYear}-0001`;
      }

      const nextNumber = counterDoc.data().lastNumber + 1;
      transaction.update(counterRef, {
        lastNumber: nextNumber,
        updatedAt: new Date(),
      });

      return `INV-${conferenceYear}-${String(nextNumber).padStart(4, '0')}`;
    });

    return invoiceNumber;
  } catch (error) {
    console.error('Error generating invoice number:', error);
    throw new Error('Failed to generate invoice number');
  }
}

/**
 * Gets all registrations with invoice requests
 *
 * @param {Object} options - Query options
 * @param {string} options.status - Filter by invoice status (pending, uploaded, sent, failed)
 * @param {boolean} options.confirmedOnly - Only return confirmed registrations
 * @param {number} options.limit - Maximum number of results (default: 50)
 * @returns {Promise<Array>} Array of registration objects with invoice requests
 */
export async function getInvoiceRequests({
  status = null,
  confirmedOnly = true,
  limit = 50,
} = {}) {
  const registrationsRef = collection(db, COLLECTIONS.REGISTRATIONS);

  // Build query
  let constraints = [];

  // Only confirmed registrations by default
  if (confirmedOnly) {
    constraints.push(where('status', '==', REGISTRATION_STATUS.CONFIRMED));
  }

  // Only registrations with invoice requests
  constraints.push(where('invoice.requested', '==', true));

  // Filter by invoice status if provided
  if (status) {
    constraints.push(where('invoice.status', '==', status));
  }

  // Order by payment verification date (most recent first)
  constraints.push(orderBy('payment.verifiedAt', 'desc'));

  // Limit results
  constraints.push(firestoreLimit(limit));

  const invoiceQuery = query(registrationsRef, ...constraints);
  const snapshot = await getDocs(invoiceQuery);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

/**
 * Gets a registration by ID and validates it has an invoice request
 *
 * @param {string} registrationId - Registration ID
 * @returns {Promise<Object>} Registration object
 * @throws {Error} If registration not found or has no invoice request
 */
export async function getRegistrationWithInvoice(registrationId) {
  if (!registrationId) {
    throw new Error(INVOICE_ERROR_CODES.NOT_FOUND);
  }

  const docRef = doc(db, COLLECTIONS.REGISTRATIONS, registrationId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    throw new Error(INVOICE_ERROR_CODES.NOT_FOUND);
  }

  const registration = {
    id: snapshot.id,
    ...snapshot.data(),
  };

  // Validate invoice request exists
  if (!registration.invoice?.requested) {
    throw new Error(INVOICE_ERROR_CODES.NO_INVOICE_REQUEST);
  }

  return registration;
}

/**
 * Updates invoice information after upload
 *
 * @param {string} registrationId - Registration ID
 * @param {Object} invoiceData - Invoice data
 * @param {string} invoiceData.invoiceUrl - Firebase Storage URL of invoice file
 * @param {string} invoiceData.invoiceNumber - Generated invoice number
 * @param {string} adminEmail - Email of admin who uploaded invoice
 * @returns {Promise<void>}
 * @throws {Error} If registration not found or update fails
 */
export async function updateInvoiceUpload(registrationId, invoiceData, adminEmail) {
  const registration = await getRegistrationWithInvoice(registrationId);

  // Validate registration is confirmed
  if (registration.status !== REGISTRATION_STATUS.CONFIRMED) {
    throw new Error(INVOICE_ERROR_CODES.REGISTRATION_NOT_CONFIRMED);
  }

  const docRef = doc(db, COLLECTIONS.REGISTRATIONS, registrationId);

  await updateDoc(docRef, {
    'invoice.invoiceUrl': invoiceData.invoiceUrl,
    'invoice.invoiceNumber': invoiceData.invoiceNumber,
    'invoice.status': INVOICE_STATUS.UPLOADED,
    'invoice.generatedAt': serverTimestamp(),
    'invoice.uploadedBy': adminEmail,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Marks invoice as sent after email delivery
 *
 * @param {string} registrationId - Registration ID
 * @param {string} adminEmail - Email of admin who sent invoice
 * @returns {Promise<void>}
 * @throws {Error} If registration not found or invoice not uploaded
 */
export async function markInvoiceSent(registrationId, adminEmail) {
  const registration = await getRegistrationWithInvoice(registrationId);

  // Validate invoice has been uploaded
  if (!registration.invoice?.invoiceUrl) {
    throw new Error(INVOICE_ERROR_CODES.UPLOAD_FAILED);
  }

  const docRef = doc(db, COLLECTIONS.REGISTRATIONS, registrationId);

  await updateDoc(docRef, {
    'invoice.status': INVOICE_STATUS.SENT,
    'invoice.sentAt': serverTimestamp(),
    'invoice.sentBy': adminEmail,
    'invoice.emailDeliveryStatus': 'sent',
    updatedAt: serverTimestamp(),
  });
}

/**
 * Marks invoice email delivery as failed
 *
 * @param {string} registrationId - Registration ID
 * @param {string} errorMessage - Error message from email service
 * @returns {Promise<void>}
 */
export async function markInvoiceFailed(registrationId, errorMessage) {
  // Validate registration exists and has invoice request
  await getRegistrationWithInvoice(registrationId);

  const docRef = doc(db, COLLECTIONS.REGISTRATIONS, registrationId);

  await updateDoc(docRef, {
    'invoice.status': INVOICE_STATUS.FAILED,
    'invoice.emailDeliveryStatus': 'failed',
    'invoice.errorMessage': errorMessage,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Generates a new invoice number and reserves it for a registration
 *
 * @param {string} registrationId - Registration ID
 * @returns {Promise<string>} The generated invoice number
 */
export async function generateAndReserveInvoiceNumber(registrationId) {
  // Validate registration exists and has invoice request
  await getRegistrationWithInvoice(registrationId);

  // Generate new invoice number
  const invoiceNumber = await generateInvoiceNumber();

  // Update registration with invoice number
  const docRef = doc(db, COLLECTIONS.REGISTRATIONS, registrationId);
  await updateDoc(docRef, {
    'invoice.invoiceNumber': invoiceNumber,
    updatedAt: serverTimestamp(),
  });

  return invoiceNumber;
}

/**
 * Gets count of invoice requests by status
 *
 * @returns {Promise<Object>} Object with counts by status
 */
export async function getInvoiceRequestCounts() {
  const registrationsRef = collection(db, COLLECTIONS.REGISTRATIONS);

  // Query for all confirmed registrations with invoice requests
  const allInvoicesQuery = query(
    registrationsRef,
    where('status', '==', REGISTRATION_STATUS.CONFIRMED),
    where('invoice.requested', '==', true)
  );

  const snapshot = await getDocs(allInvoicesQuery);

  // Count by status
  const counts = {
    total: snapshot.size,
    pending: 0,
    uploaded: 0,
    sent: 0,
    failed: 0,
  };

  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data();
    const status = data.invoice?.status || INVOICE_STATUS.PENDING;
    counts[status] = (counts[status] || 0) + 1;
  });

  return counts;
}

/**
 * Searches invoice requests by various criteria
 *
 * @param {string} searchTerm - Search term (registration ID, name, email, TIN)
 * @returns {Promise<Array>} Array of matching registrations
 */
export async function searchInvoiceRequests(searchTerm) {
  if (!searchTerm || searchTerm.trim().length < 3) {
    return [];
  }

  const registrationsRef = collection(db, COLLECTIONS.REGISTRATIONS);
  const normalizedSearch = searchTerm.trim().toLowerCase();

  // Get all invoice requests (limited to 100 for performance)
  const invoicesQuery = query(
    registrationsRef,
    where('status', '==', REGISTRATION_STATUS.CONFIRMED),
    where('invoice.requested', '==', true),
    firestoreLimit(100)
  );

  const snapshot = await getDocs(invoicesQuery);

  // Filter in memory for flexible searching
  const results = snapshot.docs
    .map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }))
    .filter((registration) => {
      const registrationId = registration.registrationId?.toLowerCase() || '';
      const shortCode = registration.shortCode?.toLowerCase() || '';
      const primaryEmail = registration.primaryAttendee?.email?.toLowerCase() || '';
      const primaryName = `${registration.primaryAttendee?.firstName} ${registration.primaryAttendee?.lastName}`.toLowerCase();
      const invoiceName = registration.invoice?.name?.toLowerCase() || '';
      const tin = registration.invoice?.tin?.toLowerCase() || '';

      return (
        registrationId.includes(normalizedSearch) ||
        shortCode.includes(normalizedSearch) ||
        primaryEmail.includes(normalizedSearch) ||
        primaryName.includes(normalizedSearch) ||
        invoiceName.includes(normalizedSearch) ||
        tin.includes(normalizedSearch)
      );
    });

  return results;
}
