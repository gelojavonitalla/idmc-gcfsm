/**
 * RegistrationDetailModal Component
 * Modal for viewing and managing registration details.
 *
 * @module components/admin/RegistrationDetailModal
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  REGISTRATION_STATUS,
  REGISTRATION_CATEGORY_LABELS,
  WORKSHOP_CATEGORY_LABELS,
  PAYMENT_METHODS,
} from '../../constants';
import styles from './RegistrationDetailModal.module.css';

/**
 * Status options for dropdown
 */
const STATUS_OPTIONS = [
  { value: REGISTRATION_STATUS.PENDING_PAYMENT, label: 'Pending Payment' },
  { value: REGISTRATION_STATUS.PENDING_VERIFICATION, label: 'Pending Verification' },
  { value: REGISTRATION_STATUS.CONFIRMED, label: 'Confirmed' },
  { value: REGISTRATION_STATUS.CANCELLED, label: 'Cancelled' },
  { value: REGISTRATION_STATUS.REFUNDED, label: 'Refunded' },
];

/**
 * Payment method labels
 */
const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.GCASH]: 'GCash',
  [PAYMENT_METHODS.BANK_TRANSFER]: 'Bank Transfer',
  [PAYMENT_METHODS.CASH]: 'Cash',
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
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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
  const firstName =
    registration.primaryAttendee?.firstName || registration.firstName || '';
  const lastName =
    registration.primaryAttendee?.lastName || registration.lastName || '';
  return `${firstName} ${lastName}`.trim() || 'N/A';
}

/**
 * Gets the attendee email from registration
 *
 * @param {Object} registration - Registration object
 * @returns {string} Attendee email
 */
function getAttendeeEmail(registration) {
  return registration.primaryAttendee?.email || registration.email || 'N/A';
}

/**
 * Gets the attendee phone from registration
 *
 * @param {Object} registration - Registration object
 * @returns {string} Attendee phone
 */
function getAttendeePhone(registration) {
  return registration.primaryAttendee?.phone || registration.phone || '—';
}

/**
 * Gets formatted church info from registration
 *
 * @param {Object} registration - Registration object
 * @returns {string} Formatted church info
 */
function getChurchInfo(registration) {
  // Check if church is an object (new format)
  if (registration.church && typeof registration.church === 'object') {
    const { name, city, province } = registration.church;
    if (name && city && province) {
      return `${name} - ${city}, ${province}`;
    }
    if (name) {
      return name;
    }
  }

  // Check for legacy string format in primaryAttendee
  if (registration.primaryAttendee?.church && typeof registration.primaryAttendee.church === 'string') {
    return registration.primaryAttendee.church;
  }

  // Check for legacy string format at top level
  if (registration.church && typeof registration.church === 'string') {
    return registration.church;
  }

  return '—';
}

/**
 * RegistrationDetailModal Component
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Callback to close modal
 * @param {Object} props.registration - Registration data
 * @param {Function} props.onUpdateStatus - Callback to update status
 * @param {boolean} props.isUpdating - Whether update is in progress
 * @returns {JSX.Element|null} The modal or null if not open
 */
function RegistrationDetailModal({
  isOpen,
  onClose,
  registration,
  onUpdateStatus,
  onUpdateNotes,
  isUpdating,
}) {
  const [selectedStatus, setSelectedStatus] = useState(
    registration?.status || REGISTRATION_STATUS.PENDING_PAYMENT
  );
  const [notes, setNotes] = useState(registration?.notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  /**
   * Sync state when registration changes
   */
  useEffect(() => {
    if (registration) {
      setSelectedStatus(registration.status || REGISTRATION_STATUS.PENDING_PAYMENT);
      setNotes(registration.notes || '');
      setIsEditingNotes(false);
    }
  }, [registration]);

  if (!isOpen || !registration) {
    return null;
  }

  /**
   * Handles saving notes
   */
  const handleSaveNotes = async () => {
    if (!onUpdateNotes) {
      return;
    }
    setIsSavingNotes(true);
    try {
      await onUpdateNotes(registration.id, notes);
      setIsEditingNotes(false);
    } catch (error) {
      console.error('Failed to save notes:', error);
    } finally {
      setIsSavingNotes(false);
    }
  };

  /**
   * Handles canceling notes edit
   */
  const handleCancelNotesEdit = () => {
    setNotes(registration.notes || '');
    setIsEditingNotes(false);
  };

  /**
   * Handles status change
   */
  const handleStatusChange = async () => {
    if (selectedStatus !== registration.status) {
      await onUpdateStatus(registration.id, selectedStatus);
    }
  };

  /**
   * Gets status badge class
   *
   * @param {string} status - Registration status
   * @returns {string} CSS class name
   */
  const getStatusClass = (status) => {
    const classMap = {
      [REGISTRATION_STATUS.CONFIRMED]: styles.statusConfirmed,
      [REGISTRATION_STATUS.PENDING_VERIFICATION]: styles.statusPendingVerification,
      [REGISTRATION_STATUS.PENDING_PAYMENT]: styles.statusPendingPayment,
      [REGISTRATION_STATUS.CANCELLED]: styles.statusCancelled,
      [REGISTRATION_STATUS.REFUNDED]: styles.statusRefunded,
    };
    return classMap[status] || styles.statusPendingPayment;
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Registration Details</h2>
            <p className={styles.registrationId}>ID: {registration.id}</p>
          </div>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* Status Section */}
          <div className={styles.statusSection}>
            <div className={styles.currentStatus}>
              <span className={styles.label}>Current Status:</span>
              <span className={`${styles.statusBadge} ${getStatusClass(registration.status)}`}>
                {STATUS_OPTIONS.find((s) => s.value === registration.status)?.label ||
                  registration.status}
              </span>
            </div>
            <div className={styles.statusUpdate}>
              <select
                className={styles.statusSelect}
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                disabled={isUpdating}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                className={styles.updateButton}
                onClick={handleStatusChange}
                disabled={isUpdating || selectedStatus === registration.status}
              >
                {isUpdating ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>

          {/* Attendee Information */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Attendee Information
            </h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.label}>Name</span>
                <span className={styles.value}>{getAttendeeName(registration)}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Email</span>
                <span className={styles.value}>{getAttendeeEmail(registration)}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Phone</span>
                <span className={styles.value}>{getAttendeePhone(registration)}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Church</span>
                <span className={styles.value}>
                  {getChurchInfo(registration)}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Ministry Role</span>
                <span className={styles.value}>
                  {registration.primaryAttendee?.ministryRole ||
                    registration.ministryRole ||
                    '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Registration Details */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Registration Details
            </h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.label}>Category</span>
                <span className={styles.value}>
                  {REGISTRATION_CATEGORY_LABELS[registration.category] ||
                    registration.category ||
                    '—'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Workshop</span>
                <span className={styles.value}>
                  {registration.workshopSelection
                    ? WORKSHOP_CATEGORY_LABELS[registration.workshopSelection] ||
                      registration.workshopSelection
                    : '—'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Registered On</span>
                <span className={styles.value}>{formatDate(registration.createdAt)}</span>
              </div>
              {registration.updatedAt && (
                <div className={styles.infoItem}>
                  <span className={styles.label}>Last Updated</span>
                  <span className={styles.value}>{formatDate(registration.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Information */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              Payment Information
            </h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.label}>Amount</span>
                <span className={`${styles.value} ${styles.amount}`}>
                  {formatCurrency(registration.totalAmount)}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Payment Method</span>
                <span className={styles.value}>
                  {PAYMENT_METHOD_LABELS[registration.paymentMethod] ||
                    registration.paymentMethod ||
                    '—'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Reference Number</span>
                <span className={styles.value}>
                  {registration.paymentReference || '—'}
                </span>
              </div>
            </div>

            {/* Payment Proof */}
            {registration.paymentProofUrl && (
              <div className={styles.paymentProof}>
                <span className={styles.label}>Payment Proof</span>
                <a
                  href={registration.paymentProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.proofLink}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  View Payment Proof
                </a>
              </div>
            )}
          </div>

          {/* Additional Attendees (if group registration) */}
          {registration.additionalAttendees?.length > 0 && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  Additional Attendees ({registration.additionalAttendees.length})
                </h3>
                <div className={styles.additionalAttendees}>
                  {registration.additionalAttendees.map((attendee, index) => (
                    <div key={index} className={styles.attendeeCard}>
                      <span className={styles.attendeeName}>
                        {attendee.firstName} {attendee.lastName}
                      </span>
                      <span className={styles.attendeeEmail}>{attendee.email}</span>
                      <span className={styles.attendeeCategory}>
                        {REGISTRATION_CATEGORY_LABELS[attendee.category] ||
                          attendee.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Internal Notes */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              Internal Notes
              {!isEditingNotes && (
                <button
                  className={styles.editNotesButton}
                  onClick={() => setIsEditingNotes(true)}
                  type="button"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit
                </button>
              )}
            </h3>
            {isEditingNotes ? (
              <div className={styles.notesEdit}>
                <textarea
                  className={styles.notesTextarea}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add internal notes about this registration..."
                  rows={4}
                />
                <div className={styles.notesActions}>
                  <button
                    className={styles.notesCancelButton}
                    onClick={handleCancelNotesEdit}
                    disabled={isSavingNotes}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className={styles.notesSaveButton}
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    type="button"
                  >
                    {isSavingNotes ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>
              </div>
            ) : (
              <p className={styles.notes}>
                {registration.notes || 'No notes added yet.'}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

RegistrationDetailModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdateNotes: PropTypes.func,
  registration: PropTypes.shape({
    id: PropTypes.string.isRequired,
    primaryAttendee: PropTypes.shape({
      firstName: PropTypes.string,
      lastName: PropTypes.string,
      email: PropTypes.string,
      phone: PropTypes.string,
      church: PropTypes.string, // Legacy format
      ministryRole: PropTypes.string,
    }),
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    church: PropTypes.oneOfType([
      PropTypes.string, // Legacy format
      PropTypes.shape({
        name: PropTypes.string,
        city: PropTypes.string,
        province: PropTypes.string,
      }),
    ]),
    ministryRole: PropTypes.string,
    category: PropTypes.string,
    workshopSelection: PropTypes.string,
    totalAmount: PropTypes.number,
    status: PropTypes.string,
    paymentMethod: PropTypes.string,
    paymentReference: PropTypes.string,
    paymentProofUrl: PropTypes.string,
    createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    additionalAttendees: PropTypes.arrayOf(
      PropTypes.shape({
        firstName: PropTypes.string,
        lastName: PropTypes.string,
        email: PropTypes.string,
        category: PropTypes.string,
      })
    ),
    notes: PropTypes.string,
  }),
  onUpdateStatus: PropTypes.func.isRequired,
  isUpdating: PropTypes.bool,
};

RegistrationDetailModal.defaultProps = {
  registration: null,
  isUpdating: false,
  onUpdateNotes: null,
};

export default RegistrationDetailModal;
