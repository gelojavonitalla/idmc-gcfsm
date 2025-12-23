/**
 * FoodStatsCard Component
 * Displays food choice distribution statistics.
 *
 * @module components/admin/FoodStatsCard
 */

import PropTypes from 'prop-types';
import styles from './FoodStatsCard.module.css';

/**
 * Calculates the percentage of a count relative to total
 *
 * @param {number} count - The count value
 * @param {number} total - The total value
 * @returns {number} Percentage value
 */
function calculatePercentage(count, total) {
  if (total === 0) {
    return 0;
  }
  return Math.round((count / total) * 100);
}

/**
 * FoodStatsCard Component
 *
 * @param {Object} props - Component props
 * @param {Array} props.distribution - Array of food choices with name and count
 * @param {number} props.totalWithChoice - Total attendees with food selection
 * @param {number} props.totalWithoutChoice - Total attendees without selection
 * @param {number} props.totalAttendees - Total attendee count
 * @param {boolean} [props.isLoading] - Show loading state
 * @returns {JSX.Element} The food stats card component
 */
function FoodStatsCard({
  distribution = [],
  totalWithChoice = 0,
  totalWithoutChoice = 0,
  totalAttendees = 0,
  isLoading = false,
}) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h3 className={styles.title}>Food Preferences</h3>
          <p className={styles.subtitle}>
            {totalWithChoice} of {totalAttendees} selected
          </p>
        </div>
        <div className={styles.iconWrapper}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
            <line x1="6" y1="1" x2="6" y2="4" />
            <line x1="10" y1="1" x2="10" y2="4" />
            <line x1="14" y1="1" x2="14" y2="4" />
          </svg>
        </div>
      </div>

      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.loadingState}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.skeletonRow}>
                <div className={styles.skeletonInfo}>
                  <div className={styles.skeletonName} />
                  <div className={styles.skeletonBar} />
                </div>
                <div className={styles.skeletonCount} />
              </div>
            ))}
          </div>
        ) : distribution.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No food selections recorded yet</p>
          </div>
        ) : (
          <div className={styles.foodList}>
            {distribution.map((item) => (
              <div key={item.id} className={styles.foodRow}>
                <div className={styles.foodInfo}>
                  <div className={styles.foodHeader}>
                    <span className={styles.foodName}>{item.name}</span>
                    <span className={styles.foodCount}>
                      {item.count} ({calculatePercentage(item.count, totalAttendees)}%)
                    </span>
                  </div>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${calculatePercentage(item.count, totalAttendees)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!isLoading && totalAttendees > 0 && (
        <div className={styles.footer}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{totalWithChoice}</span>
            <span className={styles.statLabel}>selected</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={`${styles.statValue} ${totalWithoutChoice > 0 ? styles.warning : ''}`}>
              {totalWithoutChoice}
            </span>
            <span className={styles.statLabel}>no selection</span>
          </div>
        </div>
      )}
    </div>
  );
}

FoodStatsCard.propTypes = {
  distribution: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      count: PropTypes.number.isRequired,
    })
  ),
  totalWithChoice: PropTypes.number,
  totalWithoutChoice: PropTypes.number,
  totalAttendees: PropTypes.number,
  isLoading: PropTypes.bool,
};

export default FoodStatsCard;
