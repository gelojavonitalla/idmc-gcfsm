import PropTypes from 'prop-types';
import { SESSION_TYPES, SESSION_TYPE_LABELS } from '../../constants';
import styles from './TypeFilter.module.css';

/**
 * Session types available for filtering.
 * Only shows the main session types: Plenary and Workshop.
 */
const FILTER_TYPES = [SESSION_TYPES.PLENARY, SESSION_TYPES.WORKSHOP];

/**
 * TypeFilter Component
 * Dropdown filter for selecting session types to display in the schedule.
 *
 * @param {Object} props - Component props
 * @param {string} props.selectedType - Currently selected session type (empty string for all)
 * @param {Function} props.onChange - Callback when filter selection changes
 * @returns {JSX.Element} The type filter component
 */
function TypeFilter({ selectedType, onChange }) {
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
      <label htmlFor="session-type-filter" className={styles.label}>
        Filter by type:
      </label>
      <select
        id="session-type-filter"
        className={styles.select}
        value={selectedType}
        onChange={handleChange}
        aria-label="Filter sessions by type"
      >
        <option value="">All Sessions</option>
        {FILTER_TYPES.map((type) => (
          <option key={type} value={type}>
            {SESSION_TYPE_LABELS[type]}
          </option>
        ))}
      </select>
    </div>
  );
}

TypeFilter.propTypes = {
  selectedType: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default TypeFilter;
