/**
 * DownloadsPage Component
 * Public-facing page for downloading conference materials like the booklet.
 *
 * @module pages/DownloadsPage
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CONFERENCE,
  DOWNLOADS as FALLBACK_DOWNLOADS,
  ROUTES,
  DOWNLOAD_STATUS,
} from '../constants';
import { getPublishedDownloads } from '../services/downloads';
import styles from './DownloadsPage.module.css';

/**
 * DownloadsPage Component
 * Renders the downloads page where attendees can access conference materials.
 *
 * @returns {JSX.Element} The downloads page component
 */
function DownloadsPage() {
  const [downloads, setDownloads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetch downloads on mount
   */
  useEffect(() => {
    async function fetchDownloads() {
      setIsLoading(true);
      try {
        const data = await getPublishedDownloads();
        // If no downloads from Firestore, use fallback
        if (data.length === 0) {
          // Filter fallback to only show available ones
          setDownloads(FALLBACK_DOWNLOADS.filter((d) => d.isAvailable));
        } else {
          setDownloads(data);
        }
      } catch (error) {
        console.error('Failed to fetch downloads:', error);
        // Use fallback on error
        setDownloads(FALLBACK_DOWNLOADS.filter((d) => d.isAvailable));
      } finally {
        setIsLoading(false);
      }
    }

    fetchDownloads();
  }, []);

  /**
   * Handles download button click
   * Opens the download URL in a new tab for the file
   *
   * @param {Object} download - The download item object
   */
  function handleDownload(download) {
    if (download.downloadUrl) {
      window.open(download.downloadUrl, '_blank', 'noopener,noreferrer');
    }
  }

  /**
   * Check if download is available (has a download URL)
   *
   * @param {Object} download - The download item object
   * @returns {boolean} Whether the download is available
   */
  function isDownloadAvailable(download) {
    // For Firestore downloads, check status and downloadUrl
    if (download.status) {
      return download.status === DOWNLOAD_STATUS.PUBLISHED && download.downloadUrl;
    }
    // For fallback downloads, check isAvailable flag
    return download.isAvailable && download.downloadUrl;
  }

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className="container">
          <h1 className={styles.heroTitle}>Downloads</h1>
          <p className={styles.heroSubtitle}>
            Access conference materials and resources
          </p>
        </div>
      </section>

      {/* Downloads Section */}
      <section className={styles.downloadsSection}>
        <div className="container">
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>Conference Materials</h2>
            <p className={styles.sectionDescription}>
              Download the official IDMC {CONFERENCE.YEAR} conference booklet and other resources
              to help you make the most of your conference experience.
            </p>

            {isLoading ? (
              <div className={styles.loadingState}>
                <div className={styles.loadingSpinner} />
                <p>Loading downloads...</p>
              </div>
            ) : downloads.length === 0 ? (
              <div className={styles.emptyState}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <polyline points="9 15 12 18 15 15" />
                </svg>
                <p>Downloads will be available soon.</p>
                <p className={styles.emptyHint}>Check back closer to the conference date.</p>
              </div>
            ) : (
              <div className={styles.downloadsList}>
                {downloads.map((download) => (
                  <div key={download.id} className={styles.downloadCard}>
                    {download.thumbnailUrl ? (
                      <div className={styles.downloadThumbnail}>
                        <img
                          src={download.thumbnailUrl}
                          alt={`${download.title} cover`}
                          className={styles.thumbnailImage}
                        />
                      </div>
                    ) : (
                      <div className={styles.downloadIcon}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="48"
                          height="48"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="12" y1="18" x2="12" y2="12" />
                          <polyline points="9 15 12 18 15 15" />
                        </svg>
                      </div>
                    )}
                    <div className={styles.downloadInfo}>
                      <h3 className={styles.downloadTitle}>{download.title}</h3>
                      <p className={styles.downloadDescription}>{download.description}</p>
                      <div className={styles.downloadMeta}>
                        <span className={styles.fileType}>{download.fileType}</span>
                        <span className={styles.fileSize}>{download.fileSize}</span>
                      </div>
                    </div>
                    <div className={styles.downloadAction}>
                      {isDownloadAvailable(download) ? (
                        <button
                          type="button"
                          className={styles.downloadButton}
                          onClick={() => handleDownload(download)}
                          aria-label={`Download ${download.title}`}
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
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          Download
                        </button>
                      ) : (
                        <span className={styles.availableSoon}>Available Soon</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Instructions Section */}
      <section className={styles.instructionsSection}>
        <div className="container">
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>How to Use</h2>
            <div className={styles.instructionsList}>
              <div className={styles.instructionItem}>
                <div className={styles.instructionNumber}>1</div>
                <div className={styles.instructionContent}>
                  <h3 className={styles.instructionTitle}>Download</h3>
                  <p className={styles.instructionText}>
                    Click the download button to save the file to your device.
                  </p>
                </div>
              </div>
              <div className={styles.instructionItem}>
                <div className={styles.instructionNumber}>2</div>
                <div className={styles.instructionContent}>
                  <h3 className={styles.instructionTitle}>Review</h3>
                  <p className={styles.instructionText}>
                    Open and review the materials at your convenience.
                  </p>
                </div>
              </div>
              <div className={styles.instructionItem}>
                <div className={styles.instructionNumber}>3</div>
                <div className={styles.instructionContent}>
                  <h3 className={styles.instructionTitle}>Access Anytime</h3>
                  <p className={styles.instructionText}>
                    Keep the files on your device for easy reference during and after the conference.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className="container">
          <h2 className={styles.ctaTitle}>Ready to Join Us?</h2>
          <p className={styles.ctaText}>
            Register now to secure your spot at IDMC {CONFERENCE.YEAR}.
          </p>
          <div className={styles.ctaButtons}>
            <Link to={ROUTES.REGISTER} className={styles.ctaButtonPrimary}>
              Register Now
            </Link>
            <Link to={ROUTES.CONTACT} className={styles.ctaButtonSecondary}>
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default DownloadsPage;
