# IDMC-EVT-02 · Registration & Ticketing

## Product & QA Doc

### Summary
**Conference registration system** that enables attendees to register for the IDMC Conference with tiered pricing (Super Early Bird, Early Bird, Regular), category selection (Regular, Student, NSF), workshop preferences, and payment verification workflow. Generates unique registration IDs and QR code tickets upon confirmation.

**Target users:** Attendees (primary), Admin/Finance Team (secondary).

---

## Goals
* Provide **streamlined registration flow** with minimal friction.
* Support **tiered pricing** with automatic tier detection based on dates.
* Enable **category-based pricing** (Regular, Student, NSF) with verification.
* Capture **workshop preferences** during registration.
* Generate **unique registration IDs** and **QR code tickets**.
* Integrate with **payment verification** workflow.
* Send **confirmation emails** at each stage.

## Non-Goals
* Online payment gateway integration (manual PayNow/bank transfer for v1).
* Waitlist functionality (future phase).
* Group registration discounts (future phase).
* Promo codes/coupons (future phase).

---

## Scope

### In
* **Registration form** with personal info, category, workshop selection.
* **Pricing tier calculation** based on current date.
* **Student/NSF verification** with proof upload or declaration.
* **Payment instructions page** with PayNow QR and bank details.
* **Registration status tracking** (pending, confirmed, cancelled).
* **Confirmation emails** at registration and payment verification.
* **QR code ticket generation** for confirmed registrations.
* **Duplicate prevention** (one registration per email per conference).
* **Registration deadline enforcement**.

### Out
* Payment gateway integration (Stripe, PayNow API).
* Refund processing automation.
* Waitlist when sold out.
* Group/bulk registration.
* Promo codes.

---

## User Stories

* As an **attendee**, I can fill out the registration form with my details.
* As an **attendee**, I can select my ticket category (Regular, Student, NSF).
* As a **student**, I can upload proof of enrollment or declare student status.
* As an **attendee**, I can select my preferred workshop tracks.
* As an **attendee**, I can see the amount I need to pay based on current pricing tier.
* As an **attendee**, I can view payment instructions with PayNow QR code.
* As an **attendee**, I receive a confirmation email after registering.
* As an **attendee**, I receive my ticket with QR code after payment is verified.
* As an **attendee**, I can check my registration status online.

---

## Flows & States

### A) Registration Flow
1. Attendee clicks "Register Now" from landing page.
2. Registration form loads with fields:
   - Personal info (name, email, phone, church/organization)
   - Category selection (Regular, Student, NSF)
   - Workshop track preferences
   - Special requirements (dietary, accessibility)
   - Terms acceptance checkbox
3. For Student/NSF: proof upload field appears.
4. Attendee submits form.
5. System validates input and checks for duplicate email.
6. Registration created with status "pending_payment".
7. Confirmation email sent with payment instructions.
8. Payment instructions page displayed.

### B) Payment Verification Flow (Admin)
1. Attendee makes payment externally (PayNow/bank transfer).
2. Admin receives payment notification (manual check).
3. Admin opens registration in dashboard.
4. Admin verifies payment details and amount.
5. Admin clicks "Confirm Payment" with reference number.
6. System updates status to "confirmed".
7. System generates QR code ticket.
8. Ticket email sent to attendee.

### C) Registration Status Check Flow
1. Attendee receives registration confirmation email.
2. Email contains link to status page.
3. Attendee clicks link or enters registration ID.
4. Status page displays current status and details.

### Registration Status States
```
┌─────────────────┐
│   Form Submit   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ pending_payment │────►│   cancelled     │
└────────┬────────┘     └─────────────────┘
         │                      ▲
         │ Payment Verified     │ Auto-cancel (7 days)
         ▼                      │
┌─────────────────┐             │
│   confirmed     │─────────────┘
└────────┬────────┘   Refund Request
         │
         │ Check-in
         ▼
┌─────────────────┐
│   checked_in    │
└─────────────────┘
```

---

## Acceptance Criteria (QA)

### IDMC-EVT-02-AC · Registration Form
* [ ] **IDMC-EVT-02-AC-01** Form captures first name (required, min 2 chars).
* [ ] **IDMC-EVT-02-AC-02** Form captures last name (required, min 2 chars).
* [ ] **IDMC-EVT-02-AC-03** Form captures email (required, valid format).
* [ ] **IDMC-EVT-02-AC-04** Form captures phone number (required, valid format).
* [ ] **IDMC-EVT-02-AC-05** Form captures church/organization (optional).
* [ ] **IDMC-EVT-02-AC-06** Form captures country (required, dropdown).
* [ ] **IDMC-EVT-02-AC-07** Category selector displays: Regular, Student, NSF.
* [ ] **IDMC-EVT-02-AC-08** Student category shows proof upload field.
* [ ] **IDMC-EVT-02-AC-09** NSF category shows declaration checkbox.
* [ ] **IDMC-EVT-02-AC-10** Workshop track selection available (Track 1 default, Track 2 optional).
* [ ] **IDMC-EVT-02-AC-11** Special requirements field for dietary/accessibility.
* [ ] **IDMC-EVT-02-AC-12** Terms and conditions checkbox (required).
* [ ] **IDMC-EVT-02-AC-13** Form validates all required fields before submission.
* [ ] **IDMC-EVT-02-AC-14** Form shows inline validation errors.
* [ ] **IDMC-EVT-02-AC-15** Submit button disabled during processing.

### IDMC-EVT-02-AC · Pricing & Tiers
* [ ] **IDMC-EVT-02-AC-16** Current pricing tier auto-detected based on date.
* [ ] **IDMC-EVT-02-AC-17** Price displayed updates based on category selection.
* [ ] **IDMC-EVT-02-AC-18** Super Early Bird: $170 Regular / $50 Student/NSF.
* [ ] **IDMC-EVT-02-AC-19** Early Bird: $210 Regular / $60 Student/NSF.
* [ ] **IDMC-EVT-02-AC-20** Regular: $290 Regular / $60 Student/NSF.
* [ ] **IDMC-EVT-02-AC-21** Tier name and validity dates shown.
* [ ] **IDMC-EVT-02-AC-22** Price breakdown displayed before submission.

### IDMC-EVT-02-AC · Registration Processing
* [ ] **IDMC-EVT-02-AC-23** Registration ID generated in format REG-YYYY-NNNNN.
* [ ] **IDMC-EVT-02-AC-24** Duplicate email check prevents re-registration.
* [ ] **IDMC-EVT-02-AC-25** Duplicate email shows link to existing registration.
* [ ] **IDMC-EVT-02-AC-26** Registration closed after deadline (form disabled).
* [ ] **IDMC-EVT-02-AC-27** Registration created with status "pending_payment".
* [ ] **IDMC-EVT-02-AC-28** Timestamp recorded for registration submission.
* [ ] **IDMC-EVT-02-AC-29** IP address and user agent captured for audit.

### IDMC-EVT-02-AC · Payment Instructions
* [ ] **IDMC-EVT-02-AC-30** Payment page shows amount to pay.
* [ ] **IDMC-EVT-02-AC-31** PayNow QR code displayed.
* [ ] **IDMC-EVT-02-AC-32** Bank transfer details displayed (bank, account, name).
* [ ] **IDMC-EVT-02-AC-33** Payment reference (registration ID) prominently shown.
* [ ] **IDMC-EVT-02-AC-34** Payment deadline displayed (7 days from registration).
* [ ] **IDMC-EVT-02-AC-35** Instructions to include reference in payment.

### IDMC-EVT-02-AC · Email Notifications
* [ ] **IDMC-EVT-02-AC-36** Confirmation email sent on registration submission.
* [ ] **IDMC-EVT-02-AC-37** Email includes registration ID and amount.
* [ ] **IDMC-EVT-02-AC-38** Email includes payment instructions.
* [ ] **IDMC-EVT-02-AC-39** Reminder email sent after 3 days if unpaid.
* [ ] **IDMC-EVT-02-AC-40** Ticket email sent on payment confirmation.
* [ ] **IDMC-EVT-02-AC-41** Ticket email includes QR code attachment/embed.
* [ ] **IDMC-EVT-02-AC-42** All emails are mobile-friendly HTML.

### IDMC-EVT-02-AC · QR Code Ticket
* [ ] **IDMC-EVT-02-AC-43** QR code generated containing registration ID.
* [ ] **IDMC-EVT-02-AC-44** QR code is scannable by check-in system.
* [ ] **IDMC-EVT-02-AC-45** Ticket shows attendee name and registration ID.
* [ ] **IDMC-EVT-02-AC-46** Ticket shows conference name and dates.
* [ ] **IDMC-EVT-02-AC-47** Ticket shows ticket category.
* [ ] **IDMC-EVT-02-AC-48** Ticket downloadable as PDF or image.

### IDMC-EVT-02-AC · Status Tracking
* [ ] **IDMC-EVT-02-AC-49** Status page accessible via unique URL.
* [ ] **IDMC-EVT-02-AC-50** Status page shows current registration status.
* [ ] **IDMC-EVT-02-AC-51** Status page shows registration details.
* [ ] **IDMC-EVT-02-AC-52** Pending status shows payment instructions.
* [ ] **IDMC-EVT-02-AC-53** Confirmed status shows ticket download.

---

## Data Model

### Registration Document
```typescript
// registrations/{registrationId}
interface Registration {
  registrationId: string;            // REG-2025-00001
  conferenceId: string;

  // Attendee Info
  attendee: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    church?: string;
    organization?: string;
    country: string;
  };

  // Ticket
  ticketType: string;                // "super_early_bird" | "early_bird" | "regular"
  category: "regular" | "student" | "nsf";
  amount: number;
  proofDocumentUrl?: string;

  // Workshop Preferences
  workshopSelections: Array<{
    sessionId: string;
    sessionTitle: string;
    track: string;
  }>;

  // Special Requirements
  specialRequirements?: {
    dietary?: string;
    accessibility?: string;
    other?: string;
  };

  // Status
  status: "pending_payment" | "pending_verification" | "confirmed" | "cancelled" | "refunded";

  // Payment
  payment: {
    method?: "paynow" | "bank_transfer" | "cash" | "other";
    referenceNumber?: string;
    verifiedAt?: Timestamp;
    verifiedBy?: string;
    notes?: string;
  };

  // QR Code
  qrCode?: string;
  qrCodeUrl?: string;

  // Communication
  confirmationEmailSent: boolean;
  reminderEmailSent: boolean;
  ticketEmailSent: boolean;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  ipAddress?: string;
  userAgent?: string;
}
```

---

## Backend Implementation

### Cloud Functions

#### `createRegistration`
```typescript
/**
 * createRegistration (HTTPS Callable)
 * Purpose: Create a new conference registration
 * Inputs: { conferenceId, attendee, category, workshopSelections, specialRequirements }
 * Outputs: { ok: true, registrationId, amount, paymentInstructions }
 * Security: Public (rate limited)
 */
```

#### `getRegistrationStatus`
```typescript
/**
 * getRegistrationStatus (HTTPS Callable)
 * Purpose: Get registration status by ID or email
 * Inputs: { registrationId } or { email }
 * Outputs: { ok: true, registration: {...} }
 * Security: Public (with registration ID) or authenticated
 */
```

#### `sendPaymentReminder` (Scheduled)
```typescript
/**
 * sendPaymentReminder (Scheduled)
 * Purpose: Send reminder emails for pending payments
 * Runs: Daily at 9 AM SGT
 * Logic: Find pending > 3 days, send reminder, auto-cancel > 7 days
 */
```

---

## Frontend Implementation

### Pages
```
/src/pages/
├── register.tsx              # Registration form
├── register/
│   ├── success.tsx          # Post-registration page
│   └── status.tsx           # Status check page
```

### Components
```
/src/components/registration/
├── RegistrationForm.tsx
├── CategorySelector.tsx
├── WorkshopSelector.tsx
├── PricingDisplay.tsx
├── PaymentInstructions.tsx
├── TicketDisplay.tsx
└── StatusTracker.tsx
```

---

## Edge Cases
* **Duplicate email:** Show error with link to check existing registration.
* **Registration closed:** Disable form, show "Registration Closed" message.
* **Invalid student proof:** Hold as "pending_verification" until admin reviews.
* **Payment timeout:** Auto-cancel after 7 days, send cancellation email.
* **Partial form submission:** Save draft in localStorage for recovery.
* **Network error during submission:** Retry with exponential backoff, show error.

---

## Metrics / Success
* **Form completion rate:** ≥ 80% of started registrations completed.
* **Payment conversion:** ≥ 90% of registrations paid within 7 days.
* **Email delivery rate:** ≥ 99% emails delivered.
* **Form submission time:** Average < 3 minutes.

---

## Test Data / Seed
* **Test Registrations:**
  - John Doe (Regular, confirmed, checked_in)
  - Jane Smith (Student, confirmed)
  - Bob Wilson (Regular, pending_payment)
  - Alice Brown (NSF, pending_verification)
  - Charlie Lee (Regular, cancelled)

---

## Links
* **Parent Epic:** [IDMC-EVT Event Management v1](./IDMC-EVT-Event-Management-v1.md)
* **Related:** [IDMC-EVT-09 Attendee Management](./IDMC-EVT-09-Attendee-Management.md)
* **Related:** [IDMC-EVT-10 Check-in](./IDMC-EVT-10-Check-in-Access-Control.md)

---

## Changelog
* **v1.0.0 — 2025-12-12** - Initial epic creation with 53 acceptance criteria.
