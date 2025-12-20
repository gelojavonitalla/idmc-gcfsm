/**
 * ReplyInquiryModal Component
 * Modal dialog for composing and sending email replies to contact inquiries.
 *
 * @module components/admin/ReplyInquiryModal
 */

import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { sendInquiryReply } from '../../services/contactInquiries';
import { useAdminAuth } from '../../context';
import styles from './ReplyInquiryModal.module.css';

/**
 * ReplyInquiryModal Component
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Callback to close modal
 * @param {Object} props.inquiry - Inquiry data to reply to
 * @param {Function} props.onReplySent - Callback when reply is successfully sent
 * @returns {JSX.Element|null} The modal component or null if not open
 */
function ReplyInquiryModal({ isOpen, onClose, inquiry, onReplySent }) {
  const { admin } = useAdminAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Reset form when inquiry changes or modal opens
   */
  useEffect(() => {
    if (isOpen && inquiry) {
      setSubject(`Re: ${inquiry.subject}`);
      setMessage('');
      setError(null);
    }
  }, [isOpen, inquiry]);

  /**
   * Handle escape key to close modal
   */
  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape' && !isSending) {
        onClose();
      }
    },
    [onClose, isSending]
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

  /**
   * Handle form submission
   *
   * @param {Event} event - Form submit event
   */
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!subject.trim() || !message.trim()) {
      setError('Subject and message are required');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      await sendInquiryReply(
        {
          inquiryId: inquiry.id,
          subject: subject.trim(),
          message: message.trim(),
        },
        admin?.id,
        admin?.email
      );

      if (onReplySent) {
        onReplySent(inquiry.id);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to send reply. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen || !inquiry) return null;

  return (
    <div className={styles.overlay} onClick={isSending ? undefined : onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reply-modal-title"
      >
        {/* Header */}
        <div className={styles.header}>
          <h2 id="reply-modal-title" className={styles.title}>
            Reply to Inquiry
          </h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            disabled={isSending}
            aria-label="Close modal"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.content}>
            {/* Recipient Info */}
            <div className={styles.recipientInfo}>
              <div className={styles.recipientRow}>
                <span className={styles.recipientLabel}>To:</span>
                <span className={styles.recipientValue}>
                  {inquiry.name} &lt;{inquiry.email}&gt;
                </span>
              </div>
            </div>

            {/* Original Message Preview */}
            <div className={styles.originalInquiry}>
              <span className={styles.sectionLabel}>Original Inquiry</span>
              <div className={styles.originalContent}>
                <p className={styles.originalSubject}>{inquiry.subject}</p>
                <p className={styles.originalMessage}>{inquiry.message}</p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className={styles.error}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            {/* Subject Input */}
            <div className={styles.formGroup}>
              <label htmlFor="reply-subject" className={styles.label}>
                Subject
              </label>
              <input
                type="text"
                id="reply-subject"
                className={styles.input}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isSending}
                placeholder="Email subject"
                required
              />
            </div>

            {/* Message Input */}
            <div className={styles.formGroup}>
              <label htmlFor="reply-message" className={styles.label}>
                Message
              </label>
              <textarea
                id="reply-message"
                className={styles.textarea}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isSending}
                placeholder="Type your reply here..."
                rows={8}
                required
              />
            </div>
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={isSending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.sendButton}
              disabled={isSending || !subject.trim() || !message.trim()}
            >
              {isSending ? (
                <>
                  <span className={styles.spinner} />
                  Sending...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  Send Reply
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

ReplyInquiryModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  inquiry: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    subject: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
  }),
  onReplySent: PropTypes.func,
};

ReplyInquiryModal.defaultProps = {
  inquiry: null,
  onReplySent: null,
};

export default ReplyInquiryModal;
