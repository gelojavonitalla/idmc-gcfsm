/**
 * Toast Component
 * Displays toast notifications at the top-right of the screen.
 *
 * @module components/ui/Toast
 */

import { useToast } from '../../context/ToastContext';
import styles from './Toast.module.css';

/**
 * Toast Container Component
 * Renders all active toasts
 *
 * @returns {JSX.Element} Toast container
 */
function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className={styles.toastContainer}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${styles.toast} ${styles[toast.type]}`}
          role="alert"
          aria-live="polite"
        >
          <div className={styles.toastContent}>
            <span className={styles.toastIcon}>
              {toast.type === 'success' && '✓'}
              {toast.type === 'error' && '✕'}
              {toast.type === 'warning' && '⚠'}
              {toast.type === 'info' && 'ⓘ'}
            </span>
            <span className={styles.toastMessage}>{toast.message}</span>
          </div>
          <button
            type="button"
            className={styles.toastClose}
            onClick={() => dismissToast(toast.id)}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
