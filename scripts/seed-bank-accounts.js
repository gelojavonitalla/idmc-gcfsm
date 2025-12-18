/**
 * Seed Bank Accounts Script
 * Populates Firestore with initial bank account data for GCF South Metro.
 * These accounts are used for online bank transfer payments during registration.
 *
 * Usage:
 *   node scripts/seed-bank-accounts.js
 *   node scripts/seed-bank-accounts.js --clear  # Clear existing accounts and re-seed
 *   node scripts/seed-bank-accounts.js --force  # Seed even if accounts exist
 *
 * Prerequisites:
 *   - Firebase CLI installed and logged in
 *   - GOOGLE_APPLICATION_CREDENTIALS env var set to service account key path
 *     OR run with: firebase emulators:exec "node scripts/seed-bank-accounts.js"
 *
 * For local emulator:
 *   export FIRESTORE_EMULATOR_HOST="localhost:8080"
 *   node scripts/seed-bank-accounts.js
 */

const admin = require('firebase-admin');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// Collection name constant
const COLLECTIONS = {
  BANK_ACCOUNTS: 'bankAccounts',
};

// Firestore database ID (named database)
const DATABASE_ID = 'idmc-2026';

// Bank names (matching logo files in /public/images/banks/)
const BANK_NAMES = {
  BDO: 'bdo',
  BPI: 'bpi',
  METROBANK: 'metrobank',
  UNIONBANK: 'unionbank',
  CHINABANK: 'chinabank',
  SECURITYBANK: 'securitybank',
  GCASH: 'gcash',
  MAYA: 'maya',
};

// Account types
const BANK_ACCOUNT_TYPES = {
  SAVINGS: 'savings',
  CHECKING: 'checking',
  EWALLET: 'ewallet',
};

/**
 * Bank account seed data for GCF South Metro
 * These are the church's official bank accounts where registrants can send payments
 */
const BANK_ACCOUNT_DATA = [
  {
    accountId: 'gcfsm-securitybank-current-001',
    bankName: BANK_NAMES.SECURITYBANK,
    accountName: 'GCF South Metro, Inc.',
    accountNumber: '0000-0063-65400',
    accountType: BANK_ACCOUNT_TYPES.CHECKING,
    branch: 'Alabang Acacia',
    notes: 'Security Bank current account for IDMC registrations',
    displayOrder: 1,
    isActive: true,
  },
  {
    accountId: 'gcfsm-chinabank-current-001',
    bankName: BANK_NAMES.CHINABANK,
    accountName: 'GCF South Metro, Inc.',
    accountNumber: '128-195-0910',
    accountType: BANK_ACCOUNT_TYPES.CHECKING,
    branch: 'Ayala Alabang',
    notes: 'China Bank current account for IDMC registrations',
    displayOrder: 2,
    isActive: true,
  },
  {
    accountId: 'gcfsm-bdo-current-001',
    bankName: BANK_NAMES.BDO,
    accountName: 'GCF South Metro, Inc.',
    accountNumber: '00650-802-2882',
    accountType: BANK_ACCOUNT_TYPES.CHECKING,
    branch: 'Madison',
    notes: 'BDO current account for IDMC registrations',
    displayOrder: 3,
    isActive: true,
  },
  {
    accountId: 'gcfsm-bpi-current-001',
    bankName: BANK_NAMES.BPI,
    accountName: 'GCF South Metro, Inc.',
    accountNumber: '1591-0091-56',
    accountType: BANK_ACCOUNT_TYPES.CHECKING,
    branch: 'Alabang Town Center',
    notes: 'BPI current account for IDMC registrations',
    displayOrder: 4,
    isActive: true,
  },
  {
    accountId: 'gcfsm-gcash-001',
    bankName: BANK_NAMES.GCASH,
    accountName: 'GCF South Metro',
    accountNumber: '0917 650 0011',
    accountType: BANK_ACCOUNT_TYPES.EWALLET,
    branch: '',
    notes: 'GCash e-wallet for quick online payments',
    displayOrder: 5,
    isActive: false,
  },
  {
    accountId: 'gcfsm-maya-001',
    bankName: BANK_NAMES.MAYA,
    accountName: 'GCF South Metro',
    accountNumber: '0917 650 0011',
    accountType: BANK_ACCOUNT_TYPES.EWALLET,
    branch: '',
    notes: 'Maya (PayMaya) e-wallet for online payments',
    displayOrder: 6,
    isActive: false,
  },
];

/**
 * Initializes Firebase Admin SDK
 */
function initializeFirebase() {
  if (admin.apps.length === 0) {
    try {
      // Try service account initialization
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
        console.log('✓ Firebase initialized with service account');
      } else {
        // Fallback to default credentials
        admin.initializeApp();
        console.log('✓ Firebase initialized with default credentials');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Firebase:', error.message);
      process.exit(1);
    }
  }
}

/**
 * Gets the Firestore database instance
 *
 * @returns {Firestore} Firestore database instance
 */
function getDb() {
  try {
    return getFirestore(DATABASE_ID);
  } catch (error) {
    console.error(`❌ Failed to get database "${DATABASE_ID}":`, error.message);
    console.log('\nℹ️  Make sure the named database exists in your Firebase project.');
    process.exit(1);
  }
}

/**
 * Clears all existing bank accounts
 *
 * @param {Firestore} db - Firestore database instance
 * @returns {Promise<number>} Number of accounts deleted
 */
async function clearBankAccounts(db) {
  const accountsRef = db.collection(COLLECTIONS.BANK_ACCOUNTS);
  const snapshot = await accountsRef.get();

  if (snapshot.empty) {
    return 0;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  return snapshot.size;
}

/**
 * Checks if bank accounts collection has data
 *
 * @param {Firestore} db - Firestore database instance
 * @returns {Promise<boolean>} True if accounts exist
 */
async function hasBankAccounts(db) {
  const accountsRef = db.collection(COLLECTIONS.BANK_ACCOUNTS);
  const snapshot = await accountsRef.limit(1).get();
  return !snapshot.empty;
}

/**
 * Seeds bank account data
 *
 * @param {Firestore} db - Firestore database instance
 * @returns {Promise<number>} Number of accounts created
 */
async function seedBankAccounts(db) {
  const accountsRef = db.collection(COLLECTIONS.BANK_ACCOUNTS);
  let count = 0;

  for (const accountData of BANK_ACCOUNT_DATA) {
    const { accountId, ...data } = accountData;
    const docRef = accountsRef.doc(accountId);

    await docRef.set({
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: 'system',
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: 'system',
    });

    count++;
    console.log(`  ✓ Created: ${data.bankName.toUpperCase()} - ${data.accountName}`);
  }

  return count;
}

/**
 * Main execution function
 */
async function main() {
  const args = process.argv.slice(2);
  const shouldClear = args.includes('--clear');
  const shouldForce = args.includes('--force');

  console.log('🌱 Bank Accounts Seeding Script');
  console.log('================================\n');

  // Initialize Firebase
  initializeFirebase();
  const db = getDb();

  // Check if data exists
  const hasData = await hasBankAccounts(db);

  if (hasData && !shouldClear && !shouldForce) {
    console.log('ℹ️  Bank accounts already exist.');
    console.log('   Use --clear to delete and re-seed');
    console.log('   Use --force to seed anyway (may create duplicates)');
    process.exit(0);
  }

  // Clear existing data if requested
  if (shouldClear) {
    console.log('🗑️  Clearing existing bank accounts...');
    const deletedCount = await clearBankAccounts(db);
    console.log(`   Deleted ${deletedCount} account(s)\n`);
  }

  // Seed data
  console.log('📝 Seeding bank accounts...');
  const createdCount = await seedBankAccounts(db);
  console.log(`\n✅ Successfully created ${createdCount} bank account(s)`);

  console.log('\n🎉 Seeding complete!');
  process.exit(0);
}

// Run the script
main().catch((error) => {
  console.error('\n❌ Seeding failed:', error);
  process.exit(1);
});
