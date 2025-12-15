/**
 * AdminActivityPage Component
 * Activity log page for viewing admin activity history.
 *
 * @module pages/admin/AdminActivityPage
 */

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout, ActivityLogTable } from '../../components/admin';
import { getActivityLogs, getActivityLogsCount } from '../../services';
import styles from './AdminActivityPage.module.css';

/**
 * AdminActivityPage Component
 *
 * @returns {JSX.Element} The admin activity page
 */
function AdminActivityPage() {
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: null,
    entityType: null,
    adminId: null,
  });

  /**
   * Fetches activity logs
   *
   * @param {boolean} loadMore - Whether to load more (append) or refresh
   */
  const fetchLogs = useCallback(async (loadMore = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getActivityLogs({
        pageSize: 20,
        lastDoc: loadMore ? lastDoc : null,
        type: filters.type,
        entityType: filters.entityType,
        adminId: filters.adminId,
      });

      if (loadMore) {
        setLogs((prev) => [...prev, ...result.logs]);
      } else {
        setLogs(result.logs);
      }

      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);

      // Only get count on initial load, not on load more
      if (!loadMore) {
        const count = await getActivityLogsCount(filters);
        setTotalCount(count);
      }
    } catch (fetchError) {
      console.error('Failed to fetch activity logs:', fetchError);
      setError('Failed to load activity logs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [filters, lastDoc]);

  /**
   * Fetch logs on mount and when filters change
   */
  useEffect(() => {
    setLastDoc(null);
    fetchLogs(false);
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Handles loading more logs
   */
  const handleLoadMore = () => {
    fetchLogs(true);
  };

  /**
   * Handles filter changes
   *
   * @param {Object} newFilters - New filter values
   */
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  /**
   * Handles refresh
   */
  const handleRefresh = () => {
    setLastDoc(null);
    fetchLogs(false);
  };

  return (
    <AdminLayout title="Activity Log">
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Activity Log</h2>
          <p className={styles.subtitle}>
            View all admin activity and system events.
            {totalCount > 0 && ` (${totalCount.toLocaleString()} total)`}
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
          {isLoading && logs.length === 0 ? 'Loading...' : 'Refresh'}
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

      {/* Activity Log Table */}
      <ActivityLogTable
        logs={logs}
        isLoading={isLoading && logs.length === 0}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        filters={filters}
        onFilterChange={handleFilterChange}
      />
    </AdminLayout>
  );
}

export default AdminActivityPage;
