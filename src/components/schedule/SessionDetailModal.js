import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  SESSION_TYPE_LABELS,
  SESSION_TYPE_COLORS,
  SESSION_TYPES,
  ROUTES,
  WORKSHOP_CATEGORY_LABELS,
  WORKSHOP_CATEGORY_COLORS,
  WORKSHOP_CATEGORIES,
} from '../../constants';
import { CapacityBadge } from '../workshops';
import styles from './SessionDetailModal.module.css';

/**
 * SessionDetailModal Component
 * Modal component that displays detailed session information including
 * full description, time, venue, and speaker(s) with photos.
 *
 * @param {Object} props - Component props
 * @param {Object} props.session - Session data object
 * @param {string} props.session.id - Unique session identifier
 * @param {string} props.session.title - Session title
 * @param {string} [props.session.description] - Session description
 * @param {string} props.session.time - Session start time
 * @param {string} [props.session.endTime] - Session end time
 * @param {string} props.session.sessionType - Session type identifier
 * @param {string} [props.session.venue] - Venue/room name
 * @param {Array<string>} [props.session.speakerIds] - Array of speaker IDs
 * @param {Array<string>} [props.session.speakerNames] - Array of speaker names
 * @param {Array<Object>} [props.speakers] - Full speaker objects for photo display
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback to close the modal
 * @returns {JSX.Element|null} The modal component or null if closed
 */
function SessionDetailModal({ session, speakers = [], isOpen, onClose }) {
  const navigate = useNavigate();
  const isWorkshop = session?.sessionType === SESSION_TYPES.WORKSHOP;

  // For workshops, use category colors; for other sessions, use session type colors
  const colors = session
    ? isWorkshop && session.category
      ? WORKSHOP_CATEGORY_COLORS[session.category] || WORKSHOP_CATEGORY_COLORS[WORKSHOP_CATEGORIES.NEXT_GENERATION]
      : SESSION_TYPE_COLORS[session.sessionType] || SESSION_TYPE_COLORS[SESSION_TYPES.OTHER]
    : {};

  // For workshops, show category label; for other sessions, show type label
  const badgeLabel = session
    ? isWorkshop && session.category
      ? WORKSHOP_CATEGORY_LABELS[session.category] || 'Workshop'
      : SESSION_TYPE_LABELS[session.sessionType] || 'Session'
    : '';

  /**
   * Handles keyboard events for accessibility
   * Closes modal on Escape key press
   *
   * @param {KeyboardEvent} event - Keyboard event
   */
  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  /**
   * Handles click on the overlay to close modal
   *
   * @param {MouseEvent} event - Mouse click event
   */
  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  /**
   * Handles click on a speaker to navigate to speakers page
   *
   * @param {string} speakerId - The speaker's ID
   */
  const handleSpeakerClick = (speakerId) => {
    onClose();
    navigate(`${ROUTES.SPEAKERS}?highlight=${speakerId}`);
  };

  /**
   * Generates initials from a name for the placeholder avatar
   *
   * @param {string} name - Full name
   * @returns {string} First letter of the name
   */
  const getInitials = (name) => {
    return name.charAt(0).toUpperCase();
  };

  /**
   * Formats the time range for display
   *
   * @returns {string} Formatted time range
   */
  const getTimeDisplay = () => {
    if (!session) return '';
    if (session.endTime) {
      return `${session.time} - ${session.endTime}`;
    }
    return session.time;
  };

  /**
   * Gets speaker object by ID from the speakers array
   *
   * @param {string} speakerId - Speaker ID to find
   * @returns {Object|undefined} Speaker object if found
   */
  const getSpeakerById = (speakerId) => {
    return speakers.find((s) => s.id === speakerId);
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !session) {
    return null;
  }

  return (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-modal-title"
    >
      <div className={styles.modal}>
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close modal"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className={styles.content}>
          {/* Type/Category Badge */}
          <div className={styles.badges}>
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

          {/* Title */}
          <h2 id="session-modal-title" className={styles.title}>
            {session.title}
          </h2>

          {/* Capacity Status for Workshops */}
          {isWorkshop && (
            <div className={styles.capacitySection}>
              <CapacityBadge
                capacity={session.capacity}
                registeredCount={session.registeredCount || 0}
                showRemaining={true}
              />
            </div>
          )}

          {/* Time and Venue */}
          <div className={styles.details}>
            <div className={styles.detailItem}>
              <svg
                className={styles.detailIcon}
                width="18"
                height="18"
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
              <span>{getTimeDisplay()}</span>
            </div>

            {session.venue && (
              <div className={styles.detailItem}>
                <svg
                  className={styles.detailIcon}
                  width="18"
                  height="18"
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
                <span>{session.venue}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {session.description && (
            <div className={styles.descriptionSection}>
              <h3 className={styles.sectionLabel}>
                {isWorkshop ? 'About this workshop' : 'About'}
              </h3>
              <p className={styles.description}>{session.description}</p>
            </div>
          )}

          {/* Speakers/Facilitators */}
          {session.speakerIds && session.speakerIds.length > 0 && (
            <div className={styles.speakersSection}>
              <h3 className={styles.sectionLabel}>
                {isWorkshop
                  ? session.speakerIds.length > 1 ? 'Facilitators' : 'Facilitator'
                  : session.speakerIds.length > 1 ? 'Speakers' : 'Speaker'}
              </h3>
              <div className={styles.speakersList}>
                {session.speakerIds.map((speakerId, index) => {
                  const speaker = getSpeakerById(speakerId);
                  const speakerName = session.speakerNames?.[index] || speakerId;

                  return (
                    <button
                      key={speakerId}
                      className={styles.speakerItem}
                      onClick={() => handleSpeakerClick(speakerId)}
                      aria-label={`View profile of ${speakerName}`}
                    >
                      <div className={styles.speakerImage}>
                        {speaker?.photoUrl ? (
                          <img
                            src={speaker.photoUrl}
                            alt={speakerName}
                            className={styles.speakerPhoto}
                          />
                        ) : (
                          <div className={styles.speakerPlaceholder}>
                            <span>{getInitials(speakerName)}</span>
                          </div>
                        )}
                      </div>
                      <div className={styles.speakerInfo}>
                        <span className={styles.speakerName}>{speakerName}</span>
                        {speaker?.title && (
                          <span className={styles.speakerTitle}>{speaker.title}</span>
                        )}
                      </div>
                      <svg
                        className={styles.speakerArrow}
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.closeButtonText} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

SessionDetailModal.propTypes = {
  session: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    time: PropTypes.string.isRequired,
    endTime: PropTypes.string,
    sessionType: PropTypes.string.isRequired,
    venue: PropTypes.string,
    speakerIds: PropTypes.arrayOf(PropTypes.string),
    speakerNames: PropTypes.arrayOf(PropTypes.string),
    category: PropTypes.string,
    capacity: PropTypes.number,
    registeredCount: PropTypes.number,
  }),
  speakers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      title: PropTypes.string,
      photoUrl: PropTypes.string,
    })
  ),
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default SessionDetailModal;
