import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SpeakerCard, SpeakerDetailModal } from '../components/speakers';
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
 * Shows speakers in a responsive grid layout with filtering by session type.
 * Clicking a speaker card opens a modal with detailed information.
 * Fetches speaker data from Firestore with fallback to mock data.
 *
 * @returns {JSX.Element} The speakers page component
 */
function SpeakersPage() {
  const [selectedSpeaker, setSelectedSpeaker] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
   * Opens the speaker detail modal
   *
   * @param {Object} speaker - Speaker data to display
   */
  const handleSpeakerClick = useCallback((speaker) => {
    setSelectedSpeaker(speaker);
    setIsModalOpen(true);
  }, []);

  /**
   * Closes the speaker detail modal
   */
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedSpeaker(null);
  }, []);

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
                  <div className={styles.speakersGrid}>
                    {plenarySpeakers.map((speaker) => (
                      <SpeakerCard
                        key={speaker.id}
                        speaker={speaker}
                        onClick={handleSpeakerClick}
                        showSession={false}
                      />
                    ))}
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
                  <div className={styles.speakersGrid}>
                    {workshopSpeakers.map((speaker) => (
                      <SpeakerCard
                        key={speaker.id}
                        speaker={speaker}
                        onClick={handleSpeakerClick}
                        showSession={true}
                      />
                    ))}
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

      {/* Speaker Detail Modal */}
      <SpeakerDetailModal
        speaker={selectedSpeaker}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}

export default SpeakersPage;
