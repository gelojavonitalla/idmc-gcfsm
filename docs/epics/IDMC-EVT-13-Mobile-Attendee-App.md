# IDMC-EVT-13 · Mobile Attendee App

## Product & QA Doc

### Summary
**Mobile application for conference attendees** that provides access to schedule, speakers, personal ticket, venue information, and real-time updates. Enables attendees to have all conference information at their fingertips.

**Target users:** Conference Attendees (primary).

---

## Goals
* Provide **easy access to schedule** with personal agenda.
* Display **speaker profiles** and session details.
* Show **personal ticket** with QR code for check-in.
* Offer **venue maps** and directions.
* Enable **offline access** to critical information.
* Send **push notifications** for updates and reminders.

## Non-Goals
* Registration or payment (use web).
* Live streaming integration.
* Social features (chat, networking).
* Session feedback/ratings (future phase).

---

## Scope

### In
* **Schedule view** with day tabs and filters.
* **Personal agenda** (bookmarked sessions).
* **Speaker directory** with profiles.
* **My Ticket** with QR code display.
* **Venue information** with maps.
* **Offline mode** for schedule and speakers.
* **Push notifications** for announcements.
* **Session reminders** (opt-in).
* **FAQ access** for quick reference.

### Out
* Registration flow.
* Payment processing.
* Live chat/messaging.
* Session Q&A.
* Networking features.
* Post-event surveys.

---

## User Stories

* As an **attendee**, I can view the full conference schedule.
* As an **attendee**, I can filter sessions by day, type, or track.
* As an **attendee**, I can bookmark sessions to my personal agenda.
* As an **attendee**, I can view speaker profiles and their sessions.
* As an **attendee**, I can access my ticket with QR code.
* As an **attendee**, I can find venue location and directions.
* As an **attendee**, I can view schedule offline.
* As an **attendee**, I receive notifications for important updates.
* As an **attendee**, I can set reminders for sessions.
* As an **attendee**, I can access FAQ quickly.

---

## Flows & States

### A) App Onboarding Flow
1. Attendee downloads app from App Store / Play Store.
2. App opens to welcome screen.
3. Attendee enters registration ID or email.
4. System validates and links to registration.
5. Personal data loaded (name, ticket, workshops).
6. Home screen displayed with quick actions.

### B) Schedule Browsing Flow
1. Attendee opens Schedule tab.
2. Day 1 sessions displayed by default.
3. Attendee switches between Day 1 / Day 2 tabs.
4. Sessions shown in timeline format.
5. Attendee taps session for details.
6. Session detail shows description, speaker, venue.
7. Attendee can bookmark session.

### C) My Ticket Flow
1. Attendee opens My Ticket tab.
2. Ticket displayed with:
   - QR code (large, scannable)
   - Name
   - Registration ID
   - Category
   - Workshop selections
3. Brightness auto-increases for scanning.
4. QR code works offline.

### D) Offline Mode Flow
1. Attendee opens app without internet.
2. Cached schedule and speakers displayed.
3. "Offline Mode" indicator shown.
4. My Ticket QR code available.
5. Bookmarks accessible.
6. Connection restored → auto-sync updates.

---

## Acceptance Criteria (QA)

### IDMC-EVT-13-AC · Onboarding
* [ ] **IDMC-EVT-13-AC-01** Welcome screen on first launch.
* [ ] **IDMC-EVT-13-AC-02** Registration ID input field.
* [ ] **IDMC-EVT-13-AC-03** Email input as alternative.
* [ ] **IDMC-EVT-13-AC-04** Validation against registrations database.
* [ ] **IDMC-EVT-13-AC-05** Invalid ID shows error message.
* [ ] **IDMC-EVT-13-AC-06** Successful link shows confirmation.
* [ ] **IDMC-EVT-13-AC-07** Skip option for browsing without linking.
* [ ] **IDMC-EVT-13-AC-08** Can link registration later from settings.

### IDMC-EVT-13-AC · Home Screen
* [ ] **IDMC-EVT-13-AC-09** Home screen displays conference theme.
* [ ] **IDMC-EVT-13-AC-10** Countdown to conference (if before event).
* [ ] **IDMC-EVT-13-AC-11** Quick action: View Schedule.
* [ ] **IDMC-EVT-13-AC-12** Quick action: My Ticket.
* [ ] **IDMC-EVT-13-AC-13** Quick action: Speakers.
* [ ] **IDMC-EVT-13-AC-14** Current/next session highlight (during event).
* [ ] **IDMC-EVT-13-AC-15** Recent announcements preview.

### IDMC-EVT-13-AC · Schedule View
* [ ] **IDMC-EVT-13-AC-16** Schedule tab in bottom navigation.
* [ ] **IDMC-EVT-13-AC-17** Day tabs: Day 1, Day 2.
* [ ] **IDMC-EVT-13-AC-18** Sessions in chronological timeline.
* [ ] **IDMC-EVT-13-AC-19** Session card shows: time, title, type, venue.
* [ ] **IDMC-EVT-13-AC-20** Session type color-coded.
* [ ] **IDMC-EVT-13-AC-21** Current session highlighted (during event).
* [ ] **IDMC-EVT-13-AC-22** Filter by session type.
* [ ] **IDMC-EVT-13-AC-23** Filter by track (workshops).
* [ ] **IDMC-EVT-13-AC-24** Search sessions by title.
* [ ] **IDMC-EVT-13-AC-25** Pull to refresh.

### IDMC-EVT-13-AC · Session Detail
* [ ] **IDMC-EVT-13-AC-26** Session detail opens on tap.
* [ ] **IDMC-EVT-13-AC-27** Shows full session title.
* [ ] **IDMC-EVT-13-AC-28** Shows full description.
* [ ] **IDMC-EVT-13-AC-29** Shows time and duration.
* [ ] **IDMC-EVT-13-AC-30** Shows venue/room.
* [ ] **IDMC-EVT-13-AC-31** Shows speaker(s) with photos.
* [ ] **IDMC-EVT-13-AC-32** Tap speaker opens profile.
* [ ] **IDMC-EVT-13-AC-33** Bookmark button (add to agenda).
* [ ] **IDMC-EVT-13-AC-34** Set reminder button.
* [ ] **IDMC-EVT-13-AC-35** Share session option.

### IDMC-EVT-13-AC · Personal Agenda
* [ ] **IDMC-EVT-13-AC-36** Agenda tab or section.
* [ ] **IDMC-EVT-13-AC-37** Shows only bookmarked sessions.
* [ ] **IDMC-EVT-13-AC-38** Organized by day.
* [ ] **IDMC-EVT-13-AC-39** Remove bookmark from agenda.
* [ ] **IDMC-EVT-13-AC-40** Empty state if no bookmarks.
* [ ] **IDMC-EVT-13-AC-41** Bookmarks persisted locally.
* [ ] **IDMC-EVT-13-AC-42** Conflict warning for overlapping sessions.

### IDMC-EVT-13-AC · Speakers Directory
* [ ] **IDMC-EVT-13-AC-43** Speakers tab in bottom navigation.
* [ ] **IDMC-EVT-13-AC-44** Grid/list of all speakers.
* [ ] **IDMC-EVT-13-AC-45** Speaker card: photo, name, title.
* [ ] **IDMC-EVT-13-AC-46** Search speakers by name.
* [ ] **IDMC-EVT-13-AC-47** Tap opens speaker profile.

### IDMC-EVT-13-AC · Speaker Profile
* [ ] **IDMC-EVT-13-AC-48** Large speaker photo.
* [ ] **IDMC-EVT-13-AC-49** Name and title.
* [ ] **IDMC-EVT-13-AC-50** Organization.
* [ ] **IDMC-EVT-13-AC-51** Full bio text.
* [ ] **IDMC-EVT-13-AC-52** List of sessions by this speaker.
* [ ] **IDMC-EVT-13-AC-53** Tap session navigates to detail.

### IDMC-EVT-13-AC · My Ticket
* [ ] **IDMC-EVT-13-AC-54** My Ticket tab in bottom navigation.
* [ ] **IDMC-EVT-13-AC-55** Requires linked registration.
* [ ] **IDMC-EVT-13-AC-56** Unlinked shows prompt to link.
* [ ] **IDMC-EVT-13-AC-57** Large QR code display.
* [ ] **IDMC-EVT-13-AC-58** QR code scannable by check-in.
* [ ] **IDMC-EVT-13-AC-59** Auto-brightness increase option.
* [ ] **IDMC-EVT-13-AC-60** Attendee name displayed.
* [ ] **IDMC-EVT-13-AC-61** Registration ID displayed.
* [ ] **IDMC-EVT-13-AC-62** Ticket category displayed.
* [ ] **IDMC-EVT-13-AC-63** Workshop selections displayed.
* [ ] **IDMC-EVT-13-AC-64** Works offline (cached).

### IDMC-EVT-13-AC · Venue & Maps
* [ ] **IDMC-EVT-13-AC-65** Venue info accessible from menu/home.
* [ ] **IDMC-EVT-13-AC-66** Venue name and address.
* [ ] **IDMC-EVT-13-AC-67** Map view (embedded or link).
* [ ] **IDMC-EVT-13-AC-68** "Get Directions" opens maps app.
* [ ] **IDMC-EVT-13-AC-69** Parking information.
* [ ] **IDMC-EVT-13-AC-70** Public transport info.
* [ ] **IDMC-EVT-13-AC-71** Floor plan/hall layout (if available).

### IDMC-EVT-13-AC · Push Notifications
* [ ] **IDMC-EVT-13-AC-72** Push notification permission request.
* [ ] **IDMC-EVT-13-AC-73** Receive announcement notifications.
* [ ] **IDMC-EVT-13-AC-74** Receive schedule change notifications.
* [ ] **IDMC-EVT-13-AC-75** Session reminder notifications.
* [ ] **IDMC-EVT-13-AC-76** Notification settings in app.
* [ ] **IDMC-EVT-13-AC-77** Enable/disable notification types.

### IDMC-EVT-13-AC · Offline Mode
* [ ] **IDMC-EVT-13-AC-78** Schedule cached on first load.
* [ ] **IDMC-EVT-13-AC-79** Speakers cached on first load.
* [ ] **IDMC-EVT-13-AC-80** My Ticket cached.
* [ ] **IDMC-EVT-13-AC-81** Bookmarks work offline.
* [ ] **IDMC-EVT-13-AC-82** Offline indicator displayed.
* [ ] **IDMC-EVT-13-AC-83** Auto-refresh when online.
* [ ] **IDMC-EVT-13-AC-84** Last updated timestamp shown.

### IDMC-EVT-13-AC · Settings & Info
* [ ] **IDMC-EVT-13-AC-85** Settings accessible from menu.
* [ ] **IDMC-EVT-13-AC-86** Link/unlink registration.
* [ ] **IDMC-EVT-13-AC-87** Notification preferences.
* [ ] **IDMC-EVT-13-AC-88** Clear cache option.
* [ ] **IDMC-EVT-13-AC-89** FAQ link.
* [ ] **IDMC-EVT-13-AC-90** Contact/help link.
* [ ] **IDMC-EVT-13-AC-91** App version info.
* [ ] **IDMC-EVT-13-AC-92** About IDMC link.

---

## Technical Architecture

### Platform
* **Framework:** React Native (iOS & Android)
* **State Management:** Redux or Zustand
* **Local Storage:** AsyncStorage + SQLite
* **Push Notifications:** Firebase Cloud Messaging (FCM)
* **Maps:** React Native Maps

### Data Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                   ATTENDEE APP ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Firebase   │────►│   Local      │────►│   UI         │
│   Firestore  │     │   Cache      │     │   Components │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    ▲
       │                    │
       ▼                    │
┌──────────────┐     ┌──────────────┐
│   FCM Push   │     │  Bookmarks   │
│   Notifications│   │  (Local)     │
└──────────────┘     └──────────────┘
```

---

## Data Model

### Local Cache
```typescript
// Cached data
interface CachedSchedule {
  sessions: Session[];
  lastUpdated: string;
}

interface CachedSpeakers {
  speakers: Speaker[];
  lastUpdated: string;
}

interface UserData {
  registrationId?: string;
  attendeeName?: string;
  category?: string;
  qrCode?: string;
  workshopSelections?: string[];
  bookmarkedSessions: string[];
  reminderSessions: string[];
}
```

---

## UI/UX Design

### Bottom Navigation
```
┌─────────────────────────────────────────┐
│   Home  │ Schedule │ Speakers │ Ticket  │
│    🏠   │    📅    │    👥    │   🎫    │
└─────────────────────────────────────────┘
```

### Schedule Screen
```
┌─────────────────────────────────────────┐
│  ◄ Schedule                        🔍   │
├─────────────────────────────────────────┤
│   [ Day 1 ]  [ Day 2 ]  [ My Agenda ]   │
├─────────────────────────────────────────┤
│  09:00 ─────────────────────────────    │
│  ┌─────────────────────────────────┐    │
│  │ 🎤 Opening Worship              │    │
│  │    Hall 1 • 09:00 - 09:30       │    │
│  └─────────────────────────────────┘    │
│                                         │
│  09:30 ─────────────────────────────    │
│  ┌─────────────────────────────────┐    │
│  │ 📢 Plenary 1: All In FOR...     │    │
│  │    Rev Edmund Chan              │    │
│  │    Hall 1 • 09:30 - 11:00       │ ★  │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

### My Ticket Screen
```
┌─────────────────────────────────────────┐
│            My Ticket                    │
├─────────────────────────────────────────┤
│                                         │
│         ┌─────────────────┐             │
│         │                 │             │
│         │    [QR CODE]    │             │
│         │                 │             │
│         │                 │             │
│         └─────────────────┘             │
│                                         │
│              JOHN DOE                   │
│           REG-2025-00123                │
│                                         │
│    ┌────────────────────────────┐       │
│    │  Category: Regular         │       │
│    │  Workshop: Track 2 -       │       │
│    │           Marketplace      │       │
│    └────────────────────────────┘       │
│                                         │
│      💡 Increase brightness for         │
│         easier scanning                 │
│                                         │
└─────────────────────────────────────────┘
```

---

## Edge Cases
* **No registration linked:** Show browse-only mode with prompt.
* **Invalid registration ID:** Clear error with retry option.
* **Conference not started:** Show countdown and preview.
* **Conference ended:** Show "Thank you" message with highlights.
* **No internet on first launch:** Show error, require connection.
* **Push permission denied:** Show in-app notifications.
* **Session time conflict:** Show warning on bookmark.

---

## Metrics / Success
* **App downloads:** Target 80% of registered attendees.
* **Daily active users:** ≥ 90% during conference.
* **Ticket usage:** ≥ 70% use app for check-in.
* **Schedule views:** Average 10+ per user per day.
* **Crash rate:** < 0.1%.

---

## Release Plan

### Phase 1 (MVP)
- [ ] Registration linking
- [ ] Schedule view
- [ ] Speaker directory
- [ ] My Ticket with QR
- [ ] Basic offline mode

### Phase 2
- [ ] Personal agenda (bookmarks)
- [ ] Session reminders
- [ ] Push notifications
- [ ] Venue maps

### Phase 3
- [ ] Session search
- [ ] Share features
- [ ] Performance optimization
- [ ] App store deployment

---

## Links
* **Parent Epic:** [IDMC-EVT Event Management v1](./IDMC-EVT-Event-Management-v1.md)
* **Related:** [IDMC-EVT-04 Schedule & Sessions](./IDMC-EVT-04-Schedule-Sessions.md)
* **Related:** [IDMC-EVT-03 Speaker Management](./IDMC-EVT-03-Speaker-Management.md)
* **Related:** [IDMC-EVT-02 Registration](./IDMC-EVT-02-Registration-Ticketing.md)

---

## Changelog
* **v1.0.0 — 2025-12-12** - Initial epic creation with 92 acceptance criteria.
