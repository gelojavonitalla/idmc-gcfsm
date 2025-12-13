import PropTypes from 'prop-types';
import styles from './SpeakerCard.module.css';

/**
 * SpeakerCard Component
 * Displays a speaker's information in a card format for use in speaker grids.
 * Shows photo (or placeholder), name, title, organization, and optional session title.
 *
 * @param {Object} props - Component props
 * @param {Object} props.speaker - Speaker data object
 * @param {string} props.speaker.id - Unique speaker identifier
 * @param {string} props.speaker.name - Speaker's full name
 * @param {string} props.speaker.title - Speaker's title/designation
 * @param {string} props.speaker.organization - Speaker's organization
 * @param {string} [props.speaker.photoUrl] - URL to speaker's photo
 * @param {string} [props.speaker.sessionTitle] - Session title for workshop speakers
 * @param {Function} props.onClick - Callback when card is clicked
 * @param {boolean} [props.showSession] - Whether to show session title
 * @returns {JSX.Element} The speaker card component
 */
function SpeakerCard({ speaker, onClick, showSession = false }) {
  /**
   * Generates initials from a speaker's name for the placeholder avatar
   *
   * @param {string} name - Full name of the speaker
   * @returns {string} First letter of the first name
   */
  const getInitials = (name) => {
    return name.charAt(0).toUpperCase();
  };

  /**
   * Handles keyboard navigation for accessibility
   *
   * @param {KeyboardEvent} event - Keyboard event
   */
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick(speaker);
    }
  };

  return (
    <div
      className={styles.card}
      onClick={() => onClick(speaker)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${speaker.name}`}
    >
      <div className={styles.imageContainer}>
        {speaker.photoUrl ? (
          <img
            src={speaker.photoUrl}
            alt={speaker.name}
            className={styles.image}
            loading="lazy"
          />
        ) : (
          <div className={styles.placeholder}>
            <span>{getInitials(speaker.name)}</span>
          </div>
        )}
      </div>
      <div className={styles.content}>
        <h3 className={styles.name}>{speaker.name}</h3>
        <p className={styles.title}>{speaker.title}</p>
        <p className={styles.organization}>{speaker.organization}</p>
        {showSession && speaker.sessionTitle && (
          <p className={styles.session}>{speaker.sessionTitle}</p>
        )}
      </div>
    </div>
  );
}

SpeakerCard.propTypes = {
  speaker: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    organization: PropTypes.string.isRequired,
    photoUrl: PropTypes.string,
    sessionTitle: PropTypes.string,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
  showSession: PropTypes.bool,
};

export default SpeakerCard;
