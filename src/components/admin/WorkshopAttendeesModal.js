/**
 * WorkshopAttendeesModal Component
 * Modal for viewing attendees registered for a specific workshop.
 *
 * @module components/admin/WorkshopAttendeesModal
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getWorkshopAttendees } from '../../services/registration';
import { REGISTRATION_CATEGORY_LABELS } from '../../constants';
import styles from './WorkshopAttendeesModal.module.css';

/**
 * Gets formatted church info from attendee
 *
 * @param {Object} attendee - Attendee object with church data
 * @returns {string} Formatted church info
 */
function getChurchInfo(attendee) {
  const church = attendee.church;
  if (church && typeof church === 'object') {
    const { name, city, province } = church;
    if (name && city && province) {
      return `${name} - ${city}, ${province}`;
    }
    if (name) {
      return name;
    }
  }
  if (church && typeof church === 'string') {
    return church;
  }
  return '—';
}

/**
 * WorkshopAttendeesModal Component
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Callback to close modal
 * @param {Object} props.workshop - Workshop data
 * @param {number|null} props.effectiveCapacity - Effective capacity (venue room or workshop capacity)
 * @returns {JSX.Element|null} The modal or null if not open
 */
function WorkshopAttendeesModal({ isOpen, onClose, workshop, effectiveCapacity }) {
  const [attendees, setAttendees] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  /**
   * Fetch attendees when modal opens
   */
  useEffect(() => {
    async function fetchAttendees() {
      if (!isOpen || !workshop?.id) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await getWorkshopAttendees(workshop.id);
        setAttendees(data);
      } catch (fetchError) {
        console.error('Failed to fetch workshop attendees:', fetchError);
        setError('Failed to load attendees. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAttendees();
  }, [isOpen, workshop?.id]);

  /**
   * Reset state when modal closes
   */
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setAttendees([]);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !workshop) {
    return null;
  }

  /**
   * Filter attendees based on search term
   */
  const filteredAttendees = attendees.filter((attendee) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const fullName = `${attendee.firstName} ${attendee.lastName}`.toLowerCase();
    const email = (attendee.email || '').toLowerCase();
    const church = getChurchInfo(attendee).toLowerCase();
    const code = (attendee.shortCode || '').toLowerCase();
    return (
      fullName.includes(search) ||
      email.includes(search) ||
      church.includes(search) ||
      code.includes(search)
    );
  });

  /**
   * Handle export to CSV
   */
  const handleExport = () => {
    if (attendees.length === 0) return;

    const headers = ['Name', 'Email', 'Phone', 'Church', 'Ministry Role', 'Category', 'Registration Code', 'Checked In'];
    const rows = attendees.map((attendee) => [
      `${attendee.firstName} ${attendee.lastName}`,
      attendee.email,
      attendee.cellphone,
      getChurchInfo(attendee),
      attendee.ministryRole,
      REGISTRATION_CATEGORY_LABELS[attendee.category] || attendee.category,
      attendee.shortCode,
      attendee.checkedIn ? 'Yes' : 'No',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${(cell || '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `workshop-attendees-${workshop.id}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Workshop Attendees</h2>
            <p className={styles.workshopTitle}>{workshop.title}</p>
          </div>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* Stats and Actions Bar */}
          <div className={styles.toolbar}>
            <div className={styles.stats}>
              <span className={styles.attendeeCount}>
                {attendees.length} {attendees.length === 1 ? 'Attendee' : 'Attendees'}
              </span>
              {effectiveCapacity && (
                <span className={styles.capacityInfo}>
                  / {effectiveCapacity} capacity
                </span>
              )}
            </div>
            <div className={styles.actions}>
              <div className={styles.searchContainer}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search attendees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                className={styles.exportButton}
                onClick={handleExport}
                disabled={attendees.length === 0}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export CSV
              </button>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className={styles.errorBanner}>
              {error}
              <button onClick={() => setError(null)} aria-label="Dismiss error">
                ×
              </button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <p>Loading attendees...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && attendees.length === 0 && (
            <div className={styles.emptyState}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <h3>No attendees yet</h3>
              <p>No confirmed attendees have registered for this workshop.</p>
            </div>
          )}

          {/* No Search Results */}
          {!isLoading && !error && attendees.length > 0 && filteredAttendees.length === 0 && (
            <div className={styles.emptyState}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <h3>No matches found</h3>
              <p>No attendees match your search criteria.</p>
            </div>
          )}

          {/* Attendees Table */}
          {!isLoading && !error && filteredAttendees.length > 0 && (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Church</th>
                    <th>Category</th>
                    <th>Code</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendees.map((attendee, index) => (
                    <tr key={`${attendee.registrationId}-${index}`}>
                      <td className={styles.nameCell}>
                        <span className={styles.name}>
                          {attendee.firstName} {attendee.lastName}
                        </span>
                        {!attendee.isPrimary && (
                          <span className={styles.additionalBadge}>Additional</span>
                        )}
                      </td>
                      <td className={styles.emailCell}>{attendee.email || '—'}</td>
                      <td className={styles.churchCell}>{getChurchInfo(attendee)}</td>
                      <td>
                        <span className={styles.categoryBadge}>
                          {REGISTRATION_CATEGORY_LABELS[attendee.category] || attendee.category || '—'}
                        </span>
                      </td>
                      <td className={styles.codeCell}>{attendee.shortCode}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${attendee.checkedIn ? styles.checkedIn : styles.notCheckedIn}`}>
                          {attendee.checkedIn ? 'Checked In' : 'Not Checked In'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.closeButtonSecondary} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

WorkshopAttendeesModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  workshop: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    capacity: PropTypes.number,
    venue: PropTypes.string,
    registeredCount: PropTypes.number,
  }),
  effectiveCapacity: PropTypes.number,
};

WorkshopAttendeesModal.defaultProps = {
  workshop: null,
  effectiveCapacity: null,
};

export default WorkshopAttendeesModal;
