# Maydan Pilot Rollout Plan

## Goal

Roll Maydan out in a controlled order so routing, permissions, and real workflow behavior are validated before opening it to all staff.

## Pilot Order

### Wave 1: Admin Control

Owner:
- `moneeb.sarmad@bhaprep.org`

Goal:
- Confirm user/entity/facility data is correct
- Confirm admin tools are usable
- Confirm audit visibility

Exit criteria:
- Admin confirms directory and routing data are acceptable for pilot use

### Wave 2: One Real Submitter + One Real Approver Chain

Recommended first pilot:
- Submitter: `dana.haddad@bhaprep.org`
- Step 1 approver: `susan.almasri@bhaprep.org`
- Step 2 approver: `leila.kayed@bhaprep.org`
- Facilities visibility: `facilities@bhaprep.org`

Why this chain:
- Already validated successfully in production
- Clear 2-step HS department path
- Lower complexity than a 3-step house or athletics chain

Exit criteria:
- Real event can be submitted, approved, and shown on calendar
- No permission or routing issues found

### Wave 3: One Pilot Per Entity Path

Run one submitter pilot for each:
- Club
- House
- Athletics
- HS Department
- MS Department

Recommended live sequence:
1. HS Department
2. Club
3. House
4. Athletics
5. MS Department

Reason:
- Start with the simplest chains first
- Move to 3-step and cross-role chains after initial confidence

Exit criteria:
- Each entity path completes at least one successful live workflow

### Wave 4: Broader Staff Access

After the pilot group is stable:
- Open access to all staff
- Keep Maydan admin monitoring logs daily
- Keep issue reporting centralized for the first week

## What to Watch During Pilot

### Routing

- Does the first approver match the entity head?
- Does HS vs MS routing go to the correct principal?
- Does Facilities remain visible on all submissions?

### Permissions

- Submitters cannot access approvals/admin
- Approvers only see items at their own step
- Facilities can read but not approve

### Data Quality

- Entity heads are correct
- Facility list is accurate
- User role assignments are accurate

### User Experience

- Staff understand where to submit
- Approvers understand how to act
- Users can tell whether an event is pending, approved, or needs revision

## Daily Pilot Check-In

Ask each pilot user:

- Were you able to log in without help?
- Did the event go to the correct next person?
- Did you understand what the current status meant?
- Was anything confusing or duplicated?
- Did anything fail or appear broken?

## Issue Triage

### Critical

- Cannot log in
- Cannot submit event
- Cannot approve assigned step
- Wrong role can access protected route
- Approval chain routes to wrong person

### High

- Event gets stuck mid-chain
- Calendar visibility is wrong
- Facility conflict visibility is wrong
- Notifications are incorrect

### Medium

- Copy is unclear
- Form fields are confusing
- Navigation is unintuitive

### Low

- Styling inconsistencies
- Minor spacing/layout issues

## Go / No-Go Rule For Full Staff Launch

Go to full staff launch only if:

- Admin walkthrough is complete
- At least one real chain has completed successfully
- Each entity path has at least one validated pilot user or equivalent confidence
- No critical issues remain open
- No high-severity routing or permissions bug remains open

## Immediate Next Recommended Pilot

1. Re-run the English Department path with the actual staff involved if needed
2. Pilot one club submission
3. Pilot one house submission
4. Pilot one athletics submission
5. Pilot one MS department submission
