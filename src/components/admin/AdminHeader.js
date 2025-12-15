/**
 * AdminHeader Component
 * Top header bar for the admin dashboard.
 *
 * @module components/admin/AdminHeader
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAdminAuth } from '../../context';
import { ADMIN_ROUTES, ADMIN_ROLE_LABELS } from '../../constants';
import styles from './AdminHeader.module.css';

/**
 * AdminHeader Component
 *
 * @param {Object} props - Component props
 * @param {Function} props.onMenuClick - Callback when menu button is clicked (mobile)
 * @param {string} props.title - Page title to display
 * @returns {JSX.Element} The admin header component
 */
function AdminHeader({ onMenuClick, title }) {
  const { admin, signOut } = useAdminAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  /**
   * Handle click outside dropdown to close it
   */
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Handles user sign out
   */
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate(ADMIN_ROUTES.LOGIN);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <header className={styles.header}>
      {/* Mobile menu button */}
      <button
        className={styles.menuButton}
        onClick={onMenuClick}
        aria-label="Toggle navigation menu"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Page title */}
      <h1 className={styles.title}>{title}</h1>

      {/* Right side actions */}
      <div className={styles.actions}>
        {/* User dropdown */}
        <div className={styles.dropdown} ref={dropdownRef}>
          <button
            className={styles.userButton}
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <div className={styles.userAvatar}>
              {admin?.displayName?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{admin?.displayName || 'Admin'}</span>
              <span className={styles.userRole}>
                {ADMIN_ROLE_LABELS[admin?.role] || 'Admin'}
              </span>
            </div>
            <svg
              className={`${styles.chevron} ${dropdownOpen ? styles.chevronOpen : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className={styles.dropdownMenu}>
              <div className={styles.dropdownHeader}>
                <span className={styles.dropdownEmail}>{admin?.email}</span>
              </div>
              <div className={styles.dropdownDivider} />
              <button
                className={styles.dropdownItem}
                onClick={() => {
                  setDropdownOpen(false);
                  navigate(ADMIN_ROUTES.SETTINGS);
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                Settings
              </button>
              <button className={`${styles.dropdownItem} ${styles.signOut}`} onClick={handleSignOut}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

AdminHeader.propTypes = {
  onMenuClick: PropTypes.func,
  title: PropTypes.string,
};

AdminHeader.defaultProps = {
  onMenuClick: () => {},
  title: 'Dashboard',
};

export default AdminHeader;
