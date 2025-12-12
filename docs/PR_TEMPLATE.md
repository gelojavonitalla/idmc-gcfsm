# Summary
What does this change do? (One-liner + why)

## Linked Work
- Epic / Milestone: <!-- e.g., IDMC-EVT-01 -->

## Screenshots / Demos
<!-- UI changes, before/after, or brief gif -->

## Test Plan
- [ ] Builds locally
- [ ] Happy-path UX tested
- [ ] Edge cases (invalid input / empty states)
- [ ] Multi-tenant path (correct `tenantDb` resolved)
- [ ] Auth/roles checked (siteadmin/admin/principal)

## Deployment Notes
- [ ] Firestore **indexes** updated if needed (`backend/firestore.indexes.json`, applied via script)
- [ ] Firestore **rules** unaffected or updated
- [ ] Functions secrets/env unchanged (SendGrid keys, webhook key)
- [ ] Required Secret Manager secrets exist in GCP (e.g., `PAYMENT_WEBHOOK_SECRET`)
- [ ] Webhook routes unchanged (SendGrid bounce)

## Risk & Rollback
What can go wrong and how to roll back (revert/feature-flag)?

## Docs
- [ ] Feature doc / acceptance notes updated in ClickUp
- [ ] Feature README (in repo) updated if applicable
