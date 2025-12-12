# IDMC-EVT-10 · Check-in & Access Control

## Product & QA Doc

### Summary
**Event day check-in system** that enables volunteers and admins to check in attendees using QR code scanning or manual lookup. Provides real-time statistics and attendance tracking for event operations.

**Target users:** Volunteers (primary), Admin (secondary).

---

## Goals
* Enable **QR code scanning** for fast check-in.
* Support **manual search** for attendees without QR code.
* Prevent **duplicate check-ins** with warnings.
* Display **real-time statistics** (checked-in count).
* Track **check-in timestamps** for reporting.
* Support **multiple check-in stations** simultaneously.

## Non-Goals
* Badge printing integration (separate system).
* Session-level attendance tracking.
* Access control hardware integration.
* Offline-first mode (requires connectivity for v1).

---

## Scope

### In
* **QR code scanner** interface.
* **Manual attendee search** by name or ID.
* **Check-in confirmation** with attendee details.
* **Duplicate check-in prevention** with warning.
* **Real-time check-in counter**.
* **Check-in history** per attendee.
* **Volunteer access** (limited admin role).
* **Check-in dashboard** with statistics.
* **Recent check-ins** list.

### Out
* Badge/name tag printing.
* Session check-in tracking.
* Hardware integration (turnstiles, scanners).
* Offline mode with sync.

---

## User Stories

* As a **volunteer**, I can scan an attendee's QR code to check them in.
* As a **volunteer**, I can search for an attendee by name if QR unavailable.
* As a **volunteer**, I can see the attendee's name and photo for verification.
* As a **volunteer**, I am warned if an attendee is already checked in.
* As a **volunteer**, I can see the real-time count of checked-in attendees.
* As an **admin**, I can view check-in statistics.
* As an **admin**, I can see the check-in timestamp for each attendee.
* As an **admin**, I can see recent check-ins in real-time.

---

## Flows & States

### A) QR Code Check-in Flow
1. Volunteer opens check-in page.
2. QR scanner activates (camera access).
3. Attendee presents ticket QR code.
4. Scanner reads QR code.
5. System validates registration ID.
6. If valid: Attendee info displayed.
7. Volunteer clicks "Check In".
8. System updates status and timestamp.
9. Success confirmation displayed.
10. Ready for next scan.

### B) Manual Search Check-in Flow
1. Volunteer opens check-in page.
2. Enters attendee name or registration ID.
3. Search results displayed.
4. Volunteer selects correct attendee.
5. Attendee info displayed.
6. Volunteer clicks "Check In".
7. System updates status.
8. Success confirmation displayed.

### C) Duplicate Check-in Flow
1. Volunteer scans QR code.
2. System detects already checked in.
3. Warning displayed: "Already checked in at [time]".
4. Volunteer can dismiss or view details.
5. No duplicate record created.

---

## Acceptance Criteria (QA)

### IDMC-EVT-10-AC · QR Scanner
* [ ] **IDMC-EVT-10-AC-01** Check-in page has QR scanner section.
* [ ] **IDMC-EVT-10-AC-02** Camera permission requested on first use.
* [ ] **IDMC-EVT-10-AC-03** Camera preview displayed.
* [ ] **IDMC-EVT-10-AC-04** QR code detection highlights frame.
* [ ] **IDMC-EVT-10-AC-05** Successful scan triggers audio feedback.
* [ ] **IDMC-EVT-10-AC-06** QR data validated (correct format).
* [ ] **IDMC-EVT-10-AC-07** Invalid QR shows error message.
* [ ] **IDMC-EVT-10-AC-08** Scanner continues after successful scan.
* [ ] **IDMC-EVT-10-AC-09** Camera toggle (front/back) on mobile.

### IDMC-EVT-10-AC · Manual Search
* [ ] **IDMC-EVT-10-AC-10** Search box below scanner.
* [ ] **IDMC-EVT-10-AC-11** Search by name (first or last).
* [ ] **IDMC-EVT-10-AC-12** Search by registration ID.
* [ ] **IDMC-EVT-10-AC-13** Search by email.
* [ ] **IDMC-EVT-10-AC-14** Results show matching attendees.
* [ ] **IDMC-EVT-10-AC-15** Results show name, reg ID, status.
* [ ] **IDMC-EVT-10-AC-16** Click result selects attendee.
* [ ] **IDMC-EVT-10-AC-17** "Not found" message if no results.

### IDMC-EVT-10-AC · Attendee Verification
* [ ] **IDMC-EVT-10-AC-18** Attendee card displays on scan/select.
* [ ] **IDMC-EVT-10-AC-19** Card shows attendee name.
* [ ] **IDMC-EVT-10-AC-20** Card shows registration ID.
* [ ] **IDMC-EVT-10-AC-21** Card shows ticket category.
* [ ] **IDMC-EVT-10-AC-22** Card shows registration status.
* [ ] **IDMC-EVT-10-AC-23** Card shows workshop selections.
* [ ] **IDMC-EVT-10-AC-24** "Check In" button prominent.
* [ ] **IDMC-EVT-10-AC-25** "Cancel" to dismiss without action.

### IDMC-EVT-10-AC · Check-in Action
* [ ] **IDMC-EVT-10-AC-26** Check-in button triggers action.
* [ ] **IDMC-EVT-10-AC-27** Loading state during processing.
* [ ] **IDMC-EVT-10-AC-28** Check-in timestamp recorded.
* [ ] **IDMC-EVT-10-AC-29** Check-in performed by recorded.
* [ ] **IDMC-EVT-10-AC-30** Success animation/message shown.
* [ ] **IDMC-EVT-10-AC-31** Counter increments in real-time.
* [ ] **IDMC-EVT-10-AC-32** Attendee added to recent check-ins.

### IDMC-EVT-10-AC · Duplicate Prevention
* [ ] **IDMC-EVT-10-AC-33** Already checked-in detected.
* [ ] **IDMC-EVT-10-AC-34** Warning banner displayed.
* [ ] **IDMC-EVT-10-AC-35** Previous check-in time shown.
* [ ] **IDMC-EVT-10-AC-36** "Check In" button disabled or hidden.
* [ ] **IDMC-EVT-10-AC-37** "Dismiss" button to clear screen.
* [ ] **IDMC-EVT-10-AC-38** No duplicate record created.

### IDMC-EVT-10-AC · Unconfirmed Registration Handling
* [ ] **IDMC-EVT-10-AC-39** Pending payment status detected.
* [ ] **IDMC-EVT-10-AC-40** Warning: "Payment not confirmed".
* [ ] **IDMC-EVT-10-AC-41** Option to check in anyway (admin only).
* [ ] **IDMC-EVT-10-AC-42** Cancelled registration blocked.
* [ ] **IDMC-EVT-10-AC-43** Clear error for cancelled: "Registration cancelled".

### IDMC-EVT-10-AC · Real-time Statistics
* [ ] **IDMC-EVT-10-AC-44** Check-in counter displayed.
* [ ] **IDMC-EVT-10-AC-45** Counter format: "X / Y Checked In".
* [ ] **IDMC-EVT-10-AC-46** Counter updates in real-time.
* [ ] **IDMC-EVT-10-AC-47** Percentage progress bar.
* [ ] **IDMC-EVT-10-AC-48** Stats visible on check-in page.

### IDMC-EVT-10-AC · Recent Check-ins
* [ ] **IDMC-EVT-10-AC-49** Recent check-ins list displayed.
* [ ] **IDMC-EVT-10-AC-50** Shows last 10 check-ins.
* [ ] **IDMC-EVT-10-AC-51** Each entry shows name and time.
* [ ] **IDMC-EVT-10-AC-52** List updates in real-time.
* [ ] **IDMC-EVT-10-AC-53** Click entry shows full details.

### IDMC-EVT-10-AC · Check-in Dashboard (Admin)
* [ ] **IDMC-EVT-10-AC-54** Dashboard shows total checked in.
* [ ] **IDMC-EVT-10-AC-55** Dashboard shows check-in by hour chart.
* [ ] **IDMC-EVT-10-AC-56** Dashboard shows check-in by category breakdown.
* [ ] **IDMC-EVT-10-AC-57** Export check-in report.
* [ ] **IDMC-EVT-10-AC-58** Filter checked-in attendees in list.

### IDMC-EVT-10-AC · Access Control
* [ ] **IDMC-EVT-10-AC-59** Volunteer role can access check-in page.
* [ ] **IDMC-EVT-10-AC-60** Volunteer cannot access other admin pages.
* [ ] **IDMC-EVT-10-AC-61** Admin can access all pages including check-in.
* [ ] **IDMC-EVT-10-AC-62** Check-in page requires authentication.

---

## Data Model

### Check-in Data (on Registration)
```typescript
// Part of registrations/{registrationId}
{
  checkedIn: boolean;
  checkedInAt?: Timestamp;
  checkedInBy?: string;
  checkedInByName?: string;
  checkInMethod?: "qr" | "manual";
}
```

### Check-in Log (for analytics)
```typescript
// checkInLogs/{logId}
interface CheckInLog {
  logId: string;
  conferenceId: string;
  registrationId: string;
  attendeeName: string;
  category: string;
  checkedInAt: Timestamp;
  checkedInBy: string;
  checkInMethod: "qr" | "manual";
  stationId?: string;
}
```

---

## Backend Implementation

### Cloud Functions

#### `checkInAttendee`
```typescript
/**
 * checkInAttendee (HTTPS Callable)
 * Purpose: Check in an attendee
 * Inputs: { registrationId, method: "qr" | "manual" }
 * Outputs: { ok: true, attendee, alreadyCheckedIn?, checkedInAt? }
 * Security: Admin or Volunteer role
 */
```

#### `getCheckInStats`
```typescript
/**
 * getCheckInStats (HTTPS Callable)
 * Purpose: Get real-time check-in statistics
 * Inputs: { conferenceId }
 * Outputs: { ok: true, total, checkedIn, byCategory, byHour }
 * Security: Admin or Volunteer role
 */
```

---

## Frontend Implementation

### Admin Pages
```
/src/pages/admin/
├── check-in/
│   └── index.tsx            # Check-in interface
└── reports/
    └── check-in.tsx         # Check-in analytics
```

### Components
```
/src/components/checkin/
├── QRScanner.tsx
├── ManualSearch.tsx
├── AttendeeCard.tsx
├── CheckInButton.tsx
├── DuplicateWarning.tsx
├── CheckInCounter.tsx
├── RecentCheckIns.tsx
├── CheckInStats.tsx
└── CheckInChart.tsx
```

---

## Edge Cases
* **Camera permission denied:** Show manual search, prompt to enable.
* **Poor lighting:** Provide flashlight toggle option.
* **Multiple stations:** Prevent race conditions with transactions.
* **Network interruption:** Queue locally, retry on reconnect.
* **Wrong QR code:** Clear error "Invalid ticket QR code".
* **Attendee not found:** Suggest checking registration status.

---

## Metrics / Success
* **Check-in speed:** < 5 seconds per attendee.
* **Scan success rate:** ≥ 95% first-scan success.
* **Queue time:** < 30 seconds wait during peak.
* **Throughput:** ≥ 10 check-ins per minute per station.

---

## Test Data / Seed
* **Check-in Scenarios:**
  - Confirmed attendee (normal flow)
  - Already checked-in attendee (duplicate warning)
  - Pending payment attendee (warning, override)
  - Cancelled attendee (blocked)
  - Invalid QR code (error)

---

## Links
* **Parent Epic:** [IDMC-EVT Event Management v1](./IDMC-EVT-Event-Management-v1.md)
* **Related:** [IDMC-EVT-02 Registration](./IDMC-EVT-02-Registration-Ticketing.md)
* **Related:** [IDMC-EVT-09 Attendee Management](./IDMC-EVT-09-Attendee-Management.md)

---

## Changelog
* **v1.0.0 — 2025-12-12** - Initial epic creation with 62 acceptance criteria.
