/**
 * Authentication Context
 * Provides authentication state and role-based access control.
 *
 * @module context/AuthContext
 */

import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { USER_ROLES, IDMC_TEAM_ROLES, USER_ROLE_LABELS } from '../constants';

/**
 * Authentication context
 */
const AuthContext = createContext(null);

/**
 * Storage key for persisting auth state
 */
const AUTH_STORAGE_KEY = 'idmc_auth_user';

/**
 * Retrieves stored user from localStorage
 *
 * @returns {Object|null} The stored user object or null
 */
function getStoredUser() {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to parse stored auth user:', error);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
  return null;
}

/**
 * AuthProvider Component
 * Provides authentication context to child components.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} The auth provider component
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Signs in a user with the specified role.
   * This is a simplified auth for demonstration - in production,
   * this would integrate with Firebase Authentication.
   *
   * @param {string} email - User email
   * @param {string} role - User role from USER_ROLES
   * @returns {Promise<Object>} The signed-in user object
   */
  const signIn = useCallback(async (email, role) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!email || !email.trim()) {
        throw new Error('Email is required');
      }

      if (!Object.values(USER_ROLES).includes(role)) {
        throw new Error('Invalid role specified');
      }

      const newUser = {
        id: `user_${Date.now()}`,
        email: email.trim().toLowerCase(),
        role,
        roleLabel: USER_ROLE_LABELS[role],
        signedInAt: new Date().toISOString(),
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
      setUser(newUser);

      return newUser;
    } catch (signInError) {
      setError(signInError.message);
      throw signInError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Signs out the current user
   */
  const signOut = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
    setError(null);
  }, []);

  /**
   * Checks if the current user has one of the specified roles
   *
   * @param {Array<string>} roles - Array of allowed roles
   * @returns {boolean} True if user has one of the roles
   */
  const hasRole = useCallback(
    (roles) => {
      if (!user) {
        return false;
      }
      return roles.includes(user.role);
    },
    [user]
  );

  /**
   * Checks if the current user is part of the IDMC team
   *
   * @returns {boolean} True if user is an IDMC team member
   */
  const isIDMCTeam = useMemo(() => {
    if (!user) {
      return false;
    }
    return IDMC_TEAM_ROLES.includes(user.role);
  }, [user]);

  /**
   * Checks if the current user is an admin
   *
   * @returns {boolean} True if user is an admin
   */
  const isAdmin = useMemo(() => {
    return user?.role === USER_ROLES.ADMIN;
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      error,
      isAuthenticated: !!user,
      isIDMCTeam,
      isAdmin,
      signIn,
      signOut,
      hasRole,
    }),
    [user, isLoading, error, isIDMCTeam, isAdmin, signIn, signOut, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Hook to access authentication context
 *
 * @returns {Object} Authentication context value
 * @throws {Error} If used outside of AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export default AuthContext;
