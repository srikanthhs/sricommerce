import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { canReview } from "@/lib/catalog";
import { one } from "@/lib/db";

// Create or update the shopper's review of a product they have received.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const productId = Number((await ctx.params).id);
  if (!Number.isInteger(productId) || !(await canReview(user.id, productId))) {
    return NextResponse.json({ error: "You can review products after they are delivered to you." }, { status: 403 });
  }
  const b = await req.json().catch(() => ({}));
  const rating = Number(b.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: "Pick 1 to 5 stars." }, { status: 400 });
  const title = typeof b.title === "string" ? b.title.trim().slice(0, 100) : "";
  const body = typeof b.body === "string" ? b.body.trim().slice(0, 2000) : "";
  const review = await one(
    `INSERT INTO reviews (product_id, user_id, rating, title, body) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (product_id, user_id) DO UPDATE SET rating = $3, title = $4, body = $5, created_at = now()
     RETURNING *`,
    [productId, user.id, rating, title, body],
  );
  return NextResponse.json({ review });
}
