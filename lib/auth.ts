import { NextRequest } from "next/server";

const SECRET_KEY = process.env.DASHBOARD_SECRET_KEY ?? "";

/**
 * Returns true if the request contains the correct secret key.
 * Key can be provided as:
 *   ?key=xxx   (query param)
 *   Cookie: dashboard_key=xxx
 */
export function isAuthorized(req: NextRequest): boolean {
  if (!SECRET_KEY) return true; // dev mode: no key set = open access

  // Check query param
  const paramKey = req.nextUrl.searchParams.get("key");
  if (paramKey && paramKey === SECRET_KEY) return true;

  // Check cookie
  const cookieKey = req.cookies.get("dashboard_key")?.value;
  if (cookieKey && cookieKey === SECRET_KEY) return true;

  return false;
}

/** Check from a plain URL string (for page-level checks) */
export function isAuthorizedFromUrl(searchParams: URLSearchParams): boolean {
  if (!SECRET_KEY) return true;
  const key = searchParams.get("key");
  return key === SECRET_KEY;
}
