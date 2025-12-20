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
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { COLLECTIONS, ADMIN_ROLES, ADMIN_ROLE_PERMISSIONS } from '../constants';
import { logActivity, ACTIVITY_TYPES, ENTITY_TYPES } from './activityLog';

/**
 * Error codes for admin operations
 */
export const ADMIN_ERROR_CODES = {
  DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
  INVALID_ROLE: 'INVALID_ROLE',
  ADMIN_NOT_FOUND: 'ADMIN_NOT_FOUND',
};

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
 * Gets an admin user by email address
 *
 * @param {string} email - Admin email address
 * @returns {Promise<Object|null>} Admin user data or null
 */
export async function getAdminByEmail(email) {
  if (!email) {
    return null;
  }

  const collectionRef = collection(db, COLLECTIONS.ADMINS);
  const emailQuery = query(collectionRef, where('email', '==', email.toLowerCase()));
  const snapshot = await getDocs(emailQuery);

  if (snapshot.empty) {
    return null;
  }

  const docSnapshot = snapshot.docs[0];
  return {
    id: docSnapshot.id,
    ...docSnapshot.data(),
  };
}

/**
 * Checks if an email address is already registered as an admin
 *
 * @param {string} email - Email address to check
 * @returns {Promise<boolean>} True if email already exists
 */
export async function isEmailRegistered(email) {
  const admin = await getAdminByEmail(email);
  return admin !== null;
}

/**
 * Creates a new admin user (pending invitation)
 * The Firebase Cloud Function will handle creating the Auth user and sending the invitation email.
 *
 * @param {string} adminId - Admin user ID (temporary ID, will be replaced by Firebase Auth UID)
 * @param {Object} adminData - Admin user data
 * @param {string} adminData.email - Admin email
 * @param {string} adminData.displayName - Admin display name
 * @param {string} adminData.role - Admin role
 * @param {string} invitedBy - UID of the admin who created this user
 * @param {string} invitedByEmail - Email of the admin who created this user
 * @returns {Promise<Object>} Created admin data
 * @throws {Error} If email is already registered or role is invalid
 */
export async function createAdmin(adminId, adminData, invitedBy, invitedByEmail = null) {
  const { email, role = ADMIN_ROLES.ADMIN } = adminData;

  // Validate email is provided
  if (!email) {
    const error = new Error('Email is required');
    error.code = ADMIN_ERROR_CODES.INVALID_ROLE;
    throw error;
  }

  // Normalize email to lowercase
  const normalizedEmail = email.toLowerCase().trim();

  // Check for duplicate email
  const existingAdmin = await getAdminByEmail(normalizedEmail);
  if (existingAdmin) {
    const error = new Error('An admin with this email already exists');
    error.code = ADMIN_ERROR_CODES.DUPLICATE_EMAIL;
    throw error;
  }

  // Validate role
  const validRoles = Object.values(ADMIN_ROLES);
  if (!validRoles.includes(role)) {
    const error = new Error(`Invalid role: ${role}. Must be one of: ${validRoles.join(', ')}`);
    error.code = ADMIN_ERROR_CODES.INVALID_ROLE;
    throw error;
  }

  const permissions = ADMIN_ROLE_PERMISSIONS[role] || ADMIN_ROLE_PERMISSIONS[ADMIN_ROLES.ADMIN];

  const docRef = doc(db, COLLECTIONS.ADMINS, adminId);
  const timestamp = serverTimestamp();

  const data = {
    email: normalizedEmail,
    displayName: adminData.displayName || normalizedEmail.split('@')[0],
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

  // Log the activity
  await logActivity({
    type: ACTIVITY_TYPES.CREATE,
    entityType: ENTITY_TYPES.USER,
    entityId: adminId,
    description: `Created admin user: ${normalizedEmail} with role ${role}`,
    adminId: invitedBy,
    adminEmail: invitedByEmail || 'Unknown',
  });

  return {
    id: adminId,
    ...data,
  };
}

/**
 * Resends invitation email to a pending admin
 * This creates a new admin document to trigger the Cloud Function again.
 *
 * @param {string} adminId - Admin user ID
 * @param {string} resendBy - UID of the admin requesting the resend
 * @returns {Promise<Object>} Updated admin data
 * @throws {Error} If admin not found or not in pending status
 */
export async function resendInvitation(adminId, resendBy) {
  const admin = await getAdmin(adminId);

  if (!admin) {
    const error = new Error('Admin not found');
    error.code = ADMIN_ERROR_CODES.ADMIN_NOT_FOUND;
    throw error;
  }

  if (admin.status !== 'pending') {
    throw new Error('Can only resend invitation to pending admins');
  }

  // Generate a new temporary ID for the new document
  const newTempId = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Create new admin document to trigger Cloud Function
  const docRef = doc(db, COLLECTIONS.ADMINS, newTempId);
  const timestamp = serverTimestamp();

  const data = {
    email: admin.email,
    displayName: admin.displayName,
    role: admin.role,
    permissions: admin.permissions,
    status: 'pending',
    invitedBy: admin.invitedBy,
    invitedAt: admin.invitedAt,
    resendRequestedBy: resendBy,
    resendRequestedAt: timestamp,
    createdAt: admin.createdAt,
    updatedAt: timestamp,
    lastLoginAt: null,
  };

  await setDoc(docRef, data);

  // Delete the old document
  await deleteDoc(doc(db, COLLECTIONS.ADMINS, adminId));

  return {
    id: newTempId,
    ...data,
  };
}

/**
 * Updates an admin user
 *
 * @param {string} adminId - Admin user ID
 * @param {Object} updates - Fields to update
 * @param {string} updatedBy - UID of the admin performing the update
 * @param {string} updatedByEmail - Email of the admin performing the update
 * @returns {Promise<void>}
 */
export async function updateAdmin(adminId, updates, updatedBy = null, updatedByEmail = null) {
  const docRef = doc(db, COLLECTIONS.ADMINS, adminId);

  const updateData = {
    ...updates,
    updatedAt: serverTimestamp(),
  };

  if (updates.role) {
    updateData.permissions = ADMIN_ROLE_PERMISSIONS[updates.role] || ADMIN_ROLE_PERMISSIONS[ADMIN_ROLES.ADMIN];
  }

  await updateDoc(docRef, updateData);

  // Log the activity if we have the updater information
  if (updatedBy && updatedByEmail) {
    const admin = await getAdmin(adminId);
    const updatedFields = Object.keys(updates).filter((key) => key !== 'updatedAt').join(', ');

    await logActivity({
      type: ACTIVITY_TYPES.UPDATE,
      entityType: ENTITY_TYPES.USER,
      entityId: adminId,
      description: `Updated admin user: ${admin?.email || adminId} (fields: ${updatedFields})`,
      adminId: updatedBy,
      adminEmail: updatedByEmail,
    });
  }
}

/**
 * Updates an admin user's role
 *
 * @param {string} adminId - Admin user ID
 * @param {string} newRole - New role from ADMIN_ROLES
 * @param {string} updatedBy - UID of the admin performing the update
 * @param {string} updatedByEmail - Email of the admin performing the update
 * @returns {Promise<void>}
 */
export async function updateAdminRole(adminId, newRole, updatedBy = null, updatedByEmail = null) {
  const permissions = ADMIN_ROLE_PERMISSIONS[newRole] || ADMIN_ROLE_PERMISSIONS[ADMIN_ROLES.ADMIN];

  await updateAdmin(adminId, {
    role: newRole,
    permissions,
  }, updatedBy, updatedByEmail);
}

/**
 * Activates an admin user
 *
 * @param {string} adminId - Admin user ID
 * @param {string} activatedBy - UID of the admin performing the activation
 * @param {string} activatedByEmail - Email of the admin performing the activation
 * @returns {Promise<void>}
 */
export async function activateAdmin(adminId, activatedBy = null, activatedByEmail = null) {
  const docRef = doc(db, COLLECTIONS.ADMINS, adminId);
  await updateDoc(docRef, {
    status: 'active',
    updatedAt: serverTimestamp(),
  });

  // Log the activity
  if (activatedBy && activatedByEmail) {
    const admin = await getAdmin(adminId);
    await logActivity({
      type: ACTIVITY_TYPES.APPROVE,
      entityType: ENTITY_TYPES.USER,
      entityId: adminId,
      description: `Activated admin user: ${admin?.email || adminId}`,
      adminId: activatedBy,
      adminEmail: activatedByEmail,
    });
  }
}

/**
 * Deactivates an admin user
 *
 * @param {string} adminId - Admin user ID
 * @param {string} deactivatedBy - UID of the admin performing the deactivation
 * @param {string} deactivatedByEmail - Email of the admin performing the deactivation
 * @returns {Promise<void>}
 */
export async function deactivateAdmin(adminId, deactivatedBy = null, deactivatedByEmail = null) {
  const docRef = doc(db, COLLECTIONS.ADMINS, adminId);
  await updateDoc(docRef, {
    status: 'inactive',
    updatedAt: serverTimestamp(),
  });

  // Log the activity
  if (deactivatedBy && deactivatedByEmail) {
    const admin = await getAdmin(adminId);
    await logActivity({
      type: ACTIVITY_TYPES.REJECT,
      entityType: ENTITY_TYPES.USER,
      entityId: adminId,
      description: `Deactivated admin user: ${admin?.email || adminId}`,
      adminId: deactivatedBy,
      adminEmail: deactivatedByEmail,
    });
  }
}

/**
 * Revokes a pending invitation by deleting the admin record
 * This removes the pending admin and invalidates their invitation.
 *
 * @param {string} adminId - Admin user ID to revoke
 * @param {string} revokedBy - UID of the admin performing the revocation
 * @param {string} revokedByEmail - Email of the admin performing the revocation
 * @returns {Promise<void>}
 * @throws {Error} If admin not found or not in pending status
 */
export async function revokeInvitation(adminId, revokedBy, revokedByEmail) {
  const admin = await getAdmin(adminId);

  if (!admin) {
    const error = new Error('Admin not found');
    error.code = ADMIN_ERROR_CODES.ADMIN_NOT_FOUND;
    throw error;
  }

  if (admin.status !== 'pending') {
    throw new Error('Can only revoke pending invitations');
  }

  const adminEmail = admin.email;

  // Delete the admin document
  await deleteDoc(doc(db, COLLECTIONS.ADMINS, adminId));

  // Log the activity
  if (revokedBy && revokedByEmail) {
    await logActivity({
      type: ACTIVITY_TYPES.DELETE,
      entityType: ENTITY_TYPES.USER,
      entityId: adminId,
      description: `Revoked invitation for: ${adminEmail}`,
      adminId: revokedBy,
      adminEmail: revokedByEmail,
    });
  }
}

/**
 * Checks if a user has a specific permission
 * Falls back to role-based permissions if admin.permissions is not set
 *
 * @param {Object} admin - Admin user object
 * @param {string} permission - Permission key to check
 * @returns {boolean} True if admin has the permission
 */
export function hasPermission(admin, permission) {
  if (!admin) {
    return false;
  }

  // Use stored permissions if available
  if (admin.permissions) {
    return admin.permissions[permission] === true;
  }

  // Fall back to role-based permissions for backwards compatibility
  const rolePermissions = ADMIN_ROLE_PERMISSIONS[admin.role];
  if (rolePermissions) {
    return rolePermissions[permission] === true;
  }

  return false;
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
