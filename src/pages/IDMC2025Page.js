/**
 * IDMC2025Page Component
 * Displays video highlights from the IDMC 2025 conference.
 *
 * @module pages/IDMC2025Page
 */

import { Link } from 'react-router-dom';
import { YouTubeEmbed } from '../components/ui';
import { ROUTES, CONFERENCE } from '../constants';
import { useSettings } from '../context/SettingsContext';
import styles from './IDMC2025Page.module.css';

/**
 * Default values for IDMC 2025 page content
 */
const DEFAULT_IDMC_2025 = {
  title: 'IDMC 2025',
  subtitle: 'Watch the highlights from our previous conference',
  youtubeVideoId: 'emGTZDXOaZY',
};

/**
 * IDMC2025Page Component
 * Displays video highlights from the IDMC 2025 conference.
 * Content is managed through the admin panel.
 *
 * @returns {JSX.Element} The IDMC 2025 page component
 */
function IDMC2025Page() {
  const { settings: dbSettings, isLoading: isLoadingSettings } = useSettings();
  // Use settings only after Firebase has loaded
  const settings = isLoadingSettings ? null : dbSettings;

  const title = settings?.idmc2025?.title || DEFAULT_IDMC_2025.title;
  const subtitle = settings?.idmc2025?.subtitle || DEFAULT_IDMC_2025.subtitle;
  const videoId = settings?.idmc2025?.youtubeVideoId || DEFAULT_IDMC_2025.youtubeVideoId;

  return (
    <div className={styles.page}>
      <section className={styles.heroSection}>
        <div className="container">
          <h1 className={styles.pageTitle}>{title}</h1>
          <p className={styles.pageSubtitle}>{subtitle}</p>
        </div>
      </section>

      <section className={styles.videoSection}>
        <div className="container">
          <div className={styles.videoWrapper}>
            <YouTubeEmbed
              videoId={videoId}
              title={`${title} Conference Highlights`}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className="container">
          <h2 className={styles.ctaTitle}>Ready to Join Us?</h2>
          <p className={styles.ctaText}>
            Register now for IDMC {CONFERENCE.YEAR} and be part of this
            transformational conference.
          </p>
          <div className={styles.ctaButtons}>
            <Link to={ROUTES.REGISTER} className={styles.ctaButtonPrimary}>
              Register Now
            </Link>
            <Link to={ROUTES.FAQ} className={styles.ctaButtonSecondary}>
              View FAQ
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default IDMC2025Page;
