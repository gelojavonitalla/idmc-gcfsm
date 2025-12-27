/**
 * Authentication and Authorization Helpers
 *
 * Provides centralized functions for verifying admin roles and permissions
 * in Cloud Functions.
 *
 * @module functions/auth
 */

import {getFirestore} from "firebase-admin/firestore";
import {HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

/**
 * Admin roles available in the system
 */
export const ADMIN_ROLES = {
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  FINANCE: "finance",
  MEDIA: "media",
  VOLUNTEER: "volunteer",
} as const;

export type AdminRole = typeof ADMIN_ROLES[keyof typeof ADMIN_ROLES];

/**
 * Admin status values
 */
export const ADMIN_STATUS = {
  ACTIVE: "active",
  PENDING: "pending",
  INACTIVE: "inactive",
} as const;

export type AdminStatus = typeof ADMIN_STATUS[keyof typeof ADMIN_STATUS];

/**
 * Admin data structure from Firestore
 */
export interface AdminData {
  email: string;
  displayName: string;
  role: AdminRole;
  status: AdminStatus;
  permissions?: string[];
  createdAt?: FirebaseFirestore.Timestamp;
  updatedAt?: FirebaseFirestore.Timestamp;
}

/**
 * Result of admin verification
 */
export interface AdminVerificationResult {
  uid: string;
  admin: AdminData;
}

/**
 * Verifies that the request is from an authenticated admin user
 *
 * This function:
 * 1. Checks that the request has valid authentication
 * 2. Looks up the admin document in Firestore
 * 3. Verifies the admin exists and is active
 * 4. Optionally checks for specific roles
 *
 * @param {string | undefined} uid - The Firebase Auth UID from request.auth
 * @param {AdminRole[]} requiredRoles - Optional list of allowed roles
 * @return {Promise<AdminVerificationResult>} The verified admin data
 * @throws {HttpsError} If authentication or authorization fails
 *
 * @example
 * // Require any active admin
 * const { admin } = await verifyAdminRole(request.auth?.uid);
 *
 * @example
 * // Require superadmin or finance role
 * const { admin } = await verifyAdminRole(
 *   request.auth?.uid,
 *   ['superadmin', 'finance']
 * );
 */
export async function verifyAdminRole(
  uid: string | undefined,
  requiredRoles?: AdminRole[]
): Promise<AdminVerificationResult> {
  // Check authentication
  if (!uid) {
    logger.warn("Unauthenticated request to admin-only function");
    throw new HttpsError(
      "unauthenticated",
      "You must be logged in to perform this action"
    );
  }

  // Get admin document
  const db = getFirestore();
  const adminDoc = await db.collection("admins").doc(uid).get();

  if (!adminDoc.exists) {
    logger.warn(`Non-admin user attempted admin action: ${uid}`);
    throw new HttpsError(
      "permission-denied",
      "You do not have permission to perform this action"
    );
  }

  const adminData = adminDoc.data() as AdminData;

  // Check if admin is active
  if (adminData.status !== ADMIN_STATUS.ACTIVE) {
    logger.warn(`Inactive admin attempted action: ${uid}, status: ${adminData.status}`);
    throw new HttpsError(
      "permission-denied",
      "Your admin account is not active. Please contact a superadmin."
    );
  }

  // Check role requirements if specified
  if (requiredRoles && requiredRoles.length > 0) {
    if (!requiredRoles.includes(adminData.role)) {
      logger.warn(
        `Admin ${uid} with role '${adminData.role}' attempted action ` +
        `requiring roles: ${requiredRoles.join(", ")}`
      );
      throw new HttpsError(
        "permission-denied",
        `This action requires one of these roles: ${requiredRoles.join(", ")}`
      );
    }
  }

  logger.info(`Admin verified: ${uid}, role: ${adminData.role}`);

  return {
    uid,
    admin: adminData,
  };
}

/**
 * Verifies that the request is from a superadmin
 *
 * Convenience wrapper around verifyAdminRole for superadmin-only functions.
 *
 * @param {string | undefined} uid - The Firebase Auth UID from request.auth
 * @return {Promise<AdminVerificationResult>} The verified admin data
 * @throws {HttpsError} If not a superadmin
 */
export async function verifySuperAdmin(
  uid: string | undefined
): Promise<AdminVerificationResult> {
  return verifyAdminRole(uid, [ADMIN_ROLES.SUPERADMIN]);
}

/**
 * Verifies that the request is from a finance admin or superadmin
 *
 * @param {string | undefined} uid - The Firebase Auth UID from request.auth
 * @return {Promise<AdminVerificationResult>} The verified admin data
 * @throws {HttpsError} If not authorized for finance operations
 */
export async function verifyFinanceAdmin(
  uid: string | undefined
): Promise<AdminVerificationResult> {
  return verifyAdminRole(uid, [ADMIN_ROLES.SUPERADMIN, ADMIN_ROLES.FINANCE]);
}

/**
 * Checks if the admin has a specific permission
 *
 * Some actions may require specific permissions beyond role-based access.
 * This function checks the admin's permissions array.
 *
 * @param {AdminData} admin - The admin data
 * @param {string} permission - The permission to check
 * @return {boolean} True if the admin has the permission
 */
export function hasPermission(admin: AdminData, permission: string): boolean {
  // Superadmins have all permissions
  if (admin.role === ADMIN_ROLES.SUPERADMIN) {
    return true;
  }

  return admin.permissions?.includes(permission) ?? false;
}

/**
 * Requires a specific permission, throwing an error if not present
 *
 * @param {AdminData} admin - The admin data
 * @param {string} permission - The required permission
 * @throws {HttpsError} If the permission is not present
 */
export function requirePermission(admin: AdminData, permission: string): void {
  if (!hasPermission(admin, permission)) {
    throw new HttpsError(
      "permission-denied",
      `This action requires the '${permission}' permission`
    );
  }
}

/**
 * Checks if a user is an authenticated admin (any role, active status)
 *
 * This is a non-throwing version of verifyAdminRole that simply returns
 * a boolean. Useful for conditional logic like skipping rate limits
 * for authenticated admins during check-in operations.
 *
 * @param {string | undefined} uid - The Firebase Auth UID from request.auth
 * @return {Promise<boolean>} True if the user is an active admin
 *
 * @example
 * // Skip rate limiting for authenticated admins
 * const isAdmin = await isAuthenticatedAdmin(request.auth?.uid);
 * if (!isAdmin) {
 *   await checkRateLimit(...);
 * }
 */
export async function isAuthenticatedAdmin(
  uid: string | undefined
): Promise<boolean> {
  if (!uid) {
    return false;
  }

  try {
    const db = getFirestore();
    const adminDoc = await db.collection("admins").doc(uid).get();

    if (!adminDoc.exists) {
      return false;
    }

    const adminData = adminDoc.data() as AdminData;
    return adminData.status === ADMIN_STATUS.ACTIVE;
  } catch (error) {
    logger.warn(`Error checking admin status for ${uid}:`, error);
    return false;
  }
}
