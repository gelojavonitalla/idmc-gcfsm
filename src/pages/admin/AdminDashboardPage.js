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
  TopChurchesCard,
  DownloadStatsCard,
  FoodStatsCard,
} from '../../components/admin';
import { useAdminAuth, useSettings } from '../../context';
import {
  getDashboardStats,
  getRecentRegistrations,
  getRegistrationChartData,
  getChurchStats,
  getFoodStats,
  getDownloadStats,
} from '../../services';
import styles from './AdminDashboardPage.module.css';

/**
 * AdminDashboardPage Component
 *
 * @returns {JSX.Element} The admin dashboard page
 */
function AdminDashboardPage() {
  const { admin } = useAdminAuth();
  const { settings } = useSettings();
  const [stats, setStats] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [churchStats, setChurchStats] = useState(null);
  const [foodStats, setFoodStats] = useState(null);
  const [downloadStats, setDownloadStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetches all dashboard data
   */
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [statsData, recentData, chart, churches, food, downloads] = await Promise.all([
        getDashboardStats(),
        getRecentRegistrations(10),
        getRegistrationChartData(30),
        getChurchStats(5),
        getFoodStats(),
        getDownloadStats(),
      ]);

      setStats(statsData);
      setRegistrations(recentData);
      setChartData(chart);
      setChurchStats(churches);
      setFoodStats(food);
      setDownloadStats(downloads);
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
    <AdminLayout>
      {/* Welcome Section */}
      <div className={styles.welcome}>
        <div>
          <h2 className={styles.welcomeTitle}>
            Welcome back, {admin?.displayName || 'Admin'}!
          </h2>
          <p className={styles.welcomeSubtitle}>
            {settings?.title || 'IDMC'} - {settings?.theme || ''}
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

      {/* Additional Stats Grid */}
      <div className={styles.additionalStatsGrid}>
        <TopChurchesCard
          churches={churchStats?.churches || []}
          totalChurches={churchStats?.totalChurches || 0}
          totalDelegates={churchStats?.totalDelegates || 0}
          isLoading={isLoading}
        />
        <FoodStatsCard
          distribution={foodStats?.distribution || []}
          totalWithChoice={foodStats?.totalWithChoice || 0}
          totalWithoutChoice={foodStats?.totalWithoutChoice || 0}
          totalAttendees={foodStats?.totalAttendees || 0}
          isLoading={isLoading}
        />
        <DownloadStatsCard
          items={downloadStats?.items || []}
          totalDownloads={downloadStats?.totalDownloads || 0}
          totalFiles={downloadStats?.totalFiles || 0}
          isLoading={isLoading}
        />
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
