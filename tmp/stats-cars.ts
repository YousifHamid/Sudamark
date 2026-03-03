import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function test() {
    try {
        const result = await db.execute(sql`
      SELECT is_active, is_featured, is_sold, count(*) 
      FROM cars 
      GROUP BY is_active, is_featured, is_sold;
    `);
        console.log(JSON.stringify(result.rows, null, 2));
    } catch (error) {
        console.error("Query failed:", error);
    } finally {
        process.exit();
    }
}

test();
