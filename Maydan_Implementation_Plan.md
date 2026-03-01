# Maydan — Implementation Plan
**Version:** 1.0  
**Status:** Draft  
**Last Updated:** February 27, 2026  
**Developer:** Moneeb (Solo)  
**Target:** V1 Launch in weeks — daily builds, balanced approach  

---

## Overview

6 phases, each building on the last. Every phase ends with something 
testable. UI is built first to validate flows before wiring up backend 
logic. Approval routing engine is treated as the highest-risk piece and 
gets its own dedicated phase.

**Estimated Total: 5–7 weeks at daily pace**

---

## Phase 1 — Project Foundation
**Est. Time: 3–4 days**  
**Goal: Repo live, stack connected, deployable shell**

### Steps
1. Create Next.js 14 app with App Router
```bash
   npx create-next-app@latest maydan --typescript --tailwind --app
```
2. Install and configure shadcn/ui
3. Set up Supabase project — create org, new project, save credentials
4. Install Supabase SSR client
```bash
   npm install @supabase/supabase-js @supabase/ssr
```
5. Configure environment variables (`.env.local`)
6. Set up Next.js middleware for session handling
7. Push to GitHub repo
8. Connect Vercel to GitHub — auto-deploy on push
9. Confirm live deployment URL works

### Milestone
App is live on Vercel. Supabase connected. No functionality yet — just a 
clean shell.

### Tests
- Vercel deployment succeeds
- Supabase client connects without errors
- Environment variables load correctly

---

## Phase 2 — UI Shell & Navigation
**Est. Time: 4–5 days**  
**Goal: All pages exist with real layout, no backend wiring yet**

### Steps
1. Build global layout — sidebar navigation, header, auth guard wrapper
2. Build all page shells (no data, just structure):
   - `/login` — login form UI
   - `/dashboard` — summary cards placeholder
   - `/events` — events list placeholder
   - `/events/new` — event submission form UI
   - `/events/[id]` — event detail view UI
   - `/approvals` — approval queue UI
   - `/approvals/[id]` — approval action UI
   - `/calendar` — calendar view placeholder
   - `/admin/users` — user management UI
   - `/admin/entities` — entity management UI
   - `/admin/facilities` — facility management UI
3. Build reusable components:
   - EventCard
   - StatusBadge (Draft / Pending / Approved / etc.)
   - ApprovalQueueItem
   - NotificationBell
   - UserAvatar
4. Build event submission form with all fields (static, no submit action yet)
5. Build marketing request sub-form (hidden until "Marketing Needed: Yes")
6. Mobile-responsive layout check

### Milestone
Full UI navigable in browser. All pages render. Forms look complete. 
No data loads yet — everything is static/mocked.

### Tests
- All routes render without errors
- Form fields render correctly
- Marketing sub-form shows/hides correctly on toggle
- Responsive on mobile and desktop

---

## Phase 3 — Auth & User Management
**Est. Time: 3–4 days**  
**Goal: Login works, roles enforced, Admin can manage users**

### Steps
1. Run Supabase DB migrations — create all tables from blueprint schema
2. Enable RLS on all tables
3. Seed initial data:
   - Facilities (Auditorium, Gym, Main Field, etc.)
   - Entities (all clubs, houses, departments, athletics)
   - Admin user account
4. Build login page — connect to Supabase Auth
5. Build password reset flow
6. Build Next.js middleware — redirect unauthenticated users to `/login`
7. On login, load user profile + role from `users` table
8. Store role in session context — accessible throughout app
9. Implement role-based UI guards:
   - Submitters don't see approval queue
   - Non-admins don't see admin panel
   - Approvers see their queue only
10. Build Admin: User Management page
    - List all users
    - Add new user (triggers Supabase invite email)
    - Edit user role and entity assignment
    - Deactivate user
11. Build Admin: Entity Management page
12. Build Admin: Facility Management page
13. Write RLS policies for all tables

### Milestone
Admin can log in, create users, assign roles and entities. Staff can log 
in and see role-appropriate UI. Wrong roles cannot access restricted pages.

### Tests
- Login succeeds with correct credentials
- Login fails gracefully with wrong credentials
- Submitter cannot access `/admin` or `/approvals`
- Admin can create, edit, deactivate users
- RLS blocks cross-user data access at DB level

---

## Phase 4 — Event Submission & Routing Engine
**Est. Time: 6–7 days**  
**Goal: Events can be submitted and routed to correct approvers**  
**⚠️ Highest complexity phase — take your time here**

### Steps
1. Build `lib/routing/approval-router.ts`
   - `buildApprovalChain(entityType, entityId, gradeLevel)` function
   - Returns ordered array of approver user IDs
   - Handles all 5 entity types
   - CC Facilities Director on all events
2. Wire up event submission form to Supabase
   - On submit: insert into `events` table
   - Call routing engine to build chain
   - Insert `approval_steps` rows for each step
   - Set event status to `pending`, `current_step` to 1
3. Notify Step 1 approver (in-app notification first, email second)
4. Build `lib/resend/emails.ts` — email notification functions
5. Connect Resend API — send approval request email to Step 1
6. Send CC notification to Facilities Director
7. Build event detail page — show full submission + current status
8. Build submitter dashboard — list of their submitted events with status
9. Handle marketing request:
   - If `marketing_needed: true`, insert into `marketing_requests`
   - Notify PR staff via in-app + email
10. Handle file upload for marketing requests via Supabase Storage

### Milestone
Staff member submits an event. System routes it to the correct approver 
based on entity type. Approver and Facilities Director receive 
notifications. Submitter sees event as "Pending."

### Tests
- Club event routes to Club Adviser → HS Principal
- League of Stars routes to House Mentor → Tarbiyah Director → HS Principal
- Athletics routes to Coach → Athletic Director → HS Principal
- HS Department routes to Department Head → HS Principal
- MS Department routes to Department Head → MS Principal
- Facilities Director receives notification on ALL event types
- Marketing request triggers PR notification
- File upload stores correctly in Supabase Storage

---

## Phase 5 — Approval Workflow & Real-time Updates
**Est. Time: 5–6 days**  
**Goal: Full approval chain works end-to-end with live updates**

### Steps
1. Build approval queue page — list of pending approvals for logged-in approver
2. Build approval action page `/approvals/[id]`:
   - Show full event details
   - Approve button
   - Reject button (requires reason field)
   - Suggest Alternative (date/time picker)
3. On approval:
   - Update `approval_steps` row to `approved`
   - Increment `events.current_step`
   - If more steps remain: notify next approver
   - If final step: set event to `approved`, notify submitter
4. On rejection:
   - Update step to `rejected`
   - Set event to `needs_revision`
   - Notify submitter with reason or alternative suggestion
5. On resubmission:
   - Reset all `approval_steps` to `pending`
   - Restart chain from Step 1
   - Notify Step 1 approver
6. Set up Supabase Realtime subscriptions:
   - Submitters subscribe to their event status changes
   - Approvers subscribe to new items in their queue
7. Build notification bell component:
   - Shows unread count
   - Dropdown with recent notifications
   - Mark as read on click
8. Build internal event calendar:
   - Show all approved events
   - Filter by entity, facility, grade level
9. Facilities Director view:
   - See all incoming events
   - Flag facility conflict with notes

### Milestone
Full approval chain works end-to-end. Approver approves or rejects, 
chain progresses automatically. Submitter sees live status updates 
without refreshing. Calendar shows approved events.

### Tests
- Approve at Step 1 → Step 2 approver notified automatically
- Approve at final step → event marked approved, submitter notified
- Reject at any step → event paused, submitter notified with reason
- Resubmission restarts chain from Step 1
- Real-time status update fires without page refresh
- Notification bell shows correct unread count
- Facilities Director can flag a conflict

---

## Phase 6 — Polish, Testing & Launch
**Est. Time: 4–5 days**  
**Goal: Production-ready, tested, seeded with real data, staff onboarded**

### Steps
1. Full end-to-end testing of all 5 routing chains
2. Test all email triggers — confirm delivery via Resend dashboard
3. Test RLS — confirm no cross-role data leakage
4. Error handling:
   - Form validation with Zod
   - Empty states for all list pages
   - Loading states for all async actions
   - Toast notifications for success/error actions
5. Seed production database:
   - All facilities
   - All entities (clubs, houses, departments)
   - All staff user accounts
6. Onboarding session with key staff:
   - Admin walkthrough (Moneeb)
   - Submitter walkthrough (one per entity type)
   - Approver walkthrough (Principal, one Dept Head)
7. Soft launch — run one real event through the system end-to-end
8. Gather feedback, fix critical issues
9. Full launch announcement to all staff

### Milestone
Maydan is live. Real users are submitting real events. 
First approval chain completed successfully in production.

### Tests
- All 5 routing chains tested with real user accounts
- Email delivery confirmed for all triggers
- Admin can manage users and entities without errors
- No console errors in production
- Lighthouse performance score > 80

---

## Phase Summary

| Phase | Focus | Est. Days |
|-------|-------|-----------|
| 1 | Foundation & deployment | 3–4 |
| 2 | UI shell & all pages | 4–5 |
| 3 | Auth & user management | 3–4 |
| 4 | Submission & routing engine | 6–7 |
| 5 | Approval workflow & real-time | 5–6 |
| 6 | Polish, testing & launch | 4–5 |
| **Total** | | **25–31 days** |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Routing engine logic bugs | High | High | Dedicated phase, thorough per-chain testing |
| Staff resistance to new tool | Medium | High | Simple UI, onboarding session, soft launch |
| RLS misconfiguration leaks data | Medium | High | Test with multiple role accounts before launch |
| Resend email delivery issues | Low | Medium | Test all triggers in staging before launch |
| Scope creep during build | High | Medium | Refer back to PRD — V2 list is your parking lot |

---

## Post-Launch V2 Priorities (Do Not Build Now)
- Public-facing event calendar
- Parent/student portal
- Google Calendar sync
- Full marketing task workflow
- Event analytics dashboard
- Budget tracking per event

---

*Maydan Implementation Plan v1.0 — BHA Prep*