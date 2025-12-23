/**
 * FormFieldEditor Component
 * Modal for creating/editing feedback form fields.
 *
 * @module components/admin/FormFieldEditor
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styles from './FormFieldEditor.module.css';

/**
 * Available field types
 */
const FIELD_TYPES = [
  { value: 'text', label: 'Text (Single Line)' },
  { value: 'textarea', label: 'Text Area (Multi Line)' },
  { value: 'checkbox', label: 'Checkbox (Single)' },
  { value: 'checkboxGroup', label: 'Checkbox Group (Multiple Options)' },
  { value: 'radio', label: 'Radio (Single Selection)' },
];

/**
 * Initial field state
 */
const INITIAL_FIELD = {
  id: '',
  type: 'text',
  label: '',
  placeholder: '',
  required: false,
  options: [],
};

/**
 * FormFieldEditor Component
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onSave - Save handler
 * @param {Object} props.field - Field to edit (null for new)
 * @param {Array} props.existingFields - Existing fields for conditional logic
 * @returns {JSX.Element|null} The form field editor modal
 */
function FormFieldEditor({ isOpen, onClose, onSave, field, existingFields }) {
  const [formData, setFormData] = useState(INITIAL_FIELD);
  const [errors, setErrors] = useState({});
  const [newOption, setNewOption] = useState({ id: '', label: '' });

  const isEditing = Boolean(field);

  /**
   * Initialize form data when editing
   */
  useEffect(() => {
    if (isOpen) {
      if (field) {
        setFormData({
          ...INITIAL_FIELD,
          ...field,
          options: field.options || [],
        });
      } else {
        setFormData(INITIAL_FIELD);
      }
      setErrors({});
      setNewOption({ id: '', label: '' });
    }
  }, [isOpen, field]);

  /**
   * Handles input changes
   */
  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  /**
   * Handles conditional field change
   */
  const handleConditionalChange = (event) => {
    const { name, value } = event.target;
    if (name === 'conditionalField') {
      if (value === '') {
        setFormData((prev) => {
          const newData = { ...prev };
          delete newData.conditionalOn;
          return newData;
        });
      } else {
        setFormData((prev) => ({
          ...prev,
          conditionalOn: {
            field: value,
            value: prev.conditionalOn?.value ?? true,
          },
        }));
      }
    } else if (name === 'conditionalValue') {
      setFormData((prev) => ({
        ...prev,
        conditionalOn: {
          ...prev.conditionalOn,
          value: value === 'true',
        },
      }));
    }
  };

  /**
   * Adds a new option to checkbox/radio group
   */
  const handleAddOption = () => {
    if (!newOption.id.trim() || !newOption.label.trim()) {
      return;
    }
    // Generate ID from label if not provided
    const optionId = newOption.id.trim() || newOption.label.trim().toLowerCase().replace(/\s+/g, '_');
    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, { id: optionId, label: newOption.label.trim() }],
    }));
    setNewOption({ id: '', label: '' });
  };

  /**
   * Removes an option from checkbox/radio group
   */
  const handleRemoveOption = (index) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  /**
   * Validates form before saving
   */
  const validateForm = () => {
    const newErrors = {};

    if (!formData.id.trim()) {
      newErrors.id = 'Field ID is required';
    } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(formData.id.trim())) {
      newErrors.id = 'ID must start with a letter and contain only letters, numbers, and underscores';
    } else if (!isEditing && existingFields.some((f) => f.id === formData.id.trim())) {
      newErrors.id = 'A field with this ID already exists';
    }

    if (!formData.label.trim()) {
      newErrors.label = 'Label is required';
    }

    if ((formData.type === 'checkboxGroup' || formData.type === 'radio') && formData.options.length === 0) {
      newErrors.options = 'At least one option is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handles form submission
   */
  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const fieldData = {
      id: formData.id.trim(),
      type: formData.type,
      label: formData.label.trim(),
      placeholder: formData.placeholder?.trim() || '',
      required: formData.required,
    };

    if (formData.type === 'checkboxGroup' || formData.type === 'radio') {
      fieldData.options = formData.options;
    }

    if (formData.conditionalOn?.field) {
      fieldData.conditionalOn = formData.conditionalOn;
    }

    onSave(fieldData);
  };

  /**
   * Gets fields available for conditional logic
   */
  const getConditionalFields = () => {
    return existingFields
      .filter((f) => f.id !== formData.id)
      .filter((f) => f.type === 'checkbox' || f.type === 'checkboxGroup')
      .map((f) => {
        if (f.type === 'checkboxGroup' && f.options) {
          return f.options.map((opt) => ({
            id: `${f.id}.${opt.id}`,
            label: `${f.label} - ${opt.label}`,
          }));
        }
        return [{ id: f.id, label: f.label }];
      })
      .flat();
  };

  if (!isOpen) return null;

  const showOptions = formData.type === 'checkboxGroup' || formData.type === 'radio';
  const conditionalFields = getConditionalFields();

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>{isEditing ? 'Edit Field' : 'Add Field'}</h3>
          <button onClick={onClose} className={styles.closeButton} aria-label="Close">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Field ID */}
          <div className={styles.fieldGroup}>
            <label htmlFor="field-id" className={styles.label}>
              Field ID <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="field-id"
              name="id"
              value={formData.id}
              onChange={handleChange}
              className={`${styles.input} ${errors.id ? styles.inputError : ''}`}
              placeholder="e.g., myField"
              disabled={isEditing}
            />
            {errors.id && <span className={styles.error}>{errors.id}</span>}
            <span className={styles.hint}>Unique identifier (used in data storage)</span>
          </div>

          {/* Field Type */}
          <div className={styles.fieldGroup}>
            <label htmlFor="field-type" className={styles.label}>
              Field Type <span className={styles.required}>*</span>
            </label>
            <select
              id="field-type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className={styles.select}
            >
              {FIELD_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Label */}
          <div className={styles.fieldGroup}>
            <label htmlFor="field-label" className={styles.label}>
              Label <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="field-label"
              name="label"
              value={formData.label}
              onChange={handleChange}
              className={`${styles.input} ${errors.label ? styles.inputError : ''}`}
              placeholder="e.g., Your Name"
            />
            {errors.label && <span className={styles.error}>{errors.label}</span>}
          </div>

          {/* Placeholder (for text/textarea) */}
          {(formData.type === 'text' || formData.type === 'textarea') && (
            <div className={styles.fieldGroup}>
              <label htmlFor="field-placeholder" className={styles.label}>
                Placeholder
              </label>
              <input
                type="text"
                id="field-placeholder"
                name="placeholder"
                value={formData.placeholder}
                onChange={handleChange}
                className={styles.input}
                placeholder="e.g., Enter your name..."
              />
            </div>
          )}

          {/* Required */}
          <div className={styles.fieldGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="required"
                checked={formData.required}
                onChange={handleChange}
                className={styles.checkbox}
              />
              <span>Required field</span>
            </label>
          </div>

          {/* Options (for checkboxGroup/radio) */}
          {showOptions && (
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                Options <span className={styles.required}>*</span>
              </label>
              {errors.options && <span className={styles.error}>{errors.options}</span>}

              <div className={styles.optionsList}>
                {formData.options.map((option, index) => (
                  <div key={option.id} className={styles.optionItem}>
                    <span className={styles.optionLabel}>{option.label}</span>
                    <span className={styles.optionId}>({option.id})</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className={styles.removeOptionButton}
                      aria-label="Remove option"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>

              <div className={styles.addOptionRow}>
                <input
                  type="text"
                  value={newOption.label}
                  onChange={(e) => setNewOption((prev) => ({ ...prev, label: e.target.value }))}
                  className={styles.optionInput}
                  placeholder="Option label"
                />
                <input
                  type="text"
                  value={newOption.id}
                  onChange={(e) => setNewOption((prev) => ({ ...prev, id: e.target.value }))}
                  className={styles.optionInput}
                  placeholder="Option ID (optional)"
                />
                <button
                  type="button"
                  onClick={handleAddOption}
                  className={styles.addOptionButton}
                  disabled={!newOption.label.trim()}
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Conditional Logic */}
          {conditionalFields.length > 0 && (
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Conditional Display</label>
              <span className={styles.hint}>Show this field only when another field has a specific value</span>
              <div className={styles.conditionalRow}>
                <select
                  name="conditionalField"
                  value={formData.conditionalOn?.field || ''}
                  onChange={handleConditionalChange}
                  className={styles.select}
                >
                  <option value="">Always show</option>
                  {conditionalFields.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
                {formData.conditionalOn?.field && (
                  <select
                    name="conditionalValue"
                    value={String(formData.conditionalOn?.value ?? true)}
                    onChange={handleConditionalChange}
                    className={styles.select}
                  >
                    <option value="true">is checked</option>
                    <option value="false">is not checked</option>
                  </select>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
            <button type="submit" className={styles.saveButton}>
              {isEditing ? 'Update Field' : 'Add Field'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

FormFieldEditor.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  field: PropTypes.object,
  existingFields: PropTypes.array,
};

FormFieldEditor.defaultProps = {
  field: null,
  existingFields: [],
};

export default FormFieldEditor;
