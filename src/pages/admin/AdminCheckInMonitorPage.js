/**
 * AdminCheckInMonitorPage Component
 * Dedicated monitoring dashboard for check-in statistics and recent activity.
 * Provides real-time updates of check-in progress and recent check-ins.
 *
 * @module pages/admin/AdminCheckInMonitorPage
 */

import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin';
import { CheckInStats, RecentCheckIns } from '../../components/checkin';
import {
  subscribeToCheckInStatsFromCollection,
  subscribeToRecentCheckIns,
} from '../../services';
import styles from './AdminCheckInMonitorPage.module.css';

/**
 * AdminCheckInMonitorPage Component
 *
 * @returns {JSX.Element} The admin check-in monitor page
 */
function AdminCheckInMonitorPage() {
  const [stats, setStats] = useState(null);
  const [recentCheckIns, setRecentCheckIns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Subscribe to real-time stats from stats collection and recent check-ins
   */
  useEffect(() => {
    setIsLoading(true);

    // Use stats from the dedicated stats collection (maintained by Cloud Functions)
    const unsubscribeStats = subscribeToCheckInStatsFromCollection((newStats) => {
      setStats(newStats);
      setIsLoading(false);
    });

    const unsubscribeCheckIns = subscribeToRecentCheckIns(20, (checkIns) => {
      setRecentCheckIns(checkIns);
    });

    return () => {
      unsubscribeStats();
      unsubscribeCheckIns();
    };
  }, []);

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Check-In Monitor</h1>
            <p className={styles.subtitle}>
              Real-time check-in statistics and activity
            </p>
          </div>
        </div>

        <div className={styles.content}>
          {/* Statistics Section */}
          <div className={styles.statsSection}>
            <CheckInStats stats={stats} isLoading={isLoading} />
          </div>

          {/* Recent Check-ins Section */}
          <div className={styles.recentSection}>
            <RecentCheckIns
              checkIns={recentCheckIns}
              isLoading={isLoading}
              limit={20}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminCheckInMonitorPage;
