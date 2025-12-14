import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPublishedSpeakers } from '../services/speakers';
import {
  SPEAKERS,
  SESSION_TYPES,
  CONFERENCE,
  ROUTES,
} from '../constants';
import styles from './SpeakersPage.module.css';

/**
 * SpeakersPage Component
 * Public-facing page that displays all published conference speakers.
 * Shows speakers in a detailed layout with full information visible.
 * Fetches speaker data from Firestore with fallback to mock data.
 *
 * @returns {JSX.Element} The speakers page component
 */
function SpeakersPage() {
  const [speakers, setSpeakers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetches published speakers from Firestore on component mount
   */
  useEffect(() => {
    async function fetchSpeakers() {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedSpeakers = await getPublishedSpeakers();
        setSpeakers(fetchedSpeakers);
      } catch (fetchError) {
        console.error('Failed to fetch speakers from database:', fetchError);
        // Silently fallback to static data - no need to show error to users
        setSpeakers(SPEAKERS);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSpeakers();
  }, []);

  /**
   * Filters speakers by session type
   *
   * @param {string} sessionType - The session type to filter by
   * @returns {Array} Filtered array of speakers
   */
  const getSpeakersBySessionType = useCallback(
    (sessionType) => {
      return speakers.filter(
        (speaker) => speaker.sessionType === sessionType
      );
    },
    [speakers]
  );

  const plenarySpeakers = useMemo(
    () => getSpeakersBySessionType(SESSION_TYPES.PLENARY),
    [getSpeakersBySessionType]
  );

  const workshopSpeakers = useMemo(
    () => getSpeakersBySessionType(SESSION_TYPES.WORKSHOP),
    [getSpeakersBySessionType]
  );

  /**
   * Generates initials from a speaker's name for the placeholder avatar
   *
   * @param {string} name - Full name of the speaker
   * @returns {string} First letter of the first name
   */
  const getInitials = (name) => {
    return name.charAt(0).toUpperCase();
  };

  /**
   * Renders a speaker detail card with full information
   *
   * @param {Object} speaker - Speaker data object
   * @param {boolean} showSession - Whether to show session title
   * @returns {JSX.Element} Speaker detail card
   */
  const renderSpeakerCard = (speaker, showSession = false) => (
    <article key={speaker.id} className={styles.speakerCard}>
      <div className={styles.speakerHeader}>
        <div className={styles.imageContainer}>
          {speaker.photoUrl ? (
            <img
              src={speaker.photoUrl}
              alt={speaker.name}
              className={styles.image}
              loading="lazy"
            />
          ) : (
            <div className={styles.placeholder}>
              <span>{getInitials(speaker.name)}</span>
            </div>
          )}
        </div>
        <div className={styles.speakerInfo}>
          <h3 className={styles.speakerName}>{speaker.name}</h3>
          <p className={styles.speakerTitle}>{speaker.title}</p>
          <p className={styles.speakerOrg}>{speaker.organization}</p>
          {showSession && speaker.sessionTitle && (
            <p className={styles.speakerSession}>{speaker.sessionTitle}</p>
          )}
        </div>
      </div>
      {speaker.bio && (
        <div className={styles.speakerBio}>
          <p>{speaker.bio}</p>
        </div>
      )}
    </article>
  );

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className="container">
          <h1 className={styles.heroTitle}>Our Speakers</h1>
          <p className={styles.heroSubtitle}>
            Meet the experienced leaders and mentors sharing at IDMC {CONFERENCE.YEAR}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className={styles.contentSection}>
        <div className="container">
          {/* Loading State */}
          {isLoading && (
            <div className={styles.loadingState}>
              <p>Loading speakers...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className={styles.errorState}>
              <p>{error}</p>
            </div>
          )}

          {/* Content - Only show when not loading */}
          {!isLoading && (
            <>
              {/* Plenary Speakers */}
              {plenarySpeakers.length > 0 && (
                <div className={styles.speakerCategory}>
                  <h2 className={styles.categoryTitle}>Plenary Session</h2>
                  <p className={styles.categoryDescription}>
                    Main conference sessions for all attendees
                  </p>
                  <div className={styles.speakersList}>
                    {plenarySpeakers.map((speaker) =>
                      renderSpeakerCard(speaker, false)
                    )}
                  </div>
                </div>
              )}

              {/* Workshop Speakers */}
              {workshopSpeakers.length > 0 && (
                <div className={styles.speakerCategory}>
                  <h2 className={styles.categoryTitle}>Workshop Sessions</h2>
                  <p className={styles.categoryDescription}>
                    Focused breakout sessions by demographic groups
                  </p>
                  <div className={styles.speakersList}>
                    {workshopSpeakers.map((speaker) =>
                      renderSpeakerCard(speaker, true)
                    )}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {speakers.length === 0 && (
                <div className={styles.emptyState}>
                  <p>Speaker information coming soon!</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className="container">
          <h2 className={styles.ctaTitle}>Ready to Learn and Grow?</h2>
          <p className={styles.ctaText}>
            Join us at IDMC {CONFERENCE.YEAR} and be equipped for intentional
            disciple-making.
          </p>
          <Link to={ROUTES.REGISTER} className={styles.ctaButton}>
            Register Now
          </Link>
        </div>
      </section>
    </div>
  );
}

export default SpeakersPage;
