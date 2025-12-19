/**
 * AdminSidebar Component
 * Navigation sidebar for the admin dashboard with grouped navigation.
 *
 * @module components/admin/AdminSidebar
 */

import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAdminAuth } from '../../context';
import { ADMIN_NAV_GROUPS, ADMIN_ROLE_LABELS, CONFERENCE } from '../../constants';
import styles from './AdminSidebar.module.css';

/**
 * Icon component for navigation items
 *
 * @param {Object} props - Component props
 * @param {string} props.name - Icon name
 * @returns {JSX.Element} Icon element
 */
function NavIcon({ name }) {
  const icons = {
    dashboard: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    people: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    mic: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    ),
    calendar: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    school: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
    help: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    settings: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    admin: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    history: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    checkin: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    download: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
    info: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
    church: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 21V7l-6-4-6 4v14" />
        <path d="M12 3v4" />
        <path d="M10 5h4" />
        <path d="M9 21v-4a3 3 0 0 1 6 0v4" />
        <path d="M3 21h18" />
      </svg>
    ),
    document: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    location: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    mail: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    chevronDown: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    ),
    bank: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 21h18" />
        <path d="M3 10h18" />
        <path d="M5 6l7-3 7 3" />
        <path d="M4 10v11" />
        <path d="M20 10v11" />
        <path d="M8 14v3" />
        <path d="M12 14v3" />
        <path d="M16 14v3" />
      </svg>
    ),
    dollar: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    monitor: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  };

  return <span className={styles.navIcon}>{icons[name] || icons.dashboard}</span>;
}

NavIcon.propTypes = {
  name: PropTypes.string.isRequired,
};

/**
 * AdminSidebar Component
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether sidebar is open (mobile)
 * @param {Function} props.onClose - Callback to close sidebar (mobile)
 * @returns {JSX.Element} The admin sidebar component
 */
function AdminSidebar({ isOpen, onClose }) {
  const { admin, hasRole } = useAdminAuth();
  const location = useLocation();
  const [collapsedGroups, setCollapsedGroups] = useState({});

  /**
   * Toggles a group's collapsed state
   *
   * @param {string} groupId - Group ID to toggle
   */
  const toggleGroup = (groupId) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  /**
   * Checks if a group has an active item
   *
   * @param {Array} items - Group items
   * @returns {boolean} Whether group has active item
   */
  const hasActiveItem = (items) => {
    return items.some((item) => location.pathname === item.path);
  };

  /**
   * Filters nav items based on user role
   *
   * @param {Object} item - Navigation item
   * @returns {boolean} Whether to show the item
   */
  const shouldShowNavItem = (item) => {
    if (!item.requiresRole) {
      return true;
    }
    return hasRole(item.requiresRole);
  };

  /**
   * Gets filtered items for a group
   *
   * @param {Array} items - Group items
   * @returns {Array} Filtered items
   */
  const getVisibleItems = (items) => {
    return items.filter(shouldShowNavItem);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className={styles.overlay} onClick={onClose} aria-hidden="true" />}

      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        {/* Logo/Brand */}
        <div className={styles.brand}>
          <div className={styles.logo}>IDMC</div>
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>Admin Dashboard</span>
            <span className={styles.brandYear}>{CONFERENCE.YEAR}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {ADMIN_NAV_GROUPS.map((group) => {
            const visibleItems = getVisibleItems(group.items);
            if (visibleItems.length === 0) return null;

            const isCollapsed = collapsedGroups[group.id];
            const isActive = hasActiveItem(visibleItems);

            return (
              <div key={group.id} className={styles.navGroup}>
                <button
                  className={`${styles.groupHeader} ${isActive ? styles.groupHeaderActive : ''}`}
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={!isCollapsed}
                >
                  <span className={styles.groupLabel}>{group.label}</span>
                  <span className={`${styles.groupChevron} ${isCollapsed ? styles.groupChevronCollapsed : ''}`}>
                    <NavIcon name="chevronDown" />
                  </span>
                </button>
                <ul className={`${styles.navList} ${isCollapsed ? styles.navListCollapsed : ''}`}>
                  {visibleItems.map((item) => (
                    <li key={item.path}>
                      <NavLink
                        to={item.comingSoon ? '#' : item.path}
                        className={({ isActive: linkActive }) =>
                          `${styles.navLink} ${linkActive && !item.comingSoon ? styles.navLinkActive : ''} ${item.comingSoon ? styles.navLinkDisabled : ''}`
                        }
                        onClick={(e) => {
                          if (item.comingSoon) {
                            e.preventDefault();
                          } else {
                            onClose();
                          }
                        }}
                      >
                        <NavIcon name={item.icon} />
                        <span className={styles.navLabel}>{item.label}</span>
                        {item.comingSoon && (
                          <span className={styles.comingSoonBadge}>Soon</span>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* User info at bottom */}
        <div className={styles.userSection}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {admin?.displayName?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{admin?.displayName || 'Admin'}</span>
              <span className={styles.userRole}>
                {ADMIN_ROLE_LABELS[admin?.role] || 'Admin'}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

AdminSidebar.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
};

AdminSidebar.defaultProps = {
  isOpen: false,
  onClose: () => {},
};

export default AdminSidebar;
