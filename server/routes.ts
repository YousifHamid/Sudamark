import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { db } from "./db";
import { users, cars, serviceProviders, favorites, sliderImages } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.post("/api/auth/send-otp", async (req: Request, res: Response) => {
    try {
      const { phone, countryCode } = req.body;
      if (!phone) {
        return res.status(400).json({ error: "Phone number is required" });
      }
      res.json({ success: true, message: "OTP sent successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to send OTP" });
    }
  });

  app.post("/api/auth/verify-otp", async (req: Request, res: Response) => {
    try {
      const { phone, otp, countryCode } = req.body;
      
      // OTP Verification Mode
      // In production: set OTP_DEMO_MODE=false and implement real OTP service
      // In development/demo: demo code "123456" is accepted
      const isDemoMode = process.env.NODE_ENV !== "production" || process.env.OTP_DEMO_MODE === "true";
      
      let isValidOtp = false;
      if (isDemoMode) {
        // Demo mode: accept hardcoded OTP for testing
        isValidOtp = otp === "123456";
      } else {
        // Production mode: integrate with Twilio/WhatsApp OTP service
        // TODO: Implement real OTP verification with Twilio
        // For now, reject all OTPs in production until service is configured
        return res.status(503).json({ 
          error: "OTP service not configured",
          message: "Please configure OTP_DEMO_MODE=true or integrate Twilio for OTP verification"
        });
      }
      
      if (!isValidOtp) {
        return res.status(400).json({ error: "Invalid OTP" });
      }
      const fullPhone = `${countryCode || "+249"}${phone}`;
      const existingUser = await db.select().from(users).where(eq(users.phone, fullPhone)).limit(1);
      
      if (existingUser.length > 0) {
        return res.json({ user: existingUser[0], isNewUser: false });
      }
      
      res.json({ isNewUser: true, phone: fullPhone });
    } catch (error) {
      res.status(500).json({ error: "Failed to verify OTP" });
    }
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { phone, name, roles, countryCode } = req.body;
      const [newUser] = await db.insert(users).values({
        phone,
        name,
        roles: roles || ["buyer"],
        countryCode: countryCode || "+249",
      }).returning();
      
      res.json({ user: newUser });
    } catch (error) {
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.get("/api/cars", async (_req: Request, res: Response) => {
    try {
      const allCars = await db.select().from(cars).where(eq(cars.isActive, true)).orderBy(desc(cars.createdAt));
      res.json(allCars);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cars" });
    }
  });

  app.get("/api/cars/featured", async (_req: Request, res: Response) => {
    try {
      const featuredCars = await db.select().from(cars).where(and(eq(cars.isActive, true), eq(cars.isFeatured, true))).orderBy(desc(cars.createdAt)).limit(10);
      res.json(featuredCars);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch featured cars" });
    }
  });

  app.get("/api/cars/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const [car] = await db.select().from(cars).where(eq(cars.id, id));
      if (!car) {
        return res.status(404).json({ error: "Car not found" });
      }
      res.json(car);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch car" });
    }
  });

  app.post("/api/cars", async (req: Request, res: Response) => {
    try {
      const carData = req.body;
      const [newCar] = await db.insert(cars).values(carData).returning();
      res.json(newCar);
    } catch (error) {
      res.status(500).json({ error: "Failed to create car listing" });
    }
  });

  app.get("/api/service-providers", async (req: Request, res: Response) => {
    try {
      const { type } = req.query;
      let query = db.select().from(serviceProviders);
      if (type && typeof type === "string") {
        query = query.where(eq(serviceProviders.type, type)) as typeof query;
      }
      const providers = await query.orderBy(desc(serviceProviders.rating));
      res.json(providers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch service providers" });
    }
  });

  app.get("/api/slider-images", async (_req: Request, res: Response) => {
    try {
      const images = await db.select().from(sliderImages).where(eq(sliderImages.isActive, true)).orderBy(sliderImages.order);
      res.json(images);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch slider images" });
    }
  });

  app.get("/api/favorites/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const userFavorites = await db.select().from(favorites).where(eq(favorites.userId, userId));
      res.json(userFavorites);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch favorites" });
    }
  });

  app.post("/api/favorites", async (req: Request, res: Response) => {
    try {
      const { userId, carId } = req.body;
      const [newFavorite] = await db.insert(favorites).values({ userId, carId }).returning();
      res.json(newFavorite);
    } catch (error) {
      res.status(500).json({ error: "Failed to add favorite" });
    }
  });

  app.delete("/api/favorites/:userId/:carId", async (req: Request, res: Response) => {
    try {
      const { userId, carId } = req.params;
      await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.carId, carId)));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove favorite" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
