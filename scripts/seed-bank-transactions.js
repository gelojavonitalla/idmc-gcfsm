/**
 * Seed Bank Transactions Script
 * Populates Firestore with mock registrations using bank transfer payments for testing.
 *
 * Usage:
 *   node scripts/seed-bank-transactions.js
 *   node scripts/seed-bank-transactions.js --clear    (clears existing before seeding)
 *   node scripts/seed-bank-transactions.js --count=30 (seed 30 bank transactions)
 *
 * Prerequisites:
 *   - Firebase CLI installed and logged in
 *   - GOOGLE_APPLICATION_CREDENTIALS env var set to service account key path
 *
 * For local emulator:
 *   export FIRESTORE_EMULATOR_HOST="localhost:8080"
 *   node scripts/seed-bank-transactions.js
 */

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Collection name constant
const COLLECTIONS = {
  REGISTRATIONS: 'registrations',
};

// Conference ID for IDMC 2026
const CONFERENCE_ID = 'idmc-2026';

// Firestore database ID (named database)
const DATABASE_ID = 'idmc-2026';

// Registration status values
const REGISTRATION_STATUS = {
  PENDING_VERIFICATION: 'pending_verification',
  CONFIRMED: 'confirmed',
};

// Registration categories
const REGISTRATION_CATEGORIES = {
  REGULAR: 'regular',
  STUDENT_SENIOR: 'student_senior',
};

// Workshop categories
const WORKSHOP_CATEGORIES = {
  NEXT_GENERATION: 'next_generation',
  WOMEN: 'women',
  MEN: 'men',
  COUPLES: 'couples',
  SENIOR_CITIZENS: 'senior_citizens',
};

// Payment method (only bank transfer)
const PAYMENT_METHOD = 'bank_transfer';

// Safe characters for short code (avoids confusing chars like 0/O, 1/l/I, 5/S, 2/Z, 8/B)
const SAFE_SHORT_CODE_CHARS = 'ACDEFGHJKMNPQRTUVWXY34679';

// Length of registration short code
const SHORT_CODE_LENGTH = 6;

// Length of short code suffix (last 4 characters for quick lookup)
const SHORT_CODE_SUFFIX_LENGTH = 4;

// Sample data for generation
const FIRST_NAMES = [
  'Juan', 'Maria', 'Jose', 'Ana', 'Pedro', 'Rosa', 'Carlos', 'Elena',
  'Miguel', 'Sofia', 'Antonio', 'Isabella', 'Francisco', 'Gabriela',
  'Roberto', 'Carmen', 'Daniel', 'Lucia', 'Manuel', 'Patricia',
  'Ricardo', 'Teresa', 'Fernando', 'Angela', 'Luis', 'Beatriz',
];

const LAST_NAMES = [
  'Santos', 'Reyes', 'Cruz', 'Garcia', 'Mendoza', 'Torres', 'Flores',
  'Rivera', 'Gonzales', 'Ramos', 'Bautista', 'Villanueva', 'De Leon',
  'Aquino', 'Castro', 'Morales', 'Lopez', 'Hernandez', 'Martinez',
];

const EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
];

const CHURCHES = [
  { name: 'Jesus Is Lord Church', city: 'Alabang', province: 'Metro Manila / NCR' },
  { name: 'Jesus Is Lord Church', city: 'Makati City', province: 'Metro Manila / NCR' },
  { name: 'Jesus Is Lord Church', city: 'Quezon City', province: 'Metro Manila / NCR' },
  { name: 'Jesus Is Lord Church', city: 'Pasig City', province: 'Metro Manila / NCR' },
  { name: 'Jesus Is Lord Church', city: 'Taguig City', province: 'Metro Manila / NCR' },
  { name: 'GCF South Metro', city: 'Las Piñas City', province: 'Metro Manila / NCR' },
  { name: 'GCF Makati', city: 'Makati City', province: 'Metro Manila / NCR' },
  { name: 'GCF Alabang', city: 'Muntinlupa City', province: 'Metro Manila / NCR' },
];

const MINISTRY_ROLES = [
  'Pastor',
  'Elder',
  'Deacon/Deaconess',
  'Ministry Leader',
  'Small Group Leader',
  'Worship Team',
  'Youth Leader',
  'Member',
];

const PHONE_PREFIXES = ['0917', '0918', '0919', '0920', '0921', '0927', '0928', '0929', '0939'];

// Bank account IDs (matching seed-bank-accounts.js)
const BANK_ACCOUNT_IDS = [
  'gcfsm-securitybank-current-001',
  'gcfsm-chinabank-current-001',
  'gcfsm-bdo-current-001',
  'gcfsm-bpi-current-001',
];

/**
 * Helper functions
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPick(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateEmail(firstName, lastName) {
  const domain = randomPick(EMAIL_DOMAINS);
  const separator = randomPick(['.', '_', '']);
  const suffix = randomInt(1, 99);
  return `${firstName.toLowerCase()}${separator}${lastName.toLowerCase()}${suffix}@${domain}`;
}

function generatePhoneNumber() {
  const prefix = randomPick(PHONE_PREFIXES);
  const number = String(randomInt(1000000, 9999999));
  return `${prefix}${number}`;
}

function generateBankReference() {
  const timestamp = Date.now().toString().slice(-8);
  const random = randomInt(1000, 9999);
  return `BT${timestamp}${random}`;
}

function randomDate(daysAgo) {
  const now = new Date();
  const pastDate = new Date(now.getTime() - randomInt(0, daysAgo) * 24 * 60 * 60 * 1000);
  pastDate.setHours(randomInt(6, 22), randomInt(0, 59), randomInt(0, 59));
  return pastDate;
}

/**
 * Generates a unique 6-character short code using safe characters.
 *
 * @returns {string} 6-character short code (e.g., "A7K3MN")
 */
function generateShortCode() {
  let code = '';
  for (let i = 0; i < SHORT_CODE_LENGTH; i += 1) {
    const randomIndex = Math.floor(Math.random() * SAFE_SHORT_CODE_CHARS.length);
    code += SAFE_SHORT_CODE_CHARS[randomIndex];
  }
  return code;
}

/**
 * Generates a single mock registration with bank transfer payment
 *
 * @param {number} index - Registration index
 * @returns {Object} Registration object with bank transfer
 */
function generateBankTransaction(index) {
  const firstName = randomPick(FIRST_NAMES);
  const lastName = randomPick(LAST_NAMES);
  const email = generateEmail(firstName, lastName);
  const phone = generatePhoneNumber();
  const church = randomPick(CHURCHES);
  const ministryRole = randomPick(MINISTRY_ROLES);

  const statuses = [
    REGISTRATION_STATUS.CONFIRMED,
    REGISTRATION_STATUS.CONFIRMED,
    REGISTRATION_STATUS.CONFIRMED,
    REGISTRATION_STATUS.PENDING_VERIFICATION,
  ];

  const categories = [
    REGISTRATION_CATEGORIES.REGULAR,
    REGISTRATION_CATEGORIES.REGULAR,
    REGISTRATION_CATEGORIES.REGULAR,
    REGISTRATION_CATEGORIES.STUDENT_SENIOR,
  ];

  const workshops = [
    WORKSHOP_CATEGORIES.NEXT_GENERATION,
    WORKSHOP_CATEGORIES.WOMEN,
    WORKSHOP_CATEGORIES.MEN,
    WORKSHOP_CATEGORIES.COUPLES,
    WORKSHOP_CATEGORIES.SENIOR_CITIZENS,
  ];

  const status = randomPick(statuses);
  const category = randomPick(categories);
  const workshopSelection = randomPick(workshops);
  const bankAccountId = randomPick(BANK_ACCOUNT_IDS);

  const isConfirmed = status === REGISTRATION_STATUS.CONFIRMED;

  const regularPrices = [500];
  const studentPrices = [300];
  const prices = category === REGISTRATION_CATEGORIES.STUDENT_SENIOR ? studentPrices : regularPrices;
  const totalAmount = randomPick(prices);

  const createdAt = randomDate(30);
  const uploadedAt = new Date(createdAt.getTime() + randomInt(1, 24) * 60 * 60 * 1000);
  const verifiedAt = isConfirmed
    ? new Date(uploadedAt.getTime() + randomInt(1, 48) * 60 * 60 * 1000)
    : null;
  const updatedAt = verifiedAt || uploadedAt;

  const shortCode = generateShortCode();
  const shortCodeSuffix = shortCode.slice(-SHORT_CODE_SUFFIX_LENGTH);

  const registration = {
    registrationId: `REG-2026-${shortCode}`,
    shortCode,
    shortCodeSuffix,
    conferenceId: CONFERENCE_ID,
    primaryAttendee: {
      firstName,
      lastName,
      email,
      phone,
      ministryRole,
    },
    church: {
      name: church.name,
      city: church.city,
      province: church.province,
    },
    category,
    workshopSelection,
    status,
    totalAmount,
    paymentMethod: PAYMENT_METHOD,
    paymentReference: generateBankReference(),
    paymentProofUrl: `https://storage.example.com/proofs/proof-bank-${index}.jpg`,
    // Payment details
    payment: {
      method: PAYMENT_METHOD,
      bankAccountId,
      proofUrl: `https://storage.example.com/proofs/proof-bank-${index}.jpg`,
      uploadedAt,
      amountPaid: totalAmount,
      balance: 0,
      status: isConfirmed ? 'verified' : 'pending',
      referenceNumber: generateBankReference(),
      verifiedBy: isConfirmed ? 'admin@idmc.org' : null,
      verifiedAt,
      rejectionReason: null,
      rejectedAt: null,
      rejectedBy: null,
    },
    checkedIn: isConfirmed ? Math.random() > 0.7 : false,
    checkedInAt: null,
    checkedInBy: null,
    notes: Math.random() > 0.9 ? 'Bank transfer via online banking' : null,
    createdBy: 'seed-script',
  };

  // Set check-in details if checked in
  if (registration.checkedIn) {
    registration.checkedInAt = new Date(createdAt.getTime() + randomInt(24, 72) * 60 * 60 * 1000);
    registration.checkedInBy = 'admin@idmc.org';
  }

  // Add additional attendees randomly (group registrations)
  if (Math.random() > 0.85) {
    const additionalCount = randomInt(1, 2);
    registration.additionalAttendees = [];
    for (let i = 0; i < additionalCount; i++) {
      const addFirstName = randomPick(FIRST_NAMES);
      const addLastName = randomPick(LAST_NAMES);
      registration.additionalAttendees.push({
        firstName: addFirstName,
        lastName: addLastName,
        email: generateEmail(addFirstName, addLastName),
        category: randomPick(categories),
      });
    }
    // Recalculate total amount for group registration
    registration.totalAmount = totalAmount * (1 + registration.additionalAttendees.length);
    registration.payment.amountPaid = registration.totalAmount;
  }

  // Store dates as timestamps for Firestore
  registration._createdAt = createdAt;
  registration._updatedAt = updatedAt;
  registration._uploadedAt = uploadedAt;
  registration._verifiedAt = verifiedAt;

  return registration;
}

/**
 * Pre-built static bank transactions for predictable testing
 */
const STATIC_BANK_TRANSACTIONS = [
  {
    registrationId: 'REG-2026-BANK01',
    shortCode: 'BANK01',
    shortCodeSuffix: 'NK01',
    conferenceId: CONFERENCE_ID,
    primaryAttendee: {
      firstName: 'Carlos',
      lastName: 'Mendoza',
      email: 'carlos.mendoza@gmail.com',
      phone: '09171234567',
      ministryRole: 'Ministry Leader',
    },
    church: {
      name: 'GCF South Metro',
      city: 'Las Piñas City',
      province: 'Metro Manila / NCR',
    },
    category: REGISTRATION_CATEGORIES.REGULAR,
    workshopSelection: WORKSHOP_CATEGORIES.MEN,
    status: REGISTRATION_STATUS.CONFIRMED,
    totalAmount: 500,
    paymentMethod: PAYMENT_METHOD,
    paymentReference: 'BT202512151234',
    paymentProofUrl: 'https://storage.example.com/proofs/proof-bank-001.jpg',
    payment: {
      method: PAYMENT_METHOD,
      bankAccountId: 'gcfsm-securitybank-current-001',
      proofUrl: 'https://storage.example.com/proofs/proof-bank-001.jpg',
      uploadedAt: new Date('2025-01-10T15:30:00'),
      amountPaid: 500,
      balance: 0,
      status: 'verified',
      referenceNumber: 'BT202512151234',
      verifiedBy: 'admin@idmc.org',
      verifiedAt: new Date('2025-01-11T10:00:00'),
      rejectionReason: null,
      rejectedAt: null,
      rejectedBy: null,
    },
    checkedIn: false,
    checkedInAt: null,
    checkedInBy: null,
    notes: null,
    createdBy: 'seed-script',
    _createdAt: new Date('2025-01-10T14:30:00'),
    _updatedAt: new Date('2025-01-11T10:00:00'),
    _uploadedAt: new Date('2025-01-10T15:30:00'),
    _verifiedAt: new Date('2025-01-11T10:00:00'),
  },
  {
    registrationId: 'REG-2026-BANK02',
    shortCode: 'BANK02',
    shortCodeSuffix: 'NK02',
    conferenceId: CONFERENCE_ID,
    primaryAttendee: {
      firstName: 'Angela',
      lastName: 'Torres',
      email: 'angela.torres@yahoo.com',
      phone: '09189876543',
      ministryRole: 'Small Group Leader',
    },
    church: {
      name: 'Jesus Is Lord Church',
      city: 'Makati City',
      province: 'Metro Manila / NCR',
    },
    category: REGISTRATION_CATEGORIES.REGULAR,
    workshopSelection: WORKSHOP_CATEGORIES.WOMEN,
    status: REGISTRATION_STATUS.PENDING_VERIFICATION,
    totalAmount: 500,
    paymentMethod: PAYMENT_METHOD,
    paymentReference: 'BT202512145678',
    paymentProofUrl: 'https://storage.example.com/proofs/proof-bank-002.jpg',
    payment: {
      method: PAYMENT_METHOD,
      bankAccountId: 'gcfsm-bdo-current-001',
      proofUrl: 'https://storage.example.com/proofs/proof-bank-002.jpg',
      uploadedAt: new Date('2025-01-12T09:15:00'),
      amountPaid: 500,
      balance: 0,
      status: 'pending',
      referenceNumber: 'BT202512145678',
      verifiedBy: null,
      verifiedAt: null,
      rejectionReason: null,
      rejectedAt: null,
      rejectedBy: null,
    },
    checkedIn: false,
    checkedInAt: null,
    checkedInBy: null,
    notes: null,
    createdBy: 'seed-script',
    _createdAt: new Date('2025-01-12T08:00:00'),
    _updatedAt: new Date('2025-01-12T09:15:00'),
    _uploadedAt: new Date('2025-01-12T09:15:00'),
    _verifiedAt: null,
  },
  {
    registrationId: 'REG-2026-BANK03',
    shortCode: 'BANK03',
    shortCodeSuffix: 'NK03',
    conferenceId: CONFERENCE_ID,
    primaryAttendee: {
      firstName: 'Fernando',
      lastName: 'Ramos',
      email: 'fernando.ramos@outlook.com',
      phone: '09201112233',
      ministryRole: 'Elder',
    },
    church: {
      name: 'GCF Makati',
      city: 'Makati City',
      province: 'Metro Manila / NCR',
    },
    category: REGISTRATION_CATEGORIES.REGULAR,
    workshopSelection: WORKSHOP_CATEGORIES.COUPLES,
    status: REGISTRATION_STATUS.CONFIRMED,
    totalAmount: 1000,
    paymentMethod: PAYMENT_METHOD,
    paymentReference: 'BT202512139012',
    paymentProofUrl: 'https://storage.example.com/proofs/proof-bank-003.jpg',
    payment: {
      method: PAYMENT_METHOD,
      bankAccountId: 'gcfsm-bpi-current-001',
      proofUrl: 'https://storage.example.com/proofs/proof-bank-003.jpg',
      uploadedAt: new Date('2025-01-09T11:00:00'),
      amountPaid: 1000,
      balance: 0,
      status: 'verified',
      referenceNumber: 'BT202512139012',
      verifiedBy: 'admin@idmc.org',
      verifiedAt: new Date('2025-01-10T14:30:00'),
      rejectionReason: null,
      rejectedAt: null,
      rejectedBy: null,
    },
    checkedIn: true,
    checkedInAt: new Date('2025-01-15T09:00:00'),
    checkedInBy: 'admin@idmc.org',
    notes: 'Group registration - couple',
    createdBy: 'seed-script',
    additionalAttendees: [
      {
        firstName: 'Teresa',
        lastName: 'Ramos',
        email: 'teresa.ramos@outlook.com',
        category: REGISTRATION_CATEGORIES.REGULAR,
      },
    ],
    _createdAt: new Date('2025-01-09T10:00:00'),
    _updatedAt: new Date('2025-01-15T09:00:00'),
    _uploadedAt: new Date('2025-01-09T11:00:00'),
    _verifiedAt: new Date('2025-01-10T14:30:00'),
  },
];

/**
 * Initialize Firebase Admin SDK
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
 * Seed bank transactions to Firestore
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {number} count - Number of bank transactions to seed
 * @param {boolean} useStatic - Use static bank transactions only
 * @returns {Promise<void>}
 */
async function seedBankTransactions(db, count, useStatic = false) {
  const registrationsRef = db.collection(COLLECTIONS.REGISTRATIONS);

  let bankTransactions;
  if (useStatic) {
    bankTransactions = STATIC_BANK_TRANSACTIONS;
    console.log(`\nSeeding ${bankTransactions.length} static bank transactions...`);
  } else {
    // Combine static + generated bank transactions
    const generatedCount = Math.max(0, count - STATIC_BANK_TRANSACTIONS.length);
    bankTransactions = [...STATIC_BANK_TRANSACTIONS];

    for (let i = 0; i < generatedCount; i++) {
      bankTransactions.push(generateBankTransaction(STATIC_BANK_TRANSACTIONS.length + i + 1));
    }
    console.log(`\nSeeding ${bankTransactions.length} bank transactions (${STATIC_BANK_TRANSACTIONS.length} static + ${generatedCount} generated)...`);
  }

  // Batch write (Firestore limits to 500 per batch)
  const batchSize = 500;
  let totalSeeded = 0;

  for (let i = 0; i < bankTransactions.length; i += batchSize) {
    const batch = db.batch();
    const chunk = bankTransactions.slice(i, i + batchSize);

    for (const txn of chunk) {
      const docRef = registrationsRef.doc(txn.registrationId);

      // Convert dates to Firestore Timestamps
      const createdAt = txn._createdAt
        ? admin.firestore.Timestamp.fromDate(txn._createdAt)
        : admin.firestore.Timestamp.now();
      const updatedAt = txn._updatedAt
        ? admin.firestore.Timestamp.fromDate(txn._updatedAt)
        : admin.firestore.Timestamp.now();
      const uploadedAt = txn._uploadedAt
        ? admin.firestore.Timestamp.fromDate(txn._uploadedAt)
        : null;
      const verifiedAt = txn._verifiedAt
        ? admin.firestore.Timestamp.fromDate(txn._verifiedAt)
        : null;

      // Remove internal fields and add timestamps
      const { _createdAt, _updatedAt, _uploadedAt, _verifiedAt, ...regData } = txn;

      // Update payment timestamps
      const paymentData = {
        ...regData.payment,
        uploadedAt,
        verifiedAt,
      };

      batch.set(docRef, {
        ...regData,
        payment: paymentData,
        createdAt,
        updatedAt,
        checkedInAt: regData.checkedInAt
          ? admin.firestore.Timestamp.fromDate(regData.checkedInAt)
          : null,
      });

      totalSeeded++;
    }

    await batch.commit();
    console.log(`  - Seeded batch ${Math.floor(i / batchSize) + 1} (${chunk.length} bank transactions)`);
  }

  console.log(`\nSuccessfully seeded ${totalSeeded} bank transactions!`);

  // Print summary
  const statusCounts = {};
  bankTransactions.forEach((txn) => {
    statusCounts[txn.status] = (statusCounts[txn.status] || 0) + 1;
  });

  console.log('\nBank Transaction Summary:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  - ${status}: ${count}`);
  });
}

/**
 * Clear existing bank transactions (registrations with bank_transfer payment)
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<void>}
 */
async function clearBankTransactions(db) {
  const registrationsRef = db.collection(COLLECTIONS.REGISTRATIONS);
  const snapshot = await registrationsRef.where('paymentMethod', '==', PAYMENT_METHOD).get();

  if (snapshot.empty) {
    console.log('No existing bank transactions to clear.');
    return;
  }

  const batchSize = 500;
  let totalDeleted = 0;

  for (let i = 0; i < snapshot.docs.length; i += batchSize) {
    const batch = db.batch();
    const chunk = snapshot.docs.slice(i, i + batchSize);

    chunk.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    totalDeleted += chunk.length;
  }

  console.log(`Cleared ${totalDeleted} existing bank transactions.`);
}

/**
 * Count existing bank transactions
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<number>}
 */
async function countExistingBankTransactions(db) {
  const registrationsRef = db.collection(COLLECTIONS.REGISTRATIONS);
  const snapshot = await registrationsRef.where('paymentMethod', '==', PAYMENT_METHOD).get();
  return snapshot.size;
}

/**
 * Parse command line arguments
 *
 * @returns {Object} Parsed arguments
 */
function parseArgs() {
  const args = {
    clear: false,
    force: false,
    count: 30,
    static: false,
  };

  process.argv.forEach((arg) => {
    if (arg === '--clear') {
      args.clear = true;
    } else if (arg === '--force') {
      args.force = true;
    } else if (arg === '--static') {
      args.static = true;
    } else if (arg.startsWith('--count=')) {
      args.count = parseInt(arg.split('=')[1], 10) || 30;
    }
  });

  return args;
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(50));
  console.log('IDMC Bank Transactions Seed Script');
  console.log('='.repeat(50));

  const args = parseArgs();
  const isEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;
  const isCI = !!process.env.CI || !!process.env.GITHUB_ACTIONS;

  console.log(`\nMode: ${isEmulator ? 'EMULATOR' : 'PRODUCTION'}`);
  console.log(`Environment: ${isCI ? 'CI/CD' : 'Local'}`);
  console.log(`Options: count=${args.count}, clear=${args.clear}, static=${args.static}`);

  if (isEmulator) {
    console.log(`Emulator host: ${process.env.FIRESTORE_EMULATOR_HOST}`);
  } else if (!isCI) {
    console.log('\n⚠️  WARNING: Running against PRODUCTION database!');
    console.log('Press Ctrl+C within 5 seconds to cancel...\n');
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  try {
    const app = initializeFirebase();
    const db = getFirestore(app, DATABASE_ID);
    console.log(`Database: ${DATABASE_ID}`);

    // Check for existing data
    const existingCount = await countExistingBankTransactions(db);

    if (existingCount > 0 && !args.clear && !args.force) {
      console.log(`\n📋 Found ${existingCount} existing bank transactions in database.`);
      console.log('Skipping seed to preserve existing data.');
      console.log('Use --clear to replace or --force to add anyway.');
      console.log('\n✅ No changes made.');
      console.log('='.repeat(50));
      process.exit(0);
    }

    // Clear existing if requested
    if (args.clear) {
      await clearBankTransactions(db);
    }

    // Seed bank transactions
    await seedBankTransactions(db, args.count, args.static);

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
