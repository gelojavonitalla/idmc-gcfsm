# IDMC-EVT-11 · Mobile Check-in App

## Product & QA Doc

### Summary
**Mobile check-in application** that enables volunteers and admins to scan attendee QR codes for fast event check-in. A lightweight, purpose-built mobile app focused on QR scanning with offline capability and real-time sync.

**Target users:** Volunteers (primary), Admin (secondary).

---

## Goals
* Provide **native mobile QR scanning** for optimal performance.
* Enable **fast check-in** (< 3 seconds per attendee).
* Support **offline mode** with automatic sync when connected.
* Display **attendee verification** details after scan.
* Show **real-time check-in statistics**.
* Support **multiple devices** at check-in stations.

## Non-Goals
* Full admin dashboard functionality.
* Registration or payment features.
* Speaker or schedule management.
* Attendee self-service features.
* Badge printing from mobile.

---

## Scope

### In
* **QR code scanner** using device camera.
* **Attendee data display** after successful scan.
* **Check-in confirmation** action.
* **Offline queue** for check-ins without connectivity.
* **Auto-sync** when connection restored.
* **Manual search** fallback by name/ID.
* **Check-in counter** with real-time stats.
* **Recent check-ins** history.
* **Volunteer authentication** (simple login).
* **Sound/haptic feedback** for scan results.

### Out
* Full attendee management.
* Registration editing.
* Payment processing.
* Content management.
* Push notifications.
* Multi-conference switching.

---

## User Stories

* As a **volunteer**, I can log in with my credentials.
* As a **volunteer**, I can scan an attendee's QR code quickly.
* As a **volunteer**, I can see the attendee's name and details after scanning.
* As a **volunteer**, I can confirm the check-in with one tap.
* As a **volunteer**, I can check in attendees even without internet.
* As a **volunteer**, I can search for an attendee manually if QR fails.
* As a **volunteer**, I can see how many attendees have checked in.
* As a **volunteer**, I get audio/haptic feedback on successful scan.
* As a **volunteer**, I am warned if an attendee is already checked in.
* As an **admin**, I can see check-ins from all devices in real-time.

---

## Flows & States

### A) App Launch & Login Flow
1. Volunteer opens mobile app.
2. Login screen displays.
3. Volunteer enters email and password.
4. System validates credentials.
5. On success: Scanner screen loads.
6. On failure: Error message displayed.
7. Session persists until logout.

### B) QR Scan Check-in Flow
1. Scanner screen active with camera viewfinder.
2. Volunteer points camera at attendee's QR code.
3. QR code detected and decoded.
4. Attendee data fetched (local cache or API).
5. Attendee card displays with details.
6. Volunteer taps "Check In" button.
7. Check-in recorded (local + sync to server).
8. Success feedback (sound + haptic + visual).
9. Scanner ready for next attendee.

### C) Offline Check-in Flow
1. Device loses internet connection.
2. "Offline Mode" indicator appears.
3. Volunteer scans QR code.
4. Attendee data retrieved from local cache.
5. Check-in recorded in local queue.
6. Success shown with "Pending Sync" badge.
7. Connection restored.
8. Queued check-ins sync automatically.
9. Sync complete notification shown.

### D) Manual Search Flow
1. Volunteer taps "Search" button.
2. Search screen opens.
3. Volunteer enters name or registration ID.
4. Results displayed from local cache.
5. Volunteer selects correct attendee.
6. Attendee card displays.
7. Volunteer taps "Check In".
8. Check-in recorded.

### E) Duplicate Check-in Flow
1. Volunteer scans QR code.
2. System detects attendee already checked in.
3. Warning screen displays:
   - "Already Checked In"
   - Previous check-in time
   - Check-in location (if available)
4. Volunteer dismisses warning.
5. No duplicate record created.
6. Scanner ready for next attendee.

---

## Acceptance Criteria (QA)

### IDMC-EVT-11-AC · Authentication
* [ ] **IDMC-EVT-11-AC-01** Login screen with email and password fields.
* [ ] **IDMC-EVT-11-AC-02** Form validation for required fields.
* [ ] **IDMC-EVT-11-AC-03** Invalid credentials show error message.
* [ ] **IDMC-EVT-11-AC-04** Successful login navigates to scanner.
* [ ] **IDMC-EVT-11-AC-05** Session token stored securely.
* [ ] **IDMC-EVT-11-AC-06** Auto-login if valid session exists.
* [ ] **IDMC-EVT-11-AC-07** Logout button clears session.
* [ ] **IDMC-EVT-11-AC-08** Only volunteer/admin roles can login.

### IDMC-EVT-11-AC · QR Scanner
* [ ] **IDMC-EVT-11-AC-09** Camera viewfinder displays on scanner screen.
* [ ] **IDMC-EVT-11-AC-10** Camera permission requested on first use.
* [ ] **IDMC-EVT-11-AC-11** Permission denied shows helpful message.
* [ ] **IDMC-EVT-11-AC-12** QR code detection within 1 second.
* [ ] **IDMC-EVT-11-AC-13** Scan frame highlights on detection.
* [ ] **IDMC-EVT-11-AC-14** Flashlight toggle button available.
* [ ] **IDMC-EVT-11-AC-15** Camera switch (front/back) available.
* [ ] **IDMC-EVT-11-AC-16** Invalid QR shows error with retry option.
* [ ] **IDMC-EVT-11-AC-17** Scanner auto-resumes after check-in.
* [ ] **IDMC-EVT-11-AC-18** Works in various lighting conditions.

### IDMC-EVT-11-AC · Attendee Verification
* [ ] **IDMC-EVT-11-AC-19** Attendee card displays after valid scan.
* [ ] **IDMC-EVT-11-AC-20** Card shows attendee full name.
* [ ] **IDMC-EVT-11-AC-21** Card shows registration ID.
* [ ] **IDMC-EVT-11-AC-22** Card shows ticket category (Regular/Student/NSF).
* [ ] **IDMC-EVT-11-AC-23** Card shows registration status.
* [ ] **IDMC-EVT-11-AC-24** Card shows church/organization.
* [ ] **IDMC-EVT-11-AC-25** Card shows workshop selections.
* [ ] **IDMC-EVT-11-AC-26** Large "Check In" button visible.
* [ ] **IDMC-EVT-11-AC-27** "Cancel" button to dismiss without action.
* [ ] **IDMC-EVT-11-AC-28** Status badge color-coded (confirmed=green, pending=yellow).

### IDMC-EVT-11-AC · Check-in Action
* [ ] **IDMC-EVT-11-AC-29** Tap "Check In" triggers check-in.
* [ ] **IDMC-EVT-11-AC-30** Loading indicator during processing.
* [ ] **IDMC-EVT-11-AC-31** Success sound plays on check-in.
* [ ] **IDMC-EVT-11-AC-32** Success haptic feedback (vibration).
* [ ] **IDMC-EVT-11-AC-33** Success visual animation (checkmark).
* [ ] **IDMC-EVT-11-AC-34** Check-in timestamp recorded.
* [ ] **IDMC-EVT-11-AC-35** Device ID recorded for tracking.
* [ ] **IDMC-EVT-11-AC-36** Auto-return to scanner after 2 seconds.

### IDMC-EVT-11-AC · Duplicate Prevention
* [ ] **IDMC-EVT-11-AC-37** Already checked-in detected instantly.
* [ ] **IDMC-EVT-11-AC-38** Warning sound plays (different from success).
* [ ] **IDMC-EVT-11-AC-39** Warning screen with red/orange theme.
* [ ] **IDMC-EVT-11-AC-40** Shows "Already Checked In" message.
* [ ] **IDMC-EVT-11-AC-41** Shows previous check-in timestamp.
* [ ] **IDMC-EVT-11-AC-42** "Dismiss" button returns to scanner.
* [ ] **IDMC-EVT-11-AC-43** No duplicate record created.

### IDMC-EVT-11-AC · Status Handling
* [ ] **IDMC-EVT-11-AC-44** Confirmed status: Normal check-in flow.
* [ ] **IDMC-EVT-11-AC-45** Pending payment: Warning with "Payment Pending" message.
* [ ] **IDMC-EVT-11-AC-46** Pending payment: Option to check in anyway (admin only).
* [ ] **IDMC-EVT-11-AC-47** Cancelled status: Blocked with "Registration Cancelled" error.
* [ ] **IDMC-EVT-11-AC-48** Unknown registration: "Not Found" error with manual search prompt.

### IDMC-EVT-11-AC · Offline Mode
* [ ] **IDMC-EVT-11-AC-49** Offline indicator when no connection.
* [ ] **IDMC-EVT-11-AC-50** Attendee data cached locally on login.
* [ ] **IDMC-EVT-11-AC-51** Scan works with cached data offline.
* [ ] **IDMC-EVT-11-AC-52** Check-ins queued locally when offline.
* [ ] **IDMC-EVT-11-AC-53** Queue count displayed (e.g., "3 pending sync").
* [ ] **IDMC-EVT-11-AC-54** Auto-sync when connection restored.
* [ ] **IDMC-EVT-11-AC-55** Manual "Sync Now" button available.
* [ ] **IDMC-EVT-11-AC-56** Sync progress indicator.
* [ ] **IDMC-EVT-11-AC-57** Sync complete notification.
* [ ] **IDMC-EVT-11-AC-58** Conflict resolution (server wins).

### IDMC-EVT-11-AC · Manual Search
* [ ] **IDMC-EVT-11-AC-59** Search button on scanner screen.
* [ ] **IDMC-EVT-11-AC-60** Search by name (first or last).
* [ ] **IDMC-EVT-11-AC-61** Search by registration ID.
* [ ] **IDMC-EVT-11-AC-62** Search by email.
* [ ] **IDMC-EVT-11-AC-63** Search works offline (local cache).
* [ ] **IDMC-EVT-11-AC-64** Results list with name and reg ID.
* [ ] **IDMC-EVT-11-AC-65** Tap result shows attendee card.
* [ ] **IDMC-EVT-11-AC-66** "No results" message if not found.

### IDMC-EVT-11-AC · Statistics & Counter
* [ ] **IDMC-EVT-11-AC-67** Check-in counter on main screen.
* [ ] **IDMC-EVT-11-AC-68** Format: "X / Y Checked In".
* [ ] **IDMC-EVT-11-AC-69** Counter updates in real-time (when online).
* [ ] **IDMC-EVT-11-AC-70** Progress percentage shown.
* [ ] **IDMC-EVT-11-AC-71** Counter visible without blocking scanner.

### IDMC-EVT-11-AC · Recent Check-ins
* [ ] **IDMC-EVT-11-AC-72** Recent check-ins accessible from menu.
* [ ] **IDMC-EVT-11-AC-73** Shows last 20 check-ins from this device.
* [ ] **IDMC-EVT-11-AC-74** Each entry shows name and time.
* [ ] **IDMC-EVT-11-AC-75** Pending sync items marked.
* [ ] **IDMC-EVT-11-AC-76** Tap entry shows full attendee details.

### IDMC-EVT-11-AC · Settings & Profile
* [ ] **IDMC-EVT-11-AC-77** Settings accessible from menu.
* [ ] **IDMC-EVT-11-AC-78** Sound toggle (on/off).
* [ ] **IDMC-EVT-11-AC-79** Haptic feedback toggle (on/off).
* [ ] **IDMC-EVT-11-AC-80** Auto-flash in low light toggle.
* [ ] **IDMC-EVT-11-AC-81** Cache refresh button.
* [ ] **IDMC-EVT-11-AC-82** App version displayed.
* [ ] **IDMC-EVT-11-AC-83** Logged-in user info displayed.
* [ ] **IDMC-EVT-11-AC-84** Logout button.

### IDMC-EVT-11-AC · Performance
* [ ] **IDMC-EVT-11-AC-85** App launches in < 3 seconds.
* [ ] **IDMC-EVT-11-AC-86** QR scan to result in < 1 second.
* [ ] **IDMC-EVT-11-AC-87** Check-in action completes in < 2 seconds.
* [ ] **IDMC-EVT-11-AC-88** App runs smoothly on mid-range devices.
* [ ] **IDMC-EVT-11-AC-89** Battery efficient camera usage.
* [ ] **IDMC-EVT-11-AC-90** App size < 50MB.

---

## Technical Architecture

### Platform
* **Framework:** React Native (cross-platform iOS & Android)
* **Alternative:** Flutter or native Swift/Kotlin
* **State Management:** Redux or Zustand
* **Local Storage:** SQLite or AsyncStorage
* **Camera:** react-native-camera or expo-camera

### Data Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                     MOBILE APP ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Camera     │────►│  QR Decoder  │────►│  Lookup      │
│   Module     │     │              │     │  Service     │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                    ┌─────────────┴─────────────┐
                                    │                           │
                                    ▼                           ▼
                           ┌──────────────┐            ┌──────────────┐
                           │ Local Cache  │            │  Firebase    │
                           │  (SQLite)    │            │  API         │
                           └──────────────┘            └──────────────┘
                                    │                           │
                                    └─────────────┬─────────────┘
                                                  │
                                                  ▼
                                         ┌──────────────┐
                                         │  Attendee    │
                                         │  Display     │
                                         └──────────────┘
                                                  │
                                                  ▼
                                         ┌──────────────┐
                                         │  Check-in    │
                                         │  Action      │
                                         └──────────────┘
                                                  │
                                    ┌─────────────┴─────────────┐
                                    │                           │
                                    ▼                           ▼
                           ┌──────────────┐            ┌──────────────┐
                           │ Offline      │            │  Real-time   │
                           │ Queue        │───────────►│  Sync        │
                           └──────────────┘            └──────────────┘
```

### Offline Strategy
```typescript
// Sync Strategy
interface SyncStrategy {
  // On Login
  onLogin: {
    downloadAttendees: true,      // Cache all attendees
    downloadStats: true,          // Cache current stats
  };

  // On Check-in (Offline)
  onOfflineCheckIn: {
    saveToLocalQueue: true,
    markAsPendingSync: true,
  };

  // On Connection Restored
  onReconnect: {
    syncQueuedCheckIns: true,     // Push local check-ins
    pullLatestAttendees: true,    // Refresh cache
    pullLatestStats: true,        // Update counters
    resolveConflicts: 'server-wins',
  };
}
```

---

## Data Model

### Local Cache Schema
```typescript
// Local SQLite Tables

// attendees
interface CachedAttendee {
  registrationId: string;         // Primary key
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  church?: string;
  category: string;
  ticketType: string;
  status: string;
  workshopSelections: string;     // JSON string
  checkedIn: boolean;
  checkedInAt?: string;
  qrData: string;                 // For offline lookup
  lastUpdated: string;
}

// check_in_queue
interface QueuedCheckIn {
  id: string;                     // Local UUID
  registrationId: string;
  checkedInAt: string;
  checkedInBy: string;
  deviceId: string;
  synced: boolean;
  syncedAt?: string;
  error?: string;
}

// app_settings
interface AppSettings {
  soundEnabled: boolean;
  hapticEnabled: boolean;
  autoFlash: boolean;
  lastCacheRefresh: string;
}
```

### API Endpoints
```typescript
// Authentication
POST /api/mobile/login
  Body: { email, password }
  Response: { token, user, conferenceId }

// Data Sync
GET /api/mobile/attendees
  Headers: { Authorization: Bearer <token> }
  Response: { attendees: Attendee[], lastUpdated: timestamp }

GET /api/mobile/stats
  Response: { total, checkedIn, byCategory }

// Check-in
POST /api/mobile/check-in
  Body: { registrationId, checkedInAt, deviceId }
  Response: { ok: true, attendee }

// Bulk Sync
POST /api/mobile/sync
  Body: { checkIns: QueuedCheckIn[] }
  Response: { synced: number, failed: FailedCheckIn[] }
```

---

## UI/UX Design

### Screen Flow
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Login     │────►│   Scanner   │────►│  Attendee   │
│   Screen    │     │   Screen    │     │   Card      │
└─────────────┘     └──────┬──────┘     └──────┬──────┘
                           │                   │
                    ┌──────┴──────┐            │
                    │             │            │
                    ▼             ▼            ▼
             ┌───────────┐ ┌───────────┐ ┌───────────┐
             │  Search   │ │  Recent   │ │  Success  │
             │  Screen   │ │  Check-ins│ │  Screen   │
             └───────────┘ └───────────┘ └───────────┘
                                               │
                                               ▼
                                        ┌───────────┐
                                        │  Scanner  │
                                        │  (return) │
                                        └───────────┘
```

### Scanner Screen Layout
```
┌─────────────────────────────────┐
│  ☰        IDMC Check-in    🔦   │  <- Header with menu & flash
├─────────────────────────────────┤
│                                 │
│    ┌───────────────────────┐    │
│    │                       │    │
│    │                       │    │
│    │    [ Camera View ]    │    │  <- QR Scanner viewport
│    │                       │    │
│    │    ┌─────────────┐    │    │
│    │    │   [ QR ]    │    │    │  <- Scan frame overlay
│    │    └─────────────┘    │    │
│    │                       │    │
│    └───────────────────────┘    │
│                                 │
│         Point camera at         │
│         attendee's QR code      │
│                                 │
├─────────────────────────────────┤
│  ┌─────────────────────────┐    │
│  │  🔍 Search Manually     │    │  <- Manual search button
│  └─────────────────────────┘    │
├─────────────────────────────────┤
│     ✓ 847 / 1,250 Checked In    │  <- Stats bar
│     ████████████░░░░░  68%      │
└─────────────────────────────────┘
```

### Attendee Card Layout
```
┌─────────────────────────────────┐
│           ✕ Close               │
├─────────────────────────────────┤
│                                 │
│         ┌─────────────┐         │
│         │   PHOTO     │         │  <- Profile photo (if available)
│         │  PLACEHOLDER│         │
│         └─────────────┘         │
│                                 │
│         JOHN DOE                │  <- Full name (large)
│         REG-2025-00123          │  <- Registration ID
│                                 │
│    ┌────────────────────────┐   │
│    │  ✓ CONFIRMED           │   │  <- Status badge (green)
│    └────────────────────────┘   │
│                                 │
│    Category:    Regular         │
│    Church:      Grace Baptist   │
│    Workshop:    Track 2 -       │
│                 Marketplace     │
│                                 │
├─────────────────────────────────┤
│                                 │
│    ┌─────────────────────────┐  │
│    │                         │  │
│    │      ✓ CHECK IN         │  │  <- Large check-in button
│    │                         │  │
│    └─────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

---

## Edge Cases
* **Camera permission denied:** Show settings link to enable.
* **QR code damaged/partial:** Show "Try again" with tips.
* **Very slow network:** Use optimistic UI, queue action.
* **App killed mid-check-in:** Recover from queue on restart.
* **Multiple devices same attendee:** First check-in wins, others warned.
* **Cache corrupted:** Force refresh with clear cache option.
* **Token expired:** Auto-redirect to login.
* **Device storage full:** Alert user, suggest clearing cache.

---

## Security Considerations
* **Authentication:** Firebase Auth or JWT tokens.
* **Token storage:** Secure keychain/keystore.
* **API calls:** HTTPS only.
* **Local data:** Encrypted SQLite (optional).
* **Session timeout:** Auto-logout after 8 hours inactivity.
* **Device binding:** Optional device registration.

---

## Metrics / Success
* **Scan success rate:** ≥ 98% first-scan success.
* **Check-in speed:** < 3 seconds total flow.
* **Offline reliability:** 100% check-ins synced.
* **App crashes:** < 0.1% crash rate.
* **Battery usage:** < 10% per hour active scanning.

---

## Test Scenarios
* **Happy path:** Scan confirmed attendee, check-in succeeds.
* **Duplicate:** Scan already checked-in attendee, warning shown.
* **Offline:** Scan without internet, queued and synced later.
* **Pending payment:** Scan pending attendee, warning with override.
* **Cancelled:** Scan cancelled attendee, blocked.
* **Invalid QR:** Scan non-ticket QR, error shown.
* **Search:** Manual search finds attendee, check-in succeeds.
* **Low battery:** App continues working efficiently.
* **Poor lighting:** Flashlight enables successful scan.

---

## Release Plan

### Phase 1 (MVP)
- [ ] Login/logout
- [ ] QR scanner
- [ ] Attendee display
- [ ] Check-in action
- [ ] Basic offline queue
- [ ] Manual search

### Phase 2
- [ ] Full offline mode with cache
- [ ] Real-time stats sync
- [ ] Recent check-ins history
- [ ] Settings screen
- [ ] Sound/haptic customization

### Phase 3
- [ ] Performance optimization
- [ ] Battery optimization
- [ ] Analytics integration
- [ ] Crash reporting
- [ ] App store deployment

---

## Links
* **Parent Epic:** [IDMC-EVT Event Management v1](./IDMC-EVT-Event-Management-v1.md)
* **Related:** [IDMC-EVT-10 Check-in & Access Control](./IDMC-EVT-10-Check-in-Access-Control.md)
* **Related:** [IDMC-EVT-02 Registration](./IDMC-EVT-02-Registration-Ticketing.md)

---

## Changelog
* **v1.0.0 — 2025-12-12** - Initial epic creation with 90 acceptance criteria.
