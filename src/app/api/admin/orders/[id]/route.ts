import { NextResponse } from "next/server";
import { currentUser, isAdmin } from "@/lib/auth";
import { OrderError, setOrderStatus } from "@/lib/orders";
import type { OrderStatus } from "@/lib/types";

const STATUSES: OrderStatus[] = ["placed", "packed", "out_for_delivery", "delivered", "cancelled"];

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!isAdmin(await currentUser())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { status } = await req.json().catch(() => ({}));
  if (!STATUSES.includes(status)) return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  try {
    return NextResponse.json({ order: await setOrderStatus(Number((await ctx.params).id), status) });
  } catch (err) {
    if (err instanceof OrderError) return NextResponse.json({ error: err.message }, { status: 400 });
    throw err;
  }
}
