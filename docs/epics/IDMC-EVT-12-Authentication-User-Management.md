# IDMC-EVT-12 · Authentication & User Management

## Product & QA Doc

### Summary
**Authentication and user management system** that provides secure access control for the IDMC Event platform. Handles admin/volunteer authentication, role-based permissions, user invitation workflow, and session management across web and mobile applications.

**Target users:** Super Admin (primary), Admin (secondary), Volunteers (tertiary).

---

## Goals
* Provide **secure authentication** using Firebase Auth.
* Implement **role-based access control (RBAC)** for different user types.
* Enable **user invitation workflow** for onboarding admins and volunteers.
* Support **password management** (reset, change).
* Ensure **session security** with proper token handling.
* Protect **routes and API endpoints** based on roles.

## Non-Goals
* Attendee authentication (attendees access public pages only for v1).
* Social login (Google, Facebook) - future phase.
* Multi-factor authentication (MFA) - future phase.
* Single sign-on (SSO) integration.

---

## Scope

### In
* **Firebase Auth setup** and configuration.
* **Email/password authentication** for admins and volunteers.
* **Role definitions** (superadmin, admin, volunteer).
* **Permission matrix** for each role.
* **User invitation system** with email invites.
* **Password reset flow** via email.
* **Session management** (login, logout, token refresh).
* **Protected route guards** for web application.
* **API authentication** for Cloud Functions.
* **Mobile authentication** token handling.

### Out
* Attendee login/accounts.
* Social authentication providers.
* Multi-factor authentication.
* SSO/SAML integration.
* Biometric authentication.

---

## User Stories

* As a **super admin**, I can invite new admin users via email.
* As a **super admin**, I can assign roles to users.
* As a **super admin**, I can deactivate user accounts.
* As an **admin**, I can log in with email and password.
* As an **admin**, I can reset my password if forgotten.
* As an **admin**, I can change my password.
* As an **admin**, I can log out and end my session.
* As a **volunteer**, I can log in to access check-in features only.
* As a **user**, I am redirected to login if accessing protected pages.
* As a **user**, my session persists across browser tabs.

---

## Flows & States

### A) Admin Login Flow
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Login Page  │────►│  Validate    │────►│  Dashboard   │
│              │     │  Credentials │     │              │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
                            │ Invalid
                            ▼
                     ┌──────────────┐
                     │ Error Message│
                     │ Retry        │
                     └──────────────┘
```

1. User navigates to /admin or protected route.
2. System checks for valid session.
3. No session → redirect to /admin/login.
4. User enters email and password.
5. System validates against Firebase Auth.
6. Valid → check user role in Firestore.
7. Role valid → create session, redirect to dashboard.
8. Invalid → show error message.

### B) User Invitation Flow
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Super Admin  │────►│ Send Invite  │────►│ Email Sent   │
│ Invites User │     │ Email        │     │ to User      │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                                  ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  User Logs   │◄────│ User Sets    │◄────│ User Clicks  │
│  In          │     │ Password     │     │ Invite Link  │
└──────────────┘     └──────────────┘     └──────────────┘
```

1. Super admin opens User Management.
2. Clicks "Invite User".
3. Enters email and selects role.
4. System creates pending user record.
5. Invitation email sent with setup link.
6. User clicks link → Set Password page.
7. User sets password.
8. Account activated, user can log in.

### C) Password Reset Flow
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Forgot       │────►│ Enter Email  │────►│ Reset Email  │
│ Password     │     │              │     │ Sent         │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                                  ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Login       │◄────│ Set New      │◄────│ Click Reset  │
│  Page        │     │ Password     │     │ Link         │
└──────────────┘     └──────────────┘     └──────────────┘
```

### D) Session Management Flow
```
┌─────────────────────────────────────────────────────────┐
│                  SESSION LIFECYCLE                       │
└─────────────────────────────────────────────────────────┘

Login Success
     │
     ▼
┌──────────────┐
│ Create       │
│ Session      │───► Store token in secure storage
└──────┬───────┘     (httpOnly cookie or localStorage)
       │
       ▼
┌──────────────┐     ┌──────────────┐
│ Active       │────►│ Token        │───► Auto-refresh
│ Session      │     │ Expiring     │     before expiry
└──────┬───────┘     └──────────────┘
       │
       │ User clicks logout OR
       │ Session timeout (8 hrs)
       ▼
┌──────────────┐
│ Destroy      │───► Clear tokens
│ Session      │     Redirect to login
└──────────────┘
```

---

## Acceptance Criteria (QA)

### IDMC-EVT-12-AC · Firebase Auth Setup
* [ ] **IDMC-EVT-12-AC-01** Firebase Auth configured for project.
* [ ] **IDMC-EVT-12-AC-02** Email/password provider enabled.
* [ ] **IDMC-EVT-12-AC-03** Email templates customized (reset, invite).
* [ ] **IDMC-EVT-12-AC-04** Auth emulator works for local development.
* [ ] **IDMC-EVT-12-AC-05** Production auth rules configured.

### IDMC-EVT-12-AC · Login Flow
* [ ] **IDMC-EVT-12-AC-06** Login page at /admin/login.
* [ ] **IDMC-EVT-12-AC-07** Email field with validation.
* [ ] **IDMC-EVT-12-AC-08** Password field with show/hide toggle.
* [ ] **IDMC-EVT-12-AC-09** "Login" button with loading state.
* [ ] **IDMC-EVT-12-AC-10** Invalid email format shows error.
* [ ] **IDMC-EVT-12-AC-11** Wrong credentials show "Invalid email or password".
* [ ] **IDMC-EVT-12-AC-12** Deactivated account shows "Account disabled".
* [ ] **IDMC-EVT-12-AC-13** Successful login redirects to intended page.
* [ ] **IDMC-EVT-12-AC-14** Successful login redirects to dashboard if no intended page.
* [ ] **IDMC-EVT-12-AC-15** "Forgot Password" link visible.

### IDMC-EVT-12-AC · Role-Based Access Control
* [ ] **IDMC-EVT-12-AC-16** Role "superadmin" defined with full access.
* [ ] **IDMC-EVT-12-AC-17** Role "admin" defined with management access.
* [ ] **IDMC-EVT-12-AC-18** Role "volunteer" defined with check-in access only.
* [ ] **IDMC-EVT-12-AC-19** Roles stored in Firestore admins collection.
* [ ] **IDMC-EVT-12-AC-20** Role checked on every protected request.
* [ ] **IDMC-EVT-12-AC-21** Insufficient role shows "Access Denied" page.
* [ ] **IDMC-EVT-12-AC-22** Navigation shows only permitted sections.

### IDMC-EVT-12-AC · Permission Matrix
* [ ] **IDMC-EVT-12-AC-23** Super admin can manage users.
* [ ] **IDMC-EVT-12-AC-24** Super admin can manage all content.
* [ ] **IDMC-EVT-12-AC-25** Admin can manage speakers, schedule, registrations.
* [ ] **IDMC-EVT-12-AC-26** Admin cannot manage other users.
* [ ] **IDMC-EVT-12-AC-27** Volunteer can access check-in only.
* [ ] **IDMC-EVT-12-AC-28** Volunteer cannot view registrations list.
* [ ] **IDMC-EVT-12-AC-29** Permissions enforced at API level.
* [ ] **IDMC-EVT-12-AC-30** Permissions enforced at UI level.

### IDMC-EVT-12-AC · User Invitation
* [ ] **IDMC-EVT-12-AC-31** "Invite User" button for super admin.
* [ ] **IDMC-EVT-12-AC-32** Invite form: email, role selection.
* [ ] **IDMC-EVT-12-AC-33** Duplicate email check before invite.
* [ ] **IDMC-EVT-12-AC-34** Invitation record created with status "pending".
* [ ] **IDMC-EVT-12-AC-35** Invitation email sent with setup link.
* [ ] **IDMC-EVT-12-AC-36** Setup link valid for 72 hours.
* [ ] **IDMC-EVT-12-AC-37** Expired link shows error with resend option.
* [ ] **IDMC-EVT-12-AC-38** Setup page: set password form.
* [ ] **IDMC-EVT-12-AC-39** Password minimum 8 characters.
* [ ] **IDMC-EVT-12-AC-40** Password confirmation field.
* [ ] **IDMC-EVT-12-AC-41** Successful setup activates account.
* [ ] **IDMC-EVT-12-AC-42** User redirected to login after setup.
* [ ] **IDMC-EVT-12-AC-43** Resend invitation option for pending users.

### IDMC-EVT-12-AC · Password Reset
* [ ] **IDMC-EVT-12-AC-44** "Forgot Password" link on login page.
* [ ] **IDMC-EVT-12-AC-45** Forgot password page: email input.
* [ ] **IDMC-EVT-12-AC-46** Submit sends reset email via Firebase.
* [ ] **IDMC-EVT-12-AC-47** Success message regardless of email existence (security).
* [ ] **IDMC-EVT-12-AC-48** Reset email contains secure link.
* [ ] **IDMC-EVT-12-AC-49** Reset link valid for 1 hour.
* [ ] **IDMC-EVT-12-AC-50** Reset page: new password form.
* [ ] **IDMC-EVT-12-AC-51** Password confirmation required.
* [ ] **IDMC-EVT-12-AC-52** Successful reset redirects to login.
* [ ] **IDMC-EVT-12-AC-53** Expired link shows error.

### IDMC-EVT-12-AC · Session Management
* [ ] **IDMC-EVT-12-AC-54** Auth token stored securely.
* [ ] **IDMC-EVT-12-AC-55** Token refreshed automatically before expiry.
* [ ] **IDMC-EVT-12-AC-56** Session persists across page refreshes.
* [ ] **IDMC-EVT-12-AC-57** Session persists across browser tabs.
* [ ] **IDMC-EVT-12-AC-58** Session timeout after 8 hours inactivity.
* [ ] **IDMC-EVT-12-AC-59** Logout clears all session data.
* [ ] **IDMC-EVT-12-AC-60** Logout redirects to login page.
* [ ] **IDMC-EVT-12-AC-61** Invalid/expired token redirects to login.

### IDMC-EVT-12-AC · Protected Routes
* [ ] **IDMC-EVT-12-AC-62** All /admin/* routes require authentication.
* [ ] **IDMC-EVT-12-AC-63** Unauthenticated access redirects to login.
* [ ] **IDMC-EVT-12-AC-64** Original URL preserved for post-login redirect.
* [ ] **IDMC-EVT-12-AC-65** Role-specific routes check permissions.
* [ ] **IDMC-EVT-12-AC-66** API endpoints validate auth token.
* [ ] **IDMC-EVT-12-AC-67** API returns 401 for missing/invalid token.
* [ ] **IDMC-EVT-12-AC-68** API returns 403 for insufficient permissions.

### IDMC-EVT-12-AC · User Management
* [ ] **IDMC-EVT-12-AC-69** Users page lists all admin users.
* [ ] **IDMC-EVT-12-AC-70** List shows: name, email, role, status, last login.
* [ ] **IDMC-EVT-12-AC-71** Filter by role.
* [ ] **IDMC-EVT-12-AC-72** Filter by status (active, pending, inactive).
* [ ] **IDMC-EVT-12-AC-73** Edit user role (super admin only).
* [ ] **IDMC-EVT-12-AC-74** Deactivate user (super admin only).
* [ ] **IDMC-EVT-12-AC-75** Reactivate user (super admin only).
* [ ] **IDMC-EVT-12-AC-76** Cannot deactivate own account.
* [ ] **IDMC-EVT-12-AC-77** Cannot demote last super admin.
* [ ] **IDMC-EVT-12-AC-78** Activity log for user changes.

### IDMC-EVT-12-AC · Mobile Authentication
* [ ] **IDMC-EVT-12-AC-79** Mobile app uses same Firebase Auth.
* [ ] **IDMC-EVT-12-AC-80** Token stored in secure device storage.
* [ ] **IDMC-EVT-12-AC-81** Auto-login if valid token exists.
* [ ] **IDMC-EVT-12-AC-82** Token refresh handled automatically.
* [ ] **IDMC-EVT-12-AC-83** Logout clears secure storage.
* [ ] **IDMC-EVT-12-AC-84** Session sync across reinstalls (optional).

### IDMC-EVT-12-AC · Security
* [ ] **IDMC-EVT-12-AC-85** Passwords hashed (Firebase handles).
* [ ] **IDMC-EVT-12-AC-86** Rate limiting on login attempts.
* [ ] **IDMC-EVT-12-AC-87** Account lockout after 5 failed attempts.
* [ ] **IDMC-EVT-12-AC-88** Lockout duration: 15 minutes.
* [ ] **IDMC-EVT-12-AC-89** Login attempts logged for audit.
* [ ] **IDMC-EVT-12-AC-90** Sensitive actions require recent auth.

---

## Data Model

### Admin User Document
```typescript
// admins/{adminId}
interface Admin {
  adminId: string;                   // Firebase Auth UID
  email: string;
  displayName: string;
  photoUrl?: string;

  // Role & Permissions
  role: "superadmin" | "admin" | "volunteer";
  permissions: {
    manageConference: boolean;
    manageSpeakers: boolean;
    manageSchedule: boolean;
    manageRegistrations: boolean;
    manageCheckIn: boolean;
    manageUsers: boolean;
    viewAnalytics: boolean;
    manageFAQ: boolean;
    manageArchive: boolean;
  };

  // Status
  status: "active" | "pending" | "inactive";

  // Invitation
  invitedBy?: string;
  invitedAt?: Timestamp;
  inviteToken?: string;
  inviteExpiresAt?: Timestamp;

  // Activity
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
  lastLoginIp?: string;
}
```

### Permission Presets by Role
```typescript
const ROLE_PERMISSIONS = {
  superadmin: {
    manageConference: true,
    manageSpeakers: true,
    manageSchedule: true,
    manageRegistrations: true,
    manageCheckIn: true,
    manageUsers: true,
    viewAnalytics: true,
    manageFAQ: true,
    manageArchive: true,
  },
  admin: {
    manageConference: false,
    manageSpeakers: true,
    manageSchedule: true,
    manageRegistrations: true,
    manageCheckIn: true,
    manageUsers: false,
    viewAnalytics: true,
    manageFAQ: true,
    manageArchive: false,
  },
  volunteer: {
    manageConference: false,
    manageSpeakers: false,
    manageSchedule: false,
    manageRegistrations: false,
    manageCheckIn: true,
    manageUsers: false,
    viewAnalytics: false,
    manageFAQ: false,
    manageArchive: false,
  },
};
```

### Auth Activity Log
```typescript
// authLogs/{logId}
interface AuthLog {
  logId: string;
  userId?: string;
  email: string;
  action: "login_success" | "login_failed" | "logout" | "password_reset" | "invite_sent" | "account_activated" | "account_deactivated";
  ipAddress: string;
  userAgent: string;
  createdAt: Timestamp;
  details?: Record<string, any>;
}
```

---

## Backend Implementation

### Cloud Functions

#### `inviteUser`
```typescript
/**
 * inviteUser (HTTPS Callable)
 * Purpose: Invite a new admin/volunteer user
 * Inputs: { email, role, displayName }
 * Outputs: { ok: true, adminId }
 * Security: Super admin only
 */
```

#### `activateAccount`
```typescript
/**
 * activateAccount (HTTPS Callable)
 * Purpose: Activate invited user account
 * Inputs: { inviteToken, password }
 * Outputs: { ok: true }
 * Security: Valid invite token
 */
```

#### `updateUserRole`
```typescript
/**
 * updateUserRole (HTTPS Callable)
 * Purpose: Change user role
 * Inputs: { adminId, newRole }
 * Outputs: { ok: true }
 * Security: Super admin only
 */
```

#### `deactivateUser`
```typescript
/**
 * deactivateUser (HTTPS Callable)
 * Purpose: Deactivate user account
 * Inputs: { adminId }
 * Outputs: { ok: true }
 * Security: Super admin only, cannot deactivate self
 */
```

### Auth Middleware
```typescript
/**
 * validateAuth (Middleware)
 * Purpose: Validate Firebase token and load user
 * Checks: Token valid, user exists, user active
 * Attaches: req.user with role and permissions
 */

/**
 * requireRole (Middleware)
 * Purpose: Check user has required role
 * Usage: requireRole(['admin', 'superadmin'])
 */

/**
 * requirePermission (Middleware)
 * Purpose: Check user has specific permission
 * Usage: requirePermission('manageRegistrations')
 */
```

---

## Frontend Implementation

### Pages
```
/src/pages/admin/
├── login.tsx                # Login page
├── forgot-password.tsx      # Forgot password
├── reset-password.tsx       # Reset password (with token)
├── setup-account.tsx        # New user setup (with invite token)
└── users/
    ├── index.tsx            # User list
    └── invite.tsx           # Invite user form
```

### Components
```
/src/components/auth/
├── LoginForm.tsx
├── ForgotPasswordForm.tsx
├── ResetPasswordForm.tsx
├── SetupAccountForm.tsx
├── ProtectedRoute.tsx
├── RoleGuard.tsx
├── PermissionGuard.tsx
└── AuthProvider.tsx
```

### Auth Context
```typescript
// AuthContext provides:
interface AuthContext {
  user: Admin | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (roles: string[]) => boolean;
}
```

---

## Edge Cases
* **Invite to existing email:** Show "User already exists" error.
* **Expired invite link:** Show error with "Request new invite" option.
* **Last super admin demotion:** Block with "Cannot remove last super admin".
* **Self-deactivation:** Block with "Cannot deactivate own account".
* **Token refresh failure:** Redirect to login with "Session expired".
* **Account deactivated while logged in:** Force logout on next request.
* **Password reset for non-existent email:** Show success (security).
* **Multiple login attempts:** Rate limit and lockout after 5 failures.

---

## Security Considerations
* **Password requirements:** Minimum 8 characters, Firebase enforces.
* **Token storage:** httpOnly cookies (web) or secure keychain (mobile).
* **HTTPS only:** All auth endpoints require HTTPS.
* **CORS:** Restrict to known origins.
* **Rate limiting:** Prevent brute force attacks.
* **Audit logging:** Log all auth events.
* **Session invalidation:** Invalidate on password change.

---

## Metrics / Success
* **Login success rate:** ≥ 99%.
* **Login time:** < 2 seconds.
* **Password reset completion:** ≥ 90% of requests.
* **Invitation acceptance:** ≥ 95% within 72 hours.
* **Security incidents:** Zero unauthorized access.

---

## Test Data / Seed
* **Users:**
  - Super Admin: superadmin@idmc.org.sg (password: Test1234!)
  - Admin: admin@idmc.org.sg (password: Test1234!)
  - Volunteer: volunteer@idmc.org.sg (password: Test1234!)
  - Pending: pending@idmc.org.sg (invite sent)
  - Inactive: inactive@idmc.org.sg (deactivated)

---

## Links
* **Parent Epic:** [IDMC-EVT Event Management v1](./IDMC-EVT-Event-Management-v1.md)
* **Related:** [IDMC-EVT-07 Admin Dashboard](./IDMC-EVT-07-Admin-Dashboard.md)
* **Related:** [IDMC-EVT-11 Mobile Check-in App](./IDMC-EVT-11-Mobile-Check-in-App.md)

---

## Changelog
* **v1.0.0 — 2025-12-12** - Initial epic creation with 90 acceptance criteria.
