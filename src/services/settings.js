/**
 * Settings Service
 * Manages conference configuration and pricing tiers.
 *
 * @module services/settings
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { COLLECTIONS } from '../constants';

/**
 * Settings document ID (singleton)
 */
const SETTINGS_DOC_ID = 'conference-settings';

/**
 * Default conference settings
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
  heroImageUrl: null,
  heroVideoUrl: null,
  aboutIdmc: {
    mission: 'The Intentional Disciple-Making Churches Conference (IDMC) is an annual gathering designed to equip and inspire churches to return to their disciple-making roots. We believe that every believer is called to make disciples who make disciples, transforming communities and nations for Christ.',
    vision: '',
    history: 'IDMC was born out of a vision to see churches across the Philippines and beyond embrace intentional disciple-making as their primary mission. What started as a small gathering of church leaders has grown into a movement that impacts thousands of believers each year.\n\nThrough plenary sessions, workshops, and fellowship, IDMC provides a platform for learning, sharing best practices, and encouraging one another in the disciple-making journey.',
    milestones: [
      { label: '2023-2033', description: 'National Disciple-Making Campaign' },
      { label: '1000+', description: 'Churches Impacted' },
      { label: '10+', description: 'Years of Ministry' },
    ],
  },
  aboutGcf: {
    name: 'GCF South Metro',
    mission: 'To love God, to love people and to make multiplying disciples.',
    vision: 'To be a disciple-making congregation that reaches local communities while impacting the broader region and world.',
    description: 'GCF South Metro is a disciple-making church focused on three interconnected activities: drawing individuals toward Christ, developing their faith, and deploying them for ministry purposes.',
    coreValues: [
      'Truth grounded in Scripture',
      'Love demonstrated in relationships',
      'Empowerment through the Holy Spirit',
      'Excellence through dedicated effort',
    ],
  },
  idmc2025: {
    title: 'IDMC 2025',
    subtitle: 'Watch the highlights from our previous conference',
    youtubeVideoId: 'emGTZDXOaZY',
  },
};

/**
 * Fetches conference settings
 *
 * @returns {Promise<Object>} Conference settings object
 */
export async function getConferenceSettings() {
  try {
    const settingsRef = doc(db, COLLECTIONS.CONFERENCES, SETTINGS_DOC_ID);
    const settingsDoc = await getDoc(settingsRef);

    if (settingsDoc.exists()) {
      return {
        id: settingsDoc.id,
        ...settingsDoc.data(),
      };
    }

    // Return default settings if not found
    return { id: SETTINGS_DOC_ID, ...DEFAULT_SETTINGS };
  } catch (error) {
    console.error('Failed to fetch conference settings:', error);
    return { id: SETTINGS_DOC_ID, ...DEFAULT_SETTINGS };
  }
}

/**
 * Updates conference settings
 *
 * @param {Object} settings - Settings object to update
 * @returns {Promise<Object>} Updated settings
 */
export async function updateConferenceSettings(settings) {
  try {
    const settingsRef = doc(db, COLLECTIONS.CONFERENCES, SETTINGS_DOC_ID);
    const settingsDoc = await getDoc(settingsRef);

    const updateData = {
      ...settings,
      updatedAt: serverTimestamp(),
    };

    // Remove id from the data to save
    delete updateData.id;

    if (settingsDoc.exists()) {
      await updateDoc(settingsRef, updateData);
    } else {
      await setDoc(settingsRef, {
        ...DEFAULT_SETTINGS,
        ...updateData,
        createdAt: serverTimestamp(),
      });
    }

    return { id: SETTINGS_DOC_ID, ...settings };
  } catch (error) {
    console.error('Failed to update conference settings:', error);
    throw error;
  }
}

/**
 * Fetches all pricing tiers
 *
 * @returns {Promise<Array>} Array of pricing tiers
 */
export async function getPricingTiers() {
  try {
    const tiersRef = collection(db, COLLECTIONS.CONFERENCES, SETTINGS_DOC_ID, 'pricingTiers');
    const tiersQuery = query(tiersRef, orderBy('startDate', 'asc'));
    const snapshot = await getDocs(tiersQuery);

    return snapshot.docs.map((tierDoc) => ({
      id: tierDoc.id,
      ...tierDoc.data(),
    }));
  } catch (error) {
    console.error('Failed to fetch pricing tiers:', error);
    return [];
  }
}

/**
 * Creates a new pricing tier
 *
 * @param {Object} tier - Pricing tier data
 * @returns {Promise<Object>} Created tier with ID
 */
export async function createPricingTier(tier) {
  try {
    const tiersRef = collection(db, COLLECTIONS.CONFERENCES, SETTINGS_DOC_ID, 'pricingTiers');

    const tierData = {
      name: tier.name,
      regularPrice: Number(tier.regularPrice),
      studentPrice: Number(tier.studentPrice),
      startDate: tier.startDate,
      endDate: tier.endDate,
      isActive: tier.isActive ?? true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(tiersRef, tierData);

    return {
      id: docRef.id,
      ...tierData,
    };
  } catch (error) {
    console.error('Failed to create pricing tier:', error);
    throw error;
  }
}

/**
 * Updates an existing pricing tier
 *
 * @param {string} tierId - Tier ID to update
 * @param {Object} tier - Updated tier data
 * @returns {Promise<Object>} Updated tier
 */
export async function updatePricingTier(tierId, tier) {
  try {
    const tierRef = doc(db, COLLECTIONS.CONFERENCES, SETTINGS_DOC_ID, 'pricingTiers', tierId);

    const updateData = {
      name: tier.name,
      regularPrice: Number(tier.regularPrice),
      studentPrice: Number(tier.studentPrice),
      startDate: tier.startDate,
      endDate: tier.endDate,
      isActive: tier.isActive,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(tierRef, updateData);

    return {
      id: tierId,
      ...updateData,
    };
  } catch (error) {
    console.error('Failed to update pricing tier:', error);
    throw error;
  }
}

/**
 * Deletes a pricing tier
 *
 * @param {string} tierId - Tier ID to delete
 * @returns {Promise<void>}
 */
export async function deletePricingTier(tierId) {
  try {
    const tierRef = doc(db, COLLECTIONS.CONFERENCES, SETTINGS_DOC_ID, 'pricingTiers', tierId);
    await deleteDoc(tierRef);
  } catch (error) {
    console.error('Failed to delete pricing tier:', error);
    throw error;
  }
}

/**
 * Gets the currently active pricing tier based on current date
 *
 * @returns {Promise<Object|null>} Active pricing tier or null
 */
export async function getActivePricingTierFromDb() {
  try {
    const tiers = await getPricingTiers();
    const now = new Date();

    return tiers.find((tier) => {
      const startDate = new Date(tier.startDate);
      const endDate = new Date(tier.endDate);
      // Set end date to end of day
      endDate.setHours(23, 59, 59, 999);
      return tier.isActive && now >= startDate && now <= endDate;
    }) || null;
  } catch (error) {
    console.error('Failed to get active pricing tier:', error);
    return null;
  }
}
