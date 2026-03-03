import "dotenv/config";
import { db } from "../server/db";
import { cars } from "../shared/schema";
import { eq, sql } from "drizzle-orm";

async function test() {
    try {
        const activeCount = await db
            .select({ count: sql`count(*)` })
            .from(cars)
            .where(eq(cars.isActive, true));
        console.log("Active cars count:", activeCount[0].count);

        const inactiveCount = await db
            .select({ count: sql`count(*)` })
            .from(cars)
            .where(eq(cars.isActive, false));
        console.log("Inactive cars count:", inactiveCount[0].count);

        const featuredCount = await db
            .select({ count: sql`count(*)` })
            .from(cars)
            .where(eq(cars.isFeatured, true));
        console.log("Featured cars count:", featuredCount[0].count);

    } catch (error) {
        console.error("Query failed:", error);
    } finally {
        process.exit();
    }
}

test();
