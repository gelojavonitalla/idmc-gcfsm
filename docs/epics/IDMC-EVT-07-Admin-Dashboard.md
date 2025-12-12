# IDMC-EVT-07 · Admin Dashboard

## Product & QA Doc

### Summary
**Admin dashboard and content management system** that provides conference organizers with tools to manage all aspects of the conference including analytics overview, content management, settings, and user administration.

**Target users:** Admin/Organizers (primary), Super Admin (secondary).

---

## Goals
* Provide **centralized dashboard** with key metrics and stats.
* Enable **conference configuration** (dates, pricing, venue).
* Support **admin user management** with role-based access.
* Display **real-time analytics** (registrations, revenue).
* Provide **quick actions** for common tasks.
* Ensure **secure authentication** for admin access.

## Non-Goals
* Public-facing features.
* Attendee self-service portal.
* Financial accounting/invoicing.
* Marketing automation.

---

## Scope

### In
* **Dashboard overview** with stats cards and charts.
* **Conference settings** management.
* **Pricing tier configuration**.
* **Admin user management** (invite, roles, permissions).
* **Activity log** for audit trail.
* **Quick actions** panel.
* **Navigation sidebar** to all admin sections.
* **Admin authentication** (email/password).
* **Role-based access control** (admin, volunteer).

### Out
* Financial reports/invoicing.
* Email campaign management.
* Marketing analytics.
* Multi-conference management (single conference for v1).

---

## User Stories

* As an **admin**, I can log in securely to the admin dashboard.
* As an **admin**, I can view key metrics (registrations, revenue, check-ins).
* As an **admin**, I can see registration trends over time.
* As an **admin**, I can configure conference settings.
* As an **admin**, I can manage pricing tiers and dates.
* As an **admin**, I can invite other admin users.
* As an **admin**, I can assign roles to users.
* As an **admin**, I can view activity logs.
* As a **super admin**, I can manage all admin users.

---

## Flows & States

### A) Admin Login Flow
1. Admin navigates to /admin.
2. Login page displays.
3. Admin enters email and password.
4. System validates credentials.
5. On success: redirect to dashboard.
6. On failure: show error message.

### B) Dashboard Overview Flow
1. Admin lands on dashboard after login.
2. Stats cards display key metrics.
3. Registration chart shows trends.
4. Recent registrations table shows latest.
5. Quick actions panel for common tasks.

### C) Conference Settings Flow
1. Admin navigates to Settings.
2. Conference configuration form displays.
3. Admin updates settings (dates, venue, etc.).
4. Admin clicks Save.
5. Settings updated with success message.

### D) Admin User Management Flow
1. Super admin navigates to Users.
2. List of admin users displayed.
3. Clicks "Invite User".
4. Enters email and selects role.
5. Invitation email sent.
6. New user appears in list.

---

## Acceptance Criteria (QA)

### IDMC-EVT-07-AC · Authentication
* [ ] **IDMC-EVT-07-AC-01** Admin login page at /admin/login.
* [ ] **IDMC-EVT-07-AC-02** Email and password fields.
* [ ] **IDMC-EVT-07-AC-03** Form validation for required fields.
* [ ] **IDMC-EVT-07-AC-04** Invalid credentials show error message.
* [ ] **IDMC-EVT-07-AC-05** Successful login redirects to dashboard.
* [ ] **IDMC-EVT-07-AC-06** Session persists across page refreshes.
* [ ] **IDMC-EVT-07-AC-07** Logout button clears session.
* [ ] **IDMC-EVT-07-AC-08** Protected routes redirect to login if unauthenticated.
* [ ] **IDMC-EVT-07-AC-09** Password reset functionality.

### IDMC-EVT-07-AC · Dashboard Overview
* [ ] **IDMC-EVT-07-AC-10** Dashboard displays total registrations count.
* [ ] **IDMC-EVT-07-AC-11** Dashboard displays confirmed registrations count.
* [ ] **IDMC-EVT-07-AC-12** Dashboard displays pending payment count.
* [ ] **IDMC-EVT-07-AC-13** Dashboard displays total revenue.
* [ ] **IDMC-EVT-07-AC-14** Dashboard displays checked-in count (on event day).
* [ ] **IDMC-EVT-07-AC-15** Registration trend chart (daily/weekly).
* [ ] **IDMC-EVT-07-AC-16** Revenue trend chart.
* [ ] **IDMC-EVT-07-AC-17** Recent registrations table (last 10).
* [ ] **IDMC-EVT-07-AC-18** Quick actions: Add Speaker, Add Session, View Registrations.
* [ ] **IDMC-EVT-07-AC-19** Stats update in real-time or on refresh.

### IDMC-EVT-07-AC · Navigation
* [ ] **IDMC-EVT-07-AC-20** Sidebar navigation visible on all admin pages.
* [ ] **IDMC-EVT-07-AC-21** Navigation items: Dashboard, Registrations, Speakers, Schedule, Workshops, FAQ, Settings, Users.
* [ ] **IDMC-EVT-07-AC-22** Active page highlighted in navigation.
* [ ] **IDMC-EVT-07-AC-23** Collapsible sidebar on smaller screens.
* [ ] **IDMC-EVT-07-AC-24** User profile/logout in header.

### IDMC-EVT-07-AC · Conference Settings
* [ ] **IDMC-EVT-07-AC-25** Settings page for conference configuration.
* [ ] **IDMC-EVT-07-AC-26** Conference theme/title editable.
* [ ] **IDMC-EVT-07-AC-27** Conference dates editable.
* [ ] **IDMC-EVT-07-AC-28** Venue information editable.
* [ ] **IDMC-EVT-07-AC-29** Registration open/close dates editable.
* [ ] **IDMC-EVT-07-AC-30** Banner image upload.
* [ ] **IDMC-EVT-07-AC-31** Save button with loading state.
* [ ] **IDMC-EVT-07-AC-32** Success/error toast on save.

### IDMC-EVT-07-AC · Pricing Tier Management
* [ ] **IDMC-EVT-07-AC-33** Pricing tiers section in settings.
* [ ] **IDMC-EVT-07-AC-34** Add new pricing tier.
* [ ] **IDMC-EVT-07-AC-35** Edit existing pricing tier.
* [ ] **IDMC-EVT-07-AC-36** Tier fields: name, start date, end date, regular price, student price.
* [ ] **IDMC-EVT-07-AC-37** Delete pricing tier (with confirmation).
* [ ] **IDMC-EVT-07-AC-38** Tier date validation (no overlaps).

### IDMC-EVT-07-AC · User Management
* [ ] **IDMC-EVT-07-AC-39** Users page lists all admin users.
* [ ] **IDMC-EVT-07-AC-40** User list shows: name, email, role, status.
* [ ] **IDMC-EVT-07-AC-41** Invite new user button.
* [ ] **IDMC-EVT-07-AC-42** Invite form: email, role selection.
* [ ] **IDMC-EVT-07-AC-43** Roles: superadmin, admin, volunteer.
* [ ] **IDMC-EVT-07-AC-44** Edit user role.
* [ ] **IDMC-EVT-07-AC-45** Deactivate/activate user.
* [ ] **IDMC-EVT-07-AC-46** Only super admin can manage users.

### IDMC-EVT-07-AC · Activity Log
* [ ] **IDMC-EVT-07-AC-47** Activity log page.
* [ ] **IDMC-EVT-07-AC-48** Log shows: action, user, timestamp, details.
* [ ] **IDMC-EVT-07-AC-49** Filter by action type.
* [ ] **IDMC-EVT-07-AC-50** Filter by user.
* [ ] **IDMC-EVT-07-AC-51** Filter by date range.
* [ ] **IDMC-EVT-07-AC-52** Pagination for large logs.

---

## Data Model

### Admin User Document
```typescript
// admins/{adminId}
interface Admin {
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
    manageUsers: boolean;
    viewAnalytics: boolean;
  };

  status: "active" | "inactive" | "pending";
  invitedBy?: string;
  invitedAt?: Timestamp;

  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
}
```

### Activity Log Document
```typescript
// activityLogs/{logId}
interface ActivityLog {
  logId: string;
  conferenceId: string;

  action: string;                    // "registration.created", "speaker.updated", etc.
  actionCategory: "registration" | "speaker" | "session" | "settings" | "user";
  description: string;

  entityType: string;
  entityId: string;

  performedBy: string;
  performedByName: string;
  performedByEmail: string;

  details: Record<string, any>;
  ipAddress?: string;

  createdAt: Timestamp;
}
```

---

## Frontend Implementation

### Admin Pages
```
/src/pages/admin/
├── index.tsx                # Dashboard
├── login.tsx                # Login page
├── settings/
│   ├── index.tsx            # Conference settings
│   └── pricing.tsx          # Pricing tiers
├── users/
│   ├── index.tsx            # User list
│   └── invite.tsx           # Invite user
└── activity.tsx             # Activity log
```

### Components
```
/src/components/admin/
├── AdminLayout.tsx          # Layout with sidebar
├── Sidebar.tsx
├── StatsCard.tsx
├── RegistrationChart.tsx
├── RecentRegistrations.tsx
├── QuickActions.tsx
├── SettingsForm.tsx
├── PricingTierForm.tsx
├── UserTable.tsx
├── InviteUserForm.tsx
└── ActivityLogTable.tsx
```

---

## Edge Cases
* **First admin setup:** Initial super admin created via Firebase Console.
* **Forgot password:** Firebase Auth password reset email.
* **Session timeout:** Redirect to login with "Session expired" message.
* **Concurrent edits:** Last save wins, show warning if data changed.
* **Role downgrade:** Cannot downgrade last super admin.
* **Self-deactivation:** Cannot deactivate own account.

---

## Metrics / Success
* **Admin efficiency:** Common tasks completable in < 3 clicks.
* **Dashboard load:** < 2 seconds.
* **Data accuracy:** Stats match actual database counts.
* **Security:** No unauthorized access incidents.

---

## Test Data / Seed
* **Admin Users:**
  - Super Admin (superadmin@idmc.org.sg)
  - Admin User (admin@idmc.org.sg)
  - Volunteer (volunteer@idmc.org.sg)

---

## Links
* **Parent Epic:** [IDMC-EVT Event Management v1](./IDMC-EVT-Event-Management-v1.md)
* **Related:** [IDMC-EVT-09 Attendee Management](./IDMC-EVT-09-Attendee-Management.md)
* **Related:** [IDMC-EVT-10 Check-in](./IDMC-EVT-10-Check-in-Access-Control.md)

---

## Changelog
* **v1.0.0 — 2025-12-12** - Initial epic creation with 52 acceptance criteria.
