/**
 * DownloadStatsCard Component
 * Displays download statistics for conference materials.
 *
 * @module components/admin/DownloadStatsCard
 */

import PropTypes from 'prop-types';
import styles from './DownloadStatsCard.module.css';

/**
 * DownloadStatsCard Component
 *
 * @param {Object} props - Component props
 * @param {Array} props.items - Array of download items with title and downloadCount
 * @param {number} props.totalDownloads - Total download count across all files
 * @param {number} props.totalFiles - Total number of downloadable files
 * @param {boolean} [props.isLoading] - Show loading state
 * @returns {JSX.Element} The download stats card component
 */
function DownloadStatsCard({
  items = [],
  totalDownloads = 0,
  totalFiles = 0,
  isLoading = false,
}) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h3 className={styles.title}>Downloads</h3>
          <p className={styles.subtitle}>
            {totalDownloads} total downloads
          </p>
        </div>
        <div className={styles.iconWrapper}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>
      </div>

      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.loadingState}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.skeletonRow}>
                <div className={styles.skeletonTitle} />
                <div className={styles.skeletonCount} />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No downloadable files yet</p>
          </div>
        ) : (
          <div className={styles.downloadList}>
            {items.map((item) => (
              <div key={item.id} className={styles.downloadRow}>
                <div className={styles.downloadInfo}>
                  <span className={styles.downloadTitle}>{item.title}</span>
                  <span className={styles.downloadStatus}>
                    {item.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </div>
                <div className={styles.downloadCount}>
                  <span className={styles.countValue}>{item.downloadCount}</span>
                  <span className={styles.countLabel}>downloads</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!isLoading && totalFiles > 0 && (
        <div className={styles.footer}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{totalFiles}</span>
            <span className={styles.statLabel}>files available</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {totalFiles > 0 ? Math.round(totalDownloads / totalFiles) : 0}
            </span>
            <span className={styles.statLabel}>avg per file</span>
          </div>
        </div>
      )}
    </div>
  );
}

DownloadStatsCard.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      downloadCount: PropTypes.number.isRequired,
      status: PropTypes.string,
    })
  ),
  totalDownloads: PropTypes.number,
  totalFiles: PropTypes.number,
  isLoading: PropTypes.bool,
};

export default DownloadStatsCard;
