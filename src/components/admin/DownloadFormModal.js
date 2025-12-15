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
} from '../../constants';
import { uploadDownloadFile, deleteFile, validateFile } from '../../services/storage';
import { formatFileSize } from '../../services/downloads';
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
  const modalRef = useRef(null);
  const titleInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // File upload states
  const [fileUploading, setFileUploading] = useState(false);
  const [fileProgress, setFileProgress] = useState(0);
  const [fileError, setFileError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

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
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, download]);

  /**
   * Handle click outside modal
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  /**
   * Handle escape key
   */
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

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
   * Generates a slug from the title
   *
   * @param {string} title - Download title
   * @returns {string} URL-friendly slug
   */
  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
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

  if (!isOpen) {
    return null;
  }

  const maxSizeMB = MAX_FILE_SIZES.DOCUMENT / (1024 * 1024);
  const acceptString = ALLOWED_FILE_TYPES.DOCUMENTS.join(',');
  const displayError = fileError;

  return (
    <div className={styles.overlay}>
      <div
        ref={modalRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="download-modal-title"
      >
        <div className={styles.header}>
          <h2 id="download-modal-title" className={styles.title}>
            {isEditing ? 'Edit Download' : 'Add New Download'}
          </h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.content}>
            {error && (
              <div className={styles.errorMessage} role="alert">
                {error}
              </div>
            )}

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
                  File (PDF) <span className={styles.required}>*</span>
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
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting || !formData.downloadUrl}
            >
              {isSubmitting ? (
                <>
                  <span className={styles.spinner} />
                  Saving...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  {isEditing ? 'Update Download' : 'Create Download'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
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
    order: PropTypes.number,
    status: PropTypes.string,
  }),
};

DownloadFormModal.defaultProps = {
  download: null,
};

export default DownloadFormModal;
