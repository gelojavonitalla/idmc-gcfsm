/**
 * AdminFoodMenuPage Component
 * Food menu management page for admins.
 * Allows managing food options and toggling food selection availability.
 *
 * @module pages/admin/AdminFoodMenuPage
 */

import { useState, useEffect, useCallback } from 'react';
import {
  AdminLayout,
  FoodMenuTable,
  FoodItemFormModal,
} from '../../components/admin';
import {
  getAllFoodMenuItems,
  saveFoodMenuItem,
  updateFoodMenuItem,
  deleteFoodMenuItem,
  getFoodMenuSettings,
  updateFoodMenuSettings,
} from '../../services/foodMenu';
import { useAdminAuth } from '../../context';
import { FOOD_MENU_STATUS } from '../../constants';
import styles from './AdminFoodMenuPage.module.css';

/**
 * AdminFoodMenuPage Component
 *
 * @returns {JSX.Element} The admin food menu page
 */
function AdminFoodMenuPage() {
  const { admin } = useAdminAuth();
  const [foodItems, setFoodItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [foodSelectionEnabled, setFoodSelectionEnabled] = useState(false);
  const [isTogglingEnabled, setIsTogglingEnabled] = useState(false);

  /**
   * Fetches all food menu items and settings
   */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [items, settings] = await Promise.all([
        getAllFoodMenuItems(),
        getFoodMenuSettings(),
      ]);
      setFoodItems(items);
      setFoodSelectionEnabled(settings.foodSelectionEnabled || false);
    } catch (fetchError) {
      console.error('Failed to fetch food menu data:', fetchError);
      setError('Failed to load food menu. Please try again.');
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
   * Handles toggling food selection enabled/disabled
   */
  const handleToggleFoodSelection = async () => {
    setIsTogglingEnabled(true);
    try {
      const newValue = !foodSelectionEnabled;
      await updateFoodMenuSettings(
        { foodSelectionEnabled: newValue },
        admin?.id,
        admin?.email
      );
      setFoodSelectionEnabled(newValue);
    } catch (err) {
      console.error('Failed to update food selection setting:', err);
      setError('Failed to update setting. Please try again.');
    } finally {
      setIsTogglingEnabled(false);
    }
  };

  /**
   * Handles opening modal for new food item
   */
  const handleAddItem = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  /**
   * Handles opening modal for editing food item
   *
   * @param {Object} item - Food item to edit
   */
  const handleEditItem = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  /**
   * Handles saving a food item (create or update)
   *
   * @param {string} itemId - Food item ID
   * @param {Object} itemData - Food item data
   */
  const handleSaveItem = async (itemId, itemData) => {
    await saveFoodMenuItem(itemId, itemData, admin?.id, admin?.email);
    await fetchData();
  };

  /**
   * Handles deleting a food item
   *
   * @param {string} itemId - Food item ID to delete
   */
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this food option?')) {
      return;
    }

    try {
      await deleteFoodMenuItem(itemId, admin?.id, admin?.email);
      setFoodItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (err) {
      console.error('Failed to delete food item:', err);
      setError('Failed to delete food option. Please try again.');
    }
  };

  /**
   * Handles toggling food item status (publish/draft)
   *
   * @param {string} itemId - Food item ID
   */
  const handleToggleStatus = async (itemId) => {
    const item = foodItems.find((i) => i.id === itemId);
    if (!item) return;

    const newStatus =
      item.status === FOOD_MENU_STATUS.PUBLISHED
        ? FOOD_MENU_STATUS.DRAFT
        : FOOD_MENU_STATUS.PUBLISHED;

    try {
      await updateFoodMenuItem(itemId, { status: newStatus }, admin?.id, admin?.email);
      setFoodItems((prev) =>
        prev.map((i) =>
          i.id === itemId ? { ...i, status: newStatus } : i
        )
      );
    } catch (err) {
      console.error('Failed to update food item status:', err);
      setError('Failed to update status. Please try again.');
    }
  };

  /**
   * Gets food menu statistics
   */
  const getStats = () => {
    const total = foodItems.length;
    const published = foodItems.filter(
      (item) => item.status === FOOD_MENU_STATUS.PUBLISHED
    ).length;
    const draft = foodItems.filter(
      (item) => item.status === FOOD_MENU_STATUS.DRAFT
    ).length;

    return { total, published, draft };
  };

  const stats = getStats();

  return (
    <AdminLayout title="Food Menu">
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Food Menu</h2>
          <p className={styles.subtitle}>
            Manage food options for conference attendees.
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
            Add Food Option
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

      {/* Food Selection Toggle */}
      <div className={styles.toggleSection}>
        <div className={styles.toggleInfo}>
          <h3 className={styles.toggleTitle}>Food Selection</h3>
          <p className={styles.toggleDescription}>
            When enabled, attendees can select their food preference during registration.
          </p>
        </div>
        <label className={styles.toggleSwitch}>
          <input
            type="checkbox"
            checked={foodSelectionEnabled}
            onChange={handleToggleFoodSelection}
            disabled={isTogglingEnabled}
          />
          <span className={styles.toggleSlider}></span>
          <span className={styles.toggleLabel}>
            {foodSelectionEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </label>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>Total Options</div>
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

      {/* Food Menu Table */}
      <FoodMenuTable
        items={foodItems}
        onEdit={handleEditItem}
        onDelete={handleDeleteItem}
        onToggleStatus={handleToggleStatus}
        isLoading={isLoading}
      />

      {/* Food Item Form Modal */}
      <FoodItemFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        foodItem={editingItem}
      />
    </AdminLayout>
  );
}

export default AdminFoodMenuPage;
