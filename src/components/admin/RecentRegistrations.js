/**
 * RecentRegistrations Component
 * Displays a table of recent registrations.
 *
 * @module components/admin/RecentRegistrations
 */

import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  ADMIN_ROUTES,
  REGISTRATION_STATUS,
  REGISTRATION_STATUS_LABELS,
} from '../../constants';
import styles from './RecentRegistrations.module.css';

/**
 * Status badge colors
 */
const STATUS_STYLES = {
  [REGISTRATION_STATUS.CONFIRMED]: {
    background: 'rgba(16, 185, 129, 0.1)',
    color: '#10b981',
    label: REGISTRATION_STATUS_LABELS[REGISTRATION_STATUS.CONFIRMED],
  },
  [REGISTRATION_STATUS.PENDING_VERIFICATION]: {
    background: 'rgba(245, 158, 11, 0.1)',
    color: '#f59e0b',
    label: REGISTRATION_STATUS_LABELS[REGISTRATION_STATUS.PENDING_VERIFICATION],
  },
  [REGISTRATION_STATUS.PENDING_PAYMENT]: {
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    label: REGISTRATION_STATUS_LABELS[REGISTRATION_STATUS.PENDING_PAYMENT],
  },
  [REGISTRATION_STATUS.CANCELLED]: {
    background: 'rgba(107, 114, 128, 0.1)',
    color: '#6b7280',
    label: REGISTRATION_STATUS_LABELS[REGISTRATION_STATUS.CANCELLED],
  },
  [REGISTRATION_STATUS.REFUNDED]: {
    background: 'rgba(139, 92, 246, 0.1)',
    color: '#8b5cf6',
    label: REGISTRATION_STATUS_LABELS[REGISTRATION_STATUS.REFUNDED],
  },
};

/**
 * Formats a date for display
 *
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  if (!date) {
    return '—';
  }

  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) {
    return '—';
  }

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * RecentRegistrations Component
 *
 * @param {Object} props - Component props
 * @param {Array} props.registrations - Array of registration objects
 * @param {boolean} [props.isLoading] - Loading state
 * @param {number} [props.limit] - Number of items to show
 * @returns {JSX.Element} The recent registrations component
 */
function RecentRegistrations({ registrations = [], isLoading = false, limit = 10 }) {
  const displayRegistrations = registrations.slice(0, limit);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Recent Registrations</h3>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td><div className={styles.skeleton} style={{ width: '120px' }} /></td>
                  <td><div className={styles.skeleton} style={{ width: '160px' }} /></td>
                  <td><div className={styles.skeleton} style={{ width: '80px' }} /></td>
                  <td><div className={styles.skeleton} style={{ width: '100px' }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Recent Registrations</h3>
        <Link to={ADMIN_ROUTES.REGISTRATIONS} className={styles.viewAll}>
          View All →
        </Link>
      </div>

      {displayRegistrations.length === 0 ? (
        <div className={styles.empty}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <p>No registrations yet</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {displayRegistrations.map((registration) => {
                const statusStyle = STATUS_STYLES[registration.status] || STATUS_STYLES[REGISTRATION_STATUS.PENDING_PAYMENT];
                return (
                  <tr key={registration.id}>
                    <td className={styles.nameCell}>
                      {registration.primaryAttendee?.firstName || registration.firstName || 'N/A'}{' '}
                      {registration.primaryAttendee?.lastName || registration.lastName || ''}
                    </td>
                    <td className={styles.emailCell}>
                      {registration.primaryAttendee?.email || registration.email || 'N/A'}
                    </td>
                    <td>
                      <span
                        className={styles.statusBadge}
                        style={{
                          backgroundColor: statusStyle.background,
                          color: statusStyle.color,
                        }}
                      >
                        {statusStyle.label}
                      </span>
                    </td>
                    <td className={styles.dateCell}>
                      {formatDate(registration.createdAt?.toDate?.() || registration.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

RecentRegistrations.propTypes = {
  registrations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      primaryAttendee: PropTypes.shape({
        firstName: PropTypes.string,
        lastName: PropTypes.string,
        email: PropTypes.string,
      }),
      firstName: PropTypes.string,
      lastName: PropTypes.string,
      email: PropTypes.string,
      status: PropTypes.string,
      createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    })
  ),
  isLoading: PropTypes.bool,
  limit: PropTypes.number,
};

export default RecentRegistrations;
