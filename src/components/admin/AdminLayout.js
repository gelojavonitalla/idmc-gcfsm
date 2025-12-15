/**
 * AdminLayout Component
 * Main layout wrapper for admin dashboard pages.
 *
 * @module components/admin/AdminLayout
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import styles from './AdminLayout.module.css';

/**
 * AdminLayout Component
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Page content
 * @param {string} props.title - Page title for header
 * @returns {JSX.Element} The admin layout component
 */
function AdminLayout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        <AdminHeader onMenuClick={handleMenuClick} title={title} />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}

AdminLayout.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
};

AdminLayout.defaultProps = {
  title: 'Dashboard',
};

export default AdminLayout;
