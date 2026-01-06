import * as dotenv from "dotenv";
dotenv.config();

import { db } from "../server/db";
import {
    cars,
    buyerOffers,
    inspectionRequests,
    favorites,
    payments,
    couponUsages
} from "@shared/schema";
import { sql } from "drizzle-orm";

async function cleanCars() {
    console.log("Starting database cleanup for cars...");

    try {
        // Delete dependent records first to satisfy foreign keys
        console.log("Deleting buyer offers...");
        await db.delete(buyerOffers);

        console.log("Deleting inspection requests...");
        await db.delete(inspectionRequests);

        console.log("Deleting favorites...");
        await db.delete(favorites);

        console.log("Deleting payments...");
        await db.delete(payments);

        console.log("Deleting coupon usages...");
        await db.delete(couponUsages);

        // Finally delete cars
        console.log("Deleting cars...");
        await db.delete(cars);

        console.log("✅ Cleanup complete! All car-related data has been removed.");
    } catch (error) {
        console.error("❌ Error converting image:", error);
    } finally {
        process.exit(0);
    }
}

cleanCars();
