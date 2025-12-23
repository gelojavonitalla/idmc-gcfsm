import PropTypes from 'prop-types';
import {
  SESSION_TYPE_LABELS,
  SESSION_TYPE_COLORS,
  SESSION_TYPES,
  WORKSHOP_CATEGORY_LABELS,
  WORKSHOP_CATEGORY_COLORS,
  WORKSHOP_CATEGORIES,
} from '../../constants';
import { CapacityBadge } from '../workshops';
import styles from './SessionCard.module.css';

/**
 * SessionCard Component
 * Displays a session's information in a card format for use in the schedule timeline.
 * Shows time, title, type badge, venue, and speaker names.
 * Color-coded by session type.
 *
 * @param {Object} props - Component props
 * @param {Object} props.session - Session data object
 * @param {string} props.session.id - Unique session identifier
 * @param {string} props.session.title - Session title
 * @param {string} props.session.startTime - Session start time in HH:MM format
 * @param {string} [props.session.endTime] - Session end time in HH:MM format
 * @param {string} props.session.sessionType - Session type identifier
 * @param {string} [props.session.venue] - Venue/room name
 * @param {Array<string>} [props.session.speakerNames] - Array of speaker names
 * @param {Function} props.onClick - Callback when card is clicked
 * @returns {JSX.Element} The session card component
 */
function SessionCard({ session, onClick }) {
  const isWorkshop = session.sessionType === SESSION_TYPES.WORKSHOP;

  // For workshops, use category colors; for other sessions, use session type colors
  const colors = isWorkshop && session.category
    ? WORKSHOP_CATEGORY_COLORS[session.category] || WORKSHOP_CATEGORY_COLORS[WORKSHOP_CATEGORIES.NEXT_GENERATION]
    : SESSION_TYPE_COLORS[session.sessionType] || SESSION_TYPE_COLORS[SESSION_TYPES.OTHER];

  // For workshops, show category label; for other sessions, show type label
  const badgeLabel = isWorkshop && session.category
    ? WORKSHOP_CATEGORY_LABELS[session.category] || 'Workshop'
    : SESSION_TYPE_LABELS[session.sessionType] || 'Session';

  /**
   * Handles keyboard navigation for accessibility
   *
   * @param {KeyboardEvent} event - Keyboard event
   */
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick(session);
    }
  };

  /**
   * Formats time from 24-hour format to 12-hour format
   *
   * @param {string} time - Time in HH:MM format
   * @returns {string} Formatted time (e.g., "1:15 PM")
   */
  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  /**
   * Formats the time range for display
   *
   * @returns {string} Formatted time range
   */
  const getTimeDisplay = () => {
    const startTimeFormatted = formatTime(session.startTime);
    const endTimeFormatted = formatTime(session.endTime);
    if (startTimeFormatted && endTimeFormatted) {
      return `${startTimeFormatted} - ${endTimeFormatted}`;
    }
    return startTimeFormatted || '';
  };

  return (
    <div
      className={styles.card}
      onClick={() => onClick(session)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${session.title}`}
      style={{
        borderLeftColor: colors.border,
        backgroundColor: colors.background,
      }}
    >
      <div className={styles.header}>
        <span className={styles.time}>{getTimeDisplay()}</span>
        {isWorkshop && (
          <CapacityBadge
            capacity={session.capacity}
            registeredCount={session.registeredCount || 0}
            compact={true}
          />
        )}
      </div>

      <h3 className={styles.title}>{session.title}</h3>

      <div className={styles.meta}>
        {session.venue && (
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
            {session.venue}
          </span>
        )}

        {session.speakerNames && session.speakerNames.length > 0 && (
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
            {session.speakerNames.join(', ')}
          </span>
        )}

        <span
          className={styles.badge}
          style={isWorkshop && session.category ? {
            backgroundColor: colors.background,
            color: colors.text,
            border: `1px solid ${colors.border}`,
          } : {
            backgroundColor: colors.border,
            color: '#ffffff',
          }}
        >
          {badgeLabel}
        </span>
      </div>
    </div>
  );
}

SessionCard.propTypes = {
  session: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    startTime: PropTypes.string.isRequired,
    endTime: PropTypes.string,
    sessionType: PropTypes.string.isRequired,
    venue: PropTypes.string,
    speakerNames: PropTypes.arrayOf(PropTypes.string),
    category: PropTypes.string,
    capacity: PropTypes.number,
    registeredCount: PropTypes.number,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
};

export default SessionCard;
