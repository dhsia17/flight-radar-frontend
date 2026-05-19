import { NextResponse } from "next/server";
import { upsertRoute, deactivateRoute } from "@/lib/db";

interface Params {
  params: { id: string };
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const body = await req.json();
    const id = await upsertRoute({ ...body, id: params.id });
    return NextResponse.json({ id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update route" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await deactivateRoute(params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to deactivate route" }, { status: 500 });
  }
}
