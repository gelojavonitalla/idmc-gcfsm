/**
 * FAQCategoryTabs Component
 * Tab navigation for filtering FAQs by category.
 *
 * @module components/faq/FAQCategoryTabs
 */

import { useCallback } from 'react';
import PropTypes from 'prop-types';
import { FAQ_CATEGORIES, FAQ_CATEGORY_LABELS } from '../../constants';
import styles from './FAQCategoryTabs.module.css';

/**
 * All categories option value
 */
const ALL_CATEGORIES = 'all';

/**
 * FAQCategoryTabs Component
 * Renders category tabs for filtering FAQ items.
 *
 * @param {Object} props - Component props
 * @param {string} props.selectedCategory - Currently selected category
 * @param {Function} props.onCategoryChange - Callback when category changes
 * @param {Object} [props.categoryCounts] - Optional counts per category
 * @returns {JSX.Element} The category tabs component
 */
function FAQCategoryTabs({ selectedCategory, onCategoryChange, categoryCounts }) {
  const handleCategoryClick = useCallback(
    (category) => {
      onCategoryChange(category);
    },
    [onCategoryChange]
  );

  const handleKeyDown = useCallback(
    (event, category) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleCategoryClick(category);
      }
    },
    [handleCategoryClick]
  );

  const categories = [
    { id: ALL_CATEGORIES, label: 'All' },
    ...Object.values(FAQ_CATEGORIES).map((catId) => ({
      id: catId,
      label: FAQ_CATEGORY_LABELS[catId],
    })),
  ];

  return (
    <div className={styles.tabsContainer} role="tablist" aria-label="FAQ Categories">
      {categories.map((category) => {
        const isSelected = selectedCategory === category.id;
        const count = category.id === ALL_CATEGORIES
          ? null
          : categoryCounts?.[category.id];

        return (
          <button
            key={category.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            className={`${styles.tab} ${isSelected ? styles.tabSelected : ''}`}
            onClick={() => handleCategoryClick(category.id)}
            onKeyDown={(e) => handleKeyDown(e, category.id)}
          >
            {category.label}
            {count !== undefined && count !== null && (
              <span className={styles.count}>{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

FAQCategoryTabs.propTypes = {
  selectedCategory: PropTypes.string.isRequired,
  onCategoryChange: PropTypes.func.isRequired,
  categoryCounts: PropTypes.objectOf(PropTypes.number),
};

FAQCategoryTabs.defaultProps = {
  categoryCounts: {},
};

FAQCategoryTabs.ALL_CATEGORIES = ALL_CATEGORIES;

export default FAQCategoryTabs;
