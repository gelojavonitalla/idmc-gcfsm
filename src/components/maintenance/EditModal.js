/**
 * EditModal Component
 * Reusable modal for editing and creating content items.
 *
 * @module components/maintenance/EditModal
 */

import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import styles from './EditModal.module.css';

/**
 * EditModal Component
 * Modal dialog for editing or creating content items.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Function} props.onSave - Callback when save is clicked
 * @param {string} props.title - Modal title
 * @param {Array} props.fields - Array of field definitions
 * @param {Object} [props.initialData] - Initial form data for editing
 * @param {boolean} [props.isLoading] - Whether save is in progress
 * @returns {JSX.Element|null} The modal component or null if closed
 */
function EditModal({
  isOpen,
  onClose,
  onSave,
  title,
  fields,
  initialData,
  isLoading = false,
}) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  /**
   * Initialize form data when modal opens or initialData changes
   */
  useEffect(() => {
    if (isOpen) {
      const defaultData = {};
      fields.forEach((field) => {
        defaultData[field.name] = initialData?.[field.name] ?? field.defaultValue ?? '';
      });
      setFormData(defaultData);
      setErrors({});
    }
  }, [isOpen, initialData, fields]);

  /**
   * Handle Escape key to close modal
   */
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  /**
   * Handles field value changes
   *
   * @param {string} fieldName - Name of the field
   * @param {any} value - New value
   */
  const handleChange = useCallback((fieldName, value) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    setErrors((prev) => ({ ...prev, [fieldName]: null }));
  }, []);

  /**
   * Validates form data
   *
   * @returns {boolean} True if valid
   */
  const validateForm = useCallback(() => {
    const newErrors = {};

    fields.forEach((field) => {
      if (field.required && !formData[field.name]?.toString().trim()) {
        newErrors[field.name] = `${field.label} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fields, formData]);

  /**
   * Handles form submission
   *
   * @param {Event} event - Form submit event
   */
  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();

      if (validateForm()) {
        onSave(formData);
      }
    },
    [formData, validateForm, onSave]
  );

  /**
   * Renders a form field based on its type
   *
   * @param {Object} field - Field definition
   * @returns {JSX.Element} The field element
   */
  const renderField = (field) => {
    const commonProps = {
      id: field.name,
      name: field.name,
      value: formData[field.name] || '',
      onChange: (e) => handleChange(field.name, e.target.value),
      disabled: isLoading || field.disabled,
      placeholder: field.placeholder,
      className: `${styles.input} ${errors[field.name] ? styles.inputError : ''}`,
    };

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={field.rows || 4}
            className={`${styles.textarea} ${errors[field.name] ? styles.inputError : ''}`}
          />
        );

      case 'select':
        return (
          <select {...commonProps} className={`${styles.select} ${errors[field.name] ? styles.inputError : ''}`}>
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'number':
        return (
          <input
            {...commonProps}
            type="number"
            min={field.min}
            max={field.max}
            step={field.step}
          />
        );

      case 'checkbox':
        return (
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              id={field.name}
              name={field.name}
              checked={formData[field.name] || false}
              onChange={(e) => handleChange(field.name, e.target.checked)}
              disabled={isLoading || field.disabled}
              className={styles.checkbox}
            />
            <span>{field.checkboxLabel || field.label}</span>
          </label>
        );

      default:
        return <input {...commonProps} type={field.type || 'text'} />;
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.body}>
            {fields.map((field) => (
              <div key={field.name} className={styles.field}>
                {field.type !== 'checkbox' && (
                  <label htmlFor={field.name} className={styles.label}>
                    {field.label}
                    {field.required && <span className={styles.required}>*</span>}
                  </label>
                )}
                {renderField(field)}
                {errors[field.name] && (
                  <span className={styles.errorText}>{errors[field.name]}</span>
                )}
                {field.hint && <span className={styles.hint}>{field.hint}</span>}
              </div>
            ))}
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

EditModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      type: PropTypes.string,
      required: PropTypes.bool,
      placeholder: PropTypes.string,
      defaultValue: PropTypes.any,
      options: PropTypes.arrayOf(
        PropTypes.shape({
          value: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired,
        })
      ),
      rows: PropTypes.number,
      min: PropTypes.number,
      max: PropTypes.number,
      hint: PropTypes.string,
      disabled: PropTypes.bool,
    })
  ).isRequired,
  initialData: PropTypes.object,
  isLoading: PropTypes.bool,
};

export default EditModal;
