/**
 * CSV Export Utility
 * Exports registration data to CSV format that can be opened in Excel.
 *
 * @module utils/exportCsv
 */

import {
  REGISTRATION_STATUS,
  REGISTRATION_CATEGORY_LABELS,
  WORKSHOP_CATEGORY_LABELS,
} from '../constants';

/**
 * Status labels for export
 */
const STATUS_LABELS = {
  [REGISTRATION_STATUS.PENDING_PAYMENT]: 'Pending Payment',
  [REGISTRATION_STATUS.PENDING_VERIFICATION]: 'Pending Verification',
  [REGISTRATION_STATUS.CONFIRMED]: 'Confirmed',
  [REGISTRATION_STATUS.CANCELLED]: 'Cancelled',
  [REGISTRATION_STATUS.REFUNDED]: 'Refunded',
};

/**
 * Escapes a value for CSV format
 * Handles commas, quotes, and newlines
 *
 * @param {*} value - Value to escape
 * @returns {string} Escaped CSV value
 */
function escapeCsvValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Formats a Firestore timestamp or Date for CSV
 *
 * @param {Object|Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDateForCsv(date) {
  if (!date) {
    return '';
  }

  const d = date?.toDate?.() || (date instanceof Date ? date : new Date(date));
  if (Number.isNaN(d.getTime())) {
    return '';
  }

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Converts registrations array to CSV string
 *
 * @param {Array} registrations - Array of registration objects
 * @returns {string} CSV formatted string
 */
export function convertRegistrationsToCsv(registrations) {
  // Define CSV headers
  const headers = [
    'Registration ID',
    'Short Code',
    'Status',
    'First Name',
    'Last Name',
    'Email',
    'Phone',
    'Church',
    'Ministry Role',
    'Category',
    'Workshop Selection',
    'Total Amount',
    'Payment Method',
    'Payment Reference',
    'Additional Attendees Count',
    'Checked In',
    'Notes',
    'Registered Date',
  ];

  // Convert each registration to a CSV row
  const rows = registrations.map((reg) => {
    const firstName = reg.primaryAttendee?.firstName || reg.firstName || '';
    const lastName = reg.primaryAttendee?.lastName || reg.lastName || '';
    const email = reg.primaryAttendee?.email || reg.email || '';
    const phone = reg.primaryAttendee?.cellphone || reg.primaryAttendee?.phone || reg.phone || '';
    const church = reg.primaryAttendee?.church || reg.church || '';
    const ministryRole = reg.primaryAttendee?.ministryRole || reg.ministryRole || '';
    const category = REGISTRATION_CATEGORY_LABELS[reg.category] || reg.category || '';
    const workshop = WORKSHOP_CATEGORY_LABELS[reg.workshopSelection] || reg.workshopSelection || '';
    const status = STATUS_LABELS[reg.status] || reg.status || '';
    const additionalCount = reg.additionalAttendees?.length || 0;

    return [
      reg.id || '',
      reg.shortCode || '',
      status,
      firstName,
      lastName,
      email,
      phone,
      church,
      ministryRole,
      category,
      workshop,
      reg.totalAmount || 0,
      reg.paymentMethod || '',
      reg.paymentReference || '',
      additionalCount,
      reg.checkedIn ? 'Yes' : 'No',
      reg.notes || '',
      formatDateForCsv(reg.createdAt),
    ].map(escapeCsvValue);
  });

  // Combine headers and rows
  const csvContent = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Triggers a CSV file download in the browser
 *
 * @param {string} csvContent - CSV content string
 * @param {string} filename - Name for the downloaded file
 */
export function downloadCsv(csvContent, filename) {
  // Add BOM for Excel compatibility with UTF-8
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });

  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Exports registrations to a CSV file
 *
 * @param {Array} registrations - Array of registration objects to export
 * @param {string} filenamePrefix - Prefix for the filename (default: 'registrations')
 */
export function exportRegistrationsToCsv(registrations, filenamePrefix = 'registrations') {
  if (!registrations || registrations.length === 0) {
    throw new Error('No registrations to export');
  }

  const csvContent = convertRegistrationsToCsv(registrations);
  const date = new Date().toISOString().split('T')[0];
  const filename = `${filenamePrefix}-${date}.csv`;

  downloadCsv(csvContent, filename);

  return { count: registrations.length, filename };
}

/**
 * Converts workshop attendance data to CSV string
 *
 * @param {Array} registrations - Array of registration objects
 * @param {string} workshopCategory - Workshop category to filter by
 * @returns {string} CSV formatted string
 */
export function convertWorkshopAttendanceToCsv(registrations, workshopCategory) {
  // Filter registrations by workshop
  const workshopAttendees = registrations.filter(
    (reg) => reg.workshopSelection === workshopCategory &&
      reg.status === REGISTRATION_STATUS.CONFIRMED
  );

  const workshopName = WORKSHOP_CATEGORY_LABELS[workshopCategory] || workshopCategory;

  // Define CSV headers
  const headers = [
    'No.',
    'First Name',
    'Last Name',
    'Email',
    'Phone',
    'Church',
    'Ministry Role',
    'Checked In',
    'Registration Code',
  ];

  // Convert each attendee to a CSV row
  const rows = workshopAttendees.map((reg, index) => {
    const firstName = reg.primaryAttendee?.firstName || reg.firstName || '';
    const lastName = reg.primaryAttendee?.lastName || reg.lastName || '';
    const email = reg.primaryAttendee?.email || reg.email || '';
    const phone = reg.primaryAttendee?.cellphone || reg.primaryAttendee?.phone || reg.phone || '';
    const church = reg.primaryAttendee?.church || reg.church || '';
    const ministryRole = reg.primaryAttendee?.ministryRole || reg.ministryRole || '';

    return [
      index + 1,
      firstName,
      lastName,
      email,
      phone,
      church,
      ministryRole,
      reg.checkedIn ? 'Yes' : 'No',
      reg.shortCode || '',
    ].map(escapeCsvValue);
  });

  // Add header with workshop name
  const titleRow = [`Workshop: ${workshopName}`, '', '', '', '', '', '', '', ''];
  const countRow = [`Total Attendees: ${workshopAttendees.length}`, '', '', '', '', '', '', '', ''];
  const emptyRow = ['', '', '', '', '', '', '', '', ''];

  // Combine all rows
  const csvContent = [
    titleRow.join(','),
    countRow.join(','),
    emptyRow.join(','),
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Exports workshop attendance to a CSV file
 *
 * @param {Array} registrations - Array of registration objects
 * @param {string} workshopCategory - Workshop category to export
 */
export function exportWorkshopAttendanceToCsv(registrations, workshopCategory) {
  if (!registrations || registrations.length === 0) {
    throw new Error('No registrations to process');
  }

  const csvContent = convertWorkshopAttendanceToCsv(registrations, workshopCategory);
  const workshopName = WORKSHOP_CATEGORY_LABELS[workshopCategory] || workshopCategory;
  const safeName = workshopName.toLowerCase().replace(/\s+/g, '-');
  const date = new Date().toISOString().split('T')[0];
  const filename = `workshop-${safeName}-attendance-${date}.csv`;

  downloadCsv(csvContent, filename);

  const attendeeCount = registrations.filter(
    (reg) => reg.workshopSelection === workshopCategory &&
      reg.status === REGISTRATION_STATUS.CONFIRMED
  ).length;

  return { count: attendeeCount, filename };
}

/**
 * Exports all workshops attendance to a single CSV file
 *
 * @param {Array} registrations - Array of registration objects
 */
export function exportAllWorkshopsAttendanceToCsv(registrations) {
  if (!registrations || registrations.length === 0) {
    throw new Error('No registrations to process');
  }

  // Get confirmed registrations only
  const confirmedRegs = registrations.filter(
    (reg) => reg.status === REGISTRATION_STATUS.CONFIRMED
  );

  // Group by workshop
  const workshopGroups = {};
  Object.keys(WORKSHOP_CATEGORY_LABELS).forEach((category) => {
    workshopGroups[category] = confirmedRegs.filter(
      (reg) => reg.workshopSelection === category
    );
  });

  // Define headers
  const headers = [
    'Workshop',
    'No.',
    'First Name',
    'Last Name',
    'Email',
    'Phone',
    'Church',
    'Ministry Role',
    'Checked In',
    'Registration Code',
  ];

  // Build all rows
  const allRows = [];

  Object.entries(WORKSHOP_CATEGORY_LABELS).forEach(([category, workshopName]) => {
    const attendees = workshopGroups[category] || [];

    if (attendees.length > 0) {
      // Add workshop section header
      allRows.push([`--- ${workshopName} (${attendees.length} attendees) ---`, '', '', '', '', '', '', '', '', '']);

      attendees.forEach((reg, index) => {
        const firstName = reg.primaryAttendee?.firstName || reg.firstName || '';
        const lastName = reg.primaryAttendee?.lastName || reg.lastName || '';
        const email = reg.primaryAttendee?.email || reg.email || '';
        const phone = reg.primaryAttendee?.cellphone || reg.primaryAttendee?.phone || reg.phone || '';
        const church = reg.primaryAttendee?.church || reg.church || '';
        const ministryRole = reg.primaryAttendee?.ministryRole || reg.ministryRole || '';

        allRows.push([
          workshopName,
          index + 1,
          firstName,
          lastName,
          email,
          phone,
          church,
          ministryRole,
          reg.checkedIn ? 'Yes' : 'No',
          reg.shortCode || '',
        ].map(escapeCsvValue));
      });

      // Add empty row between workshops
      allRows.push(['', '', '', '', '', '', '', '', '', '']);
    }
  });

  // Combine headers and rows
  const csvContent = [
    headers.map(escapeCsvValue).join(','),
    ...allRows.map((row) => row.join(',')),
  ].join('\n');

  const date = new Date().toISOString().split('T')[0];
  const filename = `all-workshops-attendance-${date}.csv`;

  downloadCsv(csvContent, filename);

  return { count: confirmedRegs.length, filename };
}
