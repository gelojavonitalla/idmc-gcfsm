/**
 * Seed Speakers Script
 * Populates Firestore with initial speaker data for IDMC Conference.
 *
 * Usage:
 *   node scripts/seed-speakers.js
 *
 * Prerequisites:
 *   - Firebase CLI installed and logged in
 *   - GOOGLE_APPLICATION_CREDENTIALS env var set to service account key path
 *     OR run with: firebase emulators:exec "node scripts/seed-speakers.js"
 *
 * For local emulator:
 *   export FIRESTORE_EMULATOR_HOST="localhost:8080"
 *   node scripts/seed-speakers.js
 */

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Collection name constant
const COLLECTIONS = {
  SPEAKERS: 'speakers',
  CONFERENCES: 'conferences',
};

// Conference ID for IDMC 2026
const CONFERENCE_ID = 'idmc-2026';

// Firestore database ID (named database)
const DATABASE_ID = 'idmc-2026';

// Speaker status values
const SPEAKER_STATUS = {
  PUBLISHED: 'published',
  DRAFT: 'draft',
};

// Session types
const SESSION_TYPES = {
  PLENARY: 'plenary',
  WORKSHOP: 'workshop',
};

/**
 * Speaker seed data based on GCFSM leadership
 */
const SPEAKERS_DATA = [
  {
    speakerId: 'lito-villoria',
    conferenceId: CONFERENCE_ID,
    name: 'Rev. Dr. Lito Villoria',
    title: 'Senior Pastor',
    organization: 'GCF South Metro',
    bio: 'Rev. Dr. Lito Villoria is the Senior Pastor of GCF South Metro (GCFSM). He also serves as the Executive Chairman of the National Disciple-making Campaign Committee under the Philippine Council of Evangelical Churches. This ten-year campaign (2023-2033) seeks to transform the nation by leading churches back to their disciple-making roots. He is also the President of the Conservative Baptist Association of the Philippines, a task force member of the World Evangelical Alliance\'s Galilean Movement, and the Country Director of the Asia Biblical Theological Seminary. Pastor Lito is deeply passionate about intentional disciple-making, particularly investing in the Next Generation.',
    photoUrl: null,
    sessionType: SESSION_TYPES.PLENARY,
    sessionTitle: 'Plenary Session',
    sessionIds: [],
    sessionTitles: ['Plenary Session'],
    featured: true,
    order: 1,
    status: SPEAKER_STATUS.PUBLISHED,
    socialLinks: null,
    createdBy: 'seed-script',
  },
  {
    speakerId: 'karen-monroy',
    conferenceId: CONFERENCE_ID,
    name: 'Teacher Karen Monroy',
    title: 'NextGen Ministry Director',
    organization: 'GCF South Metro',
    bio: 'Teacher Karen Monroy is passionate about the NextGen of the church—the children, youth, and young adults. Her desire is to bring them to Jesus so that, even at an early age, they will choose to obey Him until the end. She serves as the NextGen Ministry Director at GCF South Metro, where her main responsibility is to provide discipleship venues for the children, youth, and young adults of the church. T. Karen is a registered nurse who answered the Lord\'s call to serve Him full-time in the church. She is soon completing her Master of Divinity at Grace School of Theology.',
    photoUrl: null,
    sessionType: SESSION_TYPES.WORKSHOP,
    sessionTitle: 'Overcoming Pitfalls in the Discipleship of the Next Generation',
    sessionIds: [],
    sessionTitles: ['Overcoming Pitfalls in the Discipleship of the Next Generation'],
    featured: true,
    order: 2,
    status: SPEAKER_STATUS.PUBLISHED,
    socialLinks: null,
    createdBy: 'seed-script',
  },
  {
    speakerId: 'carol-felipe',
    conferenceId: CONFERENCE_ID,
    name: 'Teacher Carol Felipe',
    title: 'School Discipleship Ministry Director',
    organization: 'GCFSM Christian School',
    bio: 'Teacher Carol Felipe has been part of the GCF South Metro staff for the past 13 years. Her passion in life after Jesus is to teach and mentor women so that they may experience the fullness of joy that only comes from the Lord. Teacher Carol is the Cluster Mentor of the Bacoor Growth Groups and also serves as the School Discipleship Ministry Director for GCFSM Christian School. She is a graduate of Asian Theological Seminary, where she earned her Master of Divinity, Major in Biblical Studies.',
    photoUrl: null,
    sessionType: SESSION_TYPES.WORKSHOP,
    sessionTitle: 'Overcoming Pitfalls in the Discipleship of Women',
    sessionIds: [],
    sessionTitles: ['Overcoming Pitfalls in the Discipleship of Women'],
    featured: true,
    order: 3,
    status: SPEAKER_STATUS.PUBLISHED,
    socialLinks: null,
    createdBy: 'seed-script',
  },
  {
    speakerId: 'gilbert-bayang',
    conferenceId: CONFERENCE_ID,
    name: 'Elder Capt. Gilbert Bayang',
    title: 'Airline Captain & Elder',
    organization: 'Philippine Airlines / GCF South Metro',
    bio: 'Captain Gilbert Bayang is a pilot by profession. He flies the Airbus A321, works in the Philippine Airlines (PAL) Safety Department, and deals with Human Factors in Aviation. E. Kap, as he is fondly called in church, is a passionate student of God\'s Word and is nearing the completion of his theological degree at Grace School of Theology. He mentors fellow pilots, cabin crew, and their spouses, helping them share Jesus with their peers both at home and at work. E. Gilbert is married to Gina Pacis and is blessed with two adult children: Benjo, a licensed pilot, and Dorothy, a licensed occupational therapist.',
    photoUrl: null,
    sessionType: SESSION_TYPES.WORKSHOP,
    sessionTitle: 'Overcoming Pitfalls in the Discipleship of Men',
    sessionIds: [],
    sessionTitles: ['Overcoming Pitfalls in the Discipleship of Men'],
    featured: true,
    order: 4,
    status: SPEAKER_STATUS.PUBLISHED,
    socialLinks: null,
    createdBy: 'seed-script',
  },
  {
    speakerId: 'jun-marivic-parcon',
    conferenceId: CONFERENCE_ID,
    name: 'Capt. Jun & Marivic Parcon',
    title: 'Seasoned Citizens Ministry Leaders',
    organization: 'GCF South Metro',
    bio: 'Captain Jun and Marivic Parcon are mentors of mentors, with three children: Summer, Leo, and Len. Known as Kuya Jun and Ate Marivic in church, they are dedicated choir members and they serve as leaders of the Seasoned Citizens\' ministry at GCF South Metro Church. As leaders, they are passionate about ensuring that every senior enjoys God\'s presence, love, and blessings, guiding them in their faith and life journey.',
    photoUrl: null,
    sessionType: SESSION_TYPES.WORKSHOP,
    sessionTitle: 'Overcoming Pitfalls in the Discipleship of Senior Citizens',
    sessionIds: [],
    sessionTitles: ['Overcoming Pitfalls in the Discipleship of Senior Citizens'],
    featured: true,
    order: 5,
    status: SPEAKER_STATUS.PUBLISHED,
    socialLinks: null,
    createdBy: 'seed-script',
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
 * Seed speakers to Firestore
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<void>}
 */
async function seedSpeakers(db) {
  const batch = db.batch();
  const speakersRef = db.collection(COLLECTIONS.SPEAKERS);
  const now = admin.firestore.Timestamp.now();

  console.log(`\nSeeding ${SPEAKERS_DATA.length} speakers...`);

  for (const speaker of SPEAKERS_DATA) {
    const docRef = speakersRef.doc(speaker.speakerId);

    batch.set(docRef, {
      ...speaker,
      createdAt: now,
      updatedAt: now,
    });

    console.log(`  - ${speaker.name} (${speaker.speakerId})`);
  }

  await batch.commit();
  console.log(`\nSuccessfully seeded ${SPEAKERS_DATA.length} speakers!`);
}

/**
 * Clear existing speakers (optional, for clean re-seed)
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<void>}
 */
async function clearSpeakers(db) {
  const speakersRef = db.collection(COLLECTIONS.SPEAKERS);
  const snapshot = await speakersRef.get();

  if (snapshot.empty) {
    console.log('No existing speakers to clear.');
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`Cleared ${snapshot.size} existing speakers.`);
}

/**
 * Check if speakers already exist in Firestore
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<number>} Number of existing speakers
 */
async function countExistingSpeakers(db) {
  const speakersRef = db.collection(COLLECTIONS.SPEAKERS);
  const snapshot = await speakersRef.get();
  return snapshot.size;
}

/**
 * Main function to run the seed script
 */
async function main() {
  console.log('='.repeat(50));
  console.log('IDMC Speakers Seed Script');
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
    const existingCount = await countExistingSpeakers(db);

    if (existingCount > 0 && !shouldClear && !forceReseed) {
      console.log(`\n📋 Found ${existingCount} existing speakers in database.`);
      console.log('Skipping seed to preserve existing data.');
      console.log('Use --clear to replace or --force to add anyway.');
      console.log('\n✅ No changes made.');
      console.log('='.repeat(50));
      process.exit(0);
    }

    // Clear existing speakers if requested
    if (shouldClear) {
      await clearSpeakers(db);
    }

    // Seed speakers
    await seedSpeakers(db);

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
