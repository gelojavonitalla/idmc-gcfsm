/**
 * TermsOfServicePage Component
 * Public-facing page that displays the terms of service for IDMC Conference.
 * Fetches configurable content from Firestore, with fallback to static content.
 *
 * @module pages/TermsOfServicePage
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CONTACT, ROUTES, CONFERENCE, ORGANIZATION, PRICING_TIERS } from '../constants';
import { getConferenceSettings } from '../services';
import styles from './TermsOfServicePage.module.css';

/**
 * Formats text content by converting newlines to paragraphs and handling lists.
 *
 * @param {string} content - Raw content string
 * @returns {JSX.Element[]} Formatted content elements
 */
function formatContent(content) {
  if (!content) {
    return null;
  }

  const paragraphs = content.split('\n\n').filter((p) => p.trim());

  return paragraphs.map((paragraph, index) => {
    const trimmed = paragraph.trim();

    // Check if it's a list (starts with - or *)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const items = trimmed.split('\n').filter((item) => item.trim());
      return (
        <ul key={index} className={styles.list}>
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{item.replace(/^[-*]\s*/, '')}</li>
          ))}
        </ul>
      );
    }

    // Check if it's a numbered list
    if (/^\d+\.\s/.test(trimmed)) {
      const items = trimmed.split('\n').filter((item) => item.trim());
      return (
        <ol key={index} className={styles.orderedList}>
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{item.replace(/^\d+\.\s*/, '')}</li>
          ))}
        </ol>
      );
    }

    // Regular paragraph - handle single line breaks within paragraph
    const lines = trimmed.split('\n');
    return (
      <p key={index} className={styles.text}>
        {lines.map((line, lineIndex) => (
          <span key={lineIndex}>
            {line}
            {lineIndex < lines.length - 1 && <br />}
          </span>
        ))}
      </p>
    );
  });
}

/**
 * TermsOfServicePage Component
 * Renders the terms of service page with registration, payment, and conduct policies.
 *
 * @returns {JSX.Element} The terms of service page component
 */
function TermsOfServicePage() {
  const [termsData, setTermsData] = useState(null);

  const currentPricing = PRICING_TIERS[0];
  const fallbackLastUpdated = 'December 15, 2025';

  useEffect(() => {
    /**
     * Fetches terms of service content from settings
     */
    async function fetchTermsContent() {
      try {
        const settings = await getConferenceSettings();
        if (settings.termsOfService) {
          setTermsData(settings.termsOfService);
        }
      } catch (error) {
        console.error('Failed to fetch terms content:', error);
      }
    }

    fetchTermsContent();
  }, []);

  /**
   * Gets section content from Firestore data or returns null for fallback
   *
   * @param {string} sectionId - Section identifier
   * @returns {string|null} Section content or null
   */
  const getSectionContent = (sectionId) => {
    if (!termsData?.sections) {
      return null;
    }
    const section = termsData.sections.find((s) => s.id === sectionId);
    return section?.content || null;
  };

  /**
   * Checks if a section has custom content
   *
   * @param {string} sectionId - Section identifier
   * @returns {boolean} Whether section has content
   */
  const hasCustomContent = (sectionId) => {
    const content = getSectionContent(sectionId);
    return content && content.trim().length > 0;
  };

  const lastUpdated = termsData?.lastUpdated || fallbackLastUpdated;

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className="container">
          <h1 className={styles.heroTitle}>Terms of Service</h1>
          <p className={styles.heroSubtitle}>
            Terms and conditions for IDMC Conference registration
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
              <h2 className={styles.sectionTitle}>Agreement to Terms</h2>
              {hasCustomContent('agreement') ? (
                formatContent(getSectionContent('agreement'))
              ) : (
                <>
                  <p className={styles.text}>
                    By registering for the IDMC (Intentional Disciple-Making Churches) Conference {CONFERENCE.YEAR},
                    organized by {ORGANIZATION.NAME}, you agree to be bound by these Terms of Service
                    (&quot;Terms&quot;). If you do not agree to these Terms, please do not register for the conference.
                  </p>
                  <p className={styles.text}>
                    These Terms govern your registration, participation, and conduct at the conference.
                    Please read them carefully before completing your registration.
                  </p>
                </>
              )}
            </div>

            {/* Registration */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Registration</h2>
              {hasCustomContent('registration') ? (
                formatContent(getSectionContent('registration'))
              ) : (
                <>
                  <h3 className={styles.subTitle}>Eligibility</h3>
                  <p className={styles.text}>
                    The IDMC Conference is open to church leaders, pastors, ministry workers, and
                    believers who are committed to intentional disciple-making. By registering, you
                    confirm that:
                  </p>
                  <ul className={styles.list}>
                    <li>You are at least 18 years of age, or have parental/guardian consent if a minor</li>
                    <li>All information provided in your registration is accurate and complete</li>
                    <li>You will attend the conference in person at the designated venue</li>
                  </ul>

                  <h3 className={styles.subTitle}>Registration Process</h3>
                  <p className={styles.text}>
                    To complete your registration:
                  </p>
                  <ol className={styles.orderedList}>
                    <li>Fill out the online registration form with accurate personal and church information</li>
                    <li>Select your registration category (Regular or Student/Senior Citizen)</li>
                    <li>Complete payment via GCash or bank transfer</li>
                    <li>Upload your proof of payment</li>
                    <li>Receive email confirmation once your payment is verified</li>
                  </ol>
                  <p className={styles.text}>
                    Your registration is not confirmed until payment has been verified by our team.
                  </p>

                  <h3 className={styles.subTitle}>Registration Categories</h3>
                  <div className={styles.pricingInfo}>
                    <div className={styles.pricingItem}>
                      <span className={styles.pricingLabel}>Regular Registration:</span>
                      <span className={styles.pricingAmount}>PHP {currentPricing.regularPrice}</span>
                    </div>
                    <div className={styles.pricingItem}>
                      <span className={styles.pricingLabel}>Student/Senior Citizen:</span>
                      <span className={styles.pricingAmount}>PHP {currentPricing.studentPrice}</span>
                    </div>
                  </div>
                  <p className={styles.text}>
                    Students and senior citizens (60 years and above) must present a valid ID at
                    check-in to verify their eligibility for the discounted rate.
                  </p>
                </>
              )}
            </div>

            {/* Payment */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Payment Terms</h2>
              {hasCustomContent('payment') ? (
                formatContent(getSectionContent('payment'))
              ) : (
                <>
                  <h3 className={styles.subTitle}>Accepted Payment Methods</h3>
                  <p className={styles.text}>
                    We accept the following payment methods:
                  </p>
                  <ul className={styles.list}>
                    <li><strong>GCash:</strong> Transfer to our official GCash number</li>
                    <li><strong>Bank Transfer:</strong> Deposit to our BDO account</li>
                  </ul>
                  <p className={styles.text}>
                    Payment details will be provided during the registration process. Please ensure
                    you upload a clear screenshot or photo of your payment receipt.
                  </p>

                  <h3 className={styles.subTitle}>Payment Deadline</h3>
                  <p className={styles.text}>
                    Payment must be completed within 7 days of submitting your registration form.
                    Registrations without payment verification after this period may be cancelled
                    to free up slots for other attendees.
                  </p>

                  <h3 className={styles.subTitle}>What&apos;s Included</h3>
                  <p className={styles.text}>
                    Your registration fee includes:
                  </p>
                  <ul className={styles.list}>
                    <li>Full access to all plenary sessions</li>
                    <li>Participation in one afternoon workshop</li>
                    <li>Conference materials and booklet</li>
                    <li>Lunch and refreshments</li>
                    <li>Certificate of participation (upon request)</li>
                  </ul>
                </>
              )}
            </div>

            {/* Cancellation and Refunds */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Cancellation and Refund Policy</h2>
              {hasCustomContent('cancellation') ? (
                formatContent(getSectionContent('cancellation'))
              ) : (
                <>
                  <h3 className={styles.subTitle}>Attendee Cancellation</h3>
                  <ul className={styles.list}>
                    <li>
                      <strong>More than 14 days before the event:</strong> Full refund minus a
                      PHP 50 processing fee
                    </li>
                    <li>
                      <strong>7-14 days before the event:</strong> 50% refund
                    </li>
                    <li>
                      <strong>Less than 7 days before the event:</strong> No refund, but registration
                      may be transferred to another person
                    </li>
                  </ul>

                  <h3 className={styles.subTitle}>Registration Transfer</h3>
                  <p className={styles.text}>
                    You may transfer your registration to another person by contacting us at least
                    3 days before the event. The new attendee must complete a registration form with
                    their information. No additional fee is charged for transfers.
                  </p>

                  <h3 className={styles.subTitle}>Event Cancellation by Organizer</h3>
                  <p className={styles.text}>
                    In the unlikely event that we need to cancel the conference due to circumstances
                    beyond our control (natural disasters, government restrictions, etc.), registered
                    attendees will be offered:
                  </p>
                  <ul className={styles.list}>
                    <li>Full refund of the registration fee, or</li>
                    <li>Transfer of registration to a rescheduled date</li>
                  </ul>
                </>
              )}
            </div>

            {/* Conference Conduct */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Conference Conduct</h2>
              {hasCustomContent('conduct') ? (
                formatContent(getSectionContent('conduct'))
              ) : (
                <>
                  <h3 className={styles.subTitle}>Expected Behavior</h3>
                  <p className={styles.text}>
                    As a Christian conference focused on disciple-making, we expect all attendees to:
                  </p>
                  <ul className={styles.list}>
                    <li>Conduct themselves in a manner consistent with Christian values</li>
                    <li>Treat fellow attendees, speakers, and staff with respect and courtesy</li>
                    <li>Follow venue rules and safety guidelines</li>
                    <li>Arrive on time for sessions</li>
                    <li>Silence mobile phones during sessions</li>
                    <li>Refrain from disruptive behavior</li>
                  </ul>

                  <h3 className={styles.subTitle}>Prohibited Conduct</h3>
                  <p className={styles.text}>
                    The following behaviors are strictly prohibited:
                  </p>
                  <ul className={styles.list}>
                    <li>Harassment, discrimination, or intimidation of any kind</li>
                    <li>Unauthorized recording or live streaming of sessions</li>
                    <li>Solicitation or unauthorized sales of products/services</li>
                    <li>Distribution of materials not approved by the organizers</li>
                    <li>Any illegal activity</li>
                  </ul>
                  <p className={styles.text}>
                    Violation of these conduct guidelines may result in removal from the conference
                    without refund.
                  </p>
                </>
              )}
            </div>

            {/* Intellectual Property */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Intellectual Property</h2>
              {hasCustomContent('intellectual-property') ? (
                formatContent(getSectionContent('intellectual-property'))
              ) : (
                <>
                  <p className={styles.text}>
                    All conference content, including but not limited to presentations, materials,
                    and recordings, are the intellectual property of {ORGANIZATION.NAME} and/or the
                    respective speakers. You may not:
                  </p>
                  <ul className={styles.list}>
                    <li>Record, reproduce, or distribute conference sessions without written permission</li>
                    <li>Use conference materials for commercial purposes</li>
                    <li>Modify or create derivative works from conference content</li>
                  </ul>
                  <p className={styles.text}>
                    Personal note-taking and sharing of key insights with your church community for
                    ministry purposes is encouraged.
                  </p>
                </>
              )}
            </div>

            {/* Photography and Media */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Photography and Media Consent</h2>
              {hasCustomContent('media-consent') ? (
                formatContent(getSectionContent('media-consent'))
              ) : (
                <>
                  <p className={styles.text}>
                    By attending the conference, you grant {ORGANIZATION.NAME} permission to:
                  </p>
                  <ul className={styles.list}>
                    <li>Photograph and record video/audio of the event, which may include your image</li>
                    <li>Use such recordings for promotional, educational, and ministry purposes</li>
                    <li>Publish recordings on our website, social media, and other platforms</li>
                  </ul>
                  <p className={styles.text}>
                    If you do not wish to be photographed or recorded, please inform our registration
                    desk upon check-in.
                  </p>
                </>
              )}
            </div>

            {/* Liability */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Limitation of Liability</h2>
              {hasCustomContent('liability') ? (
                formatContent(getSectionContent('liability'))
              ) : (
                <>
                  <p className={styles.text}>
                    {ORGANIZATION.NAME} and its staff, volunteers, and partners:
                  </p>
                  <ul className={styles.list}>
                    <li>
                      Are not responsible for any loss, theft, or damage to personal belongings
                      during the conference
                    </li>
                    <li>
                      Are not liable for any injury or accident that may occur during the event,
                      except in cases of gross negligence
                    </li>
                    <li>
                      Do not guarantee specific outcomes or results from attending the conference
                    </li>
                  </ul>
                  <p className={styles.text}>
                    Attendees are encouraged to have personal health insurance and to take reasonable
                    precautions for their own safety and belongings.
                  </p>
                </>
              )}
            </div>

            {/* Health and Safety */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Health and Safety</h2>
              {hasCustomContent('health-safety') ? (
                formatContent(getSectionContent('health-safety'))
              ) : (
                <>
                  <p className={styles.text}>
                    We are committed to providing a safe environment for all attendees. We may
                    implement health and safety measures in accordance with local government
                    guidelines, which may include:
                  </p>
                  <ul className={styles.list}>
                    <li>Health declaration forms</li>
                    <li>Temperature checks at entry</li>
                    <li>Mask requirements in certain areas</li>
                    <li>Physical distancing measures</li>
                  </ul>
                  <p className={styles.text}>
                    Please do not attend if you are feeling unwell or have been exposed to
                    infectious diseases. Contact us for registration transfer or refund options.
                  </p>
                </>
              )}
            </div>

            {/* Changes to Terms */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Changes to These Terms</h2>
              {hasCustomContent('changes') ? (
                formatContent(getSectionContent('changes'))
              ) : (
                <p className={styles.text}>
                  We reserve the right to modify these Terms at any time. Significant changes
                  will be communicated to registered attendees via email. Your continued
                  participation in the conference after such changes constitutes acceptance
                  of the updated Terms.
                </p>
              )}
            </div>

            {/* Governing Law */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Governing Law</h2>
              {hasCustomContent('governing-law') ? (
                formatContent(getSectionContent('governing-law'))
              ) : (
                <p className={styles.text}>
                  These Terms shall be governed by and construed in accordance with the laws
                  of the Republic of the Philippines. Any disputes arising from these Terms
                  shall be resolved through amicable settlement, and if necessary, through
                  the appropriate courts of Las Piñas City, Metro Manila.
                </p>
              )}
            </div>

            {/* Contact Us */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Contact Us</h2>
              <p className={styles.text}>
                If you have any questions about these Terms of Service, please contact us:
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
              <Link to={ROUTES.PRIVACY} className={styles.navLink}>
                Privacy Policy &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default TermsOfServicePage;
