/**
 * FeedbackResponseDetailModal Component
 * Modal dialog for viewing full feedback response details.
 *
 * @module components/admin/FeedbackResponseDetailModal
 */

import { useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import styles from './FeedbackResponseDetailModal.module.css';

/**
 * Formats a Firestore timestamp to a readable date string.
 *
 * @param {Object} timestamp - Firestore timestamp
 * @returns {string} Formatted date string
 */
function formatDate(timestamp) {
  if (!timestamp) return '-';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formats a field key to a readable label.
 *
 * @param {string} key - Field key
 * @returns {string} Formatted label
 */
function formatFieldLabel(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

/**
 * Renders a field value appropriately based on its type.
 *
 * @param {*} value - Field value
 * @returns {string|JSX.Element} Rendered value
 */
function renderValue(value) {
  if (value === null || value === undefined) {
    return <span className={styles.emptyValue}>Not provided</span>;
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    const selectedOptions = Object.entries(value)
      .filter(([, v]) => v === true)
      .map(([k]) => formatFieldLabel(k));

    if (selectedOptions.length === 0) {
      return <span className={styles.emptyValue}>None selected</span>;
    }

    return (
      <ul className={styles.optionsList}>
        {selectedOptions.map((option) => (
          <li key={option}>{option}</li>
        ))}
      </ul>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className={styles.emptyValue}>None</span>;
    }
    return (
      <ul className={styles.optionsList}>
        {value.map((item, index) => (
          <li key={index}>{String(item)}</li>
        ))}
      </ul>
    );
  }

  return String(value);
}

/**
 * FeedbackResponseDetailModal Component
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Callback to close modal
 * @param {Object} props.response - Feedback response data to display
 * @param {Function} props.onDelete - Callback when delete is clicked
 * @returns {JSX.Element|null} The modal component or null if not open
 */
function FeedbackResponseDetailModal({ isOpen, onClose, response, onDelete }) {
  /**
   * Handle escape key to close modal
   */
  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !response) return null;

  const excludeKeys = ['id', 'createdAt'];
  const responseFields = Object.entries(response).filter(
    ([key]) => !excludeKeys.includes(key)
  );

  /**
   * Handles delete button click
   */
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this feedback response?')) {
      onDelete(response.id);
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-modal-title"
      >
        {/* Header */}
        <div className={styles.header}>
          <h2 id="feedback-modal-title" className={styles.title}>
            Feedback Response
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

        {/* Content */}
        <div className={styles.content}>
          <div className={styles.metaSection}>
            <span className={styles.metaLabel}>Submitted</span>
            <span className={styles.metaValue}>{formatDate(response.createdAt)}</span>
          </div>

          <div className={styles.fieldsSection}>
            {responseFields.length === 0 ? (
              <p className={styles.noFields}>No response data available.</p>
            ) : (
              responseFields.map(([key, value]) => (
                <div key={key} className={styles.fieldItem}>
                  <span className={styles.fieldLabel}>{formatFieldLabel(key)}</span>
                  <div className={styles.fieldValue}>{renderValue(value)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            className={styles.deleteButton}
            onClick={handleDelete}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Delete
          </button>
          <button className={styles.closeButtonSecondary} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

FeedbackResponseDetailModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  response: PropTypes.shape({
    id: PropTypes.string.isRequired,
    createdAt: PropTypes.object,
  }),
  onDelete: PropTypes.func.isRequired,
};

FeedbackResponseDetailModal.defaultProps = {
  response: null,
};

export default FeedbackResponseDetailModal;
