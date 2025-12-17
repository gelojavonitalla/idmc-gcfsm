/**
 * DownloadFormModal Component
 * Modal for creating and editing downloadable files.
 *
 * @module components/admin/DownloadFormModal
 */

import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  DOWNLOAD_CATEGORIES,
  DOWNLOAD_CATEGORY_LABELS,
  DOWNLOAD_STATUS,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZES,
  THUMBNAIL_DIMENSIONS,
} from '../../constants';
import {
  uploadDownloadFile,
  uploadDownloadThumbnail,
  deleteFile,
  validateFile,
} from '../../services/storage';
import { formatFileSize } from '../../services/downloads';
import { generateSlug } from '../../utils';
import BaseFormModal from './BaseFormModal';
import styles from './DownloadFormModal.module.css';

/**
 * Initial form state for new downloads
 */
const INITIAL_FORM_STATE = {
  title: '',
  description: '',
  fileName: '',
  fileSize: '',
  fileType: 'PDF',
  category: DOWNLOAD_CATEGORIES.BOOKLET,
  downloadUrl: '',
  thumbnailUrl: '',
  order: 1,
  status: DOWNLOAD_STATUS.DRAFT,
};

/**
 * DownloadFormModal Component
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Callback to close modal
 * @param {Function} props.onSave - Callback when download is saved
 * @param {Object|null} props.download - Download to edit (null for new)
 * @returns {JSX.Element|null} The modal or null if not open
 */
function DownloadFormModal({ isOpen, onClose, onSave, download }) {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const titleInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // File upload states
  const [fileUploading, setFileUploading] = useState(false);
  const [fileProgress, setFileProgress] = useState(0);
  const [fileError, setFileError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Thumbnail upload states
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [thumbnailProgress, setThumbnailProgress] = useState(0);
  const [thumbnailError, setThumbnailError] = useState(null);
  const [thumbnailDragActive, setThumbnailDragActive] = useState(false);
  const thumbnailInputRef = useRef(null);

  const isEditing = !!download;

  /**
   * Initialize form when modal opens or download changes
   */
  useEffect(() => {
    if (isOpen) {
      if (download) {
        setFormData({
          title: download.title || '',
          description: download.description || '',
          fileName: download.fileName || '',
          fileSize: download.fileSize || '',
          fileType: download.fileType || 'PDF',
          category: download.category || DOWNLOAD_CATEGORIES.BOOKLET,
          downloadUrl: download.downloadUrl || '',
          thumbnailUrl: download.thumbnailUrl || '',
          order: download.order || 1,
          status: download.status || DOWNLOAD_STATUS.DRAFT,
        });
      } else {
        setFormData(INITIAL_FORM_STATE);
      }
      setError(null);
      setFileError(null);
      setFileUploading(false);
      setFileProgress(0);
      setThumbnailError(null);
      setThumbnailUploading(false);
      setThumbnailProgress(0);
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, download]);

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
   * Handles file selection
   *
   * @param {File} file - Selected file
   */
  const handleFile = async (file) => {
    setFileError(null);

    const validation = validateFile(file, 'document');
    if (!validation.valid) {
      setFileError(validation.error);
      return;
    }

    setFileUploading(true);
    setFileProgress(0);

    try {
      const downloadId = download?.id || generateSlug(formData.title) || `download-${Date.now()}`;

      // Delete old file if exists
      if (formData.downloadUrl) {
        try {
          await deleteFile(formData.downloadUrl);
        } catch {
          // Ignore delete errors
        }
      }

      const downloadUrl = await uploadDownloadFile(file, downloadId, setFileProgress);

      setFormData((prev) => ({
        ...prev,
        downloadUrl,
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        fileType: 'PDF',
      }));
    } catch (uploadError) {
      setFileError(uploadError.message);
    } finally {
      setFileUploading(false);
    }
  };

  /**
   * Handles file input change
   *
   * @param {Event} event - Change event
   */
  const handleFileInputChange = (event) => {
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

    if (isSubmitting || fileUploading) {
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

    if (isSubmitting || fileUploading) {
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
    if (!isSubmitting && !fileUploading) {
      fileInputRef.current?.click();
    }
  };

  /**
   * Handles file removal
   */
  const handleFileRemove = async () => {
    if (formData.downloadUrl) {
      try {
        await deleteFile(formData.downloadUrl);
      } catch {
        // Ignore delete errors
      }
    }
    setFormData((prev) => ({
      ...prev,
      downloadUrl: '',
      fileName: '',
      fileSize: '',
    }));
    setFileError(null);
  };

  /**
   * Handles thumbnail file selection
   *
   * @param {File} file - Selected thumbnail file
   */
  const handleThumbnail = async (file) => {
    setThumbnailError(null);

    const validation = validateFile(file, 'thumbnail');
    if (!validation.valid) {
      setThumbnailError(validation.error);
      return;
    }

    setThumbnailUploading(true);
    setThumbnailProgress(0);

    try {
      const downloadId = download?.id || generateSlug(formData.title) || `download-${Date.now()}`;

      // Delete old thumbnail if exists
      if (formData.thumbnailUrl) {
        try {
          await deleteFile(formData.thumbnailUrl);
        } catch {
          // Ignore delete errors
        }
      }

      const thumbnailUrl = await uploadDownloadThumbnail(file, downloadId, setThumbnailProgress);

      setFormData((prev) => ({
        ...prev,
        thumbnailUrl,
      }));
    } catch (uploadError) {
      setThumbnailError(uploadError.message);
    } finally {
      setThumbnailUploading(false);
    }
  };

  /**
   * Handles thumbnail input change
   *
   * @param {Event} event - Change event
   */
  const handleThumbnailInputChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      handleThumbnail(file);
    }
    // Reset input so same file can be selected again
    event.target.value = '';
  };

  /**
   * Handles thumbnail drag events
   *
   * @param {Event} event - Drag event
   */
  const handleThumbnailDrag = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (isSubmitting || thumbnailUploading) {
      return;
    }

    if (event.type === 'dragenter' || event.type === 'dragover') {
      setThumbnailDragActive(true);
    } else if (event.type === 'dragleave') {
      setThumbnailDragActive(false);
    }
  };

  /**
   * Handles thumbnail file drop
   *
   * @param {Event} event - Drop event
   */
  const handleThumbnailDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setThumbnailDragActive(false);

    if (isSubmitting || thumbnailUploading) {
      return;
    }

    const file = event.dataTransfer?.files?.[0];
    if (file) {
      handleThumbnail(file);
    }
  };

  /**
   * Opens thumbnail file picker
   */
  const openThumbnailPicker = () => {
    if (!isSubmitting && !thumbnailUploading) {
      thumbnailInputRef.current?.click();
    }
  };

  /**
   * Handles thumbnail removal
   */
  const handleThumbnailRemove = async () => {
    if (formData.thumbnailUrl) {
      try {
        await deleteFile(formData.thumbnailUrl);
      } catch {
        // Ignore delete errors
      }
    }
    setFormData((prev) => ({
      ...prev,
      thumbnailUrl: '',
    }));
    setThumbnailError(null);
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
      const downloadId = download?.id || generateSlug(formData.title);

      if (!downloadId) {
        throw new Error('Title is required to generate an ID');
      }

      await onSave(downloadId, {
        ...formData,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save download. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const maxSizeMB = MAX_FILE_SIZES.DOCUMENT / (1024 * 1024);
  const acceptString = ALLOWED_FILE_TYPES.DOCUMENTS.join(',');
  const displayError = fileError;

  const thumbnailMaxSizeMB = MAX_FILE_SIZES.THUMBNAIL / (1024 * 1024);
  const thumbnailAcceptString = ALLOWED_FILE_TYPES.IMAGES.join(',');

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Download"
      modalId="download-modal"
      isEditing={isEditing}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      error={error}
    >
      <div className={styles.formGrid}>
              {/* Title */}
              <div className={styles.fieldSpan2}>
                <label htmlFor="title" className={styles.label}>
                  Title <span className={styles.required}>*</span>
                </label>
                <input
                  ref={titleInputRef}
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="e.g., IDMC 2026 Conference Booklet"
                  required
                />
              </div>

              {/* Description */}
              <div className={styles.fieldSpan2}>
                <label htmlFor="description" className={styles.label}>
                  Description <span className={styles.required}>*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className={styles.textarea}
                  placeholder="Brief description of the download content..."
                  rows={3}
                  required
                />
              </div>

              {/* File Upload */}
              <div className={styles.fieldSpan2}>
                <label className={styles.label}>
                  File (PDF)
                </label>

                {formData.downloadUrl && !fileUploading ? (
                  <div className={styles.filePreview}>
                    <div className={styles.fileInfo}>
                      <div className={styles.fileIcon}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="12" y1="18" x2="12" y2="12" />
                          <polyline points="9 15 12 18 15 15" />
                        </svg>
                      </div>
                      <div className={styles.fileDetails}>
                        <span className={styles.fileName}>{formData.fileName}</span>
                        <span className={styles.fileSize}>{formData.fileSize}</span>
                      </div>
                    </div>
                    <div className={styles.fileActions}>
                      <button
                        type="button"
                        className={styles.changeButton}
                        onClick={openFilePicker}
                        disabled={isSubmitting}
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={handleFileRemove}
                        disabled={isSubmitting}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`${styles.dropzone} ${dragActive ? styles.dragActive : ''} ${fileUploading ? styles.uploading : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={openFilePicker}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && openFilePicker()}
                  >
                    {fileUploading ? (
                      <div className={styles.uploadingState}>
                        <div className={styles.progressBar}>
                          <div
                            className={styles.progressFill}
                            style={{ width: `${fileProgress}%` }}
                          />
                        </div>
                        <span className={styles.progressText}>Uploading... {fileProgress}%</span>
                      </div>
                    ) : (
                      <>
                        <div className={styles.dropzoneIcon}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="12" y1="18" x2="12" y2="12" />
                            <polyline points="9 15 12 18 15 15" />
                          </svg>
                        </div>
                        <p className={styles.dropzoneText}>
                          <span className={styles.dropzonePrimary}>
                            Click to upload or drag and drop
                          </span>
                          <span className={styles.dropzoneSecondary}>
                            PDF files only (max {maxSizeMB}MB)
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
                  onChange={handleFileInputChange}
                  className={styles.hiddenInput}
                  disabled={isSubmitting || fileUploading}
                />

                {displayError && <span className={styles.error}>{displayError}</span>}
                {!formData.downloadUrl && !fileUploading && (
                  <span className={styles.hint}>
                    Optional - Downloads without a file will show &quot;Available Soon&quot;
                  </span>
                )}
              </div>

              {/* Thumbnail Upload */}
              <div className={styles.fieldSpan2}>
                <label className={styles.label}>
                  Thumbnail Image
                </label>

                {formData.thumbnailUrl && !thumbnailUploading ? (
                  <div className={styles.thumbnailPreview}>
                    <img
                      src={formData.thumbnailUrl}
                      alt="Thumbnail preview"
                      className={styles.thumbnailImage}
                    />
                    <div className={styles.thumbnailActions}>
                      <button
                        type="button"
                        className={styles.changeButton}
                        onClick={openThumbnailPicker}
                        disabled={isSubmitting}
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={handleThumbnailRemove}
                        disabled={isSubmitting}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`${styles.dropzone} ${thumbnailDragActive ? styles.dragActive : ''} ${thumbnailUploading ? styles.uploading : ''}`}
                    onDragEnter={handleThumbnailDrag}
                    onDragLeave={handleThumbnailDrag}
                    onDragOver={handleThumbnailDrag}
                    onDrop={handleThumbnailDrop}
                    onClick={openThumbnailPicker}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && openThumbnailPicker()}
                  >
                    {thumbnailUploading ? (
                      <div className={styles.uploadingState}>
                        <div className={styles.progressBar}>
                          <div
                            className={styles.progressFill}
                            style={{ width: `${thumbnailProgress}%` }}
                          />
                        </div>
                        <span className={styles.progressText}>Uploading... {thumbnailProgress}%</span>
                      </div>
                    ) : (
                      <>
                        <div className={styles.dropzoneIcon}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        </div>
                        <p className={styles.dropzoneText}>
                          <span className={styles.dropzonePrimary}>
                            Click to upload or drag and drop
                          </span>
                          <span className={styles.dropzoneSecondary}>
                            JPEG, PNG, GIF, or WebP (max {thumbnailMaxSizeMB}MB)
                          </span>
                          <span className={styles.dropzoneSecondary}>
                            Recommended: {THUMBNAIL_DIMENSIONS.WIDTH}x{THUMBNAIL_DIMENSIONS.HEIGHT}px
                          </span>
                        </p>
                      </>
                    )}
                  </div>
                )}

                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept={thumbnailAcceptString}
                  onChange={handleThumbnailInputChange}
                  className={styles.hiddenInput}
                  disabled={isSubmitting || thumbnailUploading}
                />

                {thumbnailError && <span className={styles.error}>{thumbnailError}</span>}
                {!formData.thumbnailUrl && !thumbnailUploading && (
                  <span className={styles.hint}>
                    Optional - A cover image for the download
                  </span>
                )}
              </div>

              {/* Category */}
              <div className={styles.field}>
                <label htmlFor="category" className={styles.label}>
                  Category <span className={styles.required}>*</span>
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={styles.select}
                  required
                >
                  {Object.entries(DOWNLOAD_CATEGORIES).map(([key, value]) => (
                    <option key={key} value={value}>
                      {DOWNLOAD_CATEGORY_LABELS[value]}
                    </option>
                  ))}
                </select>
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
                  <option value={DOWNLOAD_STATUS.DRAFT}>Draft</option>
                  <option value={DOWNLOAD_STATUS.PUBLISHED}>Published</option>
                </select>
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
            </div>
    </BaseFormModal>
  );
}

DownloadFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  download: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    fileName: PropTypes.string,
    fileSize: PropTypes.string,
    fileType: PropTypes.string,
    category: PropTypes.string,
    downloadUrl: PropTypes.string,
    thumbnailUrl: PropTypes.string,
    order: PropTypes.number,
    status: PropTypes.string,
  }),
};

DownloadFormModal.defaultProps = {
  download: null,
};

export default DownloadFormModal;
