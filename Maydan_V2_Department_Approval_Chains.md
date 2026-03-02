# Maydan V2 Proposal: Admin-Configurable Department Approval Chains

## Goal

Allow Admin to define and maintain approval chains for each department without changing code.

This is a V2 proposal only. It does not change the current V1 routing behavior.

## Why This Exists

In V1, department routing is hardcoded:

- `Department Head -> HS Principal`
- `Department Head -> MS Principal`

That is simple and stable, but it is not flexible.

If BHA Prep later wants:
- different department-specific chains
- extra review steps
- different principal routing behavior
- temporary approver substitutions

then Admin needs a configuration system instead of editing code.

## Recommended Scope

Start with department chains only.

Do not make all entity types fully configurable in the first version of this feature.

Recommended V2 scope:
- HS departments
- MS departments
- department-specific approver order
- optional non-blocking CC recipients
- active/inactive chain versions

Keep these fixed for now:
- clubs
- houses
- athletics
- Facilities Director CC behavior

Reason:
- departments are the clearest real use case
- UI stays understandable
- data model stays smaller
- rollout risk is lower

## Non-Goals

This proposal does not include:
- drag-and-drop workflow builder for every entity type
- arbitrary conditional logic engine
- approval rules based on attendance, facility, or marketing flags
- public workflow editing by non-admins

## Current V1 Behavior

Current router source:
- [approval-router.ts](/Users/MoneebSarmad_1/Desktop/app_ideas/maydan/lib/routing/approval-router.ts)

Current department behavior:
- Step 1: department head from `entities.head_user_id`
- Step 2: principal based on grade level
- Facilities Director is always CC'd separately

## Proposed V2 Behavior

For departments, Admin can define:
- chain name
- department
- school level
- ordered approval steps
- whether a step is blocking or CC-only
- whether the chain is active

When an event is submitted:
1. system checks whether the event entity is a department
2. system looks for an active chain for that department + grade level
3. if found, it uses that configured chain
4. if not found, it falls back to the current V1 default behavior
5. Facilities Director is still CC'd automatically unless explicitly changed in a later version

## Recommended Data Model

### 1. `approval_chain_templates`

One row per configured chain.

Suggested fields:
- `id`
- `name`
- `entity_id`
- `grade_level`
- `active`
- `is_default`
- `created_by`
- `created_at`
- `updated_at`

Purpose:
- represents the overall chain definition for one department / school-level combination

### 2. `approval_chain_template_steps`

One row per step inside a template.

Suggested fields:
- `id`
- `template_id`
- `step_number`
- `step_type`
- `user_id`
- `title_key`
- `is_blocking`
- `label_override`
- `created_at`

`step_type` should be constrained to something simple:
- `specific_user`
- `entity_head`
- `title_lookup`

Purpose:
- allows Admin to choose whether a step points to:
  - a specific named user
  - the current department head
  - a system title like `HS Principal`

### 3. Optional: `approval_chain_template_cc`

Suggested only if CC recipients need to become configurable later.

For an initial V2:
- keep Facilities Director outside the chain and always CC separately
- do not add this table yet unless needed

## Recommended Resolution Rules

At event submission time, each step resolves into a real user ID.

### `entity_head`

Uses:
- `entities.head_user_id`

Good for:
- department head step

### `specific_user`

Uses:
- explicit `user_id`

Good for:
- a permanent dean
- a coordinator
- a named approver that is not tied to department head

### `title_lookup`

Uses:
- lookup by canonical title

Good for:
- `HS Principal`
- `MS Principal`
- `Tarbiyah Director`

## Validation Rules

Admin should not be able to save invalid chains.

Required validation:
- at least 1 blocking step
- no duplicate `step_number`
- blocking steps must be sequential
- all referenced users must be active
- title lookups must resolve to exactly one active user
- entity-head step cannot be saved if the entity has no head assigned
- only one active chain per department + grade level

Recommended validation warning:
- show “current resolved people” before saving

Example:
- Step 1 -> Susan Almasri
- Step 2 -> Leila Kayed
- CC -> Facilities Director

That makes the admin immediately see what the chain will actually do.

## Recommended Admin UX

The easiest admin experience is not a blank builder.

The best first UX is:

### Department Chain Index

Page:
- `Admin -> Approval Chains`

Rows:
- department name
- school level
- current active chain summary
- status
- last updated
- edit button

### Chain Editor

Show:
- department
- school level
- “active chain” badge

Then a simple vertical list of steps:
- Step 1
- Step 2
- Step 3

For each step, admin chooses:
- source type
- specific user or title
- blocking vs CC
- optional custom label

Actions:
- add step
- remove step
- move step up/down
- preview resolved chain
- save draft
- activate chain

### Accessibility / Simplicity Principles

Admin UI should be:
- form-based, not diagram-based
- explicit, not clever
- keyboard-friendly
- readable on laptop width without horizontal drag interactions

Avoid:
- drag-and-drop only interactions
- hidden logic
- workflow canvas builders

## Recommended UX Pattern

Use a “table + editor drawer” or “table + modal” pattern.

Best starting layout:

1. left side: list of department chains
2. right side: selected chain editor

Why:
- admin can compare chains quickly
- editing stays focused
- low cognitive load

## Example

### English Department, HS

Configured chain:
- Step 1: `entity_head`
- Step 2: `specific_user -> Dean of Instruction`
- Step 3: `title_lookup -> HS Principal`

Resolved preview:
- Step 1: Susan Almasri
- Step 2: [specific dean]
- Step 3: Leila Kayed
- CC: Facilities Director

## Fallback Strategy

This feature should not break current routing if configuration is incomplete.

Recommended fallback:
- if no active configured department chain exists, use current V1 department routing
- if configured chain exists but a step cannot resolve, block submission with a clear admin-facing error

Do not silently drop steps.

## Audit / Safety

Every chain change should be traceable.

Recommended:
- record who changed a chain
- record when it changed
- keep inactive previous versions

This matters because approval routing is governance logic, not cosmetic UI.

## Migration Strategy

Recommended rollout path:

1. create new tables
2. seed current department defaults as chain templates
3. keep runtime fallback to V1
4. add admin UI
5. test one department first
6. switch department routing to read configured chains first

That avoids a “big bang” migration.

## Open Questions

These need decisions before implementation:

1. Should chains be different for HS vs MS within the same department?
2. Should Admin be allowed to add more than 3 blocking steps?
3. Should CC recipients ever be configurable, or should Facilities Director remain fixed?
4. Should a chain support temporary substitutes when an approver is absent?
5. Should chain editing be limited to admins only, or should there be a smaller “workflow admin” role later?

## Recommendation

Best V2 direction:
- configurable chains for departments only
- keep current fixed routing as fallback
- use a simple admin editor with ordered steps
- preserve Facilities Director as automatic CC in this first version

That gives real flexibility without turning Maydan into a generic workflow engine too early.
