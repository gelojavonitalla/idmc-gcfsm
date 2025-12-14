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

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
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
