/**
 * AdminSchedulePage Component
 * Schedule/session management page for admins.
 *
 * @module pages/admin/AdminSchedulePage
 */

import { useState, useEffect, useCallback } from 'react';
import {
  AdminLayout,
  SessionTable,
  SessionFormModal,
} from '../../components/admin';
import {
  getAllSessions,
  saveSession,
  updateSession,
  deleteSession,
} from '../../services/maintenance';
import { SESSION_STATUS, SESSION_TYPES, SESSION_TYPE_LABELS } from '../../constants';
import styles from './AdminSchedulePage.module.css';

/**
 * AdminSchedulePage Component
 *
 * @returns {JSX.Element} The admin schedule page
 */
function AdminSchedulePage() {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  /**
   * Fetches all sessions
   */
  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getAllSessions();
      setSessions(data);
    } catch (fetchError) {
      console.error('Failed to fetch sessions:', fetchError);
      setError('Failed to load sessions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch sessions on mount
   */
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  /**
   * Handles opening modal for new session
   */
  const handleAddSession = () => {
    setEditingSession(null);
    setIsModalOpen(true);
  };

  /**
   * Handles opening modal for editing session
   *
   * @param {Object} session - Session to edit
   */
  const handleEditSession = (session) => {
    setEditingSession(session);
    setIsModalOpen(true);
  };

  /**
   * Handles saving a session (create or update)
   *
   * @param {string} sessionId - Session ID
   * @param {Object} sessionData - Session data
   */
  const handleSaveSession = async (sessionId, sessionData) => {
    await saveSession(sessionId, sessionData);
    await fetchSessions();
  };

  /**
   * Handles deleting a session
   *
   * @param {string} sessionId - Session ID to delete
   */
  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this session?')) {
      return;
    }

    try {
      await deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      console.error('Failed to delete session:', err);
      setError('Failed to delete session. Please try again.');
    }
  };

  /**
   * Handles toggling session status (publish/draft)
   *
   * @param {string} sessionId - Session ID
   */
  const handleToggleStatus = async (sessionId) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;

    const newStatus =
      session.status === SESSION_STATUS.PUBLISHED
        ? SESSION_STATUS.DRAFT
        : SESSION_STATUS.PUBLISHED;

    try {
      await updateSession(sessionId, { status: newStatus });
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? { ...s, status: newStatus } : s
        )
      );
    } catch (err) {
      console.error('Failed to update session status:', err);
      setError('Failed to update session status. Please try again.');
    }
  };

  /**
   * Gets session statistics
   */
  const getStats = () => {
    const total = sessions.length;
    const published = sessions.filter(
      (s) => s.status === SESSION_STATUS.PUBLISHED
    ).length;
    const draft = sessions.filter(
      (s) => s.status === SESSION_STATUS.DRAFT
    ).length;
    const workshops = sessions.filter(
      (s) => s.sessionType === SESSION_TYPES.WORKSHOP
    ).length;

    return { total, published, draft, workshops };
  };

  /**
   * Filters sessions based on search query and type filter
   */
  const filteredSessions = sessions.filter((session) => {
    // Apply type filter
    if (filterType !== 'all' && session.sessionType !== filterType) {
      return false;
    }

    // Apply search query
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      session.title?.toLowerCase().includes(query) ||
      session.description?.toLowerCase().includes(query) ||
      session.venue?.toLowerCase().includes(query) ||
      session.speakerNames?.some((name) =>
        name.toLowerCase().includes(query)
      )
    );
  });

  const stats = getStats();

  return (
    <AdminLayout title="Schedule Management">
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Schedule Management</h2>
          <p className={styles.subtitle}>
            Manage conference sessions and schedule.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.refreshButton}
            onClick={fetchSessions}
            disabled={isLoading}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
          <button className={styles.addButton} onClick={handleAddSession}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Session
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className={styles.errorBanner} role="alert">
          {error}
          <button onClick={() => setError(null)} aria-label="Dismiss error">
            &times;
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>Total Sessions</div>
        </div>
        <div className={`${styles.statCard} ${styles.statPublished}`}>
          <div className={styles.statValue}>{stats.published}</div>
          <div className={styles.statLabel}>Published</div>
        </div>
        <div className={`${styles.statCard} ${styles.statDraft}`}>
          <div className={styles.statValue}>{stats.draft}</div>
          <div className={styles.statLabel}>Draft</div>
        </div>
        <div className={`${styles.statCard} ${styles.statWorkshops}`}>
          <div className={styles.statValue}>{stats.workshops}</div>
          <div className={styles.statLabel}>Workshops</div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchWrapper}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className={styles.clearSearch}
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              &times;
            </button>
          )}
        </div>
        <select
          className={styles.filterSelect}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All Types</option>
          {Object.entries(SESSION_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Session Table */}
      <SessionTable
        sessions={filteredSessions}
        onEdit={handleEditSession}
        onDelete={handleDeleteSession}
        onToggleStatus={handleToggleStatus}
        isLoading={isLoading}
      />

      {/* Session Form Modal */}
      <SessionFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSession(null);
        }}
        onSave={handleSaveSession}
        session={editingSession}
      />
    </AdminLayout>
  );
}

export default AdminSchedulePage;
