/**
 * AttendeeCard Component
 * Displays attendee verification details and check-in action button.
 * Supports per-attendee check-in with individual status tracking.
 *
 * @module components/checkin/AttendeeCard
 */

import { REGISTRATION_STATUS } from '../../constants';
import {
  getAttendeeCheckInStatus,
  getCheckedInAttendeeCount,
  areAllAttendeesCheckedIn,
  getAttendeeByIndex,
} from '../../services';
import styles from './AttendeeCard.module.css';

/**
 * AttendeeCard Component
 *
 * @param {Object} props - Component props
 * @param {Object} props.registration - Registration data
 * @param {Function} props.onCheckIn - Callback to perform check-in (receives attendeeIndex or null for all)
 * @param {Function} props.onCancel - Callback to cancel/close the card
 * @param {boolean} [props.isLoading=false] - Whether check-in is in progress
 * @param {Object} [props.error=null] - Check-in error object
 * @param {number|null} [props.selectedAttendeeIndex=null] - Index of specific attendee from QR scan
 * @returns {JSX.Element} The attendee card component
 */
function AttendeeCard({ registration, onCheckIn, onCancel, isLoading = false, error = null, selectedAttendeeIndex = null }) {
  if (!registration) {
    return null;
  }

  const { primaryAttendee, additionalAttendees = [], church, status, shortCode } = registration;

  // Calculate total attendees upfront (needed by getStatusInfo)
  const totalAttendees = 1 + additionalAttendees.length;
  const checkedInCount = getCheckedInAttendeeCount(registration);

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
   * Gets overall status information for the registration
   */
  const getStatusInfo = () => {
    const allCheckedIn = areAllAttendeesCheckedIn(registration);
    const checkedInCount = getCheckedInAttendeeCount(registration);

    if (allCheckedIn) {
      return {
        label: 'All Checked In',
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
    if (checkedInCount > 0) {
      return {
        label: `${checkedInCount} of ${totalAttendees} Checked In`,
        class: styles.statusPartial,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        ),
        canCheckIn: true,
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

  /**
   * Gets check-in status for a specific attendee
   */
  const getAttendeeStatus = (index) => {
    const checkInStatus = getAttendeeCheckInStatus(registration, index);
    return checkInStatus?.checkedIn || false;
  };

  /**
   * Formats check-in time for a specific attendee
   */
  const formatAttendeeCheckInTime = (index) => {
    const checkInStatus = getAttendeeCheckInStatus(registration, index);
    if (!checkInStatus?.checkedIn || !checkInStatus?.checkedInAt) {
      return '';
    }
    const timestamp = checkInStatus.checkedInAt?.toDate?.() || checkInStatus.checkedInAt;
    return new Date(timestamp).toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Handles check-in click for a specific attendee or all
   */
  const handleCheckInClick = (attendeeIndex = null) => {
    if (onCheckIn) {
      onCheckIn(attendeeIndex);
    }
  };

  const statusInfo = getStatusInfo();
  const pendingCount = totalAttendees - checkedInCount;

  // Determine if we're checking in a specific attendee from QR
  const targetAttendee = typeof selectedAttendeeIndex === 'number'
    ? getAttendeeByIndex(registration, selectedAttendeeIndex)
    : null;
  const targetAttendeeCheckedIn = typeof selectedAttendeeIndex === 'number'
    ? getAttendeeStatus(selectedAttendeeIndex)
    : false;

  // Get the latest check-in time for header display
  const lastCheckInTime = registration.checkedInAt
    ? formatCheckInTime(registration.checkedInAt)
    : null;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={`${styles.header} ${statusInfo.class}`}>
        <div className={styles.statusIcon}>{statusInfo.icon}</div>
        <div className={styles.statusText}>
          <span className={styles.statusLabel}>{statusInfo.label}</span>
          {checkedInCount > 0 && lastCheckInTime && (
            <span className={styles.checkedInTime}>last at {lastCheckInTime}</span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        {/* Target Attendee Info (when scanned specific QR) */}
        {targetAttendee && (
          <div className={styles.targetAttendeeBox}>
            <div className={styles.targetAttendeeLabel}>
              {targetAttendeeCheckedIn ? 'Already Checked In' : 'Checking In'}
            </div>
            <div className={styles.targetAttendeeName}>
              {formatName(targetAttendee)}
            </div>
            {targetAttendeeCheckedIn && (
              <div className={styles.targetAttendeeTime}>
                at {formatAttendeeCheckInTime(selectedAttendeeIndex)}
              </div>
            )}
          </div>
        )}

        {/* Registration Info */}
        <div className={styles.registrationInfo}>
          {shortCode && (
            <div className={styles.shortCode}>{shortCode}</div>
          )}
          <div className={styles.registrationId}>{registration.registrationId || registration.id}</div>
          {church?.name && (
            <div className={styles.churchName}>{church.name}</div>
          )}
        </div>

        {/* Attendee List with Individual Status */}
        <div className={styles.attendeeList}>
          <div className={styles.attendeeListHeader}>
            <span>Attendees ({checkedInCount}/{totalAttendees} checked in)</span>
          </div>

          {/* Primary Attendee */}
          <div className={`${styles.attendeeRow} ${getAttendeeStatus(0) ? styles.checkedIn : ''} ${selectedAttendeeIndex === 0 ? styles.selected : ''}`}>
            <div className={styles.attendeeRowLeft}>
              <div className={styles.avatar}>
                {(primaryAttendee?.firstName?.[0] || 'A').toUpperCase()}
              </div>
              <div className={styles.attendeeRowInfo}>
                <span className={styles.attendeeRowName}>{formatName(primaryAttendee)}</span>
                <span className={styles.attendeeRowLabel}>Primary</span>
              </div>
            </div>
            <div className={styles.attendeeRowRight}>
              {getAttendeeStatus(0) ? (
                <span className={styles.checkedInBadge}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {formatAttendeeCheckInTime(0)}
                </span>
              ) : (
                statusInfo.canCheckIn && typeof selectedAttendeeIndex !== 'number' && (
                  <button
                    className={styles.checkInSingleBtn}
                    onClick={() => handleCheckInClick(0)}
                    disabled={isLoading}
                  >
                    Check In
                  </button>
                )
              )}
            </div>
          </div>

          {/* Additional Attendees */}
          {additionalAttendees.map((attendee, index) => {
            const attendeeIndex = index + 1;
            const isCheckedIn = getAttendeeStatus(attendeeIndex);
            return (
              <div key={attendeeIndex} className={`${styles.attendeeRow} ${isCheckedIn ? styles.checkedIn : ''} ${selectedAttendeeIndex === attendeeIndex ? styles.selected : ''}`}>
                <div className={styles.attendeeRowLeft}>
                  <div className={styles.avatar}>
                    {(attendee?.firstName?.[0] || 'G').toUpperCase()}
                  </div>
                  <div className={styles.attendeeRowInfo}>
                    <span className={styles.attendeeRowName}>{formatName(attendee)}</span>
                    <span className={styles.attendeeRowLabel}>Guest {index + 1}</span>
                  </div>
                </div>
                <div className={styles.attendeeRowRight}>
                  {isCheckedIn ? (
                    <span className={styles.checkedInBadge}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {formatAttendeeCheckInTime(attendeeIndex)}
                    </span>
                  ) : (
                    statusInfo.canCheckIn && typeof selectedAttendeeIndex !== 'number' && (
                      <button
                        className={styles.checkInSingleBtn}
                        onClick={() => handleCheckInClick(attendeeIndex)}
                        disabled={isLoading}
                      >
                        Check In
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
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

        {/* Check in specific attendee from QR scan */}
        {typeof selectedAttendeeIndex === 'number' && !targetAttendeeCheckedIn && statusInfo.canCheckIn && (
          <button
            className={styles.checkInButton}
            onClick={() => handleCheckInClick(selectedAttendeeIndex)}
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
                Check In {formatName(targetAttendee)}
              </>
            )}
          </button>
        )}

        {/* Already checked in message for specific attendee */}
        {typeof selectedAttendeeIndex === 'number' && targetAttendeeCheckedIn && (
          <div className={styles.alreadyCheckedIn}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            {formatName(targetAttendee)} already checked in
          </div>
        )}

        {/* Check in all remaining attendees (when no specific attendee selected) */}
        {typeof selectedAttendeeIndex !== 'number' && statusInfo.canCheckIn && pendingCount > 0 && (
          <button
            className={styles.checkInButton}
            onClick={() => handleCheckInClick(null)}
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
                Check In All ({pendingCount} remaining)
              </>
            )}
          </button>
        )}

        {/* All checked in */}
        {!statusInfo.canCheckIn && areAllAttendeesCheckedIn(registration) && (
          <div className={styles.alreadyCheckedIn}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            All attendees checked in
          </div>
        )}
      </div>
    </div>
  );
}

export default AttendeeCard;
