/**
 * RefundPolicySettings Component
 * Form for managing conference refund policy settings.
 *
 * @module components/admin/RefundPolicySettings
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styles from './SettingsForm.module.css';

/**
 * Default refund policy settings values
 */
const DEFAULT_REFUND_POLICY = {
  enabled: true,
  fullRefundDays: 14,
  partialRefundDays: 7,
  partialRefundPercent: 50,
  noRefundMessage: 'Refunds are not available for this event.',
  fullRefundMessage: 'Full refund available until {days} days before the event.',
  partialRefundMessage: 'Partial refund ({percent}%) available until {days} days before the event.',
  lateRefundMessage: 'Cancellations within {days} days of the event are not eligible for refund.',
  // User cancellation policy
  userCancellationEnabled: true,
  // Transfer policy
  transferEnabled: true,
  transferDeadlineDays: 3,
};

/**
 * RefundPolicySettings Component
 *
 * @param {Object} props - Component props
 * @param {Object} props.settings - Current settings values
 * @param {Function} props.onSave - Callback when settings are saved
 * @param {boolean} props.isLoading - Loading state
 * @returns {JSX.Element} The refund policy settings form
 */
function RefundPolicySettings({ settings, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    refundPolicy: {
      enabled: settings?.refundPolicy?.enabled ?? DEFAULT_REFUND_POLICY.enabled,
      fullRefundDays: settings?.refundPolicy?.fullRefundDays ?? DEFAULT_REFUND_POLICY.fullRefundDays,
      partialRefundDays: settings?.refundPolicy?.partialRefundDays ?? DEFAULT_REFUND_POLICY.partialRefundDays,
      partialRefundPercent: settings?.refundPolicy?.partialRefundPercent ?? DEFAULT_REFUND_POLICY.partialRefundPercent,
      noRefundMessage: settings?.refundPolicy?.noRefundMessage || DEFAULT_REFUND_POLICY.noRefundMessage,
      fullRefundMessage: settings?.refundPolicy?.fullRefundMessage || DEFAULT_REFUND_POLICY.fullRefundMessage,
      partialRefundMessage: settings?.refundPolicy?.partialRefundMessage || DEFAULT_REFUND_POLICY.partialRefundMessage,
      lateRefundMessage: settings?.refundPolicy?.lateRefundMessage || DEFAULT_REFUND_POLICY.lateRefundMessage,
      userCancellationEnabled: settings?.refundPolicy?.userCancellationEnabled ?? DEFAULT_REFUND_POLICY.userCancellationEnabled,
      transferEnabled: settings?.refundPolicy?.transferEnabled ?? DEFAULT_REFUND_POLICY.transferEnabled,
      transferDeadlineDays: settings?.refundPolicy?.transferDeadlineDays ?? DEFAULT_REFUND_POLICY.transferDeadlineDays,
    },
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  /**
   * Syncs form data when settings prop changes (e.g., after initial load from DB)
   */
  useEffect(() => {
    if (settings) {
      setFormData({
        refundPolicy: {
          enabled: settings.refundPolicy?.enabled ?? DEFAULT_REFUND_POLICY.enabled,
          fullRefundDays: settings.refundPolicy?.fullRefundDays ?? DEFAULT_REFUND_POLICY.fullRefundDays,
          partialRefundDays: settings.refundPolicy?.partialRefundDays ?? DEFAULT_REFUND_POLICY.partialRefundDays,
          partialRefundPercent: settings.refundPolicy?.partialRefundPercent ?? DEFAULT_REFUND_POLICY.partialRefundPercent,
          noRefundMessage: settings.refundPolicy?.noRefundMessage || DEFAULT_REFUND_POLICY.noRefundMessage,
          fullRefundMessage: settings.refundPolicy?.fullRefundMessage || DEFAULT_REFUND_POLICY.fullRefundMessage,
          partialRefundMessage: settings.refundPolicy?.partialRefundMessage || DEFAULT_REFUND_POLICY.partialRefundMessage,
          lateRefundMessage: settings.refundPolicy?.lateRefundMessage || DEFAULT_REFUND_POLICY.lateRefundMessage,
          userCancellationEnabled: settings.refundPolicy?.userCancellationEnabled ?? DEFAULT_REFUND_POLICY.userCancellationEnabled,
          transferEnabled: settings.refundPolicy?.transferEnabled ?? DEFAULT_REFUND_POLICY.transferEnabled,
          transferDeadlineDays: settings.refundPolicy?.transferDeadlineDays ?? DEFAULT_REFUND_POLICY.transferDeadlineDays,
        },
      });
    }
  }, [settings]);

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

      {/* Refund Policy Section */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Refund Policy</h3>
        <p className={styles.sectionDescription}>
          Configure the refund policy for registration cancellations. This determines when
          attendees are eligible for full, partial, or no refund based on how close to the event
          they cancel.
        </p>
        <div className={styles.grid}>
          <div className={styles.fieldFull}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.refundPolicy.enabled}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    refundPolicy: { ...prev.refundPolicy, enabled: e.target.checked },
                  }));
                }}
                className={styles.checkbox}
              />
              <span>Enable Refunds</span>
            </label>
            <p className={styles.fieldHint}>
              When disabled, no refunds will be available for any cancellation.
            </p>
          </div>

          {formData.refundPolicy.enabled && (
            <>
              <div className={styles.field}>
                <label htmlFor="refundPolicy.fullRefundDays" className={styles.label}>
                  Full Refund Days
                </label>
                <input
                  type="number"
                  id="refundPolicy.fullRefundDays"
                  name="refundPolicy.fullRefundDays"
                  value={formData.refundPolicy.fullRefundDays ?? ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? null : parseInt(e.target.value, 10);
                    setFormData((prev) => ({
                      ...prev,
                      refundPolicy: { ...prev.refundPolicy, fullRefundDays: value },
                    }));
                  }}
                  className={styles.input}
                  placeholder="14"
                  min="0"
                />
                <p className={styles.fieldHint}>
                  Days before event for 100% refund eligibility. Leave empty to disable full refunds.
                </p>
              </div>

              <div className={styles.field}>
                <label htmlFor="refundPolicy.partialRefundDays" className={styles.label}>
                  Partial Refund Days
                </label>
                <input
                  type="number"
                  id="refundPolicy.partialRefundDays"
                  name="refundPolicy.partialRefundDays"
                  value={formData.refundPolicy.partialRefundDays ?? ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? null : parseInt(e.target.value, 10);
                    setFormData((prev) => ({
                      ...prev,
                      refundPolicy: { ...prev.refundPolicy, partialRefundDays: value },
                    }));
                  }}
                  className={styles.input}
                  placeholder="7"
                  min="0"
                />
                <p className={styles.fieldHint}>
                  Days before event for partial refund. Leave empty to disable partial refunds.
                </p>
              </div>

              <div className={styles.field}>
                <label htmlFor="refundPolicy.partialRefundPercent" className={styles.label}>
                  Partial Refund Percentage
                </label>
                <input
                  type="number"
                  id="refundPolicy.partialRefundPercent"
                  name="refundPolicy.partialRefundPercent"
                  value={formData.refundPolicy.partialRefundPercent}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10) || 0;
                    setFormData((prev) => ({
                      ...prev,
                      refundPolicy: { ...prev.refundPolicy, partialRefundPercent: value },
                    }));
                  }}
                  className={styles.input}
                  placeholder="50"
                  min="0"
                  max="100"
                />
                <p className={styles.fieldHint}>
                  Percentage of registration fee refunded during partial refund window (0-100).
                </p>
              </div>

              <div className={styles.fieldFull} style={{ marginTop: '1rem' }}>
                <div style={{
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #0ea5e9',
                  borderRadius: '8px',
                  padding: '1rem',
                }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#0369a1', fontWeight: '500' }}>
                    Policy Summary
                  </p>
                  <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#0c4a6e' }}>
                    {formData.refundPolicy.fullRefundDays !== null && (
                      <li>Full refund (100%): {formData.refundPolicy.fullRefundDays}+ days before event</li>
                    )}
                    {formData.refundPolicy.partialRefundDays !== null && formData.refundPolicy.partialRefundDays !== formData.refundPolicy.fullRefundDays && (
                      <li>
                        Partial refund ({formData.refundPolicy.partialRefundPercent}%):
                        {' '}{formData.refundPolicy.partialRefundDays}-{(formData.refundPolicy.fullRefundDays || formData.refundPolicy.partialRefundDays) - 1} days before event
                      </li>
                    )}
                    <li>
                      No refund: Less than {formData.refundPolicy.partialRefundDays || formData.refundPolicy.fullRefundDays || 0} days before event
                    </li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* User Self-Service Section */}
      <section className={styles.section} style={{ marginTop: '2rem' }}>
        <h3 className={styles.sectionTitle}>User Self-Service Options</h3>
        <p className={styles.sectionDescription}>
          Configure what actions attendees can perform themselves from the registration status page.
        </p>
        <div className={styles.grid}>
          <div className={styles.fieldFull}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.refundPolicy.userCancellationEnabled}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    refundPolicy: { ...prev.refundPolicy, userCancellationEnabled: e.target.checked },
                  }));
                }}
                className={styles.checkbox}
              />
              <span>Allow User Cancellation</span>
            </label>
            <p className={styles.fieldHint}>
              When enabled, attendees can cancel their own registration from the registration status page.
              Refund eligibility follows the policy configured above.
            </p>
          </div>

          <div className={styles.fieldFull}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.refundPolicy.transferEnabled}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    refundPolicy: { ...prev.refundPolicy, transferEnabled: e.target.checked },
                  }));
                }}
                className={styles.checkbox}
              />
              <span>Allow Registration Transfer</span>
            </label>
            <p className={styles.fieldHint}>
              When enabled, attendees can transfer their registration to another person from the registration status page.
            </p>
          </div>

          {formData.refundPolicy.transferEnabled && (
            <div className={styles.field}>
              <label htmlFor="refundPolicy.transferDeadlineDays" className={styles.label}>
                Transfer Deadline (Days Before Event)
              </label>
              <input
                type="number"
                id="refundPolicy.transferDeadlineDays"
                name="refundPolicy.transferDeadlineDays"
                value={formData.refundPolicy.transferDeadlineDays ?? ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? null : parseInt(e.target.value, 10);
                  setFormData((prev) => ({
                    ...prev,
                    refundPolicy: { ...prev.refundPolicy, transferDeadlineDays: value },
                  }));
                }}
                className={styles.input}
                placeholder="3"
                min="0"
              />
              <p className={styles.fieldHint}>
                Minimum days before the event that transfers are allowed. Set to 0 to allow transfers anytime.
              </p>
            </div>
          )}

          {/* Summary Box */}
          <div className={styles.fieldFull} style={{ marginTop: '1rem' }}>
            <div style={{
              backgroundColor: '#f0f9ff',
              border: '1px solid #0ea5e9',
              borderRadius: '8px',
              padding: '1rem',
            }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#0369a1', fontWeight: '500' }}>
                Self-Service Summary
              </p>
              <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#0c4a6e' }}>
                <li>
                  User cancellation: {formData.refundPolicy.userCancellationEnabled ? 'Enabled' : 'Disabled'}
                </li>
                <li>
                  Registration transfer: {formData.refundPolicy.transferEnabled
                    ? (formData.refundPolicy.transferDeadlineDays > 0
                      ? `Enabled (until ${formData.refundPolicy.transferDeadlineDays} days before event)`
                      : 'Enabled (anytime)')
                    : 'Disabled'}
                </li>
              </ul>
            </div>
          </div>
        </div>
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

RefundPolicySettings.propTypes = {
  settings: PropTypes.shape({
    refundPolicy: PropTypes.shape({
      enabled: PropTypes.bool,
      fullRefundDays: PropTypes.number,
      partialRefundDays: PropTypes.number,
      partialRefundPercent: PropTypes.number,
      noRefundMessage: PropTypes.string,
      fullRefundMessage: PropTypes.string,
      partialRefundMessage: PropTypes.string,
      lateRefundMessage: PropTypes.string,
      userCancellationEnabled: PropTypes.bool,
      transferEnabled: PropTypes.bool,
      transferDeadlineDays: PropTypes.number,
    }),
  }),
  onSave: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

RefundPolicySettings.defaultProps = {
  settings: null,
  isLoading: false,
};

export default RefundPolicySettings;
