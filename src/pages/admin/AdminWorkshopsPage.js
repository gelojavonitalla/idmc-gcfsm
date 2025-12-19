/**
 * AdminWorkshopsPage Component
 * Workshop capacity dashboard for admin users.
 *
 * @module pages/admin/AdminWorkshopsPage
 */

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../../components/admin';
import { getPublishedWorkshops } from '../../services/workshops';
import { getVenueRooms } from '../../services/venue';
import styles from './AdminWorkshopsPage.module.css';

/**
 * AdminWorkshopsPage Component
 * Displays workshop capacity and registration statistics
 *
 * @returns {JSX.Element} The admin workshops page
 */
function AdminWorkshopsPage() {
  const [workshops, setWorkshops] = useState([]);
  const [venueRooms, setVenueRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Gets capacity for a workshop from its linked venue room.
   * Matches workshop venue name to room name (case-insensitive).
   *
   * @param {Object} workshop - Workshop object with venue field
   * @returns {number|null} Room capacity or null if no match found
   */
  const getVenueRoomCapacity = useCallback((workshop) => {
    if (!workshop.venue) {
      return null;
    }
    const venueName = workshop.venue.toLowerCase().trim();
    const matchingRoom = venueRooms.find(
      (room) => room.name && room.name.toLowerCase().trim() === venueName
    );
    return matchingRoom?.capacity ?? null;
  }, [venueRooms]);

  /**
   * Fetches workshop and venue room data
   */
  const fetchWorkshops = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [workshopData, roomsData] = await Promise.all([
        getPublishedWorkshops(),
        getVenueRooms(),
      ]);
      setWorkshops(workshopData);
      setVenueRooms(roomsData);
    } catch (fetchError) {
      console.error('Failed to fetch workshops:', fetchError);
      setError('Failed to load workshop data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch data on mount
   */
  useEffect(() => {
    fetchWorkshops();
  }, [fetchWorkshops]);

  /**
   * Calculates remaining capacity for a workshop.
   * Uses venue room capacity if available, otherwise falls back to workshop capacity.
   *
   * @param {Object} workshop - Workshop object
   * @returns {number} Remaining capacity
   */
  const getRemainingCapacity = useCallback((workshop) => {
    const roomCapacity = getVenueRoomCapacity(workshop);
    const capacity = roomCapacity ?? workshop.capacity;
    if (capacity === null || capacity === undefined) {
      return Infinity;
    }
    return Math.max(0, capacity - (workshop.registeredCount || 0));
  }, [getVenueRoomCapacity]);

  /**
   * Gets capacity status color
   *
   * @param {Object} workshop - Workshop object
   * @returns {string} Status class name
   */
  const getCapacityStatus = (workshop) => {
    const remaining = getRemainingCapacity(workshop);
    if (remaining === Infinity) return 'unlimited';
    if (remaining === 0) return 'full';
    if (remaining <= 10) return 'limited';
    return 'available';
  };

  /**
   * Gets the effective capacity for a workshop.
   * Uses venue room capacity if available, otherwise falls back to workshop capacity.
   *
   * @param {Object} workshop - Workshop object
   * @returns {number|null} Effective capacity or null if unlimited
   */
  const getEffectiveCapacity = useCallback((workshop) => {
    const roomCapacity = getVenueRoomCapacity(workshop);
    return roomCapacity ?? workshop.capacity ?? null;
  }, [getVenueRoomCapacity]);

  /**
   * Calculates total capacity statistics
   *
   * @returns {Object} Capacity statistics
   */
  const getCapacityStats = useCallback(() => {
    const totalCapacity = workshops.reduce(
      (sum, w) => sum + (getEffectiveCapacity(w) || 0),
      0
    );
    const totalRegistered = workshops.reduce(
      (sum, w) => sum + (w.registeredCount || 0),
      0
    );
    const totalAvailable = workshops.reduce((sum, w) => {
      const remaining = getRemainingCapacity(w);
      return sum + (remaining === Infinity ? 0 : remaining);
    }, 0);
    const fullWorkshops = workshops.filter(
      (w) => getRemainingCapacity(w) === 0
    ).length;

    return {
      totalCapacity,
      totalRegistered,
      totalAvailable,
      fullWorkshops,
    };
  }, [workshops, getEffectiveCapacity, getRemainingCapacity]);

  const stats = getCapacityStats();

  return (
    <AdminLayout title="Workshop Management">
      {/* Header Section */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Workshop Capacity Dashboard</h2>
          <p className={styles.subtitle}>
            Monitor workshop registrations and capacity
          </p>
        </div>
        <button
          className={styles.refreshButton}
          onClick={fetchWorkshops}
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
            ×
          </button>
        </div>
      )}

      {/* Stats Cards */}
      {!isLoading && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.totalRegistered}</div>
              <div className={styles.statLabel}>Total Registrations</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.totalCapacity}</div>
              <div className={styles.statLabel}>Total Capacity</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.totalAvailable}</div>
              <div className={styles.statLabel}>Available Spots</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.fullWorkshops}</div>
              <div className={styles.statLabel}>Full Workshops</div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading workshops...</p>
        </div>
      )}

      {/* Workshops Table */}
      {!isLoading && workshops.length > 0 && (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Venue</th>
                <th>Capacity</th>
                <th>Registered</th>
                <th>Available</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {workshops.map((workshop) => {
                const capacity = getEffectiveCapacity(workshop);
                const remaining = getRemainingCapacity(workshop);
                const status = getCapacityStatus(workshop);

                return (
                  <tr key={workshop.id}>
                    <td className={styles.workshopTitle}>
                      <div className={styles.titleContainer}>
                        <span>{workshop.title}</span>
                      </div>
                    </td>
                    <td>
                      <span className={styles.venue}>{workshop.venue || 'TBA'}</span>
                    </td>
                    <td className={styles.number}>
                      {capacity || '∞'}
                    </td>
                    <td className={styles.number}>
                      {workshop.registeredCount || 0}
                    </td>
                    <td className={styles.number}>
                      {remaining === Infinity ? '∞' : remaining}
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[status]}`}>
                        {status === 'full' && 'Full'}
                        {status === 'limited' && 'Limited'}
                        {status === 'available' && 'Available'}
                        {status === 'unlimited' && 'Unlimited'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && workshops.length === 0 && (
        <div className={styles.emptyState}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <h3>No workshops found</h3>
          <p>There are no published workshops at this time.</p>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminWorkshopsPage;
