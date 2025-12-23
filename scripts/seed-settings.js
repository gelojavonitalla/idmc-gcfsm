/**
 * Seed Settings Script
 * Populates Firestore with initial conference settings and pricing tiers.
 *
 * Usage:
 *   node scripts/seed-settings.js
 *
 * Prerequisites:
 *   - Firebase CLI installed and logged in
 *   - GOOGLE_APPLICATION_CREDENTIALS env var set to service account key path
 *     OR run with: firebase emulators:exec "node scripts/seed-settings.js"
 *
 * For local emulator:
 *   export FIRESTORE_EMULATOR_HOST="localhost:8080"
 *   node scripts/seed-settings.js
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
 * Default conference settings seed data
 */
const SETTINGS_DATA = {
  title: 'IDMC MANILA',
  theme: 'EMPOWERED IN WARFARE, WEAKNESS, AND WITNESS',
  tagline: 'Intentional Disciple-Making Churches Conference',
  year: 2026,
  startDate: '2026-03-28',
  endDate: '2026-03-28',
  startTime: '07:00',
  endTime: '17:30',
  timezone: 'Asia/Manila',
  venue: {
    name: 'GCF South Metro',
    address: 'Daang Hari Road, Versailles, Almanza Dos, Las Piñas City 1750 Philippines',
    mapUrl: 'https://maps.google.com/?q=GCF+South+Metro+Las+Pinas',
    mapEmbedUrl:
      'https://www.google.com/maps?q=GCF+South+Metro,+Daang+Hari+Road,+Las+Piñas,+Philippines&output=embed',
  },
  contact: {
    email: 'email@gcfsouthmetro.org',
    phone: '(02) 8478 1271 / (02) 8478 1273',
    mobile: '0917 650 0011',
    website: 'https://gcfsouthmetro.org',
  },
  social: {
    facebook: 'https://facebook.com/gcfsouthmetro',
    instagram: 'https://instagram.com/gcfsouthmetro',
    youtube: 'https://youtube.com/channel/UCJ36YX23P_yCjMzetI1s6Ag',
  },
  registrationOpen: true,
  bannerImageUrl: null,
  heroImageUrl: null,
  heroVideoUrl: null,
  // About IDMC content
  aboutIdmc: {
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
  },
  // About GCF South Metro content
  aboutGcf: {
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
  },
  // Previous IDMC (IDMC 2025) content
  idmc2025: {
    title: 'IDMC 2025',
    subtitle: 'Watch the highlights from our previous conference',
    youtubeVideoId: 'emGTZDXOaZY',
  },
  // SMS Gateway Configuration (OneWaySMS via SendGrid email-to-SMS)
  // These settings can be updated in Firestore without redeploying
  sms: {
    enabled: false, // USE_ONEWAYSMS - Set to true to enable SMS notifications
    gatewayDomain: '1.onewaysms.asia', // ONEWAYSMS_GATEWAY_DOMAIN
    gatewayEmail: '', // ONEWAYSMS_GATEWAY_EMAIL - Optional: direct gateway email (leave empty to use phone@domain format)
    senderId: '', // SENDER_ID - The name displayed to SMS recipients (e.g., "GCFSM"). Must be registered with OneWaySMS.
  },
};

/**
 * Pricing tiers seed data
 * Each tier represents a registration category (Early Bird, GCF Member, Regular)
 * Each tier has both regularPrice and studentPrice
 */
const PRICING_TIERS_DATA = [
  {
    tierId: 'early-bird',
    name: 'Early Bird',
    regularPrice: 350,
    studentPrice: 350,
    startDate: '2025-01-01',
    endDate: '2026-03-28',
    isActive: true,
  },
  {
    tierId: 'gcf-member',
    name: 'GCF Member',
    regularPrice: 350,
    studentPrice: 350,
    startDate: '2025-01-01',
    endDate: '2026-03-28',
    isActive: true,
  },
  {
    tierId: 'regular',
    name: 'Regular',
    regularPrice: 500,
    studentPrice: 500,
    startDate: '2025-01-01',
    endDate: '2026-03-28',
    isActive: true,
  },
];

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
 * Seed conference settings to Firestore
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<void>}
 */
async function seedSettings(db) {
  const settingsRef = db.collection(COLLECTIONS.CONFERENCES).doc(SETTINGS_DOC_ID);
  const now = admin.firestore.Timestamp.now();

  console.log('\nSeeding conference settings...');

  await settingsRef.set({
    ...SETTINGS_DATA,
    createdAt: now,
    updatedAt: now,
    createdBy: 'seed-script',
  });

  console.log('  - Conference settings document created');
  console.log(`    Title: ${SETTINGS_DATA.title}`);
  console.log(`    Theme: ${SETTINGS_DATA.theme}`);
  console.log(`    Date: ${SETTINGS_DATA.startDate}`);
  console.log(`    Venue: ${SETTINGS_DATA.venue.name}`);
  console.log('\n  - About content seeded:');
  console.log(`    About IDMC: ${SETTINGS_DATA.aboutIdmc.milestones.length} milestones`);
  console.log(`    About GCF: ${SETTINGS_DATA.aboutGcf.coreValues.length} core values`);
  console.log(`    Previous IDMC: ${SETTINGS_DATA.idmc2025.title}`);
  console.log('\n  - SMS Gateway Configuration:');
  console.log(`    Enabled: ${SETTINGS_DATA.sms.enabled}`);
  console.log(`    Gateway Domain: ${SETTINGS_DATA.sms.gatewayDomain}`);
  console.log(`    Gateway Email: ${SETTINGS_DATA.sms.gatewayEmail || '(not set - using phone@domain format)'}`);
}

/**
 * Seed pricing tiers to Firestore
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<void>}
 */
async function seedPricingTiers(db) {
  const tiersRef = db.collection(COLLECTIONS.CONFERENCES).doc(SETTINGS_DOC_ID).collection('pricingTiers');
  const now = admin.firestore.Timestamp.now();

  console.log(`\nSeeding ${PRICING_TIERS_DATA.length} pricing tier(s)...`);

  for (const tier of PRICING_TIERS_DATA) {
    const docRef = tiersRef.doc(tier.tierId);

    await docRef.set({
      name: tier.name,
      regularPrice: tier.regularPrice,
      studentPrice: tier.studentPrice,
      startDate: tier.startDate,
      endDate: tier.endDate,
      isActive: tier.isActive,
      createdAt: now,
      updatedAt: now,
      createdBy: 'seed-script',
    });

    console.log(`  - ${tier.name} (${tier.tierId})`);
    console.log(`    Regular Price: PHP ${tier.regularPrice}`);
    console.log(`    Student Price: PHP ${tier.studentPrice}`);
    console.log(`    Period: ${tier.startDate} to ${tier.endDate}`);
    console.log(`    Active: ${tier.isActive}`);
  }

  console.log(`\nSuccessfully seeded ${PRICING_TIERS_DATA.length} pricing tier(s)!`);
}

/**
 * Clear existing settings (optional, for clean re-seed)
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<void>}
 */
async function clearSettings(db) {
  const settingsRef = db.collection(COLLECTIONS.CONFERENCES).doc(SETTINGS_DOC_ID);

  // First, clear pricing tiers subcollection
  const tiersRef = settingsRef.collection('pricingTiers');
  const tiersSnapshot = await tiersRef.get();

  if (!tiersSnapshot.empty) {
    const batch = db.batch();
    tiersSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`Cleared ${tiersSnapshot.size} existing pricing tier(s).`);
  }

  // Then check if settings document exists
  const settingsDoc = await settingsRef.get();
  if (settingsDoc.exists) {
    await settingsRef.delete();
    console.log('Cleared existing settings document.');
  } else {
    console.log('No existing settings to clear.');
  }
}

/**
 * Check if settings already exist in Firestore
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<boolean>} Whether settings exist
 */
async function settingsExist(db) {
  const settingsRef = db.collection(COLLECTIONS.CONFERENCES).doc(SETTINGS_DOC_ID);
  const settingsDoc = await settingsRef.get();
  return settingsDoc.exists;
}

/**
 * Count existing pricing tiers
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<number>} Number of existing pricing tiers
 */
async function countExistingTiers(db) {
  const tiersRef = db.collection(COLLECTIONS.CONFERENCES).doc(SETTINGS_DOC_ID).collection('pricingTiers');
  const snapshot = await tiersRef.get();
  return snapshot.size;
}

/**
 * Main function to run the seed script
 */
async function main() {
  console.log('='.repeat(50));
  console.log('IDMC Settings Seed Script');
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
    const hasSettings = await settingsExist(db);
    const tierCount = await countExistingTiers(db);

    if ((hasSettings || tierCount > 0) && !shouldClear && !forceReseed) {
      console.log('\n📋 Found existing settings in database:');
      console.log(`   - Settings document: ${hasSettings ? 'Yes' : 'No'}`);
      console.log(`   - Pricing tiers: ${tierCount}`);
      console.log('Skipping seed to preserve existing data.');
      console.log('Use --clear to replace or --force to add anyway.');
      console.log('\n✅ No changes made.');
      console.log('='.repeat(50));
      process.exit(0);
    }

    // Clear existing settings if requested
    if (shouldClear) {
      await clearSettings(db);
    }

    // Seed settings and pricing tiers
    await seedSettings(db);
    await seedPricingTiers(db);

    console.log('\n✅ Seed completed successfully!');
    console.log('='.repeat(50));

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main();
