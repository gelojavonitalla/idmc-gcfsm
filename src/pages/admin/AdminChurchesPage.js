/**
 * AdminChurchesPage Component
 * Full breakdown of churches and their delegate counts.
 *
 * @module pages/admin/AdminChurchesPage
 */

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../../components/admin';
import { getChurchStats } from '../../services';
import { downloadCsv } from '../../utils';
import styles from './AdminChurchesPage.module.css';

/**
 * AdminChurchesPage Component
 *
 * @returns {JSX.Element} The admin churches breakdown page
 */
function AdminChurchesPage() {
  const [churches, setChurches] = useState([]);
  const [totalChurches, setTotalChurches] = useState(0);
  const [totalDelegates, setTotalDelegates] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  /**
   * Fetches church statistics
   */
  const fetchChurchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getChurchStats();
      setChurches(data.churches);
      setTotalChurches(data.totalChurches);
      setTotalDelegates(data.totalDelegates);
    } catch (fetchError) {
      console.error('Failed to fetch church stats:', fetchError);
      setError('Failed to load church data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch data on mount
   */
  useEffect(() => {
    fetchChurchStats();
  }, [fetchChurchStats]);

  /**
   * Filters churches by search term
   */
  const filteredChurches = churches.filter((church) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      church.name.toLowerCase().includes(searchLower) ||
      (church.city && church.city.toLowerCase().includes(searchLower))
    );
  });

  /**
   * Escapes a value for CSV format
   *
   * @param {*} value - Value to escape
   * @returns {string} Escaped value
   */
  const escapeCsvValue = (value) => {
    if (value === null || value === undefined) {
      return '';
    }
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  /**
   * Handles exporting churches to CSV
   */
  const handleExport = useCallback(async () => {
    if (churches.length === 0) {
      setError('No church data to export.');
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      const headers = ['Rank', 'Church Name', 'City', 'Delegates', 'Registrations'];
      const rows = churches.map((church, index) => [
        index + 1,
        church.name,
        church.city || '',
        church.delegateCount,
        church.registrationCount,
      ].map(escapeCsvValue));

      const csvContent = [
        headers.map(escapeCsvValue).join(','),
        ...rows.map((row) => row.join(',')),
      ].join('\n');

      const date = new Date().toISOString().split('T')[0];
      downloadCsv(csvContent, `churches-breakdown-${date}.csv`);
    } catch (err) {
      console.error('Failed to export church data:', err);
      setError('Failed to export church data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [churches]);

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Churches Breakdown</h2>
          <p className={styles.subtitle}>
            {totalChurches} churches with {totalDelegates} total delegates
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.exportButton}
            onClick={handleExport}
            disabled={isExporting || isLoading || churches.length === 0}
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
            onClick={fetchChurchStats}
            disabled={isLoading}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path
                d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
              />
            </svg>
            {isLoading ? 'Loading...' : 'Refresh'}
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

      {/* Search */}
      <div className={styles.searchWrapper}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search churches by name or city..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            className={styles.clearSearch}
            onClick={() => setSearchTerm('')}
            aria-label="Clear search"
          >
            &times;
          </button>
        )}
      </div>

      {/* Results Count */}
      {searchTerm && (
        <p className={styles.resultsCount}>
          Showing {filteredChurches.length} of {churches.length} churches
        </p>
      )}

      {/* Churches Table */}
      <div className={styles.tableWrapper}>
        {isLoading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p>Loading church data...</p>
          </div>
        ) : filteredChurches.length === 0 ? (
          <div className={styles.emptyState}>
            {searchTerm ? (
              <p>No churches found matching &quot;{searchTerm}&quot;</p>
            ) : (
              <p>No church data available yet</p>
            )}
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.rankColumn}>Rank</th>
                <th>Church Name</th>
                <th>City</th>
                <th className={styles.numberColumn}>Delegates</th>
                <th className={styles.numberColumn}>Registrations</th>
              </tr>
            </thead>
            <tbody>
              {filteredChurches.map((church, index) => (
                <tr key={`${church.name}-${church.city}`}>
                  <td className={styles.rankColumn}>
                    <span className={`${styles.rank} ${index < 3 ? styles[`rank${index + 1}`] : ''}`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className={styles.churchName}>{church.name}</td>
                  <td className={styles.churchCity}>{church.city || '—'}</td>
                  <td className={styles.numberColumn}>
                    <span className={styles.delegateCount}>{church.delegateCount}</span>
                  </td>
                  <td className={styles.numberColumn}>{church.registrationCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminChurchesPage;
