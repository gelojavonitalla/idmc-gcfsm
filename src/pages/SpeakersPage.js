import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { SpeakerCard, SpeakerDetailModal } from '../components/speakers';
import {
  SPEAKERS,
  SPEAKER_STATUS,
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
 *
 * @returns {JSX.Element} The speakers page component
 */
function SpeakersPage() {
  const [selectedSpeaker, setSelectedSpeaker] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /**
   * Filters and sorts speakers for display
   * Only shows published speakers, sorted by order field
   */
  const publishedSpeakers = useMemo(() => {
    return SPEAKERS.filter(
      (speaker) => speaker.status === SPEAKER_STATUS.PUBLISHED
    ).sort((a, b) => a.order - b.order);
  }, []);

  /**
   * Filters speakers by session type
   *
   * @param {string} sessionType - The session type to filter by
   * @returns {Array} Filtered array of speakers
   */
  const getSpeakersBySessionType = useCallback(
    (sessionType) => {
      return publishedSpeakers.filter(
        (speaker) => speaker.sessionType === sessionType
      );
    },
    [publishedSpeakers]
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
            Meet the experienced leaders and mentors sharing at IDMC{' '}
            {CONFERENCE.YEAR}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className={styles.contentSection}>
        <div className="container">
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
          {publishedSpeakers.length === 0 && (
            <div className={styles.emptyState}>
              <p>Speaker information coming soon!</p>
            </div>
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
