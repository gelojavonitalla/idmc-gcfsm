/**
 * AdminSpeakersPage Component
 * Speaker management page for admins.
 *
 * @module pages/admin/AdminSpeakersPage
 */

import { useState, useEffect, useCallback } from 'react';
import {
  AdminLayout,
  SpeakerTable,
  SpeakerFormModal,
} from '../../components/admin';
import {
  getAllSpeakers,
  saveSpeaker,
  updateSpeaker,
  deleteSpeaker,
} from '../../services/maintenance';
import { useAdminAuth } from '../../context';
import { SPEAKER_STATUS } from '../../constants';
import styles from './AdminSpeakersPage.module.css';

/**
 * AdminSpeakersPage Component
 *
 * @returns {JSX.Element} The admin speakers page
 */
function AdminSpeakersPage() {
  const { admin } = useAdminAuth();
  const [speakers, setSpeakers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isReordering, setIsReordering] = useState(false);

  /**
   * Fetches all speakers
   */
  const fetchSpeakers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getAllSpeakers();
      setSpeakers(data);
    } catch (fetchError) {
      console.error('Failed to fetch speakers:', fetchError);
      setError('Failed to load speakers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch speakers on mount
   */
  useEffect(() => {
    fetchSpeakers();
  }, [fetchSpeakers]);

  /**
   * Handles opening modal for new speaker
   */
  const handleAddSpeaker = () => {
    setEditingSpeaker(null);
    setIsModalOpen(true);
  };

  /**
   * Handles opening modal for editing speaker
   *
   * @param {Object} speaker - Speaker to edit
   */
  const handleEditSpeaker = (speaker) => {
    setEditingSpeaker(speaker);
    setIsModalOpen(true);
  };

  /**
   * Handles saving a speaker (create or update)
   *
   * @param {string} speakerId - Speaker ID
   * @param {Object} speakerData - Speaker data
   */
  const handleSaveSpeaker = async (speakerId, speakerData) => {
    await saveSpeaker(speakerId, speakerData, admin?.id, admin?.email);
    await fetchSpeakers();
  };

  /**
   * Handles deleting a speaker
   *
   * @param {string} speakerId - Speaker ID to delete
   */
  const handleDeleteSpeaker = async (speakerId) => {
    if (!window.confirm('Are you sure you want to delete this speaker?')) {
      return;
    }

    try {
      await deleteSpeaker(speakerId, admin?.id, admin?.email);
      setSpeakers((prev) => prev.filter((s) => s.id !== speakerId));
    } catch (err) {
      console.error('Failed to delete speaker:', err);
      setError('Failed to delete speaker. Please try again.');
    }
  };

  /**
   * Handles toggling speaker status (publish/draft)
   *
   * @param {string} speakerId - Speaker ID
   */
  const handleToggleStatus = async (speakerId) => {
    const speaker = speakers.find((s) => s.id === speakerId);
    if (!speaker) return;

    const newStatus =
      speaker.status === SPEAKER_STATUS.PUBLISHED
        ? SPEAKER_STATUS.DRAFT
        : SPEAKER_STATUS.PUBLISHED;

    try {
      await updateSpeaker(speakerId, { status: newStatus }, admin?.id, admin?.email);
      setSpeakers((prev) =>
        prev.map((s) =>
          s.id === speakerId ? { ...s, status: newStatus } : s
        )
      );
    } catch (err) {
      console.error('Failed to update speaker status:', err);
      setError('Failed to update speaker status. Please try again.');
    }
  };

  /**
   * Handles reordering speakers via drag and drop
   *
   * @param {Array} newOrder - Speakers in new order
   */
  const handleReorder = useCallback(async (newOrder) => {
    setIsReordering(true);
    setError(null);

    // Optimistically update UI
    const previousSpeakers = speakers;
    setSpeakers(newOrder);

    try {
      // Update each speaker's order in Firestore
      const updatePromises = newOrder.map((speaker, index) =>
        updateSpeaker(speaker.id, { order: index + 1 }, admin?.id, admin?.email)
      );
      await Promise.all(updatePromises);
    } catch (err) {
      console.error('Failed to reorder speakers:', err);
      setError('Failed to save new order. Please try again.');
      // Rollback on error
      setSpeakers(previousSpeakers);
    } finally {
      setIsReordering(false);
    }
  }, [speakers, admin]);

  /**
   * Gets speaker statistics
   */
  const getStats = () => {
    const total = speakers.length;
    const published = speakers.filter(
      (s) => s.status === SPEAKER_STATUS.PUBLISHED
    ).length;
    const draft = speakers.filter(
      (s) => s.status === SPEAKER_STATUS.DRAFT
    ).length;
    const featured = speakers.filter((s) => s.featured).length;

    return { total, published, draft, featured };
  };

  /**
   * Filters speakers based on search query
   */
  const filteredSpeakers = speakers.filter((speaker) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      speaker.name?.toLowerCase().includes(query) ||
      speaker.title?.toLowerCase().includes(query) ||
      speaker.organization?.toLowerCase().includes(query)
    );
  });

  const stats = getStats();

  return (
    <AdminLayout title="Speaker Management">
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Speaker Management</h2>
          <p className={styles.subtitle}>
            Manage conference speakers and their profiles.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.refreshButton}
            onClick={fetchSpeakers}
            disabled={isLoading}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
          <button className={styles.addButton} onClick={handleAddSpeaker}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Speaker
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
          <div className={styles.statLabel}>Total Speakers</div>
        </div>
        <div className={`${styles.statCard} ${styles.statPublished}`}>
          <div className={styles.statValue}>{stats.published}</div>
          <div className={styles.statLabel}>Published</div>
        </div>
        <div className={`${styles.statCard} ${styles.statDraft}`}>
          <div className={styles.statValue}>{stats.draft}</div>
          <div className={styles.statLabel}>Draft</div>
        </div>
        <div className={`${styles.statCard} ${styles.statFeatured}`}>
          <div className={styles.statValue}>{stats.featured}</div>
          <div className={styles.statLabel}>Featured</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className={styles.searchContainer}>
        <div className={styles.searchWrapper}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search speakers by name, title, or organization..."
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
      </div>

      {/* Speaker Table */}
      <SpeakerTable
        speakers={filteredSpeakers}
        onEdit={handleEditSpeaker}
        onDelete={handleDeleteSpeaker}
        onToggleStatus={handleToggleStatus}
        onReorder={!searchQuery ? handleReorder : null}
        isLoading={isLoading}
        isReordering={isReordering}
      />

      {/* Speaker Form Modal */}
      <SpeakerFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSpeaker(null);
        }}
        onSave={handleSaveSpeaker}
        speaker={editingSpeaker}
      />
    </AdminLayout>
  );
}

export default AdminSpeakersPage;
