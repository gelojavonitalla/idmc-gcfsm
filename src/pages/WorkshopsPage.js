import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  WorkshopGrid,
  WorkshopDetailModal,
} from '../components/workshops';
import { getPublishedWorkshops } from '../services/workshops';
import { getPublishedSpeakers } from '../services/speakers';
import {
  WORKSHOPS,
  CONFERENCE,
  ROUTES,
} from '../constants';
import styles from './WorkshopsPage.module.css';

/**
 * WorkshopsPage Component
 * Public-facing page that displays available workshops with slot availability.
 * Shows workshop cards with category badges, capacity indicators, and speaker info.
 * Clicking a workshop card opens a modal with detailed information.
 * Fetches workshop data from Firestore with fallback to static data.
 *
 * @returns {JSX.Element} The workshops page component
 */
function WorkshopsPage() {
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [workshops, setWorkshops] = useState([]);
  const [speakers, setSpeakers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetches published workshops and speakers from Firestore on component mount
   */
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);

        const [fetchedWorkshops, fetchedSpeakers] = await Promise.all([
          getPublishedWorkshops().catch(() => WORKSHOPS),
          getPublishedSpeakers().catch(() => []),
        ]);

        setWorkshops(fetchedWorkshops.length > 0 ? fetchedWorkshops : WORKSHOPS);
        setSpeakers(fetchedSpeakers);
      } catch (fetchError) {
        console.error('Failed to fetch workshops data:', fetchError);
        setWorkshops(WORKSHOPS);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  /**
   * Opens the workshop detail modal
   *
   * @param {Object} workshop - Workshop data to display
   */
  const handleWorkshopClick = useCallback((workshop) => {
    setSelectedWorkshop(workshop);
    setIsModalOpen(true);
  }, []);

  /**
   * Closes the workshop detail modal
   */
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedWorkshop(null);
  }, []);

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className="container">
          <h1 className={styles.heroTitle}>Workshops</h1>
          <p className={styles.heroSubtitle}>
            Explore our workshops for IDMC {CONFERENCE.YEAR}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className={styles.contentSection}>
        <div className="container">
          {/* Loading State */}
          {isLoading && (
            <div className={styles.loadingState}>
              <p>Loading workshops...</p>
            </div>
          )}

          {/* Content - Only show when not loading */}
          {!isLoading && (
            <>
              {workshops.length > 0 ? (
                <WorkshopGrid
                  workshops={workshops}
                  onWorkshopClick={handleWorkshopClick}
                />
              ) : (
                <div className={styles.emptyState}>
                  <p>No workshops available.</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className="container">
          <h2 className={styles.ctaTitle}>Ready to Join Us?</h2>
          <p className={styles.ctaText}>
            Register now for IDMC {CONFERENCE.YEAR} and join our workshops.
          </p>
          <Link to={ROUTES.REGISTER} className={styles.ctaButton}>
            Register Now
          </Link>
        </div>
      </section>

      {/* Workshop Detail Modal */}
      <WorkshopDetailModal
        workshop={selectedWorkshop}
        speakers={speakers}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}

export default WorkshopsPage;
