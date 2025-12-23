/**
 * FeedbackForm Component
 * Form for submitting event feedback with spiritual impact assessment and open-ended responses.
 *
 * @module components/feedback/FeedbackForm
 */

import { useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { submitFeedback } from '../../services/feedback';
import styles from './FeedbackForm.module.css';

/**
 * Rate limiter for spam logging to prevent DoS via log flooding.
 * Limits logging to once per minute.
 */
const SPAM_LOG_INTERVAL_MS = 60000;

/**
 * Initial form state
 */
const INITIAL_FORM_STATE = {
  isAnonymous: true,
  submitterName: '',
  age: '',
  growthGroup: '',
  receivedJesus: false,
  commitmentToGrow: false,
  commitmentToRelationship: false,
  commitmentToGroup: false,
  commitmentToMinistry: false,
  seekCounselling: false,
  counsellingName: '',
  counsellingPhone: '',
  howBlessed: '',
  godDidInMe: '',
  smartGoal: '',
  programme: '',
  couldDoWithout: '',
  couldDoMoreOf: '',
  bestDoneWas: '',
  otherComments: '',
  honeypot: '',
};

/**
 * FeedbackForm Component
 * Renders a feedback form with spiritual impact checkboxes and open-ended responses.
 *
 * @param {Object} props - Component props
 * @param {Function} [props.onSuccess] - Callback when form is successfully submitted
 * @returns {JSX.Element} The feedback form component
 */
function FeedbackForm({ onSuccess }) {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const lastSpamLogTimeRef = useRef(0);

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
    setFormData((prev) => {
      const newState = { ...prev, [name]: checked };
      // Clear counselling fields when unchecking seekCounselling
      if (name === 'seekCounselling' && !checked) {
        newState.counsellingName = '';
        newState.counsellingPhone = '';
      }
      // Clear submitterName when checking anonymous
      if (name === 'isAnonymous' && checked) {
        newState.submitterName = '';
      }
      return newState;
    });
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }, []);

  /**
   * Validates the form before submission
   *
   * @returns {boolean} True if form is valid
   */
  const validateForm = useCallback(() => {
    const newErrors = {};

    // Validate counselling contact info if seeking counselling
    if (formData.seekCounselling) {
      if (!formData.counsellingName.trim()) {
        newErrors.counsellingName = 'Name is required when seeking counselling';
      }
      if (!formData.counsellingPhone.trim()) {
        newErrors.counsellingPhone = 'Phone number is required when seeking counselling';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

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
        await submitFeedback({
          isAnonymous: formData.isAnonymous,
          submitterName: formData.isAnonymous ? null : formData.submitterName,
          age: formData.age,
          growthGroup: formData.growthGroup,
          receivedJesus: formData.receivedJesus,
          commitmentToGrow: formData.commitmentToGrow,
          commitmentToRelationship: formData.commitmentToRelationship,
          commitmentToGroup: formData.commitmentToGroup,
          commitmentToMinistry: formData.commitmentToMinistry,
          seekCounselling: formData.seekCounselling,
          counsellingName: formData.seekCounselling ? formData.counsellingName : null,
          counsellingPhone: formData.seekCounselling ? formData.counsellingPhone : null,
          howBlessed: formData.howBlessed,
          godDidInMe: formData.godDidInMe,
          smartGoal: formData.smartGoal,
          programme: formData.programme,
          couldDoWithout: formData.couldDoWithout,
          couldDoMoreOf: formData.couldDoMoreOf,
          bestDoneWas: formData.bestDoneWas,
          otherComments: formData.otherComments,
        });

        setSubmitStatus('success');
        setFormData(INITIAL_FORM_STATE);

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
        <h3 className={styles.successTitle}>Thank You!</h3>
        <p className={styles.successText}>
          Your feedback has been submitted successfully. We appreciate you taking the time to share your experience.
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

      {/* Anonymous Toggle */}
      <div className={styles.fieldGroup}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            name="isAnonymous"
            checked={formData.isAnonymous}
            onChange={handleCheckboxChange}
            className={styles.checkbox}
            disabled={isSubmitting}
          />
          <span className={styles.checkboxText}>Submit anonymously</span>
        </label>
      </div>

      {/* Name Field (shows when not anonymous) */}
      {!formData.isAnonymous && (
        <div className={styles.fieldGroup}>
          <label htmlFor="feedback-name" className={styles.label}>
            Name
          </label>
          <input
            type="text"
            id="feedback-name"
            name="submitterName"
            value={formData.submitterName}
            onChange={handleChange}
            className={styles.input}
            placeholder="Enter your name"
            disabled={isSubmitting}
          />
        </div>
      )}

      {/* Age and Growth Group */}
      <div className={styles.fieldRow}>
        <div className={styles.fieldGroup}>
          <label htmlFor="feedback-age" className={styles.label}>
            Age
          </label>
          <input
            type="text"
            id="feedback-age"
            name="age"
            value={formData.age}
            onChange={handleChange}
            className={styles.input}
            placeholder="Optional"
            disabled={isSubmitting}
          />
        </div>
        <div className={styles.fieldGroup}>
          <label htmlFor="feedback-growth-group" className={styles.label}>
            Growth Group
          </label>
          <input
            type="text"
            id="feedback-growth-group"
            name="growthGroup"
            value={formData.growthGroup}
            onChange={handleChange}
            className={styles.input}
            placeholder="Optional"
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Spiritual Impact Section */}
      <div className={styles.section}>
        <p className={styles.sectionLabel}>
          Please assess the spiritual impact of CROSSROAD to you. Check the appropriate boxes.
        </p>
        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="receivedJesus"
              checked={formData.receivedJesus}
              onChange={handleCheckboxChange}
              className={styles.checkbox}
              disabled={isSubmitting}
            />
            <span className={styles.checkboxText}>
              I received Jesus as my personal Lord and Savior
            </span>
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="commitmentToGrow"
              checked={formData.commitmentToGrow}
              onChange={handleCheckboxChange}
              className={styles.checkbox}
              disabled={isSubmitting}
            />
            <span className={styles.checkboxText}>
              I made a commitment to grow in my spiritual habits
            </span>
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="commitmentToRelationship"
              checked={formData.commitmentToRelationship}
              onChange={handleCheckboxChange}
              className={styles.checkbox}
              disabled={isSubmitting}
            />
            <span className={styles.checkboxText}>
              I made a commitment to work on my relationship/s
            </span>
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="commitmentToGroup"
              checked={formData.commitmentToGroup}
              onChange={handleCheckboxChange}
              className={styles.checkbox}
              disabled={isSubmitting}
            />
            <span className={styles.checkboxText}>
              I made a commitment to join/lead a Growth/Mentoring Group
            </span>
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="commitmentToMinistry"
              checked={formData.commitmentToMinistry}
              onChange={handleCheckboxChange}
              className={styles.checkbox}
              disabled={isSubmitting}
            />
            <span className={styles.checkboxText}>
              I made a commitment to serve in a ministry
            </span>
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="seekCounselling"
              checked={formData.seekCounselling}
              onChange={handleCheckboxChange}
              className={styles.checkbox}
              disabled={isSubmitting}
            />
            <span className={styles.checkboxText}>I want to seek counselling</span>
          </label>
        </div>
      </div>

      {/* Counselling Contact Fields */}
      {formData.seekCounselling && (
        <div className={styles.counsellingSection}>
          <p className={styles.counsellingLabel}>
            Please provide your contact information so we can reach out to you:
          </p>
          <div className={styles.fieldGroup}>
            <label htmlFor="feedback-counselling-name" className={styles.label}>
              Name <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="feedback-counselling-name"
              name="counsellingName"
              value={formData.counsellingName}
              onChange={handleChange}
              className={`${styles.input} ${errors.counsellingName ? styles.inputError : ''}`}
              placeholder="Enter your name"
              disabled={isSubmitting}
              aria-invalid={!!errors.counsellingName}
              aria-describedby={errors.counsellingName ? 'counselling-name-error' : undefined}
            />
            {errors.counsellingName && (
              <span id="counselling-name-error" className={styles.fieldError}>
                {errors.counsellingName}
              </span>
            )}
          </div>
          <div className={styles.fieldGroup}>
            <label htmlFor="feedback-counselling-phone" className={styles.label}>
              Phone Number <span className={styles.required}>*</span>
            </label>
            <input
              type="tel"
              id="feedback-counselling-phone"
              name="counsellingPhone"
              value={formData.counsellingPhone}
              onChange={handleChange}
              className={`${styles.input} ${errors.counsellingPhone ? styles.inputError : ''}`}
              placeholder="Enter your phone number"
              disabled={isSubmitting}
              aria-invalid={!!errors.counsellingPhone}
              aria-describedby={errors.counsellingPhone ? 'counselling-phone-error' : undefined}
            />
            {errors.counsellingPhone && (
              <span id="counselling-phone-error" className={styles.fieldError}>
                {errors.counsellingPhone}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Open-ended questions */}
      <div className={styles.fieldGroup}>
        <label htmlFor="feedback-how-blessed" className={styles.label}>
          Please share specifically how you were blessed:
        </label>
        <textarea
          id="feedback-how-blessed"
          name="howBlessed"
          value={formData.howBlessed}
          onChange={handleChange}
          className={styles.textarea}
          rows={3}
          disabled={isSubmitting}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="feedback-god-did" className={styles.label}>
          One thing that God did to me in me this Crossroads Weekend is:
        </label>
        <textarea
          id="feedback-god-did"
          name="godDidInMe"
          value={formData.godDidInMe}
          onChange={handleChange}
          className={styles.textarea}
          rows={3}
          disabled={isSubmitting}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="feedback-smart-goal" className={styles.label}>
          One smart goal that I have committed to fulfil is:
        </label>
        <textarea
          id="feedback-smart-goal"
          name="smartGoal"
          value={formData.smartGoal}
          onChange={handleChange}
          className={styles.textarea}
          rows={3}
          disabled={isSubmitting}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="feedback-programme" className={styles.label}>
          Programme:
        </label>
        <textarea
          id="feedback-programme"
          name="programme"
          value={formData.programme}
          onChange={handleChange}
          className={styles.textarea}
          rows={2}
          disabled={isSubmitting}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="feedback-could-do-without" className={styles.label}>
          Could do without:
        </label>
        <textarea
          id="feedback-could-do-without"
          name="couldDoWithout"
          value={formData.couldDoWithout}
          onChange={handleChange}
          className={styles.textarea}
          rows={2}
          disabled={isSubmitting}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="feedback-could-do-more" className={styles.label}>
          Could do more of:
        </label>
        <textarea
          id="feedback-could-do-more"
          name="couldDoMoreOf"
          value={formData.couldDoMoreOf}
          onChange={handleChange}
          className={styles.textarea}
          rows={2}
          disabled={isSubmitting}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="feedback-best-done" className={styles.label}>
          Best done was:
        </label>
        <textarea
          id="feedback-best-done"
          name="bestDoneWas"
          value={formData.bestDoneWas}
          onChange={handleChange}
          className={styles.textarea}
          rows={2}
          disabled={isSubmitting}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="feedback-other-comments" className={styles.label}>
          Other comments:
        </label>
        <textarea
          id="feedback-other-comments"
          name="otherComments"
          value={formData.otherComments}
          onChange={handleChange}
          className={styles.textarea}
          rows={3}
          disabled={isSubmitting}
        />
      </div>

      <button
        type="submit"
        className={styles.submitButton}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </form>
  );
}

FeedbackForm.propTypes = {
  onSuccess: PropTypes.func,
};

FeedbackForm.defaultProps = {
  onSuccess: undefined,
};

export default FeedbackForm;
