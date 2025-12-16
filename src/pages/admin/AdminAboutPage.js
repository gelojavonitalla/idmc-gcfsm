/**
 * AdminAboutPage Component
 * Admin page for managing About IDMC and GCF South Metro content.
 *
 * @module pages/admin/AdminAboutPage
 */

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../../components/admin';
import {
  getConferenceSettings,
  updateConferenceSettings,
} from '../../services';
import styles from './AdminAboutPage.module.css';

/**
 * AdminAboutPage Component
 * Allows admins to edit the About page content with tabs for IDMC and GCF.
 *
 * @returns {JSX.Element} The admin about page
 */
function AdminAboutPage() {
  const [settings, setSettings] = useState(null);
  const [activeTab, setActiveTab] = useState('idmc');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // IDMC form data
  const [idmcData, setIdmcData] = useState({
    mission: '',
    vision: '',
    history: '',
    milestones: [],
  });

  // GCF form data
  const [gcfData, setGcfData] = useState({
    name: '',
    mission: '',
    vision: '',
    description: '',
    coreValues: [],
  });

  // IDMC 2025 form data
  const [idmc2025Data, setIdmc2025Data] = useState({
    title: '',
    subtitle: '',
    youtubeVideoId: '',
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
      setIdmcData({
        mission: data.aboutIdmc?.mission || '',
        vision: data.aboutIdmc?.vision || '',
        history: data.aboutIdmc?.history || '',
        milestones: data.aboutIdmc?.milestones || [],
      });
      setGcfData({
        name: data.aboutGcf?.name || '',
        mission: data.aboutGcf?.mission || '',
        vision: data.aboutGcf?.vision || '',
        description: data.aboutGcf?.description || '',
        coreValues: data.aboutGcf?.coreValues || [],
      });
      setIdmc2025Data({
        title: data.idmc2025?.title || '',
        subtitle: data.idmc2025?.subtitle || '',
        youtubeVideoId: data.idmc2025?.youtubeVideoId || '',
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

  // IDMC handlers
  const handleIdmcChange = (e) => {
    const { name, value } = e.target;
    setIdmcData((prev) => ({ ...prev, [name]: value }));
    setSuccessMessage('');
  };

  const handleMilestoneChange = (index, field, value) => {
    setIdmcData((prev) => {
      const newMilestones = [...prev.milestones];
      newMilestones[index] = { ...newMilestones[index], [field]: value };
      return { ...prev, milestones: newMilestones };
    });
    setSuccessMessage('');
  };

  const handleAddMilestone = () => {
    setIdmcData((prev) => ({
      ...prev,
      milestones: [...prev.milestones, { label: '', description: '' }],
    }));
    setSuccessMessage('');
  };

  const handleRemoveMilestone = (index) => {
    setIdmcData((prev) => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index),
    }));
    setSuccessMessage('');
  };

  // GCF handlers
  const handleGcfChange = (e) => {
    const { name, value } = e.target;
    setGcfData((prev) => ({ ...prev, [name]: value }));
    setSuccessMessage('');
  };

  const handleCoreValueChange = (index, value) => {
    setGcfData((prev) => {
      const newCoreValues = [...prev.coreValues];
      newCoreValues[index] = value;
      return { ...prev, coreValues: newCoreValues };
    });
    setSuccessMessage('');
  };

  const handleAddCoreValue = () => {
    setGcfData((prev) => ({
      ...prev,
      coreValues: [...prev.coreValues, ''],
    }));
    setSuccessMessage('');
  };

  const handleRemoveCoreValue = (index) => {
    setGcfData((prev) => ({
      ...prev,
      coreValues: prev.coreValues.filter((_, i) => i !== index),
    }));
    setSuccessMessage('');
  };

  // IDMC 2025 handlers
  const handleIdmc2025Change = (e) => {
    const { name, value } = e.target;
    setIdmc2025Data((prev) => ({ ...prev, [name]: value }));
    setSuccessMessage('');
  };

  /**
   * Handles IDMC form submission
   *
   * @param {React.FormEvent} e - Form event
   */
  const handleIdmcSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage('');

    try {
      const updatedSettings = {
        ...settings,
        aboutIdmc: {
          mission: idmcData.mission,
          vision: idmcData.vision,
          history: idmcData.history,
          milestones: idmcData.milestones.filter(
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

  /**
   * Handles GCF form submission
   *
   * @param {React.FormEvent} e - Form event
   */
  const handleGcfSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage('');

    try {
      const updatedSettings = {
        ...settings,
        aboutGcf: {
          name: gcfData.name,
          mission: gcfData.mission,
          vision: gcfData.vision,
          description: gcfData.description,
          coreValues: gcfData.coreValues.filter((v) => v.trim()),
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

  /**
   * Handles IDMC 2025 form submission
   *
   * @param {React.FormEvent} e - Form event
   */
  const handleIdmc2025Submit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage('');

    try {
      const updatedSettings = {
        ...settings,
        idmc2025: {
          title: idmc2025Data.title,
          subtitle: idmc2025Data.subtitle,
          youtubeVideoId: idmc2025Data.youtubeVideoId,
        },
      };

      await updateConferenceSettings(updatedSettings);
      setSettings(updatedSettings);
      setSuccessMessage('IDMC 2025 page content saved successfully!');
    } catch (saveError) {
      console.error('Failed to save settings:', saveError);
      setError('Failed to save content. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout title="About Pages">
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>About Pages</h2>
          <p className={styles.subtitle}>
            Manage the content displayed on the About page.
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

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'idmc' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('idmc')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          About IDMC
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'gcf' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('gcf')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 21V7l-6-4-6 4v14" />
            <path d="M12 3v4" />
            <path d="M10 5h4" />
            <path d="M9 21v-4a3 3 0 0 1 6 0v4" />
            <path d="M3 21h18" />
          </svg>
          About GCF South Metro
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'idmc2025' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('idmc2025')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
          IDMC 2025
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.content}>
        {activeTab === 'idmc' && (
          <form onSubmit={handleIdmcSubmit} className={styles.form}>
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Mission Statement</h3>
              <div className={styles.formGroup}>
                <label htmlFor="idmc-mission" className={styles.label}>
                  Mission
                </label>
                <textarea
                  id="idmc-mission"
                  name="mission"
                  value={idmcData.mission}
                  onChange={handleIdmcChange}
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
                <label htmlFor="idmc-vision" className={styles.label}>
                  Vision Statement
                </label>
                <textarea
                  id="idmc-vision"
                  name="vision"
                  value={idmcData.vision}
                  onChange={handleIdmcChange}
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
                <label htmlFor="idmc-history" className={styles.label}>
                  IDMC History
                </label>
                <textarea
                  id="idmc-history"
                  name="history"
                  value={idmcData.history}
                  onChange={handleIdmcChange}
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

              {idmcData.milestones.length === 0 ? (
                <div className={styles.emptyState}>
                  No milestones added yet. Click &quot;Add Milestone&quot; to create one.
                </div>
              ) : (
                <div className={styles.milestonesList}>
                  {idmcData.milestones.map((milestone, index) => (
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
                          <label className={styles.label}>Description</label>
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
        )}

        {activeTab === 'gcf' && (
          <form onSubmit={handleGcfSubmit} className={styles.form}>
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Organization Details</h3>
              <div className={styles.formGroup}>
                <label htmlFor="gcf-name" className={styles.label}>
                  Organization Name
                </label>
                <input
                  type="text"
                  id="gcf-name"
                  name="name"
                  value={gcfData.name}
                  onChange={handleGcfChange}
                  className={styles.input}
                  placeholder="GCF South Metro"
                  disabled={isLoading}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="gcf-description" className={styles.label}>
                  Description
                </label>
                <textarea
                  id="gcf-description"
                  name="description"
                  value={gcfData.description}
                  onChange={handleGcfChange}
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
                <label htmlFor="gcf-mission" className={styles.label}>
                  Mission Statement
                </label>
                <textarea
                  id="gcf-mission"
                  name="mission"
                  value={gcfData.mission}
                  onChange={handleGcfChange}
                  className={styles.textarea}
                  rows={3}
                  placeholder="Enter the mission statement..."
                  disabled={isLoading}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="gcf-vision" className={styles.label}>
                  Vision Statement
                </label>
                <textarea
                  id="gcf-vision"
                  name="vision"
                  value={gcfData.vision}
                  onChange={handleGcfChange}
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

              {gcfData.coreValues.length === 0 ? (
                <div className={styles.emptyState}>
                  No core values added yet. Click &quot;Add Core Value&quot; to create one.
                </div>
              ) : (
                <div className={styles.coreValuesList}>
                  {gcfData.coreValues.map((value, index) => (
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
        )}

        {activeTab === 'idmc2025' && (
          <form onSubmit={handleIdmc2025Submit} className={styles.form}>
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Page Content</h3>
              <div className={styles.formGroup}>
                <label htmlFor="idmc2025-title" className={styles.label}>
                  Page Title
                </label>
                <input
                  type="text"
                  id="idmc2025-title"
                  name="title"
                  value={idmc2025Data.title}
                  onChange={handleIdmc2025Change}
                  className={styles.input}
                  placeholder="IDMC 2025"
                  disabled={isLoading}
                />
                <p className={styles.hint}>
                  The main heading displayed on the IDMC 2025 page.
                </p>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="idmc2025-subtitle" className={styles.label}>
                  Subtitle
                </label>
                <input
                  type="text"
                  id="idmc2025-subtitle"
                  name="subtitle"
                  value={idmc2025Data.subtitle}
                  onChange={handleIdmc2025Change}
                  className={styles.input}
                  placeholder="Watch the highlights from our previous conference"
                  disabled={isLoading}
                />
                <p className={styles.hint}>
                  A brief description shown below the title.
                </p>
              </div>
            </div>

            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Video Settings</h3>
              <div className={styles.formGroup}>
                <label htmlFor="idmc2025-videoId" className={styles.label}>
                  YouTube Video ID
                </label>
                <input
                  type="text"
                  id="idmc2025-videoId"
                  name="youtubeVideoId"
                  value={idmc2025Data.youtubeVideoId}
                  onChange={handleIdmc2025Change}
                  className={styles.input}
                  placeholder="emGTZDXOaZY"
                  disabled={isLoading}
                />
                <p className={styles.hint}>
                  The YouTube video ID (the part after &quot;v=&quot; in the URL, e.g., for https://youtube.com/watch?v=emGTZDXOaZY use &quot;emGTZDXOaZY&quot;).
                </p>
              </div>

              {idmc2025Data.youtubeVideoId && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>Video Preview</label>
                  <div className={styles.videoPreview}>
                    <iframe
                      src={`https://www.youtube.com/embed/${idmc2025Data.youtubeVideoId}`}
                      title="YouTube video preview"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </div>

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
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminAboutPage;
