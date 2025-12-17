/**
 * String Utility Functions
 * Common string manipulation utilities used across the application.
 *
 * @module utils/strings
 */

/**
 * Generates a URL-safe slug from text.
 * Converts to lowercase, removes special characters, and replaces spaces with hyphens.
 *
 * @param {string} text - Text to convert to slug
 * @param {Object} options - Options for slug generation
 * @param {string} options.prefix - Optional prefix for the slug
 * @param {number} options.maxLength - Maximum length of the slug (default: unlimited)
 * @returns {string} URL-safe slug
 *
 * @example
 * generateSlug('Hello World!') // 'hello-world'
 * generateSlug('Test Title', { prefix: 'session' }) // 'session-test-title'
 * generateSlug('Very Long Title Here', { maxLength: 10 }) // 'very-long-'
 */
export function generateSlug(text, options = {}) {
  if (!text) {
    return '';
  }

  const { prefix = '', maxLength } = options;

  let slug = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  if (maxLength && slug.length > maxLength) {
    slug = slug.substring(0, maxLength);
  }

  return prefix ? `${prefix}-${slug}` : slug;
}

/**
 * Formats 24-hour time string to 12-hour format with AM/PM.
 *
 * @param {string} timeString - Time in HH:MM format
 * @returns {string} Formatted time (e.g., "2:30 PM")
 *
 * @example
 * formatTime('14:30') // '2:30 PM'
 * formatTime('09:00') // '9:00 AM'
 * formatTime('00:00') // '12:00 AM'
 */
export function formatTime(timeString) {
  if (!timeString) {
    return '';
  }

  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minutes} ${ampm}`;
}
