/**
 * DownloadsTable Component
 * Displays a table of downloadable files with actions for admin management.
 *
 * @module components/admin/DownloadsTable
 */

import PropTypes from 'prop-types';
import { DOWNLOAD_STATUS, DOWNLOAD_CATEGORY_LABELS } from '../../constants';
import styles from './DownloadsTable.module.css';

/**
 * DownloadsTable Component
 *
 * @param {Object} props - Component props
 * @param {Array} props.downloads - Array of download objects
 * @param {Function} props.onEdit - Callback when edit is clicked
 * @param {Function} props.onDelete - Callback when delete is clicked
 * @param {Function} props.onToggleStatus - Callback to toggle publish status
 * @param {boolean} props.isLoading - Loading state
 * @returns {JSX.Element} The downloads table
 */
function DownloadsTable({ downloads, onEdit, onDelete, onToggleStatus, isLoading }) {
  /**
   * Gets status badge class
   *
   * @param {string} status - Download status
   * @returns {string} Badge class name
   */
  const getStatusClass = (status) => {
    return status === DOWNLOAD_STATUS.PUBLISHED ? styles.statusPublished : styles.statusDraft;
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.skeleton} />
      </div>
    );
  }

  if (downloads.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <p>No downloads found</p>
          <p className={styles.emptyHint}>Click &quot;Add Download&quot; to create one.</p>
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
              <th style={{ width: '60px' }}>Order</th>
              <th>Title</th>
              <th>Description</th>
              <th>Category</th>
              <th>File Size</th>
              <th>Status</th>
              <th style={{ width: '150px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {downloads.map((download) => (
              <tr key={download.id}>
                <td className={styles.orderCell}>{download.order || '-'}</td>
                <td>
                  <div className={styles.downloadInfo}>
                    <div className={styles.fileIcon}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="12" y1="18" x2="12" y2="12" />
                        <polyline points="9 15 12 18 15 15" />
                      </svg>
                    </div>
                    <div className={styles.downloadDetails}>
                      <span className={styles.downloadTitle}>{download.title}</span>
                      {download.fileName && (
                        <span className={styles.fileName}>{download.fileName}</span>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  <span className={styles.description}>
                    {download.description
                      ? download.description.length > 60
                        ? `${download.description.substring(0, 60)}...`
                        : download.description
                      : '-'}
                  </span>
                </td>
                <td>
                  <span className={styles.category}>
                    {DOWNLOAD_CATEGORY_LABELS[download.category] || download.category || '-'}
                  </span>
                </td>
                <td className={styles.fileSize}>
                  {download.downloadUrl ? (
                    download.fileSize || '-'
                  ) : (
                    <span className={styles.availableSoonBadge}>Available Soon</span>
                  )}
                </td>
                <td>
                  <button
                    className={`${styles.statusBadge} ${getStatusClass(download.status)}`}
                    onClick={() => onToggleStatus(download.id, download.status)}
                    title={download.status === DOWNLOAD_STATUS.PUBLISHED ? 'Click to unpublish' : 'Click to publish'}
                  >
                    {download.status || 'draft'}
                  </button>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button
                      className={styles.editButton}
                      onClick={() => onEdit(download)}
                      title="Edit download"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => onDelete(download.id, download.title)}
                      title="Delete download"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

DownloadsTable.propTypes = {
  downloads: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      fileName: PropTypes.string,
      fileSize: PropTypes.string,
      fileType: PropTypes.string,
      category: PropTypes.string,
      downloadUrl: PropTypes.string,
      status: PropTypes.string,
      order: PropTypes.number,
    })
  ),
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onToggleStatus: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

DownloadsTable.defaultProps = {
  downloads: [],
  isLoading: false,
};

export default DownloadsTable;
