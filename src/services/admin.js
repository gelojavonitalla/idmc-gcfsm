/**
 * Admin Service
 * Provides CRUD operations for managing admin users.
 *
 * @module services/admin
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { COLLECTIONS, ADMIN_ROLES, ADMIN_ROLE_PERMISSIONS } from '../constants';

/**
 * Fetches all admin users
 *
 * @returns {Promise<Array>} Array of admin users
 */
export async function getAllAdmins() {
  const collectionRef = collection(db, COLLECTIONS.ADMINS);
  const orderedQuery = query(collectionRef, orderBy('createdAt', 'desc'));

  const snapshot = await getDocs(orderedQuery);

  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }));
}

/**
 * Gets an admin user by ID
 *
 * @param {string} adminId - Admin user ID (Firebase Auth UID)
 * @returns {Promise<Object|null>} Admin user data or null
 */
export async function getAdmin(adminId) {
  if (!adminId) {
    return null;
  }

  const docRef = doc(db, COLLECTIONS.ADMINS, adminId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

/**
 * Creates a new admin user (pending invitation)
 * Note: The actual Firebase Auth user must be created separately
 *
 * @param {string} adminId - Admin user ID (Firebase Auth UID)
 * @param {Object} adminData - Admin user data
 * @param {string} adminData.email - Admin email
 * @param {string} adminData.displayName - Admin display name
 * @param {string} adminData.role - Admin role
 * @param {string} invitedBy - UID of the admin who created this user
 * @returns {Promise<Object>} Created admin data
 */
export async function createAdmin(adminId, adminData, invitedBy) {
  const { role = ADMIN_ROLES.ADMIN } = adminData;
  const permissions = ADMIN_ROLE_PERMISSIONS[role] || ADMIN_ROLE_PERMISSIONS[ADMIN_ROLES.ADMIN];

  const docRef = doc(db, COLLECTIONS.ADMINS, adminId);
  const timestamp = serverTimestamp();

  const data = {
    email: adminData.email,
    displayName: adminData.displayName || adminData.email.split('@')[0],
    role,
    permissions,
    status: 'pending',
    invitedBy,
    invitedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    lastLoginAt: null,
  };

  await setDoc(docRef, data);

  return {
    id: adminId,
    ...data,
  };
}

/**
 * Updates an admin user
 *
 * @param {string} adminId - Admin user ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export async function updateAdmin(adminId, updates) {
  const docRef = doc(db, COLLECTIONS.ADMINS, adminId);

  const updateData = {
    ...updates,
    updatedAt: serverTimestamp(),
  };

  if (updates.role) {
    updateData.permissions = ADMIN_ROLE_PERMISSIONS[updates.role] || ADMIN_ROLE_PERMISSIONS[ADMIN_ROLES.ADMIN];
  }

  await updateDoc(docRef, updateData);
}

/**
 * Updates an admin user's role
 *
 * @param {string} adminId - Admin user ID
 * @param {string} newRole - New role from ADMIN_ROLES
 * @returns {Promise<void>}
 */
export async function updateAdminRole(adminId, newRole) {
  const permissions = ADMIN_ROLE_PERMISSIONS[newRole] || ADMIN_ROLE_PERMISSIONS[ADMIN_ROLES.ADMIN];

  await updateAdmin(adminId, {
    role: newRole,
    permissions,
  });
}

/**
 * Activates an admin user
 *
 * @param {string} adminId - Admin user ID
 * @returns {Promise<void>}
 */
export async function activateAdmin(adminId) {
  await updateAdmin(adminId, { status: 'active' });
}

/**
 * Deactivates an admin user
 *
 * @param {string} adminId - Admin user ID
 * @returns {Promise<void>}
 */
export async function deactivateAdmin(adminId) {
  await updateAdmin(adminId, { status: 'inactive' });
}

/**
 * Checks if a user has a specific permission
 *
 * @param {Object} admin - Admin user object
 * @param {string} permission - Permission key to check
 * @returns {boolean} True if admin has the permission
 */
export function hasPermission(admin, permission) {
  if (!admin || !admin.permissions) {
    return false;
  }

  return admin.permissions[permission] === true;
}

/**
 * Checks if a user is a super admin
 *
 * @param {Object} admin - Admin user object
 * @returns {boolean} True if admin is a super admin
 */
export function isSuperAdmin(admin) {
  return admin?.role === ADMIN_ROLES.SUPERADMIN;
}
