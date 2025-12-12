# IDMC-EVT-03 · Speaker Management

## Product & QA Doc

### Summary
**Speaker profile management system** that enables admins to manage conference speakers including their profiles, bios, photos, and session assignments. Provides a public speakers page for attendees to view speaker information.

**Target users:** Admin (primary), Attendees (secondary), Speakers (tertiary).

---

## Goals
* Enable **admin CRUD operations** for speaker profiles.
* Support **rich text bios** with formatting.
* Provide **photo upload and optimization** for speaker images.
* Allow **session assignment** linking speakers to sessions.
* Display **public speakers page** with filterable speaker grid.
* Support **speaker ordering** for display priority.

## Non-Goals
* Speaker self-service portal (admin-managed for v1).
* Speaker availability scheduling.
* Speaker communication/messaging system.
* Speaker travel/accommodation management.

---

## Scope

### In
* **Admin speaker CRUD** (create, read, update, delete).
* **Speaker profile fields** (name, title, organization, bio, photo).
* **Photo upload** with automatic optimization.
* **Session assignment** to link speakers with sessions.
* **Featured speaker flag** for landing page display.
* **Speaker ordering** for custom display order.
* **Public speakers page** with responsive grid.
* **Speaker detail view** with full bio and sessions.
* **Draft/published status** for content staging.

### Out
* Speaker login/self-service.
* Speaker resource uploads (slides, materials).
* Speaker scheduling/availability.
* Speaker contracts/agreements.

---

## User Stories

* As an **admin**, I can add a new speaker with profile information.
* As an **admin**, I can upload and crop a speaker's photo.
* As an **admin**, I can write a rich text bio for a speaker.
* As an **admin**, I can assign a speaker to one or more sessions.
* As an **admin**, I can mark a speaker as "featured" for the landing page.
* As an **admin**, I can reorder speakers for display priority.
* As an **admin**, I can save a speaker as draft before publishing.
* As an **attendee**, I can view all speakers on the speakers page.
* As an **attendee**, I can click on a speaker to see their full bio.
* As an **attendee**, I can see which sessions a speaker is presenting.

---

## Flows & States

### A) Add Speaker Flow (Admin)
1. Admin navigates to Admin → Speakers.
2. Clicks "Add Speaker" button.
3. Speaker form opens with fields:
   - Name (required)
   - Title/Designation (required)
   - Organization (required)
   - Bio (rich text editor)
   - Photo upload
   - Social links (optional)
   - Featured toggle
   - Status (draft/published)
4. Admin fills in details and uploads photo.
5. Admin clicks "Save" or "Save & Publish".
6. Speaker created and appears in list.

### B) Assign Sessions Flow (Admin)
1. Admin opens speaker edit form.
2. Scrolls to "Sessions" section.
3. Multi-select dropdown shows available sessions.
4. Admin selects sessions for this speaker.
5. Admin saves changes.
6. Speaker now linked to sessions.

### C) View Speakers Flow (Public)
1. Attendee navigates to Speakers page.
2. Grid of speaker cards loads.
3. Each card shows photo, name, title.
4. Attendee clicks on a speaker card.
5. Speaker detail modal/page opens.
6. Full bio and assigned sessions displayed.

---

## Acceptance Criteria (QA)

### IDMC-EVT-03-AC · Speaker Profile Management
* [ ] **IDMC-EVT-03-AC-01** Admin can create new speaker profile.
* [ ] **IDMC-EVT-03-AC-02** Name field required (min 2 characters).
* [ ] **IDMC-EVT-03-AC-03** Title/designation field required.
* [ ] **IDMC-EVT-03-AC-04** Organization field required.
* [ ] **IDMC-EVT-03-AC-05** Bio field supports rich text (bold, italic, lists, links).
* [ ] **IDMC-EVT-03-AC-06** Bio has character limit (2000 characters).
* [ ] **IDMC-EVT-03-AC-07** Admin can edit existing speaker profile.
* [ ] **IDMC-EVT-03-AC-08** Admin can delete speaker (with confirmation).
* [ ] **IDMC-EVT-03-AC-09** Delete blocked if speaker assigned to sessions.

### IDMC-EVT-03-AC · Photo Upload
* [ ] **IDMC-EVT-03-AC-10** Photo upload accepts JPG, PNG formats.
* [ ] **IDMC-EVT-03-AC-11** Photo max size 5MB.
* [ ] **IDMC-EVT-03-AC-12** Photo auto-resized to max 800x800px.
* [ ] **IDMC-EVT-03-AC-13** Photo converted to WebP for optimization.
* [ ] **IDMC-EVT-03-AC-14** Photo preview shown before save.
* [ ] **IDMC-EVT-03-AC-15** Existing photo can be replaced.
* [ ] **IDMC-EVT-03-AC-16** Default placeholder shown if no photo.

### IDMC-EVT-03-AC · Session Assignment
* [ ] **IDMC-EVT-03-AC-17** Multi-select dropdown shows available sessions.
* [ ] **IDMC-EVT-03-AC-18** Sessions grouped by day in dropdown.
* [ ] **IDMC-EVT-03-AC-19** Selected sessions shown as chips/tags.
* [ ] **IDMC-EVT-03-AC-20** Removing session updates speaker-session link.
* [ ] **IDMC-EVT-03-AC-21** Session card shows speaker name after assignment.

### IDMC-EVT-03-AC · Speaker Display Settings
* [ ] **IDMC-EVT-03-AC-22** Featured toggle marks speaker for landing page.
* [ ] **IDMC-EVT-03-AC-23** Max 6 featured speakers allowed.
* [ ] **IDMC-EVT-03-AC-24** Order field for custom display order.
* [ ] **IDMC-EVT-03-AC-25** Drag-and-drop reordering in admin list.
* [ ] **IDMC-EVT-03-AC-26** Draft status hides speaker from public.
* [ ] **IDMC-EVT-03-AC-27** Published status shows speaker publicly.

### IDMC-EVT-03-AC · Public Speakers Page
* [ ] **IDMC-EVT-03-AC-28** Speakers page displays all published speakers.
* [ ] **IDMC-EVT-03-AC-29** Speaker cards show photo, name, title, organization.
* [ ] **IDMC-EVT-03-AC-30** Grid layout responsive (4 cols desktop, 2 tablet, 1 mobile).
* [ ] **IDMC-EVT-03-AC-31** Cards ordered by order field, then by name.
* [ ] **IDMC-EVT-03-AC-32** Clicking card opens speaker detail.
* [ ] **IDMC-EVT-03-AC-33** Lazy loading for speaker photos.

### IDMC-EVT-03-AC · Speaker Detail View
* [ ] **IDMC-EVT-03-AC-34** Detail shows full bio with formatting.
* [ ] **IDMC-EVT-03-AC-35** Detail shows larger photo.
* [ ] **IDMC-EVT-03-AC-36** Detail lists assigned sessions with times.
* [ ] **IDMC-EVT-03-AC-37** Social links displayed (if provided).
* [ ] **IDMC-EVT-03-AC-38** Back/close button returns to speakers list.

---

## Data Model

### Speaker Document
```typescript
// speakers/{speakerId}
interface Speaker {
  speakerId: string;
  conferenceId: string;

  // Profile
  name: string;
  title: string;
  organization: string;
  bio: string;                       // Rich text HTML
  photoUrl?: string;
  photoStoragePath?: string;

  // Social Links
  socialLinks?: {
    website?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };

  // Display Settings
  order: number;
  featured: boolean;
  status: "draft" | "published";

  // Session Links (denormalized)
  sessionIds: string[];
  sessionTitles: string[];

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}
```

---

## Backend Implementation

### Cloud Functions

#### `createSpeaker`
```typescript
/**
 * createSpeaker (HTTPS Callable)
 * Purpose: Create a new speaker profile
 * Inputs: { conferenceId, name, title, organization, bio, featured, status }
 * Outputs: { ok: true, speakerId }
 * Security: Admin only
 */
```

#### `updateSpeaker`
```typescript
/**
 * updateSpeaker (HTTPS Callable)
 * Purpose: Update speaker profile
 * Inputs: { speakerId, ...updates }
 * Outputs: { ok: true }
 * Security: Admin only
 */
```

#### `uploadSpeakerPhoto`
```typescript
/**
 * uploadSpeakerPhoto (HTTPS Callable)
 * Purpose: Upload and process speaker photo
 * Inputs: { speakerId, photoBase64, mimeType }
 * Outputs: { ok: true, photoUrl }
 * Security: Admin only
 * Processing: Resize, convert to WebP, upload to Storage
 */
```

---

## Frontend Implementation

### Admin Pages
```
/src/pages/admin/
├── speakers/
│   ├── index.tsx            # Speaker list
│   ├── new.tsx              # Add speaker form
│   └── [id].tsx             # Edit speaker form
```

### Public Pages
```
/src/pages/
├── speakers/
│   ├── index.tsx            # Speakers grid
│   └── [id].tsx             # Speaker detail
```

### Components
```
/src/components/speakers/
├── SpeakerForm.tsx
├── SpeakerCard.tsx
├── SpeakerDetail.tsx
├── SpeakerGrid.tsx
├── PhotoUpload.tsx
└── SessionSelector.tsx
```

---

## Edge Cases
* **Photo upload failure:** Show error, allow retry, keep form data.
* **Delete speaker with sessions:** Block delete, show warning with session list.
* **Featured limit exceeded:** Show warning when trying to feature 7th speaker.
* **Large bio text:** Truncate preview, show full on detail view.
* **Missing photo:** Display placeholder avatar.
* **Session deleted:** Remove session from speaker's sessionIds.

---

## Metrics / Success
* **Admin efficiency:** Speaker creation < 5 minutes.
* **Photo optimization:** Images < 100KB after processing.
* **Page load:** Speakers page loads < 2 seconds.

---

## Test Data / Seed
* **Speakers:**
  - Rev Edmund Chan (Leadership Mentor, CEFC) - Featured
  - Rev Tony Yeo (Senior Pastor, CEFC) - Featured
  - Rev Tan Kay Kiong - Featured
  - Rui En (Actress, Singer) - Featured
  - Timothy Yeo (Pastor, CEFC)
  - Pastor Edric Sng

---

## Links
* **Parent Epic:** [IDMC-EVT Event Management v1](./IDMC-EVT-Event-Management-v1.md)
* **Related:** [IDMC-EVT-04 Schedule & Sessions](./IDMC-EVT-04-Schedule-Sessions.md)
* **Related:** [IDMC-EVT-01 Public Website](./IDMC-EVT-01-Public-Website-Landing-Page.md)

---

## Changelog
* **v1.0.0 — 2025-12-12** - Initial epic creation with 38 acceptance criteria.
