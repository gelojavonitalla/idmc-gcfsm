import PropTypes from 'prop-types';
import styles from './CapacityBadge.module.css';

/**
 * CapacityBadge Component
 * Displays workshop capacity status with visual indicators.
 * Shows "Open" for unlimited capacity, "Closed" when at capacity,
 * or "X spots left" for limited capacity workshops.
 *
 * @param {Object} props - Component props
 * @param {number|null} props.capacity - Maximum capacity (null for unlimited)
 * @param {number} props.registeredCount - Current number of registered attendees
 * @param {boolean} [props.showRemaining=true] - Whether to show remaining spots or fraction
 * @param {boolean} [props.compact=false] - Whether to show compact display (just Open/Closed)
 * @returns {JSX.Element} The capacity badge component
 */
function CapacityBadge({ capacity, registeredCount = 0, showRemaining = true, compact = false }) {
  const isUnlimited = capacity === null || capacity === undefined;
  const isClosed = !isUnlimited && registeredCount >= capacity;
  const remaining = isUnlimited ? null : Math.max(0, capacity - registeredCount);

  /**
   * Determines the status class for styling
   *
   * @returns {string} CSS class name for the current status
   */
  const getStatusClass = () => {
    if (isUnlimited) {
      return styles.open;
    }
    if (isClosed) {
      return styles.full;
    }
    if (remaining <= 10) {
      return styles.limited;
    }
    return styles.available;
  };

  /**
   * Generates the display text for the badge
   *
   * @returns {string} Text to display in the badge
   */
  const getDisplayText = () => {
    if (isUnlimited) {
      return 'Open';
    }
    if (isClosed) {
      return 'Closed';
    }
    if (compact) {
      return 'Open';
    }
    if (showRemaining) {
      return `${remaining} spots left`;
    }
    return `${registeredCount}/${capacity}`;
  };

  return (
    <span className={`${styles.badge} ${getStatusClass()}`}>
      {isClosed && (
        <svg
          className={styles.icon}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      )}
      {!isUnlimited && !isClosed && (
        <svg
          className={styles.icon}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )}
      {getDisplayText()}
    </span>
  );
}

CapacityBadge.propTypes = {
  capacity: PropTypes.number,
  registeredCount: PropTypes.number,
  showRemaining: PropTypes.bool,
  compact: PropTypes.bool,
};

export default CapacityBadge;
