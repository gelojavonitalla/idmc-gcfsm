/**
 * SessionFormModal Component
 * Modal for creating and editing sessions.
 *
 * @module components/admin/SessionFormModal
 */

import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  SESSION_TYPES,
  SESSION_TYPE_LABELS,
  SESSION_STATUS,
} from '../../constants';
import { generateSlug } from '../../utils';
import BaseFormModal from './BaseFormModal';
import styles from './SessionFormModal.module.css';

/**
 * Initial form state for new sessions
 */
const INITIAL_FORM_STATE = {
  title: '',
  description: '',
  sessionType: SESSION_TYPES.PLENARY,
  day: 1,
  startTime: '09:00',
  endTime: '10:00',
  venue: '',
  speakerNames: '',
  order: 1,
  status: SESSION_STATUS.DRAFT,
};

/**
 * SessionFormModal Component
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Callback to close modal
 * @param {Function} props.onSave - Callback when session is saved
 * @param {Object|null} props.session - Session to edit (null for new)
 * @returns {JSX.Element|null} The modal or null if not open
 */
function SessionFormModal({ isOpen, onClose, onSave, session }) {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const titleInputRef = useRef(null);

  const isEditing = !!session;

  /**
   * Initialize form when modal opens or session changes
   */
  useEffect(() => {
    if (isOpen) {
      if (session) {
        setFormData({
          title: session.title || '',
          description: session.description || '',
          sessionType: session.sessionType || SESSION_TYPES.PLENARY,
          day: session.day || 1,
          startTime: session.startTime || '09:00',
          endTime: session.endTime || '10:00',
          venue: session.venue || '',
          speakerNames: session.speakerNames?.join(', ') || '',
          order: session.order || 1,
          status: session.status || SESSION_STATUS.DRAFT,
        });
      } else {
        setFormData(INITIAL_FORM_STATE);
      }
      setError(null);
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, session]);

  /**
   * Handles input changes
   *
   * @param {Event} event - Change event
   */
  const handleChange = (event) => {
    const { name, value, type } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  /**
   * Calculates duration in minutes
   *
   * @param {string} startTime - Start time in HH:MM format
   * @param {string} endTime - End time in HH:MM format
   * @returns {number} Duration in minutes
   */
  const calculateDuration = (startTime, endTime) => {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    const startTotal = startHours * 60 + startMinutes;
    const endTotal = endHours * 60 + endMinutes;
    return endTotal - startTotal;
  };

  /**
   * Handles form submission
   *
   * @param {Event} event - Submit event
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const sessionId = session?.id || generateSlug(formData.title);

      if (!sessionId) {
        throw new Error('Session title is required to generate an ID');
      }

      const speakerNamesArray = formData.speakerNames
        .split(',')
        .map((name) => name.trim())
        .filter((name) => name.length > 0);

      const durationMinutes = calculateDuration(
        formData.startTime,
        formData.endTime
      );

      await onSave(sessionId, {
        sessionId,
        title: formData.title,
        description: formData.description,
        sessionType: formData.sessionType,
        day: formData.day,
        startTime: formData.startTime,
        endTime: formData.endTime,
        durationMinutes,
        venue: formData.venue,
        speakerIds: session?.speakerIds || [],
        speakerNames: speakerNamesArray,
        order: formData.order,
        status: formData.status,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save session. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Session"
      modalId="session-modal"
      isEditing={isEditing}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      error={error}
    >
      <div className={styles.formGrid}>
        {/* Title */}
        <div className={`${styles.field} ${styles.fullWidth}`}>
          <label htmlFor="title" className={styles.label}>
            Session Title <span className={styles.required}>*</span>
          </label>
          <input
            ref={titleInputRef}
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={styles.input}
            placeholder="e.g., Plenary Session 1"
            required
          />
        </div>

        {/* Session Type */}
        <div className={styles.field}>
          <label htmlFor="sessionType" className={styles.label}>
            Session Type <span className={styles.required}>*</span>
          </label>
          <select
            id="sessionType"
            name="sessionType"
            value={formData.sessionType}
            onChange={handleChange}
            className={styles.select}
            required
          >
            {Object.entries(SESSION_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Venue */}
        <div className={styles.field}>
          <label htmlFor="venue" className={styles.label}>
            Venue
          </label>
          <input
            type="text"
            id="venue"
            name="venue"
            value={formData.venue}
            onChange={handleChange}
            className={styles.input}
            placeholder="e.g., Worship Hall"
          />
        </div>

        {/* Start Time */}
        <div className={styles.field}>
          <label htmlFor="startTime" className={styles.label}>
            Start Time <span className={styles.required}>*</span>
          </label>
          <input
            type="time"
            id="startTime"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            className={styles.input}
            required
          />
        </div>

        {/* End Time */}
        <div className={styles.field}>
          <label htmlFor="endTime" className={styles.label}>
            End Time <span className={styles.required}>*</span>
          </label>
          <input
            type="time"
            id="endTime"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            className={styles.input}
            required
          />
        </div>

        {/* Day */}
        <div className={styles.field}>
          <label htmlFor="day" className={styles.label}>
            Day
          </label>
          <input
            type="number"
            id="day"
            name="day"
            value={formData.day}
            onChange={handleChange}
            className={styles.input}
            min="1"
          />
        </div>

        {/* Order */}
        <div className={styles.field}>
          <label htmlFor="order" className={styles.label}>
            Display Order
          </label>
          <input
            type="number"
            id="order"
            name="order"
            value={formData.order}
            onChange={handleChange}
            className={styles.input}
            min="1"
          />
          <span className={styles.hint}>
            Lower numbers appear first
          </span>
        </div>

        {/* Status */}
        <div className={styles.field}>
          <label htmlFor="status" className={styles.label}>
            Status <span className={styles.required}>*</span>
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className={styles.select}
            required
          >
            <option value={SESSION_STATUS.DRAFT}>Draft</option>
            <option value={SESSION_STATUS.PUBLISHED}>Published</option>
          </select>
        </div>

        {/* Speaker Names */}
        <div className={`${styles.field} ${styles.fullWidth}`}>
          <label htmlFor="speakerNames" className={styles.label}>
            Speaker Names
          </label>
          <input
            type="text"
            id="speakerNames"
            name="speakerNames"
            value={formData.speakerNames}
            onChange={handleChange}
            className={styles.input}
            placeholder="e.g., Rev. Dr. John Smith, Teacher Jane Doe"
          />
          <span className={styles.hint}>
            Separate multiple names with commas
          </span>
        </div>

        {/* Description */}
        <div className={`${styles.field} ${styles.fullWidth}`}>
          <label htmlFor="description" className={styles.label}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={styles.textarea}
            placeholder="Session description..."
            rows={4}
          />
        </div>
      </div>
    </BaseFormModal>
  );
}

SessionFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  session: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    sessionType: PropTypes.string,
    day: PropTypes.number,
    startTime: PropTypes.string,
    endTime: PropTypes.string,
    venue: PropTypes.string,
    speakerIds: PropTypes.arrayOf(PropTypes.string),
    speakerNames: PropTypes.arrayOf(PropTypes.string),
    order: PropTypes.number,
    status: PropTypes.string,
  }),
};

SessionFormModal.defaultProps = {
  session: null,
};

export default SessionFormModal;
