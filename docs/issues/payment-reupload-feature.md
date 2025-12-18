# Payment Re-upload Feature - Missing Critical Functionality

## Problem Statement

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
