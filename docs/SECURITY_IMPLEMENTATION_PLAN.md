# IDMC Security Implementation Plan

This document outlines the security improvements required for the IDMC conference management system, organized by priority and implementation phases.

---

## Executive Summary

The security audit identified several vulnerabilities that need to be addressed to protect user data and prevent unauthorized access. This plan provides a phased approach to implementing security improvements.

### Risk Assessment Overview

| Category | Issues Found | Severity |
|----------|--------------|----------|
| Data Access Control | 3 | Critical |
| Authentication/Authorization | 2 | High |
| Security Headers | 1 | Medium |
| Information Disclosure | 2 | Low |

---

## Phase 1: Critical Security Fixes (Immediate)

### 1.1 Implement Firestore Security Rules

**Priority:** CRITICAL
**Estimated Effort:** 4-6 hours
**Files Affected:** `firestore.rules`

#### Current Issue
```javascript
// DANGEROUS: Allows anyone to read/write all data
match /{document=**} {
  allow read, write: if request.time < timestamp.date(2026, 1, 10);
}
```

#### Implementation Steps

1. **Define helper functions for authentication and role checking:**
   ```javascript
   function isAuthenticated() {
     return request.auth != null;
   }

   function isAdmin() {
     return isAuthenticated() &&
            exists(/databases/$(database)/documents/admins/$(request.auth.uid));
   }

   function hasRole(role) {
     return isAdmin() &&
            get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == role;
   }

   function isSuperAdmin() {
     return hasRole('superadmin');
   }
   ```

2. **Implement per-collection rules:**

   ```javascript
   // Admins collection - only superadmins can manage
   match /admins/{adminId} {
     allow read: if isAdmin();
     allow create: if isSuperAdmin();
     allow update: if isSuperAdmin() || request.auth.uid == adminId;
     allow delete: if isSuperAdmin();
   }

   // Registrations collection
   match /registrations/{registrationId} {
     // Public can create (for registration form)
     allow create: if true;
     // Only admins can read all registrations
     allow read: if isAdmin();
     // Only admins can update
     allow update: if isAdmin();
     // Only superadmins can delete
     allow delete: if isSuperAdmin();
   }

   // Settings collection - admin read, superadmin write
   match /settings/{document} {
     allow read: if true; // Public settings like conference info
     allow write: if isSuperAdmin();
   }

   // Activity logs - admin read only
   match /activityLogs/{logId} {
     allow read: if isAdmin();
     allow create: if isAdmin();
     allow update, delete: if false;
   }
   ```

3. **Test rules using Firebase Emulator:**
   ```bash
   firebase emulators:start --only firestore
   # Run security rules tests
   ```

4. **Deploy rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```

#### Acceptance Criteria
- [ ] Unauthenticated users cannot read admin collection
- [ ] Unauthenticated users cannot read registration details
- [ ] Only admins can view/update registrations
- [ ] Only superadmins can manage other admins
- [ ] Registration creation still works for public users

---

### 1.2 Secure Registration Lookup Endpoint

**Priority:** CRITICAL
**Estimated Effort:** 6-8 hours
**Files Affected:**
- `src/services/registration.js`
- `src/pages/RegistrationStatusPage.js`
- `functions/src/index.ts` (new function)

#### Current Issue
The `lookupRegistration()` function exposes full registration data to anyone who can guess:
- A 4-character short code (only ~390K combinations)
- An email address
- A phone number

#### Implementation Steps

1. **Create a Cloud Function for secure lookups:**

   ```typescript
   // functions/src/index.ts

   /**
    * Secure registration lookup with rate limiting and data masking
    */
   export const lookupRegistrationSecure = onCall(
     {
       region: "asia-southeast1",
       enforceAppCheck: true, // Require App Check token
     },
     async (request) => {
       const { identifier } = request.data;

       if (!identifier || identifier.length < 4) {
         throw new HttpsError("invalid-argument", "Invalid identifier");
       }

       // Rate limiting: Check recent lookups from this IP
       // Implementation depends on your rate limiting strategy

       const db = getFirestore();
       let registration = null;

       // Lookup logic (similar to existing lookupRegistration)
       // ...

       if (!registration) {
         throw new HttpsError("not-found", "Registration not found");
       }

       // Return MASKED data only
       return {
         registrationId: registration.registrationId,
         shortCode: registration.shortCode,
         status: registration.status,
         primaryAttendee: {
           firstName: registration.primaryAttendee.firstName,
           // Mask last name: "Dela Cruz" -> "D***"
           lastName: maskName(registration.primaryAttendee.lastName),
           // Mask email: "john@example.com" -> "jo***@example.com"
           email: maskEmail(registration.primaryAttendee.email),
         },
         attendeeCount: 1 + (registration.additionalAttendees?.length || 0),
         // Don't expose: phone, payment details, church info, etc.
       };
     }
   );
   ```

2. **Add verification step for full data access:**

   Require users to verify ownership before showing full details:

   ```typescript
   /**
    * Verify registration ownership via email/SMS code
    */
   export const verifyRegistrationAccess = onCall(
     { region: "asia-southeast1" },
     async (request) => {
       const { registrationId, verificationCode } = request.data;

       // Verify the code matches what was sent
       // If valid, return full registration data
       // Consider using Firebase Auth phone/email verification
     }
   );
   ```

3. **Update frontend to use secure lookup:**

   ```javascript
   // src/services/registration.js

   import { httpsCallable } from 'firebase/functions';
   import { functions } from '../lib/firebase';

   export async function lookupRegistrationSecure(identifier) {
     const lookupFn = httpsCallable(functions, 'lookupRegistrationSecure');
     const result = await lookupFn({ identifier });
     return result.data;
   }
   ```

4. **Implement progressive disclosure:**
   - Initial lookup: Show masked data only
   - User clicks "Verify my registration"
   - Send verification code to registered email/phone
   - After verification: Show full data + QR codes

#### Acceptance Criteria
- [ ] Lookup returns masked data by default
- [ ] Full data requires verification
- [ ] Rate limiting prevents brute force attacks
- [ ] App Check prevents API abuse from non-app sources

---

### 1.3 Restrict Payment Proof Access

**Priority:** CRITICAL
**Estimated Effort:** 1-2 hours
**Files Affected:** `storage.rules`

#### Current Issue
```javascript
// Anyone can view payment receipts containing sensitive financial info
allow read: if true;
```

#### Implementation Steps

1. **Update storage rules:**

   ```javascript
   // Registration payment proofs - admin access only for reading
   match /registrations/payment-proofs/{registrationId}/{fileName} {
     // Only authenticated admins can read payment proofs
     allow read: if request.auth != null &&
                    firestore.exists(/databases/(default)/documents/admins/$(request.auth.uid));

     // Public can still upload (for registration form)
     allow write: if isValidPaymentProof();
   }
   ```

2. **Alternative: Use signed URLs for temporary access**

   If you need users to view their own payment proofs:

   ```typescript
   // Cloud Function to generate signed URL
   export const getPaymentProofUrl = onCall(
     { region: "asia-southeast1" },
     async (request) => {
       const { registrationId } = request.data;

       // Verify user owns this registration (via verification code)
       // Generate signed URL valid for 15 minutes
       const [url] = await bucket
         .file(`registrations/payment-proofs/${registrationId}/proof.jpg`)
         .getSignedUrl({
           action: 'read',
           expires: Date.now() + 15 * 60 * 1000,
         });

       return { url };
     }
   );
   ```

#### Acceptance Criteria
- [ ] Unauthenticated users cannot access payment proofs
- [ ] Admin users can still view payment proofs for verification
- [ ] Users can still upload payment proofs during registration

---

## Phase 2: High Priority Fixes

### 2.1 Add Security Headers

**Priority:** HIGH
**Estimated Effort:** 30 minutes
**Files Affected:** `firebase.json`

#### Implementation Steps

1. **Update firebase.json hosting configuration:**

   ```json
   {
     "hosting": {
       "public": "build",
       "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
       "headers": [
         {
           "source": "**",
           "headers": [
             {
               "key": "X-Frame-Options",
               "value": "DENY"
             },
             {
               "key": "X-Content-Type-Options",
               "value": "nosniff"
             },
             {
               "key": "X-XSS-Protection",
               "value": "1; mode=block"
             },
             {
               "key": "Referrer-Policy",
               "value": "strict-origin-when-cross-origin"
             },
             {
               "key": "Permissions-Policy",
               "value": "geolocation=(), microphone=(), camera=()"
             },
             {
               "key": "Strict-Transport-Security",
               "value": "max-age=31536000; includeSubDomains"
             },
             {
               "key": "Content-Security-Policy",
               "value": "frame-ancestors 'none'; default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.firebaseapp.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.cloudfunctions.net;"
             }
           ]
         },
         {
           "source": "**/*.@(js|css)",
           "headers": [
             {
               "key": "Cache-Control",
               "value": "public, max-age=31536000, immutable"
             }
           ]
         }
       ],
       "rewrites": [
         {
           "source": "**",
           "destination": "/index.html"
         }
       ]
     }
   }
   ```

2. **Deploy and verify:**
   ```bash
   firebase deploy --only hosting
   # Verify headers using browser dev tools or curl
   curl -I https://your-app.web.app
   ```

#### Acceptance Criteria
- [ ] All security headers are present in responses
- [ ] Site cannot be embedded in iframes (clickjacking protection)
- [ ] HTTPS is enforced via HSTS

---

### 2.2 Enable Firebase App Check

**Priority:** HIGH
**Estimated Effort:** 2-3 hours
**Files Affected:**
- `src/lib/firebase.js`
- `functions/src/index.ts`
- Firebase Console configuration

#### Implementation Steps

1. **Enable App Check in Firebase Console:**
   - Go to Firebase Console > App Check
   - Register your web app
   - Choose reCAPTCHA v3 as the provider
   - Get the site key

2. **Initialize App Check in frontend:**

   ```javascript
   // src/lib/firebase.js
   import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

   // Initialize App Check
   if (process.env.NODE_ENV === 'production') {
     initializeAppCheck(app, {
       provider: new ReCaptchaV3Provider(process.env.REACT_APP_RECAPTCHA_SITE_KEY),
       isTokenAutoRefreshEnabled: true,
     });
   }
   ```

3. **Add debug token for development:**

   ```javascript
   // For local development
   if (process.env.NODE_ENV === 'development') {
     self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
   }
   ```

4. **Enforce App Check in Cloud Functions:**

   ```typescript
   // Already shown in lookupRegistrationSecure
   export const sensitiveFunction = onCall(
     {
       enforceAppCheck: true,
     },
     async (request) => {
       // Function logic
     }
   );
   ```

5. **Enforce App Check for Firestore (optional):**
   - Go to Firebase Console > App Check > APIs
   - Enable enforcement for Cloud Firestore

#### Acceptance Criteria
- [ ] App Check is initialized in production
- [ ] Debug tokens work in development
- [ ] Sensitive Cloud Functions require valid App Check tokens
- [ ] Requests without valid tokens are rejected

---

### 2.3 Implement Server-Side Role Verification

**Priority:** HIGH
**Estimated Effort:** 3-4 hours
**Files Affected:**
- `functions/src/index.ts`
- Admin-related Cloud Functions

#### Implementation Steps

1. **Create role verification helper:**

   ```typescript
   // functions/src/auth.ts

   import { getFirestore } from 'firebase-admin/firestore';
   import { HttpsError } from 'firebase-functions/v2/https';

   interface AdminData {
     role: string;
     status: string;
     permissions?: string[];
   }

   export async function verifyAdminRole(
     uid: string | undefined,
     requiredRole?: string[]
   ): Promise<AdminData> {
     if (!uid) {
       throw new HttpsError('unauthenticated', 'User must be authenticated');
     }

     const db = getFirestore();
     const adminDoc = await db.collection('admins').doc(uid).get();

     if (!adminDoc.exists) {
       throw new HttpsError('permission-denied', 'User is not an admin');
     }

     const adminData = adminDoc.data() as AdminData;

     if (adminData.status !== 'active') {
       throw new HttpsError('permission-denied', 'Admin account is not active');
     }

     if (requiredRole && !requiredRole.includes(adminData.role)) {
       throw new HttpsError(
         'permission-denied',
         `Requires one of these roles: ${requiredRole.join(', ')}`
       );
     }

     return adminData;
   }
   ```

2. **Use in Cloud Functions:**

   ```typescript
   export const deleteRegistration = onCall(
     { region: "asia-southeast1" },
     async (request) => {
       // Verify user is superadmin
       await verifyAdminRole(request.auth?.uid, ['superadmin']);

       // Proceed with deletion
     }
   );
   ```

#### Acceptance Criteria
- [ ] All sensitive Cloud Functions verify admin role
- [ ] Role verification is centralized
- [ ] Inactive admins are rejected

---

## Phase 3: Medium Priority Improvements

### 3.1 Implement Rate Limiting

**Priority:** MEDIUM
**Estimated Effort:** 4-6 hours
**Files Affected:** `functions/src/index.ts`, new rate limiting module

#### Implementation Options

**Option A: Using Firebase Realtime Database for tracking**

```typescript
// functions/src/rateLimit.ts

import { getDatabase } from 'firebase-admin/database';
import { HttpsError } from 'firebase-functions/v2/https';

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
}

export async function checkRateLimit(
  identifier: string,  // IP address or user ID
  action: string,
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 10 }
): Promise<void> {
  const db = getDatabase();
  const ref = db.ref(`rateLimit/${action}/${identifier.replace(/\./g, '_')}`);

  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Get recent requests
  const snapshot = await ref.orderByValue().startAt(windowStart).get();
  const requestCount = snapshot.numChildren();

  if (requestCount >= config.maxRequests) {
    throw new HttpsError(
      'resource-exhausted',
      'Too many requests. Please try again later.'
    );
  }

  // Log this request
  await ref.push(now);

  // Clean up old entries (async, don't await)
  ref.orderByValue().endAt(windowStart).get().then((old) => {
    old.forEach((child) => child.ref.remove());
  });
}
```

**Option B: Using Cloud Tasks for more robust rate limiting**

Consider using a dedicated rate limiting service for production.

#### Acceptance Criteria
- [ ] Registration lookup is rate limited (10 requests/minute per IP)
- [ ] Verification code requests are rate limited (3 requests/hour per registration)
- [ ] Rate limit violations return appropriate error messages

---

### 3.2 Add Audit Logging for Sensitive Operations

**Priority:** MEDIUM
**Estimated Effort:** 2-3 hours
**Files Affected:** Cloud Functions, `src/services/activityLog.js`

#### Implementation Steps

1. **Log all registration data access:**

   ```typescript
   async function logDataAccess(
     action: string,
     registrationId: string,
     accessedBy: string,
     ipAddress?: string
   ) {
     const db = getFirestore();
     await db.collection('auditLogs').add({
       action,
       registrationId,
       accessedBy,
       ipAddress,
       timestamp: FieldValue.serverTimestamp(),
     });
   }
   ```

2. **Log admin actions:**
   - Registration status changes
   - Payment verification
   - Admin creation/modification
   - Data exports

#### Acceptance Criteria
- [ ] All registration data access is logged
- [ ] All admin actions are logged
- [ ] Logs include timestamp, user, action, and target

---

## Phase 4: Low Priority Enhancements

### 4.1 Remove Debug Logging

**Priority:** LOW
**Estimated Effort:** 1 hour
**Files Affected:** Various frontend files

#### Implementation Steps

1. **Search for console.log statements:**
   ```bash
   grep -r "console.log" src/
   grep -r "console.error" src/
   ```

2. **Remove or replace with proper logging:**
   - Remove debug logs
   - Keep error logs but ensure they don't expose sensitive data
   - Consider using a logging service for production

#### Files to Review
- `src/pages/SchedulePage.js`
- `src/pages/MaintenancePage.js`
- Various admin components

---

### 4.2 Implement Content Security Policy Reporting

**Priority:** LOW
**Estimated Effort:** 2 hours

#### Implementation Steps

1. **Set up CSP reporting endpoint (Cloud Function)**
2. **Update CSP header to include report-uri**
3. **Monitor and adjust CSP as needed**

---

## Implementation Checklist

### Phase 1: Critical (Complete within 1 week)
- [ ] 1.1 Implement Firestore Security Rules
- [ ] 1.2 Secure Registration Lookup Endpoint
- [ ] 1.3 Restrict Payment Proof Access

### Phase 2: High Priority (Complete within 2 weeks)
- [ ] 2.1 Add Security Headers
- [ ] 2.2 Enable Firebase App Check
- [ ] 2.3 Implement Server-Side Role Verification

### Phase 3: Medium Priority (Complete within 1 month)
- [ ] 3.1 Implement Rate Limiting
- [ ] 3.2 Add Audit Logging for Sensitive Operations

### Phase 4: Low Priority (Ongoing)
- [ ] 4.1 Remove Debug Logging
- [ ] 4.2 Implement CSP Reporting

---

## Testing Requirements

### Security Testing Checklist

1. **Authentication Tests**
   - [ ] Unauthenticated users cannot access admin routes
   - [ ] Expired sessions are handled properly
   - [ ] Invalid tokens are rejected

2. **Authorization Tests**
   - [ ] Users cannot access other users' data
   - [ ] Role-based access control works correctly
   - [ ] Privilege escalation is prevented

3. **Input Validation Tests**
   - [ ] SQL/NoSQL injection attempts are blocked
   - [ ] XSS payloads are sanitized
   - [ ] File upload restrictions are enforced

4. **Rate Limiting Tests**
   - [ ] Rate limits are enforced
   - [ ] Proper error messages are returned

---

## Rollback Plan

If any security change causes issues:

1. **Firestore Rules:** Keep a backup of current rules
   ```bash
   firebase firestore:rules:get > firestore.rules.backup
   ```

2. **Storage Rules:** Keep a backup of current rules
   ```bash
   firebase storage:rules:get > storage.rules.backup
   ```

3. **Cloud Functions:** Use versioned deployments
   ```bash
   firebase functions:list  # Check deployed versions
   ```

---

## Monitoring and Alerting

After implementation, set up monitoring for:

1. **Firebase Security Rules denials** (Cloud Logging)
2. **App Check failures** (Firebase Console)
3. **Rate limit violations** (Custom logging)
4. **Unusual access patterns** (Cloud Monitoring)

---

## References

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/rules)
- [Firebase App Check Documentation](https://firebase.google.com/docs/app-check)
- [OWASP Security Guidelines](https://owasp.org/www-project-web-security-testing-guide/)
- [Content Security Policy Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
