import { all, one } from "./db";
import type { Category, Product } from "./types";

export function listCategories(): Promise<Category[]> {
  return all<Category>("SELECT * FROM categories ORDER BY id");
}

export function getCategory(slug: string): Promise<Category | undefined> {
  return one<Category>("SELECT * FROM categories WHERE slug = $1", [slug]);
}

export function listProducts(opts: { categoryId?: number; q?: string; includeInactive?: boolean } = {}): Promise<Product[]> {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (!opts.includeInactive) where.push("active = 1");
  if (opts.categoryId) {
    params.push(opts.categoryId);
    where.push(`category_id = $${params.length}`);
  }
  if (opts.q) {
    params.push(`%${opts.q}%`);
    where.push(`name ILIKE $${params.length}`);
  }
  const sql = `SELECT * FROM products ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY category_id, name`;
  return all<Product>(sql, params);
}

export function findZone(pincode: string) {
  return one<{ pincode: string; area: string; eta_minutes: number }>("SELECT * FROM zones WHERE pincode = $1", [pincode]);
}
