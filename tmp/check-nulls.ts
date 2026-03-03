import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function test() {
    try {
        const result = await db.execute(sql`
      SELECT is_active, COUNT(*)
      FROM cars
      GROUP BY is_active;
    `);
        console.log(JSON.stringify(result.rows, null, 2));
    } catch (error) {
        console.error("Query failed:", error);
    } finally {
        process.exit();
    }
}

test();
