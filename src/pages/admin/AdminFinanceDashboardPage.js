/**
 * AdminFinanceDashboardPage Component
 * Finance dashboard for viewing and exporting transactions grouped by bank account.
 *
 * @module pages/admin/AdminFinanceDashboardPage
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AdminLayout } from '../../components/admin';
import {
  getAllBankAccounts,
  getRegistrationsByBankAccount,
  subscribeToConferenceStats,
} from '../../services';
import { useAdminAuth } from '../../context';
import { logActivity, ACTIVITY_TYPES, ENTITY_TYPES } from '../../services/activityLog';
import {
  REGISTRATION_STATUS,
  BANK_LABELS,
} from '../../constants';
import { formatPrice, exportRegistrationsToCsv } from '../../utils';
import styles from './AdminFinanceDashboardPage.module.css';

/**
 * AdminFinanceDashboardPage Component
 *
 * @returns {JSX.Element} The finance dashboard page
 */
function AdminFinanceDashboardPage() {
  const { admin } = useAdminAuth();
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState('all');
  const [registrations, setRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);

  // Stats from stats collection (maintained by Cloud Functions)
  const [conferenceStats, setConferenceStats] = useState(null);

  /**
   * Fetches all bank accounts
   */
  const fetchBankAccounts = useCallback(async () => {
    try {
      const accounts = await getAllBankAccounts(true); // Get only active accounts
      setBankAccounts(accounts);
    } catch (err) {
      console.error('Failed to fetch bank accounts:', err);
      setError('Failed to load bank accounts');
    }
  }, []);

  /**
   * Fetches registrations for the selected bank account
   */
  const fetchRegistrations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (selectedBankAccountId === 'all') {
        // For "all", we need to fetch all registrations with bank transfers
        const allRegs = [];
        for (const account of bankAccounts) {
          const regs = await getRegistrationsByBankAccount(account.id);
          allRegs.push(...regs);
        }
        setRegistrations(allRegs);
      } else {
        const regs = await getRegistrationsByBankAccount(selectedBankAccountId);
        setRegistrations(regs);
      }
    } catch (err) {
      console.error('Failed to fetch registrations:', err);
      setError('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  }, [selectedBankAccountId, bankAccounts]);

  /**
   * Initialize - fetch bank accounts
   */
  useEffect(() => {
    fetchBankAccounts();
  }, [fetchBankAccounts]);

  /**
   * Fetch registrations when bank account selection changes
   */
  useEffect(() => {
    if (bankAccounts.length > 0) {
      fetchRegistrations();
    }
  }, [selectedBankAccountId, bankAccounts, fetchRegistrations]);

  /**
   * Subscribe to conference stats for real-time finance data
   */
  useEffect(() => {
    const unsubscribe = subscribeToConferenceStats((stats) => {
      setConferenceStats(stats);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Calculate statistics for the selected bank account
   */
  const statistics = useMemo(() => {
    const stats = {
      totalTransactions: registrations.length,
      confirmedTransactions: 0,
      pendingVerification: 0,
      totalPayments: 0,
      confirmedPayments: 0,
      pendingPayments: 0,
    };

    registrations.forEach((reg) => {
      const amount = reg.payment?.amountPaid || 0;

      if (reg.status === REGISTRATION_STATUS.CONFIRMED) {
        stats.confirmedTransactions += 1;
        stats.confirmedPayments += amount;
      } else if (reg.status === REGISTRATION_STATUS.PENDING_VERIFICATION) {
        stats.pendingVerification += 1;
        stats.pendingPayments += amount;
      }

      stats.totalPayments += amount;
    });

    return stats;
  }, [registrations]);

  /**
   * Group registrations by bank account
   */
  const groupedByBank = useMemo(() => {
    const groups = {};

    registrations.forEach((reg) => {
      const bankAccountId = reg.payment?.bankAccountId;
      if (!bankAccountId) return;

      if (!groups[bankAccountId]) {
        const account = bankAccounts.find((acc) => acc.id === bankAccountId);
        groups[bankAccountId] = {
          account,
          registrations: [],
          totalAmount: 0,
          confirmedAmount: 0,
          pendingAmount: 0,
        };
      }

      groups[bankAccountId].registrations.push(reg);
      const amount = reg.payment?.amountPaid || 0;
      groups[bankAccountId].totalAmount += amount;

      if (reg.status === REGISTRATION_STATUS.CONFIRMED) {
        groups[bankAccountId].confirmedAmount += amount;
      } else if (reg.status === REGISTRATION_STATUS.PENDING_VERIFICATION) {
        groups[bankAccountId].pendingAmount += amount;
      }
    });

    return groups;
  }, [registrations, bankAccounts]);

  /**
   * Handles exporting transactions for selected bank
   */
  const handleExport = async () => {
    setIsExporting(true);
    setError(null);

    try {
      if (registrations.length === 0) {
        setError('No transactions to export.');
        return;
      }

      const selectedAccount = bankAccounts.find((acc) => acc.id === selectedBankAccountId);
      const bankName = selectedAccount
        ? BANK_LABELS[selectedAccount.bankName] || selectedAccount.bankName
        : 'all-banks';

      const prefix = `finance-${bankName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')}`;
      const result = exportRegistrationsToCsv(registrations, prefix);

      // Log the export activity
      if (admin?.id && admin?.email) {
        await logActivity({
          type: ACTIVITY_TYPES.EXPORT,
          entityType: ENTITY_TYPES.REGISTRATION,
          entityId: `finance-export-${Date.now()}`,
          description: `Exported ${result.count} transaction(s) for ${bankName}`,
          adminId: admin.id,
          adminEmail: admin.email,
        });
      }
    } catch (exportError) {
      console.error('Failed to export transactions:', exportError);
      setError('Failed to export transactions. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Handles exporting transactions for a specific bank account
   *
   * @param {string} bankAccountId - Bank account ID to export
   */
  const handleExportBank = async (bankAccountId) => {
    setIsExporting(true);
    setError(null);

    try {
      const group = groupedByBank[bankAccountId];
      if (!group || group.registrations.length === 0) {
        setError('No transactions to export for this bank.');
        return;
      }

      const bankName = group.account
        ? BANK_LABELS[group.account.bankName] || group.account.bankName
        : 'unknown';

      const prefix = `finance-${bankName.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')}`;
      const result = exportRegistrationsToCsv(group.registrations, prefix);

      // Log the export activity
      if (admin?.id && admin?.email) {
        await logActivity({
          type: ACTIVITY_TYPES.EXPORT,
          entityType: ENTITY_TYPES.REGISTRATION,
          entityId: `finance-export-${Date.now()}`,
          description: `Exported ${result.count} transaction(s) for ${bankName}`,
          adminId: admin.id,
          adminEmail: admin.email,
        });
      }
    } catch (exportError) {
      console.error('Failed to export transactions:', exportError);
      setError('Failed to export transactions. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AdminLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1>Finance Dashboard</h1>
          <p className={styles.subtitle}>View and export transactions grouped by bank account</p>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        {/* Bank Account Filter */}
        <div className={styles.filterSection}>
          <label htmlFor="bankAccountFilter" className={styles.filterLabel}>
            Filter by Bank Account:
          </label>
          <select
            id="bankAccountFilter"
            className={styles.filterSelect}
            value={selectedBankAccountId}
            onChange={(e) => setSelectedBankAccountId(e.target.value)}
          >
            <option value="all">All Bank Accounts</option>
            {bankAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {BANK_LABELS[account.bankName]} - {account.accountNumber}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={styles.exportButton}
            onClick={handleExport}
            disabled={isExporting || isLoading || registrations.length === 0}
          >
            {isExporting ? 'Exporting...' : 'Export Current View'}
          </button>
        </div>

        {/* Statistics Cards - Use stats collection when viewing all, local calc when filtered */}
        {!isLoading && (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Total Transactions</div>
              <div className={styles.statValue}>{statistics.totalTransactions}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Confirmed</div>
              <div className={styles.statValue}>{statistics.confirmedTransactions}</div>
              <div className={styles.statSubvalue}>
                {formatPrice(
                  selectedBankAccountId === 'all' && conferenceStats
                    ? conferenceStats.totalConfirmedPayments || 0
                    : statistics.confirmedPayments
                )}
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Pending Verification</div>
              <div className={styles.statValue}>{statistics.pendingVerification}</div>
              <div className={styles.statSubvalue}>
                {formatPrice(
                  selectedBankAccountId === 'all' && conferenceStats
                    ? conferenceStats.totalPendingPayments || 0
                    : statistics.pendingPayments
                )}
              </div>
            </div>
            <div className={`${styles.statCard} ${styles.statCardHighlight}`}>
              <div className={styles.statLabel}>Total Payments</div>
              <div className={styles.statValue}>
                {formatPrice(
                  selectedBankAccountId === 'all' && conferenceStats
                    ? (conferenceStats.totalConfirmedPayments || 0) + (conferenceStats.totalPendingPayments || 0)
                    : statistics.totalPayments
                )}
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className={styles.loading}>
            <p>Loading transactions...</p>
          </div>
        )}

        {/* Grouped by Bank Account */}
        {!isLoading && selectedBankAccountId === 'all' && (
          <div className={styles.groupedSection}>
            <h2>Transactions by Bank Account</h2>
            {Object.keys(groupedByBank).length === 0 ? (
              <p className={styles.emptyMessage}>No transactions found.</p>
            ) : (
              <div className={styles.bankGroups}>
                {Object.entries(groupedByBank).map(([bankAccountId, group]) => (
                  <div key={bankAccountId} className={styles.bankGroup}>
                    <div className={styles.bankGroupHeader}>
                      <div className={styles.bankInfo}>
                        {group.account && (
                          <img
                            src={`/images/banks/${group.account.bankName}.svg`}
                            alt={BANK_LABELS[group.account.bankName]}
                            className={styles.bankLogo}
                          />
                        )}
                        <div>
                          <h3>{group.account ? BANK_LABELS[group.account.bankName] : 'Unknown Bank'}</h3>
                          <p className={styles.accountNumber}>
                            {group.account?.accountNumber} - {group.account?.accountName}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className={styles.exportButtonSmall}
                        onClick={() => handleExportBank(bankAccountId)}
                        disabled={isExporting}
                      >
                        Export
                      </button>
                    </div>
                    <div className={styles.bankGroupStats}>
                      <div className={styles.bankGroupStat}>
                        <span className={styles.bankGroupStatLabel}>Transactions:</span>
                        <span className={styles.bankGroupStatValue}>
                          {conferenceStats?.bankAccountStats?.[bankAccountId]?.count ?? group.registrations.length}
                        </span>
                      </div>
                      <div className={styles.bankGroupStat}>
                        <span className={styles.bankGroupStatLabel}>Confirmed:</span>
                        <span className={styles.bankGroupStatValue}>
                          {formatPrice(conferenceStats?.bankAccountStats?.[bankAccountId]?.confirmed ?? group.confirmedAmount)}
                        </span>
                      </div>
                      <div className={styles.bankGroupStat}>
                        <span className={styles.bankGroupStatLabel}>Pending:</span>
                        <span className={styles.bankGroupStatValue}>
                          {formatPrice(conferenceStats?.bankAccountStats?.[bankAccountId]?.pending ?? group.pendingAmount)}
                        </span>
                      </div>
                      <div className={styles.bankGroupStat}>
                        <span className={styles.bankGroupStatLabel}>Total:</span>
                        <span className={`${styles.bankGroupStatValue} ${styles.bankGroupStatValueHighlight}`}>
                          {formatPrice(
                            conferenceStats?.bankAccountStats?.[bankAccountId]
                              ? (conferenceStats.bankAccountStats[bankAccountId].confirmed || 0) +
                                (conferenceStats.bankAccountStats[bankAccountId].pending || 0)
                              : group.totalAmount
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Transaction List for Selected Bank */}
        {!isLoading && selectedBankAccountId !== 'all' && (
          <div className={styles.transactionsSection}>
            <h2>Recent Transactions</h2>
            {registrations.length === 0 ? (
              <p className={styles.emptyMessage}>No transactions found for this bank account.</p>
            ) : (
              <div className={styles.transactionsTable}>
                <table>
                  <thead>
                    <tr>
                      <th>Registration ID</th>
                      <th>Name</th>
                      <th>Church</th>
                      <th>Amount</th>
                      <th>Payment Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((reg) => (
                      <tr key={reg.id}>
                        <td>{reg.shortCode || reg.registrationId}</td>
                        <td>
                          {reg.primaryAttendee?.firstName} {reg.primaryAttendee?.lastName}
                        </td>
                        <td>{reg.church?.name}</td>
                        <td>{formatPrice(reg.payment?.amountPaid || 0)}</td>
                        <td>
                          {reg.payment?.paymentDate
                            ? new Date(reg.payment.paymentDate).toLocaleDateString()
                            : 'N/A'}
                        </td>
                        <td>
                          <span
                            className={`${styles.statusBadge} ${styles[`status${reg.status}`]}`}
                          >
                            {reg.status?.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminFinanceDashboardPage;
