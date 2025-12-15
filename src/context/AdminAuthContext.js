/**
 * Admin Authentication Context
 * Provides Firebase authentication state and role-based access control for admin users.
 *
 * @module context/AdminAuthContext
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  signInAdmin,
  signOutAdmin,
  sendAdminPasswordReset,
  subscribeToAuthState,
} from '../services/auth';
import { hasPermission, isSuperAdmin } from '../services/admin';
import { ADMIN_ROLES } from '../constants';

/**
 * Check if dev mode is enabled (bypasses Firebase auth for testing)
 */
const DEV_MODE = process.env.REACT_APP_ADMIN_DEV_MODE === 'true';

/**
 * Mock admin user for dev mode
 */
const MOCK_ADMIN = {
  id: 'dev-admin',
  email: 'dev@test.com',
  displayName: 'Dev Admin',
  role: ADMIN_ROLES.SUPERADMIN,
  status: 'active',
};

/**
 * Mock Firebase user for dev mode
 */
const MOCK_USER = {
  uid: 'dev-admin',
  email: 'dev@test.com',
  displayName: 'Dev Admin',
};

/**
 * Admin authentication context
 */
const AdminAuthContext = createContext(null);

/**
 * AdminAuthProvider Component
 * Provides admin authentication context to child components.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} The admin auth provider component
 */
export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Subscribe to auth state changes on mount
   * In dev mode, automatically authenticate with mock admin
   */
  useEffect(() => {
    if (DEV_MODE) {
      // eslint-disable-next-line no-console
      console.log('🔓 Admin Dev Mode enabled - bypassing Firebase auth');
      setUser(MOCK_USER);
      setAdmin(MOCK_ADMIN);
      setIsLoading(false);
      return () => {};
    }

    const unsubscribe = subscribeToAuthState((firebaseUser, adminProfile) => {
      setUser(firebaseUser);
      setAdmin(adminProfile);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Signs in an admin user
   *
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Signed in admin data
   */
  const signIn = useCallback(async (email, password) => {
    if (DEV_MODE) {
      setUser(MOCK_USER);
      setAdmin(MOCK_ADMIN);
      return { user: MOCK_USER, admin: MOCK_ADMIN };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await signInAdmin(email, password);
      setUser(result.user);
      setAdmin(result.admin);
      return result;
    } catch (signInError) {
      const errorMessage = getAuthErrorMessage(signInError.code) || signInError.message;
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Signs out the current admin user
   */
  const signOut = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await signOutAdmin();
      setUser(null);
      setAdmin(null);
    } catch (signOutError) {
      console.error('Sign out error:', signOutError);
      setError('Failed to sign out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Sends a password reset email
   *
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  const resetPassword = useCallback(async (email) => {
    setError(null);

    try {
      await sendAdminPasswordReset(email);
    } catch (resetError) {
      const errorMessage = getAuthErrorMessage(resetError.code) || resetError.message;
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  /**
   * Checks if the current admin has a specific permission
   *
   * @param {string} permission - Permission key to check
   * @returns {boolean} True if admin has the permission
   */
  const checkPermission = useCallback(
    (permission) => {
      return hasPermission(admin, permission);
    },
    [admin]
  );

  /**
   * Checks if the current admin has a specific role
   *
   * @param {string} role - Role to check
   * @returns {boolean} True if admin has the role
   */
  const hasRole = useCallback(
    (role) => {
      if (!admin) {
        return false;
      }
      if (Array.isArray(role)) {
        return role.includes(admin.role);
      }
      return admin.role === role;
    },
    [admin]
  );

  /**
   * Clears any authentication errors
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      admin,
      isLoading,
      error,
      isAuthenticated: !!user && !!admin,
      isSuperAdmin: isSuperAdmin(admin),
      isAdmin: admin?.role === ADMIN_ROLES.ADMIN || admin?.role === ADMIN_ROLES.SUPERADMIN,
      isVolunteer: admin?.role === ADMIN_ROLES.VOLUNTEER,
      signIn,
      signOut,
      resetPassword,
      checkPermission,
      hasRole,
      clearError,
    }),
    [user, admin, isLoading, error, signIn, signOut, resetPassword, checkPermission, hasRole, clearError]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

AdminAuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Hook to access admin authentication context
 *
 * @returns {Object} Admin authentication context value
 * @throws {Error} If used outside of AdminAuthProvider
 */
export function useAdminAuth() {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }

  return context;
}

/**
 * Maps Firebase Auth error codes to user-friendly messages
 *
 * @param {string} code - Firebase Auth error code
 * @returns {string|null} User-friendly error message or null
 */
function getAuthErrorMessage(code) {
  const errorMessages = {
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password. Please try again.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/weak-password': 'Password is too weak. Please use a stronger password.',
  };

  return errorMessages[code] || null;
}

export default AdminAuthContext;
