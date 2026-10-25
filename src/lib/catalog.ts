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

export function getProducts(ids: number[]): Promise<Product[]> {
  const clean = ids.filter(Number.isInteger);
  if (!clean.length) return Promise.resolve([]);
  return all<Product>("SELECT * FROM products WHERE id = ANY($1::int[])", [`{${clean.join(",")}}`]);
}

type Zone = { pincode: string; area: string; eta_minutes: number };

// Delivery ETA for pincodes that aren't listed in the zones table.
const DEFAULT_ETA_MINUTES = 30;

// Listed zones keep their own area name and ETA. Every other valid Indian pincode is
// served too, unless ALLOW_ALL_PINCODES=false limits delivery to the zones table.
export async function findZone(pincode: string): Promise<Zone | undefined> {
  if (!/^[1-9]\d{5}$/.test(pincode)) return undefined;
  const zone = await one<Zone>("SELECT * FROM zones WHERE pincode = $1", [pincode]);
  if (zone || process.env.ALLOW_ALL_PINCODES === "false") return zone;
  return { pincode, area: `pincode ${pincode}`, eta_minutes: DEFAULT_ETA_MINUTES };
}
