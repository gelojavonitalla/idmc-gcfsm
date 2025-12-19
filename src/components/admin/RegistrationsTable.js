/**
 * RegistrationsTable Component
 * Displays a table of registrations with filtering and actions for admin management.
 *
 * @module components/admin/RegistrationsTable
 */

import PropTypes from 'prop-types';
import { REGISTRATION_STATUS } from '../../constants';
import { extractShortCode } from '../../utils';
import styles from './RegistrationsTable.module.css';

/**
 * Status badge configuration
 */
const STATUS_CONFIG = {
  [REGISTRATION_STATUS.CONFIRMED]: {
    className: 'statusConfirmed',
    label: 'Confirmed',
  },
  [REGISTRATION_STATUS.PENDING_VERIFICATION]: {
    className: 'statusPendingVerification',
    label: 'Pending Verification',
  },
  [REGISTRATION_STATUS.PENDING_PAYMENT]: {
    className: 'statusPendingPayment',
    label: 'Pending Payment',
  },
  [REGISTRATION_STATUS.CANCELLED]: {
    className: 'statusCancelled',
    label: 'Cancelled',
  },
  [REGISTRATION_STATUS.REFUNDED]: {
    className: 'statusRefunded',
    label: 'Refunded',
  },
};

/**
 * Formats a date for display
 *
 * @param {Object|string|Date} date - Date to format (Firestore timestamp or Date)
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
  return (
    registration.primaryAttendee?.email || registration.email || 'N/A'
  );
}

/**
 * Gets the total attendee count from registration
 *
 * @param {Object} registration - Registration object
 * @returns {number} Total attendee count
 */
function getAttendeeCount(registration) {
  const additionalCount = registration.additionalAttendees?.length || 0;
  return 1 + additionalCount;
}

/**
 * RegistrationsTable Component
 *
 * @param {Object} props - Component props
 * @param {Array} props.registrations - Array of registration objects
 * @param {Function} props.onViewDetails - Callback when view details is clicked
 * @param {Function} props.onUpdateStatus - Callback when status update is requested
 * @param {boolean} props.isLoading - Loading state
 * @param {boolean} props.hasMore - Whether there are more registrations to load
 * @param {Function} props.onLoadMore - Callback to load more registrations
 * @param {boolean} props.isLoadingMore - Loading more state
 * @param {boolean} props.isUpdating - Whether a status update is in progress
 * @param {number} props.totalCount - Total count of registrations
 * @param {number} props.loadedCount - Number of loaded registrations
 * @returns {JSX.Element} The registrations table
 */
function RegistrationsTable({
  registrations,
  onViewDetails,
  onUpdateStatus,
  isLoading,
  hasMore,
  onLoadMore,
  isLoadingMore,
  isUpdating,
  totalCount,
  loadedCount,
}) {
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.skeleton} />
      </div>
    );
  }

  if (registrations.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <p>No registrations found</p>
          <p className={styles.emptyHint}>
            Registrations will appear here once attendees sign up.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Code</th>
              <th>Primary Contact</th>
              <th>Attendees</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
              <th style={{ width: '100px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {registrations.map((registration) => {
              const statusConfig =
                STATUS_CONFIG[registration.status] ||
                STATUS_CONFIG[REGISTRATION_STATUS.PENDING_PAYMENT];
              const shortCode = extractShortCode(registration.id) || registration.shortCode || '—';
              const attendeeCount = getAttendeeCount(registration);
              return (
                <tr key={registration.id}>
                  <td className={styles.codeCell}>
                    <span className={styles.shortCode}>{shortCode}</span>
                  </td>
                  <td className={styles.nameCell}>
                    <div className={styles.primaryInfo}>
                      <span className={styles.primaryName}>{getAttendeeName(registration)}</span>
                      <span className={styles.primaryEmail}>{getAttendeeEmail(registration)}</span>
                    </div>
                  </td>
                  <td className={styles.attendeeCountCell}>
                    <span className={styles.attendeeCount}>{attendeeCount}</span>
                  </td>
                  <td className={styles.amountCell}>
                    {formatCurrency(registration.totalAmount)}
                  </td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${styles[statusConfig.className]}`}
                    >
                      {statusConfig.label}
                    </span>
                  </td>
                  <td className={styles.dateCell}>
                    {formatDate(registration.createdAt)}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.viewButton}
                        onClick={() => onViewDetails(registration)}
                        title="View details"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      {registration.status ===
                        REGISTRATION_STATUS.PENDING_VERIFICATION && (
                        <button
                          type="button"
                          className={styles.confirmButton}
                          onClick={() =>
                            onUpdateStatus(
                              registration.id,
                              REGISTRATION_STATUS.CONFIRMED
                            )
                          }
                          disabled={isUpdating}
                          title="Confirm payment"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Info and Load More */}
      <div className={styles.paginationFooter}>
        <div className={styles.paginationInfo}>
          Showing {registrations.length} of {totalCount} registrations
          {loadedCount > 0 && loadedCount < totalCount && (
            <span className={styles.loadedInfo}> ({loadedCount} loaded)</span>
          )}
        </div>
        {hasMore && (
          <button
            className={styles.loadMoreButton}
            onClick={onLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <span className={styles.loadingSpinner} />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </button>
        )}
      </div>
    </div>
  );
}

RegistrationsTable.propTypes = {
  registrations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      primaryAttendee: PropTypes.shape({
        firstName: PropTypes.string,
        lastName: PropTypes.string,
        email: PropTypes.string,
      }),
      firstName: PropTypes.string,
      lastName: PropTypes.string,
      email: PropTypes.string,
      category: PropTypes.string,
      workshopSelection: PropTypes.string,
      totalAmount: PropTypes.number,
      status: PropTypes.string,
      createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    })
  ),
  onViewDetails: PropTypes.func.isRequired,
  onUpdateStatus: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  hasMore: PropTypes.bool,
  onLoadMore: PropTypes.func,
  isLoadingMore: PropTypes.bool,
  isUpdating: PropTypes.bool,
  totalCount: PropTypes.number,
  loadedCount: PropTypes.number,
};

RegistrationsTable.defaultProps = {
  registrations: [],
  isLoading: false,
  hasMore: false,
  onLoadMore: () => {},
  isLoadingMore: false,
  isUpdating: false,
  totalCount: 0,
  loadedCount: 0,
};

export default RegistrationsTable;
