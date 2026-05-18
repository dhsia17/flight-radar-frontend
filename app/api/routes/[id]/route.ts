import { NextResponse } from "next/server";
import { getRoute, upsertRoute, deactivateRoute } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const route = await getRoute(params.id);
    if (!route) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ route });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch route" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    await upsertRoute({ ...body, id: params.id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update route" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await deactivateRoute(params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to deactivate route" }, { status: 500 });
  }
}
