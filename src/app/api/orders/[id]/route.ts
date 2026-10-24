import { NextResponse } from "next/server";
import { currentUser, isAdmin } from "@/lib/auth";
import { getOrder, OrderError, setOrderStatus } from "@/lib/orders";

type Ctx = { params: Promise<{ id: string }> };

async function load(ctx: Ctx) {
  const user = await currentUser();
  const found = getOrder(Number((await ctx.params).id));
  if (!user || !found || (found.order.user_id !== user.id && !isAdmin(user))) return null;
  return found;
}

export async function GET(_req: Request, ctx: Ctx) {
  const found = await load(ctx);
  if (!found) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  return NextResponse.json(found);
}

// Customers can cancel an order until it is packed.
export async function DELETE(_req: Request, ctx: Ctx) {
  const found = await load(ctx);
  if (!found) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (found.order.status !== "placed") {
    return NextResponse.json({ error: "This order can no longer be cancelled." }, { status: 400 });
  }
  try {
    return NextResponse.json({ order: setOrderStatus(found.order.id, "cancelled") });
  } catch (err) {
    if (err instanceof OrderError) return NextResponse.json({ error: err.message }, { status: 400 });
    throw err;
  }
}
