import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function test() {
    try {
        const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'cars'
      ORDER BY column_name;
    `);
        const columns = result.rows.map(r => r.column_name as string);
        console.log("Columns in 'cars' table:");
        columns.forEach(c => console.log("- " + c));
        console.log("-------------------");
        console.log("Has 'is_sold'?", columns.includes('is_sold'));
    } catch (error) {
        console.error("Failed to fetch columns:", error);
    } finally {
        process.exit();
    }
}

test();
