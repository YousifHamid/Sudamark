import { db } from "../server/db";
import { notifications, users } from "../shared/schema";
import { sql, eq } from "drizzle-orm";

async function test() {
    try {
        console.log("Testing insert to notifications table...");
        await db.insert(notifications).values({
            title: "Test",
            body: "Test body",
            targetType: "all",
            targetId: null,
            status: "failed"
        });
        console.log("Insert successful!");

        console.log("Testing push tokens retrieval...");
        const allUsers = await db.select({ token: users.pushToken }).from(users).where(sql`${users.pushToken} IS NOT NULL`);
        console.log("Tokens retrieved:", allUsers.length);

        process.exit(0);
    } catch (error) {
        console.error("Test failed:", error);
        process.exit(1);
    }
}

test();
