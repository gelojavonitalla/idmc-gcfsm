/**
 * Seed Legal Content Script
 * Populates Firestore with Terms of Service and Privacy Policy content.
 *
 * Usage:
 *   node scripts/seed-legal.js          # Seed legal content (skips if exists)
 *   node scripts/seed-legal.js --clear  # Clear and reseed
 *   node scripts/seed-legal.js --force  # Force reseed without clearing
 *
 * Prerequisites:
 *   - Firebase CLI installed and logged in
 *   - GOOGLE_APPLICATION_CREDENTIALS env var set to service account key path
 *     OR run with: firebase emulators:exec "node scripts/seed-legal.js"
 *
 * For local emulator:
 *   export FIRESTORE_EMULATOR_HOST="localhost:8080"
 *   node scripts/seed-legal.js
 */

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Collection name constant
const COLLECTIONS = {
  CONFERENCES: 'conferences',
};

// Settings document ID (singleton)
const SETTINGS_DOC_ID = 'conference-settings';

// Firestore database ID (named database)
const DATABASE_ID = 'idmc-2026';

/**
 * Terms of Service seed data
 */
const TERMS_OF_SERVICE_DATA = {
  lastUpdated: 'December 15, 2025',
  sections: [
    {
      id: 'agreement',
      title: 'Agreement to Terms',
      content: `By registering for the IDMC (Intentional Disciple-Making Churches) Conference 2026, organized by GCF South Metro, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not register for the conference.

These Terms govern your registration, participation, and conduct at the conference. Please read them carefully before completing your registration.`,
    },
    {
      id: 'registration',
      title: 'Registration',
      content: `Eligibility

The IDMC Conference is open to church leaders, pastors, ministry workers, and believers who are committed to intentional disciple-making. By registering, you confirm that:

- You are at least 18 years of age, or have parental/guardian consent if a minor
- All information provided in your registration is accurate and complete
- You will attend the conference in person at the designated venue

Registration Process

To complete your registration:

1. Fill out the online registration form with accurate personal and church information
2. Select your registration category (Regular or Student/Senior Citizen)
3. Complete payment via GCash or bank transfer
4. Upload your proof of payment
5. Receive email confirmation once your payment is verified

Your registration is not confirmed until payment has been verified by our team.

Registration Categories

- Regular Registration: PHP 500
- Student/Senior Citizen: PHP 300

Students and senior citizens (60 years and above) must present a valid ID at check-in to verify their eligibility for the discounted rate.`,
    },
    {
      id: 'payment',
      title: 'Payment Terms',
      content: `Accepted Payment Methods

We accept the following payment methods:

- GCash: Transfer to our official GCash number
- Bank Transfer: Deposit to our BDO account

Payment details will be provided during the registration process. Please ensure you upload a clear screenshot or photo of your payment receipt.

Payment Deadline

Payment must be completed within 7 days of submitting your registration form. Registrations without payment verification after this period may be cancelled to free up slots for other attendees.

What's Included

Your registration fee includes:

- Full access to all plenary sessions
- Participation in one afternoon workshop
- Conference materials and booklet
- Lunch and refreshments
- Certificate of participation (upon request)`,
    },
    {
      id: 'cancellation',
      title: 'Cancellation and Refund Policy',
      content: `Attendee Cancellation

- More than 14 days before the event: Full refund minus a PHP 50 processing fee
- 7-14 days before the event: 50% refund
- Less than 7 days before the event: No refund, but registration may be transferred to another person

Registration Transfer

You may transfer your registration to another person by contacting us at least 3 days before the event. The new attendee must complete a registration form with their information. No additional fee is charged for transfers.

Event Cancellation by Organizer

In the unlikely event that we need to cancel the conference due to circumstances beyond our control (natural disasters, government restrictions, etc.), registered attendees will be offered:

- Full refund of the registration fee, or
- Transfer of registration to a rescheduled date`,
    },
    {
      id: 'conduct',
      title: 'Conference Conduct',
      content: `Expected Behavior

As a Christian conference focused on disciple-making, we expect all attendees to:

- Conduct themselves in a manner consistent with Christian values
- Treat fellow attendees, speakers, and staff with respect and courtesy
- Follow venue rules and safety guidelines
- Arrive on time for sessions
- Silence mobile phones during sessions
- Refrain from disruptive behavior

Prohibited Conduct

The following behaviors are strictly prohibited:

- Harassment, discrimination, or intimidation of any kind
- Unauthorized recording or live streaming of sessions
- Solicitation or unauthorized sales of products/services
- Distribution of materials not approved by the organizers
- Any illegal activity

Violation of these conduct guidelines may result in removal from the conference without refund.`,
    },
    {
      id: 'intellectual-property',
      title: 'Intellectual Property',
      content: `All conference content, including but not limited to presentations, materials, and recordings, are the intellectual property of GCF South Metro and/or the respective speakers. You may not:

- Record, reproduce, or distribute conference sessions without written permission
- Use conference materials for commercial purposes
- Modify or create derivative works from conference content

Personal note-taking and sharing of key insights with your church community for ministry purposes is encouraged.`,
    },
    {
      id: 'media-consent',
      title: 'Photography and Media Consent',
      content: `By attending the conference, you grant GCF South Metro permission to:

- Photograph and record video/audio of the event, which may include your image
- Use such recordings for promotional, educational, and ministry purposes
- Publish recordings on our website, social media, and other platforms

If you do not wish to be photographed or recorded, please inform our registration desk upon check-in.`,
    },
    {
      id: 'liability',
      title: 'Limitation of Liability',
      content: `GCF South Metro and its staff, volunteers, and partners:

- Are not responsible for any loss, theft, or damage to personal belongings during the conference
- Are not liable for any injury or accident that may occur during the event, except in cases of gross negligence
- Do not guarantee specific outcomes or results from attending the conference

Attendees are encouraged to have personal health insurance and to take reasonable precautions for their own safety and belongings.`,
    },
    {
      id: 'health-safety',
      title: 'Health and Safety',
      content: `We are committed to providing a safe environment for all attendees. We may implement health and safety measures in accordance with local government guidelines, which may include:

- Health declaration forms
- Temperature checks at entry
- Mask requirements in certain areas
- Physical distancing measures

Please do not attend if you are feeling unwell or have been exposed to infectious diseases. Contact us for registration transfer or refund options.`,
    },
    {
      id: 'changes',
      title: 'Changes to These Terms',
      content: `We reserve the right to modify these Terms at any time. Significant changes will be communicated to registered attendees via email. Your continued participation in the conference after such changes constitutes acceptance of the updated Terms.`,
    },
    {
      id: 'governing-law',
      title: 'Governing Law',
      content: `These Terms shall be governed by and construed in accordance with the laws of the Republic of the Philippines. Any disputes arising from these Terms shall be resolved through amicable settlement, and if necessary, through the appropriate courts of Las Piñas City, Metro Manila.`,
    },
  ],
};

/**
 * Privacy Policy seed data
 */
const PRIVACY_POLICY_DATA = {
  lastUpdated: 'December 15, 2025',
  sections: [
    {
      id: 'introduction',
      title: 'Introduction',
      content: `GCF South Metro ("we," "us," or "our") operates the IDMC (Intentional Disciple-Making Churches) Conference website and registration system. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or register for the IDMC 2026 Conference.

By using our website or registering for the conference, you agree to the collection and use of information in accordance with this policy.`,
    },
    {
      id: 'information-collected',
      title: 'Information We Collect',
      content: `Personal Information

When you register for the conference, we collect the following personal information:

- Full name (first name, middle name, last name)
- Email address
- Mobile/cellphone number
- Church name and location (city and province/region)
- Ministry role within your church
- Registration category (regular, student, or senior citizen)

Payment Information

For payment verification purposes, we collect:

- Payment method selected (GCash or bank transfer)
- Proof of payment (screenshot or receipt image)

We do not store your actual bank account numbers, GCash PINs, or other sensitive financial credentials. Payment receipts are used solely for verification purposes.

Invoice Information (Optional)

If you request an official invoice, we additionally collect:

- Name for invoice
- Tax Identification Number (TIN)
- Billing address

Contact Inquiries

When you submit inquiries through our contact form, we collect:

- Your name
- Email address
- Message content`,
    },
    {
      id: 'information-use',
      title: 'How We Use Your Information',
      content: `We use the information we collect for the following purposes:

- Conference Registration: To process and confirm your registration for the IDMC 2026 Conference
- Payment Verification: To verify your payment and issue receipts
- Communication: To send you important conference updates, schedule changes, and event reminders
- Check-in: To facilitate your check-in at the conference venue
- Customer Support: To respond to your inquiries and provide assistance
- Workshop Management: To manage workshop capacity and attendee allocation
- Statistical Analysis: To understand attendee demographics and improve future conferences (in aggregated, anonymized form)`,
    },
    {
      id: 'data-storage',
      title: 'Data Storage and Security',
      content: `Your personal information is stored securely using Google Firebase services, which employ industry-standard security measures including:

- Encryption of data in transit and at rest
- Secure access controls and authentication
- Regular security audits and monitoring

While we implement reasonable security measures, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security of your data.`,
    },
    {
      id: 'data-sharing',
      title: 'Data Sharing and Disclosure',
      content: `We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:

- Service Providers: With trusted service providers who assist in operating our website and conducting the conference (e.g., Firebase/Google Cloud)
- Legal Requirements: When required by law or to respond to legal processes
- Church Coordination: Basic registration counts may be shared with church leaders for coordination purposes (without detailed personal information)`,
    },
    {
      id: 'data-retention',
      title: 'Data Retention',
      content: `We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy, typically:

- Registration data: Up to 2 years after the conference for record-keeping and future event planning
- Payment receipts: Up to 3 years for financial record-keeping requirements
- Contact inquiries: Up to 1 year after resolution

After these periods, your data will be securely deleted or anonymized.`,
    },
    {
      id: 'your-rights',
      title: 'Your Rights',
      content: `Under the Philippine Data Privacy Act of 2012 (Republic Act No. 10173), you have the following rights:

- Right to Access: You may request access to your personal information that we hold
- Right to Correction: You may request correction of inaccurate or incomplete personal information
- Right to Erasure: You may request deletion of your personal information, subject to legal retention requirements
- Right to Object: You may object to the processing of your personal information in certain circumstances
- Right to Data Portability: You may request a copy of your personal information in a structured, commonly used format

To exercise these rights, please contact us using the information provided below.`,
    },
    {
      id: 'cookies',
      title: 'Cookies and Tracking',
      content: `Our website may use cookies and similar tracking technologies to enhance your browsing experience. These are small files stored on your device that help us:

- Remember your preferences
- Understand how you interact with our website
- Improve our website functionality

You can configure your browser to refuse cookies, but this may limit some features of our website.`,
    },
    {
      id: 'children',
      title: "Children's Privacy",
      content: `Our conference and registration system is intended for adults and church leaders. We do not knowingly collect personal information from children under 18 years of age without parental consent. If you believe we have collected information from a minor, please contact us immediately.`,
    },
    {
      id: 'changes',
      title: 'Changes to This Privacy Policy',
      content: `We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.`,
    },
  ],
};

/**
 * Initialize Firebase Admin SDK
 * Will use emulator if FIRESTORE_EMULATOR_HOST is set
 */
function initializeFirebase() {
  // Check if already initialized
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Initialize with default credentials (will use emulator if env var is set)
  admin.initializeApp({
    projectId: process.env.GCLOUD_PROJECT || 'idmc-gcfsm-dev',
  });

  return admin.app();
}

/**
 * Seed legal content to Firestore
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<void>}
 */
async function seedLegalContent(db) {
  const settingsRef = db.collection(COLLECTIONS.CONFERENCES).doc(SETTINGS_DOC_ID);
  const now = admin.firestore.Timestamp.now();

  console.log('\nSeeding legal content...');

  // Get existing settings
  const settingsDoc = await settingsRef.get();

  if (!settingsDoc.exists) {
    console.log('  ⚠️  Settings document does not exist.');
    console.log('  Run "pnpm seed:settings" first to create the settings document.');
    return false;
  }

  // Update with legal content
  await settingsRef.update({
    termsOfService: TERMS_OF_SERVICE_DATA,
    privacyPolicy: PRIVACY_POLICY_DATA,
    updatedAt: now,
  });

  console.log('  - Terms of Service added');
  console.log(`    Last Updated: ${TERMS_OF_SERVICE_DATA.lastUpdated}`);
  console.log(`    Sections: ${TERMS_OF_SERVICE_DATA.sections.length}`);

  console.log('  - Privacy Policy added');
  console.log(`    Last Updated: ${PRIVACY_POLICY_DATA.lastUpdated}`);
  console.log(`    Sections: ${PRIVACY_POLICY_DATA.sections.length}`);

  return true;
}

/**
 * Clear existing legal content
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<void>}
 */
async function clearLegalContent(db) {
  const settingsRef = db.collection(COLLECTIONS.CONFERENCES).doc(SETTINGS_DOC_ID);
  const settingsDoc = await settingsRef.get();

  if (!settingsDoc.exists) {
    console.log('No settings document found.');
    return;
  }

  const data = settingsDoc.data();
  const hasTerms = !!data.termsOfService;
  const hasPrivacy = !!data.privacyPolicy;

  if (hasTerms || hasPrivacy) {
    await settingsRef.update({
      termsOfService: admin.firestore.FieldValue.delete(),
      privacyPolicy: admin.firestore.FieldValue.delete(),
      updatedAt: admin.firestore.Timestamp.now(),
    });
    console.log('Cleared existing legal content.');
    if (hasTerms) console.log('  - Terms of Service removed');
    if (hasPrivacy) console.log('  - Privacy Policy removed');
  } else {
    console.log('No existing legal content to clear.');
  }
}

/**
 * Check if legal content already exists in Firestore
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<{hasTerms: boolean, hasPrivacy: boolean}>} Whether legal content exists
 */
async function legalContentExists(db) {
  const settingsRef = db.collection(COLLECTIONS.CONFERENCES).doc(SETTINGS_DOC_ID);
  const settingsDoc = await settingsRef.get();

  if (!settingsDoc.exists) {
    return { hasTerms: false, hasPrivacy: false };
  }

  const data = settingsDoc.data();
  return {
    hasTerms: !!data.termsOfService?.sections?.length,
    hasPrivacy: !!data.privacyPolicy?.sections?.length,
  };
}

/**
 * Main function to run the seed script
 */
async function main() {
  console.log('='.repeat(50));
  console.log('IDMC Legal Content Seed Script');
  console.log('='.repeat(50));

  // Check for emulator and CI environment
  const isEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;
  const isCI = !!process.env.CI || !!process.env.GITHUB_ACTIONS;
  console.log(`\nMode: ${isEmulator ? 'EMULATOR' : 'PRODUCTION'}`);
  console.log(`Environment: ${isCI ? 'CI/CD' : 'Local'}`);

  if (isEmulator) {
    console.log(`Emulator host: ${process.env.FIRESTORE_EMULATOR_HOST}`);
  } else if (!isCI) {
    console.log('\n⚠️  WARNING: Running against PRODUCTION database!');
    console.log('Press Ctrl+C within 5 seconds to cancel...\n');
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  try {
    const app = initializeFirebase();
    // Use named database 'idmc-2026'
    const db = getFirestore(app, DATABASE_ID);
    console.log(`Database: ${DATABASE_ID}`);

    const shouldClear = process.argv.includes('--clear');
    const forceReseed = process.argv.includes('--force');

    // Check for existing data
    const { hasTerms, hasPrivacy } = await legalContentExists(db);

    if ((hasTerms || hasPrivacy) && !shouldClear && !forceReseed) {
      console.log('\n📋 Found existing legal content in database:');
      console.log(`   - Terms of Service: ${hasTerms ? 'Yes' : 'No'}`);
      console.log(`   - Privacy Policy: ${hasPrivacy ? 'Yes' : 'No'}`);
      console.log('Skipping seed to preserve existing data.');
      console.log('Use --clear to replace or --force to overwrite.');
      console.log('\n✅ No changes made.');
      console.log('='.repeat(50));
      process.exit(0);
    }

    // Clear existing legal content if requested
    if (shouldClear) {
      await clearLegalContent(db);
    }

    // Seed legal content
    const success = await seedLegalContent(db);

    if (success) {
      console.log('\n✅ Seed completed successfully!');
    } else {
      console.log('\n⚠️  Seed incomplete - see messages above.');
    }
    console.log('='.repeat(50));

    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Seed failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main();
