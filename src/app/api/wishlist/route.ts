import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { run } from "@/lib/db";

async function parse(req: Request) {
  const user = await currentUser();
  const { productId } = await req.json().catch(() => ({}));
  return { user, productId: Number(productId) };
}

export async function POST(req: Request) {
  const { user, productId } = await parse(req);
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  if (!Number.isInteger(productId)) return NextResponse.json({ error: "Invalid product." }, { status: 400 });
  await run(
    "INSERT INTO wishlist (user_id, product_id) SELECT $1, id FROM products WHERE id = $2 ON CONFLICT DO NOTHING",
    [user.id, productId],
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { user, productId } = await parse(req);
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  await run("DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2", [user.id, productId]);
  return NextResponse.json({ ok: true });
}
