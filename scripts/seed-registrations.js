/**
 * Seed Registrations Script
 * Populates Firestore with mock registration data for testing.
 *
 * Usage:
 *   node scripts/seed-registrations.js
 *   node scripts/seed-registrations.js --clear    (clears existing before seeding)
 *   node scripts/seed-registrations.js --count=50 (seed 50 registrations)
 *
 * Prerequisites:
 *   - Firebase CLI installed and logged in
 *   - GOOGLE_APPLICATION_CREDENTIALS env var set to service account key path
 *
 * For local emulator:
 *   export FIRESTORE_EMULATOR_HOST="localhost:8080"
 *   node scripts/seed-registrations.js
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
  PENDING_PAYMENT: 'pending_payment',
  PENDING_VERIFICATION: 'pending_verification',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
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

// Payment methods
const PAYMENT_METHODS = {
  GCASH: 'gcash',
  BANK_TRANSFER: 'bank_transfer',
  CASH: 'cash',
};

// Sample data for generation
const FIRST_NAMES = [
  'Juan', 'Maria', 'Jose', 'Ana', 'Pedro', 'Rosa', 'Carlos', 'Elena',
  'Miguel', 'Sofia', 'Antonio', 'Isabella', 'Francisco', 'Gabriela',
  'Roberto', 'Carmen', 'Daniel', 'Lucia', 'Manuel', 'Patricia',
  'Ricardo', 'Teresa', 'Fernando', 'Angela', 'Luis', 'Beatriz',
  'Eduardo', 'Claudia', 'Andres', 'Diana', 'Rafael', 'Monica',
];

const LAST_NAMES = [
  'Santos', 'Reyes', 'Cruz', 'Garcia', 'Mendoza', 'Torres', 'Flores',
  'Rivera', 'Gonzales', 'Ramos', 'Bautista', 'Villanueva', 'De Leon',
  'Aquino', 'Castro', 'Morales', 'Lopez', 'Hernandez', 'Martinez',
  'Perez', 'Rodriguez', 'Sanchez', 'Ramirez', 'Dela Cruz', 'Pascual',
  'Soriano', 'Aguilar', 'Espino', 'Navarro', 'Valdez', 'Ocampo',
];

const EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
  'icloud.com', 'mail.com', 'proton.me',
];

const CHURCHES = [
  'Jesus Is Lord Church - Alabang',
  'Jesus Is Lord Church - Makati',
  'Jesus Is Lord Church - Quezon City',
  'Jesus Is Lord Church - Pasig',
  'Jesus Is Lord Church - Mandaluyong',
  'Jesus Is Lord Church - Taguig',
  'Jesus Is Lord Church - Paranaque',
  'Jesus Is Lord Church - Las Pinas',
  'Jesus Is Lord Church - Muntinlupa',
  'Jesus Is Lord Church - Cavite',
  'Jesus Is Lord Church - Laguna',
  'Jesus Is Lord Church - Batangas',
  'Jesus Is Lord Church - Cebu',
  'Jesus Is Lord Church - Davao',
  'Jesus Is Lord Church - Iloilo',
];

const MINISTRY_ROLES = [
  'Member',
  'Small Group Leader',
  'Worship Team',
  'Usher',
  'Children\'s Ministry',
  'Youth Ministry',
  'Media Ministry',
  'Hospitality',
  'Prayer Warrior',
  'Outreach Team',
];

const PHONE_PREFIXES = ['0917', '0918', '0919', '0920', '0921', '0927', '0928', '0929', '0939', '0949'];

/**
 * Safe characters for registration short code generation.
 * Excludes confusing characters: 0/O, 1/l/I, 5/S, 2/Z, 8/B
 */
const SAFE_SHORT_CODE_CHARS = 'ACDEFGHJKMNPQRTUVWXY34679';

/**
 * Length of the registration short code (6 chars = ~244M combinations)
 */
const SHORT_CODE_LENGTH = 6;

/**
 * Length of the short code suffix for quick lookups (last 4 chars)
 */
const SHORT_CODE_SUFFIX_LENGTH = 4;

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

function generatePaymentReference(method) {
  const timestamp = Date.now().toString().slice(-8);
  const random = randomInt(1000, 9999);
  switch (method) {
    case PAYMENT_METHODS.GCASH:
      return `GC${timestamp}${random}`;
    case PAYMENT_METHODS.BANK_TRANSFER:
      return `BT${timestamp}${random}`;
    case PAYMENT_METHODS.CASH:
      return `CASH${timestamp}`;
    default:
      return `REF${timestamp}${random}`;
  }
}

function randomDate(daysAgo) {
  const now = new Date();
  const pastDate = new Date(now.getTime() - randomInt(0, daysAgo) * 24 * 60 * 60 * 1000);
  pastDate.setHours(randomInt(6, 22), randomInt(0, 59), randomInt(0, 59));
  return pastDate;
}

/**
 * Generates a unique 6-character short code using safe characters
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
 * Generates a single mock registration with all fields
 *
 * @param {number} index - Registration index
 * @returns {Object} Registration object
 */
function generateRegistration(index) {
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
    REGISTRATION_STATUS.PENDING_PAYMENT,
    REGISTRATION_STATUS.CANCELLED,
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

  const paymentMethods = [
    PAYMENT_METHODS.GCASH,
    PAYMENT_METHODS.GCASH,
    PAYMENT_METHODS.BANK_TRANSFER,
    PAYMENT_METHODS.CASH,
  ];

  const status = randomPick(statuses);
  const category = randomPick(categories);
  const workshopSelection = randomPick(workshops);
  const paymentMethod = randomPick(paymentMethods);

  const isConfirmed = status === REGISTRATION_STATUS.CONFIRMED;
  const isPendingVerification = status === REGISTRATION_STATUS.PENDING_VERIFICATION;
  const hasPaid = isConfirmed || isPendingVerification;

  const regularPrices = [2000, 2500, 3000];
  const studentPrices = [1500, 1800, 2000];
  const prices = category === REGISTRATION_CATEGORIES.STUDENT_SENIOR ? studentPrices : regularPrices;
  const totalAmount = hasPaid ? randomPick(prices) : 0;

  const createdAt = randomDate(30);
  const updatedAt = new Date(createdAt.getTime() + randomInt(1, 48) * 60 * 60 * 1000);

  // Generate proper 6-character alphanumeric code
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
      church,
      ministryRole,
    },
    category,
    workshopSelection,
    status,
    totalAmount,
    paymentMethod: hasPaid ? paymentMethod : null,
    paymentReference: hasPaid ? generatePaymentReference(paymentMethod) : null,
    paymentProofUrl: hasPaid && paymentMethod !== PAYMENT_METHODS.CASH
      ? `https://storage.example.com/proofs/proof-${index}.jpg`
      : null,
    checkedIn: isConfirmed ? Math.random() > 0.6 : false,
    checkedInAt: null,
    checkedInBy: null,
    notes: Math.random() > 0.8 ? 'Special dietary requirements' : null,
    createdBy: 'seed-script',
  };

  // Set check-in details if checked in
  if (registration.checkedIn) {
    registration.checkedInAt = new Date(createdAt.getTime() + randomInt(24, 72) * 60 * 60 * 1000);
    registration.checkedInBy = 'admin@idmc.org';
  }

  // Add additional attendees randomly (group registrations)
  if (Math.random() > 0.85) {
    const additionalCount = randomInt(1, 3);
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
    if (hasPaid) {
      registration.totalAmount = totalAmount * (1 + registration.additionalAttendees.length);
    }
  }

  // Store dates as timestamps for Firestore
  registration._createdAt = createdAt;
  registration._updatedAt = updatedAt;

  return registration;
}

/**
 * Pre-built static registrations for predictable testing
 */
const STATIC_REGISTRATIONS = [
  {
    registrationId: 'REG-2026-A3K7MN',
    shortCode: 'A3K7MN',
    shortCodeSuffix: 'K7MN',
    conferenceId: CONFERENCE_ID,
    primaryAttendee: {
      firstName: 'Juan',
      lastName: 'Santos',
      email: 'juan.santos@gmail.com',
      phone: '09171234567',
      church: 'Jesus Is Lord Church - Makati',
      ministryRole: 'Small Group Leader',
    },
    category: REGISTRATION_CATEGORIES.REGULAR,
    workshopSelection: WORKSHOP_CATEGORIES.MEN,
    status: REGISTRATION_STATUS.CONFIRMED,
    totalAmount: 2500,
    paymentMethod: PAYMENT_METHODS.GCASH,
    paymentReference: 'GC202512151234',
    paymentProofUrl: 'https://storage.example.com/proofs/proof-001.jpg',
    checkedIn: true,
    checkedInAt: new Date('2025-01-15T08:30:00'),
    checkedInBy: 'admin@idmc.org',
    notes: null,
    createdBy: 'seed-script',
    _createdAt: new Date('2025-01-10T14:30:00'),
    _updatedAt: new Date('2025-01-10T16:45:00'),
  },
  {
    registrationId: 'REG-2026-C9HTPQ',
    shortCode: 'C9HTPQ',
    shortCodeSuffix: 'HTPQ',
    conferenceId: CONFERENCE_ID,
    primaryAttendee: {
      firstName: 'Maria',
      lastName: 'Reyes',
      email: 'maria.reyes@yahoo.com',
      phone: '09189876543',
      church: 'Jesus Is Lord Church - Quezon City',
      ministryRole: 'Worship Team',
    },
    category: REGISTRATION_CATEGORIES.REGULAR,
    workshopSelection: WORKSHOP_CATEGORIES.WOMEN,
    status: REGISTRATION_STATUS.CONFIRMED,
    totalAmount: 2500,
    paymentMethod: PAYMENT_METHODS.BANK_TRANSFER,
    paymentReference: 'BT202512145678',
    paymentProofUrl: 'https://storage.example.com/proofs/proof-002.jpg',
    checkedIn: true,
    checkedInAt: new Date('2025-01-15T08:45:00'),
    checkedInBy: 'admin@idmc.org',
    notes: null,
    createdBy: 'seed-script',
    _createdAt: new Date('2025-01-09T10:15:00'),
    _updatedAt: new Date('2025-01-09T14:30:00'),
  },
  {
    registrationId: 'REG-2026-D4FJNR',
    shortCode: 'D4FJNR',
    shortCodeSuffix: 'FJNR',
    conferenceId: CONFERENCE_ID,
    primaryAttendee: {
      firstName: 'Pedro',
      lastName: 'Cruz',
      email: 'pedro.cruz@outlook.com',
      phone: '09201112233',
      church: 'Jesus Is Lord Church - Pasig',
      ministryRole: 'Usher',
    },
    category: REGISTRATION_CATEGORIES.REGULAR,
    workshopSelection: WORKSHOP_CATEGORIES.MEN,
    status: REGISTRATION_STATUS.PENDING_VERIFICATION,
    totalAmount: 2500,
    paymentMethod: PAYMENT_METHODS.GCASH,
    paymentReference: 'GC202512139012',
    paymentProofUrl: 'https://storage.example.com/proofs/proof-003.jpg',
    checkedIn: false,
    checkedInAt: null,
    checkedInBy: null,
    notes: null,
    createdBy: 'seed-script',
    _createdAt: new Date('2025-01-12T09:00:00'),
    _updatedAt: new Date('2025-01-12T09:30:00'),
  },
  {
    registrationId: 'REG-2026-E7GKUV',
    shortCode: 'E7GKUV',
    shortCodeSuffix: 'GKUV',
    conferenceId: CONFERENCE_ID,
    primaryAttendee: {
      firstName: 'Ana',
      lastName: 'Garcia',
      email: 'ana.garcia@gmail.com',
      phone: '09273334455',
      church: 'Jesus Is Lord Church - Alabang',
      ministryRole: 'Children\'s Ministry',
    },
    category: REGISTRATION_CATEGORIES.STUDENT_SENIOR,
    workshopSelection: WORKSHOP_CATEGORIES.WOMEN,
    status: REGISTRATION_STATUS.CONFIRMED,
    totalAmount: 1500,
    paymentMethod: PAYMENT_METHODS.CASH,
    paymentReference: 'CASH20251214',
    paymentProofUrl: null,
    checkedIn: false,
    checkedInAt: null,
    checkedInBy: null,
    notes: 'Senior citizen - 65 years old',
    createdBy: 'seed-script',
    _createdAt: new Date('2025-01-11T16:20:00'),
    _updatedAt: new Date('2025-01-11T16:20:00'),
  },
  {
    registrationId: 'REG-2026-F3CMWY',
    shortCode: 'F3CMWY',
    shortCodeSuffix: 'CMWY',
    conferenceId: CONFERENCE_ID,
    primaryAttendee: {
      firstName: 'Carlos',
      lastName: 'Mendoza',
      email: 'carlos.mendoza@hotmail.com',
      phone: '09285556677',
      church: 'Jesus Is Lord Church - Taguig',
      ministryRole: 'Youth Ministry',
    },
    category: REGISTRATION_CATEGORIES.REGULAR,
    workshopSelection: WORKSHOP_CATEGORIES.NEXT_GENERATION,
    status: REGISTRATION_STATUS.PENDING_PAYMENT,
    totalAmount: 0,
    paymentMethod: null,
    paymentReference: null,
    paymentProofUrl: null,
    checkedIn: false,
    checkedInAt: null,
    checkedInBy: null,
    notes: null,
    createdBy: 'seed-script',
    _createdAt: new Date('2025-01-13T11:00:00'),
    _updatedAt: new Date('2025-01-13T11:00:00'),
  },
  {
    registrationId: 'REG-2026-G6DNXA',
    shortCode: 'G6DNXA',
    shortCodeSuffix: 'DNXA',
    conferenceId: CONFERENCE_ID,
    primaryAttendee: {
      firstName: 'Elena',
      lastName: 'Torres',
      email: 'elena.torres@gmail.com',
      phone: '09397778899',
      church: 'Jesus Is Lord Church - Mandaluyong',
      ministryRole: 'Prayer Warrior',
    },
    category: REGISTRATION_CATEGORIES.REGULAR,
    workshopSelection: WORKSHOP_CATEGORIES.WOMEN,
    status: REGISTRATION_STATUS.CANCELLED,
    totalAmount: 0,
    paymentMethod: null,
    paymentReference: null,
    paymentProofUrl: null,
    checkedIn: false,
    checkedInAt: null,
    checkedInBy: null,
    notes: 'Cancelled due to schedule conflict',
    createdBy: 'seed-script',
    _createdAt: new Date('2025-01-08T13:45:00'),
    _updatedAt: new Date('2025-01-10T09:00:00'),
  },
  {
    registrationId: 'REG-2026-H9EPYC',
    shortCode: 'H9EPYC',
    shortCodeSuffix: 'EPYC',
    conferenceId: CONFERENCE_ID,
    primaryAttendee: {
      firstName: 'Roberto',
      lastName: 'Flores',
      email: 'roberto.flores@yahoo.com',
      phone: '09498889900',
      church: 'Jesus Is Lord Church - Cavite',
      ministryRole: 'Media Ministry',
    },
    category: REGISTRATION_CATEGORIES.REGULAR,
    workshopSelection: WORKSHOP_CATEGORIES.MEN,
    status: REGISTRATION_STATUS.REFUNDED,
    totalAmount: 0,
    paymentMethod: PAYMENT_METHODS.GCASH,
    paymentReference: 'GC202512083456',
    paymentProofUrl: 'https://storage.example.com/proofs/proof-007.jpg',
    checkedIn: false,
    checkedInAt: null,
    checkedInBy: null,
    notes: 'Refunded - medical emergency',
    createdBy: 'seed-script',
    _createdAt: new Date('2025-01-07T10:30:00'),
    _updatedAt: new Date('2025-01-09T15:00:00'),
  },
  {
    registrationId: 'REG-2026-J4FQRD',
    shortCode: 'J4FQRD',
    shortCodeSuffix: 'FQRD',
    conferenceId: CONFERENCE_ID,
    primaryAttendee: {
      firstName: 'Sofia',
      lastName: 'Rivera',
      email: 'sofia.rivera@outlook.com',
      phone: '09170001122',
      church: 'Jesus Is Lord Church - Laguna',
      ministryRole: 'Hospitality',
    },
    category: REGISTRATION_CATEGORIES.REGULAR,
    workshopSelection: WORKSHOP_CATEGORIES.COUPLES,
    status: REGISTRATION_STATUS.CONFIRMED,
    totalAmount: 5000,
    paymentMethod: PAYMENT_METHODS.BANK_TRANSFER,
    paymentReference: 'BT202512117890',
    paymentProofUrl: 'https://storage.example.com/proofs/proof-008.jpg',
    checkedIn: true,
    checkedInAt: new Date('2025-01-15T09:15:00'),
    checkedInBy: 'admin@idmc.org',
    notes: null,
    createdBy: 'seed-script',
    additionalAttendees: [
      {
        firstName: 'Miguel',
        lastName: 'Rivera',
        email: 'miguel.rivera@outlook.com',
        category: REGISTRATION_CATEGORIES.REGULAR,
      },
    ],
    _createdAt: new Date('2025-01-06T14:00:00'),
    _updatedAt: new Date('2025-01-06T18:30:00'),
  },
  {
    registrationId: 'REG-2026-K7GTUE',
    shortCode: 'K7GTUE',
    shortCodeSuffix: 'GTUE',
    conferenceId: CONFERENCE_ID,
    primaryAttendee: {
      firstName: 'Isabella',
      lastName: 'Ramos',
      email: 'isabella.ramos@gmail.com',
      phone: '09182223344',
      church: 'Jesus Is Lord Church - Cebu',
      ministryRole: 'Member',
    },
    category: REGISTRATION_CATEGORIES.STUDENT_SENIOR,
    workshopSelection: WORKSHOP_CATEGORIES.NEXT_GENERATION,
    status: REGISTRATION_STATUS.CONFIRMED,
    totalAmount: 1500,
    paymentMethod: PAYMENT_METHODS.GCASH,
    paymentReference: 'GC202512106789',
    paymentProofUrl: 'https://storage.example.com/proofs/proof-009.jpg',
    checkedIn: false,
    checkedInAt: null,
    checkedInBy: null,
    notes: 'Student - University of Cebu',
    createdBy: 'seed-script',
    _createdAt: new Date('2025-01-10T08:00:00'),
    _updatedAt: new Date('2025-01-10T10:15:00'),
  },
  {
    registrationId: 'REG-2026-M3HUVF',
    shortCode: 'M3HUVF',
    shortCodeSuffix: 'HUVF',
    conferenceId: CONFERENCE_ID,
    primaryAttendee: {
      firstName: 'Antonio',
      lastName: 'Bautista',
      email: 'antonio.bautista@hotmail.com',
      phone: '09294445566',
      church: 'Jesus Is Lord Church - Davao',
      ministryRole: 'Outreach Team',
    },
    category: REGISTRATION_CATEGORIES.REGULAR,
    workshopSelection: WORKSHOP_CATEGORIES.SENIOR_CITIZENS,
    status: REGISTRATION_STATUS.CONFIRMED,
    totalAmount: 7500,
    paymentMethod: PAYMENT_METHODS.BANK_TRANSFER,
    paymentReference: 'BT202512052345',
    paymentProofUrl: 'https://storage.example.com/proofs/proof-010.jpg',
    checkedIn: true,
    checkedInAt: new Date('2025-01-15T07:45:00'),
    checkedInBy: 'volunteer@idmc.org',
    notes: 'Group registration - family',
    createdBy: 'seed-script',
    additionalAttendees: [
      {
        firstName: 'Carmen',
        lastName: 'Bautista',
        email: 'carmen.bautista@hotmail.com',
        category: REGISTRATION_CATEGORIES.REGULAR,
      },
      {
        firstName: 'Gabriel',
        lastName: 'Bautista',
        email: 'gabriel.bautista@gmail.com',
        category: REGISTRATION_CATEGORIES.STUDENT_SENIOR,
      },
    ],
    _createdAt: new Date('2025-01-05T09:30:00'),
    _updatedAt: new Date('2025-01-05T14:00:00'),
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
 * Seed registrations to Firestore
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {number} count - Number of registrations to seed
 * @param {boolean} useStatic - Use static registrations only
 * @returns {Promise<void>}
 */
async function seedRegistrations(db, count, useStatic = false) {
  const registrationsRef = db.collection(COLLECTIONS.REGISTRATIONS);

  let registrations;
  if (useStatic) {
    registrations = STATIC_REGISTRATIONS;
    console.log(`\nSeeding ${registrations.length} static registrations...`);
  } else {
    // Combine static + generated registrations
    const generatedCount = Math.max(0, count - STATIC_REGISTRATIONS.length);
    registrations = [...STATIC_REGISTRATIONS];

    for (let i = 0; i < generatedCount; i++) {
      registrations.push(generateRegistration(STATIC_REGISTRATIONS.length + i + 1));
    }
    console.log(`\nSeeding ${registrations.length} registrations (${STATIC_REGISTRATIONS.length} static + ${generatedCount} generated)...`);
  }

  // Batch write (Firestore limits to 500 per batch)
  const batchSize = 500;
  let totalSeeded = 0;

  for (let i = 0; i < registrations.length; i += batchSize) {
    const batch = db.batch();
    const chunk = registrations.slice(i, i + batchSize);

    for (const reg of chunk) {
      const docRef = registrationsRef.doc(reg.registrationId);

      // Convert dates to Firestore Timestamps
      const createdAt = reg._createdAt
        ? admin.firestore.Timestamp.fromDate(reg._createdAt)
        : admin.firestore.Timestamp.now();
      const updatedAt = reg._updatedAt
        ? admin.firestore.Timestamp.fromDate(reg._updatedAt)
        : admin.firestore.Timestamp.now();

      // Remove internal fields and add timestamps
      const { _createdAt, _updatedAt, ...regData } = reg;

      batch.set(docRef, {
        ...regData,
        createdAt,
        updatedAt,
        checkedInAt: regData.checkedInAt
          ? admin.firestore.Timestamp.fromDate(regData.checkedInAt)
          : null,
      });

      totalSeeded++;
    }

    await batch.commit();
    console.log(`  - Seeded batch ${Math.floor(i / batchSize) + 1} (${chunk.length} registrations)`);
  }

  console.log(`\nSuccessfully seeded ${totalSeeded} registrations!`);

  // Print summary
  const statusCounts = {};
  registrations.forEach((reg) => {
    statusCounts[reg.status] = (statusCounts[reg.status] || 0) + 1;
  });

  console.log('\nRegistration Summary:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  - ${status}: ${count}`);
  });
}

/**
 * Clear existing registrations
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<void>}
 */
async function clearRegistrations(db) {
  const registrationsRef = db.collection(COLLECTIONS.REGISTRATIONS);
  const snapshot = await registrationsRef.get();

  if (snapshot.empty) {
    console.log('No existing registrations to clear.');
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

  console.log(`Cleared ${totalDeleted} existing registrations.`);
}

/**
 * Count existing registrations
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<number>}
 */
async function countExistingRegistrations(db) {
  const registrationsRef = db.collection(COLLECTIONS.REGISTRATIONS);
  const snapshot = await registrationsRef.get();
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
    count: 50,
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
      args.count = parseInt(arg.split('=')[1], 10) || 50;
    }
  });

  return args;
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(50));
  console.log('IDMC Registrations Seed Script');
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
    const existingCount = await countExistingRegistrations(db);

    if (existingCount > 0 && !args.clear && !args.force) {
      console.log(`\n📋 Found ${existingCount} existing registrations in database.`);
      console.log('Skipping seed to preserve existing data.');
      console.log('Use --clear to replace or --force to add anyway.');
      console.log('\n✅ No changes made.');
      console.log('='.repeat(50));
      process.exit(0);
    }

    // Clear existing if requested
    if (args.clear) {
      await clearRegistrations(db);
    }

    // Seed registrations
    await seedRegistrations(db, args.count, args.static);

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
