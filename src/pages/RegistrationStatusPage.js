import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useSettings } from '../context';
import {
  REGISTRATION_STATUS,
  REGISTRATION_CATEGORY_LABELS,
  ROUTES,
} from '../constants';
import { formatPrice, maskEmail, maskName, maskPhone } from '../utils';
import { lookupRegistration } from '../services';
import styles from './RegistrationStatusPage.module.css';

/**
 * Status badge configuration mapping
 */
const STATUS_CONFIG = {
  [REGISTRATION_STATUS.PENDING_PAYMENT]: {
    label: 'Pending Payment',
    className: 'statusPending',
  },
  [REGISTRATION_STATUS.PENDING_VERIFICATION]: {
    label: 'Payment Under Review',
    className: 'statusPending',
  },
  [REGISTRATION_STATUS.CONFIRMED]: {
    label: 'Confirmed',
    className: 'statusConfirmed',
  },
  [REGISTRATION_STATUS.CANCELLED]: {
    label: 'Cancelled',
    className: 'statusCancelled',
  },
  [REGISTRATION_STATUS.REFUNDED]: {
    label: 'Refunded',
    className: 'statusCancelled',
  },
};

/**
 * RegistrationStatusPage Component
 * Allows users to look up their registration status using various identifiers.
 *
 * @returns {JSX.Element} The registration status lookup page
 */
function RegistrationStatusPage() {
  const { settings } = useSettings();
  const [searchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState('');
  const [registration, setRegistration] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  /**
   * Performs the registration lookup
   */
  const handleSearch = useCallback(async (value) => {
    const searchTerm = value || searchValue;
    if (!searchTerm.trim()) {
      setError('Please enter a registration ID, email, or phone number');
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const result = await lookupRegistration(searchTerm.trim());

      if (result) {
        setRegistration(result);
      } else {
        setRegistration(null);
        setError('Registration not found. Please check your information and try again.');
      }
    } catch (err) {
      console.error('Lookup error:', err);
      setError('An error occurred while looking up your registration. Please try again.');
      setRegistration(null);
    } finally {
      setIsLoading(false);
    }
  }, [searchValue]);

  /**
   * Handles form submission
   */
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    handleSearch();
  }, [handleSearch]);

  /**
   * Auto-search if ID is provided in URL params
   */
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setSearchValue(id);
      handleSearch(id);
    }
  }, [searchParams, handleSearch]);

  /**
   * Gets the status configuration for display
   */
  const getStatusConfig = useCallback((status) => {
    return STATUS_CONFIG[status] || {
      label: status || 'Unknown',
      className: 'statusPending',
    };
  }, []);

  /**
   * Formats a date string for display
   */
  const formatDate = useCallback((dateString) => {
    if (!dateString) {
      return 'N/A';
    }
    const date = dateString.toDate ? dateString.toDate() : new Date(dateString);
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const statusConfig = registration ? getStatusConfig(registration.status) : null;
  const isConfirmed = registration?.status === REGISTRATION_STATUS.CONFIRMED;

  return (
    <div className={styles.page}>
      <section className={styles.heroSection}>
        <h1 className={styles.heroTitle}>Check Registration Status</h1>
        <p className={styles.heroSubtitle}>
          Look up your registration using your ID, email, or phone number
        </p>
      </section>

      <section className={styles.contentSection}>
        <div className={styles.container}>
          {/* Search Form */}
          <div className={styles.searchCard}>
            <form onSubmit={handleSubmit} className={styles.searchForm}>
              <div className={styles.searchInputWrapper}>
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Enter Registration ID, Email, or Phone"
                  className={styles.searchInput}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className={styles.searchButton}
                  disabled={isLoading}
                >
                  {isLoading ? 'Searching...' : 'Search'}
                </button>
              </div>
              <p className={styles.searchHint}>
                Examples: REG-2026-A7K3, A7K3, email@example.com, 09171234567
              </p>
            </form>
          </div>

          {/* Error Message */}
          {error && hasSearched && (
            <div className={styles.errorBox}>
              <p>{error}</p>
              <p>
                Need help? <a href={ROUTES.CONTACT}>Contact us</a>
              </p>
            </div>
          )}

          {/* Registration Details */}
          {registration && (
            <div className={styles.resultCard}>
              {/* Status Banner */}
              <div className={`${styles.statusBanner} ${styles[statusConfig.className]}`}>
                <span className={styles.statusLabel}>{statusConfig.label}</span>
              </div>

              {/* Registration Header */}
              <div className={styles.regHeader}>
                <div className={styles.regIdSection}>
                  <span className={styles.regIdLabel}>Registration ID</span>
                  <span className={styles.regIdValue}>{registration.registrationId}</span>
                  <span className={styles.shortCode}>
                    Quick Code: <strong>{registration.shortCode}</strong>
                  </span>
                </div>

                {/* QR Code for confirmed registrations */}
                {isConfirmed && registration.qrCodeData && (
                  <div className={styles.qrCodeSection}>
                    <QRCodeSVG
                      value={registration.qrCodeData}
                      size={120}
                      level="M"
                      includeMargin={false}
                    />
                    <span className={styles.qrHint}>Scan at check-in</span>
                  </div>
                )}
              </div>

              {/* Church Information */}
              <div className={styles.infoSection}>
                <h3>Church Information</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Church</span>
                    <span className={styles.infoValue}>{registration.church?.name}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Location</span>
                    <span className={styles.infoValue}>
                      {registration.church?.city}, {registration.church?.province}
                    </span>
                  </div>
                </div>
              </div>

              {/* Primary Attendee */}
              <div className={styles.infoSection}>
                <h3>Primary Contact</h3>
                <div className={styles.attendeeCard}>
                  <div className={styles.attendeeBadge}>Primary</div>
                  <div className={styles.attendeeInfo}>
                    <p className={styles.attendeeName}>
                      {maskName(registration.primaryAttendee?.lastName)}, {maskName(registration.primaryAttendee?.firstName)} {maskName(registration.primaryAttendee?.middleName)}
                    </p>
                    <p className={styles.attendeeContact}>
                      {maskEmail(registration.primaryAttendee?.email)} | {maskPhone(registration.primaryAttendee?.cellphone)}
                    </p>
                    <p className={styles.attendeeMeta}>
                      {registration.primaryAttendee?.ministryRole} | {REGISTRATION_CATEGORY_LABELS[registration.primaryAttendee?.category]}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Attendees */}
              {registration.additionalAttendees?.length > 0 && (
                <div className={styles.infoSection}>
                  <h3>Additional Attendees ({registration.additionalAttendees.length})</h3>
                  {registration.additionalAttendees.map((attendee, index) => (
                    <div key={index} className={styles.attendeeCard}>
                      <div className={styles.attendeeNumber}>#{index + 2}</div>
                      <div className={styles.attendeeInfo}>
                        <p className={styles.attendeeName}>
                          {maskName(attendee.lastName)}, {maskName(attendee.firstName)} {maskName(attendee.middleName)}
                        </p>
                        <p className={styles.attendeeContact}>
                          {attendee.email ? maskEmail(attendee.email) : '(No email)'} | {maskPhone(attendee.cellphone)}
                        </p>
                        <p className={styles.attendeeMeta}>
                          {attendee.ministryRole} | {REGISTRATION_CATEGORY_LABELS[attendee.category]}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Payment Information */}
              <div className={styles.infoSection}>
                <h3>Payment Information</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Total Amount</span>
                    <span className={styles.infoValue}>{formatPrice(registration.totalAmount)}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Payment Status</span>
                    <span className={`${styles.infoValue} ${styles[statusConfig.className]}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                  {registration.payment?.verifiedAt && (
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Verified On</span>
                      <span className={styles.infoValue}>
                        {formatDate(registration.payment.verifiedAt)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Pending Payment Instructions */}
                {registration.status === REGISTRATION_STATUS.PENDING_PAYMENT && (
                  <div className={styles.pendingNote}>
                    <h4>Action Required</h4>
                    <p>
                      Please complete your payment and upload proof of payment to confirm your registration.
                    </p>
                    {registration.paymentDeadline && (
                      <p className={styles.deadline}>
                        Payment deadline: <strong>{formatDate(registration.paymentDeadline)}</strong>
                      </p>
                    )}
                  </div>
                )}

                {/* Verification Note */}
                {registration.status === REGISTRATION_STATUS.PENDING_VERIFICATION && (
                  <div className={styles.verificationNote}>
                    <h4>Payment Under Review</h4>
                    <p>
                      We have received your payment proof and it is being verified.
                      You will receive a confirmation email once your registration is confirmed.
                    </p>
                  </div>
                )}
              </div>

              {/* Registration Details */}
              <div className={styles.infoSection}>
                <h3>Registration Details</h3>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Registered On</span>
                    <span className={styles.infoValue}>{formatDate(registration.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Event Details */}
              <div className={styles.eventDetails}>
                <h3>Event Information</h3>
                <p><strong>Event:</strong> {settings.title}</p>
                <p><strong>Theme:</strong> {settings.theme}</p>
                <p>
                  <strong>Date:</strong> {new Date(settings.startDate).toLocaleDateString('en-PH', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p><strong>Venue:</strong> {settings.venue?.name}</p>
                <p><strong>Address:</strong> {settings.venue?.address}</p>
              </div>

              {/* Confirmed Registration - Download Section */}
              {isConfirmed && (
                <div className={styles.downloadSection}>
                  <h3>Your Ticket</h3>
                  <p>
                    Show this QR code or your registration ID at check-in.
                    A confirmation email with your ticket has been sent to {maskEmail(registration.primaryAttendee?.email)}.
                  </p>
                  <div className={styles.ticketQR}>
                    <QRCodeSVG
                      value={registration.qrCodeData || registration.registrationId}
                      size={180}
                      level="M"
                      includeMargin
                    />
                    <p className={styles.qrRegId}>{registration.registrationId}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Not Found - No Results */}
          {hasSearched && !isLoading && !registration && !error && (
            <div className={styles.notFound}>
              <h2>Registration Not Found</h2>
              <p>We couldn&apos;t find a registration matching your search.</p>
              <p>
                Please double-check your information or <a href={ROUTES.CONTACT}>contact us</a> for assistance.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default RegistrationStatusPage;
