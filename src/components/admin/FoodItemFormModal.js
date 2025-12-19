/**
 * FoodItemFormModal Component
 * Modal for creating and editing food menu items.
 *
 * @module components/admin/FoodItemFormModal
 */

import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { FOOD_MENU_STATUS } from '../../constants';
import styles from './FoodItemFormModal.module.css';

/**
 * Initial form state for new food menu items
 */
const INITIAL_FORM_STATE = {
  name: '',
  description: '',
  order: 1,
  status: FOOD_MENU_STATUS.DRAFT,
};

/**
 * FoodItemFormModal Component
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Callback to close modal
 * @param {Function} props.onSave - Callback when food item is saved
 * @param {Object|null} props.foodItem - Food item to edit (null for new)
 * @returns {JSX.Element|null} The modal or null if not open
 */
function FoodItemFormModal({ isOpen, onClose, onSave, foodItem }) {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const modalRef = useRef(null);
  const nameInputRef = useRef(null);

  const isEditing = !!foodItem;

  /**
   * Initialize form when modal opens or foodItem changes
   */
  useEffect(() => {
    if (isOpen) {
      if (foodItem) {
        setFormData({
          name: foodItem.name || '',
          description: foodItem.description || '',
          order: foodItem.order || 1,
          status: foodItem.status || FOOD_MENU_STATUS.DRAFT,
        });
      } else {
        setFormData(INITIAL_FORM_STATE);
      }
      setError(null);
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, foodItem]);

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
   * Generates a slug from the name
   *
   * @param {string} name - Food item name
   * @returns {string} URL-friendly slug
   */
  const generateSlug = (name) => {
    return `food-${name
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
      const itemId = foodItem?.id || generateSlug(formData.name);

      if (!itemId) {
        throw new Error('Name is required to generate an ID');
      }

      await onSave(itemId, {
        ...formData,
        itemId,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save food item. Please try again.');
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
        aria-labelledby="food-item-modal-title"
      >
        <div className={styles.header}>
          <h2 id="food-item-modal-title" className={styles.title}>
            {isEditing ? 'Edit Food Option' : 'Add New Food Option'}
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

            {/* Name - Full width */}
            <div className={styles.field}>
              <label htmlFor="name" className={styles.label}>
                Food Option Name <span className={styles.required}>*</span>
              </label>
              <input
                ref={nameInputRef}
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={styles.input}
                placeholder="e.g., Chicken, Pork, Vegetarian"
                required
              />
            </div>

            {/* Description - Full width */}
            <div className={styles.field}>
              <label htmlFor="description" className={styles.label}>
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={styles.textarea}
                placeholder="Optional description of the food option..."
                rows={3}
              />
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
                  <option value={FOOD_MENU_STATUS.DRAFT}>Draft</option>
                  <option value={FOOD_MENU_STATUS.PUBLISHED}>Published</option>
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
                  {isEditing ? 'Update Food Option' : 'Create Food Option'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

FoodItemFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  foodItem: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
    order: PropTypes.number,
    status: PropTypes.string,
  }),
};

FoodItemFormModal.defaultProps = {
  foodItem: null,
};

export default FoodItemFormModal;
