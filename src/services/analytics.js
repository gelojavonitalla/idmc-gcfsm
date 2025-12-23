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

/**
 * Fetches church statistics aggregated from registrations
 * Returns churches sorted by delegate count (descending)
 *
 * @param {number} [limitCount] - Optional limit for number of churches to return
 * @returns {Promise<Object>} Church stats object with churches array and total count
 */
export async function getChurchStats(limitCount = null) {
  try {
    const registrationsRef = collection(db, COLLECTIONS.REGISTRATIONS);
    const snapshot = await getDocs(registrationsRef);

    const churchMap = new Map();

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      // Only count confirmed or pending verification registrations
      if (
        data.status !== REGISTRATION_STATUS.CONFIRMED &&
        data.status !== REGISTRATION_STATUS.PENDING_VERIFICATION
      ) {
        return;
      }

      const churchName = data.churchName || 'Unknown Church';
      const churchCity = data.churchCity || '';
      const churchKey = `${churchName}|${churchCity}`;

      if (!churchMap.has(churchKey)) {
        churchMap.set(churchKey, {
          name: churchName,
          city: churchCity,
          delegateCount: 0,
          registrationCount: 0,
        });
      }

      const church = churchMap.get(churchKey);
      // Count primary attendee + additional attendees
      const additionalCount = data.additionalAttendees?.length || 0;
      church.delegateCount += 1 + additionalCount;
      church.registrationCount += 1;
    });

    // Convert to array and sort by delegate count
    const churches = Array.from(churchMap.values())
      .sort((a, b) => b.delegateCount - a.delegateCount);

    const totalChurches = churches.length;
    const limitedChurches = limitCount ? churches.slice(0, limitCount) : churches;

    return {
      churches: limitedChurches,
      totalChurches,
      totalDelegates: churches.reduce((sum, c) => sum + c.delegateCount, 0),
    };
  } catch (error) {
    console.error('Failed to fetch church stats:', error);
    return {
      churches: [],
      totalChurches: 0,
      totalDelegates: 0,
    };
  }
}

/**
 * Fetches food choice statistics aggregated from registrations
 *
 * @returns {Promise<Object>} Food stats object with distribution array
 */
export async function getFoodStats() {
  try {
    const registrationsRef = collection(db, COLLECTIONS.REGISTRATIONS);
    const snapshot = await getDocs(registrationsRef);

    const foodMap = new Map();
    let totalWithChoice = 0;
    let totalWithoutChoice = 0;

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      // Only count confirmed or pending verification registrations
      if (
        data.status !== REGISTRATION_STATUS.CONFIRMED &&
        data.status !== REGISTRATION_STATUS.PENDING_VERIFICATION
      ) {
        return;
      }

      // Count primary attendee food choice
      const primaryFood = data.foodChoice;
      if (primaryFood) {
        foodMap.set(primaryFood, (foodMap.get(primaryFood) || 0) + 1);
        totalWithChoice++;
      } else {
        totalWithoutChoice++;
      }

      // Count additional attendees food choices
      if (data.additionalAttendees?.length > 0) {
        data.additionalAttendees.forEach((attendee) => {
          const attendeeFood = attendee.foodChoice;
          if (attendeeFood) {
            foodMap.set(attendeeFood, (foodMap.get(attendeeFood) || 0) + 1);
            totalWithChoice++;
          } else {
            totalWithoutChoice++;
          }
        });
      }
    });

    // Fetch food menu items to get names
    const foodMenuRef = collection(db, COLLECTIONS.FOOD_MENU);
    const foodMenuSnapshot = await getDocs(foodMenuRef);
    const foodMenuItems = new Map();
    foodMenuSnapshot.docs.forEach((menuDoc) => {
      foodMenuItems.set(menuDoc.id, menuDoc.data().name || menuDoc.id);
    });

    // Convert to array with names
    const distribution = Array.from(foodMap.entries())
      .map(([id, count]) => ({
        id,
        name: foodMenuItems.get(id) || id,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      distribution,
      totalWithChoice,
      totalWithoutChoice,
      totalAttendees: totalWithChoice + totalWithoutChoice,
    };
  } catch (error) {
    console.error('Failed to fetch food stats:', error);
    return {
      distribution: [],
      totalWithChoice: 0,
      totalWithoutChoice: 0,
      totalAttendees: 0,
    };
  }
}

/**
 * Fetches download statistics
 *
 * @returns {Promise<Object>} Download stats object with items and totals
 */
export async function getDownloadStats() {
  try {
    const downloadsRef = collection(db, COLLECTIONS.DOWNLOADS);
    const downloadsQuery = query(downloadsRef, orderBy('order', 'asc'));
    const snapshot = await getDocs(downloadsQuery);

    const items = snapshot.docs.map((downloadDoc) => ({
      id: downloadDoc.id,
      title: downloadDoc.data().title || downloadDoc.id,
      downloadCount: downloadDoc.data().downloadCount || 0,
      status: downloadDoc.data().status,
    }));

    const totalDownloads = items.reduce((sum, item) => sum + item.downloadCount, 0);

    return {
      items,
      totalDownloads,
      totalFiles: items.length,
    };
  } catch (error) {
    console.error('Failed to fetch download stats:', error);
    return {
      items: [],
      totalDownloads: 0,
      totalFiles: 0,
    };
  }
}
