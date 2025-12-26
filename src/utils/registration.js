/**
 * Registration Utility Functions
 * Provides helper functions for registration operations including
 * pricing tier detection, price calculation, and registration ID generation.
 */

import {
  PRICING_TIERS,
  CONFERENCE,
  REGISTRATION_CATEGORIES,
  SAFE_SHORT_CODE_CHARS,
  SHORT_CODE_LENGTH,
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
 * Handles both legacy tier format (earlyBirdPrice, memberPrice, regularPrice)
 * and database tier format (regularPrice, studentPrice).
 *
 * @param {string} category - The registration category (early_bird, member, regular)
 * @param {Object} tier - The pricing tier object (optional, defaults to current tier)
 * @returns {number} The calculated price
 */
export function calculatePrice(category, tier = null) {
  const pricingTier = tier || getCurrentPricingTier();

  // Handle case where tier is null/undefined
  if (!pricingTier) {
    return 0;
  }

  switch (category) {
    case REGISTRATION_CATEGORIES.EARLY_BIRD:
      // Database tiers may not have earlyBirdPrice, fall back to regularPrice
      return pricingTier.earlyBirdPrice ?? pricingTier.regularPrice ?? 0;
    case REGISTRATION_CATEGORIES.MEMBER:
      // Database tiers may not have memberPrice, fall back to regularPrice
      return pricingTier.memberPrice ?? pricingTier.regularPrice ?? 0;
    case REGISTRATION_CATEGORIES.REGULAR:
    default:
      return pricingTier.regularPrice ?? 0;
  }
}

/**
 * Generates a unique 6-character short code using safe characters.
 * Safe characters exclude confusing ones like 0/O, 1/l/I, 5/S, 2/Z, 8/B.
 * 6 characters with 25 safe chars = ~244 million unique combinations.
 *
 * @returns {string} 6-character short code (e.g., "A7K3MN")
 */
export function generateShortCode() {
  let code = '';
  for (let i = 0; i < SHORT_CODE_LENGTH; i += 1) {
    const randomIndex = Math.floor(Math.random() * SAFE_SHORT_CODE_CHARS.length);
    code += SAFE_SHORT_CODE_CHARS[randomIndex];
  }
  return code;
}

/**
 * Generates a unique registration ID in the format REG-YYYY-XXXXXX.
 * Uses 6-character short code with safe characters for easy typing and lookup.
 * The short code avoids confusing characters like 0/O, 1/l/I, 5/S, 2/Z, 8/B.
 *
 * @returns {Object} Object containing registrationId and shortCode
 */
export function generateRegistrationId() {
  const year = CONFERENCE.YEAR;
  const shortCode = generateShortCode();

  return {
    registrationId: `REG-${year}-${shortCode}`,
    shortCode,
  };
}

/**
 * Extracts the short code from a registration ID.
 *
 * @param {string} registrationId - Full registration ID (e.g., "REG-2026-A7K3MN")
 * @returns {string} The 6-character short code
 */
export function extractShortCode(registrationId) {
  if (!registrationId) {
    return '';
  }
  const parts = registrationId.split('-');
  return parts.length >= 3 ? parts[2] : '';
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
  if (amount === undefined || amount === null) {
    return `${currency} 0`;
  }
  return `${currency} ${amount.toLocaleString()}`;
}

/**
 * Validates an email address format.
 * Ensures proper domain structure with at least 2-character TLD.
 *
 * @param {string} email - The email to validate
 * @returns {boolean} True if valid email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
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
 * Currently no categories require proof.
 *
 * @param {string} category - The registration category
 * @returns {boolean} True if proof is required
 */
export function requiresProof(category) {
  // None of the current categories (early_bird, member, regular) require proof
  return false;
}

/**
 * Masks an email address for privacy on public pages.
 * Shows first 2 characters of local part, masks the rest, preserves domain.
 *
 * @param {string} email - The email address to mask
 * @returns {string} Masked email (e.g., "ju***@icloud.com")
 */
export function maskEmail(email) {
  if (!email || typeof email !== 'string') {
    return '';
  }

  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) {
    return '***@***';
  }

  const visibleChars = Math.min(2, localPart.length);
  const maskedLocal = localPart.slice(0, visibleChars) + '***';

  return `${maskedLocal}@${domain}`;
}

/**
 * Masks a name for privacy on public pages.
 * Shows first character followed by asterisks.
 *
 * @param {string} name - The name to mask
 * @returns {string} Masked name (e.g., "J***")
 */
export function maskName(name) {
  if (!name || typeof name !== 'string') {
    return '';
  }

  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    return '';
  }

  return trimmedName.charAt(0) + '***';
}

/**
 * Masks a phone number for privacy on public pages.
 * Shows only the last 4 digits.
 *
 * @param {string} phone - The phone number to mask
 * @returns {string} Masked phone (e.g., "***-***-4567")
 */
export function maskPhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length < 4) {
    return '***-***-****';
  }

  const lastFour = digitsOnly.slice(-4);
  return `***-***-${lastFour}`;
}

/**
 * Refund eligibility result type.
 * @typedef {Object} RefundEligibility
 * @property {boolean} eligible - Whether any refund is available
 * @property {'full'|'partial'|'none'} type - Type of refund available
 * @property {number} percent - Percentage of refund (0-100)
 * @property {string} message - Human-readable message about refund status
 * @property {number} daysUntilEvent - Days remaining until event
 */

/**
 * Calculates refund eligibility based on conference date and refund policy settings.
 * Returns detailed information about what type of refund (if any) is available.
 *
 * @param {Object} refundPolicy - Refund policy settings from conference settings
 * @param {boolean} refundPolicy.enabled - Whether refunds are enabled
 * @param {number|null} refundPolicy.fullRefundDays - Days before event for full refund
 * @param {number|null} refundPolicy.partialRefundDays - Days before event for partial refund
 * @param {number} refundPolicy.partialRefundPercent - Percentage for partial refund
 * @param {string} refundPolicy.noRefundMessage - Message when no refunds available
 * @param {string} refundPolicy.fullRefundMessage - Message for full refund period
 * @param {string} refundPolicy.partialRefundMessage - Message for partial refund period
 * @param {string} refundPolicy.lateRefundMessage - Message when too late for refund
 * @param {string|Date} eventDate - Conference start date
 * @returns {RefundEligibility} Refund eligibility details
 */
export function calculateRefundEligibility(refundPolicy, eventDate) {
  const now = new Date();
  const conferenceDate = eventDate instanceof Date ? eventDate : new Date(eventDate);
  const diffTime = conferenceDate.getTime() - now.getTime();
  const daysUntilEvent = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Default policy if not provided
  const policy = refundPolicy || {
    enabled: true,
    fullRefundDays: 14,
    partialRefundDays: 7,
    partialRefundPercent: 50,
    noRefundMessage: 'Refunds are not available for this event.',
    fullRefundMessage: 'Full refund available until {days} days before the event.',
    partialRefundMessage: 'Partial refund ({percent}%) available until {days} days before the event.',
    lateRefundMessage: 'Cancellations within {days} days of the event are not eligible for refund.',
  };

  // If refunds are disabled entirely
  if (!policy.enabled) {
    return {
      eligible: false,
      type: 'none',
      percent: 0,
      message: policy.noRefundMessage || 'Refunds are not available for this event.',
      daysUntilEvent,
    };
  }

  // Check for full refund eligibility
  if (policy.fullRefundDays !== null && daysUntilEvent >= policy.fullRefundDays) {
    const message = (policy.fullRefundMessage || 'Full refund available until {days} days before the event.')
      .replace('{days}', policy.fullRefundDays);
    return {
      eligible: true,
      type: 'full',
      percent: 100,
      message,
      daysUntilEvent,
    };
  }

  // Check for partial refund eligibility
  if (policy.partialRefundDays !== null && daysUntilEvent >= policy.partialRefundDays) {
    const message = (policy.partialRefundMessage || 'Partial refund ({percent}%) available until {days} days before the event.')
      .replace('{days}', policy.partialRefundDays)
      .replace('{percent}', policy.partialRefundPercent || 50);
    return {
      eligible: true,
      type: 'partial',
      percent: policy.partialRefundPercent || 50,
      message,
      daysUntilEvent,
    };
  }

  // Too late for refund
  const lateDays = policy.partialRefundDays || policy.fullRefundDays || 0;
  const message = (policy.lateRefundMessage || 'Cancellations within {days} days of the event are not eligible for refund.')
    .replace('{days}', lateDays);
  return {
    eligible: false,
    type: 'none',
    percent: 0,
    message,
    daysUntilEvent,
  };
}

/**
 * Formats refund policy as a human-readable summary for display.
 *
 * @param {Object} refundPolicy - Refund policy settings
 * @returns {string} Formatted policy summary
 */
export function formatRefundPolicySummary(refundPolicy) {
  if (!refundPolicy || !refundPolicy.enabled) {
    return 'No refunds available for this event.';
  }

  const parts = [];

  if (refundPolicy.fullRefundDays !== null) {
    parts.push(`Full refund: ${refundPolicy.fullRefundDays}+ days before event`);
  }

  if (refundPolicy.partialRefundDays !== null && refundPolicy.fullRefundDays !== null && refundPolicy.partialRefundDays !== refundPolicy.fullRefundDays) {
    parts.push(`${refundPolicy.partialRefundPercent || 50}% refund: ${refundPolicy.partialRefundDays}-${refundPolicy.fullRefundDays - 1} days before event`);
  }

  const cutoffDays = refundPolicy.partialRefundDays || refundPolicy.fullRefundDays || 0;
  if (cutoffDays > 0) {
    parts.push(`No refund: Less than ${cutoffDays} days before event`);
  }

  return parts.join(' • ') || 'No refund policy configured.';
}
