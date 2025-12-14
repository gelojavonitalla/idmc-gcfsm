/**
 * AboutPage Component
 * Public-facing page that displays information about IDMC and GCF South Metro.
 *
 * @module pages/AboutPage
 */

import { Link } from 'react-router-dom';
import {
  CONFERENCE,
  ORGANIZATION,
  CONTACT,
  ROUTES,
} from '../constants';
import styles from './AboutPage.module.css';

/**
 * AboutPage Component
 * Renders the about page with IDMC history, mission, and organization info.
 *
 * @returns {JSX.Element} The about page component
 */
function AboutPage() {
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
              &quot;{CONFERENCE.THEME}&quot;
            </p>
            <p className={styles.sectionText}>
              The Intentional Disciple-Making Churches Conference (IDMC) is an annual gathering
              designed to equip and inspire churches to return to their disciple-making roots.
              We believe that every believer is called to make disciples who make disciples,
              transforming communities and nations for Christ.
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
              {ORGANIZATION.VISION}
            </p>
            <div className={styles.coreValues}>
              <h3 className={styles.coreValuesTitle}>Core Values</h3>
              <ul className={styles.valuesList}>
                {ORGANIZATION.CORE_VALUES.map((value, index) => (
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
            <p className={styles.sectionText}>
              IDMC was born out of a vision to see churches across the Philippines and beyond
              embrace intentional disciple-making as their primary mission. What started as a
              small gathering of church leaders has grown into a movement that impacts thousands
              of believers each year.
            </p>
            <p className={styles.sectionText}>
              Through plenary sessions, workshops, and fellowship, IDMC provides a platform
              for learning, sharing best practices, and encouraging one another in the
              disciple-making journey.
            </p>
            <div className={styles.milestones}>
              <div className={styles.milestone}>
                <span className={styles.milestoneNumber}>2023-2033</span>
                <span className={styles.milestoneText}>National Disciple-Making Campaign</span>
              </div>
              <div className={styles.milestone}>
                <span className={styles.milestoneNumber}>1000+</span>
                <span className={styles.milestoneText}>Churches Impacted</span>
              </div>
              <div className={styles.milestone}>
                <span className={styles.milestoneNumber}>10+</span>
                <span className={styles.milestoneText}>Years of Ministry</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About GCF South Metro Section */}
      <section className={styles.organizationSection}>
        <div className="container">
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>About {ORGANIZATION.NAME}</h2>
            <p className={styles.sectionText}>
              {ORGANIZATION.DESCRIPTION}
            </p>
            <p className={styles.sectionText}>
              <strong>Our Mission:</strong> {ORGANIZATION.MISSION}
            </p>
            <div className={styles.contactInfo}>
              <h3 className={styles.contactTitle}>Contact Information</h3>
              <div className={styles.contactDetails}>
                <p>
                  <strong>Email:</strong>{' '}
                  <a href={`mailto:${CONTACT.EMAIL}`} className={styles.link}>
                    {CONTACT.EMAIL}
                  </a>
                </p>
                <p>
                  <strong>Phone:</strong> {CONTACT.PHONE}
                </p>
                <p>
                  <strong>Mobile/Viber:</strong> {CONTACT.MOBILE}
                </p>
                <p>
                  <strong>Website:</strong>{' '}
                  <a
                    href={CONTACT.WEBSITE}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.link}
                  >
                    {CONTACT.WEBSITE}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className="container">
          <h2 className={styles.ctaTitle}>Join Us at IDMC {CONFERENCE.YEAR}</h2>
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
