/**
 * Analytics Service
 * Provides dashboard statistics and analytics data.
 *
 * @module services/analytics
 */

import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { COLLECTIONS, REGISTRATION_STATUS, PRICING_TIERS } from '../constants';

/**
 * Fetches dashboard statistics
 *
 * @returns {Promise<Object>} Dashboard stats object
 */
export async function getDashboardStats() {
  try {
    const registrationsRef = collection(db, COLLECTIONS.REGISTRATIONS);
    const registrationsSnapshot = await getDocs(registrationsRef);

    let totalRegistrations = 0;
    let confirmedRegistrations = 0;
    let pendingPayment = 0;
    let pendingVerification = 0;
    let totalRevenue = 0;
    let checkedIn = 0;

    registrationsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      totalRegistrations++;

      switch (data.status) {
        case REGISTRATION_STATUS.CONFIRMED:
          confirmedRegistrations++;
          totalRevenue += data.totalAmount || 0;
          if (data.checkedIn) {
            checkedIn++;
          }
          break;
        case REGISTRATION_STATUS.PENDING_PAYMENT:
          pendingPayment++;
          break;
        case REGISTRATION_STATUS.PENDING_VERIFICATION:
          pendingVerification++;
          totalRevenue += data.totalAmount || 0;
          break;
        default:
          break;
      }
    });

    return {
      totalRegistrations,
      confirmedRegistrations,
      pendingPayment,
      pendingVerification,
      totalRevenue,
      checkedIn,
    };
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return {
      totalRegistrations: 0,
      confirmedRegistrations: 0,
      pendingPayment: 0,
      pendingVerification: 0,
      totalRevenue: 0,
      checkedIn: 0,
    };
  }
}

/**
 * Fetches recent registrations
 *
 * @param {number} [count=10] - Number of registrations to fetch
 * @returns {Promise<Array>} Array of recent registrations
 */
export async function getRecentRegistrations(count = 10) {
  try {
    const registrationsRef = collection(db, COLLECTIONS.REGISTRATIONS);
    const recentQuery = query(
      registrationsRef,
      orderBy('createdAt', 'desc'),
      limit(count)
    );

    const snapshot = await getDocs(recentQuery);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Failed to fetch recent registrations:', error);
    return [];
  }
}

/**
 * Fetches registration data for charts
 *
 * @param {number} [days=30] - Number of days to fetch
 * @returns {Promise<Array>} Array of daily registration data
 */
export async function getRegistrationChartData(days = 30) {
  try {
    const registrationsRef = collection(db, COLLECTIONS.REGISTRATIONS);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const snapshot = await getDocs(registrationsRef);

    const dailyData = {};
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      const dateKey = date.toISOString().split('T')[0];
      dailyData[dateKey] = { registrations: 0, revenue: 0 };
    }

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
      if (createdAt >= startDate) {
        const dateKey = createdAt.toISOString().split('T')[0];
        if (dailyData[dateKey]) {
          dailyData[dateKey].registrations++;
          if (data.status === REGISTRATION_STATUS.CONFIRMED ||
              data.status === REGISTRATION_STATUS.PENDING_VERIFICATION) {
            dailyData[dateKey].revenue += data.totalAmount || 0;
          }
        }
      }
    });

    return Object.entries(dailyData).map(([date, stats]) => ({
      date: new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      registrations: stats.registrations,
      revenue: stats.revenue,
    }));
  } catch (error) {
    console.error('Failed to fetch chart data:', error);
    return [];
  }
}

/**
 * Gets the current active pricing tier
 *
 * @returns {Object|null} Active pricing tier or null
 */
export function getActivePricingTier() {
  const now = new Date();
  return PRICING_TIERS.find((tier) => {
    const startDate = new Date(tier.startDate);
    const endDate = new Date(tier.endDate);
    return tier.isActive && now >= startDate && now <= endDate;
  }) || null;
}
