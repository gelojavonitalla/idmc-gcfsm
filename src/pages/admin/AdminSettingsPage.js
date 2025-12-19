/**
 * AdminSettingsPage Component
 * Settings page for conference configuration.
 *
 * @module pages/admin/AdminSettingsPage
 */

import { useState, useEffect, useCallback } from 'react';
import {
  AdminLayout,
  SettingsForm,
  PricingTierManager,
} from '../../components/admin';
import {
  getConferenceSettings,
  updateConferenceSettings,
  getPricingTiers,
  createPricingTier,
  updatePricingTier,
  deletePricingTier,
} from '../../services';
import { useAdminAuth } from '../../context';
import styles from './AdminSettingsPage.module.css';

/**
 * AdminSettingsPage Component
 *
 * @returns {JSX.Element} The admin settings page
 */
function AdminSettingsPage() {
  const { admin } = useAdminAuth();
  const [settings, setSettings] = useState(null);
  const [pricingTiers, setPricingTiers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('general');

  /**
   * Fetches all settings data
   */
  const fetchSettingsData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [settingsData, tiersData] = await Promise.all([
        getConferenceSettings(),
        getPricingTiers(),
      ]);

      setSettings(settingsData);
      setPricingTiers(tiersData);
    } catch (fetchError) {
      console.error('Failed to fetch settings:', fetchError);
      setError('Failed to load settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch data on mount
   */
  useEffect(() => {
    fetchSettingsData();
  }, [fetchSettingsData]);

  /**
   * Handles saving settings
   *
   * @param {Object} data - Settings data to save
   */
  const handleSaveSettings = async (data) => {
    const updated = await updateConferenceSettings(data, admin?.id, admin?.email);
    setSettings(updated);
  };

  /**
   * Handles creating a pricing tier
   *
   * @param {Object} tierData - Tier data to create
   */
  const handleCreateTier = async (tierData) => {
    const newTier = await createPricingTier(tierData, admin?.id, admin?.email);
    setPricingTiers((prev) => [...prev, newTier]);
  };

  /**
   * Handles updating a pricing tier
   *
   * @param {string} tierId - Tier ID to update
   * @param {Object} tierData - Updated tier data
   */
  const handleUpdateTier = async (tierId, tierData) => {
    const updated = await updatePricingTier(tierId, tierData, admin?.id, admin?.email);
    setPricingTiers((prev) =>
      prev.map((tier) => (tier.id === tierId ? { ...tier, ...updated} : tier))
    );
  };

  /**
   * Handles deleting a pricing tier
   *
   * @param {string} tierId - Tier ID to delete
   */
  const handleDeleteTier = async (tierId) => {
    await deletePricingTier(tierId, admin?.id, admin?.email);
    setPricingTiers((prev) => prev.filter((tier) => tier.id !== tierId));
  };

  return (
    <AdminLayout title="Settings">
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Conference Settings</h2>
          <p className={styles.subtitle}>
            Configure conference details, pricing tiers, and more.
          </p>
        </div>
        <button
          className={styles.refreshButton}
          onClick={fetchSettingsData}
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

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'general' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('general')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          General
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'pricing' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('pricing')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          Pricing Tiers
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.content}>
        {activeTab === 'general' && (
          <SettingsForm
            settings={settings}
            onSave={handleSaveSettings}
            isLoading={isLoading}
          />
        )}
        {activeTab === 'pricing' && (
          <PricingTierManager
            tiers={pricingTiers}
            onCreate={handleCreateTier}
            onUpdate={handleUpdateTier}
            onDelete={handleDeleteTier}
            isLoading={isLoading}
          />
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminSettingsPage;
