import { db } from "../server/db";
import { notifications, users } from "../shared/schema";
import { sql, eq, isNotNull } from "drizzle-orm";

async function check() {
    try {
        const notifyCount = await db.select({ count: sql<number>`count(*)` }).from(notifications);
        console.log("Notifications count:", notifyCount[0].count);

        const usersWithTokens = await db.select({ count: sql<number>`count(*)` }).from(users).where(isNotNull(users.pushToken));
        console.log("Users with push tokens:", usersWithTokens[0].count);

        const validTokens = await db.select({ token: users.pushToken }).from(users).where(isNotNull(users.pushToken));
        const validCount = validTokens.filter(t => t.token?.startsWith('ExponentPushToken')).length;
        console.log("ExponentPushTokens count:", validCount);

        process.exit(0);
    } catch (error) {
        console.error("Check failed:", error);
        process.exit(1);
    }
}

check();
