/**
 * AdminFAQPage Component
 * FAQ management page for admins.
 *
 * @module pages/admin/AdminFAQPage
 */

import { useState, useEffect, useCallback } from 'react';
import {
  AdminLayout,
  FAQTable,
  FAQFormModal,
} from '../../components/admin';
import {
  getAllFAQs,
  saveFAQ,
  updateFAQ,
  deleteFAQ,
} from '../../services/maintenance';
import { FAQ_STATUS, FAQ_CATEGORIES, FAQ_CATEGORY_LABELS } from '../../constants';
import styles from './AdminFAQPage.module.css';

/**
 * AdminFAQPage Component
 *
 * @returns {JSX.Element} The admin FAQ page
 */
function AdminFAQPage() {
  const [faqs, setFaqs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  /**
   * Fetches all FAQs
   */
  const fetchFaqs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getAllFAQs();
      setFaqs(data);
    } catch (fetchError) {
      console.error('Failed to fetch FAQs:', fetchError);
      setError('Failed to load FAQs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch FAQs on mount
   */
  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  /**
   * Handles opening modal for new FAQ
   */
  const handleAddFaq = () => {
    setEditingFaq(null);
    setIsModalOpen(true);
  };

  /**
   * Handles opening modal for editing FAQ
   *
   * @param {Object} faq - FAQ to edit
   */
  const handleEditFaq = (faq) => {
    setEditingFaq(faq);
    setIsModalOpen(true);
  };

  /**
   * Handles saving an FAQ (create or update)
   *
   * @param {string} faqId - FAQ ID
   * @param {Object} faqData - FAQ data
   */
  const handleSaveFaq = async (faqId, faqData) => {
    await saveFAQ(faqId, faqData);
    await fetchFaqs();
  };

  /**
   * Handles deleting an FAQ
   *
   * @param {string} faqId - FAQ ID to delete
   */
  const handleDeleteFaq = async (faqId) => {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) {
      return;
    }

    try {
      await deleteFAQ(faqId);
      setFaqs((prev) => prev.filter((f) => f.id !== faqId));
    } catch (err) {
      console.error('Failed to delete FAQ:', err);
      setError('Failed to delete FAQ. Please try again.');
    }
  };

  /**
   * Handles toggling FAQ status (publish/draft)
   *
   * @param {string} faqId - FAQ ID
   */
  const handleToggleStatus = async (faqId) => {
    const faq = faqs.find((f) => f.id === faqId);
    if (!faq) return;

    const newStatus =
      faq.status === FAQ_STATUS.PUBLISHED
        ? FAQ_STATUS.DRAFT
        : FAQ_STATUS.PUBLISHED;

    try {
      await updateFAQ(faqId, { status: newStatus });
      setFaqs((prev) =>
        prev.map((f) =>
          f.id === faqId ? { ...f, status: newStatus } : f
        )
      );
    } catch (err) {
      console.error('Failed to update FAQ status:', err);
      setError('Failed to update FAQ status. Please try again.');
    }
  };

  /**
   * Gets FAQ statistics
   */
  const getStats = () => {
    const total = faqs.length;
    const published = faqs.filter(
      (f) => f.status === FAQ_STATUS.PUBLISHED
    ).length;
    const draft = faqs.filter(
      (f) => f.status === FAQ_STATUS.DRAFT
    ).length;

    const categoryCount = {};
    Object.keys(FAQ_CATEGORIES).forEach((key) => {
      const category = FAQ_CATEGORIES[key];
      categoryCount[category] = faqs.filter((f) => f.category === category).length;
    });

    return { total, published, draft, categoryCount };
  };

  /**
   * Filters and sorts FAQs based on search query and category.
   * Sorted by category first, then by order within each category.
   */
  const filteredFaqs = faqs
    .filter((faq) => {
      const matchesSearch = !searchQuery ||
        faq.question?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = !categoryFilter || faq.category === categoryFilter;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const categoryCompare = (a.category || '').localeCompare(b.category || '');
      if (categoryCompare !== 0) return categoryCompare;
      return (a.order || 0) - (b.order || 0);
    });

  const stats = getStats();

  return (
    <AdminLayout title="FAQ Management">
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>FAQ Management</h2>
          <p className={styles.subtitle}>
            Manage frequently asked questions for the conference.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.refreshButton}
            onClick={fetchFaqs}
            disabled={isLoading}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
          <button className={styles.addButton} onClick={handleAddFaq}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add FAQ
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
          <div className={styles.statLabel}>Total FAQs</div>
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
            placeholder="Search FAQs by question or answer..."
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
          className={styles.categorySelect}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {Object.entries(FAQ_CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label} ({stats.categoryCount[value] || 0})
            </option>
          ))}
        </select>
      </div>

      {/* FAQ Table */}
      <FAQTable
        faqs={filteredFaqs}
        onEdit={handleEditFaq}
        onDelete={handleDeleteFaq}
        onToggleStatus={handleToggleStatus}
        isLoading={isLoading}
      />

      {/* FAQ Form Modal */}
      <FAQFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingFaq(null);
        }}
        onSave={handleSaveFaq}
        faq={editingFaq}
      />
    </AdminLayout>
  );
}

export default AdminFAQPage;
