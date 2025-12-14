/**
 * VenueMap Component
 * Displays an embedded Google Map for the venue location.
 *
 * @module components/contact/VenueMap
 */

import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { VENUE } from '../../constants';
import styles from './VenueMap.module.css';

/**
 * VenueMap Component
 * Renders an embedded Google Map with fallback for loading errors.
 *
 * @param {Object} props - Component props
 * @param {string} [props.embedUrl] - Custom Google Maps embed URL
 * @param {string} [props.mapUrl] - Direct link to Google Maps
 * @param {string} [props.title] - Accessible title for the iframe
 * @param {string} [props.height] - Height of the map iframe
 * @returns {JSX.Element} The venue map component
 */
function VenueMap({ embedUrl, mapUrl, title, height }) {
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  if (hasError) {
    return (
      <div className={styles.fallback} style={{ height }}>
        <div className={styles.fallbackContent}>
          <div className={styles.mapIcon}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <p className={styles.fallbackText}>Map could not be loaded</p>
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.fallbackLink}
          >
            Open in Google Maps
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.mapContainer}>
      <iframe
        src={embedUrl}
        width="100%"
        height={height}
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={title}
        onError={handleError}
        className={styles.mapFrame}
      />
    </div>
  );
}

VenueMap.propTypes = {
  embedUrl: PropTypes.string,
  mapUrl: PropTypes.string,
  title: PropTypes.string,
  height: PropTypes.string,
};

VenueMap.defaultProps = {
  embedUrl: VENUE.MAP_EMBED_URL,
  mapUrl: VENUE.MAP_URL,
  title: 'Venue location map',
  height: '400px',
};

export default VenueMap;
