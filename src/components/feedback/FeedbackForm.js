/**
 * FeedbackForm Component
 * Dynamic form that renders fields based on configuration from admin settings.
 *
 * @module components/feedback/FeedbackForm
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { submitFeedback } from '../../services/feedback';
import styles from './FeedbackForm.module.css';

/**
 * Rate limiter for spam logging to prevent DoS via log flooding.
 * Limits logging to once per minute.
 */
const SPAM_LOG_INTERVAL_MS = 60000;

/**
 * Gets a nested value from an object using dot notation path.
 *
 * @param {Object} obj - The object to get value from
 * @param {string} path - Dot notation path (e.g., 'field.subfield')
 * @returns {*} The value at the path or undefined
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Checks if a field should be visible based on conditional logic.
 * Supports checkbox (boolean), checkboxGroup (option ID), and radio (option ID) conditions.
 *
 * @param {Object} field - The field definition
 * @param {Object} formData - Current form data
 * @returns {boolean} True if field should be visible
 */
function isFieldVisible(field, formData) {
  if (!field.conditionalOn) {
    return true;
  }

  const { field: conditionField, value: conditionValue } = field.conditionalOn;

  // Handle nested paths (e.g., "fieldId.optionId" for legacy checkboxGroup conditions)
  if (conditionField.includes('.')) {
    const currentValue = getNestedValue(formData, conditionField);
    return currentValue === conditionValue;
  }

  const fieldValue = formData[conditionField];

  // Determine field type from form data structure
  if (typeof fieldValue === 'boolean') {
    // Checkbox field - compare boolean values
    return fieldValue === conditionValue;
  } else if (typeof fieldValue === 'object' && fieldValue !== null) {
    // CheckboxGroup field - conditionValue is the option ID
    // Check if that specific option is checked
    return fieldValue[conditionValue] === true;
  } else if (typeof fieldValue === 'string') {
    // Radio field - compare the selected option ID with condition value
    return fieldValue === conditionValue;
  }

  return false;
}

/**
 * Initializes form data based on field definitions.
 *
 * @param {Array} fields - Field definitions
 * @returns {Object} Initial form data
 */
function initializeFormData(fields) {
  const data = { honeypot: '' };

  fields.forEach((field) => {
    switch (field.type) {
      case 'checkbox':
        data[field.id] = false;
        break;
      case 'checkboxGroup':
        data[field.id] = {};
        field.options?.forEach((opt) => {
          data[field.id][opt.id] = false;
        });
        break;
      case 'radio':
        data[field.id] = '';
        break;
      case 'text':
      case 'textarea':
      default:
        data[field.id] = '';
        break;
    }
  });

  return data;
}

/**
 * FeedbackForm Component
 * Renders a dynamic feedback form based on field configuration.
 *
 * @param {Object} props - Component props
 * @param {Array} props.fields - Array of field definitions
 * @param {Function} [props.onSuccess] - Callback when form is successfully submitted
 * @returns {JSX.Element} The feedback form component
 */
function FeedbackForm({ fields, onSuccess }) {
  const initialData = useMemo(() => initializeFormData(fields), [fields]);
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const lastSpamLogTimeRef = useRef(0);

  // Sort fields by order
  const sortedFields = useMemo(
    () => [...fields].sort((a, b) => (a.order || 0) - (b.order || 0)),
    [fields]
  );

  /**
   * Handles text input changes
   */
  const handleChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }, []);

  /**
   * Handles checkbox changes
   */
  const handleCheckboxChange = useCallback((event) => {
    const { name, checked } = event.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }, []);

  /**
   * Handles checkbox group changes
   */
  const handleCheckboxGroupChange = useCallback((fieldId, optionId, checked) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: {
        ...prev[fieldId],
        [optionId]: checked,
      },
    }));
    setErrors((prev) => ({ ...prev, [fieldId]: '' }));
  }, []);

  /**
   * Handles radio button changes
   */
  const handleRadioChange = useCallback((fieldId, value) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => ({ ...prev, [fieldId]: '' }));
  }, []);

  /**
   * Validates the form before submission
   *
   * @returns {boolean} True if form is valid
   */
  const validateForm = useCallback(() => {
    const newErrors = {};

    sortedFields.forEach((field) => {
      // Skip validation for hidden fields
      if (!isFieldVisible(field, formData)) {
        return;
      }

      if (field.required) {
        switch (field.type) {
          case 'text':
          case 'textarea':
            if (!formData[field.id]?.trim()) {
              newErrors[field.id] = `${field.label} is required`;
            }
            break;
          case 'checkbox':
            if (!formData[field.id]) {
              newErrors[field.id] = `${field.label} is required`;
            }
            break;
          case 'checkboxGroup': {
            const hasChecked = Object.values(formData[field.id] || {}).some(Boolean);
            if (!hasChecked) {
              newErrors[field.id] = `Please select at least one option for ${field.label}`;
            }
            break;
          }
          case 'radio':
            if (!formData[field.id]) {
              newErrors[field.id] = `Please select an option for ${field.label}`;
            }
            break;
          default:
            break;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [sortedFields, formData]);

  /**
   * Handles form submission
   */
  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      // Check honeypot for spam
      if (formData.honeypot) {
        const now = Date.now();
        if (now - lastSpamLogTimeRef.current > SPAM_LOG_INTERVAL_MS) {
          lastSpamLogTimeRef.current = now;
          console.warn('Spam attempt detected via honeypot field');
        }
        return;
      }

      if (!validateForm()) {
        return;
      }

      setIsSubmitting(true);
      setSubmitStatus(null);

      try {
        // Build submission data - only include visible fields
        const submissionData = {};

        sortedFields.forEach((field) => {
          if (!isFieldVisible(field, formData)) {
            return;
          }
          submissionData[field.id] = formData[field.id];
        });

        await submitFeedback(submissionData);

        setSubmitStatus('success');
        setFormData(initialData);

        if (onSuccess) {
          onSuccess();
        }
      } catch (error) {
        console.error('Failed to submit feedback:', error);
        setSubmitStatus('error');
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, sortedFields, validateForm, onSuccess, initialData]
  );

  /**
   * Renders a single field based on its type
   */
  const renderField = useCallback(
    (field) => {
      // Check conditional visibility
      if (!isFieldVisible(field, formData)) {
        return null;
      }

      const fieldId = `feedback-${field.id}`;
      const hasError = Boolean(errors[field.id]);

      switch (field.type) {
        case 'text':
          return (
            <div key={field.id} className={styles.fieldGroup}>
              <label htmlFor={fieldId} className={styles.label}>
                {field.label}
                {field.required && <span className={styles.required}> *</span>}
              </label>
              <input
                type="text"
                id={fieldId}
                name={field.id}
                value={formData[field.id] || ''}
                onChange={handleChange}
                className={`${styles.input} ${hasError ? styles.inputError : ''}`}
                placeholder={field.placeholder || ''}
                disabled={isSubmitting}
                aria-invalid={hasError}
                aria-describedby={hasError ? `${fieldId}-error` : undefined}
              />
              {hasError && (
                <span id={`${fieldId}-error`} className={styles.fieldError}>
                  {errors[field.id]}
                </span>
              )}
            </div>
          );

        case 'textarea':
          return (
            <div key={field.id} className={styles.fieldGroup}>
              <label htmlFor={fieldId} className={styles.label}>
                {field.label}
                {field.required && <span className={styles.required}> *</span>}
              </label>
              <textarea
                id={fieldId}
                name={field.id}
                value={formData[field.id] || ''}
                onChange={handleChange}
                className={`${styles.textarea} ${hasError ? styles.inputError : ''}`}
                placeholder={field.placeholder || ''}
                rows={3}
                disabled={isSubmitting}
                aria-invalid={hasError}
                aria-describedby={hasError ? `${fieldId}-error` : undefined}
              />
              {hasError && (
                <span id={`${fieldId}-error`} className={styles.fieldError}>
                  {errors[field.id]}
                </span>
              )}
            </div>
          );

        case 'checkbox':
          return (
            <div key={field.id} className={styles.fieldGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name={field.id}
                  checked={formData[field.id] || false}
                  onChange={handleCheckboxChange}
                  className={styles.checkbox}
                  disabled={isSubmitting}
                />
                <span className={styles.checkboxText}>
                  {field.label}
                  {field.required && <span className={styles.required}> *</span>}
                </span>
              </label>
              {hasError && (
                <span className={styles.fieldError}>{errors[field.id]}</span>
              )}
            </div>
          );

        case 'checkboxGroup':
          return (
            <div key={field.id} className={styles.section}>
              <p className={styles.sectionLabel}>
                {field.label}
                {field.required && <span className={styles.required}> *</span>}
              </p>
              <div className={styles.checkboxGroup}>
                {field.options?.map((option) => (
                  <label key={option.id} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData[field.id]?.[option.id] || false}
                      onChange={(e) =>
                        handleCheckboxGroupChange(field.id, option.id, e.target.checked)
                      }
                      className={styles.checkbox}
                      disabled={isSubmitting}
                    />
                    <span className={styles.checkboxText}>{option.label}</span>
                  </label>
                ))}
              </div>
              {hasError && (
                <span className={styles.fieldError}>{errors[field.id]}</span>
              )}
            </div>
          );

        case 'radio':
          return (
            <div key={field.id} className={styles.section}>
              <p className={styles.sectionLabel}>
                {field.label}
                {field.required && <span className={styles.required}> *</span>}
              </p>
              <div className={styles.checkboxGroup}>
                {field.options?.map((option) => (
                  <label key={option.id} className={styles.checkboxLabel}>
                    <input
                      type="radio"
                      name={field.id}
                      value={option.id}
                      checked={formData[field.id] === option.id}
                      onChange={() => handleRadioChange(field.id, option.id)}
                      className={styles.checkbox}
                      disabled={isSubmitting}
                    />
                    <span className={styles.checkboxText}>{option.label}</span>
                  </label>
                ))}
              </div>
              {hasError && (
                <span className={styles.fieldError}>{errors[field.id]}</span>
              )}
            </div>
          );

        default:
          return null;
      }
    },
    [
      formData,
      errors,
      isSubmitting,
      handleChange,
      handleCheckboxChange,
      handleCheckboxGroupChange,
      handleRadioChange,
    ]
  );

  // Success state
  if (submitStatus === 'success') {
    return (
      <div className={styles.successMessage}>
        <div className={styles.successIcon}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="m9 11 3 3L22 4" />
          </svg>
        </div>
        <h3 className={styles.successTitle}>Thank You!</h3>
        <p className={styles.successText}>
          Your feedback has been submitted successfully. We appreciate you taking the time to share
          your experience.
        </p>
        <button
          type="button"
          className={styles.resetButton}
          onClick={() => setSubmitStatus(null)}
        >
          Submit Another Response
        </button>
      </div>
    );
  }

  // Empty fields state
  if (!fields || fields.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No form fields have been configured.</p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {submitStatus === 'error' && (
        <div className={styles.errorBanner}>Something went wrong. Please try again later.</div>
      )}

      {/* Honeypot field for spam protection */}
      <input
        type="text"
        name="honeypot"
        value={formData.honeypot}
        onChange={handleChange}
        className={styles.honeypot}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      {/* Dynamic Fields */}
      {sortedFields.map(renderField)}

      <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </form>
  );
}

FeedbackForm.propTypes = {
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['text', 'textarea', 'checkbox', 'checkboxGroup', 'radio']).isRequired,
      label: PropTypes.string.isRequired,
      placeholder: PropTypes.string,
      required: PropTypes.bool,
      order: PropTypes.number,
      options: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired,
        })
      ),
      conditionalOn: PropTypes.shape({
        field: PropTypes.string.isRequired,
        value: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]).isRequired,
      }),
    })
  ),
  onSuccess: PropTypes.func,
};

FeedbackForm.defaultProps = {
  fields: [],
  onSuccess: undefined,
};

export default FeedbackForm;
