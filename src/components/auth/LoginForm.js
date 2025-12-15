/**
 * LoginForm Component
 * Provides a form for IDMC team members to sign in.
 *
 * @module components/auth/LoginForm
 */

import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context';
import { USER_ROLES, USER_ROLE_LABELS, IDMC_TEAM_ROLES } from '../../constants';
import styles from './LoginForm.module.css';

/**
 * LoginForm Component
 * Form for IDMC team member authentication.
 *
 * @param {Object} props - Component props
 * @param {string} [props.redirectTo] - Path to redirect after login
 * @returns {JSX.Element} The login form component
 */
function LoginForm({ redirectTo }) {
  const { signIn, isLoading, error } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState(USER_ROLES.ADMIN);
  const [formError, setFormError] = useState('');

  /**
   * Handles form submission
   *
   * @param {Event} event - Form submit event
   */
  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setFormError('');

      if (!email.trim()) {
        setFormError('Please enter your email address');
        return;
      }

      if (!IDMC_TEAM_ROLES.includes(role)) {
        setFormError('Only IDMC team members can access this area');
        return;
      }

      try {
        await signIn(email, role);
        if (redirectTo) {
          navigate(redirectTo);
        }
      } catch (signInError) {
        setFormError(signInError.message || 'Failed to sign in');
      }
    },
    [email, role, signIn, navigate, redirectTo]
  );

  const displayError = formError || error;

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {displayError && (
        <div className={styles.errorMessage} role="alert">
          {displayError}
        </div>
      )}

      <div className={styles.field}>
        <label htmlFor="email" className={styles.label}>
          Email Address
        </label>
        <input
          type="email"
          id="email"
          className={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your.email@gcfsouthmetro.org"
          disabled={isLoading}
          autoComplete="email"
          required
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="role" className={styles.label}>
          Team Role
        </label>
        <select
          id="role"
          className={styles.select}
          value={role}
          onChange={(e) => setRole(e.target.value)}
          disabled={isLoading}
        >
          {IDMC_TEAM_ROLES.map((teamRole) => (
            <option key={teamRole} value={teamRole}>
              {USER_ROLE_LABELS[teamRole]}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className={styles.submitButton} disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>

      <p className={styles.notice}>
        This area is restricted to IDMC team members only. Participants should use
        the public pages.
      </p>
    </form>
  );
}

LoginForm.propTypes = {
  redirectTo: PropTypes.string,
};

export default LoginForm;
