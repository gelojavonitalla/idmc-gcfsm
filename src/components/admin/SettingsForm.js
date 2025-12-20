/**
 * SettingsForm Component
 * Form for editing conference settings.
 *
 * @module components/admin/SettingsForm
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import MediaUpload from './MediaUpload';
import { uploadHeroImage, uploadHeroVideo, deleteFile } from '../../services/storage';
import { useAdminAuth } from '../../context';
import { ADMIN_ROLES } from '../../constants';
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
/**
 * Default settings values for IDMC 2026
 */
const DEFAULT_SETTINGS = {
  title: 'IDMC 2026',
  theme: 'All In for Jesus and His Kingdom',
  tagline: 'Intentional Disciple-Making Churches Conference',
  year: 2026,
  startDate: '2026-03-28',
  endDate: '2026-03-28',
  startTime: '07:00',
  endTime: '17:30',
  timezone: 'Asia/Manila',
  registrationOpen: true,
  heroImageUrl: null,
  heroVideoUrl: null,
  venue: {
    name: 'GCF South Metro',
    address: 'Daang Hari Road, Versailles, Almanza Dos, Las Piñas City 1750 Philippines',
    mapUrl: 'https://maps.google.com/?q=GCF+South+Metro+Las+Pinas',
    mapEmbedUrl:
      'https://www.google.com/maps?q=GCF+South+Metro,+Daang+Hari+Road,+Las+Piñas,+Philippines&output=embed',
  },
  contact: {
    email: 'email@gcfsouthmetro.org',
    phone: '(02) 8478 1271 / (02) 8478 1273',
    mobile: '0917 650 0011',
    website: 'https://gcfsouthmetro.org',
  },
  social: {
    facebook: 'https://facebook.com/gcfsouthmetro',
    instagram: 'https://instagram.com/gcfsouthmetro',
    youtube: 'https://youtube.com/channel/UCJ36YX23P_yCjMzetI1s6Ag',
  },
  sms: {
    enabled: false,
    gatewayDomain: '1.onewaysms.asia',
    gatewayEmail: '',
  },
};

function SettingsForm({ settings, onSave, isLoading }) {
  const { hasRole } = useAdminAuth();
  const isSuperAdmin = hasRole(ADMIN_ROLES.SUPERADMIN);

  const [formData, setFormData] = useState({
    title: settings?.title || DEFAULT_SETTINGS.title,
    theme: settings?.theme || DEFAULT_SETTINGS.theme,
    tagline: settings?.tagline || DEFAULT_SETTINGS.tagline,
    year: settings?.year || DEFAULT_SETTINGS.year,
    startDate: settings?.startDate || DEFAULT_SETTINGS.startDate,
    endDate: settings?.endDate || DEFAULT_SETTINGS.endDate,
    startTime: settings?.startTime || DEFAULT_SETTINGS.startTime,
    endTime: settings?.endTime || DEFAULT_SETTINGS.endTime,
    timezone: settings?.timezone || DEFAULT_SETTINGS.timezone,
    registrationOpen: settings?.registrationOpen ?? DEFAULT_SETTINGS.registrationOpen,
    heroImageUrl: settings?.heroImageUrl || DEFAULT_SETTINGS.heroImageUrl,
    heroVideoUrl: settings?.heroVideoUrl || DEFAULT_SETTINGS.heroVideoUrl,
    venue: {
      name: settings?.venue?.name || DEFAULT_SETTINGS.venue.name,
      address: settings?.venue?.address || DEFAULT_SETTINGS.venue.address,
      mapUrl: settings?.venue?.mapUrl || DEFAULT_SETTINGS.venue.mapUrl,
      mapEmbedUrl: settings?.venue?.mapEmbedUrl || DEFAULT_SETTINGS.venue.mapEmbedUrl,
    },
    contact: {
      email: settings?.contact?.email || DEFAULT_SETTINGS.contact.email,
      phone: settings?.contact?.phone || DEFAULT_SETTINGS.contact.phone,
      mobile: settings?.contact?.mobile || DEFAULT_SETTINGS.contact.mobile,
      website: settings?.contact?.website || DEFAULT_SETTINGS.contact.website,
    },
    social: {
      facebook: settings?.social?.facebook || DEFAULT_SETTINGS.social.facebook,
      instagram: settings?.social?.instagram || DEFAULT_SETTINGS.social.instagram,
      youtube: settings?.social?.youtube || DEFAULT_SETTINGS.social.youtube,
    },
    sms: {
      enabled: settings?.sms?.enabled ?? DEFAULT_SETTINGS.sms.enabled,
      gatewayDomain: settings?.sms?.gatewayDomain || DEFAULT_SETTINGS.sms.gatewayDomain,
      gatewayEmail: settings?.sms?.gatewayEmail || DEFAULT_SETTINGS.sms.gatewayEmail,
    },
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Media upload states
  const [heroImageUploading, setHeroImageUploading] = useState(false);
  const [heroImageProgress, setHeroImageProgress] = useState(0);
  const [heroImageError, setHeroImageError] = useState(null);

  const [heroVideoUploading, setHeroVideoUploading] = useState(false);
  const [heroVideoProgress, setHeroVideoProgress] = useState(0);
  const [heroVideoError, setHeroVideoError] = useState(null);

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
   * Handles hero image upload
   *
   * @param {File} file - Image file to upload
   */
  const handleHeroImageUpload = async (file) => {
    setHeroImageUploading(true);
    setHeroImageProgress(0);
    setHeroImageError(null);

    try {
      // Delete old image if exists
      if (formData.heroImageUrl) {
        try {
          await deleteFile(formData.heroImageUrl);
        } catch {
          // Ignore delete errors
        }
      }

      const downloadUrl = await uploadHeroImage(file, setHeroImageProgress);
      setFormData((prev) => ({ ...prev, heroImageUrl: downloadUrl }));
    } catch (error) {
      setHeroImageError(error.message);
    } finally {
      setHeroImageUploading(false);
    }
  };

  /**
   * Handles hero image removal
   */
  const handleHeroImageRemove = async () => {
    if (formData.heroImageUrl) {
      try {
        await deleteFile(formData.heroImageUrl);
      } catch {
        // Ignore delete errors
      }
    }
    setFormData((prev) => ({ ...prev, heroImageUrl: null }));
    setHeroImageError(null);
  };

  /**
   * Handles hero video upload
   *
   * @param {File} file - Video file to upload
   */
  const handleHeroVideoUpload = async (file) => {
    setHeroVideoUploading(true);
    setHeroVideoProgress(0);
    setHeroVideoError(null);

    try {
      // Delete old video if exists
      if (formData.heroVideoUrl) {
        try {
          await deleteFile(formData.heroVideoUrl);
        } catch {
          // Ignore delete errors
        }
      }

      const downloadUrl = await uploadHeroVideo(file, setHeroVideoProgress);
      setFormData((prev) => ({ ...prev, heroVideoUrl: downloadUrl }));
    } catch (error) {
      setHeroVideoError(error.message);
    } finally {
      setHeroVideoUploading(false);
    }
  };

  /**
   * Handles hero video removal
   */
  const handleHeroVideoRemove = async () => {
    if (formData.heroVideoUrl) {
      try {
        await deleteFile(formData.heroVideoUrl);
      } catch {
        // Ignore delete errors
      }
    }
    setFormData((prev) => ({ ...prev, heroVideoUrl: null }));
    setHeroVideoError(null);
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

      {/* Media Section */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Hero Media</h3>
        <p className={styles.sectionDescription}>
          Upload hero images and videos that will be displayed on the conference homepage.
        </p>
        <div className={styles.mediaGrid}>
          <div className={styles.mediaField}>
            <MediaUpload
              type="image"
              label="Hero Image"
              currentUrl={formData.heroImageUrl}
              onUpload={handleHeroImageUpload}
              onRemove={handleHeroImageRemove}
              isUploading={heroImageUploading}
              uploadProgress={heroImageProgress}
              error={heroImageError}
              hint="Recommended size: 1920x1080 pixels"
              disabled={isSaving}
            />
          </div>
          <div className={styles.mediaField}>
            <MediaUpload
              type="video"
              label="Hero Video"
              currentUrl={formData.heroVideoUrl}
              onUpload={handleHeroVideoUpload}
              onRemove={handleHeroVideoRemove}
              isUploading={heroVideoUploading}
              uploadProgress={heroVideoProgress}
              error={heroVideoError}
              hint="Recommended: Short promotional video (under 30 seconds)"
              disabled={isSaving}
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
              placeholder="Daang Hari Road, Versailles, Almanza Dos, Las Piñas City 1750 Philippines"
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
              placeholder="https://maps.google.com/?q=GCF+South+Metro+Las+Pinas"
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
              placeholder="https://www.google.com/maps?q=GCF+South+Metro&output=embed"
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
              placeholder="email@gcfsouthmetro.org"
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
              placeholder="(02) 8478 1271 / (02) 8478 1273"
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
              placeholder="0917 650 0011"
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
              placeholder="https://gcfsouthmetro.org"
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
              placeholder="https://facebook.com/gcfsouthmetro"
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
              placeholder="https://instagram.com/gcfsouthmetro"
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
              placeholder="https://youtube.com/channel/UCJ36YX23P_yCjMzetI1s6Ag"
            />
          </div>
        </div>
      </section>

      {/* SMS Notifications Section - SuperAdmin only */}
      {isSuperAdmin && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>SMS Notifications</h3>
          <p className={styles.sectionDescription}>
            Configure OneWaySMS email-to-SMS gateway for sending text message notifications.
          </p>
          <div className={styles.grid}>
            <div className={styles.fieldFull}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="sms.enabled"
                  checked={formData.sms.enabled}
                  onChange={handleChange}
                  className={styles.checkbox}
                />
                <span>Enable SMS Notifications</span>
              </label>
              <p className={styles.fieldHint}>
                When enabled, SMS notifications will be sent for registration confirmations and
                payment confirmations.
              </p>
            </div>
            <div className={styles.field}>
              <label htmlFor="sms.gatewayDomain" className={styles.label}>
                Gateway Domain
              </label>
              <input
                type="text"
                id="sms.gatewayDomain"
                name="sms.gatewayDomain"
                value={formData.sms.gatewayDomain}
                onChange={handleChange}
                className={styles.input}
                placeholder="1.onewaysms.asia"
                disabled={!formData.sms.enabled}
              />
              <p className={styles.fieldHint}>
                SMS gateway domain (e.g., 1.onewaysms.asia)
              </p>
            </div>
            <div className={styles.field}>
              <label htmlFor="sms.gatewayEmail" className={styles.label}>
                Gateway Email (Optional)
              </label>
              <input
                type="email"
                id="sms.gatewayEmail"
                name="sms.gatewayEmail"
                value={formData.sms.gatewayEmail}
                onChange={handleChange}
                className={styles.input}
                placeholder="Leave empty to use phone@domain format"
                disabled={!formData.sms.enabled}
              />
              <p className={styles.fieldHint}>
                Direct gateway email if required by your SMS provider
              </p>
            </div>
          </div>
        </section>
      )}

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
    heroImageUrl: PropTypes.string,
    heroVideoUrl: PropTypes.string,
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
    sms: PropTypes.shape({
      enabled: PropTypes.bool,
      gatewayDomain: PropTypes.string,
      gatewayEmail: PropTypes.string,
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
