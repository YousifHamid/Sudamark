import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}
try {
  const dbUrl = new URL(process.env.DATABASE_URL);
  console.log("[DB] Connecting to host:", dbUrl.hostname);
} catch (e) {
  console.log("[DB] DATABASE_URL is not a valid URL or is malformed:", process.env.DATABASE_URL.substring(0, 20) + "...");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);
