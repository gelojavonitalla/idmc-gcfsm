/**
 * AdminDownloadsPage Component
 * Downloads management page for admins.
 *
 * @module pages/admin/AdminDownloadsPage
 */

import { useState, useEffect, useCallback } from 'react';
import {
  AdminLayout,
  DownloadsTable,
  DownloadFormModal,
} from '../../components/admin';
import {
  getAllDownloads,
  saveDownload,
  updateDownload,
  deleteDownload,
} from '../../services/downloads';
import { deleteFile } from '../../services/storage';
import { DOWNLOAD_STATUS } from '../../constants';
import styles from './AdminDownloadsPage.module.css';

/**
 * AdminDownloadsPage Component
 *
 * @returns {JSX.Element} The admin downloads page
 */
function AdminDownloadsPage() {
  const [downloads, setDownloads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDownload, setEditingDownload] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Fetches all downloads
   */
  const fetchDownloads = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getAllDownloads();
      setDownloads(data);
    } catch (fetchError) {
      console.error('Failed to fetch downloads:', fetchError);
      setError('Failed to load downloads. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch downloads on mount
   */
  useEffect(() => {
    fetchDownloads();
  }, [fetchDownloads]);

  /**
   * Handles opening modal for new download
   */
  const handleAddDownload = () => {
    setEditingDownload(null);
    setIsModalOpen(true);
  };

  /**
   * Handles opening modal for editing download
   *
   * @param {Object} download - Download to edit
   */
  const handleEditDownload = (download) => {
    setEditingDownload(download);
    setIsModalOpen(true);
  };

  /**
   * Handles saving a download (create or update)
   *
   * @param {string} downloadId - Download ID
   * @param {Object} downloadData - Download data
   */
  const handleSaveDownload = async (downloadId, downloadData) => {
    await saveDownload(downloadId, downloadData);
    await fetchDownloads();
  };

  /**
   * Handles deleting a download
   *
   * @param {string} downloadId - Download ID to delete
   * @param {string} downloadTitle - Download title for confirmation
   */
  const handleDeleteDownload = async (downloadId, downloadTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${downloadTitle}"?`)) {
      return;
    }

    try {
      // Find the download to get the file URL
      const download = downloads.find((d) => d.id === downloadId);

      // Delete the file from storage if it exists
      if (download?.downloadUrl) {
        try {
          await deleteFile(download.downloadUrl);
        } catch {
          // Ignore delete errors for storage
        }
      }

      await deleteDownload(downloadId);
      setDownloads((prev) => prev.filter((d) => d.id !== downloadId));
    } catch (err) {
      console.error('Failed to delete download:', err);
      setError('Failed to delete download. Please try again.');
    }
  };

  /**
   * Handles toggling download status (publish/draft)
   *
   * @param {string} downloadId - Download ID
   */
  const handleToggleStatus = async (downloadId) => {
    const download = downloads.find((d) => d.id === downloadId);
    if (!download) return;

    const newStatus =
      download.status === DOWNLOAD_STATUS.PUBLISHED
        ? DOWNLOAD_STATUS.DRAFT
        : DOWNLOAD_STATUS.PUBLISHED;

    try {
      await updateDownload(downloadId, { status: newStatus });
      setDownloads((prev) =>
        prev.map((d) =>
          d.id === downloadId ? { ...d, status: newStatus } : d
        )
      );
    } catch (err) {
      console.error('Failed to update download status:', err);
      setError('Failed to update download status. Please try again.');
    }
  };

  /**
   * Gets download statistics
   */
  const getStats = () => {
    const total = downloads.length;
    const published = downloads.filter(
      (d) => d.status === DOWNLOAD_STATUS.PUBLISHED
    ).length;
    const draft = downloads.filter(
      (d) => d.status === DOWNLOAD_STATUS.DRAFT
    ).length;

    return { total, published, draft };
  };

  /**
   * Filters downloads based on search query
   */
  const filteredDownloads = downloads.filter((download) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      download.title?.toLowerCase().includes(query) ||
      download.description?.toLowerCase().includes(query) ||
      download.fileName?.toLowerCase().includes(query)
    );
  });

  const stats = getStats();

  return (
    <AdminLayout title="Downloads Management">
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Downloads Management</h2>
          <p className={styles.subtitle}>
            Manage downloadable conference materials and files.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.refreshButton}
            onClick={fetchDownloads}
            disabled={isLoading}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
          <button className={styles.addButton} onClick={handleAddDownload}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Download
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
          <div className={styles.statLabel}>Total Downloads</div>
        </div>
        <div className={`${styles.statCard} ${styles.statPublished}`}>
          <div className={styles.statValue}>{stats.published}</div>
          <div className={styles.statLabel}>Published</div>
        </div>
        <div className={`${styles.statCard} ${styles.statDraft}`}>
          <div className={styles.statValue}>{stats.draft}</div>
          <div className={styles.statLabel}>Draft</div>
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
            placeholder="Search downloads by title, description, or filename..."
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

      {/* Downloads Table */}
      <DownloadsTable
        downloads={filteredDownloads}
        onEdit={handleEditDownload}
        onDelete={handleDeleteDownload}
        onToggleStatus={handleToggleStatus}
        isLoading={isLoading}
      />

      {/* Download Form Modal */}
      <DownloadFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingDownload(null);
        }}
        onSave={handleSaveDownload}
        download={editingDownload}
      />
    </AdminLayout>
  );
}

export default AdminDownloadsPage;
