import test from "node:test";
import assert from "node:assert/strict";
import { getRouteRedirect } from "../lib/supabase/route-access";

test("submitter cannot access admin routes", () => {
  const redirect = getRouteRedirect({
    pathname: "/admin/users",
    isAuthenticated: true,
    userRole: "submitter",
    userActive: true,
  });

  assert.deepEqual(redirect, {
    pathname: "/dashboard",
  });
});

test("submitter cannot access approvals routes", () => {
  const redirect = getRouteRedirect({
    pathname: "/approvals",
    isAuthenticated: true,
    userRole: "submitter",
    userActive: true,
  });

  assert.deepEqual(redirect, {
    pathname: "/dashboard",
  });
});

test("approver can access approvals routes but not admin routes", () => {
  const approvalsRedirect = getRouteRedirect({
    pathname: "/approvals/123",
    isAuthenticated: true,
    userRole: "approver",
    userActive: true,
  });
  const adminRedirect = getRouteRedirect({
    pathname: "/admin/audit",
    isAuthenticated: true,
    userRole: "approver",
    userActive: true,
  });

  assert.equal(approvalsRedirect, null);
  assert.deepEqual(adminRedirect, {
    pathname: "/dashboard",
  });
});
