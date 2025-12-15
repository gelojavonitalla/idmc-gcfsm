/**
 * MaintenancePage Component
 * Admin page for IDMC team members to manage seeded content.
 * Provides CRUD operations for speakers, sessions, workshops, and FAQ.
 *
 * @returns {JSX.Element} The maintenance page component
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context';
import {
  getAllSpeakers,
  updateSpeaker,
  deleteSpeaker,
  getAllSessions,
  updateSession,
  deleteSession,
  getAllFAQs,
  updateFAQ,
  deleteFAQ,
} from '../services/maintenance';
import {
  SPEAKER_STATUS,
  SESSION_STATUS,
  FAQ_STATUS,
  SESSION_TYPE_LABELS,
  FAQ_CATEGORY_LABELS,
  CONFERENCE,
} from '../constants';
import styles from './MaintenancePage.module.css';

/**
 * Tab identifiers for content management sections
 */
const TABS = {
  SPEAKERS: 'speakers',
  SESSIONS: 'sessions',
  FAQ: 'faq',
};

/**
 * Tab labels for display
 */
const TAB_LABELS = {
  [TABS.SPEAKERS]: 'Speakers',
  [TABS.SESSIONS]: 'Sessions & Workshops',
  [TABS.FAQ]: 'FAQ',
};

/**
 * MaintenancePage Component
 *
 * @returns {JSX.Element} The maintenance page component
 */
function MaintenancePage() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState(TABS.SPEAKERS);
  const [speakers, setSpeakers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(null);

  /**
   * Fetches all data on component mount
   */
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        const [speakersData, sessionsData, faqsData] = await Promise.all([
          getAllSpeakers(),
          getAllSessions(),
          getAllFAQs(),
        ]);

        setSpeakers(speakersData);
        setSessions(sessionsData);
        setFaqs(faqsData);
      } catch (fetchError) {
        console.error('Failed to fetch maintenance data:', fetchError);
        setError('Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  /**
   * Toggles speaker status between published and draft
   *
   * @param {Object} speaker - Speaker object to toggle
   */
  const handleToggleSpeakerStatus = useCallback(async (speaker) => {
    const newStatus =
      speaker.status === SPEAKER_STATUS.PUBLISHED
        ? SPEAKER_STATUS.DRAFT
        : SPEAKER_STATUS.PUBLISHED;

    setActionInProgress(`speaker-${speaker.id}`);

    try {
      await updateSpeaker(speaker.id, { status: newStatus });
      setSpeakers((prev) =>
        prev.map((s) => (s.id === speaker.id ? { ...s, status: newStatus } : s))
      );
    } catch (updateError) {
      console.error('Failed to update speaker status:', updateError);
      setError('Failed to update speaker. Please try again.');
    } finally {
      setActionInProgress(null);
    }
  }, []);

  /**
   * Deletes a speaker
   *
   * @param {Object} speaker - Speaker object to delete
   */
  const handleDeleteSpeaker = useCallback(async (speaker) => {
    if (!window.confirm(`Are you sure you want to delete ${speaker.name}?`)) {
      return;
    }

    setActionInProgress(`speaker-delete-${speaker.id}`);

    try {
      await deleteSpeaker(speaker.id);
      setSpeakers((prev) => prev.filter((s) => s.id !== speaker.id));
    } catch (deleteError) {
      console.error('Failed to delete speaker:', deleteError);
      setError('Failed to delete speaker. Please try again.');
    } finally {
      setActionInProgress(null);
    }
  }, []);

  /**
   * Toggles session status between published and draft
   *
   * @param {Object} session - Session object to toggle
   */
  const handleToggleSessionStatus = useCallback(async (session) => {
    const newStatus =
      session.status === SESSION_STATUS.PUBLISHED
        ? SESSION_STATUS.DRAFT
        : SESSION_STATUS.PUBLISHED;

    setActionInProgress(`session-${session.id}`);

    try {
      await updateSession(session.id, { status: newStatus });
      setSessions((prev) =>
        prev.map((s) => (s.id === session.id ? { ...s, status: newStatus } : s))
      );
    } catch (updateError) {
      console.error('Failed to update session status:', updateError);
      setError('Failed to update session. Please try again.');
    } finally {
      setActionInProgress(null);
    }
  }, []);

  /**
   * Deletes a session
   *
   * @param {Object} session - Session object to delete
   */
  const handleDeleteSession = useCallback(async (session) => {
    if (!window.confirm(`Are you sure you want to delete "${session.title}"?`)) {
      return;
    }

    setActionInProgress(`session-delete-${session.id}`);

    try {
      await deleteSession(session.id);
      setSessions((prev) => prev.filter((s) => s.id !== session.id));
    } catch (deleteError) {
      console.error('Failed to delete session:', deleteError);
      setError('Failed to delete session. Please try again.');
    } finally {
      setActionInProgress(null);
    }
  }, []);

  /**
   * Toggles FAQ status between published and draft
   *
   * @param {Object} faq - FAQ object to toggle
   */
  const handleToggleFAQStatus = useCallback(async (faq) => {
    const newStatus =
      faq.status === FAQ_STATUS.PUBLISHED
        ? FAQ_STATUS.DRAFT
        : FAQ_STATUS.PUBLISHED;

    setActionInProgress(`faq-${faq.id}`);

    try {
      await updateFAQ(faq.id, { status: newStatus });
      setFaqs((prev) =>
        prev.map((f) => (f.id === faq.id ? { ...f, status: newStatus } : f))
      );
    } catch (updateError) {
      console.error('Failed to update FAQ status:', updateError);
      setError('Failed to update FAQ. Please try again.');
    } finally {
      setActionInProgress(null);
    }
  }, []);

  /**
   * Deletes an FAQ
   *
   * @param {Object} faq - FAQ object to delete
   */
  const handleDeleteFAQ = useCallback(async (faq) => {
    if (!window.confirm(`Are you sure you want to delete this FAQ?`)) {
      return;
    }

    setActionInProgress(`faq-delete-${faq.id}`);

    try {
      await deleteFAQ(faq.id);
      setFaqs((prev) => prev.filter((f) => f.id !== faq.id));
    } catch (deleteError) {
      console.error('Failed to delete FAQ:', deleteError);
      setError('Failed to delete FAQ. Please try again.');
    } finally {
      setActionInProgress(null);
    }
  }, []);

  /**
   * Renders the speakers management section
   *
   * @returns {JSX.Element} Speakers table
   */
  const renderSpeakers = () => (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Order</th>
            <th>Name</th>
            <th>Title</th>
            <th>Organization</th>
            <th>Session Type</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {speakers.length === 0 ? (
            <tr>
              <td colSpan="7" className={styles.emptyRow}>
                No speakers found. Add speakers using the seed scripts.
              </td>
            </tr>
          ) : (
            speakers.map((speaker) => (
              <tr key={speaker.id}>
                <td>{speaker.order}</td>
                <td className={styles.nameCell}>{speaker.name}</td>
                <td>{speaker.title}</td>
                <td>{speaker.organization}</td>
                <td>{SESSION_TYPE_LABELS[speaker.sessionType] || speaker.sessionType}</td>
                <td>
                  <span
                    className={`${styles.statusBadge} ${
                      speaker.status === SPEAKER_STATUS.PUBLISHED
                        ? styles.statusPublished
                        : styles.statusDraft
                    }`}
                  >
                    {speaker.status}
                  </span>
                </td>
                <td className={styles.actionsCell}>
                  <button
                    className={styles.actionButton}
                    onClick={() => handleToggleSpeakerStatus(speaker)}
                    disabled={actionInProgress === `speaker-${speaker.id}`}
                  >
                    {speaker.status === SPEAKER_STATUS.PUBLISHED
                      ? 'Unpublish'
                      : 'Publish'}
                  </button>
                  <button
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                    onClick={() => handleDeleteSpeaker(speaker)}
                    disabled={actionInProgress === `speaker-delete-${speaker.id}`}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  /**
   * Renders the sessions management section
   *
   * @returns {JSX.Element} Sessions table
   */
  const renderSessions = () => (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Order</th>
            <th>Title</th>
            <th>Time</th>
            <th>Type</th>
            <th>Venue</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sessions.length === 0 ? (
            <tr>
              <td colSpan="7" className={styles.emptyRow}>
                No sessions found. Add sessions using the seed scripts.
              </td>
            </tr>
          ) : (
            sessions.map((session) => (
              <tr key={session.id}>
                <td>{session.order}</td>
                <td className={styles.nameCell}>{session.title}</td>
                <td>
                  {session.time} - {session.endTime}
                </td>
                <td>{SESSION_TYPE_LABELS[session.sessionType] || session.sessionType}</td>
                <td>{session.venue}</td>
                <td>
                  <span
                    className={`${styles.statusBadge} ${
                      session.status === SESSION_STATUS.PUBLISHED
                        ? styles.statusPublished
                        : styles.statusDraft
                    }`}
                  >
                    {session.status || 'published'}
                  </span>
                </td>
                <td className={styles.actionsCell}>
                  <button
                    className={styles.actionButton}
                    onClick={() => handleToggleSessionStatus(session)}
                    disabled={actionInProgress === `session-${session.id}`}
                  >
                    {session.status === SESSION_STATUS.PUBLISHED
                      ? 'Unpublish'
                      : 'Publish'}
                  </button>
                  <button
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                    onClick={() => handleDeleteSession(session)}
                    disabled={actionInProgress === `session-delete-${session.id}`}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  /**
   * Renders the FAQ management section
   *
   * @returns {JSX.Element} FAQ table
   */
  const renderFAQs = () => (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Order</th>
            <th>Question</th>
            <th>Category</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {faqs.length === 0 ? (
            <tr>
              <td colSpan="5" className={styles.emptyRow}>
                No FAQs found. Add FAQs using the seed scripts.
              </td>
            </tr>
          ) : (
            faqs.map((faq) => (
              <tr key={faq.id}>
                <td>{faq.order}</td>
                <td className={styles.questionCell}>{faq.question}</td>
                <td>{FAQ_CATEGORY_LABELS[faq.category] || faq.category}</td>
                <td>
                  <span
                    className={`${styles.statusBadge} ${
                      faq.status === FAQ_STATUS.PUBLISHED
                        ? styles.statusPublished
                        : styles.statusDraft
                    }`}
                  >
                    {faq.status}
                  </span>
                </td>
                <td className={styles.actionsCell}>
                  <button
                    className={styles.actionButton}
                    onClick={() => handleToggleFAQStatus(faq)}
                    disabled={actionInProgress === `faq-${faq.id}`}
                  >
                    {faq.status === FAQ_STATUS.PUBLISHED ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                    onClick={() => handleDeleteFAQ(faq)}
                    disabled={actionInProgress === `faq-delete-${faq.id}`}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  /**
   * Renders the content based on active tab
   *
   * @returns {JSX.Element} Tab content
   */
  const renderTabContent = () => {
    switch (activeTab) {
      case TABS.SPEAKERS:
        return renderSpeakers();
      case TABS.SESSIONS:
        return renderSessions();
      case TABS.FAQ:
        return renderFAQs();
      default:
        return null;
    }
  };

  return (
    <div className={styles.page}>
      {/* Header Section */}
      <section className={styles.headerSection}>
        <div className="container">
          <div className={styles.headerContent}>
            <div>
              <h1 className={styles.title}>Content Maintenance</h1>
              <p className={styles.subtitle}>
                IDMC {CONFERENCE.YEAR} - Manage speakers, sessions, and FAQ
              </p>
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userEmail}>{user?.email}</span>
              <span className={styles.userRole}>{user?.roleLabel}</span>
              <button className={styles.signOutButton} onClick={signOut}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className={styles.contentSection}>
        <div className="container">
          {/* Error Banner */}
          {error && (
            <div className={styles.errorBanner} role="alert">
              {error}
              <button
                className={styles.dismissButton}
                onClick={() => setError(null)}
                aria-label="Dismiss error"
              >
                &times;
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className={styles.tabs}>
            {Object.entries(TAB_LABELS).map(([tabKey, tabLabel]) => (
              <button
                key={tabKey}
                className={`${styles.tab} ${
                  activeTab === tabKey ? styles.tabActive : ''
                }`}
                onClick={() => setActiveTab(tabKey)}
              >
                {tabLabel}
                <span className={styles.tabCount}>
                  {tabKey === TABS.SPEAKERS && speakers.length}
                  {tabKey === TABS.SESSIONS && sessions.length}
                  {tabKey === TABS.FAQ && faqs.length}
                </span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className={styles.tabContent}>
            {isLoading ? (
              <div className={styles.loadingState}>
                <p>Loading content...</p>
              </div>
            ) : (
              renderTabContent()
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default MaintenancePage;
