/**
 * Seed Feedback Form Script
 * Populates Firestore with feedback form configuration for IDMC Conference.
 * Updates only the feedback settings portion of the conference settings document.
 *
 * Usage:
 *   node scripts/seed-feedback.js
 *   node scripts/seed-feedback.js --clear  # Reset to default feedback settings
 *   node scripts/seed-feedback.js --force  # Seed even if feedback settings exist
 *
 * Prerequisites:
 *   - Firebase CLI installed and logged in
 *   - GOOGLE_APPLICATION_CREDENTIALS env var set to service account key path
 *     OR run with: firebase emulators:exec "node scripts/seed-feedback.js"
 *
 * For local emulator:
 *   export FIRESTORE_EMULATOR_HOST="localhost:8080"
 *   node scripts/seed-feedback.js
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
 * Feedback form seed data
 * Contains form configuration, fields, and options
 */
const FEEDBACK_DATA = {
  enabled: false,
  closingDate: null,
  formTitle: 'Event Feedback',
  formSubtitle: 'We value your feedback. Please share your experience with us.',
  fields: [
    {
      id: 'isAnonymous',
      type: 'checkbox',
      label: 'Submit anonymously',
      required: false,
      order: 1,
    },
    {
      id: 'submitterName',
      type: 'text',
      label: 'Name',
      placeholder: 'Enter your name',
      required: false,
      order: 2,
      conditionalOn: { field: 'isAnonymous', value: false },
    },
    {
      id: 'age',
      type: 'text',
      label: 'Age',
      placeholder: 'Optional',
      required: false,
      order: 3,
    },
    {
      id: 'growthGroup',
      type: 'text',
      label: 'Growth Group',
      placeholder: 'Optional',
      required: false,
      order: 4,
    },
    {
      id: 'spiritualImpact',
      type: 'checkboxGroup',
      label: 'Please assess the spiritual impact of CROSSROAD to you. Check the appropriate boxes.',
      required: false,
      order: 5,
      options: [
        { id: 'receivedJesus', label: 'I received Jesus as my personal Lord and Savior' },
        { id: 'commitmentToGrow', label: 'I made a commitment to grow in my spiritual habits' },
        { id: 'commitmentToRelationship', label: 'I made a commitment to work on my relationship/s' },
        { id: 'commitmentToGroup', label: 'I made a commitment to join/lead a Growth/Mentoring Group' },
        { id: 'commitmentToMinistry', label: 'I made a commitment to serve in a ministry' },
        { id: 'seekCounselling', label: 'I want to seek counselling' },
      ],
    },
    {
      id: 'counsellingName',
      type: 'text',
      label: 'Counselling Contact - Name',
      placeholder: 'Enter your name',
      required: true,
      order: 6,
      conditionalOn: { field: 'spiritualImpact.seekCounselling', value: true },
    },
    {
      id: 'counsellingPhone',
      type: 'text',
      label: 'Counselling Contact - Phone',
      placeholder: 'Enter your phone number',
      required: true,
      order: 7,
      conditionalOn: { field: 'spiritualImpact.seekCounselling', value: true },
    },
    {
      id: 'howBlessed',
      type: 'textarea',
      label: 'Please share specifically how you were blessed:',
      placeholder: '',
      required: false,
      order: 8,
    },
    {
      id: 'godDidInMe',
      type: 'textarea',
      label: 'One thing that God did to me in me this Crossroads Weekend is:',
      placeholder: '',
      required: false,
      order: 9,
    },
    {
      id: 'smartGoal',
      type: 'textarea',
      label: 'One smart goal that I have committed to fulfil is:',
      placeholder: '',
      required: false,
      order: 10,
    },
    {
      id: 'programme',
      type: 'textarea',
      label: 'Programme:',
      placeholder: '',
      required: false,
      order: 11,
    },
    {
      id: 'couldDoWithout',
      type: 'textarea',
      label: 'Could do without:',
      placeholder: '',
      required: false,
      order: 12,
    },
    {
      id: 'couldDoMoreOf',
      type: 'textarea',
      label: 'Could do more of:',
      placeholder: '',
      required: false,
      order: 13,
    },
    {
      id: 'bestDoneWas',
      type: 'textarea',
      label: 'Best done was:',
      placeholder: '',
      required: false,
      order: 14,
    },
    {
      id: 'otherComments',
      type: 'textarea',
      label: 'Other comments:',
      placeholder: '',
      required: false,
      order: 15,
    },
  ],
};

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
 * Seed feedback settings to Firestore
 * Updates only the feedback field within the settings document
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<void>}
 */
async function seedFeedback(db) {
  const settingsRef = db.collection(COLLECTIONS.CONFERENCES).doc(SETTINGS_DOC_ID);
  const now = admin.firestore.Timestamp.now();

  console.log('\nSeeding feedback form settings...');

  // Check if settings document exists
  const settingsDoc = await settingsRef.get();

  if (!settingsDoc.exists) {
    console.log('  Settings document does not exist. Creating with feedback settings...');
    await settingsRef.set({
      feedback: FEEDBACK_DATA,
      createdAt: now,
      updatedAt: now,
      createdBy: 'seed-feedback-script',
    });
  } else {
    // Update only the feedback field
    await settingsRef.update({
      feedback: FEEDBACK_DATA,
      updatedAt: now,
    });
  }

  console.log('  - Feedback form settings seeded');
  console.log(`    Form Title: ${FEEDBACK_DATA.formTitle}`);
  console.log(`    Form Subtitle: ${FEEDBACK_DATA.formSubtitle}`);
  console.log(`    Enabled: ${FEEDBACK_DATA.enabled}`);
  console.log(`    Closing Date: ${FEEDBACK_DATA.closingDate || '(not set)'}`);
  console.log(`    Fields: ${FEEDBACK_DATA.fields.length} field(s)`);

  // Log field summary
  console.log('\n  Field Summary:');
  for (const field of FEEDBACK_DATA.fields) {
    const conditionalNote = field.conditionalOn ? ` (conditional on ${field.conditionalOn.field})` : '';
    console.log(`    ${field.order}. [${field.type}] ${field.label.substring(0, 50)}${field.label.length > 50 ? '...' : ''}${conditionalNote}`);
  }

  console.log(`\nSuccessfully seeded feedback form with ${FEEDBACK_DATA.fields.length} fields!`);
}

/**
 * Clear feedback settings (reset to empty/default)
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<void>}
 */
async function clearFeedback(db) {
  const settingsRef = db.collection(COLLECTIONS.CONFERENCES).doc(SETTINGS_DOC_ID);
  const settingsDoc = await settingsRef.get();

  if (!settingsDoc.exists) {
    console.log('Settings document does not exist. Nothing to clear.');
    return;
  }

  const currentData = settingsDoc.data();
  if (!currentData.feedback) {
    console.log('No existing feedback settings to clear.');
    return;
  }

  // Reset feedback to empty default state
  await settingsRef.update({
    feedback: {
      enabled: false,
      closingDate: null,
      formTitle: '',
      formSubtitle: '',
      fields: [],
    },
    updatedAt: admin.firestore.Timestamp.now(),
  });

  console.log('Cleared existing feedback settings (reset to empty).');
}

/**
 * Check if feedback settings exist in Firestore
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<{exists: boolean, fieldCount: number}>} Feedback existence info
 */
async function feedbackExists(db) {
  const settingsRef = db.collection(COLLECTIONS.CONFERENCES).doc(SETTINGS_DOC_ID);
  const settingsDoc = await settingsRef.get();

  if (!settingsDoc.exists) {
    return { exists: false, fieldCount: 0 };
  }

  const data = settingsDoc.data();
  if (!data.feedback || !data.feedback.fields) {
    return { exists: false, fieldCount: 0 };
  }

  return {
    exists: true,
    fieldCount: data.feedback.fields.length,
    enabled: data.feedback.enabled,
    formTitle: data.feedback.formTitle,
  };
}

/**
 * Main function to run the seed script
 */
async function main() {
  console.log('='.repeat(50));
  console.log('IDMC Feedback Form Seed Script');
  console.log('='.repeat(50));

  const isEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;
  const isCI = !!process.env.CI || !!process.env.GITHUB_ACTIONS;
  console.log(`\nMode: ${isEmulator ? 'EMULATOR' : 'PRODUCTION'}`);
  console.log(`Environment: ${isCI ? 'CI/CD' : 'Local'}`);

  if (isEmulator) {
    console.log(`Emulator host: ${process.env.FIRESTORE_EMULATOR_HOST}`);
  } else if (!isCI) {
    console.log('\nWARNING: Running against PRODUCTION database!');
    console.log('Press Ctrl+C within 5 seconds to cancel...\n');
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  try {
    const app = initializeFirebase();
    const db = getFirestore(app, DATABASE_ID);
    console.log(`Database: ${DATABASE_ID}`);

    const shouldClear = process.argv.includes('--clear');
    const forceReseed = process.argv.includes('--force');

    const feedbackInfo = await feedbackExists(db);

    if (feedbackInfo.exists && feedbackInfo.fieldCount > 0 && !shouldClear && !forceReseed) {
      console.log('\nFound existing feedback settings in database:');
      console.log(`   - Form Title: ${feedbackInfo.formTitle}`);
      console.log(`   - Fields: ${feedbackInfo.fieldCount}`);
      console.log(`   - Enabled: ${feedbackInfo.enabled}`);
      console.log('Skipping seed to preserve existing data.');
      console.log('Use --clear to replace or --force to overwrite anyway.');
      console.log('\nNo changes made.');
      console.log('='.repeat(50));
      process.exit(0);
    }

    if (shouldClear) {
      await clearFeedback(db);
    }

    await seedFeedback(db);

    console.log('\nSeed completed successfully!');
    console.log('='.repeat(50));

    process.exit(0);
  } catch (error) {
    console.error('\nSeed failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
