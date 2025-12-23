/**
 * AdminLayout Component
 * Main layout wrapper for admin dashboard pages.
 *
 * @module components/admin/AdminLayout
 */

import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { ADMIN_NAV_GROUPS } from '../../constants';
import styles from './AdminLayout.module.css';

/**
 * Gets the menu category label for the current path
 *
 * @param {string} pathname - Current URL pathname
 * @returns {string} The category label (e.g., "Content", "Operations")
 */
function getMenuCategory(pathname) {
  for (const group of ADMIN_NAV_GROUPS) {
    for (const item of group.items) {
      if (pathname === item.path || pathname.startsWith(`${item.path}/`)) {
        return group.label;
      }
    }
  }
  return 'Main';
}

/**
 * AdminLayout Component
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Page content
 * @returns {JSX.Element} The admin layout component
 */
function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const menuCategory = getMenuCategory(location.pathname);

  /**
   * Toggles sidebar visibility on mobile
   */
  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  /**
   * Closes sidebar (for mobile after navigation)
   */
  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className={styles.layout}>
      <AdminSidebar isOpen={sidebarOpen} onClose={handleCloseSidebar} />
      <div className={styles.main}>
        <AdminHeader onMenuClick={handleMenuClick} title={menuCategory} />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}

AdminLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AdminLayout;
