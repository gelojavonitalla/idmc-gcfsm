/**
 * Contact Inquiries Service
 * Provides functions to submit contact inquiries to Firestore.
 *
 * @module services/contactInquiries
 */

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { COLLECTIONS, CONTACT_INQUIRY_STATUS } from '../constants';

/**
 * Validates an email address using a comprehensive regex pattern.
 * This pattern handles most valid email formats including:
 * - Multiple dots in domain
 * - Special characters in local part (with proper quoting)
 * - Subdomains
 *
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const trimmedEmail = email.trim();

  if (trimmedEmail.length > 254) {
    return false;
  }

  const localPart = trimmedEmail.split('@')[0];
  if (localPart && localPart.length > 64) {
    return false;
  }

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(trimmedEmail);
}

/**
 * Submits a contact inquiry to Firestore.
 *
 * @param {Object} inquiryData - The contact inquiry data
 * @param {string} inquiryData.name - The name of the person submitting the inquiry
 * @param {string} inquiryData.email - The email address
 * @param {string} inquiryData.subject - The subject of the inquiry
 * @param {string} inquiryData.message - The message content
 * @returns {Promise<string>} The ID of the created inquiry document
 * @throws {Error} If the Firestore operation fails or validation fails
 */
export async function submitContactInquiry(inquiryData) {
  const { name, email, subject, message } = inquiryData;

  if (!name || !email || !subject || !message) {
    throw new Error('All fields are required');
  }

  if (!isValidEmail(email)) {
    throw new Error('Invalid email address');
  }

  const inquiriesRef = collection(db, COLLECTIONS.CONTACT_INQUIRIES);

  const docRef = await addDoc(inquiriesRef, {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    subject: subject.trim(),
    message: message.trim(),
    status: CONTACT_INQUIRY_STATUS.NEW,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}
