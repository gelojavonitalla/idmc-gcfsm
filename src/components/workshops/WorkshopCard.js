import PropTypes from 'prop-types';
import {
  WORKSHOP_CATEGORY_LABELS,
  WORKSHOP_CATEGORY_COLORS,
  WORKSHOP_CATEGORIES,
} from '../../constants';
import CapacityBadge from './CapacityBadge';
import styles from './WorkshopCard.module.css';

/**
 * WorkshopCard Component
 * Displays workshop information in a card format for use in the workshops grid.
 * Shows title, speaker, category badge, time, venue, and capacity status.
 *
 * @param {Object} props - Component props
 * @param {Object} props.workshop - Workshop data object
 * @param {string} props.workshop.id - Unique workshop identifier
 * @param {string} props.workshop.title - Workshop title
 * @param {string} props.workshop.time - Workshop start time display string
 * @param {string} [props.workshop.endTime] - Workshop end time display string
 * @param {string} [props.workshop.venue] - Venue/room name
 * @param {string} [props.workshop.category] - Workshop category
 * @param {number|null} [props.workshop.capacity] - Maximum capacity
 * @param {number} [props.workshop.registeredCount] - Current registered count
 * @param {Array<string>} [props.workshop.speakerNames] - Array of speaker names
 * @param {Function} props.onClick - Callback when card is clicked
 * @returns {JSX.Element} The workshop card component
 */
function WorkshopCard({ workshop, onClick }) {
  const categoryColors = WORKSHOP_CATEGORY_COLORS[workshop.category] ||
    WORKSHOP_CATEGORY_COLORS[WORKSHOP_CATEGORIES.OTHER];
  const categoryLabel = WORKSHOP_CATEGORY_LABELS[workshop.category] || 'Workshop';

  /**
   * Handles keyboard navigation for accessibility
   *
   * @param {KeyboardEvent} event - Keyboard event
   */
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick(workshop);
    }
  };

  /**
   * Formats the time range for display
   *
   * @returns {string} Formatted time range
   */
  const getTimeDisplay = () => {
    if (workshop.endTime) {
      return `${workshop.time} - ${workshop.endTime}`;
    }
    return workshop.time;
  };

  return (
    <div
      className={styles.card}
      onClick={() => onClick(workshop)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${workshop.title}`}
      style={{
        borderLeftColor: categoryColors.border,
      }}
    >
      <div className={styles.header}>
        <span
          className={styles.categoryBadge}
          style={{
            backgroundColor: categoryColors.background,
            color: categoryColors.text,
            borderColor: categoryColors.border,
          }}
        >
          {categoryLabel}
        </span>
        <CapacityBadge
          capacity={workshop.capacity}
          registeredCount={workshop.registeredCount || 0}
        />
      </div>

      <h3 className={styles.title}>{workshop.title}</h3>

      <div className={styles.meta}>
        <div className={styles.metaRow}>
          <span className={styles.time}>
            <svg
              className={styles.icon}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {getTimeDisplay()}
          </span>
        </div>

        {workshop.venue && (
          <div className={styles.metaRow}>
            <span className={styles.venue}>
              <svg
                className={styles.icon}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {workshop.venue}
            </span>
          </div>
        )}

        {workshop.speakerNames && workshop.speakerNames.length > 0 && (
          <div className={styles.metaRow}>
            <span className={styles.speakers}>
              <svg
                className={styles.icon}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {workshop.speakerNames.join(', ')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

WorkshopCard.propTypes = {
  workshop: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    time: PropTypes.string.isRequired,
    endTime: PropTypes.string,
    venue: PropTypes.string,
    category: PropTypes.string,
    capacity: PropTypes.number,
    registeredCount: PropTypes.number,
    speakerNames: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  onClick: PropTypes.func.isRequired,
};

export default WorkshopCard;
