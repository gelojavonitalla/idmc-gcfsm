# IDMC-EVT · Event Management Platform v1

# Product & QA Doc

## Summary
**IDMC (Intentional Disciplemaking Church) Conference Event Management Platform** that enables conference organizers to manage all aspects of the annual disciplemaking conference including registration, speakers, schedule, workshops, and attendee management. Provides a public-facing website for attendees and an admin dashboard for organizers.

**Target users:** Conference Organizers/Admin (primary), Speakers (secondary), Attendees/Delegates (consumers).

* * *

## Process Flow Context
This platform provides **end-to-end event management** for the IDMC Conference. The system handles the complete lifecycle from conference setup through post-event reporting.

### IDMC-EVT's Role in Event Flow:
1. **Setup Phase** - Admin configures conference year, theme, dates, venue, pricing tiers
2. **Content Phase** - Admin adds speakers, sessions, workshops, schedule
3. **Registration Phase** - Attendees register and pay for tickets
4. **Pre-Event Phase** - Attendee management, badge preparation, communication
5. **Event Phase** - Check-in, session tracking, real-time updates
6. **Post-Event Phase** - Feedback collection, analytics, archive

**Architecture:**
- **Frontend (Public):** Landing page, registration, schedule, speakers, FAQ
- **Frontend (Admin):** Dashboard, content management, attendee management
- **Backend:** Firebase Cloud Functions for business logic
- **Database:** Firestore for data persistence
- **Storage:** Firebase Storage for images and documents
- **Hosting:** Firebase Hosting for static assets

* * *

## Goals
* Provide **intuitive public website** showcasing conference information and enabling registration.
* Support **tiered pricing** (Super Early Bird, Early Bird, Regular, Student/NSF).
* Enable **comprehensive schedule management** with plenary sessions and workshop tracks.
* Provide **speaker profile management** with bios and session assignments.
* Deliver **streamlined registration flow** with payment integration.
* Enable **real-time check-in** system for event day operations.
* Provide **admin dashboard** for complete conference management.
* Support **multi-year conference** management with archive capabilities.

## Non-Goals
* Live streaming integration (future phase).
* Mobile native app (web-responsive only for v1).
* Complex payment gateway integration (manual payment verification for v1).
* Multi-language support (English only for v1).
* Accommodation booking integration.

* * *

## Scope

### In
* **Public Website**: Landing page, about, speakers, schedule, workshops, FAQ, registration.
* **Registration System**: Multi-tier pricing, form submission, ticket generation.
* **Speaker Management**: Profiles, bios, photos, session assignments.
* **Schedule Management**: Day-by-day program, plenary sessions, workshops, breaks.
* **Workshop Management**: Multiple tracks, capacity limits, track registration.
* **Attendee Management**: List, search, filter, export, communication.
* **Check-in System**: QR code scanning, manual lookup, real-time tracking.
* **Admin Dashboard**: Content management, analytics, settings.
* **Past Conferences**: Archive of previous years with content preservation.

### Out
* Payment gateway integration (PayNow/bank transfer with manual verification for v1).
* Live streaming/virtual attendance.
* Native mobile applications.
* Hotel/accommodation booking.
* Transportation coordination.
* Volunteer management system.
* Sponsor portal (admin-managed for v1).

* * *

## User Stories

### Public Users (Attendees)
* As an **Attendee**, I can view the conference landing page with theme, dates, and call-to-action.
* As an **Attendee**, I can view speaker profiles and their sessions.
* As an **Attendee**, I can view the complete conference schedule by day.
* As an **Attendee**, I can view workshop details and select my preferred tracks.
* As an **Attendee**, I can register for the conference and receive confirmation.
* As an **Attendee**, I can view my registration status and ticket details.
* As an **Attendee**, I can view FAQ for common questions.
* As an **Attendee**, I can view information about past conferences.

### Admin Users
* As an **Admin**, I can create and configure a new conference year.
* As an **Admin**, I can manage speaker profiles (add, edit, delete).
* As an **Admin**, I can manage the conference schedule (sessions, timings).
* As an **Admin**, I can manage workshop tracks and capacity.
* As an **Admin**, I can view and manage all registrations.
* As an **Admin**, I can verify payments and confirm registrations.
* As an **Admin**, I can check-in attendees on event day.
* As an **Admin**, I can view analytics and reports.
* As an **Admin**, I can manage FAQ content.
* As an **Admin**, I can archive past conferences.

### Speakers
* As a **Speaker**, I can view my assigned sessions.
* As a **Speaker**, I can update my profile information.

* * *

## Flows & States

### A) Conference Setup Flow (Admin)
1. Admin logs into Admin Dashboard.
2. Clicks **"Create New Conference"**.
3. **Conference Setup Form** loads:
   - Conference year (e.g., 2025)
   - Theme/title (e.g., "All In For Jesus And His Kingdom")
   - Tagline/subtitle
   - Start date and end date
   - Venue name and address
   - Registration open/close dates
   - Pricing tiers configuration
4. Admin fills in details → clicks **"Create Conference"**.
5. Conference created with status "draft".
6. Admin can then add speakers, schedule, workshops.
7. When ready, Admin clicks **"Publish"** to make public.

### B) Registration Flow (Attendee)
1. Attendee visits conference website → clicks **"Register Now"**.
2. **Registration Page** loads:
   - Personal information (name, email, phone, church/organization)
   - Ticket type selection (based on current pricing tier)
   - Category selection (Regular, Student, NSF)
   - Workshop track preferences (if applicable)
   - Special requirements (dietary, accessibility)
   - Terms and conditions checkbox
3. Attendee fills form → clicks **"Submit Registration"**.
4. System:
   - Validates form data
   - Creates registration with status "pending_payment"
   - Generates unique registration ID (REG-YYYY-NNNNN)
   - Sends confirmation email with payment instructions
5. **Payment Instructions Page** displays:
   - Amount to pay based on ticket type
   - PayNow QR code / bank transfer details
   - Reference number to include
   - Payment deadline
6. Attendee makes payment externally.
7. Admin verifies payment → updates status to "confirmed".
8. System sends confirmation email with ticket/QR code.

### C) Speaker Management Flow (Admin)
1. Admin navigates to **Speakers** section.
2. Clicks **"Add Speaker"**.
3. **Speaker Form** loads:
   - Name and title/designation
   - Organization/church
   - Bio (rich text)
   - Profile photo upload
   - Social media links (optional)
   - Session assignments (multi-select)
4. Admin fills details → clicks **"Save Speaker"**.
5. Speaker appears on public speakers page (if published).

### D) Schedule Management Flow (Admin)
1. Admin navigates to **Schedule** section.
2. Selects conference day (Day 1, Day 2).
3. Clicks **"Add Session"**.
4. **Session Form** loads:
   - Session type (Plenary, Workshop, Break, Registration, Worship, Other)
   - Title
   - Description
   - Start time and end time
   - Venue/room
   - Speaker assignment (for plenary/workshop)
   - Track (for workshops)
   - Capacity (for workshops)
5. Admin fills details → clicks **"Save Session"**.
6. Session appears in schedule grid.
7. Admin can drag-and-drop to reorder (future enhancement).

### E) Check-in Flow (Event Day)
1. Admin/volunteer opens **Check-in** page.
2. **Check-in Interface** loads:
   - QR scanner activation
   - Manual search box
   - Recent check-ins list
   - Statistics (checked-in / total)
3. **Option A - QR Scan:**
   - Scan attendee's ticket QR code
   - System validates and displays attendee info
   - Click **"Check In"** to confirm
4. **Option B - Manual Search:**
   - Enter name or registration ID
   - Select attendee from results
   - Click **"Check In"** to confirm
5. System:
   - Updates attendee status to "checked_in"
   - Records check-in timestamp
   - Updates real-time counter

### F) View Schedule Flow (Attendee)
1. Attendee visits website → clicks **"Schedule"**.
2. **Schedule Page** loads:
   - Day selector tabs (Day 1, Day 2)
   - Timeline view of sessions
   - Session cards with time, title, speaker, venue
   - Color coding by session type
3. Attendee clicks on session card → **Session Detail Modal** opens.
4. Modal shows full description, speaker bio link, venue details.

### Loading / Empty / Error States
* **Loading:** Skeleton loader for all pages and components.
* **Empty (Admin - Speakers):** "No speakers added yet. Add your first speaker!"
* **Empty (Admin - Schedule):** "No sessions scheduled. Create your first session!"
* **Empty (Registrations):** "No registrations yet."
* **Error:** Network errors show retry banner; validation errors inline.

### Permission Matrix

| Role | View Public | Register | Admin Dashboard | Manage Content | Manage Registrations | Check-in |
| --- | --- | --- | --- | --- | --- | --- |
| visitor | ✅ | ✅ | 🚫 | 🚫 | 🚫 | 🚫 |
| attendee | ✅ | ✅ (own) | 🚫 | 🚫 | 🚫 | 🚫 |
| speaker | ✅ | ✅ | ✅ (limited) | ✅ (own profile) | 🚫 | 🚫 |
| volunteer | ✅ | ✅ | ✅ (limited) | 🚫 | 🚫 | ✅ |
| admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| superadmin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

* * *

## Acceptance Criteria (QA)

### IDMC-EVT-01 · Public Website & Landing Page
* [ ] **IDMC-EVT-01-AC-01** Landing page displays conference theme, dates, and venue.
* [ ] **IDMC-EVT-01-AC-02** Hero section with compelling call-to-action "Register Now" button.
* [ ] **IDMC-EVT-01-AC-03** Countdown timer showing days until conference.
* [ ] **IDMC-EVT-01-AC-04** Featured speakers section with photos and names.
* [ ] **IDMC-EVT-01-AC-05** Quick schedule overview showing key sessions.
* [ ] **IDMC-EVT-01-AC-06** Pricing tiers displayed with current active tier highlighted.
* [ ] **IDMC-EVT-01-AC-07** Responsive design works on mobile, tablet, and desktop.
* [ ] **IDMC-EVT-01-AC-08** Navigation menu with links to all main sections.
* [ ] **IDMC-EVT-01-AC-09** Footer with contact information and social media links.
* [ ] **IDMC-EVT-01-AC-10** About IDMC section with history and mission.

### IDMC-EVT-02 · Registration & Ticketing
* [ ] **IDMC-EVT-02-AC-01** Registration form captures: name, email, phone, church/organization.
* [ ] **IDMC-EVT-02-AC-02** Ticket type auto-selected based on current pricing tier dates.
* [ ] **IDMC-EVT-02-AC-03** Category selection: Regular, Student (with validation), NSF (with validation).
* [ ] **IDMC-EVT-02-AC-04** Student/NSF requires proof upload or declaration.
* [ ] **IDMC-EVT-02-AC-05** Workshop track selection (Track 1 default, Track 2 optional).
* [ ] **IDMC-EVT-02-AC-06** Special requirements field (dietary, accessibility).
* [ ] **IDMC-EVT-02-AC-07** Terms and conditions acceptance required.
* [ ] **IDMC-EVT-02-AC-08** Registration ID auto-generated (REG-YYYY-NNNNN format).
* [ ] **IDMC-EVT-02-AC-09** Confirmation email sent with payment instructions.
* [ ] **IDMC-EVT-02-AC-10** Payment instructions page shows amount, PayNow details, reference.
* [ ] **IDMC-EVT-02-AC-11** Registration status tracking: pending_payment, confirmed, cancelled.
* [ ] **IDMC-EVT-02-AC-12** Duplicate email prevention (one registration per email per conference).
* [ ] **IDMC-EVT-02-AC-13** Registration closes automatically after deadline.
* [ ] **IDMC-EVT-02-AC-14** Confirmation email with QR code ticket after payment verified.

### IDMC-EVT-03 · Speaker Management
* [ ] **IDMC-EVT-03-AC-01** Admin can add speaker with name, title, organization.
* [ ] **IDMC-EVT-03-AC-02** Speaker bio supports rich text formatting.
* [ ] **IDMC-EVT-03-AC-03** Profile photo upload (max 2MB, jpg/png).
* [ ] **IDMC-EVT-03-AC-04** Photo automatically resized/optimized for web.
* [ ] **IDMC-EVT-03-AC-05** Speaker can be assigned to multiple sessions.
* [ ] **IDMC-EVT-03-AC-06** Speaker order can be customized (drag-and-drop or order field).
* [ ] **IDMC-EVT-03-AC-07** Speaker visibility toggle (published/draft).
* [ ] **IDMC-EVT-03-AC-08** Public speakers page displays all published speakers.
* [ ] **IDMC-EVT-03-AC-09** Speaker detail page shows bio and assigned sessions.
* [ ] **IDMC-EVT-03-AC-10** Speakers grid responsive on all devices.

### IDMC-EVT-04 · Schedule & Sessions
* [ ] **IDMC-EVT-04-AC-01** Schedule organized by day (Day 1, Day 2).
* [ ] **IDMC-EVT-04-AC-02** Session types: Plenary, Workshop, Break, Registration, Worship, Lunch, Other.
* [ ] **IDMC-EVT-04-AC-03** Each session has: title, description, start time, end time, venue.
* [ ] **IDMC-EVT-04-AC-04** Plenary sessions can have multiple speakers.
* [ ] **IDMC-EVT-04-AC-05** Sessions color-coded by type.
* [ ] **IDMC-EVT-04-AC-06** Timeline view shows sessions in chronological order.
* [ ] **IDMC-EVT-04-AC-07** Session detail modal/page with full information.
* [ ] **IDMC-EVT-04-AC-08** Schedule exportable to PDF (future enhancement).
* [ ] **IDMC-EVT-04-AC-09** Admin can create, edit, delete sessions.
* [ ] **IDMC-EVT-04-AC-10** Session time validation (end time after start time).
* [ ] **IDMC-EVT-04-AC-11** Overlap detection warning for same venue.

### IDMC-EVT-05 · Workshops & Tracks
* [ ] **IDMC-EVT-05-AC-01** Workshops organized into tracks (Track 1, Track 2, etc.).
* [ ] **IDMC-EVT-05-AC-02** Each workshop has: title, description, speaker, venue, capacity.
* [ ] **IDMC-EVT-05-AC-03** Workshop categories: Missions, Marketplace, Social Justice, Media Influence, etc.
* [ ] **IDMC-EVT-05-AC-04** Track 1 is default access for all delegates.
* [ ] **IDMC-EVT-05-AC-05** Track 2 requires pre-registration/selection.
* [ ] **IDMC-EVT-05-AC-06** Workshop capacity tracking with remaining slots shown.
* [ ] **IDMC-EVT-05-AC-07** Attendees can select workshop preferences during registration.
* [ ] **IDMC-EVT-05-AC-08** Workshop attendance list exportable for organizers.
* [ ] **IDMC-EVT-05-AC-09** Parallel workshops displayed side-by-side in schedule.

### IDMC-EVT-06 · FAQ & Information Pages
* [ ] **IDMC-EVT-06-AC-01** FAQ page with expandable accordion sections.
* [ ] **IDMC-EVT-06-AC-02** FAQ categories: Registration, Payment, Venue, Accommodation, General.
* [ ] **IDMC-EVT-06-AC-03** Admin can add, edit, delete FAQ items.
* [ ] **IDMC-EVT-06-AC-04** FAQ items have question and answer (rich text).
* [ ] **IDMC-EVT-06-AC-05** FAQ items can be reordered.
* [ ] **IDMC-EVT-06-AC-06** Search functionality within FAQ.
* [ ] **IDMC-EVT-06-AC-07** About page with IDMC history and mission.
* [ ] **IDMC-EVT-06-AC-08** Contact page with email and inquiry form.
* [ ] **IDMC-EVT-06-AC-09** Venue page with address, map embed, directions.

### IDMC-EVT-07 · Admin Dashboard
* [ ] **IDMC-EVT-07-AC-01** Secure admin login with email/password.
* [ ] **IDMC-EVT-07-AC-02** Dashboard overview with key metrics (registrations, revenue, check-ins).
* [ ] **IDMC-EVT-07-AC-03** Quick stats cards: Total Registered, Confirmed, Pending, Checked-in.
* [ ] **IDMC-EVT-07-AC-04** Registration trend chart (daily/weekly).
* [ ] **IDMC-EVT-07-AC-05** Recent registrations list with quick actions.
* [ ] **IDMC-EVT-07-AC-06** Navigation sidebar to all admin sections.
* [ ] **IDMC-EVT-07-AC-07** Conference selector (for multi-year management).
* [ ] **IDMC-EVT-07-AC-08** Settings page for conference configuration.
* [ ] **IDMC-EVT-07-AC-09** User management for admin accounts.
* [ ] **IDMC-EVT-07-AC-10** Activity log for audit trail.

### IDMC-EVT-08 · Past Conferences Archive
* [ ] **IDMC-EVT-08-AC-01** Past conferences section on public website.
* [ ] **IDMC-EVT-08-AC-02** Archive shows: year, theme, photo gallery.
* [ ] **IDMC-EVT-08-AC-03** Past conference detail page with speakers and highlights.
* [ ] **IDMC-EVT-08-AC-04** Admin can archive a completed conference.
* [ ] **IDMC-EVT-08-AC-05** Archived conferences remain viewable but not editable.
* [ ] **IDMC-EVT-08-AC-06** Photo gallery upload for archived conferences.
* [ ] **IDMC-EVT-08-AC-07** Video links (YouTube) for recorded sessions.

### IDMC-EVT-09 · Attendee Management
* [ ] **IDMC-EVT-09-AC-01** Attendee list with search and filters.
* [ ] **IDMC-EVT-09-AC-02** Filter by: status, ticket type, category, workshop track.
* [ ] **IDMC-EVT-09-AC-03** Attendee detail view with all registration info.
* [ ] **IDMC-EVT-09-AC-04** Edit attendee information.
* [ ] **IDMC-EVT-09-AC-05** Change registration status (pending → confirmed → cancelled).
* [ ] **IDMC-EVT-09-AC-06** Payment verification with notes field.
* [ ] **IDMC-EVT-09-AC-07** Resend confirmation email action.
* [ ] **IDMC-EVT-09-AC-08** Export attendee list to CSV/Excel.
* [ ] **IDMC-EVT-09-AC-09** Bulk actions (confirm multiple, export selected).
* [ ] **IDMC-EVT-09-AC-10** Registration notes/comments for internal use.

### IDMC-EVT-10 · Check-in & Access Control
* [ ] **IDMC-EVT-10-AC-01** Check-in page with QR scanner.
* [ ] **IDMC-EVT-10-AC-02** QR code contains registration ID for validation.
* [ ] **IDMC-EVT-10-AC-03** Manual search by name or registration ID.
* [ ] **IDMC-EVT-10-AC-04** Check-in confirmation shows attendee photo (if uploaded) and name.
* [ ] **IDMC-EVT-10-AC-05** Prevent duplicate check-in with warning.
* [ ] **IDMC-EVT-10-AC-06** Real-time check-in counter on dashboard.
* [ ] **IDMC-EVT-10-AC-07** Check-in timestamp recorded.
* [ ] **IDMC-EVT-10-AC-08** Check-in history viewable per attendee.
* [ ] **IDMC-EVT-10-AC-09** Badge printing integration (future enhancement).
* [ ] **IDMC-EVT-10-AC-10** Offline check-in capability with sync (future enhancement).

* * *

## Edge Cases
* **Registration after deadline:** Form disabled with message "Registration has closed."
* **Sold out conference:** Display "Sold Out" with waitlist option (future).
* **Student without proof:** Registration held as "pending_verification" until proof provided.
* **Duplicate registration attempt:** Error message with link to existing registration status.
* **Payment not received by deadline:** Auto-reminder email, then auto-cancel after grace period.
* **Speaker cancellation:** Admin can reassign or mark session as "Speaker TBA".
* **Workshop over capacity:** Waitlist or redirect to alternative workshop.
* **Check-in for unconfirmed registration:** Warning displayed, option to verify on-site.
* **Network issues during check-in:** Queue locally, sync when connection restored.
* **Multiple device check-in:** Prevent race conditions with database transactions.

* * *

## Data Model

### Firestore Collections

#### `conferences/{conferenceId}`
```typescript
{
  conferenceId: string;              // IDMC-2025
  year: number;                      // 2025
  theme: string;                     // "All In For Jesus And His Kingdom"
  tagline?: string;                  // "1 5 – 6 September 2025"

  // Dates
  startDate: Timestamp;
  endDate: Timestamp;
  registrationOpenDate: Timestamp;
  registrationCloseDate: Timestamp;

  // Venue
  venue: {
    name: string;                    // "Singapore EXPO Hall 1"
    address: string;
    mapUrl?: string;
    coordinates?: { lat: number; lng: number };
  };

  // Pricing Tiers
  pricingTiers: Array<{
    tierId: string;
    name: string;                    // "Super Early Bird", "Early Bird", "Regular"
    startDate: Timestamp;
    endDate: Timestamp;
    prices: {
      regular: number;               // 170, 210, 290
      student: number;               // 50, 60, 60
      nsf: number;                   // 50, 60, 60
    };
  }>;

  // Branding
  bannerImageUrl?: string;
  logoUrl?: string;
  primaryColor?: string;

  // Status
  status: "draft" | "published" | "archived";

  // Statistics (denormalized for performance)
  stats: {
    totalRegistrations: number;
    confirmedRegistrations: number;
    checkedIn: number;
    totalRevenue: number;
  };

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}
```

#### `speakers/{speakerId}`
```typescript
{
  speakerId: string;                 // Auto-generated
  conferenceId: string;              // Reference to conference

  // Profile
  name: string;
  title: string;                     // "Senior Pastor", "Leadership Mentor"
  organization: string;              // "Covenant Evangelical Free Church"
  bio: string;                       // Rich text HTML
  photoUrl?: string;

  // Social/Contact
  email?: string;
  socialLinks?: {
    website?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };

  // Display
  order: number;                     // For custom ordering
  featured: boolean;                 // Show on landing page
  status: "draft" | "published";

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `sessions/{sessionId}`
```typescript
{
  sessionId: string;                 // Auto-generated
  conferenceId: string;

  // Schedule
  day: number;                       // 1, 2
  startTime: Timestamp;
  endTime: Timestamp;

  // Content
  title: string;                     // "All In BY… (Power of the Word & Holy Spirit)"
  description?: string;              // Rich text
  sessionType: "plenary" | "workshop" | "break" | "registration" | "worship" | "lunch" | "other";

  // Location
  venue: string;                     // "Hall 1", "Peridot Room", "Garnet Room"

  // Workshop specific
  track?: string;                    // "Track 1", "Track 2"
  category?: string;                 // "Missions", "Marketplace", "Social Justice", "Media Influence"
  capacity?: number;
  registeredCount?: number;

  // Speakers (for plenary/workshop)
  speakerIds: string[];
  speakerNames: string[];            // Denormalized

  // Display
  order: number;
  status: "draft" | "published";

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `registrations/{registrationId}`
```typescript
{
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
  ticketType: string;                // "super_early_bird", "early_bird", "regular"
  category: "regular" | "student" | "nsf";
  amount: number;                    // Actual amount to pay
  proofDocumentUrl?: string;         // For student/NSF verification

  // Workshop Preferences
  workshopSelections: Array<{
    sessionId: string;
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
    method: "paynow" | "bank_transfer" | "cash" | "other";
    referenceNumber?: string;
    verifiedAt?: Timestamp;
    verifiedBy?: string;
    notes?: string;
  };

  // Check-in
  checkedIn: boolean;
  checkedInAt?: Timestamp;
  checkedInBy?: string;

  // QR Code
  qrCode: string;                    // Generated QR data

  // Communication
  confirmationEmailSent: boolean;
  ticketEmailSent: boolean;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  ipAddress?: string;
  userAgent?: string;
}
```

#### `faq/{faqId}`
```typescript
{
  faqId: string;
  conferenceId: string;

  question: string;
  answer: string;                    // Rich text HTML
  category: "registration" | "payment" | "venue" | "accommodation" | "general";

  order: number;
  status: "draft" | "published";

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `admins/{adminId}`
```typescript
{
  adminId: string;                   // Firebase Auth UID
  email: string;
  displayName: string;
  role: "superadmin" | "admin" | "volunteer";

  permissions: {
    manageConference: boolean;
    manageSpeakers: boolean;
    manageSchedule: boolean;
    manageRegistrations: boolean;
    manageCheckIn: boolean;
    viewAnalytics: boolean;
  };

  status: "active" | "inactive";

  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
}
```

#### `activityLogs/{logId}`
```typescript
{
  logId: string;
  conferenceId: string;

  action: string;                    // "registration.created", "payment.verified", "checkin.completed"
  entityType: string;                // "registration", "speaker", "session"
  entityId: string;

  performedBy: string;               // Admin UID
  performedByName: string;

  details: Record<string, any>;      // Action-specific data

  createdAt: Timestamp;
}
```

* * *

## Backend Implementation

### Cloud Functions

#### `createRegistration`
```typescript
/**
 * createRegistration (HTTPS Callable)
 * Purpose: Create a new conference registration
 * Inputs: { conferenceId, attendee, category, workshopSelections, specialRequirements }
 * Outputs: { ok: true, registrationId: string, amount: number }
 * Security: Public (rate limited)
 *
 * @satisfies IDMC-EVT-02-AC-01 - Registration form captures attendee info
 * @satisfies IDMC-EVT-02-AC-08 - Registration ID auto-generated
 * @satisfies IDMC-EVT-02-AC-12 - Duplicate email prevention
 */
export const createRegistration = onCall(async (request) => {
  // 1. Validate conference exists and registration is open
  // 2. Check for duplicate email
  // 3. Determine current pricing tier
  // 4. Calculate amount based on category
  // 5. Generate registration ID (REG-YYYY-NNNNN)
  // 6. Generate QR code
  // 7. Create registration document
  // 8. Send confirmation email with payment instructions
  // 9. Update conference stats
  // 10. Return registration details
});
```

#### `verifyPayment`
```typescript
/**
 * verifyPayment (HTTPS Callable)
 * Purpose: Admin verifies payment and confirms registration
 * Inputs: { registrationId, paymentMethod, referenceNumber, notes }
 * Outputs: { ok: true }
 * Security: Admin only
 *
 * @satisfies IDMC-EVT-09-AC-05 - Change registration status
 * @satisfies IDMC-EVT-09-AC-06 - Payment verification with notes
 */
export const verifyPayment = onCall(async (request) => {
  // 1. Validate admin permissions
  // 2. Update registration status to "confirmed"
  // 3. Record payment details
  // 4. Send ticket email with QR code
  // 5. Update conference stats
  // 6. Log activity
});
```

#### `checkInAttendee`
```typescript
/**
 * checkInAttendee (HTTPS Callable)
 * Purpose: Check in attendee at conference
 * Inputs: { registrationId } or { qrCode }
 * Outputs: { ok: true, attendee: {...} }
 * Security: Admin/Volunteer only
 *
 * @satisfies IDMC-EVT-10-AC-01 - Check-in with QR scanner
 * @satisfies IDMC-EVT-10-AC-05 - Prevent duplicate check-in
 * @satisfies IDMC-EVT-10-AC-07 - Check-in timestamp recorded
 */
export const checkInAttendee = onCall(async (request) => {
  // 1. Validate admin/volunteer permissions
  // 2. Find registration by ID or QR code
  // 3. Validate registration is confirmed
  // 4. Check if already checked in (warn if duplicate)
  // 5. Update checkedIn status and timestamp
  // 6. Update conference stats
  // 7. Log activity
  // 8. Return attendee details for confirmation display
});
```

#### `getConferenceStats`
```typescript
/**
 * getConferenceStats (HTTPS Callable)
 * Purpose: Get dashboard statistics
 * Inputs: { conferenceId }
 * Outputs: { ok: true, stats: {...} }
 * Security: Admin only
 *
 * @satisfies IDMC-EVT-07-AC-02 - Dashboard with key metrics
 * @satisfies IDMC-EVT-07-AC-03 - Quick stats cards
 */
export const getConferenceStats = onCall(async (request) => {
  // 1. Validate admin permissions
  // 2. Get conference document with stats
  // 3. Calculate additional metrics (by category, by day, trends)
  // 4. Return comprehensive stats object
});
```

#### `sendReminderEmails` (Scheduled Function)
```typescript
/**
 * sendReminderEmails (Scheduled)
 * Purpose: Send payment reminders for pending registrations
 * Runs: Daily at 9 AM
 *
 * @satisfies IDMC-EVT-02-AC-09 - Email communications
 */
export const sendReminderEmails = onSchedule("every day 09:00", async () => {
  // 1. Query registrations with status "pending_payment" older than 3 days
  // 2. Send reminder email
  // 3. Mark reminder sent
  // 4. Auto-cancel after 7 days if still unpaid
});
```

* * *

## Frontend Implementation

### Public Website Pages

#### Landing Page (`/`)
- Hero section with conference theme and dates
- Countdown timer to conference
- Featured speakers carousel
- Quick schedule highlights
- Pricing tiers with CTA buttons
- About IDMC section
- Testimonials/past highlights
- Footer with contact and links

#### Speakers Page (`/speakers`)
- Speaker grid with photos
- Click to expand bio
- Filter by session type (optional)

#### Schedule Page (`/schedule`)
- Day tabs (Day 1, Day 2)
- Timeline view with session cards
- Color coding by session type
- Click for session details
- Speaker links

#### Workshops Page (`/workshops`)
- Workshop tracks overview
- Workshop cards with details
- Speaker and capacity info
- Track selection guidance

#### Registration Page (`/register`)
- Multi-step form
- Personal information
- Ticket selection
- Workshop preferences
- Payment information display
- Confirmation page

#### FAQ Page (`/faq`)
- Accordion sections by category
- Search functionality

#### Past Conferences Page (`/past-conferences`)
- Year cards with themes
- Photo galleries
- Video highlights

### Admin Dashboard Pages

#### Dashboard (`/admin`)
- Stats cards (registrations, revenue, check-ins)
- Registration trend chart
- Recent registrations table
- Quick actions

#### Registrations (`/admin/registrations`)
- Searchable, filterable table
- Status badges
- Quick actions (verify, edit, resend email)
- Export functionality

#### Speakers (`/admin/speakers`)
- Speaker list with photos
- Add/Edit speaker forms
- Drag-and-drop ordering

#### Schedule (`/admin/schedule`)
- Day-by-day view
- Session management
- Add/Edit session forms

#### Check-in (`/admin/checkin`)
- QR scanner
- Manual search
- Real-time counter
- Recent check-ins

#### Settings (`/admin/settings`)
- Conference configuration
- Pricing tiers
- Email templates
- User management

* * *

## Security & Permissions

### Firestore Security Rules
```typescript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Conferences - public read, admin write
    match /conferences/{conferenceId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Speakers - public read (published), admin write
    match /speakers/{speakerId} {
      allow read: if resource.data.status == 'published' || isAdmin();
      allow write: if isAdmin();
    }

    // Sessions - public read (published), admin write
    match /sessions/{sessionId} {
      allow read: if resource.data.status == 'published' || isAdmin();
      allow write: if isAdmin();
    }

    // Registrations - own read, admin full access
    match /registrations/{registrationId} {
      allow read: if request.auth != null &&
        (resource.data.attendee.email == request.auth.token.email || isAdmin());
      allow create: if true; // Public registration
      allow update, delete: if isAdmin();
    }

    // FAQ - public read, admin write
    match /faq/{faqId} {
      allow read: if resource.data.status == 'published' || isAdmin();
      allow write: if isAdmin();
    }

    // Admins - admin only
    match /admins/{adminId} {
      allow read, write: if isSuperAdmin();
    }

    // Activity Logs - admin read only
    match /activityLogs/{logId} {
      allow read: if isAdmin();
      allow write: if false; // Only via Cloud Functions
    }

    // Helper functions
    function isAdmin() {
      return request.auth != null &&
        exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    function isSuperAdmin() {
      return request.auth != null &&
        get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == 'superadmin';
    }
  }
}
```

* * *

## Metrics / Success
* **Registration conversion:** ≥ 60% of visitors who start registration complete it.
* **Payment confirmation rate:** ≥ 90% of registrations confirmed within 7 days.
* **Page load time:** ≤ 2 seconds for all public pages.
* **Check-in throughput:** ≥ 10 attendees per minute during peak.
* **System uptime:** 99.9% during registration and event periods.
* **Admin task completion:** Common tasks completable in ≤ 3 clicks.

* * *

## Rollout & Comms
* **Environments:** Dev → Staging → Prod. Feature flags per feature.
* **Soft launch:** Internal testing with committee members.
* **Public launch:** Announce via church networks and social media.
* **Training:** Admin training session for organizers.
* **Support:** FAQ page + contact form for inquiries.

* * *

## Risks / Assumptions
* **Payment verification:** Manual process; assumes admin availability for timely verification.
* **Email delivery:** Assumes email service configured; may need fallback notification method.
* **Capacity:** Firebase free tier may be insufficient for large conferences (2000+ attendees).
* **Check-in reliability:** Internet connectivity at venue assumed; offline mode future enhancement.
* **Browser support:** Modern browsers only; IE not supported.

* * *

## Links
* **Repository:** `idmc-gcfsm`
* **Firebase Project:** `idmc-gcfsm-dev`
* **Milestones in this epic:**
  * `IDMC-EVT-01 · Public Website & Landing Page`
  * `IDMC-EVT-02 · Registration & Ticketing`
  * `IDMC-EVT-03 · Speaker Management`
  * `IDMC-EVT-04 · Schedule & Sessions`
  * `IDMC-EVT-05 · Workshops & Tracks`
  * `IDMC-EVT-06 · FAQ & Information Pages`
  * `IDMC-EVT-07 · Admin Dashboard`
  * `IDMC-EVT-08 · Past Conferences Archive`
  * `IDMC-EVT-09 · Attendee Management`
  * `IDMC-EVT-10 · Check-in & Access Control`

* * *

## Test Data / Seed (for QA)
* Seed 1 conference with:
  * **Conference:** IDMC 2025 "All In For Jesus And His Kingdom"
  * **Dates:** September 5-6, 2025
  * **Venue:** Singapore EXPO Hall 1
  * **Pricing Tiers:**
    * Super Early Bird: $170 Regular / $50 Student (Sep 5, 2024 – Sep 7, 2025)
    * Early Bird: $210 Regular / $60 Student (Sep 8, 2025 – Jan 31, 2026)
    * Regular: $290 Regular / $60 Student (Feb 1, 2026+)
  * **Speakers:**
    * Rev Edmund Chan (Leadership Mentor)
    * Rev Tony Yeo (Senior Pastor, CEFC)
    * Rev Tan Kay Kiong
    * Rui En (Guest Speaker)
    * Timothy Yeo (Pastor)
  * **Sessions (Day 1):**
    * 07:30 - Registration Opens
    * 09:00 - Opening Worship
    * 10:00 - Plenary 1: "All In FOR…"
    * 12:00 - Lunch
    * 14:00 - Workshop Track 1 & 2
    * 16:00 - Plenary 2
    * 19:00 - Special Session: Voices of My Generation
  * **Sessions (Day 2):**
    * 09:00 - Opening Worship
    * 09:30 - Plenary 4: "All In BY…"
    * 12:15 - Plenary 5: Panel Discussion
    * 14:00 - Workshop 3 & 4
    * 16:00 - Plenary 6: "All In UNTIL…"
    * 17:30 - Closing Worship
  * **Workshops:**
    * Mental Wellness (Hall 1)
    * Sexual Wholeness (Garnet Room)
    * God in the Marketplace
    * Missions
  * **Registrations (Test):**
    * 5 confirmed registrations (various categories)
    * 3 pending payment registrations
    * 1 cancelled registration
  * **FAQ Items:** 10 items across all categories

* * *

## Workflow Flows

### Flow 1: Registration & Payment Verification

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    REGISTRATION & PAYMENT FLOW                           │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │   Attendee   │
    │ Visits Site  │
    └──────┬───────┘
           │
           ▼
    ┌──────────────────────────────────────┐
    │         Click "Register Now"          │
    └──────────────┬───────────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────────┐
    │         Registration Form             │
    │  • Personal Info (name, email, etc.)  │
    │  • Category (Regular/Student/NSF)     │
    │  • Workshop Track Selection           │
    │  • Special Requirements               │
    └──────────────┬───────────────────────┘
                   │
                   ▼
           ┌───────────────┐
           │  Validation   │
           └───────┬───────┘
                   │
       ┌───────────┴───────────┐
       │ Invalid               │ Valid
       ▼                       ▼
┌─────────────┐         ┌─────────────────────┐
│ Show Errors │         │ createRegistration()│
│ Fix & Retry │         └──────────┬──────────┘
└─────────────┘                    │
                                   ▼
                    ┌──────────────────────────┐
                    │ Generate:                │
                    │ • Registration ID        │
                    │ • QR Code                │
                    │ • Calculate Amount       │
                    └───────────┬──────────────┘
                                │
                                ▼
                    ┌──────────────────────────┐
                    │ Send Confirmation Email  │
                    │ with Payment Instructions│
                    └───────────┬──────────────┘
                                │
                                ▼
                    ┌──────────────────────────┐
                    │ Payment Instructions Page│
                    │ • Amount: $XXX           │
                    │ • PayNow QR Code         │
                    │ • Reference: REG-XXXX    │
                    └───────────┬──────────────┘
                                │
                                ▼
                    ┌──────────────────────────┐
                    │ Attendee Makes Payment   │
                    │ (External - PayNow/Bank) │
                    └───────────┬──────────────┘
                                │
                                ▼
                    ┌──────────────────────────┐
                    │ Admin Verifies Payment   │
                    │ in Dashboard             │
                    └───────────┬──────────────┘
                                │
                                ▼
                    ┌──────────────────────────┐
                    │ verifyPayment()          │
                    │ • Update status          │
                    │ • Record payment details │
                    └───────────┬──────────────┘
                                │
                                ▼
                    ┌──────────────────────────┐
                    │ Send Ticket Email        │
                    │ with QR Code Ticket      │
                    └──────────────────────────┘
```

### Flow 2: Check-in Process

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CHECK-IN FLOW (EVENT DAY)                             │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────────────┐
    │  Admin/Volunteer │
    │  Opens Check-in  │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────────────────────────┐
    │         Check-in Interface            │
    │  ┌─────────────┬─────────────────┐   │
    │  │ QR Scanner  │ Manual Search   │   │
    │  └─────────────┴─────────────────┘   │
    │  ┌─────────────────────────────────┐ │
    │  │ Stats: 150/500 Checked In      │ │
    │  └─────────────────────────────────┘ │
    └──────────────┬───────────────────────┘
                   │
       ┌───────────┴───────────┐
       │                       │
       ▼                       ▼
┌─────────────┐         ┌─────────────┐
│  QR Scan    │         │   Manual    │
│             │         │   Search    │
└──────┬──────┘         └──────┬──────┘
       │                       │
       ▼                       ▼
┌─────────────┐         ┌─────────────────┐
│ Decode QR   │         │ Enter Name or   │
│ Get Reg ID  │         │ Registration ID │
└──────┬──────┘         └────────┬────────┘
       │                         │
       └────────────┬────────────┘
                    │
                    ▼
           ┌────────────────┐
           │ Find Registration│
           └───────┬────────┘
                   │
       ┌───────────┴───────────┐
       │ Not Found             │ Found
       ▼                       ▼
┌─────────────┐         ┌─────────────────┐
│ Error:      │         │ Check Status    │
│ "Not Found" │         └────────┬────────┘
└─────────────┘                  │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
           ┌────────────────┐       ┌────────────────┐
           │ Not Confirmed  │       │   Confirmed    │
           └───────┬────────┘       └───────┬────────┘
                   │                        │
                   ▼                        ▼
           ┌────────────────┐       ┌────────────────┐
           │ Warning:       │       │ Already        │
           │ "Payment       │       │ Checked In?    │
           │  Pending"      │       └───────┬────────┘
           │ Allow override?│               │
           └────────────────┘       ┌───────┴───────┐
                                   │ Yes           │ No
                                   ▼               ▼
                           ┌───────────┐   ┌───────────────┐
                           │ Warning:  │   │ Show Attendee │
                           │ "Already  │   │ Confirmation  │
                           │ Checked   │   │ • Name        │
                           │ In"       │   │ • Photo       │
                           └───────────┘   │ • Category    │
                                           └───────┬───────┘
                                                   │
                                                   ▼
                                           ┌───────────────┐
                                           │ Click         │
                                           │ "Check In"    │
                                           └───────┬───────┘
                                                   │
                                                   ▼
                                           ┌───────────────┐
                                           │ checkInAttendee│
                                           │ • Set checked │
                                           │ • Timestamp   │
                                           │ • Update stats│
                                           └───────┬───────┘
                                                   │
                                                   ▼
                                           ┌───────────────┐
                                           │ Success!      │
                                           │ "Welcome,     │
                                           │  [Name]!"     │
                                           └───────────────┘
```

### Flow 3: Admin Content Management

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CONTENT MANAGEMENT FLOW                               │
└─────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────┐
                    │   Admin Login    │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │    Dashboard     │
                    │  ┌────────────┐  │
                    │  │ Stats      │  │
                    │  │ Charts     │  │
                    │  │ Actions    │  │
                    │  └────────────┘  │
                    └────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Speakers    │   │   Schedule    │   │  Workshops    │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ • Add Speaker │   │ • Add Session │   │ • Add Workshop│
│ • Edit Bio    │   │ • Set Time    │   │ • Set Track   │
│ • Upload Photo│   │ • Assign      │   │ • Set Capacity│
│ • Assign      │   │   Speaker     │   │ • Assign      │
│   Sessions    │   │ • Set Venue   │   │   Speaker     │
│ • Reorder     │   │               │   │               │
│ • Publish     │   │               │   │               │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
                   ┌────────────────┐
                   │ Save Changes   │
                   │ (Firestore)    │
                   └────────┬───────┘
                            │
                            ▼
                   ┌────────────────┐
                   │ Publish to     │
                   │ Public Site    │
                   └────────────────┘
```

### Flow 4: Registration Status Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    REGISTRATION STATUS LIFECYCLE                         │
└─────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────┐
    │ Form Submitted  │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ PENDING_PAYMENT │◄──────────────────────────────┐
    └────────┬────────┘                               │
             │                                        │
             ├─────────────────────┐                  │
             │                     │                  │
             ▼                     ▼                  │
    ┌─────────────────┐   ┌─────────────────┐        │
    │ Student/NSF     │   │ Regular         │        │
    │ Category        │   │ Category        │        │
    └────────┬────────┘   └────────┬────────┘        │
             │                     │                  │
             ▼                     │                  │
    ┌─────────────────┐            │                  │
    │ PENDING_        │            │                  │
    │ VERIFICATION    │            │                  │
    │ (proof needed)  │            │                  │
    └────────┬────────┘            │                  │
             │                     │                  │
             │ Proof Verified      │                  │
             └──────────┬──────────┘                  │
                        │                             │
                        ▼                             │
               ┌─────────────────┐                    │
               │ Payment         │                    │
               │ Received?       │                    │
               └────────┬────────┘                    │
                        │                             │
        ┌───────────────┴───────────────┐             │
        │ Yes                           │ No          │
        ▼                               ▼             │
┌─────────────────┐            ┌─────────────────┐   │
│   CONFIRMED     │            │ Reminder Email  │   │
│                 │            │ (Day 3)         │   │
│ • Ticket Sent   │            └────────┬────────┘   │
│ • QR Generated  │                     │            │
│ • Ready for     │                     ▼            │
│   Check-in      │            ┌─────────────────┐   │
└────────┬────────┘            │ Payment         │   │
         │                     │ Received?       │   │
         │                     └────────┬────────┘   │
         │                              │            │
         │              ┌───────────────┴──────┐     │
         │              │ Yes                  │ No  │
         │              │                      ▼     │
         │              │             ┌─────────────────┐
         │              │             │  Auto-Cancel    │
         │              │             │  (Day 7)        │
         │              │             └────────┬────────┘
         │              │                      │
         │              │                      ▼
         │              │             ┌─────────────────┐
         │              └────────────►│   CANCELLED     │
         │                            └─────────────────┘
         │
         │  Refund Requested
         ▼
┌─────────────────┐
│    REFUNDED     │
└─────────────────┘
```

### Flow 5: Conference Publishing

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CONFERENCE PUBLISHING FLOW                            │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────────────┐
    │  Create New      │
    │  Conference      │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │  Status: DRAFT   │
    │                  │
    │  • Basic Info    │
    │  • Dates         │
    │  • Venue         │
    │  • Pricing       │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────────────────────────┐
    │         Add Content                   │
    │  ┌──────────┬──────────┬──────────┐  │
    │  │ Speakers │ Schedule │ FAQ      │  │
    │  └──────────┴──────────┴──────────┘  │
    └──────────────┬───────────────────────┘
                   │
                   ▼
           ┌───────────────┐
           │ Ready to      │
           │ Publish?      │
           └───────┬───────┘
                   │
       ┌───────────┴───────────┐
       │ No                    │ Yes
       ▼                       ▼
┌─────────────┐         ┌─────────────────┐
│ Continue    │         │ Publish         │
│ Editing     │         │ Conference      │
└─────────────┘         └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │ Status:         │
                        │ PUBLISHED       │
                        │                 │
                        │ • Public site   │
                        │   shows content │
                        │ • Registration  │
                        │   enabled       │
                        └────────┬────────┘
                                 │
                                 │ After Event
                                 ▼
                        ┌─────────────────┐
                        │ Archive         │
                        │ Conference      │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │ Status:         │
                        │ ARCHIVED        │
                        │                 │
                        │ • Read-only     │
                        │ • Past conf     │
                        │   section       │
                        │ • No new        │
                        │   registrations │
                        └─────────────────┘
```

---

## Future Enhancements

### Phase 2
- [ ] Payment gateway integration (Stripe/PayNow API)
- [ ] Automated email sequences (reminders, pre-event info)
- [ ] Mobile-responsive admin dashboard
- [ ] Offline check-in with sync
- [ ] Badge printing integration

### Phase 3
- [ ] Live streaming integration
- [ ] Virtual attendance option
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Session feedback/ratings

### Phase 4
- [ ] Sponsor portal with analytics
- [ ] Volunteer management system
- [ ] Accommodation booking integration
- [ ] Transportation coordination
- [ ] AI-powered attendee matching/networking

* * *

## Changelog
* **v1.0.0 — 2025-12-12** - Initial epic creation with 10 milestones, comprehensive data models, and workflow flows.
