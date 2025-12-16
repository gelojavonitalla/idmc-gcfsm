/**
 * AdminLegalPage Component
 * Admin page for managing Terms of Service and Privacy Policy content.
 *
 * @module pages/admin/AdminLegalPage
 */

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../../components/admin';
import {
  getConferenceSettings,
  updateConferenceSettings,
} from '../../services';
import styles from './AdminLegalPage.module.css';

/**
 * Default Terms of Service sections structure
 */
const DEFAULT_TERMS_SECTIONS = [
  { id: 'agreement', title: 'Agreement to Terms', content: '' },
  { id: 'registration', title: 'Registration', content: '' },
  { id: 'payment', title: 'Payment Terms', content: '' },
  { id: 'cancellation', title: 'Cancellation and Refund Policy', content: '' },
  { id: 'conduct', title: 'Conference Conduct', content: '' },
  { id: 'intellectual-property', title: 'Intellectual Property', content: '' },
  { id: 'media-consent', title: 'Photography and Media Consent', content: '' },
  { id: 'liability', title: 'Limitation of Liability', content: '' },
  { id: 'health-safety', title: 'Health and Safety', content: '' },
  { id: 'changes', title: 'Changes to These Terms', content: '' },
  { id: 'governing-law', title: 'Governing Law', content: '' },
];

/**
 * Default Privacy Policy sections structure
 */
const DEFAULT_PRIVACY_SECTIONS = [
  { id: 'introduction', title: 'Introduction', content: '' },
  { id: 'information-collected', title: 'Information We Collect', content: '' },
  { id: 'information-use', title: 'How We Use Your Information', content: '' },
  { id: 'data-storage', title: 'Data Storage and Security', content: '' },
  { id: 'data-sharing', title: 'Data Sharing and Disclosure', content: '' },
  { id: 'data-retention', title: 'Data Retention', content: '' },
  { id: 'your-rights', title: 'Your Rights', content: '' },
  { id: 'cookies', title: 'Cookies and Tracking', content: '' },
  { id: 'children', title: "Children's Privacy", content: '' },
  { id: 'changes', title: 'Changes to This Privacy Policy', content: '' },
];

/**
 * AdminLegalPage Component
 * Allows admins to edit the Terms of Service and Privacy Policy content.
 *
 * @returns {JSX.Element} The admin legal page
 */
function AdminLegalPage() {
  const [settings, setSettings] = useState(null);
  const [activeTab, setActiveTab] = useState('terms');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Terms of Service form data
  const [termsData, setTermsData] = useState({
    lastUpdated: '',
    sections: DEFAULT_TERMS_SECTIONS,
  });

  // Privacy Policy form data
  const [privacyData, setPrivacyData] = useState({
    lastUpdated: '',
    sections: DEFAULT_PRIVACY_SECTIONS,
  });

  /**
   * Fetches settings data
   */
  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getConferenceSettings();
      setSettings(data);

      // Merge saved sections with defaults to ensure all sections exist
      const savedTermsSections = data.termsOfService?.sections || [];
      const mergedTermsSections = DEFAULT_TERMS_SECTIONS.map((defaultSection) => {
        const saved = savedTermsSections.find((s) => s.id === defaultSection.id);
        return saved ? { ...defaultSection, ...saved } : defaultSection;
      });

      const savedPrivacySections = data.privacyPolicy?.sections || [];
      const mergedPrivacySections = DEFAULT_PRIVACY_SECTIONS.map((defaultSection) => {
        const saved = savedPrivacySections.find((s) => s.id === defaultSection.id);
        return saved ? { ...defaultSection, ...saved } : defaultSection;
      });

      setTermsData({
        lastUpdated: data.termsOfService?.lastUpdated || '',
        sections: mergedTermsSections,
      });

      setPrivacyData({
        lastUpdated: data.privacyPolicy?.lastUpdated || '',
        sections: mergedPrivacySections,
      });
    } catch (fetchError) {
      console.error('Failed to fetch settings:', fetchError);
      setError('Failed to load content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  /**
   * Handles Terms of Service last updated change
   *
   * @param {React.ChangeEvent} e - Change event
   */
  const handleTermsLastUpdatedChange = (e) => {
    setTermsData((prev) => ({ ...prev, lastUpdated: e.target.value }));
    setSuccessMessage('');
  };

  /**
   * Handles Terms of Service section content change
   *
   * @param {string} sectionId - Section ID
   * @param {string} value - New content value
   */
  const handleTermsSectionChange = (sectionId, value) => {
    setTermsData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId ? { ...section, content: value } : section
      ),
    }));
    setSuccessMessage('');
  };

  /**
   * Handles Privacy Policy last updated change
   *
   * @param {React.ChangeEvent} e - Change event
   */
  const handlePrivacyLastUpdatedChange = (e) => {
    setPrivacyData((prev) => ({ ...prev, lastUpdated: e.target.value }));
    setSuccessMessage('');
  };

  /**
   * Handles Privacy Policy section content change
   *
   * @param {string} sectionId - Section ID
   * @param {string} value - New content value
   */
  const handlePrivacySectionChange = (sectionId, value) => {
    setPrivacyData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId ? { ...section, content: value } : section
      ),
    }));
    setSuccessMessage('');
  };

  /**
   * Handles Terms of Service form submission
   *
   * @param {React.FormEvent} e - Form event
   */
  const handleTermsSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage('');

    try {
      const updatedSettings = {
        ...settings,
        termsOfService: {
          lastUpdated: termsData.lastUpdated,
          sections: termsData.sections,
        },
      };

      await updateConferenceSettings(updatedSettings);
      setSettings(updatedSettings);
      setSuccessMessage('Terms of Service saved successfully!');
    } catch (saveError) {
      console.error('Failed to save settings:', saveError);
      setError('Failed to save content. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handles Privacy Policy form submission
   *
   * @param {React.FormEvent} e - Form event
   */
  const handlePrivacySubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage('');

    try {
      const updatedSettings = {
        ...settings,
        privacyPolicy: {
          lastUpdated: privacyData.lastUpdated,
          sections: privacyData.sections,
        },
      };

      await updateConferenceSettings(updatedSettings);
      setSettings(updatedSettings);
      setSuccessMessage('Privacy Policy saved successfully!');
    } catch (saveError) {
      console.error('Failed to save settings:', saveError);
      setError('Failed to save content. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout title="Legal Pages">
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Legal Pages</h2>
          <p className={styles.subtitle}>
            Manage the Terms of Service and Privacy Policy content.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.saveButton}
            onClick={activeTab === 'terms' ? handleTermsSubmit : handlePrivacySubmit}
            disabled={isLoading || isSaving}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            {isSaving ? 'Saving...' : 'Save'}
          </button>
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

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'terms' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('terms')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          Terms of Service
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'privacy' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('privacy')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Privacy Policy
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.content}>
        {activeTab === 'terms' && (
          <form onSubmit={handleTermsSubmit} className={styles.form}>
            {/* Last Updated */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Document Information</h3>
              <div className={styles.formGroup}>
                <label htmlFor="terms-lastUpdated" className={styles.label}>
                  Last Updated Date
                </label>
                <input
                  type="text"
                  id="terms-lastUpdated"
                  value={termsData.lastUpdated}
                  onChange={handleTermsLastUpdatedChange}
                  className={styles.input}
                  placeholder="e.g., December 15, 2025"
                  disabled={isLoading}
                />
                <p className={styles.hint}>
                  Enter the date when the Terms of Service was last updated.
                </p>
              </div>
            </div>

            {/* Sections */}
            {termsData.sections.map((section) => (
              <div key={section.id} className={styles.formSection}>
                <h3 className={styles.sectionTitle}>{section.title}</h3>
                <div className={styles.formGroup}>
                  <label htmlFor={`terms-${section.id}`} className={styles.label}>
                    Content
                  </label>
                  <textarea
                    id={`terms-${section.id}`}
                    value={section.content}
                    onChange={(e) => handleTermsSectionChange(section.id, e.target.value)}
                    className={styles.textarea}
                    rows={6}
                    placeholder={`Enter ${section.title.toLowerCase()} content...`}
                    disabled={isLoading}
                  />
                  <p className={styles.hint}>
                    Use line breaks for paragraphs. Lists can be formatted with &quot;- &quot; for bullet points.
                  </p>
                </div>
              </div>
            ))}

            <div className={styles.formActions}>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isLoading || isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Terms of Service'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'privacy' && (
          <form onSubmit={handlePrivacySubmit} className={styles.form}>
            {/* Last Updated */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Document Information</h3>
              <div className={styles.formGroup}>
                <label htmlFor="privacy-lastUpdated" className={styles.label}>
                  Last Updated Date
                </label>
                <input
                  type="text"
                  id="privacy-lastUpdated"
                  value={privacyData.lastUpdated}
                  onChange={handlePrivacyLastUpdatedChange}
                  className={styles.input}
                  placeholder="e.g., December 15, 2025"
                  disabled={isLoading}
                />
                <p className={styles.hint}>
                  Enter the date when the Privacy Policy was last updated.
                </p>
              </div>
            </div>

            {/* Sections */}
            {privacyData.sections.map((section) => (
              <div key={section.id} className={styles.formSection}>
                <h3 className={styles.sectionTitle}>{section.title}</h3>
                <div className={styles.formGroup}>
                  <label htmlFor={`privacy-${section.id}`} className={styles.label}>
                    Content
                  </label>
                  <textarea
                    id={`privacy-${section.id}`}
                    value={section.content}
                    onChange={(e) => handlePrivacySectionChange(section.id, e.target.value)}
                    className={styles.textarea}
                    rows={6}
                    placeholder={`Enter ${section.title.toLowerCase()} content...`}
                    disabled={isLoading}
                  />
                  <p className={styles.hint}>
                    Use line breaks for paragraphs. Lists can be formatted with &quot;- &quot; for bullet points.
                  </p>
                </div>
              </div>
            ))}

            <div className={styles.formActions}>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isLoading || isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Privacy Policy'}
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminLegalPage;
