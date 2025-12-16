/**
 * AdminDashboardPage Component
 * Main dashboard overview for admin users.
 *
 * @module pages/admin/AdminDashboardPage
 */

import { useState, useEffect, useCallback } from 'react';
import {
  AdminLayout,
  StatsCard,
  RegistrationChart,
  RecentRegistrations,
  QuickActions,
} from '../../components/admin';
import { useAdminAuth } from '../../context';
import {
  getDashboardStats,
  getRecentRegistrations,
  getRegistrationChartData,
} from '../../services';
import { CONFERENCE } from '../../constants';
import styles from './AdminDashboardPage.module.css';

/**
 * AdminDashboardPage Component
 *
 * @returns {JSX.Element} The admin dashboard page
 */
function AdminDashboardPage() {
  const { admin } = useAdminAuth();
  const [stats, setStats] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetches all dashboard data
   */
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [statsData, recentData, chart] = await Promise.all([
        getDashboardStats(),
        getRecentRegistrations(10),
        getRegistrationChartData(30),
      ]);

      setStats(statsData);
      setRegistrations(recentData);
      setChartData(chart);
    } catch (fetchError) {
      console.error('Failed to fetch dashboard data:', fetchError);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch data on mount
   */
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <AdminLayout title="Dashboard">
      {/* Welcome Section */}
      <div className={styles.welcome}>
        <div>
          <h2 className={styles.welcomeTitle}>
            Welcome back, {admin?.displayName || 'Admin'}!
          </h2>
          <p className={styles.welcomeSubtitle}>
            IDMC {CONFERENCE.YEAR} - {CONFERENCE.THEME}
          </p>
        </div>
        <button
          className={styles.refreshButton}
          onClick={fetchDashboardData}
          disabled={isLoading}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className={styles.errorBanner} role="alert">
          {error}
          <button onClick={() => setError(null)} aria-label="Dismiss error">
            &times;
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <StatsCard
          label="Total Registrations"
          value={stats?.totalRegistrations}
          icon="users"
          variant="primary"
          isLoading={isLoading}
        />
        <StatsCard
          label="Confirmed"
          value={stats?.confirmedRegistrations}
          icon="confirmed"
          variant="blue"
          isLoading={isLoading}
        />
        <StatsCard
          label="Pending Payment"
          value={stats?.pendingPayment}
          icon="pending"
          variant="amber"
          isLoading={isLoading}
        />
        <StatsCard
          label="Total Revenue"
          value={stats?.totalRevenue}
          icon="revenue"
          variant="purple"
          isCurrency
          isLoading={isLoading}
        />
        <StatsCard
          label="Checked In"
          value={stats?.checkedIn}
          icon="checkin"
          variant="teal"
          isLoading={isLoading}
        />
      </div>

      {/* Main Content Grid */}
      <div className={styles.contentGrid}>
        {/* Left Column - Charts */}
        <div className={styles.leftColumn}>
          <RegistrationChart
            data={chartData}
            title="Registration Trends"
            period="Last 30 Days"
            isLoading={isLoading}
          />
        </div>

        {/* Right Column - Quick Actions */}
        <div className={styles.rightColumn}>
          <QuickActions />
        </div>
      </div>

      {/* Recent Registrations - Full Width */}
      <div className={styles.fullWidthSection}>
        <RecentRegistrations
          registrations={registrations}
          isLoading={isLoading}
          limit={10}
        />
      </div>
    </AdminLayout>
  );
}

export default AdminDashboardPage;
