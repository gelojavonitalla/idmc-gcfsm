# Registration Schema Documentation

This document describes the Firestore schema for the `registrations` collection.

## Collection: `registrations`

### Document Structure

```javascript
{
  // Registration identification
  registrationId: string,           // Format: "REG-YYYY-XXXXXX"
  shortCode: string,                 // 6-character code for quick lookup
  shortCodeSuffix: string,           // Last 4 characters of shortCode

  // Primary attendee (required)
  primaryAttendee: {
    firstName: string,
    lastName: string,
    middleName: string,
    cellphone: string,
    email: string,
    ministryRole: string,           // From MINISTRY_ROLES constant
    category: string,               // "regular" | "student_senior"
  },

  // Additional attendees (optional array)
  additionalAttendees: [{
    firstName: string,
    lastName: string,
    middleName: string,
    cellphone: string,
    email: string | null,           // Optional for additional attendees
    ministryRole: string,
    category: string,
  }],

  // Church information
  church: {
    name: string,
    city: string,
    province: string,
  },

  // Payment information
  payment: {
    method: string,                 // "gcash" | "paymaya" | "bank_transfer" | "cash"
    proofUrl: string | null,        // Firebase Storage URL of payment proof
    uploadedAt: Timestamp | null,
    amountPaid: number,             // Amount paid by attendee
    balance: number,                // Remaining balance
    status: string,                 // Payment verification status
    referenceNumber: string | null, // Payment reference number
    verifiedBy: string | null,      // Admin email who verified
    verifiedAt: Timestamp | null,
    rejectionReason: string | null, // Reason if payment rejected/partial
    rejectedAt: Timestamp | null,
    rejectedBy: string | null,
  },

  // Invoice request information
  invoice: {
    // Basic invoice request (Phase 1 - Already implemented)
    requested: boolean,             // True if attendee requested invoice
    name: string,                   // Company/person name for invoice
    tin: string,                    // Tax Identification Number
    address: string,                // Business/billing address

    // Invoice generation and delivery (Phase 2-4 - To be implemented)
    invoiceNumber: string | null,   // Format: "INV-YYYY-NNNN" (e.g., "INV-2025-0001")
    invoiceUrl: string | null,      // Firebase Storage path to invoice file
    status: string | null,          // "pending" | "uploaded" | "sent" | "failed"
    generatedAt: Timestamp | null,  // When invoice was uploaded/generated
    sentAt: Timestamp | null,       // When invoice email was sent
    sentBy: string | null,          // Admin email who sent the invoice
    emailDeliveryStatus: string | null, // "sent" | "failed"
  } | null,                         // Null if no invoice requested

  // Registration status
  status: string,                   // "pending_payment" | "pending_verification" | "confirmed" | "cancelled" | "refunded"
  totalAmount: number,              // Total registration amount
  pricingTier: string,              // ID of pricing tier used
  paymentDeadline: Timestamp,       // 7 days from creation (ISO8601)

  // Check-in tracking
  checkedIn: boolean,
  checkedInAt: Timestamp | null,
  checkedInBy: string | null,       // Admin email who checked in

  // QR codes for event entry
  qrCodeData: string,               // Main registration QR code
  attendeeQRCodes: [{               // Individual QR codes per attendee
    attendeeIndex: number,          // 0 for primary, 1+ for additional
    qrData: string,                 // Format: "{registrationId}-{attendeeIndex}"
  }],

  // Email tracking
  confirmationEmailSent: boolean,
  reminderEmailSent: boolean,
  ticketEmailSent: boolean,

  // Audit timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

## Invoice Fields - Detailed Description

### Phase 1: Data Collection (Already Implemented)
- `invoice.requested` - Boolean flag set during registration
- `invoice.name` - Business or individual name for invoice
- `invoice.tin` - Tax ID number (required for official receipts in Philippines)
- `invoice.address` - Complete billing address

### Phase 2-4: Invoice Generation & Tracking (To Be Implemented)

#### Invoice Number
- Format: `INV-YYYY-NNNN`
- Example: `INV-2025-0001`
- Generated using atomic Firestore transaction
- Sequential counter resets each year
- Stored in `settings/invoiceCounter` document

#### Invoice File Storage
- **Storage Path**: `registrations/invoices/{registrationId}_{invoiceNumber}.{ext}`
- **Allowed Formats**: PDF, JPEG, PNG
- **Maximum Size**: 10MB (IMAGE) or 50MB (DOCUMENT)
- Can be uploaded photo or generated PDF

#### Invoice Status Flow
1. **pending** - Invoice requested, not yet uploaded
2. **uploaded** - Invoice file uploaded, ready to send
3. **sent** - Invoice emailed to attendee successfully
4. **failed** - Email delivery failed

#### Email Delivery
- Sent to `primaryAttendee.email`
- Includes invoice as attachment
- Tracked via `sentAt`, `sentBy`, `emailDeliveryStatus`

## Related Documents

### Counter Document: `settings/invoiceCounter`
```javascript
{
  year: number,                     // Current year (e.g., 2025)
  lastNumber: number,               // Last invoice number issued
  updatedAt: Timestamp,
}
```

## Indexes Required

For efficient querying of invoice requests:

```javascript
// Query: Find all confirmed registrations with pending invoices
db.collection('registrations')
  .where('status', '==', 'confirmed')
  .where('invoice.requested', '==', true)
  .where('invoice.status', '==', 'pending')
  .orderBy('payment.verifiedAt', 'desc')
```

**Index needed:**
- Collection: `registrations`
- Fields: `status` ASC, `invoice.requested` ASC, `invoice.status` ASC, `payment.verifiedAt` DESC

## Constants Reference

See `/src/constants/index.js` for:
- `ADMIN_ROUTES.INVOICES` - Admin page route
- `STORAGE_PATHS.INVOICES` - Storage path for invoice files
- `ALLOWED_FILE_TYPES.INVOICES` - Accepted file formats
- `INVOICE_STATUS` - Status enum values
- `INVOICE_STATUS_LABELS` - Display labels

## Migration Notes

### Existing Registrations
- Existing registrations already have `invoice.requested`, `invoice.name`, `invoice.tin`, `invoice.address`
- New fields (`invoiceNumber`, `status`, etc.) will be added when:
  - Invoice is uploaded by admin
  - Invoice is sent to attendee
- No migration script needed - fields added on-demand

### Backward Compatibility
- Old registrations without invoice request: `invoice` field is `null` or `undefined`
- New code must check `invoice?.requested` before accessing invoice fields
- Use utility function `hasInvoiceRequest(registration)` for safe checking
