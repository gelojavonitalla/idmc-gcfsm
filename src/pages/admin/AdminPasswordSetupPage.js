/**
 * AdminPasswordSetupPage Component
 * Handles password setup for invited admin users with auto-login after completion.
 *
 * @module pages/admin/AdminPasswordSetupPage
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAdminAuth } from '../../context';
import { verifyPasswordResetCode, confirmPasswordReset } from '../../services/auth';
import { ADMIN_ROUTES, CONFERENCE, BRANDING } from '../../constants';
import styles from './AdminLoginPage.module.css';

/**
 * Minimum password length requirement
 */
const MIN_PASSWORD_LENGTH = 8;

/**
 * AdminPasswordSetupPage Component
 *
 * @returns {JSX.Element} The admin password setup page
 */
function AdminPasswordSetupPage() {
  const { signIn, isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState('');

  const oobCode = searchParams.get('oobCode');
  const mode = searchParams.get('mode');

  /**
   * Redirect if already authenticated
   */
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate(ADMIN_ROUTES.DASHBOARD, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  /**
   * Verify the password reset code on mount
   */
  useEffect(() => {
    async function verifyCode() {
      if (!oobCode || mode !== 'resetPassword') {
        setVerificationError('Invalid or missing password setup link. Please request a new invitation.');
        setIsVerifying(false);
        return;
      }

      try {
        const userEmail = await verifyPasswordResetCode(oobCode);
        setEmail(userEmail);
        setIsVerifying(false);
      } catch (error) {
        let errorMessage = 'This password setup link has expired or is invalid.';
        if (error.code === 'auth/expired-action-code') {
          errorMessage = 'This password setup link has expired. Please request a new invitation.';
        } else if (error.code === 'auth/invalid-action-code') {
          errorMessage = 'This password setup link is invalid. Please request a new invitation.';
        }
        setVerificationError(errorMessage);
        setIsVerifying(false);
      }
    }

    verifyCode();
  }, [oobCode, mode]);

  /**
   * Validates the password meets requirements
   *
   * @returns {string|null} Error message or null if valid
   */
  const validatePassword = useCallback(() => {
    if (password.length < MIN_PASSWORD_LENGTH) {
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`;
    }
    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  }, [password, confirmPassword]);

  /**
   * Handles password setup form submission
   *
   * @param {Event} event - Form submit event
   */
  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setFormError('');

      const validationError = validatePassword();
      if (validationError) {
        setFormError(validationError);
        return;
      }

      setIsSubmitting(true);

      try {
        // Confirm the password reset
        await confirmPasswordReset(oobCode, password);

        // Automatically sign in the user
        await signIn(email, password);

        // Navigate to dashboard
        navigate(ADMIN_ROUTES.DASHBOARD, { replace: true });
      } catch (error) {
        let errorMessage = 'Failed to set password. Please try again.';
        if (error.code === 'auth/weak-password') {
          errorMessage = 'Password is too weak. Please use a stronger password.';
        } else if (error.code === 'auth/expired-action-code') {
          errorMessage = 'This link has expired. Please request a new invitation.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        setFormError(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
    [oobCode, password, email, validatePassword, signIn, navigate]
  );

  /**
   * Toggles password visibility
   */
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  /**
   * Toggles confirm password visibility
   */
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  if (authLoading || isVerifying) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>{isVerifying ? 'Verifying your invitation...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (verificationError) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.formSection}>
            <div className={styles.formContainer}>
              <h2 className={styles.title}>Link Expired or Invalid</h2>
              <p className={styles.subtitle}>{verificationError}</p>

              <div className={styles.footer}>
                <Link to={ADMIN_ROUTES.LOGIN} className={styles.backLink}>
                  &larr; Back to Sign In
                </Link>
              </div>
            </div>
          </div>
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
            <img
              src={BRANDING.GCF_LOGO_URL}
              alt="GCF South Metro Logo"
              className={styles.logo}
            />
            <h1 className={styles.brandTitle}>Admin Dashboard</h1>
            <p className={styles.brandSubtitle}>
              {CONFERENCE.THEME}
            </p>
            <p className={styles.brandYear}>IDMC {CONFERENCE.YEAR}</p>
          </div>
        </div>

        {/* Right side - Form */}
        <div className={styles.formSection}>
          <div className={styles.formContainer}>
            <h2 className={styles.title}>Set Your Password</h2>
            <p className={styles.subtitle}>
              Create a password for your admin account ({email})
            </p>

            <form onSubmit={handleSubmit} className={styles.form}>
              {formError && (
                <div className={styles.errorMessage} role="alert">
                  {formError}
                </div>
              )}

              <div className={styles.field}>
                <label htmlFor="password" className={styles.label}>
                  New Password
                </label>
                <div className={styles.passwordWrapper}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className={styles.input}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your new password"
                    disabled={isSubmitting}
                    autoComplete="new-password"
                    minLength={MIN_PASSWORD_LENGTH}
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

              <div className={styles.field}>
                <label htmlFor="confirmPassword" className={styles.label}>
                  Confirm Password
                </label>
                <div className={styles.passwordWrapper}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    className={styles.input}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    disabled={isSubmitting}
                    autoComplete="new-password"
                    minLength={MIN_PASSWORD_LENGTH}
                    required
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={toggleConfirmPasswordVisibility}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
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

              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Setting up your account...' : 'Set Password & Sign In'}
              </button>
            </form>

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

export default AdminPasswordSetupPage;
