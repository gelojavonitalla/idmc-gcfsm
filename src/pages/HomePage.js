import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CountdownTimer, YouTubeEmbed } from '../components/ui';
import { getFeaturedSpeakers } from '../services/speakers';
import {
  CONFERENCE,
  ORGANIZATION,
  SPEAKERS,
  SESSION_TYPES,
  VENUE,
  SCHEDULE,
  ROUTES,
  REGISTRATION_CATEGORIES,
  REGISTRATION_CATEGORY_LABELS,
  REGISTRATION_CATEGORY_DESCRIPTIONS,
} from '../constants';
import { getCurrentPricingTier, calculatePrice, formatPrice } from '../utils';
import styles from './HomePage.module.css';

/**
 * YouTube video ID for IDMC 2025 promotional video
 */
const PROMO_VIDEO_ID = 'emGTZDXOaZY';

/**
 * HomePage Component
 * Landing page for the IDMC Conference website.
 * Displays hero, video, countdown, speakers, schedule highlights, pricing, about, and venue sections.
 * Fetches featured speaker data from Firestore with fallback to mock data.
 *
 * @returns {JSX.Element} The home page component
 */
function HomePage() {
  const [speakers, setSpeakers] = useState([]);
  const [isLoadingSpeakers, setIsLoadingSpeakers] = useState(true);
  const [speakersError, setSpeakersError] = useState(null);

  /**
   * Fetches featured speakers from Firestore on component mount
   */
  useEffect(() => {
    async function fetchSpeakers() {
      try {
        setIsLoadingSpeakers(true);
        setSpeakersError(null);
        const fetchedSpeakers = await getFeaturedSpeakers();
        setSpeakers(fetchedSpeakers);
      } catch (error) {
        console.error('Failed to fetch featured speakers:', error);
        setSpeakersError('Failed to load speakers.');
        // Fallback to mock data on error
        setSpeakers(SPEAKERS);
      } finally {
        setIsLoadingSpeakers(false);
      }
    }

    fetchSpeakers();
  }, []);

  const plenarySpeakers = speakers.filter(
    (speaker) => speaker.sessionType === SESSION_TYPES.PLENARY
  );

  const workshopSpeakers = speakers.filter(
    (speaker) => speaker.sessionType === SESSION_TYPES.WORKSHOP
  );

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

          {/* Loading State */}
          {isLoadingSpeakers && (
            <div className={styles.speakersLoading}>
              <p>Loading speakers...</p>
            </div>
          )}

          {/* Error State */}
          {speakersError && !isLoadingSpeakers && (
            <div className={styles.speakersError}>
              <p>{speakersError}</p>
            </div>
          )}

          {/* Speaker Content */}
          {!isLoadingSpeakers && (
            <>
              {/* Plenary Speaker */}
              {plenarySpeakers.length > 0 && (
                <div className={styles.speakerCategory}>
                  <h3 className={styles.categoryTitle}>Plenary Session</h3>
                  <div className={styles.speakersGrid}>
                    {plenarySpeakers.map((speaker) => (
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
              )}

              {/* Workshop Speakers */}
              {workshopSpeakers.length > 0 && (
                <div className={styles.speakerCategory}>
                  <h3 className={styles.categoryTitle}>Workshops</h3>
                  <div className={styles.speakersGrid}>
                    {workshopSpeakers.map((speaker) => (
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
              )}

              {/* Empty State */}
              {speakers.length === 0 && (
                <div className={styles.speakersEmpty}>
                  <p>Speaker information coming soon!</p>
                </div>
              )}
            </>
          )}

          {/* View All Speakers Link */}
          <div className={styles.viewAllSpeakers}>
            <Link to={ROUTES.SPEAKERS} className={styles.viewAllButton}>
              View All Speakers
            </Link>
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
                className={`${styles.scheduleItem} ${styles[`scheduleType${item.sessionType.charAt(0).toUpperCase() + item.sessionType.slice(1)}`] || ''}`}
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
            {Object.entries(REGISTRATION_CATEGORIES).map(([key, value]) => {
              const currentTier = getCurrentPricingTier();
              const price = calculatePrice(value, currentTier);
              return (
                <div key={key} className={styles.pricingCard}>
                  <h3 className={styles.pricingName}>
                    {REGISTRATION_CATEGORY_LABELS[value]}
                  </h3>
                  <div className={styles.pricingPrice}>
                    {formatPrice(price)}
                  </div>
                  <p className={styles.pricingDescription}>
                    {REGISTRATION_CATEGORY_DESCRIPTIONS[value]}
                  </p>
                  <Link to={ROUTES.REGISTER} className={styles.pricingButton}>
                    Register Now
                  </Link>
                </div>
              );
            })}
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
