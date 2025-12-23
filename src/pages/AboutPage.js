/**
 * AboutPage Component
 * Public-facing page that displays information about IDMC and GCF South Metro.
 * Content is dynamically loaded from Firestore via SettingsContext.
 *
 * @module pages/AboutPage
 */

import { Link } from 'react-router-dom';
import { ROUTES } from '../constants';
import { useSettings } from '../context/SettingsContext';
import styles from './AboutPage.module.css';

/**
 * Default content for About IDMC section
 */
const DEFAULT_ABOUT_IDMC = {
  mission:
    'The Intentional Disciple-Making Churches Conference (IDMC) is an annual gathering designed to equip and inspire churches to return to their disciple-making roots. We believe that every believer is called to make disciples who make disciples, transforming communities and nations for Christ.',
  vision: '',
  history:
    'IDMC was born out of a vision to see churches across the Philippines and beyond embrace intentional disciple-making as their primary mission. What started as a small gathering of church leaders has grown into a movement that impacts thousands of believers each year.\n\nThrough plenary sessions, workshops, and fellowship, IDMC provides a platform for learning, sharing best practices, and encouraging one another in the disciple-making journey.',
  milestones: [
    { label: '2023-2033', description: 'National Disciple-Making Campaign' },
    { label: '1000+', description: 'Churches Impacted' },
    { label: '10+', description: 'Years of Ministry' },
  ],
};

/**
 * Default content for About GCF section
 */
const DEFAULT_ABOUT_GCF = {
  name: 'GCF South Metro',
  mission: 'To love God, to love people and to make multiplying disciples.',
  vision:
    'To be a disciple-making congregation that reaches local communities while impacting the broader region and world.',
  description:
    'GCF South Metro is a disciple-making church focused on three interconnected activities: drawing individuals toward Christ, developing their faith, and deploying them for ministry purposes.',
  coreValues: [
    'Truth grounded in Scripture',
    'Love demonstrated in relationships',
    'Empowerment through the Holy Spirit',
    'Excellence through dedicated effort',
  ],
};

/**
 * AboutPage Component
 * Renders the about page with IDMC history, mission, and organization info.
 * Content is fetched from Firestore and falls back to defaults if not available.
 *
 * @returns {JSX.Element} The about page component
 */
function AboutPage() {
  const { settings: dbSettings, isLoading: isLoadingSettings } = useSettings();
  // Use settings only after Firebase has loaded
  const settings = isLoadingSettings ? null : dbSettings;

  // Get about content from settings or use defaults
  const aboutIdmc = settings?.aboutIdmc || DEFAULT_ABOUT_IDMC;
  const aboutGcf = settings?.aboutGcf || DEFAULT_ABOUT_GCF;
  const conferenceTheme = settings?.theme || 'All In for Jesus and His Kingdom';
  const conferenceYear = settings?.year || 2026;

  // Parse history paragraphs (split by double newlines)
  const historyParagraphs = (aboutIdmc.history || DEFAULT_ABOUT_IDMC.history)
    .split('\n\n')
    .filter((p) => p.trim());

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className="container">
          <h1 className={styles.heroTitle}>About IDMC</h1>
          <p className={styles.heroSubtitle}>
            Intentional Disciple-Making Churches Conference
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className={styles.missionSection}>
        <div className="container">
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>Our Mission</h2>
            <p className={styles.missionStatement}>
              &quot;{conferenceTheme}&quot;
            </p>
            <p className={styles.sectionText}>
              {aboutIdmc.mission || DEFAULT_ABOUT_IDMC.mission}
            </p>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className={styles.visionSection}>
        <div className="container">
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>Our Vision</h2>
            <p className={styles.sectionText}>
              {aboutGcf.vision || DEFAULT_ABOUT_GCF.vision}
            </p>
            <div className={styles.coreValues}>
              <h3 className={styles.coreValuesTitle}>Core Values</h3>
              <ul className={styles.valuesList}>
                {(aboutGcf.coreValues || DEFAULT_ABOUT_GCF.coreValues).map((value, index) => (
                  <li key={index} className={styles.valueItem}>
                    <span className={styles.valueIcon}>
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
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    {value}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* History Section */}
      <section className={styles.historySection}>
        <div className="container">
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>IDMC History</h2>
            {historyParagraphs.map((paragraph, index) => (
              <p key={index} className={styles.sectionText}>
                {paragraph}
              </p>
            ))}
            <div className={styles.milestones}>
              {(aboutIdmc.milestones || DEFAULT_ABOUT_IDMC.milestones).map((milestone, index) => (
                <div key={index} className={styles.milestone}>
                  <span className={styles.milestoneNumber}>{milestone.label}</span>
                  <span className={styles.milestoneText}>{milestone.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About GCF South Metro Section */}
      <section className={styles.organizationSection}>
        <div className="container">
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>About {aboutGcf.name || DEFAULT_ABOUT_GCF.name}</h2>
            <p className={styles.sectionText}>
              {aboutGcf.description || DEFAULT_ABOUT_GCF.description}
            </p>
            <p className={styles.sectionText}>
              <strong>Our Mission:</strong> {aboutGcf.mission || DEFAULT_ABOUT_GCF.mission}
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className="container">
          <h2 className={styles.ctaTitle}>Join Us at IDMC {conferenceYear}</h2>
          <p className={styles.ctaText}>
            Be part of the movement to transform nations through intentional disciple-making.
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

export default AboutPage;
