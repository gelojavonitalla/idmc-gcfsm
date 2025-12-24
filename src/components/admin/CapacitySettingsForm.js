/**
 * CapacitySettingsForm Component
 * Form for managing conference capacity and waitlist settings.
 *
 * @module components/admin/CapacitySettingsForm
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getConferenceStats } from '../../services/stats';
import styles from './SettingsForm.module.css';

/**
 * Default capacity settings values
 */
const DEFAULT_CAPACITY_SETTINGS = {
  conferenceCapacity: null,
  waitlist: {
    enabled: false,
    capacity: null,
  },
};

/**
 * CapacitySettingsForm Component
 *
 * @param {Object} props - Component props
 * @param {Object} props.settings - Current settings values
 * @param {Function} props.onSave - Callback when settings are saved
 * @param {boolean} props.isLoading - Loading state
 * @returns {JSX.Element} The capacity settings form
 */
function CapacitySettingsForm({ settings, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    conferenceCapacity: settings?.conferenceCapacity ?? DEFAULT_CAPACITY_SETTINGS.conferenceCapacity,
    waitlist: {
      enabled: settings?.waitlist?.enabled ?? DEFAULT_CAPACITY_SETTINGS.waitlist.enabled,
      capacity: settings?.waitlist?.capacity ?? DEFAULT_CAPACITY_SETTINGS.waitlist.capacity,
    },
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Stats from stats collection
  const [registeredAttendeeCount, setRegisteredAttendeeCount] = useState(0);
  const [isSyncingStats, setIsSyncingStats] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [syncSuccess, setSyncSuccess] = useState(false);

  /**
   * Syncs form data when settings prop changes (e.g., after initial load from DB)
   */
  useEffect(() => {
    if (settings) {
      setFormData({
        conferenceCapacity: settings.conferenceCapacity ?? DEFAULT_CAPACITY_SETTINGS.conferenceCapacity,
        waitlist: {
          enabled: settings.waitlist?.enabled ?? DEFAULT_CAPACITY_SETTINGS.waitlist.enabled,
          capacity: settings.waitlist?.capacity ?? DEFAULT_CAPACITY_SETTINGS.waitlist.capacity,
        },
      });
    }
  }, [settings]);

  /**
   * Fetches conference stats from the stats collection on mount
   */
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await getConferenceStats();
        setRegisteredAttendeeCount(stats?.registeredAttendeeCount ?? 0);
      } catch (error) {
        console.error('Failed to fetch conference stats:', error);
      }
    };
    fetchStats();
  }, []);

  /**
   * Triggers manual stats sync via Cloud Function
   */
  const handleSyncStats = async () => {
    setIsSyncingStats(true);
    setSyncError(null);
    setSyncSuccess(false);

    try {
      const functions = getFunctions(undefined, 'asia-southeast1');
      const triggerSync = httpsCallable(functions, 'triggerStatsSync');
      await triggerSync();

      // Refresh stats after sync
      const stats = await getConferenceStats();
      setRegisteredAttendeeCount(stats?.registeredAttendeeCount ?? 0);

      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to sync stats:', error);
      setSyncError('Failed to sync stats. Please try again.');
    } finally {
      setIsSyncingStats(false);
    }
  };

  /**
   * Handles form submission
   *
   * @param {Event} event - Submit event
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await onSave(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setSaveError(error.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.skeleton} />
      </div>
    );
  }

  return (
    <form className={styles.container} onSubmit={handleSubmit}>
      {/* Status Messages */}
      {saveError && (
        <div className={styles.errorMessage} role="alert">
          {saveError}
          <button type="button" onClick={() => setSaveError(null)} aria-label="Dismiss">
            &times;
          </button>
        </div>
      )}
      {saveSuccess && (
        <div className={styles.successMessage} role="status">
          Settings saved successfully!
        </div>
      )}

      {/* Capacity Settings Section */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Capacity Settings</h3>
        <p className={styles.sectionDescription}>
          Set the maximum number of attendees for the conference. This is the capacity of the main
          worship hall where everyone convenes. Leave empty for unlimited capacity.
        </p>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label htmlFor="conferenceCapacity" className={styles.label}>
              Conference Capacity (Main Worship Hall)
            </label>
            <input
              type="number"
              id="conferenceCapacity"
              name="conferenceCapacity"
              value={formData.conferenceCapacity || ''}
              onChange={(e) => {
                const value = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  conferenceCapacity: value === '' ? null : parseInt(value, 10),
                }));
              }}
              className={styles.input}
              min="1"
              placeholder="Leave empty for unlimited"
            />
            <p className={styles.fieldHint}>
              Maximum number of attendees allowed. When this limit is reached, registration will be
              closed automatically.
            </p>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>
              Current Registered Attendees
            </label>
            <div className={styles.readOnlyValue}>
              {registeredAttendeeCount}
              {formData.conferenceCapacity && (
                <span className={styles.capacityRatio}>
                  {' '}/ {formData.conferenceCapacity} ({
                    Math.round((registeredAttendeeCount / formData.conferenceCapacity) * 100)
                  }%)
                </span>
              )}
            </div>
            <p className={styles.fieldHint}>
              This count is stored in the stats collection and maintained by Cloud Functions.
            </p>
            <button
              type="button"
              className={styles.syncButton}
              onClick={handleSyncStats}
              disabled={isSyncingStats}
            >
              {isSyncingStats ? 'Syncing...' : 'Sync Stats'}
            </button>
            {syncSuccess && (
              <span className={styles.syncSuccess}>Stats synced successfully!</span>
            )}
            {syncError && (
              <span className={styles.syncError}>{syncError}</span>
            )}
          </div>
        </div>
      </section>

      {/* Waitlist Settings Section */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Waitlist Settings</h3>
        <p className={styles.sectionDescription}>
          Configure waitlisting when the conference reaches maximum capacity.
          When enabled, users can join a waitlist and will be notified automatically when slots become available.
        </p>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.waitlist.enabled}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    waitlist: {
                      ...prev.waitlist,
                      enabled: e.target.checked,
                    },
                  }));
                }}
                className={styles.checkbox}
              />
              <span>Enable Waitlist</span>
            </label>
            <p className={styles.fieldHint}>
              When enabled, users can join a waitlist after the conference capacity is reached.
              They will be automatically notified when a slot becomes available.
            </p>
          </div>
          {formData.waitlist.enabled && (
            <div className={styles.field}>
              <label htmlFor="waitlistCapacity" className={styles.label}>
                Waitlist Capacity
              </label>
              <input
                type="number"
                id="waitlistCapacity"
                name="waitlistCapacity"
                value={formData.waitlist.capacity || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    waitlist: {
                      ...prev.waitlist,
                      capacity: value === '' ? null : parseInt(value, 10),
                    },
                  }));
                }}
                className={styles.input}
                min="1"
                placeholder="Leave empty for unlimited"
              />
              <p className={styles.fieldHint}>
                Maximum number of people on the waitlist. Leave empty for unlimited waitlist capacity.
              </p>
            </div>
          )}
        </div>
        {formData.waitlist.enabled && (
          <div className={styles.infoBox} style={{
            backgroundColor: '#f3e8ff',
            border: '1px solid #a855f7',
            borderRadius: '8px',
            padding: '1rem',
            marginTop: '1rem',
          }}>
            <h4 style={{ color: '#7c3aed', margin: '0 0 0.5rem 0' }}>How Waitlist Works</h4>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#6b7280' }}>
              <li>Users can join the waitlist when conference capacity is reached</li>
              <li>When a confirmed registration is cancelled, the first person on the waitlist is automatically notified</li>
              <li>They receive an email with a link to complete payment within a deadline</li>
              <li>If they don&apos;t pay in time, the offer expires and the next person is notified</li>
              <li>Admins can also manually send payment notifications to any waitlisted person</li>
            </ul>
          </div>
        )}
      </section>

      {/* Submit Button */}
      <div className={styles.actions}>
        <button
          type="submit"
          className={styles.saveButton}
          disabled={isSaving}
        >
          {isSaving ? (
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
              Save Settings
            </>
          )}
        </button>
      </div>
    </form>
  );
}

CapacitySettingsForm.propTypes = {
  settings: PropTypes.shape({
    conferenceCapacity: PropTypes.number,
    waitlist: PropTypes.shape({
      enabled: PropTypes.bool,
      capacity: PropTypes.number,
    }),
  }),
  onSave: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

CapacitySettingsForm.defaultProps = {
  settings: null,
  isLoading: false,
};

export default CapacitySettingsForm;
