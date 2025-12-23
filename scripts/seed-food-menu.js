/**
 * Seed Food Menu Script
 * Populates Firestore with food menu items for IDMC Conference.
 * Food options are displayed during registration when enabled.
 *
 * Usage:
 *   node scripts/seed-food-menu.js
 *   node scripts/seed-food-menu.js --clear  # Clear existing food menu items and re-seed
 *   node scripts/seed-food-menu.js --force  # Seed even if food menu items exist
 *
 * Prerequisites:
 *   - Firebase CLI installed and logged in
 *   - GOOGLE_APPLICATION_CREDENTIALS env var set to service account key path
 *     OR run with: firebase emulators:exec "node scripts/seed-food-menu.js"
 *
 * For local emulator:
 *   export FIRESTORE_EMULATOR_HOST="localhost:8080"
 *   node scripts/seed-food-menu.js
 */

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Collection name constants
const COLLECTIONS = {
  FOOD_MENU: 'foodMenu',
  CONFERENCES: 'conferences',
};

// Firestore database ID (named database)
const DATABASE_ID = 'idmc-2026';

// Food menu status values
const FOOD_MENU_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
};

// Settings document ID
const FOOD_SETTINGS_DOC_ID = 'food-settings';

/**
 * Food menu seed data for IDMC 2026
 * Common meal options for conference attendees
 */
const FOOD_MENU_DATA = [
  {
    itemId: 'food-chicken-bbq',
    name: 'Chicken BBQ with Rice and Vegetables',
    description: 'Grilled chicken barbecue served with steamed rice and fresh vegetables',
    order: 1,
    status: FOOD_MENU_STATUS.PUBLISHED,
  },
  {
    itemId: 'food-mixed-vegetables',
    name: 'Mixed Vegetables with Rice',
    description: 'Assorted mixed vegetables served with steamed rice (vegetarian option)',
    order: 2,
    status: FOOD_MENU_STATUS.PUBLISHED,
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
 * Seed food menu items to Firestore
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<void>}
 */
async function seedFoodMenu(db) {
  const batch = db.batch();
  const foodMenuRef = db.collection(COLLECTIONS.FOOD_MENU);
  const now = admin.firestore.Timestamp.now();

  console.log(`\nSeeding ${FOOD_MENU_DATA.length} food menu items...`);

  for (const item of FOOD_MENU_DATA) {
    const docRef = foodMenuRef.doc(item.itemId);

    const itemData = {
      name: item.name,
      description: item.description,
      order: item.order,
      status: item.status,
      createdAt: now,
      updatedAt: now,
    };

    batch.set(docRef, itemData);

    console.log(`  - [${item.status}] ${item.name}`);
  }

  await batch.commit();
  console.log(`\nSuccessfully seeded ${FOOD_MENU_DATA.length} food menu items!`);
}

/**
 * Seed food menu settings (enables food selection feature)
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<void>}
 */
async function seedFoodMenuSettings(db) {
  const settingsRef = db.collection(COLLECTIONS.CONFERENCES).doc(FOOD_SETTINGS_DOC_ID);
  const now = admin.firestore.Timestamp.now();

  const settingsData = {
    foodSelectionEnabled: true,
    createdAt: now,
    updatedAt: now,
  };

  await settingsRef.set(settingsData, { merge: true });
  console.log('\nFood selection enabled in settings.');
}

/**
 * Clear all food menu items from Firestore
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<void>}
 */
async function clearFoodMenu(db) {
  const foodMenuRef = db.collection(COLLECTIONS.FOOD_MENU);
  const snapshot = await foodMenuRef.get();

  if (snapshot.empty) {
    console.log('No existing food menu items to clear.');
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`Cleared ${snapshot.size} existing food menu items.`);

  // Also disable food selection in settings
  const settingsRef = db.collection(COLLECTIONS.CONFERENCES).doc(FOOD_SETTINGS_DOC_ID);
  await settingsRef.set({ foodSelectionEnabled: false, updatedAt: admin.firestore.Timestamp.now() }, { merge: true });
  console.log('Food selection disabled in settings.');
}

/**
 * Count existing food menu items in Firestore
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<number>} Number of existing food menu items
 */
async function countExistingFoodMenu(db) {
  const foodMenuRef = db.collection(COLLECTIONS.FOOD_MENU);
  const snapshot = await foodMenuRef.get();
  return snapshot.size;
}

/**
 * Main function to run the seed script
 */
async function main() {
  console.log('='.repeat(50));
  console.log('IDMC Food Menu Seed Script');
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

    const existingCount = await countExistingFoodMenu(db);

    if (existingCount > 0 && !shouldClear && !forceReseed) {
      console.log(`\n Found ${existingCount} existing food menu items in database.`);
      console.log('Skipping seed to preserve existing data.');
      console.log('Use --clear to replace or --force to add anyway.');
      console.log('\n No changes made.');
      console.log('='.repeat(50));
      process.exit(0);
    }

    if (shouldClear) {
      await clearFoodMenu(db);
    }

    await seedFoodMenu(db);
    await seedFoodMenuSettings(db);

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
