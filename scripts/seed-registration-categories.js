/**
 * Seed Registration Categories Script
 * Populates Firestore with initial registration categories.
 *
 * Usage:
 *   node scripts/seed-registration-categories.js
 *
 * Prerequisites:
 *   - Firebase CLI installed and logged in
 *   - GOOGLE_APPLICATION_CREDENTIALS env var set to service account key path
 *     OR run with: firebase emulators:exec "node scripts/seed-registration-categories.js"
 *
 * For local emulator:
 *   export FIRESTORE_EMULATOR_HOST="localhost:8080"
 *   node scripts/seed-registration-categories.js
 */

const admin = require('firebase-admin');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

// Collection name constant
const COLLECTIONS = {
  CONFERENCES: 'conferences',
};

// Settings document ID (singleton)
const SETTINGS_DOC_ID = 'conference-settings';

// Firestore database ID (named database)
const DATABASE_ID = 'idmc-2026';

/**
 * Default registration categories seed data
 * These match the original hardcoded categories from constants
 */
const REGISTRATION_CATEGORIES = [
  {
    key: 'regular',
    name: 'Regular',
    price: 500,
    description: 'For working professionals and general attendees',
    isActive: true,
    isAdminOnly: false,
    displayOrder: 1,
  },
  {
    key: 'student_senior',
    name: 'Student / Senior Citizen',
    price: 300,
    description: 'For students with valid ID and senior citizens (60+)',
    isActive: true,
    isAdminOnly: false,
    displayOrder: 2,
  },
  {
    key: 'volunteer',
    name: 'Volunteer',
    price: 0,
    description:
      'For event volunteers (ushers, coordinators, etc.) - No payment required, subject to verification',
    isActive: true,
    isAdminOnly: true,
    displayOrder: 3,
  },
  {
    key: 'speaker',
    name: 'Speaker',
    price: 0,
    description: 'For event speakers - Admin registration only',
    isActive: true,
    isAdminOnly: true,
    displayOrder: 4,
  },
];

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebase() {
  if (admin.apps.length === 0) {
    // Check if running in emulator
    const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
    const usingEmulator = !!emulatorHost;

    if (usingEmulator) {
      console.log(`🔧 Using Firestore Emulator at ${emulatorHost}`);
      // Initialize without credentials for emulator
      admin.initializeApp({
        projectId: 'demo-project',
      });
    } else {
      // Check if service account credentials are available
      const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

      if (!serviceAccountPath) {
        throw new Error(
          'GOOGLE_APPLICATION_CREDENTIALS environment variable is not set.\n' +
            'Please provide the path to your Firebase service account key file.\n' +
            'Example: export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"'
        );
      }

      console.log(`🔑 Using service account: ${serviceAccountPath}`);
      const serviceAccount = require(serviceAccountPath);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
      });
    }
  }

  return getFirestore(admin.app(), DATABASE_ID);
}

/**
 * Seeds registration categories to Firestore
 */
async function seedRegistrationCategories() {
  try {
    const db = initializeFirebase();
    const now = Timestamp.now();

    console.log('🌱 Seeding registration categories...');
    console.log(`📊 Database: ${DATABASE_ID}`);
    console.log(
      `📁 Collection: ${COLLECTIONS.CONFERENCES}/${SETTINGS_DOC_ID}/registrationCategories`
    );

    const categoriesRef = db
      .collection(COLLECTIONS.CONFERENCES)
      .doc(SETTINGS_DOC_ID)
      .collection('registrationCategories');

    // Delete existing categories
    console.log('\n🗑️  Clearing existing categories...');
    const existingCategories = await categoriesRef.get();
    const deleteBatch = db.batch();
    existingCategories.forEach((doc) => {
      deleteBatch.delete(doc.ref);
    });
    await deleteBatch.commit();
    console.log(`   Deleted ${existingCategories.size} existing categories`);

    // Add new categories
    console.log('\n➕ Adding new categories...');
    for (const category of REGISTRATION_CATEGORIES) {
      const categoryData = {
        ...category,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await categoriesRef.add(categoryData);
      console.log(
        `   ✓ ${category.name} (${category.key}) - PHP ${category.price}${category.isAdminOnly ? ' [Admin Only]' : ''} - ID: ${docRef.id}`
      );
    }

    console.log('\n✅ Registration categories seeded successfully!');
    console.log(`\n📋 Summary:`);
    console.log(`   Total categories: ${REGISTRATION_CATEGORIES.length}`);
    console.log(
      `   Public categories: ${REGISTRATION_CATEGORIES.filter((c) => !c.isAdminOnly).length}`
    );
    console.log(
      `   Admin-only categories: ${REGISTRATION_CATEGORIES.filter((c) => c.isAdminOnly).length}`
    );
  } catch (error) {
    console.error('❌ Error seeding registration categories:', error);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    await seedRegistrationCategories();
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { seedRegistrationCategories };
