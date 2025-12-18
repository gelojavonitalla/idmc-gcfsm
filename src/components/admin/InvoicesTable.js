/**
 * InvoicesTable Component
 * Displays a table of invoice requests with actions for admin management.
 *
 * @module components/admin/InvoicesTable
 */

import PropTypes from 'prop-types';
import { INVOICE_STATUS, INVOICE_STATUS_LABELS } from '../../constants';
import styles from './InvoicesTable.module.css';

/**
 * Status icon configuration
 */
const STATUS_ICONS = {
  [INVOICE_STATUS.PENDING]: '🔔',
  [INVOICE_STATUS.UPLOADED]: '📄',
  [INVOICE_STATUS.SENT]: '✅',
  [INVOICE_STATUS.FAILED]: '❌',
};

/**
 * Status badge CSS class mapping
 */
const STATUS_CONFIG = {
  [INVOICE_STATUS.PENDING]: {
    className: 'statusPending',
    label: INVOICE_STATUS_LABELS[INVOICE_STATUS.PENDING],
  },
  [INVOICE_STATUS.UPLOADED]: {
    className: 'statusUploaded',
    label: INVOICE_STATUS_LABELS[INVOICE_STATUS.UPLOADED],
  },
  [INVOICE_STATUS.SENT]: {
    className: 'statusSent',
    label: INVOICE_STATUS_LABELS[INVOICE_STATUS.SENT],
  },
  [INVOICE_STATUS.FAILED]: {
    className: 'statusFailed',
    label: INVOICE_STATUS_LABELS[INVOICE_STATUS.FAILED],
  },
};

/**
 * Formats a date for display
 *
 * @param {Object|string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  if (!date) {
    return '—';
  }

  const d = date?.toDate?.() || (date instanceof Date ? date : new Date(date));
  if (Number.isNaN(d.getTime())) {
    return '—';
  }

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Formats currency for display
 *
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
  if (typeof amount !== 'number') {
    return '—';
  }
  return `₱${amount.toLocaleString()}`;
}

/**
 * Gets the attendee name from registration
 *
 * @param {Object} registration - Registration object
 * @returns {string} Attendee name
 */
function getAttendeeName(registration) {
  const firstName = registration.primaryAttendee?.firstName || '';
  const lastName = registration.primaryAttendee?.lastName || '';
  return `${firstName} ${lastName}`.trim() || 'N/A';
}

/**
 * InvoicesTable Component
 *
 * @param {Object} props - Component props
 * @param {Array} props.registrations - Array of registration objects with invoice requests
 * @param {Function} props.onViewDetails - Callback when view details is clicked
 * @param {boolean} props.isLoading - Whether data is loading
 * @returns {JSX.Element} The invoices table component
 */
function InvoicesTable({ registrations, onViewDetails, isLoading }) {
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading invoice requests...</p>
      </div>
    );
  }

  if (!registrations || registrations.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No invoice requests found.</p>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Reg ID</th>
            <th>Date Paid</th>
            <th>Payor</th>
            <th>Invoice To</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {registrations.map((registration) => {
            const invoice = registration.invoice || {};
            const invoiceStatus = invoice.status || INVOICE_STATUS.PENDING;
            const statusConfig = STATUS_CONFIG[invoiceStatus];

            return (
              <tr key={registration.id}>
                <td>
                  <div className={styles.regIdCell}>
                    <span className={styles.regId}>
                      {registration.registrationId}
                    </span>
                    <span className={styles.shortCode}>
                      {registration.shortCode}
                    </span>
                  </div>
                </td>
                <td>{formatDate(registration.payment?.verifiedAt)}</td>
                <td>{getAttendeeName(registration)}</td>
                <td>
                  <div className={styles.invoiceToCell}>
                    <span className={styles.invoiceName}>
                      {invoice.name || 'N/A'}
                    </span>
                    {invoice.tin && (
                      <span className={styles.tin}>TIN: {invoice.tin}</span>
                    )}
                  </div>
                </td>
                <td>
                  <span className={styles.amount}>
                    {formatCurrency(registration.payment?.amountPaid)}
                  </span>
                </td>
                <td>
                  <span
                    className={`${styles.statusBadge} ${styles[statusConfig.className]}`}
                    title={statusConfig.label}
                  >
                    <span className={styles.statusIcon}>
                      {STATUS_ICONS[invoiceStatus]}
                    </span>
                    <span className={styles.statusLabel}>
                      {statusConfig.label}
                    </span>
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => onViewDetails(registration)}
                    className={styles.actionButton}
                  >
                    View
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

InvoicesTable.propTypes = {
  registrations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      registrationId: PropTypes.string.isRequired,
      shortCode: PropTypes.string,
      primaryAttendee: PropTypes.shape({
        firstName: PropTypes.string.isRequired,
        lastName: PropTypes.string.isRequired,
      }),
      payment: PropTypes.shape({
        amountPaid: PropTypes.number,
        verifiedAt: PropTypes.object,
      }),
      invoice: PropTypes.shape({
        name: PropTypes.string,
        tin: PropTypes.string,
        status: PropTypes.string,
      }),
    })
  ).isRequired,
  onViewDetails: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

InvoicesTable.defaultProps = {
  isLoading: false,
};

export default InvoicesTable;
