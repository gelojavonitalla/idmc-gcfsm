# IDMC-EVT-09 · Attendee Management

## Product & QA Doc

### Summary
**Attendee management system** that enables admins to view, search, filter, and manage all conference registrations. Includes payment verification, status management, communication tools, and data export functionality.

**Target users:** Admin (primary), Finance Team (secondary).

---

## Goals
* Provide **comprehensive attendee list** with search and filters.
* Enable **payment verification** workflow.
* Support **status management** (confirm, cancel, refund).
* Allow **attendee communication** (resend emails).
* Enable **data export** for reporting.
* Track **registration notes** for internal use.

## Non-Goals
* Bulk email campaigns (use external tool).
* Automated payment reconciliation.
* Attendee self-service changes.
* Badge printing (separate system).

---

## Scope

### In
* **Attendee list** with all registrations.
* **Search** by name, email, registration ID.
* **Filters** by status, category, ticket type, workshop.
* **Attendee detail** view with full information.
* **Payment verification** actions.
* **Status change** actions (confirm, cancel).
* **Communication** actions (resend confirmation, ticket).
* **Data export** to CSV/Excel.
* **Bulk actions** for multiple selections.
* **Internal notes** on registrations.

### Out
* Bulk email marketing.
* Automated payment matching.
* Attendee profile editing by attendees.
* Refund processing automation.

---

## User Stories

* As an **admin**, I can view all registrations in a list.
* As an **admin**, I can search for a specific attendee.
* As an **admin**, I can filter attendees by status.
* As an **admin**, I can view full details of a registration.
* As an **admin**, I can verify a payment and confirm registration.
* As an **admin**, I can cancel a registration.
* As an **admin**, I can resend confirmation or ticket emails.
* As an **admin**, I can export attendee data to CSV.
* As an **admin**, I can add internal notes to a registration.
* As an **admin**, I can perform bulk actions on multiple registrations.

---

## Flows & States

### A) View Attendee List Flow
1. Admin navigates to Registrations.
2. Attendee list loads with default filters.
3. Table shows: ID, name, email, status, category, amount.
4. Admin can sort by any column.
5. Pagination for large lists.

### B) Payment Verification Flow
1. Admin finds pending payment registration.
2. Clicks on registration to open detail.
3. Reviews attendee info and amount.
4. Enters payment reference number.
5. Clicks "Confirm Payment".
6. Status updates to "confirmed".
7. Ticket email automatically sent.

### C) Export Data Flow
1. Admin applies desired filters.
2. Clicks "Export" button.
3. Format selection (CSV/Excel).
4. Export generates with filtered data.
5. File downloads to browser.

### D) Bulk Action Flow
1. Admin selects multiple registrations via checkboxes.
2. Bulk action menu appears.
3. Admin selects action (confirm, cancel, export).
4. Confirmation modal appears.
5. Action applied to all selected.
6. Results summary displayed.

---

## Acceptance Criteria (QA)

### IDMC-EVT-09-AC · Attendee List
* [ ] **IDMC-EVT-09-AC-01** List displays all registrations.
* [ ] **IDMC-EVT-09-AC-02** Columns: Reg ID, Name, Email, Category, Status, Amount, Date.
* [ ] **IDMC-EVT-09-AC-03** Sortable columns (click header to sort).
* [ ] **IDMC-EVT-09-AC-04** Default sort by date (newest first).
* [ ] **IDMC-EVT-09-AC-05** Pagination (20 items per page).
* [ ] **IDMC-EVT-09-AC-06** Total count displayed.
* [ ] **IDMC-EVT-09-AC-07** Status badges with colors.
* [ ] **IDMC-EVT-09-AC-08** Click row opens detail view.

### IDMC-EVT-09-AC · Search & Filters
* [ ] **IDMC-EVT-09-AC-09** Search box for text search.
* [ ] **IDMC-EVT-09-AC-10** Search matches: name, email, registration ID.
* [ ] **IDMC-EVT-09-AC-11** Real-time search results.
* [ ] **IDMC-EVT-09-AC-12** Filter by status (pending, confirmed, cancelled).
* [ ] **IDMC-EVT-09-AC-13** Filter by category (regular, student, NSF).
* [ ] **IDMC-EVT-09-AC-14** Filter by ticket type (early bird, regular, etc.).
* [ ] **IDMC-EVT-09-AC-15** Filter by workshop selection.
* [ ] **IDMC-EVT-09-AC-16** Filter by date range.
* [ ] **IDMC-EVT-09-AC-17** Clear filters button.
* [ ] **IDMC-EVT-09-AC-18** Filter state persists on navigation.

### IDMC-EVT-09-AC · Attendee Detail View
* [ ] **IDMC-EVT-09-AC-19** Detail shows registration ID.
* [ ] **IDMC-EVT-09-AC-20** Detail shows attendee name.
* [ ] **IDMC-EVT-09-AC-21** Detail shows email and phone.
* [ ] **IDMC-EVT-09-AC-22** Detail shows church/organization.
* [ ] **IDMC-EVT-09-AC-23** Detail shows category and ticket type.
* [ ] **IDMC-EVT-09-AC-24** Detail shows amount and payment status.
* [ ] **IDMC-EVT-09-AC-25** Detail shows workshop selections.
* [ ] **IDMC-EVT-09-AC-26** Detail shows special requirements.
* [ ] **IDMC-EVT-09-AC-27** Detail shows registration timestamp.
* [ ] **IDMC-EVT-09-AC-28** Detail shows check-in status.
* [ ] **IDMC-EVT-09-AC-29** Detail shows internal notes.

### IDMC-EVT-09-AC · Payment Verification
* [ ] **IDMC-EVT-09-AC-30** "Verify Payment" button for pending registrations.
* [ ] **IDMC-EVT-09-AC-31** Payment verification form.
* [ ] **IDMC-EVT-09-AC-32** Payment method selection.
* [ ] **IDMC-EVT-09-AC-33** Reference number field.
* [ ] **IDMC-EVT-09-AC-34** Notes field for payment details.
* [ ] **IDMC-EVT-09-AC-35** Confirm button with loading state.
* [ ] **IDMC-EVT-09-AC-36** Status updates to "confirmed".
* [ ] **IDMC-EVT-09-AC-37** Ticket email sent automatically.
* [ ] **IDMC-EVT-09-AC-38** Activity logged.

### IDMC-EVT-09-AC · Status Management
* [ ] **IDMC-EVT-09-AC-39** Cancel registration action.
* [ ] **IDMC-EVT-09-AC-40** Cancel confirmation modal.
* [ ] **IDMC-EVT-09-AC-41** Cancel reason field (optional).
* [ ] **IDMC-EVT-09-AC-42** Cancellation email sent.
* [ ] **IDMC-EVT-09-AC-43** Undo cancel (revert to previous status).
* [ ] **IDMC-EVT-09-AC-44** Mark as refunded option.

### IDMC-EVT-09-AC · Communication
* [ ] **IDMC-EVT-09-AC-45** Resend confirmation email action.
* [ ] **IDMC-EVT-09-AC-46** Resend ticket email action.
* [ ] **IDMC-EVT-09-AC-47** Email confirmation before sending.
* [ ] **IDMC-EVT-09-AC-48** Email sent timestamp displayed.

### IDMC-EVT-09-AC · Data Export
* [ ] **IDMC-EVT-09-AC-49** Export button visible.
* [ ] **IDMC-EVT-09-AC-50** Export respects current filters.
* [ ] **IDMC-EVT-09-AC-51** CSV format option.
* [ ] **IDMC-EVT-09-AC-52** Excel format option.
* [ ] **IDMC-EVT-09-AC-53** Export includes all relevant fields.
* [ ] **IDMC-EVT-09-AC-54** Export filename includes date.
* [ ] **IDMC-EVT-09-AC-55** Large export handled (1000+ rows).

### IDMC-EVT-09-AC · Bulk Actions
* [ ] **IDMC-EVT-09-AC-56** Checkbox on each row for selection.
* [ ] **IDMC-EVT-09-AC-57** Select all checkbox.
* [ ] **IDMC-EVT-09-AC-58** Selection count displayed.
* [ ] **IDMC-EVT-09-AC-59** Bulk confirm payment action.
* [ ] **IDMC-EVT-09-AC-60** Bulk cancel action.
* [ ] **IDMC-EVT-09-AC-61** Bulk export selected action.
* [ ] **IDMC-EVT-09-AC-62** Confirmation before bulk action.
* [ ] **IDMC-EVT-09-AC-63** Progress indicator for bulk operations.
* [ ] **IDMC-EVT-09-AC-64** Results summary after completion.

### IDMC-EVT-09-AC · Internal Notes
* [ ] **IDMC-EVT-09-AC-65** Notes section in detail view.
* [ ] **IDMC-EVT-09-AC-66** Add note textarea.
* [ ] **IDMC-EVT-09-AC-67** Notes show author and timestamp.
* [ ] **IDMC-EVT-09-AC-68** Notes are internal only (not visible to attendee).
* [ ] **IDMC-EVT-09-AC-69** Edit/delete own notes.

---

## Data Model

### Registration Notes (Sub-collection)
```typescript
// registrations/{registrationId}/notes/{noteId}
interface RegistrationNote {
  noteId: string;
  content: string;
  createdBy: string;
  createdByName: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
```

---

## Frontend Implementation

### Admin Pages
```
/src/pages/admin/
├── registrations/
│   ├── index.tsx            # Attendee list
│   └── [id].tsx             # Attendee detail
```

### Components
```
/src/components/attendees/
├── AttendeeTable.tsx
├── AttendeeFilters.tsx
├── AttendeeSearch.tsx
├── AttendeeDetail.tsx
├── PaymentVerifyForm.tsx
├── StatusActions.tsx
├── ExportButton.tsx
├── BulkActionsBar.tsx
├── NotesSection.tsx
└── EmailActions.tsx
```

---

## Edge Cases
* **Large dataset:** Virtual scrolling or server-side pagination.
* **Export timeout:** Background job for large exports.
* **Concurrent edits:** Optimistic locking with conflict warning.
* **Bulk action failure:** Partial success handling with report.
* **Email bounce:** Log bounce, show warning on resend.

---

## Metrics / Success
* **Search speed:** Results in < 500ms.
* **Payment verification:** < 1 minute per verification.
* **Export performance:** 1000 rows in < 10 seconds.
* **Data accuracy:** Zero discrepancies in export.

---

## Test Data / Seed
* **Registrations:** 50 mixed status registrations
  - 30 confirmed
  - 15 pending_payment
  - 5 cancelled

---

## Links
* **Parent Epic:** [IDMC-EVT Event Management v1](./IDMC-EVT-Event-Management-v1.md)
* **Related:** [IDMC-EVT-02 Registration](./IDMC-EVT-02-Registration-Ticketing.md)
* **Related:** [IDMC-EVT-10 Check-in](./IDMC-EVT-10-Check-in-Access-Control.md)

---

## Changelog
* **v1.0.0 — 2025-12-12** - Initial epic creation with 69 acceptance criteria.
