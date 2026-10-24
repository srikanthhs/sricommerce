import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { seedCategories, seedProducts, seedZones } from "./seed";

const DB_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "app.db");

declare global {
  // Reuse one connection across hot reloads in dev.
  var __db: DatabaseSync | undefined;
}

function open(): DatabaseSync {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  plainRows(db);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY, slug TEXT UNIQUE NOT NULL, name TEXT NOT NULL, emoji TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY, category_id INTEGER NOT NULL REFERENCES categories(id),
      name TEXT NOT NULL, unit TEXT NOT NULL, price INTEGER NOT NULL, mrp INTEGER NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0, emoji TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS zones (
      pincode TEXT PRIMARY KEY, area TEXT NOT NULL, eta_minutes INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY, phone TEXT UNIQUE NOT NULL, name TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS otps (
      phone TEXT PRIMARY KEY, code TEXT NOT NULL, expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'placed', address TEXT NOT NULL, pincode TEXT NOT NULL,
      subtotal INTEGER NOT NULL, delivery_fee INTEGER NOT NULL, total INTEGER NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'cod', eta_minutes INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS order_items (
      order_id INTEGER NOT NULL REFERENCES orders(id), product_id INTEGER NOT NULL REFERENCES products(id),
      name TEXT NOT NULL, price INTEGER NOT NULL, qty INTEGER NOT NULL
    );
  `);
  seed(db);
  return db;
}

// node:sqlite returns null-prototype rows, which React refuses to pass to client
// components. Patch prepare() so get()/all() return plain objects.
function plainRows(db: DatabaseSync) {
  const prepare = db.prepare.bind(db);
  db.prepare = (sql: string) => {
    const stmt = prepare(sql);
    type Args = SQLInputValue[];
    const get = stmt.get.bind(stmt) as (...args: Args) => Record<string, unknown> | undefined;
    const all = stmt.all.bind(stmt) as (...args: Args) => Record<string, unknown>[];
    stmt.get = ((...args: Args) => {
      const row = get(...args);
      return row && { ...row };
    }) as typeof stmt.get;
    stmt.all = ((...args: Args) => all(...args).map((row) => ({ ...row }))) as typeof stmt.all;
    return stmt;
  };
}

function seed(db: DatabaseSync) {
  const { n } = db.prepare("SELECT COUNT(*) AS n FROM categories").get() as { n: number };
  if (n > 0) return;
  db.exec("BEGIN");
  const cat = db.prepare("INSERT INTO categories (slug, name, emoji) VALUES (?, ?, ?)");
  for (const c of seedCategories) cat.run(c.slug, c.name, c.emoji);
  const prod = db.prepare(
    "INSERT INTO products (category_id, name, unit, price, mrp, stock, emoji) VALUES ((SELECT id FROM categories WHERE slug = ?), ?, ?, ?, ?, ?, ?)",
  );
  for (const p of seedProducts) prod.run(p.category, p.name, p.unit, p.price, p.mrp, p.stock, p.emoji);
  const zone = db.prepare("INSERT INTO zones (pincode, area, eta_minutes) VALUES (?, ?, ?)");
  for (const z of seedZones) zone.run(z.pincode, z.area, z.eta);
  db.exec("COMMIT");
}

export function getDb(): DatabaseSync {
  globalThis.__db ??= open();
  return globalThis.__db;
}

export function tx<T>(fn: (db: DatabaseSync) => T): T {
  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn(db);
    db.exec("COMMIT");
    return result;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}
