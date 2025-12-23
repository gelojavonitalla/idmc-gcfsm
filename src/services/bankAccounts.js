/**
 * Bank Accounts Service
 * Handles CRUD operations for church bank accounts used for online transfers.
 *
 * @module services/bankAccounts
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { COLLECTIONS } from '../constants';

/**
 * Error codes for bank account operations
 */
export const BANK_ACCOUNT_ERROR_CODES = {
  NOT_FOUND: 'BANK_ACCOUNT_NOT_FOUND',
  DUPLICATE_ACCOUNT: 'DUPLICATE_ACCOUNT',
  INVALID_DATA: 'INVALID_DATA',
  DELETE_FAILED: 'DELETE_FAILED',
};

/**
 * Gets all bank accounts
 *
 * @param {boolean} activeOnly - If true, only return active accounts
 * @returns {Promise<Array>} Array of bank account objects
 */
export async function getAllBankAccounts(activeOnly = false) {
  const accountsRef = collection(db, COLLECTIONS.BANK_ACCOUNTS);

  let accountQuery;
  if (activeOnly) {
    accountQuery = query(
      accountsRef,
      where('isActive', '==', true),
      orderBy('displayOrder', 'asc')
    );
  } else {
    accountQuery = query(accountsRef, orderBy('displayOrder', 'asc'));
  }

  const snapshot = await getDocs(accountQuery);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

/**
 * Gets a bank account by ID
 *
 * @param {string} accountId - Bank account ID
 * @returns {Promise<Object|null>} Bank account object or null
 */
export async function getBankAccountById(accountId) {
  if (!accountId) {
    return null;
  }

  const docRef = doc(db, COLLECTIONS.BANK_ACCOUNTS, accountId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

/**
 * Gets active bank accounts for display to users
 *
 * @returns {Promise<Array>} Array of active bank account objects
 */
export async function getActiveBankAccounts() {
  return getAllBankAccounts(true);
}

/**
 * Creates a new bank account
 *
 * @param {Object} accountData - Bank account data
 * @param {string} accountData.bankName - Bank name identifier (e.g., 'bdo', 'bpi')
 * @param {string} accountData.accountName - Account holder name
 * @param {string} accountData.accountNumber - Account number
 * @param {string} accountData.accountType - Account type (savings/checking/ewallet)
 * @param {string} accountData.branch - Branch name (optional)
 * @param {string} accountData.notes - Internal notes (optional)
 * @param {number} accountData.displayOrder - Display order (default: 0)
 * @param {boolean} accountData.isActive - Active status (default: true)
 * @param {string} adminId - Admin user ID performing the action
 * @param {string} adminEmail - Admin email performing the action
 * @returns {Promise<string>} Created account ID
 */
export async function createBankAccount(accountData, adminId, adminEmail) {
  const {
    bankName,
    accountName,
    accountNumber,
    accountType,
    branch = '',
    notes = '',
    displayOrder = 0,
    isActive = true,
  } = accountData;

  // Validation
  if (!bankName || !accountName || !accountNumber || !accountType) {
    throw new Error(BANK_ACCOUNT_ERROR_CODES.INVALID_DATA);
  }

  // Generate a unique ID
  const accountsRef = collection(db, COLLECTIONS.BANK_ACCOUNTS);
  const newDocRef = doc(accountsRef);

  const accountDoc = {
    bankName,
    accountName,
    accountNumber,
    accountType,
    branch,
    notes,
    displayOrder,
    isActive,
    createdAt: serverTimestamp(),
    createdBy: adminEmail,
    updatedAt: serverTimestamp(),
    updatedBy: adminEmail,
  };

  await setDoc(newDocRef, accountDoc);

  return newDocRef.id;
}

/**
 * Updates an existing bank account
 *
 * @param {string} accountId - Bank account ID
 * @param {Object} updates - Fields to update
 * @param {string} adminId - Admin user ID performing the action
 * @param {string} adminEmail - Admin email performing the action
 * @returns {Promise<void>}
 */
export async function updateBankAccount(accountId, updates, adminId, adminEmail) {
  if (!accountId) {
    throw new Error(BANK_ACCOUNT_ERROR_CODES.INVALID_DATA);
  }

  const docRef = doc(db, COLLECTIONS.BANK_ACCOUNTS, accountId);
  const accountDoc = await getDoc(docRef);

  if (!accountDoc.exists()) {
    throw new Error(BANK_ACCOUNT_ERROR_CODES.NOT_FOUND);
  }

  // Remove fields that shouldn't be updated directly
  const { id, createdAt, createdBy, ...allowedUpdates } = updates;

  await updateDoc(docRef, {
    ...allowedUpdates,
    updatedAt: serverTimestamp(),
    updatedBy: adminEmail,
  });
}

/**
 * Deletes a bank account
 *
 * @param {string} accountId - Bank account ID
 * @returns {Promise<void>}
 */
export async function deleteBankAccount(accountId) {
  if (!accountId) {
    throw new Error(BANK_ACCOUNT_ERROR_CODES.INVALID_DATA);
  }

  const docRef = doc(db, COLLECTIONS.BANK_ACCOUNTS, accountId);
  const accountDoc = await getDoc(docRef);

  if (!accountDoc.exists()) {
    throw new Error(BANK_ACCOUNT_ERROR_CODES.NOT_FOUND);
  }

  await deleteDoc(docRef);
}

/**
 * Toggles the active status of a bank account
 *
 * @param {string} accountId - Bank account ID
 * @param {boolean} isActive - New active status
 * @param {string} adminId - Admin user ID performing the action
 * @param {string} adminEmail - Admin email performing the action
 * @returns {Promise<void>}
 */
export async function toggleBankAccountStatus(accountId, isActive, adminId, adminEmail) {
  await updateBankAccount(accountId, { isActive }, adminId, adminEmail);
}

/**
 * Gets registrations for a specific bank account
 *
 * @param {string} accountId - Bank account ID
 * @returns {Promise<Array>} Array of registrations
 */
export async function getRegistrationsByBankAccount(accountId) {
  if (!accountId) {
    return [];
  }

  const registrationsRef = collection(db, COLLECTIONS.REGISTRATIONS);
  const registrationQuery = query(
    registrationsRef,
    where('payment.bankAccountId', '==', accountId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(registrationQuery);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}
