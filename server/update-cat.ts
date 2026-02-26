import * as dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import { db } from './db';
import { serviceCategories } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function logCats() {
    const cats = await db.select().from(serviceCategories);
    console.log("Existing categories:", JSON.stringify(cats, null, 2));

    for (const cat of cats) {
        if (cat.key === 'inspection' || cat.key === 'inspectionCenter') {
            console.log("Updating category", cat.key);
            await db.update(serviceCategories)
                .set({ nameAr: 'مركز فحص', nameEn: 'Inspection Center' })
                .where(eq(serviceCategories.key, cat.key));
        }
    }

    const newCats = await db.select().from(serviceCategories);
    console.log("New categories:", JSON.stringify(newCats, null, 2));
    process.exit(0);
}
logCats().catch(console.error);
