/**
 * Seed Schedule Script
 * Populates Firestore with the complete conference schedule for IDMC 2026.
 * This includes all session types: registration, worship, plenaries, lunch,
 * and workshops.
 *
 * Usage:
 *   node scripts/seed-schedule.js
 *   node scripts/seed-schedule.js --clear  # Clear existing sessions and re-seed
 *   node scripts/seed-schedule.js --force  # Seed even if sessions exist
 *
 * Prerequisites:
 *   - Firebase CLI installed and logged in
 *   - GOOGLE_APPLICATION_CREDENTIALS env var set to service account key path
 *     OR run with: firebase emulators:exec "node scripts/seed-schedule.js"
 *
 * For local emulator:
 *   export FIRESTORE_EMULATOR_HOST="localhost:8080"
 *   node scripts/seed-schedule.js
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
  PLENARY: 'plenary',
  WORKSHOP: 'workshop',
  BREAK: 'break',
  REGISTRATION: 'registration',
  WORSHIP: 'worship',
  LUNCH: 'lunch',
  OTHER: 'other',
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
 * Complete schedule seed data for IDMC 2026
 * Single day conference at GCF South Metro
 */
const SCHEDULE_DATA = [
  {
    sessionId: 'registration',
    conferenceId: CONFERENCE_ID,
    title: 'Registration',
    description: 'Check-in and receive conference materials',
    sessionType: SESSION_TYPES.REGISTRATION,
    day: 1,
    startTime: '07:00',
    endTime: '09:00',
    durationMinutes: 120,
    venue: '1st Floor Lobby',
    speakerIds: [],
    speakerNames: [],
    order: 1,
    status: SESSION_STATUS.PUBLISHED,
    createdBy: 'seed-script',
  },
  {
    sessionId: 'worship-opening',
    conferenceId: CONFERENCE_ID,
    title: 'Worship & Opening Prayer',
    description: 'Corporate worship and opening prayer',
    sessionType: SESSION_TYPES.WORSHIP,
    day: 1,
    startTime: '09:00',
    endTime: '09:25',
    durationMinutes: 25,
    venue: 'Worship Hall',
    speakerIds: [],
    speakerNames: [],
    order: 2,
    status: SESSION_STATUS.PUBLISHED,
    createdBy: 'seed-script',
  },
  {
    sessionId: 'plenary-1',
    conferenceId: CONFERENCE_ID,
    title: 'Plenary Session 1',
    description: 'First plenary session of IDMC 2026',
    sessionType: SESSION_TYPES.PLENARY,
    day: 1,
    startTime: '09:25',
    endTime: '10:50',
    durationMinutes: 85,
    venue: 'Worship Hall',
    speakerIds: ['lito-villoria'],
    speakerNames: ['Rev. Dr. Lito Villoria'],
    order: 3,
    status: SESSION_STATUS.PUBLISHED,
    createdBy: 'seed-script',
  },
  {
    sessionId: 'plenary-2',
    conferenceId: CONFERENCE_ID,
    title: 'Plenary Session 2',
    description: 'Second plenary session of IDMC 2026',
    sessionType: SESSION_TYPES.PLENARY,
    day: 1,
    startTime: '10:50',
    endTime: '12:00',
    durationMinutes: 70,
    venue: 'Worship Hall',
    speakerIds: ['lito-villoria'],
    speakerNames: ['Rev. Dr. Lito Villoria'],
    order: 4,
    status: SESSION_STATUS.PUBLISHED,
    createdBy: 'seed-script',
  },
  {
    sessionId: 'lunch',
    conferenceId: CONFERENCE_ID,
    title: 'Lunch Break',
    description: 'Fellowship and meal time',
    sessionType: SESSION_TYPES.LUNCH,
    day: 1,
    startTime: '12:00',
    endTime: '13:15',
    durationMinutes: 75,
    venue: 'Worship Hall',
    speakerIds: [],
    speakerNames: [],
    order: 5,
    status: SESSION_STATUS.PUBLISHED,
    createdBy: 'seed-script',
  },
  {
    sessionId: 'workshop-next-generation',
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
    order: 6,
    status: SESSION_STATUS.PUBLISHED,
    createdBy: 'seed-script',
  },
  {
    sessionId: 'workshop-women',
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
    venue: 'CDC',
    capacity: 80,
    registeredCount: 0,
    speakerIds: ['carol-felipe'],
    speakerNames: ['Teacher Carol Felipe'],
    order: 7,
    status: SESSION_STATUS.PUBLISHED,
    createdBy: 'seed-script',
  },
  {
    sessionId: 'workshop-men',
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
    venue: 'YDT',
    capacity: 60,
    registeredCount: 0,
    speakerIds: ['gilbert-bayang'],
    speakerNames: ['Elder Capt. Gilbert Bayang'],
    order: 8,
    status: SESSION_STATUS.PUBLISHED,
    createdBy: 'seed-script',
  },
  {
    sessionId: 'workshop-senior-citizens',
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
    venue: 'Library',
    capacity: 50,
    registeredCount: 0,
    speakerIds: ['jun-marivic-parcon'],
    speakerNames: ['Capt. Jun & Marivic Parcon'],
    order: 9,
    status: SESSION_STATUS.PUBLISHED,
    createdBy: 'seed-script',
  },
  {
    sessionId: 'workshop-couples',
    conferenceId: CONFERENCE_ID,
    title: 'Overcoming Pitfalls in the Discipleship of Couples',
    description:
      'A workshop for those involved in couples ministry. Learn how to effectively disciple married couples and help them grow together in their faith journey.',
    sessionType: SESSION_TYPES.WORKSHOP,
    category: WORKSHOP_CATEGORIES.COUPLES,
    track: 'Couples',
    day: 1,
    startTime: '13:15',
    endTime: '15:00',
    durationMinutes: 105,
    timeSlot: WORKSHOP_TIME_SLOTS.DAY1_AFTERNOON,
    venue: '2nd Floor Lobby',
    capacity: 60,
    registeredCount: 0,
    speakerIds: ['edwin-ea-sindayen'],
    speakerNames: ['Deacon Edwin & Ea Sindayen'],
    order: 10,
    status: SESSION_STATUS.PUBLISHED,
    createdBy: 'seed-script',
  },
  {
    sessionId: 'plenary-3',
    conferenceId: CONFERENCE_ID,
    title: 'Plenary Session 3',
    description: 'Third plenary session of IDMC 2026',
    sessionType: SESSION_TYPES.PLENARY,
    day: 1,
    startTime: '15:15',
    endTime: '16:35',
    durationMinutes: 80,
    venue: 'Worship Hall',
    speakerIds: ['lito-villoria'],
    speakerNames: ['Rev. Dr. Lito Villoria'],
    order: 11,
    status: SESSION_STATUS.PUBLISHED,
    createdBy: 'seed-script',
  },
  {
    sessionId: 'worship-closing',
    conferenceId: CONFERENCE_ID,
    title: 'Worship & Closing Prayer',
    description: 'Corporate worship and closing prayer',
    sessionType: SESSION_TYPES.WORSHIP,
    day: 1,
    startTime: '16:35',
    endTime: '17:30',
    durationMinutes: 55,
    venue: 'Worship Hall',
    speakerIds: [],
    speakerNames: [],
    order: 12,
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
 * Seed schedule to Firestore
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<void>}
 */
async function seedSchedule(db) {
  const batch = db.batch();
  const sessionsRef = db.collection(COLLECTIONS.SESSIONS);
  const now = admin.firestore.Timestamp.now();

  console.log(`\nSeeding ${SCHEDULE_DATA.length} schedule items...`);

  for (const session of SCHEDULE_DATA) {
    const docRef = sessionsRef.doc(session.sessionId);

    const sessionData = {
      ...session,
      time: formatTimeDisplay(session.startTime),
      endTimeDisplay: formatTimeDisplay(session.endTime),
      createdAt: now,
      updatedAt: now,
    };

    delete sessionData.sessionId;

    batch.set(docRef, sessionData);

    console.log(`  - ${session.title} (${session.sessionId})`);
  }

  await batch.commit();
  console.log(`\nSuccessfully seeded ${SCHEDULE_DATA.length} schedule items!`);
}

/**
 * Clear all sessions from Firestore
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<void>}
 */
async function clearSchedule(db) {
  const sessionsRef = db.collection(COLLECTIONS.SESSIONS);
  const snapshot = await sessionsRef.get();

  if (snapshot.empty) {
    console.log('No existing sessions to clear.');
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`Cleared ${snapshot.size} existing sessions.`);
}

/**
 * Count existing sessions in Firestore
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<number>} Number of existing sessions
 */
async function countExistingSessions(db) {
  const sessionsRef = db.collection(COLLECTIONS.SESSIONS);
  const snapshot = await sessionsRef.get();
  return snapshot.size;
}

/**
 * Main function to run the seed script
 */
async function main() {
  console.log('='.repeat(50));
  console.log('IDMC Schedule Seed Script');
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

    const existingCount = await countExistingSessions(db);

    if (existingCount > 0 && !shouldClear && !forceReseed) {
      console.log(`\n Found ${existingCount} existing sessions in database.`);
      console.log('Skipping seed to preserve existing data.');
      console.log('Use --clear to replace or --force to add anyway.');
      console.log('\n No changes made.');
      console.log('='.repeat(50));
      process.exit(0);
    }

    if (shouldClear) {
      await clearSchedule(db);
    }

    await seedSchedule(db);

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
