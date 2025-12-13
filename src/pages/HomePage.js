import { Link } from 'react-router-dom';
import { CountdownTimer, YouTubeEmbed } from '../components/ui';
import {
  CONFERENCE,
  ORGANIZATION,
  SPEAKERS,
  SESSION_TYPES,
  VENUE,
  PRICING_CATEGORIES,
  SCHEDULE,
  ROUTES,
} from '../constants';
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
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1>IDMC {CONFERENCE.YEAR}</h1>
          <p className={styles.heroTheme}>{CONFERENCE.THEME}</p>
          <p className={styles.heroSubtext}>
            March 28, {CONFERENCE.YEAR} | {VENUE.NAME}
          </p>
          <Link to={ROUTES.REGISTER} className={styles.heroButton}>
            Register Now
          </Link>
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

      {/* Featured Speakers Section */}
      <section id="speakers" className={styles.speakersSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Our Speakers</h2>
          <p className={styles.sectionSubtitle}>
            Learn from experienced leaders in discipleship
          </p>

          {/* Plenary Speaker */}
          <div className={styles.speakerCategory}>
            <h3 className={styles.categoryTitle}>Plenary Session</h3>
            <div className={styles.speakersGrid}>
              {SPEAKERS.filter(
                (speaker) => speaker.sessionType === SESSION_TYPES.PLENARY
              ).map((speaker) => (
                <div key={speaker.id} className={styles.speakerCard}>
                  <div className={styles.speakerImagePlaceholder}>
                    <span>{speaker.name.charAt(0)}</span>
                  </div>
                  <h4 className={styles.speakerName}>{speaker.name}</h4>
                  <p className={styles.speakerTitle}>{speaker.title}</p>
                  <p className={styles.speakerOrg}>{speaker.organization}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Workshop Speakers */}
          <div className={styles.speakerCategory}>
            <h3 className={styles.categoryTitle}>Workshops</h3>
            <div className={styles.speakersGrid}>
              {SPEAKERS.filter(
                (speaker) => speaker.sessionType === SESSION_TYPES.WORKSHOP
              ).map((speaker) => (
                <div key={speaker.id} className={styles.speakerCard}>
                  <div className={styles.speakerImagePlaceholder}>
                    <span>{speaker.name.charAt(0)}</span>
                  </div>
                  <h4 className={styles.speakerName}>{speaker.name}</h4>
                  <p className={styles.speakerTitle}>{speaker.title}</p>
                  <p className={styles.speakerOrg}>{speaker.organization}</p>
                  <p className={styles.speakerSession}>{speaker.sessionTitle}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Schedule Section */}
      <section id="schedule" className={styles.scheduleSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Conference Schedule</h2>
          <p className={styles.sectionSubtitle}>
            March 28, {CONFERENCE.YEAR} | {VENUE.NAME}
          </p>
          <div className={styles.scheduleList}>
            {SCHEDULE.map((item) => (
              <div
                key={item.id}
                className={`${styles.scheduleItem} ${styles[`scheduleType${item.type.charAt(0).toUpperCase() + item.type.slice(1)}`] || ''}`}
              >
                <div className={styles.scheduleTime}>{item.time}</div>
                <div className={styles.scheduleContent}>
                  <h3 className={styles.scheduleTitle}>{item.title}</h3>
                  {item.subtitle && (
                    <p className={styles.scheduleSubtitle}>{item.subtitle}</p>
                  )}
                  {item.tracks && (
                    <div className={styles.scheduleTracks}>
                      {item.tracks.map((track, index) => (
                        <span key={index} className={styles.scheduleTrack}>
                          {track}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className={styles.pricingSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Registration</h2>
          <p className={styles.sectionSubtitle}>
            Choose the registration category that applies to you
          </p>
          <div className={styles.pricingGrid}>
            {PRICING_CATEGORIES.map((category) => (
              <div key={category.id} className={styles.pricingCard}>
                <h3 className={styles.pricingName}>{category.name}</h3>
                <div className={styles.pricingPrice}>
                  <span className={styles.priceAmount}>PHP {category.price}</span>
                </div>
                <p className={styles.pricingDescription}>{category.description}</p>
                <Link to={ROUTES.REGISTER} className={styles.pricingButton}>
                  Register Now
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About IDMC Section */}
      <section className={styles.aboutSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>About IDMC</h2>
          <p className={styles.sectionSubtitle}>{CONFERENCE.TAGLINE}</p>
          <div className={styles.aboutContent}>
            <div className={styles.aboutOrg}>
              <h3>Hosted by {ORGANIZATION.NAME}</h3>
              <p className={styles.aboutMission}>
                <strong>Mission:</strong> {ORGANIZATION.MISSION}
              </p>
              <p className={styles.aboutDescription}>{ORGANIZATION.DESCRIPTION}</p>
              <div className={styles.coreValues}>
                <h4>Core Values</h4>
                <ul>
                  {ORGANIZATION.CORE_VALUES.map((value, index) => (
                    <li key={index}>{value}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Venue Section */}
      <section className={styles.venueSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Venue</h2>
          <div className={styles.venueContent}>
            <div className={styles.venueInfo}>
              <h3 className={styles.venueName}>{VENUE.NAME}</h3>
              <p className={styles.venueAddress}>{VENUE.ADDRESS}</p>
              <a
                href={VENUE.MAP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.venueLink}
              >
                Get Directions
              </a>
            </div>
            <div className={styles.venueMap}>
              <iframe
                src={VENUE.MAP_EMBED_URL}
                title={`Map of ${VENUE.NAME}`}
                className={styles.mapIframe}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
