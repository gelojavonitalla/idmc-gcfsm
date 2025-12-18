# Payment Re-upload Feature

## Status: ✅ PARTIALLY IMPLEMENTED (Commit: 55d1771)

**Completed:**
- ✅ Payment amount tracking (`verifyPayment` function)
- ✅ Re-upload UI on RegistrationStatusPage
- ✅ Rejection reason display to users
- ✅ Balance calculation and display
- ✅ File upload with validation

**Pending:**
- ⏳ Admin modal UI for entering amount paid
- ⏳ Email notifications for payment rejection
- ⏳ Payment history timeline

---

## Original Problem Statement

When an admin rejects a payment (e.g., partial payment, unclear receipt, wrong amount), the registration status is set back to `PENDING_PAYMENT`, but users have **no way to re-upload a corrected payment receipt**. This creates a critical UX gap where honest mistakes cannot be corrected, leading to automatic cancellation.

## Current Behavior

1. User uploads payment receipt → Status: `PENDING_VERIFICATION`
2. Admin reviews and rejects (partial payment, unclear image, etc.) → Status: `PENDING_PAYMENT`
3. User views registration on RegistrationStatusPage → Sees "Please upload payment proof"
4. **No upload button available** ❌
5. Payment deadline passes → Registration automatically cancelled
6. User loses registration slot due to inability to correct honest mistake

## Required Solution

### 1. Add Re-upload UI to RegistrationStatusPage

**File:** `src/pages/RegistrationStatusPage.js`

Add payment upload section when `status === PENDING_PAYMENT`:

```jsx
{registration.status === REGISTRATION_STATUS.PENDING_PAYMENT && (
  <div className={styles.reuploadSection}>
    <h4>Upload Payment Proof</h4>

    {/* Show rejection reason if available */}
    {registration.payment?.rejectionReason && (
      <div className={styles.rejectionNotice}>
        <strong>Previous payment was declined:</strong>
        <p>{registration.payment.rejectionReason}</p>
      </div>
    )}

    <div className={styles.fileUpload}>
      <input
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        disabled={isUploading}
      />
      <button
        onClick={handleUploadPayment}
        disabled={!selectedFile || isUploading}
      >
        {isUploading ? `Uploading ${uploadProgress}%...` : 'Upload Payment Proof'}
      </button>
    </div>

    <p className={styles.deadline}>
      Payment deadline: {formatDate(registration.paymentDeadline)}
    </p>
  </div>
)}
```

**Implementation:**
- Show upload form only for `PENDING_PAYMENT` status
- Use existing `uploadPaymentProof()` service
- Call `updatePaymentProof()` to update registration
- Show upload progress
- Update UI immediately on successful upload

### 2. Add Rejection Tracking

**File:** `functions/src/index.ts` or admin service

Add rejection reason field when admin rejects payment:

```typescript
// When admin changes status from PENDING_VERIFICATION to PENDING_PAYMENT
await updateRegistration(registrationId, {
  status: REGISTRATION_STATUS.PENDING_PAYMENT,
  'payment.status': REGISTRATION_STATUS.PENDING_PAYMENT,
  'payment.rejectionReason': rejectionReason, // NEW FIELD
  'payment.rejectedAt': serverTimestamp(),
  'payment.rejectedBy': adminEmail,
});
```

**Database Schema Addition:**
```
registration.payment {
  proofUrl: string,
  uploadedAt: timestamp,
  status: string,
  rejectionReason?: string,  // NEW - shown to user
  rejectedAt?: timestamp,    // NEW - audit trail
  rejectedBy?: string,       // NEW - audit trail
}
```

### 3. Admin UI Enhancement

**File:** `src/components/admin/RegistrationDetailModal.js`

Add rejection reason input when changing status to `PENDING_PAYMENT`:

```jsx
{selectedStatus === REGISTRATION_STATUS.PENDING_PAYMENT &&
 registration.status === REGISTRATION_STATUS.PENDING_VERIFICATION && (
  <div className={styles.rejectionReasonBox}>
    <label>Reason for rejection (shown to user):</label>
    <textarea
      value={rejectionReason}
      onChange={(e) => setRejectionReason(e.target.value)}
      placeholder="E.g., 'Partial payment only. Please upload receipt showing full ₱500 payment.'"
      required
    />
  </div>
)}
```

### 4. Email Notification (Optional but Recommended)

Send email when payment is rejected:

```typescript
await sendEmail({
  to: registration.primaryAttendee.email,
  subject: 'Payment Verification - Action Required',
  body: `
    Your payment for registration ${registrationId} requires attention.

    Reason: ${rejectionReason}

    Please upload a corrected payment receipt by ${paymentDeadline}.

    View your registration: [link to RegistrationStatusPage]
  `
});
```

## User Flow After Implementation

### Happy Path - Correction Successful
1. User uploads partial payment (₱300 instead of ₱500)
2. Admin rejects with reason: "Only ₱300 received, ₱500 required"
3. **User receives email notification**
4. User visits RegistrationStatusPage
5. **Sees rejection reason and upload button**
6. User uploads corrected receipt showing ₱500
7. Status → `PENDING_VERIFICATION`
8. Admin approves → Status: `CONFIRMED`

### Edge Case - Deadline Expires
1. User uploads incorrect payment
2. Admin rejects with reason
3. User doesn't correct before deadline
4. Registration cancelled (correct behavior)

## Technical Implementation Checklist

### Phase 1: Core Re-upload Functionality
- [ ] Add file upload UI to RegistrationStatusPage for PENDING_PAYMENT status
- [ ] Implement upload handler using existing services
- [ ] Add upload progress indicator
- [ ] Update registration status to PENDING_VERIFICATION after upload
- [ ] Add user-facing success/error messages

### Phase 2: Rejection Tracking
- [ ] Add rejection fields to database schema
- [ ] Update admin modal to accept rejection reason
- [ ] Store rejection metadata (reason, timestamp, admin)
- [ ] Display rejection reason on RegistrationStatusPage

### Phase 3: Notifications (Optional)
- [ ] Email notification when payment rejected
- [ ] Email template with rejection reason
- [ ] Link to re-upload page in email

### Phase 4: Testing
- [ ] Test re-upload flow end-to-end
- [ ] Test with various file types and sizes
- [ ] Test deadline enforcement with re-upload
- [ ] Test admin rejection with reason
- [ ] Test email notifications

## Files to Modify

1. **Frontend:**
   - `src/pages/RegistrationStatusPage.js` - Add upload UI
   - `src/components/admin/RegistrationDetailModal.js` - Add rejection reason input
   - `src/pages/RegistrationStatusPage.module.css` - Upload section styles

2. **Services:**
   - `src/services/registration.js` - No changes needed (already has updatePaymentProof)
   - `src/services/maintenance.js` - Add rejection reason to updateRegistration

3. **Backend:**
   - `functions/src/index.ts` - Email notification trigger (optional)

4. **Database:**
   - Firestore schema - Add rejection fields to registration.payment

## Priority: HIGH

This is a **critical UX gap** that prevents users from correcting honest mistakes, leading to unfair registration cancellations. Should be implemented before payment deadlines go into effect.

## Related Issues

- Fixed in commit 0be9c68: Status handling and cancellation logic
- Depends on: Existing `uploadPaymentProof()` and `updatePaymentProof()` services
- Enhancement: Could add file validation feedback (size, type, clarity)

---

## Follow-up Task: Admin Modal Enhancement

### What's Needed

The admin modal (`src/components/admin/RegistrationDetailModal.js`) currently uses a simple status dropdown. It should be enhanced to provide a dedicated payment verification interface.

### Implementation Plan

**File:** `src/components/admin/RegistrationDetailModal.js`

#### 1. Add Payment Verification Section

Show this section when `registration.status === PENDING_VERIFICATION`:

```jsx
{registration.status === REGISTRATION_STATUS.PENDING_VERIFICATION && (
  <div className={styles.paymentVerification}>
    <h4>Verify Payment</h4>
    
    {/* Payment proof image */}
    {registration.payment?.proofUrl && (
      <div className={styles.paymentProof}>
        <img src={registration.payment.proofUrl} alt="Payment proof" />
      </div>
    )}
    
    <div className={styles.verificationForm}>
      {/* Total amount (read-only) */}
      <div className={styles.formGroup}>
        <label>Total Amount Required</label>
        <input type="text" value={`₱${registration.totalAmount}`} disabled />
      </div>
      
      {/* Amount paid input */}
      <div className={styles.formGroup}>
        <label>Amount Received *</label>
        <input
          type="number"
          value={amountPaid}
          onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
          placeholder="0.00"
          min="0"
          max={registration.totalAmount}
        />
      </div>
      
      {/* Calculated balance (auto-calculated) */}
      <div className={styles.formGroup}>
        <label>Balance</label>
        <input
          type="text"
          value={`₱${Math.max(0, registration.totalAmount - amountPaid).toFixed(2)}`}
          disabled
          className={amountPaid < registration.totalAmount ? styles.balanceOwed : ''}
        />
      </div>
      
      {/* Payment method */}
      <div className={styles.formGroup}>
        <label>Payment Method</label>
        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
          <option value="">Select method</option>
          <option value="gcash">GCash</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="cash">Cash</option>
        </select>
      </div>
      
      {/* Reference number */}
      <div className={styles.formGroup}>
        <label>Reference Number</label>
        <input
          type="text"
          value={referenceNumber}
          onChange={(e) => setReferenceNumber(e.target.value)}
          placeholder="Transaction reference"
        />
      </div>
      
      {/* Rejection reason (only shown if partial payment or issues) */}
      {amountPaid < registration.totalAmount && (
        <div className={styles.formGroup}>
          <label>Message to User (shown on status page)</label>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="E.g., 'Partial payment received. Please upload proof of full ₱500 payment.'"
            rows={3}
          />
        </div>
      )}
      
      {/* Action buttons */}
      <div className={styles.actions}>
        <button
          onClick={handleVerifyPayment}
          className={styles.verifyButton}
          disabled={!amountPaid || !paymentMethod}
        >
          {amountPaid >= registration.totalAmount
            ? 'Confirm Payment'
            : 'Mark as Partial Payment'}
        </button>
        <button
          onClick={handleRejectPayment}
          className={styles.rejectButton}
        >
          Reject Payment
        </button>
      </div>
    </div>
  </div>
)}
```

#### 2. Add Handler Functions

```javascript
const [amountPaid, setAmountPaid] = useState(registration?.totalAmount || 0);
const [paymentMethod, setPaymentMethod] = useState('');
const [referenceNumber, setReferenceNumber] = useState('');
const [rejectionReason, setRejectionReason] = useState('');
const [isVerifying, setIsVerifying] = useState(false);

const handleVerifyPayment = async () => {
  if (!amountPaid || !paymentMethod) return;
  
  setIsVerifying(true);
  try {
    await verifyPayment(
      registration.id,
      {
        amountPaid,
        method: paymentMethod,
        referenceNumber,
        verifiedBy: admin.email,
        notes: '',
        rejectionReason: amountPaid < registration.totalAmount ? rejectionReason : null,
      },
      admin.uid,
      admin.email
    );
    
    // Refresh registration data
    onRefresh();
    onClose();
  } catch (error) {
    console.error('Verification error:', error);
    setError('Failed to verify payment');
  } finally {
    setIsVerifying(false);
  }
};

const handleRejectPayment = async () => {
  const reason = prompt('Enter rejection reason (shown to user):');
  if (!reason) return;
  
  await updateRegistration(registration.id, {
    status: REGISTRATION_STATUS.PENDING_PAYMENT,
    'payment.rejectionReason': reason,
    'payment.rejectedAt': serverTimestamp(),
    'payment.rejectedBy': admin.email,
  });
  
  onRefresh();
  onClose();
};
```

#### 3. Import Required Functions

```javascript
import { verifyPayment } from '../../services';
import { useAdminAuth } from '../../context';
```

### Benefits of Admin Modal Enhancement

- ✅ Streamlined payment verification workflow
- ✅ Visual confirmation of amount vs balance
- ✅ Automatic status updates based on payment completeness
- ✅ Clear messaging to users for partial payments
- ✅ Audit trail with admin ID and timestamp

### Testing Checklist

- [ ] Full payment verification (amount === total)
- [ ] Partial payment verification (amount < total)
- [ ] Payment rejection with custom reason
- [ ] Form validation (required fields)
- [ ] Balance calculation accuracy
- [ ] Status updates correctly applied
- [ ] Activity log entries created

### Current Workaround

Until this enhancement is implemented, admins can:
1. Use the status dropdown to manually change statuses
2. Add notes in the notes field for rejection reasons
3. Users can still re-upload via the status page (already implemented)

The core functionality works, but the admin UX can be improved with this dedicated interface.
