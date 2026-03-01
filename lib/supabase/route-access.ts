import type { UserRole } from "@/types";

export const authRoutes = new Set(["/login", "/reset-password", "/update-password"]);

interface RouteAccessOptions {
  pathname: string;
  isAuthenticated: boolean;
  userRole?: UserRole | null;
  userActive?: boolean | null;
}

interface RouteRedirectResult {
  pathname: string;
  next?: string;
}

export function getRouteRedirect({
  pathname,
  isAuthenticated,
  userRole,
  userActive,
}: RouteAccessOptions): RouteRedirectResult | null {
  const isProtectedRoute = isProtectedPath(pathname);

  if (!isAuthenticated && isProtectedRoute) {
    return {
      pathname: "/login",
      next: pathname,
    };
  }

  if (isAuthenticated && authRoutes.has(pathname)) {
    return {
      pathname: "/dashboard",
    };
  }

  if (isAuthenticated && isProtectedRoute) {
    if (!userActive) {
      return {
        pathname: "/login",
      };
    }

    if (pathname.startsWith("/admin") && userRole !== "admin") {
      return {
        pathname: "/dashboard",
      };
    }

    if (
      pathname.startsWith("/approvals") &&
      userRole !== "admin" &&
      userRole !== "approver"
    ) {
      return {
        pathname: "/dashboard",
      };
    }
  }

  return null;
}

function isProtectedPath(pathname: string) {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/events") ||
    pathname.startsWith("/approvals") ||
    pathname.startsWith("/calendar") ||
    pathname.startsWith("/admin")
  );
}
