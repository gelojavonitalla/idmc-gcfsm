/**
 * Seed FAQ Script
 * Populates Firestore with FAQ data for IDMC Conference.
 * FAQs are organized by category for easy filtering and display.
 *
 * Usage:
 *   node scripts/seed-faq.js
 *   node scripts/seed-faq.js --clear  # Clear existing FAQs and re-seed
 *   node scripts/seed-faq.js --force  # Seed even if FAQs exist
 *
 * Prerequisites:
 *   - Firebase CLI installed and logged in
 *   - GOOGLE_APPLICATION_CREDENTIALS env var set to service account key path
 *     OR run with: firebase emulators:exec "node scripts/seed-faq.js"
 *
 * For local emulator:
 *   export FIRESTORE_EMULATOR_HOST="localhost:8080"
 *   node scripts/seed-faq.js
 */

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Collection name constant
const COLLECTIONS = {
  FAQ: 'faq',
};

// Firestore database ID (named database)
const DATABASE_ID = 'idmc-2026';

// FAQ categories
const FAQ_CATEGORIES = {
  REGISTRATION: 'registration',
  PAYMENT: 'payment',
  VENUE: 'venue',
  ACCOMMODATION: 'accommodation',
  GENERAL: 'general',
};

// FAQ status values
const FAQ_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
};

/**
 * FAQ seed data for IDMC 2026
 * Organized by category for easy filtering
 */
const FAQ_DATA = [
  // Registration FAQs
  {
    faqId: 'faq-registration-1',
    question: 'How do I register for IDMC 2026?',
    answer:
      'You can register online through our website by clicking the "Register" button. Fill out the registration form with your personal information, select your ticket type, and complete the payment process.',
    category: FAQ_CATEGORIES.REGISTRATION,
    order: 1,
    status: FAQ_STATUS.PUBLISHED,
  },
  {
    faqId: 'faq-registration-2',
    question: 'Can I register on-site?',
    answer:
      'Yes, on-site registration is available, but we highly recommend registering in advance to secure your spot and avoid long queues on the day of the event. On-site registration is subject to availability.',
    category: FAQ_CATEGORIES.REGISTRATION,
    order: 2,
    status: FAQ_STATUS.PUBLISHED,
  },
  {
    faqId: 'faq-registration-3',
    question: 'Can I transfer my registration to someone else?',
    answer:
      'Registration transfers are allowed up to 7 days before the event. Please contact us via the Contact page with the details of the original registrant and the new attendee.',
    category: FAQ_CATEGORIES.REGISTRATION,
    order: 3,
    status: FAQ_STATUS.PUBLISHED,
  },

  // Payment FAQs
  {
    faqId: 'faq-payment-1',
    question: 'What payment methods are accepted?',
    answer:
      'We accept GCash and bank transfers (BDO). Payment instructions will be provided after you complete the registration form. Please upload your proof of payment to confirm your registration.',
    category: FAQ_CATEGORIES.PAYMENT,
    order: 1,
    status: FAQ_STATUS.PUBLISHED,
  },
  {
    faqId: 'faq-payment-2',
    question: 'Is there a refund policy?',
    answer:
      'Refunds are available up to 14 days before the event, minus a processing fee. Within 14 days of the event, registrations are non-refundable but may be transferred to another person. Contact us for more details.',
    category: FAQ_CATEGORIES.PAYMENT,
    order: 2,
    status: FAQ_STATUS.PUBLISHED,
  },
  {
    faqId: 'faq-payment-3',
    question: 'Are there student or senior citizen discounts?',
    answer:
      'Yes! Students and senior citizens (60 years and above) receive discounted rates. Please select the appropriate category during registration and bring a valid ID for verification at the event.',
    category: FAQ_CATEGORIES.PAYMENT,
    order: 3,
    status: FAQ_STATUS.PUBLISHED,
  },

  // Venue FAQs
  {
    faqId: 'faq-venue-1',
    question: 'Where is the conference held?',
    answer:
      'IDMC 2026 will be held at GCF South Metro, located at Daang Hari Road, Versailles, Almanza Dos, Las Piñas City 1750, Philippines. Visit our Venue page for detailed directions and a map.',
    category: FAQ_CATEGORIES.VENUE,
    order: 1,
    status: FAQ_STATUS.PUBLISHED,
  },
  {
    faqId: 'faq-venue-2',
    question: 'Is parking available?',
    answer:
      'Yes, free parking is available at the venue on a first-come, first-served basis. We recommend arriving early to secure a parking spot, or consider using public transportation.',
    category: FAQ_CATEGORIES.VENUE,
    order: 2,
    status: FAQ_STATUS.PUBLISHED,
  },
  {
    faqId: 'faq-venue-3',
    question: 'How do I get to the venue by public transport?',
    answer:
      'You can take a jeepney or bus to Daang Hari Road in Las Piñas. GCF South Metro is located in the Versailles Village area. Ride-sharing services like Grab are also readily available in the area.',
    category: FAQ_CATEGORIES.VENUE,
    order: 3,
    status: FAQ_STATUS.PUBLISHED,
  },

  // Accommodation FAQs
  {
    faqId: 'faq-accommodation-1',
    question: 'Are there hotel recommendations near the venue?',
    answer:
      'Yes, there are several hotels in Las Piñas and nearby areas. Some options include hotels in Alabang and along the South Superhighway. We recommend booking early for better rates.',
    category: FAQ_CATEGORIES.ACCOMMODATION,
    order: 1,
    status: FAQ_STATUS.PUBLISHED,
  },
  {
    faqId: 'faq-accommodation-2',
    question: 'Does the registration include accommodation?',
    answer:
      'No, the registration fee does not include accommodation. Attendees are responsible for their own lodging arrangements. Please check with nearby hotels for group rates if you are attending with a church group.',
    category: FAQ_CATEGORIES.ACCOMMODATION,
    order: 2,
    status: FAQ_STATUS.PUBLISHED,
  },

  // General FAQs
  {
    faqId: 'faq-general-1',
    question: 'What should I bring to the conference?',
    answer:
      'Please bring your registration confirmation (printed or on your phone), a valid ID, a Bible, a notebook for taking notes, and any personal items you may need throughout the day.',
    category: FAQ_CATEGORIES.GENERAL,
    order: 1,
    status: FAQ_STATUS.PUBLISHED,
  },
  {
    faqId: 'faq-general-2',
    question: 'Is there a dress code?',
    answer:
      'We recommend smart casual attire. The venue is air-conditioned, so you may want to bring a light jacket. Comfortable shoes are recommended as you may be moving between sessions.',
    category: FAQ_CATEGORIES.GENERAL,
    order: 2,
    status: FAQ_STATUS.PUBLISHED,
  },
  {
    faqId: 'faq-general-3',
    question: 'Will meals be provided?',
    answer:
      'Lunch is included in your registration. Snacks and refreshments will also be available during breaks. Please let us know during registration if you have any dietary restrictions.',
    category: FAQ_CATEGORIES.GENERAL,
    order: 3,
    status: FAQ_STATUS.PUBLISHED,
  },
  {
    faqId: 'faq-general-4',
    question: 'Can I attend only specific sessions?',
    answer:
      'The conference is designed as a full-day experience and we encourage attendees to participate in all sessions. However, you are free to choose which workshops to attend during the afternoon breakout sessions.',
    category: FAQ_CATEGORIES.GENERAL,
    order: 4,
    status: FAQ_STATUS.PUBLISHED,
  },
];

/**
 * Initialize Firebase Admin SDK
 * Will use emulator if FIRESTORE_EMULATOR_HOST is set
 *
 * @returns {admin.app.App} Firebase Admin app instance
 */
function initializeFirebase() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  admin.initializeApp({
    projectId: process.env.GCLOUD_PROJECT || 'idmc-gcfsm-dev',
  });

  return admin.app();
}

/**
 * Seed FAQs to Firestore
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<void>}
 */
async function seedFaq(db) {
  const batch = db.batch();
  const faqRef = db.collection(COLLECTIONS.FAQ);
  const now = admin.firestore.Timestamp.now();

  console.log(`\nSeeding ${FAQ_DATA.length} FAQs...`);

  for (const faq of FAQ_DATA) {
    const docRef = faqRef.doc(faq.faqId);

    const faqData = {
      ...faq,
      createdAt: now,
      updatedAt: now,
    };

    delete faqData.faqId;

    batch.set(docRef, faqData);

    console.log(`  - [${faq.category}] ${faq.question.substring(0, 50)}...`);
  }

  await batch.commit();
  console.log(`\nSuccessfully seeded ${FAQ_DATA.length} FAQs!`);
}

/**
 * Clear all FAQs from Firestore
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<void>}
 */
async function clearFaq(db) {
  const faqRef = db.collection(COLLECTIONS.FAQ);
  const snapshot = await faqRef.get();

  if (snapshot.empty) {
    console.log('No existing FAQs to clear.');
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`Cleared ${snapshot.size} existing FAQs.`);
}

/**
 * Count existing FAQs in Firestore
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<number>} Number of existing FAQs
 */
async function countExistingFaq(db) {
  const faqRef = db.collection(COLLECTIONS.FAQ);
  const snapshot = await faqRef.get();
  return snapshot.size;
}

/**
 * Main function to run the seed script
 */
async function main() {
  console.log('='.repeat(50));
  console.log('IDMC FAQ Seed Script');
  console.log('='.repeat(50));

  const isEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;
  const isCI = !!process.env.CI || !!process.env.GITHUB_ACTIONS;
  console.log(`\nMode: ${isEmulator ? 'EMULATOR' : 'PRODUCTION'}`);
  console.log(`Environment: ${isCI ? 'CI/CD' : 'Local'}`);

  if (isEmulator) {
    console.log(`Emulator host: ${process.env.FIRESTORE_EMULATOR_HOST}`);
  } else if (!isCI) {
    console.log('\n WARNING: Running against PRODUCTION database!');
    console.log('Press Ctrl+C within 5 seconds to cancel...\n');
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  try {
    const app = initializeFirebase();
    const db = getFirestore(app, DATABASE_ID);
    console.log(`Database: ${DATABASE_ID}`);

    const shouldClear = process.argv.includes('--clear');
    const forceReseed = process.argv.includes('--force');

    const existingCount = await countExistingFaq(db);

    if (existingCount > 0 && !shouldClear && !forceReseed) {
      console.log(`\n Found ${existingCount} existing FAQs in database.`);
      console.log('Skipping seed to preserve existing data.');
      console.log('Use --clear to replace or --force to add anyway.');
      console.log('\n No changes made.');
      console.log('='.repeat(50));
      process.exit(0);
    }

    if (shouldClear) {
      await clearFaq(db);
    }

    await seedFaq(db);

    console.log('\n Seed completed successfully!');
    console.log('='.repeat(50));

    process.exit(0);
  } catch (error) {
    console.error('\n Seed failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
