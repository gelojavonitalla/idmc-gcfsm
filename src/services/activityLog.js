/**
 * Activity Log Service
 * Provides functionality to log and retrieve admin activity.
 *
 * @module services/activityLog
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  serverTimestamp,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { COLLECTIONS } from '../constants';

/**
 * Activity types for logging
 */
export const ACTIVITY_TYPES = Object.freeze({
  LOGIN: 'login',
  LOGOUT: 'logout',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  APPROVE: 'approve',
  REJECT: 'reject',
  CHECKIN: 'checkin',
  EXPORT: 'export',
  SETTINGS: 'settings',
});

/**
 * Activity type labels for display
 */
export const ACTIVITY_TYPE_LABELS = {
  [ACTIVITY_TYPES.LOGIN]: 'Login',
  [ACTIVITY_TYPES.LOGOUT]: 'Logout',
  [ACTIVITY_TYPES.CREATE]: 'Created',
  [ACTIVITY_TYPES.UPDATE]: 'Updated',
  [ACTIVITY_TYPES.DELETE]: 'Deleted',
  [ACTIVITY_TYPES.APPROVE]: 'Approved',
  [ACTIVITY_TYPES.REJECT]: 'Rejected',
  [ACTIVITY_TYPES.CHECKIN]: 'Checked In',
  [ACTIVITY_TYPES.EXPORT]: 'Exported',
  [ACTIVITY_TYPES.SETTINGS]: 'Settings Change',
};

/**
 * Entity types that can be logged
 */
export const ENTITY_TYPES = Object.freeze({
  USER: 'user',
  REGISTRATION: 'registration',
  SPEAKER: 'speaker',
  SESSION: 'session',
  WORKSHOP: 'workshop',
  FAQ: 'faq',
  SETTINGS: 'settings',
  PRICING: 'pricing',
});

/**
 * Logs an admin activity
 *
 * @param {Object} activity - Activity data
 * @param {string} activity.type - Activity type from ACTIVITY_TYPES
 * @param {string} activity.entityType - Entity type from ENTITY_TYPES
 * @param {string} activity.entityId - ID of the affected entity
 * @param {string} activity.description - Human-readable description
 * @param {string} activity.adminId - Admin user ID who performed the action
 * @param {string} activity.adminEmail - Admin email for display
 * @param {Object} [activity.metadata] - Additional metadata
 * @returns {Promise<Object>} Created activity log
 */
export async function logActivity(activity) {
  try {
    const logsRef = collection(db, COLLECTIONS.ACTIVITY_LOGS);

    const logData = {
      type: activity.type,
      entityType: activity.entityType || null,
      entityId: activity.entityId || null,
      description: activity.description,
      adminId: activity.adminId,
      adminEmail: activity.adminEmail || 'Unknown',
      metadata: activity.metadata || {},
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(logsRef, logData);

    return {
      id: docRef.id,
      ...logData,
    };
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw - logging should not break the main operation
    return null;
  }
}

/**
 * Fetches activity logs with pagination
 *
 * @param {Object} options - Query options
 * @param {number} [options.pageSize=20] - Number of logs per page
 * @param {Object} [options.lastDoc] - Last document for pagination
 * @param {string} [options.type] - Filter by activity type
 * @param {string} [options.entityType] - Filter by entity type
 * @param {string} [options.adminId] - Filter by admin ID
 * @returns {Promise<Object>} { logs, lastDoc, hasMore }
 */
export async function getActivityLogs(options = {}) {
  try {
    const { pageSize = 20, lastDoc, type, entityType, adminId } = options;

    const logsRef = collection(db, COLLECTIONS.ACTIVITY_LOGS);
    const constraints = [orderBy('createdAt', 'desc'), limit(pageSize + 1)];

    // Add filters
    if (type) {
      constraints.unshift(where('type', '==', type));
    }
    if (entityType) {
      constraints.unshift(where('entityType', '==', entityType));
    }
    if (adminId) {
      constraints.unshift(where('adminId', '==', adminId));
    }

    // Add pagination
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    const logsQuery = query(logsRef, ...constraints);
    const snapshot = await getDocs(logsQuery);

    const docs = snapshot.docs;
    const hasMore = docs.length > pageSize;

    // Remove the extra document used to check for more
    const logs = (hasMore ? docs.slice(0, -1) : docs).map((doc) => ({
      id: doc.id,
      ...doc.data(),
      _doc: doc, // Keep reference for pagination
    }));

    return {
      logs,
      lastDoc: logs.length > 0 ? logs[logs.length - 1]._doc : null,
      hasMore,
    };
  } catch (error) {
    console.error('Failed to fetch activity logs:', error);
    return { logs: [], lastDoc: null, hasMore: false };
  }
}

/**
 * Gets the total count of activity logs
 *
 * @param {Object} filters - Optional filters
 * @returns {Promise<number>} Total count
 */
export async function getActivityLogsCount(filters = {}) {
  try {
    const logsRef = collection(db, COLLECTIONS.ACTIVITY_LOGS);
    const constraints = [];

    if (filters.type) {
      constraints.push(where('type', '==', filters.type));
    }
    if (filters.entityType) {
      constraints.push(where('entityType', '==', filters.entityType));
    }
    if (filters.adminId) {
      constraints.push(where('adminId', '==', filters.adminId));
    }

    const logsQuery = constraints.length > 0
      ? query(logsRef, ...constraints)
      : logsRef;

    const snapshot = await getCountFromServer(logsQuery);
    return snapshot.data().count;
  } catch (error) {
    console.error('Failed to get activity logs count:', error);
    return 0;
  }
}

/**
 * Gets recent activity logs for a specific admin
 *
 * @param {string} adminId - Admin user ID
 * @param {number} [count=10] - Number of logs to fetch
 * @returns {Promise<Array>} Array of recent activity logs
 */
export async function getAdminRecentActivity(adminId, count = 10) {
  try {
    const logsRef = collection(db, COLLECTIONS.ACTIVITY_LOGS);
    const logsQuery = query(
      logsRef,
      where('adminId', '==', adminId),
      orderBy('createdAt', 'desc'),
      limit(count)
    );

    const snapshot = await getDocs(logsQuery);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Failed to fetch admin recent activity:', error);
    return [];
  }
}
