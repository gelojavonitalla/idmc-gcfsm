/**
 * WhatToBringTable Component
 * Displays a table of "What to Bring" checklist items with actions.
 *
 * @module components/admin/WhatToBringTable
 */

import PropTypes from 'prop-types';
import { WHAT_TO_BRING_STATUS } from '../../constants';
import styles from './WhatToBringTable.module.css';

/**
 * WhatToBringTable Component
 *
 * @param {Object} props - Component props
 * @param {Array} props.items - Array of what to bring items
 * @param {Function} props.onEdit - Callback when edit button is clicked
 * @param {Function} props.onDelete - Callback when delete button is clicked
 * @param {Function} props.onToggleStatus - Callback when status toggle is clicked
 * @param {boolean} props.isLoading - Whether data is loading
 * @returns {JSX.Element} The what to bring table component
 */
function WhatToBringTable({ items, onEdit, onDelete, onToggleStatus, isLoading }) {
  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <span>Loading checklist items...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={styles.emptyState}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        <h3>No checklist items yet</h3>
        <p>Add items that attendees should bring to the event.</p>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.orderColumn}>Order</th>
            <th>Item</th>
            <th className={styles.statusColumn}>Status</th>
            <th className={styles.actionsColumn}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td className={styles.orderCell}>{item.order}</td>
              <td className={styles.textCell}>{item.text}</td>
              <td className={styles.statusCell}>
                <button
                  className={`${styles.statusBadge} ${
                    item.status === WHAT_TO_BRING_STATUS.PUBLISHED
                      ? styles.statusPublished
                      : styles.statusDraft
                  }`}
                  onClick={() => onToggleStatus(item.id)}
                  title={`Click to ${item.status === WHAT_TO_BRING_STATUS.PUBLISHED ? 'unpublish' : 'publish'}`}
                >
                  {item.status === WHAT_TO_BRING_STATUS.PUBLISHED ? 'Published' : 'Draft'}
                </button>
              </td>
              <td className={styles.actionsCell}>
                <button
                  className={styles.editButton}
                  onClick={() => onEdit(item)}
                  title="Edit item"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  className={styles.deleteButton}
                  onClick={() => onDelete(item.id)}
                  title="Delete item"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

WhatToBringTable.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
      order: PropTypes.number,
      status: PropTypes.string,
    })
  ).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onToggleStatus: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

WhatToBringTable.defaultProps = {
  isLoading: false,
};

export default WhatToBringTable;
