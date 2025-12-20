/**
 * Authentication Service
 * Provides Firebase Authentication operations for admin users.
 *
 * @module services/auth
 */

import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { COLLECTIONS } from '../constants';
import { logActivity, ACTIVITY_TYPES, ENTITY_TYPES } from './activityLog';

/**
 * Signs in an admin user with email and password
 *
 * @param {string} email - User email address
 * @param {string} password - User password
 * @returns {Promise<Object>} User credentials and admin profile
 * @throws {Error} If credentials are invalid or user is not an admin
 */
export async function signInAdmin(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const { user } = userCredential;

  const adminDoc = await getDoc(doc(db, COLLECTIONS.ADMINS, user.uid));

  if (!adminDoc.exists()) {
    await firebaseSignOut(auth);
    throw new Error('You do not have admin access. Please contact a super admin.');
  }

  const adminData = adminDoc.data();

  // Auto-activate pending admins on first successful login
  // (they have completed password setup via invitation link)
  if (adminData.status === 'pending') {
    await updateDoc(doc(db, COLLECTIONS.ADMINS, user.uid), {
      status: 'active',
      lastLoginAt: serverTimestamp(),
      activatedAt: serverTimestamp(),
    });
  } else if (adminData.status !== 'active') {
    // Reject login for inactive or suspended accounts
    await firebaseSignOut(auth);
    throw new Error('Your admin account is inactive. Please contact a super admin.');
  } else {
    // Active user - just update lastLoginAt
    await updateDoc(doc(db, COLLECTIONS.ADMINS, user.uid), {
      lastLoginAt: serverTimestamp(),
    });
  }

  // Determine the final status (pending users were just activated)
  const finalStatus = adminData.status === 'pending' ? 'active' : adminData.status;

  // Log the login activity
  await logActivity({
    type: ACTIVITY_TYPES.LOGIN,
    entityType: ENTITY_TYPES.USER,
    entityId: user.uid,
    description: 'Admin user logged in',
    adminId: user.uid,
    adminEmail: user.email,
  });

  return {
    user,
    admin: {
      id: user.uid,
      email: user.email,
      ...adminData,
      status: finalStatus,
    },
  };
}

/**
 * Signs out the current user
 *
 * @param {Object} user - Current user object (optional, for activity logging)
 * @returns {Promise<void>}
 */
export async function signOutAdmin(user = null) {
  // Log the logout activity before signing out
  if (user) {
    await logActivity({
      type: ACTIVITY_TYPES.LOGOUT,
      entityType: ENTITY_TYPES.USER,
      entityId: user.uid,
      description: 'Admin user logged out',
      adminId: user.uid,
      adminEmail: user.email,
    });
  }

  await firebaseSignOut(auth);
}

/**
 * Sends a password reset email
 *
 * @param {string} email - User email address
 * @returns {Promise<void>}
 */
export async function sendAdminPasswordReset(email) {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Gets the current admin profile from Firestore
 *
 * @param {string} uid - Firebase Auth UID
 * @returns {Promise<Object|null>} Admin profile or null if not found
 */
export async function getAdminProfile(uid) {
  if (!uid) {
    return null;
  }

  const adminDoc = await getDoc(doc(db, COLLECTIONS.ADMINS, uid));

  if (!adminDoc.exists()) {
    return null;
  }

  return {
    id: adminDoc.id,
    ...adminDoc.data(),
  };
}

/**
 * Subscribes to auth state changes
 *
 * @param {Function} callback - Callback function receiving (user, admin) or (null, null)
 * @returns {Function} Unsubscribe function
 */
export function subscribeToAuthState(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const admin = await getAdminProfile(user.uid);
        callback(user, admin);
      } catch (error) {
        console.error('Failed to get admin profile:', error);
        callback(user, null);
      }
    } else {
      callback(null, null);
    }
  });
}

/**
 * Gets the current Firebase Auth user
 *
 * @returns {Object|null} Current user or null
 */
export function getCurrentUser() {
  return auth.currentUser;
}
