/**
 * AttendeeCard Component
 * Displays attendee verification details and check-in action button.
 *
 * @module components/checkin/AttendeeCard
 */

import { REGISTRATION_STATUS } from '../../constants';
import styles from './AttendeeCard.module.css';

/**
 * AttendeeCard Component
 *
 * @param {Object} props - Component props
 * @param {Object} props.registration - Registration data
 * @param {Function} props.onCheckIn - Callback to perform check-in
 * @param {Function} props.onCancel - Callback to cancel/close the card
 * @param {boolean} [props.isLoading=false] - Whether check-in is in progress
 * @param {Object} [props.error=null] - Check-in error object
 * @returns {JSX.Element} The attendee card component
 */
function AttendeeCard({ registration, onCheckIn, onCancel, isLoading = false, error = null }) {
  if (!registration) {
    return null;
  }

  const { primaryAttendee, additionalAttendees = [], church, status, checkedIn, checkedInAt, shortCode } = registration;

  /**
   * Formats attendee name
   */
  const formatName = (attendee) => {
    if (!attendee) return 'Unknown';
    return `${attendee.firstName || ''} ${attendee.lastName || ''}`.trim() || 'Unknown';
  };

  /**
   * Formats check-in time
   */
  const formatCheckInTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Gets status information
   */
  const getStatusInfo = () => {
    if (checkedIn) {
      return {
        label: 'Already Checked In',
        class: styles.statusCheckedIn,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        ),
        canCheckIn: false,
      };
    }
    if (status === REGISTRATION_STATUS.CANCELLED) {
      return {
        label: 'Cancelled',
        class: styles.statusCancelled,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        ),
        canCheckIn: false,
      };
    }
    if (status !== REGISTRATION_STATUS.CONFIRMED) {
      return {
        label: 'Payment Pending',
        class: styles.statusPending,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        ),
        canCheckIn: false,
      };
    }
    return {
      label: 'Ready to Check In',
      class: styles.statusReady,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      canCheckIn: true,
    };
  };

  const statusInfo = getStatusInfo();
  const totalAttendees = 1 + additionalAttendees.length;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={`${styles.header} ${statusInfo.class}`}>
        <div className={styles.statusIcon}>{statusInfo.icon}</div>
        <div className={styles.statusText}>
          <span className={styles.statusLabel}>{statusInfo.label}</span>
          {checkedIn && checkedInAt && (
            <span className={styles.checkedInTime}>at {formatCheckInTime(checkedInAt)}</span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        {/* Primary Attendee */}
        <div className={styles.primaryAttendee}>
          <div className={styles.avatar}>
            {(primaryAttendee?.firstName?.[0] || 'A').toUpperCase()}
          </div>
          <div className={styles.attendeeInfo}>
            <h3 className={styles.attendeeName}>{formatName(primaryAttendee)}</h3>
            <p className={styles.attendeeEmail}>{primaryAttendee?.email || 'No email'}</p>
            {primaryAttendee?.cellphone && (
              <p className={styles.attendeePhone}>{primaryAttendee.cellphone}</p>
            )}
          </div>
          {shortCode && (
            <div className={styles.shortCode}>{shortCode}</div>
          )}
        </div>

        {/* Additional Info */}
        <div className={styles.details}>
          {church?.name && (
            <div className={styles.detailRow}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 2l-6 10.5L6 2" />
                <path d="M12 12.5v9.5" />
                <path d="M5 22h14" />
                <path d="M12 8l4 4.5" />
                <path d="M12 8l-4 4.5" />
              </svg>
              <span>{church.name}</span>
            </div>
          )}
          <div className={styles.detailRow}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>
              {totalAttendees} attendee{totalAttendees !== 1 ? 's' : ''}
              {additionalAttendees.length > 0 && (
                <span className={styles.guestList}>
                  {' '}({additionalAttendees.map(a => formatName(a)).join(', ')})
                </span>
              )}
            </span>
          </div>
          <div className={styles.detailRow}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
            <span className={styles.registrationId}>{registration.registrationId || registration.id}</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className={styles.error}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error.message || 'An error occurred'}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button
          className={styles.cancelButton}
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </button>
        {statusInfo.canCheckIn && (
          <button
            className={styles.checkInButton}
            onClick={onCheckIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className={styles.buttonSpinner}></span>
                Checking In...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Check In ({totalAttendees})
              </>
            )}
          </button>
        )}
        {!statusInfo.canCheckIn && checkedIn && (
          <div className={styles.alreadyCheckedIn}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Already checked in
          </div>
        )}
      </div>
    </div>
  );
}

export default AttendeeCard;
