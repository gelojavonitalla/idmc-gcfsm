# IDMC-EVT-01 · Public Website & Landing Page

## Product & QA Doc

### Summary
**Public-facing conference website** that serves as the primary marketing and information hub for the IDMC Conference. Features a compelling landing page with conference theme, countdown timer, featured speakers, schedule highlights, and clear call-to-action for registration.

**Target users:** Potential Attendees (primary), Returning Attendees (secondary), General Public (tertiary).

---

## Goals
* Provide **compelling first impression** that communicates conference value proposition.
* Display **key conference information** (theme, dates, venue) prominently.
* Drive **registration conversions** with clear CTAs and pricing visibility.
* Showcase **featured speakers** to build credibility and interest.
* Ensure **responsive design** for optimal mobile experience.
* Enable **SEO optimization** for discoverability.

## Non-Goals
* User authentication (handled by registration flow).
* Dynamic content editing (handled by Admin Dashboard).
* Payment processing (handled by Registration epic).
* Session booking (handled by Schedule epic).

---

## Scope

### In
* **Landing page hero section** with theme, tagline, dates, and primary CTA.
* **Countdown timer** showing days/hours until conference.
* **Featured speakers section** with photos, names, and titles.
* **Schedule highlights** showing key sessions.
* **Pricing section** with tier comparison and registration CTAs.
* **About IDMC section** with history and mission.
* **Testimonials/highlights** from past conferences.
* **Venue information** with map and directions.
* **Navigation header** with links to all sections.
* **Footer** with contact info, social links, and legal.
* **Responsive design** for mobile, tablet, desktop.
* **SEO meta tags** and Open Graph data.

### Out
* Registration form (separate page/epic).
* Full speaker profiles (separate page/epic).
* Complete schedule (separate page/epic).
* Admin content management.
* User accounts/authentication.

---

## User Stories

* As a **potential attendee**, I can view the conference theme and understand what IDMC is about.
* As a **potential attendee**, I can see the conference dates and venue location.
* As a **potential attendee**, I can view featured speakers to gauge the quality of content.
* As a **potential attendee**, I can see pricing tiers to understand the cost.
* As a **potential attendee**, I can click "Register Now" to begin registration.
* As a **returning attendee**, I can quickly find what's new this year.
* As a **mobile user**, I can navigate the site easily on my phone.
* As a **visitor**, I can learn about IDMC's history and mission.

---

## Flows & States

### A) Landing Page Load Flow
1. User navigates to conference website URL.
2. Page loads with hero section visible above the fold.
3. Countdown timer begins counting down.
4. User scrolls to explore content sections.
5. Navigation becomes sticky on scroll.
6. User clicks CTA → redirects to registration page.

### B) Navigation Flow
1. User views navigation header with menu items.
2. On desktop: horizontal menu with all items visible.
3. On mobile: hamburger menu that expands to full-screen overlay.
4. User clicks menu item → smooth scroll to section (same page) or navigation to page.

### C) Mobile Responsive Flow
1. User accesses site on mobile device.
2. Hero section displays with stacked layout.
3. Speaker cards display in single column.
4. Navigation collapses to hamburger menu.
5. Touch-friendly tap targets for all interactive elements.

### Loading / Empty / Error States
* **Loading:** Skeleton loaders for images, spinner for countdown initialization.
* **Error (images):** Fallback placeholder image for broken speaker photos.
* **Error (page):** Friendly error page with retry option.
* **Offline:** Service worker serves cached version if available.

---

## Acceptance Criteria (QA)

### IDMC-EVT-01-M01 · Hero Section
* [ ] **IDMC-EVT-01-AC-01** Hero displays conference theme/title prominently.
* [ ] **IDMC-EVT-01-AC-02** Hero displays conference tagline/subtitle.
* [ ] **IDMC-EVT-01-AC-03** Hero displays conference dates (e.g., "September 5-6, 2025").
* [ ] **IDMC-EVT-01-AC-04** Hero displays venue name (e.g., "Singapore EXPO Hall 1").
* [ ] **IDMC-EVT-01-AC-05** Primary CTA button "Register Now" is visible and clickable.
* [ ] **IDMC-EVT-01-AC-06** Hero has visually appealing background (image/gradient).
* [ ] **IDMC-EVT-01-AC-07** Hero content is readable with proper contrast.
* [ ] **IDMC-EVT-01-AC-08** Hero is responsive on mobile (stacked layout).

### IDMC-EVT-01-M02 · Countdown Timer
* [ ] **IDMC-EVT-01-AC-09** Countdown displays days remaining until conference.
* [ ] **IDMC-EVT-01-AC-10** Countdown displays hours, minutes, seconds.
* [ ] **IDMC-EVT-01-AC-11** Countdown updates in real-time (every second).
* [ ] **IDMC-EVT-01-AC-12** Countdown shows "Event Started" or hides when date passes.
* [ ] **IDMC-EVT-01-AC-13** Countdown handles timezone correctly (SGT).

### IDMC-EVT-01-M03 · Featured Speakers Section
* [ ] **IDMC-EVT-01-AC-14** Section displays 4-6 featured speakers.
* [ ] **IDMC-EVT-01-AC-15** Each speaker card shows photo, name, title.
* [ ] **IDMC-EVT-01-AC-16** Speaker photos are optimized and lazy-loaded.
* [ ] **IDMC-EVT-01-AC-17** "View All Speakers" link navigates to speakers page.
* [ ] **IDMC-EVT-01-AC-18** Speaker cards are responsive (grid adjusts by screen size).
* [ ] **IDMC-EVT-01-AC-19** Fallback image displays if speaker photo fails to load.

### IDMC-EVT-01-M04 · Schedule Highlights Section
* [ ] **IDMC-EVT-01-AC-20** Section shows 3-5 key sessions/highlights.
* [ ] **IDMC-EVT-01-AC-21** Each highlight shows session title and brief description.
* [ ] **IDMC-EVT-01-AC-22** "View Full Schedule" link navigates to schedule page.
* [ ] **IDMC-EVT-01-AC-23** Sessions are visually distinguished (plenary vs workshop).

### IDMC-EVT-01-M05 · Pricing Section
* [ ] **IDMC-EVT-01-AC-24** Section displays all pricing tiers (Super Early Bird, Early Bird, Regular).
* [ ] **IDMC-EVT-01-AC-25** Each tier shows price for Regular and Student/NSF categories.
* [ ] **IDMC-EVT-01-AC-26** Current active tier is highlighted/emphasized.
* [ ] **IDMC-EVT-01-AC-27** Tier dates are displayed (valid from/to).
* [ ] **IDMC-EVT-01-AC-28** Each tier has "Register" CTA button.
* [ ] **IDMC-EVT-01-AC-29** Expired tiers are visually de-emphasized or hidden.

### IDMC-EVT-01-M06 · About IDMC Section
* [ ] **IDMC-EVT-01-AC-30** Section displays IDMC history and mission statement.
* [ ] **IDMC-EVT-01-AC-31** Content explains the purpose of the conference.
* [ ] **IDMC-EVT-01-AC-32** Optional: Include founding year or milestone stats.
* [ ] **IDMC-EVT-01-AC-33** "Learn More" link to dedicated About page (if exists).

### IDMC-EVT-01-M07 · Venue Section
* [ ] **IDMC-EVT-01-AC-34** Section displays venue name and full address.
* [ ] **IDMC-EVT-01-AC-35** Embedded Google Map or static map image.
* [ ] **IDMC-EVT-01-AC-36** "Get Directions" link opens Google Maps.
* [ ] **IDMC-EVT-01-AC-37** Parking and public transport info (if applicable).

### IDMC-EVT-01-M08 · Navigation
* [ ] **IDMC-EVT-01-AC-38** Header displays logo/brand name.
* [ ] **IDMC-EVT-01-AC-39** Navigation menu includes: Home, Speakers, Schedule, Register, FAQ.
* [ ] **IDMC-EVT-01-AC-40** Navigation is sticky on scroll (desktop).
* [ ] **IDMC-EVT-01-AC-41** Mobile navigation uses hamburger menu.
* [ ] **IDMC-EVT-01-AC-42** Mobile menu expands to show all navigation items.
* [ ] **IDMC-EVT-01-AC-43** Active page/section is highlighted in navigation.

### IDMC-EVT-01-M09 · Footer
* [ ] **IDMC-EVT-01-AC-44** Footer displays organizer info (Covenant EFC).
* [ ] **IDMC-EVT-01-AC-45** Footer displays contact email.
* [ ] **IDMC-EVT-01-AC-46** Footer displays social media links (if applicable).
* [ ] **IDMC-EVT-01-AC-47** Footer displays copyright notice.
* [ ] **IDMC-EVT-01-AC-48** Footer includes links: Privacy Policy, Terms (if applicable).

### IDMC-EVT-01-M10 · Responsive Design
* [ ] **IDMC-EVT-01-AC-49** Page displays correctly on mobile (320px - 480px).
* [ ] **IDMC-EVT-01-AC-50** Page displays correctly on tablet (768px - 1024px).
* [ ] **IDMC-EVT-01-AC-51** Page displays correctly on desktop (1024px+).
* [ ] **IDMC-EVT-01-AC-52** All interactive elements have minimum 44px touch target.
* [ ] **IDMC-EVT-01-AC-53** No horizontal scroll on any device.
* [ ] **IDMC-EVT-01-AC-54** Font sizes are readable on all devices.

### IDMC-EVT-01-M11 · Performance & SEO
* [ ] **IDMC-EVT-01-AC-55** Page loads in under 3 seconds on 3G connection.
* [ ] **IDMC-EVT-01-AC-56** Images are optimized (WebP format, lazy loading).
* [ ] **IDMC-EVT-01-AC-57** Meta title and description are set.
* [ ] **IDMC-EVT-01-AC-58** Open Graph tags for social sharing.
* [ ] **IDMC-EVT-01-AC-59** Semantic HTML structure (header, main, footer, sections).
* [ ] **IDMC-EVT-01-AC-60** Alt text on all images.

---

## Data Model

### Conference Data (Read from Firestore)
```typescript
// From conferences/{conferenceId}
interface ConferencePublicData {
  year: number;
  theme: string;
  tagline?: string;
  startDate: Timestamp;
  endDate: Timestamp;
  venue: {
    name: string;
    address: string;
    mapUrl?: string;
  };
  pricingTiers: PricingTier[];
  bannerImageUrl?: string;
  status: "published";
}
```

### Featured Speakers (Read from Firestore)
```typescript
// From speakers where featured == true
interface FeaturedSpeaker {
  speakerId: string;
  name: string;
  title: string;
  organization: string;
  photoUrl?: string;
  order: number;
}
```

---

## Frontend Implementation

### Page Structure
```
/src/pages/
├── index.tsx                 # Landing page
└── components/
    ├── Hero.tsx             # Hero section
    ├── Countdown.tsx        # Countdown timer
    ├── FeaturedSpeakers.tsx # Speaker cards
    ├── ScheduleHighlights.tsx
    ├── PricingSection.tsx
    ├── AboutSection.tsx
    ├── VenueSection.tsx
    ├── Header.tsx           # Navigation header
    └── Footer.tsx
```

### Key Components

#### Countdown Timer
```typescript
/**
 * Countdown
 * Purpose: Display real-time countdown to conference start date
 * Props: { targetDate: Date }
 * Updates: Every second via useEffect interval
 */
```

#### Hero Section
```typescript
/**
 * Hero
 * Purpose: Display conference theme, dates, and primary CTA
 * Props: { conference: ConferencePublicData }
 * Features: Responsive background, animated text (optional)
 */
```

---

## Edge Cases
* **Conference not published:** Show "Coming Soon" placeholder.
* **No featured speakers:** Hide speakers section or show placeholder.
* **Past conference date:** Hide countdown, show "Event Concluded" message.
* **Missing venue map:** Show address text only without map embed.
* **Image load failure:** Display fallback/placeholder images.
* **Slow connection:** Show skeleton loaders while content loads.

---

## Metrics / Success
* **Page load time:** ≤ 3 seconds on 3G.
* **Bounce rate:** < 40%.
* **CTA click rate:** ≥ 15% of visitors click "Register Now".
* **Mobile traffic:** Optimized for 60%+ mobile visitors.
* **Lighthouse score:** ≥ 90 for Performance, Accessibility, SEO.

---

## Test Data / Seed
* **Conference:** IDMC 2025 "All In For Jesus And His Kingdom"
* **Dates:** September 5-6, 2025
* **Venue:** Singapore EXPO Hall 1
* **Featured Speakers:** Rev Edmund Chan, Rev Tony Yeo, Rev Tan Kay Kiong, Rui En
* **Pricing:** Super Early Bird $170, Early Bird $210, Regular $290

---

## Links
* **Parent Epic:** [IDMC-EVT Event Management v1](./IDMC-EVT-Event-Management-v1.md)
* **Related:** [IDMC-EVT-02 Registration](./IDMC-EVT-02-Registration-Ticketing.md)
* **Related:** [IDMC-EVT-03 Speakers](./IDMC-EVT-03-Speaker-Management.md)

---

## Changelog
* **v1.0.0 — 2025-12-12** - Initial epic creation with 60 acceptance criteria across 11 milestones.
