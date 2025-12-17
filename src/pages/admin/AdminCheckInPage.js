/**
 * AdminCheckInPage Component
 * Main check-in interface for scanning QR codes and manually searching attendees.
 * Supports real-time statistics and recent check-in tracking.
 *
 * @module pages/admin/AdminCheckInPage
 */

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../../components/admin';
import {
  QRScanner,
  ManualSearch,
  AttendeeCard,
  CheckInStats,
  RecentCheckIns,
} from '../../components/checkin';
import { useAdminAuth } from '../../context';
import {
  parseQRCode,
  getRegistrationForCheckIn,
  checkInAttendee,
  subscribeToCheckInStats,
  subscribeToRecentCheckIns,
  CHECK_IN_METHODS,
  CHECK_IN_ERROR_CODES,
} from '../../services';
import styles from './AdminCheckInPage.module.css';

/**
 * Check-in mode tabs
 */
const CHECK_IN_MODES = {
  QR: 'qr',
  MANUAL: 'manual',
};

/**
 * AdminCheckInPage Component
 *
 * @returns {JSX.Element} The admin check-in page
 */
function AdminCheckInPage() {
  const { admin } = useAdminAuth();
  const [mode, setMode] = useState(CHECK_IN_MODES.QR);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInError, setCheckInError] = useState(null);
  const [checkInSuccess, setCheckInSuccess] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentCheckIns, setRecentCheckIns] = useState([]);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  /**
   * Handles QR code scan
   */
  const handleQRScan = useCallback(async (qrData) => {
    const { valid, registrationId } = parseQRCode(qrData);

    if (!valid || !registrationId) {
      setCheckInError({
        code: CHECK_IN_ERROR_CODES.INVALID_QR_CODE,
        message: 'Invalid QR code. Please try again.',
      });
      return;
    }

    try {
      const registration = await getRegistrationForCheckIn(registrationId);

      if (!registration) {
        setCheckInError({
          code: CHECK_IN_ERROR_CODES.REGISTRATION_NOT_FOUND,
          message: `Registration ${registrationId} not found.`,
        });
        return;
      }

      setSelectedRegistration(registration);
      setCheckInError(null);
    } catch (err) {
      console.error('Failed to fetch registration:', err);
      setCheckInError({
        code: 'FETCH_ERROR',
        message: 'Failed to fetch registration. Please try again.',
      });
    }
  }, []);

  /**
   * Handles manual search selection
   */
  const handleSearchSelect = useCallback((registration) => {
    setSelectedRegistration(registration);
    setCheckInError(null);
  }, []);

  /**
   * Performs the check-in
   */
  const handleCheckIn = useCallback(async () => {
    if (!selectedRegistration || !admin) {
      return;
    }

    setIsCheckingIn(true);
    setCheckInError(null);

    try {
      await checkInAttendee(selectedRegistration.id, {
        adminId: admin.uid,
        adminName: admin.displayName || admin.email,
        method: mode === CHECK_IN_MODES.QR ? CHECK_IN_METHODS.QR : CHECK_IN_METHODS.MANUAL,
      });

      // Show success message
      const attendeeName = `${selectedRegistration.primaryAttendee?.firstName || ''} ${selectedRegistration.primaryAttendee?.lastName || ''}`.trim();
      setCheckInSuccess({
        name: attendeeName,
        count: 1 + (selectedRegistration.additionalAttendees?.length || 0),
      });

      // Clear selection after success
      setSelectedRegistration(null);

      // Auto-hide success after 3 seconds
      setTimeout(() => {
        setCheckInSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Check-in failed:', err);
      setCheckInError({
        code: err.code || 'CHECK_IN_FAILED',
        message: err.message || 'Check-in failed. Please try again.',
      });

      // If already checked in, update the registration data
      if (err.code === CHECK_IN_ERROR_CODES.ALREADY_CHECKED_IN && err.registration) {
        setSelectedRegistration(err.registration);
      }
    } finally {
      setIsCheckingIn(false);
    }
  }, [selectedRegistration, admin, mode]);

  /**
   * Cancels the current selection
   */
  const handleCancel = useCallback(() => {
    setSelectedRegistration(null);
    setCheckInError(null);
  }, []);

  /**
   * Subscribe to real-time stats
   */
  useEffect(() => {
    setIsStatsLoading(true);

    const unsubscribeStats = subscribeToCheckInStats((newStats) => {
      setStats(newStats);
      setIsStatsLoading(false);
    });

    const unsubscribeCheckIns = subscribeToRecentCheckIns(10, (checkIns) => {
      setRecentCheckIns(checkIns);
    });

    return () => {
      unsubscribeStats();
      unsubscribeCheckIns();
    };
  }, []);

  return (
    <AdminLayout title="Check-In">
      <div className={styles.container}>
        {/* Left Column - Scanner/Search */}
        <div className={styles.mainColumn}>
          {/* Success Banner */}
          {checkInSuccess && (
            <div className={styles.successBanner}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <div>
                <strong>{checkInSuccess.name}</strong>
                <span>
                  checked in successfully
                  {checkInSuccess.count > 1 && ` (${checkInSuccess.count} attendees)`}
                </span>
              </div>
            </div>
          )}

          {/* Error Banner (when no registration selected) */}
          {checkInError && !selectedRegistration && (
            <div className={styles.errorBanner}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div>
                <strong>Error</strong>
                <span>{checkInError.message}</span>
              </div>
              <button onClick={() => setCheckInError(null)} aria-label="Dismiss">
                &times;
              </button>
            </div>
          )}

          {/* Attendee Card (when selected) */}
          {selectedRegistration ? (
            <AttendeeCard
              registration={selectedRegistration}
              onCheckIn={handleCheckIn}
              onCancel={handleCancel}
              isLoading={isCheckingIn}
              error={checkInError}
            />
          ) : (
            <>
              {/* Mode Tabs */}
              <div className={styles.modeTabs}>
                <button
                  className={`${styles.modeTab} ${mode === CHECK_IN_MODES.QR ? styles.active : ''}`}
                  onClick={() => setMode(CHECK_IN_MODES.QR)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="3" height="3" />
                    <line x1="21" y1="14" x2="21" y2="21" />
                    <line x1="14" y1="21" x2="21" y2="21" />
                  </svg>
                  QR Scanner
                </button>
                <button
                  className={`${styles.modeTab} ${mode === CHECK_IN_MODES.MANUAL ? styles.active : ''}`}
                  onClick={() => setMode(CHECK_IN_MODES.MANUAL)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                  Manual Search
                </button>
              </div>

              {/* Scanner or Search */}
              <div className={styles.modeContent}>
                {mode === CHECK_IN_MODES.QR ? (
                  <QRScanner
                    onScan={handleQRScan}
                    onError={(err) => console.error('Scanner error:', err)}
                    isActive={!selectedRegistration}
                  />
                ) : (
                  <ManualSearch
                    onSelect={handleSearchSelect}
                    autoFocus
                  />
                )}
              </div>
            </>
          )}
        </div>

        {/* Right Column - Stats & Recent */}
        <div className={styles.sideColumn}>
          <CheckInStats
            stats={stats}
            isLoading={isStatsLoading}
          />
          <RecentCheckIns
            checkIns={recentCheckIns}
            isLoading={isStatsLoading}
            limit={10}
          />
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminCheckInPage;
