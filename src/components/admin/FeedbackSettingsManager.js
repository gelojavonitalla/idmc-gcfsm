/**
 * FeedbackSettingsManager Component
 * Manages feedback form settings and form builder for the conference.
 * Used as tab content in the AdminSettingsPage.
 *
 * @module components/admin/FeedbackSettingsManager
 */

import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { getConferenceSettings, updateConferenceSettings } from '../../services/settings';
import { useAdminAuth } from '../../context';
import { ROUTES } from '../../constants';
import FormFieldEditor from './FormFieldEditor';
import styles from './FeedbackSettingsManager.module.css';

/**
 * Default feedback settings
 */
const DEFAULT_FEEDBACK_SETTINGS = {
  enabled: false,
  closingDate: null,
  formTitle: 'Event Feedback',
  formSubtitle: 'We value your feedback. Please share your experience with us.',
  fields: [],
};

/**
 * Field type labels for display
 */
const FIELD_TYPE_LABELS = {
  text: 'Text',
  textarea: 'Text Area',
  checkbox: 'Checkbox',
  checkboxGroup: 'Checkbox Group',
  radio: 'Radio',
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
  const [isFieldEditorOpen, setIsFieldEditorOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [activeTab, setActiveTab] = useState('settings');

  /**
   * Fetches current feedback settings
   */
  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const settings = await getConferenceSettings();
      setFeedbackSettings({
        ...DEFAULT_FEEDBACK_SETTINGS,
        ...settings.feedback,
        fields: settings.feedback?.fields || [],
      });
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
   * Handles changing text inputs
   */
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFeedbackSettings((prev) => ({
      ...prev,
      [name]: value || null,
    }));
  };

  /**
   * Opens field editor for adding a new field
   */
  const handleAddField = () => {
    setEditingField(null);
    setIsFieldEditorOpen(true);
  };

  /**
   * Opens field editor for editing an existing field
   */
  const handleEditField = (field) => {
    setEditingField(field);
    setIsFieldEditorOpen(true);
  };

  /**
   * Saves a field (add or update)
   */
  const handleSaveField = (fieldData) => {
    setFeedbackSettings((prev) => {
      const fields = [...prev.fields];
      const existingIndex = fields.findIndex((f) => f.id === fieldData.id);

      if (existingIndex >= 0) {
        // Update existing field
        fields[existingIndex] = { ...fields[existingIndex], ...fieldData };
      } else {
        // Add new field with order
        const maxOrder = fields.reduce((max, f) => Math.max(max, f.order || 0), 0);
        fields.push({ ...fieldData, order: maxOrder + 1 });
      }

      return { ...prev, fields };
    });
    setIsFieldEditorOpen(false);
    setEditingField(null);
  };

  /**
   * Deletes a field
   */
  const handleDeleteField = (fieldId) => {
    if (!window.confirm('Are you sure you want to delete this field?')) {
      return;
    }
    setFeedbackSettings((prev) => ({
      ...prev,
      fields: prev.fields.filter((f) => f.id !== fieldId),
    }));
  };

  /**
   * Moves a field up in order
   */
  const handleMoveFieldUp = (index) => {
    if (index === 0) return;
    setFeedbackSettings((prev) => {
      const fields = [...prev.fields];
      const temp = fields[index].order;
      fields[index].order = fields[index - 1].order;
      fields[index - 1].order = temp;
      return { ...prev, fields };
    });
  };

  /**
   * Moves a field down in order
   */
  const handleMoveFieldDown = (index) => {
    setFeedbackSettings((prev) => {
      if (index >= prev.fields.length - 1) return prev;
      const fields = [...prev.fields];
      const temp = fields[index].order;
      fields[index].order = fields[index + 1].order;
      fields[index + 1].order = temp;
      return { ...prev, fields };
    });
  };

  const loading = isLoading || parentLoading;
  const feedbackUrl = `${window.location.origin}${ROUTES.FEEDBACK}`;
  const sortedFields = [...(feedbackSettings.fields || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>Feedback Form Settings</h3>
        <p className={styles.description}>
          Configure the feedback form and manage form fields.
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

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tabButton} ${activeTab === 'settings' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          General Settings
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'fields' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('fields')}
        >
          Form Fields ({sortedFields.length})
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className={styles.loading}>Loading settings...</div>
      ) : (
        <div className={styles.form}>
          {activeTab === 'settings' && (
            <>
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

              {/* Form Title */}
              <div className={styles.fieldGroup}>
                <label htmlFor="form-title" className={styles.label}>
                  Form Title
                </label>
                <input
                  type="text"
                  id="form-title"
                  name="formTitle"
                  value={feedbackSettings.formTitle || ''}
                  onChange={handleInputChange}
                  className={styles.input}
                  disabled={isSaving}
                  placeholder="e.g., Event Feedback"
                />
              </div>

              {/* Form Subtitle */}
              <div className={styles.fieldGroup}>
                <label htmlFor="form-subtitle" className={styles.label}>
                  Form Subtitle
                </label>
                <input
                  type="text"
                  id="form-subtitle"
                  name="formSubtitle"
                  value={feedbackSettings.formSubtitle || ''}
                  onChange={handleInputChange}
                  className={styles.input}
                  disabled={isSaving}
                  placeholder="e.g., We value your feedback..."
                />
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
                    name="closingDate"
                    value={feedbackSettings.closingDate || ''}
                    onChange={handleInputChange}
                    className={styles.dateInput}
                    disabled={isSaving}
                  />
                  {feedbackSettings.closingDate && (
                    <button
                      type="button"
                      onClick={() => setFeedbackSettings((prev) => ({ ...prev, closingDate: null }))}
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
            </>
          )}

          {activeTab === 'fields' && (
            <>
              {/* Add Field Button */}
              <div className={styles.fieldsHeader}>
                <p className={styles.fieldsDescription}>
                  Configure the fields that appear on the feedback form. Drag to reorder.
                </p>
                <button
                  type="button"
                  onClick={handleAddField}
                  className={styles.addFieldButton}
                  disabled={isSaving}
                >
                  + Add Field
                </button>
              </div>

              {/* Fields List */}
              {sortedFields.length === 0 ? (
                <div className={styles.emptyFields}>
                  <p>No fields configured yet.</p>
                  <p>Click &quot;Add Field&quot; to create your first form field.</p>
                </div>
              ) : (
                <div className={styles.fieldsList}>
                  {sortedFields.map((field, index) => (
                    <div key={field.id} className={styles.fieldItem}>
                      <div className={styles.fieldOrder}>
                        <button
                          type="button"
                          onClick={() => handleMoveFieldUp(index)}
                          disabled={index === 0 || isSaving}
                          className={styles.orderButton}
                          aria-label="Move up"
                        >
                          &#9650;
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveFieldDown(index)}
                          disabled={index === sortedFields.length - 1 || isSaving}
                          className={styles.orderButton}
                          aria-label="Move down"
                        >
                          &#9660;
                        </button>
                      </div>
                      <div className={styles.fieldInfo}>
                        <span className={styles.fieldLabel}>{field.label}</span>
                        <div className={styles.fieldMeta}>
                          <span className={styles.fieldType}>{FIELD_TYPE_LABELS[field.type] || field.type}</span>
                          {field.required && <span className={styles.fieldRequired}>Required</span>}
                          {field.conditionalOn && (
                            <span className={styles.fieldConditional}>Conditional</span>
                          )}
                        </div>
                      </div>
                      <div className={styles.fieldActions}>
                        <button
                          type="button"
                          onClick={() => handleEditField(field)}
                          className={styles.editButton}
                          disabled={isSaving}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteField(field.id)}
                          className={styles.deleteButton}
                          disabled={isSaving}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

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

      {/* Field Editor Modal */}
      <FormFieldEditor
        isOpen={isFieldEditorOpen}
        onClose={() => {
          setIsFieldEditorOpen(false);
          setEditingField(null);
        }}
        onSave={handleSaveField}
        field={editingField}
        existingFields={feedbackSettings.fields || []}
      />
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
