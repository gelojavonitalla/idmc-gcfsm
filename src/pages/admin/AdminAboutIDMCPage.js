/**
 * AdminAboutIDMCPage Component
 * Admin page for managing About IDMC content.
 *
 * @module pages/admin/AdminAboutIDMCPage
 */

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../../components/admin';
import {
  getConferenceSettings,
  updateConferenceSettings,
} from '../../services';
import styles from './AdminAboutIDMCPage.module.css';

/**
 * AdminAboutIDMCPage Component
 * Allows admins to edit the About IDMC page content.
 *
 * @returns {JSX.Element} The admin about IDMC page
 */
function AdminAboutIDMCPage() {
  const [settings, setSettings] = useState(null);
  const [formData, setFormData] = useState({
    mission: '',
    vision: '',
    history: '',
    milestones: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  /**
   * Fetches settings data
   */
  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getConferenceSettings();
      setSettings(data);
      setFormData({
        mission: data.aboutIdmc?.mission || '',
        vision: data.aboutIdmc?.vision || '',
        history: data.aboutIdmc?.history || '',
        milestones: data.aboutIdmc?.milestones || [],
      });
    } catch (fetchError) {
      console.error('Failed to fetch settings:', fetchError);
      setError('Failed to load content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch data on mount
   */
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  /**
   * Handles form field changes
   *
   * @param {React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>} e - Change event
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setSuccessMessage('');
  };

  /**
   * Handles milestone changes
   *
   * @param {number} index - Milestone index
   * @param {string} field - Field name (label or description)
   * @param {string} value - New value
   */
  const handleMilestoneChange = (index, field, value) => {
    setFormData((prev) => {
      const newMilestones = [...prev.milestones];
      newMilestones[index] = {
        ...newMilestones[index],
        [field]: value,
      };
      return { ...prev, milestones: newMilestones };
    });
    setSuccessMessage('');
  };

  /**
   * Adds a new milestone
   */
  const handleAddMilestone = () => {
    setFormData((prev) => ({
      ...prev,
      milestones: [...prev.milestones, { label: '', description: '' }],
    }));
    setSuccessMessage('');
  };

  /**
   * Removes a milestone
   *
   * @param {number} index - Index of milestone to remove
   */
  const handleRemoveMilestone = (index) => {
    setFormData((prev) => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index),
    }));
    setSuccessMessage('');
  };

  /**
   * Handles form submission
   *
   * @param {React.FormEvent} e - Form event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage('');

    try {
      const updatedSettings = {
        ...settings,
        aboutIdmc: {
          mission: formData.mission,
          vision: formData.vision,
          history: formData.history,
          milestones: formData.milestones.filter(
            (m) => m.label.trim() || m.description.trim()
          ),
        },
      };

      await updateConferenceSettings(updatedSettings);
      setSettings(updatedSettings);
      setSuccessMessage('About IDMC content saved successfully!');
    } catch (saveError) {
      console.error('Failed to save settings:', saveError);
      setError('Failed to save content. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout title="About IDMC">
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>About IDMC</h2>
          <p className={styles.subtitle}>
            Manage the content displayed on the About IDMC page.
          </p>
        </div>
        <button
          className={styles.refreshButton}
          onClick={fetchSettings}
          disabled={isLoading}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
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
      {successMessage && (
        <div className={styles.successBanner} role="status">
          {successMessage}
          <button onClick={() => setSuccessMessage('')} aria-label="Dismiss message">
            &times;
          </button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Mission Statement</h3>
          <div className={styles.formGroup}>
            <label htmlFor="mission" className={styles.label}>
              Mission
            </label>
            <textarea
              id="mission"
              name="mission"
              value={formData.mission}
              onChange={handleChange}
              className={styles.textarea}
              rows={4}
              placeholder="Enter the IDMC mission statement..."
              disabled={isLoading}
            />
            <p className={styles.hint}>
              Describe the purpose and mission of the IDMC conference.
            </p>
          </div>
        </div>

        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Vision</h3>
          <div className={styles.formGroup}>
            <label htmlFor="vision" className={styles.label}>
              Vision Statement
            </label>
            <textarea
              id="vision"
              name="vision"
              value={formData.vision}
              onChange={handleChange}
              className={styles.textarea}
              rows={3}
              placeholder="Enter the IDMC vision statement (optional)..."
              disabled={isLoading}
            />
            <p className={styles.hint}>
              Describe the vision for IDMC and its impact.
            </p>
          </div>
        </div>

        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>History</h3>
          <div className={styles.formGroup}>
            <label htmlFor="history" className={styles.label}>
              IDMC History
            </label>
            <textarea
              id="history"
              name="history"
              value={formData.history}
              onChange={handleChange}
              className={styles.textarea}
              rows={6}
              placeholder="Enter the history of IDMC..."
              disabled={isLoading}
            />
            <p className={styles.hint}>
              Share the story of how IDMC started and its journey. Use line breaks for paragraphs.
            </p>
          </div>
        </div>

        <div className={styles.formSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Milestones</h3>
            <button
              type="button"
              onClick={handleAddMilestone}
              className={styles.addButton}
              disabled={isLoading}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Milestone
            </button>
          </div>
          <p className={styles.hint}>
            Add key milestones to highlight (e.g., &quot;1000+&quot; - &quot;Churches Impacted&quot;).
          </p>

          {formData.milestones.length === 0 ? (
            <div className={styles.emptyState}>
              No milestones added yet. Click &quot;Add Milestone&quot; to create one.
            </div>
          ) : (
            <div className={styles.milestonesList}>
              {formData.milestones.map((milestone, index) => (
                <div key={index} className={styles.milestoneItem}>
                  <div className={styles.milestoneFields}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Label (e.g., &quot;1000+&quot;, &quot;2023-2033&quot;)
                      </label>
                      <input
                        type="text"
                        value={milestone.label}
                        onChange={(e) =>
                          handleMilestoneChange(index, 'label', e.target.value)
                        }
                        className={styles.input}
                        placeholder="1000+"
                        disabled={isLoading}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Description
                      </label>
                      <input
                        type="text"
                        value={milestone.description}
                        onChange={(e) =>
                          handleMilestoneChange(index, 'description', e.target.value)
                        }
                        className={styles.input}
                        placeholder="Churches Impacted"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMilestone(index)}
                    className={styles.removeButton}
                    disabled={isLoading}
                    aria-label="Remove milestone"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className={styles.formActions}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}

export default AdminAboutIDMCPage;
