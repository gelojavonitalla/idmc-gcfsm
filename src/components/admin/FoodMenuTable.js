/**
 * FoodMenuTable Component
 * Displays a table of food menu items with actions.
 *
 * @module components/admin/FoodMenuTable
 */

import PropTypes from 'prop-types';
import { FOOD_MENU_STATUS } from '../../constants';
import styles from './FoodMenuTable.module.css';

/**
 * FoodMenuTable Component
 *
 * @param {Object} props - Component props
 * @param {Array} props.items - Array of food menu items
 * @param {Function} props.onEdit - Callback when edit button is clicked
 * @param {Function} props.onDelete - Callback when delete button is clicked
 * @param {Function} props.onToggleStatus - Callback when status toggle is clicked
 * @param {boolean} props.isLoading - Whether data is loading
 * @returns {JSX.Element} The food menu table component
 */
function FoodMenuTable({ items, onEdit, onDelete, onToggleStatus, isLoading }) {
  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <span>Loading food options...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={styles.emptyState}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
          <path d="M7 2v20" />
          <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
        </svg>
        <h3>No food options yet</h3>
        <p>Add your first food option to get started.</p>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.orderColumn}>Order</th>
            <th>Food Option</th>
            <th>Description</th>
            <th className={styles.statusColumn}>Status</th>
            <th className={styles.actionsColumn}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td className={styles.orderCell}>{item.order}</td>
              <td className={styles.nameCell}>{item.name}</td>
              <td className={styles.descriptionCell}>
                {item.description || <span className={styles.noDescription}>-</span>}
              </td>
              <td className={styles.statusCell}>
                <button
                  className={`${styles.statusBadge} ${
                    item.status === FOOD_MENU_STATUS.PUBLISHED
                      ? styles.statusPublished
                      : styles.statusDraft
                  }`}
                  onClick={() => onToggleStatus(item.id)}
                  title={`Click to ${item.status === FOOD_MENU_STATUS.PUBLISHED ? 'unpublish' : 'publish'}`}
                >
                  {item.status === FOOD_MENU_STATUS.PUBLISHED ? 'Published' : 'Draft'}
                </button>
              </td>
              <td className={styles.actionsCell}>
                <button
                  className={styles.editButton}
                  onClick={() => onEdit(item)}
                  title="Edit food option"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  className={styles.deleteButton}
                  onClick={() => onDelete(item.id)}
                  title="Delete food option"
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

FoodMenuTable.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      order: PropTypes.number,
      status: PropTypes.string,
    })
  ).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onToggleStatus: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

FoodMenuTable.defaultProps = {
  isLoading: false,
};

export default FoodMenuTable;
