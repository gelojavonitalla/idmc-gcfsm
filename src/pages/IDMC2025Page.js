import { YouTubeEmbed } from '../components/ui';
import styles from './IDMC2025Page.module.css';

/**
 * YouTube video ID for IDMC 2025 conference video
 */
const IDMC_2025_VIDEO_ID = 'emGTZDXOaZY';

/**
 * IDMC2025Page Component
 * Displays video highlights from the IDMC 2025 conference.
 *
 * @returns {JSX.Element} The IDMC 2025 page component
 */
function IDMC2025Page() {
  return (
    <div className={styles.page}>
      <section className={styles.heroSection}>
        <div className="container">
          <h1 className={styles.pageTitle}>IDMC 2025</h1>
          <p className={styles.pageSubtitle}>
            Watch the highlights from our previous conference
          </p>
        </div>
      </section>

      <section className={styles.videoSection}>
        <div className="container">
          <div className={styles.videoWrapper}>
            <YouTubeEmbed
              videoId={IDMC_2025_VIDEO_ID}
              title="IDMC 2025 Conference Highlights"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

export default IDMC2025Page;
