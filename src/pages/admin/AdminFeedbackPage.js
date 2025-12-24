/**
 * AdminFeedbackPage Component
 * Admin page for managing feedback form settings and form fields.
 *
 * @module pages/admin/AdminFeedbackPage
 */

import { useState, useCallback } from 'react';
import { AdminLayout, FeedbackSettingsManager } from '../../components/admin';
import styles from './AdminFeedbackPage.module.css';

/**
 * AdminFeedbackPage Component
 * Wrapper page for FeedbackSettingsManager with AdminLayout.
 *
 * @returns {JSX.Element} The admin feedback page
 */
function AdminFeedbackPage() {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handles refresh request
   */
  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    // FeedbackSettingsManager handles its own data fetching
    // This just triggers a UI reset
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Feedback</h2>
          <p className={styles.subtitle}>
            Configure the feedback form and manage form fields.
          </p>
        </div>
        <button
          className={styles.refreshButton}
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <FeedbackSettingsManager isLoading={isLoading} />
      </div>
    </AdminLayout>
  );
}

export default AdminFeedbackPage;
