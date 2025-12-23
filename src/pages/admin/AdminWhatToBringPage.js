/**
 * AdminWhatToBringPage Component
 * "What to Bring" checklist management page for admins.
 * Allows managing items that attendees should bring to the event.
 * These items are displayed in confirmation emails and registration success pages.
 *
 * @module pages/admin/AdminWhatToBringPage
 */

import { useState, useEffect, useCallback } from 'react';
import {
  AdminLayout,
  WhatToBringTable,
  WhatToBringItemFormModal,
} from '../../components/admin';
import {
  getAllWhatToBringItems,
  saveWhatToBringItem,
  updateWhatToBringItem,
  deleteWhatToBringItem,
} from '../../services/whatToBring';
import { useAdminAuth } from '../../context';
import { WHAT_TO_BRING_STATUS } from '../../constants';
import styles from './AdminWhatToBringPage.module.css';

/**
 * AdminWhatToBringPage Component
 *
 * @returns {JSX.Element} The admin what to bring page
 */
function AdminWhatToBringPage() {
  const { admin } = useAdminAuth();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  /**
   * Fetches all what to bring items
   */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const fetchedItems = await getAllWhatToBringItems();
      setItems(fetchedItems);
    } catch (fetchError) {
      console.error('Failed to fetch what to bring items:', fetchError);
      setError('Failed to load checklist items. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch data on mount
   */
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Handles opening modal for new item
   */
  const handleAddItem = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  /**
   * Handles opening modal for editing item
   *
   * @param {Object} item - Item to edit
   */
  const handleEditItem = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  /**
   * Handles saving an item (create or update)
   *
   * @param {string} itemId - Item ID
   * @param {Object} itemData - Item data
   */
  const handleSaveItem = async (itemId, itemData) => {
    await saveWhatToBringItem(itemId, itemData, admin?.id, admin?.email);
    await fetchData();
  };

  /**
   * Handles deleting an item
   *
   * @param {string} itemId - Item ID to delete
   */
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this checklist item?')) {
      return;
    }

    try {
      await deleteWhatToBringItem(itemId, admin?.id, admin?.email);
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (err) {
      console.error('Failed to delete item:', err);
      setError('Failed to delete checklist item. Please try again.');
    }
  };

  /**
   * Handles toggling item status (publish/draft)
   *
   * @param {string} itemId - Item ID
   */
  const handleToggleStatus = async (itemId) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const newStatus =
      item.status === WHAT_TO_BRING_STATUS.PUBLISHED
        ? WHAT_TO_BRING_STATUS.DRAFT
        : WHAT_TO_BRING_STATUS.PUBLISHED;

    try {
      await updateWhatToBringItem(itemId, { status: newStatus }, admin?.id, admin?.email);
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId ? { ...i, status: newStatus } : i
        )
      );
    } catch (err) {
      console.error('Failed to update item status:', err);
      setError('Failed to update status. Please try again.');
    }
  };

  /**
   * Gets item statistics
   */
  const getStats = () => {
    const total = items.length;
    const published = items.filter(
      (item) => item.status === WHAT_TO_BRING_STATUS.PUBLISHED
    ).length;
    const draft = items.filter(
      (item) => item.status === WHAT_TO_BRING_STATUS.DRAFT
    ).length;

    return { total, published, draft };
  };

  const stats = getStats();

  return (
    <AdminLayout title="What to Bring">
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>What to Bring</h2>
          <p className={styles.subtitle}>
            Manage items that attendees should bring to the event. These appear in confirmation emails and registration success.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.refreshButton}
            onClick={fetchData}
            disabled={isLoading}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
          <button className={styles.addButton} onClick={handleAddItem}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Item
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

      {/* Info Banner */}
      <div className={styles.infoBanner}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <p>
          Only <strong>Published</strong> items will appear in confirmation emails and registration success pages.
        </p>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>Total Items</div>
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

      {/* What to Bring Table */}
      <WhatToBringTable
        items={items}
        onEdit={handleEditItem}
        onDelete={handleDeleteItem}
        onToggleStatus={handleToggleStatus}
        isLoading={isLoading}
      />

      {/* What to Bring Item Form Modal */}
      <WhatToBringItemFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        item={editingItem}
      />
    </AdminLayout>
  );
}

export default AdminWhatToBringPage;
