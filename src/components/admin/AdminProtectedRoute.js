/**
 * AdminProtectedRoute Component
 * Protects admin routes based on authentication and role.
 *
 * @module components/admin/AdminProtectedRoute
 */

import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAdminAuth } from '../../context';
import { ADMIN_ROUTES } from '../../constants';
import styles from './AdminProtectedRoute.module.css';

/**
 * AdminProtectedRoute Component
 * Wraps routes that require admin authentication.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Protected content to render
 * @param {string|Array<string>} [props.requiredRole] - Required role(s) to access
 * @param {string} [props.requiredPermission] - Required permission to access
 * @param {string} [props.volunteerRedirect] - Path to redirect volunteers to
 * @returns {JSX.Element} Protected content, loading state, or redirect
 */
function AdminProtectedRoute({ children, requiredRole, requiredPermission, volunteerRedirect }) {
  const { isAuthenticated, isLoading, hasRole, checkPermission, isVolunteer } = useAdminAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ADMIN_ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Redirect volunteers to specified path if volunteerRedirect is set
  if (volunteerRedirect && isVolunteer) {
    return <Navigate to={volunteerRedirect} replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className={styles.unauthorized}>
        <div className={styles.icon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className={styles.title}>Access Denied</h1>
        <p className={styles.message}>
          You don&apos;t have permission to access this page.
        </p>
        <p className={styles.submessage}>
          This page requires {Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole} access.
        </p>
        <a href={ADMIN_ROUTES.DASHBOARD} className={styles.link}>
          Return to Dashboard
        </a>
      </div>
    );
  }

  if (requiredPermission && !checkPermission(requiredPermission)) {
    return (
      <div className={styles.unauthorized}>
        <div className={styles.icon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className={styles.title}>Access Denied</h1>
        <p className={styles.message}>
          You don&apos;t have the required permission for this action.
        </p>
        <a href={ADMIN_ROUTES.DASHBOARD} className={styles.link}>
          Return to Dashboard
        </a>
      </div>
    );
  }

  return children;
}

AdminProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredRole: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  requiredPermission: PropTypes.string,
  volunteerRedirect: PropTypes.string,
};

AdminProtectedRoute.defaultProps = {
  requiredRole: null,
  requiredPermission: null,
  volunteerRedirect: null,
};

export default AdminProtectedRoute;
