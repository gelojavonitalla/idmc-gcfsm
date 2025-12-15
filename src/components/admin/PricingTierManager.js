/**
 * PricingTierManager Component
 * Manages pricing tiers for the conference.
 *
 * @module components/admin/PricingTierManager
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './PricingTierManager.module.css';

/**
 * PricingTierManager Component
 *
 * @param {Object} props - Component props
 * @param {Array} props.tiers - Array of pricing tiers
 * @param {Function} props.onCreate - Callback to create a tier
 * @param {Function} props.onUpdate - Callback to update a tier
 * @param {Function} props.onDelete - Callback to delete a tier
 * @param {boolean} props.isLoading - Loading state
 * @returns {JSX.Element} The pricing tier manager
 */
function PricingTierManager({ tiers, onCreate, onUpdate, onDelete, isLoading }) {
  const [editingTier, setEditingTier] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const emptyTier = {
    name: '',
    regularPrice: '',
    studentPrice: '',
    startDate: '',
    endDate: '',
    isActive: true,
  };

  /**
   * Handles creating a new tier
   *
   * @param {Object} tierData - Tier data to create
   */
  const handleCreate = async (tierData) => {
    setIsSaving(true);
    setError(null);
    try {
      await onCreate(tierData);
      setIsCreating(false);
    } catch (err) {
      setError(err.message || 'Failed to create pricing tier');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handles updating an existing tier
   *
   * @param {string} tierId - Tier ID
   * @param {Object} tierData - Updated tier data
   */
  const handleUpdate = async (tierId, tierData) => {
    setIsSaving(true);
    setError(null);
    try {
      await onUpdate(tierId, tierData);
      setEditingTier(null);
    } catch (err) {
      setError(err.message || 'Failed to update pricing tier');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handles deleting a tier
   *
   * @param {string} tierId - Tier ID to delete
   */
  const handleDelete = async (tierId) => {
    if (!window.confirm('Are you sure you want to delete this pricing tier?')) {
      return;
    }

    setError(null);
    try {
      await onDelete(tierId);
    } catch (err) {
      setError(err.message || 'Failed to delete pricing tier');
    }
  };

  /**
   * Formats price for display
   *
   * @param {number} price - Price value
   * @returns {string} Formatted price
   */
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(price);
  };

  /**
   * Formats date for display
   *
   * @param {string} dateString - Date string
   * @returns {string} Formatted date
   */
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  /**
   * Checks if a tier is currently active based on dates
   *
   * @param {Object} tier - Tier to check
   * @returns {boolean} Whether tier is currently active
   */
  const isCurrentlyActive = (tier) => {
    if (!tier.isActive) return false;
    const now = new Date();
    const start = new Date(tier.startDate);
    const end = new Date(tier.endDate);
    end.setHours(23, 59, 59, 999);
    return now >= start && now <= end;
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Pricing Tiers</h3>
        </div>
        <div className={styles.skeleton} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Pricing Tiers</h3>
        {!isCreating && (
          <button
            className={styles.addButton}
            onClick={() => setIsCreating(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Tier
          </button>
        )}
      </div>

      {error && (
        <div className={styles.errorMessage} role="alert">
          {error}
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss">
            &times;
          </button>
        </div>
      )}

      {/* Create New Tier Form */}
      {isCreating && (
        <TierForm
          tier={emptyTier}
          onSave={handleCreate}
          onCancel={() => setIsCreating(false)}
          isSaving={isSaving}
          isNew
        />
      )}

      {/* Existing Tiers */}
      <div className={styles.tierList}>
        {tiers.length === 0 && !isCreating ? (
          <div className={styles.emptyState}>
            <p>No pricing tiers configured.</p>
            <p>Click &quot;Add Tier&quot; to create one.</p>
          </div>
        ) : (
          tiers.map((tier) => (
            <div key={tier.id} className={styles.tierCard}>
              {editingTier === tier.id ? (
                <TierForm
                  tier={tier}
                  onSave={(data) => handleUpdate(tier.id, data)}
                  onCancel={() => setEditingTier(null)}
                  isSaving={isSaving}
                />
              ) : (
                <>
                  <div className={styles.tierHeader}>
                    <div className={styles.tierName}>
                      {tier.name}
                      {isCurrentlyActive(tier) && (
                        <span className={styles.activeBadge}>Active</span>
                      )}
                      {!tier.isActive && (
                        <span className={styles.inactiveBadge}>Disabled</span>
                      )}
                    </div>
                    <div className={styles.tierActions}>
                      <button
                        className={styles.editButton}
                        onClick={() => setEditingTier(tier.id)}
                        aria-label="Edit tier"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDelete(tier.id)}
                        aria-label="Delete tier"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className={styles.tierDetails}>
                    <div className={styles.priceRow}>
                      <span className={styles.priceLabel}>Regular:</span>
                      <span className={styles.priceValue}>
                        {formatPrice(tier.regularPrice)}
                      </span>
                    </div>
                    <div className={styles.priceRow}>
                      <span className={styles.priceLabel}>Student/Senior:</span>
                      <span className={styles.priceValue}>
                        {formatPrice(tier.studentPrice)}
                      </span>
                    </div>
                    <div className={styles.dateRow}>
                      <span className={styles.dateLabel}>Period:</span>
                      <span className={styles.dateValue}>
                        {formatDate(tier.startDate)} - {formatDate(tier.endDate)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * TierForm Component
 * Form for creating/editing a pricing tier.
 *
 * @param {Object} props - Component props
 */
function TierForm({ tier, onSave, onCancel, isSaving, isNew }) {
  const [formData, setFormData] = useState({
    name: tier.name || '',
    regularPrice: tier.regularPrice || '',
    studentPrice: tier.studentPrice || '',
    startDate: tier.startDate || '',
    endDate: tier.endDate || '',
    isActive: tier.isActive ?? true,
  });

  /**
   * Handles input changes
   *
   * @param {Event} event - Change event
   */
  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  /**
   * Handles form submission
   *
   * @param {Event} event - Submit event
   */
  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(formData);
  };

  return (
    <form className={styles.tierForm} onSubmit={handleSubmit}>
      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label htmlFor="tierName" className={styles.formLabel}>
            Tier Name
          </label>
          <input
            type="text"
            id="tierName"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={styles.formInput}
            placeholder="e.g., Early Bird"
            required
          />
        </div>
        <div className={styles.formField}>
          <label className={styles.checkboxLabelInline}>
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className={styles.checkbox}
            />
            <span>Enabled</span>
          </label>
        </div>
        <div className={styles.formField}>
          <label htmlFor="regularPrice" className={styles.formLabel}>
            Regular Price (PHP)
          </label>
          <input
            type="number"
            id="regularPrice"
            name="regularPrice"
            value={formData.regularPrice}
            onChange={handleChange}
            className={styles.formInput}
            placeholder="500"
            min="0"
            step="0.01"
            required
          />
        </div>
        <div className={styles.formField}>
          <label htmlFor="studentPrice" className={styles.formLabel}>
            Student/Senior Price (PHP)
          </label>
          <input
            type="number"
            id="studentPrice"
            name="studentPrice"
            value={formData.studentPrice}
            onChange={handleChange}
            className={styles.formInput}
            placeholder="300"
            min="0"
            step="0.01"
            required
          />
        </div>
        <div className={styles.formField}>
          <label htmlFor="startDate" className={styles.formLabel}>
            Start Date
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className={styles.formInput}
            required
          />
        </div>
        <div className={styles.formField}>
          <label htmlFor="endDate" className={styles.formLabel}>
            End Date
          </label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            className={styles.formInput}
            required
          />
        </div>
      </div>
      <div className={styles.formActions}>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={styles.saveButton}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : isNew ? 'Create Tier' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

TierForm.propTypes = {
  tier: PropTypes.shape({
    name: PropTypes.string,
    regularPrice: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    studentPrice: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    isActive: PropTypes.bool,
  }).isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isSaving: PropTypes.bool,
  isNew: PropTypes.bool,
};

TierForm.defaultProps = {
  isSaving: false,
  isNew: false,
};

PricingTierManager.propTypes = {
  tiers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      regularPrice: PropTypes.number.isRequired,
      studentPrice: PropTypes.number.isRequired,
      startDate: PropTypes.string.isRequired,
      endDate: PropTypes.string.isRequired,
      isActive: PropTypes.bool,
    })
  ),
  onCreate: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

PricingTierManager.defaultProps = {
  tiers: [],
  isLoading: false,
};

export default PricingTierManager;
