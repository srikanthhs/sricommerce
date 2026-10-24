import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { listOrders, OrderError, placeOrder, type CartLine } from "@/lib/orders";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  return NextResponse.json({ orders: listOrders(user.id) });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const lines: CartLine[] = Array.isArray(body.items)
    ? body.items.map((i: { productId: unknown; qty: unknown }) => ({ productId: Number(i.productId), qty: Number(i.qty) }))
    : [];
  try {
    const order = placeOrder(user.id, lines, String(body.address ?? ""), String(body.pincode ?? ""));
    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    if (err instanceof OrderError) return NextResponse.json({ error: err.message }, { status: 400 });
    throw err;
  }
}
