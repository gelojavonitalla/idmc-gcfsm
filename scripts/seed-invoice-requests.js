/**
 * Seed Invoice Requests Script
 * Populates Firestore with mock registrations that have invoice requests for testing.
 *
 * Usage:
 *   node scripts/seed-invoice-requests.js
 *   node scripts/seed-invoice-requests.js --clear    (clears existing before seeding)
 *   node scripts/seed-invoice-requests.js --count=20 (seed 20 invoice requests)
 *
 * Prerequisites:
 *   - Firebase CLI installed and logged in
 *   - GOOGLE_APPLICATION_CREDENTIALS env var set to service account key path
 *
 * For local emulator:
 *   export FIRESTORE_EMULATOR_HOST="localhost:8080"
 *   node scripts/seed-invoice-requests.js
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

// Payment methods
const PAYMENT_METHODS = {
  GCASH: 'gcash',
  BANK_TRANSFER: 'bank_transfer',
};

// Invoice status values
const INVOICE_STATUS = {
  PENDING: 'pending',
  UPLOADED: 'uploaded',
  SENT: 'sent',
};

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
];

const LAST_NAMES = [
  'Santos', 'Reyes', 'Cruz', 'Garcia', 'Mendoza', 'Torres', 'Flores',
  'Rivera', 'Gonzales', 'Ramos', 'Bautista', 'Villanueva', 'De Leon',
];

const EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
];

const CHURCHES = [
  { name: 'Jesus Is Lord Church', city: 'Makati City', province: 'Metro Manila / NCR' },
  { name: 'Jesus Is Lord Church', city: 'Quezon City', province: 'Metro Manila / NCR' },
  { name: 'GCF South Metro', city: 'Las Piñas City', province: 'Metro Manila / NCR' },
  { name: 'GCF Makati', city: 'Makati City', province: 'Metro Manila / NCR' },
];

const MINISTRY_ROLES = [
  'Pastor',
  'Elder',
  'Ministry Leader',
  'Small Group Leader',
  'Member',
];

const PHONE_PREFIXES = ['0917', '0918', '0919', '0920', '0927', '0928', '0929'];

// Sample company names for invoices
const COMPANY_NAMES = [
  'ABC Corporation',
  'XYZ Enterprises Inc.',
  'Global Trading Company',
  'Tech Solutions Philippines',
  'Metro Business Services',
  'Pacific Holdings Inc.',
  'Summit Consulting Group',
  'Alliance Business Partners',
];

// Sample addresses for invoices
const ADDRESSES = [
  '123 Ayala Avenue, Makati City, Metro Manila',
  '456 EDSA, Quezon City, Metro Manila',
  '789 Ortigas Center, Pasig City, Metro Manila',
  '321 BGC, Taguig City, Metro Manila',
  '654 Alabang Town Center, Muntinlupa City, Metro Manila',
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

function generatePaymentReference(method) {
  const timestamp = Date.now().toString().slice(-8);
  const random = randomInt(1000, 9999);
  switch (method) {
    case PAYMENT_METHODS.GCASH:
      return `GC${timestamp}${random}`;
    case PAYMENT_METHODS.BANK_TRANSFER:
      return `BT${timestamp}${random}`;
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
 * Generates a TIN (Tax Identification Number)
 *
 * @returns {string} TIN in format XXX-XXX-XXX-XXX
 */
function generateTIN() {
  const part1 = String(randomInt(100, 999));
  const part2 = String(randomInt(100, 999));
  const part3 = String(randomInt(100, 999));
  const part4 = String(randomInt(100, 999));
  return `${part1}-${part2}-${part3}-${part4}`;
}

/**
 * Generates invoice number
 *
 * @param {number} index - Invoice index
 * @returns {string} Invoice number (e.g., "INV-2025-0001")
 */
function generateInvoiceNumber(index) {
  const year = new Date().getFullYear();
  const number = String(index).padStart(4, '0');
  return `INV-${year}-${number}`;
}

/**
 * Generates a single mock registration with invoice request
 *
 * @param {number} index - Registration index
 * @returns {Object} Registration object with invoice request
 */
function generateInvoiceRequest(index) {
  const firstName = randomPick(FIRST_NAMES);
  const lastName = randomPick(LAST_NAMES);
  const email = generateEmail(firstName, lastName);
  const phone = generatePhoneNumber();
  const church = randomPick(CHURCHES);
  const ministryRole = randomPick(MINISTRY_ROLES);

  const category = randomPick([
    REGISTRATION_CATEGORIES.REGULAR,
    REGISTRATION_CATEGORIES.REGULAR,
    REGISTRATION_CATEGORIES.STUDENT_SENIOR,
  ]);

  const workshopSelection = randomPick([
    WORKSHOP_CATEGORIES.NEXT_GENERATION,
    WORKSHOP_CATEGORIES.WOMEN,
    WORKSHOP_CATEGORIES.MEN,
    WORKSHOP_CATEGORIES.COUPLES,
    WORKSHOP_CATEGORIES.SENIOR_CITIZENS,
  ]);

  const paymentMethod = randomPick([
    PAYMENT_METHODS.GCASH,
    PAYMENT_METHODS.BANK_TRANSFER,
  ]);

  const regularPrices = [500];
  const studentPrices = [300];
  const prices = category === REGISTRATION_CATEGORIES.STUDENT_SENIOR ? studentPrices : regularPrices;
  const totalAmount = randomPick(prices);

  const createdAt = randomDate(30);
  const verifiedAt = new Date(createdAt.getTime() + randomInt(1, 24) * 60 * 60 * 1000);
  const updatedAt = new Date(verifiedAt.getTime() + randomInt(1, 12) * 60 * 60 * 1000);

  const shortCode = generateShortCode();
  const shortCodeSuffix = shortCode.slice(-SHORT_CODE_SUFFIX_LENGTH);

  // Determine invoice status (60% pending, 30% uploaded, 10% sent)
  const statusRand = Math.random();
  let invoiceStatus;
  let invoiceNumber = null;
  let invoiceUrl = null;
  let generatedAt = null;
  let sentAt = null;
  let sentBy = null;

  if (statusRand < 0.6) {
    invoiceStatus = INVOICE_STATUS.PENDING;
  } else if (statusRand < 0.9) {
    invoiceStatus = INVOICE_STATUS.UPLOADED;
    invoiceNumber = generateInvoiceNumber(index);
    invoiceUrl = `https://storage.example.com/invoices/invoice-${index}.pdf`;
    generatedAt = new Date(updatedAt.getTime() + randomInt(1, 6) * 60 * 60 * 1000);
  } else {
    invoiceStatus = INVOICE_STATUS.SENT;
    invoiceNumber = generateInvoiceNumber(index);
    invoiceUrl = `https://storage.example.com/invoices/invoice-${index}.pdf`;
    generatedAt = new Date(updatedAt.getTime() + randomInt(1, 6) * 60 * 60 * 1000);
    sentAt = new Date(generatedAt.getTime() + randomInt(1, 2) * 60 * 60 * 1000);
    sentBy = 'admin@idmc.org';
  }

  // Use either company name or personal name for invoice
  const useCompanyName = Math.random() > 0.5;
  const invoiceName = useCompanyName
    ? randomPick(COMPANY_NAMES)
    : `${firstName} ${lastName}`;

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
    status: REGISTRATION_STATUS.CONFIRMED,
    totalAmount,
    paymentMethod,
    paymentReference: generatePaymentReference(paymentMethod),
    paymentProofUrl: `https://storage.example.com/proofs/proof-${index}.jpg`,
    checkedIn: false,
    checkedInAt: null,
    checkedInBy: null,
    notes: null,
    createdBy: 'seed-script',
    // Invoice request data
    invoice: {
      requested: true,
      name: invoiceName,
      tin: generateTIN(),
      address: randomPick(ADDRESSES),
      status: invoiceStatus,
      invoiceNumber,
      invoiceUrl,
      generatedAt,
      sentAt,
      sentBy,
      uploadedBy: invoiceStatus !== INVOICE_STATUS.PENDING ? 'admin@idmc.org' : null,
      emailDeliveryStatus: invoiceStatus === INVOICE_STATUS.SENT ? 'sent' : null,
    },
  };

  // Store dates as timestamps for Firestore
  registration._createdAt = createdAt;
  registration._updatedAt = updatedAt;
  registration._verifiedAt = verifiedAt;
  registration._generatedAt = generatedAt;
  registration._sentAt = sentAt;

  return registration;
}

/**
 * Pre-built static invoice requests for predictable testing
 */
const STATIC_INVOICE_REQUESTS = [
  {
    registrationId: 'REG-2026-INV001',
    shortCode: 'INV001',
    shortCodeSuffix: 'V001',
    conferenceId: CONFERENCE_ID,
    primaryAttendee: {
      firstName: 'Maria',
      lastName: 'Santos',
      email: 'maria.santos@gmail.com',
      phone: '09171234567',
      ministryRole: 'Pastor',
    },
    church: {
      name: 'GCF South Metro',
      city: 'Las Piñas City',
      province: 'Metro Manila / NCR',
    },
    category: REGISTRATION_CATEGORIES.REGULAR,
    workshopSelection: WORKSHOP_CATEGORIES.WOMEN,
    status: REGISTRATION_STATUS.CONFIRMED,
    totalAmount: 500,
    paymentMethod: PAYMENT_METHODS.BANK_TRANSFER,
    paymentReference: 'BT202512151234',
    paymentProofUrl: 'https://storage.example.com/proofs/proof-inv-001.jpg',
    checkedIn: false,
    checkedInAt: null,
    checkedInBy: null,
    notes: null,
    createdBy: 'seed-script',
    invoice: {
      requested: true,
      name: 'ABC Corporation',
      tin: '123-456-789-000',
      address: '123 Ayala Avenue, Makati City, Metro Manila',
      status: INVOICE_STATUS.PENDING,
      invoiceNumber: null,
      invoiceUrl: null,
      generatedAt: null,
      sentAt: null,
      sentBy: null,
      uploadedBy: null,
      emailDeliveryStatus: null,
    },
    _createdAt: new Date('2025-01-10T14:30:00'),
    _updatedAt: new Date('2025-01-11T16:45:00'),
    _verifiedAt: new Date('2025-01-11T10:00:00'),
    _generatedAt: null,
    _sentAt: null,
  },
  {
    registrationId: 'REG-2026-INV002',
    shortCode: 'INV002',
    shortCodeSuffix: 'V002',
    conferenceId: CONFERENCE_ID,
    primaryAttendee: {
      firstName: 'Roberto',
      lastName: 'Cruz',
      email: 'roberto.cruz@outlook.com',
      phone: '09189876543',
      ministryRole: 'Elder',
    },
    church: {
      name: 'Jesus Is Lord Church',
      city: 'Makati City',
      province: 'Metro Manila / NCR',
    },
    category: REGISTRATION_CATEGORIES.REGULAR,
    workshopSelection: WORKSHOP_CATEGORIES.MEN,
    status: REGISTRATION_STATUS.CONFIRMED,
    totalAmount: 500,
    paymentMethod: PAYMENT_METHODS.GCASH,
    paymentReference: 'GC202512145678',
    paymentProofUrl: 'https://storage.example.com/proofs/proof-inv-002.jpg',
    checkedIn: false,
    checkedInAt: null,
    checkedInBy: null,
    notes: null,
    createdBy: 'seed-script',
    invoice: {
      requested: true,
      name: 'XYZ Enterprises Inc.',
      tin: '987-654-321-000',
      address: '456 EDSA, Quezon City, Metro Manila',
      status: INVOICE_STATUS.UPLOADED,
      invoiceNumber: 'INV-2025-0001',
      invoiceUrl: 'https://storage.example.com/invoices/invoice-002.pdf',
      generatedAt: new Date('2025-01-12T10:00:00'),
      sentAt: null,
      sentBy: null,
      uploadedBy: 'admin@idmc.org',
      emailDeliveryStatus: null,
    },
    _createdAt: new Date('2025-01-09T10:15:00'),
    _updatedAt: new Date('2025-01-12T10:00:00'),
    _verifiedAt: new Date('2025-01-10T14:30:00'),
    _generatedAt: new Date('2025-01-12T10:00:00'),
    _sentAt: null,
  },
  {
    registrationId: 'REG-2026-INV003',
    shortCode: 'INV003',
    shortCodeSuffix: 'V003',
    conferenceId: CONFERENCE_ID,
    primaryAttendee: {
      firstName: 'Elena',
      lastName: 'Garcia',
      email: 'elena.garcia@yahoo.com',
      phone: '09201112233',
      ministryRole: 'Ministry Leader',
    },
    church: {
      name: 'GCF Makati',
      city: 'Makati City',
      province: 'Metro Manila / NCR',
    },
    category: REGISTRATION_CATEGORIES.REGULAR,
    workshopSelection: WORKSHOP_CATEGORIES.COUPLES,
    status: REGISTRATION_STATUS.CONFIRMED,
    totalAmount: 500,
    paymentMethod: PAYMENT_METHODS.BANK_TRANSFER,
    paymentReference: 'BT202512139012',
    paymentProofUrl: 'https://storage.example.com/proofs/proof-inv-003.jpg',
    checkedIn: false,
    checkedInAt: null,
    checkedInBy: null,
    notes: null,
    createdBy: 'seed-script',
    invoice: {
      requested: true,
      name: 'Tech Solutions Philippines',
      tin: '456-789-123-000',
      address: '789 Ortigas Center, Pasig City, Metro Manila',
      status: INVOICE_STATUS.SENT,
      invoiceNumber: 'INV-2025-0002',
      invoiceUrl: 'https://storage.example.com/invoices/invoice-003.pdf',
      generatedAt: new Date('2025-01-13T09:00:00'),
      sentAt: new Date('2025-01-13T11:00:00'),
      sentBy: 'admin@idmc.org',
      uploadedBy: 'admin@idmc.org',
      emailDeliveryStatus: 'sent',
    },
    _createdAt: new Date('2025-01-08T09:00:00'),
    _updatedAt: new Date('2025-01-13T11:00:00'),
    _verifiedAt: new Date('2025-01-09T10:30:00'),
    _generatedAt: new Date('2025-01-13T09:00:00'),
    _sentAt: new Date('2025-01-13T11:00:00'),
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
 * Seed invoice requests to Firestore
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {number} count - Number of invoice requests to seed
 * @param {boolean} useStatic - Use static invoice requests only
 * @returns {Promise<void>}
 */
async function seedInvoiceRequests(db, count, useStatic = false) {
  const registrationsRef = db.collection(COLLECTIONS.REGISTRATIONS);

  let invoiceRequests;
  if (useStatic) {
    invoiceRequests = STATIC_INVOICE_REQUESTS;
    console.log(`\nSeeding ${invoiceRequests.length} static invoice requests...`);
  } else {
    // Combine static + generated invoice requests
    const generatedCount = Math.max(0, count - STATIC_INVOICE_REQUESTS.length);
    invoiceRequests = [...STATIC_INVOICE_REQUESTS];

    for (let i = 0; i < generatedCount; i++) {
      invoiceRequests.push(generateInvoiceRequest(STATIC_INVOICE_REQUESTS.length + i + 1));
    }
    console.log(`\nSeeding ${invoiceRequests.length} invoice requests (${STATIC_INVOICE_REQUESTS.length} static + ${generatedCount} generated)...`);
  }

  // Batch write (Firestore limits to 500 per batch)
  const batchSize = 500;
  let totalSeeded = 0;

  for (let i = 0; i < invoiceRequests.length; i += batchSize) {
    const batch = db.batch();
    const chunk = invoiceRequests.slice(i, i + batchSize);

    for (const req of chunk) {
      const docRef = registrationsRef.doc(req.registrationId);

      // Convert dates to Firestore Timestamps
      const createdAt = req._createdAt
        ? admin.firestore.Timestamp.fromDate(req._createdAt)
        : admin.firestore.Timestamp.now();
      const updatedAt = req._updatedAt
        ? admin.firestore.Timestamp.fromDate(req._updatedAt)
        : admin.firestore.Timestamp.now();
      const verifiedAt = req._verifiedAt
        ? admin.firestore.Timestamp.fromDate(req._verifiedAt)
        : null;
      const generatedAt = req._generatedAt
        ? admin.firestore.Timestamp.fromDate(req._generatedAt)
        : null;
      const sentAt = req._sentAt
        ? admin.firestore.Timestamp.fromDate(req._sentAt)
        : null;

      // Remove internal fields and add timestamps
      const { _createdAt, _updatedAt, _verifiedAt, _generatedAt, _sentAt, ...regData } = req;

      // Update invoice timestamps
      const invoiceData = {
        ...regData.invoice,
        generatedAt,
        sentAt,
      };

      batch.set(docRef, {
        ...regData,
        invoice: invoiceData,
        payment: {
          verifiedAt,
        },
        createdAt,
        updatedAt,
      });

      totalSeeded++;
    }

    await batch.commit();
    console.log(`  - Seeded batch ${Math.floor(i / batchSize) + 1} (${chunk.length} invoice requests)`);
  }

  console.log(`\nSuccessfully seeded ${totalSeeded} invoice requests!`);

  // Print summary
  const statusCounts = {};
  invoiceRequests.forEach((req) => {
    statusCounts[req.invoice.status] = (statusCounts[req.invoice.status] || 0) + 1;
  });

  console.log('\nInvoice Request Summary:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  - ${status}: ${count}`);
  });
}

/**
 * Clear existing invoice requests (registrations with invoice.requested = true)
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<void>}
 */
async function clearInvoiceRequests(db) {
  const registrationsRef = db.collection(COLLECTIONS.REGISTRATIONS);
  const snapshot = await registrationsRef.where('invoice.requested', '==', true).get();

  if (snapshot.empty) {
    console.log('No existing invoice requests to clear.');
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

  console.log(`Cleared ${totalDeleted} existing invoice requests.`);
}

/**
 * Count existing invoice requests
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @returns {Promise<number>}
 */
async function countExistingInvoiceRequests(db) {
  const registrationsRef = db.collection(COLLECTIONS.REGISTRATIONS);
  const snapshot = await registrationsRef.where('invoice.requested', '==', true).get();
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
    count: 20,
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
      args.count = parseInt(arg.split('=')[1], 10) || 20;
    }
  });

  return args;
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(50));
  console.log('IDMC Invoice Requests Seed Script');
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
    const existingCount = await countExistingInvoiceRequests(db);

    if (existingCount > 0 && !args.clear && !args.force) {
      console.log(`\n📋 Found ${existingCount} existing invoice requests in database.`);
      console.log('Skipping seed to preserve existing data.');
      console.log('Use --clear to replace or --force to add anyway.');
      console.log('\n✅ No changes made.');
      console.log('='.repeat(50));
      process.exit(0);
    }

    // Clear existing if requested
    if (args.clear) {
      await clearInvoiceRequests(db);
    }

    // Seed invoice requests
    await seedInvoiceRequests(db, args.count, args.static);

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
