/**
 * AdminFeedbackResponsesPage Component
 * Feedback responses management page for admins.
 *
 * @module pages/admin/AdminFeedbackResponsesPage
 */

import { useState, useEffect, useCallback } from 'react';
import {
  AdminLayout,
  FeedbackResponsesTable,
  FeedbackResponseDetailModal,
} from '../../components/admin';
import {
  getFeedbackResponses,
  deleteFeedbackResponse,
} from '../../services/feedback';
import styles from './AdminFeedbackResponsesPage.module.css';

/**
 * AdminFeedbackResponsesPage Component
 *
 * @returns {JSX.Element} The admin feedback responses page
 */
function AdminFeedbackResponsesPage() {
  const [responses, setResponses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Fetches all feedback responses
   */
  const fetchResponses = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getFeedbackResponses();
      setResponses(data);
    } catch (fetchError) {
      console.error('Failed to fetch feedback responses:', fetchError);
      setError('Failed to load feedback responses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch responses on mount
   */
  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  /**
   * Handles viewing a response
   *
   * @param {Object} response - Response to view
   */
  const handleViewResponse = useCallback((response) => {
    setSelectedResponse(response);
    setIsModalOpen(true);
  }, []);

  /**
   * Handles deleting a response
   *
   * @param {string} responseId - Response ID to delete
   */
  const handleDeleteResponse = useCallback(async (responseId) => {
    if (!window.confirm('Are you sure you want to delete this feedback response?')) {
      return;
    }

    try {
      await deleteFeedbackResponse(responseId);
      setResponses((prev) => prev.filter((r) => r.id !== responseId));
    } catch (deleteError) {
      console.error('Failed to delete feedback response:', deleteError);
      setError('Failed to delete feedback response. Please try again.');
    }
  }, []);

  /**
   * Handles delete from modal
   *
   * @param {string} responseId - Response ID to delete
   */
  const handleDeleteFromModal = useCallback(async (responseId) => {
    try {
      await deleteFeedbackResponse(responseId);
      setResponses((prev) => prev.filter((r) => r.id !== responseId));
    } catch (deleteError) {
      console.error('Failed to delete feedback response:', deleteError);
      setError('Failed to delete feedback response. Please try again.');
    }
  }, []);

  /**
   * Closes the detail modal
   */
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedResponse(null);
  }, []);

  /**
   * Filters responses based on search query
   */
  const filteredResponses = responses.filter((response) => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();
    return Object.entries(response).some(([key, value]) => {
      if (key === 'id' || key === 'createdAt') return false;
      if (typeof value === 'string') {
        return value.toLowerCase().includes(searchLower);
      }
      if (typeof value === 'object' && value !== null) {
        return Object.keys(value).some((k) =>
          k.toLowerCase().includes(searchLower)
        );
      }
      return false;
    });
  });

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Feedback Responses</h2>
          <p className={styles.subtitle}>
            View and manage feedback form submissions.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.refreshButton}
            onClick={fetchResponses}
            disabled={isLoading}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {isLoading ? 'Loading...' : 'Refresh'}
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

      {/* Stats Card */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{responses.length}</div>
          <div className={styles.statLabel}>Total Responses</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className={styles.filterContainer}>
        <div className={styles.searchWrapper}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search responses..."
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

      {/* Responses Table */}
      <FeedbackResponsesTable
        responses={filteredResponses}
        onView={handleViewResponse}
        onDelete={handleDeleteResponse}
        isLoading={isLoading}
      />

      {/* Response Detail Modal */}
      <FeedbackResponseDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        response={selectedResponse}
        onDelete={handleDeleteFromModal}
      />
    </AdminLayout>
  );
}

export default AdminFeedbackResponsesPage;
