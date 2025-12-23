/**
 * FeedbackResponsesTable Component
 * Displays a table of feedback responses with actions for admin management.
 *
 * @module components/admin/FeedbackResponsesTable
 */

import PropTypes from 'prop-types';
import styles from './FeedbackResponsesTable.module.css';

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
 * Gets a preview of the response data for display in the table.
 *
 * @param {Object} response - Feedback response object
 * @returns {string} Preview string of the response
 */
function getResponsePreview(response) {
  const excludeKeys = ['id', 'createdAt'];
  const entries = Object.entries(response)
    .filter(([key]) => !excludeKeys.includes(key))
    .slice(0, 3);

  if (entries.length === 0) return 'No data';

  return entries
    .map(([key, value]) => {
      if (typeof value === 'boolean') return `${key}: ${value ? 'Yes' : 'No'}`;
      if (typeof value === 'object') return `${key}: (multiple)`;
      const strValue = String(value);
      return `${key}: ${strValue.length > 30 ? strValue.substring(0, 30) + '...' : strValue}`;
    })
    .join(' | ');
}

/**
 * FeedbackResponsesTable Component
 *
 * @param {Object} props - Component props
 * @param {Array} props.responses - Array of feedback response objects
 * @param {Function} props.onView - Callback when view is clicked
 * @param {Function} props.onDelete - Callback when delete is clicked
 * @param {boolean} props.isLoading - Loading state
 * @returns {JSX.Element} The feedback responses table
 */
function FeedbackResponsesTable({ responses, onView, onDelete, isLoading }) {
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.skeleton} />
      </div>
    );
  }

  if (responses.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <p>No feedback responses yet</p>
          <p className={styles.emptyHint}>Feedback submissions will appear here.</p>
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
              <th style={{ width: '60px' }}>#</th>
              <th>Response Preview</th>
              <th style={{ width: '160px' }}>Submitted</th>
              <th style={{ width: '120px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {responses.map((response, index) => (
              <tr key={response.id}>
                <td className={styles.indexCell}>{index + 1}</td>
                <td className={styles.previewCell}>
                  {getResponsePreview(response)}
                </td>
                <td className={styles.dateCell}>
                  {formatDate(response.createdAt)}
                </td>
                <td>
                  <div className={styles.actions}>
                    <button
                      className={styles.viewButton}
                      onClick={() => onView(response)}
                      title="View details"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => onDelete(response.id)}
                      title="Delete response"
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

FeedbackResponsesTable.propTypes = {
  responses: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      createdAt: PropTypes.object,
    })
  ),
  onView: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

FeedbackResponsesTable.defaultProps = {
  responses: [],
  isLoading: false,
};

export default FeedbackResponsesTable;
