import { NextResponse } from "next/server";
import { currentUser, isAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function POST(req: Request) {
  if (!isAdmin(await currentUser())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const nums = [b.categoryId, b.price, b.mrp, b.stock].map(Number);
  if (typeof b.name !== "string" || !b.name.trim() || typeof b.unit !== "string" || nums.some((n) => !Number.isInteger(n) || n < 0)) {
    return NextResponse.json({ error: "Name, unit, category, price, MRP and stock are required." }, { status: 400 });
  }
  const db = getDb();
  const { lastInsertRowid } = db
    .prepare("INSERT INTO products (category_id, name, unit, price, mrp, stock, emoji) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(nums[0], b.name.trim(), b.unit.trim(), nums[1], nums[2], nums[3], typeof b.emoji === "string" && b.emoji ? b.emoji : "🛒");
  return NextResponse.json({ product: db.prepare("SELECT * FROM products WHERE id = ?").get(lastInsertRowid) }, { status: 201 });
}
