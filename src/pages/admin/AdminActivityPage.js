/**
 * AdminActivityPage Component
 * Activity log page for viewing admin activity history.
 *
 * @module pages/admin/AdminActivityPage
 */

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout, ActivityLogTable } from '../../components/admin';
import { getActivityLogs, getActivityLogsCount, ACTIVITY_TYPE_LABELS } from '../../services';
import { downloadCsv } from '../../utils';
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
  const [isExporting, setIsExporting] = useState(false);

  /**
   * Formats timestamp for CSV
   *
   * @param {Object|string} timestamp - Firestore timestamp or string
   * @returns {string} Formatted date
   */
  const formatTimestampForCsv = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  /**
   * Escapes a value for CSV format
   *
   * @param {*} value - Value to escape
   * @returns {string} Escaped value
   */
  const escapeCsvValue = (value) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  /**
   * Handles exporting activity logs to CSV
   */
  const handleExport = useCallback(async () => {
    if (logs.length === 0) {
      setError('No logs to export.');
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      const headers = ['Date/Time', 'Activity Type', 'Entity Type', 'Description', 'Admin Email'];
      const rows = logs.map((log) => [
        formatTimestampForCsv(log.createdAt),
        ACTIVITY_TYPE_LABELS[log.type] || log.type,
        log.entityType || '',
        log.description,
        log.adminEmail || '',
      ].map(escapeCsvValue));

      const csvContent = [
        headers.map(escapeCsvValue).join(','),
        ...rows.map((row) => row.join(',')),
      ].join('\n');

      const date = new Date().toISOString().split('T')[0];
      downloadCsv(csvContent, `activity-log-${date}.csv`);
    } catch (err) {
      console.error('Failed to export activity logs:', err);
      setError('Failed to export activity logs. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [logs]);

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
        pageSize: 50,
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
        <div className={styles.headerActions}>
          <button
            className={styles.exportButton}
            onClick={handleExport}
            disabled={isExporting || isLoading || logs.length === 0}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>
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
