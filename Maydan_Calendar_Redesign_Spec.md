# Maydan Calendar Redesign Spec

## Purpose

Redesign the internal `/calendar` experience so it feels intentional, readable,
and operationally useful for BHA Prep staff. The current calendar works as a
basic approved-events month grid, but it does not yet function like a school
coordination tool.

This spec is for the internal calendar only. It does not introduce any
public-facing calendar or external calendar integration.

## Current State

Current implementation references:

- `app/(dashboard)/calendar/page.tsx`
- `components/calendar/calendar-shell.tsx`

Current behavior:

- shows approved events only
- renders a monthly grid for the current month
- allows filtering by entity type, facility, and grade level
- shows one selected-event summary panel on the right

Current problems:

- too much empty vertical space in each day cell
- event cards are too large for the amount of information shown
- the month grid is visually flat and repetitive
- the calendar behaves like a generic template, not a school scheduling tool
- there is no strong distinction between overview mode and operational detail mode
- there is no better fallback for mobile or dense-event days

## Redesign Goals

### 1. Visual quality

The calendar should feel polished, deliberate, and easier to scan.

Desired outcomes:

- denser and cleaner day cells
- stronger visual hierarchy
- clearer event grouping and classification
- less empty space
- more useful information in less space

### 2. Functional usefulness

The calendar should support how Maydan is actually used.

Desired outcomes:

- quick month-level awareness
- better review of upcoming approved events
- easier facility coordination
- easier filtering for specific departments or event types
- cleaner event inspection without cluttering the grid

## Product Direction

### Primary recommendation

Use a hybrid internal calendar with:

- `Month` view as the default overview
- `Week` view for operational scheduling
- `List` view for upcoming events
- `Facilities` view for room usage and coordination

This is a better fit than trying to force every use case into a single month grid.

## Information Architecture

### Top bar

The calendar page should have a stronger control bar above the content.

Required controls:

- `Today`
- previous / next date navigation
- current date label
- view switcher:
  - `Month`
  - `Week`
  - `List`
  - `Facilities`
- filters:
  - facility
  - entity type
  - department or entity
  - grade level

Optional later control:

- search by event name

## View System

### 1. Month view

This remains the default landing view.

#### Layout

- left: month grid
- right: upcoming or selected-day rail

#### Month grid improvements

- reduce day-cell height
- place the day number in a small corner badge
- lightly tint weekends
- strongly distinguish `today`
- show events as compact pills, not mini cards
- show only top `2-3` visible events per day
- overflow becomes `+N more`

#### Event pill content

Each event pill should prioritize:

1. time or all-day indicator
2. event title
3. optional facility hint if room allows

Do not show full detail blocks inside day cells.

#### Right rail

The side panel should change from a passive summary box into a useful support panel.

Recommended right-rail behavior:

- default: `Upcoming this week`
- when a day is selected: `Events on [date]`
- when an event is selected: `Event details`

#### Visual treatment

- editorial typography
- muted but deliberate color accents
- clearer layering between page background, month card, and event pills
- stronger spacing rhythm between controls, grid, and detail rail

### 2. Week view

This is the first operational view.

#### Purpose

Allow staff to understand the week more precisely than the month grid can.

#### Layout

- 7 columns for days
- vertical time slices or stacked day columns
- compact event blocks with more detail than month pills

#### Best fit

- admin
- approvers
- staff checking dense upcoming weeks

### 3. List view

This is the cleanest upcoming-events workflow.

#### Purpose

Provide a readable, low-friction list of approved events.

#### Layout

- chronological list
- grouped by day or week
- each row shows:
  - title
  - date
  - time
  - facility
  - entity
  - grade level

#### Best fit

- mobile
- fast scanning
- admin review

### 4. Facilities view

This is the most operationally useful Maydan-specific calendar mode.

#### Purpose

Help Facilities and admin users understand room usage.

#### Layout options

Recommended:

- columns = facilities
- rows = days or week slices

Alternative:

- rows = facilities
- columns = day timeline

#### Best fit

- facilities coordination
- spotting room congestion
- reviewing event distribution by space

## Event Visual System

Events should not all look the same.

### Color mapping by entity type

Recommended palette behavior:

- `club` = slate/ink accent
- `house` = warm amber/sand accent
- `athletics` = green accent
- `department` = blue accent

If facilities conflict state is surfaced in the calendar:

- conflict marker = warning tone only

The palette should stay muted and professional, not saturated.

### Event density rules

Month view:

- use pills
- do not exceed `2-3` pills before overflow
- no large paragraph blocks

Week view:

- show richer blocks

List view:

- show full detail rows

## Interaction Model

### Day selection

Selecting a day should:

- highlight the day
- populate the right rail with that day’s events

### Event selection

Selecting an event should:

- open a right-side detail panel on desktop, or
- open a bottom sheet / modal on mobile

### Event detail panel content

Required:

- event name
- date
- time
- facility
- entity
- entity type
- grade level

Nice to have if already available from existing data:

- submitter
- approval status badge
- facility conflict note

### Overflow interaction

For days with more events than the cell should display:

- show `+N more`
- clicking it opens the day detail panel or modal

## Filtering Model

Keep the filter system simple but genuinely useful.

### Required filters

- facility
- entity type
- grade level

### Recommended new filter

- entity / department selector

This matters because staff may want to isolate:

- Arabic Department events
- Athletics only
- House events only

## Mobile Behavior

Do not force the full desktop month grid on small screens.

### Mobile recommendation

- default to a compact list-first experience
- keep month view available, but simplified
- event details should open in a sheet or modal

### Mobile priorities

- readable event titles
- low tap friction
- no cramped month cells pretending to be desktop

## UX Pattern Recommendations

### Month view composition

Recommended structure:

- page header
- control bar
- legend
- month grid
- right rail

### Right rail modes

Recommended states:

- upcoming events
- selected day
- selected event

### Empty state improvements

Instead of a generic empty state, use contextual empty states:

- `No approved events this month`
- `No approved events match these filters`
- `No events scheduled for this day`

## Implementation Recommendation

### Phase A

Redesign the existing month view only.

Scope:

- better top bar
- denser day cells
- event pills
- overflow handling
- improved right rail
- better empty states

Reason:

This provides the biggest immediate improvement without expanding surface area too fast.

### Phase B

Add `Week` and `List` views.

### Phase C

Add `Facilities` view.

## Technical Notes For Implementation

The current data shape in `app/(dashboard)/calendar/page.tsx` is too thin for a richer calendar.

Recommended event payload additions for the redesign:

- `start_time`
- `end_time`
- `status` if needed for badges
- optional `submitter`
- optional conflict flag if surfaced here

Even if the page still shows approved events only, time data should be available so pills and detail panels are more useful.

## Acceptance Criteria

### Visual

- the month grid no longer feels sparse or repetitive
- day cells are denser and easier to scan
- event presentation is visually distinct by type
- the page has a stronger visual hierarchy than the current grid

### Functional

- a user can scan upcoming approved events quickly
- a user can inspect a selected day without cluttering the grid
- a user can inspect a selected event in a dedicated detail panel
- dense event days remain readable through overflow handling
- the calendar works cleanly on mobile

### Product fit

- the calendar feels like an internal school coordination tool
- the calendar better supports facilities awareness and operational review

## Final Recommendation

Implement the redesign in this order:

1. Month view overhaul
2. Right-side upcoming/selected detail rail
3. Better filters including entity-level filtering
4. Week view
5. List view
6. Facilities view

This gives Maydan a much stronger internal calendar without introducing scope outside V1/V1.5-style internal operations tooling.
