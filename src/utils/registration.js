/**
 * Registration Utility Functions
 * Provides helper functions for registration operations including
 * pricing tier detection, price calculation, and registration ID generation.
 */

import {
  PRICING_TIERS,
  CONFERENCE,
  REGISTRATION_CATEGORIES,
} from '../constants';

/**
 * Gets the current active pricing tier based on the current date.
 * Falls back to the last tier if no tier matches the current date.
 *
 * @returns {Object} The active pricing tier object
 */
export function getCurrentPricingTier() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const activeTier = PRICING_TIERS.find((tier) => {
    return today >= tier.startDate && today <= tier.endDate;
  });

  if (activeTier) {
    return activeTier;
  }

  // If no tier matches, check if before first tier or after last tier
  const firstTier = PRICING_TIERS[0];
  const lastTier = PRICING_TIERS[PRICING_TIERS.length - 1];

  if (today < firstTier.startDate) {
    return firstTier;
  }

  return lastTier;
}

/**
 * Calculates the registration price based on category and pricing tier.
 *
 * @param {string} category - The registration category (regular, student_senior)
 * @param {Object} tier - The pricing tier object (optional, defaults to current tier)
 * @returns {number} The calculated price
 */
export function calculatePrice(category, tier = null) {
  const pricingTier = tier || getCurrentPricingTier();

  switch (category) {
    case REGISTRATION_CATEGORIES.STUDENT_SENIOR:
      return pricingTier.studentPrice;
    case REGISTRATION_CATEGORIES.REGULAR:
    default:
      return pricingTier.regularPrice;
  }
}

/**
 * Generates a unique registration ID in the format REG-YYYY-NNNNN.
 * Uses timestamp and random number for uniqueness.
 *
 * @returns {string} The generated registration ID
 */
export function generateRegistrationId() {
  const year = CONFERENCE.YEAR;
  const timestamp = Date.now().toString().slice(-5);
  const random = Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, '0');
  const sequence = `${timestamp}${random}`.slice(-5);

  return `REG-${year}-${sequence}`;
}

/**
 * Checks if registration is currently open based on conference dates.
 *
 * @returns {boolean} True if registration is open
 */
export function isRegistrationOpen() {
  const now = new Date();
  const conferenceDate = new Date(CONFERENCE.START_DATE);

  // Registration closes on the conference start date
  return now < conferenceDate;
}

/**
 * Gets the number of days until the conference starts.
 *
 * @returns {number} Days until conference
 */
export function getDaysUntilConference() {
  const now = new Date();
  const conferenceDate = new Date(CONFERENCE.START_DATE);
  const diffTime = conferenceDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Formats a price with currency symbol.
 *
 * @param {number} amount - The price amount
 * @param {string} currency - The currency code (default: PHP)
 * @returns {string} Formatted price string
 */
export function formatPrice(amount, currency = 'PHP') {
  return `${currency} ${amount.toLocaleString()}`;
}

/**
 * Validates an email address format.
 *
 * @param {string} email - The email to validate
 * @returns {boolean} True if valid email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a Philippine phone number format.
 * Accepts formats: 09XX-XXX-XXXX, +639XX-XXX-XXXX, 09XXXXXXXXX
 *
 * @param {string} phone - The phone number to validate
 * @returns {boolean} True if valid phone format
 */
export function isValidPhoneNumber(phone) {
  const cleanPhone = phone.replace(/[\s-]/g, '');
  const phRegex = /^(\+63|0)?9\d{9}$/;
  return phRegex.test(cleanPhone);
}

/**
 * Calculates the payment deadline date.
 *
 * @param {number} days - Number of days from now (default: 7)
 * @returns {Date} The deadline date
 */
export function getPaymentDeadline(days = 7) {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + days);
  return deadline;
}

/**
 * Formats a date to a readable string.
 *
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  return date.toLocaleDateString('en-PH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Checks if a category requires proof/verification.
 *
 * @param {string} category - The registration category
 * @returns {boolean} True if proof is required
 */
export function requiresProof(category) {
  return category === REGISTRATION_CATEGORIES.STUDENT_SENIOR;
}
