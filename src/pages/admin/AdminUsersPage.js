/**
 * AdminUsersPage Component
 * User management page for super admins.
 *
 * @module pages/admin/AdminUsersPage
 */

import { useState, useEffect, useCallback } from 'react';
import {
  AdminLayout,
  UserTable,
  InviteUserModal,
} from '../../components/admin';
import { useAdminAuth } from '../../context';
import {
  getAllAdmins,
  createAdmin,
  updateAdminRole,
  activateAdmin,
  deactivateAdmin,
} from '../../services';
import styles from './AdminUsersPage.module.css';

/**
 * AdminUsersPage Component
 *
 * @returns {JSX.Element} The admin users page
 */
function AdminUsersPage() {
  const { user, admin } = useAdminAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  /**
   * Fetches all admin users
   */
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const admins = await getAllAdmins();
      setUsers(admins);
    } catch (fetchError) {
      console.error('Failed to fetch users:', fetchError);
      setError('Failed to load users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch users on mount
   */
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /**
   * Handles inviting a new user
   *
   * @param {Object} userData - User data from invite form
   */
  const handleInviteUser = async (userData) => {
    // Generate a temporary ID (in production, this would be handled by Firebase Auth)
    const tempId = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await createAdmin(tempId, userData, user?.uid);

    // Refresh the user list
    await fetchUsers();
  };

  /**
   * Handles updating a user's role
   *
   * @param {string} userId - User ID
   * @param {string} newRole - New role
   */
  const handleUpdateRole = async (userId, newRole) => {
    try {
      await updateAdminRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      console.error('Failed to update role:', err);
      setError('Failed to update user role. Please try again.');
    }
  };

  /**
   * Handles toggling a user's status
   *
   * @param {string} userId - User ID
   * @param {string} action - 'activate' or 'deactivate'
   */
  const handleToggleStatus = async (userId, action) => {
    try {
      if (action === 'activate') {
        await activateAdmin(userId);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: 'active' } : u))
        );
      } else {
        await deactivateAdmin(userId);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: 'inactive' } : u))
        );
      }
    } catch (err) {
      console.error(`Failed to ${action} user:`, err);
      setError(`Failed to ${action} user. Please try again.`);
    }
  };

  /**
   * Gets user statistics
   */
  const getStats = () => {
    const total = users.length;
    const active = users.filter((u) => u.status === 'active').length;
    const pending = users.filter((u) => u.status === 'pending').length;
    const inactive = users.filter((u) => u.status === 'inactive').length;

    return { total, active, pending, inactive };
  };

  const stats = getStats();

  return (
    <AdminLayout title="User Management">
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>User Management</h2>
          <p className={styles.subtitle}>
            Manage admin users and their permissions.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.refreshButton}
            onClick={fetchUsers}
            disabled={isLoading}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            className={styles.inviteButton}
            onClick={() => setIsInviteModalOpen(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
            Invite User
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
          <div className={styles.statLabel}>Total Users</div>
        </div>
        <div className={`${styles.statCard} ${styles.statActive}`}>
          <div className={styles.statValue}>{stats.active}</div>
          <div className={styles.statLabel}>Active</div>
        </div>
        <div className={`${styles.statCard} ${styles.statPending}`}>
          <div className={styles.statValue}>{stats.pending}</div>
          <div className={styles.statLabel}>Pending</div>
        </div>
        <div className={`${styles.statCard} ${styles.statInactive}`}>
          <div className={styles.statValue}>{stats.inactive}</div>
          <div className={styles.statLabel}>Inactive</div>
        </div>
      </div>

      {/* User Table */}
      <UserTable
        users={users}
        onUpdateRole={handleUpdateRole}
        onToggleStatus={handleToggleStatus}
        currentUserId={admin?.id}
        isLoading={isLoading}
      />

      {/* Invite Modal */}
      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={handleInviteUser}
      />
    </AdminLayout>
  );
}

export default AdminUsersPage;
