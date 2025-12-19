import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CountdownTimer } from '../components/ui';
import { useSettings } from '../context';
import { getFeaturedSpeakers } from '../services/speakers';
import {
  SPEAKERS,
  SESSION_TYPES,
  ROUTES,
  REGISTRATION_CATEGORIES,
  REGISTRATION_CATEGORY_LABELS,
  REGISTRATION_CATEGORY_DESCRIPTIONS,
} from '../constants';
import { calculatePrice, formatPrice } from '../utils';
import styles from './HomePage.module.css';

/**
 * HomePage Component
 * Landing page for the IDMC Conference website.
 * Displays hero, countdown, speakers, pricing, and venue sections.
 * Fetches featured speaker data from Firestore with fallback to mock data.
 *
 * @returns {JSX.Element} The home page component
 */
function HomePage() {
  const { settings, activePricingTier } = useSettings();
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
          <h1>{settings.title}</h1>
          <p className={styles.heroTheme}>{settings.theme}</p>
          <p className={styles.heroSubtext}>
            {new Date(settings.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} | {settings.venue?.name}
          </p>
          <Link to={ROUTES.REGISTER} className={styles.heroButton}>
            Register Now
          </Link>
        </div>
      </section>

      {/* Countdown Timer Section */}
      <section className={styles.countdownSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Conference Starts In</h2>
          <CountdownTimer
            targetDate={settings.startDate}
            endDate={settings.endDate}
            timezone={settings.timezone}
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

          {/* Error State - only show if no fallback data available */}
          {speakersError && !isLoadingSpeakers && speakers.length === 0 && (
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
                        {speaker.photoUrl ? (
                          <img
                            src={speaker.photoUrl}
                            alt={speaker.name}
                            className={styles.speakerImage}
                          />
                        ) : (
                          <div className={styles.speakerImagePlaceholder}>
                            <span>{speaker.name.charAt(0)}</span>
                          </div>
                        )}
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
                        {speaker.photoUrl ? (
                          <img
                            src={speaker.photoUrl}
                            alt={speaker.name}
                            className={styles.speakerImage}
                          />
                        ) : (
                          <div className={styles.speakerImagePlaceholder}>
                            <span>{speaker.name.charAt(0)}</span>
                          </div>
                        )}
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
                const price = calculatePrice(value, activePricingTier);
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
                    <Link to={`${ROUTES.REGISTER}?category=${value}`} className={styles.pricingButton}>
                      Register Now
                    </Link>
                  </div>
                );
              })}
          </div>
        </div>
      </section>

      {/* Venue Section */}
      <section className={styles.venueSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Venue</h2>
          <div className={styles.venueContent}>
            <div className={styles.venueInfo}>
              <h3 className={styles.venueName}>{settings.venue?.name}</h3>
              <p className={styles.venueAddress}>{settings.venue?.address}</p>
              <div className={styles.venueButtons}>
                <a
                  href={settings.venue?.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.venueLink}
                >
                  Get Directions
                </a>
                <Link to={ROUTES.VENUE} className={styles.venueLinkSecondary}>
                  More Details
                </Link>
              </div>
            </div>
            <div className={styles.venueMap}>
              <iframe
                src={settings.venue?.mapEmbedUrl}
                title={`Map of ${settings.venue?.name}`}
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
