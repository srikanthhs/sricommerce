import { all, one } from "./db";
import type { Category, Product, Review } from "./types";

export function listCategories(): Promise<Category[]> {
  return all<Category>("SELECT * FROM categories ORDER BY id");
}

export function getCategory(slug: string): Promise<Category | undefined> {
  return one<Category>("SELECT * FROM categories WHERE slug = $1", [slug]);
}

// Products with their review summary attached.
const PRODUCTS = `
  SELECT p.*, r.rating_avg, COALESCE(r.rating_count, 0) AS rating_count
  FROM products p
  LEFT JOIN (
    SELECT product_id, ROUND(AVG(rating)::numeric, 1)::float AS rating_avg, COUNT(*)::int AS rating_count
    FROM reviews GROUP BY product_id
  ) r ON r.product_id = p.id`;

export const SORTS = {
  relevance: { label: "Relevance", sql: "p.category_id, p.name" },
  price_asc: { label: "Price: low to high", sql: "p.price, p.name" },
  price_desc: { label: "Price: high to low", sql: "p.price DESC, p.name" },
  discount: { label: "Biggest discount", sql: "(p.mrp - p.price)::float / NULLIF(p.mrp, 0) DESC NULLS LAST, p.name" },
  rating: { label: "Customer rating", sql: "r.rating_avg DESC NULLS LAST, r.rating_count DESC NULLS LAST, p.name" },
} as const;
export type SortKey = keyof typeof SORTS;

export type ProductFilters = {
  categoryId?: number;
  q?: string;
  includeInactive?: boolean;
  sort?: string;
  inStock?: boolean;
  minRating?: number;
  maxPrice?: number;
};

export function listProducts(opts: ProductFilters = {}): Promise<Product[]> {
  const where: string[] = [];
  const params: (string | number)[] = [];
  const add = (clause: string, value: string | number) => {
    params.push(value);
    where.push(clause.replace("?", `$${params.length}`));
  };
  if (!opts.includeInactive) where.push("p.active = 1");
  if (opts.categoryId) add("p.category_id = ?", opts.categoryId);
  if (opts.q) add("p.name ILIKE ?", `%${opts.q}%`);
  if (opts.inStock) where.push("p.stock > 0");
  if (opts.minRating) add("r.rating_avg >= ?", opts.minRating);
  if (opts.maxPrice) add("p.price <= ?", opts.maxPrice);
  const sort = SORTS[(opts.sort as SortKey) in SORTS ? (opts.sort as SortKey) : "relevance"].sql;
  return all<Product>(`${PRODUCTS} ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY ${sort}`, params);
}

// Reads sort/filter choices from the URL (?sort=&instock=1&rating=4&max=100).
export function filtersFromParams(sp: Record<string, string | string[] | undefined>): ProductFilters {
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const rating = Number(get("rating"));
  const max = Number(get("max"));
  return {
    sort: get("sort"),
    inStock: get("instock") === "1",
    minRating: rating >= 1 && rating <= 5 ? rating : undefined,
    maxPrice: max > 0 ? Math.round(max * 100) : undefined,
  };
}

export async function getProduct(id: number): Promise<Product | undefined> {
  if (!Number.isInteger(id)) return undefined;
  return (await all<Product>(`${PRODUCTS} WHERE p.id = $1 AND p.active = 1`, [id]))[0];
}

export function getProducts(ids: number[]): Promise<Product[]> {
  const clean = ids.filter(Number.isInteger);
  if (!clean.length) return Promise.resolve([]);
  return all<Product>(`${PRODUCTS} WHERE p.id = ANY($1::int[])`, [`{${clean.join(",")}}`]);
}

// Same category, best rated first.
export function similarProducts(product: Product, limit = 6): Promise<Product[]> {
  return all<Product>(
    `${PRODUCTS} WHERE p.category_id = $1 AND p.id <> $2 AND p.active = 1 AND p.stock > 0
     ORDER BY r.rating_avg DESC NULLS LAST, p.name LIMIT $3`,
    [product.category_id, product.id, limit],
  );
}

// Products that most often appear in the same orders as this one.
export function boughtTogether(productId: number, limit = 4): Promise<Product[]> {
  return all<Product>(
    `${PRODUCTS}
     JOIN (
       SELECT b.product_id, COUNT(DISTINCT b.order_id) AS n
       FROM order_items a JOIN order_items b ON b.order_id = a.order_id AND b.product_id <> a.product_id
       JOIN orders o ON o.id = a.order_id AND o.status <> 'cancelled'
       WHERE a.product_id = $1
       GROUP BY b.product_id
     ) t ON t.product_id = p.id
     WHERE p.active = 1 AND p.stock > 0
     ORDER BY t.n DESC, p.name LIMIT $2`,
    [productId, limit],
  );
}

export function listReviews(productId: number): Promise<Review[]> {
  // Shoppers are shown by a masked phone number or email name, never in full.
  return all<Review>(
    `SELECT rv.*, COALESCE(u.name,
       CASE WHEN u.phone IS NOT NULL THEN 'Customer ••' || right(u.phone, 4)
            ELSE split_part(u.email, '@', 1) END) AS author
     FROM reviews rv JOIN users u ON u.id = rv.user_id
     WHERE rv.product_id = $1 ORDER BY rv.created_at DESC`,
    [productId],
  );
}

// Only shoppers who have received the product can review it.
export async function canReview(userId: number, productId: number): Promise<boolean> {
  const row = await one<{ ok: number }>(
    `SELECT 1 AS ok FROM orders o JOIN order_items i ON i.order_id = o.id
     WHERE o.user_id = $1 AND i.product_id = $2 AND o.status = 'delivered' LIMIT 1`,
    [userId, productId],
  );
  return !!row;
}

export async function isWishlisted(userId: number, productId: number): Promise<boolean> {
  return !!(await one("SELECT 1 FROM wishlist WHERE user_id = $1 AND product_id = $2", [userId, productId]));
}

export function listWishlist(userId: number): Promise<Product[]> {
  return all<Product>(
    `${PRODUCTS} JOIN wishlist w ON w.product_id = p.id AND w.user_id = $1 WHERE p.active = 1 ORDER BY w.created_at DESC`,
    [userId],
  );
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
