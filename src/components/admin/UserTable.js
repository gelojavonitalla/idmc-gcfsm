/**
 * UserTable Component
 * Displays a table of admin users with actions.
 *
 * @module components/admin/UserTable
 */

import PropTypes from 'prop-types';
import { ADMIN_ROLE_LABELS, ADMIN_ROLES } from '../../constants';
import styles from './UserTable.module.css';

/**
 * UserTable Component
 *
 * @param {Object} props - Component props
 * @param {Array} props.users - Array of user objects
 * @param {Function} props.onUpdateRole - Callback to update user role
 * @param {Function} props.onToggleStatus - Callback to toggle user status
 * @param {Function} props.onResendInvitation - Callback to resend invitation email
 * @param {string} props.currentUserId - Current logged-in user ID
 * @param {boolean} props.isLoading - Loading state
 * @returns {JSX.Element} The user table
 */
function UserTable({ users, onUpdateRole, onToggleStatus, onResendInvitation, currentUserId, isLoading }) {
  /**
   * Formats date for display
   *
   * @param {Object|string} timestamp - Firestore timestamp or string
   * @returns {string} Formatted date
   */
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  /**
   * Gets status badge class
   *
   * @param {string} status - User status
   * @returns {string} Badge class name
   */
  const getStatusClass = (status) => {
    switch (status) {
      case 'active':
        return styles.statusActive;
      case 'pending':
        return styles.statusPending;
      case 'inactive':
        return styles.statusInactive;
      default:
        return styles.statusDefault;
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.skeleton} />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <p>No users found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isCurrentUser = user.id === currentUserId;
              const isSuperAdmin = user.role === ADMIN_ROLES.SUPERADMIN;

              return (
                <tr key={user.id}>
                  <td>
                    <div className={styles.userInfo}>
                      <div className={styles.avatar}>
                        {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className={styles.userDetails}>
                        <span className={styles.userName}>
                          {user.displayName || 'Unnamed User'}
                          {isCurrentUser && <span className={styles.youBadge}>You</span>}
                        </span>
                        <span className={styles.userEmail}>{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <select
                      className={styles.roleSelect}
                      value={user.role}
                      onChange={(e) => onUpdateRole(user.id, e.target.value)}
                      disabled={isCurrentUser || isSuperAdmin}
                      aria-label="Change role"
                    >
                      {Object.entries(ADMIN_ROLES).map(([key, value]) => (
                        <option key={key} value={value}>
                          {ADMIN_ROLE_LABELS[value]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusClass(user.status)}`}>
                      {user.status || 'unknown'}
                    </span>
                  </td>
                  <td className={styles.dateCell}>
                    {formatDate(user.lastLoginAt)}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      {user.status === 'pending' && onResendInvitation && (
                        <button
                          className={`${styles.actionButton} ${styles.resendButton}`}
                          onClick={() => onResendInvitation(user.id)}
                          title="Resend invitation email"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                          </svg>
                        </button>
                      )}
                      {user.status === 'active' ? (
                        <button
                          className={styles.actionButton}
                          onClick={() => onToggleStatus(user.id, 'deactivate')}
                          disabled={isCurrentUser || isSuperAdmin}
                          title="Deactivate user"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                            <line x1="12" y1="2" x2="12" y2="12" />
                          </svg>
                        </button>
                      ) : user.status !== 'pending' && (
                        <button
                          className={`${styles.actionButton} ${styles.activateButton}`}
                          onClick={() => onToggleStatus(user.id, 'activate')}
                          disabled={isCurrentUser}
                          title="Activate user"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

UserTable.propTypes = {
  users: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
      displayName: PropTypes.string,
      role: PropTypes.string.isRequired,
      status: PropTypes.string,
      lastLoginAt: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    })
  ),
  onUpdateRole: PropTypes.func.isRequired,
  onToggleStatus: PropTypes.func.isRequired,
  onResendInvitation: PropTypes.func,
  currentUserId: PropTypes.string,
  isLoading: PropTypes.bool,
};

UserTable.defaultProps = {
  users: [],
  onResendInvitation: null,
  currentUserId: null,
  isLoading: false,
};

export default UserTable;
