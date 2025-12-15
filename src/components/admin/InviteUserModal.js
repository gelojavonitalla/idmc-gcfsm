/**
 * InviteUserModal Component
 * Modal for inviting new admin users.
 *
 * @module components/admin/InviteUserModal
 */

import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { ADMIN_ROLES, ADMIN_ROLE_LABELS } from '../../constants';
import styles from './InviteUserModal.module.css';

/**
 * InviteUserModal Component
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Callback to close modal
 * @param {Function} props.onInvite - Callback when user is invited
 * @returns {JSX.Element|null} The modal or null if not open
 */
function InviteUserModal({ isOpen, onClose, onInvite }) {
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    role: ADMIN_ROLES.ADMIN,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const modalRef = useRef(null);
  const emailInputRef = useRef(null);

  /**
   * Reset form when modal opens
   */
  useEffect(() => {
    if (isOpen) {
      setFormData({
        email: '',
        displayName: '',
        role: ADMIN_ROLES.ADMIN,
      });
      setError(null);
      // Focus email input after a short delay for animation
      setTimeout(() => {
        emailInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

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
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
      await onInvite(formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to invite user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay}>
      <div
        ref={modalRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-modal-title"
      >
        <div className={styles.header}>
          <h2 id="invite-modal-title" className={styles.title}>
            Invite New User
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

            <div className={styles.infoBox}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              <p>
                An invitation email will be sent to the user with instructions to set up their account.
              </p>
            </div>

            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>
                Email Address <span className={styles.required}>*</span>
              </label>
              <input
                ref={emailInputRef}
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={styles.input}
                placeholder="user@example.com"
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="displayName" className={styles.label}>
                Display Name
              </label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                className={styles.input}
                placeholder="John Doe"
              />
              <span className={styles.hint}>
                If left empty, the name will be derived from the email address.
              </span>
            </div>

            <div className={styles.field}>
              <label htmlFor="role" className={styles.label}>
                Role <span className={styles.required}>*</span>
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={styles.select}
                required
              >
                {Object.entries(ADMIN_ROLES)
                  .filter(([key]) => key !== 'SUPERADMIN')
                  .map(([key, value]) => (
                    <option key={key} value={value}>
                      {ADMIN_ROLE_LABELS[value]}
                    </option>
                  ))}
              </select>
              <span className={styles.hint}>
                {formData.role === ADMIN_ROLES.ADMIN
                  ? 'Can manage conference content, registrations, and view analytics.'
                  : 'Limited access for check-in duties only.'}
              </span>
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
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className={styles.spinner} />
                  Sending...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 2L11 13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  Send Invitation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

InviteUserModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onInvite: PropTypes.func.isRequired,
};

export default InviteUserModal;
