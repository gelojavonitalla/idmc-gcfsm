/**
 * ContactForm Component
 * Form for submitting contact inquiries with validation and honeypot spam protection.
 *
 * @module components/contact/ContactForm
 */

import { useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { submitContactInquiry } from '../../services/contactInquiries';
import styles from './ContactForm.module.css';

/**
 * Rate limiter for spam logging to prevent DoS via log flooding.
 * Limits logging to once per minute.
 */
const SPAM_LOG_INTERVAL_MS = 60000;

/**
 * Form field validation configuration
 */
const VALIDATION_RULES = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
  },
  email: {
    required: true,
    pattern: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  },
  subject: {
    required: true,
    minLength: 5,
    maxLength: 200,
  },
  message: {
    required: true,
    minLength: 10,
    maxLength: 2000,
  },
};

/**
 * Validates a single form field
 *
 * @param {string} field - Field name
 * @param {string} value - Field value
 * @returns {string} Error message or empty string if valid
 */
function validateField(field, value) {
  const rules = VALIDATION_RULES[field];
  if (!rules) {
    return '';
  }

  const trimmedValue = value.trim();

  if (rules.required && !trimmedValue) {
    return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
  }

  if (rules.minLength && trimmedValue.length < rules.minLength) {
    return `${field.charAt(0).toUpperCase() + field.slice(1)} must be at least ${rules.minLength} characters`;
  }

  if (rules.maxLength && trimmedValue.length > rules.maxLength) {
    return `${field.charAt(0).toUpperCase() + field.slice(1)} must be less than ${rules.maxLength} characters`;
  }

  if (rules.pattern && !rules.pattern.test(trimmedValue)) {
    return 'Please enter a valid email address';
  }

  return '';
}

/**
 * ContactForm Component
 * Renders a contact form with validation and spam protection.
 *
 * @param {Object} props - Component props
 * @param {Function} [props.onSuccess] - Callback when form is successfully submitted
 * @returns {JSX.Element} The contact form component
 */
function ContactForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    honeypot: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const lastSpamLogTimeRef = useRef(0);

  const handleChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }, []);

  const handleBlur = useCallback((event) => {
    const { name, value } = event.target;
    const error = validateField(name, value);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = {};
    Object.keys(VALIDATION_RULES).forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

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
        await submitContactInquiry({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
        });

        setSubmitStatus('success');
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
          honeypot: '',
        });

        if (onSuccess) {
          onSuccess();
        }
      } catch (error) {
        console.error('Failed to submit contact inquiry:', error);
        setSubmitStatus('error');
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, validateForm, onSuccess]
  );

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
        <h3 className={styles.successTitle}>Message Sent!</h3>
        <p className={styles.successText}>
          Thank you for reaching out. We&apos;ll get back to you as soon as possible.
        </p>
        <button
          type="button"
          className={styles.resetButton}
          onClick={() => setSubmitStatus(null)}
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {submitStatus === 'error' && (
        <div className={styles.errorBanner}>
          Something went wrong. Please try again later.
        </div>
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

      <div className={styles.fieldGroup}>
        <label htmlFor="contact-name" className={styles.label}>
          Name <span className={styles.required}>*</span>
        </label>
        <input
          type="text"
          id="contact-name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
          placeholder="Your full name"
          disabled={isSubmitting}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <span id="name-error" className={styles.fieldError}>
            {errors.name}
          </span>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="contact-email" className={styles.label}>
          Email <span className={styles.required}>*</span>
        </label>
        <input
          type="email"
          id="contact-email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
          placeholder="your.email@example.com"
          disabled={isSubmitting}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <span id="email-error" className={styles.fieldError}>
            {errors.email}
          </span>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="contact-subject" className={styles.label}>
          Subject <span className={styles.required}>*</span>
        </label>
        <input
          type="text"
          id="contact-subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`${styles.input} ${errors.subject ? styles.inputError : ''}`}
          placeholder="What is your inquiry about?"
          disabled={isSubmitting}
          aria-invalid={!!errors.subject}
          aria-describedby={errors.subject ? 'subject-error' : undefined}
        />
        {errors.subject && (
          <span id="subject-error" className={styles.fieldError}>
            {errors.subject}
          </span>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="contact-message" className={styles.label}>
          Message <span className={styles.required}>*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`${styles.textarea} ${errors.message ? styles.inputError : ''}`}
          placeholder="Please describe your question or concern in detail..."
          rows={6}
          disabled={isSubmitting}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'message-error' : undefined}
        />
        {errors.message && (
          <span id="message-error" className={styles.fieldError}>
            {errors.message}
          </span>
        )}
        <span className={styles.charCount}>
          {formData.message.length} / {VALIDATION_RULES.message.maxLength}
        </span>
      </div>

      <button
        type="submit"
        className={styles.submitButton}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}

ContactForm.propTypes = {
  onSuccess: PropTypes.func,
};

ContactForm.defaultProps = {
  onSuccess: undefined,
};

export default ContactForm;
