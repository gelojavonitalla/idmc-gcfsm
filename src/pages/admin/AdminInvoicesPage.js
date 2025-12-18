/**
 * AdminInvoicesPage Component
 * Invoice request management page for finance admins.
 *
 * @module pages/admin/AdminInvoicesPage
 */

import { useState, useEffect, useCallback } from 'react';
import {
  AdminLayout,
  InvoicesTable,
  InvoiceDetailModal,
} from '../../components/admin';
import {
  getInvoiceRequests,
  getInvoiceRequestCounts,
  searchInvoiceRequests,
} from '../../services';
import { INVOICE_STATUS, INVOICE_STATUS_LABELS } from '../../constants';
import styles from './AdminInvoicesPage.module.css';

/**
 * AdminInvoicesPage Component
 *
 * @returns {JSX.Element} The admin invoices page
 */
function AdminInvoicesPage() {
  const [invoiceRequests, setInvoiceRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [statusCounts, setStatusCounts] = useState({
    total: 0,
    pending: 0,
    uploaded: 0,
    sent: 0,
    failed: 0,
  });

  /**
   * Fetches status counts from the database
   */
  const fetchStatusCounts = useCallback(async () => {
    try {
      const counts = await getInvoiceRequestCounts();
      setStatusCounts(counts);
    } catch (err) {
      console.error('Failed to fetch status counts:', err);
    }
  }, []);

  /**
   * Fetches invoice requests
   */
  const fetchInvoiceRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getInvoiceRequests({
        status: statusFilter === 'all' ? null : statusFilter,
        confirmedOnly: true,
        limit: 50,
      });

      setInvoiceRequests(result);

      // Fetch status counts
      fetchStatusCounts();
    } catch (fetchError) {
      console.error('Failed to fetch invoice requests:', fetchError);
      setError('Failed to load invoice requests. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, fetchStatusCounts]);

  /**
   * Fetch invoice requests on mount and when status filter changes
   */
  useEffect(() => {
    if (!isSearchMode) {
      fetchInvoiceRequests();
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

    // Minimum 3 characters to search
    if (trimmedQuery.length < 3) {
      return;
    }

    // Debounce the search
    const debounceTimer = setTimeout(async () => {
      setIsSearchMode(true);
      setIsSearching(true);
      setError(null);

      try {
        const results = await searchInvoiceRequests(trimmedQuery);
        setSearchResults(results);
      } catch (searchError) {
        console.error('Search failed:', searchError);
        setError('Search failed. Please try again.');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    // Cleanup function
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  /**
   * Handles viewing invoice request details
   *
   * @param {Object} registration - Registration to view
   */
  const handleViewDetails = (registration) => {
    setSelectedRegistration(registration);
    setIsModalOpen(true);
  };

  /**
   * Handles invoice update
   */
  const handleInvoiceUpdated = () => {
    // Refresh the list
    if (isSearchMode) {
      searchInvoiceRequests(searchQuery.trim())
        .then((results) => setSearchResults(results))
        .catch((err) => console.error('Failed to refresh search results:', err));
    } else {
      fetchInvoiceRequests();
    }
  };

  const displayData = isSearchMode ? searchResults : invoiceRequests;
  const showLoading = isLoading || isSearching;

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <h1>Invoice Requests</h1>
            <p className={styles.subtitle}>
              Manage invoice requests and delivery for confirmed registrations
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{statusCounts.total}</div>
            <div className={styles.statLabel}>Total Requests</div>
          </div>
          <div className={`${styles.statCard} ${styles.statPending}`}>
            <div className={styles.statValue}>{statusCounts.pending}</div>
            <div className={styles.statLabel}>Pending</div>
          </div>
          <div className={`${styles.statCard} ${styles.statUploaded}`}>
            <div className={styles.statValue}>{statusCounts.uploaded}</div>
            <div className={styles.statLabel}>Uploaded</div>
          </div>
          <div className={`${styles.statCard} ${styles.statSent}`}>
            <div className={styles.statValue}>{statusCounts.sent}</div>
            <div className={styles.statLabel}>Sent</div>
          </div>
          <div className={`${styles.statCard} ${styles.statFailed}`}>
            <div className={styles.statValue}>{statusCounts.failed}</div>
            <div className={styles.statLabel}>Failed</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className={styles.controlsBar}>
          <div className={styles.filters}>
            <label htmlFor="status-filter" className={styles.filterLabel}>
              Filter by Status:
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Statuses</option>
              <option value={INVOICE_STATUS.PENDING}>
                {INVOICE_STATUS_LABELS[INVOICE_STATUS.PENDING]}
              </option>
              <option value={INVOICE_STATUS.UPLOADED}>
                {INVOICE_STATUS_LABELS[INVOICE_STATUS.UPLOADED]}
              </option>
              <option value={INVOICE_STATUS.SENT}>
                {INVOICE_STATUS_LABELS[INVOICE_STATUS.SENT]}
              </option>
              <option value={INVOICE_STATUS.FAILED}>
                {INVOICE_STATUS_LABELS[INVOICE_STATUS.FAILED]}
              </option>
            </select>
          </div>

          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search by Reg ID, name, email, TIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {isSearchMode && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchMode(false);
                }}
                className={styles.clearSearchButton}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className={styles.errorMessage}>
            <p>{error}</p>
          </div>
        )}

        {/* Search Results Info */}
        {isSearchMode && !isSearching && (
          <div className={styles.searchInfo}>
            <p>
              Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &quot;{searchQuery}&quot;
            </p>
          </div>
        )}

        {/* Invoices Table */}
        <InvoicesTable
          registrations={displayData}
          onViewDetails={handleViewDetails}
          isLoading={showLoading}
        />

        {/* Invoice Detail Modal */}
        {isModalOpen && (
          <InvoiceDetailModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            registration={selectedRegistration}
            onInvoiceUpdated={handleInvoiceUpdated}
          />
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminInvoicesPage;
