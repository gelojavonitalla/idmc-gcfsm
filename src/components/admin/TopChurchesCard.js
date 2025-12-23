/**
 * TopChurchesCard Component
 * Displays top churches by delegate count with expandable view.
 *
 * @module components/admin/TopChurchesCard
 */

import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { ADMIN_ROUTES } from '../../constants';
import styles from './TopChurchesCard.module.css';

/**
 * TopChurchesCard Component
 *
 * @param {Object} props - Component props
 * @param {Array} props.churches - Array of church objects with name, city, delegateCount
 * @param {number} props.totalChurches - Total number of unique churches
 * @param {number} props.totalDelegates - Total number of delegates
 * @param {boolean} [props.isLoading] - Show loading state
 * @returns {JSX.Element} The top churches card component
 */
function TopChurchesCard({
  churches = [],
  totalChurches = 0,
  totalDelegates = 0,
  isLoading = false,
}) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h3 className={styles.title}>Top Churches</h3>
          <p className={styles.subtitle}>
            {totalChurches} churches, {totalDelegates} delegates
          </p>
        </div>
        <div className={styles.iconWrapper}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
      </div>

      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.loadingState}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={styles.skeletonRow}>
                <div className={styles.skeletonRank} />
                <div className={styles.skeletonInfo}>
                  <div className={styles.skeletonName} />
                  <div className={styles.skeletonCity} />
                </div>
                <div className={styles.skeletonCount} />
              </div>
            ))}
          </div>
        ) : churches.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No church data available yet</p>
          </div>
        ) : (
          <div className={styles.churchList}>
            {churches.map((church, index) => (
              <div key={`${church.name}-${church.city}`} className={styles.churchRow}>
                <span className={styles.rank}>{index + 1}</span>
                <div className={styles.churchInfo}>
                  <span className={styles.churchName}>{church.name}</span>
                  {church.city && (
                    <span className={styles.churchCity}>{church.city}</span>
                  )}
                </div>
                <span className={styles.delegateCount}>
                  {church.delegateCount}
                  <span className={styles.delegateLabel}>
                    {church.delegateCount === 1 ? 'delegate' : 'delegates'}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalChurches > 5 && !isLoading && (
        <div className={styles.footer}>
          <Link to={ADMIN_ROUTES.CHURCHES_BREAKDOWN} className={styles.viewAllLink}>
            View all {totalChurches} churches
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}

TopChurchesCard.propTypes = {
  churches: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      city: PropTypes.string,
      delegateCount: PropTypes.number.isRequired,
    })
  ),
  totalChurches: PropTypes.number,
  totalDelegates: PropTypes.number,
  isLoading: PropTypes.bool,
};

export default TopChurchesCard;
