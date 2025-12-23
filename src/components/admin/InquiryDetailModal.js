/**
 * InquiryDetailModal Component
 * Modal dialog for viewing full contact inquiry details.
 *
 * @module components/admin/InquiryDetailModal
 */

import { useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { CONTACT_INQUIRY_STATUS } from '../../constants';
import styles from './InquiryDetailModal.module.css';

/**
 * Status labels for display
 */
const STATUS_LABELS = {
  [CONTACT_INQUIRY_STATUS.NEW]: 'New',
  [CONTACT_INQUIRY_STATUS.READ]: 'Read',
  [CONTACT_INQUIRY_STATUS.REPLIED]: 'Replied',
};

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
 * InquiryDetailModal Component
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Callback to close modal
 * @param {Object} props.inquiry - Inquiry data to display
 * @param {Function} props.onUpdateStatus - Callback when status is changed
 * @param {Function} props.onReply - Callback when reply is clicked
 * @returns {JSX.Element|null} The modal component or null if not open
 */
function InquiryDetailModal({ isOpen, onClose, inquiry, onUpdateStatus, onReply }) {
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

  if (!isOpen || !inquiry) return null;

  /**
   * Gets status badge class
   *
   * @param {string} status - Inquiry status
   * @returns {string} Badge class name
   */
  const getStatusClass = (status) => {
    switch (status) {
      case CONTACT_INQUIRY_STATUS.NEW:
        return styles.statusNew;
      case CONTACT_INQUIRY_STATUS.READ:
        return styles.statusRead;
      case CONTACT_INQUIRY_STATUS.REPLIED:
        return styles.statusReplied;
      default:
        return styles.statusNew;
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inquiry-modal-title"
      >
        {/* Header */}
        <div className={styles.header}>
          <h2 id="inquiry-modal-title" className={styles.title}>
            Inquiry Details
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
          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>From</span>
              <span className={styles.metaValue}>{inquiry.name}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Email</span>
              <a href={`mailto:${inquiry.email}`} className={styles.emailLink}>
                {inquiry.email}
              </a>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Date</span>
              <span className={styles.metaValue}>{formatDate(inquiry.createdAt)}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Status</span>
              <select
                className={`${styles.statusSelect} ${getStatusClass(inquiry.status)}`}
                value={inquiry.status}
                onChange={(e) => onUpdateStatus(inquiry.id, e.target.value)}
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.subjectSection}>
            <span className={styles.sectionLabel}>Subject</span>
            <p className={styles.subject}>{inquiry.subject}</p>
          </div>

          <div className={styles.messageSection}>
            <span className={styles.sectionLabel}>Message</span>
            <p className={styles.message}>{inquiry.message}</p>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            className={styles.replyButton}
            onClick={() => onReply(inquiry)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 17 4 12 9 7" />
              <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
            </svg>
            Reply via Email
          </button>
          <button className={styles.closeButtonSecondary} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

InquiryDetailModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  inquiry: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    subject: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    status: PropTypes.string,
    createdAt: PropTypes.object,
  }),
  onUpdateStatus: PropTypes.func.isRequired,
  onReply: PropTypes.func.isRequired,
};

InquiryDetailModal.defaultProps = {
  inquiry: null,
};

export default InquiryDetailModal;
