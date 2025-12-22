/**
 * VenuePage Component
 * Public-facing page that displays venue information with map and directions.
 *
 * @module pages/VenuePage
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FloorPlan } from '../components/venue';
import { useSettings, DEFAULT_SETTINGS } from '../context';
import { getVenueTransport, getVenueAmenities } from '../services/venue';
import { ROUTES, SCHEDULE, WORKSHOPS } from '../constants';
import styles from './VenuePage.module.css';

/**
 * Transport icon components mapped by icon name
 */
const TRANSPORT_ICONS = {
  car: (
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
  ),
  bus: (
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
  ),
  parking: (
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
  ),
};

/**
 * VenuePage Component
 * Renders the venue page with location details, map, and directions.
 *
 * @returns {JSX.Element} The venue page component
 */
function VenuePage() {
  const { settings: dbSettings } = useSettings();
  // Use DEFAULT_SETTINGS as fallback for public pages while Firebase loads
  const settings = dbSettings || DEFAULT_SETTINGS;
  const [transportOptions, setTransportOptions] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * Fetches venue transport and amenities data from Firestore
     */
    async function fetchVenueData() {
      try {
        const [transportData, amenitiesData] = await Promise.all([
          getVenueTransport(),
          getVenueAmenities(),
        ]);
        setTransportOptions(transportData);
        setAmenities(amenitiesData);
      } catch (error) {
        console.error('Error fetching venue data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchVenueData();
  }, []);

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className="container">
          <h1 className={styles.heroTitle}>Venue</h1>
          <p className={styles.heroSubtitle}>
            Join us at {settings.venue?.name} for {settings.title}
          </p>
        </div>
      </section>

      {/* Map Section */}
      <section className={styles.mapSection}>
        <div className="container">
          <div className={styles.mapContent}>
            <div className={styles.mapInfo}>
              <h2 className={styles.mapTitle}>{settings.venue?.name}</h2>
              <p className={styles.mapAddress}>{settings.venue?.address}</p>
              <a
                href={settings.venue?.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.mapLink}
              >
                Get Directions
              </a>
            </div>
            <div className={styles.mapEmbed}>
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

      {/* Interactive Floor Plan Section */}
      <section className={styles.floorPlanSection}>
        <div className="container">
          <FloorPlan schedule={SCHEDULE} workshops={WORKSHOPS} />
        </div>
      </section>

      {/* Transportation Section */}
      <section className={styles.transportSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Getting There</h2>

          <div className={styles.transportGrid}>
            {loading ? (
              <p>Loading transportation options...</p>
            ) : transportOptions.length > 0 ? (
              transportOptions.map((transport) => (
                <div key={transport.id} className={styles.transportCard}>
                  <div className={styles.transportIcon}>
                    {TRANSPORT_ICONS[transport.icon] || TRANSPORT_ICONS.car}
                  </div>
                  <h3 className={styles.transportTitle}>{transport.title}</h3>
                  <ul className={styles.transportList}>
                    {transport.items?.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <p>No transportation information available.</p>
            )}
          </div>
        </div>
      </section>

      {/* Nearby Amenities Section */}
      <section className={styles.amenitiesSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>Nearby Amenities</h2>
          <div className={styles.amenitiesGrid}>
            {loading ? (
              <p>Loading amenities...</p>
            ) : amenities.length > 0 ? (
              amenities.map((amenity) => (
                <div key={amenity.id} className={styles.amenityCard}>
                  <h3 className={styles.amenityTitle}>{amenity.title}</h3>
                  <p className={styles.amenityText}>{amenity.description}</p>
                </div>
              ))
            ) : (
              <p>No amenities information available.</p>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className="container">
          <h2 className={styles.ctaTitle}>Ready to Join Us?</h2>
          <p className={styles.ctaText}>
            Secure your spot at {settings.title} today!
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
