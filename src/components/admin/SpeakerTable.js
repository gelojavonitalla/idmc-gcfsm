/**
 * SpeakerTable Component
 * Displays a table of speakers with actions for admin management.
 *
 * @module components/admin/SpeakerTable
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { SPEAKER_STATUS } from '../../constants';
import styles from './SpeakerTable.module.css';

/**
 * SpeakerTable Component
 *
 * @param {Object} props - Component props
 * @param {Array} props.speakers - Array of speaker objects
 * @param {Function} props.onEdit - Callback when edit is clicked
 * @param {Function} props.onDelete - Callback when delete is clicked
 * @param {Function} props.onToggleStatus - Callback to toggle publish status
 * @param {Function} props.onReorder - Callback when speakers are reordered via drag-and-drop
 * @param {boolean} props.isLoading - Loading state
 * @param {boolean} props.isReordering - Whether currently saving reorder
 * @returns {JSX.Element} The speaker table
 */
function SpeakerTable({ speakers, onEdit, onDelete, onToggleStatus, onReorder, isLoading, isReordering }) {
  /**
   * State for drag and drop
   */
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  /**
   * Handle drag start
   *
   * @param {DragEvent} e - Drag event
   * @param {string} speakerId - Speaker ID being dragged
   */
  const handleDragStart = (e, speakerId) => {
    setDraggedId(speakerId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', speakerId);
  };

  /**
   * Handle drag over
   *
   * @param {DragEvent} e - Drag event
   * @param {string} speakerId - Speaker ID being dragged over
   */
  const handleDragOver = (e, speakerId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (speakerId !== draggedId) {
      setDragOverId(speakerId);
    }
  };

  /**
   * Handle drag leave
   */
  const handleDragLeave = () => {
    setDragOverId(null);
  };

  /**
   * Handle drop
   *
   * @param {DragEvent} e - Drag event
   * @param {string} targetId - Target speaker ID
   */
  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (draggedId && targetId && draggedId !== targetId && onReorder) {
      const draggedIndex = speakers.findIndex((s) => s.id === draggedId);
      const targetIndex = speakers.findIndex((s) => s.id === targetId);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newOrder = [...speakers];
        const [removed] = newOrder.splice(draggedIndex, 1);
        newOrder.splice(targetIndex, 0, removed);
        onReorder(newOrder);
      }
    }
    setDraggedId(null);
    setDragOverId(null);
  };

  /**
   * Handle drag end
   */
  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  /**
   * Gets status badge class
   *
   * @param {string} status - Speaker status
   * @returns {string} Badge class name
   */
  const getStatusClass = (status) => {
    return status === SPEAKER_STATUS.PUBLISHED ? styles.statusPublished : styles.statusDraft;
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.skeleton} />
      </div>
    );
  }

  if (speakers.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
          <p>No speakers found</p>
          <p className={styles.emptyHint}>Click &quot;Add Speaker&quot; to create one.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '60px' }}>Order</th>
              <th>Speaker</th>
              <th>Title / Organization</th>
              <th>Session Type</th>
              <th>Status</th>
              <th style={{ width: '150px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {speakers.map((speaker, index) => (
              <tr
                key={speaker.id}
                draggable={!isReordering && !!onReorder}
                onDragStart={(e) => handleDragStart(e, speaker.id)}
                onDragOver={(e) => handleDragOver(e, speaker.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, speaker.id)}
                onDragEnd={handleDragEnd}
                className={`
                  ${draggedId === speaker.id ? styles.dragging : ''}
                  ${dragOverId === speaker.id ? styles.dragOver : ''}
                  ${isReordering ? styles.reordering : ''}
                `}
              >
                <td className={styles.orderCell}>
                  <div className={styles.orderContent}>
                    {onReorder && (
                      <span className={styles.dragHandle} title="Drag to reorder">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="8" y1="6" x2="16" y2="6" />
                          <line x1="8" y1="12" x2="16" y2="12" />
                          <line x1="8" y1="18" x2="16" y2="18" />
                        </svg>
                      </span>
                    )}
                    {index + 1}
                  </div>
                </td>
                <td>
                  <div className={styles.speakerInfo}>
                    <div className={styles.avatar}>
                      {speaker.photoUrl ? (
                        <img src={speaker.photoUrl} alt={speaker.name} />
                      ) : (
                        speaker.name?.charAt(0)?.toUpperCase() || '?'
                      )}
                    </div>
                    <div className={styles.speakerDetails}>
                      <span className={styles.speakerName}>
                        {speaker.name}
                        {speaker.featured && (
                          <span className={styles.featuredBadge}>Featured</span>
                        )}
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className={styles.titleOrg}>
                    <span className={styles.title}>{speaker.title || '-'}</span>
                    <span className={styles.org}>{speaker.organization || '-'}</span>
                  </div>
                </td>
                <td className={styles.sessionType}>
                  {speaker.sessionType || '-'}
                </td>
                <td>
                  <button
                    className={`${styles.statusBadge} ${getStatusClass(speaker.status)}`}
                    onClick={() => onToggleStatus(speaker.id, speaker.status)}
                    title={speaker.status === SPEAKER_STATUS.PUBLISHED ? 'Click to unpublish' : 'Click to publish'}
                  >
                    {speaker.status || 'draft'}
                  </button>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button
                      className={styles.editButton}
                      onClick={() => onEdit(speaker)}
                      title="Edit speaker"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => onDelete(speaker.id, speaker.name)}
                      title="Delete speaker"
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

SpeakerTable.propTypes = {
  speakers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      title: PropTypes.string,
      organization: PropTypes.string,
      sessionType: PropTypes.string,
      status: PropTypes.string,
      featured: PropTypes.bool,
      order: PropTypes.number,
      photoUrl: PropTypes.string,
    })
  ),
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onToggleStatus: PropTypes.func.isRequired,
  onReorder: PropTypes.func,
  isLoading: PropTypes.bool,
  isReordering: PropTypes.bool,
};

SpeakerTable.defaultProps = {
  speakers: [],
  isLoading: false,
  isReordering: false,
  onReorder: null,
};

export default SpeakerTable;
