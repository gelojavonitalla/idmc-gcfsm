/**
 * ActivityLogTable Component
 * Displays a filterable table of activity logs.
 *
 * @module components/admin/ActivityLogTable
 */

import PropTypes from 'prop-types';
import { ACTIVITY_TYPE_LABELS, ACTIVITY_TYPES, ENTITY_TYPES } from '../../services';
import styles from './ActivityLogTable.module.css';

/**
 * ActivityLogTable Component
 *
 * @param {Object} props - Component props
 * @param {Array} props.logs - Array of activity log entries
 * @param {boolean} props.isLoading - Loading state
 * @param {boolean} props.hasMore - Whether there are more logs to load
 * @param {Function} props.onLoadMore - Callback to load more logs
 * @param {Object} props.filters - Current filter values
 * @param {Function} props.onFilterChange - Callback when filters change
 * @returns {JSX.Element} The activity log table
 */
function ActivityLogTable({
  logs,
  isLoading,
  hasMore,
  onLoadMore,
  filters,
  onFilterChange,
}) {
  /**
   * Formats timestamp for display
   *
   * @param {Object|string} timestamp - Firestore timestamp or string
   * @returns {string} Formatted date and time
   */
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Gets icon for activity type
   *
   * @param {string} type - Activity type
   * @returns {JSX.Element} SVG icon
   */
  const getActivityIcon = (type) => {
    switch (type) {
      case ACTIVITY_TYPES.LOGIN:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
        );
      case ACTIVITY_TYPES.LOGOUT:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        );
      case ACTIVITY_TYPES.CREATE:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        );
      case ACTIVITY_TYPES.UPDATE:
      case ACTIVITY_TYPES.SETTINGS:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        );
      case ACTIVITY_TYPES.DELETE:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        );
      case ACTIVITY_TYPES.APPROVE:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        );
      case ACTIVITY_TYPES.REJECT:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        );
      case ACTIVITY_TYPES.CHECKIN:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        );
      case ACTIVITY_TYPES.EXPORT:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
          </svg>
        );
    }
  };

  /**
   * Gets color class for activity type
   *
   * @param {string} type - Activity type
   * @returns {string} CSS class name
   */
  const getActivityColor = (type) => {
    switch (type) {
      case ACTIVITY_TYPES.LOGIN:
      case ACTIVITY_TYPES.LOGOUT:
        return styles.activityAuth;
      case ACTIVITY_TYPES.CREATE:
        return styles.activityCreate;
      case ACTIVITY_TYPES.UPDATE:
      case ACTIVITY_TYPES.SETTINGS:
        return styles.activityUpdate;
      case ACTIVITY_TYPES.DELETE:
      case ACTIVITY_TYPES.REJECT:
        return styles.activityDelete;
      case ACTIVITY_TYPES.APPROVE:
      case ACTIVITY_TYPES.CHECKIN:
        return styles.activityApprove;
      case ACTIVITY_TYPES.EXPORT:
        return styles.activityExport;
      default:
        return styles.activityDefault;
    }
  };

  if (isLoading && logs.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.filters}>
          <div className={styles.skeleton} style={{ width: '150px', height: '36px' }} />
          <div className={styles.skeleton} style={{ width: '150px', height: '36px' }} />
        </div>
        <div className={styles.skeleton} style={{ height: '400px' }} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label htmlFor="type-filter" className={styles.filterLabel}>
            Activity Type
          </label>
          <select
            id="type-filter"
            className={styles.filterSelect}
            value={filters.type || ''}
            onChange={(e) => onFilterChange({ ...filters, type: e.target.value || null })}
          >
            <option value="">All Types</option>
            {Object.entries(ACTIVITY_TYPES).map(([key, value]) => (
              <option key={key} value={value}>
                {ACTIVITY_TYPE_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label htmlFor="entity-filter" className={styles.filterLabel}>
            Entity Type
          </label>
          <select
            id="entity-filter"
            className={styles.filterSelect}
            value={filters.entityType || ''}
            onChange={(e) => onFilterChange({ ...filters, entityType: e.target.value || null })}
          >
            <option value="">All Entities</option>
            {Object.entries(ENTITY_TYPES).map(([key, value]) => (
              <option key={key} value={value}>
                {key.charAt(0) + key.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Activity Log List */}
      <div className={styles.logList}>
        {logs.length === 0 ? (
          <div className={styles.emptyState}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <p>No activity logs found</p>
          </div>
        ) : (
          <>
            {logs.map((log) => (
              <div key={log.id} className={styles.logEntry}>
                <div className={`${styles.logIcon} ${getActivityColor(log.type)}`}>
                  {getActivityIcon(log.type)}
                </div>
                <div className={styles.logContent}>
                  <div className={styles.logHeader}>
                    <span className={styles.logAction}>
                      {ACTIVITY_TYPE_LABELS[log.type] || log.type}
                    </span>
                    {log.entityType && (
                      <span className={styles.logEntity}>
                        {log.entityType}
                      </span>
                    )}
                  </div>
                  <p className={styles.logDescription}>{log.description}</p>
                  <div className={styles.logMeta}>
                    <span className={styles.logAdmin}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      {log.adminEmail}
                    </span>
                    <span className={styles.logTime}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {formatTimestamp(log.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className={styles.loadMore}>
                <button
                  className={styles.loadMoreButton}
                  onClick={onLoadMore}
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

ActivityLogTable.propTypes = {
  logs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      entityType: PropTypes.string,
      entityId: PropTypes.string,
      description: PropTypes.string.isRequired,
      adminEmail: PropTypes.string,
      createdAt: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    })
  ),
  isLoading: PropTypes.bool,
  hasMore: PropTypes.bool,
  onLoadMore: PropTypes.func.isRequired,
  filters: PropTypes.shape({
    type: PropTypes.string,
    entityType: PropTypes.string,
    adminId: PropTypes.string,
  }),
  onFilterChange: PropTypes.func.isRequired,
};

ActivityLogTable.defaultProps = {
  logs: [],
  isLoading: false,
  hasMore: false,
  filters: {},
};

export default ActivityLogTable;
