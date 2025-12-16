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
  getAllRegistrations,
  updateRegistration,
} from '../../services/maintenance';
import { REGISTRATION_STATUS } from '../../constants';
import styles from './AdminRegistrationsPage.module.css';

/**
 * AdminRegistrationsPage Component
 *
 * @returns {JSX.Element} The admin registrations page
 */
function AdminRegistrationsPage() {
  const [registrations, setRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  /**
   * Fetches all registrations
   */
  const fetchRegistrations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getAllRegistrations();
      setRegistrations(data);
    } catch (fetchError) {
      console.error('Failed to fetch registrations:', fetchError);
      setError('Failed to load registrations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch registrations on mount
   */
  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

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
   * Gets registration statistics
   *
   * @returns {Object} Statistics object
   */
  const getStats = () => {
    const total = registrations.length;
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

    // Calculate total revenue from confirmed registrations
    const totalRevenue = registrations
      .filter((r) => r.status === REGISTRATION_STATUS.CONFIRMED)
      .reduce((sum, r) => sum + (r.totalAmount || 0), 0);

    return { total, confirmed, pendingVerification, pendingPayment, cancelled, totalRevenue };
  };

  /**
   * Filters registrations based on search query and status filter
   *
   * @returns {Array} Filtered registrations
   */
  const getFilteredRegistrations = () => {
    return registrations.filter((registration) => {
      // Status filter
      if (statusFilter !== 'all' && registration.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const name =
          `${registration.primaryAttendee?.firstName || registration.firstName || ''} ${registration.primaryAttendee?.lastName || registration.lastName || ''}`.toLowerCase();
        const email = (
          registration.primaryAttendee?.email ||
          registration.email ||
          ''
        ).toLowerCase();
        const id = (registration.id || '').toLowerCase();

        return (
          name.includes(query) || email.includes(query) || id.includes(query)
        );
      }

      return true;
    });
  };

  const stats = getStats();
  const filteredRegistrations = getFilteredRegistrations();

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
            placeholder="Search by name, email, or registration ID..."
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
      {(searchQuery || statusFilter !== 'all') && (
        <div className={styles.resultsCount}>
          Showing {filteredRegistrations.length} of {registrations.length}{' '}
          registrations
        </div>
      )}

      {/* Registrations Table */}
      <RegistrationsTable
        registrations={filteredRegistrations}
        onViewDetails={handleViewDetails}
        onUpdateStatus={handleUpdateStatus}
        isLoading={isLoading}
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
        isUpdating={isUpdating}
      />
    </AdminLayout>
  );
}

export default AdminRegistrationsPage;
