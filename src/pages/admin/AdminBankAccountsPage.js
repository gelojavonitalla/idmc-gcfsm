/**
 * AdminBankAccountsPage Component
 * Bank accounts management page for admins to manage payment account information.
 *
 * @module pages/admin/AdminBankAccountsPage
 */

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../../components/admin';
import {
  getAllBankAccounts,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  toggleBankAccountStatus,
} from '../../services/bankAccounts';
import { useAdminAuth } from '../../context';
import { BANK_NAMES, BANK_LABELS, BANK_ACCOUNT_TYPES, BANK_ACCOUNT_TYPE_LABELS } from '../../constants';
import styles from './AdminBankAccountsPage.module.css';

/**
 * AdminBankAccountsPage Component
 *
 * @returns {JSX.Element} The admin bank accounts page
 */
function AdminBankAccountsPage() {
  const { admin } = useAdminAuth();
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    bankName: '',
    accountName: '',
    accountNumber: '',
    accountType: BANK_ACCOUNT_TYPES.SAVINGS,
    branch: '',
    notes: '',
    displayOrder: 0,
    isActive: true,
  });

  /**
   * Fetches all bank accounts
   */
  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getAllBankAccounts();
      setAccounts(data);
    } catch (fetchError) {
      console.error('Failed to fetch bank accounts:', fetchError);
      setError('Failed to load bank accounts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch accounts on mount
   */
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  /**
   * Opens modal for creating a new account
   */
  const handleCreateNew = () => {
    setEditingAccount(null);
    setFormData({
      bankName: '',
      accountName: '',
      accountNumber: '',
      accountType: BANK_ACCOUNT_TYPES.SAVINGS,
      branch: '',
      notes: '',
      displayOrder: 0,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  /**
   * Opens modal for editing an account
   *
   * @param {Object} account - Account to edit
   */
  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      bankName: account.bankName || '',
      accountName: account.accountName || '',
      accountNumber: account.accountNumber || '',
      accountType: account.accountType || BANK_ACCOUNT_TYPES.SAVINGS,
      branch: account.branch || '',
      notes: account.notes || '',
      displayOrder: account.displayOrder || 0,
      isActive: account.isActive !== undefined ? account.isActive : true,
    });
    setIsModalOpen(true);
  };

  /**
   * Handles form submission
   *
   * @param {Event} e - Form event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      if (editingAccount) {
        await updateBankAccount(editingAccount.id, formData, admin?.id, admin?.email);
      } else {
        await createBankAccount(formData, admin?.id, admin?.email);
      }
      await fetchAccounts();
      setIsModalOpen(false);
    } catch (submitError) {
      console.error('Failed to save bank account:', submitError);
      setError('Failed to save bank account. Please try again.');
    }
  };

  /**
   * Handles deleting an account
   *
   * @param {string} accountId - Account ID to delete
   */
  const handleDelete = async (accountId) => {
    if (!window.confirm('Are you sure you want to delete this bank account?')) {
      return;
    }

    try {
      await deleteBankAccount(accountId);
      await fetchAccounts();
    } catch (deleteError) {
      console.error('Failed to delete bank account:', deleteError);
      setError('Failed to delete bank account. Please try again.');
    }
  };

  /**
   * Handles toggling account active status
   *
   * @param {string} accountId - Account ID
   * @param {boolean} isActive - New active status
   */
  const handleToggleStatus = async (accountId, isActive) => {
    try {
      await toggleBankAccountStatus(accountId, isActive, admin?.id, admin?.email);
      await fetchAccounts();
    } catch (toggleError) {
      console.error('Failed to toggle account status:', toggleError);
      setError('Failed to toggle account status. Please try again.');
    }
  };

  return (
    <AdminLayout title="Bank Accounts">
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Bank Accounts</h2>
          <p className={styles.subtitle}>
            Manage bank accounts for online payment transfers
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.refreshButton}
            onClick={fetchAccounts}
            disabled={isLoading}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
          <button className={styles.createButton} onClick={handleCreateNew}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Bank Account
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className={styles.errorBanner} role="alert">
          {error}
          <button onClick={() => setError(null)} aria-label="Dismiss error">
            &times;
          </button>
        </div>
      )}

      {/* Accounts Table */}
      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.loading}>Loading bank accounts...</div>
        ) : accounts.length === 0 ? (
          <div className={styles.emptyState}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21h18" />
              <path d="M3 10h18" />
              <path d="M5 6l7-3 7 3" />
              <path d="M4 10v11" />
              <path d="M20 10v11" />
              <path d="M8 14v3" />
              <path d="M12 14v3" />
              <path d="M16 14v3" />
            </svg>
            <h3>No Bank Accounts</h3>
            <p>Add a bank account to get started.</p>
            <button className={styles.createButton} onClick={handleCreateNew}>
              Add Bank Account
            </button>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Bank</th>
                  <th>Account Name</th>
                  <th>Account Number</th>
                  <th>Type</th>
                  <th>Branch</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id}>
                    <td>{BANK_LABELS[account.bankName] || account.bankName}</td>
                    <td>{account.accountName}</td>
                    <td className={styles.accountNumber}>{account.accountNumber}</td>
                    <td>{BANK_ACCOUNT_TYPE_LABELS[account.accountType] || account.accountType}</td>
                    <td>{account.branch || '-'}</td>
                    <td>
                      <button
                        className={`${styles.statusBadge} ${account.isActive ? styles.statusActive : styles.statusInactive}`}
                        onClick={() => handleToggleStatus(account.id, !account.isActive)}
                      >
                        {account.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.editButton}
                          onClick={() => handleEdit(account)}
                          title="Edit"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          className={styles.deleteButton}
                          onClick={() => handleDelete(account.id)}
                          title="Delete"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editingAccount ? 'Edit Bank Account' : 'Add Bank Account'}</h3>
              <button
                className={styles.modalClose}
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="bankName">Bank Name *</label>
                <select
                  id="bankName"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  required
                >
                  <option value="">Select a bank</option>
                  {Object.entries(BANK_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="accountName">Account Name *</label>
                <input
                  type="text"
                  id="accountName"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  required
                  placeholder="e.g., GCF South Metro"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="accountNumber">Account Number *</label>
                <input
                  type="text"
                  id="accountNumber"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  required
                  placeholder="e.g., 0012-3456-7890"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="accountType">Account Type *</label>
                <select
                  id="accountType"
                  value={formData.accountType}
                  onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                  required
                >
                  {Object.entries(BANK_ACCOUNT_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="branch">Branch</label>
                <input
                  type="text"
                  id="branch"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  placeholder="e.g., Las Piñas Branch"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="notes">Internal Notes</label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Internal notes (not visible to users)"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="displayOrder">Display Order</label>
                <input
                  type="number"
                  id="displayOrder"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value, 10) })}
                  min="0"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  Active (visible to users during registration)
                </label>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveButton}>
                  {editingAccount ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminBankAccountsPage;
