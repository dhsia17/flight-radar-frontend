import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { bulkUpdateDates } from "@/lib/db";

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { departureDateFrom, departureDateTo, returnMinDays, returnMaxDays } = body;

    if (!departureDateFrom || !departureDateTo) {
      return NextResponse.json(
        { error: "departureDateFrom and departureDateTo are required" },
        { status: 400 }
      );
    }

    // Validate date format
    const dateRe = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRe.test(departureDateFrom) || !dateRe.test(departureDateTo)) {
      return NextResponse.json({ error: "Dates must be YYYY-MM-DD" }, { status: 400 });
    }

    if (departureDateFrom > departureDateTo) {
      return NextResponse.json(
        { error: "departureDateFrom must be before departureDateTo" },
        { status: 400 }
      );
    }

    const updated = await bulkUpdateDates({
      departureDateFrom,
      departureDateTo,
      returnMinDays: returnMinDays ?? null,
      returnMaxDays: returnMaxDays ?? null,
    });

    return NextResponse.json({ ok: true, updated });
  } catch (e) {
    console.error("[bulk-dates] error:", e);
    return NextResponse.json({ error: "Failed to update dates" }, { status: 500 });
  }
}
