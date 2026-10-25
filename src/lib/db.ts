import fs from "node:fs";
import path from "node:path";
import type { Pool as PgPool, PoolClient } from "pg";
import { seedCategories, seedCoupons, seedProducts, seedZones } from "./seed";

// Postgres everywhere. In production DATABASE_URL points at a hosted database (e.g. Neon);
// without it, local dev uses PGlite, an embedded Postgres stored in ./data/pglite.

export type Param = string | number | boolean | null;

export interface Queryable {
  query<T = Record<string, unknown>>(sql: string, params?: Param[]): Promise<{ rows: T[]; rowCount: number }>;
}

interface Driver extends Queryable {
  transaction<T>(fn: (q: Queryable) => Promise<T>): Promise<T>;
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL, emoji TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY, category_id INTEGER NOT NULL REFERENCES categories(id),
    name TEXT NOT NULL, unit TEXT NOT NULL, price INTEGER NOT NULL, mrp INTEGER NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0, emoji TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS zones (
    pincode TEXT PRIMARY KEY, area TEXT NOT NULL, eta_minutes INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY, phone TEXT UNIQUE NOT NULL, name TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
  CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users (email);
  CREATE TABLE IF NOT EXISTS otps (
    phone TEXT PRIMARY KEY, code TEXT NOT NULL, expires_at BIGINT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'placed', address TEXT NOT NULL, pincode TEXT NOT NULL,
    subtotal INTEGER NOT NULL, delivery_fee INTEGER NOT NULL, total INTEGER NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'cod', eta_minutes INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount INTEGER NOT NULL DEFAULT 0;
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
  CREATE TABLE IF NOT EXISTS coupons (
    code TEXT PRIMARY KEY, description TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('percent', 'flat')), value INTEGER NOT NULL,
    min_subtotal INTEGER NOT NULL DEFAULT 0, max_discount INTEGER,
    first_order_only INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS order_items (
    order_id INTEGER NOT NULL REFERENCES orders(id), product_id INTEGER NOT NULL REFERENCES products(id),
    name TEXT NOT NULL, price INTEGER NOT NULL, qty INTEGER NOT NULL
  );
`;

async function pgDriver(url: string): Promise<Driver> {
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: url, max: 5 });
  const wrap = (c: PgPool | PoolClient): Queryable => ({
    async query<T>(sql: string, params?: Param[]) {
      const r = await c.query(sql, params);
      return { rows: r.rows as T[], rowCount: r.rowCount ?? 0 };
    },
  });
  return {
    ...wrap(pool),
    async transaction(fn) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const result = await fn(wrap(client));
        await client.query("COMMIT");
        return result;
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    },
  };
}

async function pgliteDriver(): Promise<Driver> {
  const { PGlite } = await import("@electric-sql/pglite");
  const dir = path.join(process.cwd(), "data", "pglite");
  fs.mkdirSync(dir, { recursive: true });
  const db = await PGlite.create(dir);
  const wrap = (c: Pick<typeof db, "query">): Queryable => ({
    async query<T>(sql: string, params?: Param[]) {
      const r = await c.query<T>(sql, params);
      return { rows: r.rows, rowCount: r.affectedRows ?? r.rows.length };
    },
  });
  return { ...wrap(db), transaction: (fn) => db.transaction((t) => fn(wrap(t))) };
}

async function init(): Promise<Driver> {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  const driver = url ? await pgDriver(url) : await pgliteDriver();
  for (const stmt of SCHEMA.split(";").filter((s) => s.trim())) await driver.query(stmt);
  await seed(driver);
  // Starter coupons. ON CONFLICT keeps any changes made from the admin page.
  for (const c of seedCoupons) {
    await driver.query(
      "INSERT INTO coupons (code, description, kind, value, min_subtotal, max_discount, first_order_only) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (code) DO NOTHING",
      [c.code, c.description, c.kind, c.value, c.minSubtotal, c.maxDiscount, c.firstOrderOnly ? 1 : 0],
    );
  }
  // Early databases were seeded with "(placeholder)" zone names that customers could see.
  await driver.query("UPDATE zones SET area = replace(area, ' (placeholder)', '') WHERE area LIKE '% (placeholder)'");
  return driver;
}

async function seed(db: Driver) {
  await db.transaction(async (q) => {
    // Lock so concurrent cold starts don't seed twice.
    await q.query("LOCK TABLE categories IN EXCLUSIVE MODE");
    const { rows } = await q.query<{ n: number }>("SELECT COUNT(*)::int AS n FROM categories");
    if (rows[0].n > 0) return;
    for (const c of seedCategories) {
      await q.query("INSERT INTO categories (slug, name, emoji) VALUES ($1, $2, $3)", [c.slug, c.name, c.emoji]);
    }
    for (const p of seedProducts) {
      await q.query(
        "INSERT INTO products (category_id, name, unit, price, mrp, stock, emoji) VALUES ((SELECT id FROM categories WHERE slug = $1), $2, $3, $4, $5, $6, $7)",
        [p.category, p.name, p.unit, p.price, p.mrp, p.stock, p.emoji],
      );
    }
    for (const z of seedZones) {
      await q.query("INSERT INTO zones (pincode, area, eta_minutes) VALUES ($1, $2, $3)", [z.pincode, z.area, z.eta]);
    }
  });
}

declare global {
  // Reuse one connection across hot reloads in dev and warm serverless invocations.
  var __db: Promise<Driver> | undefined;
}

function driver(): Promise<Driver> {
  globalThis.__db ??= init().catch((err) => {
    globalThis.__db = undefined;
    throw err;
  });
  return globalThis.__db;
}

export async function all<T>(sql: string, params: Param[] = []): Promise<T[]> {
  return (await (await driver()).query<T>(sql, params)).rows;
}

export async function one<T>(sql: string, params: Param[] = []): Promise<T | undefined> {
  return (await all<T>(sql, params))[0];
}

export async function run(sql: string, params: Param[] = []): Promise<number> {
  return (await (await driver()).query(sql, params)).rowCount;
}

export async function tx<T>(fn: (q: Queryable) => Promise<T>): Promise<T> {
  return (await driver()).transaction(fn);
}
