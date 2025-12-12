import { YouTubeEmbed } from '../components/ui';
import styles from './HomePage.module.css';

/**
 * YouTube video ID for IDMC 2025 promotional video
 */
const PROMO_VIDEO_ID = 'emGTZDXOaZY';

/**
 * HomePage Component
 * Landing page for the IDMC Conference website.
 * Displays hero, video, countdown, speakers, schedule highlights, pricing, about, and venue sections.
 *
 * @returns {JSX.Element} The home page component
 */
function HomePage() {
  return (
    <div className={styles.page}>
      {/* Hero Section Placeholder */}
      <section className={styles.heroPlaceholder}>
        <div className={styles.heroContent}>
          <h1>IDMC 2025</h1>
          <p>All In For Jesus And His Kingdom</p>
          <p className={styles.heroSubtext}>
            September 5-6, 2025 | Singapore EXPO Hall 1
          </p>
        </div>
      </section>

      {/* Video Highlight Section */}
      <section className={styles.videoSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Watch IDMC 2025</h2>
          <p className={styles.sectionSubtitle}>
            Get a glimpse of what awaits you at this year's conference
          </p>
          <YouTubeEmbed
            videoId={PROMO_VIDEO_ID}
            title="IDMC 2025 Conference Video"
          />
        </div>
      </section>

      {/* Placeholder sections - to be implemented in Phase 2-3 */}
      <section className={styles.placeholderSection}>
        <div className="container">
          <h2>Countdown Timer</h2>
          <p>Coming in Phase 2</p>
        </div>
      </section>

      <section className={styles.placeholderSection}>
        <div className="container">
          <h2>Featured Speakers</h2>
          <p>Coming in Phase 3</p>
        </div>
      </section>

      <section className={styles.placeholderSection}>
        <div className="container">
          <h2>Schedule Highlights</h2>
          <p>Coming in Phase 3</p>
        </div>
      </section>

      <section className={styles.placeholderSection}>
        <div className="container">
          <h2>Pricing</h2>
          <p>Coming in Phase 3</p>
        </div>
      </section>

      <section className={styles.placeholderSection}>
        <div className="container">
          <h2>About IDMC</h2>
          <p>Coming in Phase 3</p>
        </div>
      </section>

      <section className={styles.placeholderSection}>
        <div className="container">
          <h2>Venue</h2>
          <p>Coming in Phase 3</p>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
