/**
 * RecentCheckIns Component
 * Displays a real-time list of recent check-ins.
 *
 * @module components/checkin/RecentCheckIns
 */

import styles from './RecentCheckIns.module.css';

/**
 * RecentCheckIns Component
 *
 * @param {Object} props - Component props
 * @param {Array} props.checkIns - Array of recent check-in records
 * @param {boolean} [props.isLoading=false] - Whether check-ins are loading
 * @param {number} [props.limit=10] - Maximum number of check-ins to display
 * @returns {JSX.Element} The recent check-ins component
 */
function RecentCheckIns({ checkIns = [], isLoading = false, limit = 10 }) {
  /**
   * Formats timestamp to relative or absolute time
   */
  const formatTime = (timestamp) => {
    if (!timestamp) return '';

    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    return date.toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Gets method icon
   */
  const getMethodIcon = (method) => {
    if (method === 'qr') {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="3" height="3" />
          <line x1="21" y1="14" x2="21" y2="21" />
          <line x1="14" y1="21" x2="21" y2="21" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    );
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Recent Check-ins</h3>
        <div className={styles.loading}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className={styles.skeletonItem}>
              <div className={styles.skeletonAvatar}></div>
              <div className={styles.skeletonText}>
                <div className={styles.skeletonName}></div>
                <div className={styles.skeletonTime}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const displayCheckIns = checkIns.slice(0, limit);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Recent Check-ins</h3>
        {checkIns.length > 0 && (
          <span className={styles.count}>{checkIns.length}</span>
        )}
      </div>

      {displayCheckIns.length === 0 ? (
        <div className={styles.empty}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
          <p>No check-ins yet</p>
          <span>Checked-in attendees will appear here</span>
        </div>
      ) : (
        <ul className={styles.list}>
          {displayCheckIns.map((checkIn, index) => (
            <li
              key={checkIn.id || index}
              className={`${styles.item} ${index === 0 ? styles.newest : ''}`}
            >
              <div className={styles.avatar}>
                {(checkIn.attendeeName?.[0] || 'A').toUpperCase()}
              </div>
              <div className={styles.info}>
                <div className={styles.name}>{checkIn.attendeeName || 'Unknown'}</div>
                <div className={styles.meta}>
                  <span className={styles.time}>{formatTime(checkIn.checkedInAt)}</span>
                  {checkIn.church && (
                    <>
                      <span className={styles.dot}>·</span>
                      <span className={styles.church}>{checkIn.church}</span>
                    </>
                  )}
                </div>
              </div>
              <div className={styles.method} title={checkIn.checkInMethod === 'qr' ? 'QR Scan' : 'Manual'}>
                {getMethodIcon(checkIn.checkInMethod)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default RecentCheckIns;
