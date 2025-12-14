/**
 * VenuePage Component
 * Public-facing page that displays venue information with map and directions.
 *
 * @module pages/VenuePage
 */

import { Link } from 'react-router-dom';
import { VenueMap } from '../components/contact';
import { VENUE, CONFERENCE, ROUTES } from '../constants';
import styles from './VenuePage.module.css';

/**
 * VenuePage Component
 * Renders the venue page with location details, map, and directions.
 *
 * @returns {JSX.Element} The venue page component
 */
function VenuePage() {
  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className="container">
          <h1 className={styles.heroTitle}>Venue</h1>
          <p className={styles.heroSubtitle}>
            Find us at {VENUE.NAME}
          </p>
        </div>
      </section>

      {/* Location Section */}
      <section className={styles.locationSection}>
        <div className="container">
          <div className={styles.locationGrid}>
            {/* Venue Details */}
            <div className={styles.venueDetails}>
              <h2 className={styles.venueName}>{VENUE.NAME}</h2>
              <p className={styles.venueAddress}>{VENUE.ADDRESS}</p>

              <div className={styles.actionButtons}>
                <a
                  href={VENUE.MAP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.directionsButton}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="3 11 22 2 13 21 11 13 3 11" />
                  </svg>
                  Get Directions
                </a>
              </div>
            </div>

            {/* Map */}
            <div className={styles.mapWrapper}>
              <VenueMap height="350px" />
            </div>
          </div>
        </div>
      </section>

      {/* Transportation Section */}
      <section className={styles.transportSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Getting There</h2>

          <div className={styles.transportGrid}>
            {/* By Car */}
            <div className={styles.transportCard}>
              <div className={styles.transportIcon}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                  <circle cx="7" cy="17" r="2" />
                  <path d="M9 17h6" />
                  <circle cx="17" cy="17" r="2" />
                </svg>
              </div>
              <h3 className={styles.transportTitle}>By Car</h3>
              <ul className={styles.transportList}>
                <li>Take Daang Hari Road towards Las Piñas</li>
                <li>Look for Versailles Village on your right</li>
                <li>GCF South Metro is located within the Versailles area</li>
                <li>Free parking available on-site (first-come, first-served)</li>
              </ul>
            </div>

            {/* By Public Transport */}
            <div className={styles.transportCard}>
              <div className={styles.transportIcon}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M8 6v6" />
                  <path d="M16 6v6" />
                  <path d="M2 12h20" />
                  <path d="M7 18h10" />
                  <path d="M18 12v-7a3 3 0 0 0-3-3H9a3 3 0 0 0-3 3v7" />
                  <path d="M6 12v5a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-5" />
                  <path d="M8 18v3" />
                  <path d="M16 18v3" />
                </svg>
              </div>
              <h3 className={styles.transportTitle}>By Public Transport</h3>
              <ul className={styles.transportList}>
                <li>Take a jeepney or bus to Daang Hari Road, Las Piñas</li>
                <li>Alight at Versailles Village</li>
                <li>GCF South Metro is a short walk from the main road</li>
                <li>Ride-sharing (Grab) is also available in the area</li>
              </ul>
            </div>

            {/* Parking */}
            <div className={styles.transportCard}>
              <div className={styles.transportIcon}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
                </svg>
              </div>
              <h3 className={styles.transportTitle}>Parking</h3>
              <ul className={styles.transportList}>
                <li>Free parking available at the venue</li>
                <li>Limited spots - arrive early to secure parking</li>
                <li>Carpooling with church groups is encouraged</li>
                <li>Additional street parking available nearby</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Nearby Amenities Section */}
      <section className={styles.amenitiesSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Nearby Amenities</h2>
          <div className={styles.amenitiesGrid}>
            <div className={styles.amenityCard}>
              <h3 className={styles.amenityTitle}>Restaurants & Cafes</h3>
              <p className={styles.amenityText}>
                Various dining options are available along Daang Hari Road,
                including fast food chains and local restaurants.
              </p>
            </div>
            <div className={styles.amenityCard}>
              <h3 className={styles.amenityTitle}>Hotels</h3>
              <p className={styles.amenityText}>
                Several hotels in Alabang and along the South Superhighway
                are within 15-20 minutes drive from the venue.
              </p>
            </div>
            <div className={styles.amenityCard}>
              <h3 className={styles.amenityTitle}>Shopping</h3>
              <p className={styles.amenityText}>
                Evia Lifestyle Center and other malls along Daang Hari
                are nearby for any last-minute needs.
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
            Secure your spot at IDMC {CONFERENCE.YEAR} today!
          </p>
          <div className={styles.ctaButtons}>
            <Link to={ROUTES.REGISTER} className={styles.ctaButtonPrimary}>
              Register Now
            </Link>
            <Link to={ROUTES.FAQ} className={styles.ctaButtonSecondary}>
              View FAQ
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default VenuePage;
