# Implementation Plan: IDMC-EVT-07 Admin Dashboard

## Overview

This plan outlines the implementation of the Admin Dashboard epic for the IDMC event management platform. The dashboard will provide conference organizers with tools to manage all aspects of the conference including analytics, content management, settings, and user administration.

---

## Current State Analysis

### Existing Patterns
- **Routing:** React Router with routes in `App.js`, constants in `ROUTES`
- **Auth:** localStorage-based via `AuthContext` (needs Firebase Auth upgrade)
- **Services:** Firestore CRUD operations in `src/services/`
- **Styling:** CSS Modules with CSS variables in `index.css`
- **Components:** Functional components with JSDoc, PropTypes
- **Constants:** Centralized in `src/constants/index.js`

### Key Files to Reference
- `src/pages/MaintenancePage.js` - existing admin pattern
- `src/context/AuthContext.js` - current auth implementation
- `src/components/auth/ProtectedRoute.js` - route protection
- `src/services/maintenance.js` - Firestore service pattern

---

## Architecture Design

### Directory Structure
```
src/
├── pages/
│   └── admin/
│       ├── AdminDashboardPage.js      # Dashboard overview
│       ├── AdminLoginPage.js          # Admin login
│       ├── AdminSettingsPage.js       # Conference settings
│       ├── AdminUsersPage.js          # User management
│       ├── AdminActivityPage.js       # Activity log
│       └── index.js                   # Exports
├── components/
│   └── admin/
│       ├── AdminLayout.js             # Layout with sidebar
│       ├── AdminSidebar.js            # Navigation sidebar
│       ├── AdminHeader.js             # Top header bar
│       ├── StatsCard.js               # Metric display card
│       ├── RegistrationChart.js       # Chart component
│       ├── RecentRegistrations.js     # Recent list table
│       ├── QuickActions.js            # Action buttons
│       ├── SettingsForm.js            # Settings form
│       ├── PricingTierForm.js         # Pricing management
│       ├── UserTable.js               # Users list
│       ├── InviteUserModal.js         # User invitation
│       ├── ActivityLogTable.js        # Activity log
│       └── index.js                   # Exports
├── services/
│   ├── admin.js                       # Admin CRUD operations
│   ├── auth.js                        # Firebase Auth service
│   ├── analytics.js                   # Dashboard stats
│   └── activityLog.js                 # Activity logging
└── constants/
    └── index.js                       # Add ADMIN_ROUTES, etc.
```

### Routing Structure
```
/admin                    # Redirects to /admin/login or /admin/dashboard
/admin/login              # Admin login page
/admin/dashboard          # Dashboard overview (default after login)
/admin/registrations      # Placeholder - links to EVT-09
/admin/speakers           # Links to existing maintenance
/admin/schedule           # Links to existing maintenance
/admin/workshops          # Links to existing maintenance
/admin/faq                # Links to existing maintenance
/admin/settings           # Conference settings
/admin/settings/pricing   # Pricing tiers (sub-route)
/admin/users              # User management
/admin/activity           # Activity log
```

---

## Implementation Phases

### Phase 1: Foundation (Authentication & Layout)
**Acceptance Criteria:** AC-01 to AC-09, AC-20 to AC-24

#### 1.1 Firebase Authentication Integration
- [ ] Add Firebase Auth to `lib/firebase.js`
- [ ] Create `services/auth.js` with Firebase Auth methods
- [ ] Update `AuthContext` to use Firebase Auth
- [ ] Implement email/password sign-in
- [ ] Implement session persistence
- [ ] Implement sign-out
- [ ] Add password reset functionality

**New Constants:**
```javascript
// In constants/index.js
export const ADMIN_ROUTES = {
  ROOT: '/admin',
  LOGIN: '/admin/login',
  DASHBOARD: '/admin/dashboard',
  REGISTRATIONS: '/admin/registrations',
  SPEAKERS: '/admin/speakers',
  SCHEDULE: '/admin/schedule',
  WORKSHOPS: '/admin/workshops',
  FAQ: '/admin/faq',
  SETTINGS: '/admin/settings',
  PRICING: '/admin/settings/pricing',
  USERS: '/admin/users',
  ACTIVITY: '/admin/activity',
};

export const ADMIN_ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  VOLUNTEER: 'volunteer',
};
```

#### 1.2 Admin Layout & Navigation
- [ ] Create `AdminLayout.js` component
- [ ] Create `AdminSidebar.js` with navigation links
- [ ] Create `AdminHeader.js` with user profile/logout
- [ ] Implement active page highlighting
- [ ] Implement collapsible sidebar for mobile
- [ ] Add protected route wrapper for admin pages

#### 1.3 Admin Login Page
- [ ] Create `AdminLoginPage.js`
- [ ] Email/password form with validation
- [ ] Error messages for invalid credentials
- [ ] Redirect to dashboard on success
- [ ] Link to password reset

**Files to Create:**
- `src/pages/admin/AdminLoginPage.js`
- `src/pages/admin/AdminLoginPage.module.css`
- `src/components/admin/AdminLayout.js`
- `src/components/admin/AdminLayout.module.css`
- `src/components/admin/AdminSidebar.js`
- `src/components/admin/AdminSidebar.module.css`
- `src/components/admin/AdminHeader.js`
- `src/components/admin/AdminHeader.module.css`
- `src/services/auth.js`

---

### Phase 2: Dashboard Overview
**Acceptance Criteria:** AC-10 to AC-19

#### 2.1 Stats Cards
- [ ] Create `StatsCard.js` component
- [ ] Total registrations count
- [ ] Confirmed registrations count
- [ ] Pending payment count
- [ ] Total revenue calculation
- [ ] Checked-in count (for event day)

#### 2.2 Charts
- [ ] Create `RegistrationChart.js` component
- [ ] Registration trend (daily/weekly view)
- [ ] Revenue trend chart
- [ ] Use lightweight charting (CSS-based or simple SVG)

#### 2.3 Recent Registrations
- [ ] Create `RecentRegistrations.js` component
- [ ] Display last 10 registrations
- [ ] Show name, email, status, date
- [ ] Quick action links

#### 2.4 Quick Actions Panel
- [ ] Create `QuickActions.js` component
- [ ] Add Speaker button
- [ ] Add Session button
- [ ] View Registrations link

#### 2.5 Dashboard Page
- [ ] Create `AdminDashboardPage.js`
- [ ] Integrate all dashboard components
- [ ] Real-time stats refresh on page load

**Files to Create:**
- `src/pages/admin/AdminDashboardPage.js`
- `src/pages/admin/AdminDashboardPage.module.css`
- `src/components/admin/StatsCard.js`
- `src/components/admin/StatsCard.module.css`
- `src/components/admin/RegistrationChart.js`
- `src/components/admin/RegistrationChart.module.css`
- `src/components/admin/RecentRegistrations.js`
- `src/components/admin/RecentRegistrations.module.css`
- `src/components/admin/QuickActions.js`
- `src/components/admin/QuickActions.module.css`
- `src/services/analytics.js`

---

### Phase 3: Conference Settings
**Acceptance Criteria:** AC-25 to AC-38

#### 3.1 Settings Form
- [ ] Create `SettingsForm.js` component
- [ ] Conference theme/title field
- [ ] Start/end date fields
- [ ] Venue information fields
- [ ] Registration open/close dates
- [ ] Banner image upload (Firebase Storage)
- [ ] Save with loading state
- [ ] Success/error toast notifications

#### 3.2 Pricing Tier Management
- [ ] Create `PricingTierForm.js` component
- [ ] Add new pricing tier
- [ ] Edit existing tiers
- [ ] Tier fields: name, start date, end date, regular price, student price
- [ ] Delete tier with confirmation
- [ ] Date validation (no overlaps)

#### 3.3 Settings Page
- [ ] Create `AdminSettingsPage.js`
- [ ] Tab layout for General / Pricing
- [ ] Integration with Firestore `conferences` collection

**Files to Create:**
- `src/pages/admin/AdminSettingsPage.js`
- `src/pages/admin/AdminSettingsPage.module.css`
- `src/components/admin/SettingsForm.js`
- `src/components/admin/SettingsForm.module.css`
- `src/components/admin/PricingTierForm.js`
- `src/components/admin/PricingTierForm.module.css`
- `src/services/conference.js`

---

### Phase 4: User Management
**Acceptance Criteria:** AC-39 to AC-46

#### 4.1 User List
- [ ] Create `UserTable.js` component
- [ ] Display: name, email, role, status
- [ ] Edit role action
- [ ] Activate/deactivate action
- [ ] Super admin only access check

#### 4.2 Invite User
- [ ] Create `InviteUserModal.js` component
- [ ] Email field
- [ ] Role selection (superadmin, admin, volunteer)
- [ ] Send invitation (create pending user in Firestore)

#### 4.3 Users Page
- [ ] Create `AdminUsersPage.js`
- [ ] User list with invite button
- [ ] Role-based access (super admin only)

**Files to Create:**
- `src/pages/admin/AdminUsersPage.js`
- `src/pages/admin/AdminUsersPage.module.css`
- `src/components/admin/UserTable.js`
- `src/components/admin/UserTable.module.css`
- `src/components/admin/InviteUserModal.js`
- `src/components/admin/InviteUserModal.module.css`
- `src/services/admin.js`

---

### Phase 5: Activity Log
**Acceptance Criteria:** AC-47 to AC-52

#### 5.1 Activity Log Table
- [ ] Create `ActivityLogTable.js` component
- [ ] Display: action, user, timestamp, details
- [ ] Filter by action type
- [ ] Filter by user
- [ ] Filter by date range
- [ ] Pagination for large logs

#### 5.2 Activity Logging Service
- [ ] Create `activityLog.js` service
- [ ] Log function for recording actions
- [ ] Query functions with filters

#### 5.3 Activity Page
- [ ] Create `AdminActivityPage.js`
- [ ] Integrate log table with filters

**Files to Create:**
- `src/pages/admin/AdminActivityPage.js`
- `src/pages/admin/AdminActivityPage.module.css`
- `src/components/admin/ActivityLogTable.js`
- `src/components/admin/ActivityLogTable.module.css`
- `src/services/activityLog.js`

---

### Phase 6: Integration & Polish

#### 6.1 Route Integration
- [ ] Update `App.js` with admin routes
- [ ] Create `AdminRoutes.js` for nested routing
- [ ] Connect sidebar links to existing maintenance pages

#### 6.2 Testing & Validation
- [ ] Run lint and typecheck
- [ ] Test all acceptance criteria
- [ ] Mobile responsiveness testing
- [ ] Cross-browser testing

---

## Data Models

### Admin User (Firestore: `admins/{adminId}`)
```javascript
{
  adminId: string,          // Firebase Auth UID
  email: string,
  displayName: string,
  role: 'superadmin' | 'admin' | 'volunteer',
  permissions: {
    manageConference: boolean,
    manageSpeakers: boolean,
    manageSchedule: boolean,
    manageRegistrations: boolean,
    manageCheckIn: boolean,
    manageUsers: boolean,
    viewAnalytics: boolean,
  },
  status: 'active' | 'inactive' | 'pending',
  invitedBy: string | null,
  invitedAt: Timestamp | null,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastLoginAt: Timestamp | null,
}
```

### Activity Log (Firestore: `activityLogs/{logId}`)
```javascript
{
  logId: string,
  conferenceId: string,
  action: string,           // 'registration.created', 'speaker.updated'
  actionCategory: 'registration' | 'speaker' | 'session' | 'settings' | 'user',
  description: string,
  entityType: string,
  entityId: string,
  performedBy: string,      // Admin UID
  performedByName: string,
  performedByEmail: string,
  details: object,
  createdAt: Timestamp,
}
```

---

## Dependencies & Considerations

### No Additional NPM Packages Required
- Charts will use CSS-based simple visualizations (bars/progress)
- If complex charts needed later, consider `recharts` or `chart.js`

### Firebase Setup Required
1. Enable Firebase Authentication (Email/Password)
2. Create initial super admin user in Firebase Console
3. Set up Firestore security rules for `admins` collection
4. Set up Firestore security rules for `activityLogs` collection

### Security Rules Updates
```javascript
// Add to firestore.rules
match /admins/{adminId} {
  allow read: if request.auth != null &&
    exists(/databases/$(database)/documents/admins/$(request.auth.uid));
  allow write: if request.auth != null &&
    get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == 'superadmin';
}

match /activityLogs/{logId} {
  allow read: if request.auth != null &&
    exists(/databases/$(database)/documents/admins/$(request.auth.uid));
  allow create: if false; // Only via Cloud Functions
}
```

---

## Estimated Effort by Phase

| Phase | Description | Complexity | Files |
|-------|-------------|------------|-------|
| 1 | Foundation (Auth & Layout) | High | ~12 files |
| 2 | Dashboard Overview | Medium | ~10 files |
| 3 | Conference Settings | Medium | ~6 files |
| 4 | User Management | Medium | ~6 files |
| 5 | Activity Log | Medium | ~4 files |
| 6 | Integration & Polish | Low | Updates |

**Total: ~38 new files**

---

## Success Criteria

1. Admin can log in with email/password at `/admin/login`
2. Session persists across page refreshes
3. Dashboard displays accurate registration stats
4. Admin can update conference settings
5. Admin can manage pricing tiers
6. Super admin can manage other admin users
7. Activity log tracks all admin actions
8. All admin pages are protected from unauthorized access
9. Mobile-responsive admin interface
10. All 52 acceptance criteria pass QA

---

## Open Questions for User

1. **Chart Library:** Should we use CSS-based simple bars/progress indicators, or add a charting library (recharts)?

2. **Email Notifications:** Should inviting a user send an email? (Requires Firebase Functions or third-party email service)

3. **Password Reset:** Should password reset be self-service via Firebase, or admin-initiated?

4. **Priority:** Which phase would you like implemented first? Recommend Phase 1 (Foundation) as prerequisite.

---

## Next Steps

Upon approval, implementation will proceed in phase order:
1. Phase 1: Foundation (Authentication & Layout)
2. Phase 2: Dashboard Overview
3. Phase 3: Conference Settings
4. Phase 4: User Management
5. Phase 5: Activity Log
6. Phase 6: Integration & Polish

Each phase will include:
- Implementation of components and services
- Lint and typecheck verification
- Basic testing
- Commit with descriptive message
