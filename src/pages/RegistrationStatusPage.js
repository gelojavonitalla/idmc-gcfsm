import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useSettings, DEFAULT_SETTINGS } from '../context';
import {
  REGISTRATION_STATUS,
  REGISTRATION_CATEGORY_LABELS,
  ROUTES,
  MINISTRY_ROLES,
} from '../constants';
import { formatPrice, maskEmail, maskName, maskPhone, calculateRefundEligibility } from '../utils';
import {
  lookupRegistration,
  getAttendeeCheckInStatus,
  areAllAttendeesCheckedIn,
  getCheckedInAttendeeCount,
  uploadPaymentProof,
  updatePaymentProof,
  cancelWaitlistRegistration,
  cancelUserRegistration,
  transferUserRegistration,
  getWaitlistPosition,
  uploadWaitlistPayment,
  sendVerificationCode,
  verifyCode,
  sendTransferNotification,
  sendTransferConfirmation,
  VERIFICATION_ACTION,
} from '../services';
import styles from './RegistrationStatusPage.module.css';

/**
 * Status badge configuration mapping
 */
const STATUS_CONFIG = {
  [REGISTRATION_STATUS.PENDING_PAYMENT]: {
    label: 'Pending Payment',
    className: 'statusPending',
  },
  [REGISTRATION_STATUS.PENDING_VERIFICATION]: {
    label: 'Payment Under Review',
    className: 'statusPending',
  },
  [REGISTRATION_STATUS.CONFIRMED]: {
    label: 'Confirmed',
    className: 'statusConfirmed',
  },
  [REGISTRATION_STATUS.CANCELLED]: {
    label: 'Cancelled',
    className: 'statusCancelled',
  },
  [REGISTRATION_STATUS.REFUNDED]: {
    label: 'Refunded',
    className: 'statusCancelled',
  },
  [REGISTRATION_STATUS.WAITLISTED]: {
    label: 'On Waitlist',
    className: 'statusWaitlisted',
  },
  [REGISTRATION_STATUS.WAITLIST_OFFERED]: {
    label: 'Slot Available - Pay Now!',
    className: 'statusOffered',
  },
  [REGISTRATION_STATUS.WAITLIST_EXPIRED]: {
    label: 'Offer Expired',
    className: 'statusCancelled',
  },
};

/**
 * Checked-in status configuration
 */
const CHECKED_IN_STATUS_CONFIG = {
  label: 'Checked In',
  className: 'statusCheckedIn',
};

/**
 * RegistrationStatusPage Component
 * Allows users to look up their registration status using various identifiers.
 *
 * @returns {JSX.Element} The registration status lookup page
 */
function RegistrationStatusPage() {
  const { settings: dbSettings, isLoading: isLoadingSettings } = useSettings();
  // Use DEFAULT_SETTINGS as fallback only after Firebase has loaded
  const settings = isLoadingSettings ? null : (dbSettings || DEFAULT_SETTINGS);
  const [searchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState('');
  const [registration, setRegistration] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Payment re-upload states
  const [paymentFile, setPaymentFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Waitlist-specific states
  const [waitlistPosition, setWaitlistPosition] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');

  // User cancellation states (for confirmed/pending registrations)
  const [showUserCancelModal, setShowUserCancelModal] = useState(false);
  const [userCancelReason, setUserCancelReason] = useState('');
  const [userCancelAcknowledged, setUserCancelAcknowledged] = useState(false);
  const [isUserCancelling, setIsUserCancelling] = useState(false);
  const [userCancelError, setUserCancelError] = useState(null);

  // Transfer registration states
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferData, setTransferData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    cellphone: '',
    ministryRole: '',
  });
  const [transferReason, setTransferReason] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferError, setTransferError] = useState(null);

  // Verification code states
  const [verificationStep, setVerificationStep] = useState('form'); // 'form' | 'code' | 'verified'
  const [verificationCode, setVerificationCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState(null);
  const [codeExpiryMinutes, setCodeExpiryMinutes] = useState(null);

  /**
   * Performs the registration lookup
   */
  const handleSearch = useCallback(async (value) => {
    const searchTerm = value || searchValue;
    if (!searchTerm.trim()) {
      setError('Please enter a registration ID, email, or phone number');
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const result = await lookupRegistration(searchTerm.trim());

      if (result) {
        setRegistration(result);
      } else {
        setRegistration(null);
        setError('Registration not found. Please check your information and try again.');
      }
    } catch (err) {
      console.error('Lookup error:', err);
      setError('An error occurred while looking up your registration. Please try again.');
      setRegistration(null);
    } finally {
      setIsLoading(false);
    }
  }, [searchValue]);

  /**
   * Handles form submission
   */
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    handleSearch();
  }, [handleSearch]);

  /**
   * Handles file selection for payment proof re-upload
   */
  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please upload an image file (JPG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    setPaymentFile(file);
    setUploadError(null);
    setUploadSuccess(false);
  }, []);

  /**
   * Handles payment proof upload
   */
  const handleUploadPayment = useCallback(async () => {
    if (!paymentFile || !registration) {
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      // Upload file to storage
      const downloadUrl = await uploadPaymentProof(
        paymentFile,
        registration.id,
        (progress) => setUploadProgress(progress)
      );

      // Update registration with new payment proof
      await updatePaymentProof(registration.id, downloadUrl);

      // Update local registration state
      setRegistration((prev) => ({
        ...prev,
        status: REGISTRATION_STATUS.PENDING_VERIFICATION,
        payment: {
          ...prev.payment,
          proofUrl: downloadUrl,
          uploadedAt: new Date().toISOString(),
        },
      }));

      setUploadSuccess(true);
      setPaymentFile(null);

      // Clear success message after 5 seconds
      setTimeout(() => setUploadSuccess(false), 5000);
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err.message || 'Failed to upload payment proof. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [paymentFile, registration]);

  /**
   * Handles waitlist payment upload (for WAITLIST_OFFERED status)
   */
  const handleWaitlistPaymentUpload = useCallback(async () => {
    if (!paymentFile || !registration || !selectedPaymentMethod) {
      setUploadError('Please select a payment method and upload a proof of payment');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      // Upload file to storage
      const downloadUrl = await uploadPaymentProof(
        paymentFile,
        registration.id,
        (progress) => setUploadProgress(progress)
      );

      // Update registration with payment info
      await uploadWaitlistPayment(registration.id, downloadUrl, selectedPaymentMethod);

      // Update local registration state
      setRegistration((prev) => ({
        ...prev,
        status: REGISTRATION_STATUS.PENDING_VERIFICATION,
        payment: {
          ...prev.payment,
          proofUrl: downloadUrl,
          method: selectedPaymentMethod,
          uploadedAt: new Date().toISOString(),
        },
      }));

      setUploadSuccess(true);
      setPaymentFile(null);
      setSelectedPaymentMethod('');

      // Clear success message after 5 seconds
      setTimeout(() => setUploadSuccess(false), 5000);
    } catch (err) {
      console.error('Waitlist payment upload error:', err);
      setUploadError(err.message || 'Failed to upload payment proof. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [paymentFile, registration, selectedPaymentMethod]);

  /**
   * Handles waitlist cancellation
   */
  const handleCancelWaitlist = useCallback(async () => {
    if (!registration) return;

    setIsCancelling(true);
    setCancelError(null);

    try {
      await cancelWaitlistRegistration(registration.id, 'User cancelled from status page');

      // Update local state
      setRegistration((prev) => ({
        ...prev,
        status: REGISTRATION_STATUS.CANCELLED,
      }));

      setShowCancelConfirm(false);
    } catch (err) {
      console.error('Cancel error:', err);
      setCancelError(err.message || 'Failed to cancel waitlist registration. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  }, [registration]);

  /**
   * Sends a verification code for cancel/transfer actions
   */
  const handleSendVerificationCode = useCallback(async (action) => {
    if (!registration) return;

    setIsSendingCode(true);
    setVerificationError(null);

    try {
      const result = await sendVerificationCode(registration.id, action);
      setCodeExpiryMinutes(result.expiryMinutes || 15);
      setVerificationStep('code');
    } catch (err) {
      console.error('Send verification code error:', err);
      setVerificationError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsSendingCode(false);
    }
  }, [registration]);

  /**
   * Verifies the entered verification code
   */
  const handleVerifyCode = useCallback(async (action, onSuccess) => {
    if (!registration || !verificationCode.trim()) return;

    setIsVerifying(true);
    setVerificationError(null);

    try {
      await verifyCode(registration.id, action, verificationCode.trim());
      setVerificationStep('verified');
      // Execute the action after successful verification
      if (onSuccess) {
        await onSuccess();
      }
    } catch (err) {
      console.error('Verify code error:', err);
      setVerificationError(err.message || 'Invalid verification code. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  }, [registration, verificationCode]);

  /**
   * Resets verification state
   */
  const resetVerificationState = useCallback(() => {
    setVerificationStep('form');
    setVerificationCode('');
    setVerificationError(null);
    setCodeExpiryMinutes(null);
  }, []);

  /**
   * Handles user registration cancellation (for confirmed/pending registrations)
   * Now requires verification before proceeding
   */
  const handleUserCancel = useCallback(async () => {
    if (!registration || !userCancelReason.trim()) return;

    // If not yet verified, send verification code first
    if (verificationStep === 'form') {
      await handleSendVerificationCode(VERIFICATION_ACTION.CANCEL);
      return;
    }

    // If at code step, verify the code first
    if (verificationStep === 'code') {
      await handleVerifyCode(VERIFICATION_ACTION.CANCEL, async () => {
        // Proceed with cancellation after verification
        setIsUserCancelling(true);
        setUserCancelError(null);

        try {
          // Calculate refund eligibility at time of cancellation
          const refundEligibilityData = settings?.refundPolicy && settings?.startDate
            ? calculateRefundEligibility(settings.refundPolicy, settings.startDate)
            : null;

          await cancelUserRegistration(
            registration.id,
            userCancelReason.trim(),
            refundEligibilityData
          );

          // Update local state
          setRegistration((prev) => ({
            ...prev,
            status: REGISTRATION_STATUS.CANCELLED,
          }));

          setShowUserCancelModal(false);
          setUserCancelReason('');
          setUserCancelAcknowledged(false);
          resetVerificationState();
        } catch (err) {
          console.error('User cancel error:', err);
          setUserCancelError(err.message || 'Failed to cancel registration. Please try again.');
        } finally {
          setIsUserCancelling(false);
        }
      });
      return;
    }
  }, [registration, userCancelReason, settings, verificationStep, handleSendVerificationCode, handleVerifyCode, resetVerificationState]);

  /**
   * Computes refund eligibility based on current settings and event date
   */
  const refundEligibility = useMemo(() => {
    if (!settings?.refundPolicy || !settings?.startDate) {
      return null;
    }
    return calculateRefundEligibility(settings.refundPolicy, settings.startDate);
  }, [settings]);

  /**
   * Handles registration transfer
   * Now requires verification before proceeding
   */
  const handleTransfer = useCallback(async () => {
    if (!registration || !transferData.firstName || !transferData.lastName ||
        !transferData.email || !transferData.cellphone) {
      return;
    }

    // If not yet verified, send verification code first
    if (verificationStep === 'form') {
      await handleSendVerificationCode(VERIFICATION_ACTION.TRANSFER);
      return;
    }

    // If at code step, verify the code first
    if (verificationStep === 'code') {
      await handleVerifyCode(VERIFICATION_ACTION.TRANSFER, async () => {
        // Proceed with transfer after verification
        setIsTransferring(true);
        setTransferError(null);

        try {
          // Store original attendee info for notifications
          const originalName = registration.primaryAttendee
            ? `${registration.primaryAttendee.firstName} ${registration.primaryAttendee.lastName}`
            : 'Previous attendee';
          const originalEmail = registration.primaryAttendee?.email;

          await transferUserRegistration(
            registration.id,
            transferData,
            transferReason.trim() || 'User initiated transfer'
          );

          // Send notification to new attendee (non-blocking)
          const newAttendeeName = `${transferData.firstName} ${transferData.lastName}`;
          sendTransferNotification(
            registration.id,
            transferData.email.trim().toLowerCase(),
            newAttendeeName,
            originalName
          ).catch((err) => {
            console.warn('Failed to send transfer notification:', err);
          });

          // Send confirmation to original attendee (non-blocking)
          if (originalEmail) {
            sendTransferConfirmation(
              registration.id,
              originalEmail,
              originalName,
              newAttendeeName
            ).catch((err) => {
              console.warn('Failed to send transfer confirmation:', err);
            });
          }

          // Update local state with new attendee info
          setRegistration((prev) => ({
            ...prev,
            primaryAttendee: {
              ...prev.primaryAttendee,
              ...transferData,
              email: transferData.email.trim().toLowerCase(),
            },
          }));

          setShowTransferModal(false);
          setTransferData({
            firstName: '',
            lastName: '',
            middleName: '',
            email: '',
            cellphone: '',
            ministryRole: '',
          });
          setTransferReason('');
          resetVerificationState();
        } catch (err) {
          console.error('Transfer error:', err);
          setTransferError(err.message || 'Failed to transfer registration. Please try again.');
        } finally {
          setIsTransferring(false);
        }
      });
      return;
    }
  }, [registration, transferData, transferReason, verificationStep, handleSendVerificationCode, handleVerifyCode, resetVerificationState]);

  /**
   * Checks if user cancellation is enabled and allowed
   */
  const canUserCancel = useMemo(() => {
    // Default to true if refundPolicy or userCancellationEnabled is not set (backwards compatibility)
    return settings?.refundPolicy?.userCancellationEnabled !== false;
  }, [settings]);

  /**
   * Checks if transfer is enabled and within deadline
   */
  const canTransfer = useMemo(() => {
    // Default to true if refundPolicy or transferEnabled is not set (backwards compatibility)
    if (settings?.refundPolicy?.transferEnabled === false) return false;

    // Check transfer deadline (default to 3 days if not configured)
    const transferDeadlineDays = settings?.refundPolicy?.transferDeadlineDays ?? 3;
    if (transferDeadlineDays > 0 && settings?.startDate) {
      const now = new Date();
      const eventDate = new Date(settings.startDate);
      const daysUntilEvent = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
      if (daysUntilEvent < transferDeadlineDays) {
        return false;
      }
    }

    return true;
  }, [settings]);

  /**
   * Fetches waitlist position when registration is loaded
   */
  useEffect(() => {
    const fetchWaitlistPosition = async () => {
      if (registration &&
          (registration.status === REGISTRATION_STATUS.WAITLISTED ||
           registration.status === REGISTRATION_STATUS.WAITLIST_OFFERED)) {
        try {
          const position = await getWaitlistPosition(registration.id);
          setWaitlistPosition(position);
        } catch (err) {
          console.error('Failed to fetch waitlist position:', err);
        }
      } else {
        setWaitlistPosition(null);
      }
    };

    fetchWaitlistPosition();
  }, [registration]);

  /**
   * Auto-search if ID is provided in URL params
   */
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setSearchValue(id);
      handleSearch(id);
    }
  }, [searchParams, handleSearch]);

  /**
   * Gets the status configuration for display
   * Prioritizes check-in status over payment status when the attendee has checked in
   *
   * @param {string} status - The registration payment status
   * @param {boolean} checkedIn - Whether the attendee has checked in
   * @returns {Object} Status configuration with label and className
   */
  const getStatusConfig = useCallback((status, checkedIn) => {
    if (checkedIn) {
      return CHECKED_IN_STATUS_CONFIG;
    }
    return STATUS_CONFIG[status] || {
      label: status || 'Unknown',
      className: 'statusPending',
    };
  }, []);

  /**
   * Gets the payment status configuration (always returns payment status, not check-in)
   *
   * @param {string} status - The registration payment status
   * @returns {Object} Status configuration with label and className
   */
  const getPaymentStatusConfig = useCallback((status) => {
    return STATUS_CONFIG[status] || {
      label: status || 'Unknown',
      className: 'statusPending',
    };
  }, []);

  /**
   * Formats a date string for display
   */
  const formatDate = useCallback((dateString) => {
    if (!dateString) {
      return 'N/A';
    }
    const date = dateString.toDate ? dateString.toDate() : new Date(dateString);
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  /**
   * Formats check-in time for display
   */
  const formatCheckInTime = useCallback((timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  /**
   * Gets check-in status for an attendee
   */
  const getCheckInInfo = useCallback((attendeeIndex) => {
    if (!registration) return { checkedIn: false };
    return getAttendeeCheckInStatus(registration, attendeeIndex) || { checkedIn: false };
  }, [registration]);

  // Check-in status tracking
  const totalAttendees = registration
    ? 1 + (registration.additionalAttendees?.length || 0)
    : 0;
  const checkedInCount = registration
    ? getCheckedInAttendeeCount(registration)
    : 0;
  const allCheckedIn = registration
    ? areAllAttendeesCheckedIn(registration)
    : false;

  // Use allCheckedIn for status config to show "Checked In" banner when all attendees are checked in
  const statusConfig = registration ? getStatusConfig(registration.status, allCheckedIn) : null;
  // Always get the actual payment status (separate from check-in status)
  const paymentStatusConfig = registration ? getPaymentStatusConfig(registration.status) : null;
  const isConfirmed = registration?.status === REGISTRATION_STATUS.CONFIRMED;

  return (
    <div className={styles.page}>
      <section className={styles.heroSection}>
        <h1 className={styles.heroTitle}>Check Registration Status</h1>
        <p className={styles.heroSubtitle}>
          Look up your registration using your ID, email, or phone number
        </p>
      </section>

      <section className={styles.contentSection}>
        <div className={styles.container}>
          {/* Search Form */}
          <div className={styles.searchCard}>
            <form onSubmit={handleSubmit} className={styles.searchForm}>
              <div className={styles.searchInputWrapper}>
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Enter Registration ID, Email, or Phone"
                  className={styles.searchInput}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className={styles.searchButton}
                  disabled={isLoading}
                >
                  {isLoading ? 'Searching...' : 'Search'}
                </button>
              </div>
              <p className={styles.searchHint}>
                Examples: REG-2026-A7K3MN, A7K3MN, K3MN, email@example.com, 09171234567
              </p>
            </form>
          </div>

          {/* Error Message */}
          {error && hasSearched && (
            <div className={styles.errorBox}>
              <p>{error}</p>
              <p>
                Need help? <a href={ROUTES.CONTACT}>Contact us</a>
              </p>
            </div>
          )}

          {/* Registration Details */}
          {registration && (
            <div className={styles.resultCard}>
              {/* Status Banner */}
              <div className={`${styles.statusBanner} ${styles[statusConfig.className]}`}>
                <span className={styles.statusLabel}>{statusConfig.label}</span>
              </div>

              {/* Check-in Status Banner (for confirmed registrations) */}
              {isConfirmed && checkedInCount > 0 && (
                <div className={`${styles.checkInBanner} ${allCheckedIn ? styles.checkInComplete : styles.checkInPartial}`}>
                  <span className={styles.checkInIcon}>
                    {allCheckedIn ? '✓' : '○'}
                  </span>
                  <span className={styles.checkInLabel}>
                    {allCheckedIn
                      ? 'All Attendees Checked In'
                      : `${checkedInCount} of ${totalAttendees} Checked In`}
                  </span>
                </div>
              )}

              {/* Waitlist Info Section */}
              {registration.status === REGISTRATION_STATUS.WAITLISTED && (
                <div className={styles.waitlistInfoSection} style={{
                  backgroundColor: '#f3e8ff',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '2rem' }}>⏳</span>
                    <div>
                      <h3 style={{ color: '#7c3aed', margin: '0 0 0.25rem 0' }}>On Waitlist</h3>
                      {waitlistPosition && (
                        <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: '#6b21a8' }}>
                          Position #{waitlistPosition}
                        </p>
                      )}
                    </div>
                  </div>
                  <p style={{ margin: '0 0 1rem 0', color: '#6b7280' }}>
                    You are on the waitlist. If a slot becomes available, we will email you immediately
                    with payment instructions. No payment is required at this time.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowCancelConfirm(true)}
                    className={styles.cancelButton}
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid #dc2626',
                      color: '#dc2626',
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel Waitlist Registration
                  </button>
                </div>
              )}

              {/* Waitlist Slot Offered Section */}
              {registration.status === REGISTRATION_STATUS.WAITLIST_OFFERED && (
                <div className={styles.waitlistOfferedSection} style={{
                  backgroundColor: '#dbeafe',
                  border: '2px solid #3b82f6',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '2rem' }}>🎉</span>
                    <div>
                      <h3 style={{ color: '#1e40af', margin: '0 0 0.25rem 0' }}>A Slot is Available!</h3>
                      <p style={{ margin: 0, color: '#1e3a8a', fontWeight: '500' }}>
                        Complete your payment to confirm your registration
                      </p>
                    </div>
                  </div>

                  {registration.waitlistOfferExpiresAt && (
                    <div style={{
                      backgroundColor: '#fef3c7',
                      border: '1px solid #f59e0b',
                      borderRadius: '6px',
                      padding: '0.75rem',
                      marginBottom: '1rem',
                    }}>
                      <p style={{ margin: 0, color: '#92400e', fontWeight: '500' }}>
                        ⚠️ Payment Deadline: {formatDate(registration.waitlistOfferExpiresAt)}
                      </p>
                      <p style={{ margin: '0.25rem 0 0 0', color: '#92400e', fontSize: '0.875rem' }}>
                        If payment is not received by this time, your slot will be offered to the next person.
                      </p>
                    </div>
                  )}

                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: '500' }}>
                      Amount to Pay: <strong style={{ fontSize: '1.25rem' }}>{formatPrice(registration.totalAmount || 0)}</strong>
                    </p>
                  </div>

                  {/* Payment Method Selection */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Select Payment Method:
                    </label>
                    <select
                      value={selectedPaymentMethod}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        fontSize: '1rem',
                      }}
                    >
                      <option value="">-- Select payment method --</option>
                      <option value="gcash">GCash</option>
                      <option value="paymaya">Maya</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                  </div>

                  {/* File Upload */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Upload Payment Proof:
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      disabled={isUploading}
                      style={{ marginBottom: '0.5rem' }}
                    />
                    {paymentFile && (
                      <p style={{ margin: 0, color: '#059669', fontSize: '0.875rem' }}>
                        Selected: {paymentFile.name}
                      </p>
                    )}
                  </div>

                  {/* Upload Progress */}
                  {isUploading && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{
                        backgroundColor: '#e5e7eb',
                        borderRadius: '4px',
                        height: '8px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          backgroundColor: '#3b82f6',
                          height: '100%',
                          width: `${uploadProgress}%`,
                          transition: 'width 0.3s ease',
                        }} />
                      </div>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                        Uploading... {uploadProgress}%
                      </p>
                    </div>
                  )}

                  {uploadError && (
                    <p style={{ color: '#dc2626', margin: '0 0 1rem 0' }}>{uploadError}</p>
                  )}

                  {uploadSuccess && (
                    <p style={{ color: '#059669', margin: '0 0 1rem 0' }}>
                      ✓ Payment proof uploaded! Your payment is being reviewed.
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleWaitlistPaymentUpload}
                    disabled={isUploading || !paymentFile || !selectedPaymentMethod}
                    style={{
                      backgroundColor: isUploading || !paymentFile || !selectedPaymentMethod ? '#9ca3af' : '#3b82f6',
                      color: 'white',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: isUploading || !paymentFile || !selectedPaymentMethod ? 'not-allowed' : 'pointer',
                      fontWeight: '500',
                      width: '100%',
                    }}
                  >
                    {isUploading ? 'Uploading...' : 'Submit Payment'}
                  </button>
                </div>
              )}

              {/* Waitlist Expired Notice */}
              {registration.status === REGISTRATION_STATUS.WAITLIST_EXPIRED && (
                <div style={{
                  backgroundColor: '#fee2e2',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                }}>
                  <h3 style={{ color: '#991b1b', margin: '0 0 0.5rem 0' }}>Offer Expired</h3>
                  <p style={{ margin: 0, color: '#7f1d1d' }}>
                    The payment deadline for your waitlist offer has passed. The slot has been offered to the next person in line.
                    If you are still interested, please register again.
                  </p>
                </div>
              )}

              {/* Cancel Confirmation Modal */}
              {showCancelConfirm && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000,
                }}>
                  <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '2rem',
                    maxWidth: '400px',
                    width: '90%',
                  }}>
                    <h3 style={{ margin: '0 0 1rem 0' }}>Cancel Waitlist Registration?</h3>
                    <p style={{ margin: '0 0 1.5rem 0', color: '#6b7280' }}>
                      Are you sure you want to cancel your waitlist registration? This action cannot be undone.
                    </p>
                    {cancelError && (
                      <p style={{ color: '#dc2626', margin: '0 0 1rem 0' }}>{cancelError}</p>
                    )}
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => setShowCancelConfirm(false)}
                        disabled={isCancelling}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          border: '1px solid #d1d5db',
                          backgroundColor: 'white',
                          cursor: 'pointer',
                        }}
                      >
                        Keep Registration
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelWaitlist}
                        disabled={isCancelling}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: '#dc2626',
                          color: 'white',
                          cursor: isCancelling ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* User Cancel Registration Modal */}
              {showUserCancelModal && (
                <div
                  onClick={() => setShowUserCancelModal(false)}
                  style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000,
                  padding: '1rem',
                }}>
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '2rem',
                    maxWidth: '500px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                  }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#dc2626' }}>Cancel Registration</h3>

                    {/* Step 1: Cancellation Form */}
                    {verificationStep === 'form' && (
                      <>
                        <p style={{ margin: '0 0 1rem 0', color: '#6b7280' }}>
                          Are you sure you want to cancel your registration? This action cannot be undone.
                        </p>

                        {/* Refund Eligibility Info */}
                        {refundEligibility && (
                          <div style={{
                            backgroundColor: refundEligibility.type === 'full' ? '#dcfce7' :
                              refundEligibility.type === 'partial' ? '#fef3c7' : '#fee2e2',
                            border: `1px solid ${refundEligibility.type === 'full' ? '#22c55e' :
                              refundEligibility.type === 'partial' ? '#f59e0b' : '#ef4444'}`,
                            borderRadius: '8px',
                            padding: '1rem',
                            marginBottom: '1rem',
                          }}>
                            <p style={{
                              margin: '0 0 0.5rem 0',
                              fontWeight: '600',
                              color: refundEligibility.type === 'full' ? '#166534' :
                                refundEligibility.type === 'partial' ? '#92400e' : '#991b1b',
                            }}>
                              {refundEligibility.type === 'full' && 'Full Refund Eligible (100%)'}
                              {refundEligibility.type === 'partial' && `Partial Refund Eligible (${refundEligibility.percent}%)`}
                              {refundEligibility.type === 'none' && 'Not Eligible for Refund'}
                            </p>
                            <p style={{
                              margin: 0,
                              fontSize: '0.875rem',
                              color: refundEligibility.type === 'full' ? '#166534' :
                                refundEligibility.type === 'partial' ? '#92400e' : '#991b1b',
                            }}>
                              {refundEligibility.message}
                            </p>
                            {refundEligibility.type !== 'none' && registration.payment?.amountPaid > 0 && (
                              <p style={{
                                margin: '0.5rem 0 0 0',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                color: refundEligibility.type === 'full' ? '#166534' : '#92400e',
                              }}>
                                Refund Amount: {formatPrice(Math.round((registration.payment.amountPaid || 0) * (refundEligibility.percent / 100)))}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Cancellation Reason */}
                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                            Reason for cancellation: <span style={{ color: '#dc2626' }}>*</span>
                          </label>
                          <textarea
                            value={userCancelReason}
                            onChange={(e) => setUserCancelReason(e.target.value)}
                            placeholder="Please tell us why you are cancelling..."
                            style={{
                              width: '100%',
                              minHeight: '80px',
                              padding: '0.75rem',
                              borderRadius: '6px',
                              border: '1px solid #d1d5db',
                              fontSize: '1rem',
                              resize: 'vertical',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>

                        {/* Acknowledgment Checkbox */}
                        <div style={{ marginBottom: '1.5rem' }}>
                          <label style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.5rem',
                            cursor: 'pointer',
                          }}>
                            <input
                              type="checkbox"
                              checked={userCancelAcknowledged}
                              onChange={(e) => setUserCancelAcknowledged(e.target.checked)}
                              style={{ marginTop: '0.25rem' }}
                            />
                            <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                              I understand that this cancellation is final and I have reviewed my refund eligibility above.
                              {refundEligibility?.type === 'none' && ' I understand that I am not eligible for a refund.'}
                            </span>
                          </label>
                        </div>

                        {(userCancelError || verificationError) && (
                          <p style={{ color: '#dc2626', margin: '0 0 1rem 0' }}>{userCancelError || verificationError}</p>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setShowUserCancelModal(false);
                              setUserCancelReason('');
                              setUserCancelAcknowledged(false);
                              setUserCancelError(null);
                              resetVerificationState();
                            }}
                            disabled={isSendingCode}
                            style={{
                              padding: '0.75rem 1.5rem',
                              borderRadius: '6px',
                              border: '1px solid #d1d5db',
                              backgroundColor: 'white',
                              cursor: 'pointer',
                              fontWeight: '500',
                            }}
                          >
                            Keep Registration
                          </button>
                          <button
                            type="button"
                            onClick={handleUserCancel}
                            disabled={isSendingCode || !userCancelReason.trim() || !userCancelAcknowledged}
                            style={{
                              padding: '0.75rem 1.5rem',
                              borderRadius: '6px',
                              border: 'none',
                              backgroundColor: (isSendingCode || !userCancelReason.trim() || !userCancelAcknowledged) ? '#9ca3af' : '#dc2626',
                              color: 'white',
                              cursor: (isSendingCode || !userCancelReason.trim() || !userCancelAcknowledged) ? 'not-allowed' : 'pointer',
                              fontWeight: '500',
                            }}
                          >
                            {isSendingCode ? 'Sending Code...' : 'Continue'}
                          </button>
                        </div>
                      </>
                    )}

                    {/* Step 2: Verification Code Entry */}
                    {verificationStep === 'code' && (
                      <>
                        <div style={{
                          backgroundColor: '#dbeafe',
                          border: '1px solid #3b82f6',
                          borderRadius: '8px',
                          padding: '1rem',
                          marginBottom: '1.5rem',
                        }}>
                          <p style={{ margin: 0, fontSize: '0.875rem', color: '#1e40af' }}>
                            A verification code has been sent to your registered email address.
                            Please enter it below to confirm your cancellation.
                          </p>
                          {codeExpiryMinutes && (
                            <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#1e40af' }}>
                              This code will expire in {codeExpiryMinutes} minutes.
                            </p>
                          )}
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                            Verification Code: <span style={{ color: '#dc2626' }}>*</span>
                          </label>
                          <input
                            type="text"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="Enter 6-digit code"
                            maxLength={6}
                            style={{
                              width: '100%',
                              padding: '1rem',
                              borderRadius: '6px',
                              border: '1px solid #d1d5db',
                              fontSize: '1.5rem',
                              textAlign: 'center',
                              letterSpacing: '0.5rem',
                              fontFamily: 'monospace',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>

                        {(userCancelError || verificationError) && (
                          <p style={{ color: '#dc2626', margin: '0 0 1rem 0' }}>{userCancelError || verificationError}</p>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => {
                              resetVerificationState();
                            }}
                            disabled={isVerifying || isUserCancelling}
                            style={{
                              padding: '0.75rem 1.5rem',
                              borderRadius: '6px',
                              border: '1px solid #d1d5db',
                              backgroundColor: 'white',
                              cursor: 'pointer',
                              fontWeight: '500',
                            }}
                          >
                            Back
                          </button>
                          <button
                            type="button"
                            onClick={handleUserCancel}
                            disabled={isVerifying || isUserCancelling || verificationCode.length !== 6}
                            style={{
                              padding: '0.75rem 1.5rem',
                              borderRadius: '6px',
                              border: 'none',
                              backgroundColor: (isVerifying || isUserCancelling || verificationCode.length !== 6) ? '#9ca3af' : '#dc2626',
                              color: 'white',
                              cursor: (isVerifying || isUserCancelling || verificationCode.length !== 6) ? 'not-allowed' : 'pointer',
                              fontWeight: '500',
                            }}
                          >
                            {isVerifying ? 'Verifying...' : isUserCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                          </button>
                        </div>

                        <p style={{ margin: '1rem 0 0', fontSize: '0.875rem', color: '#6b7280', textAlign: 'center' }}>
                          Didn&apos;t receive the code?{' '}
                          <button
                            type="button"
                            onClick={() => handleSendVerificationCode(VERIFICATION_ACTION.CANCEL)}
                            disabled={isSendingCode}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#3b82f6',
                              cursor: 'pointer',
                              textDecoration: 'underline',
                              padding: 0,
                              fontSize: '0.875rem',
                            }}
                          >
                            {isSendingCode ? 'Sending...' : 'Resend code'}
                          </button>
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Transfer Registration Modal */}
              {showTransferModal && (
                <div
                  onClick={() => setShowTransferModal(false)}
                  style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000,
                  padding: '1rem',
                }}>
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '2rem',
                    maxWidth: '500px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                  }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#3b82f6' }}>Transfer Registration</h3>

                    {/* Step 1: Transfer Form */}
                    {verificationStep === 'form' && (
                      <>
                        <p style={{ margin: '0 0 1rem 0', color: '#6b7280' }}>
                          Enter the details of the person you want to transfer this registration to.
                          They will receive your spot, payment status, and workshop selections.
                        </p>

                        {/* Transfer Form */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
                                First Name <span style={{ color: '#dc2626' }}>*</span>
                              </label>
                              <input
                                type="text"
                                value={transferData.firstName}
                                onChange={(e) => setTransferData((prev) => ({ ...prev, firstName: e.target.value }))}
                                placeholder="First name"
                                style={{
                                  width: '100%',
                                  padding: '0.5rem',
                                  borderRadius: '6px',
                                  border: '1px solid #d1d5db',
                                  fontSize: '0.875rem',
                                  boxSizing: 'border-box',
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
                                Last Name <span style={{ color: '#dc2626' }}>*</span>
                              </label>
                              <input
                                type="text"
                                value={transferData.lastName}
                                onChange={(e) => setTransferData((prev) => ({ ...prev, lastName: e.target.value }))}
                                placeholder="Last name"
                                style={{
                                  width: '100%',
                                  padding: '0.5rem',
                                  borderRadius: '6px',
                                  border: '1px solid #d1d5db',
                                  fontSize: '0.875rem',
                                  boxSizing: 'border-box',
                                }}
                              />
                            </div>
                          </div>

                          <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
                              Middle Name
                            </label>
                            <input
                              type="text"
                              value={transferData.middleName}
                              onChange={(e) => setTransferData((prev) => ({ ...prev, middleName: e.target.value }))}
                              placeholder="Middle name (optional)"
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: '6px',
                                border: '1px solid #d1d5db',
                                fontSize: '0.875rem',
                                boxSizing: 'border-box',
                              }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
                              Email <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <input
                              type="email"
                              value={transferData.email}
                              onChange={(e) => setTransferData((prev) => ({ ...prev, email: e.target.value }))}
                              placeholder="email@example.com"
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: '6px',
                                border: '1px solid #d1d5db',
                                fontSize: '0.875rem',
                                boxSizing: 'border-box',
                              }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
                              Cellphone <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <input
                              type="tel"
                              value={transferData.cellphone}
                              onChange={(e) => setTransferData((prev) => ({ ...prev, cellphone: e.target.value }))}
                              placeholder="09XX XXX XXXX"
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: '6px',
                                border: '1px solid #d1d5db',
                                fontSize: '0.875rem',
                                boxSizing: 'border-box',
                              }}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
                              Ministry Role
                            </label>
                            <select
                              value={transferData.ministryRole}
                              onChange={(e) => setTransferData((prev) => ({ ...prev, ministryRole: e.target.value }))}
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: '6px',
                                border: '1px solid #d1d5db',
                                fontSize: '0.875rem',
                                boxSizing: 'border-box',
                                backgroundColor: '#fff',
                              }}
                            >
                              <option value="">Select role</option>
                              {MINISTRY_ROLES.map((role) => (
                                <option key={role} value={role}>{role}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500', fontSize: '0.875rem' }}>
                              Reason for Transfer
                            </label>
                            <textarea
                              value={transferReason}
                              onChange={(e) => setTransferReason(e.target.value)}
                              placeholder="Optional: Why are you transferring this registration?"
                              style={{
                                width: '100%',
                                minHeight: '60px',
                                padding: '0.5rem',
                                borderRadius: '6px',
                                border: '1px solid #d1d5db',
                                fontSize: '0.875rem',
                                resize: 'vertical',
                                boxSizing: 'border-box',
                              }}
                            />
                          </div>
                        </div>

                        {(transferError || verificationError) && (
                          <p style={{ color: '#dc2626', margin: '1rem 0 0 0', fontSize: '0.875rem' }}>{transferError || verificationError}</p>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setShowTransferModal(false);
                              setTransferData({
                                firstName: '',
                                lastName: '',
                                middleName: '',
                                email: '',
                                cellphone: '',
                                ministryRole: '',
                              });
                              setTransferReason('');
                              setTransferError(null);
                              resetVerificationState();
                            }}
                            disabled={isSendingCode}
                            style={{
                              padding: '0.75rem 1.5rem',
                              borderRadius: '6px',
                              border: '1px solid #d1d5db',
                              backgroundColor: 'white',
                              cursor: 'pointer',
                              fontWeight: '500',
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleTransfer}
                            disabled={isSendingCode || !transferData.firstName || !transferData.lastName ||
                              !transferData.email || !transferData.cellphone}
                            style={{
                              padding: '0.75rem 1.5rem',
                              borderRadius: '6px',
                              border: 'none',
                              backgroundColor: (isSendingCode || !transferData.firstName || !transferData.lastName ||
                                !transferData.email || !transferData.cellphone) ? '#9ca3af' : '#3b82f6',
                              color: 'white',
                              cursor: (isSendingCode || !transferData.firstName || !transferData.lastName ||
                                !transferData.email || !transferData.cellphone) ? 'not-allowed' : 'pointer',
                              fontWeight: '500',
                            }}
                          >
                            {isSendingCode ? 'Sending Code...' : 'Continue'}
                          </button>
                        </div>
                      </>
                    )}

                    {/* Step 2: Verification Code Entry */}
                    {verificationStep === 'code' && (
                      <>
                        <div style={{
                          backgroundColor: '#dbeafe',
                          border: '1px solid #3b82f6',
                          borderRadius: '8px',
                          padding: '1rem',
                          marginBottom: '1.5rem',
                        }}>
                          <p style={{ margin: 0, fontSize: '0.875rem', color: '#1e40af' }}>
                            A verification code has been sent to your registered email address.
                            Please enter it below to confirm the transfer.
                          </p>
                          {codeExpiryMinutes && (
                            <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#1e40af' }}>
                              This code will expire in {codeExpiryMinutes} minutes.
                            </p>
                          )}
                        </div>

                        <div style={{
                          backgroundColor: '#f0fdf4',
                          border: '1px solid #22c55e',
                          borderRadius: '8px',
                          padding: '1rem',
                          marginBottom: '1.5rem',
                        }}>
                          <p style={{ margin: 0, fontSize: '0.875rem', color: '#166534' }}>
                            <strong>Transferring to:</strong> {transferData.firstName} {transferData.lastName} ({transferData.email})
                          </p>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                            Verification Code: <span style={{ color: '#dc2626' }}>*</span>
                          </label>
                          <input
                            type="text"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="Enter 6-digit code"
                            maxLength={6}
                            style={{
                              width: '100%',
                              padding: '1rem',
                              borderRadius: '6px',
                              border: '1px solid #d1d5db',
                              fontSize: '1.5rem',
                              textAlign: 'center',
                              letterSpacing: '0.5rem',
                              fontFamily: 'monospace',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>

                        {(transferError || verificationError) && (
                          <p style={{ color: '#dc2626', margin: '0 0 1rem 0' }}>{transferError || verificationError}</p>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => {
                              resetVerificationState();
                            }}
                            disabled={isVerifying || isTransferring}
                            style={{
                              padding: '0.75rem 1.5rem',
                              borderRadius: '6px',
                              border: '1px solid #d1d5db',
                              backgroundColor: 'white',
                              cursor: 'pointer',
                              fontWeight: '500',
                            }}
                          >
                            Back
                          </button>
                          <button
                            type="button"
                            onClick={handleTransfer}
                            disabled={isVerifying || isTransferring || verificationCode.length !== 6}
                            style={{
                              padding: '0.75rem 1.5rem',
                              borderRadius: '6px',
                              border: 'none',
                              backgroundColor: (isVerifying || isTransferring || verificationCode.length !== 6) ? '#9ca3af' : '#3b82f6',
                              color: 'white',
                              cursor: (isVerifying || isTransferring || verificationCode.length !== 6) ? 'not-allowed' : 'pointer',
                              fontWeight: '500',
                            }}
                          >
                            {isVerifying ? 'Verifying...' : isTransferring ? 'Transferring...' : 'Confirm Transfer'}
                          </button>
                        </div>

                        <p style={{ margin: '1rem 0 0', fontSize: '0.875rem', color: '#6b7280', textAlign: 'center' }}>
                          Didn&apos;t receive the code?{' '}
                          <button
                            type="button"
                            onClick={() => handleSendVerificationCode(VERIFICATION_ACTION.TRANSFER)}
                            disabled={isSendingCode}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#3b82f6',
                              cursor: 'pointer',
                              textDecoration: 'underline',
                              padding: 0,
                              fontSize: '0.875rem',
                            }}
                          >
                            {isSendingCode ? 'Sending...' : 'Resend code'}
                          </button>
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Registration Header */}
              <div className={styles.regHeader}>
                <div className={styles.regIdSection}>
                  <span className={styles.regIdLabel}>Registration ID</span>
                  <span className={styles.regIdValue}>{registration.registrationId}</span>
                  <span className={styles.shortCode}>
                    Quick Code: <strong>{registration.shortCode}</strong>
                  </span>
                </div>

                {/* QR Code for confirmed registrations */}
                {isConfirmed && registration.qrCodeData && (
                  <div className={styles.qrCodeSection}>
                    <QRCodeSVG
                      value={registration.qrCodeData}
                      size={120}
                      level="M"
                      includeMargin={false}
                    />
                    <span className={styles.qrHint}>Scan at check-in</span>
                  </div>
                )}
              </div>

              {/* Church Information */}
              <div className={styles.infoSection}>
                <h3>Church Information</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Church</span>
                    <span className={styles.infoValue}>{registration.church?.name || '—'}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Location</span>
                    <span className={styles.infoValue}>
                      {registration.church?.city && registration.church?.province
                        ? `${registration.church.city}, ${registration.church.province}`
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Primary Attendee */}
              <div className={styles.infoSection}>
                <h3>Primary Contact</h3>
                <div className={`${styles.attendeeCard} ${getCheckInInfo(0).checkedIn ? styles.attendeeCheckedIn : ''}`}>
                  <div className={styles.attendeeBadge}>Primary</div>
                  <div className={styles.attendeeInfo}>
                    <p className={styles.attendeeName}>
                      {maskName(registration.primaryAttendee?.lastName)}, {maskName(registration.primaryAttendee?.firstName)} {maskName(registration.primaryAttendee?.middleName)}
                    </p>
                    <p className={styles.attendeeContact}>
                      {maskEmail(registration.primaryAttendee?.email)} | {maskPhone(registration.primaryAttendee?.cellphone)}
                    </p>
                    <p className={styles.attendeeMeta}>
                      {registration.primaryAttendee?.ministryRole} | {REGISTRATION_CATEGORY_LABELS[registration.primaryAttendee?.category]}
                    </p>
                    {isConfirmed && getCheckInInfo(0).checkedIn && (
                      <p className={styles.attendeeCheckInStatus}>
                        ✓ Checked in at {formatCheckInTime(getCheckInInfo(0).checkedInAt)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Attendees */}
              {registration.additionalAttendees?.length > 0 && (
                <div className={styles.infoSection}>
                  <h3>Additional Attendees ({registration.additionalAttendees.length})</h3>
                  {registration.additionalAttendees.map((attendee, index) => {
                    const attendeeIndex = index + 1;
                    const checkInInfo = getCheckInInfo(attendeeIndex);
                    return (
                      <div key={index} className={`${styles.attendeeCard} ${checkInInfo.checkedIn ? styles.attendeeCheckedIn : ''}`}>
                        <div className={styles.attendeeNumber}>#{index + 2}</div>
                        <div className={styles.attendeeInfo}>
                          <p className={styles.attendeeName}>
                            {maskName(attendee.lastName)}, {maskName(attendee.firstName)} {maskName(attendee.middleName)}
                          </p>
                          <p className={styles.attendeeContact}>
                            {attendee.email ? maskEmail(attendee.email) : '(No email)'} | {maskPhone(attendee.cellphone)}
                          </p>
                          <p className={styles.attendeeMeta}>
                            {attendee.ministryRole} | {REGISTRATION_CATEGORY_LABELS[attendee.category]}
                          </p>
                          {isConfirmed && checkInInfo.checkedIn && (
                            <p className={styles.attendeeCheckInStatus}>
                              ✓ Checked in at {formatCheckInTime(checkInInfo.checkedInAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Payment Information */}
              <div className={styles.infoSection}>
                <h3>Payment Information</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Total Amount</span>
                    <span className={styles.infoValue}>{formatPrice(registration.totalAmount)}</span>
                  </div>
                  {registration.payment?.amountPaid !== undefined && registration.payment.amountPaid > 0 && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Amount Paid</span>
                      <span className={styles.infoValue}>{formatPrice(registration.payment.amountPaid)}</span>
                    </div>
                  )}
                  {registration.payment?.balance !== undefined && registration.payment.balance > 0 && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Balance Owed</span>
                      <span className={`${styles.infoValue} ${styles.balanceOwed}`}>
                        {formatPrice(registration.payment.balance)}
                      </span>
                    </div>
                  )}
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Payment Status</span>
                    <span className={`${styles.infoValue} ${styles[paymentStatusConfig.className]}`}>
                      {paymentStatusConfig.label}
                    </span>
                  </div>
                  {registration.payment?.verifiedAt && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Verified On</span>
                      <span className={styles.infoValue}>
                        {formatDate(registration.payment.verifiedAt)}
                      </span>
                    </div>
                  )}
                  {isConfirmed && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Check-In Status</span>
                      <span className={styles.infoValue}>
                        {checkedInCount > 0
                          ? `${checkedInCount} of ${totalAttendees} Checked In`
                          : 'Not Checked In'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Pending Payment Instructions */}
                {registration.status === REGISTRATION_STATUS.PENDING_PAYMENT && (
                  <div className={styles.pendingNote}>
                    <h4>Action Required</h4>

                    {/* Show rejection reason if payment was rejected */}
                    {registration.payment?.rejectionReason && (
                      <div className={styles.rejectionNotice}>
                        <strong>Payment Needs Attention:</strong>
                        <p>{registration.payment.rejectionReason}</p>
                      </div>
                    )}

                    {/* Show balance information if partial payment was made */}
                    {registration.payment?.balance && registration.payment.balance > 0 ? (
                      <p>
                        You have a balance of <strong>{formatPrice(registration.payment.balance)}</strong> remaining.
                        Please upload proof of full payment to confirm your registration.
                      </p>
                    ) : (
                      <p>
                        Please complete your payment of <strong>{formatPrice(registration.totalAmount)}</strong> and upload proof of payment to confirm your registration.
                      </p>
                    )}

                    {/* File upload section */}
                    <div className={styles.uploadSection}>
                      <label className={styles.uploadLabel}>
                        Upload Payment Receipt/Screenshot
                      </label>

                      {/* Upload options */}
                      <div className={styles.uploadOptions}>
                        <div className={styles.uploadOption}>
                          <input
                            id="payment-proof-file"
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            onChange={handleFileSelect}
                            disabled={isUploading}
                            className={styles.fileInputHidden}
                          />
                          <label
                            htmlFor="payment-proof-file"
                            className={`${styles.uploadOptionButton} ${isUploading ? styles.disabled : ''}`}
                          >
                            <span className={styles.uploadIcon}>
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                                <polyline points="13 2 13 9 20 9" />
                              </svg>
                            </span>
                            <span>Upload File</span>
                          </label>
                        </div>

                        <div className={styles.uploadOption}>
                          <input
                            id="payment-proof-camera"
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleFileSelect}
                            disabled={isUploading}
                            className={styles.fileInputHidden}
                          />
                          <label
                            htmlFor="payment-proof-camera"
                            className={`${styles.uploadOptionButton} ${isUploading ? styles.disabled : ''}`}
                          >
                            <span className={styles.uploadIcon}>
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                <circle cx="12" cy="13" r="4" />
                              </svg>
                            </span>
                            <span>Take Photo</span>
                          </label>
                        </div>
                      </div>

                      {paymentFile && (
                        <p className={styles.selectedFile}>
                          Selected: {paymentFile.name}
                        </p>
                      )}
                      <button
                        onClick={handleUploadPayment}
                        disabled={!paymentFile || isUploading}
                        className={styles.uploadButton}
                      >
                        {isUploading
                          ? `Uploading ${uploadProgress}%...`
                          : 'Upload Payment Proof'}
                      </button>
                      {uploadError && (
                        <p className={styles.uploadError}>{uploadError}</p>
                      )}
                      {uploadSuccess && (
                        <p className={styles.uploadSuccess}>
                          Payment proof uploaded successfully! Your registration status has been updated to "Payment Under Review".
                        </p>
                      )}
                      <p className={styles.fileHint}>
                        Accepted formats: JPG, PNG, GIF, WebP (Max 5MB)
                      </p>
                    </div>

                    {registration.paymentDeadline && (
                      <p className={styles.deadline}>
                        Payment deadline: <strong>{formatDate(registration.paymentDeadline)}</strong>
                      </p>
                    )}
                  </div>
                )}

                {/* Verification Note */}
                {registration.status === REGISTRATION_STATUS.PENDING_VERIFICATION && (
                  <div className={styles.verificationNote}>
                    <h4>Payment Under Review</h4>
                    <p>
                      We have received your payment proof and it is being verified.
                      You will receive a confirmation email once your registration is confirmed.
                    </p>
                  </div>
                )}

                {/* User Cancel/Transfer Registration Options - for confirmed/pending statuses */}
                {(registration.status === REGISTRATION_STATUS.PENDING_PAYMENT ||
                  registration.status === REGISTRATION_STATUS.PENDING_VERIFICATION ||
                  registration.status === REGISTRATION_STATUS.CONFIRMED) &&
                  (canUserCancel || canTransfer) && (
                  <div style={{
                    marginTop: '1.5rem',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid #e5e7eb',
                  }}>
                    <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
                      Need to make changes to your registration?
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      {canTransfer && (
                        <button
                          type="button"
                          onClick={() => setShowTransferModal(true)}
                          style={{
                            backgroundColor: 'transparent',
                            border: '1px solid #3b82f6',
                            color: '#3b82f6',
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                          }}
                        >
                          Transfer Registration
                        </button>
                      )}
                      {canUserCancel && (
                        <button
                          type="button"
                          onClick={() => setShowUserCancelModal(true)}
                          style={{
                            backgroundColor: 'transparent',
                            border: '1px solid #dc2626',
                            color: '#dc2626',
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                          }}
                        >
                          Cancel Registration
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Registration Details */}
              <div className={styles.infoSection}>
                <h3>Registration Details</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Registered On</span>
                    <span className={styles.infoValue}>{formatDate(registration.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Event Details */}
              {settings && (
                <div className={styles.eventDetails}>
                  <h3>Event Information</h3>
                  <p><strong>Event:</strong> {settings.title}</p>
                  <p><strong>Theme:</strong> {settings.theme}</p>
                  <p>
                    <strong>Date:</strong> {new Date(settings.startDate).toLocaleDateString('en-PH', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p><strong>Venue:</strong> {settings.venue?.name}</p>
                  <p><strong>Address:</strong> {settings.venue?.address}</p>
                </div>
              )}

              {/* Confirmed Registration - Download Section with Per-Attendee QR Codes */}
              {isConfirmed && (
                <div className={styles.downloadSection}>
                  <h3>Your Tickets</h3>
                  <p>
                    Each attendee has their own unique QR code for check-in.
                    A confirmation email with tickets has been sent to {maskEmail(registration.primaryAttendee?.email)}.
                  </p>

                  {/* Primary Attendee QR Code */}
                  <div className={styles.attendeeTicket}>
                    <div className={`${styles.ticketQR} ${getCheckInInfo(0).checkedIn ? styles.ticketUsed : ''}`}>
                      <QRCodeSVG
                        value={`${registration.registrationId}-0`}
                        size={160}
                        level="M"
                        includeMargin
                      />
                      <p className={styles.qrAttendeeName}>
                        {maskName(registration.primaryAttendee?.firstName)} {maskName(registration.primaryAttendee?.lastName)}
                      </p>
                      <p className={styles.qrAttendeeLabel}>Primary</p>
                      {getCheckInInfo(0).checkedIn && (
                        <p className={styles.qrCheckedIn}>✓ Checked In</p>
                      )}
                    </div>
                  </div>

                  {/* Additional Attendees QR Codes */}
                  {registration.additionalAttendees?.length > 0 && (
                    <div className={styles.additionalTickets}>
                      {registration.additionalAttendees.map((attendee, index) => {
                        const attendeeIndex = index + 1;
                        const checkInInfo = getCheckInInfo(attendeeIndex);
                        return (
                          <div key={index} className={styles.attendeeTicket}>
                            <div className={`${styles.ticketQR} ${checkInInfo.checkedIn ? styles.ticketUsed : ''}`}>
                              <QRCodeSVG
                                value={`${registration.registrationId}-${attendeeIndex}`}
                                size={160}
                                level="M"
                                includeMargin
                              />
                              <p className={styles.qrAttendeeName}>
                                {maskName(attendee.firstName)} {maskName(attendee.lastName)}
                              </p>
                              <p className={styles.qrAttendeeLabel}>Guest {index + 1}</p>
                              {checkInInfo.checkedIn && (
                                <p className={styles.qrCheckedIn}>✓ Checked In</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <p className={styles.qrRegId}>Registration: {registration.registrationId}</p>
                </div>
              )}
            </div>
          )}

          {/* Not Found - No Results */}
          {hasSearched && !isLoading && !registration && !error && (
            <div className={styles.notFound}>
              <h2>Registration Not Found</h2>
              <p>We couldn&apos;t find a registration matching your search.</p>
              <p>
                Please double-check your information or <a href={ROUTES.CONTACT}>contact us</a> for assistance.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default RegistrationStatusPage;
