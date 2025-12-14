/**
 * FAQSearch Component
 * Search input for filtering FAQ items.
 *
 * @module components/faq/FAQSearch
 */

import { useCallback } from 'react';
import PropTypes from 'prop-types';
import styles from './FAQSearch.module.css';

/**
 * FAQSearch Component
 * Renders a search input with clear button for filtering FAQs.
 *
 * @param {Object} props - Component props
 * @param {string} props.value - Current search value
 * @param {Function} props.onChange - Callback when search value changes
 * @param {string} [props.placeholder] - Placeholder text
 * @returns {JSX.Element} The search input component
 */
function FAQSearch({ value, onChange, placeholder }) {
  const handleChange = useCallback(
    (event) => {
      onChange(event.target.value);
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    onChange('');
  }, [onChange]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        handleClear();
      }
    },
    [handleClear]
  );

  return (
    <div className={styles.searchContainer}>
      <div className={styles.inputWrapper}>
        <span className={styles.searchIcon} aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </span>
        <input
          type="text"
          className={styles.input}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Search FAQ"
        />
        {value && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={handleClear}
            aria-label="Clear search"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

FAQSearch.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};

FAQSearch.defaultProps = {
  placeholder: 'Search frequently asked questions...',
};

export default FAQSearch;
