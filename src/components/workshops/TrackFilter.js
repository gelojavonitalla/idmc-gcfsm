import PropTypes from 'prop-types';
import { WORKSHOP_TRACK_IDS, WORKSHOP_TRACK_LABELS } from '../../constants';
import styles from './TrackFilter.module.css';

/**
 * TrackFilter Component
 * Dropdown filter for selecting workshop tracks to display.
 *
 * @param {Object} props - Component props
 * @param {string} props.selectedTrack - Currently selected track (empty string for all)
 * @param {Function} props.onChange - Callback when filter selection changes
 * @returns {JSX.Element} The track filter component
 */
function TrackFilter({ selectedTrack, onChange }) {
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
      <label htmlFor="workshop-track-filter" className={styles.label}>
        Filter by track:
      </label>
      <select
        id="workshop-track-filter"
        className={styles.select}
        value={selectedTrack}
        onChange={handleChange}
        aria-label="Filter workshops by track"
      >
        <option value="">All Tracks</option>
        {Object.values(WORKSHOP_TRACK_IDS).map((track) => (
          <option key={track} value={track}>
            {WORKSHOP_TRACK_LABELS[track]}
          </option>
        ))}
      </select>
    </div>
  );
}

TrackFilter.propTypes = {
  selectedTrack: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default TrackFilter;
