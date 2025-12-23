/**
 * WhatToBringItemFormModal Component
 * Modal for creating and editing "What to Bring" checklist items.
 *
 * @module components/admin/WhatToBringItemFormModal
 */

import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { WHAT_TO_BRING_STATUS } from '../../constants';
import styles from './WhatToBringItemFormModal.module.css';

/**
 * Initial form state for new what to bring items
 */
const INITIAL_FORM_STATE = {
  text: '',
  order: 1,
  status: WHAT_TO_BRING_STATUS.DRAFT,
};

/**
 * WhatToBringItemFormModal Component
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Callback to close modal
 * @param {Function} props.onSave - Callback when item is saved
 * @param {Object|null} props.item - Item to edit (null for new)
 * @returns {JSX.Element|null} The modal or null if not open
 */
function WhatToBringItemFormModal({ isOpen, onClose, onSave, item }) {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const modalRef = useRef(null);
  const textInputRef = useRef(null);

  const isEditing = !!item;

  /**
   * Initialize form when modal opens or item changes
   */
  useEffect(() => {
    if (isOpen) {
      if (item) {
        setFormData({
          text: item.text || '',
          order: item.order || 1,
          status: item.status || WHAT_TO_BRING_STATUS.DRAFT,
        });
      } else {
        setFormData(INITIAL_FORM_STATE);
      }
      setError(null);
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, item]);

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
   * Generates a slug from the text
   *
   * @param {string} text - Item text
   * @returns {string} URL-friendly slug
   */
  const generateSlug = (text) => {
    return `wtb-${text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50)
      .trim()}`;
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
      const itemId = item?.id || generateSlug(formData.text);

      if (!itemId) {
        throw new Error('Item text is required to generate an ID');
      }

      await onSave(itemId, {
        ...formData,
        itemId,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save item. Please try again.');
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
        aria-labelledby="what-to-bring-modal-title"
      >
        <div className={styles.header}>
          <h2 id="what-to-bring-modal-title" className={styles.title}>
            {isEditing ? 'Edit Checklist Item' : 'Add New Checklist Item'}
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

            {/* Text - Full width */}
            <div className={styles.field}>
              <label htmlFor="text" className={styles.label}>
                Item Text <span className={styles.required}>*</span>
              </label>
              <input
                ref={textInputRef}
                type="text"
                id="text"
                name="text"
                value={formData.text}
                onChange={handleChange}
                className={styles.input}
                placeholder="e.g., Your personal QR code (screenshot or printed)"
                required
              />
              <span className={styles.hint}>
                This text will appear in confirmation emails and registration success
              </span>
            </div>

            <div className={styles.formGrid}>
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
                  <option value={WHAT_TO_BRING_STATUS.DRAFT}>Draft</option>
                  <option value={WHAT_TO_BRING_STATUS.PUBLISHED}>Published</option>
                </select>
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
                  {isEditing ? 'Update Item' : 'Create Item'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

WhatToBringItemFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  item: PropTypes.shape({
    id: PropTypes.string,
    text: PropTypes.string,
    order: PropTypes.number,
    status: PropTypes.string,
  }),
};

WhatToBringItemFormModal.defaultProps = {
  item: null,
};

export default WhatToBringItemFormModal;
