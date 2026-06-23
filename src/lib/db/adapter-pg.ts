import * as schema from "./schema";

let db: any = null;

export async function getDb(databaseUrl?: string) {
  if (!db) {
    const url = databaseUrl || process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL not set");
    // Dynamic import to avoid static analysis by bundler
    const mod = await (new Function("spec", "return import(spec)") as any)("drizzle-orm/neon-http");
    db = mod.drizzle(url, { schema });
  }
  return db;
}
