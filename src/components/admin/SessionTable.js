/**
 * SessionTable Component
 * Displays a table of sessions for admin management.
 *
 * @module components/admin/SessionTable
 */

import PropTypes from 'prop-types';
import { SESSION_STATUS, SESSION_TYPE_LABELS, SESSION_TYPE_COLORS } from '../../constants';
import styles from './SessionTable.module.css';

/**
 * SessionTable Component
 *
 * @param {Object} props - Component props
 * @param {Array} props.sessions - Array of session objects
 * @param {Function} props.onEdit - Callback when edit is clicked
 * @param {Function} props.onDelete - Callback when delete is clicked
 * @param {Function} props.onToggleStatus - Callback when status is toggled
 * @param {boolean} props.isLoading - Whether data is loading
 * @returns {JSX.Element} The session table component
 */
function SessionTable({ sessions, onEdit, onDelete, onToggleStatus, isLoading }) {
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.skeleton} />
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <p>No sessions found</p>
          <span className={styles.emptyHint}>
            Click &quot;Add Session&quot; to create your first session
          </span>
        </div>
      </div>
    );
  }

  /**
   * Formats time for display
   *
   * @param {string} time - Time in HH:MM format
   * @returns {string} Formatted time (e.g., "9:00 AM")
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
   * Gets the style for a session type badge
   *
   * @param {string} sessionType - Session type
   * @returns {Object} Style object
   */
  const getTypeStyle = (sessionType) => {
    const colors = SESSION_TYPE_COLORS[sessionType];
    if (!colors) {
      return {
        background: '#f3f4f6',
        color: '#6b7280',
      };
    }
    return {
      background: colors.background,
      color: colors.text,
    };
  };

  return (
    <div className={styles.container}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '60px' }}>Order</th>
              <th>Session</th>
              <th>Time</th>
              <th>Type</th>
              <th>Venue</th>
              <th>Speakers</th>
              <th>Status</th>
              <th style={{ width: '100px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id}>
                <td className={styles.orderCell}>{session.order}</td>
                <td>
                  <div className={styles.sessionInfo}>
                    <span className={styles.sessionTitle}>{session.title}</span>
                    {session.description && (
                      <span className={styles.sessionDescription}>
                        {session.description.substring(0, 60)}
                        {session.description.length > 60 ? '...' : ''}
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <div className={styles.timeInfo}>
                    <span className={styles.timeRange}>
                      {formatTime(session.startTime)} - {formatTime(session.endTime)}
                    </span>
                    {session.durationMinutes && (
                      <span className={styles.duration}>
                        {session.durationMinutes} min
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <span
                    className={styles.typeBadge}
                    style={getTypeStyle(session.sessionType)}
                  >
                    {SESSION_TYPE_LABELS[session.sessionType] || session.sessionType}
                  </span>
                </td>
                <td className={styles.venue}>{session.venue || '-'}</td>
                <td className={styles.speakers}>
                  {session.speakerNames?.length > 0
                    ? session.speakerNames.join(', ')
                    : '-'}
                </td>
                <td>
                  <button
                    className={`${styles.statusBadge} ${
                      session.status === SESSION_STATUS.PUBLISHED
                        ? styles.statusPublished
                        : styles.statusDraft
                    }`}
                    onClick={() => onToggleStatus(session.id)}
                    title={`Click to ${
                      session.status === SESSION_STATUS.PUBLISHED
                        ? 'unpublish'
                        : 'publish'
                    }`}
                  >
                    {session.status === SESSION_STATUS.PUBLISHED
                      ? 'Published'
                      : 'Draft'}
                  </button>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button
                      className={styles.editButton}
                      onClick={() => onEdit(session)}
                      title="Edit session"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => onDelete(session.id)}
                      title="Delete session"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

SessionTable.propTypes = {
  sessions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      sessionType: PropTypes.string.isRequired,
      startTime: PropTypes.string,
      endTime: PropTypes.string,
      durationMinutes: PropTypes.number,
      venue: PropTypes.string,
      speakerIds: PropTypes.arrayOf(PropTypes.string),
      speakerNames: PropTypes.arrayOf(PropTypes.string),
      order: PropTypes.number,
      status: PropTypes.string,
    })
  ),
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onToggleStatus: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

SessionTable.defaultProps = {
  sessions: [],
  isLoading: false,
};

export default SessionTable;
