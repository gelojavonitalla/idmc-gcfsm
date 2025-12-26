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
  WORKSHOP_CATEGORY_LABELS,
  PAYMENT_METHODS,
} from '../../constants';
import {
  verifyPayment,
  getEntityActivityLogs,
  ENTITY_TYPES,
  ACTIVITY_TYPES,
  ACTIVITY_TYPE_LABELS,
  offerSlotToWaitlistedRegistration,
  cancelRegistration,
  refundRegistration,
  promoteFromWaitlist,
} from '../../services';
import { useAdminAuth, useSettings } from '../../context';
import { calculateRefundEligibility } from '../../utils/registration';
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
  { value: REGISTRATION_STATUS.WAITLISTED, label: 'Waitlisted' },
  { value: REGISTRATION_STATUS.WAITLIST_OFFERED, label: 'Waitlist - Slot Offered' },
  { value: REGISTRATION_STATUS.WAITLIST_EXPIRED, label: 'Waitlist - Expired' },
];

/**
 * Payment method labels
 */
const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.GCASH]: 'GCash',
  [PAYMENT_METHODS.BANK_TRANSFER]: 'Bank Transfer/Deposit',
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
 * Gets workshop display string from registration
 *
 * @param {Object} registration - Registration object
 * @returns {string} Formatted workshop info
 */
function getWorkshopDisplay(registration) {
  // Check for new format: primaryAttendee.workshopSelections (array)
  const workshopSelections = registration.primaryAttendee?.workshopSelections;
  if (workshopSelections && Array.isArray(workshopSelections) && workshopSelections.length > 0) {
    // Display session titles joined by comma
    const titles = workshopSelections
      .map((selection) => selection.sessionTitle || selection.sessionId)
      .filter(Boolean);
    if (titles.length > 0) {
      return titles.join(', ');
    }
  }

  // Fallback to old format: workshopSelection (string category code)
  if (registration.workshopSelection) {
    return (
      WORKSHOP_CATEGORY_LABELS[registration.workshopSelection] ||
      registration.workshopSelection
    );
  }

  return '—';
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
  onRefresh,
  isUpdating,
}) {
  const { admin } = useAdminAuth();
  const { settings, pricingTiers } = useSettings();

  /**
   * Gets the display name for a category/pricing tier ID
   *
   * @param {string} categoryId - The category/tier ID
   * @returns {string} The display name or the ID if not found
   */
  const getCategoryName = (categoryId) => {
    if (!categoryId) return '—';
    const tier = pricingTiers?.find((t) => t.id === categoryId);
    return tier?.name || categoryId;
  };

  // Calculate refund eligibility based on settings
  const refundEligibility = settings?.startDate
    ? calculateRefundEligibility(settings.refundPolicy, settings.startDate)
    : { eligible: true, type: 'full', percent: 100, message: '', daysUntilEvent: 0 };

  const [selectedStatus, setSelectedStatus] = useState(
    registration?.status || REGISTRATION_STATUS.PENDING_PAYMENT
  );
  const [notes, setNotes] = useState(registration?.notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Payment verification states
  const [amountPaid, setAmountPaid] = useState(registration?.totalAmount || 0);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showRejectionInput, setShowRejectionInput] = useState(false);

  // Activity history states
  const [activityLogs, setActivityLogs] = useState([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  // Waitlist notification states
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [notificationError, setNotificationError] = useState(null);
  const [notificationSuccess, setNotificationSuccess] = useState(false);

  // Cancel registration states
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  // Refund states
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundReason, setRefundReason] = useState('');
  const [refundMethod, setRefundMethod] = useState('');
  const [refundReference, setRefundReference] = useState('');
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundError, setRefundError] = useState(null);

  // Promote from waitlist states
  const [isPromoting, setIsPromoting] = useState(false);
  const [promoteError, setPromoteError] = useState(null);
  const [promoteSuccess, setPromoteSuccess] = useState(false);

  /**
   * Sync state when registration changes
   */
  useEffect(() => {
    if (registration) {
      setSelectedStatus(registration.status || REGISTRATION_STATUS.PENDING_PAYMENT);
      setNotes(registration.notes || '');
      setIsEditingNotes(false);
      // Pre-populate payment verification states from registration data
      // Use payment.amountPaid if previously verified, otherwise default to totalAmount
      setAmountPaid(registration.payment?.amountPaid ?? registration.totalAmount ?? 0);
      setPaymentMethod(registration.payment?.method || '');
      setReferenceNumber(registration.payment?.referenceNumber || '');
      setRejectionReason('');
      setShowRejectionInput(false);
      // Reset waitlist notification states
      setNotificationError(null);
      setNotificationSuccess(false);
      // Reset cancel states
      setShowCancelForm(false);
      setCancelReason('');
      setCancelError(null);
      // Reset refund states
      setShowRefundForm(false);
      setRefundAmount(registration?.payment?.amountPaid || registration?.totalAmount || 0);
      setRefundReason('');
      setRefundMethod('');
      setRefundReference('');
      setRefundError(null);
      // Reset promote states
      setPromoteError(null);
      setPromoteSuccess(false);
    }
  }, [registration]);

  /**
   * Fetch activity logs for this registration
   */
  useEffect(() => {
    async function fetchActivityLogs() {
      if (!registration?.id) {
        setActivityLogs([]);
        return;
      }

      setIsLoadingActivity(true);
      try {
        const logs = await getEntityActivityLogs(
          ENTITY_TYPES.REGISTRATION,
          registration.id,
          10
        );
        setActivityLogs(logs);
      } catch (error) {
        console.error('Failed to fetch activity logs:', error);
        setActivityLogs([]);
      } finally {
        setIsLoadingActivity(false);
      }
    }

    if (isOpen && registration?.id) {
      fetchActivityLogs();
    }
  }, [isOpen, registration?.id]);

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
   * Handles sending waitlist slot notification to a waitlisted registrant.
   * This updates their status to WAITLIST_OFFERED and triggers an email.
   */
  const handleSendWaitlistNotification = async () => {
    if (!registration || registration.status !== REGISTRATION_STATUS.WAITLISTED) {
      return;
    }

    setIsSendingNotification(true);
    setNotificationError(null);
    setNotificationSuccess(false);

    try {
      // Get conference start date from settings
      const conferenceStartDate = settings?.startDate || new Date().toISOString();

      await offerSlotToWaitlistedRegistration(
        registration.id,
        conferenceStartDate,
        admin?.uid,
        admin?.email
      );

      setNotificationSuccess(true);

      // Refresh the registration data
      if (onRefresh) {
        onRefresh();
      }

      // Clear success message after 5 seconds
      setTimeout(() => setNotificationSuccess(false), 5000);
    } catch (error) {
      console.error('Failed to send waitlist notification:', error);
      setNotificationError(error.message || 'Failed to send notification. Please try again.');
    } finally {
      setIsSendingNotification(false);
    }
  };

  /**
   * Handles cancelling a registration
   */
  const handleCancelRegistration = async () => {
    if (!cancelReason.trim()) {
      setCancelError('Please provide a cancellation reason');
      return;
    }

    setIsCancelling(true);
    setCancelError(null);

    try {
      await cancelRegistration(
        registration.id,
        cancelReason.trim(),
        admin?.email || 'Admin',
        admin?.uid,
        admin?.email
      );

      // Refresh the registration data
      if (onRefresh) {
        await onRefresh();
      }

      setShowCancelForm(false);
      setCancelReason('');
    } catch (error) {
      console.error('Failed to cancel registration:', error);
      setCancelError(error.message || 'Failed to cancel registration. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  /**
   * Handles processing a refund
   */
  const handleRefund = async () => {
    if (!refundReason.trim()) {
      setRefundError('Please provide a refund reason');
      return;
    }
    if (!refundMethod) {
      setRefundError('Please select a refund method');
      return;
    }

    setIsRefunding(true);
    setRefundError(null);

    try {
      await refundRegistration(
        registration.id,
        {
          refundAmount,
          reason: refundReason.trim(),
          refundMethod,
          referenceNumber: refundReference.trim() || null,
          notes: null,
        },
        admin?.uid,
        admin?.email
      );

      // Refresh the registration data
      if (onRefresh) {
        await onRefresh();
      }

      setShowRefundForm(false);
    } catch (error) {
      console.error('Failed to process refund:', error);
      setRefundError(error.message || 'Failed to process refund. Please try again.');
    } finally {
      setIsRefunding(false);
    }
  };

  /**
   * Handles promoting a waitlisted registration directly to pending payment
   */
  const handlePromoteFromWaitlist = async () => {
    setIsPromoting(true);
    setPromoteError(null);
    setPromoteSuccess(false);

    try {
      await promoteFromWaitlist(
        registration.id,
        admin?.uid,
        admin?.email
      );

      setPromoteSuccess(true);

      // Refresh the registration data
      if (onRefresh) {
        await onRefresh();
      }

      // Clear success message after 5 seconds
      setTimeout(() => setPromoteSuccess(false), 5000);
    } catch (error) {
      console.error('Failed to promote from waitlist:', error);
      setPromoteError(error.message || 'Failed to promote. Please try again.');
    } finally {
      setIsPromoting(false);
    }
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
   * Handles payment verification (approve or partial payment)
   */
  const handleVerifyPayment = async () => {
    // For paid registrations, validate payment fields
    if (registration.totalAmount > 0 && (!amountPaid || !paymentMethod)) {
      alert('Please enter amount received and payment method');
      return;
    }

    setIsVerifying(true);
    try {
      await verifyPayment(
        registration.id,
        {
          amountPaid: registration.totalAmount === 0 ? 0 : amountPaid,
          method: registration.totalAmount === 0 ? 'N/A' : paymentMethod,
          referenceNumber,
          verifiedBy: admin.email,
          notes: rejectionReason || '',
          rejectionReason: amountPaid < registration.totalAmount ? rejectionReason : null,
        },
        admin.uid,
        admin.email
      );

      // Refresh registration data by calling parent's refresh
      if (onRefresh) {
        await onRefresh();
      }

      onClose();
    } catch (error) {
      console.error('Verification error:', error);
      alert('Failed to verify payment: ' + error.message);
    } finally {
      setIsVerifying(false);
    }
  };

  /**
   * Shows the rejection input form
   */
  const handleShowRejectionInput = () => {
    setShowRejectionInput(true);
    setRejectionReason('');
  };

  /**
   * Cancels the rejection and hides the input form
   */
  const handleCancelRejection = () => {
    setShowRejectionInput(false);
    setRejectionReason('');
  };

  /**
   * Handles payment rejection with reason
   */
  const handleConfirmRejection = async () => {
    if (!rejectionReason || !rejectionReason.trim()) {
      return;
    }

    setIsVerifying(true);
    try {
      // Use verifyPayment with 0 amount to reject
      await verifyPayment(
        registration.id,
        {
          amountPaid: 0,
          method: paymentMethod || 'unknown',
          referenceNumber: '',
          verifiedBy: admin.email,
          notes: '',
          rejectionReason: rejectionReason.trim(),
        },
        admin.uid,
        admin.email
      );

      if (onRefresh) {
        await onRefresh();
      }

      onClose();
    } catch (error) {
      console.error('Rejection error:', error);
      alert('Failed to reject payment: ' + error.message);
    } finally {
      setIsVerifying(false);
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

  /**
   * Gets the CSS class for activity type
   *
   * @param {string} type - Activity type
   * @returns {string} CSS class name
   */
  const getActivityClass = (type) => {
    const classMap = {
      [ACTIVITY_TYPES.APPROVE]: styles.activityApprove,
      [ACTIVITY_TYPES.REJECT]: styles.activityReject,
      [ACTIVITY_TYPES.CREATE]: styles.activityCreate,
      [ACTIVITY_TYPES.UPDATE]: styles.activityUpdate,
    };
    return classMap[type] || styles.activityDefault;
  };

  /**
   * Formats activity log date
   *
   * @param {Object} timestamp - Firestore timestamp
   * @returns {string} Formatted date string
   */
  const formatActivityDate = (timestamp) => {
    if (!timestamp) {
      return '—';
    }
    const date = timestamp?.toDate?.() || new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
                  {getCategoryName(registration.primaryAttendee?.category)}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Workshop</span>
                <span className={styles.value}>
                  {getWorkshopDisplay(registration)}
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
                  {PAYMENT_METHOD_LABELS[registration.payment?.method] ||
                    registration.payment?.method ||
                    '—'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Reference Number</span>
                <span className={styles.value}>
                  {registration.payment?.referenceNumber || '—'}
                </span>
              </div>
              {registration.payment?.overpayment > 0 && (
                <div className={styles.infoItem}>
                  <span className={styles.label}>Overpayment</span>
                  <span className={`${styles.value} ${styles.overpaymentValue}`}>
                    +{formatCurrency(registration.payment.overpayment)}
                  </span>
                </div>
              )}
            </div>

            {/* Payment Proof */}
            {registration.payment?.proofUrl && (
              <div className={styles.paymentProof}>
                <span className={styles.label}>Payment Proof</span>
                <a
                  href={registration.payment.proofUrl}
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

          {/* Payment Verification Section - Only shown for PENDING_VERIFICATION status */}
          {registration.status === REGISTRATION_STATUS.PENDING_VERIFICATION && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {registration.totalAmount === 0 ? 'Verify Registration' : 'Verify Payment'}
              </h3>

              {/* For free registrations (volunteers/speakers) - Show info message */}
              {registration.totalAmount === 0 && (
                <div className={styles.infoMessage}>
                  <p>
                    This is a free registration for a{' '}
                    {registration.primaryAttendee?.category === 'volunteer' ? 'Volunteer' : 'Speaker'}.
                    Please verify the details and approve or reject this registration.
                  </p>
                  <p className={styles.hint}>
                    Note: No payment required. No QR codes will be generated.
                  </p>
                </div>
              )}

              {/* Payment Proof Image - Only for paid registrations */}
              {registration.totalAmount > 0 && registration.payment?.proofUrl && (
                <div className={styles.paymentProofContainer}>
                  <label className={styles.formLabel}>Payment Proof</label>
                  <a
                    href={registration.payment.proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.paymentProofLink}
                  >
                    <img
                      src={registration.payment.proofUrl}
                      alt="Payment proof"
                      className={styles.paymentProofImage}
                    />
                  </a>
                  <p className={styles.hint}>Click image to view full size</p>
                </div>
              )}

              <div className={styles.verificationForm}>
                {/* Payment-specific fields - Only shown for paid registrations */}
                {registration.totalAmount > 0 && (
                  <>
                    {/* Total Amount (read-only) */}
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Total Amount Required</label>
                      <input
                        type="text"
                        value={formatCurrency(registration.totalAmount)}
                        disabled
                        className={styles.input}
                      />
                    </div>

                    {/* Amount Received Input */}
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        Amount Received <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="number"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        min="0"
                        max={registration.totalAmount}
                        step="0.01"
                        className={styles.input}
                        disabled={isVerifying}
                      />
                    </div>

                    {/* Calculated Balance (auto-calculated) */}
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Balance</label>
                      <input
                        type="text"
                        value={formatCurrency(Math.max(0, registration.totalAmount - amountPaid))}
                        disabled
                        className={`${styles.input} ${
                          amountPaid < registration.totalAmount ? styles.balanceOwed : ''
                        }`}
                      />
                      {amountPaid < registration.totalAmount && (
                        <p className={styles.warningText}>
                          ⚠️ Partial payment - user will need to upload additional proof
                        </p>
                      )}
                      {amountPaid > registration.totalAmount && (
                        <p className={styles.overpaymentText}>
                          ⚠️ Overpayment of {formatCurrency(amountPaid - registration.totalAmount)} - this will be noted in finance
                        </p>
                      )}
                    </div>

                    {/* Payment Method */}
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        Payment Method <span className={styles.required}>*</span>
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className={styles.input}
                        disabled={isVerifying}
                      >
                        <option value="">Select method</option>
                        <option value="gcash">GCash</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="cash">Cash</option>
                      </select>
                    </div>

                    {/* Reference Number */}
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Reference Number</label>
                      <input
                        type="text"
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        placeholder="Transaction reference (optional)"
                        className={styles.input}
                        disabled={isVerifying}
                      />
                    </div>

                    {/* Rejection Reason (only shown if partial payment) */}
                    {amountPaid > 0 && amountPaid < registration.totalAmount && (
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>
                          Message to User (shown on status page)
                        </label>
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder={`E.g., 'Partial payment of ₱${amountPaid} received. Please upload proof of remaining ₱${(registration.totalAmount - amountPaid).toFixed(2)}'`}
                          rows={3}
                          className={styles.textarea}
                          disabled={isVerifying}
                        />
                      </div>
                    )}
                  </>
                )}

                {/* Notes field - shown for all registrations */}
                {registration.totalAmount === 0 && (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Notes (Optional)</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Add any notes about this registration..."
                      rows={3}
                      className={styles.textarea}
                      disabled={isVerifying}
                    />
                  </div>
                )}

                {/* Rejection Reason Input (shown when rejecting) */}
                {showRejectionInput && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Rejection Reason <span className={styles.required}>*</span>
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Enter rejection reason (shown to user)..."
                      rows={3}
                      className={styles.textarea}
                      disabled={isVerifying}
                      autoFocus
                    />
                  </div>
                )}

                {/* Validation hint for required fields */}
                {registration.totalAmount > 0 &&
                  !showRejectionInput &&
                  (!amountPaid || !paymentMethod) && (
                    <p className={styles.validationHint}>
                      {!amountPaid && !paymentMethod
                        ? 'Please enter amount received and select payment method'
                        : !amountPaid
                        ? 'Please enter amount received'
                        : 'Please select a payment method'}
                    </p>
                  )}

                {/* Action Buttons */}
                <div className={styles.verificationActions}>
                  {showRejectionInput ? (
                    <>
                      <button
                        onClick={handleCancelRejection}
                        disabled={isVerifying}
                        className={styles.cancelRejectionButton}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmRejection}
                        disabled={!rejectionReason?.trim() || isVerifying}
                        className={styles.rejectButton}
                      >
                        {isVerifying ? 'Processing...' : '✗ Confirm Rejection'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleVerifyPayment}
                        disabled={
                          registration.totalAmount > 0
                            ? !amountPaid || !paymentMethod || isVerifying
                            : isVerifying
                        }
                        className={styles.verifyButton}
                      >
                        {isVerifying
                          ? 'Processing...'
                          : registration.totalAmount === 0
                          ? '✓ Approve Registration'
                          : amountPaid >= registration.totalAmount
                          ? '✓ Confirm Full Payment'
                          : '⚠ Mark as Partial Payment'}
                      </button>
                      <button
                        onClick={handleShowRejectionInput}
                        disabled={isVerifying}
                        className={styles.rejectButton}
                      >
                        {registration.totalAmount === 0 ? '✗ Reject Registration' : '✗ Reject Payment'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Waitlist Notification Section - Only shown for WAITLISTED status */}
          {registration.status === REGISTRATION_STATUS.WAITLISTED && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
                Waitlist Actions
              </h3>

              <div style={{
                backgroundColor: '#f3e8ff',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem',
              }}>
                <p style={{ margin: '0 0 0.5rem 0', color: '#6b7280' }}>
                  This registration is on the waitlist. You can manually send a payment notification
                  to offer them a slot, skipping the queue order.
                </p>
                <p style={{ margin: 0, color: '#7c3aed', fontWeight: '500' }}>
                  Waitlist Position: #{registration.waitlistPosition || 'N/A'}
                </p>
              </div>

              {notificationError && (
                <div style={{
                  backgroundColor: '#fee2e2',
                  border: '1px solid #ef4444',
                  borderRadius: '6px',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  color: '#991b1b',
                }}>
                  {notificationError}
                </div>
              )}

              {notificationSuccess && (
                <div style={{
                  backgroundColor: '#dcfce7',
                  border: '1px solid #22c55e',
                  borderRadius: '6px',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  color: '#166534',
                }}>
                  Payment notification sent successfully! The registrant will receive an email with payment instructions.
                </div>
              )}

              <button
                onClick={handleSendWaitlistNotification}
                disabled={isSendingNotification || notificationSuccess}
                style={{
                  backgroundColor: isSendingNotification || notificationSuccess ? '#9ca3af' : '#7c3aed',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: isSendingNotification || notificationSuccess ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                {isSendingNotification ? 'Sending...' : 'Send Payment Notification'}
              </button>
            </div>
          )}

          {/* Waitlist Offered Info Section - Show deadline and status */}
          {registration.status === REGISTRATION_STATUS.WAITLIST_OFFERED && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Waitlist Offer Status
              </h3>

              <div style={{
                backgroundColor: '#dbeafe',
                borderRadius: '8px',
                padding: '1rem',
              }}>
                <p style={{ margin: '0 0 0.5rem 0', color: '#1e40af', fontWeight: '500' }}>
                  Slot Offered - Awaiting Payment
                </p>
                {registration.waitlistOfferExpiresAt && (
                  <p style={{ margin: '0 0 0.5rem 0', color: '#6b7280' }}>
                    <strong>Payment Deadline:</strong> {formatDate(registration.waitlistOfferExpiresAt)}
                  </p>
                )}
                {registration.waitlistOfferSentAt && (
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                    Notification sent: {formatDate(registration.waitlistOfferSentAt)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Waitlist Expired - Promote Action */}
          {registration.status === REGISTRATION_STATUS.WAITLIST_EXPIRED && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Waitlist Actions
              </h3>

              <div style={{
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem',
              }}>
                <p style={{ margin: '0 0 0.5rem 0', color: '#4b5563', fontWeight: '500' }}>
                  Offer Expired
                </p>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                  This waitlist offer has expired. You can promote this registration directly to
                  pending payment status if a slot is available.
                </p>
              </div>

              {promoteError && (
                <div style={{
                  backgroundColor: '#fee2e2',
                  border: '1px solid #ef4444',
                  borderRadius: '6px',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  color: '#991b1b',
                }}>
                  {promoteError}
                </div>
              )}

              {promoteSuccess && (
                <div style={{
                  backgroundColor: '#dcfce7',
                  border: '1px solid #22c55e',
                  borderRadius: '6px',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  color: '#166534',
                }}>
                  Successfully promoted to pending payment!
                </div>
              )}

              <button
                onClick={handlePromoteFromWaitlist}
                disabled={isPromoting || promoteSuccess}
                style={{
                  backgroundColor: isPromoting || promoteSuccess ? '#9ca3af' : '#059669',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: isPromoting || promoteSuccess ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
                  <path d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                {isPromoting ? 'Promoting...' : 'Promote to Pending Payment'}
              </button>
            </div>
          )}

          {/* Cancelled Registration - Refund Action */}
          {registration.status === REGISTRATION_STATUS.CANCELLED && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Process Refund
              </h3>

              {registration.cancellation && (
                <div style={{
                  backgroundColor: '#fee2e2',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1rem',
                }}>
                  <p style={{ margin: '0 0 0.5rem 0', color: '#991b1b', fontWeight: '500' }}>
                    Cancelled
                  </p>
                  {registration.cancellation.reason && (
                    <p style={{ margin: '0 0 0.5rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
                      <strong>Reason:</strong> {registration.cancellation.reason}
                    </p>
                  )}
                  {registration.cancellation.cancelledAt && (
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                      <strong>Date:</strong> {formatDate(registration.cancellation.cancelledAt)}
                    </p>
                  )}
                </div>
              )}

              {/* Refund Policy Info */}
              <div style={{
                backgroundColor: refundEligibility.eligible ? '#f0fdf4' : '#fef2f2',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem',
                border: `1px solid ${refundEligibility.eligible ? '#86efac' : '#fecaca'}`,
              }}>
                <p style={{
                  margin: 0,
                  color: refundEligibility.eligible ? '#166534' : '#991b1b',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                }}>
                  {refundEligibility.type === 'full'
                    ? 'Eligible for Full Refund (100%)'
                    : refundEligibility.type === 'partial'
                      ? `Eligible for Partial Refund (${refundEligibility.percent}%)`
                      : 'Not Eligible for Refund'}
                </p>
                <p style={{
                  margin: '0.25rem 0 0 0',
                  color: '#6b7280',
                  fontSize: '0.8rem',
                }}>
                  {refundEligibility.message}
                </p>
              </div>

              {!showRefundForm ? (
                <button
                  onClick={() => setShowRefundForm(true)}
                  style={{
                    backgroundColor: '#6b7280',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
                    <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Process Refund
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {refundError && (
                    <div style={{
                      backgroundColor: '#fee2e2',
                      border: '1px solid #ef4444',
                      borderRadius: '6px',
                      padding: '0.75rem',
                      color: '#991b1b',
                    }}>
                      {refundError}
                    </div>
                  )}

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Amount Paid</label>
                    <input
                      type="text"
                      value={formatCurrency(registration.payment?.amountPaid || registration.totalAmount || 0)}
                      disabled
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Refund Amount <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      min="0"
                      max={registration.payment?.amountPaid || registration.totalAmount || 0}
                      step="0.01"
                      className={styles.input}
                      disabled={isRefunding}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Refund Method <span className={styles.required}>*</span>
                    </label>
                    <select
                      value={refundMethod}
                      onChange={(e) => setRefundMethod(e.target.value)}
                      className={styles.input}
                      disabled={isRefunding}
                    >
                      <option value="">Select method</option>
                      <option value="gcash">GCash</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Reference Number</label>
                    <input
                      type="text"
                      value={refundReference}
                      onChange={(e) => setRefundReference(e.target.value)}
                      placeholder="Transaction reference (optional)"
                      className={styles.input}
                      disabled={isRefunding}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Refund Reason <span className={styles.required}>*</span>
                    </label>
                    <textarea
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="Enter reason for refund..."
                      rows={3}
                      className={styles.textarea}
                      disabled={isRefunding}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => setShowRefundForm(false)}
                      disabled={isRefunding}
                      style={{
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        cursor: isRefunding ? 'not-allowed' : 'pointer',
                        fontWeight: '500',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRefund}
                      disabled={isRefunding || !refundReason.trim() || !refundMethod}
                      style={{
                        backgroundColor: isRefunding || !refundReason.trim() || !refundMethod ? '#9ca3af' : '#059669',
                        color: 'white',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: isRefunding || !refundReason.trim() || !refundMethod ? 'not-allowed' : 'pointer',
                        fontWeight: '500',
                      }}
                    >
                      {isRefunding ? 'Processing...' : 'Confirm Refund'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cancel Registration Action - For active registrations */}
          {![
            REGISTRATION_STATUS.CANCELLED,
            REGISTRATION_STATUS.REFUNDED,
            REGISTRATION_STATUS.WAITLIST_EXPIRED,
          ].includes(registration.status) && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                Cancel Registration
              </h3>

              {!showCancelForm ? (
                <button
                  onClick={() => setShowCancelForm(true)}
                  style={{
                    backgroundColor: '#dc2626',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  Cancel Registration
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {cancelError && (
                    <div style={{
                      backgroundColor: '#fee2e2',
                      border: '1px solid #ef4444',
                      borderRadius: '6px',
                      padding: '0.75rem',
                      color: '#991b1b',
                    }}>
                      {cancelError}
                    </div>
                  )}

                  <div style={{
                    backgroundColor: '#fef3c7',
                    borderRadius: '8px',
                    padding: '1rem',
                  }}>
                    <p style={{ margin: 0, color: '#92400e', fontSize: '0.875rem' }}>
                      This will cancel the registration and decrement workshop counts if applicable.
                      This action can be followed by processing a refund.
                    </p>
                  </div>

                  {/* Refund Policy Warning */}
                  <div style={{
                    backgroundColor: refundEligibility.eligible ? '#dcfce7' : '#fee2e2',
                    borderRadius: '8px',
                    padding: '1rem',
                    border: `1px solid ${refundEligibility.eligible ? '#22c55e' : '#ef4444'}`,
                  }}>
                    <p style={{
                      margin: 0,
                      color: refundEligibility.eligible ? '#166534' : '#991b1b',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                    }}>
                      Refund Eligibility: {refundEligibility.type === 'full' ? 'Full Refund' : refundEligibility.type === 'partial' ? `Partial Refund (${refundEligibility.percent}%)` : 'No Refund'}
                    </p>
                    <p style={{
                      margin: '0.25rem 0 0 0',
                      color: refundEligibility.eligible ? '#166534' : '#991b1b',
                      fontSize: '0.8rem',
                    }}>
                      {refundEligibility.message} ({refundEligibility.daysUntilEvent} days until event)
                    </p>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Cancellation Reason <span className={styles.required}>*</span>
                    </label>
                    <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Enter reason for cancellation..."
                      rows={3}
                      className={styles.textarea}
                      disabled={isCancelling}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => {
                        setShowCancelForm(false);
                        setCancelReason('');
                        setCancelError(null);
                      }}
                      disabled={isCancelling}
                      style={{
                        backgroundColor: '#f3f4f6',
                        color: '#374151',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        cursor: isCancelling ? 'not-allowed' : 'pointer',
                        fontWeight: '500',
                      }}
                    >
                      Back
                    </button>
                    <button
                      onClick={handleCancelRegistration}
                      disabled={isCancelling || !cancelReason.trim()}
                      style={{
                        backgroundColor: isCancelling || !cancelReason.trim() ? '#9ca3af' : '#dc2626',
                        color: 'white',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: isCancelling || !cancelReason.trim() ? 'not-allowed' : 'pointer',
                        fontWeight: '500',
                      }}
                    >
                      {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Activity History Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Activity History
            </h3>
            {isLoadingActivity ? (
              <p className={styles.loadingText}>Loading activity history...</p>
            ) : activityLogs.length === 0 ? (
              <p className={styles.emptyText}>No activity recorded yet.</p>
            ) : (
              <div className={styles.activityTimeline}>
                {activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`${styles.activityItem} ${getActivityClass(log.type)}`}
                  >
                    <div className={styles.activityIcon}>
                      {log.type === ACTIVITY_TYPES.APPROVE && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                      {log.type === ACTIVITY_TYPES.REJECT && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      )}
                      {log.type === ACTIVITY_TYPES.CREATE && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      )}
                      {log.type === ACTIVITY_TYPES.UPDATE && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      )}
                      {![
                        ACTIVITY_TYPES.APPROVE,
                        ACTIVITY_TYPES.REJECT,
                        ACTIVITY_TYPES.CREATE,
                        ACTIVITY_TYPES.UPDATE,
                      ].includes(log.type) && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                        </svg>
                      )}
                    </div>
                    <div className={styles.activityContent}>
                      <div className={styles.activityHeader}>
                        <span className={styles.activityType}>
                          {ACTIVITY_TYPE_LABELS[log.type] || log.type}
                        </span>
                        <span className={styles.activityDate}>
                          {formatActivityDate(log.createdAt)}
                        </span>
                      </div>
                      <p className={styles.activityDescription}>{log.description}</p>
                      {log.adminEmail && (
                        <span className={styles.activityAdmin}>by {log.adminEmail}</span>
                      )}
                    </div>
                  </div>
                ))}
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
                        {getCategoryName(attendee.category)}
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
  onRefresh: PropTypes.func,
  registration: PropTypes.shape({
    id: PropTypes.string.isRequired,
    primaryAttendee: PropTypes.shape({
      firstName: PropTypes.string,
      lastName: PropTypes.string,
      email: PropTypes.string,
      phone: PropTypes.string,
      church: PropTypes.string, // Legacy format
      ministryRole: PropTypes.string,
      workshopSelections: PropTypes.arrayOf(
        PropTypes.shape({
          sessionId: PropTypes.string,
          sessionTitle: PropTypes.string,
          timeSlot: PropTypes.string,
        })
      ),
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
  onRefresh: null,
};

export default RegistrationDetailModal;
