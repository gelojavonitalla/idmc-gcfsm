/**
 * Seed About Pages Script
 * Populates Firestore with About IDMC, About GCF, and Previous IDMC content.
 * This script can update an existing settings document without clearing other fields.
 *
 * Usage:
 *   node scripts/seed-about.js
 *   node scripts/seed-about.js --force    # Update even if about fields exist
 *   node scripts/seed-about.js --clear    # Clear about fields before seeding
 *
 * Prerequisites:
 *   - Firebase CLI installed and logged in
 *   - GOOGLE_APPLICATION_CREDENTIALS env var set to service account key path
 *
 * For local emulator:
 *   export FIRESTORE_EMULATOR_HOST="localhost:8080"
 *   node scripts/seed-about.js
 */

const admin = require('firebase-admin');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// Collection name constant
const COLLECTIONS = {
  CONFERENCES: 'conferences',
};

// Settings document ID (singleton)
const SETTINGS_DOC_ID = 'conference-settings';

// Firestore database ID (named database)
const DATABASE_ID = 'idmc-2026';

/**
 * About IDMC seed data
 * Content displayed on the "About IDMC" tab
 */
const ABOUT_IDMC_DATA = {
  mission:
    'The Intentional Disciple-Making Churches Conference (IDMC) is an annual gathering designed to equip and inspire churches to return to their disciple-making roots. We believe that every believer is called to make disciples who make disciples, transforming communities and nations for Christ.',
  vision:
    'To see every church in the Philippines and beyond become an intentional disciple-making community that fulfills the Great Commission.',
  history:
    'IDMC was born out of a vision to see churches across the Philippines and beyond embrace intentional disciple-making as their primary mission. What started as a small gathering of church leaders has grown into a movement that impacts thousands of believers each year.\n\nThrough plenary sessions, workshops, and fellowship, IDMC provides a platform for learning, sharing best practices, and encouraging one another in the disciple-making journey.',
  milestones: [
    { label: '2023-2033', description: 'National Disciple-Making Campaign' },
    { label: '1000+', description: 'Churches Impacted' },
    { label: '10+', description: 'Years of Ministry' },
  ],
};

/**
 * About GCF South Metro seed data
 * Content displayed on the "About GCF South Metro" tab
 */
const ABOUT_GCF_DATA = {
  name: 'GCF South Metro',
  mission: 'To love God, to love people and to make multiplying disciples.',
  vision:
    'To be a disciple-making congregation that reaches local communities while impacting the broader region and world.',
  description:
    'GCF South Metro is a disciple-making church focused on three interconnected activities: drawing individuals toward Christ, developing their faith, and deploying them for ministry purposes.\n\nAs a congregation under the GCF family of churches, we are committed to the Great Commission and believe that making disciples is the heart of the church\'s mission.',
  coreValues: [
    'Truth grounded in Scripture',
    'Love demonstrated in relationships',
    'Empowerment through the Holy Spirit',
    'Excellence through dedicated effort',
  ],
};

/**
 * Previous IDMC (IDMC 2025) seed data
 * Content displayed on the "Previous IDMC" tab
 */
const IDMC_2025_DATA = {
  title: 'IDMC 2025',
  subtitle: 'Watch the highlights from our previous conference',
  youtubeVideoId: 'emGTZDXOaZY',
  description:
    'IDMC 2025 brought together church leaders and believers from across the nation to celebrate, learn, and be equipped for disciple-making. Watch the highlights and testimonials from this transformative event.',
};

/**
 * Initialize Firebase Admin SDK
 * Will use emulator if FIRESTORE_EMULATOR_HOST is set
 *
 * @returns {admin.app.App} Firebase app instance
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
 * Seed about pages content to Firestore
 * Updates existing settings document with about fields
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<void>}
 */
async function seedAboutPages(db) {
  const settingsRef = db.collection(COLLECTIONS.CONFERENCES).doc(SETTINGS_DOC_ID);
  const now = admin.firestore.Timestamp.now();

  console.log('\nSeeding about pages content...');

  // Check if settings document exists
  const settingsDoc = await settingsRef.get();

  if (!settingsDoc.exists) {
    // Create a minimal settings document if it doesn't exist
    console.log('  - Settings document not found, creating with about pages...');
    await settingsRef.set({
      aboutIdmc: ABOUT_IDMC_DATA,
      aboutGcf: ABOUT_GCF_DATA,
      idmc2025: IDMC_2025_DATA,
      createdAt: now,
      updatedAt: now,
      createdBy: 'seed-about-script',
    });
  } else {
    // Update existing document with about fields
    console.log('  - Updating existing settings document with about pages...');
    await settingsRef.update({
      aboutIdmc: ABOUT_IDMC_DATA,
      aboutGcf: ABOUT_GCF_DATA,
      idmc2025: IDMC_2025_DATA,
      updatedAt: now,
    });
  }

  console.log('\n  About IDMC:');
  console.log(`    - Mission: ${ABOUT_IDMC_DATA.mission.substring(0, 50)}...`);
  console.log(`    - Vision: ${ABOUT_IDMC_DATA.vision.substring(0, 50)}...`);
  console.log(`    - Milestones: ${ABOUT_IDMC_DATA.milestones.length} items`);

  console.log('\n  About GCF South Metro:');
  console.log(`    - Name: ${ABOUT_GCF_DATA.name}`);
  console.log(`    - Mission: ${ABOUT_GCF_DATA.mission}`);
  console.log(`    - Core Values: ${ABOUT_GCF_DATA.coreValues.length} items`);

  console.log('\n  Previous IDMC (IDMC 2025):');
  console.log(`    - Title: ${IDMC_2025_DATA.title}`);
  console.log(`    - YouTube Video ID: ${IDMC_2025_DATA.youtubeVideoId}`);
}

/**
 * Clear about pages fields from settings document
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<void>}
 */
async function clearAboutPages(db) {
  const settingsRef = db.collection(COLLECTIONS.CONFERENCES).doc(SETTINGS_DOC_ID);

  const settingsDoc = await settingsRef.get();
  if (!settingsDoc.exists) {
    console.log('No settings document found. Nothing to clear.');
    return;
  }

  console.log('Clearing about pages fields from settings...');
  await settingsRef.update({
    aboutIdmc: FieldValue.delete(),
    aboutGcf: FieldValue.delete(),
    idmc2025: FieldValue.delete(),
    updatedAt: admin.firestore.Timestamp.now(),
  });
  console.log('About pages fields cleared.');
}

/**
 * Check if about pages fields already exist in settings
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<{exists: boolean, fields: string[]}>} Whether about fields exist and which ones
 */
async function checkAboutPagesExist(db) {
  const settingsRef = db.collection(COLLECTIONS.CONFERENCES).doc(SETTINGS_DOC_ID);
  const settingsDoc = await settingsRef.get();

  if (!settingsDoc.exists) {
    return { exists: false, fields: [] };
  }

  const data = settingsDoc.data();
  const existingFields = [];

  if (data.aboutIdmc) existingFields.push('aboutIdmc');
  if (data.aboutGcf) existingFields.push('aboutGcf');
  if (data.idmc2025) existingFields.push('idmc2025');

  return {
    exists: existingFields.length > 0,
    fields: existingFields,
  };
}

/**
 * Main function to run the seed script
 */
async function main() {
  console.log('='.repeat(50));
  console.log('IDMC About Pages Seed Script');
  console.log('='.repeat(50));

  // Check for emulator and CI environment
  const isEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;
  const isCI = !!process.env.CI || !!process.env.GITHUB_ACTIONS;
  console.log(`\nMode: ${isEmulator ? 'EMULATOR' : 'PRODUCTION'}`);
  console.log(`Environment: ${isCI ? 'CI/CD' : 'Local'}`);

  if (isEmulator) {
    console.log(`Emulator host: ${process.env.FIRESTORE_EMULATOR_HOST}`);
  } else if (!isCI) {
    console.log('\n  WARNING: Running against PRODUCTION database!');
    console.log('Press Ctrl+C within 5 seconds to cancel...\n');
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  try {
    const app = initializeFirebase();
    // Use named database 'idmc-2026'
    const db = getFirestore(app, DATABASE_ID);
    console.log(`Database: ${DATABASE_ID}`);

    const shouldClear = process.argv.includes('--clear');
    const forceUpdate = process.argv.includes('--force');

    // Check for existing about pages data
    const { exists, fields } = await checkAboutPagesExist(db);

    if (exists && !shouldClear && !forceUpdate) {
      console.log('\n  Found existing about pages data:');
      console.log(`   - Fields: ${fields.join(', ')}`);
      console.log('Skipping seed to preserve existing data.');
      console.log('Use --clear to replace or --force to update anyway.');
      console.log('\n  No changes made.');
      console.log('='.repeat(50));
      process.exit(0);
    }

    // Clear existing about pages if requested
    if (shouldClear) {
      await clearAboutPages(db);
    }

    // Seed about pages
    await seedAboutPages(db);

    console.log('\n  Seed completed successfully!');
    console.log('='.repeat(50));

    process.exit(0);
  } catch (error) {
    console.error('\n  Seed failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main();
