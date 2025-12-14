/**
 * RoomDetailPanel Component
 * Sliding panel that displays detailed information about a selected room
 * including capacity, features, and scheduled sessions.
 *
 * @module components/venue/RoomDetailPanel
 */

import { useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { ROOM_TYPES, ROOM_TYPE_LABELS } from './floorPlanData';
import styles from './RoomDetailPanel.module.css';

/**
 * RoomDetailPanel Component
 * Renders a sliding panel with room details and sessions.
 *
 * @param {Object} props - Component props
 * @param {Object} props.room - Room data object
 * @param {Array} props.sessions - Sessions scheduled in this room
 * @param {boolean} props.isOpen - Whether the panel is open
 * @param {Function} props.onClose - Callback to close the panel
 * @returns {JSX.Element|null} The panel component or null if closed
 */
function RoomDetailPanel({ room, sessions, isOpen, onClose }) {
  /**
   * Handles keyboard events for accessibility
   * Closes panel on Escape key press
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
   * Handles click on the overlay to close panel
   *
   * @param {MouseEvent} event - Mouse click event
   */
  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  /**
   * Gets the appropriate icon for a room type
   *
   * @param {string} type - Room type from ROOM_TYPES
   * @returns {JSX.Element} SVG icon element
   */
  const getRoomTypeIcon = (type) => {
    switch (type) {
      case ROOM_TYPES.MAIN:
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        );
      case ROOM_TYPES.WORKSHOP:
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case ROOM_TYPES.SERVICE:
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        );
      default:
        return null;
    }
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

  if (!isOpen || !room) {
    return null;
  }

  return (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="room-panel-title"
    >
      <div className={`${styles.panel} ${styles[`panel${room.type.charAt(0).toUpperCase() + room.type.slice(1)}`]}`}>
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close panel"
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
          {/* Header */}
          <div className={styles.header}>
            <div className={`${styles.typeIcon} ${styles[`typeIcon${room.type.charAt(0).toUpperCase() + room.type.slice(1)}`]}`}>
              {getRoomTypeIcon(room.type)}
            </div>
            <div className={styles.headerInfo}>
              <span className={styles.typeBadge}>
                {ROOM_TYPE_LABELS[room.type]}
              </span>
              <h2 id="room-panel-title" className={styles.roomName}>
                {room.name}
              </h2>
              <p className={styles.floor}>{room.floor}</p>
            </div>
          </div>

          {/* Capacity */}
          <div className={styles.capacitySection}>
            <div className={styles.capacityIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className={styles.capacityInfo}>
              <span className={styles.capacityLabel}>Capacity</span>
              <span className={styles.capacityValue}>{room.capacity} people</span>
            </div>
          </div>

          {/* Description */}
          <div className={styles.descriptionSection}>
            <p className={styles.description}>{room.description}</p>
          </div>

          {/* Workshop Track (if applicable) */}
          {room.workshopTrack && (
            <div className={styles.workshopTrack}>
              <span className={styles.workshopTrackLabel}>Workshop Track</span>
              <span className={styles.workshopTrackValue}>{room.workshopTrack}</span>
            </div>
          )}

          {/* Sessions */}
          {sessions && sessions.length > 0 && (
            <div className={styles.sessionsSection}>
              <h3 className={styles.sectionTitle}>Scheduled Sessions</h3>
              <div className={styles.sessionsList}>
                {sessions.map((session) => (
                  <div key={session.id} className={styles.sessionCard}>
                    <div className={styles.sessionTime}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {session.time}
                      {session.endTime && ` - ${session.endTime}`}
                    </div>
                    <h4 className={styles.sessionTitle}>{session.title}</h4>
                    {session.speakerNames && session.speakerNames.length > 0 && (
                      <p className={styles.sessionSpeaker}>
                        {session.speakerNames.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Session Types */}
          <div className={styles.sessionTypesSection}>
            <h3 className={styles.sectionTitle}>Used For</h3>
            <div className={styles.sessionTypesList}>
              {room.sessionTypes.map((type, index) => (
                <span key={index} className={styles.sessionTypeBadge}>
                  {type}
                </span>
              ))}
            </div>
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

RoomDetailPanel.propTypes = {
  room: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.oneOf(Object.values(ROOM_TYPES)).isRequired,
    floor: PropTypes.string.isRequired,
    capacity: PropTypes.number.isRequired,
    description: PropTypes.string.isRequired,
    features: PropTypes.arrayOf(PropTypes.string),
    sessionTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
    workshopTrack: PropTypes.string,
  }),
  sessions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      time: PropTypes.string,
      endTime: PropTypes.string,
      speakerNames: PropTypes.arrayOf(PropTypes.string),
    })
  ),
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default RoomDetailPanel;
