# Maydan Launch Runbook

## Current Status

- Production deploy is live at `https://maydan-six.vercel.app`
- Core Phases 1-5 are complete in production
- Phase 6 validation completed:
  - Production browser smoke passed for `/login`, `/events/new`, and `/approvals`
  - Real-account launch validation passed on March 2, 2026
  - Real chain used: `Dana Haddad -> Susan Almasri -> Leila Kayed`
- Remaining blocker:
  - Resend domain verification and live email delivery validation
  - Lighthouse score capture from this terminal is blocked by local x64 Node and public PSI quota exhaustion

## Supporting Docs

- [Staff launch email](./Maydan_Staff_Launch_Email.md)
- [Onboarding script](./Maydan_Onboarding_Script.md)
- [Pilot rollout plan](./Maydan_Pilot_Rollout_Plan.md)

## Admin Walkthrough

Use `moneeb.sarmad@bhaprep.org`.

Verify:
- Login and logout
- `/admin/users` can add, edit, and deactivate users
- `/admin/entities` can assign entity heads
- `/admin/facilities` can add, edit, and deactivate facilities
- `/admin/audit` shows recent workflow history
- `/dashboard` shows live summary cards and recent activity

Admin sign-off checklist:
- Can access all admin routes
- Can see notifications
- Can see approval queue
- Can see calendar and event detail pages
- Confirms staff/entity/facility data looks correct

## Submitter Walkthroughs

Run one submitter walkthrough for each entity path:
- Club
- House
- Athletics
- HS Department
- MS Department

For each submitter:
- Login
- Open `/events/new`
- Submit a basic non-marketing event
- Confirm redirect to `/events/[id]`
- Confirm status is `pending`
- Confirm approval chain matches expected routing
- Confirm event appears in `/events`

Recommended real examples already available in production:
- English Department staff -> Department Head -> HS Principal
- Arabic Department staff -> Department Head -> HS Principal

## HS Principal Walkthrough

Use `leila.kayed@bhaprep.org`.

Verify:
- `/approvals` only shows items currently at her step
- Approving a final step marks the event `approved`
- Approved event appears on `/calendar`
- Facilities conflict notes are visible when present

## Soft Launch Plan

Before opening to staff:
- Confirm Vercel production env vars are still present
- Confirm Supabase project is healthy
- Confirm Resend domain status
- Confirm no pending schema or data migrations
- Confirm entity heads are correct for launch entities

Soft launch sequence:
1. Invite Admin and one pilot submitter per entity type.
2. Ask each pilot to submit one event.
3. Ask each approver in the chain to action one event.
4. Confirm Facilities visibility on all pilot submissions.
5. Expand access to all staff only after pilot flows are clean.

## Monitoring

### Supabase

Check:
- Auth login errors
- Postgres errors
- Realtime connection issues
- Storage errors for `marketing-uploads`

Focus areas:
- RLS denials on `events`, `approval_steps`, `notifications`, and `storage.objects`
- Failed inserts from event submission or approval actions
- Unexpected spikes in auth failures

### Vercel

Check:
- Production deployment status
- Function errors on dashboard, approvals, and events pages
- Server action failures

### Resend

Once `bhaprep.org` is verified:
- Confirm approval request delivery
- Confirm final approval delivery
- Confirm rejection / alternative delivery
- Confirm Facilities CC delivery
- Confirm PR notification delivery

## Week-One Feedback Loop

Collect from:
- Admin
- One submitter per entity type
- HS Principal
- Facilities Director

Ask:
- Was login and navigation clear?
- Was event submission understandable?
- Was the approval step obvious?
- Were any statuses confusing?
- Did any fields feel redundant or missing?
- Did notifications appear when expected?

Triage issues:
- `Critical`: blocks submission, approval, login, or route access
- `High`: incorrect routing, incorrect permissions, broken calendar visibility
- `Medium`: confusing UX, missing feedback, weak copy
- `Low`: polish and layout issues

## Known Open Items

- Resend domain verification and live email delivery test
- Lighthouse score capture from a supported arm64 Node environment
- Replace temporary placeholder advisers for `Chess Club` and `TED Talk Club`
