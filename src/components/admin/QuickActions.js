/**
 * QuickActions Component
 * Displays quick action buttons for common admin tasks based on user permissions.
 *
 * @module components/admin/QuickActions
 */

import { Link } from 'react-router-dom';
import { ADMIN_ROUTES } from '../../constants';
import { useAdminAuth } from '../../context';
import styles from './QuickActions.module.css';

/**
 * Quick action items configuration with permission requirements
 */
const QUICK_ACTIONS = [
  {
    id: 'registrations',
    label: 'View Registrations',
    description: 'Manage attendee registrations',
    path: ADMIN_ROUTES.REGISTRATIONS,
    requiresPermission: 'manageRegistrations',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    color: '#06b84b',
  },
  {
    id: 'checkin',
    label: 'Check-In',
    description: 'Scan and check in attendees',
    path: ADMIN_ROUTES.CHECKIN,
    requiresPermission: 'manageCheckIn',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    color: '#10b981',
  },
  {
    id: 'speakers',
    label: 'Manage Speakers',
    description: 'Add or edit speakers',
    path: ADMIN_ROUTES.SPEAKERS,
    requiresPermission: 'manageSpeakers',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    ),
    color: '#3b82f6',
  },
  {
    id: 'schedule',
    label: 'Edit Schedule',
    description: 'Update conference sessions',
    path: ADMIN_ROUTES.SCHEDULE,
    requiresPermission: 'manageSchedule',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    color: '#f59e0b',
  },
  {
    id: 'finance',
    label: 'Finance Dashboard',
    description: 'View payments and invoices',
    path: ADMIN_ROUTES.FINANCE_DASHBOARD,
    requiresPermission: 'manageFinance',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    color: '#059669',
  },
  {
    id: 'settings',
    label: 'Site Settings',
    description: 'Configure site content',
    path: ADMIN_ROUTES.SETTINGS,
    requiresPermission: 'manageContent',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    color: '#8b5cf6',
  },
];

/**
 * QuickActions Component
 * Displays role-specific quick actions based on user permissions.
 *
 * @returns {JSX.Element|null} The quick actions component or null if no actions available
 */
function QuickActions() {
  const { checkPermission } = useAdminAuth();

  /**
   * Filters actions based on user permissions
   *
   * @param {Object} action - Action configuration
   * @returns {boolean} Whether user has permission for this action
   */
  const hasActionPermission = (action) => {
    if (!action.requiresPermission) {
      return true;
    }
    return checkPermission(action.requiresPermission);
  };

  const visibleActions = QUICK_ACTIONS.filter(hasActionPermission);

  if (visibleActions.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Quick Actions</h3>
      <div className={styles.grid}>
        {visibleActions.map((action) => (
          <Link
            key={action.id}
            to={action.path}
            className={styles.action}
            style={{ '--action-color': action.color }}
          >
            <div className={styles.iconWrapper}>
              {action.icon}
            </div>
            <div className={styles.content}>
              <span className={styles.label}>{action.label}</span>
              <span className={styles.description}>{action.description}</span>
            </div>
            <div className={styles.arrow}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default QuickActions;
