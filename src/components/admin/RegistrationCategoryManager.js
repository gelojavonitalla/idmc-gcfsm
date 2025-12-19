/**
 * RegistrationCategoryManager Component
 * Manages registration categories for the conference.
 *
 * @module components/admin/RegistrationCategoryManager
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './PricingTierManager.module.css'; // Reuse the same styles

/**
 * RegistrationCategoryManager Component
 *
 * @param {Object} props - Component props
 * @param {Array} props.categories - Array of registration categories
 * @param {Function} props.onCreate - Callback to create a category
 * @param {Function} props.onUpdate - Callback to update a category
 * @param {Function} props.onDelete - Callback to delete a category
 * @param {boolean} props.isLoading - Loading state
 * @returns {JSX.Element} The registration category manager
 */
function RegistrationCategoryManager({ categories, onCreate, onUpdate, onDelete, isLoading }) {
  const [editingCategory, setEditingCategory] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const emptyCategory = {
    name: '',
    key: '',
    price: '',
    description: '',
    isActive: true,
    isAdminOnly: false,
    displayOrder: 0,
  };

  /**
   * Handles creating a new category
   *
   * @param {Object} categoryData - Category data to create
   */
  const handleCreate = async (categoryData) => {
    setIsSaving(true);
    setError(null);
    try {
      await onCreate(categoryData);
      setIsCreating(false);
    } catch (err) {
      setError(err.message || 'Failed to create registration category');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handles updating an existing category
   *
   * @param {string} categoryId - Category ID
   * @param {Object} categoryData - Updated category data
   */
  const handleUpdate = async (categoryId, categoryData) => {
    setIsSaving(true);
    setError(null);
    try {
      await onUpdate(categoryId, categoryData);
      setEditingCategory(null);
    } catch (err) {
      setError(err.message || 'Failed to update registration category');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handles deleting a category
   *
   * @param {string} categoryId - Category ID to delete
   */
  const handleDelete = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this registration category?')) {
      return;
    }

    setError(null);
    try {
      await onDelete(categoryId);
    } catch (err) {
      setError(err.message || 'Failed to delete registration category');
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Registration Categories</h2>
        <button
          type="button"
          className={styles.createButton}
          onClick={() => setIsCreating(true)}
          disabled={isCreating || isLoading}
        >
          + Add Category
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {isCreating && (
        <CategoryForm
          category={emptyCategory}
          onSave={handleCreate}
          onCancel={() => setIsCreating(false)}
          isSaving={isSaving}
          existingKeys={categories.map((c) => c.key)}
        />
      )}

      {isLoading ? (
        <div className={styles.loading}>Loading categories...</div>
      ) : categories.length === 0 && !isCreating ? (
        <div className={styles.empty}>
          <p>No registration categories found.</p>
          <p>Click &quot;Add Category&quot; to create one.</p>
        </div>
      ) : (
        <div className={styles.tierList}>
          {categories.map((category) =>
            editingCategory?.id === category.id ? (
              <CategoryForm
                key={category.id}
                category={editingCategory}
                onSave={(data) => handleUpdate(category.id, data)}
                onCancel={() => setEditingCategory(null)}
                isSaving={isSaving}
                existingKeys={categories
                  .filter((c) => c.id !== category.id)
                  .map((c) => c.key)}
              />
            ) : (
              <CategoryCard
                key={category.id}
                category={category}
                onEdit={() => setEditingCategory(category)}
                onDelete={() => handleDelete(category.id)}
                formatPrice={formatPrice}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

RegistrationCategoryManager.propTypes = {
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      key: PropTypes.string.isRequired,
      price: PropTypes.number.isRequired,
      description: PropTypes.string,
      isActive: PropTypes.bool.isRequired,
      isAdminOnly: PropTypes.bool.isRequired,
      displayOrder: PropTypes.number.isRequired,
    })
  ).isRequired,
  onCreate: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

RegistrationCategoryManager.defaultProps = {
  isLoading: false,
};

/**
 * CategoryCard Component
 * Displays a single category card
 */
function CategoryCard({ category, onEdit, onDelete, formatPrice }) {
  return (
    <div className={styles.tierCard}>
      <div className={styles.tierHeader}>
        <div>
          <h3>{category.name}</h3>
          <p className={styles.tierKey}>Key: {category.key}</p>
        </div>
        <div className={styles.tierActions}>
          <button type="button" className={styles.editButton} onClick={onEdit}>
            Edit
          </button>
          <button type="button" className={styles.deleteButton} onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>

      <div className={styles.tierDetails}>
        <div className={styles.tierPrice}>
          <strong>{formatPrice(category.price)}</strong>
        </div>

        {category.description && (
          <div className={styles.tierInfo}>
            <label>Description:</label>
            <p>{category.description}</p>
          </div>
        )}

        <div className={styles.tierMetadata}>
          <span className={category.isActive ? styles.statusActive : styles.statusInactive}>
            {category.isActive ? '✓ Active' : '✗ Inactive'}
          </span>
          {category.isAdminOnly && (
            <span className={styles.statusAdminOnly}>🔒 Admin Only</span>
          )}
          <span className={styles.displayOrder}>Order: {category.displayOrder}</span>
        </div>
      </div>
    </div>
  );
}

CategoryCard.propTypes = {
  category: PropTypes.shape({
    name: PropTypes.string.isRequired,
    key: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    description: PropTypes.string,
    isActive: PropTypes.bool.isRequired,
    isAdminOnly: PropTypes.bool.isRequired,
    displayOrder: PropTypes.number.isRequired,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  formatPrice: PropTypes.func.isRequired,
};

/**
 * CategoryForm Component
 * Form for creating/editing a category
 */
function CategoryForm({ category, onSave, onCancel, isSaving, existingKeys }) {
  const [formData, setFormData] = useState(category);
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.key?.trim()) {
      newErrors.key = 'Key is required';
    } else if (!/^[a-z0-9_]+$/.test(formData.key)) {
      newErrors.key = 'Key must contain only lowercase letters, numbers, and underscores';
    } else if (existingKeys.includes(formData.key)) {
      newErrors.key = 'This key is already in use';
    }

    if (!formData.price && formData.price !== 0) {
      newErrors.price = 'Price is required';
    } else if (formData.price < 0) {
      newErrors.price = 'Price cannot be negative';
    }

    if (!formData.displayOrder && formData.displayOrder !== 0) {
      newErrors.displayOrder = 'Display order is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    onSave(formData);
  };

  return (
    <form className={styles.tierForm} onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label>
          Name <span className={styles.required}>*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="e.g., Regular, VIP, Student"
          disabled={isSaving}
        />
        {errors.name && <span className={styles.error}>{errors.name}</span>}
      </div>

      <div className={styles.formGroup}>
        <label>
          Key <span className={styles.required}>*</span>
        </label>
        <input
          type="text"
          value={formData.key}
          onChange={(e) => handleChange('key', e.target.value.toLowerCase())}
          placeholder="e.g., regular, vip, student_senior"
          disabled={isSaving}
        />
        <small>Unique identifier (lowercase, numbers, underscores only)</small>
        {errors.key && <span className={styles.error}>{errors.key}</span>}
      </div>

      <div className={styles.formGroup}>
        <label>
          Price (PHP) <span className={styles.required}>*</span>
        </label>
        <input
          type="number"
          value={formData.price}
          onChange={(e) => handleChange('price', Number(e.target.value))}
          min="0"
          step="1"
          disabled={isSaving}
        />
        {errors.price && <span className={styles.error}>{errors.price}</span>}
      </div>

      <div className={styles.formGroup}>
        <label>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="e.g., For working professionals and general attendees"
          rows="3"
          disabled={isSaving}
        />
      </div>

      <div className={styles.formGroup}>
        <label>
          Display Order <span className={styles.required}>*</span>
        </label>
        <input
          type="number"
          value={formData.displayOrder}
          onChange={(e) => handleChange('displayOrder', Number(e.target.value))}
          min="0"
          step="1"
          disabled={isSaving}
        />
        <small>Lower numbers appear first</small>
        {errors.displayOrder && <span className={styles.error}>{errors.displayOrder}</span>}
      </div>

      <div className={styles.formGroup}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => handleChange('isActive', e.target.checked)}
            disabled={isSaving}
          />
          Active (visible to users)
        </label>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={formData.isAdminOnly}
            onChange={(e) => handleChange('isAdminOnly', e.target.checked)}
            disabled={isSaving}
          />
          Admin Only (only admins can assign this category)
        </label>
      </div>

      <div className={styles.formActions}>
        <button type="submit" className={styles.saveButton} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

CategoryForm.propTypes = {
  category: PropTypes.shape({
    name: PropTypes.string,
    key: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    description: PropTypes.string,
    isActive: PropTypes.bool,
    isAdminOnly: PropTypes.bool,
    displayOrder: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }).isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isSaving: PropTypes.bool.isRequired,
  existingKeys: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default RegistrationCategoryManager;
