import { NextResponse } from "next/server";
import { runMigrations } from "@/lib/db";

// POST /api/migrate — run safe schema migrations (idempotent)
export async function POST() {
  try {
    await runMigrations();
    return NextResponse.json({ ok: true, message: "Migrations applied" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
