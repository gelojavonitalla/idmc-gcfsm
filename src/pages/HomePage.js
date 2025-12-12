import { CountdownTimer, YouTubeEmbed } from '../components/ui';
import { CONFERENCE } from '../constants';
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
          <h1>IDMC {CONFERENCE.YEAR}</h1>
          <p>{CONFERENCE.THEME}</p>
          <p className={styles.heroSubtext}>
            March 28, {CONFERENCE.YEAR} | GCF South Metro
          </p>
        </div>
      </section>

      {/* Video Highlight Section */}
      <section className={styles.videoSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Watch Previous IDMC</h2>
          <p className={styles.sectionSubtitle}>
            See the highlights from our past conference
          </p>
          <YouTubeEmbed
            videoId={PROMO_VIDEO_ID}
            title="IDMC Previous Conference Video"
          />
        </div>
      </section>

      {/* Countdown Timer Section */}
      <section className={styles.countdownSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Conference Starts In</h2>
          <CountdownTimer
            targetDate={CONFERENCE.START_DATE}
            endDate={CONFERENCE.END_DATE}
            timezone={CONFERENCE.TIMEZONE}
          />
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
