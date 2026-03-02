# Maydan V2 UI Brainstorm: Department Approval Chains

## Goal

Design an admin UI for configurable department approval chains that feels polished and modern, but still calm, readable, and operationally safe.

This is a UI/UX brainstorm only.

## Design Direction

The right tone is:
- structured
- minimal
- premium
- slightly animated
- not playful

This should feel like an internal workflow console, not a marketing landing page.

## Recommended Magic UI Components

Use these lightly:

### 1. Blur Fade

Use for:
- page-load reveal
- section reveal
- editor panel appearance

Why:
- elegant
- minimal
- helps orientation without looking flashy

### 2. Magic Card

Use for:
- chain cards
- step cards
- preview cards

Why:
- subtle hover polish
- makes admin panels feel deliberate
- still works in a business UI

### 3. Animated List

Use for:
- approval step stack
- preview of resolved chain

Why:
- ideal for ordered workflows
- gives motion without introducing complexity

### 4. Number Ticker

Use sparingly for:
- total active chains
- departments with custom routing
- broken chains requiring attention

Why:
- good for compact admin stats
- should not appear inside the editor itself

### 5. Bento Grid

Use only on the overview page.

Use for:
- top-level admin summary tiles
- chain health snapshot
- quick entry points

Why:
- strong visual summary
- not good for the detailed editing experience

## Components To Avoid

Do not use for this feature:
- Dock
- Marquee
- Orbiting Circles
- Particles
- Meteors
- Rainbow Button
- Ripple Button

Reason:
- too decorative
- too product-demo oriented
- hurts clarity in an admin workflow tool

## Overall Page Structure

Recommended information architecture:

1. Overview page
2. Chain editor page
3. Optional chain history/version view later

Do not start with a giant all-in-one workflow builder.

## Screen 1: Approval Chains Overview

Route idea:
- `/admin/approval-chains`

## Layout

### Top band

Use:
- `Blur Fade`

Content:
- page title
- short explanation
- primary CTA: `Create Chain`

Copy idea:
- `Department Approval Chains`
- `Manage department-specific approval flows without changing code.`

### Summary strip

Use:
- `Bento Grid`
- `Number Ticker`
- possibly `Magic Card`

Cards:
- Active chains
- Departments using custom routing
- Incomplete chains
- Recently updated chains

### Main list

Use:
- normal shadcn table or card list
- `Magic Card` hover effect

Columns:
- Department
- Level (`HS` / `MS`)
- Current chain summary
- Status
- Last updated
- Actions

Actions:
- `Edit`
- `Duplicate`
- `Deactivate`

### Filtering

Simple controls only:
- Department search
- Level filter
- Status filter

Do not add advanced filtering initially.

## Screen 2: Chain Editor

Best layout:
- split panel
- left = editable configuration
- right = live preview

Recommended ratio:
- 60 / 40

## Left Panel: Editor

### Section A: Chain metadata

Use:
- plain form card with `Blur Fade`

Fields:
- Chain name
- Department
- School level
- Active toggle
- Default fallback badge

### Section B: Approval steps

Use:
- `Animated List`
- each step wrapped in a `Magic Card`

Each step card contains:
- Step number
- Step label
- Source type selector
- Resolver input
- Blocking toggle
- Optional custom label
- Move up button
- Move down button
- Delete step button

### Recommended source type options

Keep these explicit:
- `Department Head`
- `Specific User`
- `Title Lookup`

When source type changes:
- show only the fields needed for that type

Example:
- `Department Head` -> no extra picker
- `Specific User` -> searchable user select
- `Title Lookup` -> small controlled select like `HS Principal`, `MS Principal`

### Add step interaction

Use:
- one clear button at the bottom of the step list

Do not use drag-and-drop as the primary interaction.

Prefer:
- `Move up`
- `Move down`

Reason:
- easier
- more accessible
- more stable on laptop and keyboard use

## Right Panel: Live Preview

Use:
- sticky sidebar
- `Magic Card`
- `Animated List`

Sections:

### Resolved chain preview

Show:
- Step 1 -> real person
- Step 2 -> real person
- Step 3 -> real person
- CC -> Facilities Director

This is the most important part of the whole UI.

Admin should always be able to answer:
- `Who will this actually go to right now?`

### Validation box

Show:
- green checks for valid steps
- warnings for unresolved or duplicate issues

Examples:
- `Step 2 resolves to Leila Kayed`
- `Department Head is not assigned`
- `Title lookup returned no active user`

### Fallback box

Show:
- what V1 fallback would be if this chain were disabled

This builds confidence and reduces fear during editing.

## Screen 3: Version / History View

This can wait until later.

When added, it should show:
- version name
- activated by
- activated at
- prior chain summary

UI should be simple:
- timeline or table
- not another builder

## Interaction Style

### Motion

Use motion for:
- reveal
- emphasis
- step ordering

Do not use motion for:
- decoration
- idle looping effects
- attention grabbing

### Buttons

Keep primary actions clear:
- `Save Draft`
- `Preview Resolved Chain`
- `Activate Chain`

Destructive actions:
- `Deactivate`
- `Delete Step`

These should use confirmation dialogs, not inline immediate destruction.

## Accessibility Rules

This feature should be admin-safe before it is fancy.

Rules:
- every control must be keyboard reachable
- move-step controls must not depend on drag-and-drop
- validation errors must be written in plain language
- preview must be readable without hover
- color must not be the only status indicator

## Visual Tone

Recommended palette:
- warm stone / slate base
- soft amber for active state
- subtle emerald for valid
- muted rose for errors

This matches the existing Maydan admin feel better than neon/glow-heavy treatments.

## Best First-Version UI Recommendation

If keeping this simple, build exactly this:

### Overview page
- `Blur Fade` header
- `Bento Grid` summary
- department chain list

### Editor page
- left configuration panel
- right sticky preview panel
- `Animated List` for steps
- `Magic Card` for each step

That is enough.

Do not start with:
- a node graph
- drag-and-drop workflow canvas
- advanced conditional builder

## Why This Approach Is Best

Because Admin's real job is:
- identify the department
- define the order
- confirm the real people
- save safely

The UI should optimize those four things.

Anything more complex too early will make the feature harder to trust.

## Suggested Next Step

Turn this into a wireframe for:
- overview page
- editor page
- preview sidebar

Then decide:
- whether it should be modal-based
- drawer-based
- or a full dedicated page editor

## Magic UI Reference

Current Magic UI component catalog:
- https://magicui.design/docs/components

Relevant component docs:
- Blur Fade: https://magicui.design/docs/components/blur-fade
- Magic Card: https://magicui.design/docs/components/magic-card
- Animated List: https://magicui.design/docs/components/animated-list
- Number Ticker: https://magicui.design/docs/components/number-ticker
- Bento Grid: https://magicui.design/docs/components/bento-grid
