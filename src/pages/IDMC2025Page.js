/**
 * IDMC2025Page Component
 * Displays video highlights from the IDMC 2025 conference.
 *
 * @module pages/IDMC2025Page
 */

import { YouTubeEmbed } from '../components/ui';
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
  const { settings } = useSettings();

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
    </div>
  );
}

export default IDMC2025Page;
