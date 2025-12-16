/**
 * AdminAboutGCFPage Component
 * Admin page for managing About GCF South Metro content.
 *
 * @module pages/admin/AdminAboutGCFPage
 */

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../../components/admin';
import {
  getConferenceSettings,
  updateConferenceSettings,
} from '../../services';
import styles from './AdminAboutGCFPage.module.css';

/**
 * AdminAboutGCFPage Component
 * Allows admins to edit the About GCF South Metro section content.
 *
 * @returns {JSX.Element} The admin about GCF page
 */
function AdminAboutGCFPage() {
  const [settings, setSettings] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    mission: '',
    vision: '',
    description: '',
    coreValues: [],
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
        name: data.aboutGcf?.name || '',
        mission: data.aboutGcf?.mission || '',
        vision: data.aboutGcf?.vision || '',
        description: data.aboutGcf?.description || '',
        coreValues: data.aboutGcf?.coreValues || [],
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
   * Handles core value changes
   *
   * @param {number} index - Core value index
   * @param {string} value - New value
   */
  const handleCoreValueChange = (index, value) => {
    setFormData((prev) => {
      const newCoreValues = [...prev.coreValues];
      newCoreValues[index] = value;
      return { ...prev, coreValues: newCoreValues };
    });
    setSuccessMessage('');
  };

  /**
   * Adds a new core value
   */
  const handleAddCoreValue = () => {
    setFormData((prev) => ({
      ...prev,
      coreValues: [...prev.coreValues, ''],
    }));
    setSuccessMessage('');
  };

  /**
   * Removes a core value
   *
   * @param {number} index - Index of core value to remove
   */
  const handleRemoveCoreValue = (index) => {
    setFormData((prev) => ({
      ...prev,
      coreValues: prev.coreValues.filter((_, i) => i !== index),
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
        aboutGcf: {
          name: formData.name,
          mission: formData.mission,
          vision: formData.vision,
          description: formData.description,
          coreValues: formData.coreValues.filter((v) => v.trim()),
        },
      };

      await updateConferenceSettings(updatedSettings);
      setSettings(updatedSettings);
      setSuccessMessage('About GCF South Metro content saved successfully!');
    } catch (saveError) {
      console.error('Failed to save settings:', saveError);
      setError('Failed to save content. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout title="About GCF South Metro">
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>About GCF South Metro</h2>
          <p className={styles.subtitle}>
            Manage the content displayed for the host church section.
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
          <h3 className={styles.sectionTitle}>Organization Details</h3>
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>
              Organization Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={styles.input}
              placeholder="GCF South Metro"
              disabled={isLoading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.label}>
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={styles.textarea}
              rows={4}
              placeholder="Enter a brief description of the organization..."
              disabled={isLoading}
            />
            <p className={styles.hint}>
              A brief overview of the organization and its focus.
            </p>
          </div>
        </div>

        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Mission & Vision</h3>
          <div className={styles.formGroup}>
            <label htmlFor="mission" className={styles.label}>
              Mission Statement
            </label>
            <textarea
              id="mission"
              name="mission"
              value={formData.mission}
              onChange={handleChange}
              className={styles.textarea}
              rows={3}
              placeholder="Enter the mission statement..."
              disabled={isLoading}
            />
          </div>

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
              placeholder="Enter the vision statement..."
              disabled={isLoading}
            />
          </div>
        </div>

        <div className={styles.formSection}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Core Values</h3>
            <button
              type="button"
              onClick={handleAddCoreValue}
              className={styles.addButton}
              disabled={isLoading}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Core Value
            </button>
          </div>
          <p className={styles.hint}>
            List the core values of the organization.
          </p>

          {formData.coreValues.length === 0 ? (
            <div className={styles.emptyState}>
              No core values added yet. Click &quot;Add Core Value&quot; to create one.
            </div>
          ) : (
            <div className={styles.coreValuesList}>
              {formData.coreValues.map((value, index) => (
                <div key={index} className={styles.coreValueItem}>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleCoreValueChange(index, e.target.value)}
                    className={styles.input}
                    placeholder="Enter a core value..."
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveCoreValue(index)}
                    className={styles.removeButton}
                    disabled={isLoading}
                    aria-label="Remove core value"
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

export default AdminAboutGCFPage;
