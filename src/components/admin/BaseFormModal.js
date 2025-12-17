/**
 * BaseFormModal Component
 * Reusable modal wrapper for admin forms with shared behavior.
 *
 * @description Provides standard modal behavior including:
 * - Click outside to close
 * - Escape key to close
 * - Body scroll lock when open
 * - Consistent header/footer styling
 * - Loading and error states
 *
 * @module components/admin/BaseFormModal
 */

import { useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import styles from './BaseFormModal.module.css';

/**
 * BaseFormModal Component
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether modal is visible
 * @param {Function} props.onClose - Close handler callback
 * @param {string} props.title - Modal title (e.g., "Session", "Speaker")
 * @param {string} props.modalId - Unique ID for accessibility
 * @param {boolean} props.isEditing - Whether editing existing item
 * @param {React.ReactNode} props.children - Form content
 * @param {Function} props.onSubmit - Form submit handler
 * @param {boolean} props.isSubmitting - Loading state during submission
 * @param {string|null} props.error - Error message to display
 * @param {string} props.submitLabel - Custom submit button label
 * @returns {JSX.Element|null} The modal or null if not open
 */
function BaseFormModal({
  isOpen,
  onClose,
  title,
  modalId,
  isEditing = false,
  children,
  onSubmit,
  isSubmitting = false,
  error = null,
  submitLabel,
}) {
  const modalRef = useRef(null);

  /**
   * Handle click outside modal to close
   */
  const handleClickOutside = useCallback(
    (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    },
    [onClose]
  );

  /**
   * Handle escape key to close modal
   */
  const handleEscape = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  /**
   * Set up click outside listener and body scroll lock
   */
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleClickOutside]);

  /**
   * Set up escape key listener
   */
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) {
    return null;
  }

  const displayTitle = isEditing ? `Edit ${title}` : `Add New ${title}`;
  const buttonLabel = submitLabel || (isEditing ? `Update ${title}` : `Create ${title}`);

  return (
    <div className={styles.overlay}>
      <div
        ref={modalRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${modalId}-title`}
      >
        <div className={styles.header}>
          <h2 id={`${modalId}-title`} className={styles.title}>
            {displayTitle}
          </h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className={styles.content}>
            {error && (
              <div className={styles.errorMessage} role="alert">
                {error}
              </div>
            )}
            {children}
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
              disabled={isSubmitting}
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
                  {buttonLabel}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

BaseFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  modalId: PropTypes.string.isRequired,
  isEditing: PropTypes.bool,
  children: PropTypes.node.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
  error: PropTypes.string,
  submitLabel: PropTypes.string,
};

BaseFormModal.defaultProps = {
  isEditing: false,
  isSubmitting: false,
  error: null,
  submitLabel: null,
};

export default BaseFormModal;
