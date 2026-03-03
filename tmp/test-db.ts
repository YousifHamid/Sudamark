import "dotenv/config";
import { db } from "../server/db";
import { cars } from "../shared/schema";
import { eq, and, desc } from "drizzle-orm";

async function test() {
    try {
        console.log("Testing featured cars query...");
        const result = await db
            .select()
            .from(cars)
            .where(and(eq(cars.isActive, true), eq(cars.isFeatured, true)))
            .orderBy(desc(cars.createdAt))
            .limit(10);
        console.log("Success! Found", result.length, "featured active cars.");
        if (result.length > 0) {
            console.log("First featured car:", result[0].id);
        }

        console.log("Testing all active cars query...");
        const allActive = await db
            .select()
            .from(cars)
            .where(eq(cars.isActive, true))
            .limit(10);
        console.log("Success! Found", allActive.length, "active cars.");

    } catch (error) {
        console.error("DB Query Failed:", error);
    } finally {
        process.exit();
    }
}

test();
