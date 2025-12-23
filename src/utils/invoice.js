/**
 * Invoice utility functions
 * Pure utility functions for invoice-related operations (no database access)
 * Database operations are handled in services/invoice.js
 */

/**
 * Validates invoice file type
 * Accepts PDF and image formats (JPEG, PNG)
 *
 * @param {File} file - The file to validate
 * @returns {boolean} True if file type is valid, false otherwise
 *
 * @example
 * const file = event.target.files[0];
 * if (isValidInvoiceFile(file)) {
 *   // Proceed with upload
 * }
 */
export function isValidInvoiceFile(file) {
  if (!file) return false;

  const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  return validTypes.includes(file.type);
}

/**
 * Gets the file extension from a filename
 *
 * @param {string} filename - The filename or path
 * @returns {string} The file extension (e.g., "pdf", "jpg", "png")
 *
 * @example
 * getFileExtension("invoice.pdf") // Returns: "pdf"
 * getFileExtension("scan.jpeg") // Returns: "jpeg"
 */
export function getFileExtension(filename) {
  if (!filename) return '';
  return filename.split('.').pop().toLowerCase();
}

/**
 * Formats invoice file name for storage
 * Uses registration ID and invoice number for consistent naming
 *
 * @param {string} registrationId - The registration ID
 * @param {string} invoiceNumber - The invoice number
 * @param {string} extension - The file extension
 * @returns {string} Formatted filename
 *
 * @example
 * formatInvoiceFileName("REG-2025-A7K3MN", "INV-2025-0001", "pdf")
 * // Returns: "REG-2025-A7K3MN_INV-2025-0001.pdf"
 */
export function formatInvoiceFileName(registrationId, invoiceNumber, extension) {
  return `${registrationId}_${invoiceNumber}.${extension}`;
}

/**
 * Checks if a registration has an invoice request
 *
 * @param {Object} registration - The registration document
 * @returns {boolean} True if invoice was requested
 *
 * @example
 * if (hasInvoiceRequest(registration)) {
 *   // Show invoice UI
 * }
 */
export function hasInvoiceRequest(registration) {
  return Boolean(registration?.invoice?.requested);
}

/**
 * Gets the invoice status from a registration
 *
 * @param {Object} registration - The registration document
 * @returns {string|null} The invoice status or null if no invoice
 *
 * @example
 * const status = getInvoiceStatus(registration);
 * // Returns: "pending" | "uploaded" | "sent" | "failed" | null
 */
export function getInvoiceStatus(registration) {
  if (!hasInvoiceRequest(registration)) {
    return null;
  }
  return registration.invoice?.status || 'pending';
}

/**
 * Formats invoice number for display
 * Shortens invoice number if needed
 *
 * @param {string} invoiceNumber - The full invoice number
 * @returns {string} Formatted invoice number
 *
 * @example
 * formatInvoiceNumber("INV-2025-0001") // Returns: "INV-2025-0001"
 */
export function formatInvoiceNumber(invoiceNumber) {
  return invoiceNumber || 'N/A';
}
