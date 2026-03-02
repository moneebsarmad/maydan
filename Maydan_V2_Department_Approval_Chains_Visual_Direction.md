# Maydan V2 Visual Direction: Department Approval Chains

## Goal

Define how the approval-chain admin UI should feel visually.

Target:
- premium
- quiet
- trustworthy
- operational

This is not a feature for visual spectacle.

## Core Principle

Use animation to orient the admin, not to entertain them.

The admin should feel:
- in control
- informed
- safe to make changes

## Overall Mood

The UI should feel like:
- a governance console
- a workflow studio
- a planning tool

It should not feel like:
- a startup landing page
- a dashboard toy
- a glowing futuristic control room

## Color Direction

Base palette:
- slate
- warm stone
- off-white

Support colors:
- amber for active/current
- emerald for valid/safe
- rose for broken/destructive
- sky only for informational preview states

### Suggested usage

- page background: stone-50 / stone-100
- primary cards: white
- borders: stone-200
- active controls: slate-950 + amber accents
- success/valid: emerald-50 / emerald-900
- warning: amber-50 / amber-900
- error: rose-50 / rose-900

## Surface Hierarchy

Use three levels only:

1. Page background
2. Main cards
3. Focus cards / active step cards

Do not create too many visual elevations.

Recommended hierarchy:
- background = matte
- cards = soft shadow
- active card = slightly stronger ring or border

## Typography

Keep typography disciplined.

Recommended hierarchy:
- page title: large, serious, high-contrast
- section titles: medium, sharp
- labels: uppercase, tracked slightly
- body copy: restrained and readable

Avoid:
- too many font sizes
- overly decorative display typography inside admin workflows

## Motion

Recommended Magic UI motion usage:

### Blur Fade

Use for:
- initial section reveal
- switching into the editor workspace
- preview panel appearance

Why:
- subtle
- premium
- low-distraction

### Animated List

Use for:
- ordered step list
- resolved preview list

Why:
- reinforces workflow sequence
- motion has meaning

### Magic Card

Use for:
- hover treatment on chain cards
- step card polish

Why:
- gives refinement without demanding attention

## Motion Rules

Motion should be:
- short
- soft
- purposeful

Recommended:
- 180ms to 300ms micro transitions
- slightly longer section reveal only on first load

Avoid:
- infinite motion
- bouncing
- repeated glowing effects
- layered parallax

## Layout Personality

Use:
- generous spacing
- rounded corners
- strong card rhythm
- clean left alignment

The approval-chain editor should feel breathable.

Because this is a logic-heavy tool, whitespace is part of usability.

## Button Philosophy

Buttons should be calm and obvious.

Recommended button hierarchy:
- primary: dark slate
- secondary: white with border
- destructive: rose
- utility: ghost or outline

The most important CTA should always be:
- either `Save Draft`
- or `Activate Chain`

Never multiple competing primaries.

## Status Treatments

Status must be understandable without relying on color alone.

Every status should include:
- badge color
- label text
- sometimes an icon

Examples:
- Active
- Draft
- Inactive
- Needs Attention

## Visual Pattern Recommendation

Best pattern:
- summary metrics at top
- editorial card list on left
- structured editor on right
- sticky preview card

This gives:
- immediate scanability
- editing confidence
- minimal visual clutter

## What To Avoid

Do not use for this feature:
- rainbow gradients
- moving particle fields
- orbiting effects
- neon borders everywhere
- heavy glassmorphism
- drag-and-drop canvases as the main interaction

These reduce trust in an administrative workflow UI.

## Accessibility Tone

Minimal does not mean low contrast.

Requirements:
- clear focus states
- readable text contrast
- large enough interactive targets
- visible active selection state
- keyboard-friendly step controls

## Final Direction

If implemented well, the feature should feel like:

`Maydan's admin panel grew into a structured workflow console`

not:

`a separate flashy tool dropped into the app`

## Magic UI References

Official Magic UI docs:
- https://magicui.design/docs/components

Recommended components:
- Blur Fade: https://magicui.design/docs/components/blur-fade
- Magic Card: https://magicui.design/docs/components/magic-card
- Animated List: https://magicui.design/docs/components/animated-list
- Number Ticker: https://magicui.design/docs/components/number-ticker
- Bento Grid: https://magicui.design/docs/components/bento-grid
