/**
 * Settings Context
 * Provides global conference settings to all components.
 *
 * @module context/SettingsContext
 */

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  getConferenceSettings,
  getPricingTiers,
  getActivePricingTierFromDb,
  getRegistrationCategories,
  getActiveRegistrationCategories,
} from '../services/settings';

/**
 * Settings context
 */
const SettingsContext = createContext(null);

/**
 * Default settings used while loading
 */
const DEFAULT_SETTINGS = {
  title: 'IDMC 2026',
  theme: 'All In for Jesus and His Kingdom',
  tagline: 'Intentional Disciple-Making Churches Conference',
  year: 2026,
  startDate: '2026-03-28',
  endDate: '2026-03-28',
  startTime: '07:00',
  endTime: '17:30',
  timezone: 'Asia/Manila',
  venue: {
    name: 'GCF South Metro',
    address: 'Daang Hari Road, Versailles, Almanza Dos, Las Piñas City 1750 Philippines',
    mapUrl: 'https://maps.google.com/?q=GCF+South+Metro+Las+Pinas',
    mapEmbedUrl: 'https://www.google.com/maps?q=GCF+South+Metro,+Daang+Hari+Road,+Las+Piñas,+Philippines&output=embed',
  },
  contact: {
    email: 'email@gcfsouthmetro.org',
    phone: '(02) 8478 1271 / (02) 8478 1273',
    mobile: '0917 650 0011',
    website: 'https://gcfsouthmetro.org',
  },
  social: {
    facebook: 'https://facebook.com/gcfsouthmetro',
    instagram: 'https://instagram.com/gcfsouthmetro',
    youtube: 'https://youtube.com/channel/UCJ36YX23P_yCjMzetI1s6Ag',
  },
  registrationOpen: true,
  bannerImageUrl: null,
  idmc2025: {
    title: 'IDMC 2025',
    subtitle: 'Watch the highlights from our previous conference',
    youtubeVideoId: 'emGTZDXOaZY',
  },
};

/**
 * SettingsProvider Component
 * Provides conference settings context to child components.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} The settings provider component
 */
export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [pricingTiers, setPricingTiers] = useState([]);
  const [activePricingTier, setActivePricingTier] = useState(null);
  const [registrationCategories, setRegistrationCategories] = useState([]);
  const [activeRegistrationCategories, setActiveRegistrationCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetches all settings data from Firestore
   */
  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [settingsData, tiersData, activeTier, categoriesData, activeCategories] = await Promise.all([
        getConferenceSettings(),
        getPricingTiers(),
        getActivePricingTierFromDb(),
        getRegistrationCategories(),
        getActiveRegistrationCategories(),
      ]);

      setSettings(settingsData);
      setPricingTiers(tiersData);
      setActivePricingTier(activeTier);
      setRegistrationCategories(categoriesData);
      setActiveRegistrationCategories(activeCategories);
    } catch (fetchError) {
      console.error('Failed to fetch settings:', fetchError);
      setError(fetchError.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  /**
   * Refreshes settings from the database
   */
  const refreshSettings = useCallback(() => {
    return fetchSettings();
  }, [fetchSettings]);

  const value = useMemo(
    () => ({
      settings,
      pricingTiers,
      activePricingTier,
      registrationCategories,
      activeRegistrationCategories,
      isLoading,
      error,
      refreshSettings,
    }),
    [settings, pricingTiers, activePricingTier, registrationCategories, activeRegistrationCategories, isLoading, error, refreshSettings]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

SettingsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Hook to access settings context
 *
 * @returns {Object} Settings context value
 * @throws {Error} If used outside of SettingsProvider
 */
export function useSettings() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }

  return context;
}

export default SettingsContext;
