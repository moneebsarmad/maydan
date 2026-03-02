# Maydan V2 Wireframe: Department Approval Chains

## Purpose

This document translates the V2 approval-chain proposal into a practical admin screen layout.

It is intentionally low-fidelity.

Focus:
- information hierarchy
- editing flow
- preview flow
- admin clarity

## Primary Route

- `/admin/approval-chains`

## Screen Structure

The screen should have four visible layers:

1. Page header
2. Summary strip
3. Chain list
4. Editor + preview workspace

## Wireframe

```text
+----------------------------------------------------------------------------------+
| Department Approval Chains                                                       |
| Manage department-specific approval flows without changing code.                 |
| [Concept mode]                                                [Create Chain]     |
+----------------------------------------------------------------------------------+

+-------------------+ +-------------------+ +-------------------+ +-------------------+
| Active Chains     | | Custom Routing    | | Needs Attention   | | Last Updated      |
| 12                | | 8 departments     | | 2 unresolved      | | Today             |
+-------------------+ +-------------------+ +-------------------+ +-------------------+

+----------------------------------+ +--------------------------------------------------------------+
| Chain List                       | | Chain Editor                                                 |
|                                  | |                                                              |
| Search [.................]       | | Chain Metadata                                               |
| Level [All] Status [All]         | | Name [ English Department / HS ]                            |
|                                  | | Department [ English Department ] Level [ HS ]              |
| [English Department | Active ]   | | Status [ Active ]                                           |
| Dept Head -> HS Dean -> Principal| |                                                              |
| Updated 2h ago                   | | Approval Steps                                               |
|                                  | | [Step 1] Department Head                                    |
| [Arabic Department  | Active ]   | | [source type] [entity head] [blocking] [move up/down]       |
| Dept Head -> HS Principal        | |                                                              |
| Updated yesterday                | | [Step 2] HS Dean                                            |
|                                  | | [source type] [specific user] [blocking]                    |
| [MS Quran Dept     | Draft  ]    | |                                                              |
| Dept Head -> ? -> MS Principal   | | [Step 3] HS Principal                                       |
| Updated 3d ago                   | | [source type] [title lookup] [blocking]                    |
|                                  | |                                                              |
| [Add chain]                      | | [Add step]                                                  |
|                                  | |                                                              |
+----------------------------------+ +------------------------------+-------------------------------+
                                      | Resolved Preview             | Validation                    |
                                      | Step 1 -> Susan Almasri      | [ok] entity head resolves     |
                                      | Step 2 -> Alya Hasan         | [ok] HS Principal resolves    |
                                      | Step 3 -> Leila Kayed        | [warn] duplicate approver     |
                                      | CC -> Facilities Director    | [ok] chain ready to activate  |
                                      +------------------------------+-------------------------------+

                                      [Save Draft] [Preview] [Activate Chain]
```

## Section Breakdown

## 1. Header

Contents:
- title
- short description
- concept/draft badge if not live
- primary action

Rules:
- title must explain the feature immediately
- only one primary CTA
- no dense helper copy here

## 2. Summary Strip

Purpose:
- quick health signal
- immediate admin orientation

Recommended cards:
- Active chains
- Departments using custom routing
- Chains needing attention
- Recently updated

## 3. Chain List

Purpose:
- browsing
- selecting
- comparing

Each list item should show:
- department
- level
- short chain summary
- status
- last updated

States:
- active
- draft
- inactive
- needs attention

This list should not be a dense table first.

Recommendation:
- card list on desktop
- stacked list on smaller widths

## 4. Editor Workspace

Split into two halves:
- configuration
- live preview

This is the most important decision in the whole wireframe.

Admin should always see:
- what they are editing
- what it resolves to

at the same time

## Editor Subsections

### Metadata card

Fields:
- chain name
- department
- school level
- status

Optional:
- `Use as active chain`
- `Save as draft`

### Steps card

Each step should be visually separated.

Per step:
- step number
- source type
- target input
- blocking / cc state
- label override
- move controls
- delete control

Do not hide critical configuration inside accordions initially.

### Footer actions

Actions:
- Save Draft
- Preview Resolved Chain
- Activate Chain

Destructive or status-changing actions should sit at the bottom, not in the top-right corner.

## Preview Subsections

### Resolved chain

Show the actual resolved people:
- Step 1 -> user
- Step 2 -> user
- Step 3 -> user
- CC -> user

This must be human-readable at a glance.

### Validation panel

Show:
- passed checks
- warnings
- blockers

Use plain language:
- `Department head is not assigned`
- `HS Principal resolved correctly`
- `Step 2 uses an inactive user`

### Fallback panel

Show:
- what V1 fixed routing would be if this chain were disabled

This gives confidence during rollout.

## Mobile Behavior

This is an admin tool, so desktop is primary.

Still required:
- stack list above editor on tablet/mobile
- move preview below editor
- preserve all controls without horizontal drag

Order on mobile:
1. header
2. summary
3. list
4. metadata
5. steps
6. preview
7. actions

## Interaction Notes

Do not start with drag-and-drop.

Preferred controls:
- `Move up`
- `Move down`
- `Duplicate`
- `Delete`

Why:
- more accessible
- easier to test
- more stable

## Best MVP of This UI

If this were being built tomorrow, the most practical first version is:

- left: department chain list
- right top: metadata + editable steps
- right bottom: resolved preview + validation

That is enough for a trustworthy admin workflow editor.
