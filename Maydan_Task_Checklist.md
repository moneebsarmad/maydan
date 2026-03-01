# Maydan — Task Checklist
**Version:** 1.0  
**Last Updated:** February 27, 2026  
**Developer:** Moneeb (Solo)  
**Format:** Check off as you go — [ ] = todo, [x] = done  

---

## 🏗️ PROJECT FOUNDATION

### Repo & Tooling
- [x] Create Next.js 14 app with TypeScript, Tailwind, App Router
- [x] Install and initialise shadcn/ui
- [x] Install Supabase SSR client (`@supabase/supabase-js`, `@supabase/ssr`)
- [x] Install form libraries (`react-hook-form`, `@hookform/resolvers`, `zod`)
- [x] Install utility libraries (`date-fns`, `lucide-react`)
- [x] Install Resend (`resend`)
- [x] Create `.env.local` with all environment variables
- [x] Add `.env.local` to `.gitignore`
- [x] Create GitHub repository
- [ ] Push initial commit to GitHub
- [ ] Connect Vercel to GitHub repo
- [ ] Confirm auto-deploy works on push
- [ ] Confirm live Vercel URL is accessible

### Supabase Project Setup
- [x] Create Supabase organisation and project
- [x] Copy Supabase URL and anon key to `.env.local`
- [x] Copy service role key to `.env.local`
- [x] Create `lib/supabase/client.ts` (browser client)
- [x] Create `lib/supabase/server.ts` (server client)
- [x] Create `lib/supabase/middleware.ts` (session refresh)
- [x] Add middleware to `middleware.ts` in root
- [ ] Test Supabase connection — confirm no errors in console

---

## 🗄️ DATABASE

### Migrations
- [x] Create migration: `users` table
- [x] Create migration: `entities` table
- [x] Create migration: `facilities` table
- [x] Create migration: `events` table
- [x] Create migration: `approval_steps` table
- [x] Create migration: `marketing_requests` table
- [x] Create migration: `notifications` table
- [x] Run all migrations — confirm tables exist in Supabase dashboard
- [x] Create `types/index.ts` — TypeScript types matching all tables

### Row Level Security
- [x] Enable RLS on `users` table
- [x] Enable RLS on `entities` table
- [x] Enable RLS on `facilities` table
- [x] Enable RLS on `events` table
- [x] Enable RLS on `approval_steps` table
- [x] Enable RLS on `marketing_requests` table
- [x] Enable RLS on `notifications` table
- [x] Write RLS policy: submitters read own events
- [x] Write RLS policy: submitters insert own events
- [x] Write RLS policy: approvers read their approval queue
- [x] Write RLS policy: approvers update their approval steps
- [x] Write RLS policy: admin full access to all tables
- [x] Write RLS policy: facilities director reads all events
- [x] Write RLS policy: users read own notifications only
- [ ] Test RLS with two separate test accounts — confirm no data leakage

### Seed Data
- [x] Seed facilities: Auditorium, Gym, Main Field, Classroom, MPH, Library, Conference Room
- [x] Seed entities: all clubs (HOSA, TED Talk, Chess Club)
- [x] Seed entities: all houses (Abū Bakr, Khadījah, ʿUmar, ʿĀʾishah)
- [x] Seed entities: all departments (Science, Math, Qurʾān, Islāmic Studies, Arabic, English, Social Studies, PE)
- [x] Seed entities: Athletics
- [x] Create Admin user account in Supabase Auth
- [x] Insert Admin user into `users` table with role `admin`

### Supabase Storage
- [x] Create storage bucket: `marketing-uploads`
- [x] Set bucket to private
- [x] Write storage policy: PR staff and Admin can read
- [x] Write storage policy: submitters can upload
- [x] Test file upload and retrieval

---

## 🎨 UI SHELL & LAYOUT

### Global Layout
- [x] Create root layout with font and metadata
- [x] Build sidebar navigation component
  - [x] Links: Dashboard, Events, Approvals, Calendar, Admin
  - [x] Active link highlighting
  - [x] Role-based link visibility (hide Approvals from pure submitters, hide Admin from non-admins)
- [x] Build top header component (user avatar, notification bell, logout)
- [x] Build auth guard wrapper — redirect to `/login` if no session
- [x] Build loading skeleton component (reusable)
- [x] Build empty state component (reusable)
- [x] Build toast notification component (success / error / info)
- [ ] Confirm layout is responsive on mobile

### Auth Pages
- [x] Build `/login` page — email + password form
- [x] Build `/reset-password` page — email input form
- [x] Build `/update-password` page — new password form

### Dashboard Page
- [x] Build `/dashboard` — summary cards (placeholder data)
  - [x] My Pending Events card
  - [x] Awaiting My Approval card
  - [x] Approved This Month card
  - [x] Recent Activity feed (placeholder)

### Events Pages
- [x] Build `/events` — events list page
  - [x] Event cards with status badges
  - [ ] Filter bar (status, entity, date)
  - [x] "Submit New Event" button
- [x] Build `/events/new` — full submission form (static first)
  - [x] Event Name field
  - [x] Date picker
  - [x] Start time + End time fields
  - [x] Facility dropdown
  - [x] Facility notes text field (shown when "Classroom" selected)
  - [x] Description textarea
  - [x] Target Audience multi-select
  - [x] Grade Level select (MS / HS / Both)
  - [x] Expected Attendance number input
  - [x] Staffing Needs textarea
  - [x] Marketing Needed toggle (Y/N)
  - [x] Marketing sub-form (hidden by default)
    - [x] Marketing type select
    - [x] Request details textarea
    - [x] Target audience for marketing
    - [x] Priority select
    - [x] File upload input
  - [ ] Additional Notes textarea
  - [x] Submit button
  - [x] Form validation errors display correctly
  - [x] Marketing sub-form shows on toggle, hides on toggle off
- [x] Build `/events/[id]` — event detail page
  - [x] Full event details display
  - [x] Status badge
  - [x] Approval chain progress indicator (Step 1 → 2 → 3)
  - [x] Rejection reason display (if rejected)
  - [ ] Resubmit button (if needs_revision)
  - [x] Marketing request details section (if applicable)

### Approvals Pages
- [x] Build `/approvals` — approval queue list
  - [x] Pending approvals list
  - [x] Event name, submitter, entity, date at a glance
  - [x] Empty state when no pending approvals
- [x] Build `/approvals/[id]` — approval action page
  - [x] Full event details
  - [x] Approve button
  - [x] Reject button → reveals reason textarea (required)
  - [x] Suggest Alternative button → reveals date + time picker
  - [x] Confirm action modal

### Calendar Page
- [x] Build `/calendar` — internal event calendar
  - [x] Monthly calendar view
  - [x] Approved events displayed on correct dates
  - [x] Click event to see summary
  - [x] Filter by entity, facility, grade level

### Admin Pages
- [x] Build `/admin/users` — user management
  - [x] Users list (name, email, role, entity, status)
  - [x] Add User button + modal form
  - [x] Edit User button + modal form
  - [x] Deactivate User button + confirmation
- [x] Build `/admin/entities` — entity management
  - [ ] Entities list grouped by type
  - [x] Add Entity button + modal form
  - [x] Edit Entity (assign head user)
- [x] Build `/admin/facilities` — facility management
  - [x] Facilities list
  - [x] Add / Edit / Deactivate facility

### Reusable Components
- [x] `EventCard` component
- [x] `StatusBadge` component (color-coded per status)
- [x] `ApprovalQueueItem` component
- [x] `NotificationBell` component (with unread count badge)
- [x] `NotificationDropdown` component
- [x] `UserAvatar` component
- [x] `ConfirmModal` component (reusable for destructive actions)
- [x] `ApprovalChainProgress` component (visual step tracker)

---

## 🔐 AUTHENTICATION

- [x] Connect `/login` form to Supabase Auth `signInWithPassword`
- [x] Handle login error — display message on wrong credentials
- [x] On successful login — redirect to `/dashboard`
- [x] Connect `/reset-password` to Supabase Auth `resetPasswordForEmail`
- [x] Connect `/update-password` to Supabase Auth `updateUser`
- [x] Build logout function — clears session, redirects to `/login`
- [x] Connect logout to header button
- [x] On session load — fetch user profile + role from `users` table
- [x] Store user context in React context or Zustand store
- [x] Middleware redirects unauthenticated users to `/login`
- [x] Middleware redirects authenticated users away from `/login`
- [x] Role guard: `/admin/*` routes → admin only
- [x] Role guard: `/approvals/*` routes → approvers and admin only
- [ ] Test: submitter cannot access `/admin`
- [ ] Test: submitter cannot access `/approvals`
- [ ] Test: approver can access `/approvals` but not `/admin`

---

## 📋 EVENT SUBMISSION

- [x] Create `actions/events.ts` — server actions for event operations
- [x] Build `submitEvent` server action
  - [x] Validate form data with Zod schema
  - [x] Insert event into `events` table
  - [x] Set status to `pending`, `current_step` to 1
  - [x] Call routing engine to build approval chain
  - [x] Insert `approval_steps` rows for each step
  - [x] Return event ID on success
- [x] Wire submission form to `submitEvent` action
- [x] Show loading state while submitting
- [x] On success — redirect to `/events/[id]`
- [x] On error — show toast with error message
- [x] Build `saveDraft` server action (saves without submitting)
- [x] Wire draft save to form
- [x] Test: event inserted correctly in DB
  - [ ] Test: correct approval steps created for each entity type
- [x] Test: event status is `pending` after submission

---

## 🔀 APPROVAL ROUTING ENGINE

- [x] Create `lib/routing/approval-router.ts`
- [x] Build helper functions:
  - [x] `getClubAdviser(entityId)` — fetches head_user_id for club
  - [x] `getHouseMentor(entityId)` — fetches head_user_id for house
  - [x] `getTarbiyahDirector()` — fetches by title from users
  - [x] `getAthleticDirector()` — fetches by title from users
  - [x] `getDepartmentHead(entityId)` — fetches head_user_id for dept
  - [x] `getHSPrincipal()` — fetches by title from users
  - [x] `getMSPrincipal()` — fetches by title from users
  - [x] `getFacilitiesDirector()` — fetches by title from users
- [x] Build `buildApprovalChain(entityType, entityId, gradeLevel)` function
  - [x] Club chain: Club Adviser → HS Principal
  - [x] House chain: House Mentor → Tarbiyah Director → HS Principal
  - [x] Athletics chain: Coach → Athletic Director → HS Principal
  - [x] HS Department chain: Dept Head → HS Principal
  - [x] MS Department chain: Dept Head → MS Principal
- [x] Test each chain individually with unit tests:
  - [x] Club → correct 2-step chain returned
  - [x] House → correct 3-step chain returned
  - [x] Athletics → correct 3-step chain returned
  - [x] HS Department → correct 2-step chain returned
  - [x] MS Department → correct 2-step chain returned
- [x] Confirm Facilities Director ID is returned separately on all chains

---

## ✅ APPROVAL WORKFLOW

- [ ] Create `actions/approvals.ts` — server actions for approval operations
- [ ] Build `approveStep` server action
  - [ ] Update `approval_steps` row to `approved` with timestamp
  - [ ] Increment `events.current_step`
  - [ ] Check if more steps remain
  - [ ] If yes: create notification for next approver + send email
  - [ ] If no: set event status to `approved`, notify submitter
- [ ] Build `rejectStep` server action
  - [ ] Update `approval_steps` row to `rejected` with reason
  - [ ] Set event status to `needs_revision`
  - [ ] Notify submitter with reason
- [ ] Build `suggestAlternative` server action
  - [ ] Update step with suggested date/time
  - [ ] Set event to `needs_revision`
  - [ ] Notify submitter with suggestion
- [ ] Build `resubmitEvent` server action
  - [ ] Reset all `approval_steps` to `pending`
  - [ ] Reset `events.current_step` to 1
  - [ ] Set event status to `pending`
  - [ ] Notify Step 1 approver
- [ ] Wire Approve button to `approveStep`
- [ ] Wire Reject button to `rejectStep`
- [ ] Wire Suggest Alternative to `suggestAlternative`
- [ ] Wire Resubmit button to `resubmitEvent`
- [ ] Test: approve Step 1 → Step 2 approver notified
- [ ] Test: approve final step → event approved, submitter notified
- [ ] Test: reject at Step 1 → event paused, submitter notified
- [ ] Test: reject at Step 2 → event paused, submitter notified
- [ ] Test: resubmit → chain restarts from Step 1
- [ ] Test: Facilities Director receives notification on all submissions

---

## 🔔 NOTIFICATIONS

### In-App Notifications
- [x] Create `actions/notifications.ts`
- [x] Build `createNotification(userId, eventId, message)` function
- [ ] Call `createNotification` in all relevant actions:
  - [x] On event submitted → notify Step 1 approver
  - [x] On event submitted → notify Facilities Director
  - [ ] On step approved → notify next approver (or submitter if final)
  - [ ] On step rejected → notify submitter
  - [ ] On alternative suggested → notify submitter
  - [x] On marketing requested → notify PR staff
- [x] Build `markAsRead(notificationId)` action
- [x] Build `markAllAsRead(userId)` action
- [x] Wire NotificationBell to fetch unread count
- [x] Wire NotificationDropdown to list recent notifications
- [x] Wire mark as read on notification click
- [ ] Test: correct users receive notifications for each action

### Real-time (Supabase Realtime)
- [ ] Set up Realtime subscription for submitters — event status changes
- [ ] Set up Realtime subscription for approvers — new approval queue items
- [ ] Set up Realtime subscription for notification bell — new notifications
- [ ] Test: status updates fire without page refresh
- [ ] Test: approval queue updates without page refresh
- [ ] Test: notification bell badge updates in real time

---

## 📧 EMAIL NOTIFICATIONS (Resend)

- [x] Create Resend account + get API key
- [ ] Add `RESEND_API_KEY` to `.env.local` and Vercel environment
- [x] Create `lib/resend/emails.ts`
- [ ] Build email templates:
  - [x] `sendApprovalRequestEmail(to, eventName, eventId)` — to approver
  - [ ] `sendEventApprovedEmail(to, eventName)` — to submitter
  - [ ] `sendEventRejectedEmail(to, eventName, reason)` — to submitter
  - [ ] `sendAlternativeSuggestedEmail(to, eventName, date, time)` — to submitter
  - [x] `sendFacilitiesNotificationEmail(to, eventName, eventId)` — to Facilities Director
  - [x] `sendMarketingRequestEmail(to, eventName, requestDetails)` — to PR staff
- [ ] Call correct email function in each server action
- [ ] Test all email triggers — confirm delivery in Resend dashboard
- [ ] Confirm emails render correctly (no broken formatting)

---

## 🗓️ CALENDAR

- [ ] Fetch all approved events from DB
- [ ] Display events on correct calendar dates
- [ ] Build event summary popover on click
- [ ] Build filter: by entity type
- [ ] Build filter: by facility
- [ ] Build filter: by grade level
- [ ] Test: approved events appear on calendar
- [ ] Test: pending/draft events do not appear on calendar

---

## 🎛️ ADMIN PANEL

### User Management
- [x] Fetch and display all users
- [ ] Build Add User modal form with Zod validation
- [x] On Add User: create Supabase Auth account + insert into `users` table
- [x] Send Supabase invite email to new user
- [x] Build Edit User modal — update role and entity assignment
- [x] Build Deactivate User — sets `active: false`, blocks login
- [ ] Test: new user receives invite email
- [ ] Test: deactivated user cannot log in

### Entity Management
- [ ] Fetch and display all entities grouped by type
- [x] Build Add Entity modal
- [x] Build Edit Entity modal — assign head user
- [ ] Test: new entity appears in submission form dropdown

### Facility Management
- [x] Fetch and display all facilities
- [x] Build Add Facility modal
- [x] Build Edit Facility modal
- [x] Build Deactivate Facility — removes from submission form
- [ ] Test: deactivated facility does not appear in event form

### Audit Log
- [ ] Build basic audit log view — all events with status history
- [ ] Show: event name, submitter, entity, current status, last updated
- [ ] Filter by status, entity, date range

---

## 🧹 POLISH & LAUNCH PREP

### Error Handling & UX
- [ ] Add Zod validation to all forms
- [ ] Display inline field errors on all forms
- [ ] Add loading spinners to all async actions
- [ ] Add empty states to all list pages
- [ ] Add success toasts to all key actions
- [ ] Add error toasts to all failed actions
- [ ] Add confirmation modals to all destructive actions

### Pre-Launch Testing
- [ ] End-to-end test: Club event full chain (submit → approve → approve → approved)
- [ ] End-to-end test: House event full chain (3 steps)
- [ ] End-to-end test: Athletics event full chain (3 steps)
- [ ] End-to-end test: HS Department event full chain
- [ ] End-to-end test: MS Department event full chain
- [ ] End-to-end test: rejection + resubmission flow
- [ ] End-to-end test: marketing request notification
- [ ] RLS audit — test with 3 separate role accounts
- [ ] Confirm no console errors in production build
- [x] Run `next build` — confirm zero build errors
- [ ] Lighthouse audit — target score > 80

### Production Seed
- [ ] Seed all facilities in production DB
- [ ] Seed all entities in production DB
- [ ] Create all staff user accounts
- [ ] Assign correct roles and entities to all users
- [ ] Confirm all approver chains resolve to real user IDs

### Launch
- [ ] Run one real test event end-to-end with real accounts
- [ ] Onboarding walkthrough with Admin
- [ ] Onboarding walkthrough with one submitter per entity type
- [ ] Onboarding walkthrough with HS Principal
- [ ] Soft launch — open to all staff
- [ ] Monitor Resend dashboard for email delivery issues
- [ ] Monitor Supabase logs for errors
- [ ] Collect feedback after first week
- [ ] Fix any critical issues from feedback

---

## 📦 V2 PARKING LOT
*Do not build these now — revisit after V1 is stable*

- [ ] Public-facing event calendar
- [ ] Parent notifications portal
- [ ] Student-facing event display
- [ ] Google Calendar sync
- [ ] Full marketing task workflow
- [ ] Event analytics dashboard
- [ ] Budget tracking per event
- [ ] Mobile app

---

**Total Tasks: ~180**  
*Check them off one by one. Ship it.*

---

*Maydan Task Checklist v1.0 — BHA Prep*
