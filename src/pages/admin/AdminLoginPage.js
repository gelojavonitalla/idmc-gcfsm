/**
 * AdminLoginPage Component
 * Login page for admin dashboard access.
 *
 * @module pages/admin/AdminLoginPage
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAdminAuth } from '../../context';
import { ADMIN_ROUTES, CONFERENCE } from '../../constants';
import styles from './AdminLoginPage.module.css';

/**
 * AdminLoginPage Component
 *
 * @returns {JSX.Element} The admin login page
 */
function AdminLoginPage() {
  const { signIn, resetPassword, isAuthenticated, isLoading, error, clearError } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const from = location.state?.from?.pathname || ADMIN_ROUTES.DASHBOARD;

  /**
   * Redirect if already authenticated
   */
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, from]);

  /**
   * Clear errors when switching forms
   */
  useEffect(() => {
    setFormError('');
    clearError();
  }, [showForgotPassword, clearError]);

  /**
   * Handles login form submission
   *
   * @param {Event} event - Form submit event
   */
  const handleLogin = useCallback(
    async (event) => {
      event.preventDefault();
      setFormError('');

      if (!email.trim()) {
        setFormError('Please enter your email address');
        return;
      }

      if (!password) {
        setFormError('Please enter your password');
        return;
      }

      setIsSubmitting(true);

      try {
        await signIn(email, password);
        navigate(from, { replace: true });
      } catch (signInError) {
        setFormError(signInError.message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, password, signIn, navigate, from]
  );

  /**
   * Handles password reset form submission
   *
   * @param {Event} event - Form submit event
   */
  const handlePasswordReset = useCallback(
    async (event) => {
      event.preventDefault();
      setFormError('');

      if (!email.trim()) {
        setFormError('Please enter your email address');
        return;
      }

      setIsSubmitting(true);

      try {
        await resetPassword(email);
        setResetEmailSent(true);
      } catch (resetError) {
        setFormError(resetError.message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, resetPassword]
  );

  /**
   * Toggles password visibility
   */
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  /**
   * Switches to forgot password form
   */
  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    setResetEmailSent(false);
  };

  /**
   * Switches back to login form
   */
  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setResetEmailSent(false);
  };

  const displayError = formError || error;

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Left side - Branding */}
        <div className={styles.branding}>
          <div className={styles.brandingContent}>
            <div className={styles.logo}>IDMC</div>
            <h1 className={styles.brandTitle}>Admin Dashboard</h1>
            <p className={styles.brandSubtitle}>
              {CONFERENCE.THEME}
            </p>
            <p className={styles.brandYear}>{CONFERENCE.YEAR}</p>
          </div>
        </div>

        {/* Right side - Form */}
        <div className={styles.formSection}>
          <div className={styles.formContainer}>
            {showForgotPassword ? (
              <>
                <h2 className={styles.title}>Reset Password</h2>
                <p className={styles.subtitle}>
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </p>

                {resetEmailSent ? (
                  <div className={styles.successMessage}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <p>Password reset email sent! Check your inbox.</p>
                    <button
                      type="button"
                      className={styles.linkButton}
                      onClick={handleBackToLogin}
                    >
                      Back to Sign In
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handlePasswordReset} className={styles.form}>
                    {displayError && (
                      <div className={styles.errorMessage} role="alert">
                        {displayError}
                      </div>
                    )}

                    <div className={styles.field}>
                      <label htmlFor="reset-email" className={styles.label}>
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="reset-email"
                        className={styles.input}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@example.com"
                        disabled={isSubmitting}
                        autoComplete="email"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className={styles.submitButton}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                    </button>

                    <button
                      type="button"
                      className={styles.linkButton}
                      onClick={handleBackToLogin}
                    >
                      Back to Sign In
                    </button>
                  </form>
                )}
              </>
            ) : (
              <>
                <h2 className={styles.title}>Sign In</h2>
                <p className={styles.subtitle}>
                  Access the admin dashboard to manage the conference.
                </p>

                <form onSubmit={handleLogin} className={styles.form}>
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
                      placeholder="admin@example.com"
                      disabled={isSubmitting}
                      autoComplete="email"
                      required
                    />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="password" className={styles.label}>
                      Password
                    </label>
                    <div className={styles.passwordWrapper}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        className={styles.input}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        disabled={isSubmitting}
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        className={styles.passwordToggle}
                        onClick={togglePasswordVisibility}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className={styles.forgotPassword}>
                    <button
                      type="button"
                      className={styles.linkButton}
                      onClick={handleForgotPassword}
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Signing in...' : 'Sign In'}
                  </button>
                </form>
              </>
            )}

            <div className={styles.footer}>
              <Link to="/" className={styles.backLink}>
                &larr; Back to Public Site
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLoginPage;
