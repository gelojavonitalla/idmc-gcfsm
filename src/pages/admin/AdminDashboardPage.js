/**
 * AdminDashboardPage Component
 * Main dashboard overview for admin users.
 *
 * @module pages/admin/AdminDashboardPage
 */

import { AdminLayout } from '../../components/admin';
import { useAdminAuth } from '../../context';
import { CONFERENCE } from '../../constants';
import styles from './AdminDashboardPage.module.css';

/**
 * AdminDashboardPage Component
 *
 * @returns {JSX.Element} The admin dashboard page
 */
function AdminDashboardPage() {
  const { admin } = useAdminAuth();

  return (
    <AdminLayout title="Dashboard">
      <div className={styles.welcome}>
        <h2 className={styles.welcomeTitle}>
          Welcome back, {admin?.displayName || 'Admin'}!
        </h2>
        <p className={styles.welcomeSubtitle}>
          IDMC {CONFERENCE.YEAR} Admin Dashboard
        </p>
      </div>

      <div className={styles.placeholder}>
        <div className={styles.placeholderIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </div>
        <h3 className={styles.placeholderTitle}>Dashboard Coming Soon</h3>
        <p className={styles.placeholderText}>
          Stats cards, registration charts, and quick actions will be available in Phase 2.
        </p>
      </div>
    </AdminLayout>
  );
}

export default AdminDashboardPage;
