/**
 * PrivacyPolicyPage Component
 * Public-facing page that displays the privacy policy for IDMC Conference.
 *
 * @module pages/PrivacyPolicyPage
 */

import { Link } from 'react-router-dom';
import { CONTACT, ROUTES, CONFERENCE, ORGANIZATION } from '../constants';
import styles from './PrivacyPolicyPage.module.css';

/**
 * PrivacyPolicyPage Component
 * Renders the privacy policy page with data collection, usage, and protection information.
 *
 * @returns {JSX.Element} The privacy policy page component
 */
function PrivacyPolicyPage() {
  const lastUpdated = 'December 15, 2025';

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className="container">
          <h1 className={styles.heroTitle}>Privacy Policy</h1>
          <p className={styles.heroSubtitle}>
            Your privacy is important to us
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className={styles.contentSection}>
        <div className="container">
          <div className={styles.contentWrapper}>
            <p className={styles.lastUpdated}>Last updated: {lastUpdated}</p>

            {/* Introduction */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Introduction</h2>
              <p className={styles.text}>
                {ORGANIZATION.NAME} (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the IDMC
                (Intentional Disciple-Making Churches) Conference website and registration system.
                This Privacy Policy explains how we collect, use, disclose, and safeguard your
                information when you visit our website or register for the IDMC {CONFERENCE.YEAR} Conference.
              </p>
              <p className={styles.text}>
                By using our website or registering for the conference, you agree to the collection
                and use of information in accordance with this policy.
              </p>
            </div>

            {/* Information We Collect */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Information We Collect</h2>

              <h3 className={styles.subTitle}>Personal Information</h3>
              <p className={styles.text}>
                When you register for the conference, we collect the following personal information:
              </p>
              <ul className={styles.list}>
                <li>Full name (first name, middle name, last name)</li>
                <li>Email address</li>
                <li>Mobile/cellphone number</li>
                <li>Church name and location (city and province/region)</li>
                <li>Ministry role within your church</li>
                <li>Registration category (regular, student, or senior citizen)</li>
              </ul>

              <h3 className={styles.subTitle}>Payment Information</h3>
              <p className={styles.text}>
                For payment verification purposes, we collect:
              </p>
              <ul className={styles.list}>
                <li>Payment method selected (GCash or bank transfer)</li>
                <li>Proof of payment (screenshot or receipt image)</li>
              </ul>
              <p className={styles.text}>
                We do not store your actual bank account numbers, GCash PINs, or other sensitive
                financial credentials. Payment receipts are used solely for verification purposes.
              </p>

              <h3 className={styles.subTitle}>Invoice Information (Optional)</h3>
              <p className={styles.text}>
                If you request an official invoice, we additionally collect:
              </p>
              <ul className={styles.list}>
                <li>Name for invoice</li>
                <li>Tax Identification Number (TIN)</li>
                <li>Billing address</li>
              </ul>

              <h3 className={styles.subTitle}>Contact Inquiries</h3>
              <p className={styles.text}>
                When you submit inquiries through our contact form, we collect:
              </p>
              <ul className={styles.list}>
                <li>Your name</li>
                <li>Email address</li>
                <li>Message content</li>
              </ul>
            </div>

            {/* How We Use Your Information */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>How We Use Your Information</h2>
              <p className={styles.text}>
                We use the information we collect for the following purposes:
              </p>
              <ul className={styles.list}>
                <li>
                  <strong>Conference Registration:</strong> To process and confirm your registration
                  for the IDMC {CONFERENCE.YEAR} Conference
                </li>
                <li>
                  <strong>Payment Verification:</strong> To verify your payment and issue receipts
                </li>
                <li>
                  <strong>Communication:</strong> To send you important conference updates,
                  schedule changes, and event reminders
                </li>
                <li>
                  <strong>Check-in:</strong> To facilitate your check-in at the conference venue
                </li>
                <li>
                  <strong>Customer Support:</strong> To respond to your inquiries and provide assistance
                </li>
                <li>
                  <strong>Workshop Management:</strong> To manage workshop capacity and attendee allocation
                </li>
                <li>
                  <strong>Statistical Analysis:</strong> To understand attendee demographics and improve
                  future conferences (in aggregated, anonymized form)
                </li>
              </ul>
            </div>

            {/* Data Storage and Security */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Data Storage and Security</h2>
              <p className={styles.text}>
                Your personal information is stored securely using Google Firebase services,
                which employ industry-standard security measures including:
              </p>
              <ul className={styles.list}>
                <li>Encryption of data in transit and at rest</li>
                <li>Secure access controls and authentication</li>
                <li>Regular security audits and monitoring</li>
              </ul>
              <p className={styles.text}>
                While we implement reasonable security measures, no method of transmission over
                the Internet or electronic storage is 100% secure. We cannot guarantee absolute
                security of your data.
              </p>
            </div>

            {/* Data Sharing */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Data Sharing and Disclosure</h2>
              <p className={styles.text}>
                We do not sell, trade, or rent your personal information to third parties.
                We may share your information only in the following circumstances:
              </p>
              <ul className={styles.list}>
                <li>
                  <strong>Service Providers:</strong> With trusted service providers who assist
                  in operating our website and conducting the conference (e.g., Firebase/Google Cloud)
                </li>
                <li>
                  <strong>Legal Requirements:</strong> When required by law or to respond to
                  legal processes
                </li>
                <li>
                  <strong>Church Coordination:</strong> Basic registration counts may be shared
                  with church leaders for coordination purposes (without detailed personal information)
                </li>
              </ul>
            </div>

            {/* Data Retention */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Data Retention</h2>
              <p className={styles.text}>
                We retain your personal information for as long as necessary to fulfill the
                purposes outlined in this policy, typically:
              </p>
              <ul className={styles.list}>
                <li>Registration data: Up to 2 years after the conference for record-keeping
                  and future event planning</li>
                <li>Payment receipts: Up to 3 years for financial record-keeping requirements</li>
                <li>Contact inquiries: Up to 1 year after resolution</li>
              </ul>
              <p className={styles.text}>
                After these periods, your data will be securely deleted or anonymized.
              </p>
            </div>

            {/* Your Rights */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Your Rights</h2>
              <p className={styles.text}>
                Under the Philippine Data Privacy Act of 2012 (Republic Act No. 10173),
                you have the following rights:
              </p>
              <ul className={styles.list}>
                <li>
                  <strong>Right to Access:</strong> You may request access to your personal
                  information that we hold
                </li>
                <li>
                  <strong>Right to Correction:</strong> You may request correction of inaccurate
                  or incomplete personal information
                </li>
                <li>
                  <strong>Right to Erasure:</strong> You may request deletion of your personal
                  information, subject to legal retention requirements
                </li>
                <li>
                  <strong>Right to Object:</strong> You may object to the processing of your
                  personal information in certain circumstances
                </li>
                <li>
                  <strong>Right to Data Portability:</strong> You may request a copy of your
                  personal information in a structured, commonly used format
                </li>
              </ul>
              <p className={styles.text}>
                To exercise these rights, please contact us using the information provided below.
              </p>
            </div>

            {/* Cookies */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Cookies and Tracking</h2>
              <p className={styles.text}>
                Our website may use cookies and similar tracking technologies to enhance your
                browsing experience. These are small files stored on your device that help us:
              </p>
              <ul className={styles.list}>
                <li>Remember your preferences</li>
                <li>Understand how you interact with our website</li>
                <li>Improve our website functionality</li>
              </ul>
              <p className={styles.text}>
                You can configure your browser to refuse cookies, but this may limit some
                features of our website.
              </p>
            </div>

            {/* Children's Privacy */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Children&apos;s Privacy</h2>
              <p className={styles.text}>
                Our conference and registration system is intended for adults and church
                leaders. We do not knowingly collect personal information from children under
                18 years of age without parental consent. If you believe we have collected
                information from a minor, please contact us immediately.
              </p>
            </div>

            {/* Changes to This Policy */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Changes to This Privacy Policy</h2>
              <p className={styles.text}>
                We may update this Privacy Policy from time to time. We will notify you of
                any changes by posting the new Privacy Policy on this page and updating the
                &quot;Last updated&quot; date. You are advised to review this Privacy Policy periodically
                for any changes.
              </p>
            </div>

            {/* Contact Us */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Contact Us</h2>
              <p className={styles.text}>
                If you have any questions about this Privacy Policy or wish to exercise your
                data privacy rights, please contact us:
              </p>
              <div className={styles.contactInfo}>
                <p><strong>{ORGANIZATION.NAME}</strong></p>
                <p>Email: <a href={`mailto:${CONTACT.EMAIL}`} className={styles.link}>{CONTACT.EMAIL}</a></p>
                <p>Phone: {CONTACT.PHONE}</p>
                <p>Mobile/Viber: {CONTACT.MOBILE}</p>
                <p>Website: <a href={CONTACT.WEBSITE} target="_blank" rel="noopener noreferrer" className={styles.link}>{CONTACT.WEBSITE}</a></p>
              </div>
            </div>

            {/* Back to Home */}
            <div className={styles.navigation}>
              <Link to={ROUTES.HOME} className={styles.backLink}>
                &larr; Back to Home
              </Link>
              <Link to={ROUTES.TERMS} className={styles.navLink}>
                Terms of Service &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default PrivacyPolicyPage;
