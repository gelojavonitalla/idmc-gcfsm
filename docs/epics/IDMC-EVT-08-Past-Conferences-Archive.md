# IDMC-EVT-08 · Past Conferences Archive

## Product & QA Doc

### Summary
**Conference archive system** that preserves historical conference data including themes, speakers, photos, and highlights. Allows attendees to browse past conferences and enables admins to archive completed conferences.

**Target users:** Attendees (primary), Admin (secondary).

---

## Goals
* Preserve **historical conference data** for reference.
* Display **past conferences** with themes and highlights.
* Support **photo galleries** for each conference.
* Enable **video links** to recorded sessions.
* Provide **admin archive workflow** for completed conferences.

## Non-Goals
* Full session recordings hosting.
* Searchable session content/transcripts.
* Attendee testimonial collection.
* Conference comparison analytics.

---

## Scope

### In
* **Past conferences page** listing archived conferences.
* **Conference archive detail** with theme, speakers, highlights.
* **Photo gallery** upload and display.
* **Video links** (YouTube embeds).
* **Admin archive action** for completed conferences.
* **Archive confirmation** workflow.
* **Read-only mode** for archived data.

### Out
* Video hosting/streaming.
* Session transcript storage.
* Attendee testimonials.
* Conference analytics comparison.

---

## User Stories

* As an **attendee**, I can browse past IDMC conferences.
* As an **attendee**, I can view the theme and speakers of past conferences.
* As an **attendee**, I can view photo galleries from past conferences.
* As an **attendee**, I can watch video highlights (via YouTube links).
* As an **admin**, I can archive a completed conference.
* As an **admin**, I can upload photos to past conference galleries.
* As an **admin**, I can add video links to archived conferences.

---

## Flows & States

### A) Browse Past Conferences Flow (Public)
1. Attendee navigates to Past Conferences page.
2. Grid of past conference cards displayed.
3. Each card shows year, theme, and thumbnail.
4. Attendee clicks on a conference card.
5. Conference detail page loads with full information.

### B) Archive Conference Flow (Admin)
1. Admin navigates to Settings → Archive.
2. Current conference info displayed.
3. Admin clicks "Archive Conference".
4. Confirmation modal appears with warnings.
5. Admin confirms archive action.
6. Conference status changed to "archived".
7. Conference appears in Past Conferences.

### C) Upload Gallery Photos Flow (Admin)
1. Admin opens archived conference.
2. Navigates to Gallery section.
3. Clicks "Upload Photos".
4. Selects multiple images.
5. Images uploaded and optimized.
6. Gallery displays uploaded photos.

---

## Acceptance Criteria (QA)

### IDMC-EVT-08-AC · Past Conferences Page
* [ ] **IDMC-EVT-08-AC-01** Past conferences page lists all archived conferences.
* [ ] **IDMC-EVT-08-AC-02** Conferences sorted by year (newest first).
* [ ] **IDMC-EVT-08-AC-03** Conference card shows: year, theme, thumbnail.
* [ ] **IDMC-EVT-08-AC-04** Card shows attendee count (if available).
* [ ] **IDMC-EVT-08-AC-05** Click card navigates to detail page.
* [ ] **IDMC-EVT-08-AC-06** Responsive grid layout.
* [ ] **IDMC-EVT-08-AC-07** Empty state if no archived conferences.

### IDMC-EVT-08-AC · Conference Archive Detail
* [ ] **IDMC-EVT-08-AC-08** Detail page shows conference year and theme.
* [ ] **IDMC-EVT-08-AC-09** Detail shows conference dates and venue.
* [ ] **IDMC-EVT-08-AC-10** Detail shows featured speakers.
* [ ] **IDMC-EVT-08-AC-11** Detail shows conference highlights/summary.
* [ ] **IDMC-EVT-08-AC-12** Photo gallery section.
* [ ] **IDMC-EVT-08-AC-13** Video highlights section.
* [ ] **IDMC-EVT-08-AC-14** Back to list navigation.

### IDMC-EVT-08-AC · Photo Gallery
* [ ] **IDMC-EVT-08-AC-15** Gallery displays uploaded photos.
* [ ] **IDMC-EVT-08-AC-16** Photos displayed in grid layout.
* [ ] **IDMC-EVT-08-AC-17** Click photo opens lightbox.
* [ ] **IDMC-EVT-08-AC-18** Lightbox supports navigation (prev/next).
* [ ] **IDMC-EVT-08-AC-19** Lightbox close button.
* [ ] **IDMC-EVT-08-AC-20** Lazy loading for photos.
* [ ] **IDMC-EVT-08-AC-21** Photo captions (optional).

### IDMC-EVT-08-AC · Video Highlights
* [ ] **IDMC-EVT-08-AC-22** Video section shows YouTube embeds.
* [ ] **IDMC-EVT-08-AC-23** Video thumbnails displayed.
* [ ] **IDMC-EVT-08-AC-24** Video titles displayed.
* [ ] **IDMC-EVT-08-AC-25** Click thumbnail plays video.
* [ ] **IDMC-EVT-08-AC-26** Videos open in modal or expand inline.

### IDMC-EVT-08-AC · Admin Archive Workflow
* [ ] **IDMC-EVT-08-AC-27** Archive action in Settings.
* [ ] **IDMC-EVT-08-AC-28** Confirmation modal with warnings.
* [ ] **IDMC-EVT-08-AC-29** Warning: "Registration will close".
* [ ] **IDMC-EVT-08-AC-30** Warning: "Data becomes read-only".
* [ ] **IDMC-EVT-08-AC-31** Require typing "ARCHIVE" to confirm.
* [ ] **IDMC-EVT-08-AC-32** Archive updates conference status.
* [ ] **IDMC-EVT-08-AC-33** Archive closes registration.
* [ ] **IDMC-EVT-08-AC-34** Archived conference not editable.

### IDMC-EVT-08-AC · Admin Gallery Upload
* [ ] **IDMC-EVT-08-AC-35** Upload photos button in gallery section.
* [ ] **IDMC-EVT-08-AC-36** Multi-file upload supported.
* [ ] **IDMC-EVT-08-AC-37** Accepted formats: JPG, PNG.
* [ ] **IDMC-EVT-08-AC-38** Max file size: 10MB per image.
* [ ] **IDMC-EVT-08-AC-39** Images auto-optimized for web.
* [ ] **IDMC-EVT-08-AC-40** Upload progress indicator.
* [ ] **IDMC-EVT-08-AC-41** Delete photo option.
* [ ] **IDMC-EVT-08-AC-42** Reorder photos (drag-and-drop).

### IDMC-EVT-08-AC · Admin Video Links
* [ ] **IDMC-EVT-08-AC-43** Add video link button.
* [ ] **IDMC-EVT-08-AC-44** Video form: YouTube URL, title.
* [ ] **IDMC-EVT-08-AC-45** YouTube URL validation.
* [ ] **IDMC-EVT-08-AC-46** Thumbnail auto-fetched from YouTube.
* [ ] **IDMC-EVT-08-AC-47** Edit video link.
* [ ] **IDMC-EVT-08-AC-48** Delete video link.

---

## Data Model

### Archived Conference (Extension)
```typescript
// conferences/{conferenceId} with status == "archived"
interface ArchivedConference extends Conference {
  status: "archived";
  archivedAt: Timestamp;
  archivedBy: string;

  // Archive additions
  highlights?: string;               // Rich text summary
  attendeeCount?: number;
  gallery: Array<{
    photoId: string;
    photoUrl: string;
    caption?: string;
    order: number;
  }>;
  videos: Array<{
    videoId: string;
    youtubeUrl: string;
    title: string;
    thumbnailUrl: string;
    order: number;
  }>;
}
```

---

## Frontend Implementation

### Public Pages
```
/src/pages/
├── past-conferences/
│   ├── index.tsx            # Past conferences list
│   └── [year].tsx           # Conference detail
```

### Admin Pages
```
/src/pages/admin/
├── settings/
│   └── archive.tsx          # Archive conference
└── past-conferences/
    └── [year]/
        ├── gallery.tsx      # Gallery management
        └── videos.tsx       # Video management
```

### Components
```
/src/components/archive/
├── PastConferenceCard.tsx
├── PastConferenceDetail.tsx
├── PhotoGallery.tsx
├── Lightbox.tsx
├── VideoGallery.tsx
├── ArchiveConfirmModal.tsx
├── GalleryUpload.tsx
└── VideoLinkForm.tsx
```

---

## Edge Cases
* **No archived conferences:** Show "Coming soon" or hide section.
* **Missing photos:** Show placeholder image.
* **Invalid YouTube URL:** Validation error on form.
* **Archive without data:** Allow archiving even with minimal data.
* **Accidental archive:** No undo, but data preserved.

---

## Metrics / Success
* **Archive completeness:** All past conferences have galleries.
* **Gallery engagement:** Photo views per visitor.
* **Video engagement:** Video plays per visitor.
* **Page load:** Archive pages load < 3 seconds.

---

## Test Data / Seed
* **Archived Conferences:**
  - IDMC 2024: "Under Attack! — Spiritual Warfare Re-Engaged"
  - IDMC 2023: (Theme TBD)
  - IDMC 2022: (Theme TBD)

---

## Links
* **Parent Epic:** [IDMC-EVT Event Management v1](./IDMC-EVT-Event-Management-v1.md)
* **Related:** [IDMC-EVT-07 Admin Dashboard](./IDMC-EVT-07-Admin-Dashboard.md)

---

## Changelog
* **v1.0.0 — 2025-12-12** - Initial epic creation with 48 acceptance criteria.
