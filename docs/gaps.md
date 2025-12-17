# IDMC-EVT-01 Implementation Gaps

## Summary

During verification of Phase 2-5 implementation, the following gaps were identified against the acceptance criteria for IDMC-EVT-01 (Public Website & Landing Page).

---

## Gap 1: AC-04 - Speaker Photos

**Acceptance Criteria:**
> Featured speakers section with photos and names.

**Current State:**
- Speaker names are displayed ✅
- Speaker photos use placeholder circles with initials ⚠️

**Location:** `src/pages/HomePage.js:86-87`
```jsx
<div className={styles.speakerImagePlaceholder}>
  <span>{speaker.name.charAt(0)}</span>
</div>
```

**Recommendation:**
Add `photoUrl` support to speaker cards. The component should:
1. Display the actual photo if `photoUrl` is provided
2. Fall back to the placeholder initial if no photo is available

**Suggested Implementation:**
```jsx
{speaker.photoUrl ? (
  <img
    src={speaker.photoUrl}
    alt={speaker.name}
    className={styles.speakerImage}
  />
) : (
  <div className={styles.speakerImagePlaceholder}>
    <span>{speaker.name.charAt(0)}</span>
  </div>
)}
```

---

## Gap 2: AC-10 - IDMC History

**Acceptance Criteria:**
> About IDMC section with history and mission.

**Current State:**
- Mission statement ✅
- Organization description ✅
- Core values ✅
- History section ❌

**Location:** `src/pages/HomePage.js:194-217`

**Recommendation:**
Add a brief history paragraph about IDMC and/or GCF South Metro to the About section.

**Suggested Implementation:**
1. Add `HISTORY` field to `ORGANIZATION` constant in `src/constants/index.js`
2. Display history content in the About section of HomePage

**Example Content:**
```javascript
HISTORY: 'The Intentional Disciple-Making Churches (IDMC) Conference began as a vision to equip and mobilize churches across the Philippines for intentional discipleship. What started as a local initiative has grown into an annual gathering that brings together pastors, church leaders, and believers committed to the Great Commission.',
```

---

## Priority

| Gap | Priority | Effort |
|-----|----------|--------|
| AC-04: Speaker Photos | Medium | Low (code change ready, needs photo assets) |
| AC-10: IDMC History | Low | Low (content addition) |

---

## Status

- [x] AC-04: Speaker photo support implemented
- [x] AC-10: History section added (exists in About page)

---

## Deferred Epics

The following epics have been deferred and will not be implemented in the current release:

### IDMC-EVT-05: Workshops & Tracks

**Status:** ⏸️ Deferred

**Scope (not implementing):**
- Workshop pages, track organization, capacity management
- Workshop selection during registration
- Admin workshop management
- Multi-track workshop system with capacity limits
- Workshop categories (Missions, Marketplace, Social Justice, Media, Mental Wellness, Sexual Wholeness)
- Public workshops page with track view
- Workshop detail view

**Reason:** Deferred to future release per stakeholder decision.

---

*Last updated: 2025-12-16*
