/**
 * Seed Workshops Script
 * Populates Firestore with workshop data for IDMC Conference.
 * Workshops are stored in the sessions collection with sessionType "workshop"
 * and include additional fields for category, timeSlot, and capacity management.
 *
 * Usage:
 *   node scripts/seed-workshops.js
 *   node scripts/seed-workshops.js --clear  # Clear existing workshops and re-seed
 *   node scripts/seed-workshops.js --force  # Seed even if workshops exist
 *
 * Prerequisites:
 *   - Firebase CLI installed and logged in
 *   - GOOGLE_APPLICATION_CREDENTIALS env var set to service account key path
 *     OR run with: firebase emulators:exec "node scripts/seed-workshops.js"
 *
 * For local emulator:
 *   export FIRESTORE_EMULATOR_HOST="localhost:8080"
 *   node scripts/seed-workshops.js
 */

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Collection name constant
const COLLECTIONS = {
  SESSIONS: 'sessions',
};

// Conference ID for IDMC 2026
const CONFERENCE_ID = 'idmc-2026';

// Firestore database ID (named database)
const DATABASE_ID = 'idmc-2026';

// Session types
const SESSION_TYPES = {
  WORKSHOP: 'workshop',
};

// Session status values
const SESSION_STATUS = {
  PUBLISHED: 'published',
  DRAFT: 'draft',
};

// Workshop categories
const WORKSHOP_CATEGORIES = {
  NEXT_GENERATION: 'next_generation',
  WOMEN: 'women',
  MEN: 'men',
  COUPLES: 'couples',
  SENIOR_CITIZENS: 'senior_citizens',
};

// Workshop time slots
const WORKSHOP_TIME_SLOTS = {
  DAY1_AFTERNOON: 'day1_afternoon',
};

/**
 * Workshop seed data for IDMC 2026
 * Based on GCF South Metro workshop structure
 */
const WORKSHOPS_DATA = [
  {
    workshopId: 'workshop-next-generation',
    conferenceId: CONFERENCE_ID,
    title: 'Overcoming Pitfalls in the Discipleship of the Next Generation',
    description:
      'A workshop focused on effectively discipling children, youth, and young adults. Learn how to navigate common challenges and help the next generation choose to follow Jesus.',
    sessionType: SESSION_TYPES.WORKSHOP,
    category: WORKSHOP_CATEGORIES.NEXT_GENERATION,
    track: 'Next Generation',
    day: 1,
    startTime: '13:15',
    endTime: '15:00',
    durationMinutes: 105,
    timeSlot: WORKSHOP_TIME_SLOTS.DAY1_AFTERNOON,
    venue: 'Worship Hall',
    capacity: 100,
    registeredCount: 0,
    speakerIds: ['karen-monroy'],
    speakerNames: ['Teacher Karen Monroy'],
    order: 1,
    status: SESSION_STATUS.PUBLISHED,
    createdBy: 'seed-script',
  },
  {
    workshopId: 'workshop-women',
    conferenceId: CONFERENCE_ID,
    title: 'Overcoming Pitfalls in the Discipleship of Women',
    description:
      'A workshop designed to equip leaders in mentoring and discipling women. Discover how to help women experience the fullness of joy that comes from the Lord.',
    sessionType: SESSION_TYPES.WORKSHOP,
    category: WORKSHOP_CATEGORIES.WOMEN,
    track: 'Women',
    day: 1,
    startTime: '13:15',
    endTime: '15:00',
    durationMinutes: 105,
    timeSlot: WORKSHOP_TIME_SLOTS.DAY1_AFTERNOON,
    venue: '2nd Floor Lobby',
    capacity: 80,
    registeredCount: 0,
    speakerIds: ['carol-felipe'],
    speakerNames: ['Teacher Carol Felipe'],
    order: 2,
    status: SESSION_STATUS.PUBLISHED,
    createdBy: 'seed-script',
  },
  {
    workshopId: 'workshop-men',
    conferenceId: CONFERENCE_ID,
    title: 'Overcoming Pitfalls in the Discipleship of Men',
    description:
      'A workshop for those who are passionate about discipling men. Learn practical strategies for mentoring men in their faith journey.',
    sessionType: SESSION_TYPES.WORKSHOP,
    category: WORKSHOP_CATEGORIES.MEN,
    track: 'Men',
    day: 1,
    startTime: '13:15',
    endTime: '15:00',
    durationMinutes: 105,
    timeSlot: WORKSHOP_TIME_SLOTS.DAY1_AFTERNOON,
    venue: 'CDC',
    capacity: 60,
    registeredCount: 0,
    speakerIds: ['gilbert-bayang'],
    speakerNames: ['Elder Capt. Gilbert Bayang'],
    order: 3,
    status: SESSION_STATUS.PUBLISHED,
    createdBy: 'seed-script',
  },
  {
    workshopId: 'workshop-senior-citizens',
    conferenceId: CONFERENCE_ID,
    title: 'Overcoming Pitfalls in the Discipleship of Senior Citizens',
    description:
      "A workshop dedicated to ministering to seasoned citizens. Learn how to guide seniors in their faith and life journey while ensuring they enjoy God's presence, love, and blessings.",
    sessionType: SESSION_TYPES.WORKSHOP,
    category: WORKSHOP_CATEGORIES.SENIOR_CITIZENS,
    track: 'Senior Citizens',
    day: 1,
    startTime: '13:15',
    endTime: '15:00',
    durationMinutes: 105,
    timeSlot: WORKSHOP_TIME_SLOTS.DAY1_AFTERNOON,
    venue: 'YDT',
    capacity: 50,
    registeredCount: 0,
    speakerIds: ['jun-marivic-parcon'],
    speakerNames: ['Capt. Jun & Marivic Parcon'],
    order: 4,
    status: SESSION_STATUS.PUBLISHED,
    createdBy: 'seed-script',
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
 * Convert time string from 24-hour to 12-hour format
 *
 * @param {string} time24 - Time in 24-hour format (HH:MM)
 * @returns {string} Time in 12-hour format (H:MM AM/PM)
 */
function formatTimeDisplay(time24) {
  const [hours, minutes] = time24.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

/**
 * Seed workshops to Firestore
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<void>}
 */
async function seedWorkshops(db) {
  const batch = db.batch();
  const sessionsRef = db.collection(COLLECTIONS.SESSIONS);
  const now = admin.firestore.Timestamp.now();

  console.log(`\nSeeding ${WORKSHOPS_DATA.length} workshops...`);

  for (const workshop of WORKSHOPS_DATA) {
    const docRef = sessionsRef.doc(workshop.workshopId);

    const workshopData = {
      ...workshop,
      time: formatTimeDisplay(workshop.startTime),
      endTime: formatTimeDisplay(workshop.endTime),
      createdAt: now,
      updatedAt: now,
    };

    delete workshopData.workshopId;

    batch.set(docRef, workshopData);

    console.log(`  - ${workshop.title} (${workshop.workshopId})`);
  }

  await batch.commit();
  console.log(`\nSuccessfully seeded ${WORKSHOPS_DATA.length} workshops!`);
}

/**
 * Clear existing workshops from Firestore
 * Only removes documents with sessionType "workshop"
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<void>}
 */
async function clearWorkshops(db) {
  const sessionsRef = db.collection(COLLECTIONS.SESSIONS);
  const workshopsQuery = sessionsRef.where(
    'sessionType',
    '==',
    SESSION_TYPES.WORKSHOP
  );
  const snapshot = await workshopsQuery.get();

  if (snapshot.empty) {
    console.log('No existing workshops to clear.');
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`Cleared ${snapshot.size} existing workshops.`);
}

/**
 * Count existing workshops in Firestore
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<number>} Number of existing workshops
 */
async function countExistingWorkshops(db) {
  const sessionsRef = db.collection(COLLECTIONS.SESSIONS);
  const workshopsQuery = sessionsRef.where(
    'sessionType',
    '==',
    SESSION_TYPES.WORKSHOP
  );
  const snapshot = await workshopsQuery.get();
  return snapshot.size;
}

/**
 * Main function to run the seed script
 */
async function main() {
  console.log('='.repeat(50));
  console.log('IDMC Workshops Seed Script');
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

    const existingCount = await countExistingWorkshops(db);

    if (existingCount > 0 && !shouldClear && !forceReseed) {
      console.log(`\n Found ${existingCount} existing workshops in database.`);
      console.log('Skipping seed to preserve existing data.');
      console.log('Use --clear to replace or --force to add anyway.');
      console.log('\n No changes made.');
      console.log('='.repeat(50));
      process.exit(0);
    }

    if (shouldClear) {
      await clearWorkshops(db);
    }

    await seedWorkshops(db);

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
