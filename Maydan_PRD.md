# Maydan — Product Requirements Document (PRD)
**Version:** 1.0  
**Status:** Draft  
**Last Updated:** February 27, 2026  
**App Name:** Maydan (ميدان) — Arabic for "arena/square," a gathering place for organized action  

---

## 1. Overview

### 1.1 Problem Statement
BHA Prep relies on a single person managing all event submissions via Google Form. This causes:
- A critical single point of failure
- Late or missing stakeholder notifications
- Events failing due to missing approvals
- Last-minute marketing and facility arrangements
- No clear chain of command or ownership

### 1.2 Proposed Solution
A role-based internal web app where each entity owns their events, submissions auto-route to correct approvers, and all stakeholders have appropriate visibility.

### 1.3 Goals
- Eliminate the single-person bottleneck
- Ensure no event moves forward without proper approvals
- Give every stakeholder appropriate visibility
- Reduce last-minute coordination failures
- Keep it simple enough that non-technical staff will actually use it

### 1.4 Non-Goals (V1)
- Public-facing event calendar
- Parent or student portal
- Mobile app
- External calendar integration
- Full marketing workflow management
- Payment or ticketing

---

## 2. Users & Roles

| Role | Description |
|------|-------------|
| **Submitter** | Any staff member initiating an event on behalf of their entity |
| **Approver** | Leadership/directors with authority to approve in their chain |
| **Viewer** | Staff with visibility into relevant events |
| **Admin** | Manages users, roles, entities, and system settings |

### Approver Roles

| Title | Authority |
|-------|-----------|
| HS Principal / Head of School | Final approver on all events |
| MS Principal | Final approver on MS department events |
| Tarbiyah Director | Approves League of Stars before HS Principal |
| Athletic Director | Approves Athletics before HS Principal |
| Department Heads | Approve department submissions |
| Club Advisers | Approve club submissions before HS Principal |
| House Mentors | Approve LoS submissions before Tarbiyah Director |
| Facilities Director | Looped in on ALL events — facility availability only |

---

## 3. Approval Routing Matrix

| Entity | Step 1 | Step 2 | Step 3 | CC |
|--------|--------|--------|--------|----|
| Club | Club Adviser | HS Principal | — | Facilities Director |
| League of Stars | House Mentor | Tarbiyah Director | HS Principal | Facilities Director |
| Athletics | PE Teacher/Coach | Athletic Director | HS Principal | Facilities Director |
| HS Department | Department Head | HS Principal | — | Facilities Director |
| MS Department | Department Head | MS Principal | — | Facilities Director |

### Routing Rules
- Routing auto-determined by submitter's entity affiliation
- Facilities Director notified on every submission
- Rejection halts chain — submitter notified with reason or alternative date/time suggestion
- Resubmission restarts full chain from Step 1
- Admin can manually reassign if approver is unavailable

---

## 4. Core Features (V1)

### 4.1 Event Submission Form
- Event Name *
- Date, Start Time, End Time *
- Facility * (Auditorium, Gym, Main Field, Classroom [specify], MPH, Library, Conference Room)
- Description *
- Target Audience * (Students, Staff, Parents, External, Mixed)
- Grade Level (MS / HS / Both)
- Expected Attendance
- Staffing Needs (visible to Facilities Director)
- Marketing Needed? (Y/N) *
- Submitting Entity (auto-populated)
- Additional Notes

### 4.2 Marketing Request Sub-Form
Triggered when "Marketing Needed: Yes"
- Type (Social Media, Flyer, Video, Slide Deck, Other)
- Request Details
- Target Audience
- Priority (Standard / Urgent)
- File Upload (optional)

PR staff notified automatically with full event + marketing details.

### 4.3 Approval Dashboard
Each approver sees:
- Queue of pending events
- Full submission details
- Approve / Reject / Suggest Alternative actions
- Rejection requires reason or alternative date
- Decision history with timestamps

### 4.4 Event Status Tracking
- **Draft** — saved, not submitted
- **Pending** — in approval chain
- **Needs Revision** — rejected, awaiting resubmission
- **Approved** — all approvals complete
- **Cancelled** — withdrawn post-approval

Submitters see real-time position in approval chain.

### 4.5 Notifications
- In-app + email notifications for all key actions
- Facilities Director notified on all new submissions
- PR staff notified when marketing is requested

### 4.6 Internal Event Calendar
- All approved events by date
- Filterable by entity, facility, grade level
- Visible to all staff
- Prevents double-booking

### 4.7 Admin Panel
- User management
- Entity management (clubs, houses, departments)
- Facility management
- Full audit log
- Manual approval chain override

---

## 5. Data Model

### Events
`id, name, date, start_time, end_time, facility_id, description, audience, grade_level, expected_attendance, staffing_needs, marketing_needed, status, submitter_id, entity_id, created_at, updated_at`

### Facilities
`id, name, capacity, notes`

### Entities
`id, name, type (club/house/department/athletics), grade_level, head_user_id`

### Users
`id, name, email, role, entity_id, title, active`

### Approvals
`id, event_id, approver_id, step_number, status, reason, suggested_date, timestamp`

### Marketing Requests
`id, event_id, type, details, audience, priority, file_url, created_at`

### Notifications
`id, user_id, event_id, message, read, created_at`

---

## 6. Facilities

| Facility | Notes |
|----------|-------|
| Auditorium | Large-scale events |
| Gym | Athletics and assemblies |
| Main Field | Outdoor events |
| Classroom | Specify room via text |
| MPH | Mid-size gatherings |
| Library | Small/academic events |
| Conference Room | Meetings, small groups |

---

## 7. Submitting Entities

**Clubs:** HOSA, TED Talk Club, Chess Club *(more added by Admin)*

**Houses (League of Stars):** House of Abū Bakr, House of Khadījah, House of ʿUmar, House of ʿĀʾishah

**Departments:** Science, Math, Qurʾān, Islāmic Studies, Arabic, English, Social Studies, PE

**Athletics:** PE Teachers/Coaches → Athletic Director

---

## 8. Out of Scope for V1

| Feature | Version |
|---------|---------|
| Public-facing calendar | V2 |
| Parent/student portal | V2 |
| Google Calendar sync | V2 |
| Full marketing task workflow | V2 |
| Mobile app | V3 |
| Event analytics | V2 |
| Budget tracking | V2 |

---

## 9. Success Metrics
- Zero events failing due to missing approvals
- All stakeholders notified before execution
- 80% staff adoption within 60 days of launch
- Facility conflicts flagged before final approval

---

## 10. Assumptions & Constraints
- All users have school-issued email addresses
- Budget is limited — must be low-cost to host
- Staff are non-technical — UI must be simple
- No existing system to integrate with
- Admin is Moneeb or designated technical staff

---

## 11. Open Questions
1. Who is Admin at launch — Moneeb only or shared?
2. Is there a single PR contact or a team receiving marketing requests?
3. Are MS and HS Principal the same person or separate roles?
4. If Facilities flags a conflict, does it auto-pause the approval chain?
5. Can submitters edit events after approval, or are they locked?
6. Is there a minimum submission lead time (e.g. 2 weeks in advance)?

---

*Maydan PRD v1.0 — BHA Prep*