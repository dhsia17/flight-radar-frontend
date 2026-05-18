import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthorized } from "./lib/auth";

export function middleware(req: NextRequest) {
  // Only protect the dashboard and API routes
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/dashboard") && !pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (!isAuthorized(req)) {
    // Redirect to home with 401 hint
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("error", "unauthorized");
    return NextResponse.redirect(url);
  }

  // If authorized via query param, set a cookie so they don't need to re-pass it
  const paramKey = req.nextUrl.searchParams.get("key");
  const res = NextResponse.next();
  if (paramKey) {
    res.cookies.set("dashboard_key", paramKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }
  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
