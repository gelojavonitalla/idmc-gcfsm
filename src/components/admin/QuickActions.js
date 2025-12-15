/**
 * QuickActions Component
 * Displays quick action buttons for common admin tasks.
 *
 * @module components/admin/QuickActions
 */

import { Link } from 'react-router-dom';
import { ADMIN_ROUTES } from '../../constants';
import styles from './QuickActions.module.css';

/**
 * Quick action items configuration
 */
const QUICK_ACTIONS = [
  {
    id: 'registrations',
    label: 'View Registrations',
    description: 'Manage attendee registrations',
    path: ADMIN_ROUTES.REGISTRATIONS,
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
    id: 'speakers',
    label: 'Manage Speakers',
    description: 'Add or edit speakers',
    path: ADMIN_ROUTES.SPEAKERS,
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
    id: 'settings',
    label: 'Conference Settings',
    description: 'Configure event details',
    path: ADMIN_ROUTES.SETTINGS,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    color: '#8b5cf6',
  },
];

/**
 * QuickActions Component
 *
 * @returns {JSX.Element} The quick actions component
 */
function QuickActions() {
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Quick Actions</h3>
      <div className={styles.grid}>
        {QUICK_ACTIONS.map((action) => (
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
