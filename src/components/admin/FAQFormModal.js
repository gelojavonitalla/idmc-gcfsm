/**
 * FAQFormModal Component
 * Modal for creating and editing FAQs.
 *
 * @module components/admin/FAQFormModal
 */

import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { FAQ_CATEGORIES, FAQ_CATEGORY_LABELS, FAQ_STATUS } from '../../constants';
import { generateSlug } from '../../utils';
import BaseFormModal from './BaseFormModal';
import styles from './FAQFormModal.module.css';

/**
 * Initial form state for new FAQs
 */
const INITIAL_FORM_STATE = {
  question: '',
  answer: '',
  category: FAQ_CATEGORIES.GENERAL,
  order: 1,
  status: FAQ_STATUS.DRAFT,
};

/**
 * FAQFormModal Component
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Callback to close modal
 * @param {Function} props.onSave - Callback when FAQ is saved
 * @param {Object|null} props.faq - FAQ to edit (null for new)
 * @returns {JSX.Element|null} The modal or null if not open
 */
function FAQFormModal({ isOpen, onClose, onSave, faq }) {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const questionInputRef = useRef(null);

  const isEditing = !!faq;

  /**
   * Initialize form when modal opens or faq changes
   */
  useEffect(() => {
    if (isOpen) {
      if (faq) {
        setFormData({
          question: faq.question || '',
          answer: faq.answer || '',
          category: faq.category || FAQ_CATEGORIES.GENERAL,
          order: faq.order || 1,
          status: faq.status || FAQ_STATUS.DRAFT,
        });
      } else {
        setFormData(INITIAL_FORM_STATE);
      }
      setError(null);
      setTimeout(() => {
        questionInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, faq]);

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
   * Handles form submission
   *
   * @param {Event} event - Submit event
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const faqId = faq?.id || generateSlug(formData.question, { prefix: 'faq', maxLength: 50 });

      if (!faqId) {
        throw new Error('Question is required to generate an ID');
      }

      await onSave(faqId, {
        ...formData,
        faqId,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save FAQ. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="FAQ"
      modalId="faq-modal"
      isEditing={isEditing}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      error={error}
    >
      {/* Question - Full width */}
      <div className={styles.field}>
        <label htmlFor="question" className={styles.label}>
          Question <span className={styles.required}>*</span>
        </label>
        <input
          ref={questionInputRef}
          type="text"
          id="question"
          name="question"
          value={formData.question}
          onChange={handleChange}
          className={styles.input}
          placeholder="e.g., How do I register for the conference?"
          required
        />
      </div>

      {/* Answer - Full width */}
      <div className={styles.field}>
        <label htmlFor="answer" className={styles.label}>
          Answer <span className={styles.required}>*</span>
        </label>
        <textarea
          id="answer"
          name="answer"
          value={formData.answer}
          onChange={handleChange}
          className={styles.textarea}
          placeholder="Enter the answer to this question..."
          rows={5}
          required
        />
      </div>

      <div className={styles.formGrid}>
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
            {Object.entries(FAQ_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
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
            Lower numbers appear first within each category
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
            <option value={FAQ_STATUS.DRAFT}>Draft</option>
            <option value={FAQ_STATUS.PUBLISHED}>Published</option>
          </select>
        </div>
      </div>
    </BaseFormModal>
  );
}

FAQFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  faq: PropTypes.shape({
    id: PropTypes.string,
    question: PropTypes.string,
    answer: PropTypes.string,
    category: PropTypes.string,
    order: PropTypes.number,
    status: PropTypes.string,
  }),
};

FAQFormModal.defaultProps = {
  faq: null,
};

export default FAQFormModal;
