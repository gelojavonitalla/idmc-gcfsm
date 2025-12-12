# IDMC-EVT-04 · Schedule & Sessions

## Product & QA Doc

### Summary
**Conference schedule management system** that enables admins to create and manage the conference program including plenary sessions, workshops, breaks, and other activities. Provides a public schedule page with timeline view for attendees.

**Target users:** Admin (primary), Attendees (secondary).

---

## Goals
* Enable **admin CRUD operations** for sessions.
* Support **multiple session types** (plenary, workshop, break, registration, worship, lunch).
* Organize sessions by **day** (Day 1, Day 2).
* Assign **speakers** to sessions.
* Assign **venues/rooms** to sessions.
* Display **public schedule** with timeline view.
* Support **session filtering** by type, day, track.

## Non-Goals
* Personal schedule builder (attendee bookmarking).
* Session capacity management (handled by Workshops epic).
* Live session updates/notifications.
* Session recording/streaming integration.

---

## Scope

### In
* **Admin session CRUD** (create, read, update, delete).
* **Session types** with color coding.
* **Day-based organization** (Day 1, Day 2).
* **Time slot management** (start time, end time).
* **Speaker assignment** (single or multiple speakers).
* **Venue assignment** (room/hall).
* **Public schedule page** with timeline view.
* **Day tabs** for switching between days.
* **Session detail modal** with full information.
* **Draft/published status** for content staging.

### Out
* Drag-and-drop schedule builder.
* Conflict detection for venues.
* Attendee personal schedule/bookmarks.
* Session feedback/ratings.
* Calendar export (iCal).

---

## User Stories

* As an **admin**, I can create a new session with title, time, and type.
* As an **admin**, I can assign speakers to a session.
* As an **admin**, I can assign a venue/room to a session.
* As an **admin**, I can organize sessions by day.
* As an **admin**, I can set session status (draft/published).
* As an **attendee**, I can view the full conference schedule.
* As an **attendee**, I can switch between Day 1 and Day 2.
* As an **attendee**, I can filter sessions by type.
* As an **attendee**, I can click on a session to see details.
* As an **attendee**, I can see which speakers are presenting.

---

## Flows & States

### A) Create Session Flow (Admin)
1. Admin navigates to Admin → Schedule.
2. Selects day (Day 1 or Day 2).
3. Clicks "Add Session" button.
4. Session form opens with fields:
   - Title (required)
   - Description (rich text)
   - Session type (dropdown)
   - Day (Day 1/Day 2)
   - Start time (time picker)
   - End time (time picker)
   - Venue/Room (dropdown)
   - Speakers (multi-select)
   - Status (draft/published)
5. Admin fills in details.
6. Admin clicks "Save".
7. Session appears in schedule grid.

### B) View Schedule Flow (Public)
1. Attendee navigates to Schedule page.
2. Day 1 schedule loads by default.
3. Timeline shows sessions in chronological order.
4. Sessions color-coded by type.
5. Attendee clicks Day 2 tab to switch.
6. Attendee clicks on session card.
7. Session detail modal opens.

### C) Session Detail Flow (Public)
1. Attendee clicks on session card.
2. Modal opens with full details:
   - Title and description
   - Time and duration
   - Venue/room
   - Speaker(s) with photos
   - Session type badge
3. Attendee can click speaker to view profile.
4. Attendee closes modal to return to schedule.

---

## Acceptance Criteria (QA)

### IDMC-EVT-04-AC · Session Management
* [ ] **IDMC-EVT-04-AC-01** Admin can create new session.
* [ ] **IDMC-EVT-04-AC-02** Title field required (min 5 characters).
* [ ] **IDMC-EVT-04-AC-03** Description field supports rich text.
* [ ] **IDMC-EVT-04-AC-04** Session type dropdown with options: Plenary, Workshop, Break, Registration, Worship, Lunch, Other.
* [ ] **IDMC-EVT-04-AC-05** Day selector: Day 1, Day 2.
* [ ] **IDMC-EVT-04-AC-06** Start time picker (24-hour format).
* [ ] **IDMC-EVT-04-AC-07** End time picker (24-hour format).
* [ ] **IDMC-EVT-04-AC-08** Validation: end time must be after start time.
* [ ] **IDMC-EVT-04-AC-09** Venue dropdown shows available rooms.
* [ ] **IDMC-EVT-04-AC-10** Speaker multi-select shows published speakers.
* [ ] **IDMC-EVT-04-AC-11** Admin can edit existing session.
* [ ] **IDMC-EVT-04-AC-12** Admin can delete session (with confirmation).
* [ ] **IDMC-EVT-04-AC-13** Draft sessions hidden from public.
* [ ] **IDMC-EVT-04-AC-14** Published sessions visible publicly.

### IDMC-EVT-04-AC · Session Types & Styling
* [ ] **IDMC-EVT-04-AC-15** Plenary sessions: Primary color (blue).
* [ ] **IDMC-EVT-04-AC-16** Workshop sessions: Secondary color (green).
* [ ] **IDMC-EVT-04-AC-17** Break sessions: Neutral color (gray).
* [ ] **IDMC-EVT-04-AC-18** Registration sessions: Info color (light blue).
* [ ] **IDMC-EVT-04-AC-19** Worship sessions: Accent color (purple).
* [ ] **IDMC-EVT-04-AC-20** Lunch sessions: Neutral color (orange).
* [ ] **IDMC-EVT-04-AC-21** Type badge displayed on session card.

### IDMC-EVT-04-AC · Admin Schedule View
* [ ] **IDMC-EVT-04-AC-22** Schedule displays as list/grid by day.
* [ ] **IDMC-EVT-04-AC-23** Sessions sorted by start time.
* [ ] **IDMC-EVT-04-AC-24** Quick edit button on each session.
* [ ] **IDMC-EVT-04-AC-25** Delete button on each session.
* [ ] **IDMC-EVT-04-AC-26** Status badge (draft/published) visible.
* [ ] **IDMC-EVT-04-AC-27** Day tabs to switch between days.

### IDMC-EVT-04-AC · Public Schedule Page
* [ ] **IDMC-EVT-04-AC-28** Schedule page shows Day 1 by default.
* [ ] **IDMC-EVT-04-AC-29** Day tabs to switch between days.
* [ ] **IDMC-EVT-04-AC-30** Timeline view with sessions in order.
* [ ] **IDMC-EVT-04-AC-31** Session cards show: time, title, type, venue.
* [ ] **IDMC-EVT-04-AC-32** Speaker names shown on session cards.
* [ ] **IDMC-EVT-04-AC-33** Type filter dropdown.
* [ ] **IDMC-EVT-04-AC-34** Sessions color-coded by type.
* [ ] **IDMC-EVT-04-AC-35** Responsive layout (stacked on mobile).
* [ ] **IDMC-EVT-04-AC-36** Click session opens detail modal.

### IDMC-EVT-04-AC · Session Detail Modal
* [ ] **IDMC-EVT-04-AC-37** Modal shows full session title.
* [ ] **IDMC-EVT-04-AC-38** Modal shows full description.
* [ ] **IDMC-EVT-04-AC-39** Modal shows time and duration.
* [ ] **IDMC-EVT-04-AC-40** Modal shows venue/room.
* [ ] **IDMC-EVT-04-AC-41** Modal shows speaker(s) with photos.
* [ ] **IDMC-EVT-04-AC-42** Speaker clickable to view profile.
* [ ] **IDMC-EVT-04-AC-43** Close button/overlay click closes modal.

---

## Data Model

### Session Document
```typescript
// sessions/{sessionId}
interface Session {
  sessionId: string;
  conferenceId: string;

  // Content
  title: string;
  description?: string;              // Rich text HTML
  sessionType: "plenary" | "workshop" | "break" | "registration" | "worship" | "lunch" | "other";

  // Schedule
  day: 1 | 2;
  startTime: Timestamp;
  endTime: Timestamp;
  durationMinutes: number;           // Calculated

  // Location
  venue: string;                     // "Hall 1", "Peridot Room", etc.

  // Speakers
  speakerIds: string[];
  speakerNames: string[];            // Denormalized for display

  // Workshop specific (optional)
  track?: string;                    // "Track 1", "Track 2"
  category?: string;                 // Workshop category
  capacity?: number;

  // Display
  order: number;
  status: "draft" | "published";

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}
```

---

## Backend Implementation

### Cloud Functions

#### `createSession`
```typescript
/**
 * createSession (HTTPS Callable)
 * Purpose: Create a new session
 * Inputs: { conferenceId, title, sessionType, day, startTime, endTime, venue, speakerIds }
 * Outputs: { ok: true, sessionId }
 * Security: Admin only
 */
```

#### `updateSession`
```typescript
/**
 * updateSession (HTTPS Callable)
 * Purpose: Update session details
 * Inputs: { sessionId, ...updates }
 * Outputs: { ok: true }
 * Security: Admin only
 */
```

#### `getSchedule`
```typescript
/**
 * getSchedule (HTTPS Callable)
 * Purpose: Get all sessions for a conference
 * Inputs: { conferenceId, day? }
 * Outputs: { ok: true, sessions: [...] }
 * Security: Public (returns published only) or Admin (returns all)
 */
```

---

## Frontend Implementation

### Admin Pages
```
/src/pages/admin/
├── schedule/
│   ├── index.tsx            # Schedule overview
│   ├── new.tsx              # Add session form
│   └── [id].tsx             # Edit session form
```

### Public Pages
```
/src/pages/
├── schedule/
│   └── index.tsx            # Public schedule page
```

### Components
```
/src/components/schedule/
├── SessionForm.tsx
├── SessionCard.tsx
├── SessionDetail.tsx
├── ScheduleTimeline.tsx
├── DayTabs.tsx
├── TypeFilter.tsx
└── VenueSelector.tsx
```

---

## Edge Cases
* **Time overlap:** Warning shown but not blocked (same venue conflict).
* **Speaker not available:** Show info that speaker is in another session.
* **Empty day:** Show "No sessions scheduled" placeholder.
* **Long description:** Truncate in card, show full in modal.
* **Time zone:** All times in SGT (Singapore Time).
* **Session without speakers:** Valid for breaks, registration, lunch.

---

## Metrics / Success
* **Admin efficiency:** Session creation < 2 minutes.
* **Schedule accuracy:** 100% of sessions display correct times.
* **Page load:** Schedule page loads < 2 seconds.
* **Mobile usability:** Schedule readable on mobile devices.

---

## Test Data / Seed
* **Day 1 Sessions:**
  - 07:30 - Registration Opens (Registration)
  - 09:00 - Opening Worship (Worship)
  - 10:00 - Plenary 1: "All In FOR..." (Plenary)
  - 12:00 - Lunch (Lunch)
  - 14:00 - Workshop Track 1 & 2 (Workshop)
  - 16:00 - Plenary 2 (Plenary)
  - 19:00 - Special Session (Plenary)

* **Day 2 Sessions:**
  - 09:00 - Opening Worship (Worship)
  - 09:30 - Plenary 4: "All In BY..." (Plenary)
  - 12:15 - Plenary 5: Panel Discussion (Plenary)
  - 14:00 - Workshop 3 & 4 (Workshop)
  - 16:00 - Plenary 6: "All In UNTIL..." (Plenary)
  - 17:30 - Closing Worship (Worship)

---

## Links
* **Parent Epic:** [IDMC-EVT Event Management v1](./IDMC-EVT-Event-Management-v1.md)
* **Related:** [IDMC-EVT-03 Speaker Management](./IDMC-EVT-03-Speaker-Management.md)
* **Related:** [IDMC-EVT-05 Workshops & Tracks](./IDMC-EVT-05-Workshops-Tracks.md)

---

## Changelog
* **v1.0.0 — 2025-12-12** - Initial epic creation with 43 acceptance criteria.
