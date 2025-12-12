# IDMC-EVT-05 · Workshops & Tracks

## Product & QA Doc

### Summary
**Workshop track management system** that enables admins to organize workshops into tracks with capacity limits and allows attendees to select their preferred workshop tracks during registration. Supports multiple parallel tracks running simultaneously.

**Target users:** Admin (primary), Attendees (secondary).

---

## Goals
* Enable **track-based workshop organization** (Track 1, Track 2).
* Support **capacity management** for limited-seat workshops.
* Allow **attendee track selection** during registration.
* Display **workshop details** with speaker and capacity info.
* Track **workshop attendance** for planning.

## Non-Goals
* Real-time seat booking (selection during registration only).
* Workshop waitlist management.
* Workshop materials/resources distribution.
* Post-workshop feedback collection.

---

## Scope

### In
* **Workshop track organization** (Track 1, Track 2, etc.).
* **Workshop categories** (Missions, Marketplace, Social Justice, Media).
* **Capacity limits** per workshop.
* **Track selection** during registration.
* **Public workshops page** with track view.
* **Workshop detail view** with full information.
* **Capacity tracking** and display.
* **Admin workshop management** (linked to sessions).

### Out
* Real-time seat reservation.
* Waitlist functionality.
* Workshop materials upload.
* Attendance tracking during event.
* Workshop certificates.

---

## User Stories

* As an **admin**, I can organize workshops into tracks.
* As an **admin**, I can set capacity limits for workshops.
* As an **admin**, I can categorize workshops by topic.
* As an **admin**, I can view how many registrations per workshop.
* As an **attendee**, I can view all available workshops.
* As an **attendee**, I can see workshop topics and speakers.
* As an **attendee**, I can select my preferred track during registration.
* As an **attendee**, I can see remaining capacity for workshops.

---

## Flows & States

### A) Workshop Setup Flow (Admin)
1. Admin creates session with type "Workshop".
2. Admin assigns track (Track 1, Track 2).
3. Admin sets category (Missions, Marketplace, etc.).
4. Admin sets capacity limit.
5. Workshop appears in schedule and workshops page.

### B) Track Selection Flow (Attendee)
1. Attendee fills registration form.
2. Workshop selection section appears.
3. Attendee sees available workshop options by time slot.
4. Attendee selects preferred workshop per time slot.
5. Selection saved with registration.

### C) View Workshops Flow (Public)
1. Attendee navigates to Workshops page.
2. Page shows workshops organized by track.
3. Each workshop shows title, speaker, category, capacity.
4. Attendee can click for full details.

---

## Acceptance Criteria (QA)

### IDMC-EVT-05-AC · Workshop Configuration
* [ ] **IDMC-EVT-05-AC-01** Workshop sessions have track assignment (Track 1, Track 2).
* [ ] **IDMC-EVT-05-AC-02** Workshop sessions have category field.
* [ ] **IDMC-EVT-05-AC-03** Categories include: Missions, Marketplace, Social Justice, Media Influence, Mental Wellness, Sexual Wholeness.
* [ ] **IDMC-EVT-05-AC-04** Workshop sessions have capacity field.
* [ ] **IDMC-EVT-05-AC-05** Capacity is optional (unlimited if not set).
* [ ] **IDMC-EVT-05-AC-06** Track 1 is default/open access for all.
* [ ] **IDMC-EVT-05-AC-07** Track 2 requires pre-registration.

### IDMC-EVT-05-AC · Track Selection (Registration)
* [ ] **IDMC-EVT-05-AC-08** Registration form shows workshop selection section.
* [ ] **IDMC-EVT-05-AC-09** Workshops grouped by time slot.
* [ ] **IDMC-EVT-05-AC-10** Each slot shows available workshop options.
* [ ] **IDMC-EVT-05-AC-11** Attendee can select one workshop per time slot.
* [ ] **IDMC-EVT-05-AC-12** Selection shows workshop title and speaker.
* [ ] **IDMC-EVT-05-AC-13** Remaining capacity shown if limited.
* [ ] **IDMC-EVT-05-AC-14** Full workshops show "Full" badge.
* [ ] **IDMC-EVT-05-AC-15** Selection saved with registration.

### IDMC-EVT-05-AC · Public Workshops Page
* [ ] **IDMC-EVT-05-AC-16** Workshops page displays all published workshops.
* [ ] **IDMC-EVT-05-AC-17** Workshops organized by track (Track 1, Track 2).
* [ ] **IDMC-EVT-05-AC-18** Workshop cards show: title, speaker, category, time.
* [ ] **IDMC-EVT-05-AC-19** Category badge with color coding.
* [ ] **IDMC-EVT-05-AC-20** Capacity indicator (X/Y spots).
* [ ] **IDMC-EVT-05-AC-21** Filter by category.
* [ ] **IDMC-EVT-05-AC-22** Filter by track.
* [ ] **IDMC-EVT-05-AC-23** Click opens workshop detail.

### IDMC-EVT-05-AC · Workshop Detail
* [ ] **IDMC-EVT-05-AC-24** Detail shows full workshop title.
* [ ] **IDMC-EVT-05-AC-25** Detail shows full description.
* [ ] **IDMC-EVT-05-AC-26** Detail shows speaker(s) with bios.
* [ ] **IDMC-EVT-05-AC-27** Detail shows time and venue.
* [ ] **IDMC-EVT-05-AC-28** Detail shows category and track.
* [ ] **IDMC-EVT-05-AC-29** Detail shows capacity status.

### IDMC-EVT-05-AC · Capacity Tracking
* [ ] **IDMC-EVT-05-AC-30** Registration increments workshop count.
* [ ] **IDMC-EVT-05-AC-31** Cancellation decrements workshop count.
* [ ] **IDMC-EVT-05-AC-32** Admin can view registration count per workshop.
* [ ] **IDMC-EVT-05-AC-33** Export workshop attendee list.

---

## Data Model

### Workshop Extension (on Session)
```typescript
// sessions/{sessionId} where sessionType == "workshop"
interface WorkshopSession extends Session {
  sessionType: "workshop";

  // Workshop specific
  track: "track_1" | "track_2";
  category: "missions" | "marketplace" | "social_justice" | "media_influence" | "mental_wellness" | "sexual_wholeness" | "other";
  capacity?: number;
  registeredCount: number;
}
```

### Workshop Selection (on Registration)
```typescript
// Part of registrations/{registrationId}
workshopSelections: Array<{
  sessionId: string;
  sessionTitle: string;
  track: string;
  timeSlot: string;              // "day1_afternoon", "day2_afternoon"
}>;
```

---

## Frontend Implementation

### Public Pages
```
/src/pages/
├── workshops/
│   └── index.tsx            # Workshops page
```

### Components
```
/src/components/workshops/
├── WorkshopCard.tsx
├── WorkshopDetail.tsx
├── WorkshopGrid.tsx
├── TrackFilter.tsx
├── CategoryFilter.tsx
├── WorkshopSelector.tsx     # For registration form
└── CapacityBadge.tsx
```

---

## Edge Cases
* **Workshop full:** Show "Full" badge, disable selection in registration.
* **Cancellation frees spot:** Decrement count, spot becomes available.
* **No track preference:** Default to Track 1.
* **Parallel workshops:** Show side-by-side in schedule.
* **No capacity set:** Show as "Open" (unlimited).

---

## Metrics / Success
* **Track selection rate:** ≥ 80% of registrations select workshops.
* **Capacity utilization:** ≥ 70% of limited workshops filled.
* **Page load:** Workshops page loads < 2 seconds.

---

## Test Data / Seed
* **Track 1 Workshops:**
  - Mental Wellness (Hall 1, capacity: 500)
  - Social Justice (Hall 1)

* **Track 2 Workshops:**
  - Sexual Wholeness (Garnet Room, capacity: 100)
  - God in the Marketplace (Peridot Room, capacity: 150)
  - Missions (Tourmaline Room, capacity: 100)

---

## Links
* **Parent Epic:** [IDMC-EVT Event Management v1](./IDMC-EVT-Event-Management-v1.md)
* **Related:** [IDMC-EVT-04 Schedule & Sessions](./IDMC-EVT-04-Schedule-Sessions.md)
* **Related:** [IDMC-EVT-02 Registration](./IDMC-EVT-02-Registration-Ticketing.md)

---

## Changelog
* **v1.0.0 — 2025-12-12** - Initial epic creation with 33 acceptance criteria.
