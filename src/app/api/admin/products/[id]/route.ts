import { NextResponse } from "next/server";
import { currentUser, isAdmin } from "@/lib/auth";
import { one } from "@/lib/db";

// Update price (paise), stock, or active flag for a product.
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!isAdmin(await currentUser())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const id = Number((await ctx.params).id);
  const sets: string[] = [];
  const params: number[] = [];
  for (const key of ["price", "mrp", "stock", "active"] as const) {
    if (body[key] === undefined) continue;
    const v = Number(body[key]);
    if (!Number.isInteger(v) || v < 0) return NextResponse.json({ error: `Invalid ${key}.` }, { status: 400 });
    params.push(key === "active" ? (v ? 1 : 0) : v);
    sets.push(`${key} = $${params.length}`);
  }
  if (!sets.length) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  const product = await one(`UPDATE products SET ${sets.join(", ")} WHERE id = $${params.length + 1} RETURNING *`, [...params, id]);
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  return NextResponse.json({ product });
}
