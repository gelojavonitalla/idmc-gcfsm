/**
 * AdminLoadingFallback Component
 * Loading fallback for lazy-loaded admin pages.
 * Used with React.Suspense for code splitting.
 *
 * @module components/admin/AdminLoadingFallback
 */

import styles from './AdminLoadingFallback.module.css';

/**
 * AdminLoadingFallback Component
 * Displays a loading spinner while admin pages are being loaded.
 *
 * @returns {JSX.Element} The loading fallback component
 */
function AdminLoadingFallback() {
  return (
    <div className={styles.container}>
      <div className={styles.spinner} aria-label="Loading..." />
      <p className={styles.text}>Loading...</p>
    </div>
  );
}

export default AdminLoadingFallback;
