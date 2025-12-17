/**
 * SpeakerFormModal Component
 * Modal for creating and editing speakers.
 *
 * @module components/admin/SpeakerFormModal
 */

import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { SESSION_TYPES, SESSION_TYPE_LABELS, SPEAKER_STATUS } from '../../constants';
import { generateSlug } from '../../utils';
import MediaUpload from './MediaUpload';
import { uploadSpeakerPhoto, deleteFile } from '../../services/storage';
import BaseFormModal from './BaseFormModal';
import styles from './SpeakerFormModal.module.css';

/**
 * Initial form state for new speakers
 */
const INITIAL_FORM_STATE = {
  name: '',
  title: '',
  organization: '',
  bio: '',
  photoUrl: '',
  sessionType: SESSION_TYPES.PLENARY,
  sessionTitle: '',
  featured: false,
  order: 1,
  status: SPEAKER_STATUS.DRAFT,
};

/**
 * SpeakerFormModal Component
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Callback to close modal
 * @param {Function} props.onSave - Callback when speaker is saved
 * @param {Object|null} props.speaker - Speaker to edit (null for new)
 * @returns {JSX.Element|null} The modal or null if not open
 */
function SpeakerFormModal({ isOpen, onClose, onSave, speaker }) {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const nameInputRef = useRef(null);

  // Photo upload states
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoProgress, setPhotoProgress] = useState(0);
  const [photoError, setPhotoError] = useState(null);

  const isEditing = !!speaker;

  /**
   * Initialize form when modal opens or speaker changes
   */
  useEffect(() => {
    if (isOpen) {
      if (speaker) {
        setFormData({
          name: speaker.name || '',
          title: speaker.title || '',
          organization: speaker.organization || '',
          bio: speaker.bio || '',
          photoUrl: speaker.photoUrl || '',
          sessionType: speaker.sessionType || SESSION_TYPES.PLENARY,
          sessionTitle: speaker.sessionTitle || '',
          featured: speaker.featured || false,
          order: speaker.order || 1,
          status: speaker.status || SPEAKER_STATUS.DRAFT,
        });
      } else {
        setFormData(INITIAL_FORM_STATE);
      }
      setError(null);
      setPhotoError(null);
      setPhotoUploading(false);
      setPhotoProgress(0);
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, speaker]);

  /**
   * Handles input changes
   *
   * @param {Event} event - Change event
   */
  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    }));
  };

  /**
   * Handles speaker photo upload
   *
   * @param {File} file - Image file to upload
   */
  const handlePhotoUpload = async (file) => {
    setPhotoUploading(true);
    setPhotoProgress(0);
    setPhotoError(null);

    try {
      const speakerId = speaker?.id || generateSlug(formData.name);

      if (!speakerId) {
        throw new Error('Please enter a speaker name first');
      }

      if (formData.photoUrl) {
        try {
          await deleteFile(formData.photoUrl);
        } catch {
          // Ignore delete errors
        }
      }

      const downloadUrl = await uploadSpeakerPhoto(file, speakerId, setPhotoProgress);
      setFormData((prev) => ({ ...prev, photoUrl: downloadUrl }));
    } catch (uploadError) {
      setPhotoError(uploadError.message);
    } finally {
      setPhotoUploading(false);
    }
  };

  /**
   * Handles speaker photo removal
   */
  const handlePhotoRemove = async () => {
    if (formData.photoUrl) {
      try {
        await deleteFile(formData.photoUrl);
      } catch {
        // Ignore delete errors
      }
    }
    setFormData((prev) => ({ ...prev, photoUrl: '' }));
    setPhotoError(null);
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
      const speakerId = speaker?.id || generateSlug(formData.name);

      if (!speakerId) {
        throw new Error('Speaker name is required to generate an ID');
      }

      await onSave(speakerId, {
        ...formData,
        speakerId,
        sessionIds: speaker?.sessionIds || [],
        sessionTitles: formData.sessionTitle ? [formData.sessionTitle] : [],
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save speaker. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Speaker"
      modalId="speaker-modal"
      isEditing={isEditing}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      error={error}
    >
      <div className={styles.formGrid}>
        {/* Name */}
        <div className={styles.field}>
          <label htmlFor="name" className={styles.label}>
            Full Name <span className={styles.required}>*</span>
          </label>
          <input
            ref={nameInputRef}
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={styles.input}
            placeholder="e.g., Rev. Dr. John Smith"
            required
          />
        </div>

        {/* Title */}
        <div className={styles.field}>
          <label htmlFor="title" className={styles.label}>
            Title/Position
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={styles.input}
            placeholder="e.g., Senior Pastor"
          />
        </div>

        {/* Organization */}
        <div className={styles.field}>
          <label htmlFor="organization" className={styles.label}>
            Organization
          </label>
          <input
            type="text"
            id="organization"
            name="organization"
            value={formData.organization}
            onChange={handleChange}
            className={styles.input}
            placeholder="e.g., GCF South Metro"
          />
        </div>

        {/* Speaker Photo */}
        <div className={styles.fieldSpan2}>
          <MediaUpload
            type="image"
            label="Speaker Photo"
            currentUrl={formData.photoUrl}
            onUpload={handlePhotoUpload}
            onRemove={handlePhotoRemove}
            isUploading={photoUploading}
            uploadProgress={photoProgress}
            error={photoError}
            hint="Square photo recommended (at least 400x400 pixels)"
            disabled={isSubmitting}
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
            <option value={SESSION_TYPES.PLENARY}>
              {SESSION_TYPE_LABELS[SESSION_TYPES.PLENARY]}
            </option>
            <option value={SESSION_TYPES.WORKSHOP}>
              {SESSION_TYPE_LABELS[SESSION_TYPES.WORKSHOP]}
            </option>
          </select>
        </div>

        {/* Session Title */}
        <div className={styles.field}>
          <label htmlFor="sessionTitle" className={styles.label}>
            Session Title
          </label>
          <input
            type="text"
            id="sessionTitle"
            name="sessionTitle"
            value={formData.sessionTitle}
            onChange={handleChange}
            className={styles.input}
            placeholder="e.g., Plenary Session or Workshop Title"
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
            <option value={SPEAKER_STATUS.DRAFT}>Draft</option>
            <option value={SPEAKER_STATUS.PUBLISHED}>Published</option>
          </select>
        </div>
      </div>

      {/* Bio - Full width */}
      <div className={styles.field}>
        <label htmlFor="bio" className={styles.label}>
          Biography
        </label>
        <textarea
          id="bio"
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          className={styles.textarea}
          placeholder="Speaker biography..."
          rows={5}
        />
      </div>

      {/* Featured checkbox */}
      <div className={styles.checkboxField}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            name="featured"
            checked={formData.featured}
            onChange={handleChange}
            className={styles.checkbox}
          />
          <span className={styles.checkboxText}>Featured Speaker</span>
        </label>
        <span className={styles.hint}>
          Featured speakers are highlighted on the public speakers page
        </span>
      </div>
    </BaseFormModal>
  );
}

SpeakerFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  speaker: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    title: PropTypes.string,
    organization: PropTypes.string,
    bio: PropTypes.string,
    photoUrl: PropTypes.string,
    sessionType: PropTypes.string,
    sessionTitle: PropTypes.string,
    sessionIds: PropTypes.arrayOf(PropTypes.string),
    featured: PropTypes.bool,
    order: PropTypes.number,
    status: PropTypes.string,
  }),
};

SpeakerFormModal.defaultProps = {
  speaker: null,
};

export default SpeakerFormModal;
