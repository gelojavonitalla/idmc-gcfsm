/**
 * AdminInquiriesPage Component
 * Contact inquiries management page for admins.
 *
 * @module pages/admin/AdminInquiriesPage
 */

import { useState, useEffect, useCallback } from 'react';
import {
  AdminLayout,
  InquiriesTable,
  InquiryDetailModal,
} from '../../components/admin';
import {
  getAllContactInquiries,
  updateContactInquiryStatus,
  deleteContactInquiry,
} from '../../services/contactInquiries';
import { useAdminAuth } from '../../context';
import { CONTACT_INQUIRY_STATUS } from '../../constants';
import styles from './AdminInquiriesPage.module.css';

/**
 * AdminInquiriesPage Component
 *
 * @returns {JSX.Element} The admin inquiries page
 */
function AdminInquiriesPage() {
  const { admin } = useAdminAuth();
  const [inquiries, setInquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  /**
   * Fetches all inquiries
   */
  const fetchInquiries = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getAllContactInquiries();
      setInquiries(data);
    } catch (fetchError) {
      console.error('Failed to fetch inquiries:', fetchError);
      setError('Failed to load inquiries. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch inquiries on mount
   */
  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  /**
   * Handles viewing an inquiry
   *
   * @param {Object} inquiry - Inquiry to view
   */
  const handleViewInquiry = useCallback(async (inquiry) => {
    setSelectedInquiry(inquiry);
    setIsModalOpen(true);

    // Auto-mark as read if it's new
    if (inquiry.status === CONTACT_INQUIRY_STATUS.NEW) {
      try {
        await updateContactInquiryStatus(inquiry.id, CONTACT_INQUIRY_STATUS.READ, admin?.id, admin?.email);
        setInquiries((prev) =>
          prev.map((inq) =>
            inq.id === inquiry.id
              ? { ...inq, status: CONTACT_INQUIRY_STATUS.READ }
              : inq
          )
        );
        setSelectedInquiry((prev) =>
          prev ? { ...prev, status: CONTACT_INQUIRY_STATUS.READ } : null
        );
      } catch (err) {
        console.error('Failed to update inquiry status:', err);
      }
    }
  }, [admin]);

  /**
   * Handles updating inquiry status
   *
   * @param {string} inquiryId - Inquiry ID
   * @param {string} status - New status
   */
  const handleUpdateStatus = useCallback(async (inquiryId, status) => {
    try {
      await updateContactInquiryStatus(inquiryId, status, admin?.id, admin?.email);
      setInquiries((prev) =>
        prev.map((inq) =>
          inq.id === inquiryId ? { ...inq, status } : inq
        )
      );
      // Update modal view if open
      setSelectedInquiry((prev) =>
        prev && prev.id === inquiryId ? { ...prev, status } : prev
      );
    } catch (err) {
      console.error('Failed to update inquiry status:', err);
      setError('Failed to update status. Please try again.');
    }
  }, [admin]);

  /**
   * Handles deleting an inquiry
   *
   * @param {string} inquiryId - Inquiry ID to delete
   * @param {string} name - Sender name for confirmation
   */
  const handleDeleteInquiry = useCallback(async (inquiryId, name) => {
    if (!window.confirm(`Are you sure you want to delete the inquiry from "${name}"?`)) {
      return;
    }

    try {
      await deleteContactInquiry(inquiryId, admin?.id, admin?.email);
      setInquiries((prev) => prev.filter((inq) => inq.id !== inquiryId));
    } catch (err) {
      console.error('Failed to delete inquiry:', err);
      setError('Failed to delete inquiry. Please try again.');
    }
  }, [admin]);

  /**
   * Closes the detail modal
   */
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedInquiry(null);
  }, []);

  /**
   * Gets inquiry statistics
   */
  const getStats = () => {
    const total = inquiries.length;
    const newCount = inquiries.filter(
      (inq) => inq.status === CONTACT_INQUIRY_STATUS.NEW
    ).length;
    const readCount = inquiries.filter(
      (inq) => inq.status === CONTACT_INQUIRY_STATUS.READ
    ).length;
    const repliedCount = inquiries.filter(
      (inq) => inq.status === CONTACT_INQUIRY_STATUS.REPLIED
    ).length;

    return { total, newCount, readCount, repliedCount };
  };

  /**
   * Filters inquiries based on search query and status filter
   */
  const filteredInquiries = inquiries.filter((inquiry) => {
    const matchesSearch =
      !searchQuery ||
      inquiry.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.subject?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = !statusFilter || inquiry.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = getStats();

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Contact Inquiries</h2>
          <p className={styles.subtitle}>
            View and manage contact form submissions.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.refreshButton}
            onClick={fetchInquiries}
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

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>Total Inquiries</div>
        </div>
        <div className={`${styles.statCard} ${styles.statNew}`}>
          <div className={styles.statValue}>{stats.newCount}</div>
          <div className={styles.statLabel}>New</div>
        </div>
        <div className={`${styles.statCard} ${styles.statRead}`}>
          <div className={styles.statValue}>{stats.readCount}</div>
          <div className={styles.statLabel}>Read</div>
        </div>
        <div className={`${styles.statCard} ${styles.statReplied}`}>
          <div className={styles.statValue}>{stats.repliedCount}</div>
          <div className={styles.statLabel}>Replied</div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className={styles.filterContainer}>
        <div className={styles.searchWrapper}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by name, email, or subject..."
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
          className={styles.statusSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value={CONTACT_INQUIRY_STATUS.NEW}>New ({stats.newCount})</option>
          <option value={CONTACT_INQUIRY_STATUS.READ}>Read ({stats.readCount})</option>
          <option value={CONTACT_INQUIRY_STATUS.REPLIED}>Replied ({stats.repliedCount})</option>
        </select>
      </div>

      {/* Inquiries Table */}
      <InquiriesTable
        inquiries={filteredInquiries}
        onView={handleViewInquiry}
        onUpdateStatus={handleUpdateStatus}
        onDelete={handleDeleteInquiry}
        isLoading={isLoading}
      />

      {/* Inquiry Detail Modal */}
      <InquiryDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        inquiry={selectedInquiry}
        onUpdateStatus={handleUpdateStatus}
      />
    </AdminLayout>
  );
}

export default AdminInquiriesPage;
