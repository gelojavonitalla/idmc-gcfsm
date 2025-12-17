/**
 * InquiriesTable Component
 * Displays a table of contact inquiries with actions for admin management.
 *
 * @module components/admin/InquiriesTable
 */

import PropTypes from 'prop-types';
import { CONTACT_INQUIRY_STATUS } from '../../constants';
import styles from './InquiriesTable.module.css';

/**
 * Status labels for display
 */
const STATUS_LABELS = {
  [CONTACT_INQUIRY_STATUS.NEW]: 'New',
  [CONTACT_INQUIRY_STATUS.READ]: 'Read',
  [CONTACT_INQUIRY_STATUS.REPLIED]: 'Replied',
};

/**
 * Formats a Firestore timestamp to a readable date string.
 *
 * @param {Object} timestamp - Firestore timestamp
 * @returns {string} Formatted date string
 */
function formatDate(timestamp) {
  if (!timestamp) return '-';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * InquiriesTable Component
 *
 * @param {Object} props - Component props
 * @param {Array} props.inquiries - Array of inquiry objects
 * @param {Function} props.onView - Callback when view is clicked
 * @param {Function} props.onUpdateStatus - Callback when status is changed
 * @param {Function} props.onDelete - Callback when delete is clicked
 * @param {boolean} props.isLoading - Loading state
 * @returns {JSX.Element} The inquiries table
 */
function InquiriesTable({ inquiries, onView, onUpdateStatus, onDelete, isLoading }) {
  /**
   * Gets status badge class
   *
   * @param {string} status - Inquiry status
   * @returns {string} Badge class name
   */
  const getStatusClass = (status) => {
    switch (status) {
      case CONTACT_INQUIRY_STATUS.NEW:
        return styles.statusNew;
      case CONTACT_INQUIRY_STATUS.READ:
        return styles.statusRead;
      case CONTACT_INQUIRY_STATUS.REPLIED:
        return styles.statusReplied;
      default:
        return styles.statusNew;
    }
  };

  /**
   * Truncates text to specified length
   *
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  const truncateText = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.skeleton} />
      </div>
    );
  }

  if (inquiries.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          <p>No inquiries found</p>
          <p className={styles.emptyHint}>Contact form submissions will appear here.</p>
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
              <th style={{ width: '100px' }}>Status</th>
              <th style={{ width: '150px' }}>Name</th>
              <th style={{ width: '180px' }}>Email</th>
              <th>Subject</th>
              <th style={{ width: '140px' }}>Date</th>
              <th style={{ width: '150px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.map((inquiry) => (
              <tr
                key={inquiry.id}
                className={inquiry.status === CONTACT_INQUIRY_STATUS.NEW ? styles.unreadRow : ''}
              >
                <td>
                  <select
                    className={`${styles.statusSelect} ${getStatusClass(inquiry.status)}`}
                    value={inquiry.status}
                    onChange={(e) => onUpdateStatus(inquiry.id, e.target.value)}
                  >
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className={styles.nameCell}>{inquiry.name}</td>
                <td className={styles.emailCell}>
                  <a href={`mailto:${inquiry.email}`} className={styles.emailLink}>
                    {inquiry.email}
                  </a>
                </td>
                <td className={styles.subjectCell}>
                  {truncateText(inquiry.subject, 60)}
                </td>
                <td className={styles.dateCell}>
                  {formatDate(inquiry.createdAt)}
                </td>
                <td>
                  <div className={styles.actions}>
                    <button
                      className={styles.viewButton}
                      onClick={() => onView(inquiry)}
                      title="View inquiry"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                    <a
                      className={styles.replyButton}
                      href={`mailto:${inquiry.email}?subject=Re: ${encodeURIComponent(inquiry.subject)}`}
                      title="Reply via email"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 17 4 12 9 7" />
                        <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                      </svg>
                    </a>
                    <button
                      className={styles.deleteButton}
                      onClick={() => onDelete(inquiry.id, inquiry.name)}
                      title="Delete inquiry"
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

InquiriesTable.propTypes = {
  inquiries: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
      subject: PropTypes.string.isRequired,
      message: PropTypes.string.isRequired,
      status: PropTypes.string,
      createdAt: PropTypes.object,
    })
  ),
  onView: PropTypes.func.isRequired,
  onUpdateStatus: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

InquiriesTable.defaultProps = {
  inquiries: [],
  isLoading: false,
};

export default InquiriesTable;
