import PropTypes from 'prop-types';
import { WORKSHOP_CATEGORIES, WORKSHOP_CATEGORY_LABELS } from '../../constants';
import styles from './CategoryFilter.module.css';

/**
 * CategoryFilter Component
 * Dropdown filter for selecting workshop categories to display.
 *
 * @param {Object} props - Component props
 * @param {string} props.selectedCategory - Currently selected category (empty string for all)
 * @param {Function} props.onChange - Callback when filter selection changes
 * @returns {JSX.Element} The category filter component
 */
function CategoryFilter({ selectedCategory, onChange }) {
  /**
   * Handles select change event
   *
   * @param {Event} event - Change event from select element
   */
  const handleChange = (event) => {
    onChange(event.target.value);
  };

  return (
    <div className={styles.container}>
      <label htmlFor="workshop-category-filter" className={styles.label}>
        Filter by category:
      </label>
      <select
        id="workshop-category-filter"
        className={styles.select}
        value={selectedCategory}
        onChange={handleChange}
        aria-label="Filter workshops by category"
      >
        <option value="">All Categories</option>
        {Object.values(WORKSHOP_CATEGORIES).map((category) => (
          <option key={category} value={category}>
            {WORKSHOP_CATEGORY_LABELS[category]}
          </option>
        ))}
      </select>
    </div>
  );
}

CategoryFilter.propTypes = {
  selectedCategory: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default CategoryFilter;
