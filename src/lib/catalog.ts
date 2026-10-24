import { getDb } from "./db";
import type { Category, Product } from "./types";

export function listCategories(): Category[] {
  return getDb().prepare("SELECT * FROM categories ORDER BY id").all() as Category[];
}

export function getCategory(slug: string): Category | undefined {
  return getDb().prepare("SELECT * FROM categories WHERE slug = ?").get(slug) as Category | undefined;
}

export function listProducts(opts: { categoryId?: number; q?: string; includeInactive?: boolean } = {}): Product[] {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (!opts.includeInactive) where.push("active = 1");
  if (opts.categoryId) {
    where.push("category_id = ?");
    params.push(opts.categoryId);
  }
  if (opts.q) {
    where.push("name LIKE ?");
    params.push(`%${opts.q}%`);
  }
  const sql = `SELECT * FROM products ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY category_id, name`;
  return getDb().prepare(sql).all(...params) as Product[];
}

export function findZone(pincode: string) {
  return getDb().prepare("SELECT * FROM zones WHERE pincode = ?").get(pincode) as
    | { pincode: string; area: string; eta_minutes: number }
    | undefined;
}
