
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { admins } from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import * as schema from "../shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function main() {
    console.log("Checking DB connection...");
    try {
        const defaultAdminEmail = "admin";
        const PASSWORD = "SM@11223344";

        console.log(`Resetting admin password for '${defaultAdminEmail}' to '${PASSWORD}'...`);

        const [existingAdmin] = await db
            .select()
            .from(admins)
            .where(eq(admins.email, defaultAdminEmail));

        const hashedPassword = await bcrypt.hash(PASSWORD, 10);

        if (existingAdmin) {
            console.log("Admin user found. Updating password...");
            await db
                .update(admins)
                .set({ passwordHash: hashedPassword, isActive: true })
                .where(eq(admins.id, existingAdmin.id));
            console.log("Password updated successfully.");
        } else {
            console.log("Admin user not found. Creating...");
            await db.insert(admins).values({
                email: defaultAdminEmail,
                passwordHash: hashedPassword,
                name: "Super Admin",
                role: "super_admin",
                isActive: true,
            });
            console.log("Admin user created successfully.");
        }

        console.log("Done.");
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await pool.end();
    }
}

main();
