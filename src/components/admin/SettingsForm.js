/**
 * SettingsForm Component
 * Form for editing conference settings.
 *
 * @module components/admin/SettingsForm
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './SettingsForm.module.css';

/**
 * SettingsForm Component
 *
 * @param {Object} props - Component props
 * @param {Object} props.settings - Current settings values
 * @param {Function} props.onSave - Callback when settings are saved
 * @param {boolean} props.isLoading - Loading state
 * @returns {JSX.Element} The settings form
 */
function SettingsForm({ settings, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    title: settings?.title || '',
    theme: settings?.theme || '',
    tagline: settings?.tagline || '',
    year: settings?.year || new Date().getFullYear(),
    startDate: settings?.startDate || '',
    endDate: settings?.endDate || '',
    startTime: settings?.startTime || '09:00',
    endTime: settings?.endTime || '17:00',
    timezone: settings?.timezone || 'Asia/Manila',
    registrationOpen: settings?.registrationOpen ?? true,
    venue: {
      name: settings?.venue?.name || '',
      address: settings?.venue?.address || '',
      mapUrl: settings?.venue?.mapUrl || '',
      mapEmbedUrl: settings?.venue?.mapEmbedUrl || '',
    },
    contact: {
      email: settings?.contact?.email || '',
      phone: settings?.contact?.phone || '',
      mobile: settings?.contact?.mobile || '',
      website: settings?.contact?.website || '',
    },
    social: {
      facebook: settings?.social?.facebook || '',
      instagram: settings?.social?.instagram || '',
      youtube: settings?.social?.youtube || '',
    },
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  /**
   * Handles input changes
   *
   * @param {Event} event - Change event
   */
  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    const actualValue = type === 'checkbox' ? checked : value;

    // Handle nested fields (venue.name, contact.email, etc.)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: actualValue,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: actualValue,
      }));
    }
  };

  /**
   * Handles form submission
   *
   * @param {Event} event - Submit event
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await onSave(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setSaveError(error.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.skeleton} />
      </div>
    );
  }

  return (
    <form className={styles.container} onSubmit={handleSubmit}>
      {/* Status Messages */}
      {saveError && (
        <div className={styles.errorMessage} role="alert">
          {saveError}
          <button type="button" onClick={() => setSaveError(null)} aria-label="Dismiss">
            &times;
          </button>
        </div>
      )}
      {saveSuccess && (
        <div className={styles.successMessage} role="status">
          Settings saved successfully!
        </div>
      )}

      {/* Conference Info Section */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Conference Information</h3>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label htmlFor="title" className={styles.label}>
              Conference Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={styles.input}
              placeholder="IDMC 2026"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="year" className={styles.label}>
              Year
            </label>
            <input
              type="number"
              id="year"
              name="year"
              value={formData.year}
              onChange={handleChange}
              className={styles.input}
              min="2000"
              max="2100"
            />
          </div>
          <div className={styles.fieldFull}>
            <label htmlFor="theme" className={styles.label}>
              Theme
            </label>
            <input
              type="text"
              id="theme"
              name="theme"
              value={formData.theme}
              onChange={handleChange}
              className={styles.input}
              placeholder="All In for Jesus and His Kingdom"
            />
          </div>
          <div className={styles.fieldFull}>
            <label htmlFor="tagline" className={styles.label}>
              Tagline
            </label>
            <input
              type="text"
              id="tagline"
              name="tagline"
              value={formData.tagline}
              onChange={handleChange}
              className={styles.input}
              placeholder="Intentional Disciple-Making Churches Conference"
            />
          </div>
        </div>
      </section>

      {/* Date & Time Section */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Date & Time</h3>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label htmlFor="startDate" className={styles.label}>
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="endDate" className={styles.label}>
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="startTime" className={styles.label}>
              Start Time
            </label>
            <input
              type="time"
              id="startTime"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="endTime" className={styles.label}>
              End Time
            </label>
            <input
              type="time"
              id="endTime"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="timezone" className={styles.label}>
              Timezone
            </label>
            <select
              id="timezone"
              name="timezone"
              value={formData.timezone}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="Asia/Manila">Asia/Manila (GMT+8)</option>
              <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
              <option value="Asia/Hong_Kong">Asia/Hong Kong (GMT+8)</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="registrationOpen"
                checked={formData.registrationOpen}
                onChange={handleChange}
                className={styles.checkbox}
              />
              <span>Registration Open</span>
            </label>
          </div>
        </div>
      </section>

      {/* Venue Section */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Venue</h3>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label htmlFor="venue.name" className={styles.label}>
              Venue Name
            </label>
            <input
              type="text"
              id="venue.name"
              name="venue.name"
              value={formData.venue.name}
              onChange={handleChange}
              className={styles.input}
              placeholder="GCF South Metro"
            />
          </div>
          <div className={styles.fieldFull}>
            <label htmlFor="venue.address" className={styles.label}>
              Address
            </label>
            <textarea
              id="venue.address"
              name="venue.address"
              value={formData.venue.address}
              onChange={handleChange}
              className={styles.textarea}
              rows={2}
              placeholder="Full venue address"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="venue.mapUrl" className={styles.label}>
              Google Maps URL
            </label>
            <input
              type="url"
              id="venue.mapUrl"
              name="venue.mapUrl"
              value={formData.venue.mapUrl}
              onChange={handleChange}
              className={styles.input}
              placeholder="https://maps.google.com/..."
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="venue.mapEmbedUrl" className={styles.label}>
              Map Embed URL
            </label>
            <input
              type="url"
              id="venue.mapEmbedUrl"
              name="venue.mapEmbedUrl"
              value={formData.venue.mapEmbedUrl}
              onChange={handleChange}
              className={styles.input}
              placeholder="https://www.google.com/maps?..."
            />
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Contact Information</h3>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label htmlFor="contact.email" className={styles.label}>
              Email
            </label>
            <input
              type="email"
              id="contact.email"
              name="contact.email"
              value={formData.contact.email}
              onChange={handleChange}
              className={styles.input}
              placeholder="email@example.org"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="contact.phone" className={styles.label}>
              Phone
            </label>
            <input
              type="text"
              id="contact.phone"
              name="contact.phone"
              value={formData.contact.phone}
              onChange={handleChange}
              className={styles.input}
              placeholder="(02) 1234 5678"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="contact.mobile" className={styles.label}>
              Mobile
            </label>
            <input
              type="text"
              id="contact.mobile"
              name="contact.mobile"
              value={formData.contact.mobile}
              onChange={handleChange}
              className={styles.input}
              placeholder="0917 123 4567"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="contact.website" className={styles.label}>
              Website
            </label>
            <input
              type="url"
              id="contact.website"
              name="contact.website"
              value={formData.contact.website}
              onChange={handleChange}
              className={styles.input}
              placeholder="https://example.org"
            />
          </div>
        </div>
      </section>

      {/* Social Media Section */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Social Media</h3>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label htmlFor="social.facebook" className={styles.label}>
              Facebook
            </label>
            <input
              type="url"
              id="social.facebook"
              name="social.facebook"
              value={formData.social.facebook}
              onChange={handleChange}
              className={styles.input}
              placeholder="https://facebook.com/..."
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="social.instagram" className={styles.label}>
              Instagram
            </label>
            <input
              type="url"
              id="social.instagram"
              name="social.instagram"
              value={formData.social.instagram}
              onChange={handleChange}
              className={styles.input}
              placeholder="https://instagram.com/..."
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="social.youtube" className={styles.label}>
              YouTube
            </label>
            <input
              type="url"
              id="social.youtube"
              name="social.youtube"
              value={formData.social.youtube}
              onChange={handleChange}
              className={styles.input}
              placeholder="https://youtube.com/..."
            />
          </div>
        </div>
      </section>

      {/* Submit Button */}
      <div className={styles.actions}>
        <button
          type="submit"
          className={styles.saveButton}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <span className={styles.spinner} />
              Saving...
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Save Settings
            </>
          )}
        </button>
      </div>
    </form>
  );
}

SettingsForm.propTypes = {
  settings: PropTypes.shape({
    title: PropTypes.string,
    theme: PropTypes.string,
    tagline: PropTypes.string,
    year: PropTypes.number,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    startTime: PropTypes.string,
    endTime: PropTypes.string,
    timezone: PropTypes.string,
    registrationOpen: PropTypes.bool,
    venue: PropTypes.shape({
      name: PropTypes.string,
      address: PropTypes.string,
      mapUrl: PropTypes.string,
      mapEmbedUrl: PropTypes.string,
    }),
    contact: PropTypes.shape({
      email: PropTypes.string,
      phone: PropTypes.string,
      mobile: PropTypes.string,
      website: PropTypes.string,
    }),
    social: PropTypes.shape({
      facebook: PropTypes.string,
      instagram: PropTypes.string,
      youtube: PropTypes.string,
    }),
  }),
  onSave: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

SettingsForm.defaultProps = {
  settings: null,
  isLoading: false,
};

export default SettingsForm;
