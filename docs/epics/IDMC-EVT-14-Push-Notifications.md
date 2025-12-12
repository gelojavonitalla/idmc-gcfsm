# IDMC-EVT-14 · Push Notifications

## Product & QA Doc

### Summary
**Push notification system** that enables conference organizers to send real-time updates, announcements, and reminders to attendees via mobile app and web. Supports targeted notifications, scheduling, and notification preferences.

**Target users:** Admin (sending), Attendees (receiving).

---

## Goals
* Enable **admin to send announcements** to all attendees.
* Support **targeted notifications** (by category, workshop).
* Provide **scheduled notifications** for pre-event reminders.
* Allow **attendees to manage** notification preferences.
* Support **session reminders** for bookmarked sessions.
* Track **notification delivery** and engagement.

## Non-Goals
* Email notifications (separate system).
* SMS notifications.
* In-app chat/messaging.
* Marketing automation.

---

## Scope

### In
* **Firebase Cloud Messaging (FCM)** integration.
* **Admin notification composer** with targeting.
* **Notification types:** Announcement, Schedule Change, Reminder, Alert.
* **Audience targeting:** All, Category, Workshop Track.
* **Scheduled sending** for future delivery.
* **Notification history** for admins.
* **User preferences** for notification types.
* **Session reminders** (15 min before).
* **Delivery tracking** and analytics.
* **Web push** for PWA support.

### Out
* Email notifications.
* SMS gateway.
* Rich media in notifications (images, videos).
* Deep analytics/A-B testing.

---

## User Stories

* As an **admin**, I can send an announcement to all attendees.
* As an **admin**, I can target notifications to specific categories.
* As an **admin**, I can schedule a notification for later.
* As an **admin**, I can view sent notification history.
* As an **admin**, I can see delivery statistics.
* As an **attendee**, I receive notifications on my mobile app.
* As an **attendee**, I can set a reminder for a session.
* As an **attendee**, I receive reminder 15 minutes before session.
* As an **attendee**, I can enable/disable notification types.
* As an **attendee**, I can view notification history in-app.

---

## Flows & States

### A) Send Notification Flow (Admin)
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Compose      │────►│ Select       │────►│ Preview &    │
│ Notification │     │ Audience     │     │ Send         │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                           ┌──────────────────────┤
                           │                      │
                           ▼                      ▼
                    ┌──────────────┐       ┌──────────────┐
                    │ Send Now     │       │ Schedule     │
                    │              │       │ for Later    │
                    └──────┬───────┘       └──────┬───────┘
                           │                      │
                           ▼                      ▼
                    ┌──────────────┐       ┌──────────────┐
                    │ FCM Dispatch │       │ Queue for    │
                    │              │       │ Scheduled    │
                    └──────────────┘       └──────────────┘
```

### B) Receive Notification Flow (Attendee)
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ FCM Message  │────►│ App          │────►│ Display      │
│ Received     │     │ Processing   │     │ Notification │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                           ┌──────────────────────┤
                           │                      │
                           ▼                      ▼
                    ┌──────────────┐       ┌──────────────┐
                    │ App in       │       │ App in       │
                    │ Foreground   │       │ Background   │
                    └──────┬───────┘       └──────┬───────┘
                           │                      │
                           ▼                      ▼
                    ┌──────────────┐       ┌──────────────┐
                    │ In-app       │       │ System       │
                    │ Banner       │       │ Notification │
                    └──────────────┘       └──────────────┘
```

### C) Session Reminder Flow
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ User Sets    │────►│ Reminder     │────►│ Cloud        │
│ Reminder     │     │ Scheduled    │     │ Function     │
└──────────────┘     └──────────────┘     │ Triggers     │
                                          └──────┬───────┘
                                                 │
                                                 │ 15 min before
                                                 ▼
                                          ┌──────────────┐
                                          │ Send Push    │
                                          │ Notification │
                                          └──────────────┘
```

---

## Acceptance Criteria (QA)

### IDMC-EVT-14-AC · FCM Setup
* [ ] **IDMC-EVT-14-AC-01** Firebase Cloud Messaging configured.
* [ ] **IDMC-EVT-14-AC-02** iOS APNs certificates configured.
* [ ] **IDMC-EVT-14-AC-03** Android FCM sender configured.
* [ ] **IDMC-EVT-14-AC-04** Web push VAPID keys configured.
* [ ] **IDMC-EVT-14-AC-05** FCM tokens stored per user device.

### IDMC-EVT-14-AC · Admin Notification Composer
* [ ] **IDMC-EVT-14-AC-06** Notification composer page in admin.
* [ ] **IDMC-EVT-14-AC-07** Title field (required, max 50 chars).
* [ ] **IDMC-EVT-14-AC-08** Body field (required, max 200 chars).
* [ ] **IDMC-EVT-14-AC-09** Notification type selector.
* [ ] **IDMC-EVT-14-AC-10** Types: Announcement, Schedule Change, Reminder, Alert.
* [ ] **IDMC-EVT-14-AC-11** Audience selector.
* [ ] **IDMC-EVT-14-AC-12** Audiences: All Attendees, By Category, By Workshop.
* [ ] **IDMC-EVT-14-AC-13** Category filter (Regular, Student, NSF).
* [ ] **IDMC-EVT-14-AC-14** Workshop track filter.
* [ ] **IDMC-EVT-14-AC-15** Preview notification before sending.
* [ ] **IDMC-EVT-14-AC-16** Estimated recipient count shown.
* [ ] **IDMC-EVT-14-AC-17** Send now button.
* [ ] **IDMC-EVT-14-AC-18** Schedule for later option.
* [ ] **IDMC-EVT-14-AC-19** Date/time picker for scheduling.
* [ ] **IDMC-EVT-14-AC-20** Confirmation before sending.

### IDMC-EVT-14-AC · Notification Delivery
* [ ] **IDMC-EVT-14-AC-21** Notification sent to FCM.
* [ ] **IDMC-EVT-14-AC-22** Delivery to iOS devices.
* [ ] **IDMC-EVT-14-AC-23** Delivery to Android devices.
* [ ] **IDMC-EVT-14-AC-24** Delivery to web browsers (if PWA).
* [ ] **IDMC-EVT-14-AC-25** Batch sending for large audiences.
* [ ] **IDMC-EVT-14-AC-26** Retry failed deliveries.
* [ ] **IDMC-EVT-14-AC-27** Handle invalid tokens (cleanup).

### IDMC-EVT-14-AC · Scheduled Notifications
* [ ] **IDMC-EVT-14-AC-28** Scheduled notifications stored in queue.
* [ ] **IDMC-EVT-14-AC-29** Cloud Function triggers at scheduled time.
* [ ] **IDMC-EVT-14-AC-30** Admin can view scheduled notifications.
* [ ] **IDMC-EVT-14-AC-31** Admin can cancel scheduled notification.
* [ ] **IDMC-EVT-14-AC-32** Admin can edit scheduled notification.

### IDMC-EVT-14-AC · Notification History
* [ ] **IDMC-EVT-14-AC-33** History page shows sent notifications.
* [ ] **IDMC-EVT-14-AC-34** List shows: title, type, audience, sent time.
* [ ] **IDMC-EVT-14-AC-35** Click to view full notification details.
* [ ] **IDMC-EVT-14-AC-36** Shows delivery statistics.
* [ ] **IDMC-EVT-14-AC-37** Filter by type.
* [ ] **IDMC-EVT-14-AC-38** Filter by date range.
* [ ] **IDMC-EVT-14-AC-39** Pagination for large history.

### IDMC-EVT-14-AC · Delivery Statistics
* [ ] **IDMC-EVT-14-AC-40** Total recipients count.
* [ ] **IDMC-EVT-14-AC-41** Delivered count.
* [ ] **IDMC-EVT-14-AC-42** Failed count.
* [ ] **IDMC-EVT-14-AC-43** Opened count (if trackable).
* [ ] **IDMC-EVT-14-AC-44** Delivery rate percentage.

### IDMC-EVT-14-AC · Mobile App - Receiving
* [ ] **IDMC-EVT-14-AC-45** Push permission request on app install.
* [ ] **IDMC-EVT-14-AC-46** FCM token registered on permission grant.
* [ ] **IDMC-EVT-14-AC-47** Notification displayed when app in background.
* [ ] **IDMC-EVT-14-AC-48** In-app banner when app in foreground.
* [ ] **IDMC-EVT-14-AC-49** Tap notification opens relevant screen.
* [ ] **IDMC-EVT-14-AC-50** Badge count on app icon.
* [ ] **IDMC-EVT-14-AC-51** Sound for notifications.

### IDMC-EVT-14-AC · Mobile App - Notification Center
* [ ] **IDMC-EVT-14-AC-52** In-app notification center/inbox.
* [ ] **IDMC-EVT-14-AC-53** Lists all received notifications.
* [ ] **IDMC-EVT-14-AC-54** Unread count badge.
* [ ] **IDMC-EVT-14-AC-55** Mark as read on view.
* [ ] **IDMC-EVT-14-AC-56** Mark all as read option.
* [ ] **IDMC-EVT-14-AC-57** Notification persists after viewing.

### IDMC-EVT-14-AC · Session Reminders
* [ ] **IDMC-EVT-14-AC-58** Set reminder button on session detail.
* [ ] **IDMC-EVT-14-AC-59** Reminder saved to user preferences.
* [ ] **IDMC-EVT-14-AC-60** Reminder indicator on session.
* [ ] **IDMC-EVT-14-AC-61** Remove reminder option.
* [ ] **IDMC-EVT-14-AC-62** Reminder notification sent 15 min before.
* [ ] **IDMC-EVT-14-AC-63** Reminder shows session title and venue.
* [ ] **IDMC-EVT-14-AC-64** Tap reminder opens session detail.

### IDMC-EVT-14-AC · User Preferences
* [ ] **IDMC-EVT-14-AC-65** Notification settings in app.
* [ ] **IDMC-EVT-14-AC-66** Toggle: All notifications on/off.
* [ ] **IDMC-EVT-14-AC-67** Toggle: Announcements.
* [ ] **IDMC-EVT-14-AC-68** Toggle: Schedule changes.
* [ ] **IDMC-EVT-14-AC-69** Toggle: Session reminders.
* [ ] **IDMC-EVT-14-AC-70** Toggle: Alert notifications.
* [ ] **IDMC-EVT-14-AC-71** Preferences synced to server.
* [ ] **IDMC-EVT-14-AC-72** Preferences respected by backend.

### IDMC-EVT-14-AC · Web Push (Optional)
* [ ] **IDMC-EVT-14-AC-73** Service worker for web push.
* [ ] **IDMC-EVT-14-AC-74** Browser permission request.
* [ ] **IDMC-EVT-14-AC-75** Web push token registered.
* [ ] **IDMC-EVT-14-AC-76** Notifications received in browser.
* [ ] **IDMC-EVT-14-AC-77** Click opens web app.

---

## Data Model

### Notification Document
```typescript
// notifications/{notificationId}
interface Notification {
  notificationId: string;
  conferenceId: string;

  // Content
  title: string;
  body: string;
  type: "announcement" | "schedule_change" | "reminder" | "alert";

  // Targeting
  audience: "all" | "category" | "workshop";
  targetCategories?: string[];        // ["regular", "student"]
  targetWorkshops?: string[];         // Session IDs

  // Scheduling
  status: "draft" | "scheduled" | "sent" | "cancelled";
  scheduledFor?: Timestamp;
  sentAt?: Timestamp;

  // Statistics
  stats: {
    targetCount: number;
    sentCount: number;
    deliveredCount: number;
    failedCount: number;
    openedCount: number;
  };

  // Metadata
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### User FCM Tokens
```typescript
// fcmTokens/{tokenId}
interface FCMToken {
  tokenId: string;
  token: string;
  platform: "ios" | "android" | "web";
  registrationId?: string;           // Linked attendee
  adminId?: string;                  // Linked admin (for admin notifications)

  // Preferences
  preferences: {
    announcements: boolean;
    scheduleChanges: boolean;
    reminders: boolean;
    alerts: boolean;
  };

  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastUsed: Timestamp;
}
```

### Session Reminders
```typescript
// sessionReminders/{reminderId}
interface SessionReminder {
  reminderId: string;
  sessionId: string;
  sessionTitle: string;
  sessionStartTime: Timestamp;
  registrationId: string;
  fcmTokens: string[];
  reminderTime: Timestamp;           // 15 min before session
  sent: boolean;
  sentAt?: Timestamp;
}
```

---

## Backend Implementation

### Cloud Functions

#### `sendNotification`
```typescript
/**
 * sendNotification (HTTPS Callable)
 * Purpose: Send push notification to audience
 * Inputs: { title, body, type, audience, targetCategories?, targetWorkshops?, scheduledFor? }
 * Outputs: { ok: true, notificationId, targetCount }
 * Security: Admin only
 */
```

#### `processScheduledNotifications` (Scheduled)
```typescript
/**
 * processScheduledNotifications (Scheduled)
 * Purpose: Send scheduled notifications
 * Runs: Every 5 minutes
 * Logic: Find due notifications, send via FCM
 */
```

#### `processSessionReminders` (Scheduled)
```typescript
/**
 * processSessionReminders (Scheduled)
 * Purpose: Send session reminders
 * Runs: Every 5 minutes
 * Logic: Find reminders due in next 5 min, send via FCM
 */
```

#### `registerFCMToken`
```typescript
/**
 * registerFCMToken (HTTPS Callable)
 * Purpose: Register device FCM token
 * Inputs: { token, platform, registrationId? }
 * Outputs: { ok: true }
 * Security: Public (with valid token)
 */
```

#### `updateNotificationPreferences`
```typescript
/**
 * updateNotificationPreferences (HTTPS Callable)
 * Purpose: Update user notification preferences
 * Inputs: { tokenId, preferences }
 * Outputs: { ok: true }
 * Security: Token owner
 */
```

---

## Frontend Implementation

### Admin Pages
```
/src/pages/admin/
├── notifications/
│   ├── index.tsx            # Notification history
│   ├── compose.tsx          # Compose notification
│   └── [id].tsx             # Notification details
```

### Mobile Components
```
/src/components/notifications/
├── NotificationCenter.tsx
├── NotificationItem.tsx
├── NotificationBanner.tsx
├── ReminderButton.tsx
├── NotificationSettings.tsx
└── PushPermissionPrompt.tsx
```

---

## Edge Cases
* **User disables notifications:** Respect preference, show in-app only.
* **Invalid FCM token:** Remove from database, stop sending.
* **Large audience (1000+):** Batch send in chunks of 500.
* **Notification fails:** Retry up to 3 times with backoff.
* **Scheduled in past:** Send immediately.
* **Session cancelled:** Cancel related reminders.
* **Duplicate token registration:** Update existing record.

---

## Metrics / Success
* **Delivery rate:** ≥ 95%.
* **Open rate:** ≥ 50% for announcements.
* **Reminder set rate:** ≥ 30% of bookmarked sessions.
* **Opt-out rate:** < 10%.

---

## Test Scenarios
* **Send to all:** Notification reaches all devices.
* **Target category:** Only Regular attendees receive.
* **Schedule for future:** Notification sent at scheduled time.
* **Session reminder:** Reminder sent 15 min before.
* **User opts out:** No notification received.
* **App in foreground:** In-app banner shown.
* **App in background:** System notification shown.

---

## Links
* **Parent Epic:** [IDMC-EVT Event Management v1](./IDMC-EVT-Event-Management-v1.md)
* **Related:** [IDMC-EVT-13 Mobile Attendee App](./IDMC-EVT-13-Mobile-Attendee-App.md)
* **Related:** [IDMC-EVT-11 Mobile Check-in App](./IDMC-EVT-11-Mobile-Check-in-App.md)

---

## Changelog
* **v1.0.0 — 2025-12-12** - Initial epic creation with 77 acceptance criteria.
