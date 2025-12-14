import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  WorkshopGrid,
  WorkshopDetailModal,
  TrackFilter,
  CategoryFilter,
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
 * Public-facing page that displays available workshops organized by track.
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
  const [selectedTrack, setSelectedTrack] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

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
   * Filters workshops by the selected track and category
   */
  const filteredWorkshops = useMemo(() => {
    let filtered = workshops;

    if (selectedTrack) {
      filtered = filtered.filter((workshop) => workshop.track === selectedTrack);
    }

    if (selectedCategory) {
      filtered = filtered.filter((workshop) => workshop.category === selectedCategory);
    }

    return filtered;
  }, [workshops, selectedTrack, selectedCategory]);

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

  /**
   * Handles track filter change
   *
   * @param {string} track - Selected track
   */
  const handleTrackChange = useCallback((track) => {
    setSelectedTrack(track);
  }, []);

  /**
   * Handles category filter change
   *
   * @param {string} category - Selected category
   */
  const handleCategoryChange = useCallback((category) => {
    setSelectedCategory(category);
  }, []);

  /**
   * Clears all filters
   */
  const handleClearFilters = useCallback(() => {
    setSelectedTrack('');
    setSelectedCategory('');
  }, []);

  const hasActiveFilters = selectedTrack || selectedCategory;

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className="container">
          <h1 className={styles.heroTitle}>Workshops</h1>
          <p className={styles.heroSubtitle}>
            Explore our workshop tracks for IDMC {CONFERENCE.YEAR}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className={styles.contentSection}>
        <div className="container">
          {/* Filter Controls */}
          <div className={styles.filterBar}>
            <div className={styles.filters}>
              <TrackFilter
                selectedTrack={selectedTrack}
                onChange={handleTrackChange}
              />
              <CategoryFilter
                selectedCategory={selectedCategory}
                onChange={handleCategoryChange}
              />
            </div>
            {hasActiveFilters && (
              <button
                className={styles.clearFiltersButton}
                onClick={handleClearFilters}
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className={styles.loadingState}>
              <p>Loading workshops...</p>
            </div>
          )}

          {/* Content - Only show when not loading */}
          {!isLoading && (
            <>
              {filteredWorkshops.length > 0 ? (
                <WorkshopGrid
                  workshops={filteredWorkshops}
                  onWorkshopClick={handleWorkshopClick}
                  groupByTrack={!hasActiveFilters}
                />
              ) : (
                <div className={styles.emptyState}>
                  <p>No workshops found for the selected filters.</p>
                  {hasActiveFilters && (
                    <button
                      className={styles.clearFilterButton}
                      onClick={handleClearFilters}
                    >
                      Show all workshops
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Info Section */}
      <section className={styles.infoSection}>
        <div className="container">
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <h3 className={styles.infoTitle}>Track 1: Open Access</h3>
              <p className={styles.infoText}>
                Track 1 workshops are open to all attendees. No pre-registration required.
                Simply attend on the day of the event.
              </p>
            </div>
            <div className={styles.infoCard}>
              <h3 className={styles.infoTitle}>Track 2: Pre-registration</h3>
              <p className={styles.infoText}>
                Track 2 workshops have limited capacity. Select your preferred workshop
                during registration to secure your spot.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className="container">
          <h2 className={styles.ctaTitle}>Ready to Join Us?</h2>
          <p className={styles.ctaText}>
            Register now for IDMC {CONFERENCE.YEAR} and select your preferred workshops.
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
