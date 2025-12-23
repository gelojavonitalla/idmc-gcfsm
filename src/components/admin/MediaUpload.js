/**
 * MediaUpload Component
 * Reusable component for uploading images and videos to Firebase Storage.
 *
 * @module components/admin/MediaUpload
 */

import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { validateFile } from '../../services/storage';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZES } from '../../constants';
import styles from './MediaUpload.module.css';

/**
 * MediaUpload Component
 *
 * @param {Object} props - Component props
 * @param {string} props.type - Type of media ('image' or 'video')
 * @param {string} props.currentUrl - Current media URL (if any)
 * @param {Function} props.onUpload - Callback when file is uploaded (receives File)
 * @param {Function} props.onRemove - Callback when media is removed
 * @param {boolean} props.isUploading - Whether upload is in progress
 * @param {number} props.uploadProgress - Upload progress (0-100)
 * @param {string} props.error - Error message to display
 * @param {string} props.label - Label for the upload field
 * @param {string} props.hint - Hint text to display
 * @param {boolean} props.disabled - Whether the component is disabled
 * @returns {JSX.Element} The media upload component
 */
function MediaUpload({
  type,
  currentUrl,
  onUpload,
  onRemove,
  isUploading,
  uploadProgress,
  error,
  label,
  hint,
  disabled,
}) {
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const fileInputRef = useRef(null);

  const isImage = type === 'image';
  const allowedTypes = isImage ? ALLOWED_FILE_TYPES.IMAGES : ALLOWED_FILE_TYPES.VIDEOS;
  const maxSize = isImage ? MAX_FILE_SIZES.IMAGE : MAX_FILE_SIZES.VIDEO;
  const maxSizeMB = maxSize / (1024 * 1024);
  const acceptString = allowedTypes.join(',');

  /**
   * Handles file selection
   *
   * @param {File} file - Selected file
   */
  const handleFile = (file) => {
    setValidationError(null);

    const validation = validateFile(file, type);
    if (!validation.valid) {
      setValidationError(validation.error);
      return;
    }

    onUpload(file);
  };

  /**
   * Handles file input change
   *
   * @param {Event} event - Change event
   */
  const handleInputChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Reset input so same file can be selected again
    event.target.value = '';
  };

  /**
   * Handles drag events
   *
   * @param {Event} event - Drag event
   */
  const handleDrag = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (disabled || isUploading) {
      return;
    }

    if (event.type === 'dragenter' || event.type === 'dragover') {
      setDragActive(true);
    } else if (event.type === 'dragleave') {
      setDragActive(false);
    }
  };

  /**
   * Handles file drop
   *
   * @param {Event} event - Drop event
   */
  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    if (disabled || isUploading) {
      return;
    }

    const file = event.dataTransfer?.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  /**
   * Opens file picker
   */
  const openFilePicker = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const displayError = error || validationError;

  return (
    <div className={styles.container}>
      {label && <label className={styles.label}>{label}</label>}

      {currentUrl && !isUploading ? (
        <div className={styles.preview}>
          {isImage ? (
            <img src={currentUrl} alt="Preview" className={styles.previewImage} />
          ) : (
            <video src={currentUrl} controls className={styles.previewVideo}>
              <track kind="captions" />
            </video>
          )}
          <div className={styles.previewActions}>
            <button
              type="button"
              className={styles.changeButton}
              onClick={openFilePicker}
              disabled={disabled}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Change
            </button>
            <button
              type="button"
              className={styles.removeButton}
              onClick={onRemove}
              disabled={disabled}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`${styles.dropzone} ${dragActive ? styles.dragActive : ''} ${isUploading ? styles.uploading : ''} ${disabled ? styles.disabled : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFilePicker}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => e.key === 'Enter' && openFilePicker()}
        >
          {isUploading ? (
            <div className={styles.uploadingState}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className={styles.progressText}>Uploading... {uploadProgress}%</span>
            </div>
          ) : (
            <>
              <div className={styles.dropzoneIcon}>
                {isImage ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                )}
              </div>
              <p className={styles.dropzoneText}>
                <span className={styles.dropzonePrimary}>
                  Click to upload or drag and drop
                </span>
                <span className={styles.dropzoneSecondary}>
                  {isImage
                    ? `PNG, JPG, GIF, or WebP (max ${maxSizeMB}MB)`
                    : `MP4, WebM, or QuickTime (max ${maxSizeMB}MB)`}
                </span>
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptString}
        onChange={handleInputChange}
        className={styles.hiddenInput}
        disabled={disabled || isUploading}
      />

      {hint && !displayError && <span className={styles.hint}>{hint}</span>}
      {displayError && <span className={styles.error}>{displayError}</span>}
    </div>
  );
}

MediaUpload.propTypes = {
  type: PropTypes.oneOf(['image', 'video']).isRequired,
  currentUrl: PropTypes.string,
  onUpload: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  isUploading: PropTypes.bool,
  uploadProgress: PropTypes.number,
  error: PropTypes.string,
  label: PropTypes.string,
  hint: PropTypes.string,
  disabled: PropTypes.bool,
};

MediaUpload.defaultProps = {
  currentUrl: null,
  isUploading: false,
  uploadProgress: 0,
  error: null,
  label: null,
  hint: null,
  disabled: false,
};

export default MediaUpload;
