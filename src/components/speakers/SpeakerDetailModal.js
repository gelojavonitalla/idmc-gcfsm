import { useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import styles from './SpeakerDetailModal.module.css';

/**
 * SpeakerDetailModal Component
 * Modal component that displays detailed speaker information including
 * full bio, photo, title, organization, and assigned session.
 *
 * @param {Object} props - Component props
 * @param {Object} props.speaker - Speaker data object
 * @param {string} props.speaker.id - Unique speaker identifier
 * @param {string} props.speaker.name - Speaker's full name
 * @param {string} props.speaker.title - Speaker's title/designation
 * @param {string} props.speaker.organization - Speaker's organization
 * @param {string} props.speaker.bio - Speaker's full biography
 * @param {string} [props.speaker.photoUrl] - URL to speaker's photo
 * @param {string} [props.speaker.sessionTitle] - Session title for the speaker
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback to close the modal
 * @returns {JSX.Element|null} The modal component or null if closed
 */
function SpeakerDetailModal({ speaker, isOpen, onClose }) {
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
   * Generates initials from a speaker's name for the placeholder avatar
   *
   * @param {string} name - Full name of the speaker
   * @returns {string} First letter of the first name
   */
  const getInitials = (name) => {
    return name.charAt(0).toUpperCase();
  };

  // Set up keyboard event listener and body scroll lock
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

  if (!isOpen || !speaker) {
    return null;
  }

  return (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="speaker-modal-title"
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
          <div className={styles.header}>
            <div className={styles.imageContainer}>
              {speaker.photoUrl ? (
                <img
                  src={speaker.photoUrl}
                  alt={speaker.name}
                  className={styles.image}
                />
              ) : (
                <div className={styles.placeholder}>
                  <span>{getInitials(speaker.name)}</span>
                </div>
              )}
            </div>
            <div className={styles.headerInfo}>
              <h2 id="speaker-modal-title" className={styles.name}>
                {speaker.name}
              </h2>
              <p className={styles.title}>{speaker.title}</p>
              <p className={styles.organization}>{speaker.organization}</p>
            </div>
          </div>

          {speaker.sessionTitle && (
            <div className={styles.session}>
              <h3 className={styles.sessionLabel}>Session</h3>
              <p className={styles.sessionTitle}>{speaker.sessionTitle}</p>
            </div>
          )}

          <div className={styles.bioSection}>
            <h3 className={styles.bioLabel}>About</h3>
            <p className={styles.bio}>{speaker.bio}</p>
          </div>
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

SpeakerDetailModal.propTypes = {
  speaker: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    organization: PropTypes.string.isRequired,
    bio: PropTypes.string.isRequired,
    photoUrl: PropTypes.string,
    sessionTitle: PropTypes.string,
  }),
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default SpeakerDetailModal;
