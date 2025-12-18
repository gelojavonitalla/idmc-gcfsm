/**
 * InvoiceDetailModal Component
 * Modal for viewing invoice request details and managing invoice upload/delivery.
 *
 * @module components/admin/InvoiceDetailModal
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../lib/firebase';
import { INVOICE_STATUS, INVOICE_STATUS_LABELS, STORAGE_PATHS } from '../../constants';
import { updateInvoiceUpload, generateAndReserveInvoiceNumber } from '../../services';
import { uploadInvoiceFile } from '../../services/storage';
import { isValidInvoiceFile, formatInvoiceFileName, getFileExtension } from '../../utils';
import { useAdminAuth, useToast } from '../../context';
import styles from './InvoiceDetailModal.module.css';

/**
 * Formats a date for display
 *
 * @param {Object|string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  if (!date) {
    return '—';
  }

  const d = date?.toDate?.() || (date instanceof Date ? date : new Date(date));
  if (Number.isNaN(d.getTime())) {
    return '—';
  }

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formats currency for display
 *
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
  if (typeof amount !== 'number') {
    return '—';
  }
  return `₱${amount.toLocaleString()}`;
}

/**
 * Gets status badge class
 *
 * @param {string} status - Invoice status
 * @returns {string} CSS class name
 */
function getStatusBadgeClass(status) {
  switch (status) {
    case INVOICE_STATUS.PENDING:
      return styles.statusPending;
    case INVOICE_STATUS.UPLOADED:
      return styles.statusUploaded;
    case INVOICE_STATUS.SENT:
      return styles.statusSent;
    case INVOICE_STATUS.FAILED:
      return styles.statusFailed;
    default:
      return styles.statusPending;
  }
}

/**
 * Invoice Detail Modal Component
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Close handler
 * @param {Object} props.registration - Registration object with invoice request
 * @param {Function} props.onInvoiceUpdated - Callback after invoice update
 * @returns {JSX.Element|null} The modal component
 */
function InvoiceDetailModal({ isOpen, onClose, registration, onInvoiceUpdated }) {
  const { admin } = useAdminAuth();
  const { showToast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSendConfirmation, setShowSendConfirmation] = useState(false);

  if (!isOpen || !registration) {
    return null;
  }

  const invoice = registration.invoice || {};
  const invoiceStatus = invoice.status || INVOICE_STATUS.PENDING;
  const hasInvoiceUploaded = Boolean(invoice.invoiceUrl);

  /**
   * Handles file selection
   */
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setSelectedFile(null);
      setUploadError(null);
      return;
    }

    if (!isValidInvoiceFile(file)) {
      setUploadError('Invalid file type. Please upload a PDF, JPEG, or PNG file.');
      setSelectedFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds 10MB limit.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
  };

  /**
   * Handles invoice upload
   */
  const handleUploadInvoice = async () => {
    if (!selectedFile) {
      setUploadError('Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      // Generate invoice number if not already exists
      let invoiceNumber = invoice.invoiceNumber;
      if (!invoiceNumber) {
        invoiceNumber = await generateAndReserveInvoiceNumber(registration.id);
      }

      // Upload file to storage
      const extension = getFileExtension(selectedFile.name);
      const fileName = formatInvoiceFileName(registration.registrationId, invoiceNumber, extension);
      const storagePath = `${STORAGE_PATHS.INVOICES}/${fileName}`;

      const invoiceUrl = await uploadInvoiceFile(selectedFile, storagePath, (progress) => {
        setUploadProgress(progress);
      });

      // Update Firestore with invoice details
      await updateInvoiceUpload(
        registration.id,
        {
          invoiceUrl,
          invoiceNumber,
        },
        admin.email
      );

      // Notify parent component
      if (onInvoiceUpdated) {
        onInvoiceUpdated();
      }

      // Reset form
      setSelectedFile(null);
      setUploadProgress(0);

      // Show success toast
      showToast(`Invoice uploaded successfully! Invoice Number: ${invoiceNumber}`, 'success');
      onClose();
    } catch (error) {
      console.error('Failed to upload invoice:', error);
      setUploadError(error.message || 'Failed to upload invoice. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Shows confirmation prompt for sending invoice
   */
  const handleSendInvoice = () => {
    if (!hasInvoiceUploaded) {
      setUploadError('Please upload an invoice first.');
      return;
    }
    setShowSendConfirmation(true);
  };

  /**
   * Cancels the send confirmation
   */
  const handleCancelSend = () => {
    setShowSendConfirmation(false);
  };

  /**
   * Confirms and sends invoice email
   */
  const handleConfirmSendInvoice = async () => {
    setShowSendConfirmation(false);
    setIsSending(true);
    setUploadError(null);

    try {
      // Call Cloud Function to send invoice email
      const sendInvoiceEmail = httpsCallable(functions, 'sendInvoiceEmail');
      const result = await sendInvoiceEmail({ registrationId: registration.id });

      if (onInvoiceUpdated) {
        onInvoiceUpdated();
      }

      showToast(`Success! ${result.data.message}`, 'success');
      onClose();
    } catch (error) {
      console.error('Failed to send invoice:', error);

      let errorMessage = 'Failed to send invoice. Please try again.';

      // Extract error message from Cloud Function error
      if (error.code === 'functions/unauthenticated') {
        errorMessage = 'You must be logged in to send invoices.';
      } else if (error.code === 'functions/permission-denied') {
        errorMessage = 'You do not have permission to send invoices.';
      } else if (error.code === 'functions/not-found') {
        errorMessage = 'Registration not found.';
      } else if (error.code === 'functions/failed-precondition') {
        errorMessage = error.message || 'Invoice cannot be sent at this time.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setUploadError(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="invoice-modal-title"
      >
        <div className={styles.header}>
          <h2 id="invoice-modal-title">Invoice Request Details</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            ×
          </button>
        </div>

        <div className={styles.content}>
          {/* Registration Information */}
          <section className={styles.section}>
            <h3>Registration Information</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.label}>Registration ID:</span>
                <span className={styles.value}>{registration.registrationId}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Short Code:</span>
                <span className={styles.value}>{registration.shortCode}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Attendee:</span>
                <span className={styles.value}>
                  {registration.primaryAttendee.firstName} {registration.primaryAttendee.lastName}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Email:</span>
                <span className={styles.value}>{registration.primaryAttendee.email}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Amount Paid:</span>
                <span className={styles.value}>{formatCurrency(registration.payment?.amountPaid)}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Payment Verified:</span>
                <span className={styles.value}>{formatDate(registration.payment?.verifiedAt)}</span>
              </div>
            </div>
          </section>

          {/* Invoice Details */}
          <section className={styles.section}>
            <h3>Invoice Details</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.label}>Invoice To:</span>
                <span className={styles.value}>{invoice.name || 'N/A'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>TIN:</span>
                <span className={styles.value}>{invoice.tin || 'N/A'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Address:</span>
                <span className={styles.value}>{invoice.address || 'N/A'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Invoice Number:</span>
                <span className={styles.value}>{invoice.invoiceNumber || 'Not generated yet'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Status:</span>
                <span className={`${styles.statusBadge} ${getStatusBadgeClass(invoiceStatus)}`}>
                  {INVOICE_STATUS_LABELS[invoiceStatus]}
                </span>
              </div>
              {invoice.sentAt && (
                <div className={styles.infoItem}>
                  <span className={styles.label}>Sent At:</span>
                  <span className={styles.value}>{formatDate(invoice.sentAt)}</span>
                </div>
              )}
            </div>
          </section>

          {/* Invoice Upload/Management */}
          <section className={styles.section}>
            <h3>Invoice Management</h3>

            {hasInvoiceUploaded ? (
              <div className={styles.uploadedInvoice}>
                <p className={styles.successMessage}>
                  ✓ Invoice uploaded: {invoice.invoiceNumber}
                </p>
                <a
                  href={invoice.invoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.viewInvoiceLink}
                >
                  View Invoice
                </a>

                {invoiceStatus !== INVOICE_STATUS.SENT && !showSendConfirmation && (
                  <button
                    type="button"
                    onClick={handleSendInvoice}
                    disabled={isSending}
                    className={styles.sendButton}
                  >
                    {isSending ? 'Sending...' : 'Send Invoice via Email'}
                  </button>
                )}

                {showSendConfirmation && (
                  <div className={styles.confirmationPrompt}>
                    <p className={styles.confirmationMessage}>
                      Send invoice to {registration.primaryAttendee.email}?
                    </p>
                    <div className={styles.confirmationActions}>
                      <button
                        type="button"
                        onClick={handleCancelSend}
                        className={styles.cancelButton}
                        disabled={isSending}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmSendInvoice}
                        className={styles.confirmButton}
                        disabled={isSending}
                      >
                        {isSending ? 'Sending...' : 'OK'}
                      </button>
                    </div>
                  </div>
                )}

                {invoiceStatus === INVOICE_STATUS.SENT && (
                  <p className={styles.sentMessage}>
                    ✓ Invoice sent to {registration.primaryAttendee.email} on {formatDate(invoice.sentAt)}
                  </p>
                )}
              </div>
            ) : (
              <div className={styles.uploadSection}>
                <p className={styles.uploadInstructions}>
                  Upload the invoice file (PDF, JPEG, or PNG). Max size: 10MB.
                </p>

                <input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                  className={styles.fileInput}
                  id="invoice-file-input"
                />

                {selectedFile && (
                  <p className={styles.selectedFile}>
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${uploadProgress}%` }}
                    />
                    <span className={styles.progressText}>{uploadProgress}%</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleUploadInvoice}
                  disabled={!selectedFile || isUploading}
                  className={styles.uploadButton}
                >
                  {isUploading ? `Uploading... ${uploadProgress}%` : 'Upload Invoice'}
                </button>
              </div>
            )}

            {uploadError && (
              <p className={styles.errorMessage}>{uploadError}</p>
            )}
          </section>
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            onClick={onClose}
            className={styles.closeButtonFooter}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

InvoiceDetailModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  registration: PropTypes.shape({
    id: PropTypes.string.isRequired,
    registrationId: PropTypes.string.isRequired,
    shortCode: PropTypes.string,
    primaryAttendee: PropTypes.shape({
      firstName: PropTypes.string.isRequired,
      lastName: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
    }).isRequired,
    payment: PropTypes.shape({
      amountPaid: PropTypes.number,
      verifiedAt: PropTypes.object,
    }),
    invoice: PropTypes.shape({
      name: PropTypes.string,
      tin: PropTypes.string,
      address: PropTypes.string,
      invoiceNumber: PropTypes.string,
      invoiceUrl: PropTypes.string,
      status: PropTypes.string,
      sentAt: PropTypes.object,
    }),
  }),
  onInvoiceUpdated: PropTypes.func,
};

InvoiceDetailModal.defaultProps = {
  registration: null,
  onInvoiceUpdated: null,
};

export default InvoiceDetailModal;
