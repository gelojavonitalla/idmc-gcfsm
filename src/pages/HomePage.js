import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CountdownTimer } from '../components/ui';
import { useSettings, DEFAULT_SETTINGS } from '../context';
import { getFeaturedSpeakers } from '../services/speakers';
import {
  SPEAKERS,
  SESSION_TYPES,
  ROUTES,
} from '../constants';
import { formatPrice } from '../utils';
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
  const { settings: dbSettings, pricingTiers } = useSettings();
  // Use DEFAULT_SETTINGS as fallback for public pages while Firebase loads
  const settings = dbSettings || DEFAULT_SETTINGS;
  const [speakers, setSpeakers] = useState([]);
  const [isLoadingSpeakers, setIsLoadingSpeakers] = useState(true);
  const [speakersError, setSpeakersError] = useState(null);
  const [isHeroMediaLoaded, setIsHeroMediaLoaded] = useState(false);

  /**
   * Filter pricing tiers to only show active ones within valid date range
   */
  const displayPricingTiers = useMemo(() => {
    if (!pricingTiers || pricingTiers.length === 0) return [];

    const now = new Date();
    return pricingTiers
      .filter((tier) => {
        if (!tier.isActive) return false;
        const startDate = new Date(tier.startDate);
        const endDate = new Date(tier.endDate);
        endDate.setHours(23, 59, 59, 999);
        return now >= startDate && now <= endDate;
      })
      .sort((a, b) => a.regularPrice - b.regularPrice);
  }, [pricingTiers]);

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

  /**
   * Preloads hero image and tracks loading state.
   * Text will be hidden once the hero media has finished loading.
   */
  useEffect(() => {
    if (settings.heroVideoUrl) {
      setIsHeroMediaLoaded(false);
      return;
    }

    if (settings.heroImageUrl) {
      setIsHeroMediaLoaded(false);
      const img = new Image();
      img.onload = () => setIsHeroMediaLoaded(true);
      img.onerror = () => setIsHeroMediaLoaded(false);
      img.src = settings.heroImageUrl;
    } else {
      setIsHeroMediaLoaded(false);
    }
  }, [settings.heroImageUrl, settings.heroVideoUrl]);

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
        {/* Hero Video Background */}
        {settings.heroVideoUrl && (
          <video
            className={styles.heroVideo}
            autoPlay
            muted
            loop
            playsInline
            poster={settings.heroImageUrl || undefined}
            onLoadedData={() => setIsHeroMediaLoaded(true)}
          >
            <source src={settings.heroVideoUrl} type="video/mp4" />
          </video>
        )}
        {/* Hero Image Background (when no video) */}
        {!settings.heroVideoUrl && settings.heroImageUrl && (
          <div
            className={styles.heroImage}
            style={{ backgroundImage: `url(${settings.heroImageUrl})` }}
          />
        )}
        {/* Overlay for readability */}
        {(settings.heroImageUrl || settings.heroVideoUrl) && (
          <div className={styles.heroOverlay} />
        )}
        {/* Hide hero content when hero image/video has loaded since the image already contains the text */}
        {!isHeroMediaLoaded && (
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
        )}
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
            {displayPricingTiers.length > 0 ? (
              displayPricingTiers.map((tier) => (
                <div key={tier.id} className={styles.pricingCard}>
                  <h3 className={styles.pricingName}>{tier.name}</h3>
                  <div className={styles.pricingPrice}>
                    {formatPrice(tier.regularPrice)}
                  </div>
                  {tier.studentPrice !== tier.regularPrice && (
                    <p className={styles.pricingStudentPrice}>
                      Student: {formatPrice(tier.studentPrice)}
                    </p>
                  )}
                  {tier.description && (
                    <p className={styles.pricingDescription}>{tier.description}</p>
                  )}
                  <Link
                    to={`${ROUTES.REGISTER}?category=${tier.id}`}
                    className={styles.pricingButton}
                  >
                    Register Now
                  </Link>
                </div>
              ))
            ) : (
              <div className={styles.pricingEmpty}>
                <p>Registration pricing will be available soon.</p>
              </div>
            )}
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
