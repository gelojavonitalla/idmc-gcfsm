/**
 * ProtectedRoute Component
 * Restricts access to routes based on user authentication and role.
 *
 * @module components/auth/ProtectedRoute
 */

import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../../context';
import { ROUTES } from '../../constants';
import LoginForm from './LoginForm';
import styles from './ProtectedRoute.module.css';

/**
 * ProtectedRoute Component
 * Wraps routes that require authentication and optional role checking.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Protected content to render
 * @param {Array<string>} [props.allowedRoles] - Array of roles that can access this route
 * @param {string} [props.redirectTo] - Path to redirect if unauthorized
 * @returns {JSX.Element} Protected content, login form, or redirect
 */
function ProtectedRoute({ children, allowedRoles, redirectTo = ROUTES.HOME }) {
  const { isAuthenticated, user, hasRole } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <div className={styles.container}>
        <div className={styles.loginWrapper}>
          <h1 className={styles.title}>IDMC Team Access</h1>
          <p className={styles.subtitle}>
            Please sign in to access the maintenance area
          </p>
          <LoginForm redirectTo={location.pathname} />
        </div>
      </div>
    );
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return (
      <div className={styles.container}>
        <div className={styles.unauthorized}>
          <h1 className={styles.title}>Access Denied</h1>
          <p className={styles.message}>
            Your role ({user?.roleLabel}) does not have permission to access this
            page.
          </p>
          <p className={styles.submessage}>
            This area is restricted to IDMC team members only.
          </p>
          <Navigate to={redirectTo} replace state={{ from: location }} />
        </div>
      </div>
    );
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
  redirectTo: PropTypes.string,
};

export default ProtectedRoute;
