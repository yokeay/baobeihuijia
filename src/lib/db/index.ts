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
  } else if (platform === "docker") {
    const { getDb: getLocalPgDb } = await import("./adapter-local-pg");
    platformDb = getLocalPgDb();
  } else {
    const { getDb: getSqliteDb } = await import("./adapter-sqlite");
    platformDb = getSqliteDb();
  }

  return platformDb;
}

export async function initDb() {
  const platform = getPlatform();

  if (platform === "docker") {
    const { getPool } = await import("./adapter-local-pg");
    const pool = getPool();

    await pool.query(`
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
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        case_id TEXT NOT NULL REFERENCES cases(id),
        author_name TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS admins (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT now()
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

    const { rows } = await pool.query(
      "SELECT id FROM admins WHERE username = $1",
      [adminUser]
    );
    if (rows.length === 0) {
      await pool.query(
        "INSERT INTO admins (id, username, password_hash) VALUES ($1, $2, $3)",
        [uuidv4(), adminUser, hash]
      );
    }
  }
  // For Cloudflare D1, migrations are applied via wrangler CLI
  // For Vercel/Neon, migrations are applied via drizzle-kit push
}
