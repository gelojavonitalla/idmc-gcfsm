/**
 * FeedbackSettingsManager Component
 * Manages feedback form settings for the conference.
 * Used as tab content in the AdminSettingsPage.
 *
 * @module components/admin/FeedbackSettingsManager
 */

import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { getConferenceSettings, updateConferenceSettings } from '../../services/settings';
import { useAdminAuth } from '../../context';
import { ROUTES } from '../../constants';
import styles from './FeedbackSettingsManager.module.css';

/**
 * Default feedback settings
 */
const DEFAULT_FEEDBACK_SETTINGS = {
  enabled: false,
  closingDate: null,
};

/**
 * FeedbackSettingsManager Component
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isLoading - Loading state from parent
 * @returns {JSX.Element} The feedback settings manager
 */
function FeedbackSettingsManager({ isLoading: parentLoading }) {
  const { admin } = useAdminAuth();
  const [feedbackSettings, setFeedbackSettings] = useState(DEFAULT_FEEDBACK_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  /**
   * Fetches current feedback settings
   */
  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const settings = await getConferenceSettings();
      setFeedbackSettings(settings.feedback || DEFAULT_FEEDBACK_SETTINGS);
    } catch (fetchError) {
      console.error('Failed to fetch feedback settings:', fetchError);
      setError('Failed to load feedback settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch settings on mount
   */
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  /**
   * Handles saving feedback settings
   */
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      await updateConferenceSettings(
        { feedback: feedbackSettings },
        admin?.id,
        admin?.email
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (saveError) {
      console.error('Failed to save feedback settings:', saveError);
      setError('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handles toggling feedback enabled/disabled
   */
  const handleToggleEnabled = () => {
    setFeedbackSettings((prev) => ({
      ...prev,
      enabled: !prev.enabled,
    }));
  };

  /**
   * Handles changing the closing date
   */
  const handleClosingDateChange = (event) => {
    const value = event.target.value || null;
    setFeedbackSettings((prev) => ({
      ...prev,
      closingDate: value,
    }));
  };

  /**
   * Clears the closing date
   */
  const handleClearClosingDate = () => {
    setFeedbackSettings((prev) => ({
      ...prev,
      closingDate: null,
    }));
  };

  const loading = isLoading || parentLoading;
  const feedbackUrl = `${window.location.origin}${ROUTES.FEEDBACK}`;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>Feedback Form Settings</h3>
        <p className={styles.description}>
          Control when attendees can submit feedback for the conference.
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className={styles.errorBanner} role="alert">
          {error}
          <button onClick={() => setError(null)} aria-label="Dismiss error">
            &times;
          </button>
        </div>
      )}

      {/* Success Banner */}
      {saveSuccess && (
        <div className={styles.successBanner} role="status">
          Settings saved successfully!
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className={styles.loading}>Loading settings...</div>
      ) : (
        <div className={styles.form}>
          {/* Enable/Disable Toggle */}
          <div className={styles.fieldGroup}>
            <div className={styles.toggleRow}>
              <div className={styles.toggleLabel}>
                <span className={styles.label}>Feedback Form</span>
                <span className={styles.hint}>
                  When enabled, attendees can submit feedback via the feedback URL.
                </span>
              </div>
              <button
                type="button"
                className={`${styles.toggle} ${feedbackSettings.enabled ? styles.toggleOn : styles.toggleOff}`}
                onClick={handleToggleEnabled}
                disabled={isSaving}
                aria-pressed={feedbackSettings.enabled}
              >
                <span className={styles.toggleKnob} />
                <span className={styles.toggleText}>
                  {feedbackSettings.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </button>
            </div>
          </div>

          {/* Closing Date */}
          <div className={styles.fieldGroup}>
            <label htmlFor="closing-date" className={styles.label}>
              Closing Date
            </label>
            <span className={styles.hint}>
              Feedback will be accepted until 11:59 PM on this date. Leave empty for no expiration.
            </span>
            <div className={styles.dateRow}>
              <input
                type="date"
                id="closing-date"
                value={feedbackSettings.closingDate || ''}
                onChange={handleClosingDateChange}
                className={styles.dateInput}
                disabled={isSaving}
              />
              {feedbackSettings.closingDate && (
                <button
                  type="button"
                  onClick={handleClearClosingDate}
                  className={styles.clearButton}
                  disabled={isSaving}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Feedback URL */}
          <div className={styles.fieldGroup}>
            <span className={styles.label}>Feedback URL</span>
            <span className={styles.hint}>
              Share this URL with attendees to collect feedback.
            </span>
            <div className={styles.urlRow}>
              <code className={styles.urlCode}>{feedbackUrl}</code>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(feedbackUrl)}
                className={styles.copyButton}
              >
                Copy
              </button>
            </div>
          </div>

          {/* Status Summary */}
          <div className={styles.statusCard}>
            <div className={styles.statusHeader}>
              <span className={styles.statusLabel}>Current Status</span>
              <span
                className={`${styles.statusBadge} ${
                  feedbackSettings.enabled ? styles.statusOpen : styles.statusClosed
                }`}
              >
                {feedbackSettings.enabled ? 'Open' : 'Closed'}
              </span>
            </div>
            {feedbackSettings.enabled && feedbackSettings.closingDate && (
              <p className={styles.statusText}>
                Accepting feedback until{' '}
                {new Date(feedbackSettings.closingDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            )}
            {feedbackSettings.enabled && !feedbackSettings.closingDate && (
              <p className={styles.statusText}>Accepting feedback indefinitely</p>
            )}
            {!feedbackSettings.enabled && (
              <p className={styles.statusText}>Feedback form is currently disabled</p>
            )}
          </div>

          {/* Save Button */}
          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleSave}
              className={styles.saveButton}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

FeedbackSettingsManager.propTypes = {
  isLoading: PropTypes.bool,
};

FeedbackSettingsManager.defaultProps = {
  isLoading: false,
};

export default FeedbackSettingsManager;
