/**
 * AdminWorkshopsPage Component
 * Workshop capacity dashboard for admin users.
 *
 * @module pages/admin/AdminWorkshopsPage
 */

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../../components/admin';
import { getPublishedWorkshops } from '../../services/workshops';
import {
  WORKSHOP_CATEGORY_LABELS,
  WORKSHOP_CATEGORY_COLORS,
  WORKSHOP_CATEGORIES,
  WORKSHOP_TIME_SLOT_LABELS,
} from '../../constants';
import styles from './AdminWorkshopsPage.module.css';

/**
 * AdminWorkshopsPage Component
 * Displays workshop capacity and registration statistics
 *
 * @returns {JSX.Element} The admin workshops page
 */
function AdminWorkshopsPage() {
  const [workshops, setWorkshops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetches workshop data
   */
  const fetchWorkshops = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const workshopData = await getPublishedWorkshops();
      setWorkshops(workshopData);
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
   * Calculates remaining capacity for a workshop
   *
   * @param {Object} workshop - Workshop object
   * @returns {number} Remaining capacity
   */
  const getRemainingCapacity = (workshop) => {
    if (workshop.capacity === null || workshop.capacity === undefined) {
      return Infinity;
    }
    return Math.max(0, workshop.capacity - (workshop.registeredCount || 0));
  };

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
   * Gets category colors for styling
   *
   * @param {string} category - Workshop category
   * @returns {Object} Category color object
   */
  const getCategoryColors = (category) => {
    return WORKSHOP_CATEGORY_COLORS[category] ||
      WORKSHOP_CATEGORY_COLORS[WORKSHOP_CATEGORIES.NEXT_GENERATION];
  };

  /**
   * Calculates total capacity statistics
   *
   * @returns {Object} Capacity statistics
   */
  const getCapacityStats = () => {
    const totalCapacity = workshops.reduce(
      (sum, w) => sum + (w.capacity || 0),
      0
    );
    const totalRegistered = workshops.reduce(
      (sum, w) => sum + (w.registeredCount || 0),
      0
    );
    const totalAvailable = workshops.reduce(
      (sum, w) => sum + getRemainingCapacity(w),
      0
    );
    const fullWorkshops = workshops.filter(
      (w) => getRemainingCapacity(w) === 0
    ).length;

    return {
      totalCapacity,
      totalRegistered,
      totalAvailable,
      fullWorkshops,
    };
  };

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
                <th>Workshop Title</th>
                <th>Category</th>
                <th>Time Slot</th>
                <th>Speaker(s)</th>
                <th>Venue</th>
                <th>Capacity</th>
                <th>Registered</th>
                <th>Available</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {workshops.map((workshop) => {
                const remaining = getRemainingCapacity(workshop);
                const status = getCapacityStatus(workshop);
                const fillPercentage = workshop.capacity
                  ? Math.round(((workshop.registeredCount || 0) / workshop.capacity) * 100)
                  : 0;
                const categoryColors = getCategoryColors(workshop.category);

                return (
                  <tr key={workshop.id}>
                    <td className={styles.workshopTitle}>
                      <div className={styles.titleContainer}>
                        <span>{workshop.title}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={styles.categoryBadge}
                        style={{
                          backgroundColor: categoryColors.background,
                          color: categoryColors.text,
                          borderColor: categoryColors.border,
                        }}
                      >
                        {WORKSHOP_CATEGORY_LABELS[workshop.category] || workshop.category}
                      </span>
                    </td>
                    <td>
                      <span className={styles.timeSlot}>
                        {WORKSHOP_TIME_SLOT_LABELS[workshop.timeSlot] || workshop.timeSlot}
                      </span>
                    </td>
                    <td>
                      <span className={styles.speakers}>
                        {workshop.speakerNames?.join(', ') || 'TBA'}
                      </span>
                    </td>
                    <td>
                      <span className={styles.venue}>{workshop.venue || 'TBA'}</span>
                    </td>
                    <td className={styles.number}>
                      {workshop.capacity || '∞'}
                    </td>
                    <td className={styles.number}>
                      {workshop.registeredCount || 0}
                    </td>
                    <td className={styles.number}>
                      {remaining === Infinity ? '∞' : remaining}
                    </td>
                    <td>
                      <div className={styles.statusCell}>
                        <span className={`${styles.statusBadge} ${styles[status]}`}>
                          {status === 'full' && 'Full'}
                          {status === 'limited' && 'Limited'}
                          {status === 'available' && 'Available'}
                          {status === 'unlimited' && 'Unlimited'}
                        </span>
                        {workshop.capacity && (
                          <div className={styles.progressBar}>
                            <div
                              className={styles.progressFill}
                              style={{ width: `${fillPercentage}%` }}
                            />
                          </div>
                        )}
                      </div>
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
