/**
 * FeedbackPage Component
 * Public-facing page for event feedback submission.
 * Accessible only via direct URL (not in navigation menu).
 *
 * @module pages/FeedbackPage
 */

import { useMemo } from 'react';
import { FeedbackForm } from '../components/feedback';
import { useSettings, DEFAULT_SETTINGS } from '../context/SettingsContext';
import styles from './FeedbackPage.module.css';

/**
 * Checks if feedback submission is currently allowed.
 *
 * @param {Object} feedbackSettings - The feedback settings object
 * @returns {Object} Object with isOpen boolean and reason string
 */
function getFeedbackStatus(feedbackSettings) {
  if (!feedbackSettings?.enabled) {
    return { isOpen: false, reason: 'disabled' };
  }

  if (feedbackSettings.closingDate) {
    const closingDate = new Date(feedbackSettings.closingDate);
    // Set to end of day
    closingDate.setHours(23, 59, 59, 999);
    if (new Date() > closingDate) {
      return { isOpen: false, reason: 'expired' };
    }
  }

  return { isOpen: true, reason: null };
}

/**
 * FeedbackPage Component
 * Renders the feedback page with the feedback form.
 *
 * @returns {JSX.Element} The feedback page component
 */
function FeedbackPage() {
  const { settings, isLoading } = useSettings();

  // Use settings from context or fallback to defaults
  const feedbackSettings = settings?.feedback ?? DEFAULT_SETTINGS.feedback;

  const feedbackStatus = useMemo(
    () => getFeedbackStatus(feedbackSettings),
    [feedbackSettings]
  );

  // Get form title and subtitle from settings
  const formTitle = feedbackSettings?.formTitle || 'Event Feedback';
  const formSubtitle =
    feedbackSettings?.formSubtitle ||
    'We value your feedback. Please share your experience with us.';
  const fields = feedbackSettings?.fields || [];

  // Show loading state
  if (isLoading) {
    return (
      <div className={styles.page}>
        <section className={styles.heroSection}>
          <div className="container">
            <h1 className={styles.heroTitle}>{formTitle}</h1>
            <p className={styles.heroSubtitle}>Loading...</p>
          </div>
        </section>
      </div>
    );
  }

  // Show closed message if feedback is not open
  if (!feedbackStatus.isOpen) {
    return (
      <div className={styles.page}>
        <section className={styles.heroSection}>
          <div className="container">
            <h1 className={styles.heroTitle}>{formTitle}</h1>
            <p className={styles.heroSubtitle}>
              {feedbackStatus.reason === 'expired'
                ? 'The feedback period has ended.'
                : 'Feedback is currently not available.'}
            </p>
          </div>
        </section>
        <section className={styles.contentSection}>
          <div className="container">
            <div className={styles.formWrapper}>
              <div className={styles.closedMessage}>
                <div className={styles.closedIcon}>
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
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <h2 className={styles.closedTitle}>
                  {feedbackStatus.reason === 'expired'
                    ? 'Feedback Period Closed'
                    : 'Feedback Unavailable'}
                </h2>
                <p className={styles.closedText}>
                  {feedbackStatus.reason === 'expired'
                    ? 'Thank you for your interest. The feedback submission period for this event has ended.'
                    : 'The feedback form is currently not available. Please check back later.'}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className="container">
          <h1 className={styles.heroTitle}>{formTitle}</h1>
          <p className={styles.heroSubtitle}>{formSubtitle}</p>
        </div>
      </section>

      {/* Main Content */}
      <section className={styles.contentSection}>
        <div className="container">
          <div className={styles.formWrapper}>
            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>Share Your Experience</h2>
              <p className={styles.sectionSubtitle}>
                Your feedback helps us improve future events and better serve our community.
              </p>
              <FeedbackForm fields={fields} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default FeedbackPage;
