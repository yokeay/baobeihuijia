import * as schema from "./schema";

type DbClient = any;

export { schema };

let platformDb: DbClient | null = null;

export function getPlatform(): "docker" | "cloudflare" | "vercel" {
  return (process.env.PLATFORM as "docker") || "docker";
}

export async function getDb(): Promise<DbClient> {
  if (platformDb) return platformDb;

  const platform = getPlatform();

  if (platform === "vercel") {
    const { getDb: getPgDb } = await import("./adapter-pg");
    platformDb = await getPgDb();
  } else {
    const { getDb: getSqliteDb } = await import("./adapter-sqlite");
    platformDb = getSqliteDb();
  }

  return platformDb;
}

export async function initDb() {
  const platform = getPlatform();

  if (platform === "docker") {
    const Database = (await import("better-sqlite3")).default;
    const path = await import("path");
    const fs = await import("fs");

    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    const dbPath = path.join(dataDir, "baobeihuijia.db");
    const sqlite = new Database(dbPath);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");

    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS cases (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        gender TEXT,
        birth_date TEXT,
        lost_date TEXT NOT NULL,
        lost_province TEXT,
        lost_city TEXT,
        lost_address TEXT,
        height INTEGER,
        feature TEXT,
        photo_urls TEXT NOT NULL,
        source TEXT NOT NULL,
        source_url TEXT,
        source_id TEXT,
        status TEXT DEFAULT 'pending',
        submitter_name TEXT,
        submitter_contact TEXT,
        reviewed_by TEXT,
        reviewed_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        case_id TEXT NOT NULL REFERENCES cases(id),
        author_name TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS admins (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);

    // Create default admin if not exists
    const adminUser = process.env.ADMIN_USERNAME || "admin";
    const adminPass = process.env.ADMIN_PASSWORD || "admin123";
    const bcrypt = await import("bcryptjs");
    const { v4: uuidv4 } = await import("uuid");
    const hash = await bcrypt.hash(adminPass, 10);

    const existing = sqlite
      .prepare("SELECT id FROM admins WHERE username = ?")
      .get(adminUser);
    if (!existing) {
      sqlite
        .prepare("INSERT INTO admins (id, username, password_hash) VALUES (?, ?, ?)")
        .run(uuidv4(), adminUser, hash);
    }

    sqlite.close();
  }
  // For Cloudflare D1, migrations are applied via wrangler CLI
  // For Vercel/Neon, migrations are applied via drizzle-kit push
}
