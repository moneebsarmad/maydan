import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "@/lib/supabase/env";
import { authRoutes, getRouteRedirect } from "@/lib/supabase/route-access";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  if (!isSupabaseConfigured()) {
    return response;
  }

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const unauthenticatedRedirect = getRouteRedirect({
    pathname,
    isAuthenticated: Boolean(user),
  });

  if (!user && unauthenticatedRedirect) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = unauthenticatedRedirect.pathname;
    if (unauthenticatedRedirect.next) {
      redirectUrl.searchParams.set("next", unauthenticatedRedirect.next);
    }
    return NextResponse.redirect(redirectUrl);
  }

  if (user && authRoutes.has(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("role, active")
      .eq("id", user.id)
      .maybeSingle();

    const protectedRedirect = getRouteRedirect({
      pathname,
      isAuthenticated: true,
      userRole: profile?.role,
      userActive: profile?.active,
    });

    if (protectedRedirect) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = protectedRedirect.pathname;
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}
