/**
 * Seed Downloads Script
 * Populates Firestore with downloadable content for IDMC Conference.
 * Downloads include conference booklets, presentations, and resources.
 *
 * Usage:
 *   node scripts/seed-downloads.js
 *   node scripts/seed-downloads.js --clear  # Clear existing downloads and re-seed
 *   node scripts/seed-downloads.js --force  # Seed even if downloads exist
 *
 * Prerequisites:
 *   - Firebase CLI installed and logged in
 *   - GOOGLE_APPLICATION_CREDENTIALS env var set to service account key path
 *     OR run with: firebase emulators:exec "node scripts/seed-downloads.js"
 *
 * For local emulator:
 *   export FIRESTORE_EMULATOR_HOST="localhost:8080"
 *   node scripts/seed-downloads.js
 */

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Collection name constant
const COLLECTIONS = {
  DOWNLOADS: 'downloads',
};

// Firestore database ID (named database)
const DATABASE_ID = 'idmc-2026';

// Download categories
const DOWNLOAD_CATEGORIES = {
  BOOKLET: 'booklet',
  PRESENTATION: 'presentation',
  HANDOUT: 'handout',
  RESOURCE: 'resource',
};

// Download status values
const DOWNLOAD_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
};

/**
 * Downloads seed data for IDMC 2026
 * Note: downloadUrl should be updated with actual Firebase Storage URLs
 * after files are uploaded to storage
 */
const DOWNLOADS_DATA = [
  {
    downloadId: 'idmc-2026-booklet',
    title: 'IDMC 2026 Conference Booklet',
    description:
      'Complete conference program, schedule, speaker information, and session outlines.',
    fileName: 'IDMC-2026-Booklet.pdf',
    fileSize: '2.5 MB',
    fileType: 'PDF',
    category: DOWNLOAD_CATEGORIES.BOOKLET,
    downloadUrl: '',
    thumbnailUrl: '',
    order: 1,
    status: DOWNLOAD_STATUS.DRAFT,
  },
  {
    downloadId: 'idmc-2026-program',
    title: 'Conference Program Schedule',
    description:
      'Detailed program schedule with session times, venues, and speaker assignments.',
    fileName: 'IDMC-2026-Program.pdf',
    fileSize: '500 KB',
    fileType: 'PDF',
    category: DOWNLOAD_CATEGORIES.HANDOUT,
    downloadUrl: '',
    thumbnailUrl: '',
    order: 2,
    status: DOWNLOAD_STATUS.DRAFT,
  },
  {
    downloadId: 'disciple-making-guide',
    title: 'Disciple-Making Guide',
    description:
      'A practical guide to intentional disciple-making in your local church context.',
    fileName: 'Disciple-Making-Guide.pdf',
    fileSize: '1.2 MB',
    fileType: 'PDF',
    category: DOWNLOAD_CATEGORIES.RESOURCE,
    downloadUrl: '',
    thumbnailUrl: '',
    order: 3,
    status: DOWNLOAD_STATUS.DRAFT,
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
 * Seed downloads to Firestore
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<void>}
 */
async function seedDownloads(db) {
  const batch = db.batch();
  const downloadsRef = db.collection(COLLECTIONS.DOWNLOADS);
  const now = admin.firestore.Timestamp.now();

  console.log(`\nSeeding ${DOWNLOADS_DATA.length} downloads...`);

  for (const download of DOWNLOADS_DATA) {
    const docRef = downloadsRef.doc(download.downloadId);

    const downloadData = {
      ...download,
      createdAt: now,
      updatedAt: now,
    };

    delete downloadData.downloadId;

    batch.set(docRef, downloadData);

    console.log(`  - [${download.category}] ${download.title}`);
  }

  await batch.commit();
  console.log(`\nSuccessfully seeded ${DOWNLOADS_DATA.length} downloads!`);
  console.log('\nNote: Download and thumbnail URLs are empty. Upload files via the admin panel.');
  console.log('Recommended thumbnail size: 400x300 pixels.');
}

/**
 * Clear all downloads from Firestore
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<void>}
 */
async function clearDownloads(db) {
  const downloadsRef = db.collection(COLLECTIONS.DOWNLOADS);
  const snapshot = await downloadsRef.get();

  if (snapshot.empty) {
    console.log('No existing downloads to clear.');
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`Cleared ${snapshot.size} existing downloads.`);
}

/**
 * Count existing downloads in Firestore
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<number>} Number of existing downloads
 */
async function countExistingDownloads(db) {
  const downloadsRef = db.collection(COLLECTIONS.DOWNLOADS);
  const snapshot = await downloadsRef.get();
  return snapshot.size;
}

/**
 * Main function to run the seed script
 */
async function main() {
  console.log('='.repeat(50));
  console.log('IDMC Downloads Seed Script');
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

    const existingCount = await countExistingDownloads(db);

    if (existingCount > 0 && !shouldClear && !forceReseed) {
      console.log(`\n Found ${existingCount} existing downloads in database.`);
      console.log('Skipping seed to preserve existing data.');
      console.log('Use --clear to replace or --force to add anyway.');
      console.log('\n No changes made.');
      console.log('='.repeat(50));
      process.exit(0);
    }

    if (shouldClear) {
      await clearDownloads(db);
    }

    await seedDownloads(db);

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
