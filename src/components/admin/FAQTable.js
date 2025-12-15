/**
 * FAQTable Component
 * Displays a table of FAQs with actions for admin management.
 *
 * @module components/admin/FAQTable
 */

import PropTypes from 'prop-types';
import { FAQ_STATUS, FAQ_CATEGORY_LABELS } from '../../constants';
import styles from './FAQTable.module.css';

/**
 * FAQTable Component
 *
 * @param {Object} props - Component props
 * @param {Array} props.faqs - Array of FAQ objects
 * @param {Function} props.onEdit - Callback when edit is clicked
 * @param {Function} props.onDelete - Callback when delete is clicked
 * @param {Function} props.onToggleStatus - Callback to toggle publish status
 * @param {boolean} props.isLoading - Loading state
 * @returns {JSX.Element} The FAQ table
 */
function FAQTable({ faqs, onEdit, onDelete, onToggleStatus, isLoading }) {
  /**
   * Gets status badge class
   *
   * @param {string} status - FAQ status
   * @returns {string} Badge class name
   */
  const getStatusClass = (status) => {
    return status === FAQ_STATUS.PUBLISHED ? styles.statusPublished : styles.statusDraft;
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

  if (faqs.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <p>No FAQs found</p>
          <p className={styles.emptyHint}>Click &quot;Add FAQ&quot; to create one.</p>
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
              <th style={{ width: '120px' }}>Category</th>
              <th>Question</th>
              <th>Answer</th>
              <th style={{ width: '100px' }}>Status</th>
              <th style={{ width: '120px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {faqs.map((faq) => (
              <tr key={faq.id}>
                <td className={styles.orderCell}>{faq.order || '-'}</td>
                <td>
                  <span className={styles.categoryBadge}>
                    {FAQ_CATEGORY_LABELS[faq.category] || faq.category || '-'}
                  </span>
                </td>
                <td>
                  <div className={styles.question}>
                    {truncateText(faq.question, 80)}
                  </div>
                </td>
                <td>
                  <div className={styles.answer}>
                    {truncateText(faq.answer, 100)}
                  </div>
                </td>
                <td>
                  <button
                    className={`${styles.statusBadge} ${getStatusClass(faq.status)}`}
                    onClick={() => onToggleStatus(faq.id, faq.status)}
                    title={faq.status === FAQ_STATUS.PUBLISHED ? 'Click to unpublish' : 'Click to publish'}
                  >
                    {faq.status || 'draft'}
                  </button>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button
                      className={styles.editButton}
                      onClick={() => onEdit(faq)}
                      title="Edit FAQ"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => onDelete(faq.id, faq.question)}
                      title="Delete FAQ"
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

FAQTable.propTypes = {
  faqs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      question: PropTypes.string.isRequired,
      answer: PropTypes.string,
      category: PropTypes.string,
      status: PropTypes.string,
      order: PropTypes.number,
    })
  ),
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onToggleStatus: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

FAQTable.defaultProps = {
  faqs: [],
  isLoading: false,
};

export default FAQTable;
