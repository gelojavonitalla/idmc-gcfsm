/**
 * Seed What to Bring Script
 * Populates Firestore with "What to Bring" checklist items for IDMC Conference.
 * These items are displayed in confirmation emails and registration success pages.
 *
 * Usage:
 *   node scripts/seed-what-to-bring.js
 *   node scripts/seed-what-to-bring.js --clear  # Clear existing items and re-seed
 *   node scripts/seed-what-to-bring.js --force  # Seed even if items exist
 *
 * Prerequisites:
 *   - Firebase CLI installed and logged in
 *   - GOOGLE_APPLICATION_CREDENTIALS env var set to service account key path
 *     OR run with: firebase emulators:exec "node scripts/seed-what-to-bring.js"
 *
 * For local emulator:
 *   export FIRESTORE_EMULATOR_HOST="localhost:8080"
 *   node scripts/seed-what-to-bring.js
 */

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Collection name constants
const COLLECTIONS = {
  WHAT_TO_BRING: 'whatToBring',
};

// Firestore database ID (named database)
const DATABASE_ID = 'idmc-2026';

// What to Bring status values
const WHAT_TO_BRING_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
};

/**
 * What to Bring seed data for IDMC 2026
 * Default checklist items for conference attendees
 */
const WHAT_TO_BRING_DATA = [
  {
    itemId: 'wtb-qr-code',
    text: 'Your personal QR code (screenshot or printed)',
    order: 1,
    status: WHAT_TO_BRING_STATUS.PUBLISHED,
  },
  {
    itemId: 'wtb-bible',
    text: 'Bible',
    order: 2,
    status: WHAT_TO_BRING_STATUS.PUBLISHED,
  },
  {
    itemId: 'wtb-pen',
    text: 'Pen for note-taking',
    order: 3,
    status: WHAT_TO_BRING_STATUS.PUBLISHED,
  },
  {
    itemId: 'wtb-tumbler',
    text: 'Tumbler (to stay hydrated)',
    order: 4,
    status: WHAT_TO_BRING_STATUS.PUBLISHED,
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
 * Seed "What to Bring" items to Firestore
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<void>}
 */
async function seedWhatToBring(db) {
  const batch = db.batch();
  const whatToBringRef = db.collection(COLLECTIONS.WHAT_TO_BRING);
  const now = admin.firestore.Timestamp.now();

  console.log(`\nSeeding ${WHAT_TO_BRING_DATA.length} "What to Bring" items...`);

  for (const item of WHAT_TO_BRING_DATA) {
    const docRef = whatToBringRef.doc(item.itemId);

    const itemData = {
      text: item.text,
      order: item.order,
      status: item.status,
      createdAt: now,
      updatedAt: now,
    };

    batch.set(docRef, itemData);

    console.log(`  - [${item.status}] ${item.text}`);
  }

  await batch.commit();
  console.log(`\nSuccessfully seeded ${WHAT_TO_BRING_DATA.length} "What to Bring" items!`);
}

/**
 * Clear all "What to Bring" items from Firestore
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<void>}
 */
async function clearWhatToBring(db) {
  const whatToBringRef = db.collection(COLLECTIONS.WHAT_TO_BRING);
  const snapshot = await whatToBringRef.get();

  if (snapshot.empty) {
    console.log('No existing "What to Bring" items to clear.');
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`Cleared ${snapshot.size} existing "What to Bring" items.`);
}

/**
 * Count existing "What to Bring" items in Firestore
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<number>} Number of existing items
 */
async function countExistingWhatToBring(db) {
  const whatToBringRef = db.collection(COLLECTIONS.WHAT_TO_BRING);
  const snapshot = await whatToBringRef.get();
  return snapshot.size;
}

/**
 * Main function to run the seed script
 */
async function main() {
  console.log('='.repeat(50));
  console.log('IDMC "What to Bring" Seed Script');
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

    const existingCount = await countExistingWhatToBring(db);

    if (existingCount > 0 && !shouldClear && !forceReseed) {
      console.log(`\n Found ${existingCount} existing "What to Bring" items in database.`);
      console.log('Skipping seed to preserve existing data.');
      console.log('Use --clear to replace or --force to add anyway.');
      console.log('\n No changes made.');
      console.log('='.repeat(50));
      process.exit(0);
    }

    if (shouldClear) {
      await clearWhatToBring(db);
    }

    await seedWhatToBring(db);

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
