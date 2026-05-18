import { NextResponse } from "next/server";
import { getAllRoutes, upsertRoute } from "@/lib/db";

export async function GET() {
  try {
    const routes = await getAllRoutes();
    return NextResponse.json({ routes });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch routes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = await upsertRoute(body);
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create route" }, { status: 500 });
  }
}
