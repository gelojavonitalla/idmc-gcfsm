# IDMC-EVT-06 · FAQ & Information Pages

## Product & QA Doc

### Summary
**Information pages system** including FAQ, About IDMC, Contact, and Venue pages. Provides comprehensive information for attendees with admin-managed content and searchable FAQ.

**Target users:** Attendees (primary), Admin (secondary).

---

## Goals
* Provide **comprehensive FAQ** with categorized questions.
* Enable **admin FAQ management** (CRUD operations).
* Display **About IDMC** with history and mission.
* Show **Venue information** with map and directions.
* Provide **Contact form** for inquiries.
* Support **FAQ search** functionality.

## Non-Goals
* Live chat support.
* Ticket-based support system.
* Multi-language content.
* Dynamic content personalization.

---

## Scope

### In
* **FAQ page** with accordion sections.
* **FAQ categories** (Registration, Payment, Venue, Accommodation, General).
* **FAQ search** functionality.
* **Admin FAQ CRUD** operations.
* **About page** with IDMC history and mission.
* **Venue page** with map and directions.
* **Contact page** with inquiry form.
* **Draft/published status** for FAQ items.

### Out
* Live chat widget.
* Support ticket system.
* Knowledge base with articles.
* Video tutorials.

---

## User Stories

* As an **attendee**, I can browse FAQ by category.
* As an **attendee**, I can search FAQ for specific questions.
* As an **attendee**, I can expand/collapse FAQ items.
* As an **attendee**, I can learn about IDMC's history.
* As an **attendee**, I can find venue location and directions.
* As an **attendee**, I can submit an inquiry via contact form.
* As an **admin**, I can add new FAQ items.
* As an **admin**, I can edit existing FAQ items.
* As an **admin**, I can organize FAQ by category.
* As an **admin**, I can reorder FAQ items.

---

## Flows & States

### A) Browse FAQ Flow
1. Attendee navigates to FAQ page.
2. Categories displayed as tabs or sections.
3. Questions displayed as accordion items.
4. Attendee clicks on question to expand.
5. Answer displays with formatting.
6. Click again to collapse.

### B) Search FAQ Flow
1. Attendee enters search term in search box.
2. Results filter in real-time.
3. Matching questions highlighted.
4. "No results" shown if no matches.

### C) Contact Inquiry Flow
1. Attendee navigates to Contact page.
2. Contact form displays with fields.
3. Attendee fills in name, email, subject, message.
4. Attendee submits form.
5. Success message displayed.
6. Email sent to admin.

### D) Admin FAQ Management Flow
1. Admin navigates to Admin → FAQ.
2. List of FAQ items displayed.
3. Admin clicks "Add FAQ".
4. Form opens for question and answer.
5. Admin selects category.
6. Admin saves FAQ item.

---

## Acceptance Criteria (QA)

### IDMC-EVT-06-AC · FAQ Page
* [ ] **IDMC-EVT-06-AC-01** FAQ page displays all published FAQ items.
* [ ] **IDMC-EVT-06-AC-02** FAQ organized by categories.
* [ ] **IDMC-EVT-06-AC-03** Categories: Registration, Payment, Venue, Accommodation, General.
* [ ] **IDMC-EVT-06-AC-04** Category tabs/sections for navigation.
* [ ] **IDMC-EVT-06-AC-05** Accordion component for Q&A display.
* [ ] **IDMC-EVT-06-AC-06** Click question expands to show answer.
* [ ] **IDMC-EVT-06-AC-07** Click again collapses answer.
* [ ] **IDMC-EVT-06-AC-08** Answer supports rich text formatting.
* [ ] **IDMC-EVT-06-AC-09** FAQ items ordered by order field.
* [ ] **IDMC-EVT-06-AC-10** Empty category message if no items.

### IDMC-EVT-06-AC · FAQ Search
* [ ] **IDMC-EVT-06-AC-11** Search box at top of FAQ page.
* [ ] **IDMC-EVT-06-AC-12** Real-time filtering as user types.
* [ ] **IDMC-EVT-06-AC-13** Search matches in question text.
* [ ] **IDMC-EVT-06-AC-14** Search matches in answer text.
* [ ] **IDMC-EVT-06-AC-15** Search term highlighted in results.
* [ ] **IDMC-EVT-06-AC-16** "No results found" message.
* [ ] **IDMC-EVT-06-AC-17** Clear search button.

### IDMC-EVT-06-AC · Admin FAQ Management
* [ ] **IDMC-EVT-06-AC-18** Admin can create new FAQ item.
* [ ] **IDMC-EVT-06-AC-19** Question field required.
* [ ] **IDMC-EVT-06-AC-20** Answer field supports rich text.
* [ ] **IDMC-EVT-06-AC-21** Category dropdown selection.
* [ ] **IDMC-EVT-06-AC-22** Order field for custom ordering.
* [ ] **IDMC-EVT-06-AC-23** Status: draft/published.
* [ ] **IDMC-EVT-06-AC-24** Admin can edit existing FAQ.
* [ ] **IDMC-EVT-06-AC-25** Admin can delete FAQ (confirmation).
* [ ] **IDMC-EVT-06-AC-26** Drag-and-drop reordering.

### IDMC-EVT-06-AC · About Page
* [ ] **IDMC-EVT-06-AC-27** About page displays IDMC history.
* [ ] **IDMC-EVT-06-AC-28** Mission statement displayed.
* [ ] **IDMC-EVT-06-AC-29** Key milestones or stats (years, countries).
* [ ] **IDMC-EVT-06-AC-30** Leadership transition info (if applicable).
* [ ] **IDMC-EVT-06-AC-31** Link to Covenant EFC website.

### IDMC-EVT-06-AC · Venue Page
* [ ] **IDMC-EVT-06-AC-32** Venue page shows venue name.
* [ ] **IDMC-EVT-06-AC-33** Full address displayed.
* [ ] **IDMC-EVT-06-AC-34** Embedded Google Map.
* [ ] **IDMC-EVT-06-AC-35** "Get Directions" link to Google Maps.
* [ ] **IDMC-EVT-06-AC-36** Public transport information.
* [ ] **IDMC-EVT-06-AC-37** Parking information.
* [ ] **IDMC-EVT-06-AC-38** Nearby amenities (optional).

### IDMC-EVT-06-AC · Contact Page
* [ ] **IDMC-EVT-06-AC-39** Contact form with name field.
* [ ] **IDMC-EVT-06-AC-40** Contact form with email field.
* [ ] **IDMC-EVT-06-AC-41** Contact form with subject field.
* [ ] **IDMC-EVT-06-AC-42** Contact form with message field.
* [ ] **IDMC-EVT-06-AC-43** Form validation before submission.
* [ ] **IDMC-EVT-06-AC-44** Success message after submission.
* [ ] **IDMC-EVT-06-AC-45** Email sent to designated admin email.
* [ ] **IDMC-EVT-06-AC-46** Spam protection (honeypot or reCAPTCHA).

---

## Data Model

### FAQ Document
```typescript
// faq/{faqId}
interface FAQ {
  faqId: string;
  conferenceId: string;

  question: string;
  answer: string;                    // Rich text HTML
  category: "registration" | "payment" | "venue" | "accommodation" | "general";

  order: number;
  status: "draft" | "published";

  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}
```

### Contact Inquiry Document
```typescript
// contactInquiries/{inquiryId}
interface ContactInquiry {
  inquiryId: string;
  conferenceId: string;

  name: string;
  email: string;
  subject: string;
  message: string;

  status: "new" | "read" | "replied";
  repliedAt?: Timestamp;
  repliedBy?: string;

  createdAt: Timestamp;
  ipAddress?: string;
}
```

---

## Frontend Implementation

### Public Pages
```
/src/pages/
├── faq.tsx                  # FAQ page
├── about.tsx                # About IDMC page
├── venue.tsx                # Venue info page
└── contact.tsx              # Contact form page
```

### Admin Pages
```
/src/pages/admin/
├── faq/
│   ├── index.tsx            # FAQ list
│   ├── new.tsx              # Add FAQ
│   └── [id].tsx             # Edit FAQ
```

### Components
```
/src/components/faq/
├── FAQAccordion.tsx
├── FAQSearch.tsx
├── FAQCategoryTabs.tsx
├── FAQForm.tsx
└── FAQItem.tsx

/src/components/contact/
├── ContactForm.tsx
└── VenueMap.tsx
```

---

## Edge Cases
* **No FAQ in category:** Show "No questions in this category" message.
* **Search no results:** Show "No results found. Try different keywords."
* **Contact form spam:** Implement honeypot field or reCAPTCHA.
* **Long answer text:** Accordion expands to fit content.
* **Map load failure:** Show static map image as fallback.

---

## Metrics / Success
* **FAQ effectiveness:** Reduced support inquiries after launch.
* **Search usage:** Track search terms for content improvement.
* **Contact form submissions:** < 10 per day indicates good FAQ.
* **Page load:** All info pages load < 2 seconds.

---

## Test Data / Seed
* **FAQ Items:**
  - Registration: "How do I register?", "Can I register on-site?"
  - Payment: "What payment methods are accepted?", "Is there a refund policy?"
  - Venue: "Where is the conference held?", "Is parking available?"
  - Accommodation: "Are there hotel recommendations?"
  - General: "What should I bring?", "Is there a dress code?"

---

## Links
* **Parent Epic:** [IDMC-EVT Event Management v1](./IDMC-EVT-Event-Management-v1.md)
* **Related:** [IDMC-EVT-01 Public Website](./IDMC-EVT-01-Public-Website-Landing-Page.md)

---

## Changelog
* **v1.0.0 — 2025-12-12** - Initial epic creation with 46 acceptance criteria.
