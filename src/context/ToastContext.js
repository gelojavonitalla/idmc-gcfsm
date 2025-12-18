/**
 * Toast Context
 * Provides toast notification functionality throughout the application.
 *
 * @module context/ToastContext
 */

import { createContext, useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';

const ToastContext = createContext(null);

/**
 * Hook to access toast notifications
 *
 * @returns {Object} Toast context with showToast method
 * @throws {Error} If used outside ToastProvider
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

/**
 * Toast Provider Component
 * Wraps the application to provide toast notification functionality
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Provider component
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  /**
   * Shows a toast notification
   *
   * @param {string} message - Message to display
   * @param {('success'|'error'|'info'|'warning')} type - Toast type
   * @param {number} duration - Duration in milliseconds (default: 5000)
   */
  const showToast = useCallback((message, type = 'success', duration = 5000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, duration);
  }, []);

  /**
   * Manually dismiss a toast
   *
   * @param {number|string} id - Toast ID to dismiss
   */
  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const value = {
    toasts,
    showToast,
    dismissToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
