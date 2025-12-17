/**
 * CheckInStats Component
 * Displays real-time check-in statistics with progress bar.
 *
 * @module components/checkin/CheckInStats
 */

import styles from './CheckInStats.module.css';

/**
 * CheckInStats Component
 *
 * @param {Object} props - Component props
 * @param {Object} props.stats - Check-in statistics
 * @param {boolean} [props.isLoading=false] - Whether stats are loading
 * @param {boolean} [props.compact=false] - Compact display mode
 * @returns {JSX.Element} The check-in stats component
 */
function CheckInStats({ stats, isLoading = false, compact = false }) {
  if (isLoading) {
    return (
      <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
        <div className={styles.loading}>
          <div className={styles.skeleton}></div>
          <div className={styles.skeleton}></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const { checkedIn = 0, totalConfirmed = 0, percentage = 0, totalAttendees = 0, checkedInAttendees = 0 } = stats;

  return (
    <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
      {/* Main Counter */}
      <div className={styles.mainCounter}>
        <div className={styles.counterValue}>
          <span className={styles.checkedIn}>{checkedIn}</span>
          <span className={styles.separator}>/</span>
          <span className={styles.total}>{totalConfirmed}</span>
        </div>
        <div className={styles.counterLabel}>Registrations Checked In</div>
      </div>

      {/* Progress Bar */}
      <div className={styles.progressContainer}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <div className={styles.progressLabel}>
          <span className={styles.percentage}>{percentage}%</span>
          <span className={styles.pending}>{totalConfirmed - checkedIn} pending</span>
        </div>
      </div>

      {/* Attendee Count */}
      {!compact && totalAttendees > 0 && (
        <div className={styles.attendeeStats}>
          <div className={styles.statItem}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{checkedInAttendees}</span>
              <span className={styles.statLabel}>attendees present</span>
            </div>
          </div>
          <div className={styles.statItem}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{totalAttendees - checkedInAttendees}</span>
              <span className={styles.statLabel}>expected</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CheckInStats;
