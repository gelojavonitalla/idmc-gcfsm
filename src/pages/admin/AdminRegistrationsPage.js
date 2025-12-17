/**
 * AdminRegistrationsPage Component
 * Registrations management page for admins.
 *
 * @module pages/admin/AdminRegistrationsPage
 */

import { useState, useEffect, useCallback } from 'react';
import {
  AdminLayout,
  RegistrationsTable,
  RegistrationDetailModal,
} from '../../components/admin';
import {
  getRegistrations,
  getRegistrationsCount,
  searchRegistrations,
  updateRegistration,
} from '../../services/maintenance';
import { REGISTRATION_STATUS } from '../../constants';
import { exportRegistrationsToCsv } from '../../utils';
import styles from './AdminRegistrationsPage.module.css';

/**
 * AdminRegistrationsPage Component
 *
 * @returns {JSX.Element} The admin registrations page
 */
/**
 * Default page size for pagination
 */
const PAGE_SIZE = 50;

function AdminRegistrationsPage() {
  const [registrations, setRegistrations] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [isSearchMode, setIsSearchMode] = useState(false);

  /**
   * Fetches registrations with pagination
   *
   * @param {boolean} loadMore - Whether to load more or reset
   */
  const fetchRegistrations = useCallback(async (loadMore = false) => {
    if (loadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setLastDoc(null);
    }
    setError(null);

    try {
      const result = await getRegistrations({
        pageSize: PAGE_SIZE,
        lastDoc: loadMore ? lastDoc : null,
        status: statusFilter,
      });

      if (loadMore) {
        setRegistrations((prev) => [...prev, ...result.registrations]);
      } else {
        setRegistrations(result.registrations);
      }

      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);

      // Fetch total count for stats (only on initial load or filter change)
      if (!loadMore) {
        const countResult = await getRegistrationsCount({ status: statusFilter });
        setTotalCount(countResult.filtered);
      }
    } catch (fetchError) {
      console.error('Failed to fetch registrations:', fetchError);
      setError('Failed to load registrations. Please try again.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [lastDoc, statusFilter]);

  /**
   * Handles loading more registrations
   */
  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchRegistrations(true);
    }
  }, [fetchRegistrations, isLoadingMore, hasMore]);

  /**
   * Fetch registrations on mount and when status filter changes
   */
  useEffect(() => {
    if (!isSearchMode) {
      fetchRegistrations(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  /**
   * Handles server-side search with debounce
   */
  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    // If search is cleared, exit search mode
    if (!trimmedQuery) {
      setIsSearchMode(false);
      setSearchResults([]);
      return;
    }

    // Minimum 2 characters to search
    if (trimmedQuery.length < 2) {
      return;
    }

    // Debounce the search
    const debounceTimer = setTimeout(async () => {
      setIsSearchMode(true);
      setIsSearching(true);
      setError(null);

      try {
        const results = await searchRegistrations(trimmedQuery, { status: statusFilter });
        setSearchResults(results);
      } catch (searchError) {
        console.error('Search failed:', searchError);
        setError('Search failed. Please try again.');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, statusFilter]);

  /**
   * Handles viewing registration details
   *
   * @param {Object} registration - Registration to view
   */
  const handleViewDetails = (registration) => {
    setSelectedRegistration(registration);
    setIsModalOpen(true);
  };

  /**
   * Handles updating registration status
   *
   * @param {string} registrationId - Registration ID
   * @param {string} newStatus - New status value
   */
  const handleUpdateStatus = async (registrationId, newStatus) => {
    setIsUpdating(true);

    try {
      await updateRegistration(registrationId, { status: newStatus });

      // Update local state
      setRegistrations((prev) =>
        prev.map((r) =>
          r.id === registrationId ? { ...r, status: newStatus } : r
        )
      );

      // Update selected registration if modal is open
      if (selectedRegistration?.id === registrationId) {
        setSelectedRegistration((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (updateError) {
      console.error('Failed to update registration status:', updateError);
      setError('Failed to update status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Handles updating registration notes
   *
   * @param {string} registrationId - Registration ID
   * @param {string} notes - New notes value
   */
  const handleUpdateNotes = async (registrationId, notes) => {
    try {
      await updateRegistration(registrationId, { notes });

      // Update local state
      setRegistrations((prev) =>
        prev.map((r) =>
          r.id === registrationId ? { ...r, notes } : r
        )
      );

      // Update selected registration if modal is open
      if (selectedRegistration?.id === registrationId) {
        setSelectedRegistration((prev) => ({ ...prev, notes }));
      }
    } catch (updateError) {
      console.error('Failed to update registration notes:', updateError);
      setError('Failed to save notes. Please try again.');
      throw updateError;
    }
  };

  /**
   * Handles exporting registrations to CSV
   * Exports current view (search results or loaded registrations)
   */
  const handleExport = async () => {
    setIsExporting(true);
    setError(null);

    try {
      const dataToExport = isSearchMode ? searchResults : registrations;
      if (dataToExport.length === 0) {
        setError('No registrations to export.');
        return;
      }

      const prefix = isSearchMode
        ? `registrations-search-${searchQuery.replace(/[^a-zA-Z0-9]/g, '_')}`
        : statusFilter !== 'all'
          ? `registrations-${statusFilter}`
          : 'registrations';
      exportRegistrationsToCsv(dataToExport, prefix);
    } catch (exportError) {
      console.error('Failed to export registrations:', exportError);
      setError('Failed to export registrations. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Gets registration statistics from loaded data
   * Note: These stats are calculated from currently loaded registrations
   *
   * @returns {Object} Statistics object
   */
  const getStats = () => {
    const loaded = registrations.length;
    const confirmed = registrations.filter(
      (r) => r.status === REGISTRATION_STATUS.CONFIRMED
    ).length;
    const pendingVerification = registrations.filter(
      (r) => r.status === REGISTRATION_STATUS.PENDING_VERIFICATION
    ).length;
    const pendingPayment = registrations.filter(
      (r) => r.status === REGISTRATION_STATUS.PENDING_PAYMENT
    ).length;
    const cancelled = registrations.filter(
      (r) => r.status === REGISTRATION_STATUS.CANCELLED
    ).length;

    // Calculate total revenue from confirmed registrations (loaded data only)
    const totalRevenue = registrations
      .filter((r) => r.status === REGISTRATION_STATUS.CONFIRMED)
      .reduce((sum, r) => sum + (r.totalAmount || 0), 0);

    return {
      total: statusFilter === 'all' ? totalCount : loaded,
      loaded,
      confirmed,
      pendingVerification,
      pendingPayment,
      cancelled,
      totalRevenue,
    };
  };

  /**
   * Gets the registrations to display based on current mode
   * In search mode, returns server-side search results
   * Otherwise returns paginated registrations
   *
   * @returns {Array} Registrations to display
   */
  const getDisplayRegistrations = () => {
    if (isSearchMode) {
      return searchResults;
    }
    return registrations;
  };

  const stats = getStats();
  const displayRegistrations = getDisplayRegistrations();

  return (
    <AdminLayout title="Registrations Management">
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Registrations Management</h2>
          <p className={styles.subtitle}>
            View and manage conference registrations and payments.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.exportButton}
            onClick={handleExport}
            disabled={isExporting || isLoading || registrations.length === 0}
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
            onClick={fetchRegistrations}
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

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>Total Registrations</div>
        </div>
        <div className={`${styles.statCard} ${styles.statConfirmed}`}>
          <div className={styles.statValue}>{stats.confirmed}</div>
          <div className={styles.statLabel}>Confirmed</div>
        </div>
        <div className={`${styles.statCard} ${styles.statPending}`}>
          <div className={styles.statValue}>{stats.pendingVerification}</div>
          <div className={styles.statLabel}>Pending Verification</div>
        </div>
        <div className={`${styles.statCard} ${styles.statUnpaid}`}>
          <div className={styles.statValue}>{stats.pendingPayment}</div>
          <div className={styles.statLabel}>Pending Payment</div>
        </div>
        <div className={`${styles.statCard} ${styles.statRevenue}`}>
          <div className={styles.statValue}>
            ₱{stats.totalRevenue.toLocaleString()}
          </div>
          <div className={styles.statLabel}>Total Revenue</div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersRow}>
        {/* Search Bar */}
        <div className={styles.searchWrapper}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search all records by code, name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className={styles.clearSearch}
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              &times;
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className={styles.filterWrapper}>
          <select
            className={styles.statusFilter}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value={REGISTRATION_STATUS.CONFIRMED}>Confirmed</option>
            <option value={REGISTRATION_STATUS.PENDING_VERIFICATION}>
              Pending Verification
            </option>
            <option value={REGISTRATION_STATUS.PENDING_PAYMENT}>
              Pending Payment
            </option>
            <option value={REGISTRATION_STATUS.CANCELLED}>Cancelled</option>
            <option value={REGISTRATION_STATUS.REFUNDED}>Refunded</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      {isSearchMode && (
        <div className={styles.resultsCount}>
          {isSearching ? (
            'Searching...'
          ) : (
            <>
              Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &quot;{searchQuery}&quot;
            </>
          )}
        </div>
      )}

      {/* Registrations Table */}
      <RegistrationsTable
        registrations={displayRegistrations}
        onViewDetails={handleViewDetails}
        onUpdateStatus={handleUpdateStatus}
        isLoading={isLoading || isSearching}
        hasMore={hasMore && !isSearchMode}
        onLoadMore={handleLoadMore}
        isLoadingMore={isLoadingMore}
        totalCount={isSearchMode ? searchResults.length : totalCount}
        loadedCount={isSearchMode ? searchResults.length : registrations.length}
      />

      {/* Registration Detail Modal */}
      <RegistrationDetailModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRegistration(null);
        }}
        registration={selectedRegistration}
        onUpdateStatus={handleUpdateStatus}
        onUpdateNotes={handleUpdateNotes}
        isUpdating={isUpdating}
      />
    </AdminLayout>
  );
}

export default AdminRegistrationsPage;
