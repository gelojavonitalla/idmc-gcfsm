import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SessionCard, SessionDetailModal, TypeFilter } from '../components/schedule';
import { getPublishedSessions } from '../services/sessions';
import { getPublishedSpeakers } from '../services/speakers';
import { downloadSchedulePdf } from '../utils';
import {
  SCHEDULE,
  CONFERENCE,
  ROUTES,
} from '../constants';
import styles from './SchedulePage.module.css';

/**
 * SchedulePage Component
 * Public-facing page that displays the conference schedule.
 * Shows sessions in a timeline view with filtering by session type.
 * Clicking a session card opens a modal with detailed information.
 * Fetches session data from Firestore with fallback to static data.
 *
 * @returns {JSX.Element} The schedule page component
 */
function SchedulePage() {
  const [selectedSession, setSelectedSession] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('');

  /**
   * Fetches published sessions and speakers from Firestore on component mount
   */
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);

        const [fetchedSessions, fetchedSpeakers] = await Promise.all([
          getPublishedSessions(),
          getPublishedSpeakers(),
        ]);

        setSessions(fetchedSessions);
        setSpeakers(fetchedSpeakers);
      } catch (fetchError) {
        // Fall back to static data on fetch errors
        setSessions(SCHEDULE);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  /**
   * Filters sessions by the selected type
   */
  const filteredSessions = useMemo(() => {
    if (!selectedType) {
      return sessions;
    }
    return sessions.filter((session) => session.sessionType === selectedType);
  }, [sessions, selectedType]);

  /**
   * Formats time from 24-hour format to 12-hour format
   *
   * @param {string} time - Time in HH:MM format
   * @returns {string} Formatted time (e.g., "1:15 PM")
   */
  function formatTime(time) {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  /**
   * Groups sessions by time slot for timeline display
   */
  const groupedSessions = useMemo(() => {
    const groups = {};

    filteredSessions.forEach((session) => {
      const timeKey = session.startTime;
      if (!groups[timeKey]) {
        groups[timeKey] = [];
      }
      groups[timeKey].push(session);
    });

    // Sort by startTime (already in 24-hour format)
    return Object.entries(groups).sort((a, b) => {
      return a[0].localeCompare(b[0]);
    });
  }, [filteredSessions]);

  /**
   * Opens the session detail modal
   *
   * @param {Object} session - Session data to display
   */
  const handleSessionClick = useCallback((session) => {
    setSelectedSession(session);
    setIsModalOpen(true);
  }, []);

  /**
   * Closes the session detail modal
   */
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedSession(null);
  }, []);

  /**
   * Handles filter type change
   *
   * @param {string} type - Selected session type
   */
  const handleTypeChange = useCallback((type) => {
    setSelectedType(type);
  }, []);

  /**
   * Handles PDF download
   */
  const handleDownloadPdf = useCallback(() => {
    downloadSchedulePdf(sessions, {
      title: `IDMC ${CONFERENCE.YEAR}`,
      date: 'March 28, 2026',
      venue: 'GCF South Metro',
      filename: `idmc-${CONFERENCE.YEAR}-schedule`,
    });
  }, [sessions]);

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className="container">
          <h1 className={styles.heroTitle}>Conference Schedule</h1>
          <p className={styles.heroSubtitle}>
            IDMC {CONFERENCE.YEAR} - March 28, 2026
          </p>
          <p className={styles.heroLinks}>
            <Link to={ROUTES.DOWNLOADS} className={styles.heroLink}>
              View Conference Materials & Downloads →
            </Link>
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className={styles.contentSection}>
        <div className="container">
          {/* Filter Controls */}
          <div className={styles.filterBar}>
            <TypeFilter
              selectedType={selectedType}
              onChange={handleTypeChange}
            />
            <button
              className={styles.downloadButton}
              onClick={handleDownloadPdf}
              disabled={isLoading || sessions.length === 0}
              title="Download schedule as PDF"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download PDF
            </button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className={styles.loadingState}>
              <p>Loading schedule...</p>
            </div>
          )}

          {/* Content - Only show when not loading */}
          {!isLoading && (
            <>
              {/* Timeline */}
              {groupedSessions.length > 0 ? (
                <div className={styles.timeline}>
                  {groupedSessions.map(([time, timeSessions]) => (
                    <div key={time} className={styles.timeSlot}>
                      <div className={styles.timeLabel}>
                        <span className={styles.timeBadge}>{formatTime(time)}</span>
                      </div>
                      <div className={styles.sessionsGrid}>
                        {timeSessions.map((session) => (
                          <SessionCard
                            key={session.id}
                            session={session}
                            onClick={handleSessionClick}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p>No sessions found for the selected filter.</p>
                  {selectedType && (
                    <button
                      className={styles.clearFilterButton}
                      onClick={() => setSelectedType('')}
                    >
                      Show all sessions
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className="container">
          <h2 className={styles.ctaTitle}>Ready to Join Us?</h2>
          <p className={styles.ctaText}>
            Register now for IDMC {CONFERENCE.YEAR} and be part of this
            transformational conference.
          </p>
          <div className={styles.ctaButtons}>
            <Link to={ROUTES.REGISTER} className={styles.ctaButtonPrimary}>
              Register Now
            </Link>
            <Link to={ROUTES.FAQ} className={styles.ctaButtonSecondary}>
              View FAQ
            </Link>
          </div>
        </div>
      </section>

      {/* Session Detail Modal */}
      <SessionDetailModal
        session={selectedSession}
        speakers={speakers}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}

export default SchedulePage;
