# Maydan RBAC Test Credentials

## Purpose

This document lists the current shared Maydan credentials for role-based access testing in the live environment.

Production URL:
- `https://maydan-six.vercel.app`

## Admin Accounts

| Role | Name | Email | Password | Notes |
| --- | --- | --- | --- | --- |
| Admin | Moneeb Sarmad | `moneeb.sarmad@bhaprep.org` | `MaydanAdmin!2026` | Full admin access |
| Admin | Sundus Khan | `sundus.khan@bhaprep.org` | `MaydanAdmin2!2026` | Full admin access; title remains `PR Staff` so marketing notifications still target this account |

## Demo RBAC Accounts

| Role | Name | Email | Password | Entity | Notes |
| --- | --- | --- | --- | --- | --- |
| Staff | Maydan Demo Staff | `maydan.demo.staff@bhaprep.org` | `MaydanStaff!2026` | `TED Talk Club` | Can submit events |
| Approver | Maydan Demo Approver | `maydan.demo.approver@bhaprep.org` | `MaydanApprover!2026` | `TED Talk Club` | Set as `TED Talk Club` adviser so submitted demo club events route here first |
| Approver | Maydan Demo HS Principal | `maydan.demo.hsprincipal@bhaprep.org` | `MaydanHSPrincipal!2026` | — | HS-principal-style demo access without using the real `HS Principal` title, so live routing stays pointed at the real principal |
| Viewer | Maydan Demo Viewer | `maydan.demo.viewer@bhaprep.org` | `MaydanViewer!2026` | — | Read-only viewer access |

## Recommended Testing Use

### Admin

Use to test:
- `/admin/*`
- `/dashboard`
- `/approvals`
- audit and configuration access

### Staff

Use to test:
- `/events`
- `/events/new`
- submitter-only access
- redirect away from `/approvals`
- redirect away from `/admin`

### Approver

Use to test:
- `/approvals`
- step-action UI
- approver-only queue access
- redirect away from `/admin`

### Viewer

Use to test:
- read-only dashboard/calendar/events visibility
- no submitter or approver privileges

## Notes

- Sundus Khan now has `admin` role access in Maydan.
- Sundus Khan still keeps the `PR Staff` title so marketing-request notifications continue to resolve correctly.
- The demo staff and demo approver accounts are intentionally paired on `TED Talk Club` for live workflow testing.
- If these passwords are changed later, update this file immediately.
